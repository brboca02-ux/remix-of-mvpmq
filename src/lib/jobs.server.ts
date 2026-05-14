// @ts-nocheck
 import { supabaseAdmin } from "../integrations/supabase/client.server";
 import { logger } from "@/lib/logger";
 import type { JobMetadata } from "@/types/jobs";
 
 const LOVABLE_JOBS_DEBUG = process.env.LOVABLE_JOBS_DEBUG === "1";
 
 function debugLog(message: string, ...args: unknown[]) {
   if (LOVABLE_JOBS_DEBUG) {
     logger.debug(message, { args });
   }
 }
import { Database } from "../integrations/supabase/types";

export type Job = Database["public"]["Tables"]["jobs"]["Row"];
 export type JobStatus = "queued" | "running" | "done" | "failed" | "queued_external" | "cancelled";
 export async function internalCancelJob(jobId: string) {
   const { data: job } = await supabaseAdmin
     .from("jobs")
     .select("*")
     .eq("id", jobId)
     .single();
 
   if (!job) throw new Error("Job não encontrado.");
   if (["done", "failed", "cancelled"].includes(job.status)) {
     throw new Error("Job já finalizado ou cancelado.");
   }
 
   const updateData: Partial<Job> = { 
     status: "cancelled", 
     cancel_requested: true,
     cancelled_at: new Date().toISOString(),
     finished_at: new Date().toISOString()
   };
 
   const { data, error } = await supabaseAdmin
     .from("jobs")
     .update(updateData)
     .eq("id", jobId)
     .select()
     .single();
 
   if (error) throw error;
 
   await internalAppendJobEvent({
     jobId,
     eventType: "job_cancelled",
     level: "warn",
     message: `Job cancelado manualmente.`,
   });
 
   return data;
 }

const MAX_PAYLOAD_SIZE = 32 * 1024; // 32KB
const MAX_METADATA_SIZE = 4 * 1024; // 4KB

function truncate<T>(obj: T, maxSize: number): T | { _truncated: true; _original_size: number; [key: string]: unknown } {
  const str = JSON.stringify(obj);
  if (str.length <= maxSize) return obj;
  return { _truncated: true, _original_size: str.length, ...JSON.parse(str.substring(0, maxSize / 2)) };
}

export async function internalEnqueueJob({
  tipo,
  payload,
  idempotencyKey,
  maxAttempts = 1,
  ownerUserId = null,
}: {
  tipo: string;
  payload: Record<string, unknown>;
  idempotencyKey: string;
  maxAttempts?: number;
  ownerUserId?: string | null;
}) {
  const truncatedPayload = truncate(payload, MAX_PAYLOAD_SIZE);

  const { data: existingJob } = await supabaseAdmin
    .from("jobs")
    .select("*")
    .eq("idempotency_key", idempotencyKey)
    .single();

  if (existingJob) return existingJob;

  const { data, error } = await supabaseAdmin
    .from("jobs")
    .insert({
      tipo,
      payload: truncatedPayload,
      idempotency_key: idempotencyKey,
      status: "queued",
      max_attempts: maxAttempts,
      owner_user_id: ownerUserId,
    })
    .select()
    .single();

  if (error) throw error;

  await internalAppendJobEvent({
    jobId: data.id,
    eventType: "job_created",
    level: "info",
    message: `Job ${tipo} criado.`,
  });

  return data;
}

export async function internalUpdateJobStatus({
  jobId,
  status,
  result,
  error,
}: {
  jobId: string;
  status: JobStatus;
  result?: Record<string, unknown>;
  error?: string;
}) {
  // Guard: nunca sobrescrever um job já cancelado/finalizado com novo status
  const { data: current } = await supabaseAdmin
    .from("jobs")
    .select("status, cancel_requested")
    .eq("id", jobId)
    .single();

  if (current?.status === "cancelled" || current?.cancel_requested) {
    await internalAppendJobEvent({
      jobId,
      eventType: "job_update_ignored",
      level: "warn",
      message: `Tentativa de atualizar para "${status}" ignorada — job já cancelado.`,
    });
    return current;
  }

  if (current && ["done", "failed"].includes(current.status) && status !== current.status) {
    await internalAppendJobEvent({
      jobId,
      eventType: "job_update_ignored",
      level: "warn",
      message: `Tentativa de atualizar para "${status}" ignorada — job já finalizado (${current.status}).`,
    });
    return current;
  }

  const updateData: Partial<Job> = { status, updated_at: new Date().toISOString() };
  if (result !== undefined) updateData.result = truncate(result, MAX_PAYLOAD_SIZE) as typeof updateData.result;
  if (error !== undefined) updateData.error = error;

  if (status === "running") updateData.started_at = new Date().toISOString();
  if (["done", "failed"].includes(status)) updateData.finished_at = new Date().toISOString();

  const { data, error: dbError } = await supabaseAdmin
    .from("jobs")
    .update(updateData)
    .eq("id", jobId)
    .select()
    .single();

   if (dbError) {
     debugLog(`Erro ao atualizar status do job ${jobId}:`, dbError);
     throw dbError;
   }

  const eventType = status === "running" ? "job_started" : 
                    status === "done" ? "job_completed" : 
                    status === "failed" ? "job_failed" : "job_step_changed";

  await internalAppendJobEvent({
    jobId,
    eventType,
    level: status === "failed" ? "error" : "info",
    message: `Status alterado para ${status}${error ? ': ' + error : ''}`,
  });

  return data;
}

export async function internalAppendJobEvent({
  jobId,
  eventType,
  level,
  message,
  metadata,
}: {
  jobId: string;
  eventType: string;
  level: "info" | "warn" | "error";
  message: string;
  metadata?: JobMetadata;
}) {
  const truncatedMetadata = metadata ? truncate(metadata, MAX_METADATA_SIZE) : {};

  const { error } = await supabaseAdmin
    .from("job_events")
    .insert({
      job_id: jobId,
      event_type: eventType,
      level,
      message,
      metadata: truncatedMetadata,
    });

   if (error) {
     debugLog("Erro ao salvar job event:", error);
     if (LOVABLE_JOBS_DEBUG) {
       logger.error('Critical error saving job event to database', error);
     }
   }
}

export async function internalRetryJob(jobId: string) {
  const { data: job } = await supabaseAdmin
    .from("jobs")
    .select("*")
    .eq("id", jobId)
    .single();

  if (!job) throw new Error("Job não encontrado.");
  if (!["failed", "queued_external"].includes(job.status)) {
    throw new Error("Somente jobs falhos ou aguardando reprocessamento podem ser reiniciados.");
  }

  const attempts = job.attempts ?? 0;

  const { data, error } = await supabaseAdmin
    .from("jobs")
    .update({
      status: "queued",
      attempts: attempts + 1,
      error: null,
      started_at: null,
      finished_at: null,
    })
    .eq("id", jobId)
    .select()
    .single();

  if (error) throw error;

  await internalAppendJobEvent({
    jobId,
    eventType: "job_retry_scheduled",
    level: "info",
    message: `Job reiniciado manualmente. Tentativa #${(data.attempts ?? 0) + 1}`,
  });

  return data;
}
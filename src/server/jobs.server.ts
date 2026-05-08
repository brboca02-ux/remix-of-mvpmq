import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { Database } from "@/integrations/supabase/types";

export type Job = Database["public"]["Tables"]["jobs"]["Row"];
export type JobStatus = "queued" | "running" | "done" | "failed" | "queued_external";

const MAX_PAYLOAD_SIZE = 32 * 1024; // 32KB
const MAX_METADATA_SIZE = 4 * 1024; // 4KB

function truncate(obj: any, maxSize: number): any {
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
  payload: any;
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
    } as any)
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
  result?: any;
  error?: string;
}) {
  const updateData: any = { status, updated_at: new Date().toISOString() };
  if (result !== undefined) updateData.result = truncate(result, MAX_PAYLOAD_SIZE);
  if (error !== undefined) updateData.error = error;

  if (status === "running") updateData.started_at = new Date().toISOString();
  if (["done", "failed"].includes(status)) updateData.finished_at = new Date().toISOString();

  const { data, error: dbError } = await supabaseAdmin
    .from("jobs")
    .update(updateData)
    .eq("id", jobId)
    .select()
    .single();

  if (dbError) throw dbError;

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
  metadata?: any;
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
    } as any);

  if (error) console.error("Erro ao salvar job event:", error);
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
    } as any)
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

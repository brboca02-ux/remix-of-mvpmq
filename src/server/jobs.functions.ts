 import { createServerFn } from "@tanstack/react-start";
import { 
  internalEnqueueJob, 
  internalUpdateJobStatus, 
  internalAppendJobEvent, 
   internalRetryJob,
   internalCancelJob
} from "./jobs.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";

const DEV_USER_ID = "00000000-0000-0000-0000-000000000000";

export const enqueueJob = createServerFn({ method: "POST" })
  // Removido requireSupabaseAuth para modo dev/single-user
  .inputValidator(z.object({
    tipo: z.string(),
    payload: z.any(),
    idempotencyKey: z.string(),
    maxAttempts: z.number().optional(),
  }))
  .handler(async ({ data }) => {
    return internalEnqueueJob({
      ...data,
      ownerUserId: DEV_USER_ID,
    });
  });

export const getJob = createServerFn({ method: "GET" })
  // Removido requireSupabaseAuth para modo dev/single-user
  .inputValidator(z.object({
    jobId: z.string().uuid(),
  }))
  .handler(async ({ data }) => {
    const { data: job, error } = await supabaseAdmin
      .from("jobs")
      .select("*, job_events(*)")
      .eq("id", data.jobId)
      .single();

    if (error) throw error;
    return job;
  });

export const listJobs = createServerFn({ method: "GET" })
  // Removido requireSupabaseAuth para modo dev/single-user
  .inputValidator(z.object({
    status: z.string().optional(),
    tipo: z.string().optional(),
    limit: z.number().default(20),
    cursor: z.string().optional(),
  }))
  .handler(async ({ data }) => {
    let query = supabaseAdmin
      .from("jobs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(data.limit);

    if (data.status) query = query.eq("status", data.status);
    if (data.tipo) query = query.eq("tipo", data.tipo);
    if (data.cursor) query = query.lt("created_at", data.cursor);

    const { data: jobs, error } = await query;
    if (error) {
      console.error("Erro ao listar jobs:", error);
      return [];
    }
    return jobs ?? [];
  });

export const updateJobStatus = createServerFn({ method: "POST" })
  // Removido requireSupabaseAuth para modo dev/single-user
  .inputValidator(z.object({
    jobId: z.string().uuid(),
    status: z.enum(["queued", "running", "done", "failed", "queued_external", "cancelled"]),
    result: z.any().optional(),
    error: z.string().optional(),
  }))
  .handler(async ({ data }) => {
    return internalUpdateJobStatus(data);
  });

export const appendJobEvent = createServerFn({ method: "POST" })
  // Removido requireSupabaseAuth para modo dev/single-user
  .inputValidator(z.object({
    jobId: z.string().uuid(),
    eventType: z.string(),
    level: z.enum(["info", "warn", "error"]),
    message: z.string(),
    metadata: z.any().optional(),
  }))
  .handler(async ({ data }) => {
    return internalAppendJobEvent(data);
  });

export const retryJob = createServerFn({ method: "POST" })
  // Removido requireSupabaseAuth para modo dev/single-user
  .inputValidator(z.object({
    jobId: z.string().uuid(),
  }))
  .handler(async ({ data }) => {
    return internalRetryJob(data.jobId);
  });
 
 export const cancelJob = createServerFn({ method: "POST" })
   .inputValidator(z.object({
     jobId: z.string().uuid(),
   }))
   .handler(async ({ data }) => {
     return internalCancelJob(data.jobId);
   });
 
 export const listActiveJobs = createServerFn({ method: "GET" })
   .handler(async () => {
     const { data, error } = await supabaseAdmin
       .from("jobs")
       .select("*")
       .in("status", ["queued", "running", "queued_external"])
       .order("created_at", { ascending: false })
       .limit(50);
 
     if (error) {
       console.error("Erro ao listar jobs ativos:", error);
       return [];
     }
     return data || [];
   });

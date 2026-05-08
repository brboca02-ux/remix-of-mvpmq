import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { 
  internalEnqueueJob, 
  internalUpdateJobStatus, 
  internalAppendJobEvent, 
  internalRetryJob 
} from "./jobs.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";

export const enqueueJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({
    tipo: z.string(),
    payload: z.any(),
    idempotencyKey: z.string(),
    maxAttempts: z.number().optional(),
  }))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    return internalEnqueueJob({
      ...data,
      ownerUserId: userId,
    });
  });

export const getJob = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({
    jobId: z.string().uuid(),
  }))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: job, error } = await supabaseAdmin
      .from("jobs")
      .select("*, job_events(*)")
      .eq("id", data.jobId)
      // .eq("owner_user_id", userId) // Removido para suportar single-user sem owner rigoroso por enquanto
      .single();

    if (error) throw error;
    return job;
  });

export const listJobs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({
    status: z.string().optional(),
    tipo: z.string().optional(),
    limit: z.number().default(20),
    cursor: z.string().optional(),
  }))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    let query = supabaseAdmin
      .from("jobs")
      .select("*")
      // .eq("owner_user_id", userId)
      .order("created_at", { ascending: false })
      .limit(data.limit);

    if (data.status) query = query.eq("status", data.status);
    if (data.tipo) query = query.eq("tipo", data.tipo);
    if (data.cursor) query = query.lt("created_at", data.cursor);

    const { data: jobs, error } = await query;
    if (error) throw error;
    return jobs;
  });

export const updateJobStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({
    jobId: z.string().uuid(),
    status: z.enum(["queued", "running", "done", "failed", "queued_external"]),
    result: z.any().optional(),
    error: z.string().optional(),
  }))
  .handler(async ({ data }) => {
    return internalUpdateJobStatus(data);
  });

export const appendJobEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
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
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({
    jobId: z.string().uuid(),
  }))
  .handler(async ({ data }) => {
    return internalRetryJob(data.jobId);
  });

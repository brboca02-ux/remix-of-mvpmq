 import { createServerFn } from "@tanstack/react-start";
import { 
  internalEnqueueJob, 
  internalUpdateJobStatus, 
  internalAppendJobEvent, 
   internalRetryJob,
   internalCancelJob
} from "./jobs.server";
 import { supabaseAdmin } from "@/integrations/supabase/client.server";
 import { logger } from "@/lib/logger";
 import { handleServerError, ErrorCodes, AppError, validateDatabaseResponse } from "@/lib/error-handler";
 
 const LOVABLE_JOBS_DEBUG = process.env.LOVABLE_JOBS_DEBUG === "1";
 
 function debugLog(message: string, ...args: any[]): void {
   if (LOVABLE_JOBS_DEBUG) {
     logger.debug(message, { args });
   }
 }
import { z } from "zod";

const DEV_USER_ID = "00000000-0000-0000-0000-000000000000";

export const enqueueJob = createServerFn({ method: "POST" })
  // Removido requireSupabaseAuth para modo dev/single-user
  .inputValidator(z.object({
    tipo: z.string().min(1, "Tipo do job é obrigatório"),
    payload: z.any(),
    idempotencyKey: z.string().min(1, "Chave de idempotência é obrigatória"),
    maxAttempts: z.number().optional(),
  }))
  .handler(async ({ data }) => {
    try {
      const result = await internalEnqueueJob({
        ...data,
        ownerUserId: DEV_USER_ID,
      });

      logger.info('Job enqueued successfully', {
        jobId: result.id,
        tipo: data.tipo,
        idempotencyKey: data.idempotencyKey
      });

      return result;
    } catch (error) {
      logger.error('Failed to enqueue job', error as Error, {
        tipo: data.tipo,
        idempotencyKey: data.idempotencyKey
      });
      throw new AppError(
        ErrorCodes.DATABASE_ERROR,
        "Erro ao criar job. Tente novamente.",
        { error: (error as Error).message }
      );
    }
  });

export const getJob = createServerFn({ method: "GET" })
  // Removido requireSupabaseAuth para modo dev/single-user
  .inputValidator(z.object({
    jobId: z.string().uuid("ID do job inválido"),
  }))
  .handler(async ({ data }) => {
    try {
      const { data: job, error } = await supabaseAdmin
        .from("jobs")
        .select("*, job_events(*)")
        .eq("id", data.jobId)
        .single();

      if (error) {
        logger.error('Failed to get job', error, { jobId: data.jobId });
        throw new AppError(
          ErrorCodes.DATABASE_ERROR,
          "Erro ao buscar job.",
          { jobId: data.jobId, error: error.message }
        );
      }

      if (!job) {
        throw new AppError(
          ErrorCodes.NOT_FOUND,
          "Job não encontrado.",
          { jobId: data.jobId },
          404
        );
      }

      return job;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Unexpected error getting job', error as Error, { jobId: data.jobId });
      throw new AppError(
        ErrorCodes.INTERNAL_ERROR,
        "Erro inesperado ao buscar job.",
        { error: (error as Error).message }
      );
    }
  });

export const listJobs = createServerFn({ method: "GET" })
  // Removido requireSupabaseAuth para modo dev/single-user
  .inputValidator(z.object({
    status: z.string().optional(),
    tipo: z.string().optional(),
    limit: z.number().min(1).max(100).default(20),
    cursor: z.string().optional(),
  }))
  .handler(async ({ data }) => {
    try {
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
        debugLog("Erro ao listar jobs:", error);
        logger.error('Failed to list jobs', error, { 
          status: data.status,
          tipo: data.tipo 
        });
        return [];
      }

      return jobs ?? [];
    } catch (error) {
      logger.error('Unexpected error listing jobs', error as Error);
      return [];
    }
  });

export const updateJobStatus = createServerFn({ method: "POST" })
  // Removido requireSupabaseAuth para modo dev/single-user
  .inputValidator(z.object({
    jobId: z.string().uuid("ID do job inválido"),
    status: z.enum(["queued", "running", "done", "failed", "queued_external", "cancelled"]),
    result: z.any().optional(),
    error: z.string().optional(),
  }))
  .handler(async ({ data }) => {
    try {
      const result = await internalUpdateJobStatus(data);
      
      logger.info('Job status updated', {
        jobId: data.jobId,
        status: data.status
      });

      return result;
    } catch (error) {
      logger.error('Failed to update job status', error as Error, {
        jobId: data.jobId,
        status: data.status
      });
      throw new AppError(
        ErrorCodes.DATABASE_ERROR,
        "Erro ao atualizar status do job.",
        { error: (error as Error).message }
      );
    }
  });

export const appendJobEvent = createServerFn({ method: "POST" })
  // Removido requireSupabaseAuth para modo dev/single-user
  .inputValidator(z.object({
    jobId: z.string().uuid("ID do job inválido"),
    eventType: z.string().min(1, "Tipo do evento é obrigatório"),
    level: z.enum(["info", "warn", "error"]),
    message: z.string().min(1, "Mensagem é obrigatória"),
    metadata: z.any().optional(),
  }))
  .handler(async ({ data }) => {
    try {
      const result = await internalAppendJobEvent(data);
      
      debugLog('Job event appended', data.jobId, data.eventType);

      return result;
    } catch (error) {
      logger.error('Failed to append job event', error as Error, {
        jobId: data.jobId,
        eventType: data.eventType
      });
      throw new AppError(
        ErrorCodes.DATABASE_ERROR,
        "Erro ao registrar evento do job.",
        { error: (error as Error).message }
      );
    }
  });

export const retryJob = createServerFn({ method: "POST" })
  // Removido requireSupabaseAuth para modo dev/single-user
  .inputValidator(z.object({
    jobId: z.string().uuid("ID do job inválido"),
  }))
  .handler(async ({ data }) => {
    try {
      const result = await internalRetryJob(data.jobId);
      
      logger.info('Job retry initiated', { jobId: data.jobId });

      return result;
    } catch (error) {
      logger.error('Failed to retry job', error as Error, { jobId: data.jobId });
      throw new AppError(
        ErrorCodes.DATABASE_ERROR,
        "Erro ao retentar job.",
        { error: (error as Error).message }
      );
    }
  });
 
 export const cancelJob = createServerFn({ method: "POST" })
   .inputValidator(z.object({
     jobId: z.string().uuid("ID do job inválido"),
   }))
   .handler(async ({ data }) => {
     try {
       const result = await internalCancelJob(data.jobId);
       
       logger.info('Job cancelled', { jobId: data.jobId });

       return result;
     } catch (error) {
       logger.error('Failed to cancel job', error as Error, { jobId: data.jobId });
       throw new AppError(
         ErrorCodes.DATABASE_ERROR,
         "Erro ao cancelar job.",
         { error: (error as Error).message }
       );
     }
   });
 
 export const listActiveJobs = createServerFn({ method: "GET" })
   .handler(async () => {
     try {
       const { data, error } = await supabaseAdmin
         .from("jobs")
         .select("*")
         .in("status", ["queued", "running", "queued_external"])
         .order("created_at", { ascending: false })
         .limit(50);
 
       if (error) {
         debugLog("Erro ao listar jobs ativos:", error);
         logger.error('Failed to list active jobs', error);
         return [];
       }

       return data || [];
     } catch (error) {
       logger.error('Unexpected error listing active jobs', error as Error);
       return [];
     }
   });

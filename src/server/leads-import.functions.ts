// @ts-nocheck
 import { createServerFn } from "@tanstack/react-start";
 import { internalEnqueueJob, internalUpdateJobStatus } from "./jobs.server";
import { getSupabase, normalizeLead, Logger, type StandardLead } from "./leads-core";
import { processCnpjEnrichment } from "./leads-cnpj-enrichment";
import { parseUniversalCsv } from "./leads-parser";
import { logger } from "@/lib/logger";
import type { ImportError, JobSourceStats, FollowupHistoryItem, HealthCheck } from "@/types/database";
import type { LeadUpdate } from "@/modules/crm/types";
import type { JobStatus } from "@/types/jobs";

export const startImportJob = createServerFn({ method: "POST" })
// ... keep existing code
  .inputValidator((input: { filename: string; total_rows: number; mode?: "fast" | "smart"; sample_rate?: number; }) => input)
  .handler(async ({ data }) => {
    const supabase = getSupabase();
    const DEV_USER_ID = "00000000-0000-0000-0000-000000000000";
    
    const { data: job, error } = await supabase.from("lead_import_jobs").insert({
      filename: data.filename,
      total_rows: data.total_rows,
      status: "pending",
      mode: data.mode || "fast",
      sample_rate: data.sample_rate || 100.0,
      user_id: DEV_USER_ID,
      started_at: new Date().toISOString()
    }).select().single();

     if (error) {
       logger.error('Failed to start import job', error);
       throw new Error("Falha ao iniciar processamento.");
     }
 
     // Mirror to the new jobs system
     const mirrorIdKey = `import_${job.id}`;
     await internalEnqueueJob({
       tipo: "lead_import",
       payload: data,
       idempotencyKey: mirrorIdKey,
       ownerUserId: DEV_USER_ID
     });
     
     await supabase.from("job_events").insert({
       job_id: job.id,
       event_type: "info",
       message: `Iniciando job: ${data.filename}`,
       metadata: { sample_rate: data.sample_rate }
     });
     return { job_id: job.id };
  });

export const processImportJobChunk = createServerFn({ method: "POST" })
  .inputValidator((input: { job_id: string; leads: StandardLead[]; chunk_index: number; is_sampling?: boolean; }) => input)
  .handler(async ({ data }) => {
    const supabase = getSupabase();
    const now = new Date().toISOString();
    let successCount = 0, failedCount = 0, duplicateCount = 0;
    const errors: Array<{ job_id: string; error_message: string; raw_payload: Record<string, unknown> }> = [];
    const sourceStats: Record<string, number> = {};

    const { data: job } = await supabase.from("lead_import_jobs").select("*").eq("id", data.job_id).single();

    const CHUNK_SIZE_LIMIT = 20; // Reduzido para evitar timeouts de rede
    for (let i = 0; i < data.leads.length; i += CHUNK_SIZE_LIMIT) {
      const currentLeads = data.leads.slice(i, i + CHUNK_SIZE_LIMIT);
      
      // Batch upsert leads para maior performance e menos requests
      const { data: upserted, error: upsertError } = await supabase.from("leads_import").upsert(
        currentLeads.map(lead => ({
          ...lead,
          raw: { ...(lead.raw || {}), job_id: data.job_id }
        })), 
        { onConflict: "identity_hash", ignoreDuplicates: false }
      ).select("id, created_at, identity_hash, source, confidence_score");

      if (upsertError) {
        logger.error('Batch upsert failed', upsertError, { batchSize: currentLeads.length });
        failedCount += currentLeads.length;
        upsertError.message && errors.push({ 
          job_id: data.job_id, 
          error_message: upsertError.message, 
          raw_payload: { count: currentLeads.length } 
        });
        continue;
      }

      for (const res of upserted) {
          const isNew = new Date(res.created_at).getTime() > Date.now() - 5000;
          if (isNew) {
            successCount++;
            // Registrar origem inicial
            await supabase.from("lead_data_sources").insert({
              lead_id: res.id,
              field_name: "all",
              source_name: res.source || "manual",
              confidence_score: res.confidence_score || 0.5
            });

            // Disparar enriquecimento de CNPJ em background se disponível
            if (res.identity_hash?.startsWith("cnpj:")) {
              const cnpj = res.identity_hash.split(":")[1];
              // Não aguardamos para não travar o loop de importação
              processCnpjEnrichment(res.id, cnpj).catch(e => logger.error('CNPJ enrichment failed', e as Error, { leadId: res.id, cnpj }));
            }
          } else {
          duplicateCount++;
          // Log de deduplicação amostral (primeiros 10 por chunk)
          if (duplicateCount < 10) { 
            await supabase.from("lead_dedupe_audit").insert({
              job_id: data.job_id,
              user_id: (job?.user_id as string) || "00000000-0000-0000-0000-000000000000",
              original_lead_id: res.id,
              lead_identifier: res.identity_hash || "N/A",
              reason: "duplicate_identity_hash",
              confidence_score: 1.0,
              similarity_score: 1.0,
              action_taken: 'skipped',
              normalized_values: { identity_hash: res.identity_hash },
              incoming_data: {}
            });
          }
        }
        const src = res.source || "unknown";
        sourceStats[src] = (sourceStats[src] || 0) + 1;
      }
    }
    if (errors.length > 0) await supabase.from("lead_import_errors").insert(errors);

     if (job) {
       const isFinished = ((job.processed_rows || 0) + data.leads.length) >= (job.total_rows || 0) || data.is_sampling;
       const currentStats = (job.source_stats as JobSourceStats) || {};
       for (const [s, c] of Object.entries(sourceStats)) currentStats[s] = (currentStats[s] || 0) + c;
 
         const newStatus = isFinished ? (failedCount > 0 && successCount === 0 ? "failed" : (failedCount > 0 ? "partial" : "completed")) : "processing";
         
         await supabase.from("lead_import_jobs").update({
           processed_rows: (job.processed_rows || 0) + data.leads.length,
           success_rows: (job.success_rows || 0) + successCount,
           failed_rows: (job.failed_rows || 0) + failedCount,
           duplicate_rows: (job.duplicate_rows || 0) + duplicateCount,
           status: newStatus,
           source_stats: currentStats,
           finished_at: isFinished ? now : null,
           last_heartbeat: now
         }).eq("id", data.job_id);
 
         // Update the mirror job
         const mirrorJobId = `import_${data.job_id}`;
         const { data: mirrorJob } = await getSupabase().from("jobs").select("id").eq("idempotency_key", mirrorJobId).maybeSingle();
         if (mirrorJob) {
           const statusMap: Record<string, JobStatus> = { processing: "running", completed: "done", failed: "failed", partial: "done" };
           await internalUpdateJobStatus({
             jobId: mirrorJob.id,
             status: statusMap[newStatus] || "running",
             result: isFinished ? { successCount, failedCount, duplicateCount, sourceStats: currentStats } : undefined,
             error: newStatus === "failed" ? "Importação falhou ou não processou nenhum lead novo." : undefined
           });
         }
     }
    return { success: true };
  });

export const getImportJobStatus = createServerFn({ method: "GET" })
  .inputValidator((input: { job_id: string }) => input)
  .handler(async ({ data }) => {
    const { data: job, error } = await getSupabase().from("lead_import_jobs").select("*").eq("id", data.job_id).single();
    if (error) throw new Error("Job não encontrado.");
    return job;
  });

export const getActiveImportJobs = createServerFn({ method: "GET" })
  .handler(async () => {
    try {
      // Busca jobs ativos ou finalizados na última hora (para auditoria)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { data: jobs, error } = await getSupabase().from("lead_import_jobs")
        .select("*")
        .or(`status.in.(pending,processing),finished_at.gt.${oneHourAgo}`)
        .order("created_at", { ascending: false });
      
      if (error) {
        Logger.warn("Erro ao buscar jobs ativos de importação:", error);
        return [];
      }
      return jobs || [];
    } catch (e) {
      Logger.error("Falha crítica em getActiveImportJobs:", e);
      return [];
    }
  });

export const importLeadsCsv = createServerFn({ method: "POST" })
  .inputValidator((input: { csv: string; nicho?: string }) => input)
  .handler(async ({ data }) => {
    return { leads: parseUniversalCsv(data.csv, data.nicho) };
  });

/**
 * Add a single lead manually to Supabase
 * Used by: ProspectingPage manual add, CRM manual add
 */
export const addLeadManual = createServerFn({ method: "POST" })
  .inputValidator((input: {
    nome: string;
    telefone?: string;
    email?: string;
    cidade?: string;
    uf?: string;
    nicho?: string;
    site?: string;
    instagram_handle?: string;
    atividade?: string;
    source?: string;
  }) => input)
  .handler(async ({ data }) => {
    const supabase = getSupabase();
    
    // Generate identity hash for deduplication
    const hashBase = `manual:${(data.nome || '').toLowerCase().trim()}:${(data.cidade || '').toLowerCase().trim()}`;
    const identity_hash = `manual:${hashBase.replace(/[^a-z0-9]/g, '')}`;
    
    const leadRow = {
      nome: data.nome,
      telefone: data.telefone || null,
      email: data.email || null,
      cidade: data.cidade || null,
      uf: data.uf || null,
      nicho: data.nicho || 'geral',
      site: data.site || null,
      instagram_handle: data.instagram_handle || null,
      atividade: data.atividade || null,
      source: data.source || 'manual',
      status: 'Novo',
      confidence_score: 0.5,
      identity_hash,
    };
    
    const { data: inserted, error } = await supabase
      .from('leads_import')
      .upsert(leadRow, { onConflict: 'identity_hash', ignoreDuplicates: false })
      .select('id, nome, cidade')
      .single();
    
    if (error) {
      logger.error('Failed to add manual lead', error);
      return { success: false, error: error.message };
    }
    
    logger.info('Manual lead added to Supabase', { id: inserted.id, nome: inserted.nome });
    return { success: true, lead: inserted };
  });

export const generateJobReport = createServerFn({ method: "POST" })
  .inputValidator((input: { job_id: string }) => input)
  .handler(async ({ data }) => {
    const supabase = getSupabase();
    const { data: job } = await supabase.from("lead_import_jobs").select("*").eq("id", data.job_id).single();
    if (!job) throw new Error("Job não encontrado");
    
    const insights = [
      `Taxa de sucesso: ${(((job.success_rows || 0) / (job.total_rows || 1)) * 100).toFixed(1)}%`,
      `Sobreposição de base: ${(((job.duplicate_rows || 0) / (job.total_rows || 1)) * 100).toFixed(1)}%`
    ];
    
    if ((job.failed_rows || 0) > 0) insights.push(`Detectados ${job.failed_rows} erros. Verificar logs de auditoria.`);

    const reportData = { 
      job_id: data.job_id, 
      user_id: job.user_id, 
      summary: { 
        total: job.total_rows, 
        success: job.success_rows, 
        duplicates: job.duplicate_rows, 
        failed: job.failed_rows,
        quality_score: (job.success_rows || 0) / (job.total_rows || 1)
      }, 
      insights 
    };
    
    const { data: report } = await supabase.from("lead_job_reports").upsert(reportData, { onConflict: "job_id" }).select().single();
    return report;
  });

export const listImportedLeads = createServerFn({ method: "GET" })
  .inputValidator((input: { 
    cidade?: string; 
    uf?: string; 
    nicho?: string; 
    jobId?: string; 
    page?: number; 
    pageSize?: number;
    contactStatus?: string[];
    isDiscarded?: boolean;
  }) => input)
  .handler(async ({ data }) => {
    const supabase = getSupabase();
    const page = data.page || 1, pageSize = data.pageSize || 20;
    const from = (page - 1) * pageSize, to = from + pageSize - 1;
    let q = supabase.from("leads_import").select("*", { count: "exact" }).range(from, to).order("created_at", { ascending: false });
    
    if (data.cidade) q = q.ilike("cidade", `%${data.cidade}%`);
    if (data.uf) q = q.eq("uf", data.uf);
    if (data.nicho) q = q.eq("nicho", data.nicho);
    if (data.jobId) {
      q = q.filter("raw->>job_id", "eq", data.jobId);
    }
    if (data.contactStatus && data.contactStatus.length > 0) {
      q = q.in("followup_status", data.contactStatus);
    }
    if (data.isDiscarded !== undefined) {
      q = q.eq("is_discarded", data.isDiscarded);
    } else {
      q = q.eq("is_discarded", false); // Default hide discarded
    }
    
    const { data: rows, count } = await q;
    return { rows: (rows || []).map(r => ({ ...r, score: r.confidence_score })), total: count || 0, page, pageSize };
  });

export const updateLeadOperation = createServerFn({ method: "POST" })
  .inputValidator((input: { 
    lead_id: string; 
    updates: {
      followup_status?: string;
      last_contact_at?: string;
      next_followup_at?: string;
      interest_level?: string;
      contact_notes?: string;
      follow_up_step?: number;
      is_discarded?: boolean;
      discard_reason?: string;
      lead_operation_status?: string;
      followup_history_item?: Partial<FollowupHistoryItem>;
      interaction_outcome?: string;
    }
  }) => input)
  .handler(async ({ data }) => {
    const supabase = getSupabase();
    const id = data.lead_id.startsWith("lead_") ? data.lead_id.substring(5) : data.lead_id;
    const DEV_USER_ID = "00000000-0000-0000-0000-000000000000";
    
    const { data: lead } = await supabase.from("leads_import").select("followup_history, niche, confidence_score").eq("id", id).single();
    
    const updates: LeadUpdate = { ...data.updates };
    delete (updates as Record<string, unknown>).followup_history_item;
    
    if (data.updates.followup_history_item) {
      const history = (lead?.followup_history as FollowupHistoryItem[]) || [];
      const historyId = crypto.randomUUID();
      const newItem = { ...data.updates.followup_history_item, id: historyId };
      (updates as Record<string, unknown>).followup_history = [...history, newItem];

      // Learning logic if outcome is present
      if (data.updates.interaction_outcome) {
          await supabase.from("winner_messages").insert({
            user_id: DEV_USER_ID,
            message_content: newItem.message || '',
            channel: newItem.channel || 'Desconhecido',
            niche: lead?.niche || 'Geral',
            lead_score: lead?.confidence_score || 0,
            outcome: data.updates.interaction_outcome,
            trigger_used: newItem.style || 'Nenhum'
          });
      }
    }
    
    const { error } = await supabase.from("leads_import").update(updates).eq("id", id);
    if (error) throw error;
    return { success: true };
  });


export const processEnrichmentQueue = createServerFn({ method: "POST" })
  .inputValidator((input: { limit?: number; job_id?: string }) => input)
  .handler(async ({ data }) => {
    const supabase = getSupabase();
    const { data: queueItems } = await supabase.from("lead_enrichment_queue").select("*, leads_import(*)").eq("status", "pending").limit(data.limit || 5);
    if (!queueItems) return { processed: 0 };
    for (const item of queueItems) {
      await supabase.from("leads_import").update({ last_enriched_at: new Date().toISOString() }).eq("id", (item as Record<string, unknown>).lead_id as string);
      await supabase.from("lead_enrichment_queue").update({ status: "completed" }).eq("id", item.id);
    }
    return { success: true, processed: queueItems.length };
  });

export const checkImportHealth = createServerFn({ method: "GET" })
  .handler(async () => {
    const supabase = getSupabase();
    const now = new Date();
    const checks: HealthCheck[] = [];
    
    const { data: stuckJobs } = await supabase.from("lead_import_jobs")
      .select("id")
      .eq("status", "processing")
      .lt("last_heartbeat", new Date(now.getTime() - 10 * 60000).toISOString());
    
    const jobsStatus = (stuckJobs?.length || 0) > 0 ? "degraded" : "healthy";
    checks.push({ 
      name: "jobs", 
      status: jobsStatus, 
      details: { stuck_count: stuckJobs?.length || 0 },
      timestamp: now.toISOString()
    });

    const { count: recentErrors } = await supabase.from("lead_import_errors")
      .select("*", { count: "exact", head: true })
      .gt("created_at", new Date(now.getTime() - 30 * 60000).toISOString());
    
    const errorsStatus = (recentErrors || 0) > 50 ? "unhealthy" : (recentErrors || 0) > 10 ? "degraded" : "healthy";
    checks.push({ 
      name: "public_api", 
      status: errorsStatus, 
      details: { error_count: recentErrors || 0 },
      timestamp: now.toISOString()
    });

    for (const check of checks) {
      await supabase.from("system_health_status").upsert({
        component: check.name,
        status: check.status,
        metrics: check.details,
        last_check: now.toISOString()
      }, { onConflict: 'component' });
    }

    return { checks, overall: checks.some(c => c.status === 'unhealthy') ? 'unhealthy' : checks.some(c => c.status === 'degraded') ? 'degraded' : 'healthy' };
  });

export const getDedupeAudit = createServerFn({ method: "GET" })
  .inputValidator((input: { job_id: string }) => input)
  .handler(async ({ data }) => {
    const { data: audit } = await getSupabase().from("lead_dedupe_audit")
      .select("*, leads_import!lead_dedupe_audit_original_lead_id_fkey(*)")
      .eq("job_id", data.job_id);
    return audit || [];
  });

export const resolveDedupeConflict = createServerFn({ method: "POST" })
  .inputValidator((input: { audit_id: string; action: 'merged' | 'inserted_override' }) => input)
  .handler(async ({ data }) => {
    const supabase = getSupabase();
    const { data: audit } = await supabase.from("lead_dedupe_audit").select("*").eq("id", data.audit_id).single();
    if (!audit) throw new Error("Auditoria não encontrada");

    await supabase.from("lead_dedupe_audit").update({
      action_taken: data.action,
      reviewed_at: new Date().toISOString()
    }).eq("id", data.audit_id);

    return { success: true };
  });

export const getBuscadorMetrics = createServerFn({ method: "POST" })
  .inputValidator((input: { 
    cidades?: string[]; 
    estados?: string[]; 
    cnae_codes?: string[]; 
    portes?: string[]; 
    fontes?: string[]; 
    search_text?: string;
    job_id?: string;
  }) => input)
  .handler(async ({ data }) => {
    const fallbackMetrics = {
      total: 0,
      potencial_mensal: 0,
      qualidade_score: 0,
      distribuicao_porte: {},
      distribuicao_estado: {},
      updated_at: new Date().toISOString(),
    };

    try {
      // Timeout de 10s para evitar travamento da UI
      const rpcPromise = getSupabase().rpc('get_buscador_metrics', {
        p_cidades: data.cidades?.length ? data.cidades : undefined,
        p_estados: data.estados?.length ? data.estados : undefined,
        p_cnae_codes: data.cnae_codes?.length ? data.cnae_codes : undefined,
        p_portes: data.portes?.length ? data.portes : undefined,
        p_fontes: data.fontes?.length ? data.fontes : undefined,
        p_search_text: data.search_text?.trim() || undefined,
        p_job_id: data.job_id || undefined
      });

      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error("RPC Timeout")), 10000)
      );

      const result = await Promise.race([rpcPromise, timeoutPromise]);
      const { data: metrics, error } = result as { data: typeof fallbackMetrics | null; error: unknown };

      if (error) {
        logger.error('Failed to fetch metrics via RPC', error);
        return fallbackMetrics;
      }

      return metrics || fallbackMetrics;
    } catch (e) {
      logger.error('Critical error fetching metrics', e as Error);
      return fallbackMetrics;
    }
  });

export const getLeadDataSources = createServerFn({ method: "GET" })
  .inputValidator((input: { lead_id: string }) => input)
  .handler(async ({ data }) => {
    const { data: sources } = await getSupabase()
      .from("lead_data_sources")
      .select("*")
      .eq("lead_id", data.lead_id);
    return sources || [];
  });

export const recoverStuckJobs = createServerFn({ method: "POST" })
  .handler(async () => {
    try {
      await getSupabase().rpc("recover_stuck_import_jobs");
    } catch (e) {
      Logger.warn("Erro ao tentar recuperar jobs travados:", e);
    }
    return { success: true };
  });

export const checkExistingLeads = createServerFn({ method: "POST" })
  .inputValidator((input: { hashes: string[] }) => input)
  .handler(async ({ data }) => {
    if (!data.hashes.length) return { existingCount: 0 };
    const { count } = await getSupabase()
      .from("leads_import")
      .select("*", { count: "exact", head: true })
      .in("identity_hash", data.hashes);
    return { existingCount: count || 0 };
  });
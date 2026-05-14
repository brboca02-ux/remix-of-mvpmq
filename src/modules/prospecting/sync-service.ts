import { supabase } from "@/integrations/supabase/client";
import { ProspectLead } from "./types";
import { toast } from "sonner";
import { AuditLog } from "@/hooks/useAuditStore";
import { logger } from "@/lib/logger";

/**
 * Service to handle synchronization between local state and Supabase backend.
 * 
 * Syncs lead changes to the `leads_import` table (the real source of truth).
 * This ensures that status changes, notes, and updates made in the CRM/Prospecting
 * modules are persisted to the database.
 */
export const syncLeadToBackend = async (lead: ProspectLead): Promise<boolean> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    
    if (!user) {
      logger.warn('Lead sync skipped - user not authenticated');
      return false;
    }
    
    // Sync to leads_import table (the real table that exists in schema)
    const { error } = await supabase
      .from('leads_import')
      .upsert({
        id: lead.id,
        nome: lead.companyName,
        nicho: lead.niche,
        cidade: lead.city,
        bairro: lead.neighborhood || '',
        telefone: lead.whatsapp || '',
        email: lead.email || '',
        site: lead.websiteUrl || '',
        instagram_handle: lead.instagramHandle || '',
        cnpj: lead.cnpj || '',
        cnae_principal: lead.cnae || '',
        data_abertura: lead.openingDate || '',
        socios: lead.partners || [],
        porte: lead.size || '',
        status: lead.status_sefaz || lead.status || '',
        source: lead.source || 'manual',
        confidence_score: (lead.opportunityScore || 0) / 100,
        atividade: lead.diagnosis || '',
      } as never, { onConflict: 'id' });

    if (error) {
      logger.warn('Lead sync to leads_import failed', { error: error.message, leadId: lead.id });
      return false;
    }

    logger.debug('Lead synced to backend', { leadId: lead.id, status: lead.status });
    return true;
  } catch (err) {
    logger.error('Error syncing lead to backend', err as Error, { leadId: lead.id });
    return false;
  }
};

/**
 * Sync audit log to backend
 */
export const syncAuditLogToBackend = async (log: AuditLog) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    
    if (!user) return false;

    const { error } = await (supabase as any)
      .from('prospect_audit_logs')
      .insert({
        lead_id: log.leadId,
        user_id: user.id,
        action: log.action,
        source: log.source,
        changes: log.changes,
        message: log.message,
        timestamp: new Date(log.timestamp).toISOString()
      });

    if (error) {
      logger.warn('Audit log sync failed', { error });
      return false;
    }

    return true;
  } catch (err) {
    logger.error('Error syncing audit log to backend', err as Error);
    return false;
  }
};

/**
 * Sync all leads and logs from local storage to backend
 */
export const syncAllLeadsToBackend = async (leads: ProspectLead[], auditLogs?: AuditLog[]) => {
  if (!leads.length && !auditLogs?.length) return;
  
  const toastId = toast.loading("Sincronizando dados com a nuvem...");
  
  let successCount = 0;
  for (const lead of leads) {
    const success = await syncLeadToBackend(lead);
    if (success) successCount++;
  }

  if (auditLogs) {
      for (const log of auditLogs) {
          await syncAuditLogToBackend(log);
      }
  }

  if (successCount === leads.length) {
    toast.success("Todos os dados sincronizados!", { id: toastId });
  } else {
    toast.warning(`${successCount} de ${leads.length} leads sincronizados.`, { id: toastId });
  }
};

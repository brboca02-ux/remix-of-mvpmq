import { supabase } from "@/integrations/supabase/client";
import { ProspectLead } from "./types";
import { toast } from "sonner";
import { AuditLog } from "@/hooks/useAuditStore";

/**
 * Service to handle synchronization between local state and Supabase backend
 */
export const syncLeadToBackend = async (lead: ProspectLead) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    
    if (!user) {
        console.warn("User not authenticated, skipping lead sync.");
        return false;
    }
    
    const { error } = await (supabase as any)
      .from('prospect_leads')
      .upsert({
        id: lead.id,
        user_id: user.id,
        company_name: lead.companyName,
        niche: lead.niche,
        city: lead.city,
        status: lead.status,
        opportunity_score: lead.opportunityScore,
        opportunity_level: lead.opportunityLevel,
        diagnosis: lead.diagnosis,
        source: lead.source,
        raw_data: lead,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

    if (error) {
      console.warn("Lead sync failed:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Error in syncLeadToBackend:", err);
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
      console.warn("Audit sync failed:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Error in syncAuditLogToBackend:", err);
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

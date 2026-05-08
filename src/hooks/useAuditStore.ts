import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Company } from "@/lib/company-types";
import { supabase } from "@/integrations/supabase/client";

export type AuditAction = "add" | "update" | "upsert" | "delete";
export type AuditSource = "manual" | "import" | "social" | "system";

export interface AuditChange {
  field: string;
  before: any;
  after: any;
}

export interface AuditLog {
  id: string;
  action: AuditAction;
  leadId: string;
  leadName?: string;
  timestamp: number;
  changes: AuditChange[];
  source: AuditSource;
  message?: string;
}

interface AuditStore {
  auditLogs: AuditLog[];
  addAuditLog: (log: Omit<AuditLog, "id" | "timestamp">) => void;
  clearLogs: () => void;
}

export const useAuditStore = create<AuditStore>()(
  persist(
    (set) => ({
      auditLogs: [],
      addAuditLog: (log) =>
        set((state) => {
          const newLog: AuditLog = {
            ...log,
            id: `audit_${Math.random().toString(36).slice(2)}_${Date.now()}`,
            timestamp: Date.now(),
          };

          // Try to sync with Supabase backend
          const syncAuditToSupabase = async (audit: AuditLog) => {
            try {
              const { data: { session } } = await supabase.auth.getSession();
              const user = session?.user;
              if (!user) return;

              await (supabase as any).from('prospect_audit_logs').insert({
                lead_id: audit.leadId,
                user_id: user.id,
                action: audit.action,
                source: audit.source,
                changes: audit.changes,
                message: audit.message,
                timestamp: new Date(audit.timestamp).toISOString()
              });
            } catch (err) {
              console.warn("Failed to sync audit log to backend:", err);
            }
          };

          syncAuditToSupabase(newLog);

          // Manter apenas os últimos 500 logs (FIFO)
          const nextLogs = [newLog, ...state.auditLogs].slice(0, 500);
          return { auditLogs: nextLogs };
        }),
      clearLogs: () => set({ auditLogs: [] }),
    }),
    {
      name: "ms_audit_logs_v1",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

/**
 * Utilitário para calcular a diferença entre dois leads
 */
export function getLeadDiff(oldLead: any | null, newLead: any): AuditChange[] {
  const changes: AuditChange[] = [];
  const ignoreFields = [
    "id", "updatedAt", "updated_at", "created_at", "createdAt", 
    "last_enriched_at", "opportunityScore", "opportunityLevel", 
    "diagnosis", "generatedPitch", "generatedSite"
  ];

  if (!oldLead) {
    // Caso de adição (todos os campos são novos)
    Object.entries(newLead).forEach(([field, value]) => {
      if (!ignoreFields.includes(field) && value !== undefined && value !== null) {
        changes.push({ field, before: null, after: value });
      }
    });
    return changes;
  }

  // Caso de atualização
  const allKeys = new Set([...Object.keys(oldLead), ...Object.keys(newLead)]);
  
  allKeys.forEach((key) => {
    if (ignoreFields.includes(key)) return;
    
    const before = oldLead[key];
    const after = newLead[key];

    if (JSON.stringify(before) !== JSON.stringify(after)) {
      changes.push({ field: key, before, after });
    }
  });

  return changes;
}

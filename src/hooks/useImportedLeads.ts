import { useEffect, useState, useCallback } from "react";
import { listImportedLeads } from "@/lib/leads-import.functions";
import { supabase } from "@/integrations/supabase/client";
import type { Company, CompanyPorte } from "@/lib/company-types";
import { logger } from "@/lib/logger";

const CNAE_TO_NICHO: Record<string, string> = {
  "4321-5": "solar",
  "3511-5": "solar",
};

function porteFromLabel(raw: string | null): CompanyPorte {
  const s = (raw || "").toLowerCase();
  if (s.includes("grande")) return "Grande";
  if (s.includes("média") || s.includes("media")) return "Média";
  if (s.includes("pequena") || s.includes("epp")) return "Pequena";
  if (s.includes("mei")) return "MEI";
  return "Micro";
}

function adapt(rows: any[]): Company[] {
  return rows.map((r) => ({
    id: `lead_${r.id}`,
    nome: r.nome,
    fantasia: r.fantasia ?? undefined,
    cnpj: r.cnpj,
    cnaeCode: r.cnae_principal || "—",
    cnaeLabel: r.atividade || "Lead importado",
    sector: r.nicho || "lead",
    porte: porteFromLabel(r.porte),
    estado: r.uf || "—",
    cidade: r.cidade || "—",
    email: r.email ?? undefined,
    telefone: r.telefone ?? undefined,
    site: r.site ?? undefined,
    status: (r.status || "").toLowerCase().includes("ativ") || !r.status || r.status === "unknown" ? "ativa" : "inativa",
    faturamentoEstimado: 0,
    funcionarios: 0,
    capitalSocial: Number(r.capital_social) || 0,
    dataAbertura: "",
    regime: "Simples",
    tecnografia: r.site ? "WordPress" : "Nenhum",
    socios: [],
    score: 60,
    contactStatus: r.followup_status,
    lastContactAt: r.last_contact_at,
    nextFollowUpAt: r.next_followup_at,
    contactHistory: r.followup_history || [],
    interestLevel: r.interest_level,
    contactNotes: r.contact_notes,
    followUpStep: r.follow_up_step,
    isDiscarded: r.is_discarded,
    discardReason: r.discard_reason,
    leadOperationStatus: r.lead_operation_status,
    instagramHandle: r.instagram_handle,
  }));
}

export interface UseImportedLeadsArgs {
  cnaeCodes: string[];
  cidades: string[];
  estados: string[];
  text: string;
  jobId?: string;
}

export interface UseImportedLeadsResult {
  companies: Company[];
  loading: boolean;
  total: number;
  refresh: () => void;
}

export function useImportedLeads(args: UseImportedLeadsArgs): UseImportedLeadsResult {
  const { cnaeCodes, cidades, estados, text, jobId } = args;
  const cidade = cidades[0] || "";
  const uf = estados[0] || "";
  const nicho = cnaeCodes.length > 0 ? (CNAE_TO_NICHO[cnaeCodes[0]] || undefined) : undefined;
  const filtro = (text || "").trim();

  const [state, setState] = useState<{ companies: Company[]; loading: boolean; total: number }>({
    companies: [],
    loading: false,
    total: 0,
  });

  const run = useCallback(async () => {
    try {
      setState((s) => ({ ...s, loading: true }));
      let rows: any[] = [];
      
      const res = await listImportedLeads({ 
        data: { 
          cidade, 
          uf, 
          nicho, 
          jobId, 
          page: 1, 
          pageSize: 2000 // Aumentado para 2 mil conforme solicitado
        } 
      });
      rows = res.rows ?? [];

      if (filtro.length >= 2) {
        rows = rows.filter(r => {
          const hay = `${r.nome} ${r.cnpj} ${r.cidade} ${r.uf} ${r.atividade} ${r.nicho}`.toLowerCase();
          return hay.includes(filtro.toLowerCase());
        });
      }

      const companies = adapt(rows);
      setState({ companies, loading: false, total: res.total ?? companies.length });
    } catch (err) {
      logger.error("Failed to load imported leads", err instanceof Error ? err : undefined, {
        cidade,
        uf,
        nicho,
        filtro,
      });
      setState({ companies: [], loading: false, total: 0 });
    }
  }, [cidade, uf, nicho, filtro]);

  useEffect(() => {
    run();
  }, [run]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("leads-refresh")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "leads_import" },
        () => {
          // Debounce manual ou apenas dispara o run
          run();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [run]);

  return { ...state, refresh: run };
}

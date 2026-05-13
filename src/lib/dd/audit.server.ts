// Append-only audit logger
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/integrations/supabase/types'
import { logger } from '@/lib/logger'

export type AuditTipo = 'pf_antecedentes' | 'pf_dados' | 'pj_cnpj' | 'whois' | 'social' | 'site_publico'
export type AuditStatus = 'sucesso' | 'erro' | 'bloqueado_lgpd' | 'cache_hit'

export async function gravarAudit(
  supabase: SupabaseClient<Database>,
  params: {
    user_id: string
    tipo: AuditTipo
    alvo_hash: string
    alvo_mascarado: string
    consentimento_id?: string | null
    provedor: string
    status: AuditStatus
    custo_centavos?: number
    request_payload?: unknown
    response_summary?: unknown
    ip_origem?: string | null
  }
) {
  const { error } = await supabase.from('consultas_audit').insert({
    user_id: params.user_id,
    tipo: params.tipo,
    alvo_hash: params.alvo_hash,
    alvo_mascarado: params.alvo_mascarado,
    consentimento_id: params.consentimento_id ?? null,
    provedor: params.provedor,
    status: params.status,
    custo_centavos: params.custo_centavos ?? 0,
    request_payload: (params.request_payload as never) ?? null,
    response_summary: (params.response_summary as never) ?? null,
    ip_origem: params.ip_origem ?? null,
  })
  if (error) logger.error('Audit log insert failed', error, params)
}

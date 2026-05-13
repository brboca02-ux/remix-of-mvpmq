import { createServerFn } from '@tanstack/react-start'
import { getRequestIP } from '@tanstack/react-start/server'
import { z } from 'zod'
 import { supabaseAdmin } from '@/integrations/supabase/client.server'
 
 const DEV_USER_ID = "00000000-0000-0000-0000-000000000000";
import {
  onlyDigits,
  sha256Hex,
  maskCpf,
  maskCnpj,
  validaCpf,
  validaCnpj,
  checkRateLimit,
} from "@/lib/dd/util.server";
import {
  fetchCnpjBrasilApi,
  fetchCnpjReceitaWS,
  fetchWhoisBR,
  fetchWhoisRDAP,
  fetchSitePublico,
  consultarAntecedentesPF,
} from "@/lib/dd/providers.server";
import { gravarAudit } from "@/lib/dd/audit.server";

// ============ Consulta PJ (CNPJ) ============
export const consultarPJ = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) => z.object({ cnpj: z.string().min(14).max(20) }).parse(d))
  .handler(async ({ data }) => {
    const supabase = supabaseAdmin
    const userId = DEV_USER_ID
    const cnpj = onlyDigits(data.cnpj)
    if (!validaCnpj(cnpj)) throw new Error('CNPJ inválido (dígito verificador).')

    const rl = checkRateLimit(userId)
    if (!rl.ok) throw new Error('Limite de consultas/hora atingido.')

    const ip = (() => { try { return getRequestIP({ xForwardedFor: true }) } catch { return null } })()
    const alvo_hash = sha256Hex(`cnpj:${cnpj}`)
    const alvo_mascarado = maskCnpj(cnpj)

    // 1) cache
    const { data: cached } = await supabase
      .from('consultas_pj_cache')
      .select('*')
      .eq('cnpj', cnpj)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle()

    if (cached) {
      await gravarAudit(supabase, {
        user_id: userId, tipo: 'pj_cnpj', alvo_hash, alvo_mascarado,
        provedor: cached.fonte, status: 'cache_hit', ip_origem: ip,
        response_summary: { from_cache: true },
      })
      return { data: cached.payload, fonte: cached.fonte, from_cache: true }
    }

    // 2) BrasilAPI -> 3) ReceitaWS fallback
    let payload, provedor = 'brasilapi'
    try {
      payload = await fetchCnpjBrasilApi(cnpj)
    } catch {
      try {
        payload = await fetchCnpjReceitaWS(cnpj)
        provedor = 'receitaws'
      } catch (e) {
        await gravarAudit(supabase, {
          user_id: userId, tipo: 'pj_cnpj', alvo_hash, alvo_mascarado,
          provedor, status: 'erro', ip_origem: ip,
          response_summary: { error: String(e) },
        })
        throw new Error('Falha ao consultar CNPJ em todas as fontes.')
      }
    }

    await supabase.from('consultas_pj_cache').upsert({ cnpj, payload: payload as never, fonte: provedor })
    await gravarAudit(supabase, {
      user_id: userId, tipo: 'pj_cnpj', alvo_hash, alvo_mascarado,
      provedor, status: 'sucesso', ip_origem: ip,
      response_summary: { razao_social: payload.razao_social, situacao: payload.situacao },
    })
    return { data: payload, fonte: provedor, from_cache: false }
  })

// ============ Consulta WHOIS ============
export const consultarWhois = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) =>
    z.object({ dominio: z.string().min(3).max(253).regex(/^[a-z0-9.-]+$/i, 'Domínio inválido') }).parse(d)
  )
  .handler(async ({ data }) => {
    const supabase = supabaseAdmin
    const userId = DEV_USER_ID
    const rl = checkRateLimit(userId)
    if (!rl.ok) throw new Error('Limite de consultas/hora atingido.')

    const dom = data.dominio.toLowerCase().replace(/^https?:\/\//, '').split('/')[0]
    const ip = (() => { try { return getRequestIP({ xForwardedFor: true }) } catch { return null } })()
    const alvo_hash = sha256Hex(`dom:${dom}`)
    const isBr = dom.endsWith('.br')

    try {
      const result = isBr ? await fetchWhoisBR(dom) : await fetchWhoisRDAP(dom)
      await gravarAudit(supabase, {
        user_id: userId, tipo: 'whois', alvo_hash, alvo_mascarado: dom,
        provedor: result.fonte, status: 'sucesso', ip_origem: ip,
        response_summary: { registrar: result.registrar, expira_em: result.expira_em },
      })
      return { data: result }
    } catch (e) {
      await gravarAudit(supabase, {
        user_id: userId, tipo: 'whois', alvo_hash, alvo_mascarado: dom,
        provedor: isBr ? 'registro.br' : 'rdap', status: 'erro', ip_origem: ip,
        response_summary: { error: String(e) },
      })
      throw new Error(`Falha WHOIS: ${String(e)}`)
    }
  })

// ============ Consulta site público ============
export const consultarSitePublico = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) => z.object({ url: z.string().url().max(2048) }).parse(d))
  .handler(async ({ data }) => {
    const supabase = supabaseAdmin
    const userId = DEV_USER_ID
    const rl = checkRateLimit(userId)
    if (!rl.ok) throw new Error('Limite de consultas/hora atingido.')

    const ip = (() => { try { return getRequestIP({ xForwardedFor: true }) } catch { return null } })()
    const alvo_hash = sha256Hex(`url:${data.url}`)
    try {
      const result = await fetchSitePublico(data.url)
      await gravarAudit(supabase, {
        user_id: userId, tipo: 'site_publico', alvo_hash, alvo_mascarado: data.url,
        provedor: result.fonte, status: 'sucesso', ip_origem: ip,
        response_summary: { titulo: result.titulo, n_emails: result.emails?.length },
      })
      return { data: result }
    } catch (e) {
      await gravarAudit(supabase, {
        user_id: userId, tipo: 'site_publico', alvo_hash, alvo_mascarado: data.url,
        provedor: 'fetch', status: 'erro', ip_origem: ip,
        response_summary: { error: String(e) },
      })
      throw new Error(`Falha ao consultar site: ${String(e)}`)
    }
  })

// ============ Registrar consentimento de PF ============
export const registrarConsentimentoPF = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) =>
    z.object({
      cpf: z.string(),
      titular_nome: z.string().min(2).max(200),
      titular_email: z.string().email().max(255).optional().nullable(),
      finalidade: z.string().min(5).max(500),
      base_legal: z.enum(['consentimento', 'contrato', 'obrigacao_legal', 'legitimo_interesse']),
      documento_url: z.string().url().max(2048).optional().nullable(),
    }).parse(d)
  )
  .handler(async ({ data }) => {
    const supabase = supabaseAdmin
    const userId = DEV_USER_ID
    const cpf = onlyDigits(data.cpf)
    if (!validaCpf(cpf)) throw new Error('CPF inválido (dígito verificador).')
    const cpf_hash = sha256Hex(`cpf:${cpf}`)
    const ip = (() => { try { return getRequestIP({ xForwardedFor: true }) } catch { return null } })()

    const { data: row, error } = await supabase
      .from('consentimentos_pf')
      .insert({
        cpf_hash,
        titular_nome: data.titular_nome,
        titular_email: data.titular_email ?? null,
        finalidade: data.finalidade,
        base_legal: data.base_legal,
        documento_url: data.documento_url ?? null,
        ip_origem: ip,
        created_by: userId,
      })
      .select('id, expira_em')
      .single()
    if (error) throw new Error(`Falha ao registrar consentimento: ${error.message}`)
    return { id: row.id, expira_em: row.expira_em, cpf_mascarado: maskCpf(cpf) }
  })

// ============ Listar meus consentimentos ============
export const listarConsentimentos = createServerFn({ method: 'GET' })
  .handler(async () => {
    const supabase = supabaseAdmin
    const userId = DEV_USER_ID
    const { data, error } = await supabase
      .from('consentimentos_pf')
      .select('*')
      .eq('created_by', userId)
      .order('created_at', { ascending: false })
      .limit(100)
    if (error) throw new Error(error.message)
    return { items: (data ?? []).map((r) => ({ ...r, ip_origem: r.ip_origem ? String(r.ip_origem) : null })) }
  })

// ============ Revogar consentimento ============
export const revogarConsentimento = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const supabase = supabaseAdmin
    const { error } = await supabase
      .from('consentimentos_pf')
      .update({ revogado_em: new Date().toISOString() })
      .eq('id', data.id)
    if (error) throw new Error(error.message)
    return { ok: true }
  })

// ============ Consultar PF (com consentimento) ============
export const consultarPF = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) =>
    z.object({ cpf: z.string(), consentimento_id: z.string().uuid() }).parse(d)
  )
  .handler(async ({ data }) => {
    const supabase = supabaseAdmin
    const userId = DEV_USER_ID
    const cpf = onlyDigits(data.cpf)
    if (!validaCpf(cpf)) throw new Error('CPF inválido.')

    const rl = checkRateLimit(userId)
    if (!rl.ok) throw new Error('Limite de consultas/hora atingido.')

    const cpf_hash = sha256Hex(`cpf:${cpf}`)
    const alvo_mascarado = maskCpf(cpf)
    const ip = (() => { try { return getRequestIP({ xForwardedFor: true }) } catch { return null } })()

    // Validate consent
    const { data: cons, error: consErr } = await supabase
      .from('consentimentos_pf')
      .select('id, cpf_hash, expira_em, revogado_em')
      .eq('id', data.consentimento_id)
      .maybeSingle()

    const now = new Date()
    const valido = !!cons && cons.cpf_hash === cpf_hash && !cons.revogado_em && new Date(cons.expira_em) > now
    if (!valido) {
      await gravarAudit(supabase, {
        user_id: userId, tipo: 'pf_antecedentes', alvo_hash: cpf_hash, alvo_mascarado,
        consentimento_id: data.consentimento_id, provedor: 'consent_check',
        status: 'bloqueado_lgpd', ip_origem: ip,
        response_summary: {
          motivo: !cons ? 'consentimento_inexistente'
            : cons.cpf_hash !== cpf_hash ? 'consentimento_outro_cpf'
            : cons.revogado_em ? 'consentimento_revogado' : 'consentimento_expirado',
          consErr: consErr?.message,
        },
      })
      throw new Error('Consentimento inválido, expirado ou revogado para este CPF.')
    }

    const result = await consultarAntecedentesPF(cpf, cons.id)
    await gravarAudit(supabase, {
      user_id: userId, tipo: 'pf_antecedentes', alvo_hash: cpf_hash, alvo_mascarado,
      consentimento_id: cons.id, provedor: result.provedor,
      status: result.status === 'sucesso' ? 'sucesso' : 'erro',
      ip_origem: ip, response_summary: { status: result.status, message: result.message },
    })
    const safeResult = {
      status: result.status,
      provedor: result.provedor,
      message: result.message,
      dados: (result.dados as unknown) ? JSON.parse(JSON.stringify(result.dados)) : null,
    }
    return { result: safeResult, cpf_mascarado: alvo_mascarado, consentimento_id: cons.id }
  })

// ============ Auditoria ============
export const listarAuditoria = createServerFn({ method: 'GET' })
  .handler(async () => {
    const supabase = supabaseAdmin
    const { data, error } = await supabase
      .from('consultas_audit')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)
    if (error) throw new Error(error.message)
    return { items: (data ?? []).map((r) => ({ ...r, ip_origem: r.ip_origem ? String(r.ip_origem) : null })) }
  })

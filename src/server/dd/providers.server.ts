// Server-only external provider calls
import { onlyDigits } from './util.server'

export type CnpjData = {
  cnpj: string
  razao_social?: string
  nome_fantasia?: string
  situacao?: string
  data_abertura?: string
  porte?: string
  capital_social?: number
  natureza_juridica?: string
  cnae_principal?: { codigo: string; descricao: string }
  cnaes_secundarios?: { codigo: string; descricao: string }[]
  endereco?: { logradouro?: string; numero?: string; bairro?: string; cidade?: string; uf?: string; cep?: string }
  contatos?: { telefone?: string; email?: string }
  qsa?: { nome: string; qualificacao?: string }[]
  fonte: string
}

export async function fetchCnpjBrasilApi(cnpj: string): Promise<CnpjData> {
  const c = onlyDigits(cnpj)
  const r = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${c}`, {
    headers: { 'User-Agent': 'MarketScope/1.0' },
  })
  if (!r.ok) throw new Error(`BrasilAPI ${r.status}`)
  const j: any = await r.json()
  return {
    cnpj: c,
    razao_social: j.razao_social,
    nome_fantasia: j.nome_fantasia,
    situacao: j.descricao_situacao_cadastral,
    data_abertura: j.data_inicio_atividade,
    porte: j.porte,
    capital_social: j.capital_social,
    natureza_juridica: j.natureza_juridica,
    cnae_principal: j.cnae_fiscal
      ? { codigo: String(j.cnae_fiscal), descricao: j.cnae_fiscal_descricao || '' }
      : undefined,
    cnaes_secundarios: (j.cnaes_secundarios || []).map((c: any) => ({
      codigo: String(c.codigo),
      descricao: c.descricao,
    })),
    endereco: {
      logradouro: j.logradouro,
      numero: j.numero,
      bairro: j.bairro,
      cidade: j.municipio,
      uf: j.uf,
      cep: j.cep,
    },
    contatos: { telefone: j.ddd_telefone_1, email: j.email },
    qsa: (j.qsa || []).map((s: any) => ({
      nome: s.nome_socio,
      qualificacao: s.qualificacao_socio,
    })),
    fonte: 'brasilapi',
  }
}

export async function fetchCnpjReceitaWS(cnpj: string): Promise<CnpjData> {
  const c = onlyDigits(cnpj)
  const r = await fetch(`https://receitaws.com.br/v1/cnpj/${c}`, {
    headers: { 'User-Agent': 'MarketScope/1.0' },
  })
  if (!r.ok) throw new Error(`ReceitaWS ${r.status}`)
  const j: any = await r.json()
  if (j.status === 'ERROR') throw new Error(j.message || 'ReceitaWS error')
  return {
    cnpj: c,
    razao_social: j.nome,
    nome_fantasia: j.fantasia,
    situacao: j.situacao,
    data_abertura: j.abertura,
    porte: j.porte,
    capital_social: j.capital_social ? Number(j.capital_social) : undefined,
    natureza_juridica: j.natureza_juridica,
    cnae_principal: j.atividade_principal?.[0]
      ? { codigo: j.atividade_principal[0].code, descricao: j.atividade_principal[0].text }
      : undefined,
    cnaes_secundarios: (j.atividades_secundarias || []).map((a: any) => ({
      codigo: a.code,
      descricao: a.text,
    })),
    endereco: {
      logradouro: j.logradouro,
      numero: j.numero,
      bairro: j.bairro,
      cidade: j.municipio,
      uf: j.uf,
      cep: j.cep,
    },
    contatos: { telefone: j.telefone, email: j.email },
    qsa: (j.qsa || []).map((s: any) => ({ nome: s.nome, qualificacao: s.qual })),
    fonte: 'receitaws',
  }
}

export type WhoisData = {
  dominio: string
  registrar?: string
  registrado_em?: string
  expira_em?: string
  atualizado_em?: string
  nameservers?: string[]
  status?: string[]
  titular?: string
  email_admin?: string
  fonte: string
}

export async function fetchWhoisBR(dominio: string): Promise<WhoisData> {
  const d = dominio.toLowerCase().replace(/^https?:\/\//, '').split('/')[0]
  const r = await fetch(`https://rdap.registro.br/domain/${encodeURIComponent(d)}`, {
    headers: { Accept: 'application/rdap+json', 'User-Agent': 'MarketScope/1.0' },
  })
  if (!r.ok) throw new Error(`registro.br RDAP ${r.status}`)
  const j: any = await r.json()
  const events = j.events || []
  const findEvent = (action: string) => events.find((e: any) => e.eventAction === action)?.eventDate
  const titular = j.entities?.find((e: any) => e.roles?.includes('registrant'))
  return {
    dominio: d,
    registrar: j.entities?.find((e: any) => e.roles?.includes('registrar'))?.handle,
    registrado_em: findEvent('registration'),
    expira_em: findEvent('expiration'),
    atualizado_em: findEvent('last changed'),
    nameservers: (j.nameservers || []).map((n: any) => n.ldhName),
    status: j.status,
    titular: titular?.vcardArray?.[1]?.find((v: any[]) => v[0] === 'fn')?.[3],
    fonte: 'registro.br',
  }
}

export async function fetchWhoisRDAP(dominio: string): Promise<WhoisData> {
  const d = dominio.toLowerCase().replace(/^https?:\/\//, '').split('/')[0]
  const r = await fetch(`https://rdap.org/domain/${encodeURIComponent(d)}`, {
    headers: { Accept: 'application/rdap+json', 'User-Agent': 'MarketScope/1.0' },
  })
  if (!r.ok) throw new Error(`rdap.org ${r.status}`)
  const j: any = await r.json()
  const events = j.events || []
  const findEvent = (action: string) => events.find((e: any) => e.eventAction === action)?.eventDate
  return {
    dominio: d,
    registrar: j.entities?.find((e: any) => e.roles?.includes('registrar'))?.vcardArray?.[1]?.find(
      (v: any[]) => v[0] === 'fn'
    )?.[3],
    registrado_em: findEvent('registration'),
    expira_em: findEvent('expiration'),
    atualizado_em: findEvent('last changed'),
    nameservers: (j.nameservers || []).map((n: any) => n.ldhName),
    status: j.status,
    fonte: 'rdap',
  }
}

export type SitePublicoData = {
  url: string
  titulo?: string
  descricao?: string
  resumo?: string
  links_sociais?: string[]
  emails?: string[]
  telefones?: string[]
  fonte: string
}

export async function fetchSitePublico(url: string): Promise<SitePublicoData> {
  const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY
  if (FIRECRAWL_API_KEY) {
    // Use Firecrawl when available
    const r = await fetch('https://api.firecrawl.dev/v2/scrape', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url, formats: ['markdown', 'links', 'summary'], onlyMainContent: true }),
    })
    if (r.ok) {
      const j: any = await r.json()
      const data = j.data || j
      const md: string = data.markdown || ''
      const links: string[] = data.links || []
      const social = links.filter((l) =>
        /(instagram|facebook|linkedin|twitter|x\.com|tiktok|youtube)\.com/i.test(l)
      )
      const emails = Array.from(new Set(md.match(/[\w.+-]+@[\w-]+\.[\w.-]+/g) || []))
      const telefones = Array.from(new Set(md.match(/(?:\+?55\s?)?\(?\d{2}\)?\s?9?\d{4}-?\d{4}/g) || []))
      return {
        url,
        titulo: data.metadata?.title,
        descricao: data.metadata?.description,
        resumo: data.summary,
        links_sociais: social,
        emails,
        telefones,
        fonte: 'firecrawl',
      }
    }
  }
  // Fallback: simple fetch + regex
  const r = await fetch(url, { headers: { 'User-Agent': 'MarketScope/1.0' } })
  if (!r.ok) throw new Error(`fetch site ${r.status}`)
  const html = await r.text()
  const titulo = html.match(/<title>([^<]+)<\/title>/i)?.[1]
  const descricao = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)/i)?.[1]
  const emails = Array.from(new Set(html.match(/[\w.+-]+@[\w-]+\.[\w.-]+/g) || []))
  const telefones = Array.from(new Set(html.match(/(?:\+?55\s?)?\(?\d{2}\)?\s?9?\d{4}-?\d{4}/g) || []))
  const linkMatches = Array.from(html.matchAll(/href=["']([^"']+)["']/gi)).map((m) => m[1])
  const links_sociais = linkMatches.filter((l) =>
    /(instagram|facebook|linkedin|twitter|x\.com|tiktok|youtube)\.com/i.test(l)
  )
  return { url, titulo, descricao, emails, telefones, links_sociais, fonte: 'fetch' }
}

export type BackgroundCheckResult = {
  status: 'not_configured' | 'sucesso' | 'erro'
  message: string
  provedor: string
  dados?: unknown
}

export async function consultarAntecedentesPF(
  _cpf: string,
  _consentimentoId: string
): Promise<BackgroundCheckResult> {
  // Placeholder: no licensed provider configured.
  // To enable, add IDWALL_API_KEY (or SERPRO/CAF) and implement the call here.
  if (!process.env.IDWALL_API_KEY && !process.env.SERPRO_API_KEY && !process.env.CAF_API_KEY) {
    return {
      status: 'not_configured',
      provedor: 'none',
      message:
        'Nenhum provedor licenciado configurado. Adicione IDWALL_API_KEY, SERPRO_API_KEY ou CAF_API_KEY para ativar consultas reais. Por LGPD, scraping de sites como JusBrasil ou PF não é permitido.',
    }
  }
  return {
    status: 'erro',
    provedor: 'placeholder',
    message: 'Integração com provedor licenciado pendente de implementação.',
  }
}

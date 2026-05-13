/**
 * Schema Padronizado de Lead e Utilitários Compartilhados (Client-Safe)
 */
export interface StandardLead {
  id?: string;
  identity_hash?: string;
  cnpj: string;
  nome: string;
  fantasia?: string | null;
  razao_social?: string | null;
  telefone?: string | null;
  email?: string | null;
  site?: string | null;
  cidade?: string | null;
  uf?: string | null;
  bairro?: string | null;
  cep?: string | null;
  porte?: string | null;
  atividade?: string | null;
  status?: string | null;
  capital_social?: number | null;
  cnae_principal?: string | null;
  nicho: string;
  source: string;
  confidence_score: number;
  raw?: any;
}

export interface VerificationFlags {
  cnpj_valid: boolean;
  phone_valid: boolean;
  ibge_match: boolean;
  multiple_sources: boolean;
  is_active: boolean;
}

export function calculateConfidenceScore(lead: StandardLead, flags?: VerificationFlags): { score: number; level: 'high' | 'medium' | 'low' | 'unverified' } {
  let score = 0;
  if (lead.cnpj && !lead.cnpj.startsWith("TEMP:")) score += 40;
  if (lead.telefone) score += 20;
  if (lead.email) score += 15;
  if (lead.site) score += 15;
  if (lead.uf && lead.cidade) score += 10;

  // Bônus por validação
  if (flags?.cnpj_valid) score += 10;
  if (flags?.ibge_match) score += 5;
  if (flags?.multiple_sources) score += 15;

  const level = score >= 85 ? 'high' : score >= 50 ? 'medium' : score > 0 ? 'low' : 'unverified';
  return { score: Math.min(100, score), level };
}

export function normalizePorte(raw: string | null): string {
  const p = (raw || "").toUpperCase().trim();
  if (p.includes("MEI")) return "MEI";
  if (p === "01" || p.includes("MICRO") || p === "ME") return "Micro";
  if (p === "03" || p.includes("PEQUENO") || p === "EPP") return "Pequena";
  if (p === "05" || p.includes("DEMAIS") || p.includes("GRANDE") || p.includes("MATRIZ")) return "Grande";
  if (p.includes("MÉDIA")) return "Média";
  return "Micro"; // Fallback para empresas sem porte definido
}

export function normalizeLead(lead: Partial<StandardLead>): StandardLead {
  const cleanPhone = (lead.telefone || "").replace(/\D/g, "");
  const cleanCnpj = (lead.cnpj || "").replace(/\D/g, "");
  const cleanCep = (lead.cep || "").replace(/\D/g, "");
  
  const normalized: StandardLead = {
    cnpj: cleanCnpj || `TEMP:${Math.random().toString(36).slice(2)}`,
    nome: (lead.nome || "Empresa sem nome").trim(),
    fantasia: lead.fantasia?.trim() || null,
    razao_social: lead.razao_social?.trim() || lead.nome?.trim() || null,
    telefone: cleanPhone || null,
    email: lead.email?.toLowerCase().trim() || null,
    site: lead.site?.toLowerCase().trim() || null,
    cidade: lead.cidade?.trim() || null,
    uf: lead.uf?.toUpperCase().trim() || null,
    bairro: lead.bairro?.trim() || null,
    cep: cleanCep || null,
    porte: normalizePorte(lead.porte ?? null),
    atividade: lead.atividade?.trim() || null,
    status: lead.status?.toLowerCase().trim() || "unknown",
    capital_social: Number(lead.capital_social) || 0,
    cnae_principal: lead.cnae_principal?.trim() || null,
    nicho: lead.nicho || "geral",
    source: lead.source || "manual",
    raw: lead.raw || {},
    confidence_score: 0,
  };

  if (cleanCnpj && cleanCnpj.length === 14) {
    normalized.identity_hash = `cnpj:${cleanCnpj}`;
  } else if (cleanPhone && cleanPhone.length >= 10) {
    normalized.identity_hash = `tel:${cleanPhone}`;
  } else {
    const hashPayload = `${normalized.nome.toLowerCase()}|${(normalized.cidade || "").toLowerCase()}`;
    normalized.identity_hash = `name_city:${hashPayload}`;
  }

  const { score } = calculateConfidenceScore(normalized);
  normalized.confidence_score = score;
  return normalized;
}

export function withFallback<T>(
  fn: () => Promise<T>,
  fallbackValue: T
): Promise<T> {
  try {
    return fn();
  } catch (err) {
    return Promise.resolve(fallbackValue);
  }
}

/**
 * Lead Normalization Utility (Client-safe)
 * 
 * Re-exports normalizeLead for use in client components.
 * The actual implementation lives in server/leads-core.ts but this
 * provides a client-safe version for preview/validation purposes.
 */

export interface StandardLeadMinimal {
  nome: string;
  telefone?: string | null;
  cnpj?: string | null;
  cidade?: string | null;
  identity_hash?: string;
  [key: string]: unknown;
}

/**
 * Client-safe lead normalization for preview/dedup checking.
 * Does NOT require server - just normalizes fields for display.
 */
export function normalizeLeadClient(lead: Partial<StandardLeadMinimal>): StandardLeadMinimal {
  const cleanPhone = (lead.telefone || "").replace(/\D/g, "");
  const cleanCnpj = (lead.cnpj || "").replace(/\D/g, "");
  const nome = (lead.nome || "Empresa sem nome").trim();
  const cidade = (lead.cidade || "").trim();

  let identity_hash: string;
  if (cleanCnpj && cleanCnpj.length === 14) {
    identity_hash = `cnpj:${cleanCnpj}`;
  } else if (cleanPhone && cleanPhone.length >= 10) {
    identity_hash = `tel:${cleanPhone}`;
  } else {
    identity_hash = `name_city:${nome.toLowerCase()}|${cidade.toLowerCase()}`;
  }

  return {
    ...lead,
    nome,
    telefone: cleanPhone || null,
    cnpj: cleanCnpj || null,
    cidade: cidade || null,
    identity_hash,
  };
}

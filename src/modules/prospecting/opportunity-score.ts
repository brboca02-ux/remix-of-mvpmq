import { ProspectLead, OpportunityLevel } from './types';

export const calculateOpportunityScore = (lead: Partial<ProspectLead>) => {
  if (!lead) return { score: 0, level: 'baixa' as OpportunityLevel, diagnosis: "Lead inválido", factors: [] };
  
  let score = 0;
  const reasons: string[] = [];
  const factors: string[] = [];

  const hasWebsite = !!lead.websiteUrl;
  const hasInstagram = !!(lead.instagramHandle || lead?.socialDiscovery?.instagramHandle);
  const hasSocials = !!(lead?.socialDiscovery?.facebookUrl || lead?.socialDiscovery?.instagramUrl || hasInstagram);
  const hasPhone = !!lead.whatsapp;

  // Sem site identificado: +30 pontos
  if (!hasWebsite) {
    score += 30;
    reasons.push("Não possui um site identificado, perdendo buscas no Google.");
    factors.push("Sem site");
  }

  // Tem telefone/whatsapp: +20 pontos
  if (hasPhone) {
    score += 20;
    reasons.push("Possui telefone ativo, facilitando o fechamento comercial.");
    factors.push("WhatsApp ativo");
  }

  // Nota alta mas sem site: +25 pontos
  if (lead.rating && lead.rating >= 4.0 && !hasWebsite) {
    score += 25;
    reasons.push("Possui ótima avaliação local mas carece de uma página profissional.");
    factors.push("Alta avaliação local");
  }

  // Nicho local forte: +15 pontos
  const highIntentNiches = ['estética', 'clínica', 'dentista', 'advogado', 'oficina', 'ar condicionado', 'beleza', 'saúde'];
  if (lead.niche && highIntentNiches.some(n => lead.niche?.toLowerCase().includes(n))) {
    score += 15;
    reasons.push("Atua em um nicho de alta demanda local.");
    factors.push("Nicho de alta demanda");
  }

  // Endereço identificado: +10 pontos
  if (lead.address) {
    score += 10;
    reasons.push("Possui endereço físico estabelecido.");
    factors.push("Endereço físico");
  }

  // Social Discovery Bonuses
  if (!hasInstagram) {
    score += 15;
    reasons.push("Presença no Instagram não localizada.");
    factors.push("Instagram ausente");
  } else if (!hasWebsite) {
    score += 20;
    reasons.push("Tem Instagram ativo, mas falta conversão via site.");
    factors.push("Social ativo s/ site");
  }

  if (hasSocials && !hasWebsite) {
    score += 30;
    reasons.push("Possui redes sociais, mas não direciona o público para um canal de vendas próprio.");
  }

  let level: OpportunityLevel = 'baixa';
  if (score > 80) level = 'quente';
  else if (score > 60) level = 'boa';
  else if (score > 30) level = 'média';

  return {
    score: Math.min(score, 100),
    level,
    diagnosis: reasons.join(" ") || "Lead aguardando dados para diagnóstico.",
    factors
  };
};

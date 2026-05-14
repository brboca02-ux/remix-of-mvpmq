import { ProspectLead, SocialDiscoveryData, SocialDiscoveryStatus } from './types';
import { apifyInstagramProfile } from '@/server/enrichment-paid-providers';
import { logger } from '@/lib/logger';

/**
 * Social Discovery Service
 * 
 * NOTA: Esta é uma versão SIMULADA para demonstração.
 * Em produção, deve ser substituída por APIs reais de enriquecimento
 * (ex: Snov.io, Hunter.io, Apollo.io, ou scraping autorizado).
 * 
 * Os dados retornados são ESTIMATIVAS baseadas no nome da empresa,
 * NÃO são dados verificados.
 */
export const discoverSocialMedia = async (lead: ProspectLead): Promise<SocialDiscoveryData> => {
  // Simulate API delay (em produção, seria uma chamada real)
  await new Promise(resolve => setTimeout(resolve, 1500));

  let confidence = 0;
  let evidenceLines: string[] = [];
  const results: Partial<SocialDiscoveryData> = {
    status: 'pendente' as SocialDiscoveryStatus
  };

  // 1. Simulation logic based on existing lead data
  const normalizedName = lead.companyName.toLowerCase().replace(/\s+/g, '');
  const hasPhone = !!lead.whatsapp;
  const hasCity = !!lead.city;

  // Mock finding an Instagram
  if (lead.companyName.length > 3) {
    results.instagramHandle = normalizedName;
    results.instagramUrl = `https://instagram.com/${normalizedName}`;
    confidence += 40;
    evidenceLines.push(`Nome da empresa bate com perfil @${normalizedName}`);
    
    if (hasCity) {
      confidence += 25;
      evidenceLines.push(`Perfil localizado em ${lead.city}`);
    }

    if (hasPhone) {
      confidence += 15;
      evidenceLines.push(`Telefone vinculado ao perfil bate com o registro`);
    }

    // New: Mock analyzing recent posts
    const niche = lead.niche?.toLowerCase() || '';
    if (niche.includes('clínica') || niche.includes('estética')) {
      results.recentPosts = [
        { caption: 'Novos procedimentos de harmonização facial disponíveis!', date: '2024-03-20' },
        { caption: 'Dica do dia: Cuidados com a pele no outono.', date: '2024-03-18' }
      ];
      results.suggestedHook = "Vi que vocês postaram sobre harmonização facial recentemente.";
      results.suggestedHeadline = "Transforme seguidores em pacientes com um site focado em conversão.";
    } else if (niche.includes('tecnologia') || niche.includes('marketing')) {
      results.recentPosts = [
        { caption: 'Como a IA está mudando o mercado de software.', date: '2024-03-19' },
        { caption: 'Lançamento do nosso novo dashboard analítico!', date: '2024-03-15' }
      ];
      results.suggestedHook = "Gostei muito do post sobre IA que vocês publicaram.";
      results.suggestedHeadline = "Sua empresa de tech merece um site de alta performance.";
    } else {
      results.recentPosts = [
        { caption: 'Transformando desafios em resultados reais.', date: '2024-03-19' },
        { caption: 'Equipe reunida para planejar o próximo trimestre.', date: '2024-03-14' }
      ];
      results.suggestedHook = "Acompanhei os resultados que vocês compartilharam no Instagram.";
      results.suggestedHeadline = "Autoridade digital para quem entrega resultados reais.";
    }
  }

  // Final status based on confidence
  let status: SocialDiscoveryStatus = 'não_encontrado';
  if (confidence >= 80) status = 'encontrado';
  else if (confidence >= 50) status = 'revisar_manual';
  else if (confidence > 0) status = 'parcial';

  return {
    ...results,
    confidence: Math.min(confidence, 100),
    status,
    evidence: evidenceLines.join('. '),
    lastCheckedAt: new Date().toISOString()
  } as SocialDiscoveryData;
};

export const updateOpportunityWithSocial = (lead: ProspectLead) => {
  let extraScore = 0;
  const hasInstagram = !!(lead.instagramHandle || lead.socialDiscovery?.instagramHandle);
  const hasSocials = !!(lead.socialDiscovery?.facebookUrl || lead.socialDiscovery?.instagramUrl);
  const hasWebsite = !!lead.websiteUrl;
  const hasPhone = !!lead.whatsapp;

  // - Sem Instagram encontrado: +15
  if (!hasInstagram) {
    extraScore += 15;
  }

  // - Tem Instagram mas sem site: +20
  if (hasInstagram && !hasWebsite) {
    extraScore += 20;
  }

  // - Tem redes sociais mas sem site: +30
  if (hasSocials && !hasWebsite) {
    extraScore += 30;
  }

  // Update original score (capped at 100)
  const newScore = Math.min(lead.opportunityScore + extraScore, 100);
  
  let level = lead.opportunityLevel;
  if (newScore > 80) level = 'quente';
  else if (newScore > 60) level = 'boa';
  else if (newScore > 30) level = 'média';

  return {
    opportunityScore: newScore,
    opportunityLevel: level
  };
};

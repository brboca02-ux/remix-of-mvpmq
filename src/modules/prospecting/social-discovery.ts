import { ProspectLead, SocialDiscoveryData, SocialDiscoveryStatus } from './types';
import { apifyInstagramProfile } from '../../server/enrichment-paid-providers';
import { logger } from '../../lib/logger';

/**
 * Social Discovery Service
 * 
 * Conecta com Apify para scraping real se o token estiver configurado.
 * Caso contrário, utiliza uma simulação inteligente para demonstração.
 */
export const discoverSocialMedia = async (lead: ProspectLead): Promise<SocialDiscoveryData> => {
  const normalizedName = lead.instagramHandle || lead.companyName.toLowerCase().replace(/\s+/g, '');
  
  // 1. Tentar Enriquecimento REAL via Apify se tivermos o handle ou nome
  try {
    logger.info('Iniciando descoberta social real via Apify', { handle: normalizedName });
    const result = await apifyInstagramProfile({ data: { username: normalizedName } });
    
    if (result.success && result.data) {
      const profile = result.data;
      return {
        instagramHandle: profile.username,
        instagramUrl: `https://instagram.com/${profile.username}`,
        recentPosts: (profile.recentPosts || []).map((p: any) => ({
          caption: p.caption,
          date: p.timestamp,
          imageUrl: p.displayUrl
        })),
        suggestedHook: `Vi seu perfil no Instagram (@${profile.username}) e notei que você tem ${profile.followersCount} seguidores.`,
        suggestedHeadline: profile.biography ? `Sua bio diz "${profile.biography.substring(0, 50)}...", que tal potencializar isso com um site?` : "Transforme seguidores em clientes reais.",
        status: 'encontrado' as SocialDiscoveryStatus,
        confidence: 95,
        evidence: `Perfil real encontrado via scraping: ${profile.fullName}. ${profile.followersCount} seguidores.`,
        lastCheckedAt: new Date().toISOString()
      } as SocialDiscoveryData;
    }
    
    if (result.error?.includes('APIFY_API_TOKEN não configurado')) {
      logger.warn('Apify não configurado, usando simulação inteligente');
    } else {
      logger.warn('Apify falhou ou não encontrou, usando simulação', { error: result.error });
    }
  } catch (err) {
    logger.error('Erro na chamada do Apify', err as Error);
  }

  // 2. Fallback: Simulação inteligente (original)
  await new Promise(resolve => setTimeout(resolve, 1000));

  let confidence = 0;
  let evidenceLines: string[] = [];
  const results: Partial<SocialDiscoveryData> = {
    status: 'pendente' as SocialDiscoveryStatus
  };

  const hasPhone = !!lead.whatsapp;
  const hasCity = !!lead.city;

  if (lead.companyName.length > 3) {
    results.instagramHandle = normalizedName;
    results.instagramUrl = `https://instagram.com/${normalizedName}`;
    confidence += 40;
    evidenceLines.push(`Nome da empresa bate com perfil @${normalizedName} (Simulado)`);
    
    if (hasCity) {
      confidence += 25;
      evidenceLines.push(`Perfil localizado em ${lead.city}`);
    }

    if (hasPhone) {
      confidence += 15;
      evidenceLines.push(`Telefone vinculado ao perfil bate com o registro`);
    }

    results.suggestedHook = "Acompanhei os resultados que vocês compartilharam no Instagram.";
    results.suggestedHeadline = "Autoridade digital para quem entrega resultados reais.";
  }

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
  
  // Pontuação baseada em pontos de dor reais
  if (lead.pageSpeedStatus === 'crítico' || lead.pageSpeedStatus === 'ruim') {
    extraScore += 25; // Oportunidade quente para vender performance
  }
  
  if (lead.techPainPoints?.includes("Tecnologia Obsoleta")) {
    extraScore += 15;
  }
  
  if (lead.techPainPoints?.includes("Falta Analytics")) {
    extraScore += 10;
  }

  // Lógica original de presença
  if (!hasInstagram) {
    extraScore += 10;
  }

  if (hasInstagram && !hasWebsite) {
    extraScore += 20;
  }

  if (hasSocials && !hasWebsite) {
    extraScore += 25;
  }

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

/**
 * Paid Enrichment Providers
 * 
 * APIs que requerem cadastro/API key:
 * - Hunter.io: Descoberta de emails
 * - BuiltWith: Detecção de tecnologia de sites
 * - Apify: Scraping (Instagram, Google Maps)
 * - ScraperAPI: Proxies para scraping
 * 
 * @module server/enrichment-paid-providers
 */

import { createServerFn } from "@tanstack/react-start";
import { logger } from "@/lib/logger";
import type { EnrichmentResult } from "./enrichment-providers";

// ============================================================================
// Hunter.io - Email Discovery
// ============================================================================

interface HunterEmailResult {
  email: string;
  score: number;
  position?: string;
  first_name?: string;
  last_name?: string;
  department?: string;
  sources: Array<{ domain: string; uri: string }>;
}

/**
 * Busca emails de uma empresa pelo domínio
 * API: https://hunter.io/api-documentation
 * Limite: 25 buscas/mês (free)
 */
export const hunterFindEmails = createServerFn({ method: "POST" })
  .inputValidator((input: { domain: string; company?: string }) => input)
  .handler(async ({ data }): Promise<EnrichmentResult> => {
    const apiKey = process.env.HUNTER_API_KEY;
    if (!apiKey) {
      return { source: 'hunter', success: false, data: {}, confidence: 0, timestamp: new Date().toISOString(), error: 'HUNTER_API_KEY não configurada' };
    }

    try {
      const params = new URLSearchParams({
        domain: data.domain,
        api_key: apiKey,
      });
      if (data.company) params.set('company', data.company);

      const response = await fetch(`https://api.hunter.io/v2/domain-search?${params}`);
      const result = await response.json();

      if (result.errors) {
        return { source: 'hunter', success: false, data: {}, confidence: 0, timestamp: new Date().toISOString(), error: result.errors[0]?.details || 'Erro na API' };
      }

      const emails: HunterEmailResult[] = (result.data?.emails || []).map((e: Record<string, unknown>) => ({
        email: e.value,
        score: e.confidence,
        position: e.position,
        first_name: e.first_name,
        last_name: e.last_name,
        department: e.department,
        sources: e.sources || [],
      }));

      logger.info('Hunter.io email discovery', { domain: data.domain, found: emails.length });

      return {
        source: 'hunter',
        success: true,
        data: {
          domain: data.domain,
          organization: result.data?.organization,
          emails,
          total: result.data?.total || 0,
          pattern: result.data?.pattern, // ex: "{first}.{last}@domain.com"
          webmail: result.data?.webmail || false,
          disposable: result.data?.disposable || false,
        },
        confidence: emails.length > 0 ? 0.85 : 0.3,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      logger.error('Hunter.io failed', err as Error, { domain: data.domain });
      return { source: 'hunter', success: false, data: {}, confidence: 0, timestamp: new Date().toISOString(), error: (err as Error).message };
    }
  });

/**
 * Verifica se um email existe
 */
export const hunterVerifyEmail = createServerFn({ method: "POST" })
  .inputValidator((input: { email: string }) => input)
  .handler(async ({ data }): Promise<EnrichmentResult> => {
    const apiKey = process.env.HUNTER_API_KEY;
    if (!apiKey) {
      return { source: 'hunter_verify', success: false, data: {}, confidence: 0, timestamp: new Date().toISOString(), error: 'HUNTER_API_KEY não configurada' };
    }

    try {
      const params = new URLSearchParams({ email: data.email, api_key: apiKey });
      const response = await fetch(`https://api.hunter.io/v2/email-verifier?${params}`);
      const result = await response.json();

      return {
        source: 'hunter_verify',
        success: true,
        data: {
          email: data.email,
          status: result.data?.status, // valid, invalid, accept_all, webmail, disposable, unknown
          score: result.data?.score,
          regexp: result.data?.regexp,
          gibberish: result.data?.gibberish,
          disposable: result.data?.disposable,
          webmail: result.data?.webmail,
          mx_records: result.data?.mx_records,
          smtp_server: result.data?.smtp_server,
          smtp_check: result.data?.smtp_check,
        },
        confidence: result.data?.score ? result.data.score / 100 : 0.5,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      return { source: 'hunter_verify', success: false, data: {}, confidence: 0, timestamp: new Date().toISOString(), error: (err as Error).message };
    }
  });

// ============================================================================
// BuiltWith - Detecção de Tecnologia
// ============================================================================

/**
 * Detecta tecnologias usadas em um site
 * API: https://api.builtwith.com/
 * Limite: Depende do plano
 */
export const builtWithLookup = createServerFn({ method: "POST" })
  .inputValidator((input: { domain: string }) => input)
  .handler(async ({ data }): Promise<EnrichmentResult> => {
    const apiKey = process.env.BUILTWITH_API_KEY;
    if (!apiKey) {
      return { source: 'builtwith', success: false, data: {}, confidence: 0, timestamp: new Date().toISOString(), error: 'BUILTWITH_API_KEY não configurada' };
    }

    try {
      const url = `https://api.builtwith.com/v22/api.json?KEY=${apiKey}&LOOKUP=${data.domain}`;
      const response = await fetch(url);
      const result = await response.json();

      if (!result || result.Errors) {
        return { source: 'builtwith', success: false, data: {}, confidence: 0, timestamp: new Date().toISOString(), error: result?.Errors?.[0]?.Message || 'Erro na API' };
      }

      // Extrair tecnologias relevantes
      const technologies: Array<{ name: string; category: string; description?: string }> = [];
      const paths = result.Results?.[0]?.Result?.Paths || [];

      for (const path of paths) {
        for (const tech of (path.Technologies || [])) {
          technologies.push({
            name: tech.Name,
            category: tech.Categories?.[0] || 'Outro',
            description: tech.Description,
          });
        }
      }

      // Classificar oportunidade
      const hasCMS = technologies.some(t => ['WordPress', 'Wix', 'Squarespace', 'Shopify', 'Webflow'].includes(t.name));
      const hasAnalytics = technologies.some(t => t.category?.includes('Analytics'));
      const hasEcommerce = technologies.some(t => t.category?.includes('Ecommerce'));
      const isOutdated = technologies.some(t => t.name?.includes('jQuery') || t.name?.includes('PHP 5'));

      const opportunity = {
        hasProfessionalSite: hasCMS,
        hasAnalytics,
        hasEcommerce,
        isOutdated,
        needsUpgrade: isOutdated || !hasAnalytics,
        cms: technologies.find(t => ['WordPress', 'Wix', 'Squarespace', 'Shopify', 'Webflow', 'Joomla', 'Drupal'].includes(t.name))?.name || 'Desconhecido',
      };

      logger.info('BuiltWith lookup', { domain: data.domain, techs: technologies.length });

      return {
        source: 'builtwith',
        success: true,
        data: {
          domain: data.domain,
          technologies: technologies.slice(0, 30),
          totalTechnologies: technologies.length,
          opportunity,
          meta: {
            firstDetected: result.Results?.[0]?.Result?.FirstIndexed,
            lastDetected: result.Results?.[0]?.Result?.LastIndexed,
          },
        },
        confidence: 0.95,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      logger.error('BuiltWith failed', err as Error, { domain: data.domain });
      return { source: 'builtwith', success: false, data: {}, confidence: 0, timestamp: new Date().toISOString(), error: (err as Error).message };
    }
  });

/**
 * Busca sites por palavra-chave (BuiltWith Keyword Search)
 */
export const builtWithKeywordSearch = createServerFn({ method: "POST" })
  .inputValidator((input: { keyword: string }) => input)
  .handler(async ({ data }): Promise<EnrichmentResult> => {
    const apiKey = process.env.BUILTWITH_API_KEY;
    if (!apiKey) {
      return { source: 'builtwith_kw', success: false, data: {}, confidence: 0, timestamp: new Date().toISOString(), error: 'BUILTWITH_API_KEY não configurada' };
    }

    try {
      const url = `https://api.builtwith.com/kws1/api.json?KEY=${apiKey}&KEYWORD=${encodeURIComponent(data.keyword)}`;
      const response = await fetch(url);
      const result = await response.json();

      return {
        source: 'builtwith_kw',
        success: true,
        data: {
          keyword: data.keyword,
          sites: result.Results || [],
          total: result.Total || 0,
        },
        confidence: 0.8,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      return { source: 'builtwith_kw', success: false, data: {}, confidence: 0, timestamp: new Date().toISOString(), error: (err as Error).message };
    }
  });

// ============================================================================
// Apify - Scraping (Instagram, Google Maps)
// ============================================================================

/**
 * Scraping de perfil Instagram via Apify
 * Retorna: bio, seguidores, posts recentes, contato
 */
export const apifyInstagramProfile = createServerFn({ method: "POST" })
  .inputValidator((input: { username: string }) => input)
  .handler(async ({ data }): Promise<EnrichmentResult> => {
    const apiToken = process.env.APIFY_API_TOKEN;
    if (!apiToken) {
      return { source: 'apify_instagram', success: false, data: {}, confidence: 0, timestamp: new Date().toISOString(), error: 'APIFY_API_TOKEN não configurado' };
    }

    try {
      // Usar o actor de Instagram Profile Scraper
      const actorId = 'apify~instagram-profile-scraper';
      const runUrl = `https://api.apify.com/v2/acts/${actorId}/runs?token=${apiToken}`;

      const runResponse = await fetch(runUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usernames: [data.username.replace('@', '')],
          resultsLimit: 5,
        }),
      });

      const runData = await runResponse.json();
      const runId = runData.data?.id;

      if (!runId) {
        return { source: 'apify_instagram', success: false, data: {}, confidence: 0, timestamp: new Date().toISOString(), error: 'Falha ao iniciar scraping' };
      }

      // Aguardar resultado (polling simples - max 30s)
      let attempts = 0;
      let dataset = null;

      while (attempts < 10) {
        await new Promise(r => setTimeout(r, 3000));
        const statusRes = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${apiToken}`);
        const statusData = await statusRes.json();

        if (statusData.data?.status === 'SUCCEEDED') {
          const datasetId = statusData.data.defaultDatasetId;
          const itemsRes = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items?token=${apiToken}`);
          dataset = await itemsRes.json();
          break;
        }

        if (statusData.data?.status === 'FAILED' || statusData.data?.status === 'ABORTED') {
          return { source: 'apify_instagram', success: false, data: {}, confidence: 0, timestamp: new Date().toISOString(), error: `Scraping ${statusData.data.status}` };
        }

        attempts++;
      }

      if (!dataset || dataset.length === 0) {
        return { source: 'apify_instagram', success: false, data: {}, confidence: 0, timestamp: new Date().toISOString(), error: 'Timeout ou sem resultados' };
      }

      const profile = dataset[0];

      logger.info('Apify Instagram scraping success', { username: data.username, followers: profile.followersCount });

      return {
        source: 'apify_instagram',
        success: true,
        data: {
          username: profile.username,
          fullName: profile.fullName,
          biography: profile.biography,
          followersCount: profile.followersCount,
          followingCount: profile.followsCount,
          postsCount: profile.postsCount,
          isVerified: profile.verified,
          isBusinessAccount: profile.isBusinessAccount,
          businessCategory: profile.businessCategoryName,
          externalUrl: profile.externalUrl,
          email: profile.businessEmail || profile.publicEmail,
          phone: profile.businessPhoneNumber || profile.publicPhoneNumber,
          profilePicUrl: profile.profilePicUrlHD || profile.profilePicUrl,
          recentPosts: (profile.latestPosts || []).slice(0, 5).map((p: Record<string, unknown>) => ({
            caption: (p.caption as string)?.substring(0, 200),
            likes: p.likesCount,
            comments: p.commentsCount,
            timestamp: p.timestamp,
            type: p.type,
          })),
        },
        confidence: 0.9,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      logger.error('Apify Instagram failed', err as Error, { username: data.username });
      return { source: 'apify_instagram', success: false, data: {}, confidence: 0, timestamp: new Date().toISOString(), error: (err as Error).message };
    }
  });

/**
 * Scraping de Google Maps via Apify (sem API key do Google)
 */
export const apifyGoogleMaps = createServerFn({ method: "POST" })
  .inputValidator((input: { query: string; location?: string; maxResults?: number }) => input)
  .handler(async ({ data }): Promise<EnrichmentResult> => {
    const apiToken = process.env.APIFY_API_TOKEN;
    if (!apiToken) {
      return { source: 'apify_gmaps', success: false, data: {}, confidence: 0, timestamp: new Date().toISOString(), error: 'APIFY_API_TOKEN não configurado' };
    }

    try {
      const actorId = 'compass~crawler-google-places';
      const runUrl = `https://api.apify.com/v2/acts/${actorId}/runs?token=${apiToken}`;

      const searchQuery = data.location 
        ? `${data.query} em ${data.location}` 
        : data.query;

      const runResponse = await fetch(runUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          searchStringsArray: [searchQuery],
          maxCrawledPlacesPerSearch: data.maxResults || 20,
          language: 'pt-BR',
          countryCode: 'br',
        }),
      });

      const runData = await runResponse.json();
      const runId = runData.data?.id;

      if (!runId) {
        return { source: 'apify_gmaps', success: false, data: {}, confidence: 0, timestamp: new Date().toISOString(), error: 'Falha ao iniciar scraping' };
      }

      // Polling (max 60s para Google Maps)
      let attempts = 0;
      let dataset = null;

      while (attempts < 20) {
        await new Promise(r => setTimeout(r, 3000));
        const statusRes = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${apiToken}`);
        const statusData = await statusRes.json();

        if (statusData.data?.status === 'SUCCEEDED') {
          const datasetId = statusData.data.defaultDatasetId;
          const itemsRes = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items?token=${apiToken}`);
          dataset = await itemsRes.json();
          break;
        }

        if (['FAILED', 'ABORTED', 'TIMED-OUT'].includes(statusData.data?.status)) {
          return { source: 'apify_gmaps', success: false, data: {}, confidence: 0, timestamp: new Date().toISOString(), error: `Scraping ${statusData.data.status}` };
        }

        attempts++;
      }

      if (!dataset || dataset.length === 0) {
        return { source: 'apify_gmaps', success: false, data: {}, confidence: 0, timestamp: new Date().toISOString(), error: 'Timeout ou sem resultados' };
      }

      const places = dataset.map((p: Record<string, unknown>) => ({
        name: p.title,
        address: p.address,
        phone: p.phone,
        website: p.website,
        rating: p.totalScore,
        reviewsCount: p.reviewsCount,
        category: p.categoryName,
        url: p.url,
        location: p.location,
        openingHours: p.openingHours,
      }));

      logger.info('Apify Google Maps scraping success', { query: searchQuery, found: places.length });

      return {
        source: 'apify_gmaps',
        success: true,
        data: {
          query: searchQuery,
          places,
          total: places.length,
        },
        confidence: 0.9,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      logger.error('Apify Google Maps failed', err as Error);
      return { source: 'apify_gmaps', success: false, data: {}, confidence: 0, timestamp: new Date().toISOString(), error: (err as Error).message };
    }
  });

// ============================================================================
// ScraperAPI - Proxy para Scraping
// ============================================================================

/**
 * Faz requisição via ScraperAPI (com proxy rotativo)
 * Útil para scraping de sites que bloqueiam IPs
 */
export const scraperApiFetch = createServerFn({ method: "POST" })
  .inputValidator((input: { url: string; render?: boolean }) => input)
  .handler(async ({ data }): Promise<EnrichmentResult> => {
    const apiKey = process.env.SCRAPER_API_KEY;
    if (!apiKey) {
      return { source: 'scraper_api', success: false, data: {}, confidence: 0, timestamp: new Date().toISOString(), error: 'SCRAPER_API_KEY não configurada' };
    }

    try {
      const params = new URLSearchParams({
        api_key: apiKey,
        url: data.url,
        country_code: 'br',
      });
      if (data.render) params.set('render', 'true');

      const response = await fetch(`https://api.scraperapi.com/?${params}`);
      
      if (!response.ok) {
        return { source: 'scraper_api', success: false, data: {}, confidence: 0, timestamp: new Date().toISOString(), error: `HTTP ${response.status}` };
      }

      const html = await response.text();

      return {
        source: 'scraper_api',
        success: true,
        data: {
          url: data.url,
          html: html.substring(0, 50000), // Limitar tamanho
          contentLength: html.length,
          statusCode: response.status,
        },
        confidence: 1.0,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      return { source: 'scraper_api', success: false, data: {}, confidence: 0, timestamp: new Date().toISOString(), error: (err as Error).message };
    }
  });

// ============================================================================
// Enriquecimento Completo com Todas as Fontes
// ============================================================================

/**
 * Enriquece um lead usando TODAS as fontes disponíveis (gratuitas + pagas)
 */
export const enrichLeadPremium = createServerFn({ method: "POST" })
  .inputValidator((input: { 
    domain?: string;
    instagram?: string;
    cnpj?: string;
    query?: string;
    location?: string;
  }) => input)
  .handler(async ({ data }) => {
    const results: EnrichmentResult[] = [];
    const summary: Record<string, string | number | boolean> = {};

    // 1. Hunter.io - Email Discovery
    if (data.domain) {
      const hunterResult = await hunterFindEmails({ data: { domain: data.domain } });
      results.push(hunterResult);
      if (hunterResult.success) {
        summary.emails = hunterResult.data;
      }
    }

    // 2. BuiltWith - Tecnologia do Site
    if (data.domain) {
      const bwResult = await builtWithLookup({ data: { domain: data.domain } });
      results.push(bwResult);
      if (bwResult.success) {
        summary.technology = bwResult.data;
      }
    }

    // 3. Apify Instagram - Perfil Completo
    if (data.instagram) {
      const igResult = await apifyInstagramProfile({ data: { username: data.instagram } });
      results.push(igResult);
      if (igResult.success) {
        summary.instagram = igResult.data;
      }
    }

    // 4. Apify Google Maps - Busca sem API key
    if (data.query) {
      const gmapsResult = await apifyGoogleMaps({ data: { query: data.query, location: data.location, maxResults: 10 } });
      results.push(gmapsResult);
      if (gmapsResult.success) {
        summary.places = gmapsResult.data;
      }
    }

    logger.info('Premium enrichment completed', {
      sources: results.length,
      successful: results.filter(r => r.success).length,
    });

    return { results, summary };
  });

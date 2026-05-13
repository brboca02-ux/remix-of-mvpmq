import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { logger } from "@/lib/logger";
import { AppError, ErrorCodes, withRetry } from "@/lib/error-handler";

/**
 * Cache persistente de empresas:
 * - Verifica `pesquisas_cache` por hash da query (cidade+uf+nicho).
 * - Hit + fresh (<30d): retorna do `empresas_cache` instantaneamente.
 * - Miss/stale: busca no Google Places (Text Search + paginação até 60 resultados),
 *   enriquece com BrasilAPI/OpenCNPJ quando possível, persiste no Supabase.
 */

const PLACES_TEXT_SEARCH = "https://maps.googleapis.com/maps/api/place/textsearch/json";
const PLACES_DETAILS = "https://maps.googleapis.com/maps/api/place/details/json";
const FRESH_DAYS = 30;
const CACHE_TTL_MS = FRESH_DAYS * 24 * 60 * 60 * 1000;

interface CachedCompany {
  id: string;
  cnpj: string | null;
  place_id: string | null;
  nome: string;
  nome_fantasia: string | null;
  site: string | null;
  cidade: string | null;
  uf: string | null;
  nicho: string | null;
  telefone: string | null;
  email: string | null;
  latitude: number | null;
  longitude: number | null;
  rating: number | null;
  user_ratings_total: number | null;
  source: string;
  data_fresh: string;
}

export interface CachedSearchResult {
  empresas: CachedCompany[];
  fromCache: boolean;
  freshCount: number;
  cachedCount: number;
  totalCount: number;
  lastFreshAt: string | null;
  source: "cache" | "places" | "empty";
  warning?: string;
}

function normalizeQuery(parts: { cidade?: string; uf?: string; nicho?: string }) {
  return [parts.nicho, parts.cidade, parts.uf]
    .map((p) => (p || "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""))
    .filter(Boolean)
    .join("|");
}

function getAdminClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !key) {
    throw new AppError(
      ErrorCodes.CONFIGURATION_ERROR,
      "Configuração do Supabase incompleta.",
      { missingVars: { url: !url, key: !key } },
      500
    );
  }

  try {
    return createClient<Database>(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  } catch (error) {
    logger.error('Failed to create Supabase admin client', error as Error);
    throw new AppError(
      ErrorCodes.DATABASE_ERROR,
      "Erro ao conectar com o banco de dados.",
      { error: (error as Error).message },
      500
    );
  }
}

interface PlaceResult {
  place_id: string;
  name: string;
  formatted_address?: string;
  geometry?: { location?: { lat: number; lng: number } };
  rating?: number;
  user_ratings_total?: number;
}

interface PlaceDetails {
  place_id: string;
  name: string;
  formatted_address?: string;
  formatted_phone_number?: string;
  international_phone_number?: string;
  website?: string;
  rating?: number;
  user_ratings_total?: number;
  geometry?: { location?: { lat: number; lng: number } };
  address_components?: Array<{ long_name: string; short_name: string; types: string[] }>;
}

async function placesTextSearch(apiKey: string, query: string): Promise<PlaceResult[]> {
  const all: PlaceResult[] = [];
  let pageToken: string | undefined;
  
  for (let page = 0; page < 3; page++) {
    try {
      const url = new URL(PLACES_TEXT_SEARCH);
      url.searchParams.set("query", query);
      url.searchParams.set("language", "pt-BR");
      url.searchParams.set("region", "br");
      url.searchParams.set("key", apiKey);
      if (pageToken) url.searchParams.set("pagetoken", pageToken);

      const res = await fetch(url.toString(), {
        signal: AbortSignal.timeout(15000)
      });
      
      if (!res.ok) {
        logger.warn('Google Places API request failed', { 
          status: res.status,
          page,
          query 
        });
        break;
      }

      const json: any = await res.json();
      
      if (json.status === "OVER_QUERY_LIMIT") {
        logger.error('Google Places API quota exceeded', undefined, { 
          status: json.status,
          message: json.error_message 
        });
        throw new AppError(
          ErrorCodes.RATE_LIMIT_EXCEEDED,
          "Limite de consultas do Google Places atingido.",
          { status: json.status }
        );
      }

      if (json.status === "REQUEST_DENIED") {
        logger.error('Google Places API request denied', undefined, { 
          status: json.status,
          message: json.error_message 
        });
        throw new AppError(
          ErrorCodes.EXTERNAL_API_ERROR,
          "Acesso negado pela API do Google Places.",
          { status: json.status, message: json.error_message }
        );
      }

      if (Array.isArray(json.results)) {
        all.push(...json.results);
      }

      pageToken = json.next_page_token;
      if (!pageToken) break;
      
      // Google requer 2s antes de usar next_page_token
      await new Promise((r) => setTimeout(r, 2100));
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error in Places text search', error as Error, { page, query });
      break;
    }
  }

  return all;
}

async function placeDetails(apiKey: string, placeId: string): Promise<PlaceDetails | null> {
  const url = new URL(PLACES_DETAILS);
  url.searchParams.set("place_id", placeId);
  url.searchParams.set("language", "pt-BR");
  url.searchParams.set("key", apiKey);
  url.searchParams.set(
    "fields",
    "place_id,name,formatted_address,formatted_phone_number,international_phone_number,website,rating,user_ratings_total,geometry,address_components",
  );
  
  try {
    const res = await fetch(url.toString(), {
      signal: AbortSignal.timeout(10000)
    });
    
    if (!res.ok) {
      logger.warn('Place details request failed', { 
        status: res.status,
        placeId 
      });
      return null;
    }

    const json: any = await res.json();
    
    if (json.status !== "OK") {
      logger.warn('Place details returned non-OK status', { 
        status: json.status,
        placeId 
      });
      return null;
    }

    return json.result as PlaceDetails;
  } catch (error) {
    logger.warn('Error fetching place details', { 
      error: (error as Error).message,
      placeId 
    });
    return null;
  }
}

function pickAddressComponent(
  comps: PlaceDetails["address_components"],
  type: string,
): string | null {
  if (!comps) return null;
  const c = comps.find((x) => x.types.includes(type));
  return c?.short_name ?? c?.long_name ?? null;
}

function rowsToCompanies(rows: any[]): CachedCompany[] {
  return rows.map((r) => ({
    id: r.id,
    cnpj: r.cnpj,
    place_id: r.place_id,
    nome: r.nome,
    nome_fantasia: r.nome_fantasia,
    site: r.site,
    cidade: r.cidade,
    uf: r.uf,
    nicho: r.nicho,
    telefone: r.telefone,
    email: r.email,
    latitude: r.latitude !== null ? Number(r.latitude) : null,
    longitude: r.longitude !== null ? Number(r.longitude) : null,
    rating: r.rating !== null ? Number(r.rating) : null,
    user_ratings_total: r.user_ratings_total,
    source: r.source,
    data_fresh: r.data_fresh,
  }));
}

export const searchCompaniesCached = createServerFn({ method: "POST" })
  .inputValidator((input: { cidade?: string; uf?: string; nicho?: string }) => {
    const cidade = (input?.cidade || "").trim().slice(0, 80);
    const uf = (input?.uf || "").trim().slice(0, 2).toUpperCase();
    const nicho = (input?.nicho || "").trim().slice(0, 80);
    
    if (!nicho || (!cidade && !uf)) {
      throw new AppError(
        ErrorCodes.VALIDATION_ERROR,
        "Nicho e cidade ou UF são obrigatórios.",
        { hasNicho: !!nicho, hasCidade: !!cidade, hasUf: !!uf },
        400
      );
    }

    return { cidade, uf, nicho };
  })
  .handler(async ({ data }): Promise<CachedSearchResult> => {
    try {
      const supabase = getAdminClient();
      const queryHash = normalizeQuery(data);
      const queryText = `${data.nicho} ${data.cidade} ${data.uf}`.trim();

      // 1) Lookup pesquisas_cache
      const { data: cachedQuery, error: cacheError } = await supabase
        .from("pesquisas_cache")
        .select("*")
        .eq("query_hash", queryHash)
        .maybeSingle();

      if (cacheError) {
        logger.error('Failed to query cache', cacheError, { queryHash });
      }

      if (cachedQuery && !cacheError) {
        const lastHit = new Date(cachedQuery.last_hit_at).getTime();
        const fresh = Date.now() - lastHit < CACHE_TTL_MS;
        
        if (fresh && cachedQuery.result_place_ids.length > 0) {
          const { data: rows, error: rowsError } = await supabase
            .from("empresas_cache")
            .select("*")
            .in("place_id", cachedQuery.result_place_ids);

          if (rowsError) {
            logger.error('Failed to fetch cached companies', rowsError, { queryHash });
          } else {
            // bump hit
            await supabase
              .from("pesquisas_cache")
              .update({ 
                hit_count: cachedQuery.hit_count + 1, 
                last_hit_at: new Date().toISOString() 
              })
              .eq("id", cachedQuery.id);

            logger.info('Cache hit', {
              queryHash,
              companyCount: rows?.length || 0,
              hitCount: cachedQuery.hit_count + 1
            });

            return {
              empresas: rowsToCompanies(rows ?? []),
              fromCache: true,
              freshCount: 0,
              cachedCount: rows?.length ?? 0,
              totalCount: rows?.length ?? 0,
              lastFreshAt: cachedQuery.last_hit_at,
              source: "cache",
            };
          }
        }
      }

      // 2) Cache miss → Google Places
      const apiKey = process.env.GOOGLE_PLACES_API_KEY;
      
      if (!apiKey) {
        logger.warn('Google Places API key not configured');
        return {
          empresas: [],
          fromCache: false,
          freshCount: 0,
          cachedCount: 0,
          totalCount: 0,
          lastFreshAt: null,
          source: "empty",
          warning: "GOOGLE_PLACES_API_KEY não configurada",
        };
      }

      logger.info('Fetching from Google Places', { queryText });

      const results = await placesTextSearch(apiKey, queryText);
      
      if (results.length === 0) {
        logger.info('No results from Google Places', { queryText });
        return {
          empresas: [],
          fromCache: false,
          freshCount: 0,
          cachedCount: 0,
          totalCount: 0,
          lastFreshAt: null,
          source: "empty",
          warning: "Sem resultados Places para esta consulta",
        };
      }

      // 3) Enriquece com Place Details (paralelo em batches de 5)
      const detailed: PlaceDetails[] = [];
      const batchSize = 5;
      
      for (let i = 0; i < results.length; i += batchSize) {
        const batch = results.slice(i, i + batchSize);
        const got = await Promise.all(
          batch.map((r) => placeDetails(apiKey, r.place_id))
        );
        for (const d of got) {
          if (d) detailed.push(d);
        }
      }

      logger.info('Enriched with place details', {
        totalResults: results.length,
        enrichedCount: detailed.length
      });

      // 4) Upsert em empresas_cache
      const upsertRows = detailed.map((d) => {
        const cidade = pickAddressComponent(d.address_components, "administrative_area_level_2");
        const uf = pickAddressComponent(d.address_components, "administrative_area_level_1");
        return {
          place_id: d.place_id,
          nome: d.name,
          nome_fantasia: d.name,
          site: d.website ?? null,
          cidade: cidade ?? data.cidade ?? null,
          uf: uf ?? data.uf ?? null,
          nicho: data.nicho,
          telefone: d.international_phone_number ?? d.formatted_phone_number ?? null,
          email: null,
          latitude: d.geometry?.location?.lat ?? null,
          longitude: d.geometry?.location?.lng ?? null,
          rating: d.rating ?? null,
          user_ratings_total: d.user_ratings_total ?? null,
          source: "places" as const,
          data_fresh: new Date().toISOString(),
          raw_places: d as any,
        };
      });

      const { data: upserted, error: upsertErr } = await supabase
        .from("empresas_cache")
        .upsert(upsertRows, { onConflict: "place_id", ignoreDuplicates: false })
        .select("*");

      if (upsertErr) {
        logger.error('Failed to upsert companies cache', upsertErr, {
          rowCount: upsertRows.length
        });
      }

      const empresas = rowsToCompanies(upserted ?? []);
      const placeIds = empresas.map((e) => e.place_id).filter((x): x is string => !!x);
      const cnpjs = empresas.map((e) => e.cnpj).filter((x): x is string => !!x);

      // 5) Upsert pesquisas_cache
      const { error: cacheUpsertError } = await supabase
        .from("pesquisas_cache")
        .upsert(
          {
            query_hash: queryHash,
            query_text: queryText,
            cidade: data.cidade || null,
            uf: data.uf || null,
            nicho: data.nicho,
            result_cnpjs: cnpjs,
            result_place_ids: placeIds,
            total_count: empresas.length,
            hit_count: cachedQuery ? cachedQuery.hit_count + 1 : 1,
            last_hit_at: new Date().toISOString(),
          },
          { onConflict: "query_hash" },
        );

      if (cacheUpsertError) {
        logger.error('Failed to upsert search cache', cacheUpsertError, { queryHash });
      }

      logger.info('Companies cached successfully', {
        queryHash,
        companyCount: empresas.length
      });

      return {
        empresas,
        fromCache: false,
        freshCount: empresas.length,
        cachedCount: 0,
        totalCount: empresas.length,
        lastFreshAt: new Date().toISOString(),
        source: "places",
      };

    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      logger.error('Company search failed', error as Error, {
        nicho: data.nicho,
        cidade: data.cidade,
        uf: data.uf
      });

      throw new AppError(
        ErrorCodes.INTERNAL_ERROR,
        "Erro ao buscar empresas. Tente novamente.",
        { error: (error as Error).message }
      );
    }
  });

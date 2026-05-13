// @ts-nocheck
import { createServerFn } from "@tanstack/react-start";
import { normalizeLead, withFallback, type StandardLead } from "@/lib/leads-shared";
import { supabaseAdmin as getSupabase } from "@/integrations/supabase/client.server";
import { logger as Logger } from "@/lib/logger";
import { internalEnqueueJob, internalUpdateJobStatus, internalAppendJobEvent } from "@/server/jobs.server";

const PLACES_KEY = () => process.env.GOOGLE_PLACES_API_KEY;

interface PlaceTextResult {
  place_id: string;
  name: string;
  formatted_address?: string;
  rating?: number;
  user_ratings_total?: number;
}

interface PlaceDetail {
  place_id: string;
  name: string;
  formatted_phone_number?: string;
  international_phone_number?: string;
  website?: string;
  formatted_address?: string;
  rating?: number;
  user_ratings_total?: number;
  address_components?: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
}

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

// Google Places API response types
interface GooglePlacesTextResponse {
  status: string;
  results?: PlaceTextResult[];
  next_page_token?: string;
  error_message?: string;
}

interface GooglePlacesDetailsResponse {
  status: string;
  result?: PlaceDetail;
  error_message?: string;
}

/**
 * Enrichment via Google Places
 */
async function textSearchPaged(query: string, key: string): Promise<PlaceTextResult[]> {
  return withFallback(async () => {
    const out: PlaceTextResult[] = [];
    let pageToken: string | undefined;
    for (let page = 0; page < 3; page++) {
      const url = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json");
      url.searchParams.set("query", query);
      url.searchParams.set("key", key);
      if (pageToken) url.searchParams.set("pagetoken", pageToken);

      const res = await fetch(url.toString());
      const json = (await res.json()) as GooglePlacesTextResponse;
      if (json.status && json.status !== "OK") {
        Logger.warn("Places status", json.status);
        break;
      }
      for (const r of json.results ?? []) out.push(r);
      pageToken = json.next_page_token;
      if (!pageToken) break;
      await sleep(2100);
    }
    return out;
  }, [], `Busca por: ${query}`);
}

async function fetchPlaceDetails(placeId: string, key: string): Promise<PlaceDetail | null> {
  return withFallback(async () => {
    const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
    url.searchParams.set("place_id", placeId);
    url.searchParams.set("fields", "place_id,name,formatted_phone_number,international_phone_number,website,formatted_address,rating,user_ratings_total,address_components");
    url.searchParams.set("key", key);
    const res = await fetch(url.toString());
    const json = (await res.json()) as GooglePlacesDetailsResponse;
    return json.status === "OK" ? json.result ?? null : null;
  }, null, `Detalhes: ${placeId}`);
}

function extractGeo(detail: PlaceDetail) {
  const geo = { cidade: "", uf: "", bairro: "", cep: "" };
  for (const c of detail.address_components ?? []) {
    if (c.types.includes("administrative_area_level_2")) geo.cidade = c.long_name;
    if (c.types.includes("administrative_area_level_1")) geo.uf = c.short_name;
    if (c.types.includes("sublocality")) geo.bairro = c.long_name;
    if (c.types.includes("postal_code")) geo.cep = c.long_name;
  }
  return geo;
}

// ==========================================================
// PLACES JOBS
// ==========================================================

export const searchPlacesIds = createServerFn({ method: "POST" })
  .inputValidator((input: { cidade: string; uf: string; nicho?: string }) => input)
  .handler(async ({ data }) => {
    const key = PLACES_KEY();
    if (!key) throw new Error("Chave do Google Places não configurada.");

    const queries = [
      `${data.nicho || "energia solar"} ${data.cidade} ${data.uf}`,
      `empresa ${data.nicho || "fotovoltaica"} ${data.cidade} ${data.uf}`
    ];
    
    const seen = new Map<string, string>(); // place_id -> name
    for (const q of queries) {
      const results = await textSearchPaged(q, key);
      for (const r of results) if (r.place_id) seen.set(r.place_id, r.name);
    }

     const result = { 
       places: Array.from(seen.entries()).map(([id, name]) => ({ id, name })),
       total: seen.size 
     };
     
     // Create a persistent job for this search
     const supabase = getSupabase;
     const { data: { user } } = await supabase.auth.getUser();
     await internalEnqueueJob({
       tipo: "places_search",
       payload: data,
       idempotencyKey: `places_search_${data.cidade}_${data.uf}_${data.nicho || 'solar'}_${Date.now()}`,
       ownerUserId: user?.id
     });
 
     return result;
  });

export const processPlacesChunk = createServerFn({ method: "POST" })
  .inputValidator((input: { job_id: string; place_ids: string[]; nicho: string; cidade: string; uf: string; minScore: number }) => input)
  .handler(async ({ data }) => {
    const key = PLACES_KEY();
    if (!key) throw new Error("API Key missing");

    const supabase = getSupabase;
    const finalLeads: any[] = [];
    const errors: any[] = [];

     // Find or create mirror job
     const mirrorJobKey = `places_bulk_${data.job_id}`;
     const { data: { user } } = await supabase.auth.getUser();
     const mirrorJob = await internalEnqueueJob({
       tipo: "places_bulk",
       payload: data,
       idempotencyKey: mirrorJobKey,
       ownerUserId: user?.id
     });
 
     await internalUpdateJobStatus({ jobId: mirrorJob.id, status: "running" });
 
     for (const placeId of data.place_ids) {
       try {
         await internalAppendJobEvent({
           jobId: mirrorJob.id,
           eventType: "external_call_started",
           level: "info",
           message: `Buscando detalhes do local: ${placeId}`,
           metadata: { placeId }
         });
 
         const d = await fetchPlaceDetails(placeId, key);
        if (!d) continue;

        const geo = extractGeo(d);
        let score = 0;
        if (d.formatted_phone_number) score += 25;
        if (d.website) score += 25;
        if ((d.rating ?? 0) > 4) score += 25;
        if ((d.user_ratings_total ?? 0) > 10) score += 25;

        if (score < data.minScore) continue;

        const lead = normalizeLead({
          cnpj: `PLACES:${d.place_id}`,
          nome: d.name,
          fantasia: d.name,
          telefone: d.international_phone_number || d.formatted_phone_number,
          site: d.website,
          cidade: geo.cidade || data.cidade,
          uf: geo.uf || data.uf,
          bairro: geo.bairro,
          cep: geo.cep,
          nicho: data.nicho,
          source: "google_places",
          raw: { place_id: d.place_id, rating: d.rating, score }
        });

         const { error } = await supabase.from("leads_import").upsert(lead as any, { onConflict: "cnpj" });
         if (error) throw error;
         
         await internalAppendJobEvent({
           jobId: mirrorJob.id,
           eventType: "external_call_completed",
           level: "info",
           message: `Lead processado: ${d.name}`,
           metadata: { placeId, name: d.name }
         });
 
         finalLeads.push(lead);
       } catch (err: any) {
         await internalAppendJobEvent({
           jobId: mirrorJob.id,
           eventType: "external_call_failed",
           level: "error",
           message: `Erro ao processar local ${placeId}: ${err.message}`,
           metadata: { placeId, error: err.message }
         });
        errors.push({
          job_id: data.job_id,
          error_message: err.message,
          raw_payload: { placeId }
        });
      }
    }

    if (errors.length > 0) {
      await supabase.from("lead_import_errors").insert(errors);
    }

    // Atualiza job status
    const { data: job } = await supabase.from("lead_import_jobs").select("*").eq("id", data.job_id).single();
    if (job) {
      const newProcessed = (job.processed_rows || 0) + data.place_ids.length;
      const newSuccess = (job.success_rows || 0) + finalLeads.length;
      const newFailed = (job.failed_rows || 0) + (data.place_ids.length - finalLeads.length);
      
      const isFinished = newProcessed >= (job.total_rows || 0);
      
       await supabase.from("lead_import_jobs").update({
         processed_rows: newProcessed,
         success_rows: newSuccess,
         failed_rows: newFailed,
         status: isFinished ? "completed" : "processing",
         finished_at: isFinished ? new Date().toISOString() : null
       }).eq("id", data.job_id);
 
       await internalUpdateJobStatus({
         jobId: mirrorJob.id,
         status: isFinished ? "done" : "running",
         result: isFinished ? { processed: newProcessed, success: newSuccess } : undefined
       });
    }

    return { processed: data.place_ids.length };
  });

// Legado / Atalho
export const bulkImportFromPlaces = createServerFn({ method: "POST" })
  .inputValidator((input: { cidade: string; uf: string; nicho?: string; minScore?: number }) => {
    return {
      cidade: input.cidade.trim(),
      uf: input.uf.trim().toUpperCase(),
      nicho: input.nicho?.trim() || "solar",
      minScore: input.minScore ?? 0,
    };
  })
  .handler(async ({ data }) => {
    // Agora apenas delegamos ou mantemos para compatibilidade se não quisermos quebrar nada
    // Mas o ideal é que o front use as novas funções
    return { status: "deprecated", message: "Use searchPlacesIds + processPlacesChunk" };
  });

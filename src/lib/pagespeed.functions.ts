import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { AppError, ErrorCodes } from "@/lib/error-handler";

const inputSchema = z.object({
  url: z.string().min(3, "URL muito curta").max(500, "URL muito longa"),
});

export type PageSpeedResult =
  | {
      ok: true;
      score: number; // 0-100
      lcp: number | null; // ms
      cls: number | null;
      fcp: number | null; // ms
      strategy: "mobile";
      cached?: boolean;
      fallback?: boolean;
      reason?: string;
    }
  | { ok: false; error: string };

const TTL_MS = 24 * 60 * 60 * 1000;
const cache = new Map<string, { result: PageSpeedResult; expiresAt: number }>();

function normalizeUrl(raw: string): string {
  let u = raw.trim().toLowerCase();
  if (!/^https?:\/\//i.test(u)) u = `https://${u}`;
  try {
    const parsed = new URL(u);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return u;
  }
}

async function probeSite(url: string): Promise<{ alive: boolean; https: boolean }> {
  const https = url.startsWith("https://");
  
  try {
    const res = await fetch(url, {
      method: "HEAD",
      signal: AbortSignal.timeout(3500),
      redirect: "follow",
    });
    return { 
      alive: res.ok || (res.status >= 200 && res.status < 500), 
      https 
    };
  } catch (headError) {
    // try GET as some servers reject HEAD
    try {
      const res = await fetch(url, {
        method: "GET",
        signal: AbortSignal.timeout(3500),
        redirect: "follow",
      });
      return { alive: res.ok, https };
    } catch (getError) {
      logger.warn('Site probe failed', { 
        url,
        headError: (headError as Error).message,
        getError: (getError as Error).message 
      });
      return { alive: false, https };
    }
  }
}

async function heuristicFallback(url: string, reason: string): Promise<PageSpeedResult> {
  try {
    const probe = await probeSite(url);
    let score = 30;
    
    if (probe.alive && probe.https) {
      score = 75;
    } else if (probe.alive) {
      score = 55;
    }

    logger.info('Using heuristic fallback for PageSpeed', {
      url,
      reason,
      score,
      alive: probe.alive,
      https: probe.https
    });

    return {
      ok: true,
      score,
      lcp: null,
      cls: null,
      fcp: null,
      strategy: "mobile",
      fallback: true,
      reason,
    };
  } catch (error) {
    logger.error('Heuristic fallback failed', error as Error, { url, reason });
    return {
      ok: true,
      score: 30,
      lcp: null,
      cls: null,
      fcp: null,
      strategy: "mobile",
      fallback: true,
      reason: `${reason} (probe failed)`,
    };
  }
}

export const analyzePageSpeed = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => {
    try {
      return inputSchema.parse(input);
    } catch (error) {
      throw new AppError(
        ErrorCodes.VALIDATION_ERROR,
        "URL inválida.",
        { error: (error as Error).message },
        400
      );
    }
  })
  .handler(async ({ data }): Promise<PageSpeedResult> => {
    try {
      const target = normalizeUrl(data.url);

      // Cache hit
      const hit = cache.get(target);
      if (hit && hit.expiresAt > Date.now()) {
        logger.debug('PageSpeed cache hit', { url: target });
        return { ...hit.result, cached: true } as PageSpeedResult;
      }

      logger.info('Analyzing PageSpeed', { url: target });

      const psiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(target)}&strategy=mobile&category=performance`;
      
      const res = await fetch(psiUrl, { 
        signal: AbortSignal.timeout(25000) 
      });

      if (res.status === 429) {
        logger.warn('Google PSI rate limit exceeded', { url: target });
        const fb = await heuristicFallback(target, "Limite Google PSI atingido (429)");
        cache.set(target, { result: fb, expiresAt: Date.now() + 60 * 60 * 1000 }); // cache fallback 1h
        return fb;
      }

      if (!res.ok) {
        logger.warn('Google PSI request failed', { 
          status: res.status,
          url: target 
        });
        const fb = await heuristicFallback(target, `PSI API ${res.status}`);
        cache.set(target, { result: fb, expiresAt: Date.now() + 60 * 60 * 1000 });
        return fb;
      }

      const json: any = await res.json();
      const lhr = json?.lighthouseResult;
      const perf = lhr?.categories?.performance?.score;
      const audits = lhr?.audits ?? {};
      const lcp = audits["largest-contentful-paint"]?.numericValue ?? null;
      const cls = audits["cumulative-layout-shift"]?.numericValue ?? null;
      const fcp = audits["first-contentful-paint"]?.numericValue ?? null;

      const result: PageSpeedResult = {
        ok: true,
        score: typeof perf === "number" ? Math.round(perf * 100) : 0,
        lcp: typeof lcp === "number" ? Math.round(lcp) : null,
        cls: typeof cls === "number" ? Math.round(cls * 1000) / 1000 : null,
        fcp: typeof fcp === "number" ? Math.round(fcp) : null,
        strategy: "mobile",
      };

      cache.set(target, { result, expiresAt: Date.now() + TTL_MS });

      logger.info('PageSpeed analysis completed', {
        url: target,
        score: result.score,
        lcp: result.lcp,
        cls: result.cls
      });

      return result;

    } catch (error) {
      const msg = error instanceof Error ? error.message : "Erro desconhecido";
      
      logger.error('PageSpeed analysis failed', error as Error, { 
        url: data.url 
      });

      const target = normalizeUrl(data.url);
      const fb = await heuristicFallback(target, `Falha de rede: ${msg}`);
      cache.set(target, { result: fb, expiresAt: Date.now() + 60 * 60 * 1000 });
      
      return fb;
    }
  });

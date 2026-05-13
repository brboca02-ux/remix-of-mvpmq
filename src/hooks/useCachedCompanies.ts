import { useEffect, useState } from "react";
import { searchCompaniesCached, type CachedSearchResult } from "@/server/companies-cache.functions";
import type { Company, CompanyPorte } from "@/lib/company-types";
import { logger } from "@/lib/logger";

const CNAE_TO_NICHO: Record<string, string> = {
  "4321-5": "energia solar fotovoltaica",
  "3511-5": "geração de energia solar",
  "5611-2": "restaurante",
  "5612-1": "lanchonete",
  "4721-1": "padaria",
  "4711-3": "supermercado",
  "4771-7": "farmácia",
  "8630-5": "clínica estética",
  "9602-5": "salão de beleza",
  "9312-3": "academia",
  "6201-5": "empresa de software",
  "7319-0": "agência de marketing",
  "7020-4": "consultoria empresarial",
  "4781-4": "loja de roupas",
  "4120-4": "construtora",
  "5510-8": "hotel",
  "4930-2": "transportadora",
  "2511-0": "metalúrgica",
};

const UF_NAMES: Record<string, string> = {
  SC: "Santa Catarina", SP: "São Paulo", RJ: "Rio de Janeiro", MG: "Minas Gerais",
  PR: "Paraná", RS: "Rio Grande do Sul", BA: "Bahia", PE: "Pernambuco",
  CE: "Ceará", GO: "Goiás", DF: "Distrito Federal", ES: "Espírito Santo",
};

function pickNicho(cnaeCodes: string[], fallbackText: string): string | null {
  for (const code of cnaeCodes) {
    if (CNAE_TO_NICHO[code]) return CNAE_TO_NICHO[code];
  }
  // Fallback: usa texto livre se tiver algo razoável
  const cleaned = fallbackText.trim();
  return cleaned.length >= 4 ? cleaned : null;
}

function porteFromUserRatings(total: number | null): CompanyPorte {
  if (!total) return "Micro";
  if (total > 500) return "Grande";
  if (total > 150) return "Média";
  if (total > 30) return "Pequena";
  return "Micro";
}

function scoreFromRating(rating: number | null, total: number | null): number {
  const r = rating ?? 3.5;
  const t = total ?? 0;
  return Math.min(100, Math.round(r * 15 + Math.min(40, t / 5)));
}

function adapt(empresas: CachedSearchResult["empresas"], nicho: string): Company[] {
  return empresas.map((e) => ({
    id: `cache_${e.id}`,
    nome: e.nome_fantasia || e.nome,
    cnpj: e.cnpj || "—",
    cnaeCode: "—",
    cnaeLabel: nicho,
    sector: nicho,
    porte: porteFromUserRatings(e.user_ratings_total),
    estado: e.uf || "—",
    cidade: e.cidade || "—",
    email: e.email ?? undefined,
    telefone: e.telefone ?? undefined,
    site: e.site ?? undefined,
    status: "ativa",
    faturamentoEstimado: 0,
    funcionarios: 0,
    capitalSocial: 0,
    dataAbertura: "",
    regime: "Simples",
    tecnografia: e.site ? "WordPress" : "Nenhum",
    socios: [],
    score: scoreFromRating(e.rating, e.user_ratings_total),
  }));
}

export interface UseCachedCompaniesArgs {
  cnaeCodes: string[];
  cidades: string[];
  estados: string[];
  text: string;
  enabled: boolean;
}

export interface UseCachedCompaniesResult {
  companies: Company[];
  loading: boolean;
  fromCache: boolean;
  freshCount: number;
  cachedCount: number;
  lastFreshAt: string | null;
  source: "cache" | "places" | "empty" | "idle";
  warning?: string;
  query: { nicho: string | null; cidade: string; uf: string };
}

const memoryCache = new Map<string, { at: number; data: CachedSearchResult; nicho: string }>();
const MEM_TTL = 5 * 60 * 1000;

export function useCachedCompanies(args: UseCachedCompaniesArgs): UseCachedCompaniesResult {
  const { cnaeCodes, cidades, estados, text, enabled } = args;

  const cidade = cidades[0] || "";
  const uf = estados[0] || "";
  const nicho = pickNicho(cnaeCodes, text);
  const cidadeOuUf = cidade || (uf ? UF_NAMES[uf] || uf : "");

  const canFetch = enabled && !!nicho && !!cidadeOuUf;
  const key = `${nicho}|${cidade}|${uf}`;

  const [state, setState] = useState<UseCachedCompaniesResult>({
    companies: [],
    loading: false,
    fromCache: false,
    freshCount: 0,
    cachedCount: 0,
    lastFreshAt: null,
    source: "idle",
    query: { nicho, cidade, uf },
  });

  useEffect(() => {
    if (!canFetch || !nicho) {
      setState((s) => ({ ...s, companies: [], source: "idle", loading: false, query: { nicho, cidade, uf } }));
      return;
    }

    const mem = memoryCache.get(key);
    if (mem && Date.now() - mem.at < MEM_TTL) {
      setState({
        companies: adapt(mem.data.empresas, mem.nicho),
        loading: false,
        fromCache: mem.data.fromCache,
        freshCount: mem.data.freshCount,
        cachedCount: mem.data.cachedCount,
        lastFreshAt: mem.data.lastFreshAt,
        source: mem.data.source,
        warning: mem.data.warning,
        query: { nicho, cidade, uf },
      });
      return;
    }

    let cancelled = false;
    setState((s) => ({ ...s, loading: true, source: "idle", query: { nicho, cidade, uf } }));

    searchCompaniesCached({ data: { cidade, uf, nicho } })
      .then((res) => {
        if (cancelled) return;
        memoryCache.set(key, { at: Date.now(), data: res, nicho });
        setState({
          companies: adapt(res.empresas, nicho),
          loading: false,
          fromCache: res.fromCache,
          freshCount: res.freshCount,
          cachedCount: res.cachedCount,
          lastFreshAt: res.lastFreshAt,
          source: res.source,
          warning: res.warning,
          query: { nicho, cidade, uf },
        });
      })
      .catch((err) => {
        if (cancelled) return;
        logger.error("Failed to search cached companies", err instanceof Error ? err : undefined, {
          nicho,
          cidade,
          uf,
        });
        setState({
          companies: [],
          loading: false,
          fromCache: false,
          freshCount: 0,
          cachedCount: 0,
          lastFreshAt: null,
          source: "empty",
          warning: String(err?.message || "Erro ao buscar empresas"),
          query: { nicho, cidade, uf },
        });
      });

    return () => { cancelled = true; };
  }, [canFetch, key, nicho, cidade, uf]);

  return state;
}

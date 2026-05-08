import { useEffect, useMemo, useState } from "react";
import { getMockCompanies } from "@/lib/mock-companies";
import { getCnaeByCode } from "@/lib/cnae-data";
import { computeDigitalScore } from "@/lib/digital-score";
import type { Company, CompanyFilter, CompanyPorte } from "@/lib/company-types";

function useDebounced<T>(value: T, ms = 250): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export interface SearchResult {
  all: Company[];
  page: Company[];
  total: number;
  potencialMensal: number;
  qualidadeScore: number;
  distribuicaoPorte: Record<CompanyPorte, number>;
  distribuicaoEstado: Record<string, number>;
  distribuicaoCnae: { code: string; label: string; count: number }[];
}

export function useCompanySearch(
  filter: CompanyFilter,
  page: number,
  perPage = 25,
  sortBy: "nome" | "cidade" | "porte" | "score" | "digital" = "score",
  extraCompanies: Company[] = [],
): SearchResult {
  const debouncedText = useDebounced(filter.text, 200);
  const baseCompanies = useMemo(() => getMockCompanies(), []);
  const companies = useMemo(() => {
    if (!extraCompanies.length) return baseCompanies;
    const seen = new Set<string>();
    const merged: Company[] = [];
    for (const c of [...extraCompanies, ...baseCompanies]) {
      const key = c.cnpj && c.cnpj !== "—" ? c.cnpj : `id:${c.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(c);
    }
    return merged;
  }, [baseCompanies, extraCompanies]);

  const filtered = useMemo(() => {
    const text = debouncedText.trim().toLowerCase();
    const porteOrder: Record<CompanyPorte, number> = {
      MEI: 1, Micro: 2, Pequena: 3, "Média": 4, Grande: 5,
    };
    const out = companies.filter((c) => {
      if (filter.onlyAtivas && c.status !== "ativa") return false;
      if (filter.cnaeCodes.length && !filter.cnaeCodes.includes(c.cnaeCode)) return false;
      if (filter.portes.length && !filter.portes.includes(c.porte)) return false;
      if (filter.estados.length && !filter.estados.includes(c.estado)) return false;
      if (filter.cidades.length && !filter.cidades.includes(c.cidade)) return false;
      if (filter.hasEmail && !c.email) return false;
      if (filter.hasTelefone && !c.telefone) return false;
      if (filter.hasSite && !c.site) return false;
      if (filter.regimes.length && !filter.regimes.includes(c.regime)) return false;
      if (filter.tecnografias.length && !filter.tecnografias.includes(c.tecnografia)) return false;
      if (filter.digitalLevels.length || filter.digitalScoreMin > 0) {
        const ds = computeDigitalScore(c);
        if (filter.digitalLevels.length && !filter.digitalLevels.includes(ds.level)) return false;
        if (ds.score < filter.digitalScoreMin) return false;
      }
      if (text) {
        const hay = `${c.nome} ${c.cnpj} ${c.cidade} ${c.estado} ${c.cnaeLabel} ${c.sector}`.toLowerCase();
        if (!hay.includes(text)) return false;
      }
      return true;
    });

    out.sort((a, b) => {
      if (sortBy === "nome") return a.nome.localeCompare(b.nome);
      if (sortBy === "cidade") return a.cidade.localeCompare(b.cidade);
      if (sortBy === "porte") return porteOrder[a.porte] - porteOrder[b.porte];
      if (sortBy === "digital")
        return computeDigitalScore(b).score - computeDigitalScore(a).score;
      return b.score - a.score;
    });
    return out;
  }, [companies, debouncedText, filter, sortBy]);

  const total = filtered.length;
  const start = (page - 1) * perPage;
  const pageItems = filtered.slice(start, start + perPage);

  const potencialMensal = useMemo(() => {
    let sum = 0;
    for (const c of filtered) {
      const cnae = getCnaeByCode(c.cnaeCode);
      if (cnae) sum += cnae.ticketMedio;
    }
    return sum;
  }, [filtered]);

  const qualidadeScore = useMemo(() => {
    if (!filtered.length) return 0;
    const avg = filtered.reduce((s, c) => s + c.score, 0) / filtered.length;
    return Math.round(avg);
  }, [filtered]);

  const distribuicaoPorte = useMemo(() => {
    const d: Record<CompanyPorte, number> = { MEI: 0, Micro: 0, Pequena: 0, "Média": 0, Grande: 0 };
    for (const c of filtered) d[c.porte]++;
    return d;
  }, [filtered]);

  const distribuicaoEstado = useMemo(() => {
    const d: Record<string, number> = {};
    for (const c of filtered) d[c.estado] = (d[c.estado] || 0) + 1;
    return d;
  }, [filtered]);

  const distribuicaoCnae = useMemo(() => {
    const m = new Map<string, { label: string; count: number }>();
    for (const c of filtered) {
      const cur = m.get(c.cnaeCode);
      if (cur) cur.count++;
      else m.set(c.cnaeCode, { label: c.cnaeLabel, count: 1 });
    }
    return Array.from(m.entries())
      .map(([code, v]) => ({ code, label: v.label, count: v.count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [filtered]);

  return {
    all: filtered,
    page: pageItems,
    total,
    potencialMensal,
    qualidadeScore,
    distribuicaoPorte,
    distribuicaoEstado,
    distribuicaoCnae,
  };
}

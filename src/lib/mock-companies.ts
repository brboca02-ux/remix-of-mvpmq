import type { Company } from "./company-types";
import { REAL_COMPANIES } from "./real-companies";

/**
 * Catálogo de empresas exibidas no /buscador.
 *
 * MUDANÇA (2026-04): Removida geração de dados fictícios. Apenas empresas
 * reais e verificadas são retornadas aqui — empresas dinâmicas vêm do
 * Google Places via `useCachedCompanies` quando o usuário aplica filtro
 * de cidade/UF + nicho.
 */

let cache: Company[] | null = null;

export function getMockCompanies(): Company[] {
  if (cache) return cache;
  cache = [...REAL_COMPANIES];
  console.log(`Catálogo verificado: ${cache.length} empresas reais (sem demos).`);
  return cache;
}

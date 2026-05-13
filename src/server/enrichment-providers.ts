/**
 * Enrichment Providers - Fontes de Dados Gratuitas (Sem Cadastro)
 * 
 * APIs públicas que não requerem API key ou cadastro.
 * Todas são gratuitas e ilimitadas (ou com limites muito altos).
 * 
 * Fontes implementadas:
 * - ViaCEP: CEP → endereço completo
 * - IBGE API: Dados demográficos por cidade/estado
 * - CNPJ.ws: Consulta CNPJ alternativa
 * - Open CNPJ: Dados da Receita Federal (base aberta)
 * 
 * @module server/enrichment-providers
 */

import { createServerFn } from "@tanstack/react-start";
import { logger } from "@/lib/logger";

// ============================================================================
// Types
// ============================================================================

export interface ViaCepResult {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string; // cidade
  uf: string;
  ibge: string; // código IBGE
  gia: string;
  ddd: string;
  siafi: string;
}

export interface IbgeCidade {
  id: number;
  nome: string;
  microrregiao: {
    id: number;
    nome: string;
    mesorregiao: {
      id: number;
      nome: string;
      UF: {
        id: number;
        sigla: string;
        nome: string;
      };
    };
  };
}

export interface IbgePopulacao {
  localidade: string;
  populacao: number;
  ano: number;
}

export interface IbgePib {
  localidade: string;
  pib: number;
  pibPerCapita: number;
  ano: number;
}

export interface CnpjWsResult {
  cnpj: string;
  razao_social: string;
  nome_fantasia: string;
  situacao_cadastral: string;
  data_situacao_cadastral: string;
  data_inicio_atividade: string;
  cnae_fiscal: number;
  cnae_fiscal_descricao: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cep: string;
  uf: string;
  municipio: string;
  ddd_telefone_1: string;
  email: string;
  porte: string;
  capital_social: number;
  qsa: Array<{
    nome: string;
    qual: string;
    pais_origem: string;
  }>;
}

export interface EnrichmentResult {
  source: string;
  success: boolean;
  data: Record<string, any>;
  confidence: number;
  timestamp: string;
  error?: string;
}

// ============================================================================
// ViaCEP - Consulta de CEP (Gratuito, Ilimitado)
// ============================================================================

/**
 * Consulta endereço completo a partir do CEP
 * API: https://viacep.com.br/
 * Limite: Ilimitado
 * Cadastro: Não necessário
 */
export const lookupCep = createServerFn({ method: "POST" })
  .inputValidator((input: { cep: string }) => input)
  .handler(async ({ data }): Promise<EnrichmentResult> => {
    const cep = data.cep.replace(/\D/g, '');
    
    if (cep.length !== 8) {
      return { source: 'viacep', success: false, data: {}, confidence: 0, timestamp: new Date().toISOString(), error: 'CEP inválido' };
    }

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const result = await response.json() as ViaCepResult & { erro?: boolean };

      if (result.erro) {
        return { source: 'viacep', success: false, data: {}, confidence: 0, timestamp: new Date().toISOString(), error: 'CEP não encontrado' };
      }

      logger.info('ViaCEP lookup success', { cep, cidade: result.localidade });

      return {
        source: 'viacep',
        success: true,
        data: {
          cep: result.cep,
          logradouro: result.logradouro,
          bairro: result.bairro,
          cidade: result.localidade,
          uf: result.uf,
          ddd: result.ddd,
          ibge_code: result.ibge,
          complemento: result.complemento,
        },
        confidence: 1.0,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      logger.error('ViaCEP lookup failed', err as Error, { cep });
      return { source: 'viacep', success: false, data: {}, confidence: 0, timestamp: new Date().toISOString(), error: (err as Error).message };
    }
  });

/**
 * Busca CEPs por endereço (busca reversa)
 */
export const searchCepByAddress = createServerFn({ method: "POST" })
  .inputValidator((input: { uf: string; cidade: string; logradouro: string }) => input)
  .handler(async ({ data }): Promise<EnrichmentResult> => {
    try {
      const url = `https://viacep.com.br/ws/${data.uf}/${encodeURIComponent(data.cidade)}/${encodeURIComponent(data.logradouro)}/json/`;
      const response = await fetch(url);
      const results = await response.json() as ViaCepResult[];

      if (!Array.isArray(results) || results.length === 0) {
        return { source: 'viacep_reverse', success: false, data: {}, confidence: 0, timestamp: new Date().toISOString(), error: 'Endereço não encontrado' };
      }

      return {
        source: 'viacep_reverse',
        success: true,
        data: {
          results: results.slice(0, 10),
          total: results.length,
        },
        confidence: 0.9,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      return { source: 'viacep_reverse', success: false, data: {}, confidence: 0, timestamp: new Date().toISOString(), error: (err as Error).message };
    }
  });

// ============================================================================
// IBGE API - Dados Demográficos (Gratuito, Ilimitado)
// ============================================================================

/**
 * Busca dados de uma cidade pelo IBGE
 * API: https://servicodados.ibge.gov.br/api/docs
 * Limite: Ilimitado
 * Cadastro: Não necessário
 */
export const lookupCidade = createServerFn({ method: "POST" })
  .inputValidator((input: { cidade: string; uf?: string }) => input)
  .handler(async ({ data }): Promise<EnrichmentResult> => {
    try {
      // Buscar município por nome
      const url = `https://servicodados.ibge.gov.br/api/v1/localidades/municipios`;
      const response = await fetch(url);
      const municipios = await response.json() as IbgeCidade[];

      const searchTerm = data.cidade.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      
      let found = municipios.find(m => {
        const nome = m.nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const matchesName = nome === searchTerm;
        const matchesUf = !data.uf || m.microrregiao.mesorregiao.UF.sigla === data.uf.toUpperCase();
        return matchesName && matchesUf;
      });

      // Busca parcial se não encontrou exato
      if (!found) {
        found = municipios.find(m => {
          const nome = m.nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          return nome.includes(searchTerm) || searchTerm.includes(nome);
        });
      }

      if (!found) {
        return { source: 'ibge', success: false, data: {}, confidence: 0, timestamp: new Date().toISOString(), error: 'Cidade não encontrada' };
      }

      logger.info('IBGE cidade lookup success', { cidade: found.nome, uf: found.microrregiao.mesorregiao.UF.sigla });

      return {
        source: 'ibge',
        success: true,
        data: {
          ibge_code: found.id,
          nome: found.nome,
          uf: found.microrregiao.mesorregiao.UF.sigla,
          uf_nome: found.microrregiao.mesorregiao.UF.nome,
          microrregiao: found.microrregiao.nome,
          mesorregiao: found.microrregiao.mesorregiao.nome,
        },
        confidence: 1.0,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      logger.error('IBGE lookup failed', err as Error);
      return { source: 'ibge', success: false, data: {}, confidence: 0, timestamp: new Date().toISOString(), error: (err as Error).message };
    }
  });

/**
 * Busca população de um município
 */
export const lookupPopulacao = createServerFn({ method: "POST" })
  .inputValidator((input: { ibge_code: string }) => input)
  .handler(async ({ data }): Promise<EnrichmentResult> => {
    try {
      const url = `https://servicodados.ibge.gov.br/api/v3/agregados/6579/periodos/-1/variaveis/9324?localidades=N6[${data.ibge_code}]`;
      const response = await fetch(url);
      const result = await response.json();

      const series = result?.[0]?.resultados?.[0]?.series?.[0];
      if (!series) {
        return { source: 'ibge_populacao', success: false, data: {}, confidence: 0, timestamp: new Date().toISOString(), error: 'Dados não encontrados' };
      }

      const lastYear = Object.keys(series.serie).pop() || '';
      const populacao = parseInt(series.serie[lastYear], 10);

      return {
        source: 'ibge_populacao',
        success: true,
        data: {
          populacao,
          ano: parseInt(lastYear, 10),
          localidade: series.localidade.nome,
        },
        confidence: 1.0,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      return { source: 'ibge_populacao', success: false, data: {}, confidence: 0, timestamp: new Date().toISOString(), error: (err as Error).message };
    }
  });

/**
 * Lista todos os municípios de um estado
 */
export const listMunicipiosByUf = createServerFn({ method: "POST" })
  .inputValidator((input: { uf: string }) => input)
  .handler(async ({ data }): Promise<EnrichmentResult> => {
    try {
      const url = `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${data.uf.toUpperCase()}/municipios`;
      const response = await fetch(url);
      const municipios = await response.json() as Array<{ id: number; nome: string }>;

      return {
        source: 'ibge_municipios',
        success: true,
        data: {
          municipios: municipios.map(m => ({ id: m.id, nome: m.nome })),
          total: municipios.length,
          uf: data.uf.toUpperCase(),
        },
        confidence: 1.0,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      return { source: 'ibge_municipios', success: false, data: {}, confidence: 0, timestamp: new Date().toISOString(), error: (err as Error).message };
    }
  });

// ============================================================================
// CNPJ.ws - Consulta CNPJ Alternativa (Gratuito, 3 req/min)
// ============================================================================

/**
 * Consulta CNPJ via cnpj.ws (alternativa ao BrasilAPI)
 * API: https://www.cnpj.ws/
 * Limite: 3 req/min (gratuito)
 * Cadastro: Não necessário
 */
export const lookupCnpjWs = createServerFn({ method: "POST" })
  .inputValidator((input: { cnpj: string }) => input)
  .handler(async ({ data }): Promise<EnrichmentResult> => {
    const cnpj = data.cnpj.replace(/\D/g, '');
    
    if (cnpj.length !== 14) {
      return { source: 'cnpj_ws', success: false, data: {}, confidence: 0, timestamp: new Date().toISOString(), error: 'CNPJ inválido' };
    }

    try {
      const response = await fetch(`https://publica.cnpj.ws/cnpj/${cnpj}`);
      
      if (response.status === 429) {
        return { source: 'cnpj_ws', success: false, data: {}, confidence: 0, timestamp: new Date().toISOString(), error: 'Rate limit - tente novamente em 1 minuto' };
      }

      if (!response.ok) {
        return { source: 'cnpj_ws', success: false, data: {}, confidence: 0, timestamp: new Date().toISOString(), error: `HTTP ${response.status}` };
      }

      const result = await response.json();

      logger.info('CNPJ.ws lookup success', { cnpj, razao: result.razao_social });

      return {
        source: 'cnpj_ws',
        success: true,
        data: {
          cnpj,
          razao_social: result.razao_social,
          nome_fantasia: result.estabelecimento?.nome_fantasia,
          situacao: result.estabelecimento?.situacao_cadastral,
          data_abertura: result.estabelecimento?.data_inicio_atividade,
          cnae_principal: result.estabelecimento?.atividade_principal?.subclasse
            ? `${result.estabelecimento.atividade_principal.subclasse} - ${result.estabelecimento.atividade_principal.descricao}`
            : null,
          endereco: {
            logradouro: result.estabelecimento?.logradouro,
            numero: result.estabelecimento?.numero,
            bairro: result.estabelecimento?.bairro,
            cidade: result.estabelecimento?.cidade?.nome,
            uf: result.estabelecimento?.estado?.sigla,
            cep: result.estabelecimento?.cep,
          },
          telefone: result.estabelecimento?.ddd1 && result.estabelecimento?.telefone1
            ? `(${result.estabelecimento.ddd1}) ${result.estabelecimento.telefone1}`
            : null,
          email: result.estabelecimento?.email,
          porte: result.porte?.descricao,
          capital_social: result.capital_social ? parseFloat(result.capital_social) : 0,
          socios: (result.socios || []).map((s: Record<string, unknown>) => ({
            nome: s.nome,
            qualificacao: (s.qualificacao as Record<string, unknown>)?.descricao,
          })),
          natureza_juridica: result.natureza_juridica?.descricao,
        },
        confidence: 0.95,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      logger.error('CNPJ.ws lookup failed', err as Error, { cnpj });
      return { source: 'cnpj_ws', success: false, data: {}, confidence: 0, timestamp: new Date().toISOString(), error: (err as Error).message };
    }
  });

// ============================================================================
// Enriquecimento Combinado - Cascata de Fontes
// ============================================================================

/**
 * Enriquece um lead usando TODAS as fontes gratuitas disponíveis
 * Executa em cascata: CEP → IBGE → CNPJ
 */
export const enrichLeadFull = createServerFn({ method: "POST" })
  .inputValidator((input: { 
    cnpj?: string; 
    cep?: string; 
    cidade?: string; 
    uf?: string;
    nome?: string;
  }) => input)
  .handler(async ({ data }): Promise<{ results: EnrichmentResult[]; summary: Record<string, unknown> }> => {
    const results: EnrichmentResult[] = [];
    const summary: Record<string, unknown> = {};

    // 1. Consulta CEP (se disponível)
    if (data.cep) {
      const cepResult = await lookupCep({ data: { cep: data.cep } });
      results.push(cepResult);
      if (cepResult.success) {
        summary.endereco = cepResult.data;
        // Se não temos cidade/uf, pegar do CEP
        if (!data.cidade) data.cidade = cepResult.data.cidade as string;
        if (!data.uf) data.uf = cepResult.data.uf as string;
      }
    }

    // 2. Consulta IBGE (se temos cidade)
    if (data.cidade) {
      const ibgeResult = await lookupCidade({ data: { cidade: data.cidade, uf: data.uf } });
      results.push(ibgeResult);
      if (ibgeResult.success) {
        summary.ibge = ibgeResult.data;
        
        // Buscar população
        const ibgeCode = ibgeResult.data.ibge_code as string;
        if (ibgeCode) {
          const popResult = await lookupPopulacao({ data: { ibge_code: ibgeCode } });
          results.push(popResult);
          if (popResult.success) {
            summary.populacao = popResult.data;
          }
        }
      }
    }

    // 3. Consulta CNPJ (se disponível)
    if (data.cnpj) {
      const cnpjResult = await lookupCnpjWs({ data: { cnpj: data.cnpj } });
      results.push(cnpjResult);
      if (cnpjResult.success) {
        summary.empresa = cnpjResult.data;
      }
    }

    logger.info('Full enrichment completed', { 
      sources: results.length, 
      successful: results.filter(r => r.success).length,
      nome: data.nome,
    });

    return { results, summary };
  });

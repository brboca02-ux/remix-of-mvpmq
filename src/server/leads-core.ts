import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { logger } from "@/lib/logger";
import { AppError, ErrorCodes } from "@/lib/error-handler";
import { 
  StandardLead, 
  VerificationFlags, 
  calculateConfidenceScore, 
  normalizePorte, 
  normalizeLead 
} from "@/lib/leads-shared";

/**
 * Arquitetura de 4 Camadas para Processamento de Leads
 * 
 * 1. Input: Validação rigorosa de tipos e formatos.
 * 2. Enrichment: Enriquecimento via APIs externas (Google, BrasilAPI) sem IA.
 * 3. Normalização: Padronização de strings, telefones, CNPJs e schema único.
 * 4. IA: Análise qualitativa e scoring avançado (opcional, final).
 */

export const Logger = logger;
export type { StandardLead, VerificationFlags };
export { calculateConfidenceScore, normalizePorte, normalizeLead };

export function getSupabase() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  
  if (!url || !key) {
    throw new AppError(
      ErrorCodes.CONFIGURATION_ERROR,
      "Configuração do banco de dados incompleta.",
      { missingVars: { url: !url, key: !key } },
      500
    );
  }

  try {
    return createClient<Database>(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      },
    });
  } catch (error) {
    logger.error('Failed to create Supabase client', error as Error);
    throw new AppError(
      ErrorCodes.DATABASE_ERROR,
      "Erro ao conectar com o banco de dados.",
      { error: (error as Error).message },
      500
    );
  }
}

/**
 * Fallback genérico para chamadas externas
 */
export async function withFallback<T>(
  fn: () => Promise<T>,
  fallbackValue: T,
  label: string
): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    const error = err as Error;
    logger.warn(`Fallback acionado para ${label}`, { 
      error: error.message,
      stack: error.stack 
    });
    return fallbackValue;
  }
}

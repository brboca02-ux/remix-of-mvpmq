/**
 * Intelligence Types
 * 
 * Type definitions for the Lead Intelligence Engine.
 * Used by validator.ts, scoring-engine.ts, and lead-codec.ts
 */

export interface LeadIntelligence {
  /** Lead ID */
  leadId: string;
  /** Company name */
  companyName: string;
  /** Intelligence score (0-100) */
  score: number;
  /** Data sources used */
  sources: string[];
  /** Enrichment data */
  enrichment?: {
    cnpj?: string;
    socialMedia?: Record<string, string>;
    website?: {
      url: string;
      hasSSL: boolean;
      technology?: string;
    };
    contacts?: Array<{
      name?: string;
      role?: string;
      email?: string;
      phone?: string;
    }>;
  };
  /** Validation status */
  validationStatus: 'valid' | 'partial' | 'invalid';
  /** Validation errors */
  validationErrors?: string[];
  /** Last updated */
  updatedAt: string;
}

export interface IntelligenceValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  score: number;
}

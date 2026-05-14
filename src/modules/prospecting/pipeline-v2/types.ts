/**
 * Pipeline V2 — Types & Interfaces
 * Cockpit operacional compacto para prospecção B2B
 */

export type PipelineStage = 'novo' | 'contatado' | 'interessado' | 'proposta' | 'fechado';
export type ConfidenceLevel = 'cold' | 'warm' | 'hot' | 'risk';
export type QuickAction = 'whatsapp' | 'instagram' | 'email' | 'skip' | 'discard';

export interface PipelineFilter {
  stage?: PipelineStage;
  search?: string;
  confidenceLevel?: ConfidenceLevel;
}

export interface PipelineNotification {
  id: string;
  type: 'info' | 'warning' | 'success';
  message: string;
  timestamp: string;
  read: boolean;
}

export interface LeadRowData {
  id: string;
  companyName: string;
  niche: string;
  city: string;
  confidence: ConfidenceLevel;
  stage: PipelineStage;
  suggestedAction?: string;
  suggestedChannel?: 'WhatsApp' | 'Instagram' | 'Email';
  whatsapp?: string;
  instagram?: string;
  email?: string;
}

export const STAGE_LABELS: Record<PipelineStage, string> = {
  novo: 'Novo',
  contatado: 'Contatado',
  interessado: 'Interessado',
  proposta: 'Proposta',
  fechado: 'Fechado',
};

export const STAGE_ORDER: PipelineStage[] = ['novo', 'contatado', 'interessado', 'proposta', 'fechado'];

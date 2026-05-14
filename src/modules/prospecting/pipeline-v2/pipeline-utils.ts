/**
 * Pipeline V2 — Utility Functions
 */

import type { ConfidenceLevel, PipelineStage, LeadRowData } from './types';
import type { ProspectLead, LeadStatus } from '../types';

/** Mapeia estado do lead para nível de confiança visual (dot colorido) */
export function getConfidenceLevel(lead: Partial<ProspectLead>): ConfidenceLevel {
  if (lead.safetyStatus === 'Risco' || lead.contactStatus === 'Erro no envio') return 'risk';
  if (lead.warmupStatus === 'Pronto') return 'hot';
  if (lead.warmupStatus === 'Morno' || lead.warmupStatus === 'Aquecendo') return 'warm';
  return 'cold';
}

/** Mapeia status legado para estágio do pipeline v2 */
export function mapStatusToStage(status?: LeadStatus | string): PipelineStage {
  if (!status) return 'novo';
  const mapping: Record<string, PipelineStage> = {
    'Novo': 'novo',
    'Lead Gerado': 'novo',
    'Qualificado': 'contatado',
    'Contatado': 'contatado',
    'Cold Mail Enviado': 'contatado',
    'WhatsApp Enviado': 'contatado',
    'Instagram Enviado': 'contatado',
    'LinkedIn Enviado': 'contatado',
    'Follow-Up': 'contatado',
    'Interessado': 'interessado',
    'Lead Qualificado': 'interessado',
    'Proposta Enviada': 'proposta',
    'Em Diagnóstico': 'proposta',
    'Site gerado': 'proposta',
    'Lead Fechado': 'fechado',
    'Agendado': 'fechado',
  };
  return mapping[status] || 'novo';
}

/** Converte ProspectLead para LeadRowData (formato compacto para UI) */
export function toLeadRow(lead: ProspectLead): LeadRowData {
  const stage = lead.pipelineStage as PipelineStage || mapStatusToStage(lead.status);
  const decision = lead.autonomousDecision;

  return {
    id: lead.id,
    companyName: lead.companyName || 'Sem nome',
    niche: lead.niche || '',
    city: lead.city || '',
    confidence: getConfidenceLevel(lead),
    stage,
    suggestedAction: decision?.actionLabel,
    suggestedChannel: decision?.recommendedChannel,
    whatsapp: lead.whatsapp,
    instagram: lead.instagramHandle,
    email: lead.email,
  };
}

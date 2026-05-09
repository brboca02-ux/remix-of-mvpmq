import type { ProspectLead } from '@/modules/prospecting/types';

export type PipelineStage = NonNullable<ProspectLead['pipelineStage']>;

/** SLA em minutos por estágio do pipeline. */
export const STAGE_SLA_MINUTES: Record<PipelineStage, number> = {
  novo: 10,
  contato: 60 * 24,
  respondeu: 60 * 24 * 2,
  proposta: 60 * 24 * 3,
  fechado: 0,
};

/** Limite (dias) para um lead em "contato" ser marcado como esfriando. */
export const COOLING_DAYS = 3;

export function computeNextActionAt(
  stage: PipelineStage | undefined,
  from: Date = new Date()
): string | null {
  if (!stage) return null;
  const minutes = STAGE_SLA_MINUTES[stage];
  if (!minutes || minutes <= 0) return null;
  return new Date(from.getTime() + minutes * 60 * 1000).toISOString();
}

export function isOverdue(lead: Pick<ProspectLead, 'nextActionAt' | 'pipelineStage'>): boolean {
  if (!lead.nextActionAt) return false;
  if (lead.pipelineStage === 'fechado') return false;
  return new Date(lead.nextActionAt).getTime() <= Date.now();
}

export function isCooling(
  lead: Pick<ProspectLead, 'pipelineStage' | 'lastInteractionAt'>
): boolean {
  if (lead.pipelineStage !== 'contato') return false;
  if (!lead.lastInteractionAt) return false;
  const diffMs = Date.now() - new Date(lead.lastInteractionAt).getTime();
  return diffMs > COOLING_DAYS * 24 * 60 * 60 * 1000;
}

/** Aplica mudança de estágio + recalcula SLA + flag de esfriando. */
export function applyStageChange(
  lead: ProspectLead,
  newStage: PipelineStage,
  now: Date = new Date()
): Partial<ProspectLead> {
  const lastInteractionAt = now.toISOString();
  const nextActionAt = computeNextActionAt(newStage, now);
  const updated = {
    ...lead,
    pipelineStage: newStage,
    lastInteractionAt,
    nextActionAt: nextActionAt ?? undefined,
  };
  return {
    pipelineStage: newStage,
    lastInteractionAt,
    nextActionAt: nextActionAt ?? undefined,
    coolingFlag: isCooling(updated),
  };
}

/** Renova SLA mantendo o estágio atual (botão "Ação realizada"). */
export function renewActionSla(lead: ProspectLead, now: Date = new Date()): Partial<ProspectLead> {
  const stage = lead.pipelineStage ?? 'novo';
  return applyStageChange(lead, stage, now);
}

/** Tempo relativo simples em PT-BR (ex: "em 1d 4h", "vencida há 2h"). */
export function formatRelative(iso: string, now: Date = new Date()): string {
  const diffMin = Math.round((new Date(iso).getTime() - now.getTime()) / 60000);
  const abs = Math.abs(diffMin);
  const prefix = diffMin >= 0 ? 'em ' : 'há ';
  let label: string;
  if (abs < 60) label = `${abs}min`;
  else if (abs < 60 * 24) {
    const h = Math.floor(abs / 60);
    const m = abs % 60;
    label = m ? `${h}h ${m}min` : `${h}h`;
  } else {
    const d = Math.floor(abs / (60 * 24));
    const h = Math.floor((abs % (60 * 24)) / 60);
    label = h ? `${d}d ${h}h` : `${d}d`;
  }
  return prefix + label;
}
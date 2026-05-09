import type { ProspectLead } from '@/modules/prospecting/types';

export type Temperature = 'hot' | 'warm' | 'cold';

export function pickScore(lead: Pick<ProspectLead, 'leadScore' | 'opportunityScore'>): number {
  if (typeof lead.leadScore === 'number') return lead.leadScore;
  return lead.opportunityScore ?? 0;
}

export function getTemperature(score: number): Temperature {
  if (score > 70) return 'hot';
  if (score >= 40) return 'warm';
  return 'cold';
}

export interface TemperatureBadge {
  label: string;
  emoji: string;
  className: string;
}

export function getTemperatureBadge(score: number): TemperatureBadge {
  const t = getTemperature(score);
  if (t === 'hot') {
    return { label: 'Quente', emoji: '🔥', className: 'bg-rose-500/15 text-rose-600 border-rose-500/30' };
  }
  if (t === 'warm') {
    return { label: 'Médio', emoji: '⚡', className: 'bg-amber-500/15 text-amber-600 border-amber-500/30' };
  }
  return { label: 'Frio', emoji: '❄️', className: 'bg-sky-500/15 text-sky-600 border-sky-500/30' };
}

/** +20 phone, +15 instagram, +10 city, +10 nome completo. Clamp 0–100. */
export function computeLeadScore(input: {
  phone?: string;
  instagram?: string;
  city?: string;
  name?: string;
}): number {
  let s = 0;
  const phoneDigits = (input.phone ?? '').replace(/\D/g, '');
  if (phoneDigits.length >= 10) s += 20;
  if ((input.instagram ?? '').trim().length > 0) s += 15;
  if ((input.city ?? '').trim().length > 0) s += 10;
  const parts = (input.name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) s += 10;
  return Math.max(0, Math.min(100, s));
}
/**
 * Pipeline V2 — Constants
 */

import type { ConfidenceLevel, QuickAction } from './types';

export const CONFIDENCE_COLORS: Record<ConfidenceLevel, string> = {
  cold: 'bg-zinc-400',
  warm: 'bg-amber-400',
  hot: 'bg-emerald-400',
  risk: 'bg-red-400',
};

export const KEYBOARD_SHORTCUTS: Record<string, QuickAction | 'close' | 'next'> = {
  '1': 'whatsapp',
  '2': 'instagram',
  '3': 'email',
  '4': 'skip',
  '5': 'discard',
  ' ': 'next',
  'Escape': 'close',
};

export const LEAD_ROW_DEFAULTS = {
  companyName: 'Sem nome',
  confidenceLevel: 'cold' as ConfidenceLevel,
  suggestedAction: null,
};

export const EMPTY_DECISION_STATE = {
  text: 'Sem sugestão',
  canExecute: false,
};

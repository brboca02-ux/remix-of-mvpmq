import { useMemo, useCallback } from 'react';
import { useProspectingStore } from '../../prospecting-store';
import { ActionBar } from './ActionBar';
import { DecisionStrip } from './DecisionStrip';
import { ConfidenceDot } from './ConfidenceDot';
import { getConfidenceLevel } from '../pipeline-utils';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { KEYBOARD_SHORTCUTS } from '../constants';
import { X } from 'lucide-react';
import type { QuickAction } from '../types';

interface FocusSurfaceProps {
  leadId: string | null;
  onClose: () => void;
}

export function FocusSurface({ leadId, onClose }: FocusSurfaceProps) {
  const leads = useProspectingStore((s) => s.leads);
  const discardLead = useProspectingStore((s) => s.discardLead);
  const markNoInterest = useProspectingStore((s) => s.markNoInterest);
  const addContactHistory = useProspectingStore((s) => s.addContactHistory);

  const lead = useMemo(() => leads.find((l) => l.id === leadId), [leads, leadId]);

  const processedCount = useProspectingStore((s) => s.getProcessedTodayCount());
  const totalQueue = leads.length;

  const handleAction = useCallback((action: QuickAction) => {
    if (!lead) return;
    switch (action) {
      case 'whatsapp':
      case 'instagram':
      case 'email':
        addContactHistory(lead.id, {
          channel: action === 'whatsapp' ? 'WhatsApp' : action === 'instagram' ? 'Instagram' : 'Email',
          status: 'confirmado',
          message: lead.autonomousDecision?.readyMessage || '',
        });
        break;
      case 'skip':
        break;
      case 'discard':
        discardLead(lead.id, 'Pipeline V2 - descartado');
        break;
    }
    // Avançar para próximo (handled by parent)
    onClose();
  }, [lead, addContactHistory, discardLead, onClose]);

  // Keyboard shortcuts
  const shortcuts = useMemo(() => {
    const map: Record<string, () => void> = {};
    for (const [key, action] of Object.entries(KEYBOARD_SHORTCUTS)) {
      if (action === 'close') map[key] = onClose;
      else if (action === 'next') map[key] = () => handleAction('skip');
      else map[key] = () => handleAction(action);
    }
    return map;
  }, [handleAction, onClose]);

  useKeyboardShortcuts(shortcuts, !!leadId);

  if (!lead) {
    return (
      <div className="w-full max-w-[400px] p-4 flex items-center justify-center text-zinc-500 text-sm">
        Selecione um lead para começar
      </div>
    );
  }

  const confidence = getConfidenceLevel(lead);

  return (
    <div className="w-full max-w-[400px] bg-zinc-900 rounded-lg border border-zinc-800 p-3 flex flex-col gap-3">
      {/* Header com close */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Foco</span>
        <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 p-1 rounded">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Action Bar */}
      <ActionBar
        onAction={handleAction}
        progress={{ current: processedCount, total: totalQueue }}
      />

      {/* Context Section */}
      <div className="flex items-start gap-2 py-2">
        <ConfidenceDot level={confidence} size={10} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-zinc-100 truncate">{lead.companyName || 'Sem nome'}</p>
          <p className="text-[11px] text-zinc-500 truncate">
            {[lead.niche, lead.city].filter(Boolean).join(' · ')}
          </p>
          {lead.whatsapp && (
            <p className="text-[11px] text-zinc-400 mt-1 font-mono">{lead.whatsapp}</p>
          )}
        </div>
      </div>

      {/* Decision Strip */}
      <DecisionStrip leadId={lead.id} onExecute={() => handleAction('skip')} />
    </div>
  );
}

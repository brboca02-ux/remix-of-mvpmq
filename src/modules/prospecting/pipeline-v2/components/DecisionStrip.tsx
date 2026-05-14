import { useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useProspectingStore } from '../../prospecting-store';
import { toast } from 'sonner';

interface DecisionStripProps {
  leadId: string;
  onExecute: () => void;
}

export function DecisionStrip({ leadId, onExecute }: DecisionStripProps) {
  const decision = useProspectingStore((s) => s.getAutonomousDecision(leadId));
  const executeAction = useProspectingStore((s) => s.executeAutonomousAction);

  const handleExecute = useCallback(async () => {
    if (!decision?.readyMessage) return;
    try {
      await navigator.clipboard.writeText(decision.readyMessage);
    } catch {
      // fallback silencioso
    }
    executeAction(leadId);
    onExecute();
  }, [decision, leadId, executeAction, onExecute]);

  if (!decision || !decision.readyMessage) {
    return (
      <div className="h-9 flex items-center px-3 rounded-lg bg-zinc-800/20 text-[12px] text-zinc-500">
        Sem sugestão
      </div>
    );
  }

  const channelIcon = decision.recommendedChannel === 'WhatsApp' ? '📱' :
    decision.recommendedChannel === 'Instagram' ? '📷' : '✉️';

  return (
    <div className="h-9 flex items-center gap-2 px-3 rounded-lg bg-zinc-800/30">
      <span className="text-sm">{channelIcon}</span>
      <span className="flex-1 text-[12px] text-zinc-300 truncate">
        {decision.actionLabel || decision.readyMessage.slice(0, 60)}
      </span>
      <button
        onClick={handleExecute}
        className="text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors shrink-0 px-2 py-1 rounded"
      >
        Executar
      </button>
    </div>
  );
}

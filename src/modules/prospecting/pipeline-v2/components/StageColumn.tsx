import { ConfidenceDot } from './ConfidenceDot';
import { LeadRow } from './LeadRow';
import { STAGE_LABELS } from '../types';
import type { PipelineStage, LeadRowData } from '../types';

interface StageColumnProps {
  stage: PipelineStage;
  leads: LeadRowData[];
  activeLeadId: string | null;
  onLeadClick: (id: string) => void;
}

export function StageColumn({ stage, leads, activeLeadId, onLeadClick }: StageColumnProps) {
  return (
    <div className="flex flex-col min-w-[200px] max-w-[260px] flex-1">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-800">
        <span className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider">
          {STAGE_LABELS[stage]}
        </span>
        <span className="text-[10px] font-mono text-zinc-600 tabular-nums">
          {leads.length}
        </span>
      </div>

      {/* Lead list */}
      <div className="flex-1 overflow-y-auto py-1 space-y-0.5 max-h-[calc(100vh-200px)]">
        {leads.length === 0 && (
          <p className="text-[11px] text-zinc-600 text-center py-8">Nenhum lead</p>
        )}
        {leads.map((lead) => (
          <LeadRow
            key={lead.id}
            lead={lead}
            isActive={lead.id === activeLeadId}
            onClick={() => onLeadClick(lead.id)}
          />
        ))}
      </div>
    </div>
  );
}

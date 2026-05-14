import { useState, useMemo, useCallback } from 'react';
import { useProspectingStore } from '../prospecting-store';
import { StageColumn } from './components/StageColumn';
import { FocusSurface } from './components/FocusSurface';
import { toLeadRow, mapStatusToStage } from './pipeline-utils';
import { STAGE_ORDER } from './types';
import type { PipelineStage, LeadRowData } from './types';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export function PipelinePageV2() {
  const leads = useProspectingStore((s) => s.leads);
  const [activeLeadId, setActiveLeadId] = useState<string | null>(null);

  // Agrupa leads por estágio
  const leadsByStage = useMemo(() => {
    const grouped: Record<PipelineStage, LeadRowData[]> = {
      novo: [],
      contatado: [],
      interessado: [],
      proposta: [],
      fechado: [],
    };

    for (const lead of leads) {
      try {
        const row = toLeadRow(lead);
        grouped[row.stage].push(row);
      } catch {
        // Skip malformed leads
      }
    }

    return grouped;
  }, [leads]);

  const handleLeadClick = useCallback((id: string) => {
    setActiveLeadId(id);
  }, []);

  const handleCloseFocus = useCallback(() => {
    setActiveLeadId(null);
  }, []);

  const totalLeads = leads.length;

  return (
    <div className="h-full flex flex-col bg-zinc-950 text-zinc-100">
      {/* Header compacto */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800/50 h-10">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-semibold text-zinc-200">Pipeline</h1>
          <span className="text-[10px] font-mono text-zinc-500 tabular-nums">
            {totalLeads} leads
          </span>
        </div>
      </div>

      {/* Body: Pipeline + Focus Surface */}
      <div className="flex-1 flex min-h-0">
        {/* Pipeline columns */}
        <div className="flex-1 flex overflow-x-auto gap-0 border-r border-zinc-800/30">
          {STAGE_ORDER.map((stage) => (
            <StageColumn
              key={stage}
              stage={stage}
              leads={leadsByStage[stage]}
              activeLeadId={activeLeadId}
              onLeadClick={handleLeadClick}
            />
          ))}
        </div>

        {/* Focus Surface (lateral) */}
        {activeLeadId && (
          <ErrorBoundary>
            <FocusSurface
              leadId={activeLeadId}
              onClose={handleCloseFocus}
            />
          </ErrorBoundary>
        )}
      </div>
    </div>
  );
}

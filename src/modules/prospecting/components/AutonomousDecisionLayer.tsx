import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useProspectingStore } from '../prospecting-store';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import {
  PlayCircle,
  AlertTriangle,
  Info,
  ChevronRight,
  ChevronDown,
  BrainCircuit,
  Lock,
  ShieldAlert,
  Trophy,
  RefreshCw,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { toast } from 'sonner';

interface AutonomousDecisionLayerProps {
  leadId: string;
  onExecute?: () => void;
}

const SkeletonCard: React.FC = () => (
  <div className="p-4 border border-white/5 bg-card/50 rounded-xl min-h-[140px] animate-pulse">
    <div className="h-4 w-32 bg-white/10 rounded mb-3" />
    <div className="h-3 w-2/3 bg-white/5 rounded mb-2" />
    <div className="h-9 w-full bg-white/5 rounded-lg mt-4" />
  </div>
);

const EmptyCard: React.FC<{ onRetry?: () => void }> = ({ onRetry }) => (
  <div className="p-4 border border-white/5 bg-card/50 rounded-xl flex flex-col items-center justify-center gap-2 text-center min-h-[120px]">
    <Info className="w-5 h-5 text-muted-foreground/60" aria-hidden="true" />
    <p className="text-sm font-medium text-white/80">Nenhuma decisão disponível</p>
    <p className="text-xs text-muted-foreground">A IA ainda não recomendou uma ação para este lead.</p>
    {onRetry && (
      <Button variant="ghost" size="sm" onClick={onRetry} className="mt-1 h-8 text-xs">
        <RefreshCw className="w-3 h-3 mr-1.5" /> Recalcular
      </Button>
    )}
  </div>
);

const DegradedCard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="p-4 border border-amber-500/15 bg-card/50 rounded-xl">
    <div className="flex items-center gap-1.5 text-amber-400/80 text-[10px] font-semibold uppercase tracking-wider mb-2">
      <AlertTriangle className="w-3 h-3" aria-hidden="true" /> Resposta parcial
    </div>
    {children}
  </div>
);

const AutonomousDecisionLayerComponent: React.FC<AutonomousDecisionLayerProps> = ({ leadId, onExecute }) => {
  const { getAutonomousDecision, executeAutonomousAction, recordHesitation } = useProspectingStore();
  const [showEducation, setShowEducation] = useState(false);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  const decision = useMemo(() => getAutonomousDecision(leadId), [leadId, getAutonomousDecision]);

  useEffect(() => {
    const timer = setInterval(() => {
      recordHesitation(leadId, 'idle');
    }, 10000);
    return () => clearInterval(timer);
  }, [leadId, recordHesitation]);

  const handleExecute = useCallback(() => {
    setIsExecuting(true);
    executeAutonomousAction(leadId);
    toast.success('Ação executada com sucesso!');
    onExecute?.();
    setIsExecuting(false);
  }, [leadId, executeAutonomousAction, onExecute]);

  if (decision === undefined) return <SkeletonCard />;
  if (!decision) return <EmptyCard />;

  const score = decision.realConfidenceScore || decision.confidenceScore || 0;
  const isHighConfidence = score > 85;
  const isDegraded = !decision.readyMessage || !decision.recommendedChannel;

  if (isDegraded) {
    return (
      <DegradedCard>
        <p className="text-sm text-white/80 mb-3">
          {decision.recommendedChannel ? `Canal: ${decision.recommendedChannel}` : 'Canal não definido'}{' '}
          {decision.readyMessage ? '' : '· Mensagem pendente'}
        </p>
        <Button size="sm" variant="ghost" onClick={handleExecute} disabled={isExecuting} className="h-8 text-xs">
          <RefreshCw className="w-3 h-3 mr-1.5" /> Tentar mesmo assim
        </Button>
      </DegradedCard>
    );
  }

  return (
    <div className="animate-in fade-in duration-200">
      {/* Superfície operacional compacta */}
      <div
        className={cn(
          'p-4 rounded-xl border bg-card/50 transition-colors',
          decision.isLocked ? 'border-destructive/20' : 'border-white/[0.06] hover:border-white/10',
        )}
      >
        {/* Header: Ação + Score integrado */}
        <div className="flex items-center justify-between gap-3 mb-2">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <BrainCircuit className="w-4 h-4 text-primary/70" aria-hidden="true" />
            Ação recomendada
          </h2>
          <span
            className={cn(
              'text-xs font-mono font-semibold tabular-nums',
              isHighConfidence ? 'text-emerald-400/80' : 'text-primary/70',
            )}
          >
            {score}%
          </span>
        </div>

        {/* Meta inline: canal · tipo · risco */}
        <div className="flex flex-wrap items-center gap-x-1.5 text-[11px] text-muted-foreground mb-3">
          <span className="font-medium text-white/70">{decision.recommendedChannel}</span>
          <span className="text-white/20">·</span>
          <span>{decision.type}</span>
          {decision.expectedOutcome && (
            <>
              <span className="text-white/20">·</span>
              <span>Impacto: {decision.expectedOutcome}</span>
            </>
          )}
          {decision.isLocked && (
            <>
              <span className="text-white/20">·</span>
              <span className="inline-flex items-center gap-0.5 text-destructive/80 font-semibold">
                <Lock className="w-2.5 h-2.5" aria-hidden="true" /> Risco
              </span>
            </>
          )}
        </div>

        {/* Mensagem (contexto) */}
        <p className="text-[13px] leading-relaxed text-white/75 mb-4 line-clamp-2">
          {decision.readyMessage}
        </p>

        {/* CTA compacto */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="h-9 text-xs font-semibold gap-1.5 rounded-lg flex-1"
            onClick={handleExecute}
            disabled={isExecuting}
          >
            {isExecuting ? 'Processando...' : 'Executar ação'}
            <PlayCircle className="w-3.5 h-3.5" aria-hidden="true" />
          </Button>
          {!decision.isLocked && (
            <Button
              variant="ghost"
              size="sm"
              className="h-9 text-xs text-muted-foreground hover:text-white px-3"
              onClick={() => {
                setShowAlternatives((v) => !v);
                recordHesitation(leadId, 'change');
              }}
              aria-expanded={showAlternatives}
            >
              Alternativas
              <ChevronRight className={cn('w-3 h-3 ml-1 transition-transform', showAlternatives && 'rotate-90')} aria-hidden="true" />
            </Button>
          )}
        </div>

        {/* Alerta crítico (inline, discreto) */}
        {decision.isCritical && (
          <div className="mt-3 flex items-start gap-2 text-xs text-destructive/80">
            <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{decision.criticalReason}</span>
          </div>
        )}

        {/* Disclosure: Educação / Racional (recolhido por padrão) */}
        {decision.strategyRationale && (
          <button
            onClick={() => setShowEducation((v) => !v)}
            className="mt-3 w-full flex items-center gap-1.5 text-[11px] text-muted-foreground/70 hover:text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded px-1 py-0.5"
            aria-expanded={showEducation}
          >
            <Info className="w-3 h-3" aria-hidden="true" />
            <span>Por que essa abordagem?</span>
            <ChevronDown className={cn('w-3 h-3 ml-auto transition-transform', showEducation && 'rotate-180')} aria-hidden="true" />
          </button>
        )}

        {showEducation && decision.strategyRationale && (
          <div className="mt-2 pl-5 text-xs text-muted-foreground/80 leading-relaxed animate-in fade-in slide-in-from-top-1 duration-150">
            {decision.strategyRationale}
          </div>
        )}

        {/* Alternativas (what-if) */}
        {showAlternatives && !decision.isLocked && (
          <div className="mt-3 space-y-1.5 animate-in fade-in duration-150">
            <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider flex items-center gap-1.5">
              <Trophy className="w-3 h-3 text-amber-400/50" aria-hidden="true" />
              Cenários alternativos
            </p>
            {decision.whatIfScenarios?.map((scenario, idx) => (
              <div key={idx} className="flex items-start justify-between gap-2 py-1.5 px-2 rounded-lg bg-white/[0.02]">
                <div className="min-w-0">
                  <span className="text-xs font-medium text-white/80">{scenario.strategy}</span>
                  <p className="text-[11px] text-muted-foreground/70 leading-snug mt-0.5">{scenario.reason}</p>
                </div>
                <span
                  className={cn(
                    'text-[10px] font-mono font-semibold shrink-0 mt-0.5',
                    scenario.expectedImprovement > 0 ? 'text-emerald-400/70' : 'text-muted-foreground/50',
                  )}
                >
                  {scenario.expectedImprovement > 0 ? '+' : ''}{scenario.expectedImprovement}%
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const AutonomousDecisionLayer = React.memo(AutonomousDecisionLayerComponent);

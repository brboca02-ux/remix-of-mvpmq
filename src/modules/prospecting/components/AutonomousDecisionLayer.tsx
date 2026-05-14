import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useProspectingStore } from '../prospecting-store';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import {
  PlayCircle,
  AlertTriangle,
  Info,
  ChevronRight,
  BrainCircuit,
  Lock,
  ShieldAlert,
  Trophy,
  RefreshCw,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { toast } from 'sonner';
import { AnimatedPercent } from '../../../components/ui/animated-value';

interface AutonomousDecisionLayerProps {
  leadId: string;
  onExecute?: () => void;
}

const SkeletonCard: React.FC = () => (
  <Card className="p-5 border border-white/5 bg-card/60 min-h-[320px] animate-pulse">
    <div className="h-5 w-40 bg-white/10 rounded mb-4" />
    <div className="h-3 w-2/3 bg-white/5 rounded mb-2" />
    <div className="h-3 w-1/2 bg-white/5 rounded mb-6" />
    <div className="h-11 w-full bg-white/5 rounded-2xl" />
  </Card>
);

const EmptyCard: React.FC<{ onRetry?: () => void }> = ({ onRetry }) => (
  <Card className="p-5 border border-white/5 bg-card/60 min-h-[320px] flex flex-col items-center justify-center gap-3 text-center">
    <Info className="w-6 h-6 text-muted-foreground" aria-hidden="true" />
    <p className="text-base font-semibold text-white">Nenhuma decisão disponível</p>
    <p className="text-sm text-muted-foreground max-w-xs">A IA ainda não recomendou uma ação para este lead.</p>
    {onRetry && (
      <Button variant="outline" size="sm" onClick={onRetry} className="mt-2 h-10">
        <RefreshCw className="w-4 h-4 mr-2" /> Recalcular
      </Button>
    )}
  </Card>
);

const DegradedCard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Card className="p-5 border border-amber-500/20 bg-card/60 min-h-[320px]">
    <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-wider mb-3">
      <AlertTriangle className="w-4 h-4" aria-hidden="true" /> IA respondeu parcialmente
    </div>
    {children}
  </Card>
);

const AutonomousDecisionLayerComponent: React.FC<AutonomousDecisionLayerProps> = ({ leadId, onExecute }) => {
  const { getAutonomousDecision, executeAutonomousAction, recordHesitation } = useProspectingStore();
  const [showDetails, setShowDetails] = useState(false);
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
        <h2 className="text-lg font-semibold text-white mb-1">Ação parcial disponível</h2>
        <p className="text-sm text-muted-foreground mb-4">
          {decision.recommendedChannel ? `Canal sugerido: ${decision.recommendedChannel}.` : 'Canal não definido.'}{' '}
          {decision.readyMessage ? '' : 'Mensagem ainda não foi gerada.'}
        </p>
        <Button size="sm" variant="outline" onClick={handleExecute} disabled={isExecuting} className="h-10">
          <RefreshCw className="w-4 h-4 mr-2" /> Tentar mesmo assim
        </Button>
      </DegradedCard>
    );
  }

  return (
    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <Card
        className={cn(
          'p-5 border bg-card/70 transition-colors min-h-0',
          decision.isLocked ? 'border-destructive/30' : 'border-white/10 hover:border-primary/20',
        )}
      >
        {/* Nível A — AÇÃO */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20 shrink-0">
              <BrainCircuit className="w-5 h-5 text-primary" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-white truncate">Ação recomendada</h2>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground mt-0.5">
                <span className="font-medium text-white/80">{decision.recommendedChannel}</span>
                <span aria-hidden="true">·</span>
                <span>{decision.type}</span>
                {decision.isLocked && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1 text-destructive font-bold uppercase tracking-wider">
                      <Lock className="w-3 h-3" aria-hidden="true" /> Hesitação de risco
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-right shrink-0">
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Confiança</div>
            <div
              className={cn(
                'text-2xl font-mono font-bold tabular-nums leading-none mt-0.5',
                isHighConfidence ? 'text-success' : 'text-primary',
              )}
            >
              <AnimatedPercent value={score} pulseColor={isHighConfidence ? 'success' : 'primary'} />
            </div>
          </div>
        </div>

        {/* Nível B — RISCO + impacto (chips inline) */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Badge variant="outline" className="bg-white/5 border-white/10 text-xs font-medium">
            Impacto: {decision.expectedOutcome}
          </Badge>
          <Badge variant="outline" className="bg-white/5 border-white/10 text-xs font-medium">
            Conversão estimada 24h
          </Badge>
        </div>

        {/* Nível C — CONTEXTO */}
        <div className="p-3 bg-black/30 border border-white/5 rounded-2xl mb-4">
          <p className="text-sm leading-relaxed text-white/90 line-clamp-3">"{decision.readyMessage}"</p>
        </div>

        {/* CTA */}
        <Button
          size="lg"
          className="w-full h-11 text-sm font-semibold gap-2 rounded-xl"
          onClick={handleExecute}
          disabled={isExecuting}
        >
          {isExecuting ? 'Processando...' : 'Executar e gerar receita'}
          <PlayCircle className="w-4 h-4" aria-hidden="true" />
        </Button>

        {/* Toggles */}
        <div className="flex justify-between items-center mt-3 text-xs">
          <button
            onClick={() => setShowDetails((v) => !v)}
            className="text-muted-foreground hover:text-primary inline-flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm px-1"
            aria-expanded={showDetails}
          >
            <Info className="w-3 h-3" aria-hidden="true" />
            {showDetails ? 'Ocultar detalhes' : 'Ver detalhes'}
          </button>
          {!decision.isLocked && (
            <button
              onClick={() => {
                setShowAlternatives((v) => !v);
                recordHesitation(leadId, 'change');
              }}
              className="text-muted-foreground hover:text-primary inline-flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm px-1"
              aria-expanded={showAlternatives}
            >
              Alternativas
              <ChevronRight className={cn('w-3 h-3 transition-transform', showAlternatives && 'rotate-90')} aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Nível D — DETALHES (lazy) */}
        {showDetails && (
          <div className="mt-3 p-3 bg-primary/5 rounded-xl border border-primary/10 text-sm animate-in fade-in duration-200">
            <div className="font-semibold text-primary mb-1 flex items-center gap-2 text-xs uppercase tracking-wider">
              <BrainCircuit className="w-3.5 h-3.5" aria-hidden="true" /> Racional estratégico
            </div>
            <p className="text-muted-foreground leading-relaxed text-sm">{decision.strategyRationale}</p>
          </div>
        )}

        {decision.isCritical && (
          <div className="mt-3 p-3 bg-destructive/10 rounded-xl border border-destructive/30 text-sm flex gap-3">
            <ShieldAlert className="w-4 h-4 text-destructive shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="font-bold text-destructive text-sm">Decisão crítica detectada</p>
              <p className="text-destructive/90 text-xs">{decision.criticalReason}</p>
            </div>
          </div>
        )}

        {showAlternatives && !decision.isLocked && (
          <div className="mt-3 space-y-2 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Cenários "what-if"</p>
              <Trophy className="w-3 h-3 text-warning" aria-hidden="true" />
            </div>
            {decision.whatIfScenarios?.map((scenario, idx) => (
              <div key={idx} className="p-3 bg-muted/30 border border-white/5 rounded-xl">
                <div className="flex justify-between items-start mb-1 gap-2">
                  <span className="text-xs font-bold text-foreground">{scenario.strategy}</span>
                  <Badge variant={scenario.expectedImprovement > 0 ? 'default' : 'secondary'} className="text-[10px] h-4 shrink-0">
                    {scenario.expectedImprovement > 0 ? `+${scenario.expectedImprovement}%` : `${scenario.expectedImprovement}%`}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-snug">{scenario.reason}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export const AutonomousDecisionLayer = React.memo(AutonomousDecisionLayerComponent);

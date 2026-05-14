import React, { useState, useEffect } from 'react';
import { useProspectingStore } from '../prospecting-store';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { 
  PlayCircle, 
  AlertTriangle, 
  ShieldCheck, 
  Info, 
  ChevronRight,
  BrainCircuit,
  Lock,
  ShieldAlert,
  Trophy,
  RefreshCw,
  TrendingUp
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { toast } from 'sonner';
import { AnimatedPercent } from '../../../components/ui/animated-value';

interface AutonomousDecisionLayerProps {
  leadId: string;
  onExecute?: () => void;
}

export const AutonomousDecisionLayer: React.FC<AutonomousDecisionLayerProps> = ({ leadId, onExecute }) => {
  const { getAutonomousDecision, executeAutonomousAction, recordHesitation } = useProspectingStore();
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [showReasoning, setShowReasoning] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  
  const decision = getAutonomousDecision(leadId);
  
  useEffect(() => {
    const timer = setInterval(() => {
      recordHesitation(leadId, 'idle');
    }, 10000);
    return () => clearInterval(timer);
  }, [leadId, recordHesitation]);

  if (!decision) return null;

  const handleExecute = () => {
    setIsExecuting(true);
    executeAutonomousAction(leadId);
    toast.success("Ação executada com sucesso!");
    if (onExecute) onExecute();
    setIsExecuting(false);
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* MODO NÃO PENSE, EXECUTE */}
      <Card className={cn(
        "p-10 border border-white/5 transition-all duration-700 overflow-hidden relative group bg-gradient-to-br from-card/80 to-background shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)]",
        decision.isLocked ? "border-destructive/20" : "hover:border-primary/20"
      )}>
        {decision.isLocked && (
          <div className="absolute top-0 right-0 p-3 bg-destructive text-white flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] rounded-bl-xl shadow-lg animate-pulse">
            <Lock className="w-3 h-3" /> Hesitação de Risco
          </div>
        )}

        <div className="flex flex-col gap-10">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-5">
              <div className="p-5 bg-primary/10 rounded-2xl border border-primary/20 group-hover:scale-110 transition-transform duration-500">
                <BrainCircuit className="w-8 h-8 text-primary glow-primary" />
              </div>
              <div>
                <h3 className="text-[10px] font-bold text-primary uppercase tracking-[0.3em] mb-1">Inteligência Estratégica</h3>
                <h2 className="text-3xl font-bold text-white tracking-tighter">Ação Recomendada</h2>
              </div>
            </div>
            <div className="text-right p-4 bg-white/5 rounded-2xl border border-white/5">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Score de Precisão</div>
              <div className={cn(
                "text-4xl font-mono font-bold tracking-tighter",
                (decision.realConfidenceScore || decision.confidenceScore) > 85 ? "text-success" : "text-primary"
              )}>
                <AnimatedPercent
                  value={decision.realConfidenceScore || decision.confidenceScore}
                  pulseColor={(decision.realConfidenceScore || decision.confidenceScore) > 85 ? "success" : "primary"}
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="bg-white/5 border-white/10 text-white font-mono uppercase tracking-widest py-1.5 px-4">{decision.recommendedChannel}</Badge>
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/10 font-bold uppercase tracking-widest text-[10px] py-1.5 px-4">{decision.type}</Badge>
            </div>
            
            <div className="p-8 bg-black/40 border border-white/5 rounded-3xl relative overflow-hidden group/message">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                <ShieldCheck className="w-3 h-3 text-success" /> Mensagem Otimizada de Alta Performance
              </div>
              <p className="text-xl font-medium text-white/90 italic leading-relaxed font-serif">
                "{decision.readyMessage}"
              </p>
            </div>
            
            <div className="flex items-center gap-6 px-2">
              <div className="flex items-center gap-2 text-xs text-success font-bold uppercase tracking-widest">
                <TrendingUp className="w-4 h-4" />
                Impacto: {decision.expectedOutcome}
              </div>
              <div className="h-4 w-px bg-white/10" />
              <div className="text-xs text-muted-foreground font-medium italic">
                Cenário: Alta probabilidade de conversão em 24h
              </div>
            </div>
          </div>

          <Button 
            size="lg" 
            className="w-full h-20 text-xl font-bold gap-4 shadow-[0_20px_40px_-15px_rgba(37,99,235,0.3)] hover:shadow-[0_25px_50px_-12px_rgba(37,99,235,0.4)] transition-all duration-500 hover:scale-[1.01] active:scale-[0.98] bg-primary hover:bg-primary/90 rounded-2xl"
            onClick={handleExecute}
            disabled={isExecuting}
          >
            {isExecuting ? "Processando..." : "Executar e Gerar Receita"}
            <PlayCircle className="w-7 h-7" />
          </Button>

          {/* EXPLICAÇÃO SOB DEMANDA */}
          <div className="flex justify-between items-center px-1">
            <button 
              onClick={() => setShowReasoning(!showReasoning)}
              className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
            >
              <Info className="w-3 h-3" />
              {showReasoning ? "Ocultar estratégia" : "Por que essa decisão?"}
            </button>

            {!decision.isLocked && (
              <button 
                onClick={() => {
                  setShowAlternatives(!showAlternatives);
                  recordHesitation(leadId, 'change');
                }}
                className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
              >
                Alternativas
                <ChevronRight className={cn("w-3 h-3 transition-transform", showAlternatives && "rotate-90")} />
              </button>
            )}
          </div>

          {showReasoning && (
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/10 text-sm animate-in zoom-in-95 duration-200">
              <div className="font-bold text-primary mb-1 flex items-center gap-2">
                <BrainCircuit className="w-4 h-4" /> Racional Estratégico
              </div>
              <p className="text-muted-foreground leading-relaxed">
                {decision.strategyRationale}
              </p>
            </div>
          )}

          {decision.isLocked && (
            <div className="p-4 bg-warning/10 rounded-lg border border-warning/30 text-sm flex gap-3 animate-in shake duration-500">
              <AlertTriangle className="w-5 h-5 text-warning shrink-0" />
              <div>
                <p className="font-bold text-warning">Atenção: Você está desviando do plano que mais converte.</p>
                <p className="text-warning opacity-90 text-xs">Hesitação detectada. Recomenda-se seguir o caminho de maior confiança estatística.</p>
              </div>
            </div>
          )}

          {decision.isCritical && (
            <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/30 text-sm flex gap-3 animate-pulse">
              <ShieldAlert className="w-5 h-5 text-destructive shrink-0" />
              <div>
                <p className="font-bold text-destructive">Decisão Crítica Detectada</p>
                <p className="text-destructive opacity-90 text-xs">{decision.criticalReason}</p>
              </div>
            </div>
          )}

          {showAlternatives && !decision.isLocked && (
            <div className="space-y-3 animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between px-1">
                <p className="text-xs font-bold text-muted-foreground uppercase">Análise de Cenários "What-if"</p>
                <Trophy className="w-3 h-3 text-warning" />
              </div>
              
              {decision.whatIfScenarios?.map((scenario, idx) => (
                <div key={idx} className="p-3 bg-muted/30 border rounded-lg group hover:border-primary/30 transition-colors">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-bold text-foreground">{scenario.strategy}</span>
                    <Badge variant={scenario.expectedImprovement > 0 ? "default" : "secondary"} className="text-[9px] h-4">
                      {scenario.expectedImprovement > 0 ? `+${scenario.expectedImprovement}% faturamento` : `${scenario.expectedImprovement}% faturamento`}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-tight italic">{scenario.reason}</p>
                </div>
              ))}
              
              <Button variant="outline" size="sm" className="w-full justify-start text-[10px] text-muted-foreground opacity-60 italic">
                <RefreshCw className="w-3 h-3 mr-2" /> Recalcular rotas alternativas
              </Button>
            </div>
          )}
        </div>
      </Card>

      <div className="text-center">
        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest opacity-50 italic">
          Auditado em tempo real • Base de aprendizado: {decision.realConfidenceScore ? 'Resultados Próprios' : 'Global Patterns'} • Rastreabilidade Total Ativa
        </p>
      </div>
    </div>
  );
};
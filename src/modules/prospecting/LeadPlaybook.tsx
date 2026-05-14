// @ts-nocheck
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { useProspectingStore } from './prospecting-store';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  MessageSquare, 
  Zap, 
  Copy, 
  AlertCircle,
  TrendingUp,
  Target,
  ChevronRight,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { AnimatedPercent } from "@/components/ui/animated-value";
import { LiveProgress } from "@/components/ui/live-progress";

interface LeadPlaybookProps {
  leadId: string;
}

export const LeadPlaybook: React.FC<LeadPlaybookProps> = ({ leadId }) => {
  const { leads, advancePlaybook, generatePlaybook, adaptPlaybook } = useProspectingStore();
  const lead = leads.find(l => l.id === leadId);

  if (!lead) return null;

  const playbook = lead.playbook;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Mensagem copiada!");
  };

  const handleGenerate = () => {
    generatePlaybook(leadId);
    toast.success("Playbook gerado com sucesso!");
  };

  if (!playbook) {
    return (
      <Card className="border-dashed border-2 bg-slate-50/50">
        <CardContent className="p-8 text-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-violet-100 flex items-center justify-center mx-auto text-violet-600">
            <Zap className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Sem Playbook Ativo</h3>
            <p className="text-sm text-slate-500">Gere uma estratégia personalizada de alta conversão para este lead.</p>
          </div>
          <Button onClick={handleGenerate} className="bg-violet-600 hover:bg-violet-700">
            Gerar Playbook IA
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header do Playbook */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-card/40 p-8 rounded-[2.5rem] border border-white/5 shadow-2xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-[0.2em] text-emerald-400 border-emerald-500/20 bg-emerald-500/5 px-3">
              Prospecção Segura Ativa
            </Badge>
            <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-tighter opacity-50">Sincronizado {playbook.lastAdaptedAt ? new Date(playbook.lastAdaptedAt).toLocaleDateString() : new Date().toLocaleDateString()}</span>
          </div>
          <h3 className="text-2xl font-bold text-white tracking-tighter">{playbook.name}</h3>
          <p className="text-sm text-muted-foreground font-medium italic opacity-70">Estratégia otimizada para o setor de {playbook.niche}.</p>
        </div>
        <div className="flex items-center gap-6 p-4 bg-white/5 rounded-3xl border border-white/5">
          <div className="text-right">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-1">Taxa de Conversão IA</p>
            <p className="text-3xl font-mono font-bold text-success">
              <AnimatedPercent value={playbook.conversionChance} pulseColor="success" />
            </p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-success/10 flex items-center justify-center text-success glow-success">
            <TrendingUp className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Indicadores de Risco e Agressividade */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-[2rem] bg-card/30 border border-white/5 group hover:border-primary/20 transition-colors">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
            <Zap className="w-3 h-3 text-primary" /> Agressividade
          </p>
          <div className="flex items-center gap-2">
            <Badge className={cn(
              "text-[10px] font-bold uppercase tracking-widest py-1 px-4 border-none shadow-lg",
              playbook.aggressiveness === 'alto' ? "bg-destructive text-white" : playbook.aggressiveness === 'médio' ? "bg-warning text-black" : "bg-primary text-white"
            )}>
              {playbook.aggressiveness}
            </Badge>
          </div>
        </div>
        <div className="p-6 rounded-[2rem] bg-card/30 border border-white/5 group hover:border-destructive/20 transition-colors">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Risco de Rejeição</p>
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-mono font-bold">
              <span className="text-muted-foreground uppercase tracking-tighter">Probabilidade</span>
              <span className={playbook.rejectionRisk > 50 ? "text-destructive" : "text-success"}>
                <AnimatedPercent
                  value={playbook.rejectionRisk}
                  pulseColor={playbook.rejectionRisk > 50 ? "destructive" : "success"}
                  showDelta={false}
                />
              </span>
            </div>
            <LiveProgress
              value={playbook.rejectionRisk}
              tone={playbook.rejectionRisk > 50 ? "destructive" : "success"}
              height="md"
            />
          </div>
        </div>
        <div className="p-6 rounded-[2rem] bg-primary text-white shadow-[0_15px_30px_-10px_rgba(37,99,235,0.4)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform duration-700">
            <Target className="w-16 h-16" />
          </div>
          <p className="text-[10px] font-bold opacity-80 uppercase tracking-[0.2em] mb-2">Status da Operação</p>
          <p className="text-base font-bold tracking-tight">Etapa {playbook.currentStageIndex + 1}</p>
          <p className="text-[10px] opacity-90 font-medium uppercase tracking-tighter">{playbook.stages[playbook.currentStageIndex].label}</p>
        </div>
      </div>

      {/* Timeline do Playbook */}
      <div className="space-y-4">
        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Clock className="h-3 w-3" /> Sequência de Abordagem
        </h4>
        <div className="space-y-6">
          {playbook.stages.map((stage, idx) => (
            <div 
              key={stage.id}
              className={cn(
                "relative p-8 rounded-3xl border transition-all duration-500",
                stage.status === 'current' ? "border-primary/30 bg-primary/5 shadow-2xl scale-[1.02]" : 
                stage.status === 'completed' ? "border-success/10 bg-success/5 opacity-50" : 
                "border-white/5 bg-card/20 opacity-40"
              )}
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-5">
                  <div className={cn(
                    "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 border",
                    stage.status === 'current' ? "bg-primary border-primary shadow-lg shadow-primary/30 text-white" : 
                    stage.status === 'completed' ? "bg-success border-success text-white" : "bg-white/5 border-white/10 text-muted-foreground"
                  )}>
                    {stage.status === 'completed' ? <CheckCircle2 className="h-6 w-6" /> : <span className="font-mono font-bold text-lg">{idx + 1}</span>}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h5 className="text-lg font-bold text-white tracking-tight">
                        {stage.label}
                      </h5>
                      <Badge variant="outline" className="text-[8px] font-bold uppercase tracking-widest py-0.5 px-2 border-white/10 bg-white/5 text-muted-foreground">
                        {stage.channel}
                      </Badge>
                    </div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">{stage.strategy} • {stage.trigger}</p>
                  </div>
                </div>
                {stage.status === 'current' && (
                  <Button size="sm" onClick={() => advancePlaybook(leadId)} className="h-10 px-6 text-[10px] font-bold uppercase tracking-widest bg-primary hover:bg-primary/90 rounded-xl shadow-lg">
                    Finalizar Etapa
                  </Button>
                )}
              </div>

              {stage.status === 'current' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="p-8 rounded-[2rem] bg-black/40 border border-white/5 group/message relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                    <div className="flex justify-between items-start mb-6">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                        <MessageSquare className="h-3.5 w-3.5 text-primary" /> Roteiro de Alta Conversão
                      </p>
                      <span className="text-primary text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 bg-primary/5 px-3 py-1 rounded-full border border-primary/10">
                        <Target className="h-3 w-3" /> Foco: {stage.objective}
                      </span>
                    </div>
                    <p className="text-lg text-white/90 font-medium leading-relaxed mb-8 font-serif italic">
                      "{stage.suggestedMessage}"
                    </p>
                    <div className="flex gap-4">
                      <Button size="lg" onClick={() => handleCopy(stage.suggestedMessage)} className="h-12 flex-1 gap-3 text-[10px] font-bold uppercase tracking-widest bg-white text-black hover:bg-white/90 rounded-xl">
                        <Copy className="h-4 w-4" /> Copiar Principal
                      </Button>
                      <Button variant="outline" size="lg" onClick={() => handleCopy(stage.alternatives[0])} className="h-12 flex-1 gap-3 text-[10px] font-bold uppercase tracking-widest border-white/5 bg-white/5 text-white hover:bg-white/10 rounded-xl">
                        Variação Estratégica
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-warning/5 border border-warning/10 text-warning/90">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <p className="text-[10px] font-bold uppercase tracking-widest">Protocolo de Tempo: Aguarde {stage.delayDays} dias para evitar saturação.</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Adaptação Dinâmica */}
      <Card className="rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden bg-gradient-to-br from-card to-black text-white">
        <CardContent className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-3">
              <RefreshCw className="h-4 w-4 text-primary animate-spin-slow" /> Inteligência Adaptativa
            </h4>
            <Badge variant="outline" className="border-success/20 bg-success/5 text-success text-[8px] font-bold uppercase tracking-widest px-3">Protocolo Ativo</Badge>
          </div>
          <p className="text-sm font-medium mb-6 text-white/70">Como o lead reagiu à última abordagem? Calibre a IA:</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { id: 'ignored', label: 'Ignorou', icon: Circle, color: 'hover:bg-destructive shadow-destructive/20' },
              { id: 'responded', label: 'Respondeu', icon: MessageSquare, color: 'hover:bg-primary shadow-primary/20' },
              { id: 'interested', label: 'Interessado', icon: Zap, color: 'hover:bg-success shadow-success/20' },
              { id: 'cooling_down', label: 'Esfriou', icon: Clock, color: 'hover:bg-warning shadow-warning/20' }
            ].map((btn) => (
              <Button 
                key={btn.id}
                variant="outline" 
                size="lg"
                onClick={() => {
                  adaptPlaybook(leadId, btn.id as any);
                  toast.success("Estratégia adaptada com sucesso!");
                }}
                className={cn(
                  "bg-white/5 border-white/10 text-white h-14 gap-3 font-bold text-[10px] uppercase tracking-widest transition-all duration-300 rounded-2xl",
                  btn.color,
                  "hover:text-white hover:border-transparent hover:shadow-xl hover:scale-[1.05]"
                )}
              >
                <btn.icon className="h-4 w-4" /> {btn.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
import React, { useState, useEffect } from 'react';
import { useProspectingStore } from './prospecting-store';
import { 
  Zap, 
  Target, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ArrowRight, 
  Sparkles, 
  TrendingUp, 
  Trophy,
  MessageCircle,
  Instagram,
  Mail,
  ShieldCheck,
  ShieldAlert,
  ChevronRight,
  Flame,
  Brain
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Progress } from "../../components/ui/progress";
import { AnimatedCurrency } from "../../components/ui/animated-value";
import { LiveProgress } from "../../components/ui/live-progress";
import { Badge } from "../../components/ui/badge";
import { cn } from "../../lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from 'sonner';

export const DailyAiPlan: React.FC<{ onStartFocus: () => void }> = ({ onStartFocus }) => {
  const { 
    getDailyPlan, 
    getMotivationStats, 
    getOperationalPlan, 
    getRevenueForecast, 
    getMessagePerformance,
    getMomentumStats
  } = useProspectingStore();

  const plan = getDailyPlan();
  const motivation = getMotivationStats();
  const operational = getOperationalPlan();
  const forecast = getRevenueForecast();
  const msgPerf = getMessagePerformance();
  const momentum = getMomentumStats();

  const [activeBlock, setActiveTab] = useState<'closure' | 'followup' | 'new_contact' | 'revision'>('closure');

  useEffect(() => {
    if (plan.status === 'delayed' || plan.status === 'at_risk') {
      toast.error("Alerta IA: Você está abaixo do ritmo necessário para bater a meta!", {
        description: "Priorize o bloco de fechamento agora.",
        duration: 5000
      });
    } else if (plan.status === 'ahead') {
      toast.success("Excelente ritmo! Você está acima da meta operacional.", {
        description: "Pode focar em leads de maior valor estratégico hoje.",
        duration: 5000
      });
    }
  }, [plan.status]);

  const blocks = [
    { id: 'closure', label: 'Fechamento', icon: Trophy, color: 'text-rose-500', bg: 'bg-rose-50', border: 'border-rose-100', desc: 'Foco em leads com alta chance de fechar agora.' },
    { id: 'followup', label: 'Follow-ups', icon: MessageCircle, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100', desc: 'Recupere conversas e mantenha o engajamento.' },
    { id: 'new_contact', label: 'Novos Leads', icon: Zap, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-100', desc: 'Alimente o topo do funil para garantir a meta futura.' },
    { id: 'revision', label: 'Revisão', icon: Target, color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-100', desc: 'Ajuste perfis e refine sua estratégia.' }
  ];

  const getTasksByBlock = (type: string) => plan.tasks.filter(t => t.type === type);

  const statusMap = {
    on_track: { label: 'Em Dia', color: 'bg-emerald-500', icon: CheckCircle2 },
    delayed: { label: 'Atrasado', color: 'bg-rose-500', icon: Clock },
    at_risk: { label: 'Em Risco', color: 'bg-amber-500', icon: AlertTriangle },
    ahead: { label: 'Acima do Ritmo', color: 'bg-blue-500', icon: Sparkles },
    completed: { label: 'Meta Concluída', color: 'bg-emerald-600', icon: Trophy },
    emergency: { label: 'Modo Emergência', color: 'bg-red-600', icon: ShieldAlert }
  };

  const currentStatus = statusMap[plan.status];

  return (
    <div className="space-y-10 animate-in fade-in duration-700 selection:bg-primary/20">
      {/* Viciante Header: Momentum & Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 flex flex-col justify-center space-y-6">
          <div className="flex flex-wrap items-center gap-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }}
              className={cn(
                "px-4 py-1.5 rounded-full text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-lg",
                momentum.status === 'strong' ? "bg-emerald-500 shadow-emerald-500/20" : 
                momentum.status === 'average' ? "bg-amber-500 shadow-amber-500/20" : "bg-rose-500 shadow-rose-500/20"
              )}
            >
              <div className="flex items-center gap-2">
                <Flame className={cn("h-3 w-3 fill-current", momentum.status === 'strong' && "animate-pulse")} />
                RITMO: {momentum.label}
              </div>
            </motion.div>
            
            <Badge variant="outline" className="px-4 py-1.5 rounded-full border-slate-200 bg-white font-black text-[10px] uppercase tracking-[0.2em] text-slate-500">
              STREAK: {motivation.streakDays} DIAS
            </Badge>

            <div className="h-4 w-px bg-slate-200" />
            
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>

          <div className="space-y-2">
            <h2 className="text-5xl font-black text-slate-900 tracking-tighter leading-[1.1]">
              Faltam <span className="text-primary italic">{(plan.summary.newContacts + plan.summary.followUps) - (motivation.dailyProgress || 0)} ações</span> para<br /> 
              manter sua meta de <span className="text-primary">R$ {operational.monthlyRevenueGoal.toLocaleString('pt-BR')}</span>.
            </h2>
            <p className="text-slate-500 font-medium text-lg max-w-2xl leading-relaxed">
              Você está <span className="font-bold text-slate-900">18% acima</span> do seu melhor ritmo da semana. Mantenha o momentum.
            </p>
          </div>
          
          <div className="flex gap-4 pt-2">
            <Button 
              size="lg" 
              onClick={onStartFocus}
              className="bg-emerald-600 text-white hover:bg-emerald-700 rounded-2xl px-10 h-16 text-lg font-black uppercase tracking-widest shadow-2xl shadow-emerald-900/20 group transition-all hover:scale-[1.02] gap-3"
            >
              <ShieldCheck className="h-6 w-6" /> PROSPECÇÃO SEGURA <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>

        <Card className="lg:col-span-4 rounded-[3rem] border-slate-100 shadow-2xl bg-white overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-10 space-y-8 relative z-10">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Projeção do Mês</p>
              <div className="flex items-end gap-2">
                <p className="text-4xl font-black text-slate-900 leading-none tracking-tighter">
                  <AnimatedCurrency value={forecast.totalForecast} pulseColor="success" />
                </p>
                <Badge className="bg-emerald-50 text-emerald-600 border-none font-black text-[10px] mb-1">
                  +12% vs ONTEM
                </Badge>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-end text-[10px] font-black uppercase tracking-widest">
                <span className="text-slate-400">Gap para Meta</span>
                <span className="text-slate-900">R$ {forecast.gapToGoal?.toLocaleString('pt-BR')} restante</span>
              </div>
              <LiveProgress 
                value={(forecast.totalForecast / operational.monthlyRevenueGoal) * 100} 
                tone="primary" 
                height="lg"
                className="rounded-full"
              />
            </div>

            <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-400 uppercase">Status Operacional</span>
                <span className={cn("text-xs font-black uppercase mt-1", plan.status === 'emergency' ? "text-rose-500" : "text-emerald-500")}>
                  {currentStatus.label}
                </span>
              </div>
              <div className="h-10 w-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
                <Target className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {plan.status === 'emergency' && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-red-600 rounded-[2.5rem] p-8 text-white shadow-2xl border-4 border-red-400 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <ShieldAlert className="h-32 w-32" />
          </div>
          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-3">
              <Badge className="bg-white text-red-600 font-black uppercase">Modo Emergência Ativado</Badge>
              <span className="font-bold text-red-100">Desvio Crítico: {plan.summary.deviationPercentage}% abaixo do esperado</span>
            </div>
            <h3 className="text-3xl font-black tracking-tight">Plano de Recuperação Automático</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/10 p-4 rounded-2xl border border-white/10">
                <p className="text-[10px] font-black uppercase text-red-200">Meta de Abordagem</p>
                <p className="text-2xl font-black">{plan.recoveryPlan?.dailyContactsTarget} Leads/dia</p>
              </div>
              <div className="bg-white/10 p-4 rounded-2xl border border-white/10">
                <p className="text-[10px] font-black uppercase text-red-200">Meta de Follow-up</p>
                <p className="text-2xl font-black">{plan.recoveryPlan?.dailyFollowUpsTarget} Contatos/dia</p>
              </div>
              <div className="bg-white/10 p-4 rounded-2xl border border-white/10">
                <p className="text-[10px] font-black uppercase text-red-200">Fechamentos Necessários</p>
                <p className="text-2xl font-black">{plan.recoveryPlan?.requiredClosures}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {plan.recoveryPlan?.recommendedActions.map((action, i) => (
                <span key={i} className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold border border-white/10">
                  {action}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {plan.recommendations.map((rec, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={cn(
              "flex items-center gap-4 p-4 rounded-2xl border shadow-sm hover:shadow-md transition-all group",
              plan.status === 'emergency' ? "bg-red-50 border-red-100" : "bg-white border-slate-100"
            )}
          >
            <div className={cn(
              "h-10 w-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform",
              plan.status === 'emergency' ? "bg-red-100 text-red-600" : "bg-primary/5 text-primary"
            )}>
              <Brain className="h-5 w-5" />
            </div>
            <p className={cn(
              "text-xs font-bold leading-relaxed",
              plan.status === 'emergency' ? "text-red-900" : "text-slate-700"
            )}>{rec}</p>
          </motion.div>
        ))}
        {Object.entries(msgPerf.stylePerformance).slice(0, 1).map(([style, stats]: [string, any], i: number) => (
          <motion.div 
            key={`style-${i}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-100 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center text-emerald-600">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-black text-emerald-600 uppercase">Melhor Performance</p>
              <p className="text-xs font-bold text-emerald-900 leading-relaxed">"{style}" tem {stats.responseRate.toFixed(0)}% resposta.</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Execution Blocks */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-4">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest ml-1">Estratégia do Dia</h3>
          <div className="grid grid-cols-1 gap-3">
            <Card className="rounded-2xl border-primary/20 bg-primary/5 p-4 mb-2">
               <p className="text-[10px] font-black text-primary uppercase mb-2">IA Insights</p>
               <p className="text-xs font-bold text-slate-700 leading-tight">
                 {motivation.dailyProgress < operational.dailyLeadsNeeded ? "Priorize WhatsApp hoje: maior taxa de resposta histórica." : "Você está em excelente ritmo. Foco em qualificação agora."}
               </p>
            </Card>
            {blocks.map((block) => {
              const blockTasks = getTasksByBlock(block.id);
              const isActive = activeBlock === block.id;
              
              if (blockTasks.length === 0 && !isActive) return null;

              return (
                <button
                  key={block.id}
                  onClick={() => setActiveTab(block.id as any)}
                  className={cn(
                    "p-5 rounded-[1.5rem] border transition-all text-left group relative overflow-hidden",
                    isActive 
                      ? "bg-white border-primary shadow-xl shadow-primary/10 ring-1 ring-primary/20 scale-[1.02]" 
                      : "bg-white border-slate-100 shadow-sm hover:border-slate-300"
                  )}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className={cn("p-2 rounded-xl border", block.bg, block.color, block.border)}>
                      <block.icon className="h-4 w-4" />
                    </div>
                    <Badge variant="secondary" className="bg-slate-100 text-[10px] font-black">{blockTasks.length} Leads</Badge>
                  </div>
                  <h4 className="font-black text-slate-900 text-lg tracking-tight group-hover:text-primary transition-colors">{block.label}</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">Tempo Est: {blockTasks.length * 8} min</p>
                  
                  {isActive && (
                    <motion.div layoutId="active-indicator" className="absolute right-0 top-0 bottom-0 w-1.5 bg-primary" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-8">
          <Card className="rounded-[2.5rem] border-slate-100 bg-white shadow-xl overflow-hidden min-h-[500px] flex flex-col">
            <CardHeader className="p-8 pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
                    {activeBlock === 'closure' && <Trophy className="h-6 w-6 text-rose-500" />}
                    {activeBlock === 'followup' && <MessageCircle className="h-6 w-6 text-amber-500" />}
                    {activeBlock === 'new_contact' && <Zap className="h-6 w-6 text-blue-500" />}
                    {activeBlock === 'revision' && <Target className="h-6 w-6 text-slate-500" />}
                    {blocks.find(b => b.id === activeBlock)?.label}
                  </CardTitle>
                  <CardDescription className="text-sm font-medium mt-1">
                    {blocks.find(b => b.id === activeBlock)?.desc}
                  </CardDescription>
                </div>
                <Button 
                  onClick={onStartFocus}
                  className="rounded-full bg-violet-600 hover:bg-violet-700 shadow-lg shadow-violet-500/20 font-black uppercase tracking-widest gap-2"
                >
                  <Flame className="h-4 w-4 fill-current" /> Iniciar Bloco
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-8 pt-4 flex-1">
              <div className="space-y-4">
                {getTasksByBlock(activeBlock).length > 0 ? (
                  getTasksByBlock(activeBlock).map((task, i) => {
                    const lead = useProspectingStore.getState().leads.find(l => l.id === task.leadId);
                    return (
                      <motion.div 
                        key={task.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="p-5 rounded-3xl border border-slate-100 bg-slate-50/50 flex items-center justify-between group hover:bg-white hover:border-slate-200 transition-all hover:shadow-md"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-200 flex items-center justify-center font-black text-slate-500">
                            {lead?.companyName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h5 className="font-black text-slate-900 group-hover:text-primary transition-colors">{lead?.companyName}</h5>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-black text-primary uppercase bg-primary/5 px-2 py-0.5 rounded-full">Impacto: {task.priority}</span>
                              <span className="text-[10px] font-bold text-slate-400">· {task.reason}</span>
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-primary transition-colors group-hover:translate-x-1" />
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 opacity-50">
                    <CheckCircle2 className="h-12 w-12 text-emerald-500 mb-4" />
                    <p className="font-black text-slate-900 uppercase tracking-widest text-xs">Tudo concluído aqui!</p>
                    <p className="text-xs font-medium text-slate-500 mt-1">Ótimo trabalho. Selecione outro bloco de execução.</p>
                    {activeBlock === 'followup' && (
                      <p className="text-[10px] font-black text-emerald-600 uppercase mt-4">Bloco concluído. Você removeu pendências do caminho!</p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="p-8 pt-0 border-t border-slate-50 mt-auto">
              <div className="w-full flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ritmo do Dia</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className={cn("h-1.5 w-4 rounded-full", i <= motivation.dailyProgress % 5 ? "bg-primary" : "bg-slate-100")} />
                    ))}
                  </div>
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Total Previsto para Bloco: {getTasksByBlock(activeBlock).length * 8} MIN
                </p>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Learning & Evolution History */}
      <Card className="rounded-[2.5rem] border-slate-100 bg-white shadow-xl overflow-hidden">
        <CardHeader className="p-8 pb-4">
          <CardTitle className="text-xl font-black flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-primary" />
            Como você melhora ao longo do tempo
          </CardTitle>
          <CardDescription>A IA aprende com cada decisão e ajusta as sugestões para maximizar seu resultado.</CardDescription>
        </CardHeader>
        <CardContent className="p-8 pt-0">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-6">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">Top Estratégias (Resposta)</p>
              <div className="space-y-4">
                {Object.entries(msgPerf.stylePerformance)
                  .sort((a: [string, any], b: [string, any]) => b[1].responseRate - a[1].responseRate)
                  .slice(0, 3)
                  .map(([style, stats]: [string, any], i: number) => (
                  <div key={i} className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-700 capitalize">{style}</span>
                      <span className="text-primary">{stats.responseRate.toFixed(0)}%</span>
                    </div>
                    <Progress value={stats.responseRate} className="h-1 bg-slate-50" />
                  </div>
                ))}
              </div>
            </div>

            <div className="md:col-span-3">
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 <div className="p-4 rounded-3xl bg-slate-50 flex flex-col gap-1">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Evolução Resposta</p>
                   <p className="text-2xl font-black text-slate-900">+{msgPerf.evolution.length > 1 ? (msgPerf.evolution[msgPerf.evolution.length-1].responseRate - msgPerf.evolution[0].responseRate).toFixed(0) : 0}%</p>
                 </div>
                 <div className="p-4 rounded-3xl bg-emerald-50 flex flex-col gap-1">
                   <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Evolução Conversão</p>
                   <p className="text-2xl font-black text-emerald-700">+{msgPerf.evolution.length > 1 ? (msgPerf.evolution[msgPerf.evolution.length-1].conversionRate - msgPerf.evolution[0].conversionRate).toFixed(0) : 0}%</p>
                 </div>
                  <div className="p-4 rounded-3xl bg-violet-50 flex flex-col gap-1 col-span-2">
                    <p className="text-[10px] font-black text-violet-600 uppercase tracking-widest">Feedback IA</p>
                    <p className="text-xs font-bold text-violet-900 leading-tight">Suas decisões estão 12% mais precisas este mês.</p>
                  </div>
               </div>

               {/* SIMULAÇÃO DE IMPACTO */}
               <div className="mt-8 p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Simulador de Recuperação</h4>
                    <Badge variant="outline" className="text-[10px] border-slate-200">Beta</Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-bold uppercase">
                          <span className="text-slate-500">Volume de Contatos (+Leads)</span>
                          <span className="text-primary">+50%</span>
                        </div>
                        <Progress value={50} className="h-1.5 bg-slate-200" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-bold uppercase">
                          <span className="text-slate-500">Taxa de Conversão (+Eficiência)</span>
                          <span className="text-emerald-500">+15%</span>
                        </div>
                        <Progress value={30} className="h-1.5 bg-slate-200" />
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center">
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Impacto Estimado</p>
                      <p className="text-2xl font-black text-emerald-600">
                        <AnimatedCurrency value={Math.round(plan.summary.projectedRevenue * 0.25)} pulseColor="success" />
                      </p>
                      <p className="text-[10px] font-bold text-slate-500 italic mt-1">Suficiente para cobrir o gap de faturamento atual.</p>
                    </div>
                  </div>
               </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar Grid View */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {['Hoje', 'Amanhã', 'Semana'].map((label, idx) => (
          <Card key={label} className="rounded-[2rem] border-slate-100 shadow-sm bg-white overflow-hidden">
            <CardHeader className="p-6 border-b border-slate-50">
              <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center justify-between">
                {label}
                {idx === 0 && <Badge className="bg-emerald-50 text-emerald-600 border-none text-[8px] font-black">{plan.tasks.length} TAREFAS</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {idx === 0 ? (
                <div className="space-y-3">
                   {plan.tasks.slice(0, 3).map((t: any) => (
                     <div key={t.id} className="flex items-center gap-3">
                       <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                       <p className="text-xs font-bold text-slate-700 truncate">{t.reason}</p>
                     </div>
                   ))}
                   <p className="text-[10px] font-black text-primary uppercase text-center mt-4">Ver agenda completa</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 opacity-30">
                  <ShieldCheck className="h-8 w-8 text-slate-400 mb-2" />
                  <p className="text-[10px] font-black uppercase">IA em análise</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useProspectingStore } from './prospecting-store';
import { ProspectLead, MessageObjective, MessageOutcome, ConversationStage } from './types';
import { generatePitch } from './pitch-generator';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Progress } from "../../components/ui/progress";
import { 
  Send, X, ChevronRight, SkipForward, Clock, UserMinus, Ban, Sparkles, MessageSquare, Instagram, Mail, Zap, CheckCircle2, Copy, AlertTriangle, ArrowRight, TrendingUp, Brain, Rocket, MousePointer2, AlertCircle, Coffee, ChevronDown, ChevronUp, Target, ListChecks, History, Info, MessageCircle, Navigation, ShieldAlert, Trophy, RefreshCw, Lock, ShieldCheck, Building2, Globe, Search
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from "../../lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { addDays } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../../components/ui/dialog";
import { Label } from "../../components/ui/label";
import { RadioGroup, RadioGroupItem } from "../../components/ui/radio-group";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../../components/ui/collapsible";
import { CONVERSATION_ROADMAP, getNextStage, CLOSING_SCRIPTS } from './conversation-roadmap';
import { LeadPlaybook } from './LeadPlaybook';
import { AutonomousDecisionLayer } from './components/AutonomousDecisionLayer';
import { AnimatedCurrency, AnimatedPercent, AnimatedValue } from "../../components/ui/animated-value";
import { LiveProgress } from "../../components/ui/live-progress";

export const FocusMode: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { 
    getFocusQueue, getProcessedTodayCount, addContactHistory, markNoInterest, discardLead, updateLead, recordMessageResult, getMessagePerformance, dailyGoal, getMotivationStats, setConversationStage, getNextTargets, channelGoals, getDecisionHistory, getPersuasionProgression, getPsychologicalAnalysis, getEmotionalAnalysis, getDailyPlan, getDecisionScore, getNegotiationSimulation, getRevenueOrchestration, getAuditHistory, updateManualAnalysis, recordGoogleSearch, recordInstagramOpen
  } = useProspectingStore();

  const motivation = getMotivationStats();
  const nextTargets = getNextTargets();
  
  const [queueFilter, setQueueFilter] = useState<'all' | 'revision'>('all');
  const queue = getFocusQueue({ filter: queueFilter });
  const [currentIndex, setCurrentIndex] = useState(0);
  const plan = getDailyPlan();

  const lead = queue[currentIndex];
  const decisionHistory = lead ? getDecisionHistory(lead.id) : [];
  const lastDecision = decisionHistory[decisionHistory.length - 1];

  const [isCopied, setIsCopied] = useState(false);
  const [objective, setObjective] = useState<MessageObjective>('open_conversation');
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastHistoryId, setLastHistoryId] = useState<string | null>(null);
  const [isTurboMode, setIsTurboMode] = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [manualMessage, setManualMessage] = useState<string | null>(null);
  const [showPausaDialog, setShowPausaDialog] = useState(false);
  const [isReasonDialogOpen, setIsReasonDialogOpen] = useState(false);
  const [reasonType, setReasonType] = useState<'discard' | 'no_interest'>('discard');
  const [reason, setReason] = useState('');
  const [simulatedPrice, setSimulatedPrice] = useState<number>(0);
  const [analysisStartTime, setAnalysisStartTime] = useState<number>(Date.now());
  const [analysisTimer, setAnalysisTimer] = useState<number>(0);
  const [showRhythmWarning, setShowRhythmWarning] = useState(false);
  const lastActionTimeRef = useRef<number>(0);

  // Timer para recomendação de análise
  useEffect(() => {
    const interval = setInterval(() => {
      setAnalysisTimer(Math.floor((Date.now() - analysisStartTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [analysisStartTime]);

  const checkRhythm = useCallback(() => {
    const now = Date.now();
    const diff = now - lastActionTimeRef.current;
    
    if (lastActionTimeRef.current > 0 && diff < 5000) { // Increased to 5s for more "human" feel
      setShowRhythmWarning(true);
      toast.warning("Reduza a velocidade!", {
        description: "Ritmo muito rápido. Simule comportamento humano para evitar bloqueios.",
        icon: <ShieldAlert className="text-amber-500" />
      });
      setTimeout(() => setShowRhythmWarning(false), 3000);
      return false;
    }
    
    toast.info("Ritmo seguro detectado", {
      icon: <ShieldCheck className="text-emerald-500 w-4 h-4" />,
      duration: 2000
    });
    
    lastActionTimeRef.current = now;
    return true;
  }, []);

  const handleManualSearch = useCallback((type: 'google' | 'instagram') => {
    if (!lead) return;
    if (type === 'google') {
      const query = encodeURIComponent(lead.companyName || '');
      recordGoogleSearch(lead.id);
      window.open(`https://www.google.com/search?q=${query}`, '_blank');
    } else if (type === 'instagram') {
      const url = lead.instagramUrl || lead.socialDiscovery?.instagramUrl;
      recordInstagramOpen(lead.id);
      if (url) window.open(url, '_blank');
      else {
        const query = encodeURIComponent(`${lead.companyName} instagram`);
        window.open(`https://www.google.com/search?q=${query}`, '_blank');
      }
    }
  }, [lead, recordGoogleSearch, recordInstagramOpen]);

  useEffect(() => {
    if (lead?.revenueInsight?.suggestedPrice) {
      setSimulatedPrice(lead.revenueInsight.suggestedPrice);
    }
  }, [lead?.id, lead?.revenueInsight?.suggestedPrice]);

  const simulation = useMemo(() => {
    if (!lead) return null;
    return getNegotiationSimulation(lead.id, simulatedPrice);
  }, [lead?.id, simulatedPrice, getNegotiationSimulation]);
  const [activeStrategyMode, setActiveStrategyMode] = useState<'roadmap' | 'playbook' | 'audit'>('playbook');
  const [showClosureWarning, setShowClosureWarning] = useState(false);
  const [perfectMomentAlert, setPerfectMomentAlert] = useState(false);
  const { getDominantPlaybookInfo } = useProspectingStore();
  const dominantPlaybook = getDominantPlaybookInfo();
  
  const processedToday = getProcessedTodayCount();
  const remaining = queue.length;

  useEffect(() => {
    if (isOpen && queue.length === 0 && queueFilter === 'all') {
      toast.info("Fila de execução vazia! Bom trabalho.");
      onClose();
    }
  }, [isOpen, queue.length, queueFilter]);

  useEffect(() => {
    setAnalysisStartTime(Date.now());
    setAnalysisTimer(0);
    setStartTime(Date.now());
    setShowClosureWarning(false);
    
    if (lead?.closingChance && lead.closingChance > 85) {
      setPerfectMomentAlert(true);
      setTimeout(() => setPerfectMomentAlert(false), 5000);
    }
  }, [lead?.id]);

  const handleNext = useCallback(() => {
    if (!checkRhythm()) return;
    
    if (currentIndex < queue.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsCopied(false);
      setShowFeedback(false);
      setManualMessage(null);
    } else {
      toast.success("Você concluiu toda a fila!");
      onClose();
    }
  }, [currentIndex, queue.length, onClose, checkRhythm]);

  const suggestedChannel = lead?.whatsapp ? 'WhatsApp' : lead?.instagramUrl ? 'Instagram' : 'Email';
  const suggestedPitch = useMemo(() => {
    if (!lead) return "";
    const analysis = getPsychologicalAnalysis(lead.id);
    const emotional = getEmotionalAnalysis(lead.id);
    const pitches = generatePitch(lead, objective, analysis.profile, emotional.probableEmotion);
    if (suggestedChannel === 'WhatsApp') return pitches.whatsappShort;
    if (suggestedChannel === 'Instagram') return pitches.instagramDirect;
    return pitches.coldMail1;
  }, [lead, objective, suggestedChannel, getPsychologicalAnalysis, getEmotionalAnalysis]);

  const displayMessage = manualMessage ?? suggestedPitch;

  const handleConfirm = useCallback(() => {
    if (!lead || !checkRhythm()) return;
    
    // Alerta de Erro Crítico / Bloqueio Inteligente
    if (lead.warmupStatus === 'Frio' || lead.warmupStatus === 'Aquecendo') {
      toast.error("Risco de Bloqueio Detectado!", {
        description: "Este lead ainda está frio. Recomendamos seguir o fluxo de aquecimento (Google + Instagram) antes do WhatsApp.",
        icon: <ShieldAlert className="text-rose-500" />,
        duration: 5000
      });
      return;
    }

    const durationMs = Date.now() - startTime;
    const historyId = crypto.randomUUID();
    const persuasion = getPersuasionProgression(lead.id);
    addContactHistory(lead.id, {
      channel: suggestedChannel,
      status: 'confirmado',
      message: displayMessage,
      nextFollowUpAt: addDays(new Date(), 3).toISOString(),
      objective: objective,
      style: persuasion.recommendedStrategy,
      intensity: persuasion.recommendedIntensity,
      durationMs
    });
    setLastHistoryId(historyId);
    setShowFeedback(true);
    toast.success("Envio seguro confirmado!", {
      description: "Ritmo humano mantido. +1 conexão real.",
      icon: <CheckCircle2 className="text-emerald-500" />
    });
  }, [lead, displayMessage, suggestedChannel, objective, startTime, addContactHistory, getPersuasionProgression, checkRhythm]);

  const handleFeedback = (outcome: MessageOutcome, advanceStage: boolean = false) => {
    if (!lead) return;
    if (lastHistoryId) recordMessageResult(lead.id, lastHistoryId, outcome);
    if (advanceStage) {
      const next = getNextStage(lead.conversationStage || 'Novo');
      setConversationStage(lead.id, next);
    }
    
    // Reward for completing action
    toast.success("Ritmo Recuperado!", {
      description: "Lead de alto valor trabalhado. +1 avanço no pipeline.",
      duration: 3000
    });
    
    setShowFeedback(false);
    
    // Smooth transition to next
    setTimeout(() => {
      handleNext();
    }, 300);
  };

  const handleSkip = useCallback(() => { handleNext(); }, [handleNext]);

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    toast.success("Mensagem copiada!");
  }, []);

  const closingOpportunity = useMemo(() => {
    if (!lead) return { chance: 0, label: "Baixa", color: "text-slate-400" };
    const chance = lead.closingChance || 0;
    return {
      chance,
      label: chance >= 75 ? "Alta" : chance >= 45 ? "Média" : "Baixa",
      color: chance >= 75 ? "text-rose-500" : chance >= 45 ? "text-amber-500" : "text-slate-400"
    };
  }, [lead?.closingChance]);

  if (!lead) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center min-h-0 px-4 sm:px-8 pt-8 pb-[calc(7rem+env(safe-area-inset-bottom))] overflow-y-auto selection:bg-primary/30 [scrollbar-gutter:stable]">
      <AnimatePresence>
        {perfectMomentAlert && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed top-10 left-1/2 -translate-x-1/2 z-[110] bg-emerald-500 text-white px-8 py-4 rounded-full shadow-2xl flex items-center gap-4 border-2 border-emerald-400"
          >
            <Zap className="h-6 w-6 fill-white animate-pulse" />
            <span className="font-black text-lg uppercase tracking-tight">Agora é o melhor momento para fechar!</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full max-w-6xl h-fit min-h-0 flex flex-col gap-10 animate-in fade-in duration-700 relative">
        <AnimatePresence>
          {showRhythmWarning && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute -top-16 left-1/2 -translate-x-1/2 z-[120] bg-rose-600 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-rose-500"
            >
              <ShieldAlert className="w-5 h-5 animate-bounce" />
              <div className="flex flex-col">
                <span className="text-xs font-black uppercase tracking-widest">Ritmo Muito Rápido!</span>
                <span className="text-[10px] font-medium opacity-90">Simule comportamento humano para evitar bloqueios.</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between text-white border-b border-white/5 pb-6">
          <div className="flex items-center gap-8">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Progresso de Execução</span>
              <div className="flex items-center gap-4">
                <LiveProgress
                  value={(processedToday / Math.max(plan.summary.newContacts + 10, 1)) * 100}
                  tone={plan.status === 'emergency' ? 'destructive' : 'primary'}
                  height="sm"
                  className="w-48"
                />
                <span className="text-xs font-mono font-bold tracking-tighter">
                  <AnimatedValue value={processedToday} pulseColor="primary" /> <span className="text-muted-foreground">/</span> {plan.summary.newContacts + (plan.adjustment?.requiredDailyIncrease || 0)}
                </span>
              </div>
            </div>
            <div className="h-8 w-px bg-white/10 hidden md:block" />
            <div className="hidden md:flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Status da Meta</span>
              <Badge variant="outline" className={cn(
                "font-black uppercase tracking-widest border-none p-0 h-auto",
                plan.status === 'emergency' ? "text-destructive animate-pulse" : "text-success"
              )}>
                {plan.status === 'emergency' ? 'Modo Emergência' : (plan.summary.chanceOfHittingGoal === 'Alta' ? 'Meta Provável' : 'Meta em Risco')}
              </Badge>
            </div>
          </div>
          <Button variant="ghost" onClick={onClose} size="icon" className="text-white hover:bg-white/5 rounded-full transition-transform hover:rotate-90">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-10 min-h-0">
          <div className="lg:col-span-8 flex flex-col gap-10 min-h-0">
            {/* MODO PESQUISA MANUAL GUIADA */}
            <div className="bg-card/40 border border-white/10 p-8 rounded-[2.5rem] backdrop-blur-xl relative overflow-hidden group">
              {/* Indicador de Segurança */}
              <div className="absolute top-0 right-0 p-4 flex flex-col items-end gap-2">
                <div className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full border shadow-xl transition-all duration-500",
                  lead.warmupStatus === 'Pronto' ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400" :
                  lead.warmupStatus === 'Morno' ? "bg-amber-500/20 border-amber-500/50 text-amber-400" :
                  "bg-rose-500/20 border-rose-500/50 text-rose-400"
                )}>
                  <ShieldCheck className={cn("w-4 h-4", lead.warmupStatus === 'Pronto' && "animate-pulse")} />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    Modo Seguro: {lead.warmupStatus === 'Pronto' ? 'Seguro' : lead.warmupStatus === 'Morno' ? 'Atenção' : 'Risco'}
                  </span>
                </div>
                
                <div className={cn(
                  "flex items-center gap-2 px-4 py-1.5 rounded-full border transition-all duration-500",
                  analysisTimer < 15 ? "bg-amber-500/10 border-amber-500/30 text-amber-500" : "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                )}>
                  <Clock className={cn("w-3.5 h-3.5", analysisTimer < 15 && "animate-pulse")} />
                  <span className="text-[11px] font-black uppercase tracking-widest">{analysisTimer}s de análise</span>
                </div>
              </div>

              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white">Prospecção Segura (Anti-Bloqueio)</h3>
                  <p className="text-[10px] text-muted-foreground font-medium">Siga as etapas para garantir a melhor conversão e segurança</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
                {[
                  { key: 'companyExists', label: 'Empresa existe?', icon: Building2 },
                  { key: 'activeInstagram', label: 'Instagram Ativo?', icon: Instagram },
                  { key: 'hasWebsite', label: 'Tem Site Próprio?', icon: Globe },
                  { key: 'isRecentlyActive', label: 'Parece Ativo?', icon: Zap },
                  { key: 'worthContacting', label: 'Vale Contato?', icon: Target },
                ].map((item) => {
                  const isChecked = lead.manualAnalysis?.[item.key as keyof typeof lead.manualAnalysis];
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.key}
                      onClick={() => {
                        if (!checkRhythm()) return;
                        updateManualAnalysis(lead.id, { [item.key]: !isChecked });
                      }}
                      className={cn(
                        "flex items-center gap-3 p-4 rounded-2xl border transition-all duration-300 text-left group/btn",
                        isChecked 
                          ? "bg-emerald-500/10 border-emerald-500/50 text-white shadow-[0_0_20px_rgba(16,185,129,0.1)]" 
                          : "bg-white/5 border-white/10 text-muted-foreground hover:border-white/20 hover:bg-white/10"
                      )}
                    >
                      <div className={cn(
                        "p-2 rounded-xl transition-colors",
                        isChecked ? "bg-emerald-500 text-white" : "bg-white/5 text-muted-foreground"
                      )}>
                        {isChecked ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                      </div>
                      <span className="text-xs font-bold">{item.label}</span>
                    </button>
                  );
                })}
                {/* Extensão do Checklist para Redes Sociais */}
                {[
                  { key: 'instagramFollowed', label: 'Seguiu no Insta?', icon: Instagram },
                  { key: 'instagramLiked', label: 'Curtiu Posts?', icon: Zap },
                  { key: 'instagramPostsSeen', label: 'Viu Conteúdo?', icon: History },
                ].map((item) => {
                  const isChecked = lead.manualAnalysis?.[item.key as keyof typeof lead.manualAnalysis];
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.key}
                      onClick={() => {
                        if (!checkRhythm()) return;
                        updateManualAnalysis(lead.id, { [item.key]: !isChecked });
                      }}
                      className={cn(
                        "flex items-center gap-3 p-4 rounded-2xl border transition-all duration-300 text-left group/btn",
                        isChecked 
                          ? "bg-primary/10 border-primary/50 text-white shadow-[0_0_20px_rgba(var(--primary),0.1)]" 
                          : "bg-white/5 border-white/10 text-muted-foreground hover:border-white/20 hover:bg-white/10"
                      )}
                    >
                      <div className={cn(
                        "p-2 rounded-xl transition-colors",
                        isChecked ? "bg-primary text-white" : "bg-white/5 text-muted-foreground"
                      )}>
                        {isChecked ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="w-4 h-4" />}
                      </div>
                      <span className="text-xs font-bold">{item.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap gap-4 pt-6 border-t border-white/5">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleManualSearch('google')}
                  className="bg-white/5 border-white/10 hover:bg-white/10 rounded-xl h-12 px-6 gap-2"
                >
                  <Search className="w-4 h-4" />
                  <span className="text-xs font-black uppercase tracking-widest">Pesquisar no Google</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleManualSearch('instagram')}
                  className="bg-white/5 border-white/10 hover:bg-white/10 rounded-xl h-12 px-6 gap-2"
                >
                  <Instagram className="w-4 h-4" />
                  <span className="text-xs font-black uppercase tracking-widest">Validar no Instagram</span>
                </Button>
                
                {analysisTimer < 10 && (
                  <div className="flex items-center gap-2 text-[10px] font-bold text-amber-500 animate-in fade-in slide-in-from-left-4">
                    <AlertCircle className="w-3 h-3" />
                    <span>Recomendado: Analisar por pelo menos 15 segundos</span>
                  </div>
                )}
              </div>
            </div>

            {/* CAMADA DE DECISÃO AUTÔNOMA GUIADA */}
            <AutonomousDecisionLayer leadId={lead.id} onExecute={handleNext} />

            <div className="flex flex-col gap-2 mb-4">
              <h2 className="text-4xl font-bold text-white tracking-tighter">{lead.companyName}</h2>
              <p className="text-muted-foreground font-mono text-sm tracking-tighter">{lead.niche || 'Lead Qualificado'}</p>
            </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                  <div className="bg-card/30 border border-white/5 p-6 rounded-2xl backdrop-blur-sm group hover:border-success/30 transition-colors">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Valor do Lead</p>
                    <p className="text-3xl font-mono font-bold text-success">
                      <AnimatedCurrency value={lead.estimatedValue || 0} pulseColor="success" />
                    </p>
                    <p className="text-[9px] text-muted-foreground mt-2 font-medium">Impacto na Meta: <span className="text-success">+2.4%</span></p>
                  </div>
                  <div className="bg-card/30 border border-white/5 p-6 rounded-2xl backdrop-blur-sm group hover:border-primary/30 transition-colors">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Confiança IA</p>
                    <p className="text-3xl font-mono font-bold text-primary">
                      <AnimatedPercent value={getEmotionalAnalysis(lead.id).confidenceScore || 85} pulseColor="primary" showDelta={false} />
                    </p>
                    <p className="text-[9px] text-muted-foreground mt-2 font-medium">Precisão Histórica: <span className="text-primary">94.2%</span></p>
                  </div>
                  <div className="bg-card/30 border border-white/5 p-6 rounded-2xl backdrop-blur-sm group hover:border-accent/30 transition-colors">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Esforço Operacional</p>
                    <p className="text-3xl font-mono font-bold text-accent uppercase">{getEmotionalAnalysis(lead.id).effortRequired || 'Médio'}</p>
                    <p className="text-[9px] text-muted-foreground mt-2 font-medium">Tempo Médio: <span className="text-accent">4m 20s</span></p>
                  </div>
                  <div className="bg-card/30 border border-white/5 p-6 rounded-2xl backdrop-blur-sm group hover:border-white/10 transition-colors flex flex-col justify-center">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Qualidade do Lead</p>
                    <LiveProgress
                      value={getEmotionalAnalysis(lead.id).profitabilityScore || 50}
                      tone="accent"
                      height="md"
                      className="mb-2"
                    />
                    <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-tighter">Alto Potencial de Retenção</p>
                  </div>
                </div>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-6 min-h-0">
            <Card className="bg-card border-border rounded-[2.5rem] overflow-hidden shadow-2xl border-l-4 border-l-primary h-full">
              <CardHeader className="p-6 pb-2">
                {/* Micro-explicações de Educação */}
                <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-2xl mb-6">
                  <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Info className="w-3 h-3" /> Educação Prospecção Segura
                  </p>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-bold text-white">Por que não abordar direto?</p>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">Contatos frios sem aquecimento aumentam o risco de denúncia e bloqueio no WhatsApp.</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Por que aguardar melhora resposta?</p>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">O tempo ideal entre o aquecimento no Instagram e o contato gera uma conexão natural.</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button onClick={() => setActiveStrategyMode('playbook')} className={cn("text-xs font-black uppercase tracking-widest pb-1", activeStrategyMode === 'playbook' ? "text-white border-b-2 border-primary" : "text-muted-foreground")}>AI Playbook</button>
                  <button onClick={() => setActiveStrategyMode('roadmap')} className={cn("text-xs font-black uppercase tracking-widest pb-1", activeStrategyMode === 'roadmap' ? "text-white border-b-2 border-primary" : "text-muted-foreground")}>Roteiro</button>
                  <button onClick={() => setActiveStrategyMode('audit')} className={cn("text-xs font-black uppercase tracking-widest pb-1", activeStrategyMode === 'audit' ? "text-white border-b-2 border-primary" : "text-muted-foreground")}>Auditoria</button>
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-2 overflow-y-auto">
                {activeStrategyMode === 'playbook' ? <LeadPlaybook leadId={lead.id} /> : 
                 activeStrategyMode === 'roadmap' ? (
                  <div className="text-muted-foreground text-sm space-y-4">
                    <p className="font-bold text-white uppercase text-[10px]">Caminho Ideal Detectado</p>
                    <p>Fase atual: {lead.conversationStage || 'Novo'}</p>
                    <p>Próxima meta: {getEmotionalAnalysis(lead.id).nextObjective}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="font-bold text-white uppercase text-[10px] flex items-center gap-2">
                      <ShieldCheck className="w-3 h-3 text-emerald-500" /> Histórico Auditável de Decisões
                    </p>
                    <div className="space-y-3">
                      {getAuditHistory().filter(a => a.leadId === lead.id).length === 0 && (
                        <p className="text-[10px] text-muted-foreground italic">Nenhuma decisão auditada para este lead ainda.</p>
                      )}
                      {getAuditHistory().filter(a => a.leadId === lead.id).map((audit, idx) => (
                        <div key={audit.id} className="p-3 bg-white/5 border border-white/10 rounded-xl">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-[10px] font-bold text-white">{audit.decision}</span>
                            <Badge className={cn("text-[8px] h-4", audit.impact === 'Positivo' ? "bg-success" : audit.impact === 'Negativo' ? "bg-destructive" : "bg-muted")}>
                              {audit.impact}
                            </Badge>
                          </div>
                          <p className="text-[9px] text-muted-foreground leading-tight mb-2">{audit.strategy}</p>
                          <div className="flex items-center gap-3 text-[8px] text-muted-foreground uppercase font-black">
                            <span>{audit.channel}</span>
                            <span>{new Date(audit.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {audit.outcome && <span>Resultado: {audit.outcome}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* FOOTER ACTIONS - FIXED AT BOTTOM */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/90 to-transparent border-t border-white/5 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setReasonType('no_interest');
                setIsReasonDialogOpen(true);
              }}
              className="rounded-2xl border-white/10 text-white hover:bg-white/5 h-12 px-6 font-bold uppercase tracking-widest text-[10px] gap-2"
            >
              <UserMinus className="w-4 h-4 text-amber-500" /> Sem Interesse
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setReasonType('discard');
                setIsReasonDialogOpen(true);
              }}
              className="rounded-2xl border-white/10 text-white hover:bg-white/5 h-12 px-6 font-bold uppercase tracking-widest text-[10px] gap-2"
            >
              <Ban className="w-4 h-4 text-rose-500" /> Descartar Lead
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={handleSkip}
              className="rounded-2xl text-muted-foreground hover:text-white hover:bg-white/5 h-12 px-6 font-bold uppercase tracking-widest text-[10px] gap-2"
            >
              Pular <SkipForward className="w-4 h-4" />
            </Button>
            <div className="h-8 w-px bg-white/10" />
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Tempo de Sessão</span>
              <span className="font-mono text-white text-sm font-bold tabular-nums">
                {Math.floor((Date.now() - startTime) / 60000)}m {Math.floor(((Date.now() - startTime) % 60000) / 1000)}s
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* DIALOG DE MOTIVO (DESCARTE / SEM INTERESSE) */}
      <Dialog open={isReasonDialogOpen} onOpenChange={setIsReasonDialogOpen}>
        <DialogContent className="bg-[#0F0F0F] border-white/10 text-white rounded-[2rem] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black flex items-center gap-3">
              {reasonType === 'discard' ? (
                <>
                  <Ban className="w-6 h-6 text-rose-500" />
                  Confirmar Descarte
                </>
              ) : (
                <>
                  <UserMinus className="w-6 h-6 text-amber-500" />
                  Marcar Sem Interesse
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground font-medium py-2">
              {reasonType === 'discard' 
                ? "O lead será removido permanentemente da sua fila de execução. Por que você está descartando este lead?"
                : "O cliente sinalizou que não quer o serviço agora. Qual o motivo do desinteresse?"}
            </DialogDescription>
          </DialogHeader>

          <div className="py-6">
            <RadioGroup value={reason} onValueChange={setReason} className="grid grid-cols-1 gap-3">
              {(reasonType === 'discard' ? [
                "Dados incorretos / Bounce",
                "Empresa fechada / Inativa",
                "Fora do perfil ideal (ICP)",
                "Lead Duplicado",
                "Outro motivo"
              ] : [
                "Já possui agência/parceiro",
                "Sem orçamento no momento",
                "Não é o decisor",
                "Achou o serviço caro",
                "Sem interesse geral"
              ]).map((opt) => (
                <div key={opt} className="flex items-center space-x-3 p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/20 transition-all cursor-pointer group">
                  <RadioGroupItem value={opt} id={opt} className="border-white/20 text-primary" />
                  <Label htmlFor={opt} className="flex-1 cursor-pointer font-bold text-sm group-hover:text-white transition-colors">{opt}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <DialogFooter className="gap-3">
            <Button variant="ghost" onClick={() => setIsReasonDialogOpen(false)} className="rounded-xl font-bold h-12 text-muted-foreground">Cancelar</Button>
            <Button 
              className={cn(
                "rounded-xl font-black h-12 flex-1 shadow-lg",
                reasonType === 'discard' ? "bg-rose-600 hover:bg-rose-700" : "bg-amber-600 hover:bg-amber-700"
              )}
              disabled={!reason}
              onClick={() => {
                if (reasonType === 'discard') {
                  discardLead(lead.id, reason);
                  toast.error("Lead descartado e removido do fluxo.");
                } else {
                  markNoInterest(lead.id, reason);
                  toast.warning("Marcar sem interesse: Lead movido para o arquivo.");
                }
                setIsReasonDialogOpen(false);
                setReason('');
                handleNext();
              }}
            >
              Confirmar Operação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useProspectingStore } from './prospecting-store';
import { ProspectLead, MessageObjective, MessageOutcome, ConversationStage } from './types';
import { generatePitch } from './pitch-generator';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Progress } from "../../components/ui/progress";
import { 
  Send, X, ChevronRight, SkipForward, Clock, UserMinus, Ban, Sparkles, MessageSquare, Instagram, Mail, Zap, CheckCircle2, Copy, AlertTriangle, ArrowRight, TrendingUp, Brain, Rocket, MousePointer2, AlertCircle, Coffee, ChevronDown, ChevronUp, Target, ListChecks, History, Info, MessageCircle, Navigation, ShieldAlert, Trophy, RefreshCw, Lock, ShieldCheck, Building2, Globe, Search, Activity
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
  const getFocusQueue = useProspectingStore(state => state.getFocusQueue);
  const getProcessedTodayCount = useProspectingStore(state => state.getProcessedTodayCount);
  const addContactHistory = useProspectingStore(state => state.addContactHistory);
  const markNoInterest = useProspectingStore(state => state.markNoInterest);
  const discardLead = useProspectingStore(state => state.discardLead);
  const updateLead = useProspectingStore(state => state.updateLead);
  const recordMessageResult = useProspectingStore(state => state.recordMessageResult);
  const getMessagePerformance = useProspectingStore(state => state.getMessagePerformance);
  const dailyGoal = useProspectingStore(state => state.dailyGoal);
  const getMotivationStats = useProspectingStore(state => state.getMotivationStats);
  const setConversationStage = useProspectingStore(state => state.setConversationStage);
  const getNextTargets = useProspectingStore(state => state.getNextTargets);
  const channelGoals = useProspectingStore(state => state.channelGoals);
  const getDecisionHistory = useProspectingStore(state => state.getDecisionHistory);
  const getPersuasionProgression = useProspectingStore(state => state.getPersuasionProgression);
  const getPsychologicalAnalysis = useProspectingStore(state => state.getPsychologicalAnalysis);
  const getEmotionalAnalysis = useProspectingStore(state => state.getEmotionalAnalysis);
  const getDailyPlan = useProspectingStore(state => state.getDailyPlan);
  const getDecisionScore = useProspectingStore(state => state.getDecisionScore);
  const getNegotiationSimulation = useProspectingStore(state => state.getNegotiationSimulation);
  const getRevenueOrchestration = useProspectingStore(state => state.getRevenueOrchestration);
  const getAuditHistory = useProspectingStore(state => state.getAuditHistory);
  const updateManualAnalysis = useProspectingStore(state => state.updateManualAnalysis);
  const recordGoogleSearch = useProspectingStore(state => state.recordGoogleSearch);
  const recordInstagramOpen = useProspectingStore(state => state.recordInstagramOpen);
  const getDominantPlaybookInfo = useProspectingStore(state => state.getDominantPlaybookInfo);

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
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center min-h-0 px-4 sm:px-6 pt-4 pb-[calc(4rem+env(safe-area-inset-bottom))] overflow-y-auto selection:bg-primary/30 [scrollbar-gutter:stable]">
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

      <div className="w-full max-w-6xl h-fit min-h-0 flex flex-col gap-5 animate-in fade-in duration-500 relative">
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

        <div className="flex items-center justify-between text-white border-b border-white/5 pb-3">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <LiveProgress
                value={(processedToday / Math.max(plan.summary.newContacts + 10, 1)) * 100}
                tone={plan.status === 'emergency' ? 'destructive' : 'primary'}
                height="sm"
                className="w-32"
              />
              <span className="text-[10px] font-mono font-semibold tabular-nums text-muted-foreground">
                <AnimatedValue value={processedToday} pulseColor="primary" />/{plan.summary.newContacts + (plan.adjustment?.requiredDailyIncrease || 0)}
              </span>
            </div>
            <span className={cn(
              "text-[10px] font-semibold uppercase tracking-wider hidden md:inline",
              plan.status === 'emergency' ? "text-destructive" : "text-emerald-400/70"
            )}>
              {plan.status === 'emergency' ? 'Emergência' : (plan.summary.chanceOfHittingGoal === 'Alta' ? 'Meta Provável' : 'Meta em Risco')}
            </span>
          </div>
          <Button variant="ghost" onClick={onClose} size="icon" className="text-white/60 hover:text-white hover:bg-white/5 rounded-full h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 gap-4 lg:gap-6 min-h-0">
          <div className="xl:col-span-8 flex flex-col gap-4 min-h-0">
            {/* CENÁRIO DE OPERAÇÃO - REESTRUTURADO PARA DENSIDADE */}
            <div className="bg-white/[0.03] border border-white/10 p-3 sm:p-4 rounded-xl relative overflow-hidden flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Activity className="w-4 h-4 text-primary/70 shrink-0" aria-hidden="true" />
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-white/90">Cenário de Operação</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-[9px] font-black uppercase px-2 py-0.5 rounded-md",
                    lead.warmupStatus === 'Pronto' ? "bg-emerald-500/10 text-emerald-400" :
                    lead.warmupStatus === 'Morno' ? "bg-amber-500/10 text-amber-400" :
                    "bg-rose-500/10 text-rose-400"
                  )}>
                    {lead.warmupStatus === 'Pronto' ? 'Seguro' : lead.warmupStatus === 'Morno' ? 'Atenção' : 'Risco'}
                  </span>
                  <span className="text-[10px] font-mono text-white/30 tabular-nums">
                    {analysisTimer}s
                  </span>
                </div>
              </div>

              {/* Summary Stats Row from Image */}
              <div className="grid grid-cols-3 gap-2 border-b border-white/[0.04] pb-3 mb-1">
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-tighter">Prospects</span>
                  <span className="text-sm font-black text-white">{plan.summary.newContacts}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-tighter">Contatos</span>
                  <span className="text-sm font-black text-white">{processedToday}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-tighter">Canal</span>
                  <div className="flex items-center gap-1">
                    <Instagram className="w-3 h-3 text-pink-500/80" />
                    <Zap className="w-3 h-3 text-emerald-500/80" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {[
                  { key: 'companyExists', label: 'Empresa', icon: Building2 },
                  { key: 'activeInstagram', label: 'Instagram', icon: Instagram },
                  { key: 'hasWebsite', label: 'Site', icon: Globe },
                  { key: 'isRecentlyActive', label: 'Ativo', icon: Zap },
                  { key: 'worthContacting', label: 'Vale contato', icon: Target },
                  { key: 'instagramFollowed', label: 'Seguiu', icon: Instagram },
                  { key: 'instagramLiked', label: 'Curtiu', icon: Zap },
                  { key: 'instagramPostsSeen', label: 'Viu posts', icon: History },
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
                        "flex items-center gap-2 px-2 py-1.5 rounded-lg border transition-all text-left",
                        isChecked 
                          ? "bg-emerald-500/10 border-emerald-500/30 text-white" 
                          : "bg-white/[0.01] border-white/[0.04] text-muted-foreground/60 hover:border-white/10"
                      )}
                    >
                      {isChecked ? <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" /> : <Icon className="w-3 h-3 shrink-0 opacity-40" />}
                      <span className="text-[10px] font-bold truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-white/[0.04]">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleManualSearch('google')}
                  className="h-7 px-2.5 text-[10px] font-bold gap-1.5 text-muted-foreground/70 hover:text-white hover:bg-white/5"
                >
                  <Search className="w-3 h-3" /> Google
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleManualSearch('instagram')}
                  className="h-7 px-2.5 text-[10px] font-bold gap-1.5 text-muted-foreground/70 hover:text-white hover:bg-white/5"
                >
                  <Instagram className="w-3 h-3" /> Instagram
                </Button>
                {analysisTimer < 10 && (
                  <span className="text-[9px] text-amber-500/60 font-medium ml-auto hidden sm:inline">
                    Analise por +{10 - analysisTimer}s
                  </span>
                )}
              </div>
            </div>

            {/* CAMADA DE DECISÃO AUTÔNOMA GUIADA */}
            <AutonomousDecisionLayer leadId={lead.id} onExecute={handleNext} />

            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl font-bold text-white tracking-tight">{lead.companyName}</h2>
              <span className="text-xs text-muted-foreground font-mono">{lead.niche || 'Lead'}</span>
            </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                  <div className="bg-card/20 border border-white/[0.04] p-3 rounded-lg">
                    <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1">Valor</p>
                    <p className="text-lg font-mono font-bold text-emerald-400/80">
                      <AnimatedCurrency value={lead.estimatedValue || 0} pulseColor="success" />
                    </p>
                  </div>
                  <div className="bg-card/20 border border-white/[0.04] p-3 rounded-lg">
                    <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1">Confiança</p>
                    <p className="text-lg font-mono font-bold text-primary/80">
                      <AnimatedPercent value={getEmotionalAnalysis(lead.id).confidenceScore || 85} pulseColor="primary" showDelta={false} />
                    </p>
                  </div>
                  <div className="bg-card/20 border border-white/[0.04] p-3 rounded-lg">
                    <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1">Esforço</p>
                    <p className="text-sm font-bold text-white/70 uppercase">{getEmotionalAnalysis(lead.id).effortRequired || 'Médio'}</p>
                  </div>
                  <div className="bg-card/20 border border-white/[0.04] p-3 rounded-lg">
                    <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1">Qualidade</p>
                    <LiveProgress
                      value={getEmotionalAnalysis(lead.id).profitabilityScore || 50}
                      tone="accent"
                      height="sm"
                    />
                  </div>
                </div>
          </div>

          <div className="xl:col-span-4 flex flex-col gap-4 min-h-0">
            <Card className="bg-card border-border rounded-xl overflow-hidden border-l-2 border-l-primary/50 flex flex-col min-h-0">
              <CardHeader className="p-3 pb-2">
                {/* Educação como disclosure */}
                <Collapsible>
                  <CollapsibleTrigger className="w-full flex items-center gap-2 text-[10px] text-emerald-400/70 font-semibold uppercase tracking-wider hover:text-emerald-400 transition-colors py-1">
                    <Info className="w-3 h-3" aria-hidden="true" />
                    <span>Educação Prospecção Segura</span>
                    <ChevronDown className="w-3 h-3 ml-auto" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2 space-y-1.5 text-xs text-muted-foreground pb-2">
                    <p><span className="font-semibold text-white/80">Não abordar direto:</span> Contatos frios aumentam risco de bloqueio.</p>
                    <p><span className="font-semibold text-white/80">Aguardar resposta:</span> Aquecimento no Instagram gera conexão natural.</p>
                  </CollapsibleContent>
                </Collapsible>

                <div className="flex gap-3 mt-2" role="tablist" aria-label="Modo de estratégia">
                  <button role="tab" aria-selected={activeStrategyMode === 'playbook'} onClick={() => setActiveStrategyMode('playbook')} className={cn("text-[10px] font-bold uppercase tracking-wider pb-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded-sm", activeStrategyMode === 'playbook' ? "text-white border-b border-primary" : "text-muted-foreground")}>Playbook</button>
                  <button role="tab" aria-selected={activeStrategyMode === 'roadmap'} onClick={() => setActiveStrategyMode('roadmap')} className={cn("text-[10px] font-bold uppercase tracking-wider pb-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded-sm", activeStrategyMode === 'roadmap' ? "text-white border-b border-primary" : "text-muted-foreground")}>Roteiro</button>
                  <button role="tab" aria-selected={activeStrategyMode === 'audit'} onClick={() => setActiveStrategyMode('audit')} className={cn("text-[10px] font-bold uppercase tracking-wider pb-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded-sm", activeStrategyMode === 'audit' ? "text-white border-b border-primary" : "text-muted-foreground")}>Auditoria</button>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-5 pt-2 max-h-[calc(100dvh-22rem)] overflow-y-auto [overscroll-behavior:contain] [scrollbar-gutter:stable] min-h-0">
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
      <div className="fixed bottom-0 left-0 right-0 px-4 py-3 bg-black/95 border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                setReasonType('no_interest');
                setIsReasonDialogOpen(true);
              }}
              className="h-8 px-3 text-[10px] font-semibold gap-1.5 text-muted-foreground hover:text-amber-400"
            >
              <UserMinus className="w-3 h-3" /> Sem Interesse
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                setReasonType('discard');
                setIsReasonDialogOpen(true);
              }}
              className="h-8 px-3 text-[10px] font-semibold gap-1.5 text-muted-foreground hover:text-rose-400"
            >
              <Ban className="w-3 h-3" /> Descartar
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleSkip}
              className="h-8 px-3 text-[10px] font-semibold gap-1.5 text-muted-foreground hover:text-white"
            >
              Pular <SkipForward className="w-3 h-3" />
            </Button>
            <span className="text-[10px] font-mono text-muted-foreground/60 tabular-nums">
              {Math.floor((Date.now() - startTime) / 60000)}m {Math.floor(((Date.now() - startTime) % 60000) / 1000)}s
            </span>
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
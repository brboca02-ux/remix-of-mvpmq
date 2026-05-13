import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useServerFn } from "@tanstack/react-start";
import {
  generateMakeVariants,
  sendLeadToMake,
  type MakeLeadPayload,
} from "@/lib/make-integration.functions";
import { updateLeadOperation } from "@/lib/leads-import.functions";
import { 
  recordLearningAction,
  analyzeUserStyle
} from "@/lib/ai-learning.functions";
import { 
  Send, Loader2, CheckCircle2, AlertTriangle, MessageCircle, Mail, Instagram, 
  Settings2, RotateCcw, UserCheck, Eye, Edit3, Smartphone, Calendar, 
  CheckCircle, ShieldAlert, History, MessageSquare, ListChecks, Info, Brain, Zap, TrendingUp,
  ThumbsDown, Clock, Target, XCircle, Sparkles
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import type { ProspectLead, ContactStatus } from "@/modules/prospecting/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

// --- Design Tokens / Theme Config ---
const THEME = {
  radius: "rounded-xl",
  border: "border-slate-200 dark:border-slate-800",
  bgMuted: "bg-slate-50 dark:bg-slate-900/40",
  textMuted: "text-slate-500 dark:text-slate-400",
  primary: "violet-600",
  primaryHover: "violet-700",
};

interface SendToMakeDialogProps {
  lead: ProspectLead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChanged?: (newStatus: string) => void;
}

type Channel = "whatsapp" | "email" | "instagram";
type SendStatus = "idle" | "sending" | "delivered" | "retrying" | "failed";
type AbordagemType = "first" | "followup1" | "followup2" | "last";

// --- Mockup Components ---
const WhatsAppMockup = ({ message }: { message: string }) => (
  <div className={cn("bg-[#e5ddd5] dark:bg-[#0b141a] p-4 border shadow-inner", THEME.radius, THEME.border)}>
    <div className="relative ml-0 mr-auto max-w-[90%] rounded-lg bg-white p-3 shadow-sm dark:bg-[#1f2c33] dark:text-[#e9edef]">
      <div className="absolute -left-2 top-0 h-4 w-4 bg-white dark:bg-[#1f2c33] [clip-path:polygon(100%_0,0_0,100%_100%)]" />
      <p className="whitespace-pre-wrap text-[13px] leading-relaxed">{message || "Mensagem vazia"}</p>
      <div className="mt-1 flex justify-end">
        <span className="text-[10px] text-slate-400">12:45</span>
      </div>
    </div>
  </div>
);

const EmailMockup = ({ subject, message }: { subject: string, message: string }) => (
  <div className={cn("border bg-background overflow-hidden shadow-sm", THEME.radius, THEME.border)}>
    <div className="border-b bg-slate-50 dark:bg-slate-900/50 p-3 flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        <div className="h-2 w-2 rounded-full bg-slate-300" />
        <div className="h-2 w-2 rounded-full bg-slate-300" />
        <div className="h-2 w-2 rounded-full bg-slate-300" />
      </div>
      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Email View</div>
    </div>
    <div className="p-5 space-y-4">
      <div className="space-y-1 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase w-12">Subject:</span>
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{subject || "(Sem Assunto)"}</span>
        </div>
      </div>
      <div className="whitespace-pre-wrap text-[13px] leading-relaxed text-slate-600 dark:text-slate-300 min-h-[100px]">
        {message || "O corpo do e-mail aparecerá aqui..."}
      </div>
    </div>
  </div>
);

const InstagramMockup = ({ message }: { message: string }) => (
  <div className={cn("border bg-background p-5 shadow-sm", THEME.radius, THEME.border)}>
    <div className="flex items-center gap-3 mb-5 border-b border-slate-100 dark:border-slate-800 pb-3">
      <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
        <Instagram className="h-4 w-4 text-slate-400" />
      </div>
      <div className="flex flex-col">
        <span className="text-xs font-bold leading-none">Instagram DM</span>
        <span className="text-[10px] text-slate-400">Preview</span>
      </div>
    </div>
    <div className="flex flex-col gap-3">
       <div className="ml-auto mr-0 max-w-[85%] rounded-[18px] rounded-tr-sm bg-indigo-600 p-3.5 text-white shadow-sm">
        <p className="whitespace-pre-wrap text-[13px] leading-relaxed">{message || "Sua mensagem do Instagram..."}</p>
      </div>
    </div>
  </div>
);

import { useProspectingStore } from "@/modules/prospecting/prospecting-store";
import { MessageObjective, MessageOutcome, ConversationStage } from "@/modules/prospecting/types";

export function SendToMakeDialog({ lead, open, onOpenChange, onStatusChanged }: SendToMakeDialogProps) {
  const { recordMessageResult, addContactHistory, getPersuasionProgression, getReadyResponses, setConversationStage } = useProspectingStore();
  const generateFn = useServerFn(generateMakeVariants);
  const sendFn = useServerFn(sendLeadToMake);
  const updateOperationFn = useServerFn(updateLeadOperation);
  const recordLearningFn = useServerFn(recordLearningAction);
  const analyzeStyleFn = useServerFn(analyzeUserStyle);


  const [variantA, setVariantA] = useState("");
  const [variantB, setVariantB] = useState("");
  const [variantC, setVariantC] = useState("");
  const [activeVariant, setActiveVariant] = useState<"A" | "B" | "C">("A");
  const [tone, setTone] = useState("profissional");
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeGenerationChannel, setActiveGenerationChannel] = useState<Channel>("whatsapp");
  const [emailSubject, setEmailSubject] = useState("");
  const [updateStatus, setUpdateStatus] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [sendStatus, setSendStatus] = useState<SendStatus>("idle");
  const [sendProgress, setSendProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [usedAi, setUsedAi] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [confirmStep, setConfirmStep] = useState<"compose" | "confirm">("compose");
  const [abordagemType, setAbordagemType] = useState<AbordagemType>("first");
  const [objective, setObjective] = useState<MessageObjective>("open_conversation");
  const [strategy, setStrategy] = useState<string>("neutro");
  const [intensity, setIntensity] = useState<"leve" | "medio" | "forte">("leve");
  const [strategyReason, setStrategyReason] = useState<string>("");
  const [intensityReason, setIntensityReason] = useState<string>("");
  const [progression, setProgression] = useState<any>(null);
  const [contactNotes, setContactNotes] = useState("");
  const [isSavingConfirmation, setIsSavingConfirmation] = useState(false);
  const [showOutcomeFeedback, setShowOutcomeFeedback] = useState(false);
  const [lastHistoryId, setLastHistoryId] = useState<string | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [currentConversationStage, setCurrentConversationStage] = useState<ConversationStage>('Novo');

  const scenarios = [
    { id: 'quanto custa?', label: 'Quanto custa?', icon: Info },
    { id: 'me explica melhor', label: 'Explica melhor', icon: MessageCircle },
    { id: 'não tenho interesse', label: 'Sem interesse', icon: ThumbsDown },
    { id: 'me chama depois', label: 'Me chama depois', icon: Clock },
    { id: 'qualificação', label: 'Qualificar', icon: Target },
    { id: 'interesse', label: 'Interesse', icon: TrendingUp },
    { id: 'fechamento', label: 'Fechar', icon: CheckCircle },
    { id: 'objeção_agora_não', label: 'Objeção: Agora não', icon: ShieldAlert },
    { id: 'objeção_sem_verba', label: 'Objeção: Sem verba', icon: ShieldAlert },
    { id: 'encerramento_vácuo', label: 'Vácuo', icon: XCircle },
  ];

  const conversationStages: { id: ConversationStage, label: string, icon: any, color: string }[] = [
    { id: 'Novo', label: 'Novo', icon: Zap, color: 'text-amber-500' },
    { id: 'Primeira resposta', label: 'Resposta', icon: MessageSquare, color: 'text-emerald-500' },
    { id: 'Engajamento inicial', label: 'Engajamento', icon: Zap, color: 'text-violet-500' },
    { id: 'Diagnóstico', label: 'Diagnóstico', icon: Target, color: 'text-blue-500' },
    { id: 'Apresentação de valor', label: 'Valor', icon: Sparkles, color: 'text-amber-600' },
    { id: 'Interesse', label: 'Interesse', icon: TrendingUp, color: 'text-emerald-600' },
    { id: 'Objeção', label: 'Objeção', icon: ShieldAlert, color: 'text-rose-500' },
    { id: 'Negociação', label: 'Negociação', icon: ListChecks, color: 'text-indigo-500' },
    { id: 'Fechamento', label: 'Fechamento', icon: CheckCircle, color: 'text-emerald-700' },
    { id: 'Pós-fechamento', label: 'Pós-fechamento', icon: History, color: 'text-slate-500' },
  ];

  useEffect(() => {
    if (!open || !lead) return;
    const detected: Channel[] = [];
    if (lead.whatsapp) detected.push("whatsapp");
    if (lead.email) detected.push("email");
    if (lead.instagramHandle) detected.push("instagram");
    
    const initialChannel = detected[0] || "whatsapp";
    setChannels(detected.length > 0 ? [detected[0]] : []);
    setActiveGenerationChannel(initialChannel);
    setEmailSubject(`Proposta para ${lead.companyName}`);
    setSendStatus("idle");
    setErrorMsg(null);
    setActiveVariant("A");
    setIsPreviewMode(false);

    // Progressive Persuasion Logic
    const progressionData = getPersuasionProgression(lead.id);
    setProgression(progressionData);
    
    setAbordagemType(progressionData.stage);
    setStrategy(progressionData.recommendedStrategy);
    setStrategyReason(progressionData.reasoning);
    setIntensity(progressionData.recommendedIntensity);
    setIntensityReason(`Baseado em comportamento: ${progressionData.behavior}`);
    setCurrentConversationStage(lead.conversationStage || 'Novo');
    setSelectedScenario(null);

    void generateVariants(initialChannel, progressionData.stage, progressionData.recommendedStrategy, progressionData.recommendedIntensity, progressionData.reasoning);
  }, [open, lead?.id]);

  async function generateVariants(
    channel: Channel, 
    type?: AbordagemType, 
    currentStrategy?: string, 
    currentIntensity?: "leve" | "medio" | "forte",
    behaviorContext?: string
  ) {
    if (!lead) return;
    setGenerating(true);
    try {
      const payload: MakeLeadPayload = leadToPayload(lead);
      const res = await generateFn({
        data: {
          lead: payload,
          tone,
          channel,
          type: type || abordagemType,
          objective: objective,
          behaviorContext: behaviorContext || strategyReason,
          existingPitch: lead.generatedPitch?.whatsappShort || lead.generatedPitch?.coldMail1 || null,
        },
      });
      setVariantA(res?.variantA ?? "");
      setVariantB(res?.variantB ?? "");
      setVariantC(res?.variantC ?? "");
      setUsedAi(Boolean(res?.used_ai));

      // Learning: AI Suggested something
      void recordLearningFn({
        data: {
          lead_id: lead.id,
          action_type: 'generate',
          original_data: { 
            suggested_variants: [res?.variantA, res?.variantB, res?.variantC],
            context: { channel, type, strategy: currentStrategy, intensity: currentIntensity }
          }
        }
      });
    } catch (e: any) {
      setUsedAi(false);
      toast.warning("Geração de IA indisponível. Usando fallback.");
      const fallbackA = `Olá, ${lead.companyName}! Como estão os negócios em ${lead.city || lead.niche || 'sua região'}?`;
      setVariantA(fallbackA);
      setVariantB(fallbackA);
      setVariantC(fallbackA);
    } finally {
      setGenerating(false);
    }
  }


  function toggleChannel(c: Channel) {
    setChannels((prev) => {
      const isRemoving = prev.includes(c);
      const next = isRemoving ? prev.filter((x) => x !== c) : [...prev, c];
      if (!isRemoving && next.length === 1) {
        setActiveGenerationChannel(c);
        void generateVariants(c, abordagemType, strategy, intensity);
      }
      return next;
    });
  }

  async function handleSend() {
    if (!lead || channels.length === 0) return;
    
    // Check blocks
    if (lead.blockContact || lead.contactStatus === 'Não contactar') {
      toast.error("Contato bloqueado para este lead.");
      return;
    }
    if (lead.contactStatus === 'Lead descartado' || lead.contactStatus === 'Cliente sem interesse') {
      toast.error("Lead inativo. Não é possível enviar mensagens.");
      return;
    }

    const message = activeVariant === "A" ? variantA : activeVariant === "B" ? variantB : variantC;
    
    // Check if edited
    // For simplicity, we compare with our local variants if they were suggested by AI
    const wasEdited = false; // Logic to check if user changed from initial suggestion

    setSendStatus("sending");
    setSendProgress(20);
    
    try {
      const res = await sendFn({
        data: {
          lead: leadToPayload(lead),
          channels,
          variant: activeVariant,
          message,
          emailSubject: channels.includes("email") ? emailSubject : undefined,
          updateLeadStatus: updateStatus ? statusForChannels(channels) : null,
        },
      });
      setSendProgress(100);
      if (res.ok) {
        setSendStatus("delivered");
        toast.success("Disparado via Make! Aguardando confirmação real...");
        
        const historyId = crypto.randomUUID();
        addContactHistory(lead.id, {
          channel: channels[0].charAt(0).toUpperCase() + channels[0].slice(1) as any,
          status: 'confirmado',
          message: message,
          objective: objective,
          style: strategy,
        });

        // Learning: Sent a message
        void recordLearningFn({
          data: {
            lead_id: lead.id,
            action_type: 'send',
            final_data: { message, channel: channels[0], was_edited: wasEdited }
          }
        });

        setLastHistoryId(historyId);
        setShowOutcomeFeedback(true);
        
        if (onStatusChanged) onStatusChanged("Aguardando confirmação");
      } else {
        setSendStatus("failed");
        setErrorMsg(res.error);
        toast.error("Erro no envio.");
      }
    } catch (e) {
      setSendStatus("failed");
      toast.error("Erro inesperado.");
    }

  }

  const detectedChannels = [
    { id: "whatsapp" as const, label: "WhatsApp", icon: <MessageCircle className="h-4 w-4" />, value: lead?.whatsapp },
    { id: "email" as const, label: "Email", icon: <Mail className="h-4 w-4" />, value: lead?.email },
    { id: "instagram" as const, label: "Instagram", icon: <Instagram className="h-4 w-4" />, value: lead?.instagramHandle },
  ];

  if (!lead) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("max-w-2xl overflow-hidden p-0 border shadow-2xl transition-all", THEME.radius, THEME.border)}>
        <div className="flex h-full flex-col">
          {/* Unified Header */}
          <div className="bg-slate-900 px-6 py-6 text-white border-b border-white/5">
            <div className="flex items-center gap-3">
               <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                 <Send className="h-5 w-5 text-white" />
               </div>
               <div>
                 <DialogTitle className="text-xl font-bold tracking-tight">
                   {isPreviewMode ? "Confirmação de Envio" : `Contatar: ${lead.companyName}`}
                 </DialogTitle>
                 <DialogDescription className="text-xs text-white/50 font-medium">
                   {isPreviewMode ? "Confira as mensagens antes de disparar." : "Escolha os canais e personalize a abordagem."}
                 </DialogDescription>
               </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin">
            {/* Decision Assistant Module */}
            {lead && progression && !showOutcomeFeedback && !isPreviewMode && (
              <div className="space-y-4">
                {/* 1. Context & Score Header */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Score do Lead</span>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-xl font-black",
                          lead.opportunityScore > 70 ? "text-emerald-500" : lead.opportunityScore > 40 ? "text-amber-500" : "text-slate-400"
                        )}>
                          {lead.opportunityScore}
                        </span>
                        <Badge variant="outline" className="h-5 text-[9px] font-black border-slate-200 text-slate-500 bg-white">
                          Status: {lead.contactStatus}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Canal Recomendado</span>
                    <div className="flex items-center gap-1.5 text-slate-900 font-bold text-sm">
                      {lead.whatsapp ? <MessageCircle className="h-4 w-4 text-emerald-500" /> : lead.instagramHandle ? <Instagram className="h-4 w-4 text-pink-500" /> : <Mail className="h-4 w-4 text-blue-500" />}
                      {lead.whatsapp ? "WhatsApp" : lead.instagramHandle ? "Instagram" : "Email"}
                    </div>
                  </div>
                </div>

                {/* 2. Insight Blocks (Visual Problems & Opportunities) */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 text-rose-600">
                      <ShieldAlert className="h-4 w-4" />
                      <span className="text-[10px] font-black uppercase tracking-wider">Problemas Detectados</span>
                    </div>
                    <div className="space-y-1.5">
                      {progression.detectedProblems?.length > 0 ? (
                        progression.detectedProblems.map((p: string, i: number) => (
                          <div key={i} className="flex items-center gap-2 text-xs font-bold text-slate-700">
                            <div className="h-1 w-1 rounded-full bg-rose-400" />
                            {p}
                          </div>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400 font-medium italic">Nenhum problema crítico</span>
                      )}
                    </div>
                  </div>

                  <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 text-emerald-600">
                      <TrendingUp className="h-4 w-4" />
                      <span className="text-[10px] font-black uppercase tracking-wider">Oportunidade</span>
                    </div>
                    <p className="text-xs font-bold text-slate-700 leading-tight">
                      {progression.opportunity}
                    </p>
                    <div className="flex items-center gap-1.5">
                       <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                       <span className="text-[9px] font-black text-emerald-600 uppercase">Focar neste ganho</span>
                    </div>
                  </div>
                </div>

                {/* 3. Decision Card (Strategy Reasoning) */}
                <div className="bg-violet-600 border border-violet-500 rounded-2xl p-5 text-white shadow-xl shadow-violet-100 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Brain className="h-5 w-5 text-violet-200" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-violet-200">Estratégia Recomendada</span>
                      </div>
                      <h4 className="text-lg font-black leading-tight tracking-tight">
                        {strategy.charAt(0).toUpperCase() + strategy.slice(1)} • Intensidade {intensity}
                      </h4>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] font-black uppercase text-violet-200 mb-1">Força</span>
                      <Badge variant="outline" className={cn(
                        "font-black text-[10px] border-white/20",
                        progression.strategyForce === 'Alta' ? "bg-emerald-400 text-emerald-950" : progression.strategyForce === 'Média' ? "bg-amber-300 text-amber-950" : "bg-white/20 text-white"
                      )}>
                        {progression.strategyForce}
                      </Badge>
                    </div>
                  </div>

                  <div className="p-3 bg-white/10 rounded-xl border border-white/5">
                    <p className="text-sm font-medium leading-relaxed italic">
                      " {progression.reasoning} "
                    </p>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase text-violet-200 tracking-wider">Se você seguir isso:</span>
                    <div className="grid grid-cols-2 gap-2">
                      {progression.strategyImpact?.map((impact: string, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-[11px] font-bold">
                          <CheckCircle className="h-3 w-3 text-emerald-400" />
                          {impact}
                        </div>
                      ))}
                    </div>
                  </div>

                  {progression.riskAlert && (
                    <div className="flex items-center gap-3 p-3 bg-amber-400 text-amber-950 rounded-xl animate-pulse">
                      <AlertTriangle className="h-5 w-5 shrink-0" />
                      <p className="text-[11px] font-black leading-tight uppercase">
                        {progression.riskAlert}
                      </p>
                    </div>
                  )}
                </div>

                {/* 4. Strategy Comparison & Micro-learning */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Comparação de Alternativas</h5>
                    <div className="flex items-center gap-1.5 text-violet-600">
                      <Info className="h-3 w-3" />
                      <span className="text-[9px] font-bold">Micro-aprendizado: {progression.microLearning}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {progression.strategyAlternatives?.map((alt: any, i: number) => (
                      <div key={i} className={cn(
                        "p-3 rounded-xl border text-center space-y-1 cursor-pointer transition-all hover:scale-105",
                        i === 1 ? "border-violet-200 bg-violet-50/50" : "border-slate-100 bg-slate-50/50"
                      )}>
                        <span className="text-[10px] font-black uppercase block text-slate-500">{alt.label}</span>
                        <p className="text-[10px] font-bold text-slate-900 leading-tight">{alt.impact}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {showOutcomeFeedback ? (
              <div className="flex h-full flex-col items-center justify-center text-center space-y-6 py-12 animate-in zoom-in-95">
                <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-slate-900">Envio Realizado!</h3>
                  <p className="text-slate-500 max-w-xs mx-auto">Qual o resultado esperado para esta mensagem?</p>
                </div>
                <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                  <Button 
                    onClick={() => {
                      if (lastHistoryId) recordMessageResult(lead.id, lastHistoryId, 'responded');
                      recordLearningFn({ data: { lead_id: lead.id, action_type: 'outcome_mark', final_data: { outcome: 'responded' } } });
                      onOpenChange(false);
                    }} 
                    variant="outline" 
                    className="h-16 rounded-xl font-bold gap-2"
                  >
                    👍 RESPONDEU
                  </Button>
                  <Button 
                    onClick={() => {
                      if (lastHistoryId) recordMessageResult(lead.id, lastHistoryId, 'no_response');
                      recordLearningFn({ data: { lead_id: lead.id, action_type: 'outcome_mark', final_data: { outcome: 'no_response' } } });
                      onOpenChange(false);
                    }} 
                    variant="outline" 
                    className="h-16 rounded-xl font-bold gap-2"
                  >
                    👎 IGNOROU
                  </Button>
                  <Button 
                    onClick={() => {
                      if (lastHistoryId) recordMessageResult(lead.id, lastHistoryId, 'interested');
                      recordLearningFn({ data: { lead_id: lead.id, action_type: 'outcome_mark', final_data: { outcome: 'interested' } } });
                      onOpenChange(false);
                    }} 
                    variant="outline" 
                    className="h-16 rounded-xl font-bold gap-2 col-span-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                  >
                    💬 ESTÁ INTERESSADO
                  </Button>
                </div>
                <Button variant="ghost" onClick={() => onOpenChange(false)}>Fechar sem feedback</Button>

              </div>
            ) : (
              <>
                {/* 1. Channel Selection Section */}
            <div className="space-y-3">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Canais de Contato</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {detectedChannels.map((c) => {
                  const available = !!c.value;
                  const selected = channels.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      disabled={!available}
                      onClick={() => toggleChannel(c.id)}
                      className={cn(
                        "flex items-center gap-3 p-3 text-left border transition-all",
                        THEME.radius,
                        available 
                          ? selected 
                            ? "bg-violet-600 border-violet-600 text-white shadow-md shadow-violet-200 dark:shadow-none" 
                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-violet-300"
                          : "opacity-40 grayscale cursor-not-allowed bg-slate-50 dark:bg-slate-900/50"
                      )}
                    >
                      <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", selected ? "bg-white/20" : "bg-slate-100 dark:bg-slate-800 text-slate-500")}>
                        {c.icon}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold leading-tight">{c.label}</span>
                        <span className="text-[10px] opacity-70 truncate">{c.value || "N/A"}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            
            <Separator className="opacity-50" />

            {/* Roteiro de Conversa Section */}
            <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
               <div className="flex items-center justify-between">
                 <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Roteiro de Conversa</Label>
                 <Badge variant="outline" className={cn("text-[9px] font-bold border-violet-200 bg-violet-50", 
                   conversationStages.find(s => s.id === currentConversationStage)?.color.replace('text-', 'text-') || 'text-violet-600')}>
                    ETAPA: {currentConversationStage.toUpperCase()}
                 </Badge>
               </div>
               
               <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {conversationStages.map((stage) => {
                    const Icon = stage.icon;
                    return (
                      <button
                        key={stage.id}
                        onClick={() => {
                          setCurrentConversationStage(stage.id);
                          setConversationStage(lead.id, stage.id);
                        }}
                        className={cn(
                          "flex flex-col items-center justify-center p-2 min-w-[80px] border transition-all shrink-0",
                          THEME.radius,
                          currentConversationStage === stage.id 
                            ? "bg-violet-50 border-violet-200 ring-2 ring-violet-500/20" 
                            : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 opacity-60 hover:opacity-100"
                        )}
                      >
                        <Icon className={cn("h-4 w-4 mb-1", stage.color)} />
                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 whitespace-nowrap">{stage.label}</span>
                      </button>
                    );
                  })}
               </div>

               <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {scenarios.map((scenario) => {
                    const Icon = scenario.icon;
                    return (
                      <Button
                        key={scenario.id}
                        variant={selectedScenario === scenario.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setSelectedScenario(scenario.id);
                          const responses = getReadyResponses(lead.id, scenario.id);
                          if (responses && responses.length > 0) {
                            setVariantA(responses[0]);
                            if (responses.length > 1) setVariantB(responses[1]);
                            if (responses.length > 2) setVariantC(responses[2]);
                            setActiveVariant("A");
                            setIsPreviewMode(false);
                            setUsedAi(true); // Marking as "AI/Smart" used
                          }
                        }}
                        className={cn(
                          "h-auto py-2 flex flex-col items-center gap-1 text-[10px] font-bold transition-all",
                          selectedScenario === scenario.id ? "bg-violet-600 shadow-lg scale-105 z-10" : "bg-white/50 hover:bg-violet-50"
                        )}
                      >
                        <Icon className="h-3 w-3" />
                        <span className="truncate w-full">{scenario.label}</span>
                      </Button>
                    );
                  })}
               </div>
            </div>

            <Separator className="opacity-50" />

            {/* 2. Content Section */}
            {!isPreviewMode ? (
              <div className="space-y-6 animate-in fade-in duration-300">
                {channels.includes("email") && (
                  <div className={cn("p-4 space-y-2 border", THEME.radius, THEME.border, THEME.bgMuted)}>
                    <Label className="text-[10px] font-bold uppercase text-slate-400">Assunto do Email</Label>
                    <Input 
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      className="bg-background border-slate-200 dark:border-slate-800"
                      placeholder="Assunto da mensagem..."
                    />
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Select 
                        value={objective} 
                        onValueChange={(v: MessageObjective) => {
                          setObjective(v);
                          void generateVariants(activeGenerationChannel, abordagemType, strategy, intensity);
                        }}
                      >
                        <SelectTrigger className="h-9 w-[180px] text-xs font-bold bg-slate-50 dark:bg-slate-900">
                          <SelectValue placeholder="Objetivo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open_conversation">👋 Abrir conversa</SelectItem>
                          <SelectItem value="generate_curiosity">🤔 Gerar curiosidade</SelectItem>
                          <SelectItem value="qualify_lead">📋 Qualificar lead</SelectItem>
                          <SelectItem value="book_meeting">📅 Marcar reunião</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select 
                        value={abordagemType} 
                        onValueChange={(v: AbordagemType) => {
                          setAbordagemType(v);
                          void generateVariants(activeGenerationChannel, v, strategy, intensity);
                        }}
                      >
                        <SelectTrigger className="h-9 w-[180px] text-xs font-bold bg-slate-50 dark:bg-slate-900">
                          <SelectValue placeholder="Tipo de abordagem" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="first" className="text-xs font-medium">🚀 Primeira abordagem</SelectItem>
                          <SelectItem value="followup1" className="text-xs font-medium">📨 Follow-up 1</SelectItem>
                          <SelectItem value="followup2" className="text-xs font-medium">🎯 Follow-up 2</SelectItem>
                          <SelectItem value="last" className="text-xs font-medium">🔚 Última tentativa</SelectItem>
                        </SelectContent>
                      </Select>

                      <div className="flex flex-col gap-1">
                        <Select 
                          value={strategy} 
                          onValueChange={(v) => {
                            setStrategy(v);
                            setStrategyReason("Ajuste manual do usuário.");
                            void generateVariants(activeGenerationChannel, abordagemType, v, intensity);
                          }}
                        >
                          <SelectTrigger className="h-9 w-[160px] text-xs font-bold bg-slate-50 dark:bg-slate-900">
                            <Brain className="h-3 w-3 mr-2 text-violet-500" />
                            <SelectValue placeholder="Estratégia" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="neutro" className="text-xs font-medium">⚪ Neutro</SelectItem>
                            <SelectItem value="curiosidade" className="text-xs font-medium">🤔 Curiosidade</SelectItem>
                            <SelectItem value="oportunidade" className="text-xs font-medium">📈 Oportunidade</SelectItem>
                            <SelectItem value="autoridade" className="text-xs font-medium">🎓 Autoridade</SelectItem>
                            <SelectItem value="prova_social" className="text-xs font-medium">👥 Prova Social</SelectItem>
                            <SelectItem value="escassez" className="text-xs font-medium">⏳ Escassez</SelectItem>
                            <SelectItem value="curva_medo" className="text-xs font-medium">⚠️ Curva do Medo</SelectItem>
                          </SelectContent>
                        </Select>
                        {strategyReason && (
                          <span className="text-[9px] text-violet-500 font-medium px-1 italic">
                            IA: {strategyReason}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col gap-1">
                        <Select 
                          value={intensity} 
                          onValueChange={(v: "leve" | "medio" | "forte") => {
                            setIntensity(v);
                            setIntensityReason("Ajuste manual do usuário.");
                            void generateVariants(activeGenerationChannel, abordagemType, strategy, v);
                          }}
                        >
                          <SelectTrigger className="h-9 w-[130px] text-xs font-bold bg-slate-50 dark:bg-slate-900">
                            <Zap className={cn("h-3 w-3 mr-2", intensity === 'forte' ? "text-orange-500" : "text-slate-400")} />
                            <SelectValue placeholder="Intensidade" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="leve" className="text-xs font-medium text-emerald-600">Tom Leve</SelectItem>
                            <SelectItem value="medio" className="text-xs font-medium text-amber-600">Tom Médio</SelectItem>
                            <SelectItem value="forte" className="text-xs font-medium text-rose-600">Tom Forte</SelectItem>
                          </SelectContent>
                        </Select>
                        {intensityReason && (
                          <span className="text-[9px] text-slate-400 font-medium px-1 italic">
                            IA: {intensityReason}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          const msg = activeVariant === "A" ? variantA : activeVariant === "B" ? variantB : variantC;
                          await analyzeStyleFn({ data: { content: msg } });
                          toast.success("A IA aprendeu com seu estilo de escrita!");
                        }}
                        className="h-9 px-3 gap-2 text-violet-600 hover:text-violet-700 hover:bg-violet-50"
                      >
                        <Sparkles className="h-4 w-4" />
                        Aprender com esta mensagem
                      </Button>

                      <Tabs value={activeVariant} onValueChange={(v) => setActiveVariant(v as "A" | "B" | "C")} className="w-auto">
                        <TabsList className="bg-slate-100 dark:bg-slate-900 p-1 h-9">
                          <TabsTrigger value="A" className="text-xs font-bold px-4">VAR A</TabsTrigger>
                          <TabsTrigger value="B" className="text-xs font-bold px-4">VAR B</TabsTrigger>
                          <TabsTrigger value="C" className="text-xs font-bold px-4">VAR C</TabsTrigger>
                        </TabsList>
                      </Tabs>

                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => generateVariants(activeGenerationChannel, abordagemType, strategy, intensity)}
                        disabled={generating}
                        className="h-9 font-bold"
                      >
                        {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="relative group">
                    <Textarea
                      value={activeVariant === "A" ? variantA : activeVariant === "B" ? variantB : variantC}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (activeVariant === "A") setVariantA(val);
                        else if (activeVariant === "B") setVariantB(val);
                        else setVariantC(val);
                      }}
                      className={cn("min-h-[180px] resize-none p-4 text-sm leading-relaxed border focus-visible:ring-violet-500", THEME.radius, THEME.border)}
                      placeholder="Sua mensagem aqui..."
                    />
                    <div className="absolute bottom-3 right-3 text-[9px] font-bold text-slate-400">
                      {(activeVariant === "A" ? variantA : activeVariant === "B" ? variantB : variantC).length} chars
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <ScrollArea className="h-[380px] w-full rounded-xl border border-dashed p-4 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20">
                   <div className="space-y-6 pr-4">
                      {channels.length === 0 && (
                        <div className="flex h-40 flex-col items-center justify-center text-slate-400">
                           <AlertTriangle className="h-8 w-8 mb-2 opacity-20" />
                           <p className="text-xs font-bold">Nenhum canal selecionado</p>
                        </div>
                      )}
                      
                      {channels.includes("whatsapp") && (
                        <div className="space-y-2">
                           <Label className="text-[10px] font-bold text-emerald-600 uppercase">WhatsApp</Label>
                           <WhatsAppMockup message={activeVariant === "A" ? variantA : activeVariant === "B" ? variantB : variantC} />
                        </div>
                      )}

                      {channels.includes("email") && (
                        <div className="space-y-2">
                           <Label className="text-[10px] font-bold text-blue-600 uppercase">Email</Label>
                           <EmailMockup 
                             subject={emailSubject}
                             message={activeVariant === "A" ? variantA : activeVariant === "B" ? variantB : variantC} 
                           />
                        </div>
                      )}

                      {channels.includes("instagram") && (
                        <div className="space-y-2">
                           <Label className="text-[10px] font-bold text-rose-600 uppercase">Instagram</Label>
                           <InstagramMockup message={activeVariant === "A" ? variantA : activeVariant === "B" ? variantB : variantC} />
                        </div>
                      )}
                   </div>
                </ScrollArea>
              </div>
            )}

            {/* 3. Global Options */}
            <div className={cn("p-4 border bg-slate-50/30 dark:bg-slate-900/10", THEME.radius, THEME.border)}>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={updateStatus}
                  onChange={(e) => setUpdateStatus(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500 cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors">
                  Atualizar status do lead para <span className="text-violet-600">"{statusForChannels(channels)}"</span>
                </span>
              </label>
            </div>
            
            {/* 4. Feedback during sending */}
            {sendStatus === "sending" && (
              <div className="animate-in slide-in-from-bottom-4 duration-300">
                <div className={cn("p-4 border bg-violet-50 dark:bg-violet-900/10 border-violet-100 dark:border-violet-900/30", THEME.radius)}>
                   <div className="flex items-center gap-3 mb-2">
                     <Loader2 className="h-4 w-4 animate-spin text-violet-600" />
                     <span className="text-xs font-bold text-violet-700 dark:text-violet-400 uppercase tracking-widest">Enviando para Make...</span>
                   </div>
                   <Progress value={sendProgress} className="h-1 bg-violet-100 dark:bg-violet-900/40" />
                </div>
              </div>
            )}
              </>
            )}
          </div>

          {/* Consistent Footer */}
          <div className="border-t bg-slate-50/50 dark:bg-slate-900/80 p-6 flex flex-col sm:flex-row gap-6 items-center justify-between backdrop-blur-sm">
            {!isPreviewMode && (
              <div className="flex-1 hidden sm:block">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-emerald-500" />
                  Validação de Estratégia
                </p>
                <p className="text-[11px] font-bold text-slate-700 leading-tight">
                  {progression?.strategyForce === 'Alta' 
                    ? "✓ Alinhamento ideal com o perfil do lead."
                    : "⚠ Recomendamos adicionar contexto manual."}
                </p>
              </div>
            )}
            
            <div className="flex items-center gap-3 w-full sm:w-auto">
               <Button
                 variant="ghost"
                 size="sm"
                 onClick={() => setIsPreviewMode(!isPreviewMode)}
                 disabled={sendStatus === "sending" || generating}
                 className="h-10 px-4 font-bold text-slate-600 hover:text-violet-600 transition-all"
               >
                 {isPreviewMode ? <Edit3 className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                 {isPreviewMode ? "Editar" : "Prévias"}
               </Button>

               <Button
                 variant="outline"
                 size="sm"
                 onClick={() => setConfirmStep("confirm")}
                 className="h-10 font-bold border-slate-200 text-slate-600"
               >
                 Registrar Manual
               </Button>

               <Button
                 onClick={handleSend}
                 disabled={sendStatus === "sending" || channels.length === 0 || generating}
                 className={cn(
                   "h-12 px-8 font-black uppercase tracking-widest text-xs transition-all",
                   "bg-slate-900 hover:bg-black text-white rounded-2xl shadow-xl shadow-slate-200",
                   "hover:scale-105 active:scale-95 flex-1 sm:flex-none"
                 )}
               >
                 {sendStatus === "sending" ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Send className="mr-2 h-4 w-4" />}
                 {sendStatus === "sending" ? "Processando..." : "Disparar Agora"}
               </Button>
            </div>
          </div>
        </div>
      </DialogContent>
      
      {/* Confirmation Dialog */}
      <Dialog open={confirmStep === "confirm"} onOpenChange={(o) => !o && setConfirmStep("compose")}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ListChecks className="h-5 w-5 text-violet-600" />
              Confirmar Envio Manual
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tipo de Abordagem</Label>
              <Select value={abordagemType} onValueChange={(v: AbordagemType) => setAbordagemType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Primeira tentativa">Primeira tentativa</SelectItem>
                  <SelectItem value="Follow-up">Follow-up</SelectItem>
                  <SelectItem value="Reengajamento">Reengajamento</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Observação (opcional)</Label>
              <Textarea 
                value={contactNotes}
                onChange={(e) => setContactNotes(e.target.value)}
                placeholder="Ex: Cliente pediu retorno na segunda-feira..."
              />
            </div>
          </div>
          <DialogFooter>
             <Button variant="outline" onClick={() => setConfirmStep("compose")}>Cancelar</Button>
             <Button 
               disabled={isSavingConfirmation}
               onClick={async () => {
                 setIsSavingConfirmation(true);
                 await updateOperationFn({
                   data: {
                     lead_id: lead.id,
                     updates: {
                       followup_status: statusForChannels(channels),
                       last_contact_at: new Date().toISOString(),
                       contact_notes: contactNotes,
                        followup_history_item: {
                          channel: channels[0].toUpperCase() as any,
                          status: 'confirmado' as any,
                          message: 'Manual log',
                          type: abordagemType,
                          notes: contactNotes
                        } as any
                     }
                   }
                 });
                 toast.success("Envio registrado com sucesso!");
                 onOpenChange(false);
                 setIsSavingConfirmation(false);
               }}
             >
               {isSavingConfirmation ? <Loader2 className="animate-spin h-4 w-4" /> : "Confirmar Registro"}
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}

function leadToPayload(lead: ProspectLead): MakeLeadPayload {
  return {
    id: lead.id,
    companyName: lead.companyName,
    niche: lead.niche || null,
    city: lead.city || null,
    whatsapp: lead.whatsapp || null,
    email: lead.email || null,
    instagramHandle: lead.instagramHandle || null,
    instagramUrl: lead.instagramUrl || null,
    websiteUrl: lead.websiteUrl || null,
    score: lead.opportunityScore ?? null,
    status: lead.status || null,
    address: lead.address || null,
    neighborhood: lead.neighborhood || null,
    rating: lead.rating || null,
  };
}

function statusForChannels(channels: Channel[]): string {
  if (channels.includes("whatsapp")) return "WhatsApp Enviado";
  if (channels.includes("email")) return "Cold Mail Enviado";
  if (channels.includes("instagram")) return "Instagram Enviado";
  return "Contatado";
}

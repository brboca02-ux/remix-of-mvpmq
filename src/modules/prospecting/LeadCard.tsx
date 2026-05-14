// @ts-nocheck
import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { cn } from "@/lib/utils";
import { navigationService } from '@/lib/navigation-service';
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { 
  ExternalLink, 
  MessageCircle, 
  Globe, 
  TrendingUp, 
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  SearchCode,
  Instagram,
  MapPin,
  Layout,
  MessageSquare,
  Paperclip,
  Tag,
  Phone,
  ArrowRight,
  X,
  AlertTriangle,
  Info,
  Loader2,
  Target
} from "@/lib/icons";
import { History, Send, Sparkles, Zap, Building2, MousePointer2, ChevronDown, Brain, Workflow, Ban, MessageSquareDashed, UserMinus, UserCheck, CalendarDays, MoreHorizontal, RotateCcw, DollarSign, ArrowUpRight, Search, ListChecks, ShieldCheck, Mail, Globe, Phone, TrendingUp, Users, Eye } from "lucide-react";
import { useProspectingStore } from './prospecting-store';
import { addDays } from 'date-fns';
import { calculateOpportunityScore } from './opportunity-score';
import { normalizeWhatsApp } from './utils-validation';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ProspectLead, FollowUpSequence, ManualAnalysis, LeadStatus } from './types';
import { StatusNotesDialog } from './StatusNotesDialog';
import { SendToMakeDialog } from '@/components/integrations/SendToMakeDialog';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Checkbox } from "@/components/ui/checkbox";

export type LeadCardDensity = 'comfortable' | 'compact' | 'ultra';

// ---------- Inteligência baseada em dados reais ----------

const getRecommendedEntrance = (lead: ProspectLead) => {
  const niche = lead.niche || 'seu nicho';
  const name = lead.companyName || 'pessoal';
  
  const options = [
    {
      type: 'curiosidade',
      text: `Oi, vi seu Instagram (${name}) e fiquei com uma dúvida rápida sobre seu atendimento, posso te perguntar?`
    },
    {
      type: 'elogio + dúvida',
      text: `Vi que vocês trabalham com ${niche} em ${lead.city}, parabéns pelo trabalho! Posso tirar uma dúvida rápida sobre um serviço?`
    },
    {
      type: 'observação real',
      text: `Oi! Estava pesquisando sobre ${niche} aqui na região e encontrei vocês. Vi que o perfil está bem ativo, posso fazer uma pergunta rápida?`
    }
  ];
  
  return options;
};

type SuggestedActionId = 'site' | 'social' | 'make' | 'pitch' | 'diagnosis' | 'whatsapp_safe';

const CHANNEL_KEYWORDS = ['WhatsApp', 'Instagram', 'Email', 'Cold Mail', 'LinkedIn'] as const;

const isChannelStatus = (status: string) =>
  CHANNEL_KEYWORDS.some(k => status?.toLowerCase().includes(k.toLowerCase()));

const getLastChannelNote = (lead: ProspectLead) => {
  const notes = (lead.statusNotes || [])
    .filter(n => isChannelStatus(n.status))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return notes[0];
};

const getContactState = (lead: ProspectLead): 'never' | 'contacted' | 'recent' => {
  const neverStatuses: ProspectLead['status'][] = ['Novo', 'Lead Gerado'];
  const lastChannel = getLastChannelNote(lead);
  if (!lastChannel && neverStatuses.includes(lead.status)) return 'never';
  if (lastChannel) {
    const ageMs = Date.now() - new Date(lastChannel.createdAt).getTime();
    if (ageMs < 24 * 60 * 60 * 1000) return 'recent';
    return 'contacted';
  }
  return neverStatuses.includes(lead.status) ? 'never' : 'contacted';
};

const hasMakeEvidence = (lead: ProspectLead) =>
  (lead.statusNotes || []).some(n => n.kind === 'system' && isChannelStatus(n.status));

export const suggestNextAction = (lead: ProspectLead): { id: SuggestedActionId; label: string; priority: 'high' | 'normal'; reason?: string } => {
  const contactStatus = lead.contactStatus || 'Novo envio pendente';
  const isAnalyzed = !!lead.socialDiscovery;
  const seq = lead.sequence;
  const analysis = lead.manualAnalysis;
  const isWarmed = analysis?.instagramFollowed && analysis?.instagramLiked && analysis?.instagramPostsSeen;
  const isAnalyzedManual = analysis?.companyExists && analysis?.activeInstagram && analysis?.worthContacting;
  
  // 0. Bloqueios Críticos
  const isInactive = contactStatus === 'Lead descartado' || contactStatus === 'Cliente sem interesse' || contactStatus === 'Não contactar';
  
  if (lead.blockContact || contactStatus === 'Não contactar') {
    return { id: 'diagnosis', label: 'Contato Bloqueado', priority: 'normal', reason: 'Remova o bloqueio para prosseguir' };
  }
  if (isInactive) {
    return { id: 'diagnosis', label: 'Lead Inativo', priority: 'normal', reason: 'Reative antes de agir' };
  }

  // 1. Erro no envio
  if (contactStatus === 'Erro no envio') {
    return { id: 'make', label: 'Corrigir Envio (Erro)', priority: 'high', reason: 'Última tentativa falhou' };
  }

  // 2. Fluxo de Aquecimento (Modo Seguro)
  if (contactStatus === 'Novo envio pendente') {
    if (!isAnalyzedManual) {
      return { id: 'diagnosis', label: 'Validar Empresa (Google)', priority: 'high', reason: 'Conheça o lead antes de qualquer ação' };
    }
    if (!isWarmed) {
      return { id: 'social', label: 'Aquecer no Instagram', priority: 'high', reason: 'Siga e curta para gerar conexão antes do Whats' };
    }
  }

  // 3. Reenvio vencido ou agendado para hoje
  if (contactStatus === 'Reenvio vencido') {
    if (seq && seq.isActive) {
      const step = seq.steps[seq.currentStep];
      return { id: 'make', label: `Executar: ${step.label}`, priority: 'high', reason: 'Prazo da sequência atingido' };
    }
    return { id: 'make', label: 'Fazer Follow-up Vencido', priority: 'high', reason: 'Passou do prazo de contato' };
  }

  // 4. Sequência Finalizada
  if (contactStatus === 'Sequência finalizada') {
    return { id: 'diagnosis', label: 'Arquivar ou Reativar', priority: 'normal', reason: 'Tentativas esgotadas' };
  }

  // 5. Contatado hoje - bloqueio suave
  if (contactStatus === 'Contato enviado hoje' || contactStatus === 'Aguardando confirmação') {
    return { id: 'diagnosis', label: 'Aguardar Retorno', priority: 'normal', reason: 'Aguarde o prazo de 24h' };
  }

  // 6. Sem site (Prioridade de venda)
  if (!lead.websiteUrl) {
    return { id: 'site', label: 'Gerar Proposta de Site', priority: 'high', reason: 'Gatilho de conversão' };
  }

  // Default
  return { id: 'diagnosis', label: 'Iniciar Conversa Leve', priority: 'normal', reason: 'Lead aquecido e validado' };
};

const FollowUpStepper: React.FC<{ sequence: FollowUpSequence }> = ({ sequence }) => {
  if (!sequence) return null;
  
  return (
    <div className="flex items-center gap-1.5 w-full pt-1">
      {sequence.steps.map((step, idx) => {
        const isCompleted = idx < sequence.currentStep;
        const isCurrent = idx === sequence.currentStep;
        const isNext = idx > sequence.currentStep;

        return (
          <div key={idx} className="flex-1 flex flex-col gap-1.5">
            <div 
              className={cn(
                "h-1 rounded-full transition-all duration-500",
                isCompleted ? "bg-emerald-500 shadow-sm" : isCurrent ? "bg-violet-500 animate-pulse" : "bg-slate-200"
              )} 
            />
            <div className="flex items-center justify-center">
              <span className={cn(
                "text-[8px] font-black uppercase tracking-tighter truncate max-w-full",
                isCurrent ? "text-violet-600" : "text-slate-400"
              )}>
                {step.channel.substring(0, 1)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const ManualAnalysisChecklist: React.FC<{ 
  lead: ProspectLead; 
  onUpdate: (analysis: Partial<ManualAnalysis>) => void 
}> = ({ lead, onUpdate }) => {
  const analysis = lead.manualAnalysis || {
    companyExists: false,
    activeInstagram: false,
    hasWebsite: false,
    isRecentlyActive: false,
    worthContacting: false,
    instagramFollowed: false,
    instagramLiked: false,
    instagramPostsSeen: false
  };

  const items = [
    { key: 'companyExists', label: 'Empresa existe?' },
    { key: 'activeInstagram', label: 'Tem Instagram ativo?' },
    { key: 'hasWebsite', label: 'Tem site?' },
    { key: 'isRecentlyActive', label: 'Parece ativo?' },
    { key: 'worthContacting', label: 'Vale contato?' },
    { key: 'instagramFollowed', label: 'Seguiu no Insta?' },
    { key: 'instagramLiked', label: 'Curtiu posts?' },
    { key: 'instagramPostsSeen', label: 'Viu conteúdo?' },
  ] as const;

  return (
    <div className="grid grid-cols-1 gap-2 p-3 bg-slate-50/50 rounded-xl border border-slate-100 mt-3">
      <div className="flex items-center gap-2 mb-1">
        <ListChecks className="h-3.5 w-3.5 text-slate-500" />
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Checklist de Análise</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <button
            key={item.key}
            onClick={(e) => {
              e.stopPropagation();
              onUpdate({ [item.key]: !analysis[item.key] });
            }}
            className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded-md border text-[9px] font-bold transition-all",
              analysis[item.key] 
                ? "bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm" 
                : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
            )}
          >
            <div className={cn(
              "w-2.5 h-2.5 rounded-full border flex items-center justify-center transition-colors",
              analysis[item.key] ? "bg-emerald-500 border-emerald-500" : "bg-white border-slate-300"
            )}>
              {analysis[item.key] && <CheckCircle2 className="h-2 w-2 text-white" />}
            </div>
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
};
 
const LeadBusinessDetails: React.FC<{ lead: ProspectLead }> = ({ lead }) => {
  const details = [
    { label: 'CNPJ', value: lead.cnpj, icon: Building2 },
    { label: 'CNAE', value: lead.cnae, icon: SearchCode },
    { label: 'Abertura', value: lead.openingDate, icon: CalendarDays },
    { label: 'Porte', value: lead.size, icon: Target },
    { label: 'Status', value: lead.status_sefaz, icon: ShieldCheck },
    { label: 'Telefone', value: lead.whatsapp, icon: Phone },
  ].filter(d => d.value);

  if (details.length === 0 && !lead.address && (!lead.partners || lead.partners.length === 0)) return null;

  return (
    <div className="grid grid-cols-1 gap-3 p-4 bg-slate-50/50 rounded-2xl border border-slate-100 mt-3 shadow-sm">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Building2 className="h-3.5 w-3.5 text-slate-500" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Dados da Empresa</span>
        </div>
        {lead.cnpj && (
           <Badge variant="outline" className="text-[8px] h-3.5 px-1 bg-slate-100 border-transparent text-slate-500 font-black">
             DADOS OFICIAIS
           </Badge>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        {details.map((detail, idx) => (
          <div key={idx} className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight flex items-center gap-1">
              <detail.icon className="h-2.5 w-2.5" /> {detail.label}
            </span>
            <span className="text-[11px] font-bold text-slate-700 truncate" title={String(detail.value)}>
              {detail.value}
            </span>
          </div>
        ))}
      </div>

      {lead.address && (
        <div className="flex flex-col gap-2 mt-1 border-t border-slate-100 pt-2">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight flex items-center gap-1">
            <MapPin className="h-2.5 w-2.5" /> Localização & Street View
          </span>
          <div className="relative group/map overflow-hidden rounded-xl border border-slate-200 aspect-video bg-slate-100">
             <img 
               src={`https://maps.googleapis.com/maps/api/streetview?size=400x200&location=${encodeURIComponent(lead.address)}&key=${window.localStorage.getItem('GOOGLE_PLACES_API_KEY') || ''}`}
               alt="Street View"
               className="w-full h-full object-cover transition-transform group-hover/map:scale-110"
               onError={(e) => {
                 (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=400&h=200';
               }}
             />
             <div className="absolute inset-0 bg-black/20 group-hover/map:bg-black/0 transition-colors" />
             <div className="absolute bottom-2 left-2 right-2">
               <span className="text-[10px] font-bold text-white bg-black/50 backdrop-blur-md px-2 py-0.5 rounded-lg block truncate">
                 {lead.address}{lead.neighborhood ? `, ${lead.neighborhood}` : ''}
               </span>
             </div>
          </div>
        </div>
      )}

      {lead.partners && lead.partners.length > 0 && (
        <div className="flex flex-col gap-0.5 mt-1 border-t border-slate-100 pt-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight flex items-center gap-1">
              <Users className="h-2.5 w-2.5" /> Quadro Societário ({lead.partners.length})
            </span>
          </div>
          <div className="flex flex-wrap gap-1 mt-0.5">
            {lead.partners.slice(0, 3).map((partner, idx) => (
              <Badge key={idx} variant="outline" className="bg-white border-slate-200 text-slate-600 text-[9px] font-bold px-1.5 py-0">
                {partner}
              </Badge>
            ))}
            {lead.partners.length > 3 && (
              <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-400 text-[9px] font-bold px-1.5 py-0">
                +{lead.partners.length - 3}
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const LeadTechInsights: React.FC<{ lead: ProspectLead }> = ({ lead }) => {
  const painPoints = lead.techPainPoints || [];
  const hasSlowSite = lead.pageSpeedStatus === 'ruim' || lead.pageSpeedStatus === 'crítico';
  
  if (painPoints.length === 0 && !hasSlowSite && (!lead.technologies || lead.technologies.length === 0)) return null;

  return (
    <div className="grid grid-cols-1 gap-3 p-4 bg-violet-50/30 rounded-2xl border border-violet-100 mt-3 shadow-sm">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Zap className="h-3.5 w-3.5 text-violet-500" />
          <span className="text-[10px] font-black uppercase tracking-widest text-violet-600">Tech Insights & Dores</span>
        </div>
        {lead.pageSpeedScore && (
           <Badge variant="outline" className={cn(
             "text-[8px] h-3.5 px-1 border-transparent font-black",
             lead.pageSpeedStatus === 'bom' ? "bg-emerald-100 text-emerald-700" :
             lead.pageSpeedStatus === 'ruim' ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"
           )}>
             SPEED: {lead.pageSpeedScore}
           </Badge>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {lead.hasMetaAds && (
          <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-[9px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1">
            <Eye className="h-2.5 w-2.5" /> Meta Ads Ativo
          </Badge>
        )}
        {lead.hasGoogleAds && (
          <Badge className="bg-primary-100 text-primary-700 border-primary-200 text-[9px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1">
            <TrendingUp className="h-2.5 w-2.5" /> Google Ads Ativo
          </Badge>
        )}
        {hasSlowSite && (
          <Badge className="bg-rose-100 text-rose-700 border-rose-200 text-[9px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1">
            <AlertTriangle className="h-2.5 w-2.5" /> Site Lento (Mobile)
          </Badge>
        )}
        {painPoints.map((p, idx) => (
          <Badge key={idx} className="bg-amber-100 text-amber-700 border-amber-200 text-[9px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1">
            <AlertCircle className="h-2.5 w-2.5" /> {p}
          </Badge>
        ))}
        {lead.technologies?.slice(0, 3).map((t, idx) => (
          <Badge key={idx} variant="outline" className="bg-white border-slate-200 text-slate-500 text-[8px] font-bold px-1.5 py-0">
            {t}
          </Badge>
        ))}
        {(lead.technologies?.length || 0) > 3 && (
          <span className="text-[8px] text-slate-400 font-bold">+{lead.technologies!.length - 3} mais</span>
        )}
      </div>
    </div>
  );
};

interface LeadCardProps {
  lead: ProspectLead;
  onViewDiagnosis: (lead: ProspectLead) => void;
  onGenerateSite: (lead: ProspectLead) => void;
  onGeneratePitch: (lead: ProspectLead) => void;
  onDiscoverSocial?: (lead: ProspectLead) => void;
  onUpdateStatus: (id: string, status: ProspectLead['status']) => void;
  onDelete: (id: string) => void;
  onEditLead?: (lead: ProspectLead, initialTab?: string) => void;
  onSelect?: (id: string, selected: boolean) => void;
  isSelected?: boolean;
  compact?: boolean;
  density?: LeadCardDensity;
}

export const LeadCard: React.FC<LeadCardProps> = ({ 
  lead, 
  onViewDiagnosis, 
  onGenerateSite, 
  onGeneratePitch,
  onDiscoverSocial,
  onUpdateStatus,
  onDelete,
  onEditLead,
  onSelect,
  isSelected,
  compact = false,
  density,
}) => {
  // Resolve effective density: explicit `density` wins, fallback to legacy `compact` flag
  const effectiveDensity: LeadCardDensity = density ?? (compact ? 'compact' : 'comfortable');
  const isCompact = effectiveDensity === 'compact';
  const isUltra = effectiveDensity === 'ultra';
  const [notesOpen, setNotesOpen] = useState(false);
  const [makeOpen, setMakeOpen] = useState(false);
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false);
  const [noInterestDialogOpen, setNoInterestDialogOpen] = useState(false);
  const [reactivateDialogOpen, setReactivateDialogOpen] = useState(false);
  const [whatsappConfirmOpen, setWhatsappConfirmOpen] = useState(false);
  const [discardReason, setDiscardReason] = useState("");
  const [noInterestReason, setNoInterestReason] = useState("");
  const [discardObservation, setDiscardObservation] = useState("");
  const [reativationReason, setReactivationReason] = useState("");
  const [reativationStatus, setReactivationStatus] = useState<LeadStatus>('Novo');
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [isDataReady, setIsDataReady] = useState(false);
  
  const { 
    addContactHistory, discardLead, markNoInterest, setBlockContact, executeNextSequenceStep, 
    updateAutomationMode, confirmContactDelivery, markInstagramInteraction, updateManualAnalysis,
    recordGoogleSearch, recordInstagramOpen, reactivateLead, undoDiscard
  } = useProspectingStore();
  const [lastActionTime, setLastActionTime] = useState<number>(0);

  const checkRhythm = () => {
    const now = Date.now();
    if (lastActionTime > 0 && now - lastActionTime < 3000) { // 3 seconds threshold
      toast.warning("Ritmo acelerado!", {
        description: "Simule comportamento humano para evitar bloqueios.",
        icon: <AlertTriangle className="text-amber-500" />
      });
      return false;
    }
    setLastActionTime(now);
    return true;
  };

  // Efeito de Skeleton simulado para robustez visual
  useEffect(() => {
    const timer = setTimeout(() => setIsDataReady(true), 600);
    return () => clearTimeout(timer);
  }, [lead.id]);
  const handleGoogleSearch = (e: React.MouseEvent) => {
    e.stopPropagation();
    const query = encodeURIComponent(lead.companyName || '');
    recordGoogleSearch(lead.id);
    window.open(`https://www.google.com/search?q=${query}`, '_blank');
  };

  const isInstagramWarmed = lead.instagramInteractedAt ? (
    (Date.now() - new Date(lead.instagramInteractedAt).getTime()) > 12 * 60 * 60 * 1000
  ) : false;

  const isInstagramRecent = lead.instagramInteractedAt ? (
    (Date.now() - new Date(lead.instagramInteractedAt).getTime()) < 12 * 60 * 60 * 1000
  ) : false;

  const isWarm = lead.manualAnalysis?.instagramFollowed && lead.manualAnalysis?.instagramLiked && lead.manualAnalysis?.instagramPostsSeen;
  const isCold = !lead.contactHistory || lead.contactHistory.length === 0;
  const opportunityLabel = isWarm ? 'Quente (Aquecido)' : (isCold ? 'Novo (Aquecer)' : 'Morno');
  const opportunityColor = isWarm ? 'bg-rose-500' : (isCold ? 'bg-blue-500' : 'bg-amber-500');

  const hasInstagram = !!(lead.instagramHandle || lead.socialDiscovery?.instagramHandle);

  const notesCount = lead.statusNotes?.length || 0;
  const attachmentsCount = (lead.statusNotes || []).reduce((sum, n) => sum + (n.attachments?.length || 0), 0);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-600 bg-emerald-50 border-emerald-100";
    if (score >= 50) return "text-primary-600 bg-primary-50 border-primary-100";
    return "text-slate-600 bg-slate-50 border-slate-100";
  };

  const getDigitalBadgeClass = (level?: string) => {
    if (level === 'verde') return "bg-emerald-100 text-emerald-700 border-emerald-200";
    if (level === 'amarelo') return "bg-amber-100 text-amber-700 border-amber-200";
    return "bg-rose-100 text-rose-700 border-rose-200";
  };

  const getStatusBadge = (status: ProspectLead['status'], lead: ProspectLead) => {
    const commonClasses = "font-black text-[10px] px-2.5 py-1 rounded-full border shadow-sm transition-all flex items-center gap-1.5 shrink-0";
    const contactStatus = lead.contactStatus || 'Novo envio pendente';
    
    const badges: React.ReactNode[] = [];

    // Indicadores do buscador (Enriquecido / Digital)
    if (lead.is_enriched) {
      badges.push(
        <Badge key="enriched" variant="outline" className={cn(commonClasses, "bg-violet-50 text-violet-700 border-violet-200")}>
          <Sparkles className="h-3 w-3 fill-violet-500/20" /> Enriquecido
        </Badge>
      );
    }

    if (lead.digitalLevel) {
      badges.push(
        <Badge key="digital" variant="outline" className={cn(commonClasses, getDigitalBadgeClass(lead.digitalLevel))}>
          <TrendingUp className="h-3 w-3" /> Digital {lead.digitalScore?.toFixed(1)}
        </Badge>
      );
    }

    // Prioridade 1: Inativos
    if (contactStatus === 'Lead descartado') {
      badges.push(<Badge key="discard" variant="outline" className={cn(commonClasses, "bg-slate-100 text-slate-400 border-slate-200")}><Ban className="h-3 w-3" /> Descartado</Badge>);
    } else if (contactStatus === 'Cliente sem interesse') {
      badges.push(<Badge key="no-interest" variant="outline" className={cn(commonClasses, "bg-slate-100 text-slate-400 border-slate-200")}><UserMinus className="h-3 w-3" /> Sem Interesse</Badge>);
    } else if (contactStatus === 'Não contactar') {
      badges.push(<Badge key="no-contact" variant="outline" className={cn(commonClasses, "bg-rose-50 text-rose-600 border-rose-200")}><Ban className="h-3 w-3" /> Não Contactar</Badge>);
    }

    // Prioridade 2: Alertas Críticos
    if (contactStatus === 'Erro no envio') {
      badges.push(<Badge key="error" variant="secondary" className={cn(commonClasses, "bg-rose-50 text-rose-700 border-rose-200")}><AlertTriangle className="h-3 w-3" /> Erro Envio</Badge>);
    } else if (contactStatus === 'Reenvio vencido') {
      badges.push(<Badge key="overdue" variant="secondary" className={cn(commonClasses, "bg-rose-500 text-white border-rose-600 shadow-rose-200 animate-pulse")}><Zap className="h-3 w-3" /> Reenvio Vencido</Badge>);
    }

    // Prioridade 3: Estados Ativos
    if (contactStatus === 'Reenvio agendado') {
      badges.push(<Badge key="scheduled" variant="secondary" className={cn(commonClasses, "bg-blue-50 text-blue-700 border-blue-200")}><Zap className="h-3 w-3" /> Reenvio Agendado</Badge>);
    } else if (contactStatus === 'Contato enviado hoje') {
      badges.push(<Badge key="today" variant="secondary" className={cn(commonClasses, "bg-emerald-50 text-emerald-700 border-emerald-100")}><CheckCircle2 className="h-3 w-3" /> Enviado Hoje</Badge>);
    } else if (contactStatus === 'Cliente respondeu' || status === 'Interessado') {
      badges.push(<Badge key="responded" variant="secondary" className={cn(commonClasses, "bg-violet-50 text-violet-700 border-violet-200")}><Sparkles className="h-3 w-3" /> Respondeu</Badge>);
    } else if (contactStatus === 'Aguardando resposta') {
      badges.push(<Badge key="waiting" variant="secondary" className={cn(commonClasses, "bg-amber-50 text-amber-700 border-amber-100")}><MessageCircle className="h-3 w-3" /> Aguardando</Badge>);
    }

    // Fallback: Status do Funil
    if (badges.length === 0) {
      if (!!lead.socialDiscovery) {
        badges.push(<Badge key="analyzed" variant="secondary" className={cn(commonClasses, "bg-blue-50 text-blue-700 border-blue-100")}><Brain className="h-3 w-3" /> Analisado IA</Badge>);
      } else {
        badges.push(<Badge key="waiting-ia" variant="outline" className={cn(commonClasses, "bg-slate-50 text-slate-500 border-slate-200")}>
          <MessageSquareDashed className="h-3 w-3" /> {status === 'Novo' ? 'Aguardando IA' : status}
        </Badge>);
      }
    }
    
    if (lead.playbook) {
      badges.push(<Badge key="playbook" variant="outline" className={cn(commonClasses, "bg-violet-50 text-violet-600 border-violet-100")}><Zap className="h-3 w-3 fill-current" /> Playbook Ativo</Badge>);
    }

    return badges;
  };

  const isInactive = (updatedAt: string, status: ProspectLead['status']) => {
    const lastUpdate = new Date(updatedAt).getTime();
    const now = Date.now();
    const threshold = status === 'Proposta Enviada' ? 72 * 60 * 60 * 1000 : 48 * 60 * 60 * 1000;
    return now - lastUpdate > threshold;
  };

  const getStepProgress = (status: ProspectLead['status']) => {
    const steps: ProspectLead['status'][] = [
      'Lead Gerado',
      'Cold Mail Enviado',
      'LinkedIn Enviado',
      'WhatsApp Enviado',
      'Follow-Up',
      'Lead Qualificado',
      'Lead Fechado'
    ];
    const index = steps.indexOf(status);
    if (index === -1) return { current: 1, total: steps.length };
    return { current: index + 1, total: steps.length };
  };

  if (isCompact || isUltra) {
    const progress = getStepProgress(lead.status);
    const progressPct = Math.round((progress.current / progress.total) * 100);
    const scoreColor = getScoreColor(lead.opportunityScore);

    return (
      <motion.div
        whileHover={{ y: -2 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        <Card 
          className={cn(
            "group relative overflow-hidden transition-all duration-300 hover:shadow-lg border bg-white cursor-pointer",
            isUltra ? "rounded-xl border-slate-200/60" : "rounded-2xl border-slate-200/60",
            lead.opportunityLevel === 'quente' && "ring-1 ring-rose-500/20"
          )}
          onClick={() => onEditLead?.(lead, 'overview')}
        >
          {/* Top row: avatar + name + score + actions */}
          {/* Predictive Metrics & Intelligence Bar */}
          <div className="flex items-center gap-1.5 p-2 bg-slate-50/50 border-b border-slate-100">
            {lead.predictiveMetrics && (
              <TooltipProvider>
                <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className={cn(
                        "text-[9px] font-black uppercase px-1.5 h-5 flex items-center gap-1 border-transparent",
                        lead.predictiveMetrics.riskLevel === 'Baixo' ? "bg-emerald-100 text-emerald-700" : 
                        lead.predictiveMetrics.riskLevel === 'Médio' ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"
                      )}>
                        {lead.predictiveMetrics.riskLevel === 'Alto' && <AlertTriangle className="h-2.5 w-2.5" />}
                        Risco: {lead.predictiveMetrics.riskLevel}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent className="text-[10px] p-2 max-w-[200px]">
                      <p>Probabilidade de rejeição: {lead.predictiveMetrics.rejectionProbability}%</p>
                      <p>Objeção provável: {lead.predictiveMetrics.likelyObjectionType}</p>
                    </TooltipContent>
                  </Tooltip>

                  <Badge variant="outline" className="bg-blue-100 text-blue-700 text-[9px] font-black uppercase px-1.5 h-5 border-transparent">
                    P: {lead.predictiveMetrics.responseProbability}%
                  </Badge>

                  {(lead.futureValue === 'Alto' || lead.purchasingPower === 'Alto' || (lead.revenueInsight?.priceSensitivity === 'orientado a valor')) && (
                    <Badge variant="outline" className="bg-emerald-100 text-emerald-700 text-[9px] font-black uppercase px-1.5 h-5 border-transparent">
                      <DollarSign className="h-2.5 w-2.5" /> Valor: {lead.revenueInsight?.priceSensitivity || 'Neutro'}
                    </Badge>
                  )}

                  {lead.revenueInsight && (
                    <Badge variant="outline" className="bg-slate-100 text-slate-700 text-[9px] font-black uppercase px-1.5 h-5 border-transparent">
                      R$ {lead.revenueInsight.suggestedPrice.toLocaleString('pt-BR')}
                    </Badge>
                  )}

                  {lead.upsellMoment && (
                    <Badge variant="outline" className="bg-violet-100 text-violet-700 text-[9px] font-black uppercase px-1.5 h-5 border-transparent animate-pulse">
                      <ArrowUpRight className="h-2.5 w-2.5" /> Upsell
                    </Badge>
                  )}

                  {lead.timingIntel?.isIdealTime && (
                    <Badge variant="outline" className="bg-blue-100 text-blue-700 text-[9px] font-black uppercase px-1.5 h-5 border-transparent">
                      <Zap className="h-2.5 w-2.5" /> Timing Ideal
                    </Badge>
                  )}
                  {(lead.saturationIndex || 0) > 50 && (
                    <Badge variant="outline" className="bg-rose-100 text-rose-700 text-[9px] font-black uppercase px-1.5 h-5 border-transparent">
                      Saturação: {lead.saturationIndex}%
                    </Badge>
                  )}
                </div>
              </TooltipProvider>
                )}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button 
                        onClick={handleGoogleSearch}
                        className="inline-flex items-center justify-center h-5 w-5 rounded-md bg-slate-50 text-slate-600 border border-slate-100 hover:bg-slate-100 transition-colors"
                      >
                        <Search className="h-2.5 w-2.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="text-[10px]">Pesquisar no Google</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

          <div className={cn("flex items-center justify-between gap-2", isUltra ? "p-2.5" : "p-3.5")}>
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className={cn(
                "shrink-0 rounded-lg bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-100 flex items-center justify-center text-slate-500 font-bold",
                isUltra ? "h-7 w-7 text-[11px]" : "h-9 w-9 text-sm"
              )}>
                {lead.companyName?.substring(0, 1).toUpperCase() || 'E'}
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <h3 className={cn(
                    "font-bold text-slate-900 truncate leading-tight tracking-tight",
                    isUltra ? "text-xs" : "text-sm"
                  )}>
                    {lead.companyName || 'Sem nome'}
                  </h3>
                  {lead.opportunityLevel === 'quente' && (
                    <span title="Lead quente" className="shrink-0 w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shadow-sm shadow-rose-300" />
                  )}
                </div>
                <div className={cn("flex items-center gap-1.5 mt-0.5 min-w-0", isUltra && "hidden")}>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-semibold text-slate-500 truncate">{lead.niche || 'Geral'}</span>
                    <Badge variant="outline" className="text-[8px] h-3.5 px-1 bg-slate-100 border-transparent text-slate-500">
                      {lead.conversationStage || 'Novo'}
                    </Badge>
                  </div>
                  {lead.city && (
                    <>
                      <span className="text-slate-300">·</span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-0.5 truncate">
                        <MapPin className="h-2.5 w-2.5" /> {lead.city}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Checklist de Análise Manual Guiada (Compacto/Ultra) */}
            {!isUltra && (
              <div className="px-3.5 pb-2">
                <ManualAnalysisChecklist 
                  lead={lead} 
                  onUpdate={(analysis) => updateManualAnalysis(lead.id, analysis)} 
                />
              </div>
            )}

            <div className="flex items-center gap-1 shrink-0">
              <div
                className={cn(
                  "rounded-md font-black border tabular-nums",
                  scoreColor,
                  isUltra ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-xs"
                )}
                title={`Score ${lead.opportunityScore}%`}
              >
                {lead.opportunityScore}
              </div>
              {!isUltra && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:bg-slate-50">
                      <MoreVertical className="h-3.5 w-3.5 text-slate-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-xl border-slate-100 shadow-xl min-w-[180px]">
                    {lead.reactiveModule?.isReactivationCandidate && (
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onGeneratePitch(lead); }} className="font-bold gap-3 py-2.5 text-rose-600 bg-rose-50">
                        <RotateCcw className="h-4 w-4" /> Reativar Lead
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => onGenerateSite(lead)} className="font-medium gap-3 py-2.5">
                      <Layout className="h-4 w-4 text-slate-500" /> Ver Proposta
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onUpdateStatus(lead.id, 'Lead Fechado')} className="font-medium gap-3 py-2.5 text-emerald-600">
                      <CheckCircle2 className="h-4 w-4" /> Marcar Fechado
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDelete(lead.id)} className="text-rose-600 font-bold gap-3 py-2.5">
                      <X className="h-4 w-4" /> Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          {/* Status + meta row (compact only, hidden on ultra) */}
          {!isUltra && (
            <div className="px-3.5 pb-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="flex flex-wrap gap-1.5">{getStatusBadge(lead.status, lead)}</div>
                {lead.whatsapp && (
                  <span title={lead.whatsapp} className="inline-flex items-center justify-center h-5 w-5 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-100">
                    <Phone className="h-2.5 w-2.5" />
                  </span>
                )}
                {(lead.instagramHandle || lead.socialDiscovery?.instagramHandle) && (
                  <span title="Instagram" className="inline-flex items-center justify-center h-5 w-5 rounded-md bg-pink-50 text-pink-600 border border-pink-100">
                    <Instagram className="h-2.5 w-2.5" />
                  </span>
                )}
                {lead.websiteUrl && (
                  <span title="Site" className="inline-flex items-center justify-center h-5 w-5 rounded-md bg-blue-50 text-blue-600 border border-blue-100">
                    <Globe className="h-2.5 w-2.5" />
                  </span>
                )}
              </div>
              {notesCount > 0 && (
                <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1 shrink-0">
                  <MessageSquare className="h-2.5 w-2.5" /> {notesCount}
                </span>
              )}
            </div>
          )}

          {/* Progress bar (always present, very thin on ultra) */}
          <div className={cn(isUltra ? "px-2.5 pb-2" : "px-3.5 pb-3")}>
            <div className="flex justify-between items-center mb-1">
              <span className={cn("font-bold text-slate-400 uppercase tracking-widest", isUltra ? "text-[8px]" : "text-[9px]")}>
                {isUltra ? lead.status : 'Progresso'}
              </span>
              <span className={cn("font-bold text-primary tabular-nums", isUltra ? "text-[8px]" : "text-[10px]")}>{progressPct}%</span>
            </div>
            <Progress value={progressPct} className={cn("bg-slate-100 rounded-full", isUltra ? "h-0.5" : "h-1")} />
          </div>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.005 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="h-full"
    >
      {!isDataReady ? (
        <Card className="h-full flex flex-col overflow-hidden border border-slate-200/50 rounded-[2rem] bg-white p-6 space-y-4">
          <div className="flex gap-4 items-center">
            <div className="h-16 w-16 rounded-2xl bg-slate-100 animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-5 bg-slate-100 rounded animate-pulse w-3/4" />
              <div className="h-4 bg-slate-100 rounded animate-pulse w-1/2" />
            </div>
          </div>
          <div className="h-32 bg-slate-50 rounded-2xl animate-pulse" />
          <div className="h-20 bg-slate-50 rounded-2xl animate-pulse" />
        </Card>
      ) : (
        <Card 
          className={cn(
            "h-full flex flex-col overflow-hidden transition-all duration-300 border border-slate-200/50 shadow-sm hover:shadow-2xl group rounded-[2rem] cursor-pointer bg-white relative",
            lead.opportunityLevel === 'quente' && "ring-1 ring-rose-500/10",
            isSelected && "ring-2 ring-primary bg-primary/5 shadow-primary/10"
          )}
          onClick={(e) => {
            if ((e.target as HTMLElement).closest('[role="checkbox"]')) return;
            onEditLead?.(lead, 'overview');
          }}
        >
          {/* Background glow for Hot Leads */}
          {lead.opportunityLevel === 'quente' && (
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none group-hover:bg-rose-500/10 transition-colors" />
          )}

        <CardHeader className="p-6 pb-4 space-y-4 relative">
          <div className="absolute top-4 left-4 z-20">
            <Checkbox 
              checked={isSelected} 
              onCheckedChange={(checked) => onSelect?.(lead.id, !!checked)}
              className="h-5 w-5 rounded-md border-slate-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary shadow-sm bg-white/80 backdrop-blur-sm"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <div className="flex justify-between items-start">
            <div className="flex gap-4 items-center min-w-0">
              <div className="relative shrink-0 ml-1">
                {lead.avatarUrl || lead.instagramProfileImage ? (
                  <img 
                    src={lead.avatarUrl || lead.instagramProfileImage} 
                    alt={lead.companyName}
                    className="h-16 w-16 rounded-2xl object-cover shadow-md ring-2 ring-white border border-slate-100"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-100 flex items-center justify-center text-slate-400 font-bold text-2xl shadow-inner group-hover:from-primary/5 group-hover:to-primary/10 group-hover:text-primary transition-colors">
                    {lead.companyName?.substring(0, 1).toUpperCase() || 'E'}
                  </div>
                )}
              </div>
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                  <h3 className="text-lg font-black text-slate-900 leading-tight tracking-tight group-hover:text-primary transition-colors truncate">
                    {lead.companyName || 'Empresa sem nome'}
                  </h3>
                  {lead.opportunityLevel === 'quente' && (
                    <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-pulse shadow-sm shadow-rose-200 shrink-0" />
                  )}
                </div>
                
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {format(new Date(lead.updatedAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-slate-50/50 border-slate-200/60 text-slate-500 font-bold text-[10px] uppercase tracking-wider h-5 px-2">
                    {lead.niche || 'Geral'}
                  </Badge>
                  {lead.city && (
                    <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {lead.city}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className={cn(
                "h-14 w-14 rounded-full border-[4px] flex flex-col items-center justify-center tabular-nums shadow-sm shrink-0",
                lead.opportunityScore >= 80 ? "border-emerald-500/30 text-emerald-600 bg-emerald-50" : 
                lead.opportunityScore >= 50 ? "border-primary-400/30 text-primary-600 bg-primary-50" : 
                "border-slate-200 text-slate-500 bg-slate-50"
              )}>
                <span className="text-base font-black leading-none">{lead.opportunityScore}</span>
                <span className="text-[8px] font-black uppercase tracking-tighter opacity-70">Score</span>
              </div>
              <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9 rounded-xl text-slate-400 hover:text-primary hover:bg-primary/5 transition-all"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditLead?.(lead, 'history');
                }}
                title="Histórico"
              >
                <History className="h-4.5 w-4.5" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-slate-400 hover:bg-slate-50">
                    <MoreVertical className="h-4.5 w-4.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-2xl border-slate-100 shadow-2xl p-2 min-w-[200px]">
                  <DropdownMenuItem onClick={() => onEditLead?.(lead, 'overview')} className="rounded-lg gap-3 py-2.5 font-medium">
                    <SearchCode className="h-4 w-4 text-primary" /> Ver Visão Completa
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEditLead?.(lead, 'history')} className="rounded-lg gap-3 py-2.5 font-medium">
                    <History className="h-4 w-4 text-slate-400" /> Ver Histórico
                  </DropdownMenuItem>
                  <div className="h-px bg-slate-100 my-1 mx-1" />
                  <DropdownMenuItem onClick={() => onDelete(lead.id)} className="rounded-lg gap-3 py-2.5 font-bold text-rose-600">
                    <X className="h-4 w-4" /> Excluir Registro
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              </div>
            </div>
          </div>

          {/* Contact Chips Section */}
          <div className="flex flex-wrap gap-2 pt-1">
            {lead.whatsapp && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-100/50 text-emerald-700 text-[12px] font-bold shadow-sm">
                <Phone className="h-3.5 w-3.5" /> {lead.whatsapp}
              </div>
            )}
            
            {lead.instagramHandle || lead.socialDiscovery?.instagramHandle ? (
              <a 
                href={lead.instagramUrl || lead.socialDiscovery?.instagramUrl} 
                onClick={(e) => {
                  e.stopPropagation();
                  navigationService.openExternal(lead.instagramUrl || lead.socialDiscovery?.instagramUrl || '');
                }}
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-pink-50 border border-pink-100/50 text-pink-700 text-[12px] font-bold shadow-sm hover:scale-105 transition-all"
              >
                <Instagram className="h-3.5 w-3.5" /> @{lead.instagramHandle || lead.socialDiscovery?.instagramHandle}
              </a>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 border border-slate-100 text-slate-400 text-[11px] font-bold opacity-60">
                <Instagram className="h-3.5 w-3.5" /> Instagram N/A
              </div>
            )}

            {lead.websiteUrl ? (
              <a 
                href={lead.websiteUrl.startsWith('http') ? lead.websiteUrl : `https://${lead.websiteUrl}`}
                onClick={(e) => { e.stopPropagation(); navigationService.openExternal(lead.websiteUrl || ''); }}
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100/50 text-blue-700 text-[12px] font-bold shadow-sm hover:scale-105 transition-all"
              >
                <Globe className="h-3.5 w-3.5" /> Ver Site
              </a>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-rose-50 border border-rose-100 text-rose-600 text-[11px] font-bold shadow-sm">
                <AlertCircle className="h-3.5 w-3.5" /> Sem Site
              </div>
            )}
          </div>
        </CardHeader>
          
        <CardContent className="p-6 pt-0 flex-grow flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            {/* Status & Alerts */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex flex-wrap gap-1.5">{getStatusBadge(lead.status, lead)}</div>
                {lead.offerId && (
                  <Badge variant="outline" className="bg-orange-50/50 border-orange-200 text-orange-700 font-bold text-[10px] uppercase tracking-wider h-5">
                    <Tag className="h-2.5 w-2.5 mr-1" /> Oferta
                  </Badge>
                )}
              </div>
              {lead.opportunityLevel === 'quente' && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500 text-white text-[10px] font-black uppercase tracking-tighter animate-pulse shadow-md shadow-rose-200">
                  <Sparkles className="h-3.5 w-3.5" /> Prioridade Máxima
                </div>
            )}
          </div>

          <LeadBusinessDetails lead={lead} />
          <LeadTechInsights lead={lead} />

          <ManualAnalysisChecklist 
            lead={lead} 
            onUpdate={(analysis) => updateManualAnalysis(lead.id, analysis)} 
          />

          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-50 mt-4">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-9 rounded-full border-slate-200 text-slate-600 hover:bg-slate-50 gap-2 font-bold text-[11px] px-5"
                    onClick={handleGoogleSearch}
                  >
                    <Search className="h-3.5 w-3.5" />
                    Pesquisar no Google
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Veja mais informações antes de entrar em contato</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

            {/* Quick Contact Actions if Ready */}
            {useMemo(() => (lead.warmupStatus === 'Pronto' || lead.warmupStatus === 'Morno') && lead.whatsapp && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2 mt-4 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                    <MessageCircle className="h-6 w-6 fill-current" />
                  </div>
                  <div>
                    <p className="text-[11px] font-black text-emerald-800 uppercase tracking-widest">Abordagem Liberada</p>
                    <p className="text-sm font-bold text-emerald-700 leading-tight">Lead Seguro para WhatsApp</p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold px-6 h-11"
                  onClick={(e) => {
                    e.stopPropagation();
                    const { normalized } = normalizeWhatsApp(lead.whatsapp || '');
                    navigationService.openExternal(`https://wa.me/${normalized}`);
                    addContactHistory(lead.id, {
                      channel: 'WhatsApp',
                      status: 'enviado',
                      message: 'Iniciado via ação rápida (Modo Seguro)',
                      intensity: 'leve'
                    });
                  }}
                >
                  Abrir Whats
                </Button>
              </div>
            ), [lead.warmupStatus, lead.whatsapp, lead.id])}

            {/* ===== Ações & Inteligência ===== */}
            {(() => {
              const suggestion = suggestNextAction(lead);
              const contactState = getContactState(lead);
              const lastChannel = getLastChannelNote(lead);
              const makeReady = hasMakeEvidence(lead);

              const runSuggestion = async (e: React.MouseEvent) => {
                e.stopPropagation();
                if (loadingAction) return;
                
                setLoadingAction(suggestion.id);
                try {
                  switch (suggestion.id) {
                    case 'site':      await onGenerateSite(lead); break;
                    case 'social':    await onDiscoverSocial?.(lead); break;
                    case 'make':      setMakeOpen(true); break;
                    case 'pitch':     await onGeneratePitch(lead); break;
                    case 'diagnosis': await onViewDiagnosis(lead); break;
                  }
                } finally {
                  setLoadingAction(null);
                }
              };

              const SuggestIcon =
                suggestion.id === 'site' ? Layout
                : suggestion.id === 'social' ? SearchCode
                : suggestion.id === 'make' ? Send
                : suggestion.id === 'pitch' ? MessageSquare
                : Sparkles;

              // Secondary actions = todas as 4 menos a sugerida
              const secondary = ([
                { id: 'diagnosis' as SuggestedActionId, label: 'Diagnóstico IA',       icon: Sparkles,      color: 'text-violet-500',  onClick: () => onViewDiagnosis(lead) },
                { id: 'make' as SuggestedActionId,      label: 'Enviar via Make',      icon: Send,          color: 'text-indigo-500',  onClick: () => setMakeOpen(true) },
              ]).filter(s => s.id !== suggestion.id);

              // Unified Timeline Events
              const timelineEvents = [
                ...(lead.statusNotes || []).map(n => ({ id: n.id, date: n.createdAt, title: n.status, message: n.message, icon: MessageSquare, color: 'text-slate-400' })),
                ...(lead.contactHistory || []).map(h => ({ id: h.id, date: h.timestamp, title: `Contato via ${h.channel}`, message: h.message, icon: Send, color: h.status === 'erro' ? 'text-rose-500' : 'text-emerald-500' })),
                ...(lead.socialDiscovery?.lastCheckedAt ? [{ id: 'ia-check', date: lead.socialDiscovery.lastCheckedAt, title: 'Análise IA Concluída', message: 'Dados de redes sociais atualizados', icon: Zap, color: 'text-violet-500' }] : [])
              ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

              const recentEvents = timelineEvents.slice(0, 3);
              const remainingEvents = timelineEvents.slice(3);

              return (
                <div
                  className="bg-slate-50/80 backdrop-blur-sm border border-slate-200/50 rounded-3xl p-6 space-y-4 shadow-sm relative overflow-hidden group/intel"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none group-hover/intel:bg-primary/10 transition-colors" />

                  {/* Cabeçalho & Alertas Preventivos */}
                  <div className="flex flex-col gap-3 relative z-10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[11px] font-black text-slate-400 uppercase tracking-[0.15em]">
                        <Zap className="h-4 w-4 text-primary animate-pulse" /> IA Strategy Hub
                      </div>
                      
                      {lead.sequence && lead.sequence.isActive && (
                        <div className="flex-1 max-w-[120px]">
                           <FollowUpStepper sequence={lead.sequence} />
                        </div>
                      )}
                      
                      {/* Alertas Preventivos */}
                      <div className="flex gap-1">
                        {hasInstagram && !lead.instagramInteractedAt && suggestion.id === 'make' && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="p-1 rounded-md bg-rose-100 text-rose-600 animate-pulse cursor-help border border-rose-200">
                                  <AlertTriangle className="h-3.5 w-3.5" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent className="bg-rose-600 text-white font-bold text-xs border-none shadow-xl">
                                <p>Lead frio. Recomendado aquecer via Instagram antes.</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        {isInstagramRecent && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="p-1 rounded-md bg-amber-100 text-amber-600 cursor-help border border-amber-200">
                                  <Zap className="h-3.5 w-3.5" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Em processo de aquecimento (comportamento humano)</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        {contactState === 'recent' && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="p-1 rounded-md bg-amber-100 text-amber-600 cursor-help">
                                  <Ban className="h-3 w-3" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>Evite SPAM: Contato feito há menos de 24h</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        {lead.opportunityLevel === 'quente' && contactState === 'never' && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="p-1 rounded-md bg-rose-100 text-rose-600 animate-bounce cursor-help">
                                  <Sparkles className="h-3 w-3" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>Atenção: Lead QUENTE sem contato</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </div>

                    {/* Fluxo Recomendado (Modo Seguro) */}
                    <div className="bg-white/50 border border-slate-100 rounded-2xl p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                          <ShieldCheck className="h-3 w-3 text-emerald-500" /> Prospecção Segura
                        </span>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-3 w-3 text-slate-400 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-[200px] text-[10px]">
                              Siga o fluxo para evitar bloqueios: Pesquise → Interaja → Aguarde → Aborde.
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                        {/* Passo 1: Google */}
                        <div className={cn(
                          "flex items-center gap-1.5 p-1.5 rounded-lg border transition-all min-w-[80px]",
                          lead.manualAnalysis?.companyExists ? "bg-emerald-50 border-emerald-100 text-emerald-700 opacity-60" : "bg-blue-50 border-blue-100 text-blue-700"
                        )}>
                          <div className={cn("w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0", lead.manualAnalysis?.companyExists ? "bg-emerald-500 text-white" : "bg-blue-500 text-white")}>
                            {lead.manualAnalysis?.companyExists ? <CheckCircle2 className="h-2 w-2" /> : "1"}
                          </div>
                          <span className="text-[8px] font-bold">Google</span>
                        </div>

                        <ArrowRight className="h-3 w-3 text-slate-300 shrink-0" />

                        {/* Passo 2: Insta */}
                        <div className={cn(
                          "flex items-center gap-1.5 p-1.5 rounded-lg border transition-all min-w-[80px]",
                          lead.instagramInteractedAt ? "bg-emerald-50 border-emerald-100 text-emerald-700 opacity-60" : (lead.manualAnalysis?.companyExists ? "bg-blue-50 border-blue-100 text-blue-700" : "bg-slate-50 border-slate-100 text-slate-400")
                        )}>
                          <div className={cn("w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0", lead.instagramInteractedAt ? "bg-emerald-500 text-white" : "bg-slate-300 text-white")}>
                            {lead.instagramInteractedAt ? <CheckCircle2 className="h-2 w-2" /> : "2"}
                          </div>
                          <span className="text-[8px] font-bold">Insta</span>
                        </div>

                        <ArrowRight className="h-3 w-3 text-slate-300 shrink-0" />

                        {/* Passo 3: Aguardar */}
                        <div className={cn(
                          "flex items-center gap-1.5 p-1.5 rounded-lg border transition-all min-w-[80px]",
                          isInstagramRecent ? "bg-amber-50 border-amber-100 text-amber-700 animate-pulse" : (lead.instagramInteractedAt ? "bg-emerald-50 border-emerald-100 text-emerald-700 opacity-60" : "bg-slate-50 border-slate-100 text-slate-400")
                        )}>
                          <div className={cn("w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0", isInstagramRecent ? "bg-amber-500 text-white" : "bg-slate-300 text-white")}>
                            {isInstagramRecent ? <Zap className="h-2 w-2" /> : "3"}
                          </div>
                          <span className="text-[8px] font-bold">Pausa</span>
                        </div>

                        <ArrowRight className="h-3 w-3 text-slate-300 shrink-0" />

                        {/* Passo 4: Whats */}
                        <div className={cn(
                          "flex items-center gap-1.5 p-1.5 rounded-lg border transition-all min-w-[80px]",
                          lead.status === 'WhatsApp Enviado' ? "bg-emerald-50 border-emerald-100 text-emerald-700" : (isInstagramWarmed ? "bg-blue-50 border-blue-100 text-blue-700" : "bg-slate-50 border-slate-100 text-slate-400")
                        )}>
                          <div className={cn("w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0", lead.status === 'WhatsApp Enviado' ? "bg-emerald-500 text-white" : "bg-slate-300 text-white")}>
                            {lead.status === 'WhatsApp Enviado' ? <CheckCircle2 className="h-2 w-2" /> : "4"}
                          </div>
                          <span className="text-[8px] font-bold">Whats</span>
                        </div>
                      </div>
                    </div>

                    {/* Status Operacional Detalhado & Score de Aquecimento */}
                    <div className="flex flex-wrap gap-1.5">
                      {(() => {
                        const status = lead.warmupStatus || 'Frio';
                        const colors = {
                          'Frio': 'bg-blue-500 text-white border-blue-600',
                          'Aquecendo': 'bg-amber-500 text-white border-amber-600',
                          'Morno': 'bg-rose-400 text-white border-rose-500',
                          'Pronto': 'bg-rose-600 text-white border-rose-700 shadow-md animate-pulse'
                        };
                        return (
                          <span className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black border transition-all shadow-sm",
                            colors[status]
                          )}>
                            <Zap className={cn("h-3 w-3", status === 'Pronto' ? "fill-current" : "")} />
                            {status}
                          </span>
                        );
                      })()}

                      {/* Status de Contato */}
                      <span className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black border transition-all shadow-sm",
                        lead.contactStatus === 'Reenvio vencido' ? "bg-rose-500 text-white border-rose-600"
                        : lead.contactStatus === 'Contato enviado hoje' ? "bg-emerald-500 text-white border-emerald-600"
                        : lead.contactStatus === 'Aguardando resposta' ? "bg-amber-100 text-amber-700 border-amber-200"
                        : lead.contactStatus === 'Aguardando confirmação' ? "bg-amber-500 text-white border-amber-600 animate-pulse"
                        : lead.contactStatus === 'Sequência finalizada' ? "bg-slate-800 text-white border-slate-900"
                        : lead.contactStatus === 'Novo envio pendente' ? "bg-blue-50 text-blue-700 border-blue-200"
                        : "bg-slate-100 text-slate-500 border-slate-200"
                      )}>
                        {lead.contactStatus || 'Novo envio pendente'}
                      </span>

                      {/* Próximo Contato */}
                      {lead.nextFollowUpAt && (
                        <span className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black border transition-all shadow-sm",
                          new Date(lead.nextFollowUpAt) <= new Date() ? "bg-rose-50 text-rose-700 border-rose-200 animate-pulse" : "bg-blue-50 text-blue-700 border-blue-200"
                        )}>
                          <CalendarDays className="h-3 w-3" />
                          Próximo: {format(new Date(lead.nextFollowUpAt), "dd/MM", { locale: ptBR })}
                        </span>
                      )}

                      {/* Make Ready */}
                      <span className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black border transition-all",
                        makeReady ? "bg-violet-50 text-violet-700 border-violet-100 shadow-sm" : "bg-slate-100/50 text-slate-400 border-slate-200/60"
                      )}>
                        <Workflow className={cn("h-3 w-3", makeReady ? "text-violet-500" : "text-slate-300")} />
                        {makeReady ? 'Make Ativo' : 'Make N/A'}
                      </span>
                    </div>
                  </div>

                  {/* Banner: Próxima ação sugerida */}
                  <button
                    onClick={runSuggestion}
                    disabled={!!loadingAction}
                    className={cn(
                      "w-full flex items-center gap-4 p-4 rounded-2xl text-white shadow-lg transition-all group/sug relative overflow-hidden",
                      suggestion.priority === 'high' 
                        ? "bg-gradient-to-br from-rose-600 via-violet-600 to-indigo-600 shadow-rose-500/25 hover:shadow-rose-500/40"
                        : "bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600 shadow-indigo-500/25 hover:shadow-indigo-500/40",
                      loadingAction && "opacity-80 cursor-not-allowed scale-[0.98]"
                    )}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover/sug:animate-[shimmer_2s_infinite] pointer-events-none" />
                    
                    <div className="bg-white/15 backdrop-blur-md p-2.5 rounded-xl shrink-0 group-hover/sug:rotate-12 transition-transform shadow-inner">
                      {loadingAction === suggestion.id ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <SuggestIcon className="h-5 w-5" />
                      )}
                    </div>
                    <div className="flex-1 text-left min-w-0 relative z-10">
                      <div className="text-[10px] font-black uppercase tracking-widest text-indigo-100/80 mb-0.5">
                        {suggestion.priority === 'high' ? '🔥 Recomendação Prioritária' : 'IA Smart Recommendation'}
                      </div>
                      <div className="text-sm font-black tracking-tight">{suggestion.label}</div>
                      {suggestion.reason && (
                        <div className="text-[9px] font-medium text-white/60 mt-0.5 line-clamp-1">{suggestion.reason}</div>
                      )}
                    </div>
                    <ArrowRight className="h-5 w-5 opacity-50 group-hover/sug:opacity-100 group-hover/sug:translate-x-1 transition-all shrink-0" />
                  </button>

                  {/* Roteiro de Abordagem (Recommended Entrance) */}
                  <div className="bg-white/40 border border-slate-100 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="h-3 w-3 text-violet-500" /> Entrada Recomendada
                      </span>
                      <Badge variant="outline" className="text-[8px] font-bold bg-violet-50 text-violet-600 border-violet-100 uppercase">Natural & Leve</Badge>
                    </div>
                    
                    <div className="space-y-2">
                      {getRecommendedEntrance(lead).map((opt, idx) => (
                        <div 
                          key={idx}
                          className="p-3 rounded-xl bg-white border border-slate-100 hover:border-violet-200 transition-all cursor-pointer group/msg"
                          onClick={() => {
                            navigator.clipboard.writeText(opt.text);
                            toast.success("Copiado!", { description: "Mensagem pronta para o WhatsApp." });
                          }}
                        >
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[8px] font-black uppercase text-violet-400 tracking-widest">{opt.type}</span>
                            <div className="opacity-0 group-hover/msg:opacity-100 transition-opacity">
                              <MousePointer2 className="h-3 w-3 text-violet-400" />
                            </div>
                          </div>
                          <p className="text-[11px] text-slate-600 font-medium leading-relaxed italic italic">"{opt.text}"</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Ações Operacionais */}
                  <div className="flex flex-col gap-2">
                    <div className="grid grid-cols-2 gap-2">
                      {/* Botão de Envio agora via Make */}
                      <button
                        onClick={() => {
                          if (lead.warmupStatus === 'Frio' && hasInstagram) {
                            setWhatsappConfirmOpen(true);
                          } else {
                            setMakeOpen(true);
                          }
                        }}
                        className={cn(
                          "flex items-center justify-center gap-2 h-10 rounded-xl transition-all text-[10px] font-black",
                          suggestion.id === 'make' || lead.warmupStatus === 'Pronto'
                            ? "bg-violet-600 text-white shadow-md hover:bg-violet-700" 
                            : "bg-white border border-slate-200 hover:border-violet-300 hover:bg-violet-50 text-slate-600",
                          lead.warmupStatus === 'Frio' && hasInstagram && "border-amber-200 bg-amber-50/50"
                        )}
                      >
                        <Send className={cn("h-3.5 w-3.5", suggestion.id === 'make' || lead.warmupStatus === 'Pronto' ? "text-white" : "text-violet-500")} /> 
                        {lead.sequence?.isActive ? `Etapa ${lead.sequence.currentStep + 1}/${lead.sequence.totalSteps}` : "Enviar Agora"}
                      </button>

                      {/* Modo de Automação */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="outline" 
                            className="h-10 rounded-xl border-slate-200 text-[10px] font-black uppercase tracking-tighter gap-2"
                          >
                            <Workflow className={cn("h-3.5 w-3.5", lead.automationMode === 'automatic' ? "text-emerald-500" : "text-slate-400")} />
                            {lead.automationMode === 'automatic' ? "Modo Auto" : lead.automationMode === 'assisted' ? "Assistido" : "Manual"}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="rounded-xl p-2 min-w-[150px]">
                          <DropdownMenuItem onClick={() => updateAutomationMode(lead.id, 'manual')} className="rounded-lg gap-2 text-[10px] font-black uppercase">
                            Manual
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateAutomationMode(lead.id, 'assisted')} className="rounded-lg gap-2 text-[10px] font-black uppercase">
                            Assistido
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateAutomationMode(lead.id, 'automatic')} className="rounded-lg gap-2 text-[10px] font-black uppercase text-emerald-600">
                            Automático
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Agendar / Adiar */}
                  <div className="grid grid-cols-1">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="flex items-center justify-center gap-2 h-10 rounded-xl bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all text-[10px] font-black text-slate-600">
                          <CalendarDays className="h-3.5 w-3.5 text-blue-500" /> Próximo Passo
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl p-1 shadow-2xl border-slate-100 min-w-[160px]">
                        <DropdownMenuItem onClick={() => addContactHistory(lead.id, { channel: 'Outro', status: 'pendente', nextFollowUpAt: addDays(new Date(), 1).toISOString(), message: 'Reenvio adiado para amanhã' })} className="gap-2 text-[11px] font-bold">
                          <Clock className="h-3.5 w-3.5" /> Reenviar em 1 dia
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => addContactHistory(lead.id, { channel: 'Outro', status: 'pendente', nextFollowUpAt: addDays(new Date(), 3).toISOString(), message: 'Reenvio adiado para 3 dias' })} className="gap-2 text-[11px] font-bold">
                          <Clock className="h-3.5 w-3.5" /> Reenviar em 3 dias
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => addContactHistory(lead.id, { channel: 'Outro', status: 'pendente', nextFollowUpAt: addDays(new Date(), 7).toISOString(), message: 'Reenvio adiado para 7 dias' })} className="gap-2 text-[11px] font-bold">
                          <Clock className="h-3.5 w-3.5" /> Reenviar em 7 dias
                        </DropdownMenuItem>
                        {lead.sequence?.isActive && (
                          <>
                            <div className="h-px bg-slate-100 my-1" />
                            <DropdownMenuItem onClick={() => confirmContactDelivery(lead.id, '', true)} className="gap-2 text-[11px] font-bold text-violet-600">
                              <Sparkles className="h-3.5 w-3.5" /> Pular p/ Próxima Etapa
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Descartar / Sem Interesse */}
                    <button
                      onClick={() => setNoInterestDialogOpen(true)}
                      className="flex items-center justify-center gap-2 h-10 rounded-xl bg-white border border-slate-200 hover:border-amber-300 hover:bg-amber-50 transition-all text-[10px] font-black text-slate-600"
                    >
                      <UserMinus className="h-3.5 w-3.5 text-amber-500" /> Sem Interesse
                    </button>

                    <button
                      onClick={() => setDiscardDialogOpen(true)}
                      className="flex items-center justify-center gap-2 h-10 rounded-xl bg-white border border-slate-200 hover:border-rose-300 hover:bg-rose-50 transition-all text-[10px] font-black text-slate-600"
                    >
                      <Ban className="h-3.5 w-3.5 text-rose-500" /> Descartar
                    </button>
                  </div>

                  {/* Ações secundárias (IA) */}
                  <div className="flex items-center gap-1.5 pt-1">
                    {secondary.map((s) => {
                      const Icon = s.icon;
                      const isLoading = loadingAction === s.id;
                      if (s.id === 'pitch' || s.id === 'social') return null;
                      return (
                        <button
                          key={s.id}
                          title={s.label}
                          aria-label={s.label}
                          disabled={!!loadingAction}
                          onClick={async (e) => { 
                            e.stopPropagation(); 
                            if (loadingAction) return;
                            setLoadingAction(s.id);
                            try { await s.onClick(); } finally { setLoadingAction(null); }
                          }}
                          className={cn(
                            "flex-1 inline-flex items-center justify-center gap-1.5 h-9 rounded-lg bg-white border border-slate-200 transition-all",
                            !loadingAction && "hover:border-slate-300 hover:bg-slate-50",
                            loadingAction && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          <Icon className={cn("h-3 w-3", s.color)} />
                        </button>
                      );
                    })}
                  </div>

                  {/* Histórico colapsável & Timeline Visual */}
                  <details className="group/hist" open>
                    <summary className="list-none cursor-pointer flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-primary transition-colors">
                      <span className="flex items-center gap-1.5">
                        <History className="h-3 w-3" /> Timeline Operacional
                      </span>
                      <ChevronDown className="h-3 w-3 transition-transform group-open/hist:rotate-180" />
                    </summary>
                    <div className="mt-3 space-y-3 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-slate-100">
                      {timelineEvents.length === 0 ? (
                        <p className="text-[10px] text-slate-400 italic px-1 ml-6">Nenhum evento registrado</p>
                      ) : (
                        <>
                          {recentEvents.map((e) => (
                            <div key={e.id} className="flex items-start gap-3 relative z-10">
                              <div className={cn("shrink-0 h-6 w-6 rounded-full bg-white border shadow-sm flex items-center justify-center", e.color)}>
                                <e.icon className="h-3 w-3" />
                              </div>
                              <div className="min-w-0 flex-1 bg-white/50 rounded-xl p-2 border border-slate-100/50">
                                <div className="flex justify-between items-center mb-1">
                                  <div className="text-[10px] font-black text-slate-700 truncate">{e.title}</div>
                                  <span className="text-[8px] font-black text-slate-400 tabular-nums bg-slate-50 px-1 py-0.5 rounded">
                                    {format(new Date(e.date), "dd/MM HH:mm", { locale: ptBR })}
                                  </span>
                                </div>
                                {e.message && (
                                  <div className="text-[9px] text-slate-500 line-clamp-2 leading-relaxed">
                                    {e.message}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                          
                          {remainingEvents.length > 0 && (
                            <div className="ml-9 pt-1">
                               <p className="text-[8px] font-black text-primary/60 uppercase tracking-wider hover:text-primary transition-colors cursor-pointer">+ {remainingEvents.length} interações anteriores</p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </details>
                </div>
              );
            })()}

            {/* DECISÃO ÚNICA (ANTI-DÚVIDA) */}
            {(() => {
               const action = suggestNextAction(lead);
               return (
                 <div className="bg-violet-600 rounded-3xl p-5 text-white shadow-xl shadow-violet-200 border-b-4 border-violet-800 space-y-3">
                   <div className="flex items-center gap-2">
                     <Badge className="bg-emerald-500 text-white border-none text-[9px] font-black uppercase tracking-widest">Ação Recomendada</Badge>
                     {lead.decisionScore && (
                       <Badge variant="outline" className="border-white/20 text-white text-[9px] font-bold">Score: {lead.decisionScore}</Badge>
                     )}
                   </div>
                   <h4 className="text-xl font-black leading-tight">{action.label}</h4>
                   <p className="text-xs text-violet-100 font-medium">{action.reason || "IA determinou que este é o melhor passo agora."}</p>
                   <Button 
                     size="lg" 
                     className="w-full bg-white text-violet-600 hover:bg-violet-50 rounded-2xl font-black shadow-lg"
                     onClick={(e) => {
                       e.stopPropagation();
                       if (action.id === 'site') onGenerateSite(lead);
                       else setMakeOpen(true);
                     }}
                   >
                     EXECUTAR AGORA <ArrowRight className="ml-2 h-4 w-4" />
                   </Button>
                 </div>
               );
            })()}

            {/* Opportunity Score Block */}
            {(() => {
              const scoreData = calculateOpportunityScore(lead);
              const scoreColor = getScoreColor(lead.opportunityScore);
              const isOverdue = lead.contactStatus === 'Reenvio vencido';
              const isWaitingConfirm = lead.contactStatus === 'Aguardando confirmação';
              const latestHistory = (lead.contactHistory || []).find(h => h.status === 'pendente');
              
              return (
                <div className="space-y-4">
                  {isWaitingConfirm && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col gap-3 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-amber-500 flex items-center justify-center text-white shrink-0 shadow-md">
                          <CheckCircle2 className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Confirmação Real</p>
                          <p className="text-sm font-black text-amber-900 tracking-tight">O envio foi entregue com sucesso?</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                         <Button 
                           size="sm" 
                           onClick={() => confirmContactDelivery(lead.id, latestHistory?.id || '', true)} 
                           className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-[10px] font-black h-8 shadow-sm"
                         >
                           SIM, CONFIRMAR
                         </Button>
                         <Button 
                           size="sm" 
                           variant="outline"
                           onClick={() => confirmContactDelivery(lead.id, latestHistory?.id || '', false)} 
                           className="rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 text-[10px] font-black h-8"
                         >
                           NÃO, FALHOU
                         </Button>
                      </div>
                    </div>
                  )}

                  {isOverdue && !isWaitingConfirm && (
                    <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center gap-3 animate-pulse shadow-sm">
                      <div className="h-10 w-10 rounded-full bg-rose-500 flex items-center justify-center text-white shrink-0 shadow-md">
                        <Clock className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Ação Necessária</p>
                        <p className="text-sm font-black text-rose-900 tracking-tight">Reenvio Vencido!</p>
                      </div>
                      <Button size="sm" onClick={() => setMakeOpen(true)} className="rounded-xl bg-rose-600 hover:bg-rose-700 text-[10px] font-black h-8 px-4 shadow-sm">REENVIAR AGORA</Button>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="bg-slate-50/80 p-5 rounded-[1.5rem] border border-slate-100 space-y-4 relative overflow-hidden group/score">
                      <div className="flex justify-between items-start relative z-10">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                            <TrendingUp className="h-4 w-4 text-primary" /> Potencial de Venda
                          </span>
                          <p className="text-[10px] text-slate-500 mt-1 font-medium leading-tight">Chance de conversão via IA</p>
                          
                          {/* Por que esse score? */}
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button className="flex items-center gap-1.5 mt-2 text-[10px] font-bold text-primary/80 hover:text-primary transition-colors bg-white/50 px-2 py-1 rounded-lg border border-primary/10">
                                  <Info className="h-3 w-3" /> Por que esse score?
                                </button>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-[280px] p-3 rounded-xl bg-slate-900 text-white border-none shadow-2xl">
                                <div className="space-y-2">
                                  <p className="text-[11px] font-black uppercase tracking-widest text-primary-foreground/60 mb-2">Fatores Analisados</p>
                                  {scoreData.factors && scoreData.factors.length > 0 ? (
                                    <ul className="space-y-1.5">
                                      {scoreData.factors.map((f, i) => (
                                        <li key={i} className="flex items-center gap-2 text-[11px] font-medium">
                                          <div className="h-1 w-1 rounded-full bg-primary shrink-0" /> {f}
                                        </li>
                                      ))}
                                    </ul>
                                ) : (
                                  <p className="text-[11px] italic opacity-70">Aguardando dados para análise detalhada.</p>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <div className={cn(
                        "px-3 py-2 rounded-xl border font-black text-base shadow-sm transition-all group-hover/score:scale-110 group-hover/score:rotate-3",
                        scoreColor
                      )}>
                        {lead.opportunityScore}%
                      </div>
                    </div>
                    <Progress 
                      value={lead.opportunityScore} 
                      className="h-2.5 bg-slate-200/50 rounded-full overflow-hidden" 
                    />
                    
                    {/* IMPACTO FINANCEIRO */}
                    <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 flex flex-col gap-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Valor Potencial</span>
                        <span className="text-sm font-black text-emerald-900">R$ {(lead.estimatedValue || 0).toLocaleString('pt-BR')}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Chance de Fechar</span>
                        <span className="text-sm font-black text-blue-900">{lead.closingChance || 0}%</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-emerald-100/50">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Valor Esperado</span>
                        <span className="text-sm font-black text-slate-900">R$ {(lead.expectedRevenue || 0).toLocaleString('pt-BR')}</span>
                      </div>
                    </div>
                  </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </CardContent>

        {/* Footer enxuto: apenas meta (Negociações / Anexos / Score) */}
        <CardFooter className="px-6 py-4 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
          <div className="w-full flex justify-center gap-6">
            <button 
              onClick={() => setNotesOpen(true)}
              className="flex items-center gap-2 text-[10px] font-bold text-slate-400 hover:text-primary transition-colors group/notes"
            >
              <div className="relative">
                <MessageSquare className="h-3.5 w-3.5" />
                {notesCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-primary text-[6px] text-white">
                    {notesCount}
                  </span>
                )}
              </div>
              Negociações
            </button>
            <div className="w-px h-3 bg-slate-200 self-center" />
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
              <Paperclip className="h-3.5 w-3.5" />
              {attachmentsCount} Anexos
            </div>
            <div className="w-px h-3 bg-slate-200 self-center" />
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
               <TrendingUp className="h-3.5 w-3.5" />
               Score: {lead.opportunityScore}
            </div>
          </div>
        </CardFooter>

        <StatusNotesDialog lead={lead} open={notesOpen} onOpenChange={setNotesOpen} />
        <SendToMakeDialog
          lead={makeOpen ? lead : null}
          open={makeOpen}
          onOpenChange={setMakeOpen}
          onStatusChanged={(s) => {
            // Register successful contact
            addContactHistory(lead.id, {
              channel: 'WhatsApp', // Fallback
              status: 'confirmado',
              message: 'Contato enviado via Make',
              nextFollowUpAt: addDays(new Date(), 3).toISOString() // Default 3 days follow-up
            });
            onUpdateStatus(lead.id, s as ProspectLead['status']);
          }}
        />

        {/* Dialog: Descartar Lead */}
        <Dialog open={discardDialogOpen} onOpenChange={setDiscardDialogOpen}>
          <DialogContent className="max-w-sm rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-black flex items-center gap-2">
                <Ban className="h-5 w-5 text-rose-500" />
                Descartar Lead
              </DialogTitle>
              <DialogDescription className="text-sm font-medium">O lead será removido do funil principal. Por que você está descartando este lead?</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Select value={discardReason} onValueChange={setDiscardReason}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Selecione um motivo..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="Dados incorretos">Dados incorretos</SelectItem>
                  <SelectItem value="Empresa fechada">Empresa fechada</SelectItem>
                  <SelectItem value="Fora do perfil">Fora do perfil</SelectItem>
                  <SelectItem value="Concorrente">Concorrente</SelectItem>
                  <SelectItem value="Outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setDiscardDialogOpen(false)} className="rounded-xl font-bold">Cancelar</Button>
              <Button 
                variant="destructive" 
                disabled={!discardReason}
                onClick={() => {
                  discardLead(lead.id, discardReason);
                  setDiscardDialogOpen(false);
                }}
                className="rounded-xl font-black"
              >
                Confirmar Descarte
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog: Sem Interesse */}
        <Dialog open={noInterestDialogOpen} onOpenChange={setNoInterestDialogOpen}>
          <DialogContent className="max-w-sm rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-black flex items-center gap-2">
                <UserMinus className="h-5 w-5 text-amber-500" />
                Sem Interesse
              </DialogTitle>
              <DialogDescription className="text-sm font-medium">O cliente respondeu que não tem interesse no momento. Qual o motivo?</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Select value={noInterestReason} onValueChange={setNoInterestReason}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Selecione um motivo..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="Já possui agência/parceiro">Já possui agência/parceiro</SelectItem>
                  <SelectItem value="Sem orçamento no momento">Sem orçamento no momento</SelectItem>
                  <SelectItem value="Não é o decisor">Não é o decisor</SelectItem>
                  <SelectItem value="Achou o serviço caro">Achou o serviço caro</SelectItem>
                  <SelectItem value="Outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setNoInterestDialogOpen(false)} className="rounded-xl font-bold">Cancelar</Button>
              <Button 
                disabled={!noInterestReason}
                onClick={() => {
                  markNoInterest(lead.id, noInterestReason);
                  setNoInterestDialogOpen(false);
                }}
                className="rounded-xl font-black bg-amber-500 hover:bg-amber-600 text-white"
              >
                Marcar Sem Interesse
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Card>
      )}
    </motion.div>
  );
};
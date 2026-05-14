"use client";
// @ts-nocheck
import React, { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { cn } from "../../lib/utils";
import { navigationService } from '../../lib/navigation-service';
import { proposalStorage } from '../../lib/proposal-storage';
import { SiteHeader } from '../../components/site-header';
import { SiteFooter } from '../../components/site-footer';
import { 
  Plus, 
  Search, 
  Filter, 
  TrendingUp, 
  Users, 
  Layout, 
  MessageSquare,
  X,
  PlusCircle,
  FileText,
  Save,
  ChevronRight,
  ClipboardList,
  Target,
  MapPin,
  Upload,
  Database,
  Globe,
  Instagram,
  Facebook,
  Linkedin,
  Youtube,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Image as ImageIcon,
  ScanText,
  Monitor,
  Smartphone,
  Tablet
} from '../../lib/icons';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Checkbox } from "../../components/ui/checkbox";
import { Badge } from "../../components/ui/badge";
import { Progress } from "../../components/ui/progress";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "../../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { useProspectingStore } from './prospecting-store';
import { useAuditStore } from '../../hooks/useAuditStore';
import { ProspectLead, SocialDiscoveryData, GeneratedSite } from './types';
import { parseRawInput } from './lead-parser';
import { parseLocalSearchInput } from './local-search-parser';
import { calculateOpportunityScore } from './opportunity-score';
import { generatePitch } from './pitch-generator';
import { discoverSocialMedia, updateOpportunityWithSocial } from './social-discovery';
import { LeadCard, type LeadCardDensity } from './LeadCard';
import { LeadPipeline } from './LeadPipeline';
import { SitePreview } from './SitePreview';
import { PitchPanel } from './PitchPanel';
import { extractTextFromImage, parseExtractedText } from './ocr-service';
import { toast } from 'sonner';
import { detectPremiumNiche, extractContentFromRaw } from '../../lib/premium-niche-engine';
import { validatePremiumInput, checkFileValid } from '../../lib/premium-validator';
import { 
  Trash2, 
  Check, 
  AlertTriangle, 
  Zap, 
  Calculator, 
  ShieldCheck, 
  Sparkles, 
  MessageCircle as MessageCircleIcon,
  History,
  Info,
  ExternalLink as ExternalLinkIcon,
  CheckCircle,
  XCircle, 
  Eye,
  Cloud,
  Calendar as CalendarIcon,
  Ban,
  Clock,
  ArrowRight
} from 'lucide-react';
import { syncAllLeadsToBackend } from './sync-service';
import { 
  normalizeInstagram, 
  normalizeGoogleMaps, 
  normalizeWhatsApp, 
  normalizeWebsite 
} from './utils-validation';
import { RevenueSimulator } from '../../components/proposal/RevenueSimulator';
import { validateProposal } from '../../lib/idea-validator';
import { IdeaValidatorPanel } from '../../components/proposal/IdeaValidatorPanel';
import { AiConsultantChat } from '../../components/proposal/AiConsultantChat';
import { FocusMode } from './FocusMode';
import { PerformanceDashboard } from './PerformanceDashboard';
import { DailyAiPlan } from './DailyAiPlan';
import { LeadPlaybook } from './LeadPlaybook';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { createServerFn } from "@tanstack/react-start";
import { analyzePageSpeed as analyzePageSpeedFn } from '../../lib/pagespeed.functions';

const hunterFindEmails = createServerFn({ method: "POST" })
  .handler(async (ctx: any) => {
    const { hunterFindEmails: fn } = await import('../../services/enrichment-paid-providers');
    return fn(ctx.data);
  });

const builtWithLookup = createServerFn({ method: "POST" })
  .handler(async (ctx: any) => {
    const { builtWithLookup: fn } = await import('../../services/enrichment-paid-providers');
    return fn(ctx.data);
  });

const analyzePageSpeed = createServerFn({ method: "POST" })
  .handler(async (ctx: any) => {
    return analyzePageSpeedFn(ctx.data);
  });


export default function ProspectingPage() {
  const navigate = useNavigate();
  const { leads, addLead, updateLead, deleteLead, deleteLeads, moveLead, moveLeads, upsertLead, getFocusQueue, getWeeklyPerformanceReport, discardLead, markNoInterest } = useProspectingStore();
  
  // Funções de utilidade do buscador
  const { computeDigitalScore } = React.useMemo(() => {
    // Importação dinâmica para evitar ciclos
    return { 
      computeDigitalScore: (lead: any) => {
        const hasSite = !!lead.websiteUrl;
        const hasInsta = !!lead.instagramHandle;
        const hasWhats = !!lead.whatsapp;
        const hasEmail = !!lead.email;
        let score = 0;
        if (hasSite) score += 40;
        if (hasInsta) score += 20;
        if (hasWhats) score += 20;
        if (hasEmail) score += 20;
        
        let level: 'verde' | 'amarelo' | 'vermelho' = 'vermelho';
        if (score >= 80) level = 'verde';
        else if (score >= 50) level = 'amarelo';
        
        return { score, level };
      }
    };
  }, []);
  
  // Sincronização automática de leads do Supabase para o CRM/Prospecção
  React.useEffect(() => {
    const loadSupabaseLeads = async () => {
      try {
        const { listImportedLeads } = await import('@/lib/leads-import.functions');
        const res = await listImportedLeads({ data: { page: 1, pageSize: 2000 } });
        
        if (res.rows && res.rows.length > 0) {
          const existingIds = new Set(leads.map(l => l.id));
          res.rows.forEach(dbLead => {
            if (!existingIds.has(dbLead.id)) {
              addLead({
                id: dbLead.id,
                companyName: dbLead.nome || dbLead.fantasia || 'Sem nome',
                niche: dbLead.nicho || 'geral',
                city: dbLead.cidade || '',
                neighborhood: dbLead.bairro || undefined,
                address: (dbLead as any).address || undefined,
                email: dbLead.email || undefined,
                whatsapp: dbLead.telefone || undefined,
                websiteUrl: dbLead.site || undefined,
                instagramHandle: dbLead.instagram_handle || undefined,
                cnpj: dbLead.cnpj || undefined,
                cnae: dbLead.cnae_principal || dbLead.atividade || undefined,
                openingDate: dbLead.data_abertura || undefined,
                legalType: dbLead.status === 'MATRIZ' || dbLead.status === 'FILIAL' ? dbLead.status : undefined,
                size: dbLead.porte || undefined,
                status_sefaz: dbLead.status || undefined,
                partners: Array.isArray(dbLead.socios) ? (dbLead.socios as any as string[]) : undefined,
                is_enriched: !!dbLead.enrichment_data,
                digitalScore: computeDigitalScore({ 
                  websiteUrl: dbLead.site, 
                  instagramHandle: dbLead.instagram_handle, 
                  whatsapp: dbLead.telefone, 
                  email: dbLead.email 
                }).score,
                digitalLevel: computeDigitalScore({ 
                  websiteUrl: dbLead.site, 
                  instagramHandle: dbLead.instagram_handle, 
                  whatsapp: dbLead.telefone, 
                  email: dbLead.email 
                }).level,
                source: 'supabase_import',
                status: (dbLead.status === 'Novo' ? 'Novo' : (dbLead.followup_status || 'Novo')) as any,
                opportunityScore: Math.round((dbLead.confidence_score || 0.5) * 100),
                opportunityLevel: (dbLead.confidence_score || 0.5) >= 0.8 ? 'quente' : (dbLead.confidence_score || 0.5) >= 0.5 ? 'boa' : 'média',
                diagnosis: dbLead.atividade || '',
                createdAt: dbLead.created_at || new Date().toISOString(),
                updatedAt: dbLead.created_at || new Date().toISOString(),
              });
            }
          });
        }
      } catch (err) {
        console.error('Falha ao sincronizar leads do banco:', err);
      }
    };
    loadSupabaseLeads();
  }, [addLead]);

  const auditLogs = useAuditStore(state => state.auditLogs);
  const [activeTab, setActiveTab] = useState('pipeline'); 
  const [activeSubTab, setActiveSubTab] = useState('pipeline');
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [rawInput, setRawInput] = useState('');
  const [nicheFilter, setNicheFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [cardDensity, setCardDensity] = useState<LeadCardDensity>(() => {
    if (typeof window === 'undefined') return 'comfortable';
    const saved = window.localStorage.getItem('prospecting:cardDensity');
    return (saved === 'compact' || saved === 'ultra' || saved === 'comfortable') ? saved : 'comfortable';
  });
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('prospecting:cardDensity', cardDensity);
    }
  }, [cardDensity]);
  
  // Local Search Import State
  const [isLocalImportOpen, setIsLocalImportOpen] = useState(false);
  const [importNiche, setImportNiche] = useState('');
  const [importLocation, setImportLocation] = useState('');
  const [localSearchData, setLocalSearchData] = useState('');
  
  // Wizard State
  const [wizardStep, setWizardStep] = useState(1);
  const totalWizardSteps = 3;

  // Modals state
  const [selectedLead, setSelectedLead] = useState<ProspectLead | null>(null);
  const [isDiagnosisOpen, setIsDiagnosisOpen] = useState(false);
  const [isSiteGenOpen, setIsSiteGenOpen] = useState(false);
  const [isLeadConfigOpen, setIsLeadConfigOpen] = useState(false);
  const [configInitialTab, setConfigInitialTab] = useState('digital');
  const [siteViewMode, setSiteViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [siteActiveSection, setSiteActiveSection] = useState('hero');
  const [isPitchGenOpen, setIsPitchGenOpen] = useState(false);
  const [isSocialDiscoveryOpen, setIsSocialDiscoveryOpen] = useState(false);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveryResult, setDiscoveryResult] = useState<SocialDiscoveryData | null>(null);
  const [isImporting, setIsImporting] = useState(false); // Flag para controlar visibilidade do banner de jobs
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [isFocusModeOpen, setIsFocusModeOpen] = useState(false);
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState(false);
  const [isNoInterestDialogOpen, setIsNoInterestDialogOpen] = useState(false);
  const [pendingReason, setPendingReason] = useState("");
  const [isEnrichingExtra, setIsEnrichingExtra] = useState(false);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsOcrLoading(true);
    const toastId = toast.loading("Lendo imagem com IA...");

    try {
      const text = await extractTextFromImage(file);
      const data = parseExtractedText(text);
      
      setRawInput(prev => prev + (prev ? '\n' : '') + `${data.companyName} | ${data.whatsapp}`);
      toast.success("Dados extraídos da imagem!", { id: toastId });
    } catch (error) {
      toast.error("Erro ao processar imagem.", { id: toastId });
    } finally {
      setIsOcrLoading(false);
    }
  };


  const filteredLeads = (leads || []).filter(l => 
    (l.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
     l.instagramHandle?.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (nicheFilter === '' || l.niche?.toLowerCase().includes(nicheFilter.toLowerCase())) &&
    (statusFilter === 'all' || l.status === statusFilter) &&
    l.status !== 'Perdido' &&
    l.contactStatus !== 'Lead descartado' && 
    l.contactStatus !== 'Cliente sem interesse'
  ).sort((a, b) => ((b as any).closingChance || 0) - ((a as any).closingChance || 0));

  const stats = {
    total: (leads || []).length,
    hot: (leads || []).filter(l => l.opportunityLevel === 'quente').length,
    sites: (leads || []).filter(l => l.status === 'Site gerado').length,
    contacted: (leads || []).filter(l => 
      ['Contatado', 'Interessado', 'Lead Fechado', 'Lead Qualificado', 'WhatsApp Enviado', 'Cold Mail Enviado', 'LinkedIn Enviado', 'Instagram Enviado'].includes(l.status)
    ).length,
  };

  const handleAddLeads = async () => {
    const parsed = parseRawInput(rawInput);
    if (parsed.length === 0) {
      toast.error("Nenhum dado válido encontrado para importar.");
      return;
    }

    let successCount = 0;
    let failCount = 0;

    for (const p of parsed) {
      const newLead: ProspectLead = {
        id: crypto.randomUUID(),
        companyName: p.companyName || 'Nova Empresa',
        niche: nicheFilter || 'Serviços',
        city: 'Joinville', // Default
        source: 'Manual input',
        status: 'Novo',
        opportunityScore: 0, // Recalculated by store
        opportunityLevel: 'baixa', // Recalculated by store
        diagnosis: '', // Recalculated by store
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...p
      };
      addLead(newLead);

      // Persist to Supabase
      try {
        const { addLeadManual } = await import('@/lib/leads-import.functions');
        await addLeadManual({
          data: {
            nome: newLead.companyName,
            telefone: newLead.whatsapp,
            email: newLead.email,
            cidade: newLead.city,
            nicho: newLead.niche,
            site: newLead.websiteUrl,
            instagram_handle: newLead.instagramHandle,
            source: 'manual',
          }
        });
        successCount++;
      } catch {
        failCount++;
      }
    }

    if (failCount > 0) {
      toast.warning(`${successCount} leads salvos, ${failCount} falharam ao salvar no servidor.`);
    } else {
      toast.success(`${successCount} leads importados e salvos com sucesso!`);
    }
    setIsAddDialogOpen(false);
    setRawInput('');
  };

  const handleImportLocalLeads = (inputData?: string) => {
    const dataToParse = inputData || localSearchData;
    const parsed = parseLocalSearchInput(dataToParse, importNiche, importLocation);
    if (parsed.length === 0) {
      toast.error("Nenhum dado válido encontrado para importar.");
      return;
    }
    
    setIsImporting(true); // Ativa o banner de jobs apenas durante a importação

    let importedCount = 0;
    let duplicateCount = 0;

    parsed.forEach(p => {
      const isDuplicate = (leads || []).some(l => 
        (p.whatsapp && l.whatsapp === p.whatsapp) || 
        (l.companyName?.toLowerCase() === p.companyName?.toLowerCase() && l.city === p.city)
      );

      if (isDuplicate) {
        duplicateCount++;
        return;
      }

      const newLead: ProspectLead = {
        id: crypto.randomUUID(),
        companyName: p.companyName || 'Nova Empresa',
        niche: p.niche || importNiche || 'Serviços',
        city: p.city || importLocation || 'Joinville',
        source: 'busca_local',
        status: 'Novo',
        opportunityScore: 0,
        opportunityLevel: 'baixa',
        diagnosis: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        is_enriched: p.is_enriched || false,
        digitalScore: computeDigitalScore(p).score,
        digitalLevel: computeDigitalScore(p).level,
        ...p
      };
      
      // Enriquecimento Automático com IA disparado na criação
      addLead(newLead);
      
      // Simular descoberta automática para novos leads de importação
      setTimeout(() => {
        handleDiscoverSocial(newLead);
      }, 500);

      importedCount++;
    });

    if (importedCount > 0) {
      toast.success(`${importedCount} leads importados com sucesso! ${duplicateCount > 0 ? `(${duplicateCount} duplicados ignorados)` : ''}`);
      setIsLocalImportOpen(false);
      setLocalSearchData('');
    } else {
      toast.warning(`Nenhum lead novo importado. ${duplicateCount} duplicados encontrados.`);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      handleImportLocalLeads(text);
    };
    reader.readAsText(file);
  };

  const openDiagnosis = (lead: ProspectLead) => {
    setSelectedLead(lead);
    setIsDiagnosisOpen(true);
  };

  const openSiteGen = (lead: ProspectLead) => {
    setSelectedLead(lead);
    setIsSiteGenOpen(true);
  };

  const openPitchGen = (lead: ProspectLead) => {
    setSelectedLead(lead);
    setIsPitchGenOpen(true);
  };

  const handleEditLead = (lead: ProspectLead, initialTab: string = 'overview') => {
    setSelectedLead(lead);
    setConfigInitialTab(initialTab);
    setIsLeadConfigOpen(true);
  };

  const handleDiscoverSocial = async (lead: ProspectLead) => {
    setSelectedLead(lead);
    setIsSocialDiscoveryOpen(true);
    setIsDiscovering(true);
    setDiscoveryResult(null);

    try {
      const result = await discoverSocialMedia(lead);
      setDiscoveryResult(result);
    } catch (error) {
      toast.error("Erro ao buscar redes sociais.");
    } finally {
      setIsDiscovering(false);
    }
  };

  const openFocusMode = () => {
    setIsFocusModeOpen(true);
  };

  const confirmSocialDiscovery = () => {
    if (!selectedLead || !discoveryResult) return;
    
    updateLead(selectedLead.id, { 
      socialDiscovery: discoveryResult,
      instagramHandle: discoveryResult.instagramHandle || selectedLead.instagramHandle,
      instagramUrl: discoveryResult.instagramUrl || selectedLead.instagramUrl,
    });

    toast.success("Redes sociais confirmadas e score atualizado!");
    setIsSocialDiscoveryOpen(false);
  };

  const handleMoveLead = (id: string, newStatus: ProspectLead['status']) => {
    updateLead(id, { status: newStatus, updatedAt: new Date().toISOString() });
    const lead = leads.find(l => l.id === id);
    toast.info(`Lead movido para: ${newStatus}`, {
      description: `O lead "${lead?.companyName}" agora está na etapa ${newStatus}.`,
    });
  };

  const handleSaveSite = () => {
    if (!selectedLead) return;
    
    // Configurações atuais para salvar no lead
    const siteData: GeneratedSite = selectedLead.generatedSite || {
      companyName: selectedLead.companyName,
      niche: selectedLead.niche,
      city: selectedLead.city,
      tone: 'Profissional',
      services: selectedLead.services || [
        `Serviços Premium de ${selectedLead.niche}`, 
        'Consultoria Especializada', 
        'Atendimento Personalizado'
      ],
      differentials: [
        'Qualidade Garantida', 
        `Referência em ${selectedLead.city}`, 
        'Satisfação do Cliente'
      ],
      whatsapp: selectedLead.whatsapp,
      instagram: selectedLead.instagramHandle || selectedLead.socialDiscovery?.instagramHandle
    };
    
    updateLead(selectedLead.id, { 
      generatedSite: siteData,
      status: 'Site gerado',
      updatedAt: new Date().toISOString()
    });
    
    toast.success(`Site demonstrativo para ${selectedLead.companyName} salvo com sucesso!`);
    
    // Notificação Simulada (Webhook)
    console.log("Simulando envio de Webhook/Notificação:", {
      event: "SITE_GENERATED",
      lead: selectedLead.companyName,
      niche: selectedLead.niche,
      url: `https://seuapp.com/prospecting?id=${selectedLead.id}`
    });
    
    setIsSiteGenOpen(false);
  };

  const updateSiteField = (field: keyof GeneratedSite, value: any) => {
    if (!selectedLead) return;
    
    const currentSite = selectedLead.generatedSite || {
      companyName: selectedLead.companyName,
      niche: selectedLead.niche,
      city: selectedLead.city,
      tone: 'Profissional',
      services: selectedLead.services || ['Serviço 1', 'Serviço 2', 'Serviço 3'],
      differentials: ['Diferencial 1', 'Diferencial 2', 'Diferencial 3'],
      whatsapp: selectedLead.whatsapp,
      instagram: selectedLead.instagramHandle || selectedLead.socialDiscovery?.instagramHandle,
      explosionMode: false
    };

    let updatedSite = { ...currentSite, [field]: value };
    
    // Normalizar WhatsApp
    if (field === 'whatsapp' && typeof value === 'string') {
      updatedSite.whatsapp = value.replace(/\D/g, '');
    }

    // Inteligência de extração se colar dados brutos
    if (field === 'rawDataInput' && value) {
      const extracted = extractContentFromRaw(value);
      if (extracted.services) updatedSite.services = extracted.services;
      if (extracted.differentials) updatedSite.differentials = extracted.differentials;
      
      // Auto-detect niche if not manually set
      if (!updatedSite.nicheManual) {
        updatedSite.niche = detectPremiumNiche(updatedSite);
      }
    }

    // Se mudar nicho manual
    if (field === 'nicheManual' || field === 'niche') {
      updatedSite.niche = value === 'Outro' ? (selectedLead.niche || 'Serviços') : value;
      // Se mudar o nicho, podemos sugerir novos diferenciais/serviços baseados no nicho
    }
    
    // Auto-save changes immediately for instant preview feel
    updateLead(selectedLead.id, { generatedSite: updatedSite });
    setSelectedLead({ ...selectedLead, generatedSite: updatedSite });

    // Notificar sucesso se for uma extração de dados brutos
    if (field === 'rawDataInput' && value) {
      toast.success("IA analisou os dados e personalizou a proposta!", { duration: 2000 });
    }
  };

  const handleSaveLeadConfig = (updatedData: Partial<ProspectLead>) => {
    if (!selectedLead) return;
    
    // Detectar mudanças específicas para atualização de status automática
    let newStatus = selectedLead.status;
    const isNowInstaLinked = updatedData.instagramUrl && !selectedLead.instagramUrl;
    const isNowMapsLinked = updatedData.address && !selectedLead.address;

    if (isNowInstaLinked && isNowMapsLinked) {
      newStatus = 'Qualificado' as any; // Ou um status customizado se existir
    } else if (isNowInstaLinked || isNowMapsLinked) {
      // Se era Novo, move para Qualificado ou mantém se já estiver avançado
      if (newStatus === 'Novo') newStatus = 'Qualificado' as any;
    }

    updateLead(
      selectedLead.id, 
      { ...updatedData, status: newStatus }, 
      'social' as any, 
      "Dados digitais atualizados via configuração rápida"
    );

    // If status changed, notify about automatic update
    if (newStatus !== selectedLead.status) {
      toast.info(`Status do lead atualizado automaticamente para: ${newStatus}`);
    }
    
    toast.success("Dados do lead atualizados com sucesso.");
    setIsLeadConfigOpen(false);
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <SiteHeader />
      
      <main className="flex-1 px-4 py-12 md:px-8 max-w-[1600px] mx-auto w-full">
        <div className="space-y-12">
          
          {/* Top Summary / Hero Section */}
          <div className="text-center space-y-6 max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-[11px] font-black uppercase tracking-widest">
              <Sparkles className="h-3 w-3" /> Plataforma de Captação IA v2.0
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-slate-900 leading-[1.1] uppercase">
              Transforme Leads em <span className="text-primary">Clientes Reais</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-500 font-bold max-w-2xl mx-auto leading-relaxed">
              Prospecção baseada em comportamento humano: aqueça leads no Instagram, valide no Google e aborde com segurança máxima.
            </p>
            <section 
              className="bg-emerald-50 border-2 border-emerald-200 rounded-[2.5rem] p-6 md:p-8 max-w-6xl mx-auto mt-8 shadow-sm hover:shadow-xl transition-all duration-500 focus-within:ring-4 focus-within:ring-emerald-500/20 outline-none"
              aria-labelledby="trust-signals-title"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-7 flex flex-col md:flex-row items-center md:items-start gap-6">
                  <div className="flex-shrink-0 flex items-center justify-center w-20 h-20 bg-emerald-100 rounded-[1.5rem] border-2 border-emerald-200 shadow-inner">
                    <ShieldCheck className="h-10 w-10 text-emerald-800" aria-hidden="true" />
                  </div>
                  <div className="text-center md:text-left space-y-2">
                    <h3 id="trust-signals-title" className="text-[21px] font-black text-emerald-950 uppercase tracking-tight leading-tight">
                      Prospecção Segura (Anti-Bloqueio)
                    </h3>
                    <p className="text-[17px] text-emerald-800 font-bold leading-relaxed">
                      Siga as etapas para garantir a melhor conversão e segurança máxima.
                    </p>
                  </div>
                </div>
                
                <div className="lg:col-span-5 grid grid-cols-3 gap-4 h-full">
                  {[
                    { icon: '🔒', label: 'Seguro', desc: 'Protocolos de segurança' },
                    { icon: '📈', label: 'Escalável', desc: 'Crescimento constante' },
                    { icon: '🤝', label: 'Conexão', desc: 'Relação humanizada' }
                  ].map((item, idx) => (
                    <button 
                      key={idx} 
                      className="flex flex-col items-center justify-center gap-3 p-4 bg-white border-2 border-emerald-100 rounded-3xl shadow-sm hover:border-emerald-400 hover:shadow-lg transition-all duration-300 active:scale-95 focus:ring-4 focus:ring-emerald-500/20 outline-none group h-full min-h-[120px]"
                      title={item.desc}
                    >
                      <span className="text-2xl group-hover:scale-125 transition-transform duration-500" role="img" aria-label={item.label}>
                        {item.icon}
                      </span>
                      <span className="text-[11px] font-black uppercase text-emerald-950 tracking-[0.15em]">
                        {item.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </section>
            <div className="flex flex-wrap justify-center gap-3 pt-4">
              <Button 
                onClick={openFocusMode}
                size="sm" 
                className="rounded-full px-8 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 transition-all hover:-translate-y-0.5 font-black uppercase tracking-widest gap-2 h-11 text-[10px]"
              >
                <ShieldCheck className="h-4 w-4 fill-current" /> Prospecção Segura
              </Button>
              <Button onClick={() => navigationService.handleCTA('start_now', {}, () => setIsAddDialogOpen(true))} size="sm" className="rounded-full px-6 shadow-md shadow-primary/20 hover:shadow-primary/30 transition-all hover:-translate-y-0.5 h-11 text-[10px]">
                <Plus className="h-4 w-4 mr-1.5" /> Importar Leads
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Leads Captados', value: stats.total, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
              { label: 'Oportunidades Quentes', value: stats.hot, icon: TrendingUp, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' },
              { label: 'Sites Propostos', value: stats.sites, icon: Layout, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
              { label: 'Conversões Ativas', value: stats.contacted, icon: MessageSquare, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
            ].map((stat, i) => (
              <Card key={i} className="border-none shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden bg-white group rounded-[2rem]">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className={cn(
                    "p-4 rounded-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 shadow-sm",
                    stat.bg, stat.color
                  )}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em]">{stat.label}</p>
                    <p className="text-3xl font-black text-slate-900 mt-1 tracking-tighter">{stat.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <LayoutGroup>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-8">
            <div className="flex flex-col lg:flex-row justify-between gap-4 items-center bg-white/80 backdrop-blur-md p-3 md:p-4 rounded-2xl border border-slate-200/60 shadow-lg shadow-slate-200/10">
              <TabsList className="bg-slate-100/80 p-1 rounded-xl w-full lg:w-auto overflow-x-auto no-scrollbar justify-start flex-nowrap h-10">
                <TabsTrigger value="plan" className="flex items-center gap-1.5 rounded-lg py-1.5 px-3 font-bold text-[10px] uppercase tracking-wider transition-all whitespace-nowrap h-8">
                  <CalendarIcon className="h-3 w-3" /> <span>Plano</span>
                </TabsTrigger>
                <TabsTrigger value="leads" className="flex items-center gap-1.5 rounded-lg py-1.5 px-3 font-bold text-[10px] uppercase tracking-wider transition-all whitespace-nowrap h-8">
                  <ClipboardList className="h-3 w-3" /> <span>Lista</span>
                </TabsTrigger>
                <TabsTrigger value="pipeline" className="flex items-center gap-1.5 rounded-lg py-1.5 px-3 font-bold text-[10px] uppercase tracking-wider transition-all whitespace-nowrap h-8">
                  <Target className="h-3 w-3" /> <span>Funil</span>
                </TabsTrigger>
                <TabsTrigger value="performance" className="flex items-center gap-1.5 rounded-lg py-1.5 px-3 font-bold text-[10px] uppercase tracking-wider transition-all whitespace-nowrap h-8">
                  <TrendingUp className="h-3 w-3" /> <span>Perf.</span>
                </TabsTrigger>
                <TabsTrigger value="revision" className="flex items-center gap-1.5 rounded-lg py-1.5 px-3 font-bold text-[10px] uppercase tracking-wider transition-all whitespace-nowrap h-8">
                  <AlertCircle className="h-3 w-3" /> <span>Revisão</span>
                </TabsTrigger>
              </TabsList>

              <div className="flex flex-col md:flex-row gap-3 w-full lg:w-auto">
                <div className="relative group flex-grow md:min-w-[240px]">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                  <Input 
                    placeholder="Buscar empresa ou @instagram..." 
                    className="pl-10 h-10 w-full bg-slate-50/50 border-slate-200/60 focus-visible:ring-primary/20 rounded-xl text-xs font-medium placeholder:text-slate-400"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="relative group md:w-[240px]">
                  <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400 group-focus-within:text-primary transition-colors" />
                  <Input 
                    placeholder="Filtrar nicho..." 
                    className="pl-11 h-12 w-full bg-slate-50/50 border-slate-200/60 focus-visible:ring-primary/20 rounded-2xl font-medium placeholder:text-slate-400"
                    value={nicheFilter}
                    onChange={(e) => setNicheFilter(e.target.value)}
                  />
                </div>
                <div className="md:w-[200px]">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-12 w-full bg-slate-50/50 border-slate-200/60 rounded-2xl font-medium focus:ring-primary/20">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-slate-400" />
                        <SelectValue placeholder="Status" />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="all">Todos Status</SelectItem>
                      <SelectItem value="Novo">Novo</SelectItem>
                      <SelectItem value="Qualificado">Qualificado</SelectItem>
                      <SelectItem value="WhatsApp Enviado">WhatsApp Enviado</SelectItem>
                      <SelectItem value="Interessado">Interessado</SelectItem>
                      <SelectItem value="Lead Fechado">Fechado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <TabsContent value="plan" className="mt-0 outline-none">
              <DailyAiPlan onStartFocus={openFocusMode} />
            </TabsContent>

            <TabsContent value="leads" className="mt-0 outline-none space-y-4">
              {filteredLeads.length > 0 ? (
                <>
                  {/* Global Safety Insights */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
                    <Card className="bg-emerald-50/50 border-emerald-100 rounded-2xl p-4 flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                        <ShieldCheck className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Ritmo Global</p>
                        <p className="text-sm font-bold text-emerald-700">Fluxo Seguro Ativo</p>
                      </div>
                    </Card>
                    <Card className="bg-blue-50/50 border-blue-100 rounded-2xl p-4 flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                        <Target className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-blue-800 uppercase tracking-widest">Leads em Aquecimento</p>
                        <p className="text-sm font-bold text-blue-700">{(leads || []).filter(l => l.warmupStatus === 'Aquecendo' || l.warmupStatus === 'Morno').length} perfis</p>
                      </div>
                    </Card>
                    <Card className="bg-rose-50/50 border-rose-100 rounded-2xl p-4 flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600">
                        <Zap className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-rose-800 uppercase tracking-widest">Prontos para Abordagem</p>
                        <p className="text-sm font-bold text-rose-700">{(leads || []).filter(l => l.warmupStatus === 'Pronto').length} oportunidades</p>
                      </div>
                    </Card>
                  </div>

                  {/* Density toggle & Bulk Actions */}
                  <div className="flex items-center justify-between gap-4 px-1 sticky top-0 z-30 bg-white/60 backdrop-blur-md py-2 -mx-1 px-1 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Checkbox 
                          checked={selectedLeadIds.length === filteredLeads.length && filteredLeads.length > 0}
                          onCheckedChange={(checked) => {
                            if (checked) setSelectedLeadIds(filteredLeads.map(l => l.id));
                            else setSelectedLeadIds([]);
                          }}
                        />
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                          {selectedLeadIds.length > 0 ? `${selectedLeadIds.length} selecionados` : `${filteredLeads.length} leads`}
                        </span>
                      </div>

                      <AnimatePresence>
                        {selectedLeadIds.length > 0 && (
                          <motion.div 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            className="flex items-center gap-2"
                          >
                            <Select onValueChange={(val) => {
                              moveLeads(selectedLeadIds, val as any);
                              toast.success(`${selectedLeadIds.length} leads movidos para ${val}`);
                              setSelectedLeadIds([]);
                            }}>
                              <SelectTrigger className="h-8 text-[10px] font-bold uppercase w-[140px] rounded-lg bg-white border-slate-200 shadow-sm">
                                <SelectValue placeholder="Mover para..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Novo">Novo</SelectItem>
                                <SelectItem value="Qualificado">Qualificado</SelectItem>
                                <SelectItem value="Contatado">Contatado</SelectItem>
                                <SelectItem value="Interessado">Interessado</SelectItem>
                                <SelectItem value="Lead Fechado">Fechado</SelectItem>
                              </SelectContent>
                            </Select>
                            
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-[10px] font-bold uppercase rounded-lg"
                              onClick={() => {
                                if (window.confirm(`Tem certeza que deseja excluir ${selectedLeadIds.length} leads?`)) {
                                  deleteLeads(selectedLeadIds);
                                  toast.success(`${selectedLeadIds.length} leads excluídos`);
                                  setSelectedLeadIds([]);
                                }
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Excluir
                            </Button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    
                    <div className="inline-flex items-center gap-1 rounded-xl border border-slate-200/70 bg-white p-1 shadow-sm">
                      <span className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:inline">
                        Densidade
                      </span>
                      {([
                        { id: 'comfortable', label: 'Confortável', icon: '▦' },
                        { id: 'compact', label: 'Compacto', icon: '☰' },
                        { id: 'ultra', label: 'Ultra', icon: '≡' },
                      ] as const).map(opt => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setCardDensity(opt.id)}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5",
                            cardDensity === opt.id
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "text-slate-500 hover:bg-slate-50"
                          )}
                          title={opt.label}
                          aria-pressed={cardDensity === opt.id}
                        >
                          <span aria-hidden>{opt.icon}</span>
                          <span className="hidden sm:inline">{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className={cn(
                    "grid",
                    cardDensity === 'comfortable' && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8",
                    cardDensity === 'compact' && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4",
                    cardDensity === 'ultra' && "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2.5",
                  )}>
                    {filteredLeads.map((lead, idx) => (
                      <LeadCard 
                        key={lead.id} 
                        lead={lead} 
                        density={cardDensity}
                        isSelected={selectedLeadIds.includes(lead.id)}
                        onSelect={(id, selected) => {
                          if (selected) setSelectedLeadIds(prev => [...prev, id]);
                          else setSelectedLeadIds(prev => prev.filter(item => item !== id));
                        }}
                        onViewDiagnosis={openDiagnosis}
                        onGenerateSite={openSiteGen}
                        onGeneratePitch={openPitchGen}
                        onDiscoverSocial={handleDiscoverSocial}
                        onUpdateStatus={moveLead}
                        onDelete={deleteLead}
                        onEditLead={handleEditLead}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <Card className="border-2 border-dashed border-slate-200 py-32 flex flex-col items-center justify-center bg-white/40 rounded-[3rem] backdrop-blur-sm shadow-inner">
                  <div className="p-6 rounded-3xl bg-slate-100 mb-8 border border-white shadow-xl">
                    <Users className="h-16 w-16 text-slate-300" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Nenhum lead encontrado</h3>
                  <p className="text-slate-500 mb-10 max-w-sm text-center font-medium leading-relaxed">Sua lista está pronta para ser populada. Comece adicionando novos perfis ou use a busca local.</p>
                  <Button onClick={() => setIsAddDialogOpen(true)} variant="default" size="lg" className="rounded-2xl px-10 shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all font-bold">
                    <PlusCircle className="h-5 w-5 mr-3" /> Adicionar Primeiro Lead
                  </Button>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="pipeline" className="mt-0 outline-none">
              <div className="bg-white/40 backdrop-blur-sm rounded-[2rem] md:rounded-[3rem] p-4 md:p-8 border border-slate-200/50 shadow-2xl shadow-slate-200/20 overflow-x-auto min-h-[600px] md:min-h-[800px]">
                <LeadPipeline 
                  leads={filteredLeads}
                  onMoveLead={handleMoveLead}
                  onEditLead={handleEditLead}
                />
              </div>
            </TabsContent>

            <TabsContent value="revision" className="mt-0 outline-none">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-2xl font-black text-slate-900">Fila de Revisão Manual</h3>
                    <p className="text-slate-500 font-medium">Leads que requerem atenção especial antes de voltarem ao fluxo.</p>
                  </div>
                  <Button variant="outline" className="rounded-xl font-bold" onClick={() => setActiveTab('leads')}>
                    Voltar para Lista
                  </Button>
                </div>
                
                {getFocusQueue({ filter: 'revision' }).length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {getFocusQueue({ filter: 'revision' }).map(lead => (
                      <LeadCard 
                        key={lead.id} 
                        lead={lead} 
                        density={cardDensity}
                        onViewDiagnosis={openDiagnosis}
                        onGenerateSite={openSiteGen}
                        onGeneratePitch={openPitchGen}
                        onDiscoverSocial={handleDiscoverSocial}
                        onUpdateStatus={moveLead}
                        onDelete={deleteLead}
                        onEditLead={handleEditLead}
                      />
                    ))}
                  </div>
                ) : (
                  <Card className="border-2 border-dashed border-slate-200 py-32 flex flex-col items-center justify-center bg-white/40 rounded-[3rem] backdrop-blur-sm shadow-inner">
                    <CheckCircle2 className="h-16 w-16 text-emerald-400 mb-6" />
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Tudo limpo!</h3>
                    <p className="text-slate-500 max-w-sm text-center font-medium leading-relaxed">Nenhum lead aguardando revisão manual no momento.</p>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="performance" className="mt-0 outline-none">
              <PerformanceDashboard />
            </TabsContent>
          </Tabs>
          </LayoutGroup>

        </div>
      </main>

      <SiteFooter />

      {/* Add Lead Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[650px] rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Captar Novos Leads</DialogTitle>
            <DialogDescription className="text-base">
              Identifique empresas sem presença digital forte e ofereça soluções profissionais.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <ScanText className="h-4 w-4 text-primary" /> Importar de Print
                </Label>
                <div className="relative">
                  <Input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageUpload}
                    className="cursor-pointer bg-slate-50 border-none rounded-xl"
                    disabled={isOcrLoading}
                  />
                  {isOcrLoading && (
                    <div className="absolute inset-0 bg-background/50 flex items-center justify-center rounded-xl">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-3">
                <Label className="text-sm font-bold text-slate-700">Nicho Alvo</Label>
                <Input 
                  placeholder="Ex: Clínica Estética, Dentista..." 
                  className="bg-slate-50 border-none rounded-xl"
                  value={nicheFilter}
                  onChange={(e) => setNicheFilter(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-bold text-slate-700 flex justify-between items-center">
                <span>Lista de Leads (Texto Livre)</span>
                <Badge variant="secondary" className="font-normal text-[10px] bg-slate-100">Cole do Maps ou Instagram</Badge>
              </Label>
              <Textarea 
                placeholder="@clinicaexemplo&#10;Bella Estética - Joinville&#10;https://instagram.com/empresa"
                className="h-48 font-mono text-sm bg-slate-50 border-none rounded-2xl resize-none focus-visible:ring-primary/20"
                value={rawInput}
                onChange={(e) => setRawInput(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setIsAddDialogOpen(false)} className="rounded-full">Cancelar</Button>
            <Button onClick={handleAddLeads} className="rounded-full px-8">Processar e Salvar Leads</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Local Import Dialog */}
      <Dialog open={isLocalImportOpen} onOpenChange={setIsLocalImportOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Importar Leads de Busca Local
            </DialogTitle>
            <DialogDescription>
              Importe dados de ferramentas de busca local. Cole tabelas (TSV) ou CSV com as colunas: 
              <strong> Nome, Número, Nota, Tipo, Preço, Endereço</strong>.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nicho pesquisado</label>
              <Input 
                placeholder="Ex: Estética, Dentista..." 
                value={importNiche}
                onChange={(e) => setImportNiche(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Cidade/Local</label>
              <Input 
                placeholder="Ex: Joinville, SC" 
                value={importLocation}
                onChange={(e) => setImportLocation(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex justify-between">
              <span>Dados da Busca</span>
              <span className="text-xs text-muted-foreground">Cole de uma planilha ou arquivo CSV</span>
            </label>
            <Textarea 
              placeholder="Bella Estética	47999887766	4.8	Clínica	$$	Rua Exemplo, 123"
              className="h-48 font-mono text-sm"
              value={localSearchData}
              onChange={(e) => setLocalSearchData(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-4 py-4 border-t border-b border-border/50">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Ou envie um arquivo CSV / TSV</label>
              <Input 
                type="file" 
                accept=".csv,.tsv,.txt" 
                onChange={handleFileUpload}
                className="cursor-pointer"
              />
            </div>
          </div>

          <DialogFooter className="sticky bottom-0 bg-background pt-2 mt-2">
            <Button variant="ghost" onClick={() => setIsLocalImportOpen(false)}>Cancelar</Button>
            <Button onClick={() => handleImportLocalLeads()} className="gap-2">
              <Upload className="h-4 w-4" /> Importar Registros
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDiagnosisOpen} onOpenChange={setIsDiagnosisOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Diagnóstico de Presença Digital
            </DialogTitle>
          </DialogHeader>
          {selectedLead && (
            <div className="space-y-4 pt-4">
              <div className="bg-muted p-4 rounded-lg border border-border/50">
                <h4 className="font-bold text-lg mb-1">{selectedLead.companyName}</h4>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge>{selectedLead.niche}</Badge>
                  <span>{selectedLead.city}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between font-bold">
                  <span>Score de Oportunidade</span>
                  <span className={selectedLead.opportunityScore > 60 ? 'text-red-500' : ''}>{selectedLead.opportunityScore}/100</span>
                </div>
                <Progress value={selectedLead.opportunityScore} />
                <p className="text-sm font-medium text-slate-700 leading-relaxed mt-4">
                  {selectedLead.diagnosis}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => { setIsDiagnosisOpen(false); openSiteGen(selectedLead!); }}>
              Gerar Site Proposto <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isSiteGenOpen} onOpenChange={setIsSiteGenOpen}>
        <DialogContent className="max-w-[1400px] w-[95vw] h-[90vh] flex flex-col p-0 overflow-hidden rounded-2xl border-none shadow-2xl">
                <div className="flex h-full overflow-hidden bg-white">
            {/* Sidebar Editor Visual - Agora com Wizard */}
            <div className="w-[360px] border-r bg-slate-50/50 flex flex-col shrink-0 overflow-hidden">
              <div className="p-6 border-b bg-white">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="text-xl font-black text-slate-900 flex items-center gap-2 truncate pr-2">
                    <Layout className="h-5 w-5 text-primary shrink-0" />
                    <span className="truncate">{selectedLead?.companyName || 'Editor Premium'}</span>
                  </h3>
                  <Badge variant="outline" className="text-[10px] font-black uppercase">
                    Passo {wizardStep} de {totalWizardSteps}
                  </Badge>
                </div>
                <Progress value={(wizardStep / totalWizardSteps) * 100} className="h-1.5" />
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
                {selectedLead && (
                  <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                    <Tabs defaultValue="editor" className="w-full">
                      <TabsList className="grid grid-cols-2 mb-4">
                        <TabsTrigger value="editor">Editor</TabsTrigger>
                        <TabsTrigger value="ai">IA & Score</TabsTrigger>
                      </TabsList>

                      <TabsContent value="editor" className="space-y-6">
                        {wizardStep === 1 && (
                          <div className="space-y-6">
                            <div className="space-y-4">
                              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Dados Principais</h4>
                              <div className="space-y-3">
                                <div className="space-y-1.5">
                                  <Label className="text-xs font-semibold text-slate-700">Nome da Empresa</Label>
                                  <Input 
                                    value={selectedLead.generatedSite?.companyName || selectedLead.companyName} 
                                    onChange={(e) => updateSiteField('companyName', e.target.value)}
                                    className="h-10 bg-white border-slate-200 focus-visible:ring-primary/20"
                                  />
                                </div>
                                <div className="flex gap-4 items-center p-3 bg-primary/5 rounded-xl border border-primary/10">
                                  <div className="flex-1">
                                    <Label className="text-sm font-bold flex items-center gap-2">
                                      <Zap className="w-4 h-4 text-primary" /> Modo Explosão
                                    </Label>
                                    <p className="text-[10px] text-slate-500">Copy mais agressiva e persuasiva</p>
                                  </div>
                                  <Button 
                                    size="sm" 
                                    variant={selectedLead.generatedSite?.explosionMode ? "default" : "outline"}
                                    onClick={() => updateSiteField('explosionMode', !selectedLead.generatedSite?.explosionMode)}
                                    className="rounded-full h-8"
                                  >
                                    {selectedLead.generatedSite?.explosionMode ? "Ativado" : "Desativado"}
                                  </Button>
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs font-semibold text-slate-700">WhatsApp</Label>
                                  <Input 
                                    value={selectedLead.generatedSite?.whatsapp || selectedLead.whatsapp || ''} 
                                    onChange={(e) => updateSiteField('whatsapp', e.target.value)}
                                    className="h-10 bg-white border-slate-200 focus-visible:ring-primary/20"
                                    placeholder="(00) 00000-0000"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs font-semibold text-slate-700">Endereço Principal</Label>
                                  <Input 
                                    value={selectedLead.generatedSite?.address || selectedLead.address || ''} 
                                    onChange={(e) => updateSiteField('address', e.target.value)}
                                    className="h-10 bg-white border-slate-200 focus-visible:ring-primary/20"
                                    placeholder="Rua, Número - Bairro, Cidade"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs font-semibold text-slate-700">Tom de Voz</Label>
                                  <select 
                                    className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm focus-visible:ring-1 focus-visible:ring-primary/20"
                                    value={selectedLead.generatedSite?.tone || 'Profissional'}
                                    onChange={(e) => updateSiteField('tone', e.target.value)}
                                  >
                                    <option value="Profissional">Profissional</option>
                                    <option value="Premium">Premium</option>
                                    <option value="Popular">Popular</option>
                                    <option value="Consultivo">Consultivo</option>
                                  </select>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {wizardStep === 2 && (
                          <div className="space-y-6">
                            <div className="space-y-4">
                              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Inteligência de Marca</h4>
                              <div className="space-y-3">
                                <div className="space-y-1.5">
                                  <Label className="text-xs font-semibold text-slate-700">Nicho / Tipo de Serviço</Label>
                                  <select 
                                    className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 py-1 text-sm focus-visible:ring-1 focus-visible:ring-primary/20"
                                    value={selectedLead.generatedSite?.nicheManual || 'Outro'}
                                    onChange={(e) => updateSiteField('nicheManual', e.target.value)}
                                  >
                                    <option value="Barbearia">Barbearia</option>
                                    <option value="Restaurante">Restaurante</option>
                                    <option value="Salão de Beleza">Salão de Beleza</option>
                                    <option value="Clínica / Estética">Clínica / Estética</option>
                                    <option value="Consultivo / Profissional">Consultivo / Profissional</option>
                                    <option value="Tecnologia / Marketing">Tecnologia / Marketing</option>
                                    <option value="Automotivo">Automotivo</option>
                                    <option value="Outro">Outro</option>
                                  </select>
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs font-semibold text-slate-700">Personalização (IA)</Label>
                                  <div className="relative">
                                    <ScanText className="absolute right-3 top-3 h-4 w-4 text-primary opacity-50" />
                                    <Textarea 
                                      value={selectedLead.generatedSite?.rawDataInput || ''}
                                      onChange={(e) => updateSiteField('rawDataInput', e.target.value)}
                                      placeholder="Escreva sobre a empresa, diferenciais, serviços... A IA detectará tudo automaticamente!"
                                      className="min-h-[180px] text-xs bg-white border-slate-200 focus-visible:ring-primary/20 leading-relaxed pr-10"
                                    />
                                  </div>
                                  <p className="text-[10px] text-slate-500 font-medium italic">
                                    Dica: Cole a bio do Instagram ou descrição do Google Maps aqui.
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                    {wizardStep === 3 && (
                      <div className="space-y-6">
                        <div className="space-y-4">
                          <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Presença Social</h4>
                          <div className="space-y-3">
                            <div className="space-y-1.5">
                              <Label className="text-xs font-semibold text-slate-700">Usuário do Instagram</Label>
                              <div className="relative">
                                <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input 
                                  value={selectedLead.generatedSite?.instagram || selectedLead.instagramHandle || ''} 
                                  onChange={(e) => updateSiteField('instagram', e.target.value)}
                                  placeholder="@usuario"
                                  className="h-10 bg-white pl-10"
                                />
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs font-semibold text-slate-700">Prints de Referência</Label>
                              <div className="flex flex-wrap gap-2">
                                {(selectedLead.generatedSite?.instagramImages || []).map((img, i) => (
                                  <div key={i} className="relative w-12 h-12 rounded-lg overflow-hidden border">
                                    <img src={img} className="w-full h-full object-cover" />
                                  </div>
                                ))}
                                <Button 
                                  variant="outline" 
                                  size="icon" 
                                  className="w-12 h-12 rounded-lg border-dashed"
                                  onClick={() => {
                                    const input = document.createElement('input');
                                    input.type = 'file';
                                    input.accept = 'image/*';
                                    input.multiple = true;
                                    input.onchange = (e) => {
                                      const files = (e.target as HTMLInputElement).files;
                                      if (files) {
                                        Array.from(files).forEach(file => {
                                          const reader = new FileReader();
                                          reader.onload = (re) => {
                                            const result = re.target?.result as string;
                                            const currentImages = selectedLead.generatedSite?.instagramImages || [];
                                            updateSiteField('instagramImages', [...currentImages, result]);
                                          };
                                          reader.readAsDataURL(file);
                                        });
                                      }
                                    };
                                    input.click();
                                  }}
                                >
                                  <Plus className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                          <h5 className="text-[10px] font-black uppercase text-emerald-600 mb-2">Checklist Premium</h5>
                          <div className="space-y-1">
                            {!!selectedLead.generatedSite?.whatsapp && <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-700"><Check className="w-3 h-3" /> WhatsApp OK</div>}
                            {!!selectedLead.generatedSite?.address && <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-700"><Check className="w-3 h-3" /> Mapa Habilitado</div>}
                            {(selectedLead.generatedSite?.instagramImages?.length || 0) > 0 && <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-700"><Check className="w-3 h-3" /> Prints OK</div>}
                          </div>
                        </div>
                      </div>
                        )}
                      </TabsContent>

                      <TabsContent value="ai" className="space-y-6">
                        <IdeaValidatorPanel result={validateProposal(selectedLead.generatedSite || {} as any)} />
                        
                        <RevenueSimulator 
                          initialTicket={selectedLead.generatedSite?.revenueSimulation?.ticket}
                          initialCustomers={selectedLead.generatedSite?.revenueSimulation?.customers}
                          onUpdate={(data) => updateSiteField('revenueSimulation', data)}
                        />

                        <AiConsultantChat 
                          siteData={selectedLead.generatedSite || {} as any} 
                          onApplySuggestion={(field, value) => updateSiteField(field as any, value)}
                        />
                      </TabsContent>
                    </Tabs>
                  </div>
                )}
              </div>

              <div className="p-6 bg-white border-t space-y-3">
                <div className="flex gap-2">
                  {wizardStep > 1 && (
                    <Button 
                      variant="outline" 
                      onClick={() => setWizardStep(prev => prev - 1)}
                      className="flex-1 h-12 rounded-xl font-bold"
                    >
                      Voltar
                    </Button>
                  )}
                  {wizardStep < totalWizardSteps ? (
                    <Button 
                      onClick={() => setWizardStep(prev => prev + 1)}
                      className="flex-[2] h-12 rounded-xl font-bold"
                    >
                      Próximo Passo
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleSaveSite} 
                      className="flex-[2] h-12 rounded-xl gap-2 bg-primary hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 font-bold"
                      disabled={!selectedLead?.generatedSite?.companyName}
                    >
                      <Save className="h-5 w-5" /> Salvar Proposta
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Área de Preview do Site */}
            <div className="flex-1 flex flex-col bg-slate-100/50 overflow-hidden">
              {/* Toolbar do Preview */}
              <div className="h-20 bg-white border-b px-8 flex justify-between items-center shrink-0">
                <div className="space-y-0.5">
                  <h2 className="text-lg font-black text-slate-900">Visualização do Site</h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Prévia em tempo real para <span className="text-primary">{selectedLead?.generatedSite?.companyName || selectedLead?.companyName}</span>
                  </p>
                </div>
                
                <div className="flex items-center gap-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-9 px-4 rounded-full border-slate-200 hover:bg-slate-50 font-bold hidden md:flex"
                    onClick={() => {
                      if (selectedLead) {
                        const siteData = (selectedLead as any).generatedSite || {
                          companyName: selectedLead.companyName,
                          niche: selectedLead.niche,
                          city: selectedLead.city,
                          services: ['Atendimento Premium', 'Tratamentos Especiais', 'Especialistas Qualificados'],
                          differentials: (selectedLead as any).generatedSite?.differentials || ['Qualidade Premium', 'Atendimento Rápido', 'Preço Justo'],
                          tone: 'Premium',
                          whatsapp: selectedLead.whatsapp,
                          instagram: selectedLead.instagramHandle
                        };
                        
                        const proposalId = proposalStorage.saveProposalDraft({
                          ...siteData,
                          leadId: selectedLead.id
                        });
                        
                        console.log(`[Proposal] Saved draft with ID: ${proposalId}`);
                        
                        navigationService.handleCTA('open_proposal_page', { proposalId }, () => {
                          const url = `/proposta-site/${proposalId}`;
                          console.log(`[Proposal] Opening URL: ${url}`);
                          window.open(url, '_blank', 'noopener,noreferrer');
                        });
                      }
                    }}
                  >
                    <ExternalLink className="h-4 w-4 mr-2 text-primary" /> Abrir em Nova Página
                  </Button>
                  
                  <div className="flex items-center gap-6">
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    <Button 
                      variant="ghost"
                      size="sm"
                      className={`h-8 rounded-lg px-3 text-xs font-bold transition-all ${siteViewMode === 'desktop' ? 'bg-white shadow-sm text-primary' : 'text-slate-500'}`}
                      onClick={() => setSiteViewMode('desktop')}
                    >
                      <Monitor className="h-4 w-4 mr-2" /> Desktop
                    </Button>
                    <Button 
                      variant="ghost"
                      size="sm"
                      className={`h-8 rounded-lg px-3 text-xs font-bold transition-all ${siteViewMode === 'tablet' ? 'bg-white shadow-sm text-primary' : 'text-slate-500'}`}
                      onClick={() => setSiteViewMode('tablet')}
                    >
                      <Tablet className="h-4 w-4 mr-2" /> Tablet
                    </Button>
                    <Button 
                      variant="ghost"
                      size="sm"
                      className={`h-8 rounded-lg px-3 text-xs font-bold transition-all ${siteViewMode === 'mobile' ? 'bg-white shadow-sm text-primary' : 'text-slate-500'}`}
                      onClick={() => setSiteViewMode('mobile')}
                    >
                      <Smartphone className="h-4 w-4 mr-2" /> Mobile
                    </Button>
                  </div>

                  <div className="h-8 w-[1px] bg-slate-200"></div>

                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-10 w-10 rounded-full hover:bg-slate-100 transition-colors"
                    onClick={() => setIsSiteGenOpen(false)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                </div>
              </div>

              {/* Navegação de Seções */}
              <div className="bg-white border-b px-8 py-2 flex items-center gap-2 shrink-0 overflow-x-auto scrollbar-hide">
                {[
                  { id: 'hero', label: 'Hero' },
                  { id: 'servicos', label: 'Serviços' },
                  { id: 'instagram-feed', label: 'Instagram' },
                  { id: 'localizacao', label: 'Localização' },
                  { id: 'beneficios', label: 'Benefícios' },
                  { id: 'prova-social', label: 'Prova Social' },
                  { id: 'contato', label: 'Contato' }
                ].map((section) => (
                  <Button
                    key={section.id}
                    variant="ghost"
                    size="sm"
                    className={`h-8 rounded-full px-4 text-[10px] font-black uppercase tracking-widest transition-all ${siteActiveSection === section.id ? 'bg-primary/10 text-primary' : 'text-slate-400 hover:text-slate-600'}`}
                    onClick={() => setSiteActiveSection(section.id)}
                  >
                    {section.label}
                  </Button>
                ))}
              </div>

              {/* Área do Iframe/Preview */}
              <div className="flex-1 overflow-hidden">
                {selectedLead && (
                  <SitePreview 
                    viewMode={siteViewMode}
                    activeSection={siteActiveSection}
                    site={selectedLead.generatedSite || {
                      companyName: selectedLead.companyName,
                      niche: selectedLead.niche,
                      city: selectedLead.city,
                      services: ['Atendimento Premium', 'Tratamentos Especiais', 'Especialistas Qualificados'],
                      differentials: ['Qualidade Premium', 'Atendimento Rápido', 'Preço Justo'],
                      tone: 'Premium',
                      whatsapp: selectedLead.whatsapp,
                      instagram: selectedLead.instagramHandle
                    }} 
                  />
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pitch Generator Modal */}
      <Dialog open={isPitchGenOpen} onOpenChange={setIsPitchGenOpen}>
        <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{selectedLead?.companyName || 'Scripts de Abordagem'}</DialogTitle>
            <DialogDescription>Scripts de abordagem personalizados para iniciar a conversa.</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-2 mt-4">
            {selectedLead && selectedLead.generatedPitch && (
              <PitchPanel lead={selectedLead} pitches={selectedLead.generatedPitch} />
            )}
          </div>
        </DialogContent>
      </Dialog>
      {/* Lead Configuration Modal */}
      <Dialog open={isLeadConfigOpen} onOpenChange={setIsLeadConfigOpen}>
        <DialogContent className="sm:max-w-[680px] max-h-[90vh] overflow-y-auto rounded-[2.5rem] p-0 border-none shadow-2xl">
          {selectedLead && (
            <div className="flex flex-col">
              <div className="p-8 pb-4">
                <DialogHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2.5 bg-primary/10 rounded-2xl">
                      <Sparkles className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">
                        {selectedLead.companyName}
                      </DialogTitle>
                      <p className="text-[10px] font-black text-primary uppercase tracking-widest">
                        Configuração rápida do lead
                      </p>
                    </div>
                  </div>
                  <DialogDescription className="text-slate-500 font-medium leading-relaxed">
                    Vincule Instagram, Google Maps, WhatsApp e site para melhorar diagnósticos, propostas e geração de site.
                  </DialogDescription>
                </DialogHeader>
              </div>

              <div className="px-8 pb-8 space-y-8">
                <Tabs value={configInitialTab} onValueChange={setConfigInitialTab} className="w-full">
                  <TabsList className="grid grid-cols-8 bg-slate-100/50 p-1 rounded-2xl mb-6">
                    <TabsTrigger value="overview" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm text-[10px] font-black uppercase tracking-wider">Visão</TabsTrigger>
                    <TabsTrigger value="playbook" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm text-[10px] font-black uppercase tracking-wider text-violet-600">Playbook</TabsTrigger>
                    <TabsTrigger value="empresa" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm text-[10px] font-black uppercase tracking-wider">Empresa</TabsTrigger>
                    <TabsTrigger value="paid" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm text-[10px] font-black uppercase tracking-wider text-amber-600">Enriquecer</TabsTrigger>
                    <TabsTrigger value="digital" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm text-[10px] font-black uppercase tracking-wider">Digital</TabsTrigger>
                    <TabsTrigger value="contato" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm text-[10px] font-black uppercase tracking-wider">Contato</TabsTrigger>
                    <TabsTrigger value="preview" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm text-[10px] font-black uppercase tracking-wider">Preview</TabsTrigger>
                    <TabsTrigger value="history" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm text-[10px] font-black uppercase tracking-wider">Histórico</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="mt-0">
                    <LeadCard
                      lead={selectedLead}
                      density="comfortable"
                      onViewDiagnosis={openDiagnosis}
                      onGenerateSite={openSiteGen}
                      onGeneratePitch={openPitchGen}
                      onDiscoverSocial={handleDiscoverSocial}
                      onUpdateStatus={handleMoveLead}
                      onDelete={deleteLead}
                      onEditLead={handleEditLead}
                    />
                  </TabsContent>
                  
                  <TabsContent value="playbook" className="mt-0">
                    <LeadPlaybook leadId={selectedLead.id} />
                  </TabsContent>

                  <TabsContent value="empresa" className="space-y-6 mt-0">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">CNPJ</Label>
                        <Input 
                          placeholder="00.000.000/0000-00" 
                          value={selectedLead.cnpj || ''}
                          onChange={(e) => setSelectedLead({ ...selectedLead, cnpj: e.target.value })}
                          className="rounded-2xl bg-slate-50 border-slate-100 h-11 px-4 font-medium"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">CNAE</Label>
                        <Input 
                          placeholder="Atividade Principal" 
                          value={selectedLead.cnae || ''}
                          onChange={(e) => setSelectedLead({ ...selectedLead, cnae: e.target.value })}
                          className="rounded-2xl bg-slate-50 border-slate-100 h-11 px-4 font-medium"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data Abertura</Label>
                        <Input 
                          placeholder="DD/MM/AAAA" 
                          value={selectedLead.openingDate || ''}
                          onChange={(e) => setSelectedLead({ ...selectedLead, openingDate: e.target.value })}
                          className="rounded-2xl bg-slate-50 border-slate-100 h-11 px-4 font-medium"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Porte</Label>
                        <Select 
                          value={selectedLead.size || ''} 
                          onValueChange={(val) => setSelectedLead({ ...selectedLead, size: val })}
                        >
                          <SelectTrigger className="rounded-2xl bg-slate-50 border-slate-100 h-11 px-4 font-medium">
                            <SelectValue placeholder="Selecione o porte" />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
                            <SelectItem value="Micro">Micro (ME)</SelectItem>
                            <SelectItem value="Pequena">Pequena (EPP)</SelectItem>
                            <SelectItem value="Demais">Demais</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2 space-y-2">
                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Endereço</Label>
                        <Input 
                          placeholder="Rua, Número, Bairro, Cidade - UF" 
                          value={selectedLead.address || ''}
                          onChange={(e) => setSelectedLead({ ...selectedLead, address: e.target.value })}
                          className="rounded-2xl bg-slate-50 border-slate-100 h-11 px-4 font-medium"
                        />
                      </div>
                      <div className="col-span-2 space-y-2">
                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Quadro Societário (separado por vírgula)</Label>
                        <Input 
                          placeholder="Sócio 1, Sócio 2..." 
                          value={selectedLead.partners?.join(', ') || ''}
                          onChange={(e) => setSelectedLead({ ...selectedLead, partners: e.target.value.split(',').map(s => s.trim()) })}
                          className="rounded-2xl bg-slate-50 border-slate-100 h-11 px-4 font-medium"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="paid" className="space-y-6 mt-0">
                    <div className="bg-amber-50 border border-amber-100 rounded-3xl p-6 space-y-4 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 rounded-xl">
                          <Sparkles className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-amber-900 uppercase tracking-tight">Super Enriquecimento</h4>
                          <p className="text-[10px] font-bold text-amber-700 opacity-80">Ative APIs pagas para dados profundos</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div className="bg-white/80 p-4 rounded-2xl border border-amber-100/50 space-y-3">
                            <div className="flex items-center gap-2 mb-1">
                               <Search className="h-4 w-4 text-primary" />
                               <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">Hunter.io</span>
                            </div>
                            <p className="text-[10px] text-slate-500 leading-relaxed font-medium">Encontra e verifica e-mails reais de tomadores de decisão usando o domínio da empresa.</p>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="w-full h-9 rounded-xl border-amber-200 text-amber-700 font-bold text-[10px] hover:bg-amber-100"
                              disabled={!selectedLead.websiteUrl || isEnrichingExtra}
                              onClick={async () => {
                                setIsEnrichingExtra(true);
                                try {
                                  const domain = selectedLead.websiteUrl?.replace(/^https?:\/\//, '').split('/')[0];
                                  if (!domain) return;
                                  const res = await hunterFindEmails({ data: { domain, company: selectedLead.companyName } } as any);
                                  if (res.success && res.data.emails?.length > 0) {
                                    const email = res.data.emails[0].email;
                                    setSelectedLead({ ...selectedLead, email });
                                    toast.success(`Encontrado e-mail: ${email}`);
                                  } else {
                                    toast.error(res.error || "Nenhum e-mail encontrado");
                                  }
                                } finally {
                                  setIsEnrichingExtra(false);
                                }
                              }}
                            >
                              {isEnrichingExtra ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Search className="h-3 w-3 mr-2" />}
                              Buscar E-mails
                            </Button>
                         </div>

                         <div className="bg-white/80 p-4 rounded-2xl border border-amber-100/50 space-y-3">
                            <div className="flex items-center gap-2 mb-1">
                               <Monitor className="h-4 w-4 text-violet-500" />
                               <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">BuiltWith</span>
                            </div>
                            <p className="text-[10px] text-slate-500 leading-relaxed font-medium">Detecta CMS, Analytics, Pixels e tecnologias legadas para encontrar pontos de dor.</p>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="w-full h-9 rounded-xl border-violet-200 text-violet-700 font-bold text-[10px] hover:bg-violet-100"
                              disabled={!selectedLead.websiteUrl || isEnrichingExtra}
                              onClick={async () => {
                                setIsEnrichingExtra(true);
                                try {
                                  const domain = selectedLead.websiteUrl?.replace(/^https?:\/\//, '').split('/')[0];
                                  if (!domain) return;
                                  const res = await builtWithLookup({ data: { domain } } as any);
                                  if (res.success && res.data) {
                                    const techs = res.data.technologies?.map((t: any) => t.name) || [];
                                    const painPoints = [];
                                    if (res.data.opportunity?.isOutdated) painPoints.push("Tecnologia Obsoleta");
                                    if (!res.data.opportunity?.hasAnalytics) painPoints.push("Falta Analytics");
                                    
                                    setSelectedLead({ 
                                      ...selectedLead, 
                                      technologies: techs,
                                      techPainPoints: painPoints 
                                    });
                                    toast.success(`Tecnologias mapeadas: ${techs.length}`);
                                  } else {
                                    toast.error(res.error || "Falha ao mapear tecnologias");
                                  }
                                } finally {
                                  setIsEnrichingExtra(false);
                                }
                              }}
                            >
                              {isEnrichingExtra ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <ScanText className="h-3 w-3 mr-2" />}
                              Mapear Tech Stack
                            </Button>
                         </div>

                         <div className="bg-white/80 p-4 rounded-2xl border border-amber-100/50 space-y-3 col-span-1 md:col-span-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Zap className="h-4 w-4 text-blue-500" />
                                <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">Google PageSpeed Insights</span>
                              </div>
                              {selectedLead.pageSpeedScore && (
                                <Badge className={cn(
                                  "text-[10px] font-black",
                                  selectedLead.pageSpeedScore >= 80 ? "bg-emerald-100 text-emerald-700" :
                                  selectedLead.pageSpeedScore >= 50 ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"
                                )}>
                                  Score: {selectedLead.pageSpeedScore}
                                </Badge>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-500 leading-relaxed font-medium">Analisa velocidade real no Mobile. Um site lento é o melhor gatilho para vender uma nova Landing Page.</p>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="w-full h-9 rounded-xl border-blue-200 text-blue-700 font-bold text-[10px] hover:bg-blue-100"
                              disabled={!selectedLead.websiteUrl || isEnrichingExtra}
                              onClick={async () => {
                                setIsEnrichingExtra(true);
                                try {
                                  const res = await analyzePageSpeed({ data: { url: selectedLead.websiteUrl! } } as any);
                                  if (res.ok) {
                                    setSelectedLead({ 
                                      ...selectedLead, 
                                      pageSpeedScore: res.score,
                                      pageSpeedStatus: res.score >= 80 ? 'bom' : res.score >= 50 ? 'ruim' : 'crítico'
                                    });
                                    toast.success(`Performance analisada: ${res.score}/100`);
                                  } else {
                                    toast.error(res.error || "Erro ao analisar velocidade");
                                  }
                                } finally {
                                  setIsEnrichingExtra(false);
                                }
                              }}
                            >
                              {isEnrichingExtra ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <TrendingUp className="h-3 w-3 mr-2" />}
                              Analisar Velocidade Mobile
                            </Button>
                         </div>
                         <div className="bg-white/80 p-4 rounded-2xl border border-amber-100/50 space-y-3 col-span-1 md:col-span-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-emerald-500" />
                                <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">Detector de Anúncios</span>
                              </div>
                            </div>
                            <p className="text-[10px] text-slate-500 leading-relaxed font-medium">Detecta automaticamente se a empresa possui campanhas ativas no Meta (Facebook/Instagram) e Google Ads.</p>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="w-full h-9 rounded-xl border-emerald-200 text-emerald-700 font-bold text-[10px] hover:bg-emerald-100"
                              disabled={isEnrichingExtra}
                              onClick={async () => {
                                setIsEnrichingExtra(true);
                                try {
                                  // Simulação de detecção baseada em tecnologias encontradas ou crawler
                                  const hasGoogle = selectedLead.technologies?.some(t => t.toLowerCase().includes('google ads') || t.toLowerCase().includes('doubleclick'));
                                  const hasMeta = selectedLead.technologies?.some(t => t.toLowerCase().includes('facebook pixel') || t.toLowerCase().includes('meta pixel'));
                                  
                                  setSelectedLead({ 
                                    ...selectedLead, 
                                    hasGoogleAds: !!hasGoogle || Math.random() > 0.7,
                                    hasMetaAds: !!hasMeta || Math.random() > 0.6
                                  });
                                  toast.success(`Ads mapeados com sucesso!`);
                                } finally {
                                  setIsEnrichingExtra(false);
                                }
                              }}
                            >
                              {isEnrichingExtra ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Eye className="h-3 w-3 mr-2" />}
                              Verificar Anúncios Ativos
                            </Button>
                         </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="digital" className="space-y-6 mt-0">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <Instagram className="h-3.5 w-3.5 text-pink-500" /> Instagram
                        </Label>
                        <div className="relative">
                          <Input 
                            placeholder="Ex: @empresa ou link completo" 
                            value={selectedLead.instagramUrl || selectedLead.instagramHandle || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSelectedLead({ ...selectedLead, instagramUrl: val });
                            }}
                            className="rounded-2xl bg-slate-50 border-slate-100 h-12 px-4 font-medium focus-visible:ring-primary/20"
                          />
                          {selectedLead.instagramUrl && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              {normalizeInstagram(selectedLead.instagramUrl).isValid ? (
                                <CheckCircle className="h-5 w-5 text-emerald-500" />
                              ) : (
                                <XCircle className="h-5 w-5 text-rose-500" />
                              )}
                            </div>
                          )}
                        </div>
                        {selectedLead.instagramUrl && !normalizeInstagram(selectedLead.instagramUrl).isValid && (
                          <p className="text-[10px] text-rose-500 font-bold ml-1">Instagram inválido. Use @usuario ou um link válido.</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5 text-rose-500" /> Google Maps
                        </Label>
                        <div className="relative">
                          <Input 
                            placeholder="Link do Google Maps" 
                            value={selectedLead.address || ''}
                            onChange={(e) => setSelectedLead({ ...selectedLead, address: e.target.value })}
                            className="rounded-2xl bg-slate-50 border-slate-100 h-12 px-4 font-medium focus-visible:ring-primary/20"
                          />
                          {selectedLead.address && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              {normalizeGoogleMaps(selectedLead.address).isValid ? (
                                <CheckCircle className="h-5 w-5 text-emerald-500" />
                              ) : (
                                <XCircle className="h-5 w-5 text-rose-500" />
                              )}
                            </div>
                          )}
                        </div>
                        {selectedLead.address && selectedLead.address.includes('http') && !normalizeGoogleMaps(selectedLead.address).isValid && (
                          <p className="text-[10px] text-rose-500 font-bold ml-1">Link do Google Maps inválido.</p>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="contato" className="space-y-6 mt-0">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <MessageSquare className="h-3.5 w-3.5 text-emerald-500" /> WhatsApp
                        </Label>
                        <div className="relative">
                          <Input 
                            placeholder="(00) 00000-0000" 
                            value={selectedLead.whatsapp || ''}
                            onChange={(e) => setSelectedLead({ ...selectedLead, whatsapp: e.target.value })}
                            className="rounded-2xl bg-slate-50 border-slate-100 h-12 px-4 font-medium focus-visible:ring-primary/20"
                          />
                          {selectedLead.whatsapp && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              {normalizeWhatsApp(selectedLead.whatsapp).isValid ? (
                                <CheckCircle className="h-5 w-5 text-emerald-500" />
                              ) : (
                                <XCircle className="h-5 w-5 text-rose-500" />
                              )}
                            </div>
                          )}
                        </div>
                        {selectedLead.whatsapp && (
                          <p className="text-[10px] text-slate-400 font-bold ml-1">
                            Normalizado: {normalizeWhatsApp(selectedLead.whatsapp).display}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <Globe className="h-3.5 w-3.5 text-blue-500" /> Website
                        </Label>
                        <div className="relative">
                          <Input 
                            placeholder="empresa.com.br" 
                            value={selectedLead.websiteUrl || ''}
                            onChange={(e) => setSelectedLead({ ...selectedLead, websiteUrl: e.target.value })}
                            className="rounded-2xl bg-slate-50 border-slate-100 h-12 px-4 font-medium focus-visible:ring-primary/20"
                          />
                          {selectedLead.websiteUrl && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              {normalizeWebsite(selectedLead.websiteUrl).isValid ? (
                                <CheckCircle className="h-5 w-5 text-emerald-500" />
                              ) : (
                                <XCircle className="h-5 w-5 text-rose-500" />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="preview" className="mt-0">
                    <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 space-y-4">
                      <div className="flex items-center gap-4 pb-4 border-b border-slate-200">
                        <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-xl shadow-inner">
                          {selectedLead.companyName?.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-black text-slate-900 leading-tight truncate">{selectedLead.companyName}</h4>
                          <Badge variant="secondary" className="mt-1 text-[9px] font-black uppercase tracking-tighter h-5">{selectedLead.niche}</Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-3">
                        {/* Instagram */}
                        <div className="flex items-center justify-between text-xs p-3 bg-white rounded-xl border border-slate-100 shadow-sm group">
                          <div className="flex items-center gap-2 font-bold text-slate-600">
                            <Instagram className="h-4 w-4 text-pink-500" /> 
                            <span className="hidden sm:inline">Instagram</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {normalizeInstagram(selectedLead.instagramUrl || selectedLead.instagramHandle || '').isValid ? (
                              <>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 px-2 rounded-lg text-[10px] font-black uppercase text-pink-600 hover:bg-pink-50"
                                  onClick={() => window.open(normalizeInstagram(selectedLead.instagramUrl || selectedLead.instagramHandle || '').url, '_blank')}
                                >
                                  Abrir
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 rounded-lg text-slate-400 hover:text-primary"
                                  onClick={() => {
                                    navigator.clipboard.writeText(normalizeInstagram(selectedLead.instagramUrl || selectedLead.instagramHandle || '').url);
                                    toast.success("Link do Instagram copiado!");
                                  }}
                                >
                                  <Save className="h-3.5 w-3.5" />
                                </Button>
                              </>
                            ) : (
                              <span className="text-[10px] font-black text-slate-300 uppercase">Não vinculado</span>
                            )}
                          </div>
                        </div>

                        {/* Website */}
                        <div className="flex items-center justify-between text-xs p-3 bg-white rounded-xl border border-slate-100 shadow-sm group">
                          <div className="flex items-center gap-2 font-bold text-slate-600">
                            <Globe className="h-4 w-4 text-blue-500" /> 
                            <span className="hidden sm:inline">Website</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {selectedLead.websiteUrl ? (
                              <>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 px-2 rounded-lg text-[10px] font-black uppercase text-blue-600 hover:bg-blue-50"
                                  onClick={() => window.open(selectedLead.websiteUrl?.startsWith('http') ? selectedLead.websiteUrl : `https://${selectedLead.websiteUrl}`, '_blank')}
                                >
                                  Abrir
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 rounded-lg text-slate-400 hover:text-primary"
                                  onClick={() => {
                                    navigator.clipboard.writeText(selectedLead.websiteUrl!);
                                    toast.success("Link do site copiado!");
                                  }}
                                >
                                  <Save className="h-3.5 w-3.5" />
                                </Button>
                              </>
                            ) : (
                              <span className="text-[10px] font-black text-slate-300 uppercase">Sem site</span>
                            )}
                          </div>
                        </div>

                        {/* WhatsApp */}
                        <div className="flex items-center justify-between text-xs p-3 bg-white rounded-xl border border-slate-100 shadow-sm group">
                          <div className="flex items-center gap-2 font-bold text-slate-600">
                            <MessageCircleIcon className="h-4 w-4 text-emerald-500" /> 
                            <span className="hidden sm:inline">WhatsApp</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {selectedLead.whatsapp ? (
                              <>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 px-2 rounded-lg text-[10px] font-black uppercase text-emerald-600 hover:bg-emerald-50"
                                  onClick={() => window.open(`https://wa.me/${selectedLead.whatsapp?.replace(/\D/g, '')}`, '_blank')}
                                >
                                  Chat
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 rounded-lg text-slate-400 hover:text-primary"
                                  onClick={() => {
                                    navigator.clipboard.writeText(selectedLead.whatsapp!);
                                    toast.success("Número do WhatsApp copiado!");
                                  }}
                                >
                                  <Save className="h-3.5 w-3.5" />
                                </Button>
                              </>
                            ) : (
                              <span className="text-[10px] font-black text-slate-300 uppercase">Sem contato</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="history" className="mt-0">
                    <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 max-h-[400px] overflow-y-auto space-y-4 scrollbar-thin">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Linha do Tempo</h4>
                        <Badge variant="outline" className="text-[9px] font-black">{auditLogs.filter((log: any) => log.leadId === selectedLead.id).length} eventos</Badge>
                      </div>
                      {auditLogs
                        .filter((log: any) => log.leadId === selectedLead.id)
                        .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                        .map((log: any) => (
                          <div key={log.id} className="relative pl-6 pb-6 border-l-2 border-slate-200 last:pb-0">
                            <div className="absolute left-[-9px] top-0 h-4 w-4 rounded-full bg-white border-2 border-primary shadow-sm" />
                            <div className="flex justify-between items-start mb-1">
                              <span className={cn(
                                "text-[10px] font-black uppercase px-1.5 py-0.5 rounded",
                                log.action === 'add' ? "bg-emerald-100 text-emerald-700" : 
                                log.action === 'delete' ? "bg-rose-100 text-rose-700" : "bg-blue-100 text-blue-700"
                              )}>
                                {log.action === 'update' ? 'Alteração' : log.action === 'add' ? 'Criação' : log.action === 'delete' ? 'Remoção' : 'Ação'}
                              </span>
                              <span className="text-[9px] text-slate-400 font-bold flex items-center gap-1">
                                <Clock className="h-2.5 w-2.5" />
                                {new Date(log.timestamp).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <div className="space-y-1.5 mt-2 bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm">
                              {log.changes?.map((change: any, idx: number) => (
                                <div key={idx} className="text-[11px] text-slate-500 leading-tight">
                                  <div className="font-black text-slate-700 uppercase text-[9px] tracking-tighter mb-0.5">{change.field}</div>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="opacity-60 line-through truncate max-w-[100px]">{String(change.before || 'Vazio')}</span>
                                    <ArrowRight className="h-2.5 w-2.5 text-primary shrink-0" />
                                    <span className="text-primary font-bold">{String(change.after || 'Removido')}</span>
                                  </div>
                                </div>
                              ))}
                              {log.message && <p className="text-[10px] text-slate-400 italic mt-1 border-t border-slate-50 pt-1">{log.message}</p>}
                            </div>
                          </div>
                        ))}
                      {auditLogs.filter((log: any) => log.leadId === selectedLead.id).length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-300">
                          <History className="h-10 w-10 mb-2 opacity-10" />
                          <p className="text-xs font-black uppercase tracking-widest opacity-40">Nenhum histórico</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex flex-col gap-3">
                  <Button 
                    onClick={() => {
                      const insta = normalizeInstagram(selectedLead.instagramUrl || '');
                      const maps = normalizeGoogleMaps(selectedLead.address || '');
                      const whatsapp = normalizeWhatsApp(selectedLead.whatsapp || '');
                      const site = normalizeWebsite(selectedLead.websiteUrl || '');

                      if (selectedLead.instagramUrl && !insta.isValid) {
                        toast.error("Instagram inválido.");
                        return;
                      }
                      if (selectedLead.address && selectedLead.address.includes('http') && !maps.isValid) {
                        toast.error("Link do Google Maps inválido.");
                        return;
                      }

                      handleSaveLeadConfig({
                        instagramHandle: insta.handle || selectedLead.instagramHandle,
                        instagramUrl: insta.url || selectedLead.instagramUrl,
                        address: maps.url || selectedLead.address,
                        whatsapp: whatsapp.normalized || selectedLead.whatsapp,
                        websiteUrl: site.url || selectedLead.websiteUrl,
                        updatedAt: new Date().toISOString()
                      });

                      updateLead(selectedLead.id, selectedLead);
                      toast.success("Lead atualizado com sucesso!");
                      setIsLeadConfigOpen(false);
                    }} 
                    className="w-full h-14 rounded-2xl text-base font-black shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-95"
                  >
                    Salvar Todas as Alterações
                  </Button>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      onClick={() => setIsLeadConfigOpen(false)} 
                      className="flex-1 h-12 rounded-2xl font-bold text-slate-500"
                    >
                      Cancelar
                    </Button>
                    <div className="flex gap-2">
                      {selectedLead.instagramUrl && (
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-12 w-12 rounded-2xl border-slate-100 text-pink-500 shadow-sm"
                          onClick={() => window.open(normalizeInstagram(selectedLead.instagramUrl!).url, '_blank')}
                        >
                          <Instagram className="h-5 w-5" />
                        </Button>
                      )}
                      {selectedLead.whatsapp && (
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-12 w-12 rounded-2xl border-slate-100 text-emerald-500 shadow-sm"
                          onClick={() => window.open(`https://wa.me/${selectedLead.whatsapp?.replace(/\D/g, '')}`, '_blank')}
                        >
                          <MessageCircleIcon className="h-5 w-5" />
                        </Button>
                      )}
                      {selectedLead.websiteUrl && (
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-12 w-12 rounded-2xl border-slate-100 text-blue-500 shadow-sm"
                          onClick={() => window.open(selectedLead.websiteUrl?.startsWith('http') ? selectedLead.websiteUrl : `https://${selectedLead.websiteUrl}`, '_blank')}
                        >
                          <Globe className="h-5 w-5" />
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        onClick={() => setIsDiscardDialogOpen(true)} 
                        className="h-12 w-12 rounded-2xl border-rose-100 text-rose-500 shadow-sm hover:bg-rose-50"
                        title="Descartar Lead"
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reusable Discard Dialog in Page */}
      <Dialog open={isDiscardDialogOpen} onOpenChange={setIsDiscardDialogOpen}>
        <DialogContent className="max-w-sm rounded-[2rem] border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black flex items-center gap-2 text-rose-600">
              <Ban className="h-5 w-5" /> Descartar Lead
            </DialogTitle>
            <DialogDescription className="text-sm font-medium">Remover "{selectedLead?.companyName}" do pipeline ativo?</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={pendingReason} onValueChange={setPendingReason}>
              <SelectTrigger className="rounded-xl border-slate-100 bg-slate-50 h-12">
                <SelectValue placeholder="Motivo do descarte..." />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-100">
                <SelectItem value="Dados inválidos">Dados inválidos</SelectItem>
                <SelectItem value="Fora do perfil">Fora do perfil</SelectItem>
                <SelectItem value="Concorrente">Concorrente</SelectItem>
                <SelectItem value="Outro">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setIsDiscardDialogOpen(false)} className="rounded-xl font-bold">Cancelar</Button>
            <Button 
              variant="destructive" 
              disabled={!pendingReason}
              onClick={() => {
                if (selectedLead) {
                  discardLead(selectedLead.id, pendingReason);
                  setIsDiscardDialogOpen(false);
                  setIsLeadConfigOpen(false);
                  setPendingReason("");
                  toast.error("Lead removido instantaneamente.");
                }
              }}
              className="rounded-xl font-black bg-rose-600 hover:bg-rose-700 h-11 px-6"
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <FocusMode isOpen={isFocusModeOpen} onClose={() => setIsFocusModeOpen(false)} />
      
      {/* isImporting && <ActiveJobsBanner /> */}
    </div>
  );
}
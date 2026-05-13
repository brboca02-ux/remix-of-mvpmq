import React, { useState, useMemo } from 'react';
import { useProspectingStore } from '../prospecting/prospecting-store';
import { LeadPipeline } from '../prospecting/LeadPipeline';
import { LeadCard } from '../prospecting/LeadCard';
import { cn } from "@/lib/utils";
import { ProspectLead } from '../prospecting/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  TrendingUp, 
  Settings, 
  Database, 
  ArrowRightLeft, 
  History,
  Layout,
  MessageSquare,
  BarChart3,
  Calendar,
  Share2,
  List,
  Search,
  Trophy,
  Target,
  Megaphone,
  Shapes,
  Sparkles,
  Clock,
  AlertTriangle,
  Send,
  UserMinus,
  Ban,
  CalendarDays,
  CheckCircle2,
  MoreHorizontal,
  Brain,
  Zap,
  Calendar as CalendarIcon,
  FileText,
  FileSpreadsheet
} from "lucide-react";
import { toast } from "sonner";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FollowupRulesPanel } from "./FollowupRulesPanel";
import { CRMCalendar } from "./CRMCalendar";
// Zap, Calendar as CalendarIcon, FileText, FileSpreadsheet already imported above
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuditStore } from "@/hooks/useAuditStore";
import { useCalendarStore } from "./calendar-store";
import { loadTasks } from "./followup-rules";
import {
  exportLeadsCsv,
  exportLeadsPdf,
  exportInteractionsCsv,
  exportInteractionsPdf,
} from "./crm-export";

import { CRMFilters } from "./components/CRMFilters";
import { TimelineView } from "./components/TimelineView";
import { BulkActions } from "./components/BulkActions";

import { useFollowupEvaluator } from "./useFollowupEvaluator";
import { PerformanceReport } from '../prospecting/PerformanceReport';
import { CRMSummaryBar } from "@/components/crm/CRMSummaryBar";
import { WhatsappExportDialog } from "@/components/crm/WhatsappExportDialog";
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

const CRMPage: React.FC = () => {
  const { leads, moveLead, deleteLead, updateLead, addLead } = useProspectingStore();
  const auditLogs = useAuditStore((s) => s.auditLogs);
  const events = useCalendarStore((s) => s.events);

  // P0-2: Sync leads from Supabase (buscador imports) into CRM view
  useEffect(() => {
    const loadSupabaseLeads = async () => {
      try {
        const { data: session } = await supabase.auth.getSession();
        if (!session?.session?.user) return;

        const { data: dbLeads, error } = await supabase
          .from('leads_import')
          .select('id, nome, telefone, email, cidade, uf, nicho, site, status, atividade, instagram_handle, confidence_score, created_at')
          .order('created_at', { ascending: false })
          .limit(200);

        if (error || !dbLeads) return;

        // Merge: add Supabase leads that don't exist locally
        const existingNames = new Set((leads || []).map(l => l.companyName?.toLowerCase()));
        let addedCount = 0;

        dbLeads.forEach((dbLead) => {
          const name = (dbLead.nome || '').toLowerCase();
          if (name && !existingNames.has(name)) {
            addLead({
              id: dbLead.id,
              companyName: dbLead.nome || 'Sem nome',
              niche: dbLead.nicho || 'geral',
              city: dbLead.cidade || '',
              email: dbLead.email || undefined,
              whatsapp: dbLead.telefone || undefined,
              websiteUrl: dbLead.site || undefined,
              instagramHandle: dbLead.instagram_handle || undefined,
              source: 'supabase_import',
              status: (dbLead.status as any) || 'Novo',
              opportunityScore: Math.round((dbLead.confidence_score || 0.5) * 100),
              opportunityLevel: 'média',
              diagnosis: dbLead.atividade || '',
              createdAt: dbLead.created_at || new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
            addedCount++;
            existingNames.add(name);
          }
        });

        if (addedCount > 0) {
          logger.info('Synced leads from Supabase to CRM', { addedCount });
        }
      } catch (err) {
        logger.error('Failed to sync leads from Supabase', err as Error);
      }
    };

    loadSupabaseLeads();
  }, []); // Run once on mount
  
  useFollowupEvaluator();
  
  const followupTasks = loadTasks();
  
  const [selectedLead, setSelectedLead] = useState<ProspectLead | null>(null);
  const [isIntegrationOpen, setIsIntegrationOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [configInitialTab, setConfigInitialTab] = useState('overview');
  const [activeFilters, setActiveFilters] = useState<{
    niche?: string;
    hotOnly?: boolean;
    inactiveOnly?: boolean;
  }>({});

  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [waExportOpen, setWaExportOpen] = useState(false);

  const filteredLeads = useMemo(() => {
    return leads.filter((l: ProspectLead) => {
      const matchesSearch = 
        l.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.niche?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.city?.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchesSearch) return false;

      if (activeFilters.niche && l.niche !== activeFilters.niche) return false;

      if (activeFilters.hotOnly && l.opportunityScore < 80) return false;

      if (activeFilters.inactiveOnly) {
        const lastUpdate = new Date(l.updatedAt).getTime();
        const now = Date.now();
        if (now - lastUpdate <= 48 * 60 * 60 * 1000) return false;
      }

      return true;
    });
  }, [leads, searchTerm, activeFilters]);

  const totalLeads = leads.length;
  const closedLeads = leads.filter((l: ProspectLead) => l.status === 'Lead Fechado').length;
  const qualifiedLeads = leads.filter((l: ProspectLead) => l.status === 'Lead Qualificado' || l.status === 'Lead Fechado').length;
  
  const conversionRate = totalLeads > 0 ? (closedLeads / totalLeads) * 100 : 0;
  const qualificationRate = totalLeads > 0 ? (qualifiedLeads / totalLeads) * 100 : 0;

  const getLeadsBySource = (source: string) => leads.filter((l: ProspectLead) => l.source === source).length;
  const getQualifiedBySource = (source: string) => leads.filter((l: ProspectLead) => l.source === source && (l.status === 'Lead Qualificado' || l.status === 'Lead Fechado')).length;
  
  const channelMetrics = {
    email: getLeadsBySource('Cold Mail') > 0 ? (getQualifiedBySource('Cold Mail') / getLeadsBySource('Cold Mail')) * 100 : 0,
    whatsapp: getLeadsBySource('WhatsApp') > 0 ? (getQualifiedBySource('WhatsApp') / getLeadsBySource('WhatsApp')) * 100 : 0,
    linkedin: getLeadsBySource('LinkedIn') > 0 ? (getQualifiedBySource('LinkedIn') / getLeadsBySource('LinkedIn')) * 100 : 0,
  };

  const avgResponseRate = (channelMetrics.email + channelMetrics.whatsapp + channelMetrics.linkedin) / 3;

  const availableNiches = useMemo(() => {
    const niches = leads.map((l: ProspectLead) => l.niche).filter(Boolean);
    return Array.from(new Set(niches));
  }, [leads]);

  const handleBulkMove = (status: ProspectLead['status']) => {
    selectedLeadIds.forEach(id => moveLead(id, status));
    toast.success(`${selectedLeadIds.length} leads movidos para ${status}`);
    setSelectedLeadIds([]);
  };

  const handleBulkDelete = () => {
    selectedLeadIds.forEach(id => deleteLead(id));
    toast.success(`${selectedLeadIds.length} leads excluídos`);
    setSelectedLeadIds([]);
  };

  const handleBulkProposal = () => {
    toast.info(`Geração de propostas em massa será implementada em breve.`, {
      description: `${selectedLeadIds.length} leads selecionados. Funcionalidade em desenvolvimento.`,
      icon: '🚧',
    });
  };

  const handleFilterChange = (type: string, value: any) => {
    setActiveFilters(prev => ({ ...prev, [type]: value }));
  };

  const handleMoveLead = (id: string, newStatus: ProspectLead['status']) => {
    moveLead(id, newStatus);
    toast.success(`Lead movido para ${newStatus}`);
  };

  const handleViewDetails = (lead: ProspectLead, initialTab: string = 'overview') => {
    setSelectedLead(lead);
    setConfigInitialTab(initialTab);
  };

  return (
    <div className="container mx-auto py-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão CRM</h1>
          <p className="text-muted-foreground">Gerencie o ciclo de vida dos seus leads e acompanhe conversões.</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setWaExportOpen(true)}
            className="gap-2"
            disabled={leads.length === 0}
          >
            <MessageSquare className="h-4 w-4" />
            Exportar para WhatsApp
          </Button>
          <Button variant="outline" onClick={() => setIsIntegrationOpen(true)} className="gap-2">
            <ArrowRightLeft className="h-4 w-4" />
            Integrar CRM Externo
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="gap-2">
                <Database className="h-4 w-4" />
                Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Leads</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => { exportLeadsCsv(leads); toast.success('CSV de leads gerado'); }} className="gap-2">
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> Leads em CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { exportLeadsPdf(leads); toast.success('PDF de leads gerado'); }} className="gap-2">
                <FileText className="h-4 w-4 text-rose-600" /> Leads em PDF
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Histórico de Interações</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => { exportInteractionsCsv(auditLogs, events, followupTasks); toast.success('CSV de interações gerado'); }} className="gap-2">
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> Interações em CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { exportInteractionsPdf(leads, auditLogs, events, followupTasks); toast.success('PDF de interações gerado'); }} className="gap-2">
                <FileText className="h-4 w-4 text-rose-600" /> Interações em PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <CRMSummaryBar leads={leads} />

      <WhatsappExportDialog
        open={waExportOpen}
        onOpenChange={setWaExportOpen}
        leads={selectedLeadIds.length > 0 ? leads.filter((l) => selectedLeadIds.includes(l.id)) : leads}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
        <Card className="bg-card border-white/5 glass-card shadow-lg hover:shadow-blue-500/5 transition-all group overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Users className="h-12 w-12 text-blue-500" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-blue-500">Leads Ativos</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">{totalLeads}</div>
            {totalLeads > 0 && (
              <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground font-medium bg-muted w-fit px-2 py-0.5 rounded-full">
                Total no pipeline
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-white/5 glass-card shadow-lg hover:shadow-purple-500/5 transition-all group overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Zap className="h-12 w-12 text-purple-500" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-purple-500">Qualificados</CardTitle>
            <Zap className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">{qualifiedLeads}</div>
            <p className="text-[10px] text-muted-foreground mt-1">{qualificationRate.toFixed(1)}% de conversão interna</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-white/5 glass-card shadow-lg hover:shadow-emerald-500/5 transition-all group overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp className="h-12 w-12 text-emerald-500" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-emerald-600">Taxa de Vendas</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">{conversionRate.toFixed(1)}%</div>
            <p className="text-[10px] text-muted-foreground mt-1">{closedLeads} negócios fechados</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-white/5 glass-card shadow-lg hover:shadow-orange-500/5 transition-all group overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <MessageSquare className="h-12 w-12 text-orange-500" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-orange-600">Engajamento</CardTitle>
            <MessageSquare className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">~{avgResponseRate.toFixed(0)}%</div>
            <div className="flex gap-2 mt-2">
              <Badge variant="outline" className="text-[9px] py-0 border-emerald-500/20 text-emerald-600 bg-emerald-500/5">WA: {channelMetrics.whatsapp.toFixed(0)}%</Badge>
              <Badge variant="outline" className="text-[9px] py-0 border-blue-500/20 text-blue-600 bg-blue-500/5">LI: {channelMetrics.linkedin.toFixed(0)}%</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-white/5 glass-card shadow-lg hover:shadow-amber-500/5 transition-all group overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Trophy className="h-12 w-12 text-amber-500" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-amber-600">Previsão de Receita</CardTitle>
            <Trophy className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            {(() => {
              const m = useProspectingStore.getState().getPerformanceMetrics();
              return (
                <>
                  <div className="text-3xl font-black">R$ {(m.potentialRevenue / 1000).toFixed(1)}k</div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                     <div className="bg-amber-500 h-full rounded-full" style={{ width: `${Math.min((m.potentialRevenue/100000)*100, 100)}%` }} />
                  </div>
                  <p className="text-[9px] text-muted-foreground mt-1 font-bold">Baseado em score & funil</p>
                </>
              );
            })()}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pipeline" className="w-full">
        <TabsList className="bg-slate-100/50 p-1 rounded-2xl">
          <TabsTrigger value="pipeline" className="gap-2 rounded-xl">
            <Layout className="h-4 w-4" /> Funil
          </TabsTrigger>
          <TabsTrigger value="pendencies" className="gap-2 rounded-xl">
            <Clock className="h-4 w-4" /> Pendências
            {leads.filter((l: ProspectLead) => l.contactStatus === 'Reenvio vencido' || l.contactStatus === 'Erro no envio').length > 0 && (
              <Badge variant="destructive" className="h-4 px-1.5 min-w-[18px] text-[10px] font-black">
                {leads.filter((l: ProspectLead) => l.contactStatus === 'Reenvio vencido' || l.contactStatus === 'Erro no envio').length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="followup" className="gap-2 rounded-xl">
            <Zap className="h-4 w-4" /> Automação
          </TabsTrigger>
          <TabsTrigger value="performance" className="gap-2 rounded-xl">
            <BarChart3 className="h-4 w-4" /> Performance
          </TabsTrigger>
          <TabsTrigger value="calendar" className="gap-2 rounded-xl">
            <CalendarIcon className="h-4 w-4" /> Agenda
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline" className="mt-4">
          <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="px-0 flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Layout className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold tracking-tight">Gestão de Leads</CardTitle>
                    <CardDescription className="text-sm font-medium">Visualize e gerencie seu funil de prospecção em tempo real.</CardDescription>
                  </div>
                </div>
                <CRMFilters 
                  onFilterChange={handleFilterChange} 
                  activeFilters={activeFilters}
                  availableNiches={availableNiches}
                />
              </div>

              <div className="w-full md:w-72 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Pesquisar empresa..."
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="px-0 pt-6">
              <LeadPipeline
                leads={filteredLeads}
                onMoveLead={handleMoveLead}
                onEditLead={(lead) => handleViewDetails(lead)}
              />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="pendencies" className="mt-4">
          <Card className="border border-slate-100 rounded-[2rem] overflow-hidden bg-white shadow-sm">
            <CardHeader className="p-6 border-b border-slate-50 bg-slate-50/30">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-black">Pendências de Contato</CardTitle>
                  <CardDescription className="text-sm font-medium">Controle real de reenvios, atrasos e follow-ups operacionais.</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline" className="rounded-lg h-7 font-black text-[10px] uppercase bg-white">Vencidos: {leads.filter((l: ProspectLead) => l.contactStatus === 'Reenvio vencido').length}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-0 divide-x divide-slate-50 bg-slate-50/20 border-b border-slate-50">
                <div className="p-3 text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vencidos</p>
                  <p className="text-lg font-black text-rose-600">{leads.filter((l: ProspectLead) => l.contactStatus === 'Reenvio vencido').length}</p>
                </div>
                <div className="p-3 text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Para Hoje</p>
                  <p className="text-lg font-black text-blue-600">{leads.filter((l: ProspectLead) => l.contactStatus === 'Reenvio agendado' && l.nextFollowUpAt && new Date(l.nextFollowUpAt).toDateString() === new Date().toDateString()).length}</p>
                </div>
                <div className="p-3 text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aguardando</p>
                  <p className="text-lg font-black text-amber-600">{leads.filter((l: ProspectLead) => l.contactStatus === 'Aguardando resposta').length}</p>
                </div>
                <div className="p-3 text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Erros</p>
                  <p className="text-lg font-black text-rose-800">{leads.filter((l: ProspectLead) => l.contactStatus === 'Erro no envio').length}</p>
                </div>
              </div>

              <ScrollArea className="h-[600px]">
                <div className="divide-y divide-slate-50">
                  {leads
                    .filter((l: ProspectLead) => ['Reenvio vencido', 'Erro no envio', 'Aguardando resposta', 'Novo envio pendente', 'Reenvio agendado'].includes(l.contactStatus || ''))
                    .sort((a: ProspectLead, b: ProspectLead) => {
                      const order: Record<string, number> = { 'Erro no envio': 0, 'Reenvio vencido': 1, 'Reenvio agendado': 2, 'Novo envio pendente': 3, 'Aguardando resposta': 4 };
                      return (order[a.contactStatus || ''] ?? 99) - (order[b.contactStatus || ''] ?? 99);
                    })
                    .map((lead: ProspectLead) => {
                      const isOverdue = lead.contactStatus === 'Reenvio vencido';
                      const isToday = lead.contactStatus === 'Reenvio agendado' && lead.nextFollowUpAt && new Date(lead.nextFollowUpAt).toDateString() === new Date().toDateString();
                      
                      return (
                        <div key={lead.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors group">
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className={cn(
                              "h-12 w-12 rounded-2xl flex items-center justify-center font-black text-lg shadow-sm transition-all group-hover:scale-110",
                              isOverdue ? "bg-rose-100 text-rose-600" : isToday ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-400"
                            )}>
                              {lead.companyName.substring(0, 1).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="font-black text-sm text-slate-900 truncate">{lead.companyName}</h4>
                                {lead.opportunityLevel === 'quente' && <Sparkles className="h-3 w-3 text-rose-500 animate-pulse" />}
                              </div>
                              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                <span className={cn(
                                  "text-[9px] font-black px-2 py-0.5 rounded-full border tracking-tighter uppercase",
                                  isOverdue ? "bg-rose-500 text-white border-rose-600" 
                                  : isToday ? "bg-blue-500 text-white border-blue-600"
                                  : lead.contactStatus === 'Erro no envio' ? "bg-rose-50 text-rose-700 border-rose-200"
                                  : "bg-slate-100 text-slate-500 border-slate-200"
                                )}>
                                  {lead.contactStatus}
                                </span>
                                
                                {lead.lastContactAt && (
                                  <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                                    <Send className="h-2.5 w-2.5" /> {format(new Date(lead.lastContactAt), "dd/MM")}
                                  </span>
                                )}
        <TabsContent value="performance" className="mt-4">
          <PerformanceReport />
        </TabsContent>
                                {lead.nextFollowUpAt && (
                                  <span className={cn(
                                    "text-[10px] font-bold flex items-center gap-1",
                                    isOverdue ? "text-rose-600" : "text-slate-500"
                                  )}>
                                    <Clock className="h-2.5 w-2.5" /> 
                                    {isOverdue ? `Atrasado: ${format(new Date(lead.nextFollowUpAt), "dd/MM")}` : `Próximo: ${format(new Date(lead.nextFollowUpAt), "dd/MM")}`}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-9 px-4 text-[10px] font-black uppercase rounded-xl border-slate-200 hover:border-violet-600 hover:text-violet-600 hover:bg-violet-50 transition-all shadow-sm"
                              onClick={() => handleViewDetails(lead, 'overview')}
                            >
                              <Send className="h-3.5 w-3.5 mr-2" /> Executar
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl">
                                  <MoreHorizontal className="h-4 w-4 text-slate-400" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="rounded-xl p-1 shadow-2xl border-slate-100 min-w-[160px]">
                                <DropdownMenuItem onClick={() => handleViewDetails(lead, 'overview')} className="gap-2 text-xs font-bold">
                                  <CalendarDays className="h-3.5 w-3.5" /> Adiar Contato
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleViewDetails(lead, 'overview')} className="gap-2 text-xs font-bold text-rose-600">
                                  <Ban className="h-3.5 w-3.5" /> Descartar Lead
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      );
                    })}
                  
                  {leads.filter((l: ProspectLead) => ['Reenvio vencido', 'Erro no envio', 'Aguardando resposta', 'Novo envio pendente', 'Reenvio agendado'].includes(l.contactStatus || '')).length === 0 && (
                    <div className="py-24 flex flex-col items-center justify-center opacity-40 grayscale">
                      <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center mb-6">
                        <CheckCircle2 className="h-10 w-10 text-slate-300" />
                      </div>
                      <span className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Tudo em dia!</span>
                      <p className="text-xs font-medium text-slate-400 mt-2">Nenhuma pendência operacional pendente.</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="followup" className="mt-4">
          <FollowupRulesPanel leads={leads} onMoveLead={handleMoveLead} />
        </TabsContent>

        <TabsContent value="calendar" className="mt-4">
          <CRMCalendar />
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          {selectedLead && (
            <>
              <DialogHeader>
                <div className="flex justify-between items-start pr-8">
                  <div>
                    <DialogTitle className="text-2xl">{selectedLead.companyName}</DialogTitle>
                    <DialogDescription className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">{selectedLead.niche}</Badge>
                      <span>{selectedLead.city}</span>
                    </DialogDescription>
                  </div>
                  <Badge variant={selectedLead.opportunityLevel === 'quente' ? 'destructive' : 'default'}>
                    Score: {selectedLead.opportunityScore}%
                  </Badge>
                </div>
              </DialogHeader>

              <Tabs value={configInitialTab} onValueChange={setConfigInitialTab} className="flex-1 mt-4">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview" className="gap-2">
                    <Sparkles className="h-4 w-4" /> Visão Completa
                  </TabsTrigger>
                  <TabsTrigger value="history" className="gap-2">
                    <History className="h-4 w-4" /> Histórico
                  </TabsTrigger>
                  <TabsTrigger value="info" className="gap-2">
                    <Database className="h-4 w-4" /> Dados
                  </TabsTrigger>
                  <TabsTrigger value="actions" className="gap-2">
                    <Settings className="h-4 w-4" /> Ações
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-4">
                  <ScrollArea className="h-[500px] pr-4">
                    <LeadCard
                      lead={selectedLead}
                      density="comfortable"
                      onViewDiagnosis={() => toast.info("Funcionalidade disponível no Buscador")}
                      onGenerateSite={() => toast.info("Funcionalidade disponível no Buscador")}
                      onGeneratePitch={() => toast.info("Funcionalidade disponível no Buscador")}
                      onUpdateStatus={handleMoveLead}
                      onDelete={deleteLead}
                      onEditLead={handleViewDetails}
                    />
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="history" className="mt-4 flex-1 overflow-hidden">
                  <ScrollArea className="h-[450px] pr-4">
                    <TimelineView logs={auditLogs.filter((log: any) => log.leadId === selectedLead.id)} />
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="info" className="mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-muted-foreground uppercase">E-mail</span>
                      <p className="text-sm">{selectedLead.email || 'Não informado'}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-muted-foreground uppercase">WhatsApp</span>
                      <p className="text-sm">{selectedLead.whatsapp || 'Não informado'}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-muted-foreground uppercase">LinkedIn</span>
                      <p className="text-sm truncate max-w-[200px]">{selectedLead.linkedinUrl || 'Não informado'}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-muted-foreground uppercase">Instagram</span>
                      <p className="text-sm">{selectedLead.instagramHandle ? `@${selectedLead.instagramHandle}` : 'Não informado'}</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="actions" className="mt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" className="justify-start gap-2 h-12">
                      <Calendar className="h-4 w-4" /> Agendar Reunião
                    </Button>
                    <Button variant="outline" className="justify-start gap-2 h-12">
                      <Share2 className="h-4 w-4" /> Enviar Proposta PDF
                    </Button>
                    <Button variant="outline" className="justify-start gap-2 h-12">
                      <Settings className="h-4 w-4" /> Editar Dados
                    </Button>
                    <Button variant="outline" className="justify-start gap-2 h-12 text-rose-600 hover:text-rose-700">
                      <History className="h-4 w-4" /> Arquivar Lead
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>

              <DialogFooter className="mt-6">
                <Button onClick={() => setSelectedLead(null)}>Fechar Detalhes</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <BulkActions 
        selectedCount={selectedLeadIds.length}
        onClear={() => setSelectedLeadIds([])}
        onBulkMove={handleBulkMove}
        onBulkDelete={handleBulkDelete}
        onBulkProposal={handleBulkProposal}
      />
    </div>
  );
};

export default CRMPage;

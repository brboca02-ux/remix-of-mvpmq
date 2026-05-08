import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  FileText, 
  Search, 
  Eye, 
  Send, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  BarChart,
  LayoutGrid,
  ListFilter,
  FileSearch,
  Zap,
  Package,
  ArrowRight,
  Sparkles,
  Calendar
} from "lucide-react";
import { useServicesStore } from './services-store';
import { Link } from '@tanstack/react-router';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProspectingStore } from '../prospecting/prospecting-store';
import { StatusNotesDialog } from '../prospecting/StatusNotesDialog';
import { ProspectLead } from '../prospecting/types';

const DeliveryDocumentationPage: React.FC = () => {
  const { services } = useServicesStore();
  const { leads } = useProspectingStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('catalog');
  const [selectedRequest, setSelectedRequest] = useState<ProspectLead | null>(null);
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'overdue'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  
  // Cross-selling / Recommendations logic
  const getRecommendedServices = (lead: ProspectLead) => {
    // Basic logic: recommend something not in the same category
    return services.filter(s => s.category !== lead.niche).slice(0, 2);
  };

  const filteredServices = services.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Stats for internal view
  const serviceRequests = leads.filter(l => {
    const isService = ['Recebido', 'Em Diagnóstico', 'Proposta Enviada', 'Agendado'].includes(l.status);
    const matchesStatus = statusFilter === 'all' || l.status === statusFilter;
    return isService && matchesStatus;
  });
  
  const statusCounts = {
    received: leads.filter(l => l.status === 'Recebido').length,
    diagnostic: leads.filter(l => l.status === 'Em Diagnóstico').length,
    proposal: leads.filter(l => l.status === 'Proposta Enviada').length,
    scheduled: leads.filter(l => l.status === 'Agendado').length,
  };
  const getRequestFeedback = (lead: any) => {
    if (lead.requestChecklist?.deliveryCompleted) return { label: 'Entrega concluída', color: 'bg-green-500/10 text-green-500 border-green-500/20' };
    if (!lead.requestChecklist?.briefingReceived) return { label: 'Briefing incompleto', color: 'bg-rose-500/10 text-rose-500 border-rose-500/20' };
    if (!lead.requestChecklist?.filesReceived) return { label: 'Aguardando arquivos', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' };
    if (!lead.requestChecklist?.diagnosisDone) return { label: 'Pronto para diagnóstico', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20' };
    if (!lead.requestChecklist?.proposalSent) return { label: 'Pronto para proposta', color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' };
    if (!lead.requestChecklist?.serviceScheduled) return { label: 'Pronto para agendamento', color: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20' };
    return { label: 'Em execução', color: 'bg-primary/10 text-primary border-primary/20' };
  };

  const calculateProgress = (lead: any) => {
    const checklist = lead.requestChecklist || {};
    const steps = [
      checklist.briefingReceived,
      checklist.filesReceived,
      checklist.diagnosisDone,
      checklist.proposalSent,
      checklist.serviceScheduled,
      checklist.deliveryCompleted
    ];
    const completed = steps.filter(Boolean).length;
    return Math.round((completed / steps.length) * 100);
  };

  const incompleteBriefings = serviceRequests.filter(l => !l.requestChecklist?.briefingReceived);
  const waitingFiles = serviceRequests.filter(l => l.requestChecklist?.briefingReceived && !l.requestChecklist?.filesReceived);
  const readyForDiagnosis = serviceRequests.filter(l => l.requestChecklist?.briefingReceived && l.requestChecklist?.filesReceived && !l.requestChecklist?.diagnosisDone);

  return (
    <div className="container mx-auto py-8 space-y-8 animate-in fade-in duration-500">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Documentação de Entregas</h1>
            <p className="text-muted-foreground">Área de briefing, requisitos e solicitações de serviços.</p>
          </div>

          <TabsList className="grid w-full md:w-auto grid-cols-2">
            <TabsTrigger value="catalog">Catálogo</TabsTrigger>
            <TabsTrigger value="internal">Painel Interno</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="catalog" className="space-y-6 mt-0">

        <div className="flex items-center gap-4 bg-card p-4 rounded-xl border border-white/10 shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar serviço por nome ou categoria..." 
              className="pl-10 h-11 bg-muted/50 border-white/5"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" className="h-11 px-4 gap-2 border-white/10">
            <ListFilter className="h-4 w-4" /> Filtros
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map(service => (
            <Card key={service.id} className="group overflow-hidden border-white/10 hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/5">
              <div className="h-1.5 w-full bg-muted group-hover:bg-primary/50 transition-colors" />
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <Badge variant="outline" className="mb-2 text-[10px] uppercase tracking-wider font-bold">
                    {service.category}
                  </Badge>
                  <Badge className={service.status === 'Ativo' ? "bg-success/10 text-success border-success/20" : "bg-muted text-muted-foreground"}>
                    {service.status}
                  </Badge>
                </div>
                <CardTitle className="text-xl group-hover:text-primary transition-colors">
                  {service.name}
                </CardTitle>
                <CardDescription className="line-clamp-2 text-xs">
                  {service.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 p-2 rounded-lg">
                    <Clock className="h-3 w-3" />
                    <span className="font-medium">{service.deliveryTime}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-primary bg-primary/5 p-2 rounded-lg border border-primary/10">
                    <Zap className="h-3 w-3" />
                    <span className="font-bold">{service.price}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <FileSearch className="h-3 w-3" /> Formato Final
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {service.deliveryInfo?.deliveryFormat.map((format, i) => (
                      <Badge key={i} variant="secondary" className="text-[9px] h-4 bg-muted/50 border-white/5">
                        {format}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <Button asChild variant="secondary" className="w-full gap-2 h-10 border-white/5">
                    <Link to="/servicos/detalhes/$serviceId" params={{ serviceId: service.id }}>
                      <Eye className="h-4 w-4" /> Ver Requisitos
                    </Link>
                  </Button>
                  <Button asChild className="w-full gap-2 h-10 shadow-md shadow-primary/10">
                    <Link to="/servicos/detalhes/$serviceId" params={{ serviceId: service.id }}>
                      <Send className="h-4 w-4" /> Solicitar Serviço
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="internal" className="space-y-8 mt-0">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-card/30 backdrop-blur-sm p-5 rounded-2xl border border-white/5 shadow-2xl">
          <div className="flex flex-col sm:flex-row items-center gap-6 w-full md:w-auto">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-black text-sm uppercase tracking-tighter">Prazos</h3>
            </div>
            <div className="flex gap-1 bg-black/40 p-1.5 rounded-xl border border-white/5 w-full sm:w-auto">
              {[
                { id: 'all', label: 'Todos' },
                { id: 'today', label: 'Hoje' },
                { id: 'week', label: 'Semana' },
                { id: 'overdue', label: 'Atrasados' }
              ].map((f) => (
                <Button 
                  key={f.id}
                  variant={dateFilter === f.id ? 'default' : 'ghost'} 
                  size="sm" 
                  onClick={() => setDateFilter(f.id as any)}
                  className={`flex-1 sm:flex-none text-[10px] h-8 rounded-lg px-4 font-black transition-all ${
                    dateFilter === 'overdue' && f.id === 'overdue' 
                    ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/20' 
                    : dateFilter === f.id ? 'shadow-lg shadow-primary/20' : 'text-muted-foreground hover:bg-white/5'
                  }`}
                >
                  {f.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 w-full md:w-auto sm:border-l border-white/5 sm:pl-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                <ListFilter className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-black text-sm uppercase tracking-tighter">Filtro</h3>
            </div>
            <div className="relative w-full sm:w-48">
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-black/40 border border-white/5 rounded-xl h-11 px-4 text-[11px] font-black appearance-none focus:ring-2 ring-primary/50 outline-none transition-all cursor-pointer hover:bg-black/60"
              >
                <option value="all">TODOS OS STATUS</option>
                <option value="Recebido">RECEBIDOS</option>
                <option value="Em Diagnóstico">EM DIAGNÓSTICO</option>
                <option value="Proposta Enviada">PROPOSTAS</option>
                <option value="Agendado">AGENDADOS</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                <ArrowRight className="h-3 w-3 rotate-90" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Recebido', count: statusCounts.received, color: 'text-slate-500', icon: Package },
            { label: 'Em Diagnóstico', count: statusCounts.diagnostic, color: 'text-amber-500', icon: AlertCircle },
            { label: 'Proposta Enviada', count: statusCounts.proposal, color: 'text-blue-500', icon: FileSearch },
            { label: 'Agendado', count: statusCounts.scheduled, color: 'text-success', icon: CheckCircle2 },
          ].map((status) => (
            <Card key={status.label} className="bg-card border-white/5 relative overflow-hidden group">
              <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform ${status.color}`}>
                <status.icon className="h-12 w-12" />
              </div>
              <CardContent className="pt-6">
                <div className="text-2xl font-black">{status.count}</div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">
                  {status.label}
                </div>
                <div className="mt-4 h-1 w-full bg-muted rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ${status.color.replace('text-', 'bg-')}`} 
                    style={{ width: `${serviceRequests.length ? (status.count / serviceRequests.length) * 100 : 0}%` }} 
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <Package className="h-5 w-5 text-primary" />
                <Badge variant="outline" className="bg-primary/10 border-primary/20">Total</Badge>
              </div>
              <div className="text-2xl font-black">{serviceRequests.length}</div>
              <div className="text-xs text-muted-foreground">Solicitações Ativas</div>
            </CardContent>
          </Card>
          
          <Card className="bg-amber-500/5 border-amber-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                <Badge variant="outline" className="bg-amber-500/10 border-amber-500/20 text-amber-500">Atenção</Badge>
              </div>
              <div className="text-2xl font-black">{incompleteBriefings.length}</div>
              <div className="text-xs text-muted-foreground">Briefings Incompletos</div>
            </CardContent>
          </Card>

          <Card className="bg-blue-500/5 border-blue-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <FileSearch className="h-5 w-5 text-blue-500" />
                <Badge variant="outline" className="bg-blue-500/10 border-blue-500/20 text-blue-500">Pendente</Badge>
              </div>
              <div className="text-2xl font-black">{waitingFiles.length}</div>
              <div className="text-xs text-muted-foreground">Aguardando Arquivos</div>
            </CardContent>
          </Card>

          <Card className="bg-success/5 border-success/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <Badge variant="outline" className="bg-success/10 border-success/20 text-success">Pronto</Badge>
              </div>
              <div className="text-2xl font-black">{readyForDiagnosis.length}</div>
              <div className="text-xs text-muted-foreground">Pronto para Diagnóstico</div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-2 mb-2">
          <Button 
            variant={viewMode === 'list' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setViewMode('list')}
            className="gap-2 text-[11px] font-bold"
          >
            <ListFilter className="h-3 w-3" /> Lista
          </Button>
          <Button 
            variant={viewMode === 'calendar' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setViewMode('calendar')}
            className="gap-2 text-[11px] font-bold"
          >
            <Calendar className="h-3 w-3" /> Calendário
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          <Card className="lg:col-span-2 border-white/10">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-lg">Solicitações Recentes</CardTitle>
                <CardDescription>Acompanhe o status e checklist de cada pedido.</CardDescription>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-rose-500 bg-rose-500/10 px-2 py-1 rounded-full border border-rose-500/20">
                <AlertCircle className="h-3 w-3" /> 3 serviços com entrega próxima
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {viewMode === 'list' ? (
                  serviceRequests.length > 0 ? (
                    serviceRequests.map((request) => (
                      <div key={request.id} className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-muted/20">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <div className="font-bold text-sm">{request.companyName}</div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <div className="w-24 h-1 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-primary" style={{ width: `${calculateProgress(request)}%` }} />
                              </div>
                              <span className="text-[9px] font-bold text-muted-foreground">{calculateProgress(request)}%</span>
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">{request.niche} • {new Date(request.createdAt).toLocaleDateString()}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          {(() => {
                            const feedback = getRequestFeedback(request);
                            return (
                              <Badge className={`${feedback.color} border shadow-none text-[9px] font-black uppercase`}>
                                {feedback.label}
                              </Badge>
                            );
                          })()}
                          <Badge className="bg-muted text-muted-foreground border-white/5 text-[9px] font-bold">
                            {request.status}
                          </Badge>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full border border-white/5" onClick={() => setSelectedRequest(request)}>
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <LayoutGrid className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <p>Nenhuma solicitação encontrada.</p>
                    </div>
                  )
                ) : (
                  <div className="grid grid-cols-7 gap-2">
                    {/* Header dias da semana */}
                    {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(dia => (
                      <div key={dia} className="text-center text-[10px] font-bold text-muted-foreground uppercase pb-2">{dia}</div>
                    ))}
                    {/* Mock de dias do mês atual */}
                    {Array.from({ length: 31 }).map((_, i) => {
                      const dia = i + 1;
                      const hasItems = serviceRequests.filter(r => new Date(r.createdAt).getDate() === dia);
                      return (
                        <div key={i} className={`min-h-[80px] p-1 rounded-lg border border-white/5 bg-muted/10 flex flex-col gap-1 hover:border-primary/30 transition-colors`}>
                          <span className="text-[9px] font-bold opacity-50 ml-1">{dia}</span>
                          {hasItems.slice(0, 3).map((item, idx) => (
                            <div 
                              key={idx} 
                              className={`text-[8px] p-1 rounded leading-tight truncate font-bold cursor-pointer ${
                                item.requestChecklist?.deliveryCompleted ? 'bg-green-500/20 text-green-500' : 'bg-primary/20 text-primary'
                              }`}
                              title={item.companyName}
                              onClick={() => setSelectedRequest(item)}
                            >
                              {item.companyName}
                            </div>
                          ))}
                          {hasItems.length > 3 && (
                            <div className="text-[8px] text-center font-bold text-muted-foreground">+{hasItems.length - 3} mais</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </CardContent>
          </Card>

          <Card className="border-white/10">
            <CardHeader>
              <CardTitle className="text-lg">Insights de Demanda</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium text-muted-foreground">Mais Solicitados</span>
                  <span className="text-primary font-bold">Volume</span>
                </div>
                <div className="space-y-3">
                  {services.slice(0, 3).map((s, i) => {
                    const volume = Math.floor(Math.random() * 15) + 5;
                    const completionRate = 85 - (i * 10);
                    return (
                      <div key={i} className="space-y-1 p-3 rounded-xl border border-white/5 hover:bg-muted/50 transition-all group/item">
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="font-bold group-hover/item:text-primary transition-colors">{s.name}</span>
                          <span className="text-primary font-black">{volume} pedidos</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary group-hover/item:opacity-80 transition-all" style={{ width: `${completionRate}%` }} />
                          </div>
                          <span className="text-[9px] font-bold text-muted-foreground">{completionRate}% SUCESSO</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-white/5">
                <div className="flex items-center gap-2 text-xs font-bold uppercase text-amber-500 mb-3">
                  <AlertCircle className="h-3 w-3" /> Sem resposta &gt; 48h
                </div>
                <div className="space-y-2 text-[11px] text-muted-foreground">
                  <p>• Lead: Clínica Sorriso - Catalogo IA</p>
                  <p>• Lead: Advocacia Rocha - Mini Site</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recommendations / Cross-selling Mock */}
          {serviceRequests.length > 0 && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" /> Sugestões Inteligentes (Cross-sell)
                </CardTitle>
                <CardDescription className="text-xs">Baseado no interesse de: {serviceRequests[0].companyName}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {getRecommendedServices(serviceRequests[0]).map(s => (
                  <div key={s.id} className="flex items-center justify-between p-2 rounded-lg bg-background border border-white/5">
                    <span className="text-[11px] font-medium">{s.name}</span>
                    <Button size="sm" variant="ghost" className="h-7 text-[10px] text-primary font-bold">Ver Oferta</Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </TabsContent>
      </Tabs>

      <StatusNotesDialog 
        lead={selectedRequest} 
        open={!!selectedRequest} 
        onOpenChange={(open) => !open && setSelectedRequest(null)} 
      />
    </div>
  );
};

export default DeliveryDocumentationPage;

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Clock, 
  CheckCircle2, 
  Zap, 
  Package, 
  MessageSquare, 
  ShoppingCart,
  Layout,
  Info,
  Layers,
  Star,
  FileText,
  Heart,
  Send,
  Download,
  Phone,
  ListFilter,
  AlertCircle,
  Save,
  Calendar
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link, useParams, useNavigate } from '@tanstack/react-router';
import { useServicesStore, ServiceBase } from '../services-store';
import { useProspectingStore } from '../../prospecting/prospecting-store';
import { toast } from "sonner";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const ServiceDetailsPage: React.FC = () => {
  const { serviceId } = useParams({ from: '/servicos/detalhes/$serviceId' });
  const navigate = useNavigate();
  const { services, recordInterest } = useServicesStore();
  const { addLead } = useProspectingStore();
  
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Briefing form state
  const [briefingData, setBriefingData] = useState<Record<string, any>>({});

  const service = services.find(s => s.id === serviceId);

  if (!service) {
    return (
      <div className="container mx-auto py-24 text-center space-y-6 animate-in fade-in duration-500">
        <div className="mx-auto w-24 h-24 bg-rose-500/10 rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="h-12 w-12 text-rose-500" />
        </div>
        <div className="max-w-md mx-auto space-y-2">
          <h2 className="text-3xl font-black tracking-tighter uppercase">Serviço não encontrado</h2>
          <p className="text-muted-foreground text-sm">
            O link que você acessou pode estar expirado ou o serviço não está mais disponível no catálogo atual.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Button 
            className="w-full sm:w-auto px-8 h-12 rounded-xl font-bold shadow-lg shadow-primary/20" 
            onClick={() => navigate({ to: '/servicos/avulsos' })}
          >
            Voltar para o Catálogo
          </Button>
          <Button 
            variant="outline"
            className="w-full sm:w-auto px-8 h-12 rounded-xl font-bold border-white/10"
            onClick={() => window.location.reload()}
          >
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  const handleCreateOpportunity = (type: 'direct' | 'interest' | 'contact' | 'briefing' = 'direct') => {
    const sourceMap = {
      direct: 'Contratação Direta (Página Detalhes)',
      interest: 'Registro de Interesse (Página Detalhes)',
      contact: 'Formulário de Contato (Página Detalhes)',
      briefing: 'Solicitação via Briefing (Aba Briefing)'
    };

    const statusMap = {
      direct: 'Proposta Enviada',
      interest: 'Lead Gerado',
      contact: 'Em Diagnóstico',
      briefing: 'Recebido'
    };

    const isBriefing = type === 'briefing';
    const newLeadId = Math.random().toString(36).substr(2, 9);
    
    const newLead = {
      id: newLeadId,
      companyName: isBriefing ? (briefingData['Nome da empresa'] || briefingData['Nome'] || `Oportunidade: ${service.name}`) : (type === 'contact' ? contactForm.name : (type === 'direct' ? `Oportunidade: ${service.name}` : `Interesse: ${service.name}`)),
      email: isBriefing ? briefingData['E-mail'] : (type === 'contact' ? contactForm.email : undefined),
      whatsapp: isBriefing ? briefingData['WhatsApp'] : (type === 'contact' ? contactForm.phone : undefined),
      niche: service.category,
      city: '-',
      status: (statusMap[type] || 'Lead Gerado') as any,
      opportunityScore: (type === 'direct' || type === 'briefing') ? 95 : 85,
      opportunityLevel: (type === 'direct' || type === 'briefing') ? 'quente' : 'boa' as any,
      diagnosis: isBriefing 
        ? `SOLICITAÇÃO DE SERVIÇO: ${service.name}\n\nBriefing:\n${Object.entries(briefingData).map(([k, v]) => `${k}: ${v}`).join('\n')}`
        : (type === 'contact' 
          ? `Mensagem: ${contactForm.message}\nInteresse no serviço: ${service.name}`
          : (type === 'direct' ? `Interesse direto na contratação do serviço: ${service.name}.` : `Usuário registrou interesse no serviço: ${service.name}.`)),
      source: sourceMap[type] || 'Página de Detalhes',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      requestChecklist: isBriefing ? {
        briefingReceived: true,
        filesReceived: briefingData['Arquivo anexado'] === 'Arquivo anexado',
        diagnosisDone: false,
        proposalSent: false,
        serviceScheduled: false,
        deliveryCompleted: false
      } : undefined,
      statusNotes: isBriefing ? [
        {
          id: crypto.randomUUID(),
          status: 'Recebido',
          message: 'Solicitação de serviço recebida via formulário de briefing.',
          attachments: [],
          createdAt: new Date().toISOString(),
          kind: 'system'
        }
      ] : [],
    };
    
    // @ts-ignore
    addLead(newLead);
    
    if (type === 'interest') {
      recordInterest(service.id);
      toast.success(`Interesse registrado para ${service.name}! Nossa equipe entrará em contato.`);
    } else if (type === 'contact') {
      toast.success(`Mensagem enviada! Um consultor analisará seu pedido para ${service.name}.`);
    } else if (isBriefing) {
      toast.success(`Solicitação enviada com sucesso! O serviço "${service.name}" foi registrado no CRM.`);
      navigate({ to: '/crm' });
    } else {
      toast.success(`Oportunidade criada para "${service.name}"!`);
      navigate({ to: '/crm' });
    }
  };

  const handleGeneratePDF = () => {
    setIsGeneratingPdf(true);
    toast.loading("Gerando proposta personalizada em PDF...", { id: "gen-pdf" });
    
    setTimeout(() => {
      toast.success("PDF da proposta gerado com sucesso!", { id: "gen-pdf" });
      setIsGeneratingPdf(false);
      
      const link = document.createElement('a');
      link.href = '#';
      link.setAttribute('download', `proposta-${service.name.toLowerCase().replace(/\s+/g, '-')}.pdf`);
      document.body.appendChild(link);
      document.body.removeChild(link);
    }, 2000);
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsContactDialogOpen(false);
    handleCreateOpportunity('contact');
    setContactForm({ name: '', email: '', phone: '', message: '' });
  };

  const handleBriefingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleCreateOpportunity('briefing');
  };

  const handleSaveDraft = () => {
    toast.success("Rascunho salvo com sucesso! Você pode continuar depois.");
    // In a real app, we'd save this to a 'drafts' collection in the store
  };

  const isFormValid = () => {
    if (!briefingData['Nome da empresa'] || !briefingData['WhatsApp'] || !briefingData['E-mail']) return false;
    const requirements = service.deliveryInfo?.whatWeNeed || [];
    return requirements.every(req => !req.required || !!briefingData[req.label]);
  };

  return (
    <div className="container mx-auto py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => window.history.back()} className="rounded-full h-10 w-10 border border-white/5 bg-background/50 backdrop-blur-sm">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{service.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/10">
                  {service.category}
                </Badge>
                {service.isIA && (
                  <Badge className="bg-purple-500 hover:bg-purple-600 gap-1 border-none">
                    <Zap className="h-3 w-3 fill-white" /> IA Enhanced
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <TabsList className="grid w-full md:w-auto grid-cols-2">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="briefing">Briefing & Entrega</TabsTrigger>
          </TabsList>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <TabsContent value="overview" className="mt-0 space-y-8">
              <Card className="border-white/10 bg-card overflow-hidden">
                <CardHeader className="border-b border-white/5 bg-muted/20">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Info className="h-5 w-5 text-primary" />
                    Descrição Completa
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {service.fullDescription || service.description || "Nenhuma descrição detalhada fornecida para este serviço ainda."}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-card overflow-hidden">
                <CardHeader className="border-b border-white/5 bg-muted/20">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Layers className="h-5 w-5 text-primary" />
                    Como funciona
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {service.howItWorks || "Nosso processo de entrega é otimizado para garantir qualidade e agilidade. Entre em contato para saber mais detalhes sobre o workflow deste serviço específico."}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-card overflow-hidden">
                <CardHeader className="border-b border-white/5 bg-muted/20">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Star className="h-5 w-5 text-primary" />
                    Principais Benefícios
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(service.benefits && service.benefits.length > 0) ? (
                      service.benefits.map((benefit, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10">
                          <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                          <span className="text-sm font-medium">{benefit}</span>
                        </div>
                      ))
                    ) : (
                      <>
                        <div className="flex items-start gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10">
                          <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                          <span className="text-sm font-medium">Entrega rápida e profissional</span>
                        </div>
                        <div className="flex items-start gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10">
                          <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                          <span className="text-sm font-medium">Suporte especializado</span>
                        </div>
                        <div className="flex items-start gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10">
                          <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                          <span className="text-sm font-medium">Melhor custo-benefício do mercado</span>
                        </div>
                        <div className="flex items-start gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10">
                          <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                          <span className="text-sm font-medium">Garantia de satisfação Infinda</span>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="briefing" className="mt-0 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-white/10 bg-card">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Package className="h-5 w-5 text-primary" /> O que será entregue
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {service.deliveryInfo?.whatIsDelivered.map((item, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="h-4 w-4 text-success" /> {item}
                        </li>
                      )) || (
                        <>
                          <li className="flex items-center gap-2 text-sm text-muted-foreground"><CheckCircle2 className="h-4 w-4 text-success" /> PDF Final</li>
                          <li className="flex items-center gap-2 text-sm text-muted-foreground"><CheckCircle2 className="h-4 w-4 text-success" /> Imagens em alta resolução</li>
                          <li className="flex items-center gap-2 text-sm text-muted-foreground"><CheckCircle2 className="h-4 w-4 text-success" /> Arquivo editável (se aplicável)</li>
                        </>
                      )}
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-white/10 bg-card">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Clock className="h-5 w-5 text-primary" /> Prazo & Formato
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">Prazo estimado</Label>
                      <div className="text-sm font-medium">{service.deliveryInfo?.estimatedTime || service.deliveryTime}</div>
                    </div>
                    <div>
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">Formato da entrega</Label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {service.deliveryInfo?.deliveryFormat.map((f, i) => (
                          <Badge key={i} variant="outline" className="bg-muted/50 border-white/5">{f}</Badge>
                        )) || <Badge variant="outline">PDF</Badge>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-white/10 bg-card shadow-xl shadow-primary/5">
                <CardHeader className="bg-primary/5 border-b border-white/5">
                  <CardTitle className="text-xl">Formulário de Solicitação</CardTitle>
                  <CardDescription>Preencha os dados abaixo para iniciar seu projeto de {service.name}.</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <form onSubmit={handleBriefingSubmit} className="space-y-6">
                    <div className="flex flex-wrap gap-2 mb-4 p-2 bg-muted/20 rounded-lg">
                      <Badge variant={briefingData['Nome da empresa'] ? "default" : "outline"} className={`gap-1 ${briefingData['Nome da empresa'] ? "bg-success hover:bg-success/90" : ""}`}>
                        {briefingData['Nome da empresa'] ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />} Identificação
                      </Badge>
                      <Badge variant={briefingData['WhatsApp'] && briefingData['E-mail'] ? "default" : "outline"} className={`gap-1 ${briefingData['WhatsApp'] && briefingData['E-mail'] ? "bg-success hover:bg-success/90" : ""}`}>
                        {briefingData['WhatsApp'] && briefingData['E-mail'] ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />} Contato
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label>Nome do cliente/empresa *</Label>
                        <Input 
                          required 
                          placeholder="Nome para o projeto" 
                          onChange={e => setBriefingData({...briefingData, 'Nome da empresa': e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>WhatsApp *</Label>
                        <Input 
                          required 
                          placeholder="(00) 00000-0000"
                          onChange={e => setBriefingData({...briefingData, 'WhatsApp': e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>E-mail *</Label>
                        <Input 
                          required 
                          type="email" 
                          placeholder="seu@email.com"
                          onChange={e => setBriefingData({...briefingData, 'E-mail': e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Prazo desejado</Label>
                        <Input 
                          placeholder="Ex: O mais rápido possível"
                          onChange={e => setBriefingData({...briefingData, 'Prazo desejado': e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-white/5">
                      <h3 className="font-bold text-md flex items-center gap-2">
                        <ListFilter className="h-4 w-4 text-primary" /> Checklist de Requisitos
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {service.deliveryInfo?.whatWeNeed.map((req) => (
                          <div key={req.id} className="space-y-2">
                            <Label className="flex items-center gap-1">
                              {req.label} {req.required && <span className="text-destructive">*</span>}
                            </Label>
                            {req.type === 'text' && (
                              <Input 
                                required={req.required}
                                placeholder={`Informe ${req.label.toLowerCase()}`}
                                onChange={e => setBriefingData({...briefingData, [req.label]: e.target.value})}
                              />
                            )}
                            {req.type === 'file' && (
                              <div className="flex items-center gap-2">
                                <Input 
                                  type="file" 
                                  required={req.required}
                                  className="bg-muted/30 cursor-pointer"
                                  onChange={e => setBriefingData({...briefingData, [req.label]: 'Arquivo anexado'})}
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Objetivo do serviço / Observações</Label>
                      <Textarea 
                        placeholder="Descreva o que espera deste serviço..." 
                        className="min-h-[100px]"
                        onChange={e => setBriefingData({...briefingData, 'Observações': e.target.value})}
                      />
                    </div>

                    {['Consultoria SEO', 'AI Sales Assistant'].includes(service.name) && (
                      <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-3">
                        <h4 className="text-sm font-bold flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-primary" /> Agendamento de Call Inicial
                        </h4>
                        <p className="text-xs text-muted-foreground">Este serviço requer uma reunião estratégica inicial. Escolha uma data preferencial:</p>
                        <Input type="datetime-local" className="bg-background" onChange={e => setBriefingData({...briefingData, 'Data Reunião': e.target.value})} />
                      </div>
                    )}

                    <div className="pt-4 flex flex-col sm:flex-row gap-3">
                      <Button type="submit" className="flex-1 h-12 text-lg font-bold gap-2 shadow-xl shadow-primary/20">
                        <Send className="h-5 w-5" /> Solicitar este Serviço
                      </Button>
                      <Button type="button" variant="outline" onClick={handleSaveDraft} className="h-12 gap-2 border-white/10">
                        <Save className="h-5 w-5" /> Salvar Rascunho
                      </Button>
                    </div>
                    <p className="text-[10px] text-center text-muted-foreground mt-3 uppercase tracking-widest font-bold">
                      Uma nova oportunidade será gerada automaticamente no CRM
                    </p>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </div>

          <div className="space-y-6">
            <Card className="border-primary/20 bg-card/50 backdrop-blur-md sticky top-24 overflow-hidden border-2">
              <div className="h-2 w-full bg-primary" />
              <CardHeader className="p-6 pb-2">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Investimento Sugerido</CardTitle>
                <div className="text-4xl font-black text-primary mt-2">{service.price}</div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm py-3 border-b border-white/5">
                    <div className="flex items-center gap-2 text-muted-foreground font-medium">
                      <Clock className="h-4 w-4" /> Prazo de entrega
                    </div>
                    <span className="font-bold text-foreground">{service.deliveryTime}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm py-3 border-b border-white/5">
                    <div className="flex items-center gap-2 text-muted-foreground font-medium">
                      <Package className="h-4 w-4" /> Tipo
                    </div>
                    <span className="font-bold text-foreground">{service.isIA ? 'Microserviço IA' : 'Serviço Avulso'}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button className="w-full h-12 rounded-xl text-md font-bold shadow-xl shadow-primary/20 gap-2" onClick={() => handleCreateOpportunity('direct')}>
                    <ShoppingCart className="h-5 w-5" /> Contratar Agora
                  </Button>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="h-12 rounded-xl text-sm font-bold border-white/10 gap-2">
                          <MessageSquare className="h-4 w-4" /> Contato
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px] bg-card border-white/10">
                        <DialogHeader>
                          <DialogTitle>Entrar em Contato</DialogTitle>
                          <DialogDescription>
                            Dúvidas sobre o serviço "{service.name}"? Envie sua mensagem.
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleContactSubmit} className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="name">Seu Nome</Label>
                            <Input 
                              id="name" 
                              placeholder="Ex: João Silva" 
                              required 
                              value={contactForm.name}
                              onChange={e => setContactForm({...contactForm, name: e.target.value})}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="email">E-mail</Label>
                            <Input 
                              id="email" 
                              type="email" 
                              placeholder="exemplo@email.com" 
                              required 
                              value={contactForm.email}
                              onChange={e => setContactForm({...contactForm, email: e.target.value})}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="phone">WhatsApp</Label>
                            <Input 
                              id="phone" 
                              type="tel" 
                              placeholder="(00) 00000-0000" 
                              required 
                              value={contactForm.phone}
                              onChange={e => setContactForm({...contactForm, phone: e.target.value})}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="message">Sua Mensagem</Label>
                            <Textarea 
                              id="message" 
                              placeholder="Como podemos personalizar este serviço para você?" 
                              required 
                              className="min-h-[100px] rounded-xl"
                              value={contactForm.message}
                              onChange={e => setContactForm({...contactForm, message: e.target.value})}
                            />
                          </div>
                          <DialogFooter>
                            <Button type="submit" className="w-full gap-2">
                              <Send className="h-4 w-4" /> Enviar Mensagem
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>

                    <Button 
                      variant="outline" 
                      className="h-12 rounded-xl text-sm font-bold border-white/10 gap-2 hover:bg-primary/5 hover:text-primary transition-all"
                      onClick={handleGeneratePDF}
                      disabled={isGeneratingPdf}
                    >
                      {isGeneratingPdf ? <Clock className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} 
                      PDF Proposta
                    </Button>
                  </div>

                  <Button 
                    variant="ghost" 
                    className="w-full h-12 rounded-xl text-sm font-bold hover:bg-primary/10 hover:text-primary gap-2"
                    onClick={() => handleCreateOpportunity('interest')}
                  >
                    <Heart className="h-4 w-4" /> Tenho Interesse
                  </Button>
                </div>

                <div className="p-4 rounded-xl bg-muted/50 border border-white/5">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground mb-2">
                    <Zap className="h-3 w-3 text-primary fill-primary" /> Selo de Qualidade
                  </div>
                  <p className="text-xs text-muted-foreground italic leading-relaxed">
                    Este serviço segue os padrões de excelência da Infinda Digital, com entrega garantida e suporte especializado.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Tabs>

    </div>
  );
};

export default ServiceDetailsPage;

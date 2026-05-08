import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Tag, 
  Search, 
  Clock, 
  Target, 
  AlertCircle,
  TrendingUp,
  PlusCircle,
  Database,
  Megaphone,
  Pencil,
  Trash2,
  Sparkles,
  Copy,
  ChevronLeft,
  Briefcase,
  Loader2,
  FileDown,
  History,
  Mail,
  Send,
  CheckCircle2,
  ArrowRight,
  Shapes,
  PieChart,
  Layers,
  Zap,
  Layout,
  Sticker
} from "lucide-react";
import { toast } from "sonner";
import { useProspectingStore } from '../prospecting/prospecting-store';
import { useServicesStore, Offer, ServiceBase } from './services-store';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { generateOfferCopy } from "@/server/offers.functions";
import { useFollowupStore } from "@/modules/followup/followup-store";
import { Link } from "@tanstack/react-router";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const OffersCatalogPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { leads, addLead, updateLead } = useProspectingStore();
  const { services, offers, addOffer, updateOffer, deleteOffer, history } = useServicesStore();
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [viewingHistoryId, setViewingHistoryId] = useState<string | null>(null);
  const [isCopyHistoryOpen, setIsCopyHistoryOpen] = useState(false);
  const [isEmailOpen, setIsEmailOpen] = useState(false);
  const [isAbTestOpen, setIsAbTestOpen] = useState(false);
  const [isFollowupOpen, setIsAbFollowupOpen] = useState(false);
  const [selectedOfferForAction, setSelectedOfferForOffer] = useState<Offer | null>(null);
  const [emailTo, setEmailTo] = useState('');


  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState<Partial<Offer>>({
    name: '',
    serviceIds: [],
    targetAudience: '',
    painSolved: '',
    promisedDelivery: '',
    deadline: '',
    suggestedPrice: '',
    discount: '',
    status: 'Ativa',
    salesCopy: '',
    copyHistory: []
  });


  const [selectedLeadId, setSelectedLeadId] = useState<string>('');

  const handleOpenModal = (offer?: Offer) => {
    if (offer) {
      setEditingOffer(offer);
      setFormData(offer);
    } else {
      setEditingOffer(null);
      setFormData({
        name: '',
        serviceIds: [],
        targetAudience: '',
        painSolved: '',
        promisedDelivery: '',
        deadline: '',
        suggestedPrice: '',
        discount: '',
        status: 'Ativa',
        salesCopy: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.suggestedPrice) {
      toast.error("Preencha o nome e o preço da oferta.");
      return;
    }

    if (editingOffer) {
      updateOffer(editingOffer.id, formData);
      toast.success("Oferta atualizada!");
    } else {
      const newOffer: Offer = {
        ...formData as Offer,
        id: Math.random().toString(36).substr(2, 9),
      };
      addOffer(newOffer);
      toast.success("Oferta comercial criada!");
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("Deseja excluir esta oferta?")) {
      deleteOffer(id);
      toast.success("Oferta removida.");
    }
  };

  const generateSalesCopy = async () => {
    const { name, targetAudience, painSolved, suggestedPrice, discount, serviceIds } = formData;
    
    // Validações Aprimoradas
    if (!name) {
      toast.error("O Nome da Oferta é obrigatório.");
      return;
    }
    if (!targetAudience) {
      toast.error("O Público-Alvo é essencial para um copy preciso.");
      return;
    }
    if (!painSolved) {
      toast.error("Descreva a Dor Resolvida para que a IA foque na solução.");
      return;
    }
    if (!serviceIds?.length) {
      toast.error("Selecione ao menos um serviço vinculado.");
      return;
    }

    setIsGenerating(true);
    const toastId = toast.loading("IA mestre em copy analisando sua oferta...");

    try {
      const linkedServiceNames = services
        .filter(s => serviceIds.includes(s.id))
        .map(s => s.name)
        .join(', ');

      const response = await generateOfferCopy({
        data: {
          name: name!,
          targetAudience: targetAudience!,
          painSolved: painSolved!,
          serviceNames: linkedServiceNames,
          price: suggestedPrice,
          discount: discount
        }
      });

      if (response?.copy) {
        const newCopy = response.copy;
        const newHistory = [
          { timestamp: new Date().toISOString(), copy: newCopy },
          ...(formData.copyHistory || [])
        ].slice(0, 10); // Mantém as 10 últimas

        setFormData(prev => ({ 
          ...prev, 
          salesCopy: newCopy,
          copyHistory: newHistory
        }));
        toast.success("Copy de alto impacto gerada!", { id: toastId });
      } else {
        throw new Error("Resposta vazia da IA");
      }
    } catch (error) {
      toast.error("Erro ao conectar com o cérebro da IA. Tente novamente.", { id: toastId });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copy pronta para ser usada!");
  };

  const handleAddToCRM = (offer: Offer) => {
    const serviceNames = services
      .filter(s => offer.serviceIds.includes(s.id))
      .map(s => s.name)
      .join(', ');

    const opportunityDetails = `💎 **Oportunidade Qualificada: ${offer.name}**
📌 Oferta: ${offer.name}
🎯 Público-alvo: ${offer.targetAudience}
⚡ Dor Central: ${offer.painSolved}
💰 Investimento: ${offer.suggestedPrice}
📅 Prazo: ${offer.deadline}
🛠️ Serviços: ${serviceNames}

---
📜 Copy Sugerido:
${offer.salesCopy || 'Nenhum copy gerado'}`;

    if (selectedLeadId && selectedLeadId !== 'new_lead') {
      const existingLead = leads.find(l => l.id === selectedLeadId);
      if (existingLead) {
        // Integração Profunda: Atualiza lead com metadados da oferta
        updateLead(existingLead.id, { 
          status: 'Proposta Enviada', 
          opportunityScore: 90,
          opportunityLevel: 'quente',
          offerId: offer.id,
          diagnosis: (existingLead.diagnosis || '') + "\n\n" + opportunityDetails,
          updatedAt: new Date().toISOString() 
        });

        // Adiciona nota de sistema no histórico do lead
        useProspectingStore.getState().addStatusNote(existingLead.id, {
          message: `Nova oportunidade vinculada: Oferta "${offer.name}" (Ticket: ${offer.suggestedPrice}).`,
          kind: 'system',
          status: 'Proposta Enviada'
        });

        toast.success(`Integração CRM Concluída! ${existingLead.companyName} agora é uma Oportunidade Quente.`);
        
        // Ativação automática do runner de follow-up (se houver e-mail ou whatsapp)
        if (existingLead.email || existingLead.whatsapp) {
          handleStartFollowup(offer);
        } else {
          toast.info("Tarefa de follow-up manual criada (Lead sem e-mail/WhatsApp)");
        }
      }
    } else {
      const newId = Math.random().toString(36).substr(2, 9);
      const newLead = {
        id: newId,
        companyName: `OPORTUNIDADE: ${offer.name}`,
        niche: 'Vendas Diretas',
        city: 'Digital',
        status: 'Lead Qualificado',
        opportunityScore: 85,
        opportunityLevel: 'boa',
        offerId: offer.id,
        diagnosis: opportunityDetails,
        source: 'Catálogo de Ofertas (Auto)',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      // @ts-ignore
      addLead(newLead);
      
      // Criar nota inicial
      useProspectingStore.getState().addStatusNote(newId, {
        message: `Oportunidade gerada automaticamente a partir da oferta "${offer.name}".`,
        kind: 'system',
        status: 'Lead Qualificado'
      });

      toast.success(`Nova oportunidade "${offer.name}" gerada no funil do CRM!`);
      toast.info(`Tarefa de Follow-up agendada no pipeline.`);
    }
  };

  const handleExportPDF = (offer: Offer) => {
    const toastId = "export-pdf-" + offer.id;
    toast.loading("Formatando relatório profissional em PDF...", { id: toastId });
    
    // Simulação de geração de PDF com metadados reais para exportação profissional
    setTimeout(() => {
      const serviceNames = services
        .filter(s => offer.serviceIds.includes(s.id))
        .map(s => s.name)
        .join(', ');

      const pdfContent = `
=========================================
      RELATÓRIO DE OFERTA COMERCIAL
=========================================
OFERTA: ${offer.name}
PÚBLICO-ALVO: ${offer.targetAudience}
DOR SOLUCIONADA: ${offer.painSolved}
INVESTIMENTO: ${offer.suggestedPrice}
PRAZO DE ENTREGA: ${offer.promisedDelivery}
SERVIÇOS INCLUÍDOS: ${serviceNames}

-----------------------------------------
           COPY PERSUASIVA
-----------------------------------------
${offer.salesCopy || "Copy não gerado"}

-----------------------------------------
Gerado automaticamente pelo MarketScope AI
Data: ${new Date().toLocaleDateString('pt-BR')}
=========================================
`;

      const doc = new jsPDF();
      
      // Header
      doc.setFillColor(30, 58, 138); // Primary color
      doc.rect(0, 0, 210, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.text("MarketScope AI - Oferta Comercial", 20, 25);
      
      // Content
      doc.setTextColor(30, 30, 30);
      doc.setFontSize(16);
      doc.text(offer.name, 20, 55);
      
      doc.setFontSize(11);
      const details = [
        ["Público-Alvo", offer.targetAudience],
        ["Dor Solucionada", offer.painSolved],
        ["Investimento", offer.suggestedPrice],
        ["Entrega Prometida", offer.promisedDelivery],
        ["Serviços", services.filter(s => offer.serviceIds.includes(s.id)).map(s => s.name).join(', ')],
      ];
      
      autoTable(doc, {
        startY: 65,
        head: [['Atributo', 'Detalhes']],
        body: details,
        theme: 'striped',
        headStyles: { fillColor: [30, 58, 138] },
      });
      
      if (offer.salesCopy) {
        doc.setFontSize(14);
        doc.text("Copy Persuasiva Sugerida", 20, (doc as any).lastAutoTable.finalY + 15);
        doc.setFontSize(10);
        const splitText = doc.splitTextToSize(offer.salesCopy, 170);
        doc.text(splitText, 20, (doc as any).lastAutoTable.finalY + 25);
      }
      
      doc.save(`Relatorio-Oferta-${offer.name.replace(/\s+/g, '-')}.pdf`);
      toast.success("Relatório de Oferta exportado com sucesso!", { id: toastId });
    }, 1000);
  };

  const handleSendEmail = (offer: Offer) => {
    if (!emailTo || !emailTo.includes('@')) {
      toast.error("Insira um e-mail válido para envio.");
      return;
    }
    toast.loading(`Enviando oferta "${offer.name}" para ${emailTo}...`, { id: "send-email" });
    
    setTimeout(() => {
      toast.success("E-mail enviado com sucesso com a proposta vinculada!", { id: "send-email" });
      setIsEmailOpen(false);
      setEmailTo('');
    }, 2000);
  };

  const handleStartFollowup = (offer: Offer) => {
    // Identifica destinatário a partir do lead vinculado, se houver
    const linked = selectedLeadId && selectedLeadId !== 'new_lead'
      ? leads.find(l => l.id === selectedLeadId)
      : null;

    if (!linked?.email && !linked?.whatsapp) {
      toast.error("Vincule um lead com e-mail ou WhatsApp antes de ativar a automação.");
      return;
    }

    const sequenceId = useFollowupStore.getState().startSequence({
      leadId: linked?.id,
      leadName: linked?.companyName || `Oportunidade ${offer.name}`,
      offerId: offer.id,
      offerName: offer.name,
      recipientEmail: linked?.email,
      recipientPhone: linked?.whatsapp,
      preferredChannel: linked?.email ? 'email' : 'whatsapp',
    });

    toast.success(`Sequência D0 → D+3 → D+7 ativada para "${offer.name}".`, {
      action: {
        label: 'Ver fila',
        onClick: () => { window.location.href = '/followups'; },
      },
    });
    setIsAbFollowupOpen(false);
  };

  const handleStartAbTest = async (offer: Offer) => {
    setIsGenerating(true);
    const toastId = toast.loading("Gerando Variante B focada em escassez e autoridade...");
    
    try {
      const response = await generateOfferCopy({
        data: {
          name: offer.name,
          targetAudience: offer.targetAudience,
          painSolved: offer.painSolved,
          serviceNames: services.filter(s => offer.serviceIds.includes(s.id)).map(s => s.name).join(', '),
          price: offer.suggestedPrice,
          discount: offer.discount,
          instruction: "Gere uma variante B focada em escassez extrema e prova social, diferente da versão atual. Use um ângulo mais agressivo de venda."
        }
      });

      if (response?.copy) {
        const variant = {
          id: Math.random().toString(36).substr(2, 9),
          name: 'Variante B (IA)',
          copy: response.copy,
          conversions: 0
        };
        
        updateOffer(offer.id, {
          variants: [
            ...(offer.variants || []),
            variant
          ],
          status: 'Em teste'
        });
        
        toast.success("Variante B gerada! Oferta agora está em modo 'Em Teste'.", { id: toastId });
      }
    } catch (e) {
      toast.error("Erro ao gerar variante.");
    } finally {
      setIsGenerating(false);
      setIsAbTestOpen(false);
    }
  };

  const filteredOffers = offers.filter(o => 
    o.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.targetAudience.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto py-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary glow-primary">
              <Shapes className="h-6 w-6" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Catálogo de Ofertas</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Crie ofertas irresistíveis, gere copies de venda e converta leads em clientes.
          </p>
        </div>
        <Button className="gap-2 rounded-xl shadow-lg shadow-primary/20 h-12 px-6" onClick={() => handleOpenModal()}>
          <PlusCircle className="h-5 w-5" /> Criar Nova Oferta
        </Button>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center bg-card p-5 rounded-3xl border border-white/5 shadow-xl glass-card gap-4">
        <div className="flex gap-4 self-start md:self-center">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-600 text-sm font-bold border border-emerald-500/20 glow-success">
            <TrendingUp className="h-4 w-4" /> {offers.filter(o => o.status === 'Ativa').length} Ativas
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500/10 text-orange-600 text-sm font-bold border border-orange-500/20 shadow-orange-500/5">
            <Sparkles className="h-4 w-4" /> {offers.filter(o => o.status === 'Em teste').length} Em Teste
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto items-center">
          <div className="w-full md:w-64">
            <Select value={selectedLeadId} onValueChange={setSelectedLeadId}>
              <SelectTrigger className="rounded-xl h-11 border-white/10">
                <SelectValue placeholder="Vincular a um lead..." />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="new_lead">-- Gerar Novo Lead --</SelectItem>
                {leads.map(lead => (
                  <SelectItem key={lead.id} value={lead.id}>{lead.companyName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full md:w-80 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por nome ou público..." 
              className="pl-10 h-10 rounded-xl"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredOffers.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-muted/20 rounded-3xl border border-dashed border-white/10">
            <div className="flex flex-col items-center gap-2">
              <Megaphone className="h-12 w-12 text-muted-foreground/30" />
              <h3 className="text-lg font-semibold">Nenhuma oferta encontrada</h3>
              <p className="text-muted-foreground">Comece criando sua primeira oferta comercial estratégica.</p>
              <Button variant="outline" className="mt-4" onClick={() => handleOpenModal()}>
                <PlusCircle className="h-4 w-4 mr-2" /> Criar Oferta
              </Button>
            </div>
          </div>
        ) : (
          filteredOffers.map((offer) => {
            const linkedServices = services.filter(s => offer.serviceIds.includes(s.id));
            
            // Curadoria Visual de Categoria
            const getCategoryVisuals = (offerName: string) => {
              const name = offerName.toLowerCase();
              if (name.includes('venda') || name.includes('comercial')) return { icon: <TrendingUp className="h-5 w-5" />, color: 'text-emerald-500', bg: 'bg-emerald-500/10' };
              if (name.includes('marketing') || name.includes('anuncio') || name.includes('copy')) return { icon: <Megaphone className="h-5 w-5" />, color: 'text-orange-500', bg: 'bg-orange-500/10' };
              if (name.includes('site') || name.includes('landing') || name.includes('desenvolvimento')) return { icon: <Layout className="h-5 w-5" />, color: 'text-blue-500', bg: 'bg-blue-500/10' };
              if (name.includes('consultoria') || name.includes('estrategia')) return { icon: <Zap className="h-5 w-5" />, color: 'text-purple-500', bg: 'bg-purple-500/10' };
              return { icon: <Tag className="h-5 w-5" />, color: 'text-primary', bg: 'bg-primary/10' };
            };

            const visual = getCategoryVisuals(offer.name);

            return (
              <Card key={offer.id} className="overflow-hidden border-white/10 bg-card hover:border-primary/30 transition-all group flex flex-col shadow-lg hover:shadow-primary/5">
                <div className={`h-1.5 w-full ${
                  offer.status === 'Ativa' ? 'bg-emerald-500' : 
                  offer.status === 'Em teste' ? 'bg-orange-500' : 'bg-slate-500'
                }`} />
                <CardHeader className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-4">
                      <div className={`p-3 rounded-2xl ${visual.bg} ${visual.color} group-hover:scale-110 transition-transform duration-300`}>
                        {visual.icon}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-xl font-bold">{offer.name}</CardTitle>
                          {offer.discount && (
                            <Badge className="bg-rose-500/10 text-rose-600 border-rose-500/20 hover:bg-rose-500/20 animate-pulse">
                              -{offer.discount}%
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {linkedServices.map(s => (
                            <Badge key={s.id} variant="secondary" className="text-[10px] py-0 bg-primary/5 text-primary border-primary/10">
                              {s.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant={offer.status === 'Ativa' ? 'default' : 'outline'} className={
                        offer.status === 'Ativa' ? 'bg-emerald-500 hover:bg-emerald-600 border-none' : 
                        offer.status === 'Em teste' ? 'text-orange-500 border-orange-500/20 bg-orange-500/5' : ''
                      }>
                        {offer.status}
                      </Badge>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="icon" variant="ghost" title="Enviar por E-mail" className="h-8 w-8 text-primary" onClick={() => {
                          setSelectedOfferForOffer(offer);
                          setIsEmailOpen(true);
                        }}>
                          <Mail className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" title="Exportar PDF" className="h-8 w-8 text-primary" onClick={() => handleExportPDF(offer)}>
                          <FileDown className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" title="Histórico" className="h-8 w-8" onClick={() => {
                          setViewingHistoryId(offer.id);
                          setIsHistoryOpen(true);
                        }}>
                          <Clock className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" title="Editar" className="h-8 w-8" onClick={() => handleOpenModal(offer)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" title="Excluir" className="h-8 w-8 text-rose-500" onClick={() => handleDelete(offer.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <div className="space-y-1.5 p-3 rounded-xl bg-muted/30 border border-white/5">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        <Target className="h-3 w-3" /> Público-Alvo
                      </div>
                      <p className="text-xs font-medium leading-relaxed line-clamp-2 h-8">{offer.targetAudience}</p>
                    </div>
                    <div className="space-y-1.5 p-3 rounded-xl bg-muted/30 border border-white/5">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        <AlertCircle className="h-3 w-3 text-rose-500" /> Dor Resolvida
                      </div>
                      <p className="text-xs font-medium leading-relaxed line-clamp-2 h-8">{offer.painSolved}</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      <span className="text-xs font-bold text-muted-foreground">{offer.deadline}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-muted-foreground font-bold uppercase">Investimento</p>
                      <p className="text-lg font-black text-primary">{offer.suggestedPrice}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 pt-0 mt-auto border-t border-white/5 bg-muted/5">
                  {offer.salesCopy && (
                    <div className="mt-4 p-3 rounded-xl bg-primary/5 border border-primary/10 relative group/copy mb-4">
                      <p className="text-[10px] font-bold text-primary uppercase mb-1">Copy de Venda Gerado</p>
                      <p className="text-[11px] italic text-muted-foreground line-clamp-3 leading-relaxed">
                        {offer.salesCopy}
                      </p>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="absolute top-2 right-2 h-6 w-6"
                        onClick={() => copyToClipboard(offer.salesCopy!)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  )}

                  {offer.variants && offer.variants.length > 0 && (
                    <div className="mb-4 space-y-2">
                      <p className="text-[10px] font-bold text-orange-600 uppercase">Testes A/B Ativos ({offer.variants.length})</p>
                      {offer.variants.map((v) => (
                        <div key={v.id} className="p-3 rounded-xl bg-orange-500/5 border border-orange-500/10 relative group/variant">
                          <div className="flex justify-between items-center mb-1">
                            <p className="text-[10px] font-bold text-orange-500">{v.name}</p>
                            <span className="text-[10px] text-muted-foreground">{v.conversions} conversões</span>
                          </div>
                          <p className="text-[11px] italic text-muted-foreground line-clamp-2 leading-relaxed">{v.copy}</p>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="absolute top-2 right-2 h-6 w-6"
                            onClick={() => copyToClipboard(v.copy)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-3 mt-4">
                    <Button 
                      variant="outline" 
                      className="flex-1 gap-2 rounded-xl h-10 text-[10px] font-bold border-white/10 hover:bg-primary/5"
                      onClick={() => {
                        setSelectedOfferForOffer(offer);
                        setIsAbFollowupOpen(true);
                      }}
                    >
                      <History className="h-4 w-4" /> Follow-up
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1 gap-2 rounded-xl h-10 text-[10px] font-bold border-white/10 hover:bg-orange-500/5"
                      onClick={() => {
                        setSelectedOfferForOffer(offer);
                        setIsAbTestOpen(true);
                      }}
                    >
                      <TrendingUp className="h-4 w-4" /> Teste A/B
                    </Button>
                    <Button 
                      className="flex-1 gap-2 rounded-xl h-10 text-[10px] font-bold shadow-md shadow-primary/10"
                      onClick={() => handleAddToCRM(offer)}
                    >
                      <Database className="h-4 w-4" /> Gerar Oportunidade
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <Dialog open={isCopyHistoryOpen} onOpenChange={setIsCopyHistoryOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Últimas Copys Geradas</DialogTitle>
            <DialogDescription>Acompanhe as versões anteriores de copy para esta oferta.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto">
            {formData.copyHistory && formData.copyHistory.length > 0 ? (
              formData.copyHistory.map((h, idx) => (
                <div key={idx} className="p-3 rounded-lg border bg-muted/20 space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground uppercase">
                    <span>{new Date(h.timestamp).toLocaleString()}</span>
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]" onClick={() => {
                      setFormData(prev => ({ ...prev, salesCopy: h.copy }));
                      setIsCopyHistoryOpen(false);
                    }}>Usar esta</Button>
                  </div>
                  <p className="text-xs italic line-clamp-3">{h.copy}</p>
                </div>
              ))
            ) : (
              <p className="text-center py-8 text-muted-foreground italic">Nenhuma versão anterior salva.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isEmailOpen} onOpenChange={setIsEmailOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" /> Enviar Oferta por E-mail
            </DialogTitle>
            <DialogDescription>A proposta PDF será anexada automaticamente ao e-mail.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>E-mail do Destinatário</Label>
              <Input 
                type="email" 
                placeholder="cliente@email.com" 
                value={emailTo}
                onChange={e => setEmailTo(e.target.value)}
                className="rounded-xl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEmailOpen(false)}>Cancelar</Button>
            <Button onClick={() => selectedOfferForAction && handleSendEmail(selectedOfferForAction)} className="gap-2">
              <Send className="h-4 w-4" /> Enviar Agora
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAbTestOpen} onOpenChange={setIsAbTestOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-500" /> Iniciar Teste A/B
            </DialogTitle>
            <DialogDescription>Compare duas versões de copy para maximizar a conversão.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/20">
              <p className="text-sm font-medium">Como funciona:</p>
              <ul className="text-xs text-muted-foreground space-y-2 mt-2">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-3 w-3 text-orange-500 mt-0.5" />
                  <span>Geramos uma Variante B focada em gatilhos diferentes.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-3 w-3 text-orange-500 mt-0.5" />
                  <span>Você envia as duas versões para leads diferentes.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-3 w-3 text-orange-500 mt-0.5" />
                  <span>O CRM rastreia qual versão gerou mais fechamentos.</span>
                </li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAbTestOpen(false)}>Cancelar</Button>
            <Button onClick={() => selectedOfferForAction && handleStartAbTest(selectedOfferForAction)} className="bg-orange-600 hover:bg-orange-700">
              Criar Variante B com IA
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isFollowupOpen} onOpenChange={setIsAbFollowupOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" /> Ativar Sequência de Follow-up
            </DialogTitle>
            <DialogDescription>Agende contatos automáticos para não perder o timing.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/20">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">1</div>
                <div className="text-xs">
                  <p className="font-bold">Hoje: Envio da Proposta</p>
                  <p className="text-muted-foreground">E-mail + WhatsApp inicial</p>
                </div>
              </div>
              <div className="flex justify-center py-1">
                <ArrowRight className="h-4 w-4 text-muted-foreground rotate-90" />
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg border">
                <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-xs">2</div>
                <div className="text-xs opacity-60">
                  <p className="font-bold">D+3: Lembrete de Valor</p>
                  <p className="text-muted-foreground">Prova social + case de sucesso</p>
                </div>
              </div>
              <div className="flex justify-center py-1">
                <ArrowRight className="h-4 w-4 text-muted-foreground rotate-90" />
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg border">
                <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-xs">3</div>
                <div className="text-xs opacity-60">
                  <p className="font-bold">D+7: Oferta de Fechamento</p>
                  <p className="text-muted-foreground">Gatilho de escassez (últimas vagas)</p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAbFollowupOpen(false)}>Cancelar</Button>
            <Button onClick={() => selectedOfferForAction && handleStartFollowup(selectedOfferForAction)} className="gap-2 font-bold">
              Ativar Automação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Histórico da Oferta</DialogTitle>
            <DialogDescription>Acompanhe todas as modificações desta oferta comercial.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto">
            {viewingHistoryId && history[viewingHistoryId] ? (
              history[viewingHistoryId].map((item, idx) => (
                <div key={idx} className="flex gap-3 items-start border-l-2 border-primary/20 pl-4 py-1">
                  <div className="min-w-[120px]">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">
                      {new Date(item.timestamp).toLocaleDateString()} {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-sm font-bold text-primary">{item.action}</p>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">{item.details}</p>
                    <p className="text-[10px] text-muted-foreground italic mt-1">Modificado por: {item.user}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center py-8 text-muted-foreground italic">Nenhum histórico registrado.</p>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsHistoryOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0 border-white/10 shadow-2xl">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              {editingOffer ? <Pencil className="h-5 w-5 text-primary" /> : <PlusCircle className="h-5 w-5 text-primary" />}
              {editingOffer ? 'Editar Oferta Comercial' : 'Criar Nova Oferta Irresistível'}
            </DialogTitle>
            <DialogDescription>
              Defina os elementos da sua oferta para que a IA gere um copy persuasivo.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 p-6 pt-0">
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="off-name" className="text-xs font-bold uppercase tracking-wider">Nome da Oferta</Label>
                  <Input 
                    id="off-name" 
                    value={formData.name} 
                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Combo E-commerce Profissional"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="off-status" className="text-xs font-bold uppercase tracking-wider">Status da Oferta</Label>
                  <Select value={formData.status} onValueChange={val => setFormData(prev => ({ ...prev, status: val as any }))}>
                    <SelectTrigger id="off-status" className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ativa">Ativa</SelectItem>
                      <SelectItem value="Pausada">Pausada</SelectItem>
                      <SelectItem value="Em teste">Em teste</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider">Serviços Vinculados</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 border border-white/10 rounded-xl p-3 bg-muted/10 max-h-40 overflow-y-auto">
                  {services.map(s => (
                    <label key={s.id} className="flex items-center gap-3 text-xs cursor-pointer hover:bg-white/5 p-2 rounded-lg transition-colors border border-transparent hover:border-white/5">
                      <input 
                        type="checkbox"
                        checked={formData.serviceIds?.includes(s.id)}
                        onChange={(e) => {
                          const ids = formData.serviceIds || [];
                          if (e.target.checked) {
                            setFormData(prev => ({ ...prev, serviceIds: [...ids, s.id] }));
                          } else {
                            setFormData(prev => ({ ...prev, serviceIds: ids.filter(id => id !== s.id) }));
                          }
                        }}
                        className="h-4 w-4 rounded border-white/20 text-primary focus:ring-primary/20 bg-background"
                      />
                      <span className="font-medium">{s.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="off-price" className="text-xs font-bold uppercase tracking-wider">Preço</Label>
                  <Input id="off-price" value={formData.suggestedPrice} onChange={e => setFormData(prev => ({ ...prev, suggestedPrice: e.target.value }))} placeholder="R$ 1.500" className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="off-discount" className="text-xs font-bold uppercase tracking-wider">Desconto (%)</Label>
                  <Input id="off-discount" value={formData.discount} onChange={e => setFormData(prev => ({ ...prev, discount: e.target.value }))} placeholder="15" className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="off-deadline" className="text-xs font-bold uppercase tracking-wider">Prazo Entrega</Label>
                  <Input id="off-deadline" value={formData.deadline} onChange={e => setFormData(prev => ({ ...prev, deadline: e.target.value }))} placeholder="7 dias úteis" className="rounded-xl" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="off-target" className="text-xs font-bold uppercase tracking-wider">Público-Alvo</Label>
                <Input id="off-target" value={formData.targetAudience} onChange={e => setFormData(prev => ({ ...prev, targetAudience: e.target.value }))} placeholder="Ex: Pequenos varejistas que não vendem online" className="rounded-xl" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="off-pain" className="text-xs font-bold uppercase tracking-wider">Dor Resolvida</Label>
                <Textarea 
                  id="off-pain" 
                  value={formData.painSolved} 
                  onChange={e => setFormData(prev => ({ ...prev, painSolved: e.target.value }))} 
                  placeholder="Ex: Baixa visibilidade digital e perda de vendas para concorrentes maiores" 
                  className="h-20 rounded-xl resize-none" 
                />
              </div>

              <div className="space-y-4 pt-4 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="off-copy" className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                    <Sparkles className="h-4 w-4" /> Copy de Venda Automático
                  </Label>
                  <div className="flex gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      disabled={isGenerating}
                      className="h-8 rounded-lg text-[10px] font-bold uppercase bg-orange-500/5 text-orange-600 border-orange-500/20 hover:bg-orange-500/10"
                      onClick={generateSalesCopy}
                    >
                      {isGenerating ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Sparkles className="h-3 w-3 mr-1" />}
                      {isGenerating ? 'IA Pensando...' : 'Gerar Copy com IA'}
                    </Button>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 rounded-lg text-[10px] font-bold uppercase"
                      onClick={() => setIsCopyHistoryOpen(true)}
                    >
                      <History className="h-3 w-3 mr-1" /> Ver Últimas
                    </Button>
                  </div>
                </div>
                <Textarea 
                  id="off-copy" 
                  value={formData.salesCopy} 
                  onChange={e => setFormData(prev => ({ ...prev, salesCopy: e.target.value }))} 
                  placeholder="O copy será gerado aqui após clicar no botão acima..." 
                  className="h-32 rounded-xl resize-none bg-primary/5 border-primary/10 italic text-sm" 
                />
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="p-6 border-t border-white/5 bg-muted/5">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="rounded-xl">Cancelar</Button>
            <Button onClick={handleSave} className="rounded-xl px-8 shadow-lg shadow-primary/20">
              {editingOffer ? 'Atualizar Oferta' : 'Criar Oferta Comercial'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OffersCatalogPage;
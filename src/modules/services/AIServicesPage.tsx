import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Zap, 
  Search, 
  Clock, 
  ClipboardCheck, 
  PlusCircle,
  Database,
  Layout,
  Pencil,
  Trash2,
  Eye
} from "lucide-react";
import { Link } from '@tanstack/react-router';
import { toast } from "sonner";
import { useProspectingStore } from '../prospecting/prospecting-store';
import { useServicesStore, ServiceBase } from './services-store';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const AIServicesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { addLead } = useProspectingStore();
  const { services, addService, updateService, deleteService, history } = useServicesStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [viewingHistoryId, setViewingHistoryId] = useState<string | null>(null);
  const [editingService, setEditingService] = useState<ServiceBase | null>(null);
  const [formData, setFormData] = useState<Partial<ServiceBase>>({
    name: '',
    category: 'Imagens & Catálogos',
    description: '',
    deliveryTime: '',
    price: '',
    isIA: true,
    status: 'Ativo'
  });

  const aiServices = useMemo(() => {
    return services.filter(service => 
      service.isIA && 
      (service.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
       service.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [services, searchTerm]);

  const handleOpenModal = (service?: ServiceBase) => {
    if (service) {
      setEditingService(service);
      setFormData(service);
    } else {
      setEditingService(null);
      setFormData({
        name: '',
        category: 'Imagens & Catálogos',
        description: '',
        deliveryTime: '',
        price: '',
        isIA: true,
        status: 'Ativo'
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.price) {
      toast.error("Por favor, preencha o nome e o preço.");
      return;
    }

    if (editingService) {
      updateService(editingService.id, { ...formData, status: 'Ativo' });
      toast.success("Microserviço atualizado!");
    } else {
      const newService: ServiceBase = {
        ...formData as ServiceBase,
        id: Math.random().toString(36).substr(2, 9),
        isIA: true,
        status: 'Ativo'
      };
      addService(newService);
      toast.success("Microserviço IA adicionado!");
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("Deseja excluir este microserviço?")) {
      deleteService(id);
      toast.success("Serviço removido.");
    }
  };

  const handleViewHistory = (id: string) => {
    setViewingHistoryId(id);
    setIsHistoryOpen(true);
  };

  const handleAction = (action: string, serviceName: string) => {
    toast.success(`${action} para "${serviceName}" iniciado!`);
  };

  const handleCreateLead = (service: ServiceBase) => {
    const newLead = {
      id: Math.random().toString(36).substr(2, 9),
      companyName: `IA: ${service.name}`,
      niche: service.category,
      city: '-',
      status: 'Lead Gerado' as any,
      opportunityScore: 92,
      opportunityLevel: 'quente' as any,
      diagnosis: `Lead gerado a partir do microserviço IA: ${service.name}`,
      source: 'Microserviços IA',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    // @ts-ignore
    addLead(newLead);
    toast.success(`Microserviço "${service.name}" enviado para o CRM!`);
  };

  return (
    <div className="container mx-auto py-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Microserviços IA</h1>
            <Badge className="bg-primary/10 text-primary border-none text-xs font-bold px-2 py-0">NOVO</Badge>
          </div>
          <p className="text-muted-foreground text-lg">
            Serviços rápidos com inteligência artificial para gerar imagens, textos, vídeos e materiais comerciais.
          </p>
        </div>
        <Button onClick={() => handleOpenModal()} className="gap-2 rounded-xl">
          <PlusCircle className="h-4 w-4" /> Novo Microserviço IA
        </Button>
      </div>

      <div className="flex justify-between items-center">
        <div className="w-full md:w-96 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar microserviço..." 
            className="pl-10 h-11 rounded-xl bg-card border-white/10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {aiServices.map((service) => (
          <Card key={service.id} className="bg-card border-white/5 hover:border-primary/20 transition-all flex flex-col group relative">
            <CardHeader className="p-4 pb-2">
              <div className="flex justify-between items-start">
                <div className="p-2 rounded-lg bg-primary/5 group-hover:bg-primary/10 transition-colors">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <div className="flex gap-1">
                  <Badge variant="secondary" className="text-[10px] font-bold py-0 h-5">
                    {service.deliveryTime}
                  </Badge>
                  <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity ml-2">
                    <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => handleViewHistory(service.id)}>
                      <Clock className="h-3 w-3" />
                    </Button>
                    <Link to="/servicos/detalhes/$serviceId" params={{ serviceId: service.id }}>
                      <Button size="icon" variant="ghost" className="h-5 w-5">
                        <Eye className="h-3 w-3" />
                      </Button>
                    </Link>
                    <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => handleOpenModal(service)}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-5 w-5 text-rose-500" onClick={() => handleDelete(service.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
              <CardTitle className="text-base font-bold mt-3 leading-tight">{service.name}</CardTitle>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2 min-h-[32px]">
                {service.description}
              </p>
            </CardHeader>
            <CardContent className="p-4 pt-2 flex-1 flex flex-col gap-3">
              <div className="text-sm font-bold text-primary bg-primary/5 p-2 rounded-lg text-center border border-primary/10">
                Sugerido: {service.price}
              </div>
              
              <div className="grid grid-cols-2 gap-2 mt-auto">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-[10px] h-8 font-bold gap-1 rounded-lg"
                  onClick={() => handleAction('Briefing', service.name)}
                >
                  <ClipboardCheck className="h-3 w-3" /> Briefing
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-[10px] h-8 font-bold gap-1 rounded-lg"
                  onClick={() => handleAction('Pedido', service.name)}
                >
                  <Layout className="h-3 w-3" /> Criar pedido
                </Button>
                <Button 
                  className="col-span-2 text-[10px] h-9 font-bold gap-1 rounded-lg"
                  onClick={() => handleCreateLead(service)}
                >
                  <Database className="h-3 w-3" /> Enviar para CRM
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingService ? 'Editar Microserviço IA' : 'Novo Microserviço IA'}</DialogTitle>
            <DialogDescription>Crie ferramentas ágeis baseadas em inteligência artificial.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome do Microserviço</Label>
              <Input 
                id="name" 
                value={formData.name} 
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Gerador de Headline por IA"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="price">Preço sugerido</Label>
              <Input 
                id="price" 
                value={formData.price} 
                onChange={e => setFormData(prev => ({ ...prev, price: e.target.value }))}
                placeholder="Ex: R$ 89"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="delivery">Prazo de entrega</Label>
                <Input 
                  id="delivery" 
                  value={formData.deliveryTime} 
                  onChange={e => setFormData(prev => ({ ...prev, deliveryTime: e.target.value }))}
                  placeholder="Ex: 24h"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <select 
                  id="status"
                  value={formData.status}
                  onChange={e => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="Ativo">Ativo</option>
                  <option value="Pausado">Pausado</option>
                </select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="desc">Descrição curta</Label>
              <Textarea 
                id="desc" 
                value={formData.description} 
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Explique o que a IA faz"
                className="resize-none"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="fullDesc">Descrição Detalhada</Label>
              <Textarea 
                id="fullDesc" 
                value={formData.fullDescription} 
                onChange={e => setFormData(prev => ({ ...prev, fullDescription: e.target.value }))}
                placeholder="Explique o serviço em detalhes..."
                className="resize-none h-24"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="howItWorks">Como Funciona</Label>
              <Textarea 
                id="howItWorks" 
                value={formData.howItWorks} 
                onChange={e => setFormData(prev => ({ ...prev, howItWorks: e.target.value }))}
                placeholder="Workflow da entrega..."
                className="resize-none h-20"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar IA</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Histórico do Microserviço IA</DialogTitle>
            <DialogDescription>Rastreabilidade de modificações do serviço de IA.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {viewingHistoryId && history[viewingHistoryId] ? (
              history[viewingHistoryId].map((item, idx) => (
                <div key={idx} className="flex gap-3 items-start border-l-2 border-primary/20 pl-4 py-1">
                  <div className="min-w-[120px]">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">
                      {new Date(item.timestamp).toLocaleDateString()}
                    </p>
                    <p className="text-xs font-bold text-primary">{item.action}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{item.details}</p>
                </div>
              ))
            ) : (
              <p className="text-center py-8 text-muted-foreground italic text-xs">Sem registros.</p>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsHistoryOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AIServicesPage;

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Package, 
  Search, 
  Zap, 
  Clock, 
  TrendingUp, 
  PlusCircle,
  UserPlus,
  Pencil,
  Trash2,
  Filter,
  X,
  Eye,
  Heart
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export const CATEGORIES = [
  'Todos',
  'Imagens & Catálogos',
  'E-books & Ensaios',
  'Marketing & Mídia',
  'Sites & Presença Digital',
  'Negócios & Branding',
  'Vídeos & Animações',
  'Utilitários & Kits',
];

const SingleServicesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos');
  const { addLead } = useProspectingStore();
  const { services, addService, updateService, deleteService, history } = useServicesStore();
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [viewingHistoryId, setViewingHistoryId] = useState<string | null>(null);
  const [editingService, setEditingService] = useState<ServiceBase | null>(null);
  const [formData, setFormData] = useState<Partial<ServiceBase>>({
    name: '',
    category: 'Marketing & Mídia',
    description: '',
    deliveryTime: '',
    price: '',
    isIA: false,
    status: 'Ativo'
  });

  const filteredServices = useMemo(() => {
    return services.filter(service => {
      const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           service.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = activeCategory === 'Todos' || service.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [services, searchTerm, activeCategory]);

  const stats = [
    { label: 'Total de serviços', value: services.length, icon: Package, color: 'text-blue-500' },
    { label: 'Serviços com IA', value: services.filter(s => s.isIA).length, icon: Zap, color: 'text-purple-500' },
    { label: 'Interesses registrados', value: services.reduce((acc, s) => acc + (s.interestCount || 0), 0), icon: Heart, color: 'text-rose-500' },
    { label: 'Mais vendidos', value: '12', icon: TrendingUp, color: 'text-orange-500' },
  ];

  const handleOpenModal = (service?: ServiceBase) => {
    if (service) {
      setEditingService(service);
      setFormData(service);
    } else {
      setEditingService(null);
      setFormData({
        name: '',
        category: 'Marketing & Mídia',
        description: '',
        deliveryTime: '',
        price: '',
        isIA: false,
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
      toast.success("Serviço atualizado com sucesso!");
    } else {
      const newService: ServiceBase = {
        ...formData as ServiceBase,
        id: Math.random().toString(36).substr(2, 9),
        status: 'Ativo'
      };
      addService(newService);
      toast.success("Serviço adicionado com sucesso!");
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este serviço?")) {
      deleteService(id);
      toast.success("Serviço excluído.");
    }
  };

  const handleViewHistory = (id: string) => {
    setViewingHistoryId(id);
    setIsHistoryOpen(true);
  };

  const handleCreateLead = (service: ServiceBase) => {
    const newLead = {
      id: Math.random().toString(36).substr(2, 9),
      companyName: `Oportunidade: ${service.name}`,
      niche: service.category,
      city: '-',
      status: 'Lead Gerado' as any,
      opportunityScore: 85,
      opportunityLevel: 'boa' as any,
      diagnosis: `Lead gerado a partir do serviço avulso: ${service.name}`,
      source: 'Serviços Avulsos',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    // @ts-ignore
    addLead(newLead);
    toast.success(`Oportunidade "${service.name}" criada no CRM!`);
  };

  return (
    <div className="container mx-auto py-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Serviços Avulsos</h1>
          <p className="text-muted-foreground text-lg">
            Produtos e serviços rápidos para vender, entregar e acompanhar dentro da operação comercial.
          </p>
        </div>
        <Button onClick={() => handleOpenModal()} className="gap-2 rounded-xl">
          <PlusCircle className="h-4 w-4" /> Novo Serviço
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="bg-card/50 border-white/10 shadow-sm overflow-hidden group hover:border-primary/20 transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl bg-background border border-white/5 ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <Button
              key={cat}
              variant={activeCategory === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveCategory(cat)}
              className="rounded-full px-4 h-9 font-medium"
            >
              {cat}
            </Button>
          ))}
        </div>
        <div className="w-full md:w-80 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar serviço..." 
            className="pl-10 h-10 rounded-xl"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredServices.map((service) => (
          <Card key={service.id} className="flex flex-col group overflow-hidden border-white/10 hover:border-primary/30 transition-all hover:shadow-lg bg-card">
            <CardHeader className="p-0">
              <div className="aspect-[16/10] bg-muted relative flex items-center justify-center p-6 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                <Package className="h-12 w-12 text-primary/40 group-hover:scale-110 transition-transform duration-300" />
                {service.isIA && (
                  <Badge className="absolute top-3 right-3 bg-purple-500 hover:bg-purple-600 gap-1 shadow-sm border-none">
                    <Zap className="h-3 w-3 fill-white" /> IA
                  </Badge>
                )}
                <Badge variant="outline" className="absolute top-3 left-3 bg-background/80 backdrop-blur-sm border-white/10 text-[10px] uppercase tracking-wider">
                  {service.category}
                </Badge>
                
                <div className="absolute bottom-3 right-3 flex gap-2 translate-y-12 group-hover:translate-y-0 transition-transform">
                  <Button size="icon" variant="secondary" className="h-8 w-8 rounded-lg shadow-md" onClick={() => handleViewHistory(service.id)}>
                    <Clock className="h-3.5 w-3.5" />
                  </Button>
                  <Link to="/servicos/detalhes/$serviceId" params={{ serviceId: service.id }}>
                    <Button size="icon" variant="secondary" className="h-8 w-8 rounded-lg shadow-md">
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                  <Button size="icon" variant="secondary" className="h-8 w-8 rounded-lg shadow-md" onClick={() => handleOpenModal(service)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="destructive" className="h-8 w-8 rounded-lg shadow-md" onClick={() => handleDelete(service.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5 flex-1 flex flex-col">
              <div className="mb-3">
                <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">{service.name}</h3>
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2 min-h-[40px]">
                  {service.description}
                </p>
              </div>
              
              <div className="mt-auto space-y-4">
                <div className="flex items-center justify-between text-sm py-2 border-y border-white/5">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{service.deliveryTime}</span>
                  </div>
                  <div className="font-bold text-primary">
                    {service.price}
                  </div>
                </div>
                
                <Button 
                  className="w-full gap-2 rounded-xl group-hover:shadow-md transition-all font-bold"
                  onClick={() => handleCreateLead(service)}
                >
                  <UserPlus className="h-4 w-4" />
                  Criar lead no CRM
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingService ? 'Editar Serviço' : 'Novo Serviço'}</DialogTitle>
            <DialogDescription>
              Preencha os dados abaixo para gerenciar este serviço no seu catálogo.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome do Serviço</Label>
              <Input 
                id="name" 
                value={formData.name} 
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Logotipo Premium"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">Categoria</Label>
              <Select 
                value={formData.category} 
                onValueChange={val => setFormData(prev => ({ ...prev, category: val }))}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.filter(c => c !== 'Todos').map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="price">Preço sugerido</Label>
              <Input 
                id="price" 
                value={formData.price} 
                onChange={e => setFormData(prev => ({ ...prev, price: e.target.value }))}
                placeholder="Ex: R$ 249"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="delivery">Prazo de entrega</Label>
                <Input 
                  id="delivery" 
                  value={formData.deliveryTime} 
                  onChange={e => setFormData(prev => ({ ...prev, deliveryTime: e.target.value }))}
                  placeholder="Ex: 24 a 48h"
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
                placeholder="O que o serviço inclui?"
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
            <div className="grid gap-2">
              <Label htmlFor="benefits">Benefícios (um por linha)</Label>
              <Textarea 
                id="benefits" 
                value={formData.benefits?.join('\n')} 
                onChange={e => setFormData(prev => ({ ...prev, benefits: e.target.value.split('\n').filter(b => b.trim() !== '') }))}
                placeholder="Vantagem 1&#10;Vantagem 2..."
                className="resize-none h-20"
              />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <input 
                type="checkbox" 
                id="isIA" 
                checked={formData.isIA}
                onChange={e => setFormData(prev => ({ ...prev, isIA: e.target.checked }))}
                className="h-4 w-4 rounded border-slate-300"
              />
              <Label htmlFor="isIA" className="font-medium">Este é um serviço com IA?</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar Serviço</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Histórico de Alterações</DialogTitle>
            <DialogDescription>
              Acompanhe as modificações realizadas neste serviço.
            </DialogDescription>
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
                  <p className="text-sm text-muted-foreground">{item.details}</p>
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
    </div>
  );
};

export default SingleServicesPage;

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Search, 
  Clock, 
  TrendingUp, 
  ArrowRight,
  PlusCircle,
  Database,
  Filter,
  Info,
  CheckCircle2,
  ChevronRight,
  X
} from "lucide-react";
import { toast } from "sonner";
import { useProspectingStore } from '../prospecting/prospecting-store';
import { NEW_SERVICES_DATA, NewService } from './new-services-data';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";

const NEW_CATEGORIES = [
  'Todos',
  'Marketing & Mídia',
  'E-commerce & Vendas',
  'Inovação & Tecnologia',
  'Consultoria & Estratégia',
  'Beleza & Estética'
];

const NewServicesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [maxPrice, setMaxPrice] = useState<string>('all');
  const [maxDelivery, setMaxDelivery] = useState<string>('all');
  const [selectedService, setSelectedService] = useState<NewService | null>(null);
  const { leads, addLead, updateLead } = useProspectingStore();

  const filteredServices = useMemo(() => {
    return NEW_SERVICES_DATA.filter(service => {
      const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           service.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = activeCategory === 'Todos' || service.category === activeCategory;
      
      let matchesPrice = true;
      if (maxPrice !== 'all') {
        const priceNum = parseInt(service.suggestedPrice.replace(/\D/g, '')) || 0;
        if (maxPrice === '1000' && priceNum > 1000) matchesPrice = false;
        if (maxPrice === '3000' && priceNum > 3000) matchesPrice = false;
      }

      let matchesDelivery = true;
      if (maxDelivery !== 'all') {
        const days = parseInt(service.deliveryTime.split(' ')[0]) || 0;
        if (maxDelivery === '7' && days > 7) matchesDelivery = false;
        if (maxDelivery === '20' && days > 20) matchesDelivery = false;
      }

      return matchesSearch && matchesCategory && matchesPrice && matchesDelivery;
    });
  }, [searchTerm, activeCategory, maxPrice, maxDelivery]);

  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestForm, setRequestForm] = useState({
    companyName: '',
    city: '',
    instagram: '',
    maps: '',
    whatsapp: '',
    notes: '',
    serviceId: ''
  });

  useEffect(() => {
    if (selectedService) {
      setRequestForm(prev => ({ ...prev, serviceId: selectedService.id }));
    }
  }, [selectedService]);

  const handleOpenRequest = (service: NewService) => {
    setSelectedService(service);
    setRequestForm({
      companyName: '',
      city: '',
      instagram: '',
      maps: '',
      whatsapp: '',
      notes: '',
      serviceId: service.id
    });
    setIsRequestModalOpen(true);
  };

  const handleConfirmRequest = () => {
    if (!selectedService) return;
    if (!requestForm.companyName) {
      toast.error("Por favor, informe o nome da empresa.");
      return;
    }

    const existingLead = (leads || []).find(l => 
      l.companyName.toLowerCase() === requestForm.companyName.toLowerCase() || 
      (requestForm.whatsapp && l.whatsapp === requestForm.whatsapp)
    );

    if (existingLead) {
      updateLead(
        existingLead.id, 
        {
          instagramHandle: requestForm.instagram || existingLead.instagramHandle,
          instagramUrl: requestForm.instagram ? `https://instagram.com/${requestForm.instagram.replace('@', '')}` : existingLead.instagramUrl,
          address: requestForm.maps || existingLead.address,
          whatsapp: requestForm.whatsapp || existingLead.whatsapp,
          city: (requestForm.city && requestForm.city !== '-') ? requestForm.city : existingLead.city,
          diagnosis: `${existingLead.diagnosis}\n\n[Nova Solicitação: ${selectedService.name}] Obs: ${requestForm.notes}`,
          updatedAt: new Date().toISOString()
        },
        'manual',
        `Solicitou novo serviço: ${selectedService.name}`
      );
      toast.success(`Dados atualizados para "${existingLead.companyName}"!`);
    } else {
      const newLead = {
        id: crypto.randomUUID(),
        companyName: requestForm.companyName,
        niche: selectedService.category,
        city: requestForm.city || '-',
        instagramHandle: requestForm.instagram,
        instagramUrl: requestForm.instagram ? `https://instagram.com/${requestForm.instagram.replace('@', '')}` : undefined,
        address: requestForm.maps,
        whatsapp: requestForm.whatsapp,
        status: 'Recebido' as any,
        opportunityScore: 95,
        opportunityLevel: 'quente' as any,
        diagnosis: `Interesse no novo serviço: ${selectedService.name}. Observações: ${requestForm.notes}`,
        source: 'Novos Serviços e Produtos',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      // @ts-ignore
      addLead(newLead, 'manual');
      toast.success(`Solicitação para "${selectedService.name}" enviada ao CRM!`);
    }
    
    setIsRequestModalOpen(false);
    setSelectedService(null);
  };

  return (
    <div className="container mx-auto py-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Novos Serviços e Produtos</h1>
          <Badge className="bg-primary/10 text-primary border-none text-xs font-bold px-2 py-0">EXPANSÃO</Badge>
        </div>
        <p className="text-muted-foreground text-lg">
          Explore nossas novas soluções inovadoras e tecnológicas para diversificar seu portfólio.
        </p>
      </div>

      <div className="bg-card p-6 rounded-2xl border border-white/5 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <div className="flex flex-wrap gap-2">
            {NEW_CATEGORIES.map((cat) => (
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
              placeholder="Buscar serviço inovador..." 
              className="pl-10 h-10 rounded-xl"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-4 pt-4 border-t border-white/5">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Filtros rápidos:</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium">Preço máx:</span>
              <Select value={maxPrice} onValueChange={setMaxPrice}>
                <SelectTrigger className="w-[140px] h-8 text-xs rounded-lg">
                  <SelectValue placeholder="Qualquer preço" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Qualquer preço</SelectItem>
                  <SelectItem value="1000">Até R$ 1.000</SelectItem>
                  <SelectItem value="3000">Até R$ 3.000</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium">Prazo máx:</span>
              <Select value={maxDelivery} onValueChange={setMaxDelivery}>
                <SelectTrigger className="w-[140px] h-8 text-xs rounded-lg">
                  <SelectValue placeholder="Qualquer prazo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Qualquer prazo</SelectItem>
                  <SelectItem value="7">Até 7 dias</SelectItem>
                  <SelectItem value="20">Até 20 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {(maxPrice !== 'all' || maxDelivery !== 'all' || activeCategory !== 'Todos' || searchTerm !== '') && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setMaxPrice('all');
                  setMaxDelivery('all');
                  setActiveCategory('Todos');
                  setSearchTerm('');
                }}
                className="h-8 px-2 text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-500/5 gap-1"
              >
                <X className="h-3 w-3" /> Limpar tudo
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.map((service) => (
          <Card key={service.id} className="flex flex-col group overflow-hidden border-white/10 hover:border-primary/30 transition-all hover:shadow-lg bg-card">
            <CardHeader className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-2xl bg-primary/5 group-hover:bg-primary/10 transition-colors">
                  <service.icon className="h-6 w-6 text-primary" />
                </div>
                <Badge variant="outline" className="text-[10px] font-bold py-0 h-5 border-primary/20 text-primary">
                  {service.category}
                </Badge>
              </div>
              <CardTitle className="text-xl font-bold leading-tight group-hover:text-primary transition-colors">
                {service.name}
              </CardTitle>
              <CardDescription className="text-sm mt-2 line-clamp-2">
                {service.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-0 flex-1 flex flex-col">
              <div className="bg-muted/30 p-3 rounded-xl border border-white/5 mb-6">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Diferencial:</p>
                <p className="text-xs font-medium text-foreground">{service.benefit}</p>
              </div>
              
              <div className="mt-auto flex flex-col gap-2">
                <Button 
                  className="w-full gap-2 rounded-xl font-bold"
                  onClick={() => setSelectedService(service)}
                >
                  <Info className="h-4 w-4" />
                  Ver Detalhes
                </Button>
                <Button 
                  variant="outline"
                  className="w-full gap-2 rounded-xl font-bold"
                  onClick={() => handleOpenRequest(service)}
                >
                  <PlusCircle className="h-4 w-4" />
                  Solicitar Serviço
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedService && !isRequestModalOpen} onOpenChange={(open) => !open && setSelectedService(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedService && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-xl bg-primary/10">
                    <selectedService.icon className="h-6 w-6 text-primary" />
                  </div>
                  <Badge className="bg-primary/10 text-primary border-none">{selectedService.category}</Badge>
                </div>
                <DialogTitle className="text-2xl font-bold">{selectedService.name}</DialogTitle>
                <DialogDescription className="text-lg">
                  {selectedService.description}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 my-6">
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-2">Descrição do Serviço</h4>
                  <p className="text-sm leading-relaxed">{selectedService.fullDescription}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-2">Como Funciona</h4>
                    <p className="text-sm leading-relaxed">{selectedService.howItWorks}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-2">Benefícios</h4>
                    <ul className="space-y-2">
                      {selectedService.benefits.map((b, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 p-4 bg-muted/50 rounded-2xl border border-white/5">
                  <div className="flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Preço Sugerido</p>
                    <p className="text-lg font-bold text-primary">{selectedService.suggestedPrice}</p>
                  </div>
                  <div className="flex-1 border-l border-white/10 pl-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Prazo de Entrega</p>
                    <p className="text-lg font-bold">{selectedService.deliveryTime}</p>
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="ghost" onClick={() => setSelectedService(null)} className="rounded-xl">
                  Voltar
                </Button>
                <Button className="gap-2 rounded-xl px-8" onClick={() => handleOpenRequest(selectedService)}>
                  <Database className="h-4 w-4" /> Contratar agora
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Request Form Dialog */}
      <Dialog open={isRequestModalOpen} onOpenChange={setIsRequestModalOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-3xl">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <PlusCircle className="h-5 w-5 text-primary" />
              <DialogTitle className="text-xl font-bold">Solicitar Serviço Inovador</DialogTitle>
            </div>
            <DialogDescription>
              Preencha os dados da empresa para iniciar a solicitação de <strong>{selectedService?.name}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Serviço Selecionado</label>
              <Select 
                value={requestForm.serviceId} 
                onValueChange={(val) => {
                  const service = NEW_SERVICES_DATA.find(s => s.id === val);
                  if (service) {
                    setSelectedService(service);
                    setRequestForm({ ...requestForm, serviceId: val });
                  }
                }}
              >
                <SelectTrigger className="rounded-xl bg-muted/50 border-white/5 h-10">
                  <SelectValue placeholder="Selecione o serviço" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-white/5 bg-slate-900 text-white">
                  {NEW_SERVICES_DATA.map(service => (
                    <SelectItem key={service.id} value={service.id} className="hover:bg-primary/20">
                      {service.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Nome da Empresa *</label>
              <Input 
                placeholder="Ex: Barber Shop Premium"
                value={requestForm.companyName}
                onChange={(e) => setRequestForm({ ...requestForm, companyName: e.target.value })}
                className="rounded-xl bg-muted/50 border-white/5"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Cidade</label>
                <Input 
                  placeholder="Ex: Joinville"
                  value={requestForm.city}
                  onChange={(e) => setRequestForm({ ...requestForm, city: e.target.value })}
                  className="rounded-xl bg-muted/50 border-white/5"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">WhatsApp</label>
                <Input 
                  placeholder="(00) 00000-0000"
                  value={requestForm.whatsapp}
                  onChange={(e) => setRequestForm({ ...requestForm, whatsapp: e.target.value })}
                  className="rounded-xl bg-muted/50 border-white/5"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Instagram (@usuario)</label>
              <Input 
                placeholder="@exemplo"
                value={requestForm.instagram}
                onChange={(e) => setRequestForm({ ...requestForm, instagram: e.target.value })}
                className="rounded-xl bg-muted/50 border-white/5"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Link Google Maps</label>
              <Input 
                placeholder="https://goo.gl/maps/..."
                value={requestForm.maps}
                onChange={(e) => setRequestForm({ ...requestForm, maps: e.target.value })}
                className="rounded-xl bg-muted/50 border-white/5"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Observações Adicionais</label>
              <Input 
                placeholder="Ex: Alguma necessidade específica?"
                value={requestForm.notes}
                onChange={(e) => setRequestForm({ ...requestForm, notes: e.target.value })}
                className="rounded-xl bg-muted/50 border-white/5"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setIsRequestModalOpen(false)} className="rounded-xl">
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirmRequest} 
              className="rounded-xl px-8 shadow-lg shadow-primary/20"
            >
              Confirmar Solicitação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NewServicesPage;

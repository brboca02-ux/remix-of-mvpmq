import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Layers, 
  CheckCircle2, 
  ArrowRight, 
  TrendingUp, 
  Zap,
  Layout,
  Smartphone,
  Store,
  Home,
  UserCheck,
  PlusCircle,
  Pencil,
  Trash2,
  Database,
  FileText,
  Clock
} from "lucide-react";
import { toast } from "sonner";
import { useProspectingStore } from '../prospecting/prospecting-store';
import { useServicesStore, Combo } from './services-store';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const ICON_OPTIONS = [
  { name: 'Smartphone', icon: Smartphone },
  { name: 'Store', icon: Store },
  { name: 'UserCheck', icon: UserCheck },
  { name: 'TrendingUp', icon: TrendingUp },
  { name: 'Home', icon: Home },
  { name: 'Zap', icon: Zap },
  { name: 'Layers', icon: Layers },
];

const CombosPackagesPage: React.FC = () => {
  const { addLead } = useProspectingStore();
  const { services, combos, addCombo, updateCombo, deleteCombo, history } = useServicesStore();
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [viewingHistoryId, setViewingHistoryId] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCombo, setEditingCombo] = useState<Combo | null>(null);
  const [formData, setFormData] = useState<Partial<Combo>>({
    name: '',
    description: '',
    serviceIds: [],
    price: '',
    icon: 'Layers'
  });

  const handleOpenModal = (combo?: Combo) => {
    if (combo) {
      setEditingCombo(combo);
      setFormData(combo);
    } else {
      setEditingCombo(null);
      setFormData({
        name: '',
        description: '',
        serviceIds: [],
        price: '',
        icon: 'Layers'
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.price) {
      toast.error("Nome e preço são obrigatórios.");
      return;
    }

    if (editingCombo) {
      updateCombo(editingCombo.id, formData);
      toast.success("Combo atualizado!");
    } else {
      const newCombo: Combo = {
        ...formData as Combo,
        id: Math.random().toString(36).substr(2, 9),
      };
      addCombo(newCombo);
      toast.success("Novo combo criado!");
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("Deseja excluir este combo?")) {
      deleteCombo(id);
      toast.success("Combo removido.");
    }
  };

  const handleCreateLead = (combo: Combo) => {
    const serviceNames = services
      .filter(s => combo.serviceIds.includes(s.id))
      .map(s => s.name)
      .join(', ');

    const newLead = {
      id: Math.random().toString(36).substr(2, 9),
      companyName: `Combo: ${combo.name}`,
      niche: 'Pacotes & Combos',
      city: '-',
      status: 'Lead Gerado' as any,
      opportunityScore: 95,
      opportunityLevel: 'quente' as any,
      diagnosis: `Lead interessado no combo: ${combo.name}. Itens inclusos: ${serviceNames || 'Personalizados'}.`,
      source: 'Pacotes & Combos',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    // @ts-ignore
    addLead(newLead);
    toast.success(`Combo "${combo.name}" enviado para o CRM com score 95!`);
  };

  const handleGenerateProposal = (comboName: string) => {
    toast.info(`Gerando proposta personalizada para "${comboName}"...`);
    setTimeout(() => {
      toast.success("Proposta PDF gerada e pronta para download!");
    }, 1500);
  };

  return (
    <div className="container mx-auto py-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Pacotes & Combos</h1>
            <Badge className="bg-primary/10 text-primary border-none text-xs font-bold px-2 py-0">NOVO</Badge>
          </div>
          <p className="text-muted-foreground text-lg">
            Combinações estratégicas de serviços com descontos progressivos e maior valor agregado.
          </p>
        </div>
        <Button className="gap-2 rounded-xl" onClick={() => handleOpenModal()}>
          <PlusCircle className="h-4 w-4" /> Criar Combo
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {combos.map((combo) => {
          const IconComp = ICON_OPTIONS.find(i => i.name === combo.icon)?.icon || Layers;
          const linkedServices = services.filter(s => combo.serviceIds.includes(s.id));
          
          return (
            <Card key={combo.id} className="flex flex-col bg-card border-white/10 hover:border-primary/20 transition-all group relative overflow-hidden">
              <div className={`absolute top-0 right-0 p-8 opacity-5 -mr-4 -mt-4 transition-transform group-hover:scale-125 duration-500 text-primary`}>
                <IconComp className="h-32 w-32" />
              </div>

              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <Button size="icon" variant="secondary" className="h-8 w-8 rounded-lg" onClick={() => {
                  setViewingHistoryId(combo.id);
                  setIsHistoryOpen(true);
                }}>
                  <Clock className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon" variant="secondary" className="h-8 w-8 rounded-lg" onClick={() => handleOpenModal(combo)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon" variant="destructive" className="h-8 w-8 rounded-lg" onClick={() => handleDelete(combo.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              
              <CardHeader className="p-6 pb-4">
                <div className={`p-3 rounded-2xl bg-primary/10 w-fit mb-4 text-primary`}>
                  <IconComp className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl font-bold">{combo.name}</CardTitle>
                <CardDescription className="text-sm mt-2 line-clamp-2">{combo.description}</CardDescription>
              </CardHeader>
              
              <CardContent className="p-6 pt-0 flex-1 flex flex-col">
                <div className="space-y-3 mt-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">O que está incluso:</p>
                  {linkedServices.map((s) => (
                    <div key={s.id} className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-sm font-medium">{s.name}</span>
                    </div>
                  ))}
                  {linkedServices.length === 0 && (
                    <p className="text-xs text-muted-foreground italic">Monte este pacote com seus serviços</p>
                  )}
                </div>
                
                <div className="mt-auto pt-6 space-y-4">
                  <div className="flex justify-between items-center py-3 border-t border-white/5">
                    <div className="text-xs text-muted-foreground font-medium">Investimento sugerido</div>
                    <div className="text-2xl font-bold text-primary">{combo.price}</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline"
                      className="gap-2 rounded-xl h-10 font-bold text-xs"
                      onClick={() => handleGenerateProposal(combo.name)}
                    >
                      <FileText className="h-4 w-4 text-primary" /> Proposta
                    </Button>
                    <Button 
                      className="gap-2 rounded-xl h-10 font-bold text-xs shadow-lg shadow-primary/10"
                      onClick={() => handleCreateLead(combo)}
                    >
                      <Database className="h-4 w-4" /> CRM
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        
        {combos.length === 0 && (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-white/5 rounded-3xl">
            <Layers className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
            <p className="text-muted-foreground">Nenhum combo comercial cadastrado ainda.</p>
            <Button variant="link" onClick={() => handleOpenModal()} className="mt-2">Começar a criar combos</Button>
          </div>
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCombo ? 'Editar Combo' : 'Novo Combo Comercial'}</DialogTitle>
            <DialogDescription>Combine serviços para criar soluções completas.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
            <div className="grid gap-2">
              <Label htmlFor="c-name">Nome do Combo</Label>
              <Input id="c-name" value={formData.name} onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} placeholder="Ex: Combo Digital Master" />
            </div>

            <div className="grid gap-2">
              <Label>Ícone Representativo</Label>
              <div className="flex flex-wrap gap-2">
                {ICON_OPTIONS.map(opt => (
                  <Button 
                    key={opt.name} 
                    size="icon" 
                    variant={formData.icon === opt.name ? 'default' : 'outline'}
                    className="h-9 w-9"
                    onClick={() => setFormData(prev => ({ ...prev, icon: opt.name }))}
                  >
                    <opt.icon className="h-4 w-4" />
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Serviços Inclusos</Label>
              <div className="grid grid-cols-1 gap-1 border rounded-lg p-3 max-h-40 overflow-y-auto bg-muted/20">
                {services.map(s => (
                  <label key={s.id} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-white/5 p-1 rounded">
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
                      className="h-3 w-3 rounded"
                    />
                    {s.name}
                  </label>
                ))}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="c-price">Preço Promocional do Combo</Label>
              <Input id="c-price" value={formData.price} onChange={e => setFormData(prev => ({ ...prev, price: e.target.value }))} placeholder="Ex: R$ 4.990" />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="c-desc">Descrição / Chamada Comercial</Label>
              <Textarea id="c-desc" value={formData.description} onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))} placeholder="Por que este combo é vantajoso?" className="h-24" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar Combo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Histórico do Combo</DialogTitle>
            <DialogDescription>Acompanhe todas as modificações deste combo comercial.</DialogDescription>
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
    </div>
  );
};

export default CombosPackagesPage;

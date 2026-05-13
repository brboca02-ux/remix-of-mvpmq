// @ts-nocheck
import React, { useState } from 'react';
import { cn } from "@/lib/utils";
import { ProspectLead } from './types';
import { Badge } from "@/components/ui/badge";
import { Sparkles, Target, Zap, Trophy, Inbox, Ban, UserMinus, Trash2, XCircle, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProspectingStore } from './prospecting-store';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';

interface LeadPipelineProps {
  leads: ProspectLead[];
  onMoveLead: (id: string, newStatus: ProspectLead['status']) => void;
  onEditLead?: (lead: ProspectLead, initialTab?: string) => void;
}

type SalesColumn = 'Novo' | 'Qualificado' | 'Interessado' | 'Lead Fechado';

const SALES_COLUMNS: { id: SalesColumn; label: string; icon: React.ReactNode; color: string; bg: string }[] = [
  { id: 'Novo',         label: 'Novo',         icon: <Sparkles className="h-3.5 w-3.5" />, color: 'text-rose-600',    bg: 'bg-rose-50' },
  { id: 'Qualificado',  label: 'Qualificado',  icon: <Target   className="h-3.5 w-3.5" />, color: 'text-amber-600',   bg: 'bg-amber-50' },
  { id: 'Interessado',  label: 'Interessado',  icon: <Zap      className="h-3.5 w-3.5" />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { id: 'Lead Fechado', label: 'Lead Fechado', icon: <Trophy   className="h-3.5 w-3.5" />, color: 'text-blue-600',    bg: 'bg-blue-50' },
];

const PipelineMiniCard: React.FC<{ lead: ProspectLead; onClick: () => void }> = ({ lead, onClick }) => {
  const priority = lead.opportunityLevel;
  const dotClass =
    priority === 'quente' ? 'bg-rose-500 shadow-sm shadow-rose-300 animate-pulse'
    : priority === 'boa'   ? 'bg-emerald-500'
    : priority === 'média' ? 'bg-amber-500'
    : 'bg-slate-300';

  const scoreClass =
    lead.opportunityScore >= 80 ? 'text-rose-600 bg-rose-50'
    : lead.opportunityScore >= 60 ? 'text-amber-600 bg-amber-50'
    : 'text-slate-500 bg-slate-100';

  const hasAlert = lead.contactStatus === 'Reenvio vencido' || lead.contactStatus === 'Erro no envio';
  const isDiscarded = lead.contactStatus === 'Lead descartado';
  const isNoInterest = lead.contactStatus === 'Cliente sem interesse';
  const isInactive = isDiscarded || isNoInterest || lead.contactStatus === 'Não contactar';

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
      className={cn(
        "group flex items-center gap-2.5 rounded-xl border border-slate-200/70 bg-white",
        "px-3 py-2.5 cursor-grab active:cursor-grabbing transition-all duration-200",
        "hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
        hasAlert && "ring-1 ring-rose-500/50 border-rose-200 bg-rose-50/20",
        isInactive && "opacity-60 grayscale bg-slate-50"
      )}
      title={`${lead.companyName} • Score ${lead.opportunityScore} • Status: ${lead.contactStatus || 'Novo'}`}
    >
      <div className="relative shrink-0">
        {isDiscarded || isNoInterest ? (
          <div className="h-2 w-2 flex items-center justify-center">
            {isDiscarded ? <Ban className="h-2.5 w-2.5 text-slate-400" /> : <UserMinus className="h-2.5 w-2.5 text-slate-400" />}
          </div>
        ) : (
          <span aria-hidden className={cn("block h-2 w-2 rounded-full", dotClass)} />
        )}
        
        {hasAlert && (
          <span className="absolute -top-1 -right-1 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500 shadow-sm border border-white"></span>
          </span>
        )}
      </div>
      
      <span className={cn(
        "flex-1 min-w-0 text-[13px] font-semibold truncate leading-tight",
        hasAlert ? "text-rose-900" : isInactive ? "text-slate-400 italic" : "text-slate-800"
      )}>
        {lead.companyName || 'Sem nome'}
      </span>
      
      <span className={cn(
        "shrink-0 inline-flex items-center justify-center rounded-md px-1.5 py-0.5 text-[10px] font-black tabular-nums",
        isInactive ? "text-slate-300 bg-slate-100" : scoreClass
      )}>
        {lead.opportunityScore}
      </span>
    </div>
  );
};

export const LeadPipeline: React.FC<LeadPipelineProps> = ({ leads, onMoveLead, onEditLead }) => {
  const { discardLead, markNoInterest, undoDiscard } = useProspectingStore();
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false);
  const [noInterestDialogOpen, setNoInterestDialogOpen] = useState(false);
  const [pendingLeadId, setPendingLeadId] = useState<string | null>(null);
  const [discardReason, setDiscardReason] = useState("");
  const [noInterestReason, setNoInterestReason] = useState("");

  const getLeadsByStatus = (status: SalesColumn) => leads.filter(l => l.status === status);

  const handleDiscard = () => {
    if (pendingLeadId && discardReason) {
      discardLead(pendingLeadId, discardReason, "", 'drag');
      setDiscardDialogOpen(false);
      setPendingLeadId(null);
      setDiscardReason("");
      toast.error("Lead descartado", {
        description: "Ação registrada com sucesso.",
        action: {
          label: "Desfazer",
          onClick: () => undoDiscard(pendingLeadId)
        }
      });
    }
  };

  const handleNoInterest = () => {
    if (pendingLeadId && noInterestReason) {
      markNoInterest(pendingLeadId, noInterestReason, "", 'drag');
      setNoInterestDialogOpen(false);
      setPendingLeadId(null);
      setNoInterestReason("");
      toast.warning("Lead marcado como sem interesse", {
        description: "Registro de perda concluído.",
        action: {
          label: "Desfazer",
          onClick: () => undoDiscard(pendingLeadId)
        }
      });
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex gap-6 overflow-x-auto pb-8 min-h-[640px] scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
        {SALES_COLUMNS.map((column) => {
          const columnLeads = getLeadsByStatus(column.id);
          return (
            <div key={column.id} className="flex-shrink-0 w-[320px] flex flex-col gap-4">
              <div className="flex items-center justify-between px-4 py-3 bg-white rounded-2xl border border-slate-100 shadow-sm ring-1 ring-slate-900/5">
                <div className={cn("flex items-center gap-2.5 font-black text-[11px] uppercase tracking-widest", column.color)}>
                  <span className={cn("p-1.5 rounded-lg", column.bg)}>{column.icon}</span>
                  {column.label}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-slate-400 tabular-nums bg-slate-100 px-2 py-0.5 rounded-md border-none">
                    {columnLeads.length}
                  </span>
                </div>
              </div>

              <div
                className="flex-1 rounded-[2rem] p-3 flex flex-col gap-2.5 min-h-[560px] bg-slate-50/40 border border-slate-100/50 shadow-inner transition-all duration-300"
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.add('bg-primary/[0.03]', 'ring-2', 'ring-primary/10', 'ring-inset', 'scale-[1.01]');
                  e.dataTransfer.dropEffect = 'move';
                }}
                onDragLeave={(e) => {
                  e.currentTarget.classList.remove('bg-primary/[0.03]', 'ring-2', 'ring-primary/10', 'ring-inset', 'scale-[1.01]');
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove('bg-primary/[0.03]', 'ring-2', 'ring-primary/10', 'ring-inset', 'scale-[1.01]');
                  const leadId = e.dataTransfer.getData('leadId');
                  if (leadId) onMoveLead(leadId, column.id);
                }}
              >
                <AnimatePresence mode="popLayout">
                  {columnLeads.map((lead) => (
                    <motion.div
                      key={lead.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8, filter: 'grayscale(1)', x: -20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('leadId', lead.id);
                          e.dataTransfer.effectAllowed = 'move';
                        }}
                        className="active:cursor-grabbing"
                      >
                        <PipelineMiniCard lead={lead} onClick={() => onEditLead?.(lead, 'overview')} />
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {columnLeads.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 opacity-30 select-none">
                    <div className="w-14 h-14 rounded-3xl border-2 border-dashed border-slate-300 flex items-center justify-center mb-4 bg-white/50">
                      <Inbox className="h-6 w-6 text-slate-300" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Vazio</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Drop Zone para Perdido */}
      <div className="grid grid-cols-2 gap-6 px-4">
        <div 
          className="group relative flex flex-col items-center justify-center py-8 px-6 rounded-[2.5rem] border-2 border-dashed border-rose-200 bg-rose-50/30 transition-all hover:bg-rose-100/50 hover:border-rose-400 cursor-default overflow-hidden"
          onDragOver={(e) => {
            e.preventDefault();
            e.currentTarget.classList.add('bg-rose-200/50', 'border-rose-500', 'scale-[1.02]');
          }}
          onDragLeave={(e) => {
            e.currentTarget.classList.remove('bg-rose-200/50', 'border-rose-500', 'scale-[1.02]');
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.currentTarget.classList.remove('bg-rose-200/50', 'border-rose-500', 'scale-[1.02]');
            const leadId = e.dataTransfer.getData('leadId');
            if (leadId) {
              setPendingLeadId(leadId);
              setDiscardDialogOpen(true);
            }
          }}
        >
          <div className="p-4 rounded-3xl bg-white shadow-xl shadow-rose-200/50 mb-3 group-hover:scale-110 transition-transform">
            <Trash2 className="h-6 w-6 text-rose-500" />
          </div>
          <h3 className="text-sm font-black text-rose-900 uppercase tracking-widest">Descartar Lead</h3>
          <p className="text-[10px] text-rose-600/70 font-bold mt-1">Solte aqui para remover do pipeline</p>
        </div>

        <div 
          className="group relative flex flex-col items-center justify-center py-8 px-6 rounded-[2.5rem] border-2 border-dashed border-amber-200 bg-amber-50/30 transition-all hover:bg-amber-100/50 hover:border-amber-400 cursor-default overflow-hidden"
          onDragOver={(e) => {
            e.preventDefault();
            e.currentTarget.classList.add('bg-amber-200/50', 'border-amber-500', 'scale-[1.02]');
          }}
          onDragLeave={(e) => {
            e.currentTarget.classList.remove('bg-amber-200/50', 'border-amber-500', 'scale-[1.02]');
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.currentTarget.classList.remove('bg-amber-200/50', 'border-amber-500', 'scale-[1.02]');
            const leadId = e.dataTransfer.getData('leadId');
            if (leadId) {
              setPendingLeadId(leadId);
              setNoInterestDialogOpen(true);
            }
          }}
        >
          <div className="p-4 rounded-3xl bg-white shadow-xl shadow-amber-200/50 mb-3 group-hover:scale-110 transition-transform">
            <UserMinus className="h-6 w-6 text-amber-500" />
          </div>
          <h3 className="text-sm font-black text-amber-900 uppercase tracking-widest">Sem Interesse</h3>
          <p className="text-[10px] text-amber-600/70 font-bold mt-1">Solte aqui para marcar como sem interesse</p>
        </div>
      </div>

      {/* Diálogos de Confirmação */}
      <Dialog open={discardDialogOpen} onOpenChange={setDiscardDialogOpen}>
        <DialogContent className="max-w-md rounded-[2.5rem] border-none shadow-2xl p-8">
          <DialogHeader className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-rose-50">
                <Ban className="h-6 w-6 text-rose-500" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-black text-rose-900 tracking-tight">Descartar Lead</DialogTitle>
                <DialogDescription className="text-rose-600 font-bold text-xs uppercase tracking-widest mt-1">Confirmação Obrigatória</DialogDescription>
              </div>
            </div>
            {(() => {
              const lead = leads.find(l => l.id === pendingLeadId);
              if (!lead) return null;
              return (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                  <p className="text-sm font-bold text-slate-700">Lead: <span className="text-primary">{lead.companyName}</span></p>
                  <p className="text-sm font-bold text-slate-700">Valor Esperado: <span className="text-emerald-600">R$ {lead.revenueInsight?.expectedValue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></p>
                  {lead.opportunityLevel === 'quente' && (
                    <div className="flex items-center gap-2 p-2 bg-rose-500 text-white rounded-lg animate-pulse">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-[10px] font-black uppercase tracking-tighter">Atenção: Lead de alto potencial!</span>
                    </div>
                  )}
                </div>
              );
            })()}
          </DialogHeader>
          <div className="py-4">
            <Select value={discardReason} onValueChange={setDiscardReason}>
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
            <Button variant="ghost" onClick={() => setDiscardDialogOpen(false)} className="rounded-xl font-bold">Cancelar</Button>
            <Button 
              variant="destructive" 
              disabled={!discardReason}
              onClick={handleDiscard}
              className="rounded-xl font-black bg-rose-600 hover:bg-rose-700 h-11"
            >
              Confirmar Descarte
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={noInterestDialogOpen} onOpenChange={setNoInterestDialogOpen}>
        <DialogContent className="max-w-md rounded-[2.5rem] border-none shadow-2xl p-8">
          <DialogHeader className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-amber-50">
                <UserMinus className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-black text-amber-900 tracking-tight">Sem Interesse</DialogTitle>
                <DialogDescription className="text-amber-600 font-bold text-xs uppercase tracking-widest mt-1">Confirmação de Perda</DialogDescription>
              </div>
            </div>
            {(() => {
              const lead = leads.find(l => l.id === pendingLeadId);
              if (!lead) return null;
              return (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                  <p className="text-sm font-bold text-slate-700">Lead: <span className="text-primary">{lead.companyName}</span></p>
                  <p className="text-sm font-bold text-slate-700">Valor Esperado: <span className="text-emerald-600">R$ {lead.revenueInsight?.expectedValue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></p>
                </div>
              );
            })()}
          </DialogHeader>
          <div className="py-4">
            <Select value={noInterestReason} onValueChange={setNoInterestReason}>
              <SelectTrigger className="rounded-xl border-slate-100 bg-slate-50 h-12">
                <SelectValue placeholder="Qual o motivo?" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-100">
                <SelectItem value="Já possui agência/parceiro">Já possui agência/parceiro</SelectItem>
                <SelectItem value="Sem orçamento no momento">Sem orçamento no momento</SelectItem>
                <SelectItem value="Não é o decisor">Não é o decisor</SelectItem>
                <SelectItem value="Achou o serviço caro">Achou o serviço caro</SelectItem>
                <SelectItem value="Outro">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setNoInterestDialogOpen(false)} className="rounded-xl font-bold">Cancelar</Button>
            <Button 
              disabled={!noInterestReason}
              onClick={handleNoInterest}
              className="rounded-xl font-black bg-amber-500 hover:bg-amber-600 text-white h-11"
            >
              Marcar Sem Interesse
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
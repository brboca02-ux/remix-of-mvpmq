import React from 'react';
import { Button } from "@/components/ui/button";
import { 
  ArrowRightLeft, 
  Send, 
  Trash2, 
  X,
  CheckCircle2
} from "lucide-react";
import { ProspectLead } from '../../prospecting/types';

interface BulkActionsProps {
  selectedCount: number;
  onClear: () => void;
  onBulkMove: (status: ProspectLead['status']) => void;
  onBulkDelete: () => void;
  onBulkProposal: () => void;
}

export const BulkActions: React.FC<BulkActionsProps> = ({
  selectedCount,
  onClear,
  onBulkMove,
  onBulkDelete,
  onBulkProposal
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-950/95 backdrop-blur-md text-white px-6 py-4 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/10 flex items-center gap-6 z-50 animate-in slide-in-from-bottom-12 duration-500 ease-out">
      <div className="flex items-center gap-3 pr-6 border-r border-slate-700">
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center font-bold text-sm">
          {selectedCount}
        </div>
        <span className="text-sm font-medium">Leads Selecionados</span>
        <Button variant="ghost" size="icon" onClick={onClear} className="h-8 w-8 text-slate-400 hover:text-white">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => onBulkMove('Lead Qualificado')}
          className="gap-2 text-xs font-bold hover:bg-slate-800"
        >
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          Qualificar
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onBulkProposal}
          className="gap-2 text-xs font-bold hover:bg-slate-800"
        >
          <Send className="h-4 w-4 text-blue-400" />
          Enviar Proposta
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => onBulkMove('Lead Fechado')}
          className="gap-2 text-xs font-bold hover:bg-slate-800"
        >
          <ArrowRightLeft className="h-4 w-4 text-purple-400" />
          Mover Status
        </Button>
        <div className="w-px h-6 bg-slate-700 mx-2" />
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onBulkDelete}
          className="gap-2 text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-950/30"
        >
          <Trash2 className="h-4 w-4" />
          Excluir
        </Button>
      </div>
    </div>
  );
};

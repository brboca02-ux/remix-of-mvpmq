import React from 'react';
import { 
  MessageCircle, 
  Linkedin, 
  Mail, 
  Instagram, 
  ArrowRight, 
  CheckCircle2, 
  Clock,
  AlertCircle,
  Zap,
  Search,
  Send,
  Trophy,
  Inbox,
  Sparkles
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AuditLog } from "@/hooks/useAuditStore";

interface TimelineViewProps {
  logs: AuditLog[];
}

export const TimelineView: React.FC<TimelineViewProps> = ({ logs }) => {
  const getIcon = (log: AuditLog) => {
    const statusChange = log.changes.find(c => c.field === 'status');
    const newStatus = statusChange?.after as string || '';

    if (newStatus.includes('WhatsApp')) return <MessageCircle className="h-3.5 w-3.5 text-emerald-500" />;
    if (newStatus.includes('LinkedIn')) return <Linkedin className="h-3.5 w-3.5 text-blue-600" />;
    if (newStatus.includes('Mail')) return <Mail className="h-3.5 w-3.5 text-cyan-500" />;
    if (newStatus.includes('Instagram')) return <Instagram className="h-3.5 w-3.5 text-pink-500" />;
    if (newStatus === 'Lead Fechado') return <Trophy className="h-3.5 w-3.5 text-amber-500" />;
    if (newStatus === 'Lead Qualificado') return <Zap className="h-3.5 w-3.5 text-purple-500" />;
    if (newStatus === 'Em Diagnóstico') return <Search className="h-3.5 w-3.5 text-amber-600" />;
    if (newStatus === 'Proposta Enviada') return <Send className="h-3.5 w-3.5 text-cyan-500" />;
    if (newStatus === 'Follow-Up') return <Sparkles className="h-3.5 w-3.5 text-orange-500" />;
    if (log.action === 'add') return <Inbox className="h-3.5 w-3.5 text-slate-400" />;
    
    return <ArrowRight className="h-3.5 w-3.5 text-slate-400" />;
  };

  const getLogDescription = (log: AuditLog) => {
    const statusChange = log.changes.find(c => c.field === 'status');
    if (statusChange) {
      return (
        <span>
          Status mudou de <span className="font-bold text-slate-500">"{statusChange.before || 'Novo'}"</span> para <span className="font-bold text-primary">"{statusChange.after}"</span>
        </span>
      );
    }
    return `Atualizou ${log.changes.length} campo(s)`;
  };

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground opacity-50 italic">
        <AlertCircle className="h-8 w-8 mb-2" />
        <p>Nenhuma atividade registrada.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative before:absolute before:inset-y-0 before:left-3.5 before:w-0.5 before:bg-slate-100">
      {logs.map((log) => (
        <div key={log.id} className="relative pl-10">
          <div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-white border-2 border-slate-100 flex items-center justify-center z-10 shadow-sm">
            {getIcon(log)}
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
              {format(log.timestamp, "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}
            </span>
            <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 hover:border-primary/20 transition-colors group">
              <p className="text-sm text-slate-700 leading-tight">
                {getLogDescription(log)}
              </p>
              <p className="text-[10px] text-muted-foreground mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                Fonte: {log.source} • Ref: {log.id.slice(0, 8)}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

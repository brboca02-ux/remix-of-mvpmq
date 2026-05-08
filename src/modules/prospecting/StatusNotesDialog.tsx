import React, { useMemo, useRef, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { 
  Paperclip, 
  Trash2, 
  Download, 
  MessageSquare, 
  Bot, 
  User as UserIcon,
  Search,
  Filter,
  FileDown,
  Mail,
  AlertCircle as Bell,
  CheckCircle2,
  Circle,
  Sparkles
} from '@/lib/icons';
import { ProspectLead, StatusAttachment, StatusNote } from './types';
import { useProspectingStore } from './prospecting-store';
import { toast } from 'sonner';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB per file (localStorage friendly)
const MAX_FILES = 5;

interface Props {
  lead: ProspectLead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export const StatusNotesDialog: React.FC<Props> = ({ lead, open, onOpenChange }) => {
  const { addStatusNote, deleteStatusNote, updateRequestChecklist } = useProspectingStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState('');
  const [pendingFiles, setPendingFiles] = useState<StatusAttachment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAuthor, setFilterAuthor] = useState<string>('all');

  const notes = useMemo(() => {
    if (!lead) return [] as StatusNote[];
    let filtered = [...(lead.statusNotes || [])];
    
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(n => 
        n.message.toLowerCase().includes(lower) || 
        n.status.toLowerCase().includes(lower) ||
        (n.author || '').toLowerCase().includes(lower) ||
        n.attachments.some(a => a.name.toLowerCase().includes(lower))
      );
    }

    if (filterAuthor !== 'all') {
      filtered = filtered.filter(n => 
        filterAuthor === 'system' ? n.kind === 'system' : n.kind === 'manual'
      );
    }

    return filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [lead, searchTerm, filterAuthor]);

  const grouped = useMemo(() => {
    const map = new Map<string, StatusNote[]>();
    for (const n of notes) {
      const arr = map.get(n.status) || [];
      arr.push(n);
      map.set(n.status, arr);
    }
    return Array.from(map.entries());
  }, [notes]);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const next: StatusAttachment[] = [...pendingFiles];
    for (const file of Array.from(files)) {
      if (next.length >= MAX_FILES) {
        toast.error(`Máximo de ${MAX_FILES} anexos por comentário.`);
        break;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`"${file.name}" excede 2MB e foi ignorado.`);
        continue;
      }
      try {
        const dataUrl = await fileToDataUrl(file);
        next.push({
          id: crypto.randomUUID(),
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          dataUrl,
        });
      } catch {
        toast.error(`Falha ao ler "${file.name}".`);
      }
    }
    setPendingFiles(next);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = () => {
    if (!lead) return;
    if (!message.trim() && pendingFiles.length === 0) {
      toast.error('Adicione um comentário ou um anexo.');
      return;
    }
    addStatusNote(lead.id, {
      message: message.trim() || '(sem texto)',
      attachments: pendingFiles,
    });
    
    // Simulação de Notificação
    if (pendingFiles.length > 0) {
      toast.info(`Equipe notificada sobre ${pendingFiles.length} novo(s) anexo(s).`, {
        icon: <Bell className="h-4 w-4" />
      });
    }

    setMessage('');
    setPendingFiles([]);
    toast.success('Registro adicionado ao status.');
  };

  const downloadAttachment = (att: StatusAttachment) => {
    const a = document.createElement('a');
    a.href = att.dataUrl;
    a.download = att.name;
    a.click();
  };

  const handleExportPDF = () => {
    if (!lead) return;
    toast.loading("Formatando timeline profissional em PDF...", { id: "export-timeline" });
    
    setTimeout(() => {
      const doc = new jsPDF();
      
      // Header
      doc.setFillColor(30, 58, 138); // Primary color
      doc.rect(0, 0, 210, 30, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.text(`Timeline de Negociações: ${lead.companyName}`, 20, 20);
      
      // Content
      const tableData = notes.map(n => [
        formatDate(n.createdAt),
        n.status,
        n.kind === 'system' ? 'Sistema' : (n.author || 'Usuário'),
        n.message
      ]);

      const steps = [
        { label: 'Briefing', ok: lead.requestChecklist?.briefingReceived },
        { label: 'Arquivos', ok: lead.requestChecklist?.filesReceived },
        { label: 'Diagnóstico', ok: lead.requestChecklist?.diagnosisDone },
        { label: 'Proposta', ok: lead.requestChecklist?.proposalSent },
        { label: 'Agendamento', ok: lead.requestChecklist?.serviceScheduled },
        { label: 'Pagamento', ok: lead.requestChecklist?.paymentConfirmed },
        { label: 'Entrega', ok: lead.requestChecklist?.deliveryCompleted },
      ];
      
      const checklistStr = steps.map(s => `${s.label}: ${s.ok ? '[OK]' : '[Pendente]'}`).join(' | ');
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Checklist de Entrega: ${checklistStr}`, 20, 35);
      
      autoTable(doc, {
        startY: 45,
        head: [['Data', 'Status', 'Autor', 'Mensagem']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [30, 58, 138] },
        columnStyles: {
          3: { cellWidth: 80 }
        }
      });
      
      const filename = `Timeline-${lead.companyName.toLowerCase().replace(/\s+/g, '-')}.pdf`;
      doc.save(filename);
      toast.success("Relatório de negociações exportado!", { id: "export-timeline" });
    }, 1500);
  };

  const handleExportCustomPDF = () => {
    const note = prompt("Adicione uma nota personalizada para o relatório (opcional):");
    if (note === null) return;
    
    toast.loading("Gerando relatório personalizado...", { id: "export-custom" });
    setTimeout(() => {
      const doc = new jsPDF();
      doc.setFillColor(30, 58, 138);
      doc.rect(0, 0, 210, 30, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.text(`Relatório Executivo: ${lead?.companyName}`, 20, 20);
      
      if (note) {
        doc.setTextColor(50, 50, 50);
        doc.setFontSize(10);
        doc.text(`Nota do Consultor: ${note}`, 20, 40);
      }

      const tableData = notes.map(n => [formatDate(n.createdAt), n.status, n.message]);
      autoTable(doc, {
        startY: note ? 50 : 40,
        head: [['Data', 'Status', 'Mensagem']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [30, 58, 138] }
      });
      
      doc.save(`Relatorio-${lead?.companyName.toLowerCase().replace(/\s+/g, '-')}.pdf`);
      toast.success("Relatório personalizado gerado!", { id: "export-custom" });
    }, 1500);
  };

  if (!lead) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between pr-8">
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Negociações & Evidências
            </DialogTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-8 gap-2 text-[10px] font-bold" onClick={handleExportPDF}>
                <FileDown className="h-4 w-4" /> Timeline
              </Button>
              <Button variant="outline" size="sm" className="h-8 gap-2 text-[10px] font-bold" onClick={handleExportCustomPDF}>
                <Sparkles className="h-4 w-4" /> Relatório Personalizado
              </Button>
            </div>
          </div>
          <DialogDescription>
            {lead.companyName} · status atual:{' '}
            <Badge variant="secondary" className="ml-1">{lead.status}</Badge>
          </DialogDescription>
        </DialogHeader>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input 
              placeholder="Buscar na timeline..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-8 h-8 text-xs"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <select 
              value={filterAuthor}
              onChange={e => setFilterAuthor(e.target.value)}
              className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-xs ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="all">Todos os autores</option>
              <option value="user">Apenas equipe</option>
              <option value="system">Apenas sistema</option>
            </select>
          </div>
        </div>

        {/* Service Checklist Improvement */}
        {['Recebido', 'Em Diagnóstico', 'Proposta Enviada', 'Agendado'].includes(lead.status) && (
          <div className="mb-4 p-4 rounded-xl bg-primary/5 border border-primary/10">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" /> Checklist de Entrega
              </h4>
              {(() => {
                const steps = [
                  lead.requestChecklist?.briefingReceived,
                  lead.requestChecklist?.filesReceived,
                  lead.requestChecklist?.diagnosisDone,
                  lead.requestChecklist?.proposalSent,
                  lead.requestChecklist?.serviceScheduled,
                  lead.requestChecklist?.paymentConfirmed,
                  lead.requestChecklist?.deliveryCompleted
                ];
                const progress = Math.round((steps.filter(Boolean).length / steps.length) * 100);
                return (
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={`text-[10px] font-bold border-primary/20 ${progress === 100 ? 'text-success border-success/30 bg-success/5 animate-pulse' : 'text-primary'}`}>
                      {progress === 100 ? 'Finalizado' : `${progress}% Concluído`}
                    </Badge>
                  </div>
                );
              })()}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { key: 'briefingReceived', label: 'Briefing' },
                { key: 'filesReceived', label: 'Arquivos' },
                { key: 'diagnosisDone', label: 'Diagnóstico' },
                { key: 'proposalSent', label: 'Proposta' },
                { key: 'serviceScheduled', label: 'Agendado' },
                { key: 'paymentConfirmed', label: 'Pagamento' },
                { key: 'deliveryCompleted', label: 'Entrega' },
              ].map((item, idx, arr) => {
                const isChecked = lead.requestChecklist?.[item.key as keyof typeof lead.requestChecklist] || false;
                const isNext = !isChecked && (idx === 0 || !!lead.requestChecklist?.[arr[idx-1].key as keyof typeof lead.requestChecklist]);
                
                return (
                  <button
                    key={item.key}
                    onClick={() => {
                      updateRequestChecklist(lead.id, { [item.key]: !isChecked });
                      toast.info(`Progresso: ${item.label} atualizado`, { duration: 1500 });
                    }}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all border ${
                      isChecked 
                        ? 'bg-success/10 border-success/20 text-success' 
                        : isNext 
                          ? 'bg-primary/5 border-primary/30 text-primary shadow-sm scale-[1.02]'
                          : 'bg-background border-white/5 text-muted-foreground opacity-60 hover:opacity-100'
                    }`}
                  >
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center border-2 ${isChecked ? 'bg-success border-success text-white' : isNext ? 'border-primary' : 'border-muted'}`}>
                      {isChecked ? <CheckCircle2 className="h-4 w-4" /> : <span className="text-[10px] font-bold">{idx + 1}</span>}
                    </div>
                    <span className="text-[10px] font-black uppercase text-center leading-none">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Form */}
        <div className="space-y-3 border rounded-xl p-3 bg-muted/30">
          <Textarea
            placeholder={`Registrar negociação no status "${lead.status}" (ex: cliente pediu desconto, agendou call para sexta, etc)`}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
          />
          {pendingFiles.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {pendingFiles.map((f) => (
                <Badge key={f.id} variant="outline" className="gap-1.5 py-1.5">
                  <Paperclip className="h-3 w-3" /> {f.name} · {formatBytes(f.size)}
                  <button
                    onClick={() => setPendingFiles(pendingFiles.filter(p => p.id !== f.id))}
                    className="ml-1 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="gap-2"
            >
              <Paperclip className="h-4 w-4" /> Anexar (máx 2MB cada)
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <Button onClick={handleSubmit} size="sm" className="font-bold">
              Adicionar registro
            </Button>
          </div>
        </div>

        {/* Evaluation/Feedback Section Improvement */}
        {lead.requestChecklist?.deliveryCompleted && (
          <div className="p-4 rounded-xl bg-success/5 border border-success/10 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-success flex items-center gap-2">
              <Sparkles className="h-4 w-4" /> Avaliação da Experiência
            </h4>
            <div className="flex flex-wrap gap-2">
              {['Excelente', 'Bom', 'Ok', 'Ruim', 'Péssimo'].map((rating) => (
                <button
                  key={rating}
                  onClick={() => updateRequestChecklist(lead.id, { clientFeedback: rating as any })}
                  className={`text-[10px] px-3 py-1.5 rounded-full border transition-all ${
                    lead.requestChecklist?.clientFeedback === rating
                      ? 'bg-success text-white border-success font-bold'
                      : 'bg-background border-white/10 text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {rating}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Timeline */}
        <ScrollArea className="max-h-[400px] pr-3">
          {grouped.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum registro ainda. Adicione o primeiro acima.
            </p>
          ) : (
            <div className="space-y-5">
              {grouped.map(([status, items]) => (
                <div key={status}>
                  <div className="flex items-center gap-2 mb-2 sticky top-0 bg-background py-1">
                    <Badge className="font-bold">{status}</Badge>
                    <span className="text-xs text-muted-foreground">{items.length} registro(s)</span>
                  </div>
                  <div className="space-y-2 border-l-2 border-muted pl-4">
                    {items.map((n) => (
                      <div key={n.id} className="rounded-lg border bg-card p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {n.kind === 'system' ? (
                              <Bot className="h-3.5 w-3.5" />
                            ) : (
                              <UserIcon className="h-3.5 w-3.5" />
                            )}
                            <span>{n.kind === 'system' ? 'Sistema' : (n.author || 'Você')}</span>
                            <span>·</span>
                            <span>{formatDate(n.createdAt)}</span>
                          </div>
                          <button
                            onClick={() => deleteStatusNote(lead.id, n.id)}
                            className="text-muted-foreground hover:text-destructive"
                            title="Remover"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <p className="text-sm mt-1.5 whitespace-pre-wrap">{n.message}</p>
                        {n.attachments.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {n.attachments.map((att) => (
                              <button
                                key={att.id}
                                onClick={() => downloadAttachment(att)}
                                className="inline-flex items-center gap-1.5 text-xs bg-muted hover:bg-muted/70 rounded px-2 py-1 transition"
                              >
                                <Download className="h-3 w-3" />
                                {att.name}
                                <span className="text-muted-foreground">({formatBytes(att.size)})</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

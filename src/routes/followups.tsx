import React, { useMemo, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Bell, Mail, MessageCircle, RefreshCw, X, Play, Pause, CheckCircle2,
  AlertCircle, Clock, Send, Inbox, Activity
} from 'lucide-react';
import { toast } from 'sonner';
import { useFollowupStore, FollowupTask, FollowupStatus, FollowupChannel } from '@/modules/followup/followup-store';
import { useFollowupQueueRunner } from '@/modules/followup/useFollowupQueueRunner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const Route = createFileRoute('/followups')({
  component: FollowupsPage,
});

const statusColor: Record<FollowupStatus, string> = {
  pending: 'bg-slate-100 text-slate-700 border-slate-200',
  queued: 'bg-blue-100 text-blue-700 border-blue-200',
  sending: 'bg-amber-100 text-amber-700 border-amber-200 animate-pulse',
  sent: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  delivered: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  read: 'bg-emerald-200 text-emerald-800 border-emerald-300',
  failed: 'bg-rose-100 text-rose-700 border-rose-200',
  canceled: 'bg-slate-100 text-slate-500 border-slate-200',
  paused_auto: 'bg-amber-100 text-amber-800 border-amber-300',
};

const statusLabel: Record<FollowupStatus, string> = {
  pending: 'Pendente',
  queued: 'Na fila',
  sending: 'Enviando',
  sent: 'Enviado',
  delivered: 'Entregue',
  read: 'Lido',
  failed: 'Falhou',
  canceled: 'Cancelado',
  paused_auto: 'Auto-pausado',
};

const channelIcon = (c: FollowupChannel) =>
  c === 'email' ? <Mail className="h-3.5 w-3.5" /> : <MessageCircle className="h-3.5 w-3.5" />;

function FollowupsPage() {
  useFollowupQueueRunner();

  const { sequences, tasks, processQueue, retryTask, cancelTask, pauseSequence, resumeSequence, cancelSequence } =
    useFollowupStore();
  const [tab, setTab] = useState('upcoming');

  const now = new Date();
  const upcoming = useMemo(
    () => tasks
      .filter(t => t.status === 'pending' || t.status === 'queued' || t.status === 'sending')
      .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt)),
    [tasks]
  );
  const dueNow = useMemo(
    () => upcoming.filter(t => new Date(t.scheduledAt) <= now),
    [upcoming, now]
  );
  const sent = useMemo(
    () => tasks
      .filter(t => t.status === 'sent' || t.status === 'delivered' || t.status === 'read')
      .sort((a, b) => (b.sentAt || '').localeCompare(a.sentAt || '')),
    [tasks]
  );
  const failed = useMemo(
    () => tasks.filter(t => t.status === 'failed'),
    [tasks]
  );

  const stats = {
    activeSequences: sequences.filter(s => s.status === 'active').length,
    dueNow: dueNow.length,
    delivered: tasks.filter(t => t.status === 'delivered' || t.status === 'read').length,
    failed: failed.length,
  };

  const handleProcessNow = async () => {
    if (dueNow.length === 0) {
      toast.info('Nenhuma tarefa vencida no momento.');
      return;
    }
    toast.loading(`Processando ${dueNow.length} envio(s)...`, { id: 'process-q' });
    await processQueue();
    toast.success('Fila processada com sucesso!', { id: 'process-q' });
  };

  const renderTaskRow = (t: FollowupTask) => (
    <TableRow key={t.id}>
      <TableCell>
        <div className="font-medium text-sm">{t.leadName}</div>
        <div className="text-xs text-muted-foreground">{t.offerName}</div>
      </TableCell>
      <TableCell>
        <Badge className={`font-bold border-none shadow-sm ${
          t.step === 0 ? 'stage-d0' : 
          t.step === 3 ? 'stage-d3' : 
          'stage-d7'
        }`}>D+{t.step}</Badge>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="gap-1">
          {channelIcon(t.channel)}
          <span className="capitalize">{t.channel}</span>
        </Badge>
      </TableCell>
      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{t.recipient}</TableCell>
      <TableCell className="text-xs">
        {format(new Date(t.scheduledAt), "dd/MM HH:mm", { locale: ptBR })}
      </TableCell>
      <TableCell>
        <Badge variant="outline" className={statusColor[t.status]}>
          {statusLabel[t.status]}
        </Badge>
        {t.errorMessage && (
          <div className="text-[10px] text-rose-600 mt-1 max-w-[180px] truncate" title={t.errorMessage}>
            {t.errorMessage}
          </div>
        )}
      </TableCell>
      <TableCell className="text-right">
        {t.status === 'failed' && (
          <Button size="sm" variant="ghost" onClick={() => { retryTask(t.id); toast.success('Reagendado'); }}>
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        )}
        {(t.status === 'pending' || t.status === 'queued') && (
          <Button size="sm" variant="ghost" onClick={() => { cancelTask(t.id); toast.success('Cancelado'); }}>
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </TableCell>
    </TableRow>
  );

  return (
    <div className="container mx-auto py-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Bell className="h-7 w-7 text-primary" /> Follow-ups Automáticos
          </h1>
          <p className="text-muted-foreground">
            Sequência D0 → D+3 → D+7 com fila de envio e status de entrega em tempo real.
          </p>
        </div>
        <Button onClick={handleProcessNow} className="gap-2 rounded-xl shadow-lg shadow-primary/20">
          <Send className="h-4 w-4" /> Processar Fila Agora
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Sequências Ativas" value={stats.activeSequences} icon={Activity} color="text-blue-500" />
        <StatCard label="Vencidos Agora" value={stats.dueNow} icon={Clock} color="text-amber-500" highlight={stats.dueNow > 0} />
        <StatCard label="Entregues" value={stats.delivered} icon={CheckCircle2} color="text-emerald-500" />
        <StatCard label="Falhas" value={stats.failed} icon={AlertCircle} color="text-rose-500" />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-muted/50">
          <TabsTrigger value="upcoming">Próximos & Pendentes ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="sent">Enviados ({sent.length})</TabsTrigger>
          <TabsTrigger value="failed">Falhas ({failed.length})</TabsTrigger>
          <TabsTrigger value="sequences">Sequências ({sequences.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Lembretes do CRM</CardTitle>
              <CardDescription>
                Tarefas agendadas. As vencidas são processadas automaticamente a cada 30s ou ao clicar em "Processar Fila Agora".
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FollowupTable rows={upcoming} render={renderTaskRow} emptyMessage="Nenhum follow-up agendado. Crie um a partir de uma oferta no Catálogo." />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sent" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Envios</CardTitle>
              <CardDescription>Mensagens enviadas com confirmação de entrega.</CardDescription>
            </CardHeader>
            <CardContent>
              <FollowupTable rows={sent} render={renderTaskRow} emptyMessage="Nenhum envio registrado ainda." />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="failed" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Falhas no Envio</CardTitle>
              <CardDescription>Use "Reagendar" para reenviar.</CardDescription>
            </CardHeader>
            <CardContent>
              <FollowupTable rows={failed} render={renderTaskRow} emptyMessage="Sem falhas. 🎉" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sequences" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sequences.length === 0 ? (
              <Card className="md:col-span-2">
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Inbox className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  Nenhuma sequência iniciada. Vá ao Catálogo de Ofertas e ative o follow-up de uma oferta.
                </CardContent>
              </Card>
            ) : (
              sequences.map(seq => {
                const seqTasks = tasks.filter(t => t.sequenceId === seq.id).sort((a, b) => a.step - b.step);
                return (
                  <Card key={seq.id} className="overflow-hidden">
                    <div className={`h-1.5 ${
                      seq.status === 'active' ? 'bg-emerald-500'
                      : (seq.status === 'paused' || seq.status === 'paused_auto') ? 'bg-amber-500'
                      : seq.status === 'completed' ? 'bg-blue-500'
                      : 'bg-slate-400'
                    }`} />
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-base">{seq.leadName}</CardTitle>
                          <CardDescription className="text-xs">
                            {seq.offerName}
                            {seq.autoStopReason && <span className="block text-amber-600 font-medium">Motivo: {seq.autoStopReason}</span>}
                          </CardDescription>
                        </div>
                        <Badge variant="outline" className="capitalize">{seq.status === 'paused_auto' ? 'Pausado Autom.' : seq.status}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        {seqTasks.map(t => (
                          <div key={t.id} className="flex items-center gap-2 text-xs">
                            <Badge className={`font-bold w-12 justify-center border-none shadow-sm ${
                              t.step === 0 ? 'stage-d0' : 
                              t.step === 3 ? 'stage-d3' : 
                              'stage-d7'
                            }`}>D+{t.step}</Badge>
                            <Badge variant="outline" className={`${statusColor[t.status]} flex-1 justify-center glass-card`}>
                              {statusLabel[t.status]}
                            </Badge>
                            <span className="text-muted-foreground tabular-nums">
                              {format(new Date(t.scheduledAt), "dd/MM HH:mm", { locale: ptBR })}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2 pt-2 border-t">
                        {seq.status === 'active' && (
                          <Button size="sm" variant="outline" onClick={() => { pauseSequence(seq.id); toast.success('Pausado'); }} className="gap-1 text-xs">
                            <Pause className="h-3 w-3" /> Pausar
                          </Button>
                        )}
                        {seq.status === 'paused' && (
                          <Button size="sm" variant="outline" onClick={() => { resumeSequence(seq.id); toast.success('Retomado'); }} className="gap-1 text-xs">
                            <Play className="h-3 w-3" /> Retomar
                          </Button>
                        )}
                        {seq.status !== 'canceled' && seq.status !== 'completed' && (
                          <Button size="sm" variant="ghost" className="gap-1 text-xs text-rose-600" onClick={() => { cancelSequence(seq.id); toast.success('Cancelado'); }}>
                            <X className="h-3 w-3" /> Cancelar
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, highlight }: any) {
  return (
    <Card className={highlight ? 'border-amber-500/50 shadow-amber-500/10 shadow-lg' : ''}>
      <CardContent className="p-6 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
          <p className="text-3xl font-black mt-1">{value}</p>
        </div>
        <Icon className={`h-8 w-8 ${color}`} />
      </CardContent>
    </Card>
  );
}

function FollowupTable({ rows, render, emptyMessage }: {
  rows: FollowupTask[];
  render: (t: FollowupTask) => React.ReactNode;
  emptyMessage: string;
}) {
  if (rows.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground italic">
        {emptyMessage}
      </div>
    );
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Lead / Oferta</TableHead>
          <TableHead>Etapa</TableHead>
          <TableHead>Canal</TableHead>
          <TableHead>Destinatário</TableHead>
          <TableHead>Agendado</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>{rows.map(render)}</TableBody>
    </Table>
  );
}

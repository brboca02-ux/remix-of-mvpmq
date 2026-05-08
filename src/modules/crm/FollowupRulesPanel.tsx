import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Bell,
  CheckCircle2,
  Clock,
  Mail,
  MessageCircle,
  Phone,
  Plus,
  Trash2,
  Zap,
  MoreVertical,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';
import {
  DEFAULT_RULES,
  FollowupChannel,
  FollowupRule,
  FollowupTask,
  evaluateRules,
  loadRules,
  loadTasks,
  saveRules,
  saveTasks,
} from './followup-rules';
import { LeadStatus, ProspectLead } from '../prospecting/types';

const STATUS_OPTIONS: LeadStatus[] = [
  'Lead Gerado', 'Qualificado', 'Site gerado', 'Contatado',
  'Cold Mail Enviado', 'LinkedIn Enviado', 'WhatsApp Enviado', 'Instagram Enviado',
  'Follow-Up', 'Lead Qualificado', 'Lead Fechado', 'Perdido',
];

const CHANNELS: FollowupChannel[] = ['WhatsApp', 'Email', 'LinkedIn', 'Instagram', 'Ligação'];

const channelIcon: Record<FollowupChannel, React.ReactNode> = {
  WhatsApp: <MessageCircle className="h-3.5 w-3.5" />,
  Email: <Mail className="h-3.5 w-3.5" />,
  LinkedIn: <MessageCircle className="h-3.5 w-3.5" />,
  Instagram: <MessageCircle className="h-3.5 w-3.5" />,
  Ligação: <Phone className="h-3.5 w-3.5" />,
};

interface Props {
  leads: ProspectLead[];
  onMoveLead: (id: string, newStatus: LeadStatus) => void;
}

export const FollowupRulesPanel: React.FC<Props> = ({ leads, onMoveLead }) => {
  const [rules, setRules] = useState<FollowupRule[]>(() => loadRules());
  const [tasks, setTasks] = useState<FollowupTask[]>(() => loadTasks());
  const [editing, setEditing] = useState<FollowupRule | null>(null);
  const [open, setOpen] = useState(false);

  // Sincroniza tasks locais com storage quando mudam externamente (via evaluator)
  useEffect(() => {
    const interval = setInterval(() => {
      setTasks(loadTasks());
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const persistRules = (next: FollowupRule[]) => {
    setRules(next);
    saveRules(next);
  };

  const persistTasks = (next: FollowupTask[]) => {
    setTasks(next);
    saveTasks(next);
  };

  const toggleRule = (id: string) => {
    persistRules(rules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
  };

  const deleteRule = (id: string) => {
    persistRules(rules.filter((r) => r.id !== id));
    toast.success('Regra removida');
  };

  const upsertRule = (rule: FollowupRule) => {
    const exists = rules.find((r) => r.id === rule.id);
    persistRules(exists ? rules.map((r) => (r.id === rule.id ? rule : r)) : [...rules, rule]);
    setOpen(false);
    setEditing(null);
    toast.success(exists ? 'Regra atualizada' : 'Regra criada');
  };

  const completeTask = (id: string) => {
    persistTasks(tasks.map((t) => (t.id === id ? { ...t, status: 'done' } : t)));
    toast.success('Tarefa concluída');
  };

  const dismissTask = (id: string) => {
    persistTasks(tasks.map((t) => (t.id === id ? { ...t, status: 'dismissed' } : t)));
    toast.info('Tarefa ignorada');
  };

  const resetDefaults = () => {
    persistRules(DEFAULT_RULES);
    toast.success('Regras restauradas para o padrão');
  };

  const pending = tasks.filter((t) => t.status === 'pending');


  return (
    <div className="space-y-6">
      {/* Tarefas pendentes */}
      <Card className="border-amber-200/60 bg-gradient-to-br from-amber-50/40 to-transparent">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-amber-600" />
              Tarefas de Follow-up Pendentes
              <Badge variant="secondary">{pending.length}</Badge>
            </CardTitle>
            <CardDescription>
              Geradas automaticamente quando leads ficam parados além do limite definido.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {pending.length === 0 ? (
            <div className="text-sm text-muted-foreground py-6 text-center">
              Tudo em dia. Nenhum lead parado ultrapassou os limites configurados.
            </div>
          ) : (
            <div className="space-y-2">
              {pending.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-white"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-700">
                      {channelIcon[t.channel]}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium truncate">{t.leadName}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {t.taskTemplate}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <Badge variant="outline" className="gap-1">
                          {channelIcon[t.channel]}
                          {t.channel}
                        </Badge>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {t.idleDays}d parado
                        </span>
                        <span className="italic">{t.ruleName}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="sm" variant="ghost" onClick={() => dismissTask(t.id)}>
                      Ignorar
                    </Button>
                    <Button size="sm" onClick={() => completeTask(t.id)} className="gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Concluir
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Regras */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Regras de Follow-up Automático
            </CardTitle>
            <CardDescription>
              Configure quando um lead parado deve gerar tarefa, mover de status ou notificar.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={resetDefaults}>
              Restaurar padrão
            </Button>
            <Button
              size="sm"
              className="gap-2"
              onClick={() => {
                setEditing({
                  id: `rule-${Date.now()}`,
                  name: '',
                  enabled: true,
                  triggerStatus: 'Cold Mail Sent',
                  channel: 'Email',
                  idleDays: 3,
                  action: 'criar_tarefa',
                  taskTemplate: '',
                });
                setOpen(true);
              }}
            >
              <Plus className="h-4 w-4" /> Nova regra
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {rules.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-card"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Switch checked={r.enabled} onCheckedChange={() => toggleRule(r.id)} />
                  <div className="min-w-0">
                    <div className="font-medium truncate">{r.name || '(sem nome)'}</div>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                      <Badge variant="outline">{r.triggerStatus}</Badge>
                      <span>parado</span>
                      <Badge variant="outline" className="gap-1">
                        <Clock className="h-3 w-3" /> {r.idleDays}d
                      </Badge>
                      <span>→</span>
                      <Badge variant="secondary" className="gap-1">
                        {channelIcon[r.channel]} {r.channel}
                      </Badge>
                      <Badge>
                        {r.action === 'criar_tarefa' && 'Criar tarefa'}
                        {r.action === 'mover_status' && `Mover → ${r.moveToStatus}`}
                        {r.action === 'notificar' && 'Notificar'}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => {
                        setEditing(r);
                        setOpen(true);
                      }}>
                        Editar regra
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-rose-600 focus:text-rose-600"
                        onClick={() => deleteRule(r.id)}
                      >
                        Excluir regra
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Editor */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing && rules.find((r) => r.id === editing.id) ? 'Editar regra' : 'Nova regra'}</DialogTitle>
            <DialogDescription>
              Defina o gatilho (status + dias parado), o canal sugerido e a ação.
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  placeholder="Ex: Reengajar WhatsApp após 2 dias"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Status disparador</Label>
                  <Select
                    value={editing.triggerStatus}
                    onValueChange={(v) => setEditing({ ...editing, triggerStatus: v as LeadStatus })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Dias parado (X)</Label>
                  <Input
                    type="number"
                    min={1}
                    value={editing.idleDays}
                    onChange={(e) => setEditing({ ...editing, idleDays: Math.max(1, Number(e.target.value) || 1) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Canal</Label>
                  <Select
                    value={editing.channel}
                    onValueChange={(v) => setEditing({ ...editing, channel: v as FollowupChannel })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CHANNELS.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Ação</Label>
                  <Select
                    value={editing.action}
                    onValueChange={(v) => setEditing({ ...editing, action: v as FollowupRule['action'] })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="criar_tarefa">Criar tarefa</SelectItem>
                      <SelectItem value="mover_status">Mover de status</SelectItem>
                      <SelectItem value="notificar">Apenas notificar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {editing.action === 'mover_status' && (
                <div className="space-y-2">
                  <Label>Mover para</Label>
                  <Select
                    value={editing.moveToStatus || 'Perdido'}
                    onValueChange={(v) => setEditing({ ...editing, moveToStatus: v as LeadStatus })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label>Template da tarefa / instrução</Label>
                <Input
                  value={editing.taskTemplate}
                  onChange={(e) => setEditing({ ...editing, taskTemplate: e.target.value })}
                  placeholder="Ex: Enviar follow-up no WhatsApp com pergunta aberta"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setOpen(false); setEditing(null); }}>
              Cancelar
            </Button>
            <Button
              onClick={() => editing && upsertRule(editing)}
              disabled={!editing?.name?.trim()}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FollowupRulesPanel;

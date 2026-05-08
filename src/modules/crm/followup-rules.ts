import { LeadStatus, ProspectLead } from '../prospecting/types';

export type FollowupChannel = 'WhatsApp' | 'Email' | 'LinkedIn' | 'Instagram' | 'Ligação';
export type FollowupAction = 'criar_tarefa' | 'mover_status' | 'notificar';

export interface FollowupRule {
  id: string;
  name: string;
  enabled: boolean;
  /** Status do lead que dispara a regra */
  triggerStatus: LeadStatus;
  /** Canal sugerido para o follow-up */
  channel: FollowupChannel;
  /** Dias parado sem atualização */
  idleDays: number;
  /** Ação a executar quando o lead estiver parado */
  action: FollowupAction;
  /** Status para mover o lead (apenas se action === 'mover_status') */
  moveToStatus?: LeadStatus;
  /** Template/instrução exibida na tarefa */
  taskTemplate: string;
}

export interface FollowupTask {
  id: string;
  ruleId: string;
  ruleName: string;
  leadId: string;
  leadName: string;
  channel: FollowupChannel;
  action: FollowupAction;
  taskTemplate: string;
  triggeredAt: string;
  idleDays: number;
  status: 'pending' | 'done' | 'dismissed';
}

export const DEFAULT_RULES: FollowupRule[] = [
  {
    id: 'rule-cold-mail-3d',
    name: 'Cold Mail 3d',
    enabled: true,
    triggerStatus: 'Cold Mail Enviado',
    channel: 'Email',
    idleDays: 3,
    action: 'criar_tarefa',
    taskTemplate: 'O lead não respondeu ao Cold Mail após 3 dias. Enviar follow-up.',
  },
  {
    id: 'rule-whatsapp-2d',
    name: 'WhatsApp 2d',
    enabled: true,
    triggerStatus: 'WhatsApp Enviado',
    channel: 'WhatsApp',
    idleDays: 2,
    action: 'criar_tarefa',
    taskTemplate: 'O lead não respondeu no WhatsApp após 2 dias. Enviar follow-up.',
  },
  {
    id: 'rule-linkedin-5d',
    name: 'LinkedIn 5d',
    enabled: true,
    triggerStatus: 'LinkedIn Enviado',
    channel: 'LinkedIn',
    idleDays: 5,
    action: 'criar_tarefa',
    taskTemplate: 'O lead não respondeu no LinkedIn após 5 dias. Enviar follow-up.',
  },
  {
    id: 'rule-interessado-1d',
    name: 'Interessado 1d',
    enabled: true,
    triggerStatus: 'Lead Qualificado',
    channel: 'WhatsApp',
    idleDays: 1,
    action: 'criar_tarefa',
    taskTemplate: 'O lead mostrou interesse. Realizar follow-up 1 dia depois.',
  },
  {
    id: 'rule-followup-7d',
    name: 'Follow-Up 7d → Perdido',
    enabled: true,
    triggerStatus: 'Follow-Up',
    channel: 'Email',
    idleDays: 7,
    action: 'mover_status',
    moveToStatus: 'Perdido',
    taskTemplate: 'Lead sem avanço após 7 dias em Follow-Up. Movido para Perdido.',
  },
];

const STORAGE_KEY = 'crm.followup.rules.v1';
const TASKS_KEY = 'crm.followup.tasks.v1';

export function loadRules(): FollowupRule[] {
  if (typeof window === 'undefined') return DEFAULT_RULES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_RULES;
    return JSON.parse(raw) as FollowupRule[];
  } catch {
    return DEFAULT_RULES;
  }
}

export function saveRules(rules: FollowupRule[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
}

export function loadTasks(): FollowupTask[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(TASKS_KEY);
    return raw ? (JSON.parse(raw) as FollowupTask[]) : [];
  } catch {
    return [];
  }
}

export function saveTasks(tasks: FollowupTask[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}

function daysBetween(iso: string, now: Date): number {
  const then = new Date(iso).getTime();
  return Math.floor((now.getTime() - then) / (1000 * 60 * 60 * 24));
}

/**
 * Avalia regras contra leads e devolve tarefas geradas.
 * Mantém tarefas existentes (pending/done/dismissed) e cria novas
 * apenas quando ainda não há uma tarefa pendente para (ruleId, leadId).
 */
export function evaluateRules(
  leads: ProspectLead[],
  rules: FollowupRule[],
  existing: FollowupTask[],
  now: Date = new Date()
): { tasks: FollowupTask[]; newCount: number; statusMoves: { leadId: string; to: LeadStatus }[] } {
  const tasks = [...existing];
  const statusMoves: { leadId: string; to: LeadStatus }[] = [];
  let newCount = 0;

  for (const rule of rules) {
    if (!rule.enabled) continue;
    for (const lead of leads) {
      if (lead.status !== rule.triggerStatus) continue;
      const idle = daysBetween(lead.updatedAt, now);
      if (idle < rule.idleDays) continue;

      const alreadyPending = tasks.find(
        (t) => t.ruleId === rule.id && t.leadId === lead.id && t.status === 'pending'
      );
      if (alreadyPending) continue;

      // Para mover_status: dispara apenas uma vez por entrada nesse status
      if (rule.action === 'mover_status' && rule.moveToStatus) {
        statusMoves.push({ leadId: lead.id, to: rule.moveToStatus });
      }

      tasks.push({
        id: `task-${rule.id}-${lead.id}-${now.getTime()}`,
        ruleId: rule.id,
        ruleName: rule.name,
        leadId: lead.id,
        leadName: lead.companyName,
        channel: rule.channel,
        action: rule.action,
        taskTemplate: rule.taskTemplate,
        triggeredAt: now.toISOString(),
        idleDays: idle,
        status: 'pending',
      });
      newCount++;
    }
  }

  return { tasks, newCount, statusMoves };
}

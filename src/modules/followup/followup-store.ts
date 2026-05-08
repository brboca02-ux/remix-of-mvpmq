import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type FollowupChannel = 'email' | 'whatsapp';
export type FollowupStatus = 'pending' | 'queued' | 'sending' | 'sent' | 'delivered' | 'read' | 'failed' | 'canceled' | 'paused_auto';
export type FollowupStep = 0 | 1 | 2 | 3 | 7; // Suporte a sequências personalizadas

export interface FollowupTask {
  id: string;
  sequenceId: string;
  step: number;
  channel: FollowupChannel;
  recipient: string; // email ou telefone
  subject?: string;
  message: string;
  scheduledAt: string; // ISO
  sentAt?: string;
  deliveredAt?: string;
  readAt?: string;
  failedAt?: string;
  errorMessage?: string;
  status: FollowupStatus;
  attempts: number;
  triggerUsed?: string; // Gatilho psicológico usado
  // CRM
  leadId?: string;
  leadName?: string;
  offerId?: string;
  offerName?: string;
}

export interface Objection {
  type: 'price' | 'no_time' | 'already_has_solution' | 'no_interest' | 'unclear';
  receivedAt: string;
  originalMessage: string;
}

export interface FollowupSequence {
  id: string;
  leadId?: string;
  leadName: string;
  offerId?: string;
  offerName: string;
  recipientEmail?: string;
  recipientPhone?: string;
  preferredChannel: FollowupChannel;
  status: 'active' | 'completed' | 'paused' | 'canceled' | 'paused_auto';
  startedAt: string;
  completedAt?: string;
  taskIds: string[];
  engagementScore: number; // 0-100
  objections: Objection[];
  usedTriggers: string[];
  maxAttempts: number;
  autoStopReason?: string;
}

interface FollowupState {
  sequences: FollowupSequence[];
  tasks: FollowupTask[];
  
  // Sequences
  startSequence: (input: {
    leadId?: string;
    leadName: string;
    offerId?: string;
    offerName: string;
    recipientEmail?: string;
    recipientPhone?: string;
    preferredChannel?: FollowupChannel;
    messages?: Record<string, string>;
    subjects?: Record<string, string>;
    triggers?: Record<string, string>;
    maxAttempts?: number;
  }) => string;
  pauseSequence: (id: string) => void;
  resumeSequence: (id: string) => void;
  cancelSequence: (id: string) => void;
  registerObjection: (sequenceId: string, objection: Objection) => void;
  updateEngagementScore: (sequenceId: string, score: number) => void;
  
  // Tasks
  updateTaskStatus: (taskId: string, status: FollowupStatus, error?: string) => void;
  retryTask: (taskId: string) => void;
  cancelTask: (taskId: string) => void;
  
  // Engine
  processQueue: () => Promise<void>;
  getDueTasks: () => FollowupTask[];
  
  // Helpers
  getTasksBySequence: (sequenceId: string) => FollowupTask[];
}

const DEFAULT_TEMPLATES = {
  d0: (offerName: string, leadName: string) =>
    `Olá ${leadName || 'tudo bem'}! Acabei de enviar a proposta da oferta "${offerName}". Avisa se chegou e se faz sentido conversarmos esta semana. 🚀`,
  d3: (offerName: string, leadName: string) =>
    `Oi ${leadName || ''}, tudo certo? Só passando para reforçar o valor da proposta de "${offerName}" — clientes parecidos com você costumam ver resultado nas primeiras 2 semanas. Topa marcarmos 15 minutos?`,
  d7: (offerName: string, leadName: string) =>
    `${leadName || 'Olá'}, última checagem de minha parte sobre "${offerName}". Estou segurando uma condição especial até o fim da semana. Se ainda fizer sentido, me responde com o melhor horário; caso contrário, sigo sem incomodar. ✌️`,
};

export const useFollowupStore = create<FollowupState>()(
  persist(
    (set, get) => ({
      sequences: [],
      tasks: [],

      startSequence: (input) => {
        const sequenceId = crypto.randomUUID();
        const now = new Date();
        const channel: FollowupChannel = input.preferredChannel
          || (input.recipientEmail ? 'email' : 'whatsapp');
        const recipient = channel === 'email'
          ? (input.recipientEmail || input.recipientPhone || '')
          : (input.recipientPhone || input.recipientEmail || '');

        const buildAt = (days: number) => {
          const d = new Date(now);
          d.setDate(d.getDate() + days);
          if (days > 0) d.setHours(10, 0, 0, 0);
          return d.toISOString();
        };

        const defaultSteps: { step: number; days: number; key: string }[] = [
          { step: 0, days: 0, key: 'd0' },
          { step: 3, days: 3, key: 'd3' },
          { step: 7, days: 7, key: 'd7' },
        ];

        const newTasks: FollowupTask[] = defaultSteps.map(({ step, days, key }) => ({
          id: crypto.randomUUID(),
          sequenceId,
          step,
          channel,
          recipient,
          subject: input.subjects?.[key]
            || `${step === 0 ? 'Proposta' : step === 3 ? 'Lembrete' : 'Última chamada'}: ${input.offerName}`,
          message: input.messages?.[key]
            || DEFAULT_TEMPLATES[key as keyof typeof DEFAULT_TEMPLATES]?.(input.offerName, input.leadName)
            || `Olá ${input.leadName}, sobre a proposta de ${input.offerName}.`,
          scheduledAt: buildAt(days),
          status: 'pending',
          attempts: 0,
          triggerUsed: input.triggers?.[key],
          leadId: input.leadId,
          leadName: input.leadName,
          offerId: input.offerId,
          offerName: input.offerName,
        }));

        const newSequence: FollowupSequence = {
          id: sequenceId,
          leadId: input.leadId,
          leadName: input.leadName,
          offerId: input.offerId,
          offerName: input.offerName,
          recipientEmail: input.recipientEmail,
          recipientPhone: input.recipientPhone,
          preferredChannel: channel,
          status: 'active',
          startedAt: now.toISOString(),
          taskIds: newTasks.map((t) => t.id),
          engagementScore: 50, // Começa neutro
          objections: [],
          usedTriggers: Object.values(input.triggers || {}),
          maxAttempts: input.maxAttempts || 3,
        };

        set((state) => ({
          sequences: [newSequence, ...state.sequences],
          tasks: [...newTasks, ...state.tasks],
        }));

        return sequenceId;
      },

      pauseSequence: (id) => set((state) => ({
        sequences: state.sequences.map(s => s.id === id ? { ...s, status: 'paused' } : s),
      })),

      resumeSequence: (id) => set((state) => ({
        sequences: state.sequences.map(s => s.id === id ? { ...s, status: 'active' } : s),
      })),

      cancelSequence: (id) => set((state) => ({
        sequences: state.sequences.map(s => s.id === id ? { ...s, status: 'canceled' } : s),
        tasks: state.tasks.map(t =>
          t.sequenceId === id && (t.status === 'pending' || t.status === 'queued')
            ? { ...t, status: 'canceled' }
            : t
        ),
      })),

      registerObjection: (sequenceId, objection) => set((state) => {
        const sequences = state.sequences.map(s => {
          if (s.id !== sequenceId) return s;
          
          // Auto-stop se for desinteresse explícito
          const status = objection.type === 'no_interest' ? 'paused_auto' : s.status;
          const reason = objection.type === 'no_interest' ? 'Desinteresse detectado' : s.autoStopReason;
          
          return {
            ...s,
            objections: [...s.objections, objection],
            status,
            autoStopReason: reason,
            engagementScore: Math.max(0, s.engagementScore - 20)
          };
        });

        // Se pausou, cancelar tasks pendentes
        const tasks = state.tasks.map(t => 
          t.sequenceId === sequenceId && (t.status === 'pending' || t.status === 'queued')
          ? { ...t, status: 'paused_auto' as FollowupStatus }
          : t
        );

        return { sequences, tasks };
      }),

      updateEngagementScore: (sequenceId, score) => set((state) => ({
        sequences: state.sequences.map(s => s.id === sequenceId ? { ...s, engagementScore: score } : s),
      })),

      updateTaskStatus: (taskId, status, error) => set((state) => {
        const ts = new Date().toISOString();
        const tasks = state.tasks.map(t => {
          if (t.id !== taskId) return t;
          const u: FollowupTask = { ...t, status };
          if (status === 'sent') u.sentAt = ts;
          if (status === 'delivered') u.deliveredAt = ts;
          if (status === 'read') u.readAt = ts;
          if (status === 'failed') { u.failedAt = ts; u.errorMessage = error; }
          if (status === 'sending') u.attempts = t.attempts + 1;
          return u;
        });

        // Auto-complete ou Auto-stop por excesso de tentativas
        const sequences = state.sequences.map(seq => {
          const seqTasks = tasks.filter(t => t.sequenceId === seq.id);
          
          const sentTasks = seqTasks.filter(t => t.status === 'sent' || t.status === 'delivered' || t.status === 'read');
          if (sentTasks.length >= seq.maxAttempts && seq.status === 'active') {
             // Verificar se houve resposta. Como é manual, baseamos no engajamento ou se foi marcado manualmente
             // Aqui apenas aplicamos o limite de tentativas da sequência
             const lastTask = seqTasks.sort((a,b) => b.step - a.step)[0];
             if (lastTask && (lastTask.status === 'sent' || lastTask.status === 'delivered')) {
                return { ...seq, status: 'paused_auto' as const, autoStopReason: 'Limite de tentativas atingido' };
             }
          }

          const allDone = seqTasks.every(t =>
            t.status === 'sent' || t.status === 'delivered' || t.status === 'read'
            || t.status === 'failed' || t.status === 'canceled' || t.status === 'paused_auto'
          );
          if (allDone && seq.status === 'active') {
            return { ...seq, status: 'completed' as const, completedAt: ts };
          }
          return seq;
        });

        return { tasks, sequences };
      }),

      retryTask: (taskId) => set((state) => ({
        tasks: state.tasks.map(t =>
          t.id === taskId ? { ...t, status: 'pending', errorMessage: undefined } : t
        ),
      })),

      cancelTask: (taskId) => set((state) => ({
        tasks: state.tasks.map(t => t.id === taskId ? { ...t, status: 'canceled' } : t),
      })),

      getDueTasks: () => {
        const { tasks, sequences } = get();
        const now = new Date();
        const activeSeqIds = new Set(sequences.filter(s => s.status === 'active').map(s => s.id));
        return tasks.filter(t =>
          activeSeqIds.has(t.sequenceId)
          && t.status === 'pending'
          && new Date(t.scheduledAt) <= now
        );
      },

      processQueue: async () => {
        const due = get().getDueTasks();
        for (const task of due) {
          get().updateTaskStatus(task.id, 'sending');
          await new Promise((r) => setTimeout(r, 600));

          try {
            const dice = Math.random();
            if (dice < 0.03) {
              get().updateTaskStatus(task.id, 'failed', 'Timeout do provedor');
              continue;
            }
            get().updateTaskStatus(task.id, 'sent');

            setTimeout(() => {
              const fresh = get().tasks.find(t => t.id === task.id);
              if (fresh && fresh.status === 'sent') {
                get().updateTaskStatus(task.id, 'delivered');
              }
            }, 2500);
          } catch (err: any) {
            get().updateTaskStatus(task.id, 'failed', err?.message || 'Erro desconhecido');
          }
        }
      },

      getTasksBySequence: (sequenceId) => {
        return get().tasks
          .filter(t => t.sequenceId === sequenceId)
          .sort((a, b) => a.step - b.step);
      },
    }),
    { name: 'marketscope-followup-storage' }
  )
);

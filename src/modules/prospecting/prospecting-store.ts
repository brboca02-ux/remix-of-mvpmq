// @ts-nocheck
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  ProspectLead, StatusNote, StatusAttachment, ContactHistoryItem, FollowUpStep, AutomationMode, 
  ContactStatus, MessageObjective, MessageOutcome, ConversationStage, ChannelGoal, MomentumInfo, 
  WeeklyData, DailyPlan, DailyTask, DecisionOutcome, PredictiveMetrics,
  LeadPsychologicalProfile, PsychologicalAnalysis, LeadEmotion, EmotionalAnalysis,
  OperationalAdjustment, SalesService, LeadRevenueInsight, DecisionScore, AuditLogEntry, LearningPattern,
  Playbook, AutonomousDecision, ManualAnalysis
} from './types';
import { logger } from '../../lib/logger';
import { calculateOpportunityScore } from './opportunity-score';
import { generatePitch } from './pitch-generator';
import { useAuditStore, getLeadDiff, AuditSource } from '../../hooks/useAuditStore';
import { syncLeadToBackend } from './sync-service';

interface AddStatusNoteInput {
  message: string;
  attachments?: StatusAttachment[];
  status?: ProspectLead['status'];
  author?: string;
  kind?: 'manual' | 'system';
}

interface AddContactHistoryInput {
  channel: 'WhatsApp' | 'Instagram' | 'Email' | 'Outro';
  status: 'pendente' | 'enviado' | 'erro' | 'confirmado';
  message?: string;
  author?: string;
  nextFollowUpAt?: string;
  objective?: MessageObjective;
  style?: string;
  intensity?: 'leve' | 'medio' | 'forte';
  userId?: string;
  durationMs?: number;
}

interface ProspectingState {
  // State
  leads: ProspectLead[];
  services: SalesService[];
  revenueGoal: number;
  revenueGoalDeadline: string;
  dailyGoal: number;
  channelGoals: ChannelGoal[];
  hardModeEnabled: boolean;
  activeLearningState: {
    winningPatterns: LearningPattern[];
    recentErrors: { strategy: string; reason: string; timestamp: string }[];
    autoPilotEnabled: boolean;
    dominantModeEnabled: boolean;
    dominantPlaybookId?: string;
    styleAverages?: Record<string, { responses: number; total: number }>;
  };
  auditLogs: AuditLogEntry[];

  // Actions
  setRevenueGoal: (goal: number, deadline?: string) => void;
  setChannelGoal: (channel: ChannelGoal['channel'], target: number) => void;
  setDailyGoal: (goal: number) => void;
  addService: (service: Omit<SalesService, 'id'>) => void;
  updateService: (id: string, updates: Partial<SalesService>) => void;
  deleteService: (id: string) => void;
  toggleHardMode: () => void;
  toggleAutoPilot: () => void;
  toggleDominantMode: () => void;
  addLead: (lead: ProspectLead, source?: AuditSource) => void;
  updateLead: (id: string, updates: Partial<ProspectLead>, source?: AuditSource, message?: string) => void;
  deleteLead: (id: string, source?: AuditSource) => void;
  deleteLeads: (ids: string[], source?: AuditSource) => void;
  moveLead: (id: string, newStatus: ProspectLead['status'], source?: AuditSource) => void;
  moveLeads: (ids: string[], newStatus: ProspectLead['status'], source?: AuditSource) => void;
  upsertLead: (lead: Partial<ProspectLead> & { id: string }, source?: AuditSource) => void;
  addStatusNote: (id: string, input: AddStatusNoteInput) => void;
  deleteStatusNote: (leadId: string, noteId: string) => void;
  updateRequestChecklist: (id: string, checklist: Partial<ProspectLead['requestChecklist']>) => void;
  addContactHistory: (id: string, input: AddContactHistoryInput & { userId?: string; durationMs?: number }) => void;
  discardLead: (id: string, reason: string, observation?: string, source?: 'drag' | 'button' | 'action') => void;
  markNoInterest: (id: string, reason: string, observation?: string, source?: 'drag' | 'button' | 'action') => void;
  reactivateLead: (id: string, newStatus: ProspectLead['status'], reason: string) => void;
  undoDiscard: (id: string) => void;
  setBlockContact: (id: string, block: boolean) => void;
  confirmContactDelivery: (id: string, historyId: string, success: boolean) => void;
  executeNextSequenceStep: (id: string) => void;
  updateAutomationMode: (id: string, mode: AutomationMode) => void;
  recordMessageResult: (id: string, historyId: string, outcome: MessageOutcome) => void;
  setConversationStage: (id: string, stage: ConversationStage) => void;
  executeAutonomousAction: (leadId: string) => void;
  recordHesitation: (leadId: string, type: 'idle' | 'change') => void;
  markInstagramInteraction: (id: string, type?: 'follow' | 'like' | 'view') => void;
  recordGoogleSearch: (id: string) => void;
  recordInstagramOpen: (id: string) => void;
  updateManualAnalysis: (id: string, analysis: Partial<ManualAnalysis>) => void;

  // Selectors
  getAutonomousDecision: (leadId: string) => AutonomousDecision | null;
  getOperationalPlan: () => any;
  getFinancialDashboard: () => any;
  getRevenueSimulation: (adjustments: any) => number;
  getMessagePerformance: () => any;
  getDecisionHistory: (leadId: string) => DecisionOutcome[];
  getReadyResponses: (leadId: string, scenario: string) => string[];
  getPersuasionProgression: (leadId: string) => any;
  getPerformanceMetrics: () => any;
  getWeeklyPerformanceReport: () => any;
  getRevenueForecast: () => any;
  getMomentumStats: () => MomentumInfo;
  getWeeklyHistory: () => WeeklyData[];
  getNextTargets: () => any[];
  getFocusQueue: (options?: { filter?: 'all' | 'revision' }) => ProspectLead[];
  getProcessedTodayCount: (channel?: string) => number;
  getMotivationStats: () => any;
  getDailyPlan: () => DailyPlan;
  getPsychologicalAnalysis: (leadId: string) => PsychologicalAnalysis;
  getEmotionalAnalysis: (leadId: string) => EmotionalAnalysis;
  getWinningPatterns: () => any;
  getDecisionScore: (leadId: string, strategy: string, channel: string) => DecisionScore;
  exportLearningReport: () => any;
  getAuditHistory: () => AuditLogEntry[];
  getDominantPlaybookInfo: () => any;
  getStyleEfficiency: (style: string) => any;
  getNegotiationSimulation: (leadId: string, price: number) => any;
  getRevenueOrchestration: (leadId: string) => {
    recommendedStrategy: string;
    recommendedServices: string[];
    bundlePrice: number;
    bundleProfit: number;
    upsellMoment: 'agora' | 'preparar' | 'aguardar' | 'evitar';
    upsellPreparation: string;
    adaptivePriceAdjustment: number; // % suggested
    underpricingAlert?: string;
    impactOnMonthlyRevenue: number;
    confidence: 'Alta' | 'Média' | 'Baixa';
    reasoning: string;
    alternativeStrategies: { label: string; expectedRevenue: number; tradeoff: string }[];
  };
  getRevenueStrategySimulation: (mode: 'low_price_volume' | 'premium_low_volume' | 'balanced') => {
    expectedClosures: number;
    expectedRevenue: number;
    expectedProfit: number;
    avgTicket: number;
    insight: string;
  };

  // Playbook Logic
  generatePlaybook: (leadId: string) => void;
  advancePlaybook: (leadId: string) => void;
  adaptPlaybook: (leadId: string, behavior: 'ignored' | 'responded' | 'interested' | 'cooling_down') => void;
  applyActiveLearning: (outcome: DecisionOutcome) => void;
  recordDiscardAudit: (leadId: string, type: 'discard' | 'no_interest', reason: string, observation?: string, previousStatus?: string, expectedValue?: number, source?: string) => void;
}

const DEFAULT_SEQUENCE: FollowUpStep[] = [
  { channel: 'WhatsApp', delayDays: 0, label: 'WhatsApp Inicial' },
  { channel: 'WhatsApp', delayDays: 2, label: 'WhatsApp Follow-up' },
  { channel: 'Instagram', delayDays: 4, label: 'Instagram Tentativa' },
  { channel: 'Email', delayDays: 7, label: 'Email Formal' },
];

const recalculateLeadData = (lead: ProspectLead, services: SalesService[] = []): ProspectLead => {
  const scoring = calculateOpportunityScore(lead);
  
  let closingChance = (scoring.score || 50) * 0.4;
  
  if (lead.contactStatus === 'Cliente respondeu') closingChance += 30;
  else if (lead.contactStatus === 'Aguardando resposta') closingChance += 15;
  
  const history = lead.contactHistory || [];
  if (history.length > 0) {
    const confirmations = history.filter(h => h.status === 'confirmado').length;
    closingChance += Math.min(confirmations * 5, 15);
  }

  closingChance = Math.min(Math.max(Math.round(closingChance), 0), 100);

  // Warmup Status Logic
  const analysis = lead.manualAnalysis;
  const interactions = [
    analysis?.instagramFollowed,
    analysis?.instagramLiked,
    analysis?.instagramPostsSeen
  ].filter(Boolean).length;

  const hasInteracted = !!lead.instagramInteractedAt;
  const hasSearched = !!lead.googleSearchedAt;

  if (interactions >= 3) {
    lead.warmupStatus = 'Pronto';
  } else if (interactions >= 1 || (hasInteracted && Date.now() - new Date(lead.instagramInteractedAt!).getTime() > 6 * 60 * 60 * 1000)) {
    lead.warmupStatus = 'Morno';
  } else if (hasInteracted || hasSearched) {
    lead.warmupStatus = 'Aquecendo';
  } else {
    lead.warmupStatus = 'Frio';
  }

  let purchasingPower: 'Alto' | 'Médio' | 'Baixo' = 'Médio';
  const nicheLower = lead.niche?.toLowerCase() || '';
  if (['odontologia', 'advocacia', 'médico'].some(n => nicheLower.includes(n))) purchasingPower = 'Alto';

  const selectedService = services.find(s => s.id === lead.selectedServiceId) || services[0];
  const basePrice = selectedService?.idealPrice || 1500;
  const minPrice = selectedService?.minPrice || basePrice * 0.7;

  let priceSensitivity: 'sensível a preço' | 'neutro' | 'orientado a valor' = 'neutro';
  if (purchasingPower === 'Alto') priceSensitivity = 'orientado a valor';

  let suggestedPrice = basePrice;
  if (priceSensitivity === 'orientado a valor') suggestedPrice = basePrice * 1.2;

  const probabilityOfClosing = closingChance / 100;
  const expectedRevenue = suggestedPrice * probabilityOfClosing;

  lead.revenueInsight = {
    serviceId: selectedService?.id || '1',
    suggestedPrice: Math.round(suggestedPrice),
    optimalProfitPrice: Math.round(suggestedPrice * 1.1),
    minimumSecurePrice: Math.round(minPrice),
    breakEvenPoint: Math.round(minPrice * 0.8),
    priceSensitivity,
    negotiationStrategy: "Mantenha o preço e foque no valor.",
    closingProbability: closingChance,
    expectedValue: expectedRevenue,
    reasoning: `Análise baseada em score ${scoring.score}.`,
    discountImpact: {
      suggestedPrice: Math.round(minPrice),
      probabilityIncrease: 20,
      revenueImpact: Math.round(minPrice * 0.5),
      marginImpact: -15
    }
  };

  lead.opportunityScore = scoring.score;
  lead.closingChance = closingChance;
  lead.expectedRevenue = expectedRevenue;
  
  return lead;
};

export const useProspectingStore = create<ProspectingState>()(
  persist(
    (set, get) => ({
      leads: [] as ProspectLead[],
      services: [
        { id: '1', name: 'Site Simples', idealPrice: 1500, minPrice: 997, maxPrice: 2000, estimatedMargin: 0.7, sellingDifficulty: 'Média', potentialUpsell: ['3'] },
        { id: '2', name: 'Landing Page', idealPrice: 997, minPrice: 697, maxPrice: 1500, estimatedMargin: 0.8, sellingDifficulty: 'Fácil', potentialUpsell: ['3'] },
        { id: '3', name: 'Gestão de Tráfego', idealPrice: 1200, minPrice: 800, maxPrice: 2500, estimatedMargin: 0.6, sellingDifficulty: 'Média', potentialUpsell: ['1', '2'] },
      ] as SalesService[],
      revenueGoal: 50000,
      revenueGoalDeadline: new Date().toISOString(),
      dailyGoal: 10,
      channelGoals: [
        { channel: 'WhatsApp', target: 20, current: 0 },
        { channel: 'Instagram', target: 10, current: 0 },
        { channel: 'Email', target: 5, current: 0 }
      ],
      hardModeEnabled: false,
      activeLearningState: {
        winningPatterns: [],
        recentErrors: [],
        autoPilotEnabled: true,
        dominantModeEnabled: false,
      },
      auditLogs: [] as AuditLogEntry[],

      setRevenueGoal: (goal, deadline) => set({ revenueGoal: goal, revenueGoalDeadline: deadline || get().revenueGoalDeadline }),
      setChannelGoal: (channel, target) => set((state) => ({ channelGoals: state.channelGoals.map(g => g.channel === channel ? { ...g, target } : g) })),
      setDailyGoal: (goal) => set({ dailyGoal: goal }),
      addService: (service) => set((state) => ({ services: [...state.services, { ...service, id: crypto.randomUUID() }] })),
      updateService: (id, updates) => set((state) => ({ services: state.services.map(s => s.id === id ? { ...s, ...updates } : s) })),
      deleteService: (id) => set((state) => ({ services: state.services.filter(s => s.id !== id) })),
      toggleHardMode: () => set((state) => ({ hardModeEnabled: !state.hardModeEnabled })),
      toggleAutoPilot: () => set((state) => ({ activeLearningState: { ...state.activeLearningState, autoPilotEnabled: !state.activeLearningState.autoPilotEnabled } })),
      toggleDominantMode: () => set((state) => ({ activeLearningState: { ...state.activeLearningState, dominantModeEnabled: !state.activeLearningState.dominantModeEnabled } })),

      addLead: (lead, source = 'manual') => set((state) => {
        const newLead = recalculateLeadData(lead, state.services);
        return { leads: [newLead, ...state.leads] };
      }),
      updateLead: (id, updates) => set((state) => {
        const lead = state.leads.find(l => l.id === id);
        if (!lead) return state;
        const updated = recalculateLeadData({ ...lead, ...updates }, state.services);
        return { leads: state.leads.map(l => l.id === id ? updated : l) };
      }),
      deleteLead: (id) => set((state) => ({ leads: state.leads.filter(l => l.id !== id) })),
      deleteLeads: (ids) => set((state) => ({ leads: state.leads.filter(l => !ids.includes(l.id)) })),
      moveLead: (id, newStatus) => {
        set((state) => ({ leads: state.leads.map(l => l.id === id ? { ...l, status: newStatus, updatedAt: new Date().toISOString() } : l) }));
        // Sync to backend
        const lead = get().leads.find(l => l.id === id);
        if (lead) {
          import('./sync-service').then(({ syncLeadToBackend }) => {
            syncLeadToBackend({ ...lead, status: newStatus });
          });
        }
      },
      moveLeads: (ids, newStatus) => set((state) => ({ leads: state.leads.map(l => ids.includes(l.id) ? { ...l, status: newStatus } : l) })),
      upsertLead: (lead) => set((state) => {
        const existing = state.leads.find(l => l.id === lead.id);
        if (existing) {
          const updated = recalculateLeadData({ ...existing, ...lead } as ProspectLead, state.services);
          return { leads: state.leads.map(l => l.id === lead.id ? updated : l) };
        }
        const newLead = recalculateLeadData(lead as ProspectLead, state.services);
        return { leads: [newLead, ...state.leads] };
      }),
      addStatusNote: (id, input) => set((state) => ({
        leads: state.leads.map(l => l.id === id ? { ...l, statusNotes: [...(l.statusNotes || []), { id: crypto.randomUUID(), createdAt: new Date().toISOString(), ...input, status: input.status || l.status } as StatusNote] } : l)
      })),
      deleteStatusNote: (leadId, noteId) => set((state) => ({ leads: state.leads.map(l => l.id === leadId ? { ...l, statusNotes: l.statusNotes?.filter(n => n.id !== noteId) } : l) })),
      updateRequestChecklist: (id, checklist) => set((state) => ({ leads: state.leads.map(l => l.id === id ? { ...l, requestChecklist: { ...(l.requestChecklist || {}), ...(checklist || {}) } as ProspectLead['requestChecklist'] } : l) } as Partial<ProspectingState>)),
      addContactHistory: (id, input) => set((state) => ({
        leads: state.leads.map(l => l.id === id ? { ...l, contactHistory: [...(l.contactHistory || []), { id: crypto.randomUUID(), timestamp: new Date().toISOString(), ...input } as ContactHistoryItem] } : l)
      })),
      discardLead: (id, reason, observation, source = 'action') => {
        const lead = get().leads.find(l => l.id === id);
        if (!lead) return;
        const previousStatus = lead.status;
        const expectedValue = lead.revenueInsight?.expectedValue || 0;
        
        set((state) => ({
          leads: state.leads.map(l => l.id === id ? { 
            ...l, 
            previousStatus,
            status: 'Perdido', 
            contactStatus: 'Lead descartado', 
            discardReason: reason,
            discardObservation: observation,
            discardSource: source,
            discardedAt: new Date().toISOString()
          } : l)
        }));
        
        get().recordDiscardAudit(id, 'discard', reason, observation, previousStatus, expectedValue, source);
      },
      markNoInterest: (id, reason, observation, source = 'action') => {
        const lead = get().leads.find(l => l.id === id);
        if (!lead) return;
        const previousStatus = lead.status;
        const expectedValue = lead.revenueInsight?.expectedValue || 0;

        set((state) => ({
          leads: state.leads.map(l => l.id === id ? { 
            ...l, 
            previousStatus,
            status: 'Perdido', 
            contactStatus: 'Cliente sem interesse', 
            noInterestReason: reason,
            discardObservation: observation,
            discardSource: source,
            discardedAt: new Date().toISOString()
          } : l)
        }));

        get().recordDiscardAudit(id, 'no_interest', reason, observation, previousStatus, expectedValue, source);
      },
      reactivateLead: (id, newStatus, reason) => set((state) => ({
        leads: state.leads.map(l => l.id === id ? { 
          ...l, 
          status: newStatus, 
          contactStatus: 'Novo envio pendente',
          reactivatedAt: new Date().toISOString(),
          reativationReason: reason,
          discardReason: undefined,
          noInterestReason: undefined,
          discardObservation: undefined
        } : l)
      })),
      undoDiscard: (id) => set((state) => ({
        leads: state.leads.map(l => l.id === id ? { 
          ...l, 
          status: l.previousStatus || 'Novo',
          contactStatus: 'Novo envio pendente',
          discardReason: undefined,
          noInterestReason: undefined,
          discardObservation: undefined,
          discardedAt: undefined,
          previousStatus: undefined
        } : l)
      })),
      setBlockContact: (id, block) => set((state) => ({ leads: state.leads.map(l => l.id === id ? { ...l, blockContact: block } : l) })),
      confirmContactDelivery: (id, historyId, success) => set((state) => ({ leads: state.leads.map(l => l.id === id ? { ...l, contactHistory: l.contactHistory?.map(h => h.id === historyId ? { ...h, status: success ? 'confirmado' : 'erro' } : h) } : l) })),
      executeNextSequenceStep: (id) => {
        const state = get();
        const lead = state.leads.find(l => l.id === id);
        if (!lead || !lead.sequence || !lead.sequence.isActive) {
          logger.debug('executeNextSequenceStep: no active sequence', { leadId: id });
          return;
        }

        const { sequence } = lead;
        const currentStep = sequence.steps[sequence.currentStep];
        
        if (!currentStep) {
          // Sequence completed
          set((s) => ({
            leads: s.leads.map(l => l.id === id ? {
              ...l,
              sequence: { ...l.sequence!, isActive: false, stopReason: 'limit_reached' }
            } : l)
          }));
          logger.info('Follow-up sequence completed', { leadId: id, totalSteps: sequence.totalSteps });
          return;
        }

        // Record the contact in history
        state.addContactHistory(id, {
          channel: currentStep.channel,
          status: 'pendente',
          message: currentStep.suggestedMessage || `Follow-up ${currentStep.label}`,
          objective: 'open_conversation',
          style: currentStep.label,
          intensity: 'medio',
        });

        // Advance to next step
        const nextStep = sequence.currentStep + 1;
        const isLastStep = nextStep >= sequence.totalSteps;

        set((s) => ({
          leads: s.leads.map(l => l.id === id ? {
            ...l,
            sequence: {
              ...l.sequence!,
              currentStep: nextStep,
              isActive: !isLastStep,
              stopReason: isLastStep ? 'limit_reached' : undefined,
            },
            contactStatus: 'Contato enviado hoje' as any,
            lastContactAt: new Date().toISOString(),
            nextFollowUpAt: !isLastStep && sequence.steps[nextStep]
              ? new Date(Date.now() + sequence.steps[nextStep].delayDays * 86400000).toISOString()
              : undefined,
          } : l)
        }));

        // Sync to backend
        const updatedLead = get().leads.find(l => l.id === id);
        if (updatedLead) {
          import('./sync-service').then(({ syncLeadToBackend }) => {
            syncLeadToBackend(updatedLead);
          });
        }

        logger.info('Follow-up step executed', { 
          leadId: id, 
          step: sequence.currentStep + 1, 
          channel: currentStep.channel,
          label: currentStep.label 
        });
      }, 
      updateAutomationMode: (id, mode) => set((state) => ({ leads: state.leads.map(l => l.id === id ? { ...l, automationMode: mode } : l) })),
      recordMessageResult: (id, historyId, outcome) => set((state): Partial<ProspectingState> => {
        const lead = state.leads.find(l => l.id === id);
        if (!lead) return {};

        const updatedLeads = state.leads.map(l => l.id === id ? { 
          ...l, 
          contactHistory: l.contactHistory?.map(h => h.id === historyId ? { ...h, outcome } : h) 
        } : l);

        // Update Audit Log with real outcome
        const updatedAudit = state.auditLogs.map((log): AuditLogEntry => 
          (log.leadId === id && log.outcome === undefined) ? { 
            ...log, 
            outcome, 
            impact: (outcome === 'interested' || outcome === 'responded') ? 'Positivo' : 'Negativo' 
          } : log
        );

        // Learning: Update winning patterns based on real outcome
        const lastContact = lead.contactHistory?.find(h => h.id === historyId);
        const updatedPatterns = state.activeLearningState.winningPatterns.map(p => {
          if (p.name === lastContact?.style) {
            const total = (p.totalUses || 0) + 1;
            const currentRealSuccessRate = p.realSuccessRate || 0;
            const success = (outcome === 'interested' || outcome === 'responded') 
              ? (currentRealSuccessRate * (total - 1) + 1) / total
              : (currentRealSuccessRate * (total - 1)) / total;
            return { ...p, totalUses: total, realSuccessRate: success, lastOutcome: outcome };
          }
          return p;
        });

        // Detect efficiency loss
        const recentErrors = [...state.activeLearningState.recentErrors];
        if (outcome === 'not_interested' || outcome === 'no_response') {
          const strategy = lastContact?.style || 'Desconhecida';
          const existingPattern = updatedPatterns.find(p => p.name === strategy);
          if (existingPattern && (existingPattern.realSuccessRate || 0) < 0.2 && existingPattern.totalUses > 5) {
             recentErrors.push({ 
               strategy, 
               reason: 'Estratégia perdendo eficiência com base em resultados reais', 
               timestamp: new Date().toISOString() 
             });
          }
        }

        return { 
          leads: updatedLeads, 
          auditLogs: updatedAudit,
          activeLearningState: {
            ...state.activeLearningState,
            winningPatterns: updatedPatterns,
            recentErrors: recentErrors.slice(-10)
          }
        };
      }),
      setConversationStage: (id, stage) => set((state) => ({ leads: state.leads.map(l => l.id === id ? { ...l, conversationStage: stage } : l) })),
      recordDiscardAudit: (leadId, type, reason, observation, previousStatus, expectedValue, source) => {
        const lead = get().leads.find(l => l.id === leadId);
        if (!lead) return;
        
        const log: AuditLogEntry = {
          id: crypto.randomUUID(),
          leadId,
          leadName: lead.companyName,
          timestamp: new Date().toISOString(),
          decision: type === 'discard' ? 'Lead Descartado' : 'Sem Interesse',
          strategy: source || 'button',
          channel: 'System',
          context: {
            closingChance: lead.closingChance || 0,
            purchasingPower: lead.purchasingPower
          },
          impact: 'Negativo',
          isCritical: lead.opportunityLevel === 'quente' || (expectedValue || 0) > 2000,
          correctionApplied: `Anterior: ${previousStatus} | Motivo: ${reason}`
        };
        
        set(state => ({ auditLogs: [log, ...state.auditLogs].slice(0, 1000) }));
      },
      markInstagramInteraction: (id: string, type?: 'follow' | 'like' | 'view') => set((state) => {
        const lead = state.leads.find(l => l.id === id);
        if (!lead) return state;

        const analysis = lead.manualAnalysis || {
          companyExists: false,
          activeInstagram: false,
          hasWebsite: false,
          isRecentlyActive: false,
          worthContacting: false,
          instagramFollowed: false,
          instagramLiked: false,
          instagramPostsSeen: false
        };

        const updatedAnalysis = {
          ...analysis,
          instagramFollowed: type === 'follow' ? true : analysis.instagramFollowed,
          instagramLiked: type === 'like' ? true : analysis.instagramLiked,
          instagramPostsSeen: type === 'view' ? true : analysis.instagramPostsSeen,
        };

        const updatedLead = recalculateLeadData({
          ...lead,
          instagramInteractedAt: new Date().toISOString(),
          manualAnalysis: updatedAnalysis,
          updatedAt: new Date().toISOString()
        }, state.services);

        return {
          leads: state.leads.map(l => l.id === id ? updatedLead : l)
        };
      }),
      recordGoogleSearch: (id: string) => set((state) => {
        const lead = state.leads.find(l => l.id === id);
        if (!lead) return state;

        const updatedLead = recalculateLeadData({
          ...lead,
          googleSearchedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }, state.services);

        return {
          leads: state.leads.map(l => l.id === id ? updatedLead : l)
        };
      }),
      recordInstagramOpen: (id: string) => set((state) => {
        const lead = state.leads.find(l => l.id === id);
        if (!lead) return state;

        const updatedLead = recalculateLeadData({
          ...lead,
          instagramInteractedAt: lead.instagramInteractedAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }, state.services);

        return {
          leads: state.leads.map(l => l.id === id ? updatedLead : l)
        };
      }),
      updateManualAnalysis: (id, analysis) => set((state) => {
        const lead = state.leads.find(l => l.id === id);
        if (!lead) return state;
        const updatedLead = recalculateLeadData({
          ...lead,
          manualAnalysis: { 
            ...(lead.manualAnalysis || {
              companyExists: false,
              activeInstagram: false,
              hasWebsite: false,
              isRecentlyActive: false,
              worthContacting: false,
              instagramFollowed: false,
              instagramLiked: false,
              instagramPostsSeen: false
            }), 
            ...analysis,
            analyzedAt: new Date().toISOString()
          } 
        } as ProspectLead, state.services);
        return { leads: state.leads.map(l => l.id === id ? updatedLead : l) };
      }),

      completeTask: (taskId: string) => set((state) => {
        const plan = state.getDailyPlan();
        const task = plan.tasks.find(t => t.id === taskId);
        if (!task) return state;

        // Record metrics
        const updatedLeads = state.leads.map(l => {
          if (l.id === task.leadId) {
             // Logic to track streaks and performance would go here
             return { ...l, updatedAt: new Date().toISOString() };
          }
          return l;
        });

        return { leads: updatedLeads };
      }),

      executeAutonomousAction: (leadId: string) => {
        const state = get();
        const decision = state.getAutonomousDecision(leadId);
        if (!decision) return;
        
        const lead = state.leads.find(l => l.id === leadId);
        if (!lead) return;

        state.addContactHistory(leadId, {
          channel: decision.recommendedChannel,
          status: 'enviado',
          message: decision.readyMessage,
          intensity: 'medio',
          objective: 'open_conversation',
          style: decision.actionLabel
        });

        // AUDIT LOG REGISTRATION
        const auditEntry: AuditLogEntry = {
          id: crypto.randomUUID(),
          leadId,
          leadName: lead.companyName,
          timestamp: new Date().toISOString(),
          decision: decision.actionLabel,
          strategy: decision.strategyRationale,
          suggestedPrice: lead.revenueInsight?.suggestedPrice,
          channel: decision.recommendedChannel,
          context: {
            psychologicalProfile: lead.psychological_analysis?.profile,
            closingChance: lead.closingChance || 0,
            purchasingPower: lead.purchasingPower
          },
          impact: 'Neutro',
          isCritical: decision.isCritical
        };

        set((state): Partial<ProspectingState> => ({ auditLogs: [auditEntry, ...state.auditLogs] }));
        
        const nextStatus = lead.status === 'Novo' ? 'WhatsApp Enviado' : lead.status;
        state.updateLead(leadId, { 
          status: nextStatus,
          hesitationMetrics: {
            idleTimeMs: 0,
            strategyChangesCount: 0,
            lastActionAt: new Date().toISOString(),
            isOverthinking: false
          }
        });
      },

      recordHesitation: (leadId: string, type: 'idle' | 'change') => set((state): Partial<ProspectingState> => {
        const lead = state.leads.find(l => l.id === leadId);
        if (!lead) return {};
        
        const currentMetrics = lead.hesitationMetrics || { idleTimeMs: 0, strategyChangesCount: 0, lastActionAt: new Date().toISOString(), isOverthinking: false };
        
        const metrics = { ...currentMetrics };
        
        if (type === 'idle') metrics.idleTimeMs += 5000;
        if (type === 'change') metrics.strategyChangesCount += 1;
        
        if (metrics.strategyChangesCount > 2 || metrics.idleTimeMs > 60000) {
          metrics.isOverthinking = true;
        }
        
        return {
          leads: state.leads.map(l => l.id === leadId ? { ...l, hesitationMetrics: metrics } : l)
        };
      }),

      // Selectors
      getAutonomousDecision: (leadId: string) => {
        const state = get();
        const lead = state.leads.find(l => l.id === leadId);
        if (!lead) return null;

        const orchestration = state.getRevenueOrchestration(leadId);
        const score = state.getDecisionScore(leadId, orchestration.recommendedStrategy, 'WhatsApp');

        // CALCULATE REAL CONFIDENCE BASED ON AUDIT LOGS
        const relatedLogs = state.auditLogs.filter(log => log.strategy === orchestration.reasoning);
        const successes = relatedLogs.filter(log => log.impact === 'Positivo').length;
        const realConfidence = relatedLogs.length > 5 ? (successes / relatedLogs.length) * 100 : score.score;

        // CRITICAL DECISION DETECTION
        const isCritical = (lead.revenueInsight?.suggestedPrice || 0) > 5000 || orchestration.confidence === 'Baixa';
        const criticalReason = isCritical 
          ? ((lead.revenueInsight?.suggestedPrice || 0) > 5000 ? 'Alto Valor de Faturamento: Revisão obrigatória.' : 'Baixa Confiança Estatística: Risco de quebra de fluxo.') 
          : undefined;

        // WHAT-IF SCENARIOS
        const whatIfScenarios = orchestration.alternativeStrategies.map(alt => ({
          strategy: alt.label,
          expectedImprovement: Math.round((alt.expectedRevenue / (lead.revenueInsight?.expectedValue || 1) - 1) * 100),
          reason: alt.tradeoff
        }));

        return {
          leadId,
          type: 'contact',
          actionLabel: orchestration.recommendedStrategy,
          recommendedChannel: 'WhatsApp',
          readyMessage: `Olá ${lead.companyName}, vi seu trabalho em ${lead.city} e notei uma oportunidade para ${orchestration.recommendedServices[0]}. Podemos falar?`,
          strategyRationale: orchestration.reasoning,
          confidenceScore: score.score,
          realConfidenceScore: Math.round(realConfidence),
          expectedOutcome: 'Abertura de conversa com alta probabilidade de interesse',
          riskOfHesitation: lead.hesitationMetrics?.isOverthinking ? 'Alto' : 'Baixo',
          isLocked: !!lead.hesitationMetrics?.isOverthinking,
          isCritical,
          criticalReason,
          whatIfScenarios
        };
      },
      getOperationalPlan: () => {
        const state = get();
        const goal = state.revenueGoal;
        const leads = state.leads;
        const closures = leads.filter(l => l.status === 'Lead Fechado').length;
        const currentRevenue = leads.reduce((acc, l) => l.status === 'Lead Fechado' ? acc + (l.revenueInsight?.suggestedPrice || 0) : acc, 0);
        
        const daysRemaining = Math.max(1, Math.ceil((new Date(state.revenueGoalDeadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));
        const gap = Math.max(0, goal - currentRevenue);
        const avgTicket = state.services[0]?.idealPrice || 1500;
        const requiredClosures = Math.ceil(gap / avgTicket);
        
        // Conservatively assuming 10% conversion from lead to closure
        const requiredLeads = requiredClosures * 10;
        const dailyLeadsNeeded = Math.ceil(requiredLeads / daysRemaining);

        return { 
          monthlyRevenueGoal: goal, 
          revenueGoalDeadline: state.revenueGoalDeadline, 
          requiredLeads, 
          requiredResponses: requiredLeads * 0.3, 
          requiredOpportunities: requiredLeads * 0.2, 
          requiredClosures, 
          dailyLeadsNeeded, 
          weeklyLeadsNeeded: dailyLeadsNeeded * 7, 
          currentPace: closures / Math.max(1, 30 - daysRemaining), 
          isOnTrack: currentRevenue >= (goal / 30) * (30 - daysRemaining), 
          chanceOfHittingGoal: currentRevenue >= goal ? 'Alta' : 'Média', 
          simulatedLeads: () => 0, 
          recommendations: [], 
          plan: [], 
          executionStats: { timeSpentMinutes: 0, pace: 'on_track', revenueImpactToday: 0 } 
        };
      },
      getFinancialDashboard: () => {
        const state = get();
        const leads = state.leads;
        
        const totalForecast = leads.reduce((acc, l) => acc + (l.revenueInsight?.expectedValue || 0), 0);
        const guaranteedRevenue = leads.reduce((acc, l) => l.status === 'Lead Fechado' ? acc + (l.revenueInsight?.suggestedPrice || 0) : acc, 0);
        
        return { 
          totalForecast, 
          probabilisticForecast: totalForecast, 
          conservativeForecast: totalForecast * 0.7, 
          potentialForecast: totalForecast * 1.3, 
          guaranteedRevenue, 
          negotiationRevenue: totalForecast - guaranteedRevenue, 
          atRiskRevenue: leads.filter(l => l.closingChance && l.closingChance < 30).reduce((acc, l) => acc + (l.revenueInsight?.expectedValue || 0), 0), 
          insights: [], 
          avgTicket: 1500, 
          accumulatedLoss: 0 
        };
      },
      getRevenueSimulation: () => 0,
      getMessagePerformance: () => ({ objectivePerformance: {}, stylePerformance: {}, bestObjective: 'open_conversation', bestStyle: '', insights: [], evolution: [] }),
      getDecisionHistory: () => [],
      getReadyResponses: () => [],
      getPersuasionProgression: () => ({ stage: 'first', recommendedStrategy: '', recommendedIntensity: 'leve', reasoning: '', behavior: 'new', detectedProblems: [], opportunity: '', strategyImpact: [], strategyForce: 'Alta', microLearning: '', strategyAlternatives: [] }),
      getPerformanceMetrics: () => ({ channelResponseRate: {}, nicheConversionRate: {}, globalConversion: 0, errorRate: 0, avgTimeBetweenAttempts: 0, potentialRevenue: 0, insights: [] }),
      getWeeklyPerformanceReport: () => ({ totalAttempts: 0, successRate: 0, errorRate: 0, resendRate: 0, avgResponseTimeHours: 0, trend: 'stable', dataByDay: [] }),
      getRevenueForecast: () => {
        const state = get();
        const goal = state.revenueGoal;
        const leads = state.leads;
        const currentRevenue = leads.reduce((acc, l) => l.status === 'Lead Fechado' ? acc + (l.revenueInsight?.suggestedPrice || 0) : acc, 0);
        const pipelineValue = leads.reduce((acc, l) => !['Lead Fechado', 'Perdido'].includes(l.status) ? acc + (l.revenueInsight?.expectedValue || 0) : acc, 0);
        
        const projectedRevenue = currentRevenue + pipelineValue;
        const gapToGoal = goal - projectedRevenue;
        const isAtRisk = projectedRevenue < goal;
        
        return { 
          totalForecast: projectedRevenue, 
          projectedRevenue, 
          gapToGoal: Math.max(0, gapToGoal), 
          confidence: projectedRevenue >= goal ? 'Alta' : (projectedRevenue >= goal * 0.8 ? 'Média' : 'Baixa'), 
          todayForecast: pipelineValue / 30, 
          weekForecast: pipelineValue / 4, 
          monthForecast: projectedRevenue, 
          pipelineHealth: isAtRisk ? 'em_risco' : 'saudável', 
          prioritizedLeads: [], 
          historicalWinRate: 0.15, 
          avgTicket: 1500, 
          chanceOfHittingGoal: Math.min(100, Math.round((projectedRevenue / goal) * 100)), 
          isAtRisk, 
          scenarios: { current: projectedRevenue, optimistic: projectedRevenue * 1.2, aggressive: projectedRevenue * 1.5 }, 
          levers: [] 
        };
      },
      getMomentumStats: () => ({ status: 'strong', label: '', description: '', trend: 'stable' }),
      getWeeklyHistory: () => [],
      getNextTargets: () => [],
      getFocusQueue: (options) => {
        const state = get();
        const leads = [...state.leads].filter(l => !['Lead Fechado', 'Perdido'].includes(l.status));
        const forecast = state.getRevenueForecast();
        
        // RE-PRIORITIZATION IF AT RISK
        if (forecast.isAtRisk) {
          return leads.sort((a, b) => {
            // Priority 1: Closing chance (near closing)
            const aClosing = a.closingChance || 0;
            const bClosing = b.closingChance || 0;
            if (Math.abs(aClosing - bClosing) > 20) return bClosing - aClosing;
            
            // Priority 2: Expected Value (Impact)
            const aVal = a.revenueInsight?.expectedValue || 0;
            const bVal = b.revenueInsight?.expectedValue || 0;
            return bVal - aVal;
          });
        }
        
        return leads;
      },
      getProcessedTodayCount: () => 0,
      getMotivationStats: () => ({ totalImpacted: 0, highPotentialCount: 0, streakDays: 0, dailyProgress: 0, isGoalAchieved: false, momentum: { status: 'strong' }, consequenceOfInactivity: '' }),
      getDailyPlan: () => {
        const state = get();
        const forecast = state.getRevenueForecast();
        const operational = state.getOperationalPlan();
        
        const deviationPercentage = Math.round(((forecast.projectedRevenue / state.revenueGoal) - 1) * 100);
        const isEmergency = deviationPercentage < -15;
        
        const status = isEmergency ? 'emergency' : (deviationPercentage < 0 ? 'at_risk' : 'on_track');
        
        const tasks: DailyTask[] = state.leads
          .filter(l => !['Lead Fechado', 'Perdido'].includes(l.status))
          .slice(0, 15)
          .map(l => ({
            id: crypto.randomUUID(),
            leadId: l.id,
            type: (l.closingChance || 0) > 70 ? 'closure' : 'new_contact',
            priority: l.opportunityScore || 50,
            reason: (l.closingChance || 0) > 70 ? 'Alta chance de fechamento detectada' : 'Alimentação de funil necessária',
            estimatedTimeMinutes: 8,
            status: 'pending'
          }));

        return { 
          date: new Date().toISOString(), 
          tasks, 
          status, 
          summary: { 
            newContacts: isEmergency ? operational.dailyLeadsNeeded * 2 : operational.dailyLeadsNeeded, 
            followUps: isEmergency ? 10 : 5, 
            hotLeads: tasks.filter(t => t.type === 'closure').length, 
            estimatedTotalTime: tasks.length * 8, 
            revenueGap: forecast.gapToGoal, 
            chanceOfHittingGoal: forecast.confidence,
            projectedRevenue: forecast.projectedRevenue,
            deviationPercentage
          },
          recoveryPlan: isEmergency ? {
            dailyContactsTarget: operational.dailyLeadsNeeded * 2,
            dailyFollowUpsTarget: 10,
            requiredClosures: operational.requiredClosures,
            recommendedActions: [
              "Dobrar volume de prospecção diária",
              "Ativar upsell em todos os leads qualificados",
              "Reativar leads com score > 70 que esfriaram",
              "Oferecer bônus de fechamento imediato"
            ]
          } : undefined,
          recommendations: isEmergency 
            ? ["MODO EMERGÊNCIA: Priorize fechamentos de alto valor", "Aumente volume de contatos em 100%"] 
            : ["Mantenha o ritmo atual", "Foque na qualidade do primeiro contato"]
        };
      },
      getPsychologicalAnalysis: () => ({ profile: 'Analítico', confidence: 100, reasoning: '', recommendedTone: '', avoidTraits: [] }),
      getEmotionalAnalysis: () => ({ probableEmotion: 'Interesse', confidence: 'Alta', riskOfResponse: 'Baixo', recommendedTone: 'Consultivo', alerts: [], moment: 'avançar', trend: 'estável' }),
      getWinningPatterns: () => ({ bestSequences: [], userEvolution: { dominantStyle: '', efficacyScore: 0, topChannel: '' }, stylePerformance: {} }),
      getDecisionScore: () => ({ quality: 'Alta', score: 100, reasoning: '', predictedOutcome: 'responded', riskLevel: 'Baixo' }),
      exportLearningReport: () => ({ bestStrategies: [], worstDecisions: [], performanceAudit: [] }),
      getAuditHistory: () => get().auditLogs,
      getDominantPlaybookInfo: () => null,
      getStyleEfficiency: () => ({ score: 0, responseRate: 0, interestRate: 0, totalInteractions: 0 }),
      getNegotiationSimulation: () => ({ conversionChange: 0, profitChange: 0, newProbability: 0, marginImpact: 0, recommendation: '' }),
      
      // MOTOR DE ORQUESTRAÇÃO DE RECEITA
      getRevenueOrchestration: (leadId: string) => {
        const state = get();
        const lead = state.leads.find(l => l.id === leadId);
        const services = state.services;
        
        if (!lead) {
          return {
            recommendedStrategy: 'Lead não encontrado',
            recommendedServices: [],
            bundlePrice: 0,
            bundleProfit: 0,
            upsellMoment: 'aguardar' as const,
            upsellPreparation: '',
            adaptivePriceAdjustment: 0,
            impactOnMonthlyRevenue: 0,
            confidence: 'Baixa' as const,
            reasoning: '',
            alternativeStrategies: []
          };
        }

        const insight = lead.revenueInsight;
        const closingChance = lead.closingChance || 50;
        const stage = lead.conversationStage || 'Novo';
        const sensitivity = insight?.priceSensitivity || 'neutro';
        const purchasingPower = lead.purchasingPower || 'Médio';

        // 1. Determinar serviço principal
        const primaryService = services.find(s => s.id === lead.selectedServiceId) || services[0];
        const recommendedServices: string[] = primaryService ? [primaryService.id] : [];

        // 2. Detectar oportunidade de bundle (Site + Tráfego é o pacote mais lucrativo)
        const isWebService = primaryService?.name?.toLowerCase().includes('site') || primaryService?.name?.toLowerCase().includes('landing');
        const trafficService = services.find(s => s.name.toLowerCase().includes('tráfego'));
        let recommendedStrategy = `Vender ${primaryService?.name || 'serviço principal'}`;
        let bundlePrice = insight?.suggestedPrice || primaryService?.idealPrice || 1500;
        let bundleProfit = bundlePrice * (primaryService?.estimatedMargin || 0.5);

        if (isWebService && trafficService && (purchasingPower === 'Alto' || closingChance > 60)) {
          recommendedServices.push(trafficService.id);
          const trafficPrice = trafficService.idealPrice;
          bundlePrice += trafficPrice;
          bundleProfit += trafficPrice * trafficService.estimatedMargin;
          recommendedStrategy = `Pacote: ${primaryService?.name} + ${trafficService.name}`;
        }

        // 3. Momento do upsell
        let upsellMoment: 'agora' | 'preparar' | 'aguardar' | 'evitar' = 'aguardar';
        let upsellPreparation = '';
        
        if (closingChance > 75 && (stage === 'Negociação' || stage === 'Fechamento')) {
          upsellMoment = 'agora';
          upsellPreparation = 'Lead pronto. Apresente o pacote completo destacando o ROI combinado.';
        } else if (closingChance > 50 && stage === 'Apresentação de valor') {
          upsellMoment = 'preparar';
          upsellPreparation = 'Construa percepção de valor antes do upsell. Mostre case de sucesso de cliente similar.';
        } else if (closingChance < 30 || sensitivity === 'sensível a preço') {
          upsellMoment = 'evitar';
          upsellPreparation = 'Foque primeiro em fechar o serviço principal. Upsell pode quebrar a venda.';
        } else {
          upsellMoment = 'aguardar';
          upsellPreparation = 'Aguarde sinal claro de interesse antes de propor adicional.';
        }

        // 4. Ajuste adaptativo de preço (% sobre o preço sugerido)
        let adaptivePriceAdjustment = 0;
        if (sensitivity === 'orientado a valor' && closingChance > 60) {
          adaptivePriceAdjustment = 12; // pode subir 12%
        } else if (sensitivity === 'orientado a valor' && purchasingPower === 'Alto') {
          adaptivePriceAdjustment = 18;
        } else if (sensitivity === 'sensível a preço' && closingChance < 40) {
          adaptivePriceAdjustment = -8;
        }

        // 5. Alerta de subprecificação
        let underpricingAlert: string | undefined;
        if (insight && insight.suggestedPrice < (primaryService?.idealPrice || 0) * 0.95 && purchasingPower === 'Alto') {
          underpricingAlert = `Você está vendendo abaixo do valor possível. Lead suporta até R$ ${Math.round((primaryService?.maxPrice || bundlePrice * 1.3)).toLocaleString('pt-BR')}.`;
        }

        // 6. Impacto no faturamento mensal
        const baselineRevenue = (insight?.suggestedPrice || 0) * (closingChance / 100);
        const adjustedPrice = bundlePrice * (1 + adaptivePriceAdjustment / 100);
        const newExpectedRevenue = adjustedPrice * (closingChance / 100);
        const impactOnMonthlyRevenue = Math.round(newExpectedRevenue - baselineRevenue);

        // 7. Confiança
        const confidence: 'Alta' | 'Média' | 'Baixa' = 
          closingChance > 70 ? 'Alta' : closingChance > 40 ? 'Média' : 'Baixa';

        // 8. Estratégias alternativas
        const alternativeStrategies = [
          {
            label: 'Vender apenas serviço principal',
            expectedRevenue: Math.round((insight?.suggestedPrice || 0) * (closingChance / 100)),
            tradeoff: 'Menor risco, ticket menor'
          },
          {
            label: 'Pacote completo com bônus',
            expectedRevenue: Math.round(bundlePrice * (closingChance / 100) * 1.05),
            tradeoff: 'Maior ticket, exige construção de valor'
          },
          {
            label: 'Premium com preço + 18%',
            expectedRevenue: Math.round(bundlePrice * 1.18 * Math.max((closingChance - 10) / 100, 0.1)),
            tradeoff: 'Margem máxima, exige perfil orientado a valor'
          }
        ];

        const reasoning = `Score ${closingChance}%, perfil ${sensitivity}, poder ${purchasingPower}. ${recommendedServices.length > 1 ? 'Bundle detectado.' : 'Foco em serviço único.'} ${upsellMoment === 'agora' ? 'Momento ideal de upsell.' : ''}`;

        return {
          recommendedStrategy,
          recommendedServices,
          bundlePrice: Math.round(bundlePrice),
          bundleProfit: Math.round(bundleProfit),
          upsellMoment,
          upsellPreparation,
          adaptivePriceAdjustment,
          underpricingAlert,
          impactOnMonthlyRevenue,
          confidence,
          reasoning,
          alternativeStrategies
        };
      },

      getRevenueStrategySimulation: (mode) => {
        const state = get();
        const leads = state.leads.filter(l => !['Lead Fechado', 'Perdido'].includes(l.status));
        const baseTicket = state.services[0]?.idealPrice || 1500;
        const baseMargin = state.services[0]?.estimatedMargin || 0.5;

        let conversionMultiplier = 1;
        let ticketMultiplier = 1;
        let insight = '';

        if (mode === 'low_price_volume') {
          conversionMultiplier = 1.4;
          ticketMultiplier = 0.7;
          insight = 'Alto volume, baixa margem. Risco: queima reputação e desgasta operação.';
        } else if (mode === 'premium_low_volume') {
          conversionMultiplier = 0.6;
          ticketMultiplier = 1.4;
          insight = 'Margem máxima por lead. Exige posicionamento premium e leads qualificados.';
        } else {
          conversionMultiplier = 1;
          ticketMultiplier = 1.1;
          insight = 'Estratégia equilibrada. Maximiza lucro total com risco moderado.';
        }

        const expectedClosures = Math.round(leads.length * 0.15 * conversionMultiplier);
        const avgTicket = Math.round(baseTicket * ticketMultiplier);
        const expectedRevenue = expectedClosures * avgTicket;
        const expectedProfit = Math.round(expectedRevenue * baseMargin);

        return { expectedClosures, expectedRevenue, expectedProfit, avgTicket, insight };
      },

      generatePlaybook: (leadId: string) => {
        const state = get();
        const lead = state.leads.find(l => l.id === leadId);
        if (!lead) return;

        const niche = lead.niche?.toLowerCase() || 'geral';
        const hasInstagram = !!(lead.instagramHandle || lead.socialDiscovery?.instagramHandle);
        const hasWhatsapp = !!lead.whatsapp;

        // Generate intelligent playbook based on lead data
        const stages = [];
        let stageIndex = 0;

        // Stage 1: Warm-up (Instagram if available)
        if (hasInstagram) {
          stages.push({
            id: `stage_${stageIndex++}`,
            label: 'Aquecimento Instagram',
            channel: 'Instagram' as const,
            strategy: 'Seguir, curtir 3 posts, ver stories',
            trigger: 'Início do playbook',
            objective: 'Criar familiaridade antes do contato direto',
            delayDays: 0,
            suggestedMessage: '',
            alternatives: [],
            status: 'current' as const,
          });
        }

        // Stage 2: First contact (WhatsApp preferred)
        if (hasWhatsapp) {
          stages.push({
            id: `stage_${stageIndex++}`,
            label: 'Primeiro Contato WhatsApp',
            channel: 'WhatsApp' as const,
            strategy: 'Mensagem consultiva curta',
            trigger: hasInstagram ? '24h após aquecimento' : 'Início',
            objective: 'Abrir conversa sem parecer spam',
            delayDays: hasInstagram ? 1 : 0,
            suggestedMessage: `Olá! Vi o trabalho da ${lead.companyName} e achei muito interessante. Posso te mostrar algo que pode ajudar a atrair mais clientes?`,
            alternatives: [
              `Oi! Sou especialista em sites para ${niche}. Posso te mostrar como seus concorrentes estão captando clientes online?`,
            ],
            status: 'pending' as const,
          });
        }

        // Stage 3: Follow-up
        stages.push({
          id: `stage_${stageIndex++}`,
          label: 'Follow-up Consultivo',
          channel: (hasWhatsapp ? 'WhatsApp' : 'Instagram') as 'WhatsApp' | 'Instagram' | 'Email',
          strategy: 'Enviar valor antes de pedir algo',
          trigger: '3 dias sem resposta',
          objective: 'Reengajar com conteúdo de valor',
          delayDays: 3,
          suggestedMessage: `Oi! Fiz uma análise rápida do seu segmento e encontrei oportunidades interessantes. Posso compartilhar?`,
          alternatives: [],
          status: 'pending' as const,
        });

        // Stage 4: Final attempt
        stages.push({
          id: `stage_${stageIndex++}`,
          label: 'Última Tentativa',
          channel: 'Email' as const,
          strategy: 'Email formal com proposta de valor',
          trigger: '7 dias sem resposta',
          objective: 'Última tentativa antes de pausar',
          delayDays: 7,
          suggestedMessage: `Olá ${lead.companyName}, envio este email como última tentativa de contato. Caso tenha interesse em melhorar sua presença digital, estou à disposição.`,
          alternatives: [],
          status: 'pending' as const,
        });

        const playbook = {
          id: `playbook_${Date.now()}`,
          leadId,
          name: `Playbook ${niche}`,
          niche,
          stages,
          currentStageIndex: 0,
          conversionChance: lead.closingChance || 30,
          aggressiveness: 'médio' as const,
          rejectionRisk: 20,
          lastAdaptedAt: new Date().toISOString(),
        };

        set((s) => ({
          leads: s.leads.map(l => l.id === leadId ? { ...l, playbook } : l)
        }));

        logger.info('Playbook generated', { leadId, stages: stages.length, niche });
      },
      advancePlaybook: (leadId: string) => {
        const state = get();
        const lead = state.leads.find(l => l.id === leadId);
        if (!lead?.playbook) return;

        const nextIndex = lead.playbook.currentStageIndex + 1;
        if (nextIndex >= lead.playbook.stages.length) {
          logger.info('Playbook completed', { leadId });
          return;
        }

        const updatedStages = lead.playbook.stages.map((s, i) => ({
          ...s,
          status: i < nextIndex ? 'completed' as const : i === nextIndex ? 'current' as const : 'pending' as const,
        }));

        set((s) => ({
          leads: s.leads.map(l => l.id === leadId ? {
            ...l,
            playbook: { ...l.playbook!, currentStageIndex: nextIndex, stages: updatedStages }
          } : l)
        }));

        logger.info('Playbook advanced', { leadId, stage: nextIndex });
      },
      adaptPlaybook: (leadId: string, behavior: 'ignored' | 'responded' | 'interested' | 'cooling_down') => {
        const state = get();
        const lead = state.leads.find(l => l.id === leadId);
        if (!lead?.playbook) return;

        let aggressiveness = lead.playbook.aggressiveness;
        let rejectionRisk = lead.playbook.rejectionRisk;

        switch (behavior) {
          case 'responded':
            aggressiveness = 'médio';
            rejectionRisk = Math.max(0, rejectionRisk - 10);
            break;
          case 'interested':
            aggressiveness = 'alto';
            rejectionRisk = Math.max(0, rejectionRisk - 20);
            break;
          case 'ignored':
            rejectionRisk = Math.min(100, rejectionRisk + 15);
            break;
          case 'cooling_down':
            aggressiveness = 'baixo';
            rejectionRisk = Math.min(100, rejectionRisk + 25);
            break;
        }

        set((s) => ({
          leads: s.leads.map(l => l.id === leadId ? {
            ...l,
            playbook: {
              ...l.playbook!,
              aggressiveness,
              rejectionRisk,
              lastAdaptedAt: new Date().toISOString(),
            }
          } : l)
        }));

        logger.info('Playbook adapted', { leadId, behavior, aggressiveness, rejectionRisk });
      },
      applyActiveLearning: (outcome: DecisionOutcome) => {
        const state = get();
        const patterns = state.activeLearningState.winningPatterns.map(p => {
          if (p.name === outcome.strategy) {
            const total = (p.totalUses || 0) + 1;
            let successRate = p.successRate;
            if (outcome.outcome === 'interested' || outcome.outcome === 'responded') {
              successRate = ((p.successRate * (total - 1)) + 1) / total;
            } else {
              successRate = (p.successRate * (total - 1)) / total;
            }
            return { ...p, totalUses: total, successRate, lastOutcome: outcome.outcome };
          }
          return p;
        });
        
        const existingPattern = patterns.find(p => p.name === outcome.strategy);
        
        if (!existingPattern) {
          patterns.push({
            id: `pattern_${Date.now()}`,
            name: outcome.strategy,
            description: `Estratégia: ${outcome.strategy} via ${outcome.channel}`,
            successRate: outcome.outcome === 'interested' || outcome.outcome === 'responded' ? 1 : 0,
            totalUses: 1,
            bestNiches: [],
            bestChannels: [outcome.channel],
            appliedRules: [],
            lastOutcome: outcome.outcome,
          });
        }

        set((s) => ({
          activeLearningState: {
            ...s.activeLearningState,
            winningPatterns: patterns.sort((a, b) => b.successRate - a.successRate).slice(0, 20),
          }
        }));

        logger.info('Active learning applied', { strategy: outcome.strategy, outcome: outcome.outcome });
      },
    }),
    { name: 'prospecting-storage' }
  )
);
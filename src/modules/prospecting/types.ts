export type LeadStatus = 
  | 'Lead Gerado' 
  | 'Qualificado' 
  | 'Cold Mail Enviado'
  | 'LinkedIn Enviado'
  | 'WhatsApp Enviado'
  | 'Instagram Enviado'
  | 'Follow-Up'
  | 'Lead Qualificado'
  | 'Lead Fechado'
  | 'Perdido'
  | 'Novo'
  | 'Site gerado'
  | 'Contatado'
  | 'Cold Mail'
  | 'LinkedIn'
  | 'WhatsApp'
  | 'Instagram'
  | 'Interessado'
  | 'Cold Mail Sent'
  | 'LinkedIn Sent'
  | 'WhatsApp Sent'
  | 'Instagram Sent'
  | 'Recebido'
  | 'Em Diagnóstico'
  | 'Proposta Enviada'
  | 'Agendado';

export type OpportunityLevel = 'baixa' | 'média' | 'boa' | 'quente';

export type SocialDiscoveryStatus = 'pendente' | 'encontrado' | 'parcial' | 'não_encontrado' | 'revisar_manual';

export interface SocialDiscoveryData {
  instagramUrl?: string;
  instagramHandle?: string;
  facebookUrl?: string;
  tiktokUrl?: string;
  linkedinUrl?: string;
  youtubeUrl?: string;
  recentPosts?: {
    caption: string;
    date: string;
    imageUrl?: string;
  }[];
  suggestedHook?: string;
  suggestedHeadline?: string;
  status: SocialDiscoveryStatus;
  confidence: number;
  evidence: string;
  lastCheckedAt?: string;
}

export interface SalesService {
  id: string;
  name: string;
  idealPrice: number;
  minPrice: number;
  maxPrice?: number;
  estimatedMargin: number; // 0-1
  sellingDifficulty: 'Fácil' | 'Média' | 'Difícil';
  potentialUpsell?: string[]; // IDs of services
}

export interface GeneratedSite {
  companyName: string;
  niche: string;
  nicheManual?: string;
  city: string;
  services: string[];
  differentials: string[];
  whatsapp?: string;
  instagram?: string;
  tone: 'Profissional' | 'Premium' | 'Popular' | 'Consultivo';
  address?: string;
  instagramImages?: string[];
  rawDataInput?: string;
  explosionMode?: boolean;
  revenueSimulation?: {
    ticket: number;
    customers: number;
    conversion: number;
  };
}

export type ContactStatus = 
  | 'Novo envio pendente'
  | 'Contato enviado hoje'
  | 'Reenvio agendado'
  | 'Reenvio vencido'
  | 'Aguardando resposta'
  | 'Cliente respondeu'
  | 'Cliente sem interesse'
  | 'Lead descartado'
  | 'Erro no envio'
  | 'Não contactar'
  | 'Sequência finalizada'
  | 'Aguardando confirmação'
  | 'Interessado';

export interface LeadRevenueInsight {
  serviceId: string;
  suggestedPrice: number;
  optimalProfitPrice: number;
  minimumSecurePrice: number;
  breakEvenPoint: number;
  priceSensitivity: 'sensível a preço' | 'neutro' | 'orientado a valor';
  negotiationStrategy: string;
  closingProbability: number; // 0-100
  expectedValue: number;
  reasoning: string;
  marginProtectionAlert?: string;
  profitOpportunityAlert?: string;
  discountImpact?: {
    suggestedPrice: number;
    probabilityIncrease: number;
    revenueImpact: number;
    marginImpact: number;
  };
}

export type ConversationStage = 
  | 'Novo'
  | 'Primeira resposta' 
  | 'Engajamento inicial' 
  | 'Diagnóstico' 
  | 'Apresentação de valor' 
  | 'Interesse' 
  | 'Objeção' 
  | 'Negociação' 
  | 'Fechamento' 
  | 'Pós-fechamento';

export type MessageObjective = 
  | 'open_conversation' 
  | 'generate_curiosity' 
  | 'qualify_lead' 
  | 'book_meeting';

export type MessageOutcome = 
  | 'no_response' 
  | 'responded' 
  | 'interested' 
  | 'not_interested';

export type AutomationMode = 'manual' | 'assisted' | 'automatic';

export interface FollowUpStep {
  channel: 'WhatsApp' | 'Instagram' | 'Email';
  delayDays: number;
  label: string;
  objective?: string;
  trigger?: string;
  suggestedMessage?: string;
  alternativeMessages?: string[];
}

export interface FollowUpSequence {
  currentStep: number;
  totalSteps: number;
  steps: FollowUpStep[];
  isActive: boolean;
  stopReason?: 'responded' | 'limit_reached' | 'manual' | 'error';
}

export interface ChannelGoal {
  channel: 'WhatsApp' | 'Instagram' | 'Email';
  target: number;
  current: number;
}

export interface MomentumInfo {
  status: 'strong' | 'average' | 'falling';
  label: string;
  description: string;
  trend: 'up' | 'down' | 'stable';
}

export interface WeeklyData {
  day: string;
  contacts: number;
  responses: number;
  conversions: number;
  revenue: number;
  consistency: number;
  topPerformingStyle?: string;
}

export interface DailyTask {
  id: string;
  leadId: string;
  type: 'closure' | 'followup' | 'new_contact' | 'revision';
  priority: number;
  reason: string;
  estimatedTimeMinutes: number;
  status: 'pending' | 'completed' | 'skipped';
}

export interface OperationalAdjustment {
  type: 'recovery' | 'ahead' | 'on_track';
  requiredDailyIncrease: number;
  percentageOff: number;
  message: string;
}

export interface DailyPlan {
  date: string;
  tasks: DailyTask[];
  status: 'on_track' | 'delayed' | 'at_risk' | 'ahead' | 'completed' | 'emergency';
  summary: {
    newContacts: number;
    followUps: number;
    hotLeads: number;
    estimatedTotalTime: number;
    revenueGap: number;
    chanceOfHittingGoal: 'Alta' | 'Média' | 'Baixa';
    projectedRevenue: number;
    deviationPercentage: number;
  };
  recoveryPlan?: {
    dailyContactsTarget: number;
    dailyFollowUpsTarget: number;
    requiredClosures: number;
    recommendedActions: string[];
  };
  recommendations: string[];
  adjustment?: OperationalAdjustment;
}

export interface DecisionOutcome {
  strategy: string;
  intensity: 'leve' | 'medio' | 'forte';
  channel: string;
  message: string;
  timestamp: string;
  outcome?: MessageOutcome;
  responseTimeMs?: number;
  conversionWeight?: number; // 1: response, 2: interest, 3: closure
}

export interface DecisionScore {
  quality: 'Alta' | 'Média' | 'Baixa';
  score: number; // 0-100
  reasoning: string;
  predictedOutcome: MessageOutcome;
  riskLevel: 'Baixo' | 'Médio' | 'Alto';
}

export interface AuditLogEntry {
  id: string;
  leadId: string;
  leadName: string;
  timestamp: string;
  decision: string;
  strategy: string;
  suggestedPrice?: number;
  channel: string;
  context: {
    psychologicalProfile?: LeadPsychologicalProfile;
    closingChance: number;
    purchasingPower?: 'Alto' | 'Médio' | 'Baixo';
  };
  outcome?: MessageOutcome;
  impact: 'Positivo' | 'Neutro' | 'Negativo';
  correctionApplied?: string;
  isCritical?: boolean;
}

export interface LearningPattern {
  id: string;
  name: string;
  description: string;
  successRate: number;
  realSuccessRate?: number; // Based on outcomes
  totalUses: number;
  bestNiches: string[];
  bestChannels: string[];
  appliedRules: string[];
  lastOutcome?: MessageOutcome;
}

export interface ContactHistoryItem {
  id: string;
  timestamp: string;
  channel: 'WhatsApp' | 'Instagram' | 'Email' | 'Outro';
  status: 'pendente' | 'enviado' | 'erro' | 'confirmado';
  message?: string;
  author?: string;
  nextFollowUpAt?: string;
  attemptNumber?: number;
  responseTimeMs?: number;
  objective?: MessageObjective;
  outcome?: MessageOutcome;
  style?: string;
  intensity?: 'leve' | 'medio' | 'forte';
  userId?: string; 
  durationMs?: number; 
}

export interface PredictiveMetrics {
  responseProbability: number; // 0-100
  objectionProbability: number; // 0-100
  rejectionProbability: number; // 0-100
  riskLevel: 'Baixo' | 'Médio' | 'Alto';
  likelyObjectionType?: 'preço' | 'tempo' | 'desinteresse' | 'autoridade';
  leadOpenness: number; // 0-100
}

export type LeadPsychologicalProfile = 'Analítico' | 'Direto' | 'Desconfiado' | 'Ocupado' | 'Curioso' | 'Indeciso' | 'Reativo' | 'Híbrido';

export type LeadEmotion = 'Interesse' | 'Curiosidade' | 'Dúvida' | 'Desconfiança' | 'Pressa' | 'Irritação' | 'Indiferença' | 'Abertura' | 'Resistência' | 'Urgência' | 'Comparação de Preço' | 'Medo de Investir' | 'Neutro';

export interface EmotionalAnalysis {
  probableEmotion: LeadEmotion;
  confidence: 'Alta' | 'Média' | 'Baixa';
  riskOfResponse: 'Baixo' | 'Médio' | 'Alto';
  recommendedTone: 'Consultivo' | 'Direto' | 'Acolhedor' | 'Objetivo' | 'Leve' | 'Profissional' | 'Seguro' | 'Breve';
  alerts: string[];
  moment: 'avançar' | 'explicar' | 'pausar' | 'fechar' | 'encerrar';
  trend: 'aquecendo' | 'esfriando' | 'estável' | 'risco_perda';
  idealResponse?: string;
  reactionPrediction?: string;
  emotionalStaircasePhase?: 'Curiosidade' | 'Interesse' | 'Confiança' | 'Urgência' | 'Fechamento';
  nextObjective?: string;
  flowBreakRisk?: boolean;
  antiErrorValidation?: string;
  intensityAdjustment?: 'Aumentar pressão' | 'Reduzir pressão' | 'Educar';
  openingLevel?: 'Baixo' | 'Médio' | 'Alto';
  profitabilityScore?: number;
  effortRequired?: 'Baixo' | 'Médio' | 'Alto';
  confidenceScore?: number;
  realCasesCount?: number;
  marginProtectionAlert?: string;
  shouldPauseAction?: boolean;
  pauseReason?: string;
}

export interface EmotionalHistoryEntry {
  timestamp: string;
  emotion: LeadEmotion;
  phase: 'Curiosidade' | 'Interesse' | 'Confiança' | 'Urgência' | 'Fechamento';
  event: string;
}

export interface PsychologicalAnalysis {
  profile: LeadPsychologicalProfile;
  confidence: number;
  reasoning: string;
  recommendedTone: string;
  avoidTraits: string[];
  hybridWith?: LeadPsychologicalProfile;
  activeCTA?: string;
  behaviorAdjustment?: string;
}

export interface AutonomousDecision {
  leadId: string;
  type: 'contact' | 'followup' | 'negotiate' | 'upsell' | 'reactivate' | 'closure';
  actionLabel: string;
  recommendedChannel: 'WhatsApp' | 'Instagram' | 'Email';
  readyMessage: string;
  strategyRationale: string;
  confidenceScore: number;
  realConfidenceScore?: number; // Based on actual success
  expectedOutcome: string;
  riskOfHesitation: 'Baixo' | 'Médio' | 'Alto';
  blockingReason?: string;
  isLocked: boolean;
  isCritical?: boolean;
  criticalReason?: string;
  whatIfScenarios?: {
    strategy: string;
    expectedImprovement: number;
    reason: string;
  }[];
}

export interface ManualAnalysis {
  companyExists: boolean;
  activeInstagram: boolean;
  hasWebsite: boolean;
  isRecentlyActive: boolean;
  worthContacting: boolean;
  analyzedAt?: string;
  instagramFollowed?: boolean;
  instagramLiked?: boolean;
  instagramPostsSeen?: boolean;
}

export type SafetyStatus = 'Seguro' | 'Atenção' | 'Risco';

export interface ProspectLead {
  id: string;
  companyName: string;
  email?: string;
  linkedinUrl?: string;
  role?: string;
  niche: string;
  city: string;
  neighborhood?: string;
  address?: string;
  instagramHandle?: string;
  instagramUrl?: string;
  whatsapp?: string;
  websiteUrl?: string;
  rating?: number;
  priceLevel?: string;
  source: string;
  searchNiche?: string;
  searchLocation?: string;
  socialDiscovery?: SocialDiscoveryData;
  notes?: string;
  services?: string[];
  opportunityScore: number;
  opportunityLevel: OpportunityLevel;
  diagnosis: string;
  generatedSite?: GeneratedSite;
  generatedPitch?: {
    whatsappShort: string;
    whatsappConsultative: string;
    instagramDirect: string;
    linkedinOutreach: string;
    coldMail1: string;
    whatsapp1: string;
    followup24h: string;
    followup72h: string;
    playbook?: {
      approachStrategy: string;
      contentSuggestions: string[];
      objectionHandling: { trigger: string; response: string }[];
    };
  };
  offerId?: string;
  avatarUrl?: string;
  instagramProfileImage?: string;
  googlePlaceImage?: string;
  importedImages?: string[];
  status: LeadStatus;
  contactStatus?: ContactStatus;
  lastContactAt?: string;
  nextFollowUpAt?: string;
  contactHistory?: ContactHistoryItem[];
  discardReason?: string;
  noInterestReason?: string;
  discardObservation?: string;
  previousStatus?: LeadStatus;
  discardedAt?: string;
  reactivatedAt?: string;
  reativationReason?: string;
  discardSource?: 'drag' | 'button' | 'action';
  blockContact?: boolean;
  automationMode?: AutomationMode;
  sequence?: FollowUpSequence;
  lastResponseAt?: string;
  closingChance?: number;
  estimatedValue?: number;
  probabilityOfClosing?: number;
  expectedRevenue?: number;
  likelyClosingDays?: number;
  consecutiveErrors?: number;
  blockReason?: string;
  createdAt: string;
  updatedAt: string;
  playbook?: Playbook;
  conversationStage?: ConversationStage;
  statusNotes?: StatusNote[];
  requestChecklist?: {
    briefingReceived: boolean;
    filesReceived: boolean;
    diagnosisDone: boolean;
    proposalSent: boolean;
    serviceScheduled: boolean;
    deliveryCompleted: boolean;
    paymentConfirmed: boolean;
    clientFeedback?: 'Péssimo' | 'Ruim' | 'Ok' | 'Bom' | 'Excelente';
  };
  draftInfo?: Record<string, any>;
  predictiveMetrics?: PredictiveMetrics;
  reactiveModule?: {
    isReactivationCandidate: boolean;
    suggestedNewStrategy: string;
    reason: string;
  };
  futureValue?: 'Alto' | 'Médio' | 'Baixo';
  timingIntel?: {
    bestDay: string;
    bestHour: string;
    nextBestWindow: string;
    isIdealTime: boolean;
  };
  saturationIndex?: number; // 0-100
  emotionalAnalysis?: EmotionalAnalysis;
  emotionalHistory?: EmotionalHistoryEntry[];
  selectedServiceId?: string;
  negotiatedPrice?: number;
  revenueInsight?: LeadRevenueInsight;
  purchasingPower?: 'Alto' | 'Médio' | 'Baixo';
  upsellOpportunities?: string[];
  upsellMoment?: boolean;
  revenueAlerts?: string[];
  decisionScore?: number;
  expectedRevenueValue?: number;
  impactAlert?: string;
  safetyStatus?: SafetyStatus;
  warmupStatus?: 'Frio' | 'Aquecendo' | 'Morno' | 'Pronto';
  safetyMetrics?: {
    speedScore: number;
    volumeScore: number;
    patternScore: number;
  };
  isPerfectTiming?: boolean;
  behavioral_profile?: LeadPsychologicalProfile;
  real_time_strategy?: string;
  conversion_score_by_profile?: number;
  psychological_analysis?: PsychologicalAnalysis;
  autonomousDecision?: AutonomousDecision;
  hesitationMetrics?: {
    idleTimeMs: number;
    strategyChangesCount: number;
    lastActionAt: string;
    isOverthinking: boolean;
  };
  instagramInteractedAt?: string;
  googleSearchedAt?: string;
  manualAnalysis?: ManualAnalysis;
}

export interface StatusAttachment {
  id: string;
  name: string;
  type: string; 
  size: number;
  dataUrl: string; 
}

export interface StatusNote {
  id: string;
  status: LeadStatus;
  message: string;
  attachments: StatusAttachment[];
  author?: string;
  createdAt: string;
  kind?: 'manual' | 'system'; 
}

export interface PlaybookStage {
  id: string;
  label: string;
  channel: 'WhatsApp' | 'Instagram' | 'Email';
  strategy: string;
  trigger: string;
  objective: string;
  delayDays: number;
  suggestedMessage: string;
  alternatives: string[];
  status: 'completed' | 'current' | 'pending';
}

export interface Playbook {
  id: string;
  leadId: string;
  name: string;
  niche: string;
  stages: PlaybookStage[];
  currentStageIndex: number;
  conversionChance: number;
  aggressiveness: 'baixo' | 'médio' | 'alto';
  rejectionRisk: number;
  lastAdaptedAt?: string;
}

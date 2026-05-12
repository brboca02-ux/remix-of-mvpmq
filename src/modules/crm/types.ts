/**
 * CRM Module Type Definitions
 * 
 * This file contains TypeScript interfaces specific to the CRM module.
 * These types replace 'any' types identified in the type audit (Task 14.1).
 * 
 * Used in:
 * - src/modules/crm/
 * - src/server/leads-import.functions.ts
 * 
 * @module modules/crm/types
 */

import type { LeadStatus, ContactStatus } from '@/modules/prospecting/types';

// ============================================================================
// Lead Update Types
// ============================================================================

/**
 * Lead update payload
 * Used for updating lead information in the CRM
 * Used in: src/server/leads-import.functions.ts
 */
export interface LeadUpdate {
  /** Lead status */
  status?: LeadStatus;
  /** Contact status */
  contactStatus?: ContactStatus;
  /** Company name */
  companyName?: string;
  /** Email address */
  email?: string;
  /** WhatsApp number */
  whatsapp?: string;
  /** Instagram handle */
  instagramHandle?: string;
  /** Instagram URL */
  instagramUrl?: string;
  /** Website URL */
  websiteUrl?: string;
  /** LinkedIn URL */
  linkedinUrl?: string;
  /** Business niche */
  niche?: string;
  /** City */
  city?: string;
  /** Neighborhood */
  neighborhood?: string;
  /** Full address */
  address?: string;
  /** Rating */
  rating?: number;
  /** Price level */
  priceLevel?: string;
  /** Services offered */
  services?: string[];
  /** Notes */
  notes?: string;
  /** Opportunity score */
  opportunityScore?: number;
  /** Opportunity level */
  opportunityLevel?: 'baixa' | 'média' | 'boa' | 'quente';
  /** Diagnosis */
  diagnosis?: string;
  /** Last contact timestamp */
  lastContactAt?: string;
  /** Next followup timestamp */
  nextFollowUpAt?: string;
  /** Closing chance (0-100) */
  closingChance?: number;
  /** Estimated value */
  estimatedValue?: number;
  /** Expected revenue */
  expectedRevenue?: number;
  /** Pipeline stage */
  pipelineStage?: 'novo' | 'contato' | 'respondeu' | 'proposta' | 'fechado';
  /** Lead score */
  leadScore?: number;
  /** CRM source */
  crmSource?: 'buscador' | 'prospeccao' | 'manual' | 'import';
  /** CRM source detail */
  crmSourceDetail?: string;
  /** WhatsApp sent flag */
  whatsappSent?: boolean;
  /** Next action timestamp */
  nextActionAt?: string;
  /** Last interaction timestamp */
  lastInteractionAt?: string;
  /** Cooling flag */
  coolingFlag?: boolean;
  /** Block contact flag */
  blockContact?: boolean;
  /** Block reason */
  blockReason?: string;
  /** Discard reason */
  discardReason?: string;
  /** No interest reason */
  noInterestReason?: string;
  /** Discard observation */
  discardObservation?: string;
  /** Automation mode */
  automationMode?: 'manual' | 'assisted' | 'automatic';
  /** Selected service ID */
  selectedServiceId?: string;
  /** Negotiated price */
  negotiatedPrice?: number;
  /** Purchasing power */
  purchasingPower?: 'Alto' | 'Médio' | 'Baixo';
  /** Additional custom fields */
  [key: string]: unknown;
}

// ============================================================================
// CRM Pipeline Types
// ============================================================================

/**
 * Pipeline stage
 */
export type PipelineStage = 'novo' | 'contato' | 'respondeu' | 'proposta' | 'fechado';

/**
 * Pipeline stage configuration
 */
export interface PipelineStageConfig {
  /** Stage identifier */
  stage: PipelineStage;
  /** Stage display name */
  name: string;
  /** Stage description */
  description?: string;
  /** Stage color */
  color: string;
  /** Stage order */
  order: number;
  /** SLA in hours */
  slaHours?: number;
  /** Required actions */
  requiredActions?: string[];
  /** Next stages */
  nextStages?: PipelineStage[];
}

/**
 * Pipeline statistics
 */
export interface PipelineStatistics {
  /** Statistics by stage */
  byStage: Record<
    PipelineStage,
    {
      count: number;
      value: number;
      conversionRate?: number;
      avgTimeInStage?: number;
    }
  >;
  /** Total leads */
  totalLeads: number;
  /** Total value */
  totalValue: number;
  /** Overall conversion rate */
  conversionRate: number;
  /** Average deal size */
  avgDealSize: number;
  /** Win rate */
  winRate: number;
}

// ============================================================================
// CRM Activity Types
// ============================================================================

/**
 * Activity type
 */
export type ActivityType =
  | 'call'
  | 'email'
  | 'whatsapp'
  | 'instagram'
  | 'meeting'
  | 'note'
  | 'task'
  | 'status_change';

/**
 * CRM activity
 */
export interface CRMActivity {
  /** Activity ID */
  id: string;
  /** Related lead ID */
  leadId: string;
  /** Activity type */
  type: ActivityType;
  /** Activity title */
  title: string;
  /** Activity description */
  description?: string;
  /** Activity timestamp */
  timestamp: string;
  /** User who performed the activity */
  userId?: string;
  /** User name */
  userName?: string;
  /** Activity metadata */
  metadata?: Record<string, unknown>;
  /** Activity outcome */
  outcome?: 'positive' | 'neutral' | 'negative';
  /** Next action */
  nextAction?: {
    type: ActivityType;
    dueDate: string;
    description: string;
  };
}

// ============================================================================
// CRM Task Types
// ============================================================================

/**
 * Task priority
 */
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

/**
 * Task status
 */
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

/**
 * CRM task
 */
export interface CRMTask {
  /** Task ID */
  id: string;
  /** Related lead ID */
  leadId?: string;
  /** Task title */
  title: string;
  /** Task description */
  description?: string;
  /** Task type */
  type: ActivityType;
  /** Task priority */
  priority: TaskPriority;
  /** Task status */
  status: TaskStatus;
  /** Due date */
  dueDate: string;
  /** Assigned user ID */
  assignedTo?: string;
  /** Created by user ID */
  createdBy?: string;
  /** Creation timestamp */
  createdAt: string;
  /** Update timestamp */
  updatedAt: string;
  /** Completion timestamp */
  completedAt?: string;
  /** Task metadata */
  metadata?: Record<string, unknown>;
}

// ============================================================================
// CRM Filter Types
// ============================================================================

/**
 * Lead filter criteria
 */
export interface LeadFilterCriteria {
  /** Filter by status */
  status?: LeadStatus[];
  /** Filter by contact status */
  contactStatus?: ContactStatus[];
  /** Filter by pipeline stage */
  pipelineStage?: PipelineStage[];
  /** Filter by niche */
  niche?: string[];
  /** Filter by city */
  city?: string[];
  /** Filter by source */
  source?: string[];
  /** Filter by opportunity level */
  opportunityLevel?: Array<'baixa' | 'média' | 'boa' | 'quente'>;
  /** Filter by score range */
  scoreRange?: {
    min: number;
    max: number;
  };
  /** Filter by value range */
  valueRange?: {
    min: number;
    max: number;
  };
  /** Filter by date range */
  dateRange?: {
    field: 'createdAt' | 'lastContactAt' | 'nextFollowUpAt' | 'lastInteractionAt';
    from: string;
    to: string;
  };
  /** Filter by tags */
  tags?: string[];
  /** Filter by assigned user */
  assignedTo?: string[];
  /** Search query */
  search?: string;
}

/**
 * Lead sort options
 */
export interface LeadSortOptions {
  /** Field to sort by */
  field:
    | 'companyName'
    | 'createdAt'
    | 'updatedAt'
    | 'lastContactAt'
    | 'nextFollowUpAt'
    | 'opportunityScore'
    | 'leadScore'
    | 'estimatedValue';
  /** Sort direction */
  direction: 'asc' | 'desc';
}

// ============================================================================
// CRM Export Types
// ============================================================================

/**
 * Export format
 */
export type ExportFormat = 'csv' | 'xlsx' | 'json' | 'pdf';

/**
 * Export options
 */
export interface ExportOptions {
  /** Export format */
  format: ExportFormat;
  /** Fields to include */
  fields?: string[];
  /** Filter criteria */
  filter?: LeadFilterCriteria;
  /** Include activities */
  includeActivities?: boolean;
  /** Include notes */
  includeNotes?: boolean;
  /** Include contact history */
  includeContactHistory?: boolean;
}

/**
 * Export result
 */
export interface ExportResult {
  /** Success status */
  success: boolean;
  /** Export file URL */
  fileUrl?: string;
  /** Export file name */
  fileName?: string;
  /** Number of records exported */
  recordCount?: number;
  /** Error message */
  error?: string;
  /** Export timestamp */
  timestamp: string;
}

// ============================================================================
// CRM Dashboard Types
// ============================================================================

/**
 * Dashboard metrics
 */
export interface DashboardMetrics {
  /** Total leads */
  totalLeads: number;
  /** New leads (last 7 days) */
  newLeads: number;
  /** Active leads */
  activeLeads: number;
  /** Contacted leads */
  contactedLeads: number;
  /** Responded leads */
  respondedLeads: number;
  /** Closed leads */
  closedLeads: number;
  /** Total pipeline value */
  pipelineValue: number;
  /** Expected revenue */
  expectedRevenue: number;
  /** Conversion rate */
  conversionRate: number;
  /** Average response time (hours) */
  avgResponseTime?: number;
  /** Average deal cycle (days) */
  avgDealCycle?: number;
  /** Win rate */
  winRate: number;
}

/**
 * Dashboard chart data
 */
export interface DashboardChartData {
  /** Chart type */
  type: 'line' | 'bar' | 'pie' | 'funnel';
  /** Chart title */
  title: string;
  /** Chart data */
  data: Array<{
    label: string;
    value: number;
    color?: string;
  }>;
  /** Chart metadata */
  metadata?: Record<string, unknown>;
}

// ============================================================================
// CRM Notification Types
// ============================================================================

/**
 * Notification type
 */
export type NotificationType =
  | 'followup_due'
  | 'lead_cooling'
  | 'response_received'
  | 'task_due'
  | 'milestone_reached'
  | 'alert';

/**
 * CRM notification
 */
export interface CRMNotification {
  /** Notification ID */
  id: string;
  /** Notification type */
  type: NotificationType;
  /** Notification title */
  title: string;
  /** Notification message */
  message: string;
  /** Related lead ID */
  leadId?: string;
  /** Related task ID */
  taskId?: string;
  /** Priority */
  priority: 'low' | 'medium' | 'high';
  /** Read status */
  read: boolean;
  /** Creation timestamp */
  createdAt: string;
  /** Action URL */
  actionUrl?: string;
  /** Notification metadata */
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard to check if a stage is valid
 */
export function isValidPipelineStage(stage: string): stage is PipelineStage {
  return ['novo', 'contato', 'respondeu', 'proposta', 'fechado'].includes(stage);
}

/**
 * Type guard to check if an activity type is valid
 */
export function isValidActivityType(type: string): type is ActivityType {
  return ['call', 'email', 'whatsapp', 'instagram', 'meeting', 'note', 'task', 'status_change'].includes(type);
}

/**
 * Type guard to check if a task priority is valid
 */
export function isValidTaskPriority(priority: string): priority is TaskPriority {
  return ['low', 'medium', 'high', 'urgent'].includes(priority);
}

/**
 * Job System Type Definitions
 * 
 * This file contains TypeScript interfaces for the background job system.
 * These types replace 'any' types identified in the type audit (Task 14.1).
 * 
 * Used in:
 * - src/lib/jobs.server.ts
 * - src/lib/jobs.functions.ts
 * - src/lib/leads-import.functions.ts
 * 
 * @module types/jobs
 */

import type { JobStatus, JobSourceStats } from './database';

// Re-export types from database for convenience
export type { JobStatus, JobSourceStats };

// Generic Job record used by jobs-store (UI/state shape)
export interface Job {
  id: string;
  type?: string;
  status: JobStatus;
  payload: JobPayload;
  result?: unknown;
  error?: string;
  progress?: number;
  createdAt?: string;
  updatedAt?: string;
  startedAt?: string;
  finishedAt?: string;
  [key: string]: unknown;
}

// ============================================================================
// Job Payload Types
// ============================================================================

/**
 * Base job payload interface
 * All job payloads should extend this
 */
export interface BaseJobPayload {
  /** Job type identifier */
  type: string;
  /** User ID who created the job */
  userId?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Lead import job payload
 * Used for CSV/bulk lead imports
 */
export interface LeadImportJobPayload extends BaseJobPayload {
  type: 'lead_import';
  /** CSV file content or URL */
  source: string;
  /** Source type */
  sourceType: 'csv' | 'url' | 'api';
  /** Import options */
  options?: {
    /** Skip duplicate leads */
    skipDuplicates?: boolean;
    /** Validate before import */
    validate?: boolean;
    /** Update existing leads */
    updateExisting?: boolean;
    /** Field mapping */
    fieldMapping?: Record<string, string>;
  };
}

/**
 * Google Places bulk search job payload
 */
export interface PlacesBulkJobPayload extends BaseJobPayload {
  type: 'places_bulk_search';
  /** Search query */
  query: string;
  /** Search location */
  location: string;
  /** Search radius in meters */
  radius?: number;
  /** Maximum results */
  maxResults?: number;
  /** Place types to search for */
  types?: string[];
}

/**
 * Market research job payload
 */
export interface MarketResearchJobPayload extends BaseJobPayload {
  type: 'market_research';
  /** Research query */
  query: string;
  /** Research depth */
  depth?: 'quick' | 'standard' | 'deep';
  /** Data sources to use */
  sources?: string[];
}

/**
 * Site generation job payload
 */
export interface SiteGenerationJobPayload extends BaseJobPayload {
  type: 'site_generation';
  /** Lead ID to generate site for */
  leadId: string;
  /** Site template */
  template?: string;
  /** Generation options */
  options?: {
    /** Include AI-generated content */
    aiContent?: boolean;
    /** Include images */
    includeImages?: boolean;
    /** Site tone */
    tone?: 'Profissional' | 'Premium' | 'Popular' | 'Consultivo';
  };
}

/**
 * Followup automation job payload
 */
export interface FollowupJobPayload extends BaseJobPayload {
  type: 'followup_automation';
  /** Lead IDs to process */
  leadIds: string[];
  /** Followup strategy */
  strategy?: 'neutro' | 'agressivo' | 'consultivo';
  /** Followup intensity */
  intensity?: 'leve' | 'moderado' | 'intenso';
  /** Channels to use */
  channels?: Array<'WhatsApp' | 'Instagram' | 'Email'>;
}

/**
 * Union type of all job payloads
 */
export type JobPayload =
  | LeadImportJobPayload
  | PlacesBulkJobPayload
  | MarketResearchJobPayload
  | SiteGenerationJobPayload
  | FollowupJobPayload
  | BaseJobPayload;

// ============================================================================
// Job Result Types
// ============================================================================

/**
 * Base job result interface
 * All job results should extend this
 */
export interface BaseJobResult {
  /** Success status */
  success: boolean;
  /** Result message */
  message?: string;
  /** Processing duration in milliseconds */
  durationMs?: number;
  /** Warnings encountered */
  warnings?: string[];
}

/**
 * Lead import job result
 */
export interface LeadImportJobResult extends BaseJobResult {
  /** Number of leads imported */
  imported: number;
  /** Number of leads skipped */
  skipped: number;
  /** Number of leads failed */
  failed: number;
  /** Number of duplicates found */
  duplicates: number;
  /** Imported lead IDs */
  leadIds?: string[];
  /** Error details for failed imports */
  errors?: Array<{
    row: number;
    field?: string;
    message: string;
    data?: Record<string, unknown>;
  }>;
}

/**
 * Google Places bulk search result
 */
export interface PlacesBulkJobResult extends BaseJobResult {
  /** Number of places found */
  found: number;
  /** Number of leads created */
  created: number;
  /** Number of leads updated */
  updated: number;
  /** Number of leads skipped */
  skipped: number;
  /** Created lead IDs */
  leadIds?: string[];
  /** Next page token for pagination */
  nextPageToken?: string;
}

/**
 * Market research job result
 */
export interface MarketResearchJobResult extends BaseJobResult {
  /** Research report ID */
  reportId?: string;
  /** Number of sources consulted */
  sourcesConsulted: number;
  /** Number of sources that succeeded */
  sourcesSucceeded: number;
  /** Confidence level */
  confidence?: 'high' | 'medium' | 'low';
  /** Report summary */
  summary?: string;
}

/**
 * Site generation job result
 */
export interface SiteGenerationJobResult extends BaseJobResult {
  /** Generated site ID */
  siteId?: string;
  /** Site URL */
  siteUrl?: string;
  /** Number of sections generated */
  sectionsGenerated?: number;
  /** Number of images included */
  imagesIncluded?: number;
}

/**
 * Followup automation job result
 */
export interface FollowupJobResult extends BaseJobResult {
  /** Number of followups sent */
  sent: number;
  /** Number of followups failed */
  failed: number;
  /** Number of followups scheduled */
  scheduled: number;
  /** Followup details */
  details?: Array<{
    leadId: string;
    channel: string;
    status: 'sent' | 'failed' | 'scheduled';
    message?: string;
  }>;
}

/**
 * Union type of all job results
 */
export type JobResult =
  | LeadImportJobResult
  | PlacesBulkJobResult
  | MarketResearchJobResult
  | SiteGenerationJobResult
  | FollowupJobResult
  | BaseJobResult;

// ============================================================================
// Job Metadata Types
// ============================================================================

/**
 * Job metadata
 * Additional information about job execution
 */
export interface JobMetadata {
  /** Job source/origin */
  source?: string;
  /** Job tags for categorization */
  tags?: string[];
  /** Job priority level */
  priority?: 'low' | 'normal' | 'high' | 'critical';
  /** Retry configuration */
  retry?: {
    /** Maximum retry attempts */
    maxAttempts: number;
    /** Retry delay in milliseconds */
    delayMs: number;
    /** Exponential backoff multiplier */
    backoffMultiplier?: number;
  };
  /** Timeout configuration */
  timeout?: {
    /** Execution timeout in milliseconds */
    executionMs: number;
    /** Warning threshold in milliseconds */
    warningMs?: number;
  };
  /** Notification configuration */
  notifications?: {
    /** Notify on success */
    onSuccess?: boolean;
    /** Notify on failure */
    onFailure?: boolean;
    /** Notification channels */
    channels?: Array<'email' | 'webhook' | 'ui'>;
    /** Webhook URL */
    webhookUrl?: string;
  };
  /** Dependencies on other jobs */
  dependencies?: {
    /** Job IDs that must complete before this job */
    requires?: string[];
    /** Job IDs that should run after this job */
    triggers?: string[];
  };
  /** Resource limits */
  resources?: {
    /** Maximum memory in MB */
    maxMemoryMb?: number;
    /** Maximum CPU percentage */
    maxCpuPercent?: number;
  };
  /** Custom metadata fields */
  [key: string]: unknown;
}

// ============================================================================
// Job Progress Types
// ============================================================================

/**
 * Job progress update
 */
export interface JobProgress {
  /** Job ID */
  jobId: string;
  /** Progress percentage (0-100) */
  progress: number;
  /** Progress message */
  message?: string;
  /** Current step */
  currentStep?: string;
  /** Total steps */
  totalSteps?: number;
  /** Estimated time remaining in milliseconds */
  estimatedRemainingMs?: number;
  /** Additional progress data */
  data?: Record<string, unknown>;
}

// ============================================================================
// Job Queue Types
// ============================================================================

/**
 * Job queue configuration
 */
export interface JobQueueConfig {
  /** Queue name */
  name: string;
  /** Maximum concurrent jobs */
  concurrency: number;
  /** Job processing rate limit */
  rateLimit?: {
    /** Maximum jobs per interval */
    max: number;
    /** Interval in milliseconds */
    intervalMs: number;
  };
  /** Default job options */
  defaultJobOptions?: {
    /** Default priority */
    priority?: number;
    /** Default retry attempts */
    maxRetries?: number;
    /** Default timeout */
    timeoutMs?: number;
  };
}

/**
 * Job queue statistics
 */
export interface JobQueueStats {
  /** Queue name */
  name: string;
  /** Total jobs in queue */
  total: number;
  /** Pending jobs */
  pending: number;
  /** Running jobs */
  running: number;
  /** Completed jobs */
  completed: number;
  /** Failed jobs */
  failed: number;
  /** Average processing time in milliseconds */
  avgProcessingTimeMs?: number;
  /** Success rate (0-1) */
  successRate?: number;
}

// ============================================================================
// Job Event Types
// ============================================================================

/**
 * Job event types
 */
export type JobEventType =
  | 'job.created'
  | 'job.started'
  | 'job.progress'
  | 'job.completed'
  | 'job.failed'
  | 'job.cancelled'
  | 'job.retry';

/**
 * Job event
 */
export interface JobEvent {
  /** Event type */
  type: JobEventType;
  /** Job ID */
  jobId: string;
  /** Event timestamp */
  timestamp: string;
  /** Event data */
  data?: Record<string, unknown>;
}

// ============================================================================
// Job Error Types
// ============================================================================

/**
 * Job error
 */
export interface JobError {
  /** Error message */
  message: string;
  /** Error code */
  code?: string;
  /** Error stack trace */
  stack?: string;
  /** Error details */
  details?: Record<string, unknown>;
  /** Whether error is retryable */
  retryable?: boolean;
  /** Timestamp when error occurred */
  timestamp: string;
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard to check if a payload is a LeadImportJobPayload
 */
export function isLeadImportJobPayload(payload: JobPayload): payload is LeadImportJobPayload {
  return payload.type === 'lead_import';
}

/**
 * Type guard to check if a payload is a PlacesBulkJobPayload
 */
export function isPlacesBulkJobPayload(payload: JobPayload): payload is PlacesBulkJobPayload {
  return payload.type === 'places_bulk_search';
}

/**
 * Type guard to check if a payload is a MarketResearchJobPayload
 */
export function isMarketResearchJobPayload(payload: JobPayload): payload is MarketResearchJobPayload {
  return payload.type === 'market_research';
}

/**
 * Type guard to check if a payload is a SiteGenerationJobPayload
 */
export function isSiteGenerationJobPayload(payload: JobPayload): payload is SiteGenerationJobPayload {
  return payload.type === 'site_generation';
}

/**
 * Type guard to check if a payload is a FollowupJobPayload
 */
export function isFollowupJobPayload(payload: JobPayload): payload is FollowupJobPayload {
  return payload.type === 'followup_automation';
}

/**
 * Type guard to check if a result is a LeadImportJobResult
 */
export function isLeadImportJobResult(result: JobResult): result is LeadImportJobResult {
  return 'imported' in result;
}

/**
 * Type guard to check if a result is a PlacesBulkJobResult
 */
export function isPlacesBulkJobResult(result: JobResult): result is PlacesBulkJobResult {
  return 'found' in result;
}

/**
 * Type guard to check if a result is a MarketResearchJobResult
 */
export function isMarketResearchJobResult(result: JobResult): result is MarketResearchJobResult {
  return 'sourcesConsulted' in result;
}

/**
 * Type guard to check if a result is a SiteGenerationJobResult
 */
export function isSiteGenerationJobResult(result: JobResult): result is SiteGenerationJobResult {
  return 'siteId' in result;
}

/**
 * Type guard to check if a result is a FollowupJobResult
 */
export function isFollowupJobResult(result: JobResult): result is FollowupJobResult {
  return 'sent' in result;
}

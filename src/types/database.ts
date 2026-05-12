/**
 * Database Entity Type Definitions
 * 
 * This file contains TypeScript interfaces for database entities
 * stored in Supabase. These types replace 'any' types identified
 * in the type audit (Task 14.1).
 * 
 * @module types/database
 */

import type { ProspectLead } from '@/modules/prospecting/types';

// ============================================================================
// Lead Types
// ============================================================================

/**
 * Lead entity from leads_import table
 * This is the core lead type used throughout the application
 * 
 * Note: For most use cases, use ProspectLead from @/modules/prospecting/types
 * which extends this with additional computed properties
 */
export type Lead = ProspectLead;

/**
 * Partial lead update type
 * Used when updating specific fields of a lead
 */
export type LeadUpdate = Partial<Omit<Lead, 'id' | 'createdAt'>>;

/**
 * Lead creation input type
 * Required fields for creating a new lead
 */
export interface LeadCreateInput {
  companyName: string;
  niche: string;
  city: string;
  source: string;
  opportunityScore?: number;
  opportunityLevel?: 'baixa' | 'média' | 'boa' | 'quente';
  diagnosis?: string;
  email?: string;
  whatsapp?: string;
  instagramHandle?: string;
  instagramUrl?: string;
  websiteUrl?: string;
  address?: string;
  neighborhood?: string;
  rating?: number;
  priceLevel?: string;
  searchNiche?: string;
  searchLocation?: string;
  notes?: string;
  services?: string[];
  raw?: Record<string, unknown>;
}

// ============================================================================
// Job Types
// ============================================================================

/**
 * Job status enum
 * Represents the current state of a background job
 */
export type JobStatus = 'pending' | 'running' | 'done' | 'failed' | 'cancelled';

/**
 * Job entity from jobs table
 * Represents a background job for async processing
 */
export interface Job {
  /** Unique job identifier */
  id: string;
  /** Job type/name */
  type: string;
  /** Current job status */
  status: JobStatus;
  /** Job input payload */
  payload: Record<string, unknown>;
  /** Job execution result */
  result?: Record<string, unknown>;
  /** Error information if job failed */
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
  /** Job progress (0-100) */
  progress?: number;
  /** Human-readable progress message */
  progressMessage?: string;
  /** Number of retry attempts */
  retries?: number;
  /** Maximum retry attempts allowed */
  maxRetries?: number;
  /** Job priority (higher = more important) */
  priority?: number;
  /** User ID who created the job */
  user_id?: string;
  /** Source statistics for import jobs */
  source_stats?: JobSourceStats;
  /** Additional job metadata */
  metadata?: Record<string, unknown>;
  /** Job creation timestamp */
  created_at: string;
  /** Job last update timestamp */
  updated_at: string;
  /** Job start timestamp */
  started_at?: string;
  /** Job completion timestamp */
  completed_at?: string;
  /** Scheduled execution time */
  scheduled_for?: string;
}

/**
 * Source statistics for import jobs
 * Tracks the progress and results of data imports
 */
export interface JobSourceStats {
  /** Total records to process */
  total?: number;
  /** Successfully processed records */
  processed?: number;
  /** Failed records */
  failed?: number;
  /** Skipped records */
  skipped?: number;
  /** Duplicate records */
  duplicates?: number;
  /** Records with validation errors */
  validationErrors?: number;
  /** Additional custom counters */
  [key: string]: number | undefined;
}

/**
 * Job creation input
 */
export interface JobCreateInput {
  type: string;
  payload: Record<string, unknown>;
  status?: JobStatus;
  priority?: number;
  user_id?: string;
  metadata?: Record<string, unknown>;
  scheduled_for?: string;
  maxRetries?: number;
}

// ============================================================================
// Import Error Types
// ============================================================================

/**
 * Import error severity levels
 */
export type ImportErrorSeverity = 'error' | 'warning' | 'info';

/**
 * Import error entity
 * Tracks errors that occur during data imports
 */
export interface ImportError {
  /** Unique error identifier */
  id: string;
  /** Related job ID */
  job_id: string;
  /** Row number in source data (if applicable) */
  row_number?: number;
  /** Field name that caused the error */
  field?: string;
  /** Error severity level */
  severity: ImportErrorSeverity;
  /** Error message */
  message: string;
  /** Detailed error information */
  details?: {
    /** Original value that caused the error */
    value?: unknown;
    /** Expected value format/type */
    expected?: string;
    /** Validation rule that failed */
    rule?: string;
    /** Additional context */
    context?: Record<string, unknown>;
  };
  /** Raw data of the failed record */
  raw_data?: Record<string, unknown>;
  /** Error creation timestamp */
  created_at: string;
}

/**
 * Import error creation input
 */
export interface ImportErrorCreateInput {
  job_id: string;
  row_number?: number;
  field?: string;
  severity: ImportErrorSeverity;
  message: string;
  details?: ImportError['details'];
  raw_data?: Record<string, unknown>;
}

// ============================================================================
// Followup History Types
// ============================================================================

/**
 * Followup history item
 * Tracks followup actions and their outcomes
 * Used in: src/server/leads-import.functions.ts
 */
export interface FollowupHistoryItem {
  /** Unique identifier */
  id: string;
  /** Related lead ID */
  lead_id: string;
  /** Followup timestamp */
  timestamp: string;
  /** Communication channel used */
  channel: 'WhatsApp' | 'Instagram' | 'Email' | 'LinkedIn' | 'Phone' | 'Outro';
  /** Followup status */
  status: 'pendente' | 'enviado' | 'entregue' | 'lido' | 'respondido' | 'erro' | 'cancelado';
  /** Message sent (if applicable) */
  message?: string;
  /** Response received (if applicable) */
  response?: string;
  /** User who performed the followup */
  author?: string;
  /** User ID */
  user_id?: string;
  /** Next scheduled followup */
  next_followup_at?: string;
  /** Attempt number in sequence */
  attempt_number?: number;
  /** Response time in milliseconds */
  response_time_ms?: number;
  /** Message objective */
  objective?: 'open_conversation' | 'generate_curiosity' | 'qualify_lead' | 'book_meeting' | 'close_deal';
  /** Outcome of the followup */
  outcome?: 'no_response' | 'responded' | 'interested' | 'not_interested' | 'closed';
  /** Communication style used */
  style?: string;
  /** Message intensity */
  intensity?: 'leve' | 'medio' | 'forte';
  /** Duration in milliseconds */
  duration_ms?: number;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
  /** Creation timestamp */
  created_at: string;
  /** Update timestamp */
  updated_at: string;
}

/**
 * Followup history creation input
 */
export interface FollowupHistoryCreateInput {
  lead_id: string;
  timestamp?: string;
  channel: FollowupHistoryItem['channel'];
  status: FollowupHistoryItem['status'];
  message?: string;
  response?: string;
  author?: string;
  user_id?: string;
  next_followup_at?: string;
  attempt_number?: number;
  objective?: FollowupHistoryItem['objective'];
  outcome?: FollowupHistoryItem['outcome'];
  style?: string;
  intensity?: FollowupHistoryItem['intensity'];
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Market Research Types
// ============================================================================

/**
 * Market research saved report entity
 * Extends the base MarketResearchSavedReport with proper typing
 */
export interface MarketResearchReport {
  /** Unique identifier */
  id: string;
  /** User's search input */
  input: string;
  /** Normalized search intent */
  normalized_intent?: NormalizedIntent;
  /** Generated report data */
  report: {
    ok: boolean;
    partial?: boolean;
    summary: string;
    trendSignal: 'growing' | 'stable' | 'declining' | 'unknown';
    confidenceLevel?: 'high' | 'medium' | 'low';
    viabilityScore?: 'low' | 'medium' | 'high';
    positioningSuggestion?: string;
    targetAudience?: string[];
    differentiationAngles?: string[];
    goToMarketIdeas?: string[];
    marketHypothesis: string[];
    competitors: Array<{
      name: string;
      description?: string;
      url?: string;
    }>;
    audienceQuestions: Array<{
      question: string;
      source?: string;
    }>;
    opportunities: string[];
    risks: string[];
    nextSteps: string[];
    charts: Array<{
      title: string;
      type: 'line' | 'bar';
      data: Array<{ label: string; value: number }>;
    }>;
    sources: Array<{
      name: string;
      status: 'configured' | 'unavailable' | 'failed' | 'skipped';
      reason?: string;
    }>;
    errors: string[];
  };
  /** Data sources used */
  sources?: Array<{
    name: string;
    status: 'configured' | 'unavailable' | 'failed' | 'skipped';
    reason?: string;
  }>;
  /** Errors encountered */
  errors?: string[];
  /** User ID */
  user_id?: string;
  /** Creation timestamp */
  created_at: string;
  /** Update timestamp */
  updated_at: string;
}

/**
 * Normalized search intent
 * Structured representation of user's search query
 */
export interface NormalizedIntent {
  /** Primary search topic */
  topic: string;
  /** Search category */
  category?: string;
  /** Geographic location */
  location?: string;
  /** Target audience */
  audience?: string;
  /** Time frame */
  timeframe?: string;
  /** Specific aspects to research */
  aspects?: string[];
  /** Search keywords */
  keywords?: string[];
  /** Confidence in normalization */
  confidence?: number;
}

// ============================================================================
// Health Check Types
// ============================================================================

/**
 * Health check result
 * Used for system health monitoring
 */
export interface HealthCheck {
  /** Check name/identifier */
  name: string;
  /** Check status */
  status: 'healthy' | 'degraded' | 'unhealthy';
  /** Status message */
  message?: string;
  /** Response time in milliseconds */
  responseTime?: number;
  /** Additional check details */
  details?: Record<string, unknown>;
  /** Timestamp of the check */
  timestamp: string;
}

// ============================================================================
// Supabase Helper Types
// ============================================================================

/**
 * Generic Supabase query response
 */
export interface SupabaseResponse<T> {
  data: T | null;
  error: SupabaseError | null;
}

/**
 * Supabase error type
 */
export interface SupabaseError {
  message: string;
  details?: string;
  hint?: string;
  code?: string;
}

/**
 * Supabase pagination metadata
 */
export interface SupabasePagination {
  /** Current page number (0-indexed) */
  page: number;
  /** Items per page */
  pageSize: number;
  /** Total number of items */
  total?: number;
  /** Whether there are more pages */
  hasMore?: boolean;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: SupabasePagination;
  error?: SupabaseError;
}

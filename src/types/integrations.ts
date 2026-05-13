/**
 * Integration Type Definitions
 * 
 * This file contains TypeScript interfaces for external integrations
 * (Make.com, messaging platforms, etc.). These types replace 'any' types
 * identified in the type audit (Task 14.1).
 * 
 * Used in:
 * - src/lib/make-integration.functions.ts
 * 
 * @module types/integrations
 */

// ============================================================================
// Make.com Integration Types
// ============================================================================

/**
 * Make.com webhook payload
 * Used for sending data to Make.com scenarios
 */
export interface MakeWebhookPayload {
  /** Event type identifier */
  event: string;
  /** Event timestamp */
  timestamp: string;
  /** Event data */
  data: Record<string, unknown>;
  /** Source identifier */
  source?: string;
  /** User ID */
  userId?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Make.com webhook response
 */
export interface MakeWebhookResponse {
  /** Success status */
  success: boolean;
  /** Response message */
  message?: string;
  /** Scenario execution ID */
  executionId?: string;
  /** Response data */
  data?: Record<string, unknown>;
  /** Error information */
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

/**
 * Lead export to Make.com payload
 */
export interface LeadExportPayload {
  /** Lead information */
  lead: {
    id: string;
    companyName: string;
    niche: string;
    city: string;
    email?: string;
    whatsapp?: string;
    instagramHandle?: string;
    websiteUrl?: string;
    status: string;
    opportunityScore: number;
    opportunityLevel: string;
  };
  /** Export options */
  options?: {
    /** Include generated site */
    includeSite?: boolean;
    /** Include pitch messages */
    includePitch?: boolean;
    /** Include contact history */
    includeHistory?: boolean;
  };
  /** Export timestamp */
  exportedAt: string;
  /** User who exported */
  exportedBy?: string;
}

// ============================================================================
// Messaging Platform Types
// ============================================================================

/**
 * Message payload for sending messages
 * Used across different messaging platforms
 */
export interface MessagePayload {
  /** Recipient identifier (phone, email, username) */
  recipient: string;
  /** Message content */
  message: string;
  /** Message channel */
  channel: 'WhatsApp' | 'Instagram' | 'Email' | 'LinkedIn' | 'SMS';
  /** Message type */
  type?: 'text' | 'image' | 'video' | 'document' | 'template';
  /** Message metadata */
  metadata?: {
    /** Lead ID */
    leadId?: string;
    /** Campaign ID */
    campaignId?: string;
    /** Message template ID */
    templateId?: string;
    /** Custom fields */
    [key: string]: unknown;
  };
  /** Attachments */
  attachments?: Array<{
    type: 'image' | 'video' | 'document' | 'audio';
    url: string;
    filename?: string;
    mimeType?: string;
  }>;
  /** Scheduling */
  scheduledFor?: string;
}

/**
 * Message response
 */
export interface MessageResponse {
  /** Success status */
  success: boolean;
  /** Message ID */
  messageId?: string;
  /** Delivery status */
  status: 'sent' | 'delivered' | 'read' | 'failed' | 'scheduled';
  /** Status message */
  message?: string;
  /** Timestamp */
  timestamp: string;
  /** Error information */
  error?: {
    code: string;
    message: string;
    retryable?: boolean;
  };
}

// ============================================================================
// WhatsApp Integration Types
// ============================================================================

/**
 * WhatsApp message payload
 */
export interface WhatsAppMessagePayload {
  /** Phone number (with country code) */
  to: string;
  /** Message text */
  text: string;
  /** Message type */
  type?: 'text' | 'template' | 'media';
  /** Template information (if using template) */
  template?: {
    name: string;
    language: string;
    components?: Array<{
      type: 'header' | 'body' | 'footer' | 'button';
      parameters?: Array<{
        type: 'text' | 'image' | 'document';
        text?: string;
        image?: { link: string };
        document?: { link: string; filename: string };
      }>;
    }>;
  };
  /** Media information (if sending media) */
  media?: {
    type: 'image' | 'video' | 'document' | 'audio';
    url: string;
    caption?: string;
    filename?: string;
  };
}

/**
 * WhatsApp webhook event
 */
export interface WhatsAppWebhookEvent {
  /** Event type */
  type: 'message' | 'status' | 'error';
  /** Timestamp */
  timestamp: string;
  /** Message data (for message events) */
  message?: {
    id: string;
    from: string;
    to: string;
    text?: string;
    type: 'text' | 'image' | 'video' | 'document' | 'audio' | 'location';
    media?: {
      id: string;
      mimeType: string;
      url?: string;
    };
  };
  /** Status data (for status events) */
  status?: {
    messageId: string;
    status: 'sent' | 'delivered' | 'read' | 'failed';
    timestamp: string;
    error?: {
      code: string;
      message: string;
    };
  };
}

// ============================================================================
// Instagram Integration Types
// ============================================================================

/**
 * Instagram direct message payload
 */
export interface InstagramMessagePayload {
  /** Instagram username or user ID */
  recipient: string;
  /** Message text */
  text: string;
  /** Message type */
  type?: 'text' | 'media' | 'story_reply';
  /** Media information (if sending media) */
  media?: {
    type: 'image' | 'video';
    url: string;
  };
  /** Story reply information */
  storyReply?: {
    storyId: string;
    replyText: string;
  };
}

// ============================================================================
// Email Integration Types
// ============================================================================

/**
 * Email message payload
 */
export interface EmailMessagePayload {
  /** Recipient email address */
  to: string;
  /** CC recipients */
  cc?: string[];
  /** BCC recipients */
  bcc?: string[];
  /** Email subject */
  subject: string;
  /** Email body (HTML or plain text) */
  body: string;
  /** Body format */
  bodyFormat?: 'html' | 'text';
  /** Sender name */
  fromName?: string;
  /** Reply-to address */
  replyTo?: string;
  /** Attachments */
  attachments?: Array<{
    filename: string;
    content: string; // Base64 encoded
    contentType: string;
  }>;
  /** Email headers */
  headers?: Record<string, string>;
}

// ============================================================================
// Outreach Strategy Types
// ============================================================================

/**
 * Outreach strategy
 * Defines the approach for contacting leads
 */
export type OutreachStrategy = 'neutro' | 'agressivo' | 'consultivo';

/**
 * Outreach intensity
 * Defines how aggressive the outreach should be
 */
export type OutreachIntensity = 'leve' | 'moderado' | 'intenso';

/**
 * Outreach configuration
 */
export interface OutreachConfig {
  /** Outreach strategy */
  strategy: OutreachStrategy;
  /** Outreach intensity */
  intensity: OutreachIntensity;
  /** Preferred channels (in order of preference) */
  channels: Array<'WhatsApp' | 'Instagram' | 'Email' | 'LinkedIn'>;
  /** Message templates */
  templates?: {
    initial?: string;
    followup?: string;
    reminder?: string;
  };
  /** Timing configuration */
  timing?: {
    /** Initial delay in hours */
    initialDelayHours?: number;
    /** Followup delay in hours */
    followupDelayHours?: number;
    /** Maximum followups */
    maxFollowups?: number;
    /** Best time to send (hour of day, 0-23) */
    bestHour?: number;
    /** Days of week to send (0=Sunday, 6=Saturday) */
    allowedDays?: number[];
  };
  /** Personalization options */
  personalization?: {
    /** Use lead's name */
    useName?: boolean;
    /** Use company name */
    useCompanyName?: boolean;
    /** Use niche-specific messaging */
    useNicheMessaging?: boolean;
    /** Use location-specific messaging */
    useLocationMessaging?: boolean;
  };
}

/**
 * Outreach result
 */
export interface OutreachResult {
  /** Lead ID */
  leadId: string;
  /** Channel used */
  channel: string;
  /** Strategy used */
  strategy: OutreachStrategy;
  /** Intensity used */
  intensity: OutreachIntensity;
  /** Message sent */
  message: string;
  /** Send status */
  status: 'sent' | 'failed' | 'scheduled';
  /** Timestamp */
  timestamp: string;
  /** Message ID (if sent) */
  messageId?: string;
  /** Error information (if failed) */
  error?: {
    code: string;
    message: string;
    retryable?: boolean;
  };
  /** Next followup scheduled */
  nextFollowupAt?: string;
}

// ============================================================================
// Webhook Types
// ============================================================================

/**
 * Generic webhook payload
 */
export interface WebhookPayload {
  /** Webhook event type */
  event: string;
  /** Event timestamp */
  timestamp: string;
  /** Event data */
  data: Record<string, unknown>;
  /** Webhook signature for verification */
  signature?: string;
  /** Webhook ID */
  webhookId?: string;
}

/**
 * Webhook configuration
 */
export interface WebhookConfig {
  /** Webhook URL */
  url: string;
  /** Events to subscribe to */
  events: string[];
  /** Secret for signature verification */
  secret?: string;
  /** Custom headers */
  headers?: Record<string, string>;
  /** Retry configuration */
  retry?: {
    maxAttempts: number;
    delayMs: number;
  };
  /** Active status */
  active: boolean;
}

/**
 * Webhook delivery result
 */
export interface WebhookDeliveryResult {
  /** Webhook ID */
  webhookId: string;
  /** Event type */
  event: string;
  /** Delivery status */
  status: 'success' | 'failed' | 'retrying';
  /** HTTP status code */
  statusCode?: number;
  /** Response body */
  response?: string;
  /** Error message */
  error?: string;
  /** Attempt number */
  attempt: number;
  /** Delivery timestamp */
  timestamp: string;
  /** Next retry timestamp (if retrying) */
  nextRetryAt?: string;
}

// ============================================================================
// CRM Integration Types
// ============================================================================

/**
 * CRM sync payload
 * For syncing leads to external CRM systems
 */
export interface CRMSyncPayload {
  /** Lead data */
  lead: {
    id: string;
    companyName: string;
    email?: string;
    phone?: string;
    status: string;
    source: string;
    customFields?: Record<string, unknown>;
  };
  /** Sync action */
  action: 'create' | 'update' | 'delete';
  /** CRM system identifier */
  crmSystem: string;
  /** Sync timestamp */
  syncedAt: string;
}

/**
 * CRM sync result
 */
export interface CRMSyncResult {
  /** Success status */
  success: boolean;
  /** CRM record ID */
  crmRecordId?: string;
  /** Sync message */
  message?: string;
  /** Error information */
  error?: {
    code: string;
    message: string;
  };
  /** Sync timestamp */
  timestamp: string;
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard to check if a strategy is valid
 */
export function isValidOutreachStrategy(strategy: string): strategy is OutreachStrategy {
  return ['neutro', 'agressivo', 'consultivo'].includes(strategy);
}

/**
 * Type guard to check if an intensity is valid
 */
export function isValidOutreachIntensity(intensity: string): intensity is OutreachIntensity {
  return ['leve', 'moderado', 'intenso'].includes(intensity);
}

/**
 * Type guard to check if a message channel is valid
 */
export function isValidMessageChannel(channel: string): channel is MessagePayload['channel'] {
  return ['WhatsApp', 'Instagram', 'Email', 'LinkedIn', 'SMS'].includes(channel);
}

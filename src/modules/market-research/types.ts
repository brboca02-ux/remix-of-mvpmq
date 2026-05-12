/**
 * Market Research Module Type Definitions
 * 
 * This file contains TypeScript interfaces specific to the market research module.
 * These types replace 'any' types identified in the type audit (Task 14.1).
 * 
 * Used in:
 * - src/server/market-research.server.ts
 * - src/server/market-research.functions.ts
 * - src/server/market-research/providers/
 * 
 * @module modules/market-research/types
 */

import type {
  MarketResearchReport,
  MarketResearchSource,
  MarketResearchTrendSignal,
  MarketResearchConfidenceLevel,
} from '@/types/market-research';

// Re-export common types for convenience
export type {
  MarketResearchReport,
  MarketResearchSource,
  MarketResearchTrendSignal,
  MarketResearchConfidenceLevel,
};

// ============================================================================
// Research Context Types
// ============================================================================

/**
 * Research context
 * Provides context for AI synthesis and research providers
 * Used in: src/server/market-research/providers/lovableAi.provider.ts
 */
export interface ResearchContext {
  /** User's original input */
  input: string;
  /** Normalized search intent */
  normalizedIntent?: NormalizedIntent;
  /** Previous research results */
  previousResults?: Array<{
    source: string;
    data: unknown;
    timestamp: string;
  }>;
  /** User preferences */
  preferences?: {
    /** Preferred research depth */
    depth?: 'quick' | 'standard' | 'deep';
    /** Focus areas */
    focusAreas?: string[];
    /** Excluded topics */
    excludeTopics?: string[];
  };
  /** Geographic context */
  geographic?: {
    /** Target country */
    country?: string;
    /** Target region/state */
    region?: string;
    /** Target city */
    city?: string;
  };
  /** Industry context */
  industry?: {
    /** Primary industry */
    primary?: string;
    /** Related industries */
    related?: string[];
    /** Industry keywords */
    keywords?: string[];
  };
  /** Temporal context */
  temporal?: {
    /** Time period of interest */
    period?: string;
    /** Historical comparison */
    compareWith?: string;
  };
  /** Additional metadata */
  metadata?: Record<string, unknown>;
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
// Google Trends Types
// ============================================================================

/**
 * Google Trends data
 * Used in: src/server/market-research/providers/googleTrends.provider.ts
 */
export interface GoogleTrendsData {
  /** Search query */
  query: string;
  /** Geographic region */
  geo?: string;
  /** Time range */
  timeRange?: string;
  /** Interest over time data */
  interestOverTime?: Array<{
    /** Date/time */
    time: string;
    /** Interest value (0-100) */
    value: number;
    /** Formatted value */
    formattedValue?: string;
  }>;
  /** Interest by region */
  interestByRegion?: Array<{
    /** Region name */
    region: string;
    /** Interest value (0-100) */
    value: number;
    /** Formatted value */
    formattedValue?: string;
  }>;
  /** Related queries */
  relatedQueries?: {
    /** Top related queries */
    top?: Array<{
      query: string;
      value: number;
      formattedValue?: string;
    }>;
    /** Rising related queries */
    rising?: Array<{
      query: string;
      value: number;
      formattedValue?: string;
    }>;
  };
  /** Related topics */
  relatedTopics?: {
    /** Top related topics */
    top?: Array<{
      topic: string;
      value: number;
      formattedValue?: string;
    }>;
    /** Rising related topics */
    rising?: Array<{
      topic: string;
      value: number;
      formattedValue?: string;
    }>;
  };
  /** Average interest */
  averageInterest?: number;
  /** Trend direction */
  trend?: 'rising' | 'stable' | 'declining';
  /** Data timestamp */
  timestamp?: string;
}

// ============================================================================
// Research Provider Types
// ============================================================================

/**
 * Research provider interface
 * Base interface for all research data providers
 */
export interface ResearchProvider {
  /** Provider name */
  name: string;
  /** Provider status */
  status: 'configured' | 'unavailable' | 'failed' | 'skipped';
  /** Fetch data from provider */
  fetch(input: string, context?: ResearchContext): Promise<ResearchProviderResult>;
}

/**
 * Research provider result
 */
export interface ResearchProviderResult {
  /** Provider name */
  source: string;
  /** Provider status */
  status: 'configured' | 'unavailable' | 'failed' | 'skipped';
  /** Result data */
  data?: unknown;
  /** Error message if failed */
  error?: string;
  /** Reason for status */
  reason?: string;
  /** Processing time in milliseconds */
  processingTimeMs?: number;
}

// ============================================================================
// AI Synthesis Types
// ============================================================================

/**
 * AI synthesis request
 */
export interface AISynthesisRequest {
  /** User input */
  input: string;
  /** Research context */
  context: ResearchContext;
  /** Provider results to synthesize */
  providerResults: ResearchProviderResult[];
  /** Synthesis options */
  options?: {
    /** Maximum length */
    maxLength?: number;
    /** Focus areas */
    focusAreas?: string[];
    /** Output format */
    format?: 'summary' | 'detailed' | 'bullet-points';
  };
}

/**
 * AI synthesis response
 */
export interface AISynthesisResponse {
  /** Success status */
  ok: boolean;
  /** Synthesized content */
  synthesis: string;
  /** Confidence level */
  confidence?: 'high' | 'medium' | 'low';
  /** Key insights */
  insights?: string[];
  /** Recommendations */
  recommendations?: string[];
  /** Sources used */
  sources?: Array<{
    name: string;
    relevance: number;
  }>;
  /** Processing metadata */
  metadata?: {
    model?: string;
    tokens?: number;
    processingTimeMs?: number;
  };
  /** Error message if failed */
  error?: string;
}

// ============================================================================
// Research Report Building Types
// ============================================================================

/**
 * Report builder context
 * Accumulates data for building the final report
 */
export interface ReportBuilderContext {
  /** User input */
  input: string;
  /** Normalized intent */
  normalizedIntent?: NormalizedIntent;
  /** Provider results */
  providerResults: ResearchProviderResult[];
  /** AI synthesis */
  synthesis?: AISynthesisResponse;
  /** Accumulated insights */
  insights: {
    competitors: Array<{
      name: string;
      description?: string;
      url?: string;
    }>;
    opportunities: string[];
    risks: string[];
    marketHypothesis: string[];
    audienceQuestions: Array<{
      question: string;
      source?: string;
    }>;
  };
  /** Trend analysis */
  trendAnalysis?: {
    signal: MarketResearchTrendSignal;
    confidence: MarketResearchConfidenceLevel;
    evidence: string[];
  };
  /** Charts data */
  charts: Array<{
    title: string;
    type: 'line' | 'bar';
    data: Array<{ label: string; value: number }>;
  }>;
  /** Errors encountered */
  errors: string[];
  /** Processing metadata */
  metadata: {
    startTime: number;
    endTime?: number;
    providersQueried: number;
    providersSucceeded: number;
    providersFailed: number;
  };
}

/**
 * Report section
 * Individual section of the research report
 */
export interface ReportSection {
  /** Section identifier */
  id: string;
  /** Section title */
  title: string;
  /** Section content */
  content: string | string[] | Record<string, unknown>;
  /** Section order */
  order: number;
  /** Section importance */
  importance?: 'high' | 'medium' | 'low';
  /** Data sources for this section */
  sources?: string[];
}

// ============================================================================
// Market Analysis Types
// ============================================================================

/**
 * Market size estimate
 */
export interface MarketSizeEstimate {
  /** Market size value */
  value: number;
  /** Currency */
  currency: string;
  /** Time period */
  period: string;
  /** Geographic scope */
  geography: string;
  /** Confidence level */
  confidence: 'high' | 'medium' | 'low';
  /** Data source */
  source?: string;
  /** Growth rate */
  growthRate?: number;
}

/**
 * Competitive landscape
 */
export interface CompetitiveLandscape {
  /** Number of competitors */
  competitorCount: number;
  /** Market concentration */
  concentration: 'fragmented' | 'moderate' | 'concentrated';
  /** Top competitors */
  topCompetitors: Array<{
    name: string;
    marketShare?: number;
    description?: string;
    strengths?: string[];
    weaknesses?: string[];
  }>;
  /** Barriers to entry */
  barriersToEntry: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
  }>;
}

/**
 * Target audience profile
 */
export interface TargetAudienceProfile {
  /** Audience segment name */
  segment: string;
  /** Demographic characteristics */
  demographics?: {
    ageRange?: string;
    gender?: string;
    income?: string;
    education?: string;
    location?: string;
  };
  /** Psychographic characteristics */
  psychographics?: {
    interests?: string[];
    values?: string[];
    lifestyle?: string;
    painPoints?: string[];
  };
  /** Behavioral characteristics */
  behavioral?: {
    purchaseBehavior?: string;
    mediaConsumption?: string[];
    brandPreferences?: string[];
  };
  /** Segment size */
  size?: {
    value: number;
    unit: 'people' | 'households' | 'businesses';
  };
}

// ============================================================================
// Validation Types
// ============================================================================

/**
 * Research input validation result
 */
export interface ResearchInputValidation {
  /** Validation status */
  valid: boolean;
  /** Validation errors */
  errors?: Array<{
    field: string;
    message: string;
    code?: string;
  }>;
  /** Validation warnings */
  warnings?: Array<{
    field: string;
    message: string;
  }>;
  /** Normalized input */
  normalized?: string;
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard to check if data is GoogleTrendsData
 */
export function isGoogleTrendsData(data: unknown): data is GoogleTrendsData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'query' in data &&
    typeof (data as GoogleTrendsData).query === 'string'
  );
}

/**
 * Type guard to check if result is a successful provider result
 */
export function isSuccessfulProviderResult(
  result: ResearchProviderResult
): result is ResearchProviderResult & { data: NonNullable<ResearchProviderResult['data']> } {
  return result.status === 'configured' && result.data !== undefined && result.data !== null;
}

/**
 * Type guard to check if synthesis response is successful
 */
export function isSuccessfulSynthesis(
  response: AISynthesisResponse
): response is AISynthesisResponse & { synthesis: string } {
  return response.ok && typeof response.synthesis === 'string' && response.synthesis.length > 0;
}

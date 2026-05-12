 export type MarketResearchTrendSignal = "growing" | "stable" | "declining" | "unknown";
 export type MarketResearchConfidenceLevel = "high" | "medium" | "low";
 
 export interface MarketResearchSource {
   name: string;
   status: "configured" | "unavailable" | "failed" | "skipped";
   reason?: string;
 }
 
 export interface MarketResearchCompetitor {
   name: string;
   description?: string;
   url?: string;
 }
 
 export interface MarketResearchQuestion {
   question: string;
   source?: string;
 }
 
 export interface MarketResearchChart {
   title: string;
   type: "line" | "bar";
   data: { label: string; value: number }[];
 }
 
 export interface MarketResearchReport {
   ok: boolean;
   partial?: boolean;
   summary: string;
   trendSignal: MarketResearchTrendSignal;
   confidenceLevel?: MarketResearchConfidenceLevel;
   viabilityScore?: "low" | "medium" | "high";
   positioningSuggestion?: string;
   targetAudience?: string[];
   differentiationAngles?: string[];
   goToMarketIdeas?: string[];
   marketHypothesis: string[];
   competitors: MarketResearchCompetitor[];
   audienceQuestions: MarketResearchQuestion[];
   opportunities: string[];
   risks: string[];
   nextSteps: string[];
   charts: MarketResearchChart[];
   sources: MarketResearchSource[];
   errors: string[];
 }
 
 export interface MarketResearchInput {
   input: string;
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
 
 export interface MarketResearchSavedReport {
   id: string;
   input: string;
   normalizedIntent?: NormalizedIntent;
   report: MarketResearchReport;
   sources?: MarketResearchSource[];
   errors?: string[];
   createdAt: string | null;
   updatedAt: string | null;
 }
 export type MarketResearchTrendSignal = "growing" | "stable" | "declining" | "unknown";
 
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
   summary: string;
   trendSignal: MarketResearchTrendSignal;
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
 
 export interface MarketResearchSavedReport {
   id: string;
   input: string;
   normalizedIntent?: any;
   report: MarketResearchReport;
   sources?: MarketResearchSource[];
   errors?: string[];
   createdAt: string;
   updatedAt: string;
 }
// @ts-nocheck
 import { MarketResearchReport, MarketResearchSource, MarketResearchSavedReport } from "@/types/market-research";
import { getGoogleTrendsData } from "./market-research-server/providers/googleTrends.provider";
import { getAnswerThePublicData } from "./market-research-server/providers/answerThePublic.provider";
import { getCompetitorsData } from "./market-research-server/providers/competitors.provider";
import { getAiSynthesis } from "./market-research-server/providers/lovableAi.provider";
 import { supabase } from "@/integrations/supabase/client";
 import { logger } from "@/lib/logger";
 
 const DEV_USER_ID = "00000000-0000-0000-0000-000000000000";
 
 async function withTimeout<T>(promise: Promise<T>, ms: number, fallbackValue: T): Promise<T> {
   let timeoutId: any;
   const timeoutPromise = new Promise<T>((resolve) => {
     timeoutId = setTimeout(() => {
       logger.warn('Market research task timed out', { timeoutMs: ms });
       resolve(fallbackValue);
     }, ms);
   });
 
   const result = await Promise.race([promise, timeoutPromise]);
   clearTimeout(timeoutId);
   return result;
 }
 
 async function withRetry<T>(fn: () => Promise<T>, retries = 1): Promise<T> {
   try {
     return await fn();
   } catch (error) {
     if (retries > 0) {
       logger.debug('Retrying market research provider', { retriesLeft: retries });
       return await withRetry(fn, retries - 1);
     }
     throw error;
   }
 }
 
 export async function internalGenerateMarketResearchReport(input: string): Promise<MarketResearchReport> {
   const errors: string[] = [];
   const sources: MarketResearchSource[] = [];
   const TIMEOUT_MS = 15000;
 
   const emptyReport: MarketResearchReport = {
     ok: false,
     partial: true,
     summary: "A análise demorou mais que o esperado. Mostrando resultados parciais.",
     trendSignal: "unknown",
     confidenceLevel: "low",
     marketHypothesis: [],
     competitors: [],
     audienceQuestions: [],
     opportunities: [],
     risks: [],
     nextSteps: [],
     charts: [],
     sources: [],
     errors: ["Timeout na geração completa"]
   };
 
   return await withTimeout(
     (async () => {
       // 1. Coleta paralela de fontes com retry
       const [trendsResult, atpResult, compResult] = await Promise.all([
         withRetry(() => getGoogleTrendsData(input)).catch(err => {
           errors.push(`Google Trends: ${err.message}`);
           return { source: { name: "Google Trends", status: "failed" as const, reason: err.message }, data: null };
         }),
         withRetry(() => getAnswerThePublicData(input)).catch(err => {
           errors.push(`AnswerThePublic: ${err.message}`);
           return { source: { name: "AnswerThePublic", status: "failed" as const, reason: err.message }, questions: [] };
         }),
         withRetry(() => getCompetitorsData(input)).catch(err => {
           errors.push(`Competitors: ${err.message}`);
           return { source: { name: "Market Search", status: "failed" as const, reason: err.message }, competitors: [] };
         })
       ]);
 
       sources.push(trendsResult.source, atpResult.source, compResult.source);
 
       // 2. Síntese via IA
       const context = {
         trends: trendsResult.data,
         questions: atpResult.questions,
         competitors: compResult.competitors
       };
 
       const aiSynthesis = await withRetry(() => getAiSynthesis(input, context));
 
       // 3. Montagem do relatório final
       const report: MarketResearchReport = {
         ok: true,
         summary: aiSynthesis.summary || "Resumo indisponível.",
         trendSignal: aiSynthesis.trendSignal || "unknown",
         confidenceLevel: aiSynthesis.confidenceLevel || (errors.length > 0 ? "medium" : "high"),
         viabilityScore: aiSynthesis.viabilityScore || "medium",
         positioningSuggestion: aiSynthesis.positioningSuggestion,
         targetAudience: aiSynthesis.targetAudience || [],
         differentiationAngles: aiSynthesis.differentiationAngles || [],
         goToMarketIdeas: aiSynthesis.goToMarketIdeas || [],
         marketHypothesis: aiSynthesis.marketHypothesis || [],
         competitors: aiSynthesis.competitors || compResult.competitors || [],
         audienceQuestions: aiSynthesis.audienceQuestions || atpResult.questions || [],
         opportunities: aiSynthesis.opportunities || [],
         risks: aiSynthesis.risks || [],
         nextSteps: aiSynthesis.nextSteps || [],
         charts: aiSynthesis.charts || [],
         sources,
         errors: [...errors, ...(aiSynthesis.errors || [])]
       };
 
       return report;
     })(),
     TIMEOUT_MS,
     emptyReport
   );
 }
 
 export async function internalSaveMarketResearchReport(data: {
   input: string;
   normalizedIntent?: any;
   report: MarketResearchReport;
   sources?: MarketResearchSource[];
   errors?: string[];
 }): Promise<{ success: boolean; id?: string; error?: string }> {
   try {
     const { data: inserted, error } = await (supabase as any)
       .from("market_research_reports")
       .insert({
         input: data.input,
         normalized_intent: data.normalizedIntent,
         report: data.report,
         sources: data.sources,
         errors: data.errors,
         owner_user_id: DEV_USER_ID
       })
       .select("id")
       .single();
 
     if (error) throw error;
     return { success: true, id: inserted.id };
   } catch (error: any) {
     logger.error('Failed to save market research report', error);
     return { success: false, error: error.message };
   }
 }
 
 export async function internalListMarketResearchReports(limit = 10): Promise<MarketResearchSavedReport[]> {
   try {
     const { data, error } = await supabase
       .from("market_research_reports")
       .select("*")
       .order("created_at", { ascending: false })
       .limit(limit);
 
     if (error) throw error;
 
     return (data || []).map(item => ({
       id: item.id,
       input: item.input,
       normalizedIntent: item.normalized_intent,
       report: item.report as unknown as MarketResearchReport,
       sources: item.sources as unknown as MarketResearchSource[],
       errors: item.errors as unknown as string[],
       createdAt: item.created_at,
       updatedAt: item.updated_at
     }));
   } catch (error) {
     logger.error('Failed to list market research reports', error as Error);
     return [];
   }
 }
 
 export async function internalDeleteMarketResearchReport(id: string): Promise<boolean> {
   try {
     const { error } = await supabase
       .from("market_research_reports")
       .delete()
       .eq("id", id);
 
     if (error) throw error;
     return true;
   } catch (error) {
     logger.error('Failed to delete market research report', error as Error, { reportId: id });
     return false;
   }
 }
 
 export async function internalGetMarketResearchReport(id: string): Promise<MarketResearchSavedReport | null> {
   try {
     const { data, error } = await supabase
       .from("market_research_reports")
       .select("*")
       .eq("id", id)
       .single();
 
     if (error) throw error;
     if (!data) return null;
 
     return {
       id: data.id,
       input: data.input,
       normalizedIntent: data.normalized_intent,
       report: data.report as unknown as MarketResearchReport,
       sources: data.sources as unknown as MarketResearchSource[],
       errors: data.errors as unknown as string[],
       createdAt: data.created_at,
       updatedAt: data.updated_at
     };
   } catch (error) {
     logger.error('Failed to get market research report', error as Error, { reportId: id });
     return null;
   }
 }
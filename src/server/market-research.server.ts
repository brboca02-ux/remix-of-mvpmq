 import { MarketResearchReport, MarketResearchSource, MarketResearchSavedReport } from "@/types/market-research";
 import { getGoogleTrendsData } from "./market-research/providers/googleTrends.provider";
 import { getAnswerThePublicData } from "./market-research/providers/answerThePublic.provider";
 import { getCompetitorsData } from "./market-research/providers/competitors.provider";
 import { getAiSynthesis } from "./market-research/providers/lovableAi.provider";
 import { supabase } from "@/integrations/supabase/client";
 
 const DEV_USER_ID = "00000000-0000-0000-0000-000000000000";
 
 export async function internalGenerateMarketResearchReport(input: string): Promise<MarketResearchReport> {
   const errors: string[] = [];
   const sources: MarketResearchSource[] = [];
 
   // 1. Coleta paralela de fontes (atualmente configuradas como unavailable no MVP)
   const [trendsResult, atpResult, compResult] = await Promise.all([
     getGoogleTrendsData(input).catch(err => {
       errors.push(`Google Trends: ${err.message}`);
       return { source: { name: "Google Trends", status: "failed" as const, reason: err.message }, data: null };
     }),
     getAnswerThePublicData(input).catch(err => {
       errors.push(`AnswerThePublic: ${err.message}`);
       return { source: { name: "AnswerThePublic", status: "failed" as const, reason: err.message }, questions: [] };
     }),
     getCompetitorsData(input).catch(err => {
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
 
   const aiSynthesis = await getAiSynthesis(input, context);
 
   // 3. Montagem do relatório final
   const report: MarketResearchReport = {
     ok: true,
     summary: aiSynthesis.summary || "Resumo indisponível.",
     trendSignal: aiSynthesis.trendSignal || "unknown",
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
 }
 
 export async function internalSaveMarketResearchReport(data: {
   input: string;
   normalizedIntent?: any;
   report: MarketResearchReport;
   sources?: MarketResearchSource[];
   errors?: string[];
 }): Promise<{ success: boolean; id?: string; error?: string }> {
   try {
     const { data: inserted, error } = await supabase
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
     console.error("[MarketResearch] Error saving report:", error);
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
     console.error("[MarketResearch] Error listing reports:", error);
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
     console.error("[MarketResearch] Error deleting report:", error);
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
     console.error("[MarketResearch] Error getting report:", error);
     return null;
   }
 }
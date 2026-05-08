 import { MarketResearchReport, MarketResearchSource } from "@/types/market-research";
 import { getGoogleTrendsData } from "./market-research/providers/googleTrends.provider";
 import { getAnswerThePublicData } from "./market-research/providers/answerThePublic.provider";
 import { getCompetitorsData } from "./market-research/providers/competitors.provider";
 import { getAiSynthesis } from "./market-research/providers/lovableAi.provider";
 
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
   return {
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
 }
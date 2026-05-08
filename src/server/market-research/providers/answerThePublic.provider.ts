 import { MarketResearchSource, MarketResearchQuestion } from "@/types/market-research";
 
 export async function getAnswerThePublicData(query: string): Promise<{ source: MarketResearchSource; questions: MarketResearchQuestion[] }> {
   return {
     source: {
       name: "AnswerThePublic",
       status: "unavailable",
       reason: "AnswerThePublic API não configurada"
     },
     questions: []
   };
 }
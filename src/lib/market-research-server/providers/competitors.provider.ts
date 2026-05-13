 import { MarketResearchSource, MarketResearchCompetitor } from "@/types/market-research";
 
 export async function getCompetitorsData(query: string): Promise<{ source: MarketResearchSource; competitors: MarketResearchCompetitor[] }> {
   // Fallback logic as requested
   return {
     source: {
       name: "Market Search (Competitors)",
       status: "unavailable",
       reason: "Fontes de busca (Crunchbase/n8n) não configuradas"
     },
     competitors: []
   };
 }
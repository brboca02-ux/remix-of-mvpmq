 import { MarketResearchSource } from "@/types/market-research";
 
 export async function getGoogleTrendsData(query: string): Promise<{ source: MarketResearchSource; data: any }> {
   // Placeholder: No official Google Trends API available without specific setup
   return {
     source: {
       name: "Google Trends",
       status: "unavailable",
       reason: "Google Trends API não configurada"
     },
     data: null
   };
 }
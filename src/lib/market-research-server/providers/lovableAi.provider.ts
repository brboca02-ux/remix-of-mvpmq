 import { MARKET_RESEARCH_PROMPT } from "../marketResearchPrompt";
 import { MarketResearchReport } from "@/types/market-research";
 import { logger } from "@/lib/logger";
 
 export async function getAiSynthesis(input: string, context: any): Promise<Partial<MarketResearchReport>> {
   try {
     const response = await fetch("https://api.lovable.app/v1/chat/completions", {
       method: "POST",
       headers: {
         "Content-Type": "application/json",
         "Authorization": `Bearer ${process.env.LOVABLE_API_KEY}`,
       },
       body: JSON.stringify({
         model: "google/gemini-2.5-flash",
         messages: [
           { role: "system", content: MARKET_RESEARCH_PROMPT },
           { role: "user", content: `Entrada do usuário: ${input}\n\nContexto das fontes: ${JSON.stringify(context)}` }
         ],
         temperature: 0.1, // Mais determinístico para JSON
         response_format: { type: "json_object" }
       }),
     });
 
     if (!response.ok) {
       throw new Error(`AI Gateway error: ${response.statusText}`);
     }
 
     const result = await response.json();
     const content = result.choices[0].message.content;
     return JSON.parse(content);
   } catch (error) {
     logger.error('AI synthesis failed', error as Error);
     return {
       summary: "Ocorreu um erro ao gerar a síntese da IA. O relatório abaixo contém apenas dados brutos das fontes (se disponíveis).",
       marketHypothesis: ["Falha na conexão com a IA"],
       trendSignal: "unknown",
       errors: [String(error)]
     };
   }
 }
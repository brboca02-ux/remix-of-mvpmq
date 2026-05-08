 import { createServerFn } from "@tanstack/react-start";
 import { z } from "zod";
 import { internalGenerateMarketResearchReport } from "./market-research.server";
 
 const DEV_USER_ID = "00000000-0000-0000-0000-000000000000";
 
 export const generateMarketResearchReport = createServerFn({ method: "POST" })
   .inputValidator((data) => z.object({
     input: z.string().min(1, "Texto de entrada é obrigatório")
   }).parse(data))
   .handler(async ({ data }) => {
     // Registramos o uso para o DEV_USER_ID (embora no MVP não estejamos persistindo em DB ainda)
     console.log(`[MarketResearch] Processando para user ${DEV_USER_ID}: ${data.input}`);
     
     try {
       return await internalGenerateMarketResearchReport(data.input);
     } catch (error) {
       console.error("Erro fatal no market research:", error);
       return {
         ok: false,
         summary: "Falha crítica ao processar a pesquisa.",
         trendSignal: "unknown",
         marketHypothesis: [],
         competitors: [],
         audienceQuestions: [],
         opportunities: [],
         risks: [],
         nextSteps: [],
         charts: [],
         sources: [],
         errors: [String(error)]
       };
     }
   });
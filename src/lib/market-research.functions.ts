 import { createServerFn } from "@tanstack/react-start";
 import { z } from "zod";
 import { 
   internalGenerateMarketResearchReport,
   internalSaveMarketResearchReport,
   internalListMarketResearchReports,
   internalGetMarketResearchReport,
   internalDeleteMarketResearchReport
 } from "@/lib/market-research.server";
 import { logger } from "@/lib/logger";
 
 const DEV_USER_ID = "00000000-0000-0000-0000-000000000000";
 
 export const generateMarketResearchReport = createServerFn({ method: "POST" })
   .inputValidator((data) => z.object({
     input: z.string().min(1, "Texto de entrada é obrigatório")
   }).parse(data))
   .handler(async ({ data }) => {
     // Registramos o uso para o DEV_USER_ID (embora no MVP não estejamos persistindo em DB ainda)
     logger.info('Processing market research request', { userId: DEV_USER_ID, input: data.input });
     
     try {
       return await internalGenerateMarketResearchReport(data.input);
     } catch (error) {
       logger.error('Fatal error in market research', error as Error, { input: data.input });
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
 
 export const saveMarketResearchReport = createServerFn({ method: "POST" })
   .inputValidator((data) => z.object({
     input: z.string(),
     normalizedIntent: z.any().optional(),
     report: z.any(),
     sources: z.array(z.any()).optional(),
     errors: z.array(z.string()).optional()
   }).parse(data))
   .handler(async ({ data }) => {
     return await internalSaveMarketResearchReport(data);
   });
 
 export const listMarketResearchReports = createServerFn({ method: "GET" })
   .inputValidator((data) => z.object({
     limit: z.number().optional().default(10)
   }).parse(data || {}))
   .handler(async ({ data }) => {
     return await internalListMarketResearchReports(data.limit);
   });
 
 export const getMarketResearchReport = createServerFn({ method: "GET" })
   .inputValidator((id: string) => z.string().uuid().parse(id))
   .handler(async ({ data: id }) => {
     return await internalGetMarketResearchReport(id);
   });
 
 export const deleteMarketResearchReport = createServerFn({ method: "POST" })
   .inputValidator((id: string) => z.string().uuid().parse(id))
   .handler(async ({ data: id }) => {
     return await internalDeleteMarketResearchReport(id);
   });
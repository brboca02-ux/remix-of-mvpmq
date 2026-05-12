import { createServerFn } from "@tanstack/react-start";
import type { MarketAnalysis, Region } from "@/lib/types";
import { logger } from "@/lib/logger";
import { handleServerError, requireEnvVar, withRetry, ErrorCodes, AppError } from "@/lib/error-handler";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3-flash-preview";

const SYSTEM_PROMPT = `Você é um analista sênior de mercado especializado em validação de ideias de negócio, dimensionamento de TAM/SAM/SOM e descoberta de oportunidades. Suas análises são baseadas em conhecimento de mercado real, tendências macroeconômicas, comportamento do consumidor brasileiro/global e benchmarks de setores.

Regras:
- Os valores monetários (TAM/SAM/SOM, ticket médio) DEVEM estar em REAIS (R$) como NÚMEROS ABSOLUTOS (ex: 5000000000 para R$ 5 bi).
- TAM > SAM > SOM, sempre.
- Score 0-100 ponderando demanda, concorrência, crescimento e facilidade de entrada.
- Insights e veredito em português, tom direto e estratégico.
- Use dados coerentes mesmo que estimados — nunca diga "não tenho dados".
- searchVolume é volume mensal global de busca pelo termo principal.
- searchTrend: 12 meses recentes com nomes em PT-BR (Jan, Fev, Mar, Abr, Mai, Jun, Jul, Ago, Set, Out, Nov, Dez).
- growthProjection: 5 anos partindo do ano atual com valor de mercado em R$.`;

const analysisSchema = {
  type: "object",
  properties: {
    tam: { type: "number", description: "Total Addressable Market em R$ (número absoluto)" },
    sam: { type: "number", description: "Serviceable Available Market em R$" },
    som: { type: "number", description: "Serviceable Obtainable Market em R$" },
    tamDescription: { type: "string" },
    samDescription: { type: "string" },
    somDescription: { type: "string" },
    growthRate: { type: "number", description: "Taxa anual de crescimento em % (ex: 12.5)" },
    searchVolume: { type: "number", description: "Volume mensal estimado de buscas" },
    searchTrend: {
      type: "array",
      items: {
        type: "object",
        properties: {
          month: { type: "string" },
          volume: { type: "number" },
        },
        required: ["month", "volume"],
        additionalProperties: false,
      },
    },
    competition: { type: "string", enum: ["baixa", "media", "alta"] },
    competitionReason: { type: "string" },
    score: { type: "number", description: "0 a 100" },
    scoreLabel: { type: "string", enum: ["Baixa", "Média", "Alta"] },
    insights: { type: "array", items: { type: "string" }, description: "5 a 7 insights estratégicos" },
    productIdeas: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          type: { type: "string", description: "Ex: Infoproduto, SaaS, Serviço, Comunidade" },
        },
        required: ["title", "description", "type"],
        additionalProperties: false,
      },
    },
    hiddenNiches: { type: "array", items: { type: "string" }, description: "5 sub-nichos pouco explorados" },
    verdict: { type: "string", enum: ["sim", "talvez", "nao"] },
    verdictReason: { type: "string" },
    growthProjection: {
      type: "array",
      items: {
        type: "object",
        properties: {
          year: { type: "number" },
          value: { type: "number" },
        },
        required: ["year", "value"],
        additionalProperties: false,
      },
    },
    averageTicket: { type: "number", description: "Ticket médio estimado em R$" },
    positioning: { type: "string", description: "Sugestão de posicionamento estratégico" },
  },
  required: [
    "tam", "sam", "som", "tamDescription", "samDescription", "somDescription",
    "growthRate", "searchVolume", "searchTrend", "competition", "competitionReason",
    "score", "scoreLabel", "insights", "productIdeas", "hiddenNiches",
    "verdict", "verdictReason", "growthProjection", "averageTicket", "positioning",
  ],
  additionalProperties: false,
};

interface AnalyzeInput {
  idea: string;
  audience?: string;
  region: Region;
}

function regionLabel(r: Region) {
  if (r === "brasil") return "Brasil";
  if (r === "latam") return "América Latina";
  return "Global";
}

export const analyzeMarket = createServerFn({ method: "POST" })
  .inputValidator((data: AnalyzeInput) => {
    if (!data?.idea || typeof data.idea !== "string" || data.idea.trim().length < 5) {
      throw new AppError(
        ErrorCodes.VALIDATION_ERROR,
        "Descreva a ideia com pelo menos 5 caracteres.",
        { ideaLength: data?.idea?.length || 0 },
        400
      );
    }
    const region: Region = data.region === "latam" || data.region === "global" ? data.region : "brasil";
    return {
      idea: data.idea.trim(),
      audience: data.audience?.trim() || undefined,
      region,
    };
  })
  .handler(async ({ data }): Promise<MarketAnalysis> => {
    try {
      const apiKey = requireEnvVar('LOVABLE_API_KEY');

      const userPrompt = `Analise o seguinte mercado:

IDEIA: ${data.idea}
PÚBLICO-ALVO: ${data.audience || "não especificado (infira o mais provável)"}
REGIÃO: ${regionLabel(data.region)}

Gere uma análise completa de mercado com TAM, SAM, SOM, score de oportunidade, insights estratégicos, sugestões de produtos, nichos ocultos e veredito final. Use a função return_market_analysis.`;

      const result = await withRetry(
        async () => {
          const res = await fetch(GATEWAY_URL, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: MODEL,
              messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: userPrompt },
              ],
              tools: [
                {
                  type: "function",
                  function: {
                    name: "return_market_analysis",
                    description: "Retorna a análise completa de mercado estruturada",
                    parameters: analysisSchema,
                  },
                },
              ],
              tool_choice: { type: "function", function: { name: "return_market_analysis" } },
            }),
            signal: AbortSignal.timeout(30000), // 30 second timeout
          });

          if (res.status === 429) {
            throw new AppError(
              ErrorCodes.RATE_LIMIT_EXCEEDED,
              "Muitas requisições. Aguarde alguns segundos e tente novamente.",
              { status: res.status }
            );
          }

          if (res.status === 402) {
            throw new AppError(
              ErrorCodes.PAYMENT_REQUIRED,
              "Créditos de IA esgotados. Adicione créditos em Settings > Workspace > Usage.",
              { status: res.status }
            );
          }

          if (!res.ok) {
            const text = await res.text().catch(() => 'Unknown error');
            logger.error('AI Gateway request failed', undefined, { 
              status: res.status, 
              response: text,
              idea: data.idea 
            });
            throw new AppError(
              ErrorCodes.EXTERNAL_API_ERROR,
              "Falha ao gerar análise. Tente novamente.",
              { status: res.status, error: text }
            );
          }

          const json = await res.json();
          const toolCall = json.choices?.[0]?.message?.tool_calls?.[0];
          
          if (!toolCall?.function?.arguments) {
            throw new AppError(
              ErrorCodes.EXTERNAL_API_ERROR,
              "Resposta inválida do modelo.",
              { response: json }
            );
          }

          const parsed = JSON.parse(toolCall.function.arguments);
          return parsed;
        },
        {
          maxAttempts: 2,
          delayMs: 2000,
          onRetry: (attempt, error) => {
            logger.warn('Retrying market analysis', { 
              attempt, 
              error: error.message,
              idea: data.idea 
            });
          },
          shouldRetry: (error) => {
            if (error instanceof AppError) {
              return error.code !== ErrorCodes.RATE_LIMIT_EXCEEDED && 
                     error.code !== ErrorCodes.PAYMENT_REQUIRED;
            }
            return true;
          }
        }
      );

      const id = `ms_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

      logger.info('Market analysis completed', { 
        id,
        idea: data.idea,
        region: data.region,
        score: result.score 
      });

      return {
        id,
        createdAt: Date.now(),
        input: data,
        ...result,
      } as MarketAnalysis;

    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      logger.error('Market analysis failed', error as Error, { 
        idea: data.idea,
        region: data.region 
      });
      
      throw new AppError(
        ErrorCodes.INTERNAL_ERROR,
        "Erro ao analisar mercado. Tente novamente.",
        { error: (error as Error).message }
      );
    }
  });

export const expandNiches = createServerFn({ method: "POST" })
  .inputValidator((data: { idea: string; context?: string; analysisId?: string }) => {
    const idea = String(data?.idea || "").trim();
    if (idea.length < 3) {
      throw new AppError(
        ErrorCodes.VALIDATION_ERROR,
        "Descreva a ideia com pelo menos 3 caracteres.",
        { ideaLength: idea.length },
        400
      );
    }
    return {
      idea,
      context: String(data?.context || "").trim(),
      analysisId: data?.analysisId,
    };
  })
  .handler(async ({ data }): Promise<{ niches: any[] }> => {
    try {
      const apiKey = requireEnvVar('LOVABLE_API_KEY');

      const systemPrompt = `Você é um motor de descoberta de oportunidades de mercado (Niche Explosion Engine).
Sua missão é gerar 10 sub-nichos específicos e ocultos a partir de uma ideia central.

Regras Cruciais:
1. Para cada nicho, você deve estimar TAM, SAM e SOM em R$ (número absoluto).
2. TAM > SAM > SOM.
3. Use dados baseados em tendências reais, CNAEs e benchmarks de mercado.
4. Cada oportunidade deve ter: nome, evidência (por que esse nicho é bom), fonte (origem da tendência), confiança (0-1), risco (low, medium, high), próximo passo e simulation (objeto com faturamento_estimado_anual).
5. Seja criativo: procure nichos que não são óbvios mas têm alta demanda reprimida.`;

      const result = await withRetry(
        async () => {
          const res = await fetch(GATEWAY_URL, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: MODEL,
              messages: [
                { role: "system", content: systemPrompt },
                {
                  role: "user",
                  content: `Analise a ideia: "${data.idea}". Contexto adicional: "${data.context}". 
Gere até 10 oportunidades de nicho baseadas em EVIDÊNCIAS REAIS. Se não houver dados suficientes para garantir confiança, não invente. 
Use a função return_niche_opportunities.`,
                },
              ],
              tools: [
                {
                  type: "function",
                  function: {
                    name: "return_niche_opportunities",
                    description: "Retorna oportunidades de nicho estruturadas com evidências",
                    parameters: {
                      type: "object",
                      properties: {
                        niches: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              id: { type: "string" },
                              name: { type: "string" },
                              tam: { type: "number", description: "TAM estimado para este sub-nicho em R$" },
                              sam: { type: "number", description: "SAM estimado em R$" },
                              som: { type: "number", description: "SOM estimado em R$" },
                              evidence: { type: "string", description: "O fato/dado real que sustenta esta oportunidade" },
                              source: { type: "string", description: "Origem da evidência" },
                              confidence: { type: "number", description: "0.0 a 1.0" },
                              risk: { type: "string", enum: ["low", "medium", "high"] },
                              nextStep: { type: "string" },
                              simulation: {
                                type: "object",
                                properties: {
                                  faturamento_estimado_anual: { type: "number" },
                                  checkpoints: { type: "array", items: { type: "string" } }
                                },
                                required: ["faturamento_estimado_anual", "checkpoints"]
                              }
                            },
                            required: ["name", "evidence", "source", "confidence", "risk", "nextStep", "tam", "sam", "som", "simulation"],
                            additionalProperties: false,
                          },
                        },
                      },
                      required: ["niches"],
                      additionalProperties: false,
                    },
                  },
                },
              ],
              tool_choice: { type: "function", function: { name: "return_niche_opportunities" } },
            }),
            signal: AbortSignal.timeout(30000),
          });

          if (res.status === 429) {
            throw new AppError(
              ErrorCodes.RATE_LIMIT_EXCEEDED,
              "Aguarde alguns segundos.",
              { status: res.status }
            );
          }

          if (res.status === 402) {
            throw new AppError(
              ErrorCodes.PAYMENT_REQUIRED,
              "Créditos esgotados.",
              { status: res.status }
            );
          }

          if (!res.ok) {
            throw new AppError(
              ErrorCodes.EXTERNAL_API_ERROR,
              "Falha ao expandir nichos.",
              { status: res.status }
            );
          }

          const json = await res.json();
          const args = json.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
          
          if (!args) {
            throw new AppError(
              ErrorCodes.EXTERNAL_API_ERROR,
              "Resposta inválida.",
              { response: json }
            );
          }

          return JSON.parse(args);
        },
        {
          maxAttempts: 2,
          delayMs: 2000,
          onRetry: (attempt, error) => {
            logger.warn('Retrying niche expansion', { 
              attempt, 
              error: error.message,
              idea: data.idea 
            });
          }
        }
      );

      // Persistir no Lovable Cloud se houver analysisId e nichos
      if (data.analysisId && result.niches?.length > 0) {
        try {
          const { getSupabase } = await import("./leads-core");
          const supabase = getSupabase();
          
          const opportunities = result.niches.map((n: any) => ({
            analysis_id: data.analysisId,
            name: n.name,
            evidence: n.evidence,
            source_origin: n.source,
            confidence_score: n.confidence,
            risk_level: n.risk,
            next_step: n.nextStep,
            metadata: n
          }));

          const { error: insertError } = await supabase
            .from("market_niche_opportunities")
            .insert(opportunities);

          if (insertError) {
            logger.error('Failed to persist niche opportunities', insertError, {
              analysisId: data.analysisId,
              nicheCount: opportunities.length
            });
            // Don't fail the request if persistence fails
          } else {
            logger.info('Niche opportunities persisted', {
              analysisId: data.analysisId,
              nicheCount: opportunities.length
            });
          }
        } catch (persistError) {
          logger.error('Error persisting niche opportunities', persistError as Error, {
            analysisId: data.analysisId
          });
          // Don't fail the request if persistence fails
        }
      }

      logger.info('Niche expansion completed', {
        idea: data.idea,
        nicheCount: result.niches?.length || 0
      });

      return result;

    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      logger.error('Niche expansion failed', error as Error, {
        idea: data.idea
      });

      throw new AppError(
        ErrorCodes.INTERNAL_ERROR,
        "Erro ao expandir nichos. Tente novamente.",
        { error: (error as Error).message }
      );
    }
  });

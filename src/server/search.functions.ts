import { createServerFn } from "@tanstack/react-start";
import { logger } from "@/lib/logger";
import { handleServerError, requireEnvVar, withRetry, ErrorCodes, AppError } from "@/lib/error-handler";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3-flash-preview";

interface InterpretResult {
  cnaeCodes: string[];
  portes: string[];
  estados: string[];
  cidades: string[];
  hasEmail: boolean;
  hasTelefone: boolean;
  hasSite: boolean;
  tags: string[];
}

const schema = {
  type: "object",
  properties: {
    cnaeCodes: { type: "array", items: { type: "string" }, description: "Códigos CNAE (ex: 8630-5)" },
    portes: { type: "array", items: { type: "string", enum: ["MEI", "Micro", "Pequena", "Média", "Grande"] } },
    estados: { type: "array", items: { type: "string", description: "UF 2 letras, ex: SP" } },
    cidades: { type: "array", items: { type: "string" } },
    hasEmail: { type: "boolean" },
    hasTelefone: { type: "boolean" },
    hasSite: { type: "boolean" },
    tags: { type: "array", items: { type: "string" } },
  },
  required: ["cnaeCodes", "portes", "estados", "cidades", "hasEmail", "hasTelefone", "hasSite", "tags"],
  additionalProperties: false,
};

// Keyword fallback se IA falhar
function keywordFallback(query: string): InterpretResult {
  const q = query.toLowerCase();
  const cnaeCodes: string[] = [];
  const portes: string[] = [];
  const estados: string[] = [];

  const map: [RegExp, string][] = [
    [/fazenda|agro|rural|soja|boi|gado|cana/, "0111-3"],
    [/orgânic/, "0141-5"],
    [/restaurante|bar |comida/, "5611-2"],
    [/lanchonete|fast|hambur/, "5612-1"],
    [/padaria|confeitaria/, "4721-1"],
    [/mercado|supermerca/, "4711-3"],
    [/farmácia|drogaria/, "4771-7"],
    [/clínica|estétic|odontol/, "8630-5"],
    [/salão|barbearia|beleza/, "9602-5"],
    [/academia|ginást/, "9312-3"],
    [/escola|curso|educaç/, "8599-6"],
    [/software|tech|app|sistema/, "6201-5"],
    [/marketing|agência|publici/, "7319-0"],
    [/consultoria/, "7020-4"],
    [/loja|varejo|comércio/, "4781-4"],
    [/construção|obra/, "4120-4"],
    [/hotel|pousada/, "5510-8"],
    [/transport|frete/, "4930-2"],
    [/solar|fotovolta|painel|energia renov/, "4321-5"],
    [/usina|geração de energia|geradora/, "3511-5"],
  ];
  for (const [re, code] of map) {
    if (re.test(q) && !cnaeCodes.includes(code)) cnaeCodes.push(code);
  }
  // Solar boost: ambos CNAE quando termo solar aparece
  if (/solar|fotovolta|painel/.test(q)) {
    if (!cnaeCodes.includes("4321-5")) cnaeCodes.push("4321-5");
    if (!cnaeCodes.includes("3511-5")) cnaeCodes.push("3511-5");
  }

  if (/\bmei\b/.test(q)) portes.push("MEI");
  if (/micro/.test(q)) portes.push("Micro");
  if (/pequena/.test(q)) portes.push("Pequena");
  if (/m[eé]dia/.test(q)) portes.push("Média");
  if (/grande/.test(q)) portes.push("Grande");

  const ufs = ["SP", "RJ", "MG", "RS", "SC", "PR", "BA", "PE", "CE", "GO", "MT", "MS", "DF", "PA", "ES"];
  for (const uf of ufs) {
    if (new RegExp(`\\b${uf}\\b`, "i").test(query)) estados.push(uf);
  }
  const stateNames: Record<string, string> = {
    "são paulo": "SP", "rio de janeiro": "RJ", "minas": "MG", "bahia": "BA",
    "santa catarina": "SC", "paraná": "PR", "rio grande do sul": "RS",
    "mato grosso": "MT", "goiás": "GO", "pernambuco": "PE", "ceará": "CE",
  };
  for (const [name, uf] of Object.entries(stateNames)) {
    if (q.includes(name) && !estados.includes(uf)) estados.push(uf);
  }

  return {
    cnaeCodes,
    portes,
    estados,
    cidades: [],
    hasEmail: /email|contato/.test(q),
    hasTelefone: /telefone|whats|tel/.test(q),
    hasSite: /site|online|web/.test(q),
    tags: [],
  };
}

export const interpretSearch = createServerFn({ method: "POST" })
  .inputValidator((data: { query: string }) => {
    const query = String(data?.query || "").trim();
    if (query.length < 3) {
      throw new AppError(
        ErrorCodes.VALIDATION_ERROR,
        "Descreva a busca com pelo menos 3 caracteres.",
        { queryLength: query.length },
        400
      );
    }
    return { query };
  })
  .handler(async ({ data }): Promise<InterpretResult> => {
    try {
      const apiKey = process.env.LOVABLE_API_KEY;
      
      // If no API key, use keyword fallback
      if (!apiKey) {
        logger.info('Using keyword fallback (no API key)', { query: data.query });
        return keywordFallback(data.query);
      }

      // Use retry logic for AI interpretation
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
                {
                  role: "system",
                  content: `Você interpreta buscas em português para filtrar empresas brasileiras. Converta texto livre em filtros estruturados. CNAEs disponíveis:
0111-3 Cereais, 0141-5 Soja orgânica, 0151-2 Bovinos, 4711-3 Supermercado, 4721-1 Padaria, 4771-7 Farmácia, 4781-4 Varejo vestuário, 5611-2 Restaurante, 5612-1 Lanchonete, 5510-8 Hotéis, 6201-5 Software, 7020-4 Consultoria, 7319-0 Agência publicidade, 8599-6 Cursos, 8610-1 Hospital, 8630-5 Clínica estética, 9312-3 Academia, 9602-5 Salão beleza, 4120-4 Construção, 4930-2 Transporte, 4321-5 Instalação de painéis solares fotovoltaicos, 3511-5 Geração de energia elétrica.
Hint: "energia solar" / "fotovoltaico" / "painel solar" → SEMPRE retorne ambos 4321-5 e 3511-5.
Retorne apenas CNAEs relevantes ao texto. Estados em UF (SP, RJ...).`,
                },
                { role: "user", content: `Busca: "${data.query}". Use a função apply_filters.` },
              ],
              tools: [
                {
                  type: "function",
                  function: {
                    name: "apply_filters",
                    description: "Aplica filtros estruturados para busca de empresas",
                    parameters: schema,
                  },
                },
              ],
              tool_choice: { type: "function", function: { name: "apply_filters" } },
            }),
            signal: AbortSignal.timeout(15000), // 15 second timeout
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
            const errorText = await res.text().catch(() => 'Unknown error');
            logger.warn('AI interpretation failed, using fallback', { 
              status: res.status, 
              error: errorText,
              query: data.query 
            });
            return keywordFallback(data.query);
          }

          const json = await res.json();
          const args = json.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
          
          if (!args) {
            logger.warn('No arguments in AI response, using fallback', { query: data.query });
            return keywordFallback(data.query);
          }

          return JSON.parse(args) as InterpretResult;
        },
        {
          maxAttempts: 2,
          delayMs: 1000,
          onRetry: (attempt, error) => {
            logger.warn('Retrying search interpretation', { 
              attempt, 
              error: error.message,
              query: data.query 
            });
          },
          shouldRetry: (error) => {
            // Don't retry on rate limit or payment errors
            if (error instanceof AppError) {
              return error.code !== ErrorCodes.RATE_LIMIT_EXCEEDED && 
                     error.code !== ErrorCodes.PAYMENT_REQUIRED;
            }
            return true;
          }
        }
      );

      logger.info('Search interpretation successful', { 
        query: data.query,
        cnaeCodes: result.cnaeCodes.length,
        hasFilters: result.estados.length > 0 || result.portes.length > 0
      });

      return result;

    } catch (error) {
      // If it's an AppError, rethrow it
      if (error instanceof AppError) {
        throw error;
      }

      // For any other error, log and use fallback
      logger.error('Search interpretation error, using fallback', error as Error, { 
        query: data.query 
      });
      return keywordFallback(data.query);
    }
  });

import { createFileRoute } from "@tanstack/react-router";
import type { MarketAnalysis, ChatMessage } from "@/lib/types";
import { logger } from "@/lib/logger";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3-flash-preview";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function buildSystem(analysis: MarketAnalysis): string {
  return `Você é a IA Consultora do MarketScope AI, uma especialista em estratégia de negócios, marketing e validação de mercado. Responda em português, tom consultivo, direto e estratégico. Use markdown (listas, **negrito**) quando ajudar.

CONTEXTO DA ANÁLISE ATUAL:
- Ideia: ${analysis.input.idea}
- Público: ${analysis.input.audience || "não especificado"}
- Região: ${analysis.input.region}
- TAM: R$ ${analysis.tam.toLocaleString("pt-BR")}
- SAM: R$ ${analysis.sam.toLocaleString("pt-BR")}
- SOM: R$ ${analysis.som.toLocaleString("pt-BR")}
- Score de Oportunidade: ${analysis.score}/100 (${analysis.scoreLabel})
- Concorrência: ${analysis.competition}
- Crescimento anual: ${analysis.growthRate}%
- Veredito: ${analysis.verdict}
- Posicionamento sugerido: ${analysis.positioning}
- Principais insights: ${analysis.insights.slice(0, 3).join(" | ")}

Use esse contexto para responder. Sugira passos concretos, métricas, canais e formatos.`;
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { headers: corsHeaders }),
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as {
            analysis: MarketAnalysis;
            messages: ChatMessage[];
          };

          const apiKey = process.env.LOVABLE_API_KEY;
          if (!apiKey) {
            return new Response(JSON.stringify({ error: "LOVABLE_API_KEY ausente" }), {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }

          if (!body?.analysis || !Array.isArray(body?.messages)) {
            return new Response(JSON.stringify({ error: "Payload inválido" }), {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }

          const upstream = await fetch(GATEWAY_URL, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: MODEL,
              stream: true,
              messages: [
                { role: "system", content: buildSystem(body.analysis) },
                ...body.messages.map((m) => ({ role: m.role, content: m.content })),
              ],
            }),
          });

          if (upstream.status === 429) {
            return new Response(
              JSON.stringify({ error: "Muitas requisições. Aguarde alguns segundos." }),
              { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
            );
          }
          if (upstream.status === 402) {
            return new Response(
              JSON.stringify({ error: "Créditos de IA esgotados." }),
              { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
            );
          }
          if (!upstream.ok || !upstream.body) {
            const t = await upstream.text();
            logger.error("AI Gateway error", undefined, {
              status: upstream.status,
              response: t,
            });
            return new Response(JSON.stringify({ error: "Falha no gateway" }), {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }

          return new Response(upstream.body, {
            headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
          });
        } catch (e) {
          logger.error("Chat API error", e instanceof Error ? e : undefined);
          return new Response(
            JSON.stringify({ error: e instanceof Error ? e.message : "Erro" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
      },
    },
  },
});

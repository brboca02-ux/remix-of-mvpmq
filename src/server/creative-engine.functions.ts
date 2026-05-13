import { z } from "zod";
import { createServerFn } from "@tanstack/react-start";
import { logger } from "@/lib/logger";

/**
 * Creative Engine
 * 
 * Generates marketing copy using AI when available, with intelligent fallback.
 * 
 * NOTA: Usa IA real via Lovable API quando disponível.
 * Fallback para templates inteligentes quando API não está configurada.
 */

const COPY_TEMPLATES = {
  hooks: {
    estetica: [
      "Seus concorrentes já estão investindo em presença digital",
      "Clientes estão buscando seu serviço online agora",
      "Sua clínica merece ser encontrada no Google"
    ],
    solar: [
      "A energia solar está crescendo 30% ao ano no Brasil",
      "Seus vizinhos já estão economizando com energia solar",
      "O custo da energia só aumenta - a solução é solar"
    ],
    geral: [
      "Sua empresa está perdendo clientes para concorrentes com site",
      "90% dos consumidores pesquisam online antes de comprar",
      "Presença digital não é mais opcional - é sobrevivência"
    ]
  },
  ctas: {
    consultivo: "Vamos conversar sobre como posso ajudar?",
    direto: "Quer ver uma proposta personalizada?",
    urgente: "Posso te mostrar em 5 minutos como resolver isso"
  }
};

interface CreativeOutput {
  creative_id: string;
  framework: string;
  hook: string;
  problem: string;
  agitation: string;
  solution: string;
  cta: string;
  variations: string[];
  source: 'ai' | 'template';
}

export const generateCreative = createServerFn({ method: "POST" })
  .inputValidator((data: { companyName: string; niche?: string; framework?: "AIDA" | "PAS" }) => {
    return {
      companyName: data.companyName || "Empresa",
      niche: data.niche || "geral",
      framework: data.framework || "AIDA"
    };
  })
  .handler(async ({ data }): Promise<CreativeOutput> => {
    const { companyName, niche, framework } = data;
    
    // Try AI generation first
    try {
      const aiResponse = await fetch("https://api.lovable.app/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.LOVABLE_API_KEY || ''}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `Você é um copywriter especialista em vendas B2B de sites e serviços digitais para empresas brasileiras. Gere copy usando o framework ${framework}. Responda APENAS em JSON válido.`
            },
            {
              role: "user",
              content: `Gere uma copy de prospecção para a empresa "${companyName}" do nicho "${niche}". Framework: ${framework}. Retorne JSON: { "hook": "...", "problem": "...", "agitation": "...", "solution": "...", "cta": "...", "variations": ["variação 1", "variação 2"] }`
            }
          ],
          temperature: 0.8,
          max_tokens: 500,
        }),
      });

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        const content = aiData.choices?.[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          return {
            creative_id: `cr_ai_${Date.now().toString(36)}`,
            framework,
            source: 'ai',
            ...parsed,
          };
        }
      }
    } catch (err) {
      logger.debug('AI creative generation failed, using templates', { error: (err as Error).message });
    }

    // Fallback: Template-based generation (intelligent, not random)
    const nicheKey = Object.keys(COPY_TEMPLATES.hooks).find(k => niche.toLowerCase().includes(k)) || 'geral';
    const hooks = COPY_TEMPLATES.hooks[nicheKey as keyof typeof COPY_TEMPLATES.hooks];
    const hook = hooks[Math.floor(Math.random() * hooks.length)];
    
    const problem = `${companyName} pode estar perdendo clientes por falta de presença digital profissional`;
    const solution = `Um site profissional focado em conversão para ${niche}`;
    const cta = COPY_TEMPLATES.ctas.consultivo;

    const agitation = framework === "PAS" 
      ? `Enquanto isso, seus concorrentes estão captando esses clientes online. Cada dia sem um site profissional é receita perdida.`
      : `Imagine quantos clientes estão buscando "${niche}" no Google agora e encontrando seus concorrentes em vez de você.`;

    return {
      creative_id: `cr_tpl_${Date.now().toString(36)}`,
      framework,
      hook,
      problem,
      agitation,
      solution,
      cta,
      variations: [
        `${hook} ${problem}. ${solution}. ${cta}`,
        `Olá! ${hook.toLowerCase()}. Posso te mostrar como resolver isso?`
      ],
      source: 'template',
    };
  });

export const mutationEngine = createServerFn({ method: "POST" })
  .inputValidator((data: { top_creatives: CreativeOutput[] }) => {
    return {
      top_creatives: data.top_creatives || []
    };
  })
  .handler(async ({ data }): Promise<CreativeOutput[]> => {
    const { top_creatives } = data;
    if (top_creatives.length < 2) return top_creatives;

    // Mutation Engine: combinar hooks de um com CTA de outro, variar estrutura
    return top_creatives.map((creative, index) => {
      const nextCreative = top_creatives[(index + 1) % top_creatives.length];
      return {
        ...creative,
        creative_id: `${creative.creative_id}_v2`,
        cta: nextCreative.cta, // Swap CTA
        framework: creative.framework === "AIDA" ? "PAS" : "AIDA", // Alternate framework
        variations: [
          `Variação otimizada: ${creative.hook} + ${nextCreative.cta}`
        ]
      };
    });
  });

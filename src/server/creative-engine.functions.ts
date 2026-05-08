import { z } from "zod";
import { createServerFn } from "@tanstack/react-start";

const blocks = {
  hooks: [
    "Seu nome está negativado e você nem percebeu",
    "Seu score pode estar te impedindo de...",
    "Você está pagando juros abusivos sem saber"
  ],
  dores: [
    "negativação",
    "score baixo",
    "juros abusivos",
    "dívidas acumuladas"
  ],
  solucoes: [
    "limpeza de nome",
    "renegociação",
    "redução de juros",
    "organização financeira"
  ],
  ctas: [
    "consulte agora",
    "veja seu score grátis",
    "descubra como resolver",
    "clique e regularize"
  ]
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
}

export const generateCreative = createServerFn({ method: "POST" })
  .inputValidator((data: { companyName: string, framework?: "AIDA" | "PAS" }) => {
    return {
      companyName: data.companyName || "Empresa",
      framework: data.framework || "AIDA"
    };
  })
  .handler(async ({ data }): Promise<CreativeOutput> => {
    const { framework } = data;
    const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

    const hook = pick(blocks.hooks);
    const problem = pick(blocks.dores);
    const solution = pick(blocks.solucoes);
    const cta = pick(blocks.ctas);

    // Framework PAS (Problem, Agitate, Solution) vs AIDA (Attention, Interest, Desire, Action)
    const agitation = framework === "PAS" 
      ? `A ${problem} está drenando sua energia e impedindo seu crescimento.` 
      : `Interesse em resolver sua ${problem} de uma vez por todas.`;

    return {
      creative_id: `cr_${Math.random().toString(36).substring(7)}`,
      framework,
      hook,
      problem,
      agitation,
      solution,
      cta,
      variations: [
        `${hook}. Sofrendo com ${problem}? Nossa ${solution} é o que você precisa. ${cta}.`,
        `${framework}: ${hook} | ${problem} | ${solution} | ${cta}`
      ]
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

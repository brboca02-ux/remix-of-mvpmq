import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const generateOfferCopy = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({
    name: z.string(),
    targetAudience: z.string(),
    painSolved: z.string(),
    serviceNames: z.string(),
    price: z.string().optional(),
    discount: z.string().optional(),
    instruction: z.string().optional(),
  }).parse(data))
  .handler(async ({ data }) => {
    const { name, targetAudience, painSolved, serviceNames, price, discount, instruction } = data;
    
    const prompt = `Gere uma copy de vendas persuasiva para a seguinte oferta utilizando o modelo mental do GPT-5 mini:
    Nome da Oferta: ${name}
    Público-Alvo: ${targetAudience}
    Dor Resolvida: ${painSolved}
    Serviços Incluídos: ${serviceNames}
    Preço: ${price || 'A consultar'}
    Desconto: ${discount ? discount + '%' : 'Nenhum'}
    ${instruction ? `Instrução adicional: ${instruction}` : ''}

    A copy deve ser estruturada com as técnicas de copywriting mais avançadas:
    1. Headline de altíssimo impacto (curta e magnética)
    2. Gancho emocional direto na dor: "${painSolved}"
    3. Promessa de valor clara: "${name}"
    4. Benefícios tangíveis dos serviços: "${serviceNames}" (use bullet points)
    5. CTA (Call to Action) irresistível que gere urgência

    Tom de voz: Profissional, mas empático, moderno e focado em resultados. Use emojis com parcimônia para destacar pontos importantes.
    Gere APENAS o texto da copy final pronta para uso.`;

    try {
      // Usando o gateway Lovable com gpt-5-mini para melhor custo/benefício e raciocínio
      const response = await fetch("https://api.lovable.app/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.LOVABLE_API_KEY}`,
        },
        body: JSON.stringify({
          model: "openai/gpt-5-mini",
          messages: [
            { role: "system", content: "Você é um mestre em copywriting e marketing digital focado em conversão." },
            { role: "user", content: prompt }
          ],
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error("Falha na chamada da IA");
      }

      const result = await response.json();
      return { copy: result.choices[0].message.content };
    } catch (error) {
      console.error("Erro ao gerar copy:", error);
      // Fallback persuasivo em caso de erro na IA
      return { 
        copy: `🔥 **${name}**: A Solução Definitiva para ${targetAudience}!\n\nVocê sofre com ${painSolved}? Chegou a hora de mudar isso.\n\nCom nosso pacote de **${serviceNames}**, você terá resultados rápidos e profissionais.\n\n✅ Benefício 1: Entrega ágil\n✅ Benefício 2: Qualidade Premium\n✅ Benefício 3: Suporte especializado\n\n💰 Investimento: **${price}**${discount ? ` (com ${discount}% de desconto exclusivo!)` : ''}\n\n🚀 Clique no botão e transforme seu negócio agora!` 
      };
    }
  });

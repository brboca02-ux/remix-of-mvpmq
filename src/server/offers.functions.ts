import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { handleServerError, requireEnvVar, withRetry, ErrorCodes, AppError } from "@/lib/error-handler";

export const generateOfferCopy = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({
    name: z.string().min(1, "Nome da oferta é obrigatório"),
    targetAudience: z.string().min(1, "Público-alvo é obrigatório"),
    painSolved: z.string().min(1, "Dor resolvida é obrigatória"),
    serviceNames: z.string().min(1, "Serviços incluídos são obrigatórios"),
    price: z.string().optional(),
    discount: z.string().optional(),
    instruction: z.string().optional(),
  }).parse(data))
  .handler(async ({ data }) => {
    try {
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

      const apiKey = requireEnvVar('LOVABLE_API_KEY');

      // Use retry logic for AI generation
      const result = await withRetry(
        async () => {
          const response = await fetch("https://api.lovable.app/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: "openai/gpt-5-mini",
              messages: [
                { role: "system", content: "Você é um mestre em copywriting e marketing digital focado em conversão." },
                { role: "user", content: prompt }
              ],
              temperature: 0.7,
            }),
            signal: AbortSignal.timeout(30000), // 30 second timeout
          });

          if (response.status === 429) {
            throw new AppError(
              ErrorCodes.RATE_LIMIT_EXCEEDED,
              "Muitas requisições. Aguarde alguns segundos e tente novamente.",
              { status: response.status }
            );
          }

          if (response.status === 402) {
            throw new AppError(
              ErrorCodes.PAYMENT_REQUIRED,
              "Créditos de IA esgotados. Adicione créditos em Settings > Workspace > Usage.",
              { status: response.status }
            );
          }

          if (!response.ok) {
            const errorText = await response.text().catch(() => 'Unknown error');
            throw new AppError(
              ErrorCodes.EXTERNAL_API_ERROR,
              "Falha na chamada da IA. Tente novamente.",
              { status: response.status, error: errorText }
            );
          }

          const result = await response.json();
          
          if (!result.choices?.[0]?.message?.content) {
            throw new AppError(
              ErrorCodes.EXTERNAL_API_ERROR,
              "Resposta inválida da IA. Tente novamente.",
              { result }
            );
          }

          return { copy: result.choices[0].message.content };
        },
        {
          maxAttempts: 2,
          delayMs: 2000,
          onRetry: (attempt, error) => {
            logger.warn('Retrying offer copy generation', { 
              attempt, 
              error: error.message,
              offerName: name 
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

      logger.info('Offer copy generated successfully', { 
        offerName: name,
        copyLength: result.copy.length 
      });

      return result;

    } catch (error) {
      // If it's an AppError, rethrow it
      if (error instanceof AppError) {
        throw error;
      }

      // Log the error and return fallback
      logger.error('Failed to generate marketing copy', error as Error, {
        offerName: data.name
      });

      // Fallback persuasivo em caso de erro na IA
      const fallbackCopy = `🔥 **${data.name}**: A Solução Definitiva para ${data.targetAudience}!\n\nVocê sofre com ${data.painSolved}? Chegou a hora de mudar isso.\n\nCom nosso pacote de **${data.serviceNames}**, você terá resultados rápidos e profissionais.\n\n✅ Benefício 1: Entrega ágil\n✅ Benefício 2: Qualidade Premium\n✅ Benefício 3: Suporte especializado\n\n💰 Investimento: **${data.price || 'Consulte-nos'}**${data.discount ? ` (com ${data.discount}% de desconto exclusivo!)` : ''}\n\n🚀 Clique no botão e transforme seu negócio agora!`;
      
      return { copy: fallbackCopy };
    }
  });

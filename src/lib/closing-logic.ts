import { Company } from "@/lib/company-types";
import { computeDigitalScore } from "./digital-score";

/**
 * Calcula a "Chance de Fechamento Agora" (0-100)
 * Baseado em:
 * - score do lead (propensão base)
 * - engajamento (baseado no histórico e status)
 * - tempo desde último contato
 * - estágio da conversa (contactStatus)
 * - maturidade digital
 */
export function computeClosingOpportunity(company: Company): number {
  let chance = (company.score || 50) * 0.4; // 40% peso propensão base

  // Peso Status de Contato (30%)
  if (company.contactStatus === 'Cliente respondeu') chance += 30;
  else if (company.contactStatus === 'Aguardando resposta') chance += 15;
  else if (company.contactStatus === 'Reenvio vencido') chance += 10;
  
  // Peso Engajamento/Histórico (20%)
  const history = company.contactHistory || [];
  if (history.length > 0) {
    const confirmations = history.filter(h => h.status === 'confirmado').length;
    chance += Math.min(confirmations * 5, 15); // Até 15 pontos por envios confirmados
    
    // Bônus se respondeu recentemente
    const lastInteraction = history[0];
    if (lastInteraction && lastInteraction.type === 'response') {
        chance += 10;
    }
  }

  // Peso Maturidade Digital (10%)
  const ds = computeDigitalScore(company);
  if (ds.level === 'vermelho') chance += 10; // Maior dor = maior chance de fechamento
  else if (ds.level === 'amarelo') chance += 5;

  return Math.min(Math.round(chance), 100);
}

export function closingPriorityLabel(chance: number): "Alta" | "Média" | "Baixa" {
  if (chance >= 75) return "Alta";
  if (chance >= 45) return "Média";
  return "Baixa";
}

export function closingPriorityColor(chance: number): string {
  if (chance >= 75) return "text-rose-500";
  if (chance >= 45) return "text-amber-500";
  return "text-slate-400";
}

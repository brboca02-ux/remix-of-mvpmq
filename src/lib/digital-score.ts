import type { Company } from "./company-types";

export type DigitalLevel = "verde" | "amarelo" | "vermelho";

export interface DigitalScore {
  score: number; // 0-10
  level: DigitalLevel;
  reasons: string[];
}

function hashId(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
}

const PORTE_WEIGHT: Record<string, number> = {
  MEI: 0,
  Micro: 0.5,
  Pequena: 1,
  Média: 1.5,
  Grande: 2,
};

export function computeDigitalScore(c: Company): DigitalScore {
  const reasons: string[] = [];
  let score = 0;

  if (c.site) {
    score += 3;
    reasons.push("Site próprio");
  } else {
    reasons.push("Sem site");
  }

  if (c.email) {
    const isCorporate = !/@(gmail|hotmail|yahoo|outlook|bol|uol)\./i.test(c.email);
    if (isCorporate) {
      score += 2;
      reasons.push("Email corporativo");
    } else {
      score += 0.5;
      reasons.push("Email genérico");
    }
  }

  if (c.telefone) {
    score += 1;
    reasons.push("Telefone disponível");
  }

  score += PORTE_WEIGHT[c.porte] ?? 0;
  if (c.funcionarios > 5) {
    score += 1;
    reasons.push(`${c.funcionarios} funcionários`);
  }

  // Variação determinística por id (-0.5 a +1)
  const variation = hashId(c.id) * 1.5 - 0.5;
  score += variation;

  // Clamp 0-10
  score = Math.max(0, Math.min(10, score));
  const rounded = Math.round(score * 10) / 10;

  const level: DigitalLevel =
    rounded >= 8 ? "verde" : rounded >= 4 ? "amarelo" : "vermelho";

  return { score: rounded, level, reasons };
}

export function digitalLevelEmoji(l: DigitalLevel): string {
  return l === "verde" ? "🟢" : l === "amarelo" ? "🟡" : "🔴";
}

export function digitalLevelLabel(l: DigitalLevel): string {
  return l === "verde" ? "Profissional" : l === "amarelo" ? "Iniciante" : "Lead Quente";
}

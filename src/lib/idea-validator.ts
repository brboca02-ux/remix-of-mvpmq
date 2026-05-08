import { GeneratedSite } from "@/modules/prospecting/types";

export interface ValidationResult {
  score: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}

export const validateProposal = (site: GeneratedSite): ValidationResult => {
  let score = 0;
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const suggestions: string[] = [];

  // Clareza da oferta (Nome da empresa e Nicho)
  if (site.companyName && site.companyName !== 'Nova Empresa') {
    score += 10;
    strengths.push("Nome da empresa definido");
  } else {
    weaknesses.push("Nome da empresa genérico");
    suggestions.push("Defina o nome real da empresa");
  }

  if (site.niche && site.niche !== 'Serviços') {
    score += 10;
    strengths.push("Nicho de mercado identificado");
  } else {
    weaknesses.push("Nicho não definido");
    suggestions.push("Especifique o nicho para personalização premium");
  }

  // Força do CTA e Contato
  if (site.whatsapp && site.whatsapp.length >= 10) {
    score += 15;
    strengths.push("WhatsApp de contato válido");
  } else {
    weaknesses.push("Sem WhatsApp para conversão");
    suggestions.push("Adicione o WhatsApp para permitir agendamentos");
  }

  // Serviços e Diferenciais
  if (site.services && site.services.length >= 3) {
    score += 15;
    strengths.push("Mix de serviços bem descrito");
  } else {
    weaknesses.push("Poucos serviços listados");
    suggestions.push("Liste ao menos 3 serviços principais");
  }

  if (site.differentials && site.differentials.length >= 3) {
    score += 10;
    strengths.push("Diferenciais competitivos claros");
  } else {
    weaknesses.push("Faltam diferenciais do negócio");
    suggestions.push("Adicione diferenciais que tornam a empresa única");
  }

  // Presença Digital e Prova Social
  if (site.instagram) {
    score += 15;
    strengths.push("Presença no Instagram integrada");
  } else {
    weaknesses.push("Sem link do Instagram");
    suggestions.push("Adicione o Instagram para gerar mais confiança");
  }

  // Informações de localização
  if (site.city && site.city !== 'Joinville') {
    score += 10;
    strengths.push("Localização geográfica definida");
  } else {
    suggestions.push("Confirme a cidade para SEO local");
  }

  // Qualidade do conteúdo (IA)
  if (site.rawDataInput && site.rawDataInput.length > 50) {
    score += 15;
    strengths.push("Informações ricas para personalização");
  } else {
    weaknesses.push("Baixo volume de informações personalizadas");
    suggestions.push("Cole mais textos do cliente no campo Personalização (IA)");
  }

  return {
    score: Math.min(score, 100),
    strengths,
    weaknesses,
    suggestions
  };
};

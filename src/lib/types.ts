export type Competition = "baixa" | "media" | "alta";
export type Verdict = "sim" | "talvez" | "nao";
export type Region = "brasil" | "latam" | "global";
export type RiskLevel = "low" | "medium" | "high";

export interface GrowthPoint {
  year: number;
  value: number;
}

export interface NicheOpportunity {
  id: string;
  name: string;
  evidence: string;
  source: string;
  confidence: number;
  risk: RiskLevel;
  nextStep: string;
  tam?: number;
  sam?: number;
  som?: number;
  simulation?: {
    faturamento_estimado_anual: number;
    checkpoints: string[];
  };
}

export interface MarketAnalysis {
  id: string;
  createdAt: number;
  favorite?: boolean;
  input: {
    idea: string;
    audience?: string;
    region: Region;
  };
  tam: number;
  sam: number;
  som: number;
  tamDescription: string;
  samDescription: string;
  somDescription: string;
  growthRate: number;
  searchVolume: number;
  searchTrend: { month: string; volume: number }[];
  competition: Competition;
  competitionReason: string;
  score: number;
  scoreLabel: "Baixa" | "Média" | "Alta";
  insights: string[];
  productIdeas: { title: string; description: string; type: string }[];
  hiddenNiches: string[];
  verdict: Verdict;
  verdictReason: string;
  growthProjection: GrowthPoint[];
  averageTicket: number;
  positioning: string;
  // Oportunidades de nicho baseadas em evidências reais
  nicheOpportunities?: NicheOpportunity[];
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

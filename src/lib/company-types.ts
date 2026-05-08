export type CompanyPorte = "MEI" | "Micro" | "Pequena" | "Média" | "Grande";
export type CompanyStatus = "ativa" | "inativa";
export type RegimeTributario = "Simples" | "Lucro Presumido" | "Lucro Real";
export type Tecnografia = "Shopify" | "ERP" | "WordPress" | "Nenhum";

export type ContactStatus = 
  | 'Novo envio pendente'
  | 'Contato enviado hoje'
  | 'Reenvio agendado'
  | 'Reenvio vencido'
  | 'Aguardando resposta'
  | 'Cliente respondeu'
  | 'Cliente sem interesse'
  | 'Lead descartado'
  | 'Erro no envio'
  | 'Não contactar'
  | 'Sequência finalizada'
  | 'Aguardando confirmação';

export interface ContactHistoryItem {
  id: string;
  timestamp: string;
  channel: 'WhatsApp' | 'Instagram' | 'Email' | 'Outro';
  status: 'pendente' | 'enviado' | 'erro' | 'confirmado';
  message?: string;
  author?: string;
  nextFollowUpAt?: string;
  attemptNumber?: number;
  type?: string;
  notes?: string;
}

export interface CNAE {
  code: string;
  label: string;
  sector: string;
  ticketMedio: number; // ticket médio mensal estimado (R$)
}

export interface Company {
  id: string;
  nome: string;
  fantasia?: string;
  cnpj: string;
  cnaeCode: string;
  cnaeLabel: string;
  sector: string;
  porte: CompanyPorte;
  estado: string;
  cidade: string;
  email?: string;
  telefone?: string;
  site?: string;
  status: CompanyStatus;
  faturamentoEstimado: number;
  funcionarios: number;
  capitalSocial: number;
  dataAbertura: string; // ISO
  regime: RegimeTributario;
  tecnografia: Tecnografia;
  socios: string[];
  score: number; // 0-100 propensão
  confidenceScore?: number; // 0-100 consistência de dados
  
  // Follow-up fields
  contactStatus?: ContactStatus;
  lastContactAt?: string;
  nextFollowUpAt?: string;
  contactHistory?: ContactHistoryItem[];
  interestLevel?: 'interested' | 'not_interested' | 'cold';
  contactNotes?: string;
  followUpStep?: number;
  isDiscarded?: boolean;
  discardReason?: string;
  leadOperationStatus?: string;
  instagramHandle?: string;
}

export interface CompanyFilter {
  text: string;
  cnaeCodes: string[];
  portes: CompanyPorte[];
  estados: string[];
  cidades: string[];
  onlyAtivas: boolean;
  hasEmail: boolean;
  hasTelefone: boolean;
  hasSite: boolean;
  regimes: RegimeTributario[];
  tecnografias: Tecnografia[];
  digitalLevels: ("verde" | "amarelo" | "vermelho")[];
  digitalScoreMin: number;
  jobId?: string;
  contactStatus?: ContactStatus[];
};

export const emptyFilter: CompanyFilter = {
  text: "",
  cnaeCodes: [],
  portes: [],
  estados: [],
  cidades: [],
  onlyAtivas: true,
  hasEmail: false,
  hasTelefone: false,
  hasSite: false,
  regimes: [],
  tecnografias: [],
  digitalLevels: [],
  digitalScoreMin: 0,
  jobId: undefined,
};

export interface SavedList {
  id: string;
  name: string;
  createdAt: number;
  filter: CompanyFilter;
  companyIds: string[];
}

export interface FilterPreset {
  id: string;
  name: string;
  filter: CompanyFilter;
}

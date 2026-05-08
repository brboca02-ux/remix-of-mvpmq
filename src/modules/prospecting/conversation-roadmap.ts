import { ConversationStage } from './types';
import { 
  MessageSquare, 
  Zap, 
  Target, 
  Sparkles, 
  TrendingUp, 
  ShieldAlert, 
  ListChecks, 
  CheckCircle, 
  History,
  Info,
  Clock,
  ThumbsDown,
  MessageCircle,
  XCircle
} from 'lucide-react';

export interface StageDetail {
  id: ConversationStage;
  label: string;
  goal: string;
  errorToAvoid: string;
  approach: string;
  example: string;
  icon: any;
  color: string;
}

export const CONVERSATION_ROADMAP: Record<ConversationStage, StageDetail> = {
  'Novo': {
    id: 'Novo',
    label: 'Novo',
    goal: 'Iniciar o contato inicial e gerar curiosidade.',
    errorToAvoid: 'Ser muito agressivo ou vendedor demais.',
    approach: 'Focar em um benefício claro ou pergunta aberta sobre o negócio.',
    example: 'Olá [Nome], vi que vocês trabalham com [Nicho]. Tive uma ideia para [Benefício], podemos falar?',
    icon: Zap,
    color: 'text-amber-500'
  },
  'Primeira resposta': {
    id: 'Primeira resposta',
    label: 'Primeira resposta',
    goal: 'Manter a conversa fluindo e validar interesse.',
    errorToAvoid: 'Demorar para responder ou enviar texto gigante.',
    approach: 'Reconhecer a resposta e fazer uma pergunta de engajamento.',
    example: 'Que bom que respondeu! Você já utiliza alguma estratégia para [Problema] hoje?',
    icon: MessageSquare,
    color: 'text-emerald-500'
  },
  'Engajamento inicial': {
    id: 'Engajamento inicial',
    label: 'Engajamento inicial',
    goal: 'Estabelecer conexão e autoridade.',
    errorToAvoid: 'Falar apenas de si mesmo em vez de focar no lead.',
    approach: 'Compartilhar um insight rápido ou elogiar algo específico do lead.',
    example: 'Gostei muito do posicionamento de vocês no [Canal]. Isso facilita muito para [Resultado].',
    icon: Zap,
    color: 'text-violet-500'
  },
  'Diagnóstico': {
    id: 'Diagnóstico',
    label: 'Diagnóstico',
    goal: 'Entender a dor real e qualificar o potencial.',
    errorToAvoid: 'Pular direto para o preço sem entender o problema.',
    approach: 'Fazer perguntas consultivas (S.P.I.N. Selling).',
    example: 'Como isso impacta seu faturamento hoje? Qual sua meta para os próximos 6 meses?',
    icon: Target,
    color: 'text-blue-500'
  },
  'Apresentação de valor': {
    id: 'Apresentação de valor',
    label: 'Apresentação de valor',
    goal: 'Mostrar como sua solução resolve a dor detectada.',
    errorToAvoid: 'Listar apenas funcionalidades (features) em vez de benefícios.',
    approach: 'Conectar seu serviço diretamente à dor mencionada no diagnóstico.',
    example: 'Com base no que você disse, o ideal seria [Solução] para que você consiga [Benefício].',
    icon: Sparkles,
    color: 'text-amber-600'
  },
  'Interesse': {
    id: 'Interesse',
    label: 'Interesse',
    goal: 'Aquecer o lead para a negociação final.',
    errorToAvoid: 'Não identificar sinais de compra.',
    approach: 'Usar prova social ou um "gostinho" do resultado.',
    example: 'Fizemos algo parecido para um cliente de [Nicho] e o resultado foi [X% de crescimento].',
    icon: TrendingUp,
    color: 'text-emerald-600'
  },
  'Objeção': {
    id: 'Objeção',
    label: 'Objeção',
    goal: 'Remover barreiras e aumentar confiança.',
    errorToAvoid: 'Ficar na defensiva ou discutir com o lead.',
    approach: 'Sentir, Isolar, Validar, Responder (Feel-Felt-Found).',
    example: 'Entendo perfeitamente. Muitos clientes sentiam o mesmo antes de verem que [Explicação].',
    icon: ShieldAlert,
    color: 'text-rose-500'
  },
  'Negociação': {
    id: 'Negociação',
    label: 'Negociação',
    goal: 'Chegar a um acordo ganha-ganha.',
    errorToAvoid: 'Dar desconto sem pedir algo em troca (reciprocidade).',
    approach: 'Focar no ROI (Retorno sobre Investimento).',
    example: 'Se fecharmos agora, consigo priorizar sua entrega para [Data]. O que acha?',
    icon: ListChecks,
    color: 'text-indigo-500'
  },
  'Fechamento': {
    id: 'Fechamento',
    label: 'Fechamento',
    goal: 'Pegar o "sim" final e formalizar.',
    errorToAvoid: 'Não pedir o fechamento (medo de rejeição).',
    approach: 'Pergunta de fechamento direto ou alternativa.',
    example: 'Prefere começar com o plano [X] ou [Y]? Vou te mandar o link para iniciarmos.',
    icon: CheckCircle,
    color: 'text-emerald-700'
  },
  'Pós-fechamento': {
    id: 'Pós-fechamento',
    label: 'Pós-fechamento',
    goal: 'Garantir boa experiência e pedir indicação.',
    errorToAvoid: 'Sumir após receber o pagamento.',
    approach: 'Onboarding claro e alinhamento de expectativas.',
    example: 'Bem-vindo! Aqui está o cronograma. Conhece mais alguém que se beneficiaria disso?',
    icon: History,
    color: 'text-slate-500'
  }
};

export const QUICK_SCENARIOS: ScenarioDetail[] = [
  {
    id: 'quanto_custa',
    label: 'Quanto custa?',
    icon: Info,
    responses: {
      leve: 'Trabalhamos com projetos personalizados. Para te dar um valor real, preciso entender se [Pergunta de Diagnóstico].',
      media: 'O investimento médio é de R$ [Valor], mas varia conforme sua necessidade de [Serviço]. Vamos alinhar os detalhes?',
      forte: 'Nossa solução se paga em poucos meses. O valor é [Preço], e o foco é gerar [Resultado] para você.',
      goal: 'Ancorar valor e avançar para Diagnóstico/Valor.'
    }
  },
  {
    id: 'sem_interesse',
    label: 'Sem interesse',
    icon: ThumbsDown,
    responses: {
      leve: 'Entendo perfeitamente. Posso saber se é por causa do momento ou da solução em si?',
      media: 'Sem problemas! Só para eu não te incomodar mais, você já tem alguém cuidando de [Serviço] hoje?',
      forte: 'Compreendo. Muitos dizem isso antes de saberem que estamos gerando [Resultado] para concorrentes. Fica o contato!',
      goal: 'Tentar descobrir motivo ou encerrar de forma elegante.'
    }
  },
  {
    id: 'ja_tenho_alguem',
    label: 'Já tenho alguém',
    icon: ShieldAlert,
    responses: {
      leve: 'Ótimo que já investe nisso! Se quiser uma segunda opinião sem compromisso sobre [Ponto específico], estou aqui.',
      media: 'Perfeito. Estamos trazendo uma tecnologia de [Diferencial] que poucas agências usam. Topa comparar?',
      forte: 'Legal! Geralmente quem já tem alguém é quem mais se beneficia do nosso [Diferencial]. Vamos trocar uma ideia rápida?',
      goal: 'Criar dúvida positiva e mostrar diferencial.'
    }
  },
  {
    id: 'depois_vejo',
    label: 'Depois vejo',
    icon: Clock,
    responses: {
      leve: 'Tranquilo! Quando seria um bom momento para eu te dar um "oi" novamente?',
      media: 'Sem pressa. Só aviso que nossa agenda para [Mês] está quase cheia. Quer garantir um horário para conversa?',
      forte: 'Entendo. O problema é que cada dia sem [Solução] é um dia perdendo [Oportunidade]. Topa 5 min agora?',
      goal: 'Gerar escassez ou urgência.'
    }
  },
  {
    id: 'mais_info',
    label: 'Me manda mais info',
    icon: MessageCircle,
    responses: {
      leve: 'Claro! Vou te mandar um PDF com nossos resultados. O que mais te chamou atenção até agora?',
      media: 'Vou enviar agora. Aproveitando, você prefere focar em [Objetivo A] ou [Objetivo B] no curto prazo?',
      forte: 'Mando sim! Mas info sem contexto pode confundir. Que tal uma call de 10 min para eu te mostrar o que importa para você?',
      goal: 'Enviar material mas tentar converter para reunião/call.'
    }
  },
  {
    id: 'agora_nao_posso',
    label: 'Agora não posso',
    icon: XCircle,
    responses: {
      leve: 'Sem problemas! Qual o melhor horário/dia para conversarmos com calma?',
      media: 'Te entendo, correria total. Te chamo na [Dia da Semana] às [Hora]?',
      forte: 'Entendido. Vou deixar um áudio rápido aqui e você ouve quando puder, pode ser?',
      goal: 'Agendar ou mudar o canal/formato.'
    }
  }
];

export const CLOSING_SCRIPTS = [
  { id: 'direto', label: 'Fechamento Direto', script: 'Vamos fechar? Já te mando os dados para começarmos hoje mesmo.' },
  { id: 'consultivo', label: 'Fechamento Consultivo', script: 'Com base no nosso diagnóstico, o próximo passo natural é iniciarmos o projeto. Podemos bater o martelo?' },
  { id: 'escassez', label: 'Fechamento com Escassez', script: 'Só tenho mais uma vaga para implementação este mês. Quer garantir a sua agora?' },
  { id: 'prova_social', label: 'Fechamento com Prova Social', script: 'Queremos repetir com você o sucesso que tivemos com [Outro Cliente]. Vamos dar o primeiro passo?' }
];

export interface ScenarioDetail {
  id: string;
  label: string;
  icon: any;
  responses: {
    leve: string;
    media: string;
    forte: string;
    goal: string;
  };
}

export const getNextStage = (current: ConversationStage): ConversationStage => {
  const stages: ConversationStage[] = [
    'Novo', 'Primeira resposta', 'Engajamento inicial', 'Diagnóstico', 
    'Apresentação de valor', 'Interesse', 'Objeção', 'Negociação', 
    'Fechamento', 'Pós-fechamento'
  ];
  const idx = stages.indexOf(current);
  if (idx >= 0 && idx < stages.length - 1) return stages[idx + 1];
  return current;
};

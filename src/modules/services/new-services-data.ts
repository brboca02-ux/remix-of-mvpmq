import { 
  Zap, 
  TrendingUp, 
  Lightbulb, 
  Layout, 
  Monitor, 
  UserCircle, 
  Video, 
  Store, 
  GraduationCap, 
  Bitcoin, 
  Languages,
  LineChart,
  Bot,
  Scissors
} from "lucide-react";

export interface NewService {
  id: string;
  name: string;
  category: 'Marketing & Mídia' | 'E-commerce & Vendas' | 'Inovação & Tecnologia' | 'Consultoria & Estratégia' | 'Beleza & Estética';
  description: string;
  benefit: string;
  fullDescription: string;
  howItWorks: string;
  benefits: string[];
  suggestedPrice: string;
  deliveryTime: string;
  icon: any;
  status?: 'Ativo' | 'Pausado';
  deliveryInfo?: {
    whatIsDelivered: string[];
    whatWeNeed: { id: string; label: string; type: string; required: boolean }[];
    estimatedTime: string;
    deliveryFormat: string[];
  };
}

export const NEW_SERVICES_DATA: NewService[] = [
  {
    id: 'ai-sales-assistant',
    name: 'Consultoria em Automação de Vendas (AI Sales Assistant)',
    category: 'Consultoria & Estratégia',
    description: 'Serviço de automação para vendas com IA, utilizando assistentes virtuais e análise preditiva.',
    benefit: 'Aumento significativo nas conversões e redução do ciclo de vendas.',
    fullDescription: 'Implementamos assistentes virtuais inteligentes que qualificam leads 24/7, agendam reuniões e realizam follow-ups personalizados baseados no comportamento do cliente.',
    howItWorks: 'Analisamos seu processo atual, treinamos a IA com seus dados comerciais e integramos ao seu CRM.',
    benefits: [
      'Atendimento 24/7 sem custos de escala',
      'Qualificação instantânea de leads',
      'Redução de 40% no tempo de resposta',
      'Aumento de conversão em até 25%'
    ],
    suggestedPrice: 'A partir de R$ 2.500/mês',
    deliveryTime: '15 a 30 dias',
    icon: Bot,
    status: 'Ativo',
    deliveryInfo: {
      whatIsDelivered: ['Plano de automação', 'Assistente IA configurado', 'Dashboard de performance'],
      whatWeNeed: [
        { id: 'asa-1', label: 'Nome da empresa', type: 'text', required: true },
        { id: 'asa-2', label: 'Lista de produtos/serviços', type: 'text', required: true },
        { id: 'asa-3', label: 'Objetivo principal', type: 'text', required: true },
        { id: 'asa-4', label: 'CRM atual', type: 'text', required: false },
      ],
      estimatedTime: '15 a 30 dias',
      deliveryFormat: ['Link online', 'PDF']
    }
  },
  {
    id: 'hair-extensions-premium',
    name: 'Mega Hair & Extensões Premium (Bella Hair Style)',
    category: 'Beleza & Estética',
    description: 'Solução completa de extensões capilares com fibras europeias e técnicas invisíveis.',
    benefit: 'Transformação estética imediata com naturalidade absoluta e alta durabilidade.',
    fullDescription: 'Especialização em Mega Hair Adesivo e Apliques Tic Tac utilizando as melhores fibras do mercado. Ideal para quem busca volume e comprimento com acabamento profissional.',
    howItWorks: 'Avaliação da textura capilar, escolha da cor personalizada e aplicação técnica com foco em preservação do fio natural.',
    benefits: [
      'Naturalidade incomparável (Fibra Europeia)',
      'Método indolor e de rápida aplicação',
      'Resistente a calor e lavagens',
      'Acabamento invisível'
    ],
    suggestedPrice: 'Sob consulta (kits a partir de R$ 890)',
    deliveryTime: 'Pronta entrega ou 5 dias para aplicação',
    icon: Scissors,
    status: 'Ativo'
  },
  {
    id: 'content-monetization',
    name: 'Consultoria em Monetização de Conteúdo Digital',
    category: 'Marketing & Mídia',
    description: 'Estratégias para criadores de conteúdo maximizarem sua renda por meio de parcerias e anúncios.',
    benefit: 'Diversificação de fontes de renda e aumento do faturamento mensal.',
    fullDescription: 'Consultoria especializada em transformar audiência em lucro real através de modelos de assinatura, parcerias estratégicas e otimização de redes de anúncios.',
    howItWorks: 'Auditoria de canais, mapeamento de público e criação de funis de monetização específicos.',
    benefits: [
      'Mapeamento de novas fontes de receita',
      'Estratégias de parcerias com marcas',
      'Otimização de ROI em anúncios',
      'Plano de crescimento de audiência'
    ],
    suggestedPrice: 'Sob consulta',
    deliveryTime: '20 dias',
    icon: TrendingUp
  },
  {
    id: 'innovation-management',
    name: 'Gestão de Inovação e Pesquisa de Mercado',
    category: 'Inovação & Tecnologia',
    description: 'Análise de tendências e oportunidades utilizando big data e IA para prever movimentos.',
    benefit: 'Antecipação a tendências e vantagem competitiva no mercado.',
    fullDescription: 'Serviço de inteligência competitiva que utiliza ferramentas avançadas para monitorar concorrentes e identificar nichos inexplorados antes de todo mundo.',
    howItWorks: 'Configuramos dashboards de monitoramento e entregamos relatórios mensais de tendências.',
    benefits: [
      'Relatórios mensais de tendências',
      'Monitoramento de concorrência por IA',
      'Identificação de lacunas no mercado',
      'Redução de riscos em novos lançamentos'
    ],
    suggestedPrice: 'R$ 1.800/relatório',
    deliveryTime: '7 dias por ciclo',
    icon: LineChart
  },
  {
    id: 'ai-business-models',
    name: 'Modelos de Negócios Inovadores com IA',
    category: 'Inovação & Tecnologia',
    description: 'Consultoria para empresas desenvolverem modelos de negócios escaláveis baseados em IA.',
    benefit: 'Escalabilidade acelerada e eficiência operacional sem precedentes.',
    fullDescription: 'Repensamos como seu negócio gera valor, inserindo IA no core business para permitir escala global com estruturas enxutas.',
    howItWorks: 'Workshops de cocriação, prototipagem de soluções de IA e plano de implementação técnica.',
    benefits: [
      'Design de processos escaláveis',
      'Redução de custos operacionais',
      'Criação de novos fluxos de receita',
      'Modernização da arquitetura de negócio'
    ],
    suggestedPrice: 'A partir de R$ 5.000',
    deliveryTime: '30 a 45 dias',
    icon: Lightbulb
  },
  {
    id: 'ai-website-personalization',
    name: 'Personalização de Websites com IA',
    category: 'Inovação & Tecnologia',
    description: 'Criação de sites que se adaptam automaticamente ao comportamento de cada visitante.',
    benefit: 'Experiência do usuário personalizada e maior taxa de retenção.',
    fullDescription: 'Seu site deixa de ser estático e passa a mudar o layout, textos e ofertas em tempo real dependendo de quem está acessando.',
    howItWorks: 'Instalação de script de rastreamento comportamental e configuração de gatilhos dinâmicos por IA.',
    benefits: [
      'Aumento de CTR em ofertas dinâmicas',
      'Melhoria na pontuação de SEO',
      'Redução de taxa de rejeição (Bounce Rate)',
      'Experiência VIP para clientes recorrentes'
    ],
    suggestedPrice: 'A partir de R$ 3.200',
    deliveryTime: '20 dias',
    icon: Layout
  },
  {
    id: 'vr-experiences',
    name: 'Criação de Experiências de Realidade Virtual (VR)',
    category: 'Inovação & Tecnologia',
    description: 'Desenvolvimento de experiências imersivas para feiras, treinamentos e eventos.',
    benefit: 'Engajamento sensorial profundo e fixação de marca inovadora.',
    fullDescription: 'Criamos tours virtuais, simulações de treinamento e showrooms digitais acessíveis por óculos de VR ou navegadores.',
    howItWorks: 'Modelagem 3D, roteirização da experiência e exportação para as principais plataformas.',
    benefits: [
      'Destaque absoluto em eventos presenciais',
      'Treinamento de funcionários sem riscos',
      'Visualização antecipada de projetos físicos',
      'Fator "UAU" garantido para a marca'
    ],
    suggestedPrice: 'A partir de R$ 4.500',
    deliveryTime: '30 a 60 dias',
    icon: Monitor
  },
  {
    id: 'ai-marketing-assistant',
    name: 'Assistente Pessoal de Marketing Digital com IA',
    category: 'Marketing & Mídia',
    description: 'Assistente inteligente que ajuda a gerenciar e otimizar campanhas automatizando decisões.',
    benefit: 'Economia de tempo e decisões baseadas em dados precisos.',
    fullDescription: 'Um "copiloto" para o gestor de tráfego e social media que sugere ajustes de orçamento e copies de alto desempenho.',
    howItWorks: 'Conexão via API com Meta/Google Ads e interface de chat para comandos e relatórios.',
    benefits: [
      'Ajustes automáticos de lance (bid)',
      'Sugestões de criativos baseadas em IA',
      'Relatórios em linguagem natural',
      'Alerta de oportunidades 24h'
    ],
    suggestedPrice: 'R$ 950/mês',
    deliveryTime: '5 dias para setup',
    icon: UserCircle
  },
  {
    id: 'ai-video-production',
    name: 'Produção de Conteúdo de Vídeo Personalizado com IA',
    category: 'Marketing & Mídia',
    description: 'Geração de vídeos comerciais, animações e conteúdo educativo via IA.',
    benefit: 'Custo de produção reduzido em até 80% comparado a estúdios tradicionais.',
    fullDescription: 'Transformamos scripts em vídeos profissionais com avatares humanos ultra-realistas ou animações dinâmicas.',
    howItWorks: 'Roteiro validado por especialistas, geração de vídeo via IA e edição final com sua marca.',
    benefits: [
      'Vídeos em escala para redes sociais',
      'Treinamentos corporativos dinâmicos',
      'Avatares que falam qualquer idioma',
      'Entrega recorde de 48h'
    ],
    suggestedPrice: 'A partir de R$ 450/vídeo',
    deliveryTime: '48 a 72h',
    icon: Video
  },
  {
    id: 'local-digital-transformation',
    name: 'Consultoria de Transformação Digital para Negócios Locais',
    category: 'Consultoria & Estratégia',
    description: 'Digitalização de negócios locais com agendamentos, e-commerce e marketing local.',
    benefit: 'Sobrevivência e crescimento no ambiente digital moderno.',
    fullDescription: 'Trazemos o comércio do bairro para o digital, estruturando presença no Google Maps, sites rápidos e vendas via WhatsApp.',
    howItWorks: 'Diagnóstico local, implementação de ferramentas No-code e treinamento da equipe.',
    benefits: [
      'Google Meu Negócio otimizado',
      'Sistema de agendamento automático',
      'Cardápio/Catálogo digital',
      'Automação de WhatsApp Business'
    ],
    suggestedPrice: 'A partir de R$ 1.200',
    deliveryTime: '15 dias',
    icon: Store
  },
  {
    id: 'micro-courses-platform',
    name: 'Plataforma de Micro Cursos e Certificações',
    category: 'E-commerce & Vendas',
    description: 'Desenvolvimento de cursos online e programas de certificação para empresas.',
    benefit: 'Autoridade de mercado e nova fonte de receita passiva.',
    fullDescription: 'Criamos sua própria universidade corporativa ou área de membros para venda de infoprodutos focados em micro-learning.',
    howItWorks: 'Estruturação pedagógica, escolha da plataforma LMS e setup de vendas.',
    benefits: [
      'Controle total sobre o conteúdo',
      'Certificados automáticos',
      'Gamificação para alunos',
      'Checkout integrado de alta conversão'
    ],
    suggestedPrice: 'A partir de R$ 2.800',
    deliveryTime: '20 a 30 dias',
    icon: GraduationCap
  },
  {
    id: 'crypto-consultancy',
    name: 'Consultoria em Economia Digital e Criptomoedas',
    category: 'Inovação & Tecnologia',
    description: 'Implementação de estratégias de blockchain e finanças digitais para empresas.',
    benefit: 'Modernização financeira e abertura para novos mercados globais.',
    fullDescription: 'Ajudamos empresas a aceitarem pagamentos em cripto, explorarem NFTs e entenderem o impacto da Web3 no seu setor.',
    howItWorks: 'Análise de conformidade, setup de carteiras corporativas e treinamento de segurança.',
    benefits: [
      'Aceitação de pagamentos globais',
      'Segurança em custódia de ativos',
      'Exploração de programas de fidelidade NFT',
      'Redução de taxas bancárias'
    ],
    suggestedPrice: 'Sob consulta',
    deliveryTime: '30 dias',
    icon: Bitcoin
  },
  {
    id: 'ai-translation-localization',
    name: 'Serviços de Tradução e Localização com IA',
    category: 'Marketing & Mídia',
    description: 'Tradução e adaptação cultural de conteúdo para diferentes idiomas com precisão.',
    benefit: 'Expansão internacional rápida e comunicação assertiva global.',
    fullDescription: 'Muito mais que tradução literal, adaptamos gírias, contextos e tons de voz para o mercado local de destino.',
    howItWorks: 'Extração de conteúdo, tradução assistida por IA e revisão humana especializada.',
    benefits: [
      'Sites multi-idioma em tempo recorde',
      'Campanhas de anúncio localizadas',
      'Legendagem automática de vídeos',
      'Precisão técnica de glossário'
    ],
    suggestedPrice: 'A partir de R$ 0,15/palavra',
    deliveryTime: '3 a 7 dias',
    icon: Languages
  }
];
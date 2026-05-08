import { GeneratedSite } from "@/modules/prospecting/types";

export interface PrebuiltTemplate extends GeneratedSite {
  id: string;
  thumbnail: string;
}

export const PREBUILT_TEMPLATES: PrebuiltTemplate[] = [
  {
    id: 'automotive-premium',
    companyName: 'Elite Detailer',
    niche: 'Estética Automotiva',
    nicheManual: 'Automotivo',
    city: 'Sua Cidade',
    services: [
      'Polimento Técnico Multi-Etapas',
      'Vitrificação de Pintura Gyeon/CarPro',
      'Higienização Interna Premium com Ozônio',
      'Detalhamento de Motor e Chassis',
      'Proteção de Vidros e Plásticos',
      'PPF (Paint Protection Film)'
    ],
    differentials: [
      'Ambiente Climatizado e Controlado',
      'Iluminação de Inspeção de Última Geração',
      'Equipamentos e Insumos Internacionais',
      'Relatório Fotográfico de todo o Processo'
    ],
    whatsapp: '11999999999',
    tone: 'Premium',
    thumbnail: 'https://rmetppilvfrxosvxzhgj.supabase.co/storage/v1/object/public/message-attachments/1e3da6c5-8ccb-4578-870a-296f8464a6a6/1777336376909_enfw5j_image.png',
    explosionMode: true
  },
  {
    id: 'salao-beleza',
    companyName: 'Studio Glamour',
    niche: 'Salão de Beleza',
    nicheManual: 'Beleza & Estética',
    city: 'Sua Cidade',
    services: [
      'Corte & Styling',
      'Coloração (mechas, balayage, luzes)',
      'Maquiagem (social, noiva, editorial)',
      'Design de Sobrancelhas',
      'Manicure & Pedicure Premium',
      'Tratamentos Capilares (botox, hidratação)'
    ],
    differentials: [
      'Profissionais com formação internacional',
      'Ambiente sofisticado e climatizado',
      'Produtos premium nacionais e importados',
      'Plano de beleza personalizado para cada cliente'
    ],
    whatsapp: '558591583732',
    instagram: '@studio.glamour',
    tone: 'Premium',
    thumbnail: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&h=600&fit=crop',
    explosionMode: true
  },
  {
    id: 'barber-premium',
    companyName: 'Premium Brasil',
    niche: 'Barbearia & Lounge',
    nicheManual: 'Beleza & Estética',
    city: 'Limeira',
    services: [
      'Corte Premium',
      'Barba Tradicional',
      'Lounge Bar & Sinuca',
      'Limpeza de Pele',
      'Dia do Noivo',
      'Corte Kids'
    ],
    differentials: [
      'Profissionais Premiados',
      'Ambiente com Lounge Bar',
      'Produtos Importados',
      'Atendimento VIP'
    ],
    whatsapp: '558591583732',
    instagram: '@premium.brasil',
    tone: 'Premium',
    thumbnail: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&h=600&fit=crop',
    explosionMode: true
  },
  {
    id: 'energia-solar',
    companyName: 'Solar Energy Premium',
    niche: 'Energia Solar',
    nicheManual: 'Sustentabilidade',
    city: 'Fortaleza',
    services: [
      'Projetos Residenciais',
      'Projetos Comerciais',
      'Manutenção Preventiva',
      'Limpeza de Placas',
      'Monitoramento 24h',
      'Homologação'
    ],
    differentials: [
      'Economia de até 95%',
      'Payback em até 4 anos',
      'Garantia de 25 Anos',
      'Engenharia Própria'
    ],
    whatsapp: '558591583732',
    instagram: '@solarenergy.premium',
    tone: 'Premium',
    thumbnail: 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&h=600&fit=crop',
    explosionMode: true
  },
  {
    id: 'loja-veiculos',
    companyName: 'AutoDrive Premium',
    niche: 'Loja de Veículos',
    nicheManual: 'Automotivo',
    city: 'Sua Cidade',
    services: [
      'Venda de Veículos Premium',
      'Avaliação de Seminovos',
      'Financiamento Facilitado',
      'Consórcio Auto',
      'Seguro Automotivo',
      'Venda Consignada'
    ],
    differentials: [
      'Estoque com +200 Veículos',
      '15 Anos de Experiência',
      'Procedência 100% Verificada',
      'Avaliação Google 4.8 Estrelas'
    ],
    whatsapp: '558591583732',
    instagram: '@autodrive.premium',
    tone: 'Premium',
    thumbnail: 'https://images.unsplash.com/photo-1550355291-bbee04a92027?w=800&h=600&fit=crop',
    explosionMode: true
  },
  {
    id: 'loja-celular',
    companyName: 'Infinda Cel Premium',
    niche: 'Loja de Celulares',
    nicheManual: 'Tecnologia',
    city: 'Sua Cidade',
    services: [
      'Venda de iPhones',
      'Smartphones Android',
      'Acessórios Premium',
      'Assistência Técnica',
      'Troca com Troco',
      'Planos de Garantia'
    ],
    differentials: [
      'Frete Grátis acima de R$ 500',
      'Até 12x Sem Juros',
      'Garantia em todos os aparelhos',
      'Suporte Especializado'
    ],
    whatsapp: '558591583732',
    instagram: '@infinda.cel',
    tone: 'Premium',
    thumbnail: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&h=600&fit=crop',
    explosionMode: true
  },
  {
    id: 'loja-cosmeticos',
    companyName: 'Infinda Beauty',
    niche: 'Loja de Cosméticos',
    nicheManual: 'Beleza & Estética',
    city: 'Sua Cidade',
    services: [
      'Cuidados Faciais (Skincare)',
      'Maquiagem Premium',
      'Perfumes Importados',
      'Linha Profissional Capilar',
      'Kits Personalizados',
      'Linha Homem'
    ],
    differentials: [
      'Frete Grátis acima de R$ 99',
      '10% OFF no Pix',
      'Até 12x Sem Juros',
      'Troca Grátis em até 30 dias'
    ],
    whatsapp: '558591583732',
    instagram: '@infinda.beauty',
    tone: 'Premium',
    thumbnail: 'https://images.unsplash.com/photo-1596462502278-27bfdc4033c8?w=800&h=600&fit=crop',
    explosionMode: true
  },
  {
    id: 'centro-saude-beleza',
    companyName: 'Infinda Health & Beauty',
    niche: 'Centro de Saúde e Beleza',
    nicheManual: 'Beleza & Estética',
    city: 'Sua Cidade',
    services: [
      'Estética Facial Avançada',
      'Depilação a Laser Premium',
      'Harmonização Facial',
      'Protocolos Corporais',
      'Nutrição Estética',
      'Peeling de Diamante'
    ],
    differentials: [
      'Equipamentos de Última Geração',
      'Protocolos Exclusivos',
      'Atendimento Humanizado',
      'Resultados Comprovados'
    ],
    whatsapp: '558591583732',
    instagram: '@infinda.health',
    tone: 'Premium',
    thumbnail: 'https://images.unsplash.com/photo-1570172619380-4aa62587528a?w=800&h=600&fit=crop',
    explosionMode: true
  },
  {
    id: 'spa-saude',
    companyName: 'Infinda Zen Spa',
    niche: 'Spa de Saúde',
    nicheManual: 'Bem-estar',
    city: 'Sua Cidade',
    services: [
      'Massagem Relaxante com Pedras',
      'Banho de Ofurô Terapêutico',
      'Drenagem Linfática Detox',
      'Aromaterapia Personalizada',
      'Reflexologia Podal',
      'Day Spa Completo'
    ],
    differentials: [
      'Refúgio Urbano Exclusivo',
      'Terapeutas Especializados',
      'Produtos Orgânicos e Veganos',
      'Experiência Sensorial Única'
    ],
    whatsapp: '558591583732',
    instagram: '@infinda.spa',
    tone: 'Premium',
    thumbnail: 'https://images.unsplash.com/photo-1544161515-4af6b1d462c2?w=800&h=600&fit=crop',
    explosionMode: true
  },
  {
    id: 'esteticista-avancada',
    companyName: 'Infinda Estética',
    niche: 'Esteticista Especializada',
    nicheManual: 'Beleza & Estética',
    city: 'Sua Cidade',
    services: [
      'Limpeza de Pele Profunda',
      'Microagulhamento IPCA',
      'Jato de Plasma',
      'Tratamento de Melasma',
      'Drenagem Pós-Operatória',
      'Consultoria Estética Individual'
    ],
    differentials: [
      'Atendimento Personalizado',
      'Foco em Saúde da Pele',
      'Suporte Pós-Procedimento',
      'Insumos de Alta Performance'
    ],
    whatsapp: '558591583732',
    instagram: '@infinda.estetica',
    tone: 'Premium',
    thumbnail: 'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=800&h=600&fit=crop',
    explosionMode: true
  },
  {
    id: 'clinica-especializada',
    companyName: 'Infinda Biomedicina',
    niche: 'Clínica de Biomedicina Estética',
    nicheManual: 'Saúde & Estética',
    city: 'Sua Cidade',
    services: [
      'Bioestimuladores de Colágeno',
      'Preenchimento Labial',
      'Toxina Botulínica (Botox)',
      'Lipo de Papada Enzimática',
      'Fios de Sustentação',
      'Intradermoterapia'
    ],
    differentials: [
      'Direção Técnica Especializada',
      'Ambiente Hospitalar Seguro',
      'Produtos com Selo ANVISA',
      'Avaliação Clínica Completa'
    ],
    whatsapp: '558591583732',
    instagram: '@infinda.biomedicina',
    tone: 'Premium',
    thumbnail: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&h=600&fit=crop',
    explosionMode: true
  },
  {
    id: 'emagrecimento-saude',
    companyName: 'Infinda Slim Clinic',
    niche: 'Clínica de Emagrecimento',
    nicheManual: 'Saúde & Bem-estar',
    city: 'Sua Cidade',
    services: [
      'Protocolos de Emagrecimento Rápido',
      'Acompanhamento Nutricional',
      'Exames de Bioimpedância',
      'Criolipólise de Contraste',
      'Eletroestimulação Muscular',
      'Detox Corporal Intensivo'
    ],
    differentials: [
      'Método Científico Comprovado',
      'Equipe Multidisciplinar',
      'Suporte Motivacional 24h',
      'Plano Alimentar Flexível'
    ],
    whatsapp: '558591583732',
    instagram: '@infindaslim',
    tone: 'Premium',
    thumbnail: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop',
    explosionMode: true
  },
  {
    id: 'massoterapia-estetica',
    companyName: 'Infinda Massoterapia',
    niche: 'Massoterapia e Estética',
    nicheManual: 'Saúde & Bem-estar',
    city: 'Sua Cidade',
    services: [
      'Liberação Miofascial',
      'Massagem Modeladora Turbo',
      'Shiatsu Tradicional',
      'Quiropraxia Clínica',
      'Drenagem para Gestantes',
      'Massagem Desportiva'
    ],
    differentials: [
      'Especialistas em Anatomia',
      'Alívio Imediato de Dores',
      'Ambiente Terapêutico',
      'Técnicas Orientais e Ocidentais'
    ],
    whatsapp: '558591583732',
    instagram: '@infinda.masso',
    tone: 'Premium',
    thumbnail: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=800&h=600&fit=crop',
    explosionMode: true
  },
  {
    id: 'escola-estetica',
    companyName: 'Infinda Academy Estética',
    niche: 'Escola Técnica de Estética',
    nicheManual: 'Educação',
    city: 'Sua Cidade',
    services: [
      'Curso de Estética Facial',
      'Formação em Massoterapia',
      'Especialização em Podologia',
      'Workshop de Microagulhamento',
      'Curso de Design de Sobrancelhas',
      'Pós-Graduação em Estética'
    ],
    differentials: [
      'Certificado Reconhecido',
      'Aulas Práticas em Modelos',
      'Material Didático Incluso',
      'Encaminhamento para o Mercado'
    ],
    whatsapp: '558591583732',
    instagram: '@infinda.academy',
    tone: 'Premium',
    thumbnail: 'https://images.unsplash.com/photo-1516534775068-ba3e84529519?w=800&h=600&fit=crop',
    explosionMode: true
  },
  {
    id: 'consultorio-enfermagem',
    companyName: 'Infinda Enfermagem Estética',
    niche: 'Consultório de Enfermagem',
    nicheManual: 'Saúde',
    city: 'Sua Cidade',
    services: [
      'Tratamento de Feridas Complexas',
      'Soroterapia de Vitaminas',
      'Ozonioterapia Médica',
      'Laserterapia em Cicatrizes',
      'Consultoria em Amamentação',
      'Cuidados Pós-Cirúrgicos'
    ],
    differentials: [
      'Segurança do Paciente',
      'Rigor Técnico e Ético',
      'Monitoramento de Sinais Vitais',
      'Equipamentos de Grau Hospitalar'
    ],
    whatsapp: '558591583732',
    instagram: '@infinda.enfermagem',
    tone: 'Premium',
    thumbnail: 'https://images.unsplash.com/photo-1584432810601-6c7f27d2362b?w=800&h=600&fit=crop',
    explosionMode: true
  },
  {
    id: 'policlinica-estetica',
    companyName: 'Infinda Policlínica',
    niche: 'Policlínica de Saúde Estética',
    nicheManual: 'Saúde & Estética',
    city: 'Sua Cidade',
    services: [
      'Dermatologia Clínica',
      'Cirurgia Plástica Reparadora',
      'Endocrinologia e Metabologia',
      'Ginecologia Regenerativa',
      'Angiologia (Varizes)',
      'Exames Laboratoriais'
    ],
    differentials: [
      'Centro Médico Multidisciplinar',
      'Tecnologia Diagnóstica',
      'Corpo Clínico Renomado',
      'Conforto e Conveniência'
    ],
    whatsapp: '558591583732',
    instagram: '@infinda.policlinica',
    tone: 'Premium',
    thumbnail: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&h=600&fit=crop',
    explosionMode: true
  },
  {
    id: 'bellahair-premium',
    companyName: 'Bella Hair',
    niche: 'Mega Hair & Extensões Premium',
    nicheManual: 'Beleza & Estética',
    city: 'Sua Cidade',
    services: [
      'Mega Hair Adesivo Fibra Europeia',
      'Apliques Tic Tac Invisível',
      'Cabelos Humanos Selecionados',
      'Perucas e Laces de Luxo',
      'Próteses Capilares',
      'Rabo de Cavalo Natural'
    ],
    differentials: [
      'Maior variedade de cabelos do Brasil',
      'Fibras tecnológicas e naturais',
      'Atendimento especializado',
      'Produtos com certificação de origem'
    ],
    whatsapp: '5511999999999',
    instagram: '@bellahairbrasil',
    tone: 'Premium',
    thumbnail: 'https://images.unsplash.com/photo-1634449571010-02389ed0f9b0?w=800&h=600&fit=crop',
    explosionMode: true
  }
];

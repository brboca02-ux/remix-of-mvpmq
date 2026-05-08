import { ProspectLead, MessageObjective, LeadPsychologicalProfile, LeadEmotion } from './types';

export const generatePitch = (lead: ProspectLead, objective: MessageObjective = 'open_conversation', profile?: LeadPsychologicalProfile, emotion?: LeadEmotion) => {
  const { companyName, niche, city, source, instagramHandle, socialDiscovery, behavioral_profile, real_time_strategy } = lead;
  const nicheText = niche || 'seu negócio';
  const activeProfile = profile || behavioral_profile || 'Analítico';
  const activeStrategy = real_time_strategy || '';
  
  const nicheLower = nicheText.toLowerCase();
  const cityText = city ? ` em ${city}` : '';
  const hasInstagram = instagramHandle || socialDiscovery?.instagramHandle;
  const isPremiumNiche = nicheLower.includes('barbearia') || nicheLower.includes('estética') || nicheLower.includes('clínica');

  const openers = [
    `Olá, ${companyName}, tudo bem?`,
    `Oi ${companyName}, como vocês estão?`,
    `Tudo bem, ${companyName}?`,
    `Olá pessoal da ${companyName}!`,
  ];
  const opener = openers[Math.floor(Math.random() * openers.length)];

  let messageBody = "";
  let cta = "";

  switch (objective) {
    case 'open_conversation':
      if (emotion === 'Interesse') {
        messageBody = `Perfeito que você gostou! Pelo que vi da ${companyName}, acho que podemos avançar bem rápido.`;
        cta = `Que tal uma breve conversa amanhã para alinharmos?`;
        break;
      }
      if (emotion === 'Resistência') {
        messageBody = `Tranquilo, não quero incomodar. Vou deixar meu contato aqui caso mude de ideia no futuro.`;
        cta = `Sucesso com a ${companyName}!`;
        break;
      }
      if (emotion === 'Pressa') {
        messageBody = `Vou ser bem direto para não tomar seu tempo.`;
        cta = `Topa 2 minutos de call amanhã?`;
        break;
      }
      if (activeProfile === 'Direto') {
        messageBody = `Vi o perfil da ${companyName} e tenho uma proposta objetiva de ROI para vocês.`;
        cta = `Podemos falar um minuto amanhã?`;
        break;
      }
      if (activeProfile === 'Analítico') {
        messageBody = `Analisei os dados de mercado da ${companyName} e identifiquei um potencial de escala de 20% com automação de prospecção.`;
        cta = `Gostaria de ver os números dessa análise?`;
        break;
      }
      if (activeProfile === 'Desconfiado') {
        messageBody = `Entendo que o mercado está saturado de promessas, por isso já adianto resultados reais de outros clientes de ${nicheText} que atendemos.`;
        cta = `Posso te enviar um PDF com esses 3 estudos de caso sem compromisso?`;
        break;
      }
      messageBody = hasInstagram 
        ? `Vi o perfil de vocês no Instagram e achei o trabalho excelente. Percebi que vocês já têm uma audiência legal por lá.`
        : `Estava pesquisando sobre ${nicheText}${cityText} e encontrei o negócio de vocês.`;
      cta = `Podemos conversar um minuto sobre como atrair mais clientes via Google?`;
      break;
    case 'generate_curiosity':
      messageBody = `Notei um detalhe estratégico na presença digital da ${companyName} que pode estar fazendo vocês perderem clientes para a concorrência local.`;
      cta = `Montei uma prévia de como resolver isso. Gostaria de ver?`;
      break;
    case 'qualify_lead':
      messageBody = `Vi que vocês atendem em ${city}. Vocês já têm um sistema automático para converter quem busca por ${nicheText} no Google em contatos no WhatsApp?`;
      cta = `Se eu te mostrasse um modelo que faz isso, faria sentido para a ${companyName} hoje?`;
      break;
    case 'book_meeting':
      messageBody = `Estou ajudando outras empresas de ${nicheText} a aumentarem seu faturamento em até 30% com sites de alta conversão.`;
      cta = `Teria disponibilidade para uma call rápida de 10 min amanhã para eu te mostrar os números?`;
      break;
  }

  const whatsappShort = `${opener} ${messageBody} ${cta}`;

  // Playbook generation
  let playbookData = {
    approachStrategy: "Foco em profissionalismo e conversão direta.",
    contentSuggestions: ["Destaque de serviços", "Depoimentos de clientes", "Botão de WhatsApp visível"],
    objectionHandling: [
      { trigger: "Já temos Instagram", response: "O Instagram é ótimo para alcance, mas um site é onde você fecha a venda e controla a experiência do cliente." }
    ]
  };

  if (nicheLower.includes('barbearia') || nicheLower.includes('barber')) {
    playbookData = {
      approachStrategy: "Abordagem visual premium com foco em estilo e exclusividade.",
      contentSuggestions: ["Fotos do ambiente", "Portfólio de cortes", "Mapa de localização dinâmica", "Instagram Feed integrado", "Design premium gold & black"],
      objectionHandling: [
        { trigger: "Agendamos por Direct", response: "Um site profissional com mapa e serviços claros reduz o tempo de atendimento e passa muito mais autoridade." }
      ]
    };
  } else if (nicheLower.includes('clínica') || nicheLower.includes('estética')) {
// ... keep existing code
  } else if (nicheLower.includes('tecnologia') || nicheLower.includes('marketing')) {
// ... keep existing code
  }

  return {
    whatsappShort,
    whatsappConsultative: `Olá, ${companyName}! Sou especialista em presença digital. Estava analisando o mercado de ${nicheText}${cityText} e notei que sua empresa tem um ótimo potencial, mas falta um site para converter quem busca no Google. Criei um modelo estratégico de site focado em vendas para vocês. Gostaria de ver como ficou?`,
    instagramDirect: `Oi ${companyName}, vi seu perfil. Trabalho com prospecção de empresas como a sua. Posso te enviar uma proposta rápida?`,
    linkedinOutreach: `Olá ${companyName}, vi seu perfil e acredito que podemos ter sinergia em prospecção. Vamos nos conectar?`,
    coldMail1: `Olá {{nome_decisor}},\n\nVi que vocês [dor principal: ex. "lutam com geração de leads consistentes"].\nTrabalho com empresas como {{empresa}} ajudando a resolver isso com resultados de +30% em reuniões qualificadas.\n\nPosso te mostrar como fizemos isso de forma simples?\n\nAbraços,\n{{seu_nome}}`,
    whatsapp1: `Olá ${companyName}, tudo bem? Estou procurando o responsável por vendas ou prospecção. Pode me direcionar? Obrigado!`,
    followup24h: `Oi ${companyName}, passando para confirmar se recebeu minha mensagem anterior sobre o site demonstrativo que fiz para vocês. Acredito que pode ajudar muito na conversão de novos clientes.`,
    followup72h: `Oi ${companyName}, tudo bem? Ainda não tivemos a chance de conversar sobre a melhoria da presença digital da ${companyName}. O mercado de ${nicheText} está cada vez mais competitivo e um site profissional é o diferencial. Vamos agendar uma conversa rápida?`,
    playbook: playbookData
  };
};

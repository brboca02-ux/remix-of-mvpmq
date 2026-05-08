import { GeneratedSite } from "@/modules/prospecting/types";

export type PremiumNiche = 
  | 'Barbearia' 
  | 'Restaurante' 
  | 'Salão de Beleza' 
  | 'Clínica / Estética' 
  | 'Consultivo / Profissional' 
  | 'Tecnologia / Marketing' 
  | 'Automotivo'
  | 'Outro';

export const detectPremiumNiche = (site: Partial<GeneratedSite>): PremiumNiche => {
  if (site.nicheManual) return site.nicheManual as PremiumNiche;

  const text = `${site.companyName} ${site.niche} ${site.rawDataInput}`.toLowerCase();

  if (text.includes('barbearia') || text.includes('barber')) return 'Barbearia';
  if (text.includes('restaurante') || text.includes('gastronomia') || text.includes('comida') || text.includes('food')) return 'Restaurante';
  if (text.includes('beleza') || text.includes('salão') || text.includes('hair') || text.includes('cabelo')) return 'Salão de Beleza';
  if (text.includes('clínica') || text.includes('estética') || text.includes('médico') || text.includes('dentista')) return 'Clínica / Estética';
  if (text.includes('advogado') || text.includes('contador') || text.includes('consultoria') || text.includes('jurídico')) return 'Consultivo / Profissional';
  if (text.includes('marketing') || text.includes('tecnologia') || text.includes('software') || text.includes('digital')) return 'Tecnologia / Marketing';
  if (text.includes('automotivo') || text.includes('carro') || text.includes('estética automotiva') || text.includes('oficina')) return 'Automotivo';

  return 'Outro';
};

export const extractContentFromRaw = (rawData: string) => {
  const lines = rawData.split('\n').map(l => l.trim()).filter(l => l.length > 3);
  
  // IA-style extraction and copywriting suggestions
  const services = lines.filter(l => 
    l.toLowerCase().includes('serviço') || 
    l.toLowerCase().includes('procedimento') ||
    (l.length > 5 && l.length < 40 && !l.includes('http'))
  ).slice(0, 6).map(s => s.replace(/^[-\d.]+\s*/, ''));

  const differentials = lines.filter(l => 
    l.length > 25 && 
    l.length < 120 && 
    (l.toLowerCase().includes('garantia') || l.toLowerCase().includes('desde') || l.toLowerCase().includes('melhor') || l.toLowerCase().includes('especialista'))
  ).slice(0, 4);

  // Generate a premium headline based on detected keywords
  let suggestedHeadline = "";
  if (rawData.toLowerCase().includes('premium')) suggestedHeadline = "Experiência Digital de Alto Padrão";
  else if (rawData.toLowerCase().includes('rápido')) suggestedHeadline = "Agilidade e Resultados em Foco";

  return {
    services: services.length > 0 ? services : undefined,
    differentials: differentials.length > 0 ? differentials : undefined,
    suggestedHeadline
  };
};

export const getThemeConfig = (niche: PremiumNiche) => {
  switch (niche) {
    case 'Barbearia':
      return {
        bg: 'bg-[#0a0a0a]',
        text: 'text-zinc-100',
        accent: '#fbbf24',
        accentHover: '#f59e0b',
        accentText: 'text-black',
        cardBg: 'bg-zinc-900',
        border: 'border-zinc-800',
        fontFamily: "'Montserrat', sans-serif",
        tagline: 'BARBEARIA & ESTÉTICA MASCULINA'
      };
    case 'Restaurante':
      return {
        bg: 'bg-[#0f0505]',
        text: 'text-orange-50',
        accent: '#f97316',
        accentHover: '#ea580c',
        accentText: 'text-white',
        cardBg: 'bg-[#1a0c0c]',
        border: 'border-orange-900/30',
        fontFamily: "'Lora', serif",
        tagline: 'GASTRONOMIA & SABOR INIGUALÁVEL'
      };
    case 'Salão de Beleza':
      return {
        bg: 'bg-[#fff5f7]',
        text: 'text-zinc-900',
        accent: '#ec4899',
        accentHover: '#db2777',
        accentText: 'text-white',
        cardBg: 'bg-white',
        border: 'border-pink-100',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        tagline: 'REALÇANDO SUA BELEZA NATURAL'
      };
    case 'Clínica / Estética':
      return {
        bg: 'bg-[#0f1115]',
        text: 'text-white',
        accent: '#ff4d6d',
        accentHover: '#ff758f',
        accentText: 'text-white',
        cardBg: 'bg-[#161920]',
        border: 'border-white/5',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        tagline: 'CLÍNICA DE ESTÉTICA PREMIUM'
      };
    case 'Consultivo / Profissional':
      return {
        bg: 'bg-[#0f172a]', // Navy Blue
        text: 'text-slate-100',
        accent: '#fbbf24', // Gold details
        accentHover: '#f59e0b',
        accentText: 'text-black',
        cardBg: 'bg-[#1e293b]',
        border: 'border-slate-700',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        tagline: 'CONSULTORIA & ESTRATÉGIA PROFISSIONAL'
      };
    case 'Tecnologia / Marketing':
      return {
        bg: 'bg-[#050505]',
        text: 'text-white',
        accent: '#3b82f6',
        accentHover: '#60a5fa',
        accentText: 'text-white',
        cardBg: 'bg-[#111111]',
        border: 'border-white/10',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        tagline: 'TECNOLOGIA & INOVAÇÃO'
      };
    case 'Automotivo':
      return {
        bg: 'bg-[#0a0a0a]', // Preto profundo
        text: 'text-white',
        accent: '#e11d48', // Vermelho impactante (Rose 600)
        accentHover: '#f43f5e', // Vermelho mais claro
        accentText: 'text-white',
        cardBg: 'bg-[#121212]', // Card cinza muito escuro
        border: 'border-white/5',
        fontFamily: "'Montserrat', 'Roboto', sans-serif",
        tagline: 'ESTÉTICA AUTOMOTIVA PREMIUM'
      };
    default:
      return {
        bg: 'bg-[#0f1115]',
        text: 'text-white',
        accent: '#3b82f6',
        accentHover: '#60a5fa',
        accentText: 'text-white',
        cardBg: 'bg-[#161920]',
        border: 'border-white/5',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        tagline: 'REFERÊNCIA & EXCELÊNCIA'
      };
  }
};

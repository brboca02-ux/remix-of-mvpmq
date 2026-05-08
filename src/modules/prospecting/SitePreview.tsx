import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { navigationService } from '@/lib/navigation-service';
import { proposalStorage } from '@/lib/proposal-storage';
import { GeneratedSite } from './types';
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';
import { 
  Copy, 
  Smartphone, 
  Monitor, 
  Tablet,
  FileDown, 
  Loader2,
  ExternalLink,
  Info,
  MessageCircle,
  ArrowRight,
  Star,
  CheckCircle2,
  Clock,
  ShieldCheck,
  TrendingUp,
  MapPin,
  Instagram,
  Zap,
  ChevronDown
} from "lucide-react";
import { toast } from "sonner";
import { detectPremiumNiche, getThemeConfig, PremiumNiche } from '@/lib/premium-niche-engine';
import { Navigation } from 'lucide-react';
import { RevenueSimulator } from '@/components/proposal/RevenueSimulator';
// Browser-only imports moved to dynamic imports inside downloadPdf

interface SitePreviewProps {
  site: GeneratedSite;
  activeSection?: string;
  viewMode?: 'desktop' | 'tablet' | 'mobile';
  onExportingChange?: (exporting: boolean) => void;
  hideToolbar?: boolean;
  mode?: 'editor' | 'public';
}

type TemplateType = 'clinic' | 'tech' | 'consultive' | 'professional';

export const SitePreview: React.FC<SitePreviewProps> = ({ 
  site, 
  activeSection, 
  viewMode = 'desktop',
  onExportingChange,
  hideToolbar = false,
  mode = 'editor'
}) => {
  if (!site) return null;

  const [isExporting, setIsExporting] = React.useState(false);
  const previewRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    onExportingChange?.(isExporting);
  }, [isExporting, onExportingChange]);

  const getTemplateType = (): TemplateType => {
    const niche = site.niche?.toLowerCase() || '';
    if (niche.includes('estética') || niche.includes('clínica') || niche.includes('médico') || niche.includes('saúde') || niche.includes('bem-estar') || niche.includes('dentista')) {
      return 'clinic';
    }
    if (niche.includes('marketing') || niche.includes('tecnologia') || niche.includes('software') || niche.includes('tráfego') || niche.includes('digital') || niche.includes('agência')) {
      return 'tech';
    }
    if (niche.includes('advogado') || niche.includes('contador') || niche.includes('engenheiro') || niche.includes('jurídico') || niche.includes('consultoria')) {
      return 'consultive';
    }
    return 'professional';
  };

  const template = getTemplateType();

  const getHeadline = () => {
    const city = site.city || 'sua região';
    const niche = site.niche || 'Serviços Profissionais';
    const isExplosion = site.explosionMode;

    if (isExplosion) {
      if (niche.toLowerCase().includes('barbearia')) return "Transforme sua barbearia em uma marca desejada na região.";
      if (niche.toLowerCase().includes('restaurante')) return "Faça mais clientes encontrarem, desejarem e visitarem seu restaurante.";
      if (niche.toLowerCase().includes('clínica') || niche.toLowerCase().includes('estética')) return "Converta atenção em agendamentos com uma presença premium.";
      if (niche.toLowerCase().includes('automotivo')) return "Mostre o valor do seu serviço antes do cliente pedir preço.";
      return "Transmita autoridade máxima antes mesmo do primeiro contato.";
    }

    if (niche.toLowerCase().includes('estética automotiva')) {
      return `Estética automotiva premium em ${city}`;
    }
    
    switch (template) {
      case 'clinic':
        return `Beleza, cuidado e autoestima em ${city}`;
      case 'tech':
        return `Estratégia digital para negócios que querem crescer`;
      case 'consultive':
        return `Autoridade, confiança e solução profissional em ${city}`;
      default:
        return `Referência em ${niche} em ${city}`;
    }
  };

  const getTheme = () => {
    const headline = getHeadline();
    const city = site.city || 'sua região';
    const niche = detectPremiumNiche(site);
    const config = getThemeConfig(niche);
    
    return {
      ...config,
      heroTitle: headline,
      heroSub: site.explosionMode 
        ? `Pare de perder clientes para a concorrência por falta de um posicionamento digital de alto padrão. Eleve o nível da ${site.companyName} agora.`
        : config.tagline.includes('BARBEARIA') 
        ? `A experiência definitiva em cuidados masculinos em ${city}. Tradição e estilo em um ambiente exclusivo projetado para o homem moderno.`
        : config.tagline.includes('GASTRONOMIA')
        ? `Uma jornada culinária inesquecível em ${city}. Ingredientes selecionados e paixão em cada prato servido.`
        : config.tagline.includes('BELEZA')
        ? `O refúgio perfeito para cuidar de você em ${city}. Elegância, técnica e os melhores produtos para transformar seu visual.`
        : config.tagline.includes('CLÍNICA')
        ? `Tratamentos personalizados com tecnologia de ponta em ${city}. Veja como um ambiente sofisticado e acolhedor pode transformar sua autoestima.`
        : config.tagline.includes('ESTÉTICA AUTOMOTIVA')
        ? `Proteção, brilho e valorização para o seu veículo em ${city}. Especialistas em detalhamento automotivo de alto padrão.`
        : config.tagline.includes('TECNOLOGIA')
        ? `Impulsione seu negócio em ${city} com soluções digitais de alta performance. Estratégia, design e resultados mensuráveis.`
        : config.tagline.includes('CONSULTORIA')
        ? `Excelência técnica e comprometimento em ${city}. Transformamos desafios complexos em soluções eficientes e seguras.`
        : `Aumente sua visibilidade em ${city} com um posicionamento profissional. Otimize sua captação de clientes e destaque-se da concorrência local.`
    };
  };

  const theme = getTheme();

  const formattedWhatsapp = useMemo(() => {
    if (!site.whatsapp) return '';
    const clean = String(site.whatsapp).replace(/\D/g, '');
    return clean.length === 11 ? `55${clean}` : (clean.length === 10 ? `55${clean}` : clean);
  }, [site.whatsapp]);

  const waLink = `https://wa.me/${formattedWhatsapp}`;

  const handleWhatsAppClick = (e: React.MouseEvent, location: string) => {
    e.preventDefault();
    const targetLink = e.currentTarget.getAttribute('href') || waLink;
    navigationService.handleCTA('whatsapp_contact', { 
      company: site.companyName, 
      location,
      whatsapp: site.whatsapp 
    }, () => {
      navigationService.openExternal(targetLink);
    });
  };

  const downloadPdf = async () => {
    if (typeof window === 'undefined' || !previewRef.current) return;
    
    setIsExporting(true);
    const toastId = toast.loading("Gerando PDF da proposta...");

    try {
      const element = previewRef.current;
      const targetElement = document.getElementById('public-proposal-render') || 
                          previewRef.current?.querySelector('#public-proposal-render') || 
                          (hideToolbar ? previewRef.current : previewRef.current?.querySelector('.overflow-y-auto'));

      if (!targetElement) throw new Error("Container de renderização não encontrado");

      // Clone the content to modify it for PDF
      const clone = targetElement.cloneNode(true) as HTMLElement;
      clone.style.width = '1200px';
      clone.style.height = 'auto';
      clone.style.maxHeight = 'none';
      clone.style.overflow = 'visible';
      clone.classList.remove('overflow-y-auto', 'h-full', 'max-h-full', 'flex', 'flex-col');
      clone.style.display = 'block';
      clone.style.backgroundColor = theme.bg === 'bg-[#0a0a0a]' ? '#0a0a0a' : (template === 'tech' ? '#050505' : '#0f1115');
      
      // Ensure specific elements are visible in PDF
      clone.querySelectorAll('[id^="localizacao"], [id^="instagram-feed"], [id^="google-reviews"]').forEach((el) => {
        (el as HTMLElement).style.opacity = '1';
        (el as HTMLElement).style.transform = 'none';
      });
      
      const stickyNav = clone.tagName === 'NAV' ? clone : clone.querySelector('nav');
      if (stickyNav) {
        stickyNav.style.position = 'relative';
        stickyNav.style.backdropFilter = 'none';
        // @ts-ignore
        stickyNav.style.webkitBackdropFilter = 'none';
      }

      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.appendChild(clone);
      document.body.appendChild(container);

      const opt = {
        margin: [0, 0, 0, 0] as [number, number, number, number],
        filename: `Proposta_${site.companyName.replace(/\s+/g, '_')}.pdf`,
        image: { type: 'jpeg' as const, quality: 1.0 },
        html2canvas: { 
          scale: 2, 
          useCORS: true, 
          logging: false,
          letterRendering: true,
          backgroundColor: theme.bg === 'bg-[#0a0a0a]' ? '#0a0a0a' : (template === 'tech' ? '#050505' : '#0f1115'),
        },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const, compress: true }
      };

      // Ensure dynamic import is protected from SSR analysis
      // We use the variable 'window' presence as the guard and vite-ignore
      const { default: html2pdf } = await import(/* @vite-ignore */ 'html2pdf.js');
      await html2pdf().from(clone).set(opt).save();

      document.body.removeChild(container);
      toast.success("PDF baixado com sucesso!", { id: toastId });
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Falha ao gerar o PDF. Tente novamente.", { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  const copyHtml = () => {
    const html = `
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${site.companyName} | ${site.niche}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Playfair+Display:wght@700&family=Montserrat:wght@700;800&family=Merriweather:wght@700&display=swap" rel="stylesheet">
    <style>
        body { font-family: ${theme.fontFamily}; scroll-behavior: smooth; }
        .bg-custom { background-color: ${template === 'tech' ? '#050505' : (template === 'clinic' ? '#0f1115' : (template === 'consultive' ? '#0a0c10' : '#0f1115'))}; }
        .text-accent { color: ${theme.accent}; }
        .bg-accent { background-color: ${theme.accent}; }
        .border-accent { border-color: ${theme.accent}; }
        .cta-shadow { box-shadow: 0 20px 40px -15px ${theme.accent}60; }
        .glass { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.1); }
        .card-hover { transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        .card-hover:hover { transform: translateY(-12px); box-shadow: 0 30px 60px -15px rgba(0,0,0,0.3); background-color: ${theme.accent}10; }
        .img-hover { transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1); }
        .group:hover .img-hover { transform: scale(1.1); }
        .bg-gradient-hero { background: linear-gradient(180deg, rgba(15,17,21,0.8), rgba(15,17,21,1)), url('https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=2000'); background-size: cover; background-position: center; }
        @media print {
            .no-print { display: none; }
            body { -webkit-print-color-adjust: exact; }
        }
    </style>
</head>
<body class="bg-custom ${theme.text} leading-relaxed overflow-x-hidden">
    <nav class="py-6 px-8 sticky top-0 z-50 transition-all ${template === 'clinic' || template === 'professional' ? 'bg-white/90 backdrop-blur-xl border-b shadow-sm' : 'bg-black/90 backdrop-blur-xl border-b border-white/10'}">
        <div class="container mx-auto flex justify-between items-center">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-xl shadow-lg" style="background-color: ${theme.accent}">
                    ${site.companyName.charAt(0).toUpperCase()}
                </div>
                <h1 class="text-2xl font-black tracking-tighter uppercase">${site.companyName}</h1>
            </div>
            <a href={waLink} onClick={(e) => handleWhatsAppClick(e, 'navbar')} target="_blank" rel="noopener noreferrer" class="hidden sm:flex bg-accent px-8 py-3 rounded-full font-black text-sm hover:scale-105 transition-all shadow-xl cta-shadow" style="background-color: ${theme.accent}; color: ${theme.accentText}">${site.explosionMode ? 'AGIR AGORA' : 'FALAR NO WHATSAPP'}</a>
        </div>
    </nav>

    <header id="hero" class="relative py-48 overflow-hidden bg-gradient-hero">
        <div class="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full opacity-20 pointer-events-none">
            <div class="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[120px]" style="background-color: ${theme.accent}"></div>
            <div class="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[120px]" style="background-color: ${theme.accent}"></div>
        </div>
        
        <div class="container mx-auto px-6 text-center relative z-10">
            <div class="inline-flex items-center gap-2 py-2 px-6 rounded-full border border-white/10 bg-white/5 text-[10px] font-black tracking-[0.3em] uppercase mb-8 backdrop-blur-md">
                <span class="w-2 h-2 rounded-full animate-pulse" style="background-color: ${theme.accent}"></span>
                ${theme.tagline}
            </div>
            <h2 class="text-6xl md:text-9xl font-black mb-10 leading-[1] tracking-tighter max-w-6xl mx-auto uppercase">
                ${theme.heroTitle.split(' ').map((word, i) => i % 2 === 1 ? `<span style="color: ${theme.accent}; font-style: italic;">${word}</span>` : word).join(' ')}
            </h2>
            <p class="text-xl md:text-2xl opacity-70 mb-14 max-w-3xl mx-auto font-medium leading-relaxed">
                ${theme.heroSub}
            </p>
            <div class="flex flex-col sm:flex-row gap-6 justify-center items-center">
                <a href="${waLink}" target="_blank" class="bg-accent text-xl px-16 py-6 rounded-2xl font-black shadow-2xl hover:opacity-90 transition-all active:scale-95 group relative overflow-hidden cta-shadow" style="background-color: ${theme.accent}; color: ${theme.accentText}; text-decoration: none;">
                    <span class="relative z-10">${site.explosionMode ? 'GARANTIR MEU HORÁRIO' : 'CONHEÇA NOSSOS PROCEDIMENTOS'}</span>
                </a>
            </div>
        </div>
    </header>

    <section id="beneficios" class="py-32 border-y border-current/5">
        <div class="container mx-auto px-6">
            <div class="text-center mb-20">
                <h3 class="text-xs font-black uppercase tracking-[0.4em] mb-4" style="color: ${theme.accent}">Diferenciais Estratégicos</h3>
                <h2 class="text-4xl md:text-6xl font-black tracking-tight">Por que somos a escolha certa?</h2>
            </div>
            <div class="grid md:grid-cols-4 gap-12">
                ${[
                    { title: 'Salas Individuais', icon: '🛡️', desc: 'Privacidade e conforto em cada atendimento personalizado.' },
                    { title: 'Amplo Estacionamento', icon: '🕒', desc: 'Estacionamento exclusivo e gratuito para nossos clientes.' },
                    { title: 'Confiança Total', icon: '🤝', desc: 'Processos transparentes e suporte dedicado.' },
                    { title: 'Alta Performance', icon: '📈', desc: 'Tecnologia de ponta para resultados surpreendentes.' }
                ].map(item => `
                <div class="p-12 rounded-[3rem] card-hover bg-[#161920] border border-white/5 text-center">
                    <div class="w-20 h-20 rounded-[1.5rem] flex items-center justify-center text-4xl mb-8 mx-auto" style="background-color: ${theme.accent}15; color: ${theme.accent}">${item.icon}</div>
                    <h4 class="font-black text-2xl mb-4 uppercase tracking-tighter">${item.title}</h4>
                    <p class="text-sm opacity-60 leading-relaxed">${item.desc}</p>
                </div>
                `).join('')}
            </div>
        </div>
    </section>

    <section id="servicos" class="py-48">
        <div class="container mx-auto px-6">
            <div class="text-center mb-24">
                <h3 class="text-xs font-black uppercase tracking-[0.4em] mb-4" style="color: ${theme.accent}">Procedimentos</h3>
                <h2 class="text-5xl md:text-8xl font-black tracking-tighter uppercase mb-6">Nossas <span style="color: ${theme.accent}; font-style: italic;">Soluções</span></h2>
                <p class="text-xl opacity-60 max-w-2xl mx-auto">
                    ${site.explosionMode 
                        ? "Soluções estratégicas desenhadas para gerar autoridade e lucro imediato para sua empresa."
                        : `Serviços personalizados desenvolvidos com o que há de mais moderno no mercado de ${site.city}.`}
                </p>
            </div>
            <div class="grid md:grid-cols-3 gap-12">
                ${(site.services || ['Serviço 1', 'Serviço 2', 'Serviço 3']).map((s, i) => `
                <div class="group relative overflow-hidden rounded-[3rem] aspect-[4/5] flex flex-col justify-end p-10 card-hover ${template === 'clinic' || template === 'professional' ? 'bg-slate-50' : 'bg-white/5 border border-white/10'}">
                    <div class="absolute inset-0 bg-cover bg-center img-hover opacity-60" style="background-image: url('https://images.unsplash.com/photo-${[
                        '1460925895917-afdab827c52f',
                        '1486406146926-c627a92ad1ab',
                        '1507679799987-c73779587ccf',
                        '1557804506-669a67965ba0',
                        '1542744173-8e7e53415bb0'
                    ][i % 5]}?auto=format&fit=crop&q=80&w=800')" loading="lazy"></div>
                    <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
                    <div class="relative z-10">
                        <span class="font-bold text-xs tracking-widest uppercase mb-2 block" style="color: ${theme.accent}">SOLUÇÃO 0${i+1}</span>
                        <h4 class="text-3xl font-black mb-6 text-white">${s}</h4>
                        <a href="${waLink}&text=${encodeURIComponent(`Olá! Gostaria de saber mais sobre o serviço: ${s}`)}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 bg-accent text-white px-8 py-4 rounded-2xl font-black text-sm hover:scale-105 transition-all shadow-xl" style="background-color: ${theme.accent};">
                            AGENDAR AGORA
                        </a>
                    </div>
                </div>
                `).join('')}
            </div>
        </div>
    </section>

    <section id="prova-social" class="py-32" style="background-color: ${theme.accent}05">
        <div class="container mx-auto px-6 text-center">
            <h2 class="text-6xl md:text-9xl font-black mb-24 tracking-tighter uppercase">Voz de quem <span style="color: ${theme.accent}; font-style: italic;">confia</span></h2>
            <div class="max-w-4xl mx-auto">
            ${site.explosionMode ? `
                <div class="mb-24 p-12 rounded-[3rem] bg-white/5 border border-white/10 backdrop-blur-xl">
                    <h3 class="text-2xl font-black mb-6 uppercase tracking-tighter" style="color: ${theme.accent}">Por que agir agora?</h3>
                    <p class="text-lg opacity-80 leading-relaxed mb-8">
                        Cada dia sem um posicionamento digital profissional é um dia que seu cliente ideal escolhe o concorrente. O mercado de ${site.niche} em ${site.city} está evoluindo e sua empresa merece o topo.
                    </p>
                </div>
            ` : ''}
                <div class="p-20 rounded-[4rem] relative bg-[#161920] border border-white/5 shadow-2xl">
                    <div class="text-6xl opacity-20 absolute top-10 left-10" style="color: ${theme.accent}">"</div>
                    <p class="text-2xl md:text-3xl font-bold italic mb-12 leading-relaxed relative z-10">
                        "A ${site.companyName} transformou nossa operação em ${site.city}. A presença digital que construíram nos trouxe um nível de clientes que nunca havíamos alcançado antes."
                    </p>
                    <div class="flex flex-col items-center gap-4">
                        <div class="w-24 h-20 rounded-2xl overflow-hidden border-2 shadow-xl" style="border-color: ${theme.accent}">
                            <img src="https://i.pravatar.cc/150?u=${site.companyName}" class="w-full h-full object-cover" loading="lazy">
                        </div>
                        <div class="flex text-[#ff4d6d] text-2xl mb-4">★★★★★</div>
                        <div>
                            <p class="font-black text-lg">Diretoria Executiva</p>
                            <p class="text-sm opacity-50 uppercase tracking-widest font-bold">Cliente Parceiro</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <footer id="contato" class="py-32 border-t border-current/10">
        <div class="container mx-auto px-6">
            <div class="grid md:grid-cols-2 gap-20 items-center mb-24 text-left">
                <div>
                    <h2 class="text-5xl md:text-7xl font-black mb-8 leading-tight tracking-tight">Vamos construir o próximo nível?</h2>
                    <p class="text-xl opacity-60 font-medium mb-12">Estamos prontos para transformar sua presença em ${site.city}.</p>
                    <div class="flex flex-wrap gap-12">
                        <div>
                            <p class="text-[10px] font-black uppercase tracking-widest opacity-40 mb-3">WhatsApp</p>
                            <a href="${waLink}" target="_blank" class="font-black text-2xl hover:opacity-70 transition-colors" style="color: ${theme.accent}">${site.whatsapp}</a>
                        </div>
                        ${site.instagram ? `
                        <div>
                            <p class="text-[10px] font-black uppercase tracking-widest opacity-40 mb-3">Instagram</p>
                            <a href="https://instagram.com/${site.instagram.replace('@', '')}" target="_blank" class="font-black text-2xl hover:opacity-70 transition-colors" style="color: ${theme.accent}">${site.instagram}</a>
                        </div>
                        ` : ''}
                    </div>
                </div>
                <div class="flex justify-center">
                    <a href="${waLink}" target="_blank" class="w-80 h-80 rounded-[3rem] flex flex-col items-center justify-center text-center p-12 hover:scale-105 transition-all shadow-2xl group cta-shadow" style="background-color: ${theme.accent}; color: ${theme.accentText}; text-decoration: none;">
                        <span class="text-sm font-black tracking-[0.3em] mb-4">START NOW</span>
                        <span class="text-4xl font-black leading-tight uppercase tracking-tighter">AGENDAR CONSULTA</span>
                    </a>
                </div>
            </div>
            <div class="pt-12 border-t border-current/5 flex flex-col md:flex-row justify-between items-center gap-6 opacity-40">
                <div class="flex items-center gap-2">
                    <div class="w-8 h-8 rounded-lg flex items-center justify-center font-black text-white text-xs" style="background-color: ${theme.accent}">
                        ${site.companyName.charAt(0).toUpperCase()}
                    </div>
                    <span class="font-black text-sm tracking-tighter uppercase">${site.companyName}</span>
                </div>
                <p class="text-[10px] font-bold uppercase tracking-[0.2em]">&copy; 2024 • TODOS OS DIREITOS RESERVADOS • ${site.city.toUpperCase()}</p>
            </div>
        </div>
    </footer>
</body>
</html>`;
    navigator.clipboard.writeText(html);
    toast.success("HTML copiado!");
  };

  React.useEffect(() => {
    if (activeSection) {
      const el = document.getElementById(activeSection);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [activeSection]);

  const containerWidth = viewMode === 'mobile' ? '390px' : (viewMode === 'tablet' ? '768px' : '100%');

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  if (mode === 'public') {
    return (
      <div 
        id="public-proposal-render" 
        className={`w-full min-h-screen selection:bg-primary selection:text-primary-foreground scroll-smooth ${theme.text} ${theme.bg}`}
        style={{ fontFamily: theme.fontFamily }}
      >
        {/* Scroll Progress Bar */}
        <motion.div
          className="fixed top-0 left-0 right-0 h-1 z-[100] origin-left"
          style={{ scaleX, backgroundColor: theme.accent }}
        />

        <SiteContent 
          site={site} 
          theme={theme} 
          template={template} 
          waLink={waLink} 
          handleWhatsAppClick={handleWhatsAppClick}
          viewMode="desktop"
          mode="public"
          isExporting={isExporting}
        />

        {/* Floating WhatsApp Button */}
        <AnimatePresence>
          <motion.a
            initial={{ scale: 0, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            href={waLink}
            onClick={(e) => handleWhatsAppClick(e, 'floating_button')}
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-8 right-8 z-[60] w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all group"
            style={{ backgroundColor: theme.accent, color: theme.accentText }}
          >
            <div className="absolute -top-12 right-0 bg-white text-black px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-xl pointer-events-none">
              Fale conosco agora!
            </div>
            <MessageCircle className="w-8 h-8" />
          </motion.a>
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${hideToolbar ? '' : 'bg-slate-100/50'}`}>
      {!hideToolbar && (
        <div className="flex justify-between items-center bg-white border-b px-6 py-3 shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <Button 
                variant={viewMode === 'desktop' ? 'secondary' : 'ghost'} 
                size="icon" 
                className={`h-8 w-8 ${viewMode === 'desktop' ? 'bg-white shadow-sm' : ''}`}
                onClick={() => {}} // Controlled from parent
              >
                <Monitor className="h-4 w-4" />
              </Button>
              <Button 
                variant={viewMode === 'tablet' ? 'secondary' : 'ghost'} 
                size="icon" 
                className={`h-8 w-8 ${viewMode === 'tablet' ? 'bg-white shadow-sm' : ''}`}
                onClick={() => {}} // Controlled from parent
              >
                <Tablet className="h-4 w-4" />
              </Button>
              <Button 
                variant={viewMode === 'mobile' ? 'secondary' : 'ghost'} 
                size="icon" 
                className={`h-8 w-8 ${viewMode === 'mobile' ? 'bg-white shadow-sm' : ''}`}
                onClick={() => {}} // Controlled from parent
              >
                <Smartphone className="h-4 w-4" />
              </Button>
            </div>
            <div className="h-4 w-[1px] bg-slate-200"></div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <Info className="h-3 w-3" />
              Clique nas seções para navegar
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={copyHtml} className="h-9 px-4 rounded-full border-slate-200 hover:bg-slate-50 transition-all">
              <Copy className="h-4 w-4 mr-2" /> Copiar HTML
            </Button>
            <Button variant="default" size="sm" onClick={downloadPdf} disabled={isExporting} className="h-9 px-6 rounded-full bg-primary hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
              {isExporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileDown className="h-4 w-4 mr-2" />}
              Gerar PDF Premium
            </Button>
          </div>
        </div>
      )}

      <div className={`flex-1 overflow-hidden flex items-start justify-center ${hideToolbar ? 'p-0' : 'p-6'}`}>
        <div 
          ref={previewRef}
          className={`bg-white transition-all duration-500 overflow-hidden flex flex-col mx-auto ${hideToolbar ? 'w-full h-full border-none shadow-none' : (viewMode === 'mobile' ? 'rounded-[3rem] border-[12px] border-slate-900 h-[780px] shadow-2xl' : 'rounded-xl h-full border border-slate-200 shadow-2xl')}`}
          style={{ 
            width: hideToolbar ? '100%' : containerWidth,
            fontFamily: theme.fontFamily 
          }}
        >
          <div id="public-proposal-render" className={`flex-1 ${hideToolbar ? '' : 'overflow-y-auto scrollbar-hide'} selection:bg-yellow-400 selection:text-black ${theme.text} ${theme.bg}`}>
            <SiteContent 
              site={site} 
              theme={theme} 
              template={template} 
              waLink={waLink} 
              handleWhatsAppClick={handleWhatsAppClick}
              viewMode={viewMode}
              mode="editor"
              isExporting={isExporting}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const SiteContent: React.FC<{
  site: GeneratedSite;
  theme: any;
  template: TemplateType;
  waLink: string;
  handleWhatsAppClick: (e: React.MouseEvent, location: string) => void;
  viewMode: string;
  mode?: 'editor' | 'public';
  isExporting?: boolean;
}> = ({ site, theme, template, waLink, handleWhatsAppClick, viewMode, mode, isExporting }) => {
  const isDark = template === 'tech' || template === 'clinic' || template === 'consultive' || template === 'professional';
  
  const sectionVariants: any = {
    hidden: { opacity: 0, y: 50 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.8 }
    }
  };

  const staggerContainer: any = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  return (
    <>
      {/* Nav / Header */}
      <nav id="nav" className={`py-6 px-8 sticky top-0 z-[60] transition-all duration-300 ${template === 'clinic' || template === 'professional' ? 'bg-white/80 backdrop-blur-xl border-b shadow-sm' : 'bg-black/80 backdrop-blur-xl border-b border-white/10'}`}>
        <div className="container mx-auto flex justify-between items-center">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-xl shadow-lg transition-transform group-hover:scale-110" style={{ backgroundColor: theme.accent }}>
              {site.companyName.charAt(0).toUpperCase()}
            </div>
            <h1 className="text-2xl font-black tracking-tighter uppercase">{site.companyName}</h1>
          </motion.div>

          {mode === 'public' && (
            <div className="hidden md:flex items-center gap-8">
              {['beneficios', 'servicos', 'prova-social', 'contato'].map((item) => (
                <button
                  key={item}
                  onClick={() => document.getElementById(item)?.scrollIntoView({ behavior: 'smooth' })}
                  className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50 hover:opacity-100 transition-opacity"
                >
                  {item.replace('-', ' ')}
                </button>
              ))}
            </div>
          )}

          <motion.a 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            href={waLink} 
            onClick={(e) => handleWhatsAppClick(e, 'navbar')} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center gap-2 px-8 py-3 rounded-full font-black text-sm hover:scale-105 transition-all shadow-xl" 
            style={{ backgroundColor: theme.accent, color: theme.accentText }}
          >
            FALAR NO WHATSAPP
          </motion.a>
        </div>
      </nav>
      
      {/* Hero Section */}
      <header id="hero" className={`relative min-h-[90vh] flex items-center py-32 overflow-hidden bg-cover bg-center`} style={{ backgroundImage: `linear-gradient(180deg, rgba(15,17,21,0.7), rgba(15,17,21,1)), url('https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=2000')` }}>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full opacity-30 pointer-events-none">
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.2, 0.4, 0.2]
            }}
            transition={{ duration: 10, repeat: Infinity }}
            className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[120px]" 
            style={{ backgroundColor: theme.accent }}
          />
          <motion.div 
            animate={{ 
              scale: [1.2, 1, 1.2],
              opacity: [0.1, 0.3, 0.1]
            }}
            transition={{ duration: 12, repeat: Infinity }}
            className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[120px]" 
            style={{ backgroundColor: theme.accent }}
          />
        </div>
        
        <div className="container mx-auto px-6 text-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 py-2 px-6 rounded-full border border-white/10 bg-white/5 text-[10px] font-black tracking-[0.3em] uppercase mb-8 backdrop-blur-md"
          >
             <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: theme.accent }}></span>
             {theme.tagline}
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`font-black mb-10 leading-[0.9] tracking-tighter mx-auto max-w-6xl uppercase ${viewMode === 'mobile' ? 'text-5xl' : 'text-[clamp(3rem,10vw,8rem)]'}`}
          >
            {theme.heroTitle.split(' ').map((word: string, i: number) => i % 2 === 1 ? <span key={i} className="italic font-serif" style={{ color: theme.accent }}>{word} </span> : word + ' ')}
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-xl md:text-2xl opacity-70 mb-14 max-w-3xl mx-auto font-medium leading-relaxed"
          >
            {theme.heroSub}
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-6 justify-center items-center"
          >
            <a href={waLink} onClick={(e) => handleWhatsAppClick(e, 'hero')} target="_blank" rel="noopener noreferrer" className="text-xl px-16 py-6 rounded-2xl font-black shadow-2xl hover:scale-105 transition-all active:scale-95 group relative overflow-hidden" style={{ backgroundColor: theme.accent, color: theme.accentText }}>
              <span className="relative z-10 flex items-center gap-3 uppercase tracking-tighter">
                Solicitar Orçamento Agora
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            </a>
          </motion.div>
        </div>
      </header>

      {/* Diferenciais */}
      <motion.section 
        id="beneficios"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={sectionVariants}
        className="py-32 border-y border-white/5"
      >
        <div className="container mx-auto px-6">
          <div className="text-center mb-24">
            <h3 className="text-xs font-black uppercase tracking-[0.4em] mb-4" style={{ color: theme.accent }}>Diferenciais Estratégicos</h3>
            <h2 className={`font-black tracking-tighter uppercase ${viewMode === 'mobile' ? 'text-4xl' : 'text-7xl'}`}>Por que <span className="italic" style={{ color: theme.accent }}>escolher a {site.companyName}?</span></h2>
          </div>
          <motion.div 
            variants={staggerContainer}
            className={`grid gap-8 ${viewMode === 'mobile' ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-4'}`}
          >
            {[
              { title: 'Excelência Local', icon: <MapPin className="w-8 h-8" />, desc: `A melhor infraestrutura de ${site.niche} em ${site.city}.` },
              { title: 'Atendimento VIP', icon: <Star className="w-8 h-8" />, desc: 'Experiência personalizada focada no seu conforto e bem-estar.' },
              { title: 'Segurança Total', icon: <ShieldCheck className="w-8 h-8" />, desc: 'Processos rigorosos e profissionais altamente qualificados.' },
              { title: 'Resultados Reais', icon: <TrendingUp className="w-8 h-8" />, desc: 'Tecnologia avançada para garantir sua satisfação máxima.' }
            ].map((item, i) => (
              <motion.div 
                key={i} 
                variants={sectionVariants}
                whileHover={{ y: -10, scale: 1.02 }}
                className={`p-10 rounded-[2.5rem] transition-all bg-white/[0.04] border border-white/10 text-center group hover:bg-white/[0.08] backdrop-blur-md shadow-xl`}
              >
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-8 mx-auto transition-transform group-hover:scale-110 rotate-3 group-hover:rotate-0 shadow-lg" style={{ backgroundColor: `${theme.accent}20`, color: theme.accent }}>{item.icon}</div>
                <h4 className="font-black text-2xl mb-4 uppercase tracking-tighter">{item.title}</h4>
                <p className="text-sm opacity-60 leading-relaxed font-medium">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Serviços Grid */}
      <motion.section 
        id="servicos"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={sectionVariants}
        className="py-48"
      >
        <div className="container mx-auto px-6">
          <div className="text-center mb-24">
            <h3 className="text-xs font-black uppercase tracking-[0.4em] mb-4" style={{ color: theme.accent }}>Procedimentos</h3>
            <h2 className={`font-black tracking-tighter uppercase mb-6 ${viewMode === 'mobile' ? 'text-5xl' : 'text-8xl'}`}>Nossas <span className="italic" style={{ color: theme.accent }}>Soluções</span></h2>
            <p className="text-xl opacity-60 max-w-2xl mx-auto font-medium leading-relaxed">
              {site.explosionMode 
                ? "Soluções estratégicas desenhadas para gerar autoridade e lucro imediato para sua empresa."
                : `Serviços exclusivos desenvolvidos com tecnologia de ponta para atender as necessidades de ${site.city}.`}
            </p>
          </div>
          <motion.div 
            variants={staggerContainer}
            className={`grid gap-12 ${viewMode === 'mobile' ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-3'}`}
          >
            {(site.services || ['Serviço 1', 'Serviço 2', 'Serviço 3']).map((s, i) => (
              <motion.div 
                key={i} 
                variants={sectionVariants}
                className={`group relative overflow-hidden rounded-[2rem] flex flex-col transition-all shadow-2xl ${
                  site.niche?.toLowerCase().includes('automotivo') 
                  ? 'bg-[#121212] border border-white/5' 
                  : (template === 'clinic' || template === 'professional' ? 'bg-slate-50' : 'bg-white/5 border border-white/10')
                }`}
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <div className="absolute inset-0 bg-cover bg-center transition-all duration-1000 group-hover:scale-110 opacity-80" style={{ backgroundImage: `url(https://images.unsplash.com/photo-${[
                    '1460925895917-afdab827c52f',
                    '1486406146926-c627a92ad1ab',
                    '1507679799987-c73779587ccf',
                    '1557804506-669a67965ba0',
                    '1542744173-8e7e53415bb0'
                  ][i % 5]}?auto=format&fit=crop&q=80&w=800)` }}></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                </div>

                <div className="p-10 flex flex-col flex-1">
                  <span className="font-bold text-xs tracking-widest uppercase mb-3 block" style={{ color: theme.accent }}>SOLUÇÃO 0{i+1}</span>
                  <h4 className="text-2xl font-black mb-4 tracking-tighter uppercase">{s}</h4>
                  <p className="text-sm opacity-60 mb-10 line-clamp-2">Especialistas em processos de alta performance para garantir o melhor resultado para sua necessidade.</p>
                  
                  <div className="mt-auto pt-6 border-t border-white/5 flex justify-center">
                    <a 
                      href={`${waLink}&text=${encodeURIComponent(`Olá! Gostaria de saber mais sobre o serviço: ${s}`)}`} 
                      onClick={(e) => handleWhatsAppClick(e, `service_card_${i}`)} 
                      target="_blank" 
                      className="inline-flex items-center justify-center gap-3 bg-accent text-white px-10 py-5 rounded-full font-black text-sm hover:scale-[1.05] transition-all shadow-xl uppercase tracking-tighter w-full sm:w-auto"
                      style={{ backgroundColor: theme.accent, color: theme.accentText }}
                    >
                      Ver Mais
                      <ArrowRight className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Instagram Feed (if images available) */}
      {((site.instagramImages && site.instagramImages.length > 0) || site.instagram) && (
        <motion.section 
          id="instagram-feed"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={sectionVariants}
          className="py-32"
        >
          <div className="container mx-auto px-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
              <div>
                <h3 className="text-xs font-black uppercase tracking-[0.4em] mb-4" style={{ color: theme.accent }}>Conecte-se Conosco</h3>
                <h2 className={`font-black tracking-tighter uppercase ${viewMode === 'mobile' ? 'text-4xl' : 'text-7xl'}`}>Presença visual <span className="italic" style={{ color: theme.accent }}>da marca</span></h2>
              </div>
              {site.instagram && (
                <a 
                  href={site.instagram && site.instagram.startsWith('http') ? site.instagram : `https://instagram.com/${(site.instagram || '').replace('@', '')}`}
                  target="_blank"
                  className="inline-flex items-center gap-2 font-black text-sm uppercase tracking-tighter hover:opacity-70 transition-opacity"
                  style={{ color: theme.accent }}
                >
                  <Instagram className="w-5 h-5" />
                  {site.instagram && site.instagram.startsWith('@') ? `Ver @${site.instagram.replace('@', '')}` : 'Ver Instagram'}
                </a>
              )}
            </div>
            
            {site.instagramImages && site.instagramImages.length > 0 ? (
              <div className="space-y-8">
                <div className={`grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4`}>
                  {site.instagramImages.slice(0, isExporting ? 6 : (mode === 'editor' ? 12 : 8)).map((img, i) => (
                    <motion.div 
                      key={i}
                      whileHover={{ scale: 0.98 }}
                      className="aspect-square overflow-hidden rounded-2xl bg-zinc-800 border border-white/5"
                    >
                      <img src={img} alt={`Post ${i}`} className="w-full h-full object-cover" loading="lazy" />
                    </motion.div>
                  ))}
                </div>
                <p className="text-xs text-center opacity-40 font-medium">
                  Conteúdo visual usado como referência para conectar a proposta à identidade da marca.
                </p>
              </div>
            ) : null}
          </div>
        </motion.section>
      )}

      {/* Localização / Mapa */}
      {site.address && (
        <motion.section 
          id="localizacao"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={sectionVariants}
          className="py-32"
        >
          <div className="container mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <h3 className="text-xs font-black uppercase tracking-[0.4em] mb-4" style={{ color: theme.accent }}>Onde Estamos</h3>
                <h2 className={`font-black tracking-tighter uppercase mb-8 ${viewMode === 'mobile' ? 'text-5xl' : 'text-7xl'}`}>Visite nossa <span className="italic" style={{ color: theme.accent }}>Unidade</span></h2>
                <div className="p-8 rounded-3xl bg-white/[0.03] border border-white/5 mb-8">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${theme.accent}15`, color: theme.accent }}>
                      <MapPin className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-black text-xl mb-2">Endereço</p>
                      <p className="text-lg opacity-60 leading-relaxed">{site.address}</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-4">
                  <a 
                    href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(site.address)}`}
                    target="_blank"
                    className="inline-flex items-center gap-3 px-10 py-5 rounded-2xl font-black text-sm hover:scale-105 transition-all shadow-xl uppercase tracking-tighter"
                    style={{ backgroundColor: theme.accent, color: theme.accentText }}
                  >
                    Como chegar
                    <Navigation className="w-4 h-4" />
                  </a>
                  <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(site.address)}`}
                    target="_blank"
                    className="inline-flex items-center gap-3 px-10 py-5 rounded-2xl font-black text-sm hover:scale-105 transition-all border border-white/10 uppercase tracking-tighter"
                    style={{ color: theme.text }}
                  >
                    Ver no Google Maps
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
              <div className="aspect-video lg:aspect-square rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl grayscale hover:grayscale-0 transition-all duration-700">
                <iframe 
                  src={`https://www.google.com/maps?q=${encodeURIComponent(site.address)}&output=embed`}
                  width="100%" 
                  height="100%" 
                  style={{ border: 0 }} 
                  allowFullScreen 
                  loading="lazy"
                ></iframe>
              </div>
            </div>
          </div>
        </motion.section>
      )}

      {/* Google Reviews Section */}
      <motion.section 
        id="google-reviews"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={sectionVariants}
        className="py-32"
      >
        <div className="container mx-auto px-6">
          <div className="bg-white/[0.03] border border-white/10 rounded-[3rem] p-12 md:p-20 backdrop-blur-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-12 opacity-10">
                <Star className="w-32 h-32" />
             </div>
             
             <div className="flex flex-col md:flex-row items-center gap-12 relative z-10">
                <div className="text-center md:text-left">
                   <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
                      <div className="bg-[#4285F4] p-2 rounded-lg">
                         <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                         </svg>
                      </div>
                      <span className="font-black text-xl uppercase tracking-tighter">Google Reviews</span>
                   </div>
                   <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-6 uppercase">O que dizem no <span className="italic" style={{ color: theme.accent }}>Google Business</span></h2>
                   <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                      <div className="flex">
                         {[1,2,3,4,5].map(s => <Star key={s} className="w-6 h-6 fill-current text-yellow-400" />)}
                      </div>
                      <span className="text-2xl font-black">4.9/5.0</span>
                   </div>
                   <p className="text-sm opacity-50 font-bold uppercase tracking-widest">Baseado em mais de 120 avaliações verificadas</p>
                </div>

                <div className="flex-1 grid gap-6">
                   {[
                      { name: "Carlos Henrique", text: "Melhor experiência de atendimento que já tive em " + site.city + ". Profissionais extremamente qualificados.", date: "Há 2 semanas" },
                      { name: "Juliana Mendes", text: "Ambiente impecável e resultados surpreendentes. Recomendo para todos que buscam qualidade premium.", date: "Há 1 mês" }
                   ].map((rev, i) => (
                      <div key={i} className="bg-white/5 border border-white/5 p-6 rounded-2xl hover:bg-white/10 transition-colors">
                         <div className="flex justify-between items-start mb-4">
                            <div className="font-black uppercase tracking-tighter text-sm">{rev.name}</div>
                            <div className="text-[10px] opacity-40 font-bold">{rev.date}</div>
                         </div>
                         <p className="text-sm opacity-70 leading-relaxed italic">"{rev.text}"</p>
                      </div>
                   ))}
                </div>
             </div>
          </div>
        </div>
      </motion.section>

      <motion.section 
        id="prova-social"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={sectionVariants}
        className={`py-48 relative overflow-hidden ${template === 'clinic' || template === 'professional' ? 'bg-slate-50' : 'bg-white/[0.02]'}`}
      >
        <div className="container mx-auto px-6 text-center relative z-10">
          <h2 className={`font-black mb-24 tracking-tighter uppercase ${viewMode === 'mobile' ? 'text-5xl' : 'text-8xl'}`}>Voz de quem <span className="italic" style={{ color: theme.accent }}>confia</span></h2>
          <div className="max-w-5xl mx-auto">
            <div className={`p-12 md:p-24 rounded-[4rem] relative bg-white/[0.03] border border-white/5 shadow-2xl overflow-hidden`}>
              <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 blur-[80px] -mr-32 -mt-32"></div>
              <div className="text-8xl opacity-10 absolute top-10 left-10 font-serif" style={{ color: theme.accent }}>"</div>
              <p className="text-2xl md:text-4xl font-bold italic mb-12 leading-tight relative z-10 tracking-tight">
                "A {site.companyName} transformou completamente nossa percepção de qualidade em {site.city}. O profissionalismo e a atenção aos detalhes são incomparáveis."
              </p>
              <div className="flex flex-col items-center gap-6">
                <div className="w-24 h-24 rounded-3xl bg-slate-200 overflow-hidden flex items-center justify-center border-4 rotate-3" style={{ borderColor: theme.accent }}>
                  <img src={`https://i.pravatar.cc/150?u=${site.companyName}`} alt="Depoimento" className="w-full h-full object-cover" />
                </div>
                <div className="space-y-1">
                  <p className="font-black text-2xl tracking-tighter uppercase">Maria Eduarda Silva</p>
                  <p className="text-sm opacity-50 uppercase tracking-[0.3em] font-bold">Cliente VIP Platinum</p>
                </div>
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(star => <Star key={star} className="w-5 h-5 fill-current" style={{ color: theme.accent }} />)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>
      
      {/* Footer */}
      <footer id="contato" className="py-32 border-t border-white/5 relative bg-black">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-20 items-center mb-24">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-5xl md:text-8xl font-black mb-8 leading-[0.9] tracking-tighter uppercase">Pronto para o <span className="italic" style={{ color: theme.accent }}>Próximo Nível?</span></h2>
              <p className="text-2xl opacity-60 font-medium mb-12 leading-relaxed">Sua jornada de transformação em {site.city} começa com um simples clique.</p>
              <div className="grid md:grid-cols-2 gap-12">
                <div className="p-8 rounded-3xl bg-white/[0.03] border border-white/5">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-4">WhatsApp Direto</p>
                  <a href={waLink} onClick={(e) => handleWhatsAppClick(e, 'footer')} target="_blank" className="font-black text-3xl hover:opacity-70 transition-all tracking-tighter block mb-2" style={{ color: theme.accent }}>{site.whatsapp}</a>
                  <p className="text-xs font-bold opacity-30 uppercase tracking-widest">Resposta em instantes</p>
                </div>
                {site.instagram && (
                  <div className="p-8 rounded-3xl bg-white/[0.03] border border-white/5">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-4">Instagram Oficial</p>
                    <a href={`https://instagram.com/${String(site.instagram).replace('@', '')}`} target="_blank" className="font-black text-3xl hover:opacity-70 transition-all tracking-tighter block mb-2" style={{ color: theme.accent }}>@{String(site.instagram).replace('@', '')}</a>
                    <p className="text-xs font-bold opacity-30 uppercase tracking-widest">Siga nossa rotina</p>
                  </div>
                )}
              </div>
            </motion.div>

            {site.revenueSimulation && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="mt-12"
              >
                <RevenueSimulator 
                  isPublic 
                  initialTicket={site.revenueSimulation.ticket}
                  initialCustomers={site.revenueSimulation.customers}
                />
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="flex justify-center"
            >
              <a 
                href={waLink} 
                onClick={(e) => handleWhatsAppClick(e, 'footer_cta')} 
                target="_blank" 
                className="w-full md:w-[450px] aspect-square rounded-[4rem] flex flex-col items-center justify-center text-center p-12 hover:scale-105 transition-all shadow-2xl group relative overflow-hidden" 
                style={{ backgroundColor: theme.accent, color: theme.accentText }}
              >
                <motion.div 
                  animate={{ scale: [1, 1.1, 1] }} 
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 bg-white/10"
                />
                <span className="text-sm font-black tracking-[0.4em] mb-6 relative z-10">START EXPERIENCE</span>
                <span className="text-5xl md:text-7xl font-black leading-[0.8] uppercase tracking-tighter relative z-10 mb-8">
                  {site.explosionMode ? "AGIR AGORA" : "AGENDAR CONSULTA"}
                </span>
                <ArrowRight className="w-16 h-16 relative z-10 group-hover:translate-x-4 transition-transform" />
              </a>
            </motion.div>
          </div>
          <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 opacity-40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-xl" style={{ backgroundColor: theme.accent }}>
                {site.companyName.charAt(0).toUpperCase()}
              </div>
              <span className="font-black text-lg tracking-tighter uppercase">{site.companyName}</span>
            </div>
            <div className="flex flex-col md:items-end gap-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em]">&copy; 2024 • DESIGN BY PREMIUM AGENCY</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em]">{site.city.toUpperCase()} • TODOS OS DIREITOS RESERVADOS</p>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

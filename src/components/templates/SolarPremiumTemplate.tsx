import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { navigationService } from '@/lib/navigation-service';
import {
  Sun,
  Zap,
  TrendingDown,
  Clock,
  ShieldCheck,
  Star,
  CheckCircle2,
  ChevronRight,
  MessageCircle,
  X,
  Phone,
  MapPin,
  Calendar,
  Calculator,
  ArrowRight,
} from 'lucide-react';

const BENEFITS = [
  {
    icon: TrendingDown,
    title: 'Economia de até 95%',
    desc: 'Reduza drasticamente sua conta de luz desde o primeiro mês de instalação.',
  },
  {
    icon: Clock,
    title: 'Payback Rápido',
    desc: 'O investimento se paga em média de 3 a 5 anos, gerando economia por mais de 25.',
  },
  {
    icon: ShieldCheck,
    title: 'Garantia de 25 Anos',
    desc: 'Equipamentos de alta durabilidade com garantia estendida e suporte técnico.',
  },
  {
    icon: Sun,
    title: 'Energia Limpa',
    desc: 'Contribua com o meio ambiente utilizando uma fonte de energia 100% renovável.',
  },
];

const STEPS = [
  {
    number: '01',
    title: 'Simulação',
    desc: 'Analisamos seu consumo médio e as condições do local.',
  },
  {
    number: '02',
    title: 'Projeto',
    desc: 'Engenheiros especializados desenham o sistema ideal para você.',
  },
  {
    number: '03',
    title: 'Instalação',
    desc: 'Equipe técnica realiza a montagem em poucos dias.',
  },
  {
    number: '04',
    title: 'Ativação',
    desc: 'Homologação junto à concessionária e início da economia.',
  },
];

const TESTIMONIALS = [
  { name: 'Ricardo Alencar', city: 'Fortaleza - CE', text: 'Minha conta caiu de R$ 800 para o mínimo. O atendimento da equipe foi impecável em todas as fases.', rating: 5 },
  { name: 'Ana Beatriz', city: 'Eusébio - CE', text: 'Melhor investimento que fiz na minha casa. Em 4 anos o sistema já se pagou e agora é só lucro.', rating: 5 },
  { name: 'Carlos Mendes', city: 'Aquiraz - CE', text: 'Empresa séria e transparente. O projeto foi entregue antes do prazo e funciona perfeitamente.', rating: 5 },
];

const WHATSAPP = '558591583732';

export const SolarPremiumTemplate: React.FC = () => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [billValue, setBillValue] = useState('');
  const [connectionType, setConnectionType] = useState('');
  const [city, setCity] = useState('');
  const [showSummary, setShowSummary] = useState(false);

  const buildWhatsAppLink = () => {
    const msg =
      `Olá! Gostaria de uma simulação de Energia Solar:%0A%0A` +
      `👤 *Dados do Cliente*%0A` +
      `• Nome: ${name || '(não informado)'}%0A` +
      `• WhatsApp: ${phone || '(não informado)'}%0A%0A` +
      `⚡ *Informações Técnicas*%0A` +
      `• Valor da Conta: R$ ${billValue || '(não informado)'}%0A` +
      `• Tipo de Conexão: ${connectionType || '(não selecionado)'}%0A` +
      `• Cidade: ${city || '(não informada)'}%0A%0A` +
      `_Enviado via Solar Energy Premium_`;
    return `https://wa.me/${WHATSAPP}?text=${msg}`;
  };

  const handleWhatsAppClick = () => {
    navigationService.handleCTA('whatsapp_conversion', {
      template: 'solar-premium',
      billValue,
      city
    });
  };

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !billValue) {
      alert('Por favor, preencha os campos principais para a simulação.');
      return;
    }
    navigationService.handleCTA('simulation_form_submit', {
      template: 'solar-premium',
      billValue
    });
    setShowSummary(true);
  };

  return (
    <div className="min-h-screen bg-[#0a0f1c] text-slate-100 selection:bg-yellow-500 selection:text-slate-900" style={{ fontFamily: '"Inter", sans-serif' }}>
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-[#0a0f1c]/80 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
              <Sun className="w-6 h-6 text-slate-950" />
            </div>
            <div className="text-xl font-black tracking-tighter">
              SOLAR<span className="text-yellow-500">ENERGY</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-8 text-[11px] font-bold uppercase tracking-widest text-slate-400">
            <a href="#home" className="hover:text-yellow-500 transition">Home</a>
            <a href="#beneficios" className="hover:text-yellow-500 transition">Benefícios</a>
            <a href="#como-funciona" className="hover:text-yellow-500 transition">Como Funciona</a>
            <a href="#depoimentos" className="hover:text-yellow-500 transition">Depoimentos</a>
          </div>
          <a
            href="#simulacao"
            className="bg-yellow-500 text-slate-950 px-6 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest hover:bg-yellow-400 transition-all shadow-lg shadow-yellow-500/20"
          >
            Solicitar Simulação
          </a>
        </div>
      </nav>

      {/* HERO */}
      <section id="home" className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0f1c]/60 to-[#0a0f1c]" />
          <img 
            src="https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=1920&q=80" 
            alt="Solar Panels" 
            className="w-full h-full object-cover opacity-30"
          />
        </div>
        
        <div className="relative z-10 text-center max-w-5xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-[11px] font-bold uppercase tracking-wider text-yellow-500"
          >
            <Zap className="w-3 h-3" /> Energia Solar Residencial e Comercial
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl lg:text-8xl font-black leading-[0.9] mb-8 tracking-tighter"
          >
            Adeus, <span className="text-yellow-500">conta de luz</span> alta!
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-12 font-medium leading-relaxed"
          >
            Economize até 95% na sua conta de energia com um sistema solar personalizado para sua casa ou empresa.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap justify-center gap-4"
          >
            <a href="#simulacao" className="bg-yellow-500 text-slate-950 px-10 py-5 rounded-full font-black uppercase tracking-widest hover:bg-yellow-400 transition-all flex items-center gap-2 group shadow-xl shadow-yellow-500/20">
              Simular Minha Economia <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
            <a href="#como-funciona" className="bg-white/5 border border-white/10 px-10 py-5 rounded-full font-black uppercase tracking-widest hover:bg-white/10 transition-all">
              Como Funciona
            </a>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-24 pt-12 border-t border-white/5">
            <div>
              <div className="text-4xl font-black text-white mb-1">500+</div>
              <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500">Projetos Instalados</div>
            </div>
            <div>
              <div className="text-4xl font-black text-white mb-1">4.9★</div>
              <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500">Avaliação Google</div>
            </div>
            <div>
              <div className="text-4xl font-black text-white mb-1">95%</div>
              <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500">Economia Média</div>
            </div>
            <div>
              <div className="text-4xl font-black text-white mb-1">25 anos</div>
              <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500">Garantia</div>
            </div>
          </div>
        </div>
      </section>

      {/* BENEFÍCIOS */}
      <section id="beneficios" className="py-32 bg-[#0d1424]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <div className="text-yellow-500 text-[11px] font-black uppercase tracking-[0.3em] mb-4">Vantagens</div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight">Por que escolher <span className="text-yellow-500">Energia Solar</span>?</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {BENEFITS.map((b, i) => (
              <div key={i} className="group p-8 rounded-3xl bg-[#0a0f1c] border border-white/5 hover:border-yellow-500/20 transition-all">
                <div className="w-14 h-14 rounded-2xl bg-yellow-500/10 flex items-center justify-center mb-8 group-hover:bg-yellow-500 transition-all duration-500">
                  <b.icon className="w-6 h-6 text-yellow-500 group-hover:text-slate-950" />
                </div>
                <h3 className="text-xl font-black mb-4">{b.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section id="como-funciona" className="py-32 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <div className="text-yellow-500 text-[11px] font-black uppercase tracking-[0.3em] mb-4">Processo</div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight">Como <span className="text-yellow-500">funciona</span>?</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            {STEPS.map((s, i) => (
              <div key={i} className="relative">
                <div className="text-8xl font-black text-white/5 absolute -top-10 -left-4 select-none">
                  {s.number}
                </div>
                <div className="relative z-10 pt-4">
                  <h3 className="text-xl font-black mb-4 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-yellow-500" />
                    {s.title}
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DEPOIMENTOS */}
      <section id="depoimentos" className="py-32 bg-[#0d1424]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
            <div className="max-w-2xl">
              <div className="text-yellow-500 text-[11px] font-black uppercase tracking-[0.3em] mb-4">Feedback</div>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight">O que nossos <span className="text-yellow-500">clientes dizem</span></h2>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <div className="text-xl font-black">4.9/5</div>
                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Média de satisfação</div>
              </div>
              <div className="flex text-yellow-500">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-current" />)}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="p-8 rounded-3xl bg-[#0a0f1c] border border-white/5">
                <div className="flex text-yellow-500 mb-6">
                  {[...Array(t.rating)].map((_, j) => <Star key={j} className="w-4 h-4 fill-current" />)}
                </div>
                <p className="text-slate-300 mb-8 italic text-lg leading-relaxed">"{t.text}"</p>
                <div>
                  <div className="font-black text-white">{t.name}</div>
                  <div className="text-xs text-slate-500 font-bold uppercase tracking-widest">{t.city}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA / SIMULAÇÃO */}
      <section id="simulacao" className="py-32 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-yellow-500 rounded-[3rem] p-8 md:p-16 flex flex-col lg:flex-row gap-16 items-center overflow-hidden relative">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
            
            <div className="flex-1 text-slate-950 relative z-10">
              <div className="text-slate-900 text-[11px] font-black uppercase tracking-[0.3em] mb-4">Grátis</div>
              <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-8">Solicite sua <span className="text-white">simulação gratuita</span></h2>
              <p className="text-slate-900/70 text-lg font-medium mb-12 max-w-md">
                Preencha o formulário e receba um estudo completo de economia para o seu imóvel em poucos minutos.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-slate-950 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest opacity-60">Fale com um consultor</div>
                    <div className="font-black text-xl">(85) 99158-3732</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full lg:w-[500px] relative z-10">
              <div className="bg-slate-950 p-8 md:p-10 rounded-[2rem] shadow-2xl border border-white/5">
                {!showSummary ? (
                  <form onSubmit={handleConfirm} className="space-y-5">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Seu Nome</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-[#0a0f1c] border-white/5 border p-4 rounded-xl focus:border-yellow-500 outline-none transition-colors text-white"
                        placeholder="Nome completo"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">WhatsApp (com DDD)</label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-[#0a0f1c] border-white/5 border p-4 rounded-xl focus:border-yellow-500 outline-none transition-colors text-white"
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Valor Médio da Conta (R$)</label>
                      <input
                        type="number"
                        required
                        value={billValue}
                        onChange={(e) => setBillValue(e.target.value)}
                        className="w-full bg-[#0a0f1c] border-white/5 border p-4 rounded-xl focus:border-yellow-500 outline-none transition-colors text-white"
                        placeholder="Ex: 500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Tipo de Conexão</label>
                        <select
                          value={connectionType}
                          onChange={(e) => setConnectionType(e.target.value)}
                          className="w-full bg-[#0a0f1c] border-white/5 border p-4 rounded-xl focus:border-yellow-500 outline-none transition-colors text-white appearance-none"
                        >
                          <option value="">Selecione</option>
                          <option value="Monofásica">Monofásica</option>
                          <option value="Bifásica">Bifásica</option>
                          <option value="Trifásica">Trifásica</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Cidade</label>
                        <input
                          type="text"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full bg-[#0a0f1c] border-white/5 border p-4 rounded-xl focus:border-yellow-500 outline-none transition-colors text-white"
                          placeholder="Sua cidade"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-yellow-500 text-slate-950 py-5 rounded-xl font-black uppercase tracking-widest hover:bg-yellow-400 transition-all flex items-center justify-center gap-3 mt-4"
                    >
                      Solicitar Agora <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-10"
                  >
                    <div className="w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-8">
                      <CheckCircle2 className="w-10 h-10 text-yellow-500" />
                    </div>
                    <h3 className="text-2xl font-black mb-4">Dados Recebidos!</h3>
                    <p className="text-slate-500 text-sm leading-relaxed mb-10">
                      Agora só falta confirmar no WhatsApp para receber sua simulação detalhada.
                    </p>
                    
                    <a
                      href={buildWhatsAppLink()}
                      onClick={handleWhatsAppClick}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full bg-green-500 text-white py-5 rounded-xl font-black uppercase tracking-widest hover:bg-green-600 transition-all flex items-center justify-center gap-3"
                    >
                      <MessageCircle className="w-5 h-5 fill-current" />
                      Confirmar no WhatsApp
                    </a>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-20 bg-[#070b14] border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-12">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-yellow-500 rounded flex items-center justify-center">
                <Sun className="w-5 h-5 text-slate-950" />
              </div>
              <div className="text-lg font-black tracking-tighter">
                SOLAR<span className="text-yellow-500">ENERGY</span>
              </div>
            </div>
            <div className="flex gap-8 text-[10px] font-black uppercase tracking-widest text-slate-500">
              <a href="#" className="hover:text-yellow-500 transition">Privacidade</a>
              <a href="#" className="hover:text-yellow-500 transition">Termos</a>
              <a href="#" className="hover:text-yellow-500 transition">Suporte</a>
            </div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
              © 2026 Solar Energy Premium. Todos os direitos reservados.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
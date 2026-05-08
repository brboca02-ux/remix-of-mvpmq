import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { navigationService } from '@/lib/navigation-service';
import {
  Scissors,
  Sparkles,
  Palette,
  Brush,
  Eye,
  Hand,
  Phone,
  MapPin,
  Instagram,
  Star,
  Award,
  Heart,
  Clock,
  ChevronRight,
  MessageCircle,
  X,
} from 'lucide-react';

const SERVICES = [
  {
    icon: Scissors,
    title: 'Corte & Styling',
    desc: 'Cortes modernos e modelagem profissional para todos os tipos de cabelo.',
    image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&h=400&fit=crop',
    price: 'A partir de R$ 80',
  },
  {
    icon: Palette,
    title: 'Coloração',
    desc: 'Mechas, luzes, balayage e colorações vibrantes com produtos de alta performance.',
    image: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=600&h=400&fit=crop',
    price: 'A partir de R$ 150',
  },
  {
    icon: Brush,
    title: 'Maquiagem',
    desc: 'Make social, noiva, editorial e artística para todas as ocasiões.',
    image: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=600&h=400&fit=crop',
    price: 'A partir de R$ 120',
  },
  {
    icon: Eye,
    title: 'Design de Sobrancelhas',
    desc: 'Micropigmentação, henna e design personalizado para realçar seu olhar.',
    image: 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=600&h=400&fit=crop',
    price: 'A partir de R$ 60',
  },
  {
    icon: Hand,
    title: 'Manicure & Pedicure',
    desc: 'Esmaltação em gel, nail art e spa dos pés com técnicas premium.',
    image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&h=400&fit=crop',
    price: 'A partir de R$ 50',
  },
  {
    icon: Sparkles,
    title: 'Tratamentos Capilares',
    desc: 'Hidratação profunda, botox capilar, reconstrução e cauterização.',
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&h=400&fit=crop',
    price: 'A partir de R$ 100',
  },
];

const DIFFERENTIALS = [
  { icon: Award, title: 'Profissionais Especializados', desc: 'Equipe com formação internacional e atualização constante nas tendências.' },
  { icon: Sparkles, title: 'Ambiente Sofisticado', desc: 'Espaço planejado para proporcionar conforto e uma experiência premium.' },
  { icon: Star, title: 'Produtos Premium', desc: 'Trabalhamos com as melhores marcas nacionais e importadas.' },
  { icon: Heart, title: 'Atendimento Personalizado', desc: 'Cada cliente recebe um plano de beleza exclusivo e sob medida.' },
];

const GALLERY = [
  { 
    title: 'Transformação Loiro', 
    image: 'https://images.unsplash.com/photo-1492106087820-71f1a00d2b11?w=800&h=1000&fit=crop',
    before: 'https://images.unsplash.com/photo-1595475207225-428b62bda831?w=800&h=1000&fit=crop',
    description: 'De um tom opaco para um loiro perolado vibrante com nossa técnica exclusiva.'
  },
  { 
    title: 'Dia de Noiva', 
    image: 'https://images.unsplash.com/photo-1457972729786-0411a3b2b626?w=800&h=1000&fit=crop',
    before: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&h=1000&fit=crop',
    description: 'Preparação completa para o grande dia, realçando a beleza natural.'
  },
  { 
    title: 'Nail Art Premium', 
    image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&h=1000&fit=crop&q=90',
    before: 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=800&h=1000&fit=crop',
    description: 'Reconstrução e esmaltação em gel com durabilidade de até 3 semanas.'
  },
  { 
    title: 'Maquiagem Glam', 
    image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&h=1000&fit=crop',
    before: 'https://images.unsplash.com/photo-1503910397258-41d3e4141be2?w=800&h=1000&fit=crop',
    description: 'Transformação impactante com contorno e iluminação profissional.'
  },
];

const TESTIMONIALS = [
  { name: 'Mariana Silva', text: 'Ambiente maravilhoso e atendimento impecável! Meu cabelo nunca ficou tão lindo. Recomendo de olhos fechados!', rating: 5 },
  { name: 'Camila Rocha', text: 'Profissionais incríveis, super atenciosos. Saí me sentindo uma nova mulher. Voltarei sempre!', rating: 5 },
  { name: 'Beatriz Lima', text: 'Fiz minha maquiagem de noiva e foi perfeita! Durou o dia inteiro e ficou exatamente como sonhei.', rating: 5 },
];

const HOURS = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];
const WHATSAPP = '558591583732';

export const SalonGlamourTemplate: React.FC = () => {
  const [selectedService, setSelectedService] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedHour, setSelectedHour] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [showSummary, setShowSummary] = useState(false);
  const [selectedGalleryItem, setSelectedGalleryItem] = useState<(typeof GALLERY)[0] | null>(null);

  const buildWhatsAppLink = () => {
    const msg =
      `Olá! Gostaria de agendar no Studio Glamour:%0A%0A` +
      `👤 *Dados da Cliente*%0A` +
      `• Nome: ${name || '(não informado)'}%0A` +
      `• WhatsApp: ${phone || '(não informado)'}%0A%0A` +
      `📅 *Resumo do Agendamento*%0A` +
      `• Serviço: ${selectedService || '(não selecionado)'}%0A` +
      `• Data: ${selectedDate || '(não selecionada)'}%0A` +
      `• Horário: ${selectedHour || '(não selecionado)'}%0A%0A` +
      `_Enviado via Studio Glamour Web_`;
    return `https://wa.me/${WHATSAPP}?text=${msg}`;
  };

  const handleWhatsAppClick = () => {
    navigationService.handleCTA('whatsapp_conversion', {
      service: selectedService,
      date: selectedDate,
      hour: selectedHour,
      template: 'salao-beleza'
    });
  };

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !selectedDate) {
      alert('Por favor, preencha os campos obrigatórios.');
      return;
    }
    navigationService.handleCTA('booking_form_submit', {
      service: selectedService,
      template: 'salao-beleza'
    });
    setShowSummary(true);
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-40 backdrop-blur-md bg-white/70 border-b border-pink-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold tracking-tight">
            Studio <span className="text-pink-500 italic">Glamour</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-700">
            <a href="#home" className="hover:text-pink-500 transition">Home</a>
            <a href="#servicos" className="hover:text-pink-500 transition">Serviços</a>
            <a href="#galeria" className="hover:text-pink-500 transition">Galeria</a>
            <a href="#depoimentos" className="hover:text-pink-500 transition">Depoimentos</a>
            <a href="#agendar" className="hover:text-pink-500 transition">Agendar</a>
          </div>
          <a
            href={buildWhatsAppLink()}
            onClick={handleWhatsAppClick}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white px-5 py-2.5 rounded-full text-sm font-semibold shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 transition-all hover:scale-105"
          >
            <Phone className="w-4 h-4" /> Agendar
          </a>
        </div>
      </nav>

      {/* HERO */}
      <section
        id="home"
        className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20"
      >
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              'url(https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1920&h=1080&fit=crop)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-pink-600/80 via-rose-500/70 to-fuchsia-700/80" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center text-white max-w-4xl px-6"
        >
          <div className="inline-block px-4 py-1.5 mb-6 rounded-full bg-white/20 backdrop-blur-sm text-xs font-semibold tracking-widest uppercase border border-white/30">
            ✨ Salão Premium
          </div>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold leading-[1.05] mb-6">
            Sua beleza,<br />
            <span className="italic font-light">nossa arte</span>
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-10 font-sans font-light">
            Transformamos cada visita em uma experiência única de cuidado, estilo e autoestima.
          </p>
          <a
            href="#servicos"
            className="inline-flex items-center gap-3 bg-white/15 backdrop-blur-md hover:bg-white hover:text-pink-600 border border-white/40 text-white px-8 py-4 rounded-full font-semibold transition-all hover:scale-105"
          >
            Conheça Nossos Serviços <ChevronRight className="w-5 h-5" />
          </a>
        </motion.div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/70 text-xs tracking-widest animate-bounce">
          ↓ ROLE
        </div>
      </section>

      {/* DIFERENCIAIS */}
      <section className="py-24 bg-gradient-to-b from-pink-50/40 to-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-pink-500 text-xs font-bold tracking-[0.3em] uppercase mb-3">Nossos Diferenciais</p>
            <h2 className="text-4xl md:text-5xl font-bold">
              Por que escolher o <span className="italic text-pink-500">Studio Glamour?</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {DIFFERENTIALS.map((d, i) => (
              <motion.div
                key={d.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group p-8 rounded-3xl bg-white border border-pink-100 hover:border-pink-300 hover:shadow-2xl hover:shadow-pink-200/50 transition-all hover:-translate-y-1"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center mb-5 shadow-lg shadow-pink-500/30 group-hover:scale-110 transition">
                  <d.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">{d.title}</h3>
                <p className="text-zinc-600 text-sm leading-relaxed font-sans">{d.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SERVIÇOS */}
      <section id="servicos" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-pink-500 text-xs font-bold tracking-[0.3em] uppercase mb-3">O que oferecemos</p>
            <h2 className="text-4xl md:text-5xl font-bold">Nossos <span className="italic text-pink-500">Serviços</span></h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {SERVICES.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="group rounded-3xl overflow-hidden bg-white border border-pink-100 hover:shadow-2xl hover:shadow-pink-200/50 transition-all"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img src={s.image} alt={s.title} className="w-full h-full object-cover group-hover:scale-110 transition duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute top-4 left-4 w-12 h-12 rounded-2xl bg-white/95 backdrop-blur flex items-center justify-center shadow-lg">
                    <s.icon className="w-6 h-6 text-pink-500" />
                  </div>
                  <div className="absolute bottom-4 right-4 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur text-xs font-bold text-pink-600">
                    {s.price}
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-2xl font-bold mb-2">{s.title}</h3>
                  <p className="text-zinc-600 text-sm leading-relaxed font-sans mb-4">{s.desc}</p>
                  <a
                    href="#agendar"
                    onClick={() => setSelectedService(s.title)}
                    className="inline-flex items-center gap-1.5 text-pink-500 font-semibold text-sm hover:gap-2.5 transition-all"
                  >
                    Ver Mais <ChevronRight className="w-4 h-4" />
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* GALERIA */}
      <section id="galeria" className="py-24 bg-gradient-to-b from-white to-pink-50/40">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-pink-500 text-xs font-bold tracking-[0.3em] uppercase mb-3">Resultados Reais</p>
            <h2 className="text-4xl md:text-5xl font-bold">Veja as <span className="italic text-pink-500">Transformações</span></h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {GALLERY.map((g, i) => (
              <motion.div
                key={g.title}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                onClick={() => setSelectedGalleryItem(g)}
                className="group relative aspect-[4/5] rounded-2xl overflow-hidden cursor-pointer"
              >
                <img src={g.image} alt={g.title} className="w-full h-full object-cover group-hover:scale-110 transition duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-pink-900/90 via-pink-900/20 to-transparent opacity-60 group-hover:opacity-100 transition" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                  <div className="bg-white/20 backdrop-blur-md border border-white/30 px-4 py-2 rounded-full text-white text-xs font-bold uppercase tracking-widest">
                    Ver Transformação
                  </div>
                </div>
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <h3 className="font-bold text-lg leading-tight">{g.title}</h3>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* DEPOIMENTOS */}
      <section id="depoimentos" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-pink-500 text-xs font-bold tracking-[0.3em] uppercase mb-3">O que dizem</p>
            <h2 className="text-4xl md:text-5xl font-bold">Depoimentos de <span className="italic text-pink-500">Clientes</span></h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 rounded-3xl bg-gradient-to-br from-pink-50 to-rose-50 border border-pink-100"
              >
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="w-5 h-5 fill-pink-500 text-pink-500" />
                  ))}
                </div>
                <p className="text-zinc-700 italic leading-relaxed mb-6 font-sans">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-white font-bold">
                    {t.name.charAt(0)}
                  </div>
                  <div className="font-semibold">{t.name}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AGENDAMENTO */}
      <section id="agendar" className="py-24 bg-gradient-to-br from-pink-500 via-rose-500 to-fuchsia-600 text-white">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-white/80 text-xs font-bold tracking-[0.3em] uppercase mb-3">Reserve seu horário</p>
            <h2 className="text-4xl md:text-5xl font-bold">Agendamento <span className="italic">Personalizado</span></h2>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 md:p-10 border border-white/20">
            {!showSummary ? (
              <form onSubmit={handleConfirm} className="grid grid-cols-1 md:grid-cols-2 gap-5 font-sans">
                <div>
                  <label className="block text-sm font-semibold mb-2">Selecione o serviço</label>
                  <select
                    required
                    value={selectedService}
                    onChange={(e) => setSelectedService(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/20 border border-white/30 text-white placeholder-white/60 focus:outline-none focus:bg-white/30"
                  >
                    <option value="" className="text-zinc-900">Escolha um serviço…</option>
                    {SERVICES.map((s) => (
                      <option key={s.title} value={s.title} className="text-zinc-900">
                        {s.title} — {s.price}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Data preferida</label>
                  <input
                    required
                    type="text"
                    inputMode="numeric"
                    placeholder="DD/MM/AAAA"
                    value={selectedDate}
                    onChange={(e) => {
                      let val = e.target.value.replace(/\D/g, '');
                      if (val.length > 8) val = val.slice(0, 8);
                      if (val.length > 4) val = val.slice(0, 2) + '/' + val.slice(2, 4) + '/' + val.slice(4);
                      else if (val.length > 2) val = val.slice(0, 2) + '/' + val.slice(2);
                      setSelectedDate(val);
                    }}
                    className="w-full px-4 py-3 rounded-xl bg-white/20 border border-white/30 text-white placeholder-white/60 focus:outline-none focus:bg-white/30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Horário</label>
                  <select
                    required
                    value={selectedHour}
                    onChange={(e) => setSelectedHour(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/20 border border-white/30 text-white focus:outline-none focus:bg-white/30"
                  >
                    <option value="" className="text-zinc-900">Escolha o horário…</option>
                    {HOURS.map((h) => (
                      <option key={h} value={h} className="text-zinc-900">{h}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Seu nome</label>
                  <input
                    required
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Como devemos te chamar?"
                    className="w-full px-4 py-3 rounded-xl bg-white/20 border border-white/30 text-white placeholder-white/60 focus:outline-none focus:bg-white/30"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold mb-2">WhatsApp / Telefone</label>
                  <input
                    required
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      let val = e.target.value.replace(/\D/g, '');
                      if (val.length > 11) val = val.slice(0, 11);
                      if (val.length > 10) val = `(${val.slice(0, 2)}) ${val.slice(2, 7)}-${val.slice(7)}`;
                      else if (val.length > 6) val = `(${val.slice(0, 2)}) ${val.slice(2, 6)}-${val.slice(6)}`;
                      else if (val.length > 2) val = `(${val.slice(0, 2)}) ${val.slice(2)}`;
                      else if (val.length > 0) val = `(${val}`;
                      setPhone(val);
                    }}
                    placeholder="(00) 00000-0000"
                    className="w-full px-4 py-3 rounded-xl bg-white/20 border border-white/30 text-white placeholder-white/60 focus:outline-none focus:bg-white/30"
                  />
                </div>
                <button
                  type="submit"
                  className="mt-4 md:col-span-2 w-full inline-flex items-center justify-center gap-3 bg-white text-pink-600 hover:bg-pink-50 font-bold py-4 rounded-2xl text-lg shadow-2xl transition-all hover:scale-[1.02]"
                >
                  <Sparkles className="w-5 h-5" /> Revisar Agendamento
                </button>
              </form>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center font-sans"
              >
                <div className="mb-8">
                  <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl shadow-green-500/20">
                    <Hand className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Quase lá, {name.split(' ')[0]}!</h3>
                  <p className="text-white/80">Confira os detalhes abaixo e confirme no WhatsApp.</p>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-left space-y-4 mb-8">
                  <div className="flex justify-between border-b border-white/10 pb-3">
                    <span className="text-white/60">Serviço:</span>
                    <span className="font-bold">{selectedService}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/10 pb-3">
                    <span className="text-white/60">Data:</span>
                    <span className="font-bold">{selectedDate}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/10 pb-3">
                    <span className="text-white/60">Horário:</span>
                    <span className="font-bold">{selectedHour}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Contato:</span>
                    <span className="font-bold">{phone}</span>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4">
                  <button
                    onClick={() => setShowSummary(false)}
                    className="flex-1 py-4 px-6 rounded-2xl border border-white/30 text-white font-semibold hover:bg-white/10 transition"
                  >
                    Alterar Dados
                  </button>
                  <a
                    href={buildWhatsAppLink()}
                    onClick={handleWhatsAppClick}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-[2] inline-flex items-center justify-center gap-3 bg-green-500 text-white hover:bg-green-600 font-bold py-4 rounded-2xl text-lg shadow-2xl transition-all hover:scale-[1.02]"
                  >
                    <MessageCircle className="w-6 h-6" /> Confirmar no WhatsApp
                  </a>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-zinc-950 text-white py-16">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-10 font-sans">
          <div className="md:col-span-2">
            <div className="text-3xl font-bold mb-4" style={{ fontFamily: '"Playfair Display", serif' }}>
              Studio <span className="text-pink-500 italic">Glamour</span>
            </div>
            <p className="text-zinc-400 text-sm leading-relaxed max-w-md">
              Um espaço pensado para realçar a sua melhor versão. Beleza, autocuidado e excelência em cada detalhe.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-4 text-pink-400">Contato</h4>
            <ul className="space-y-3 text-sm text-zinc-400">
              <li className="flex items-center gap-2"><Phone className="w-4 h-4 text-pink-500" /> (85) 9158-3732</li>
              <li className="flex items-center gap-2"><Instagram className="w-4 h-4 text-pink-500" /> @studio.glamour</li>
              <li className="flex items-center gap-2"><MapPin className="w-4 h-4 text-pink-500" /> Sua Cidade</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4 text-pink-400">Horário</h4>
            <ul className="space-y-3 text-sm text-zinc-400">
              <li className="flex items-center gap-2"><Clock className="w-4 h-4 text-pink-500" /> Seg–Sáb: 09h às 19h</li>
              <li className="flex items-center gap-2"><Clock className="w-4 h-4 text-pink-500" /> Domingo: Fechado</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-zinc-800 mt-12 pt-6 text-center text-xs text-zinc-500 font-sans">
          © {new Date().getFullYear()} Studio Glamour. Todos os direitos reservados.
        </div>
      </footer>

      {/* WhatsApp flutuante */}
      <a
        href={buildWhatsAppLink()}
        onClick={handleWhatsAppClick}
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center shadow-2xl shadow-green-500/40 transition-all hover:scale-110"
        aria-label="WhatsApp"
      >
        <MessageCircle className="w-7 h-7 text-white" />
      </a>

      {/* MODAL ANTES E DEPOIS */}
      <AnimatePresence>
        {selectedGalleryItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-8 bg-black/95 backdrop-blur-sm"
          >
            <button
              onClick={() => setSelectedGalleryItem(null)}
              className="absolute top-6 right-6 text-white/70 hover:text-white p-2 bg-white/10 rounded-full transition"
            >
              <X className="w-8 h-8" />
            </button>

            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="max-w-5xl w-full bg-zinc-900 rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl"
            >
              <div className="grid grid-cols-1 md:grid-cols-2">
                {/* Comparação */}
                <div className="relative aspect-[4/5] bg-zinc-800 flex flex-col">
                  <div className="flex-1 relative overflow-hidden group">
                    <img
                      src={selectedGalleryItem.before}
                      alt="Antes"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase">
                      Antes
                    </div>
                  </div>
                  <div className="h-px bg-white/20 relative z-10" />
                  <div className="flex-1 relative overflow-hidden group">
                    <img
                      src={selectedGalleryItem.image}
                      alt="Depois"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 left-4 bg-pink-500 text-white px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase shadow-lg">
                      Depois
                    </div>
                  </div>
                </div>

                {/* Detalhes */}
                <div className="p-8 md:p-12 flex flex-col justify-center text-white font-sans">
                  <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: '"Playfair Display", serif' }}>
                    {selectedGalleryItem.title}
                  </h2>
                  <p className="text-zinc-400 text-lg leading-relaxed mb-8">
                    {selectedGalleryItem.description}
                  </p>

                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center shrink-0">
                        <Sparkles className="w-5 h-5 text-pink-500" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white">Resultado Premium</h4>
                        <p className="text-zinc-500 text-sm">Realizado com as melhores técnicas e produtos do mercado.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center shrink-0">
                        <Heart className="w-5 h-5 text-pink-500" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white">Atendimento Único</h4>
                        <p className="text-zinc-500 text-sm">Cada transformação é personalizada para o seu estilo.</p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedGalleryItem(null);
                      document.getElementById('agendar')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="mt-12 w-full py-4 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold text-lg hover:shadow-2xl hover:shadow-pink-500/20 transition-all hover:scale-[1.02]"
                  >
                    Quero esse resultado
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

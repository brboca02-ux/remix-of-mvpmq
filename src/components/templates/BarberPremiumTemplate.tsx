import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { navigationService } from '@/lib/navigation-service';
import {
  Scissors,
  Star,
  Award,
  Clock,
  Phone,
  MapPin,
  Instagram,
  Facebook,
  MessageCircle,
  X,
  ChevronRight,
  ShieldCheck,
  Zap,
  Coffee,
  UserCheck,
} from 'lucide-react';

const SERVICES = [
  {
    title: 'CORTE PREMIUM',
    desc: 'Corte personalizado com acabamento impecável e lavagem inclusa.',
    price: 'R$ 60',
    icon: Scissors,
  },
  {
    title: 'BARBA',
    desc: 'Técnica tradicional com toalha quente e produtos de alta qualidade.',
    price: 'R$ 45',
    icon: UserCheck,
  },
  {
    title: 'COMBO CORTE + BARBA',
    desc: 'Experiência completa para seu visual e bem-estar.',
    price: 'R$ 95',
    icon: Award,
  },
  {
    title: 'LIMPEZA DE PELE',
    desc: 'Remoção de impurezas e hidratação profunda facial.',
    price: 'R$ 80',
    icon: Zap,
  },
  {
    title: 'DIA DO NOIVO',
    desc: 'Um dia exclusivo com serviços premium para o seu grande momento.',
    price: 'Sob consulta',
    icon: Coffee,
  },
];

const DIFFERENTIALS = [
  { icon: Award, title: 'Profissionais Premiados', desc: 'Especialistas reconhecidos e em constante evolução.' },
  { icon: Coffee, title: 'Lounge Bar', desc: 'Espaço exclusivo com bebidas e entretenimento enquanto espera.' },
  { icon: ShieldCheck, title: 'Produtos Importados', desc: 'As melhores marcas mundiais para o seu cuidado.' },
  { icon: Star, title: 'Atendimento VIP', desc: 'Foco total na sua experiência e satisfação.' },
];

const GALLERY = [
  {
    title: 'Corte Degradê',
    image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&h=1000&fit=crop',
    before: 'https://images.unsplash.com/photo-1621605815841-aa3444030614?w=800&h=1000&fit=crop',
    description: 'Transformação radical com fade lateral e acabamento artístico.',
  },
  {
    title: 'Barba Alinhada',
    image: 'https://images.unsplash.com/photo-1599351473299-d8395e69f16d?w=800&h=1000&fit=crop',
    before: 'https://images.unsplash.com/photo-1559599101-f09722fb4948?w=800&h=1000&fit=crop',
    description: 'Design de barba com visagismo e cuidados profissionais.',
  },
  {
    title: 'Estilo Moderno',
    image: 'https://images.unsplash.com/photo-1622286332613-521a0c752896?w=800&h=1000&fit=crop',
    before: 'https://images.unsplash.com/photo-1517832606299-7ae9b720a186?w=800&h=1000&fit=crop',
    description: 'Penteado com pomada matte e textura natural.',
  },
];

const TESTIMONIALS = [
  { name: 'Marcos Oliveira', text: 'Melhor barbearia da cidade! O atendimento é excepcional e o lounge bar faz toda a diferença.', rating: 5 },
  { name: 'Rafael Santos', text: 'Ambiente sensacional e profissionais de alto nível. Recomendo o combo corte e barba.', rating: 5 },
  { name: 'Lucas Mendes', text: 'O dia do noivo foi impecável. Todo o cuidado e atenção que eu precisava para o casamento.', rating: 5 },
];

const HOURS = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];
const WHATSAPP = '558591583732';

export const BarberPremiumTemplate: React.FC = () => {
  const [selectedService, setSelectedService] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedHour, setSelectedHour] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [showSummary, setShowSummary] = useState(false);
  const [selectedGalleryItem, setSelectedGalleryItem] = useState<(typeof GALLERY)[0] | null>(null);

  const buildWhatsAppLink = () => {
    const msg =
      `Olá! Gostaria de agendar na Premium Brasil:%0A%0A` +
      `👤 *Dados do Cliente*%0A` +
      `• Nome: ${name || '(não informado)'}%0A` +
      `• WhatsApp: ${phone || '(não informado)'}%0A%0A` +
      `📅 *Resumo do Agendamento*%0A` +
      `• Serviço: ${selectedService || '(não selecionado)'}%0A` +
      `• Data: ${selectedDate || '(não selecionada)'}%0A` +
      `• Horário: ${selectedHour || '(não selecionado)'}%0A%0A` +
      `_Enviado via Premium Brasil Web_`;
    return `https://wa.me/${WHATSAPP}?text=${msg}`;
  };

  const handleWhatsAppClick = () => {
    navigationService.handleCTA('whatsapp_conversion', {
      service: selectedService,
      date: selectedDate,
      hour: selectedHour,
      template: 'barber-premium'
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
      template: 'barber-premium'
    });
    setShowSummary(true);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100" style={{ fontFamily: '"Inter", sans-serif' }}>
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-40 backdrop-blur-md bg-neutral-950/80 border-b border-yellow-500/20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-xl font-black tracking-tighter">
            PREMIUM <span className="text-yellow-500">BRASIL</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-widest text-neutral-400">
            <a href="#home" className="hover:text-yellow-500 transition">Home</a>
            <a href="#servicos" className="hover:text-yellow-500 transition">Serviços</a>
            <a href="#galeria" className="hover:text-yellow-500 transition">Galeria</a>
            <a href="#agendar" className="hover:text-yellow-500 transition">Agendar</a>
          </div>
          <a
            href={buildWhatsAppLink()}
            onClick={handleWhatsAppClick}
            target="_blank"
            rel="noreferrer"
            className="bg-yellow-500 text-neutral-950 px-6 py-2 rounded-sm text-xs font-black uppercase tracking-widest hover:bg-yellow-400 transition-all"
          >
            Agende Agora
          </a>
        </div>
      </nav>

      {/* HERO */}
      <section id="home" className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1920&h=1080&fit=crop)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent" />
        
        <div className="relative z-10 text-center max-w-4xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block px-4 py-1 mb-8 border border-yellow-500/40 text-[10px] font-black uppercase tracking-[0.3em] text-yellow-500"
          >
            Barbearia & Lounge Bar
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl lg:text-7xl font-black leading-none mb-8 uppercase italic"
          >
            Venha para a <span className="text-yellow-500">Barbearia Premium Brasil</span>, a mais completa de Limeira
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-neutral-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 font-light leading-relaxed"
          >
            Muito mais que uma barbearia — um espaço premium com lounge bar, sinuca e experiências exclusivas para o homem moderno.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap justify-center gap-4"
          >
            <a href="#agendar" className="bg-yellow-500 text-neutral-950 px-10 py-4 font-black uppercase tracking-widest hover:bg-yellow-400 transition-all">
              Agende seu horário
            </a>
            <a href="#servicos" className="border border-neutral-700 px-10 py-4 font-black uppercase tracking-widest hover:bg-neutral-800 transition-all">
              Nossos Serviços
            </a>
          </motion.div>

          <div className="grid grid-cols-3 gap-8 mt-20 pt-20 border-t border-neutral-800">
            <div>
              <div className="text-3xl font-black text-yellow-500">500+</div>
              <div className="text-[10px] uppercase tracking-widest text-neutral-500">Clientes</div>
            </div>
            <div>
              <div className="text-3xl font-black text-yellow-500">4.9★</div>
              <div className="text-[10px] uppercase tracking-widest text-neutral-500">Google</div>
            </div>
            <div>
              <div className="text-3xl font-black text-yellow-500">5+</div>
              <div className="text-[10px] uppercase tracking-widest text-neutral-500">Anos</div>
            </div>
          </div>
        </div>
      </section>

      {/* DIFERENCIAIS */}
      <section className="py-32 bg-neutral-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {DIFFERENTIALS.map((d, i) => (
              <div key={i} className="group">
                <div className="w-12 h-12 flex items-center justify-center border border-yellow-500/20 mb-6 group-hover:bg-yellow-500 transition-all duration-500">
                  <d.icon className="w-5 h-5 text-yellow-500 group-hover:text-neutral-950" />
                </div>
                <h3 className="text-lg font-black uppercase mb-3 italic">{d.title}</h3>
                <p className="text-neutral-500 text-sm leading-relaxed">{d.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SERVIÇOS */}
      <section id="servicos" className="py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <div className="text-yellow-500 text-[10px] font-black uppercase tracking-[0.3em] mb-4">Experiência Completa</div>
            <h2 className="text-4xl md:text-5xl font-black uppercase italic">Nossos <span className="text-yellow-500">Serviços</span></h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-neutral-800">
            {SERVICES.map((s, i) => (
              <div key={i} className="bg-neutral-950 p-10 hover:bg-neutral-900 transition-colors group cursor-default">
                <s.icon className="w-8 h-8 text-yellow-500 mb-8" />
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-black uppercase italic">{s.title}</h3>
                  <span className="text-yellow-500 font-bold">{s.price}</span>
                </div>
                <p className="text-neutral-500 text-sm mb-8 leading-relaxed">{s.desc}</p>
                <button 
                  onClick={() => setSelectedService(s.title)}
                  className="text-[10px] font-black uppercase tracking-widest text-neutral-400 group-hover:text-yellow-500 transition-colors flex items-center gap-2"
                >
                  Agendar este <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GALERIA */}
      <section id="galeria" className="py-32 bg-neutral-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <div className="text-yellow-500 text-[10px] font-black uppercase tracking-[0.3em] mb-4">Antes & Depois</div>
            <h2 className="text-4xl md:text-5xl font-black uppercase italic">Nossa <span className="text-yellow-500">Galeria</span></h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {GALLERY.map((g, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -10 }}
                onClick={() => setSelectedGalleryItem(g)}
                className="group relative aspect-[3/4] overflow-hidden cursor-pointer border border-neutral-800"
              >
                <img src={g.image} alt={g.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 to-transparent opacity-80" />
                <div className="absolute bottom-8 left-8 right-8">
                  <h3 className="text-xl font-black uppercase italic mb-2">{g.title}</h3>
                  <div className="text-[10px] font-black uppercase tracking-widest text-yellow-500 flex items-center gap-2">
                    Ver Transformação <ChevronRight className="w-3 h-3" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AGENDAMENTO */}
      <section id="agendar" className="py-32 bg-yellow-500 text-neutral-950">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="text-neutral-900 text-[10px] font-black uppercase tracking-[0.3em] mb-4">Horário Marcado</div>
            <h2 className="text-4xl md:text-5xl font-black uppercase italic">Agende seu <span className="text-white">Estilo</span></h2>
          </div>

          <div className="bg-neutral-950 text-neutral-100 p-8 md:p-12 border border-neutral-800">
            {!showSummary ? (
              <form onSubmit={handleConfirm} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Nome Completo</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-neutral-900 border-neutral-800 border p-4 focus:border-yellow-500 outline-none transition-colors"
                      placeholder="Seu nome"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">WhatsApp</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-neutral-900 border-neutral-800 border p-4 focus:border-yellow-500 outline-none transition-colors"
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Serviço</label>
                    <select
                      value={selectedService}
                      onChange={(e) => setSelectedService(e.target.value)}
                      className="w-full bg-neutral-900 border-neutral-800 border p-4 focus:border-yellow-500 outline-none transition-colors appearance-none"
                    >
                      <option value="">Selecione um serviço</option>
                      {SERVICES.map(s => <option key={s.title} value={s.title}>{s.title}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Data</label>
                    <input
                      type="date"
                      required
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full bg-neutral-900 border-neutral-800 border p-4 focus:border-yellow-500 outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Escolha o Horário</label>
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                    {HOURS.map(h => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => setSelectedHour(h)}
                        className={`p-3 text-xs font-bold border transition-all ${
                          selectedHour === h 
                            ? 'bg-yellow-500 border-yellow-500 text-neutral-950' 
                            : 'border-neutral-800 hover:border-yellow-500/50'
                        }`}
                      >
                        {h}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-yellow-500 text-neutral-950 py-5 font-black uppercase tracking-widest hover:bg-yellow-400 transition-all flex items-center justify-center gap-3"
                >
                  Confirmar Agendamento <ChevronRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-8"
              >
                <div className="w-20 h-20 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-8">
                  <Star className="w-10 h-10 text-neutral-950" />
                </div>
                <h3 className="text-3xl font-black uppercase italic">Quase lá, {name.split(' ')[0]}!</h3>
                <div className="bg-neutral-900 p-8 border border-neutral-800 space-y-4 text-left">
                  <div className="flex justify-between text-sm border-b border-neutral-800 pb-2">
                    <span className="text-neutral-500 uppercase tracking-widest text-[10px] font-black">Serviço</span>
                    <span className="font-bold uppercase">{selectedService}</span>
                  </div>
                  <div className="flex justify-between text-sm border-b border-neutral-800 pb-2">
                    <span className="text-neutral-500 uppercase tracking-widest text-[10px] font-black">Data</span>
                    <span className="font-bold">{selectedDate}</span>
                  </div>
                  <div className="flex justify-between text-sm border-b border-neutral-800 pb-2">
                    <span className="text-neutral-500 uppercase tracking-widest text-[10px] font-black">Horário</span>
                    <span className="font-bold">{selectedHour}</span>
                  </div>
                </div>
                <p className="text-neutral-400 text-sm italic">Clique no botão abaixo para finalizar no WhatsApp e garantir seu horário.</p>
                <div className="flex flex-col gap-4">
                  <a
                    href={buildWhatsAppLink()}
                    onClick={handleWhatsAppClick}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full bg-green-500 text-white py-5 font-black uppercase tracking-widest hover:bg-green-600 transition-all flex items-center justify-center gap-3 shadow-xl shadow-green-500/20"
                  >
                    <MessageCircle className="w-5 h-5" /> Finalizar no WhatsApp
                  </a>
                  <button 
                    onClick={() => setShowSummary(false)}
                    className="text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:text-white transition-colors"
                  >
                    Editar informações
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-20 border-t border-neutral-800 bg-neutral-950">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-20">
            <div>
              <div className="text-2xl font-black tracking-tighter mb-6">
                PREMIUM <span className="text-yellow-500">BRASIL</span>
              </div>
              <p className="text-neutral-500 text-sm leading-relaxed max-w-xs">
                A mais completa barbearia de Limeira. Excelência em cuidados masculinos e um ambiente exclusivo para você.
              </p>
            </div>
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-yellow-500 mb-6">Localização</h4>
              <div className="flex items-start gap-4 text-neutral-400 text-sm">
                <MapPin className="w-5 h-5 text-yellow-500 shrink-0" />
                <p>R. Exemplo, 123 — Centro<br />Limeira/SP</p>
              </div>
            </div>
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-yellow-500 mb-6">Redes Sociais</h4>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 border border-neutral-800 flex items-center justify-center hover:border-yellow-500 transition-colors">
                  <Instagram className="w-4 h-4" />
                </a>
                <a href="#" className="w-10 h-10 border border-neutral-800 flex items-center justify-center hover:border-yellow-500 transition-colors">
                  <Facebook className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
          <div className="text-[10px] font-black uppercase tracking-[0.4em] text-neutral-700 text-center">
            © 2026 PREMIUM BRASIL — TODOS OS DIREITOS RESERVADOS
          </div>
        </div>
      </footer>

      {/* MODAL ANTES E DEPOIS */}
      <AnimatePresence>
        {selectedGalleryItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/95 backdrop-blur-xl"
            onClick={() => setSelectedGalleryItem(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-neutral-900 w-full max-w-5xl rounded-sm overflow-hidden border border-neutral-800"
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => setSelectedGalleryItem(null)}
                className="absolute top-4 right-4 z-10 w-10 h-10 bg-neutral-950 flex items-center justify-center hover:text-yellow-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2">
                <div className="relative aspect-[4/5] bg-neutral-800">
                  <div className="absolute top-4 left-4 z-10 bg-neutral-950/80 px-4 py-1 text-[10px] font-black uppercase tracking-widest border border-yellow-500/20">Antes</div>
                  <img src={selectedGalleryItem.before} alt="Antes" className="w-full h-full object-cover" />
                </div>
                <div className="relative aspect-[4/5] bg-neutral-800 border-l border-neutral-800">
                  <div className="absolute top-4 left-4 z-10 bg-yellow-500 px-4 py-1 text-[10px] font-black uppercase tracking-widest text-neutral-950">Depois</div>
                  <img src={selectedGalleryItem.image} alt="Depois" className="w-full h-full object-cover" />
                </div>
              </div>

              <div className="p-8 border-t border-neutral-800 bg-neutral-950">
                <h3 className="text-2xl font-black uppercase italic mb-2 text-yellow-500">{selectedGalleryItem.title}</h3>
                <p className="text-neutral-400 text-sm font-light leading-relaxed">{selectedGalleryItem.description}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

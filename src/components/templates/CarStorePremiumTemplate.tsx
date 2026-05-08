import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { navigationService } from '@/lib/navigation-service';
import {
  Car,
  Zap,
  ShieldCheck,
  Star,
  CheckCircle2,
  ChevronRight,
  MessageCircle,
  X,
  Phone,
  MapPin,
  Calendar,
  Search,
  ArrowRight,
  TrendingUp,
  Award,
  Filter,
  Heart,
  Gauge,
  Settings,
  Fuel,
} from 'lucide-react';

const STATS = [
  { value: '200+', label: 'Veículos Disponíveis' },
  { value: '15 anos', label: 'No Mercado' },
  { value: '4.8★', label: 'Avaliação Google' },
  { value: '100%', label: 'Procedência Verificada' },
];

const VEHICLES = [
  {
    id: 1,
    make: 'BMW',
    model: '320i',
    version: '2.0 Sport GP Turbo',
    year: '2022/2022',
    km: '18.500 km',
    transmission: 'Automático',
    fuel: 'Flex',
    price: 'R$ 265.900',
    tag: 'Baixou o preço',
    image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&q=80',
  },
  {
    id: 2,
    make: 'Porsche',
    model: 'Taycan',
    version: 'Electric 4S',
    year: '2023/2023',
    km: '2.100 km',
    transmission: 'Automático',
    fuel: 'Elétrico',
    price: 'R$ 890.000',
    tag: 'Oportunidade',
    image: 'https://images.unsplash.com/photo-1614200024993-21443425f82c?w=800&q=80',
  },
  {
    id: 3,
    make: 'Mercedes-Benz',
    model: 'GLC 300',
    version: 'Coupe AMG Line',
    year: '2021/2021',
    km: '32.000 km',
    transmission: 'Automático',
    fuel: 'Híbrido',
    price: 'R$ 415.000',
    tag: 'Único Dono',
    image: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&q=80',
  },
  {
    id: 4,
    make: 'Audi',
    model: 'Q3',
    version: '35 TFSI Black',
    year: '2022/2023',
    km: '12.400 km',
    transmission: 'Automático',
    fuel: 'Flex',
    price: 'R$ 248.900',
    tag: 'IPVA Pago',
    image: 'https://images.unsplash.com/photo-1606148281135-e5da4a6e3006?w=800&q=80',
  },
];

const WHATSAPP = '558591583732';

export const CarStorePremiumTemplate: React.FC = () => {
  const [selectedBrand, setSelectedBrand] = useState('Todas');
  const [priceRange, setPriceRange] = useState([60000, 900000]);
  const [showContactForm, setShowContactForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', interest: '' });

  const buildWhatsAppLink = (vehicle?: typeof VEHICLES[0]) => {
    let msg = `Olá! Vi o anúncio no site e gostaria de mais informações.`;
    if (vehicle) {
      msg = `Olá! Vi o *${vehicle.make} ${vehicle.model}* (${vehicle.price}) no site e gostaria de saber mais detalhes.`;
    }
    return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`;
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigationService.handleCTA('car_interest_form', formData);
    const msg = `Olá! Sou *${formData.name}*. Tenho interesse em: *${formData.interest}*. Meu WhatsApp é ${formData.phone}.`;
    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 selection:bg-cyan-500 selection:text-slate-900" style={{ fontFamily: '"Inter", sans-serif' }}>
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-[#020617]/80 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer">
            <div className="w-10 h-10 bg-cyan-500 rounded-lg flex items-center justify-center group-hover:rotate-12 transition-transform">
              <Car className="w-6 h-6 text-slate-950" />
            </div>
            <div className="text-xl font-black tracking-tighter">
              AUTO<span className="text-cyan-500">DRIVE</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-8 text-[11px] font-bold uppercase tracking-widest text-slate-400">
            <a href="#home" className="hover:text-cyan-500 transition">Início</a>
            <a href="#estoque" className="hover:text-cyan-500 transition">Estoque</a>
            <a href="#diferenciais" className="hover:text-cyan-500 transition">Diferenciais</a>
            <a href="#contato" className="hover:text-cyan-500 transition">Contato</a>
          </div>
          <a
            href={`https://wa.me/${WHATSAPP}`}
            target="_blank"
            className="bg-cyan-500 text-slate-950 px-6 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest hover:bg-cyan-400 transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-2"
          >
            <MessageCircle className="w-4 h-4" /> WhatsApp
          </a>
        </div>
      </nav>

      {/* HERO */}
      <section id="home" className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#020617]/60 to-[#020617]" />
          <img 
            src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1920&q=80" 
            alt="Luxury Car" 
            className="w-full h-full object-cover opacity-20"
          />
        </div>
        
        <div className="relative z-10 text-center max-w-5xl px-6">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl md:text-8xl font-black leading-[0.9] mb-8 tracking-tighter"
          >
            Pensando em comprar <br/> um <span className="text-cyan-500">carro novo</span>?
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-12 font-medium leading-relaxed"
          >
            Encontre o veículo ideal entre as melhores marcas do mercado. Procedência garantida e as melhores taxas do Brasil.
          </motion.p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16 max-w-4xl mx-auto">
            {STATS.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 + 0.2 }}
              >
                <div className="text-3xl font-black text-white mb-1">{stat.value}</div>
                <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500 leading-tight">{stat.label}</div>
              </motion.div>
            ))}
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <a href="#estoque" className="bg-cyan-500 text-slate-950 px-10 py-5 rounded-full font-black uppercase tracking-widest hover:bg-cyan-400 transition-all inline-flex items-center gap-2 group shadow-xl shadow-cyan-500/20">
              <Search className="w-4 h-4" /> Ver Estoque Completo
            </a>
          </motion.div>
        </div>
      </section>

      {/* ESTOQUE */}
      <section id="estoque" className="py-32 bg-[#050b1a]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="text-cyan-500 text-[11px] font-black uppercase tracking-[0.3em] mb-4">Estoque</div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight uppercase italic">Veículos em <span className="text-cyan-500">destaque</span></h2>
          </div>

          {/* FILTERS */}
          <div className="bg-[#0a1226] border border-white/5 p-6 rounded-3xl mb-12 flex flex-col md:flex-row gap-8 items-end">
            <div className="flex-1 space-y-2 w-full">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Filter className="w-3 h-3" /> Marca
              </label>
              <select 
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="w-full bg-[#020617] border-white/10 border p-3 rounded-xl focus:border-cyan-500 outline-none transition-colors text-white text-sm"
              >
                <option>Todas</option>
                <option>BMW</option>
                <option>Porsche</option>
                <option>Mercedes-Benz</option>
                <option>Audi</option>
                <option>Volvo</option>
              </select>
            </div>
            <div className="flex-1 space-y-4 w-full">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Faixa de Preço</label>
                <span className="text-xs font-bold text-white">R$ 60.000 — R$ 900.000</span>
              </div>
              <div className="h-2 bg-[#020617] rounded-full relative">
                <div className="absolute left-0 right-0 h-full bg-cyan-500/20 rounded-full" />
                <div className="absolute left-[10%] right-[10%] h-full bg-cyan-500 rounded-full" />
                <div className="absolute left-[10%] top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg cursor-pointer" />
                <div className="absolute right-[10%] top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg cursor-pointer" />
              </div>
            </div>
            <div className="text-[10px] font-bold text-slate-500 uppercase pb-1">
              8 veículos encontrados
            </div>
          </div>

          {/* GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {VEHICLES.map((v) => (
              <motion.div 
                key={v.id}
                whileHover={{ y: -5 }}
                className="group bg-[#0a1226] border border-white/5 rounded-3xl overflow-hidden hover:border-cyan-500/30 transition-all shadow-xl"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img src={v.image} alt={v.model} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute top-4 left-4">
                    <span className="bg-rose-500 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">
                      {v.tag}
                    </span>
                  </div>
                  <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center hover:bg-rose-500 transition-colors">
                    <Heart className="w-4 h-4 text-white" />
                  </button>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a1226] via-transparent to-transparent opacity-60" />
                </div>
                <div className="p-6">
                  <h3 className="text-2xl font-black italic uppercase leading-tight group-hover:text-cyan-500 transition-colors">{v.make} {v.model}</h3>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-tight mb-4">{v.version}</p>
                  
                  <div className="grid grid-cols-2 gap-y-3 gap-x-2 mb-6 border-t border-white/5 pt-4">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
                      <Gauge className="w-3 h-3 text-cyan-500" /> {v.km}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
                      <Calendar className="w-3 h-3 text-cyan-500" /> {v.year}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
                      <Settings className="w-3 h-3 text-cyan-500" /> {v.transmission}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
                      <Fuel className="w-3 h-3 text-cyan-500" /> {v.fuel}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div className="text-xl font-black text-white">{v.price}</div>
                    <a 
                      href={buildWhatsAppLink(v)} 
                      target="_blank"
                      className="bg-white/5 hover:bg-cyan-500 hover:text-slate-950 p-2.5 rounded-xl transition-all"
                    >
                      <MessageCircle className="w-5 h-5" />
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <button className="text-cyan-500 font-black uppercase tracking-[0.2em] text-xs hover:underline flex items-center gap-2 mx-auto">
              Ver todos os veículos <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* DIFERENCIAIS */}
      <section id="diferenciais" className="py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div>
              <div className="text-cyan-500 text-[11px] font-black uppercase tracking-[0.3em] mb-4">Diferenciais</div>
              <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-8 uppercase italic leading-[0.9]">
                Compromisso com a sua <span className="text-cyan-500">segurança</span> e satisfação
              </h2>
              <p className="text-slate-400 text-lg mb-12 leading-relaxed">
                Mais do que vender carros, entregamos sonhos com transparência total. Cada veículo em nosso estoque passa por uma rigorosa inspeção de 150 itens.
              </p>
              
              <div className="space-y-6">
                {[
                  { icon: ShieldCheck, title: 'Procedência 100% Garantida', desc: 'Laudo cautelar aprovado em todos os veículos.' },
                  { icon: Zap, title: 'Financiamento na Hora', desc: 'Aprovação rápida com as melhores taxas do mercado.' },
                  { icon: Award, title: 'Garantia de Motor e Câmbio', desc: 'Sua tranquilidade garantida por contrato.' },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 group">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center shrink-0 group-hover:bg-cyan-500 transition-colors">
                      <item.icon className="w-6 h-6 text-cyan-500 group-hover:text-slate-950" />
                    </div>
                    <div>
                      <h4 className="text-white font-black uppercase tracking-tight mb-1">{item.title}</h4>
                      <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-[3rem] overflow-hidden">
                <img src="https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800&q=80" alt="Showroom" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-10 -left-10 bg-cyan-500 p-8 rounded-[2rem] shadow-2xl max-w-[240px]">
                <div className="text-4xl font-black text-slate-950 mb-1">4.8</div>
                <div className="flex text-slate-950 mb-2">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
                </div>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-950/70">
                  Avaliação média baseada em +500 clientes.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CONTATO */}
      <section id="contato" className="py-32 bg-[#050b1a]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-cyan-500 rounded-[3rem] p-8 md:p-16 flex flex-col lg:flex-row gap-16 items-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
            
            <div className="flex-1 text-slate-950 relative z-10">
              <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-8 uppercase italic leading-[0.9]">
                Pronto para acelerar seu <span className="text-white">próximo carro</span>?
              </h2>
              <p className="text-slate-900/70 text-lg font-medium mb-12 max-w-md">
                Fale agora com um de nossos consultores e receba uma avaliação personalizada para sua troca ou financiamento.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-slate-950 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-cyan-500" />
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest opacity-60 text-slate-900">Telefone / WhatsApp</div>
                    <div className="font-black text-2xl">(85) 99158-3732</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-slate-950 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-cyan-500" />
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest opacity-60 text-slate-900">Localização</div>
                    <div className="font-black text-xl uppercase italic">Limeira, São Paulo</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full lg:w-[450px] relative z-10">
              <form onSubmit={handleContactSubmit} className="bg-slate-950 p-8 md:p-10 rounded-[2rem] shadow-2xl border border-white/5 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Nome Completo</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Seu nome"
                    className="w-full bg-[#020617] border-white/5 border p-4 rounded-xl focus:border-cyan-500 outline-none transition-colors text-white"
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">WhatsApp</label>
                  <input 
                    type="tel" 
                    required 
                    placeholder="(00) 00000-0000"
                    className="w-full bg-[#020617] border-white/5 border p-4 rounded-xl focus:border-cyan-500 outline-none transition-colors text-white"
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Tenho interesse em...</label>
                  <select 
                    className="w-full bg-[#020617] border-white/5 border p-4 rounded-xl focus:border-cyan-500 outline-none transition-colors text-white appearance-none"
                    onChange={(e) => setFormData({...formData, interest: e.target.value})}
                  >
                    <option value="">Selecione uma opção</option>
                    <option value="Comprar um veículo">Comprar um veículo</option>
                    <option value="Trocar meu veículo">Trocar meu veículo</option>
                    <option value="Financiamento">Simular Financiamento</option>
                    <option value="Consórcio">Consórcio</option>
                  </select>
                </div>
                <button type="submit" className="w-full bg-cyan-500 text-slate-950 py-5 rounded-xl font-black uppercase tracking-widest hover:bg-cyan-400 transition-all shadow-xl shadow-cyan-500/20 flex items-center justify-center gap-2 group">
                  Falar com Consultor <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 border-t border-white/5 bg-[#020617]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center">
              <Car className="w-5 h-5 text-cyan-500" />
            </div>
            <div className="text-lg font-black tracking-tighter uppercase italic">
              AUTO<span className="text-cyan-500">DRIVE</span>
            </div>
          </div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">
            © 2026 AutoDrive Premium. Todos os direitos reservados.
          </p>
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:border-cyan-500 transition-colors cursor-pointer">
              <span className="text-[10px] font-black">IG</span>
            </div>
            <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:border-cyan-500 transition-colors cursor-pointer">
              <span className="text-[10px] font-black">FB</span>
            </div>
          </div>
        </div>
      </footer>

      {/* FLOATING WHATSAPP */}
      <a 
        href={`https://wa.me/${WHATSAPP}`}
        target="_blank"
        className="fixed bottom-8 right-8 z-50 w-16 h-16 bg-[#25D366] rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform group"
      >
        <MessageCircle className="w-8 h-8 text-white" />
        <span className="absolute right-full mr-4 bg-white text-slate-900 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl">
          Falar no WhatsApp
        </span>
      </a>
    </div>
  );
};
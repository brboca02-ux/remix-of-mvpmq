import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { navigationService } from '@/lib/navigation-service';
import {
  Smartphone,
  Zap,
  ShieldCheck,
  Star,
  CheckCircle2,
  ChevronRight,
  MessageCircle,
  X,
  Phone,
  MapPin,
  Search,
  ArrowRight,
  TrendingUp,
  Award,
  Filter,
  Heart,
  Battery,
  Cpu,
  Camera,
  Layers,
  ShoppingBag,
  User,
  Menu,
} from 'lucide-react';

const CATEGORIES = ['Todos', 'Smartphones', 'Acessórios', 'Ofertas', 'Nossas Lojas'];

const PRODUCTS = [
  {
    id: 1,
    brand: 'Apple',
    name: 'iPhone 15 Pro Max',
    version: '256GB - Titânio Natural',
    price: 'R$ 8.499',
    cashPrice: 'R$ 7.649',
    tag: 'Lançamento',
    image: 'https://images.unsplash.com/photo-1696446701796-da61225697cc?w=800&q=80',
    specs: { battery: '29h vídeo', cpu: 'A17 Pro', camera: '48MP Main' }
  },
  {
    id: 2,
    brand: 'Samsung',
    name: 'Galaxy S24 Ultra',
    version: '512GB - Titanium Black',
    price: 'R$ 7.299',
    cashPrice: 'R$ 6.569',
    tag: 'Oferta',
    image: 'https://images.unsplash.com/photo-1707065094917-c453006d64ca?w=800&q=80',
    specs: { battery: '30h vídeo', cpu: 'Snapdragon 8 Gen 3', camera: '200MP Main' }
  },
  {
    id: 3,
    brand: 'Apple',
    name: 'iPhone 14',
    version: '128GB - Meia-noite',
    price: 'R$ 4.299',
    cashPrice: 'R$ 3.869',
    tag: 'Mais Vendido',
    image: 'https://images.unsplash.com/photo-1663499482523-1c0c1bae4ce1?w=800&q=80',
    specs: { battery: '20h vídeo', cpu: 'A15 Bionic', camera: '12MP Dual' }
  },
  {
    id: 4,
    brand: 'Samsung',
    name: 'Galaxy Z Fold5',
    version: '512GB - Icy Blue',
    price: 'R$ 10.999',
    cashPrice: 'R$ 9.899',
    tag: 'Premium',
    image: 'https://images.unsplash.com/photo-1691435252002-3f1090333d45?w=800&q=80',
    specs: { battery: '21h vídeo', cpu: 'Snapdragon 8 Gen 2', camera: '50MP Triple' }
  },
];

const STORES = [
  { city: 'São Paulo', address: 'Av. Paulista, 1234 - Bela Vista', phone: '(11) 3214-5566' },
  { city: 'Rio de Janeiro', address: 'Rua Visconde de Pirajá, 550 - Ipanema', phone: '(21) 2512-8899' },
  { city: 'Fortaleza', address: 'Av. Dom Luís, 300 - Aldeota', phone: '(85) 3458-1122' },
];

const WHATSAPP = '558591583732';

export const PhoneStoreTemplate: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const buildWhatsAppLink = (product?: typeof PRODUCTS[0]) => {
    let msg = `Olá! Vi o site e gostaria de saber mais sobre os celulares disponíveis.`;
    if (product) {
      msg = `Olá! Vi o *${product.name}* no site e gostaria de saber mais detalhes sobre preço e estoque.`;
    }
    return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`;
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-blue-500 selection:text-white" style={{ fontFamily: '"Inter", sans-serif' }}>
      {/* TOP BAR */}
      <div className="bg-[#001529] text-white py-2 px-6 text-[10px] font-bold uppercase tracking-widest flex justify-between items-center">
        <div className="flex gap-4">
          <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-yellow-400" /> Frete grátis acima de R$ 500</span>
          <span className="hidden sm:inline">Até 12x sem juros</span>
        </div>
        <div className="flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-green-400" /> Compra 100% segura</div>
      </div>

      {/* NAV */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2 group cursor-pointer">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
                <Smartphone className="w-6 h-6" />
              </div>
              <div className="text-xl font-black tracking-tighter">
                INFINDA<span className="text-blue-600">CEL</span>
              </div>
            </div>
            
            <div className="hidden lg:flex items-center gap-6 text-[11px] font-bold uppercase tracking-widest text-slate-500">
              {CATEGORIES.map(cat => (
                <a key={cat} href={`#${cat.toLowerCase()}`} className="hover:text-blue-600 transition">{cat}</a>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex relative group">
              <input 
                type="text" 
                placeholder="Buscar celulares, acessórios..." 
                className="bg-slate-100 border-none rounded-full py-2 px-6 pr-10 text-xs w-64 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2" />
            </div>
            
            <button className="p-2 text-slate-400 hover:text-blue-600 transition"><User className="w-5 h-5" /></button>
            <button className="p-2 text-slate-400 hover:text-blue-600 transition relative">
              <ShoppingBag className="w-5 h-5" />
              <span className="absolute top-0 right-0 w-4 h-4 bg-blue-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">0</span>
            </button>
            <button className="lg:hidden p-2 text-slate-400" onClick={() => setIsMenuOpen(!isMenuOpen)}><Menu className="w-6 h-6" /></button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative bg-[#001529] pt-20 pb-32 overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-20 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-l from-blue-600/20 to-transparent" />
        </div>
        
        <div className="max-w-7xl mx-auto px-6 relative z-10 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="text-blue-400 text-xs font-black uppercase tracking-[0.3em] mb-4">Infinda Cel — Novidade</div>
            <h1 className="text-5xl md:text-7xl font-black text-white leading-[0.9] mb-6 tracking-tighter">
              iPhone 15 <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Pro Max</span>
            </h1>
            <p className="text-slate-400 text-lg md:text-xl max-w-lg mb-10 font-medium">
              O mais poderoso iPhone. Chegou na Infinda Cel com condições imperdíveis de lançamento.
            </p>
            <div className="flex flex-wrap gap-4">
              <a href="#estoque" className="bg-blue-600 text-white px-10 py-4 rounded-full font-black uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center gap-2 group">
                Confira Agora <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
              <a href={buildWhatsAppLink()} target="_blank" className="bg-white/10 text-white backdrop-blur-md px-10 py-4 rounded-full font-black uppercase tracking-widest hover:bg-white/20 transition-all flex items-center gap-2">
                Falar com Consultor
              </a>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="relative"
          >
            <div className="aspect-[4/3] rounded-[2rem] overflow-hidden shadow-2xl">
              <img src="https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=1000&q=80" alt="iPhone 15 Pro" className="w-full h-full object-cover" />
            </div>
            <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-2xl shadow-xl flex items-center gap-4 border border-slate-100">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-black">95%</div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Satisfação</div>
                <div className="text-sm font-black">Clientes Recomendam</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-20 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
            {[
              { icon: Camera, title: 'Melhor qualidade nas fotos' },
              { icon: Battery, title: 'Bateria de longa duração' },
              { icon: Smartphone, title: 'Espaço para todos seus apps' },
              { icon: Zap, title: 'Performance em jogos' },
              { icon: Layers, title: 'Telas incríveis' },
            ].map((f, i) => (
              <div key={i} className="flex flex-col items-center text-center group cursor-default">
                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                  <f.icon className="w-6 h-6 text-slate-400 group-hover:text-blue-600" />
                </div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 leading-tight">{f.title}</h4>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRODUCTS */}
      <section id="estoque" className="py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="text-blue-600 text-[11px] font-black uppercase tracking-[0.3em] mb-4">Os mais procurados</div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight uppercase italic">Smartphones em <span className="text-blue-600">Destaque</span></h2>
          </div>

          {/* FILTERS */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {['Todos', 'Para Jogos', 'Criadores de Conteúdo', 'Bateria p/ o Dia Todo', 'Uso Básico'].map(filter => (
              <button
                key={filter}
                onClick={() => setSelectedCategory(filter)}
                className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                  selectedCategory === filter ? 'bg-[#001529] text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PRODUCTS.map((p) => (
              <motion.div
                key={p.id}
                whileHover={{ y: -5 }}
                className="group bg-white border border-slate-100 rounded-3xl overflow-hidden hover:border-blue-200 transition-all hover:shadow-2xl hover:shadow-blue-500/10"
              >
                <div className="relative aspect-square overflow-hidden bg-slate-50">
                  <img src={p.image} alt={p.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute top-4 left-4">
                    <span className="bg-[#001529] text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                      {p.tag}
                    </span>
                  </div>
                  <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100">
                    <Heart className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-6">
                  <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">{p.brand}</div>
                  <h3 className="text-lg font-black italic uppercase leading-tight mb-2 group-hover:text-blue-600 transition-colors">{p.name}</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mb-4">{p.version}</p>
                  
                  <div className="space-y-1 mb-6">
                    <div className="text-xs text-slate-400 line-through">{p.price}</div>
                    <div className="text-2xl font-black text-[#001529]">{p.cashPrice} <span className="text-[10px] font-bold text-slate-400 uppercase ml-1">à vista</span></div>
                    <div className="text-[10px] font-bold text-blue-600 uppercase">ou em 12x de {(parseInt(p.price.replace(/\D/g,''))/12).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                  </div>

                  <div className="flex gap-2">
                    <a 
                      href={buildWhatsAppLink(p)} 
                      target="_blank"
                      className="flex-1 bg-[#001529] text-white py-3 rounded-xl font-black uppercase tracking-widest text-[10px] text-center hover:bg-blue-600 transition-all"
                    >
                      Comprar Agora
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            <div>
              <div className="text-4xl font-black text-[#001529] mb-2">180+</div>
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Lojas em todo o Brasil</div>
            </div>
            <div>
              <div className="text-4xl font-black text-[#001529] mb-2">500 mil+</div>
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Clientes satisfeitos</div>
            </div>
            <div>
              <div className="text-4xl font-black text-[#001529] mb-2">10 anos</div>
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">No mercado de tecnologia</div>
            </div>
          </div>
        </div>
      </section>

      {/* STORES */}
      <section id="nossas lojas" className="py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div>
              <div className="text-blue-600 text-[11px] font-black uppercase tracking-[0.3em] mb-4">Expansão</div>
              <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-8 uppercase italic leading-[0.9]">
                Visite uma de <br/> nossas <span className="text-blue-600">Lojas Físicas</span>
              </h2>
              <div className="space-y-6">
                {STORES.map((s, i) => (
                  <div key={i} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-200 transition-all group">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-black uppercase tracking-tight text-lg">{s.city}</h4>
                      <MapPin className="w-5 h-5 text-blue-600" />
                    </div>
                    <p className="text-slate-500 text-sm mb-4">{s.address}</p>
                    <div className="flex items-center gap-2 text-xs font-bold text-blue-600">
                      <Phone className="w-3 h-3" /> {s.phone}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="aspect-[4/5] rounded-[3rem] overflow-hidden shadow-2xl">
                <img src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80" alt="Store Front" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-10 -right-10 bg-blue-600 p-8 rounded-[2rem] text-white shadow-2xl max-w-[280px]">
                <h4 className="text-2xl font-black mb-2 italic">Seja um franqueado</h4>
                <p className="text-white/80 text-xs mb-6 leading-relaxed">Invista no mercado que mais cresce no Brasil e tenha sua própria Infinda Cel.</p>
                <button className="bg-white text-blue-600 px-6 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] w-full">Saiba Mais</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#001529] pt-20 pb-10 text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-20">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-white" />
                </div>
                <div className="text-lg font-black tracking-tighter">
                  INFINDA<span className="text-blue-600">CEL</span>
                </div>
              </div>
              <p className="text-slate-500 text-xs leading-relaxed max-w-xs">
                A maior rede de lojas de tecnologia do Brasil. Especialistas em iPhones e smartphones premium com as melhores condições de pagamento.
              </p>
            </div>
            
            <div>
              <h4 className="font-black uppercase tracking-widest text-[10px] text-blue-600 mb-6">Institucional</h4>
              <ul className="space-y-4 text-xs font-bold text-slate-400 uppercase tracking-tight">
                <li><a href="#" className="hover:text-white transition">Sobre Nós</a></li>
                <li><a href="#" className="hover:text-white transition">Nossas Lojas</a></li>
                <li><a href="#" className="hover:text-white transition">Seja Franqueado</a></li>
                <li><a href="#" className="hover:text-white transition">Políticas</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-black uppercase tracking-widest text-[10px] text-blue-600 mb-6">Atendimento</h4>
              <ul className="space-y-4 text-xs font-bold text-slate-400 uppercase tracking-tight">
                <li><a href="#" className="hover:text-white transition">Meus Pedidos</a></li>
                <li><a href="#" className="hover:text-white transition">Trocas e Devoluções</a></li>
                <li><a href="#" className="hover:text-white transition">Assistência Técnica</a></li>
                <li><a href="#" className="hover:text-white transition">Fale Conosco</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-black uppercase tracking-widest text-[10px] text-blue-600 mb-6">Novidades</h4>
              <p className="text-[10px] text-slate-500 font-bold uppercase mb-4 leading-relaxed">Assine para receber ofertas exclusivas e lançamentos.</p>
              <div className="flex gap-2">
                <input type="email" placeholder="Seu e-mail" className="bg-white/5 border-none rounded-lg p-3 text-[10px] flex-1 outline-none" />
                <button className="bg-blue-600 p-3 rounded-lg"><ArrowRight className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
          
          <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">© 2026 INFINDA CEL. TODOS OS DIREITOS RESERVADOS.</div>
            <div className="flex gap-4">
              {/* Payment Icons would go here */}
              <div className="w-8 h-5 bg-white/5 rounded" />
              <div className="w-8 h-5 bg-white/5 rounded" />
              <div className="w-8 h-5 bg-white/5 rounded" />
            </div>
          </div>
        </div>
      </footer>

      {/* WHATSAPP CTA */}
      <a
        href={buildWhatsAppLink()}
        target="_blank"
        className="fixed bottom-8 right-8 z-50 bg-[#25D366] text-white p-4 rounded-full shadow-2xl shadow-green-500/20 hover:scale-110 transition-transform flex items-center gap-3"
      >
        <span className="hidden md:block font-black uppercase tracking-widest text-xs ml-2">Dúvidas? Chame aqui</span>
        <MessageCircle className="w-6 h-6" />
      </a>
    </div>
  );
};

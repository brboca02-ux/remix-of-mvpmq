import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  User,
  Heart,
  ShoppingBag,
  Menu,
  ChevronRight,
  Zap,
  ShieldCheck,
  CreditCard,
  RefreshCw,
  Star,
  Plus,
  ArrowRight,
  Instagram,
  Facebook,
  Twitter,
  Youtube,
  Phone,
  MapPin,
  Mail,
  Clock,
} from 'lucide-react';

const CATEGORIES = [
  { id: 1, name: 'Shampoo', image: 'https://images.unsplash.com/photo-1585232350374-049a1d55f462?w=400&q=80' },
  { id: 2, name: 'Skincare', image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&q=80' },
  { id: 3, name: 'Maquiagem', image: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=400&q=80' },
  { id: 4, name: 'Perfumes', image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&q=80' },
  { id: 5, name: 'Tintura', image: 'https://images.unsplash.com/photo-1560869713-7d0a29430803?w=400&q=80' },
  { id: 6, name: 'Homem', image: 'https://images.unsplash.com/photo-1521434266203-9d0442387114?w=400&q=80' },
];

const NEW_ARRIVALS = [
  {
    id: 1,
    name: 'Creme Hidratante Facial',
    brand: 'Infinda Beauty',
    price: 'R$ 89,90',
    oldPrice: 'R$ 115,00',
    discount: '-22%',
    image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&q=80',
    tag: 'NOVO'
  },
  {
    id: 2,
    name: 'Sérum Vitamina C',
    brand: 'Infinda Beauty',
    price: 'R$ 129,90',
    oldPrice: 'R$ 185,00',
    discount: '-29%',
    image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&q=80',
    tag: 'NOVO'
  },
  {
    id: 3,
    name: 'Protetor Solar FPS 50',
    brand: 'Infinda Beauty',
    price: 'R$ 79,90',
    oldPrice: 'R$ 99,90',
    discount: '-20%',
    image: 'https://images.unsplash.com/photo-1556228515-01fd129833e9?w=400&q=80',
    tag: 'NOVO'
  },
  {
    id: 4,
    name: 'Gel de Limpeza Facial',
    brand: 'Infinda Beauty',
    price: 'R$ 54,90',
    oldPrice: 'R$ 69,90',
    discount: '-21%',
    image: 'https://images.unsplash.com/photo-1556229167-da318a280043?w=400&q=80',
    tag: 'NOVO'
  }
];

const BRANDS = [
  "L'Oréal", "La Roche-Posay", "Nivea", "Vichy", "Eucerin", "Neutrogena"
];

const WHATSAPP = '558591583732';

export const BeautyStoreTemplate: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const buildWhatsAppLink = (productName?: string) => {
    let msg = `Olá! Vi o site da Infinda Beauty e gostaria de saber mais sobre os produtos.`;
    if (productName) {
      msg = `Olá! Tenho interesse no produto *${productName}* que vi no site.`;
    }
    return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`;
  };

  return (
    <div className="min-h-screen bg-white text-slate-900" style={{ fontFamily: '"Inter", sans-serif' }}>
      {/* TOP ANNOUNCEMENT */}
      <div className="bg-[#E91E63] text-white py-2 px-4 text-center text-xs font-bold">
        ✨ Utilize o cupom <span className="underline">PRIMEIRACOMPRA</span> e ganhe 10% de desconto na sua primeira compra!
      </div>

      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 lg:hidden">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)}>
              <Menu className="w-6 h-6" />
            </button>
          </div>

          <div className="flex items-center gap-2 group cursor-pointer">
            <div className="text-2xl font-bold tracking-tight text-slate-900">
              <span className="text-[#E91E63]">Infinda</span> Beauty
            </div>
          </div>

          <div className="hidden lg:flex flex-1 max-w-xl relative">
            <input 
              type="text" 
              placeholder="Buscar produtos..." 
              className="w-full bg-slate-50 border border-slate-200 rounded-full py-2.5 px-6 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-[#E91E63]/20 focus:border-[#E91E63] transition-all"
            />
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <button className="p-2 text-slate-600 hover:text-[#E91E63] transition">
              <User className="w-6 h-6" />
            </button>
            <button className="p-2 text-slate-600 hover:text-[#E91E63] transition hidden sm:block">
              <Heart className="w-6 h-6" />
            </button>
            <button className="p-2 text-slate-600 hover:text-[#E91E63] transition relative">
              <ShoppingBag className="w-6 h-6" />
              <span className="absolute top-1 right-1 w-4 h-4 bg-[#E91E63] text-white text-[10px] font-bold rounded-full flex items-center justify-center">0</span>
            </button>
          </div>
        </div>

        {/* NAVIGATION */}
        <nav className="hidden lg:block border-t border-slate-50">
          <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-center gap-10">
            {['Cabelos', 'Pele', 'Maquiagem', 'Perfumes', 'Linha Profissional', 'Linha Homem'].map((item) => (
              <a 
                key={item} 
                href="#" 
                className="text-sm font-semibold text-slate-600 hover:text-[#E91E63] transition-colors relative group"
              >
                {item}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#E91E63] transition-all group-hover:w-full"></span>
              </a>
            ))}
          </div>
        </nav>
      </header>

      {/* MOBILE MENU */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[60] bg-white lg:hidden">
          <div className="p-6">
            <div className="flex justify-between items-center mb-10">
              <div className="text-xl font-bold"><span className="text-[#E91E63]">Infinda</span> Beauty</div>
              <button onClick={() => setIsMenuOpen(false)}><Menu className="w-6 h-6 rotate-90" /></button>
            </div>
            <div className="flex flex-col gap-6">
              {['Cabelos', 'Pele', 'Maquiagem', 'Perfumes', 'Linha Profissional', 'Linha Homem'].map((item) => (
                <a key={item} href="#" className="text-lg font-bold border-b border-slate-50 pb-2">{item}</a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* HERO SECTION */}
      <section className="relative aspect-[16/9] md:aspect-[21/9] bg-[#E91E63] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent z-10"></div>
        <div className="relative z-20 text-center px-4">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-6xl font-black text-white mb-4 tracking-tight"
          >
            Super Sale Skincare
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg md:text-2xl text-white/90 mb-8 font-medium"
          >
            Até 40% OFF em toda linha de cuidados faciais
          </motion.p>
          <motion.button 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            onClick={() => window.open(buildWhatsAppLink(), '_blank')}
            className="bg-white text-[#E91E63] px-10 py-4 rounded-full font-bold text-lg hover:bg-slate-50 transition-all shadow-xl hover:shadow-2xl"
          >
            Ver Ofertas
          </motion.button>
        </div>
        
        {/* SLIDER DOTS */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
          <div className="w-2.5 h-2.5 bg-white/40 rounded-full"></div>
          <div className="w-2.5 h-2.5 bg-white/40 rounded-full"></div>
        </div>
      </section>

      {/* ADVANTAGES */}
      <section className="py-12 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-[#E91E63]/5 rounded-full flex items-center justify-center mb-3">
                <Zap className="w-6 h-6 text-[#E91E63]" />
              </div>
              <h3 className="font-bold text-sm">Frete Grátis</h3>
              <p className="text-xs text-slate-500">acima de R$99</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-[#E91E63]/5 rounded-full flex items-center justify-center mb-3">
                <CreditCard className="w-6 h-6 text-[#E91E63]" />
              </div>
              <h3 className="font-bold text-sm">10% OFF no Pix</h3>
              <p className="text-xs text-slate-500">pagamento à vista</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-[#E91E63]/5 rounded-full flex items-center justify-center mb-3">
                <Clock className="w-6 h-6 text-[#E91E63]" />
              </div>
              <h3 className="font-bold text-sm">12x Sem Juros</h3>
              <p className="text-xs text-slate-500">no cartão de crédito</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-[#E91E63]/5 rounded-full flex items-center justify-center mb-3">
                <RefreshCw className="w-6 h-6 text-[#E91E63]" />
              </div>
              <h3 className="font-bold text-sm">Troca Grátis</h3>
              <p className="text-xs text-slate-500">em até 30 dias</p>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 md:px-6 text-center">
          <h2 className="text-3xl font-bold mb-12">Explore por Categoria</h2>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-8">
            {CATEGORIES.map((cat) => (
              <div key={cat.id} className="group cursor-pointer">
                <div className="aspect-square rounded-full overflow-hidden mb-4 border-2 border-transparent group-hover:border-[#E91E63] transition-all p-1">
                  <img src={cat.image} alt={cat.name} className="w-full h-full object-cover rounded-full group-hover:scale-110 transition-transform duration-500" />
                </div>
                <h3 className="text-sm font-bold group-hover:text-[#E91E63] transition-colors">{cat.name}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* NEW ARRIVALS */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded text-sm font-black tracking-tight">NEW</span> Lançamentos
            </h2>
            <a href="#" className="text-sm font-bold text-[#E91E63] flex items-center gap-1 hover:underline">
              Ver Todos <ChevronRight className="w-4 h-4" />
            </a>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
            {NEW_ARRIVALS.map((product) => (
              <motion.div 
                key={product.id}
                whileHover={{ y: -5 }}
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-slate-100 group"
              >
                <div className="relative aspect-square overflow-hidden bg-slate-100">
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute top-3 left-3 flex flex-col gap-2">
                    <span className="bg-green-500 text-white text-[10px] font-black px-2 py-1 rounded">NOVO</span>
                    <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-1 rounded">{product.discount}</span>
                  </div>
                  <button className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100">
                    <Heart className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-4 md:p-6">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{product.brand}</div>
                  <h3 className="text-sm font-bold mb-4 line-clamp-2 h-10">{product.name}</h3>
                  <div className="flex items-baseline gap-2 mb-6">
                    <span className="text-lg font-black text-[#E91E63]">{product.price}</span>
                    <span className="text-xs text-slate-400 line-through">{product.oldPrice}</span>
                  </div>
                  <button 
                    onClick={() => window.open(buildWhatsAppLink(product.name), '_blank')}
                    className="w-full bg-slate-900 text-white py-3 rounded-xl text-xs font-bold hover:bg-[#E91E63] transition-all"
                  >
                    Comprar Agora
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* PROGRESSIVE KIT */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="bg-gradient-to-r from-[#E91E63] to-rose-400 rounded-[2rem] p-8 md:p-16 text-white overflow-hidden relative">
            <div className="relative z-10 max-w-xl">
              <h2 className="text-3xl md:text-5xl font-black mb-6 leading-tight">Monte seu Kit e economize mais!</h2>
              <p className="text-white/80 mb-10 font-medium">Selecione 3 ou mais produtos e ganhe 15% de desconto extra no valor final da sua compra.</p>
              <button 
                onClick={() => window.open(buildWhatsAppLink(), '_blank')}
                className="bg-white text-[#E91E63] px-8 py-4 rounded-full font-bold hover:bg-slate-50 transition-all flex items-center gap-2"
              >
                Começar a montar <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="absolute top-1/2 right-0 -translate-y-1/2 w-1/2 h-full opacity-20 hidden lg:block">
              <ShoppingBag className="w-full h-full" />
            </div>
          </div>
        </div>
      </section>

      {/* BRANDS */}
      <section className="py-12 border-y border-slate-100 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-20 opacity-40 grayscale">
            {BRANDS.map((brand) => (
              <span key={brand} className="text-2xl font-black tracking-tighter uppercase italic">{brand}</span>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-white pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
            <div className="col-span-1 md:col-span-1">
              <div className="text-2xl font-bold mb-6">
                <span className="text-[#E91E63]">Infinda</span> Beauty
              </div>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                Especialistas em produtos de beleza premium, cuidados faciais e linha profissional para realçar sua beleza natural todos os dias.
              </p>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-[#E91E63] transition-colors">
                  <Instagram className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-[#E91E63] transition-colors">
                  <Facebook className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-[#E91E63] transition-colors">
                  <Twitter className="w-5 h-5" />
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-6">Categorias</h4>
              <ul className="space-y-4 text-sm text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">Skincare</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Maquiagem</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Perfumes</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cabelos</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Linha Profissional</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-6">Atendimento</h4>
              <ul className="space-y-4 text-sm text-slate-400">
                <li className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-[#E91E63]" /> (85) 9158-3732
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-[#E91E63]" /> contato@infindabeauty.com
                </li>
                <li className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-[#E91E63]" /> Fortaleza - CE
                </li>
                <li className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-[#E91E63]" /> Seg - Sex: 08h às 18h
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-6">Newsletter</h4>
              <p className="text-sm text-slate-400 mb-4">Receba ofertas exclusivas e dicas de beleza no seu e-mail.</p>
              <div className="flex gap-2">
                <input 
                  type="email" 
                  placeholder="Seu e-mail" 
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm flex-1 focus:outline-none focus:ring-1 focus:ring-[#E91E63]"
                />
                <button className="bg-[#E91E63] px-4 py-2 rounded-xl text-sm font-bold">OK</button>
              </div>
            </div>
          </div>

          <div className="border-t border-white/5 pt-10 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-slate-500 text-xs">© 2024 Infinda Beauty. Todos os direitos reservados.</p>
            <div className="flex gap-6">
              <img src="https://logodownload.org/wp-content/uploads/2014/07/visa-logo-1.png" alt="Visa" className="h-4 grayscale opacity-50" />
              <img src="https://logodownload.org/wp-content/uploads/2014/07/mastercard-logo-7.png" alt="Mastercard" className="h-4 grayscale opacity-50" />
              <img src="https://logodownload.org/wp-content/uploads/2021/01/pix-logo-1.png" alt="Pix" className="h-4 grayscale opacity-50" />
            </div>
          </div>
        </div>
      </footer>

      {/* FLOATING WHATSAPP */}
      <a 
        href={buildWhatsAppLink()}
        target="_blank"
        className="fixed bottom-6 right-6 z-50 bg-[#25D366] text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform flex items-center justify-center"
      >
        <Phone className="w-6 h-6 fill-current" />
      </a>
    </div>
  );
};
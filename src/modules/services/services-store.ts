import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useProspectingStore } from '../prospecting/prospecting-store';

export interface ServiceBriefingRequirement {
  id: string;
  label: string;
  type: 'text' | 'checkbox' | 'file' | 'url';
  required: boolean;
  options?: string[];
}

export interface ServiceDeliveryInfo {
  whatIsDelivered: string[];
  whatWeNeed: ServiceBriefingRequirement[];
  estimatedTime: string;
  deliveryFormat: string[];
  importantNotes?: string;
}

export interface ServiceBase {
  id: string;
  name: string;
  category: string;
  description: string;
  deliveryTime: string;
  price: string;
  isIA?: boolean;
  fullDescription?: string;
  howItWorks?: string;
  benefits?: string[];
  interestCount?: number;
  status: 'Ativo' | 'Pausado';
  deliveryInfo?: ServiceDeliveryInfo;
}

export interface Offer {
  id: string;
  name: string;
  serviceIds: string[];
  targetAudience: string;
  painSolved: string;
  promisedDelivery: string;
  deadline: string;
  suggestedPrice: string;
  discount?: string;
  status: 'Ativa' | 'Pausada' | 'Em teste';
  salesCopy?: string;
  copyHistory?: { timestamp: string, copy: string, tone?: string, channel?: string }[];
  variants?: { id: string, name: string, copy: string, conversions: number, tone?: string, channel?: string }[];
  abTest?: {
    isActive: boolean;
    variantA: string;
    variantB: string;
    metric: 'conversions' | 'clicks';
  };
}

export interface Combo {
  id: string;
  name: string;
  description: string;
  serviceIds: string[];
  price: string;
  icon?: string;
}

interface HistoryItem {
  timestamp: string;
  action: string;
  details: string;
  user: string;
}

interface ServicesState {
  services: ServiceBase[];
  offers: Offer[];
  combos: Combo[];
  history: Record<string, HistoryItem[]>;
  
  // Services
  addService: (service: ServiceBase) => void;
  updateService: (id: string, updates: Partial<ServiceBase>) => void;
  deleteService: (id: string) => void;
  recordInterest: (serviceId: string) => void;
  
  // Offers
  addOffer: (offer: Offer) => void;
  updateOffer: (id: string, updates: Partial<Offer>) => void;
  deleteOffer: (id: string) => void;
  
  // Combos
  addCombo: (combo: Combo) => void;
  updateCombo: (id: string, updates: Partial<Combo>) => void;
  deleteCombo: (id: string) => void;
}

const INITIAL_SERVICES: ServiceBase[] = [
  { 
    id: '1', 
    name: 'Catálogo de Produtos com IA', 
    category: 'Imagens & Catálogos', 
    description: 'Catálogo profissional com imagens, descrições e layout personalizado.', 
    deliveryTime: '2 a 3 dias', 
    price: 'R$149', 
    isIA: true,
    status: 'Ativo',
    deliveryInfo: {
      whatIsDelivered: ['PDF final', 'Imagens em PNG/JPG', 'Link publicado'],
      whatWeNeed: [
        { id: '1-1', label: 'Nome da empresa', type: 'text', required: true },
        { id: '1-2', label: 'Logo', type: 'file', required: true },
        { id: '1-3', label: 'Lista de produtos', type: 'text', required: true },
        { id: '1-4', label: 'Preços', type: 'text', required: true },
        { id: '1-5', label: 'Descrições', type: 'text', required: true },
        { id: '1-6', label: 'Fotos ou referências', type: 'file', required: false },
        { id: '1-7', label: 'Cores da marca', type: 'text', required: true },
        { id: '1-8', label: 'WhatsApp de contato', type: 'text', required: true },
      ],
      estimatedTime: '2 a 3 dias',
      deliveryFormat: ['PDF', 'Link online']
    }
  },
  { 
    id: '2', 
    name: 'Catálogo de Serviços com IA', 
    category: 'Imagens & Catálogos', 
    description: 'Catálogo para prestadores, clínicas, restaurantes, escritórios e empresas locais.', 
    deliveryTime: '2 a 3 dias', 
    price: 'R$129', 
    isIA: true,
    status: 'Ativo',
    deliveryInfo: {
      whatIsDelivered: ['PDF final', 'Imagens em PNG/JPG', 'Link publicado'],
      whatWeNeed: [
        { id: '2-1', label: 'Nome da empresa', type: 'text', required: true },
        { id: '2-2', label: 'Lista de serviços', type: 'text', required: true },
        { id: '2-3', label: 'Público-alvo', type: 'text', required: true },
        { id: '2-4', label: 'Diferenciais', type: 'text', required: true },
        { id: '2-5', label: 'Preços ou pacotes', type: 'text', required: true },
        { id: '2-6', label: 'Fotos ou referências', type: 'file', required: false },
        { id: '2-7', label: 'CTA principal', type: 'text', required: true },
      ],
      estimatedTime: '2 a 3 dias',
      deliveryFormat: ['PDF', 'Link online']
    }
  },
  { 
    id: '3', 
    name: 'Pack de Imagens para Anúncios', 
    category: 'Marketing & Mídia', 
    description: 'Criativos para Meta Ads, Google Ads, Instagram e WhatsApp.', 
    deliveryTime: '24 a 48h', 
    price: 'R$79',
    status: 'Ativo',
    deliveryInfo: {
      whatIsDelivered: ['Imagens em PNG/JPG', 'Arquivos editáveis (opcional)'],
      whatWeNeed: [
        { id: '3-1', label: 'Produto ou serviço', type: 'text', required: true },
        { id: '3-2', label: 'Oferta', type: 'text', required: true },
        { id: '3-3', label: 'Público-alvo', type: 'text', required: true },
        { id: '3-4', label: 'Dor principal', type: 'text', required: true },
        { id: '3-5', label: 'Benefício principal', type: 'text', required: true },
        { id: '3-6', label: 'Cores da marca', type: 'text', required: true },
        { id: '3-7', label: 'Formatos desejados', type: 'text', required: true },
      ],
      estimatedTime: '24h',
      deliveryFormat: ['PNG', 'JPG']
    }
  },
  { 
    id: '4', 
    name: 'E-book Fotográfico Familiar por IA', 
    category: 'E-books & Ensaios', 
    description: 'Álbum digital temático com fotos da família em cenários criativos.', 
    deliveryTime: '2 a 4 dias', 
    price: 'R$199', 
    isIA: true,
    status: 'Ativo',
    deliveryInfo: {
      whatIsDelivered: ['PDF final', 'Imagens em PNG/JPG'],
      whatWeNeed: [
        { id: '4-1', label: 'Fotos da família', type: 'file', required: true },
        { id: '4-2', label: 'Tema desejado', type: 'text', required: true },
        { id: '4-3', label: 'Estilo visual', type: 'text', required: true },
        { id: '4-4', label: 'Frase ou dedicatória', type: 'text', required: false },
        { id: '4-5', label: 'Quantidade aproximada de páginas', type: 'text', required: true },
        { id: '4-6', label: 'Formato final desejado', type: 'text', required: true },
      ],
      estimatedTime: '2 a 4 dias',
      deliveryFormat: ['PDF', 'PNG', 'JPG']
    }
  },
  { 
    id: '5', 
    name: 'Foto Profissional para LinkedIn por IA', 
    category: 'E-books & Ensaios', 
    description: 'Transformação de fotos comuns em retratos profissionais de alta qualidade.', 
    deliveryTime: '24h', 
    price: 'R$49',
    isIA: true,
    status: 'Ativo',
    deliveryInfo: {
      whatIsDelivered: ['Imagens em PNG/JPG'],
      whatWeNeed: [
        { id: '5-1', label: 'Fotos de rosto', type: 'file', required: true },
        { id: '5-2', label: 'Profissão', type: 'text', required: true },
        { id: '5-3', label: 'Estilo desejado', type: 'text', required: true, options: ['executivo', 'criativo', 'premium', 'casual'] },
        { id: '5-4', label: 'Fundo desejado', type: 'text', required: false },
        { id: '5-5', label: 'Formato final', type: 'text', required: true },
      ],
      estimatedTime: '24h',
      deliveryFormat: ['PNG', 'JPG']
    }
  },
  { 
    id: '6', 
    name: 'Cardápio Digital com Imagens por IA', 
    category: 'Sites & Presença Digital', 
    description: 'Cardápio interativo com fotos realistas geradas por IA para restaurantes.', 
    deliveryTime: '3 a 4 dias', 
    price: 'R$189',
    isIA: true,
    status: 'Ativo',
    deliveryInfo: {
      whatIsDelivered: ['Link publicado', 'QR Code para mesa', 'PDF para impressão'],
      whatWeNeed: [
        { id: '6-1', label: 'Nome do restaurante', type: 'text', required: true },
        { id: '6-2', label: 'Logo', type: 'file', required: true },
        { id: '6-3', label: 'Lista de pratos', type: 'text', required: true },
        { id: '6-4', label: 'Preços', type: 'text', required: true },
        { id: '6-5', label: 'Categorias', type: 'text', required: true },
        { id: '6-6', label: 'WhatsApp', type: 'text', required: true },
        { id: '6-7', label: 'Endereço', type: 'text', required: false },
        { id: '6-8', label: 'Link de delivery', type: 'text', required: false },
      ],
      estimatedTime: '3 dias',
      deliveryFormat: ['Link online', 'PDF', 'PNG']
    }
  },
  { 
    id: '15', 
    name: 'Mini Site Catálogo', 
    category: 'Sites & Presença Digital', 
    description: 'Página simples com serviços, produtos, botão de WhatsApp e identidade visual.', 
    deliveryTime: '3 a 5 dias', 
    price: 'R$199',
    status: 'Ativo',
    deliveryInfo: {
      whatIsDelivered: ['Link publicado', 'Arquivos fonte'],
      whatWeNeed: [
        { id: '15-1', label: 'Nome da empresa', type: 'text', required: true },
        { id: '15-2', label: 'Logo', type: 'file', required: true },
        { id: '15-3', label: 'Serviços ou produtos', type: 'text', required: true },
        { id: '15-4', label: 'Textos principais', type: 'text', required: true },
        { id: '15-5', label: 'Cores da marca', type: 'text', required: true },
        { id: '15-6', label: 'WhatsApp', type: 'text', required: true },
        { id: '15-7', label: 'Instagram', type: 'text', required: false },
        { id: '15-8', label: 'Endereço', type: 'text', required: false },
        { id: '15-9', label: 'Domínio, se houver', type: 'text', required: false },
      ],
      estimatedTime: '3 a 5 dias',
      deliveryFormat: ['Link online']
    }
  },
  {
    id: '7',
    name: 'Vídeo Comercial Curto com IA',
    category: 'Vídeos & Animações',
    description: 'Produção de vídeos de 15 a 30 segundos para anúncios e redes sociais.',
    deliveryTime: '2 a 3 dias',
    price: 'R$249',
    isIA: true,
    status: 'Ativo',
    deliveryInfo: {
      whatIsDelivered: ['Vídeo em MP4', 'Legendas formatadas'],
      whatWeNeed: [
        { id: '7-1', label: 'Produto ou serviço', type: 'text', required: true },
        { id: '7-2', label: 'Objetivo do vídeo', type: 'text', required: true },
        { id: '7-3', label: 'Público-alvo', type: 'text', required: true },
        { id: '7-4', label: 'Oferta', type: 'text', required: true },
        { id: '7-5', label: 'CTA', type: 'text', required: true },
        { id: '7-6', label: 'Estilo visual', type: 'text', required: true },
        { id: '7-7', label: 'Formato', type: 'text', required: true, options: ['Reels', 'Story', 'Feed', 'YouTube Shorts'] },
      ],
      estimatedTime: '3 dias',
      deliveryFormat: ['MP4']
    }
  },
];

// syncWithCRM removed to avoid double creation, let components handle specific integration

export const useServicesStore = create<ServicesState>()(
  persist(
    (set, get) => ({
      services: INITIAL_SERVICES,
      offers: [],
      combos: [],
      history: {},
      
      addService: (service) => {
        set((state) => ({ 
          services: [service, ...state.services],
          history: {
            ...state.history,
            [service.id]: [{ timestamp: new Date().toISOString(), action: 'Criação', details: 'Serviço adicionado ao catálogo', user: 'Admin' }]
          }
        }));
      },
      updateService: (id, updates) => {
        set((state) => ({
          services: state.services.map(s => s.id === id ? { ...s, ...updates } : s),
          history: {
            ...state.history,
            [id]: [
              ...(state.history[id] || []),
              { timestamp: new Date().toISOString(), action: 'Edição', details: `Campos atualizados: ${Object.keys(updates).join(', ')}`, user: 'Admin' }
            ]
          }
        }));
      },
      deleteService: (id) => set((state) => {
        const { [id]: _, ...remainingHistory } = state.history;
        return {
          services: state.services.filter(s => s.id !== id),
          history: remainingHistory
        };
      }),
      
      recordInterest: (serviceId) => set((state) => ({
        services: state.services.map(s => 
          s.id === serviceId ? { ...s, interestCount: (s.interestCount || 0) + 1 } : s
        ),
        history: {
          ...state.history,
          [serviceId]: [
            ...(state.history[serviceId] || []),
            { timestamp: new Date().toISOString(), action: 'Interesse', details: 'Usuário demonstrou interesse no serviço', user: 'Public' }
          ]
        }
      })),
      
      addOffer: (offer) => {
        set((state) => ({ 
          offers: [offer, ...state.offers],
          history: {
            ...state.history,
            [offer.id]: [{ timestamp: new Date().toISOString(), action: 'Criação', details: `Oferta "${offer.name}" criada`, user: 'Admin' }]
          }
        }));
        // syncWithCRM removed to avoid double creation, let components handle specific integration
      },
      updateOffer: (id, updates) => {
        set((state) => ({
          offers: state.offers.map(o => o.id === id ? { ...o, ...updates } : o),
          history: {
            ...state.history,
            [id]: [
              ...(state.history[id] || []),
              { timestamp: new Date().toISOString(), action: 'Edição', details: `Oferta atualizada: ${Object.keys(updates).join(', ')}`, user: 'Admin' }
            ]
          }
        }));
      },
      deleteOffer: (id) => set((state) => {
        const { [id]: _, ...remainingHistory } = state.history;
        return {
          offers: state.offers.filter(o => o.id !== id),
          history: remainingHistory
        };
      }),
      
      addCombo: (combo) => {
        set((state) => ({ 
          combos: [combo, ...state.combos],
          history: {
            ...state.history,
            [combo.id]: [{ timestamp: new Date().toISOString(), action: 'Criação', details: `Combo "${combo.name}" criado`, user: 'Admin' }]
          }
        }));
      },
      updateCombo: (id, updates) => {
        set((state) => ({
          combos: state.combos.map(c => c.id === id ? { ...c, ...updates } : c),
          history: {
            ...state.history,
            [id]: [
              ...(state.history[id] || []),
              { timestamp: new Date().toISOString(), action: 'Edição', details: `Combo atualizado: ${Object.keys(updates).join(', ')}`, user: 'Admin' }
            ]
          }
        }));
      },
      deleteCombo: (id) => set((state) => {
        const { [id]: _, ...remainingHistory } = state.history;
        return {
          combos: state.combos.filter(c => c.id !== id),
          history: remainingHistory
        };
      }),
    }),
    {
      name: 'marketscope-services-storage',
    }
  )
);

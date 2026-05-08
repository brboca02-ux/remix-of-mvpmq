import React from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { PREBUILT_TEMPLATES, PrebuiltTemplate } from '@/lib/prebuilt-templates';
import { PublicProposalPage } from '@/components/proposal/PublicProposalPage';
import { SalonGlamourTemplate } from '@/components/templates/SalonGlamourTemplate';
import { BarberPremiumTemplate } from '@/components/templates/BarberPremiumTemplate';
import { SolarPremiumTemplate } from '@/components/templates/SolarPremiumTemplate';
import { CarStorePremiumTemplate } from '@/components/templates/CarStorePremiumTemplate';
import { PhoneStoreTemplate } from '@/components/templates/PhoneStoreTemplate';
import { BeautyStoreTemplate } from '@/components/templates/BeautyStoreTemplate';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { navigationService } from '@/lib/navigation-service';

const CUSTOM_TEMPLATES: Record<string, React.ComponentType> = {
  'salao-beleza': SalonGlamourTemplate,
  'barber-premium': BarberPremiumTemplate,
  'energia-solar': SolarPremiumTemplate,
  'loja-veiculos': CarStorePremiumTemplate,
  'loja-celular': PhoneStoreTemplate,
  'loja-cosmeticos': BeautyStoreTemplate,
};

export const Route = createFileRoute('/modelos-de-sites/$modelId')({
  component: TemplatePreviewPage,
});

function TemplatePreviewPage() {
  const { modelId } = Route.useParams();
  const navigate = useNavigate();
  const [template, setTemplate] = React.useState<PrebuiltTemplate | null>(
    PREBUILT_TEMPLATES.find(t => t.id === modelId) || null
  );
  const [isCreating, setIsCreating] = React.useState(!template);

  React.useEffect(() => {
    if (!template) {
      setIsCreating(true);
      const timer = setTimeout(() => {
        const newTemplate: PrebuiltTemplate = {
          id: modelId,
          companyName: modelId.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
          niche: 'Serviços Gerais',
          nicheManual: 'Geral',
          city: 'Sua Cidade',
          services: ['Serviço 1', 'Serviço 2', 'Serviço 3'],
          differentials: ['Qualidade Premium', 'Atendimento Rápido'],
          whatsapp: '558591583732',
          tone: 'Premium',
          thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
          explosionMode: true
        };
        
        // Add to PREBUILT_TEMPLATES if not there to ensure consistency
        if (!PREBUILT_TEMPLATES.find(t => t.id === modelId)) {
          PREBUILT_TEMPLATES.push(newTemplate);
        }
        
        setTemplate(newTemplate);
        setIsCreating(false);
        navigationService.trackVisit(`/modelos-de-sites/${modelId}`, { autoCreated: true });
      }, 1500);
      return () => clearTimeout(timer);
    } else {
      navigationService.trackVisit(`/modelos-de-sites/${modelId}`);
    }
  }, [modelId, template]);

  if (isCreating) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0a] text-white p-6 text-center">
        <Loader2 className="w-12 h-12 text-rose-500 animate-spin mb-4" />
        <h1 className="text-2xl font-black uppercase tracking-tight italic">Criando Modelo...</h1>
        <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-2 opacity-70">
          Gerando layout estratégico para {modelId}
        </p>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0a] text-white p-6 text-center">
        <div className="max-w-md space-y-6">
          <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl text-rose-500 font-bold">!</span>
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tight italic">Modelo não encontrado</h1>
          <p className="text-zinc-400 text-lg leading-relaxed uppercase text-xs font-bold tracking-widest opacity-70">
            O identificador do modelo pode estar incorreto ou o template ainda não foi publicado.
          </p>
          <div className="pt-4">
            <Button 
              onClick={() => navigate({ to: '/modelos-de-sites' })} 
              className="w-full bg-rose-600 hover:bg-rose-700 text-white h-12 rounded-xl font-black uppercase tracking-widest"
            >
              Voltar para a Biblioteca
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const CustomComponent = CUSTOM_TEMPLATES[modelId];

  return (
    <div className="min-h-screen bg-[#0a0a0a] relative">
      <div className="fixed top-6 left-6 z-50">
        <Button
          variant="outline"
          size="sm"
          className="bg-black/40 backdrop-blur-md border-zinc-800 text-white hover:bg-rose-600 hover:border-rose-600 font-black uppercase tracking-widest text-[10px] gap-2 shadow-2xl transition-all duration-300"
          onClick={() => navigate({ to: '/modelos-de-sites' })}
        >
          <ChevronLeft className="w-4 h-4" />
          Voltar aos Modelos
        </Button>
      </div>

      {CustomComponent ? <CustomComponent /> : <PublicProposalPage site={template} />}
    </div>
  );
}

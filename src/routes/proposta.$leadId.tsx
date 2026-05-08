import React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useProspectingStore } from '@/modules/prospecting/prospecting-store';
import { SitePreview } from '@/modules/prospecting/SitePreview';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';

export const Route = createFileRoute('/proposta/$leadId')({
  component: PropostaPage,
});

function PropostaPage() {
  const { leadId } = Route.useParams();
  const navigate = useNavigate();
  const lead = useProspectingStore((state) => 
    state.leads.find((l) => l.id === leadId)
  );

  if (!lead) {
    return (
      <div className="flex flex-col items-center justify-center h-screen space-y-4">
        <h1 className="text-2xl font-bold">Proposta não encontrada</h1>
        <Button onClick={() => navigate({ to: '/prospecting' })}>
          Voltar para Prospecção
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <header className="h-16 bg-white border-b px-6 flex justify-between items-center shrink-0 no-print">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/prospecting' })}>
            <ChevronLeft className="h-4 w-4 mr-2" /> Voltar
          </Button>
          <div className="h-6 w-[1px] bg-slate-200"></div>
          <div>
            <h1 className="text-sm font-bold text-slate-900">{lead.companyName}</h1>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Proposta Comercial</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()} className="rounded-full">
            Imprimir Proposta
          </Button>
        </div>
      </header>
      
      <main className="flex-1 overflow-y-auto">
        <SitePreview 
          viewMode="desktop"
          hideToolbar={true}
          site={lead.generatedSite || {
            companyName: lead.companyName,
            niche: lead.niche,
            city: lead.city,
            services: ['Atendimento Premium', 'Tratamentos Especiais', 'Especialistas Qualificados'],
            differentials: ['Qualidade Premium', 'Atendimento Rápido', 'Preço Justo'],
            tone: 'Premium',
            whatsapp: lead.whatsapp,
            instagram: lead.instagramHandle
          }} 
        />
      </main>
    </div>
  );
}

import React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { proposalStorage } from '@/lib/proposal-storage';
import { PublicProposalPage } from '@/components/proposal/PublicProposalPage';
import { Button } from '@/components/ui/button';
import { useNavigate } from '@tanstack/react-router';

export const Route = createFileRoute('/proposta-site/$proposalId')({
  component: PropostaSitePublica,
});

function PropostaSitePublica() {
  const { proposalId } = Route.useParams();
  const navigate = useNavigate();
  const [proposal, setProposal] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  
  React.useEffect(() => {
    // Ensure we are in the browser
    if (typeof window !== 'undefined') {
      const data = proposalStorage.getProposalById(proposalId);
      if (data) {
        setProposal(data);
        // Set dynamic title for social sharing
        document.title = `${data.companyName} | Proposta Exclusiva`;
        
        // Add meta description dynamically
        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
          metaDesc = document.createElement('meta');
          metaDesc.setAttribute('name', 'description');
          document.head.appendChild(metaDesc);
        }
        metaDesc.setAttribute('content', `Confira a proposta personalizada de presença digital para ${data.companyName} em ${data.city}.`);
      }
      setLoading(false);
    }
  }, [proposalId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f1115] text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <p className="text-slate-400 font-medium animate-pulse">Preparando sua experiência...</p>
        </div>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f1115] text-white p-6 text-center">
        <div className="max-w-md space-y-6">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl text-red-500">!</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Proposta não encontrada</h1>
          <p className="text-slate-400 text-lg leading-relaxed">
            O link que você acessou pode ter expirado ou o identificador da proposta está incorreto.
          </p>
          <div className="pt-4">
            <Button 
              onClick={() => navigate({ to: '/prospecting' })} 
              className="w-full bg-white text-black hover:bg-slate-200 h-12 rounded-xl font-bold"
            >
              Voltar para o Painel
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <PublicProposalPage site={proposal} />;
}

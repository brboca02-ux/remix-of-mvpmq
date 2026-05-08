import React from 'react';
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { PREBUILT_TEMPLATES, PrebuiltTemplate } from '@/lib/prebuilt-templates';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit2, Layout, Zap, ArrowRight, Star, Shield, Clock, Target } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { navigationService } from '@/lib/navigation-service';

export const Route = createFileRoute('/modelos-de-sites/')({
  component: SiteTemplatesPage,
});

function SiteTemplatesPage() {
  const navigate = useNavigate();
  
  const handleUseTemplate = (template: PrebuiltTemplate) => {
    navigationService.handleCTA('use_template', { template_id: template.id });
    toast.success(`Carregando modelo: ${template.niche}`);
    navigate({ to: '/prospecting' });
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4 md:p-6 max-w-[1600px] mx-auto animate-in fade-in duration-500">
      <div className="flex-1 space-y-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-black tracking-tight uppercase italic">Modelos de Sites</h1>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider opacity-70">
            Biblioteca de layouts premium otimizados para alta conversão.
          </p>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          {['Todos', 'Automotivo', 'Beleza', 'Saúde', 'Tecnologia', 'Varejo'].map((filter) => (
            <Button 
              key={filter}
              variant={filter === 'Todos' ? 'default' : 'outline'} 
              size="sm" 
              className="rounded-full text-[10px] font-bold uppercase tracking-widest px-4 h-8"
              onClick={() => {
                // To be implemented: actually filter the list
                toast.info(`Filtrando por: ${filter}`);
              }}
            >
              {filter}
            </Button>
          ))}
        </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
        {PREBUILT_TEMPLATES.map((template, index) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="cursor-pointer"
          >
            <Link 
              to="/modelos-de-sites/$modelId" 
              params={{ modelId: template.id }} 
              className="block h-full outline-none focus-visible:ring-2 focus-visible:ring-rose-500 rounded-xl transition-transform active:scale-[0.98]"
              aria-label={`Ver detalhes do modelo ${template.niche}`}
            >
            <Card className="overflow-hidden border-border/40 hover:border-rose-500/60 transition-all duration-500 group bg-[#0a0a0a] border-zinc-800 hover:-translate-y-2 hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7)] relative h-full flex flex-col will-change-transform">
              <div className="aspect-[16/10] relative overflow-hidden">
                <img 
                  src={template.thumbnail} 
                  alt={`Preview do modelo ${template.niche}`} 
                  loading="lazy"
                  className="object-cover w-full h-full transition-all duration-1000 group-hover:scale-105 group-hover:blur-[1px] opacity-80"
                />
                
                {/* Preview Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-3 z-10">
                  <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 flex flex-col items-center gap-2">
                    <div className="bg-rose-600 p-2 rounded-full shadow-lg shadow-rose-600/20">
                      <Zap className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-[10px] font-black text-white uppercase tracking-[0.2em] bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm border border-white/10">
                      Visualização Rápida
                    </span>
                  </div>
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent opacity-80" />
                <div className="absolute top-2 right-2 z-20">
                  <span className="text-[8px] font-black tracking-widest uppercase bg-rose-600 text-white px-2 py-0.5 rounded-full shadow-lg">
                    {template.tone}
                  </span>
                </div>
                <div className="absolute bottom-2 left-3 z-20">
                  <h3 className="text-white font-black text-base leading-tight uppercase tracking-tighter transition-transform duration-300 group-hover:-translate-y-1">{template.niche}</h3>
                </div>
              </div>
              
              <CardContent className="p-3 pb-2 space-y-2">
                <div className="flex items-center gap-1.5 text-[8px] font-black text-rose-500 uppercase tracking-widest opacity-80">
                  <Shield className="w-2.5 h-2.5" />
                  Premium Template
                </div>
                <p className="text-[10px] text-zinc-400 line-clamp-2 leading-relaxed">
                  Layout estratégico focado em conversão para empresas de {template.niche.toLowerCase()}.
                </p>
                <ul className="space-y-1.5 pt-1">
                  {template.differentials.slice(0, 2).map((diff, i) => (
                    <li key={i} className="text-[9px] text-zinc-300 flex items-center gap-2 font-bold uppercase tracking-tight">
                      <div className="w-1 h-1 rounded-full bg-rose-600" />
                      <span className="line-clamp-1">{diff}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              
              <CardFooter className="p-3 pt-0 mt-auto">
                <div className="w-full inline-flex items-center justify-center gap-1.5 bg-rose-600 group-hover:bg-rose-700 text-white font-black uppercase text-[9px] tracking-widest h-9 rounded-md transition-all duration-300 group-hover:shadow-[0_4px_12px_rgba(225,29,72,0.3)] group-active:scale-95">
                  <Zap className="w-3 h-3 transition-transform duration-300 group-hover:rotate-12" />
                  Acessar Modelo
                </div>
              </CardFooter>
            </Card>
            </Link>
          </motion.div>
        ))}
        
        {/* Placeholder for more templates */}
        {[1].map((i) => (
          <div key={i} className="relative group rounded-xl border border-dashed border-zinc-800 flex flex-col items-center justify-center p-6 text-center bg-zinc-900/20 min-h-[280px]">
            <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center mb-3">
              <Layout className="w-5 h-5 text-zinc-700" />
            </div>
            <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Em Breve</h3>
            <p className="text-[9px] text-zinc-600 mt-1 uppercase tracking-tight">Novos layouts premium</p>
          </div>
        ))}
        </div>
      </div>

      <div className="w-full lg:w-80 space-y-4">
        <Card className="bg-zinc-900/40 border-zinc-800 p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-rose-600/20 text-rose-500">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-widest text-white">Empresas do Nicho</h4>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight">Oportunidades Ativas</p>
            </div>
          </div>
          
          <div className="space-y-3 mb-6">
            <div className="flex justify-between items-center text-[10px] uppercase tracking-wider font-bold">
              <span className="text-zinc-500">Empresas Encontradas</span>
              <span className="text-white">124</span>
            </div>
            <div className="flex justify-between items-center text-[10px] uppercase tracking-wider font-bold">
              <span className="text-zinc-500">Sem Site Atualizado</span>
              <span className="text-rose-500">82</span>
            </div>
            <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden">
              <div className="bg-rose-600 h-full w-[66%]" />
            </div>
          </div>

          <Button 
            className="w-full bg-white text-black hover:bg-zinc-200 font-black uppercase text-[10px] tracking-widest h-10 group"
            onClick={() => navigate({ to: '/prospecting' })}
          >
            Ver Empresas do Nicho
            <ArrowRight className="ml-2 w-3 h-3 transition-transform group-hover:translate-x-1" />
          </Button>
        </Card>

        <Card className="bg-gradient-to-br from-rose-600 to-rose-900 border-none p-4 text-white">
          <h4 className="text-xs font-black uppercase tracking-widest mb-1">Dica Premium</h4>
          <p className="text-[10px] font-bold opacity-90 leading-relaxed uppercase tracking-tight">
            Sites com vitrificação em destaque convertem 40% mais no nicho automotivo.
          </p>
        </Card>
      </div>
    </div>
  );
}

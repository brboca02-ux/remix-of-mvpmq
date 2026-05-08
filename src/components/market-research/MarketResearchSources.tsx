 import { MarketResearchSource } from "@/types/market-research";
 import { Badge } from "@/components/ui/badge";
 import { CheckCircle2, XCircle, Clock, SkipForward, AlertCircle } from "lucide-react";
 
 interface MarketResearchSourcesProps {
   sources: MarketResearchSource[];
   errors: string[];
 }
 
 export function MarketResearchSources({ sources, errors }: MarketResearchSourcesProps) {
   const statusIcons = {
     configured: <CheckCircle2 className="h-3 w-3 text-green-500" />,
     unavailable: <Clock className="h-3 w-3 text-muted-foreground" />,
     failed: <XCircle className="h-3 w-3 text-red-500" />,
     skipped: <SkipForward className="h-3 w-3 text-blue-500" />,
   };
 
   const statusLabels = {
     configured: "Configurado",
     unavailable: "Indisponível",
     failed: "Erro",
     skipped: "Pulado",
   };
 
   return (
     <div className="space-y-4 pt-6 border-t border-white/5">
       <div className="flex items-center justify-between">
         <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
           Fontes e Integridade de Dados
         </h4>
         {errors.length > 0 && (
           <Badge variant="destructive" className="text-[9px] h-5">
             {errors.length} Falhas detectadas
           </Badge>
         )}
       </div>
 
       <div className="flex flex-wrap gap-3">
         {sources.map((s, i) => (
           <div 
             key={i} 
             className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10"
             title={s.reason}
           >
             {statusIcons[s.status]}
             <span className="text-[10px] font-medium text-foreground">{s.name}</span>
             <span className="text-[9px] text-muted-foreground opacity-70">
               {statusLabels[s.status]}
             </span>
           </div>
         ))}
       </div>
 
       {errors.length > 0 && (
         <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/10 space-y-1">
           <div className="flex items-center gap-2 text-red-500 text-[10px] font-bold uppercase">
             <AlertCircle className="h-3 w-3" />
             Logs de Erro Técnicos
           </div>
           <div className="space-y-1">
             {errors.slice(0, 3).map((e, i) => (
               <p key={i} className="text-[10px] text-red-200/50 truncate font-mono">
                 {e}
               </p>
             ))}
           </div>
         </div>
       )}
     </div>
   );
 }
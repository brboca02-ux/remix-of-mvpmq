 import { MarketResearchSource } from "@/types/market-research";
 import { Badge } from "@/components/ui/badge";
 import { CheckCircle2, XCircle, Clock, SkipForward, AlertCircle, ChevronDown, Terminal } from "lucide-react";
 import { useState } from "react";
 import { cn } from "@/lib/utils";
 
 interface MarketResearchSourcesProps {
   sources: MarketResearchSource[];
   errors: string[];
 }
 
 export function MarketResearchSources({ sources, errors }: MarketResearchSourcesProps) {
   const [isExpanded, setIsExpanded] = useState(false);
 
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
     <div className="pt-6 border-t border-white/5 space-y-4">
       <button 
         onClick={() => setIsExpanded(!isExpanded)}
         className="flex items-center justify-between w-full group transition-colors"
       >
         <div className="flex items-center gap-3">
           <div className="p-1.5 rounded-lg bg-white/5 border border-white/10 group-hover:border-primary/30 transition-all">
             <Terminal className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary" />
           </div>
           <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground group-hover:text-foreground">
             Ver detalhes técnicos e fontes
           </h4>
         </div>
         <div className="flex items-center gap-4">
           {errors.length > 0 && (
             <Badge variant="destructive" className="text-[9px] h-5 bg-red-500/10 text-red-400 border-red-500/20">
               {errors.length} Falhas detectadas
             </Badge>
           )}
           <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-300", isExpanded && "rotate-180")} />
         </div>
       </button>
 
       {isExpanded && (
         <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
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
             <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10 space-y-3">
               <div className="flex items-center gap-2 text-red-500 text-[10px] font-bold uppercase tracking-widest">
                 <AlertCircle className="h-3 w-3" />
                 Logs de Diagnóstico
               </div>
               <div className="space-y-2">
                 {errors.map((e, i) => (
                   <p key={i} className="text-[10px] text-red-200/40 font-mono bg-black/20 p-2 rounded border border-white/5">
                     {e}
                   </p>
                 ))}
               </div>
             </div>
           )}
           
           <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
             <p className="text-[10px] text-muted-foreground leading-relaxed italic">
               Nota: Algumas fontes podem estar marcadas como <span className="text-foreground font-bold italic">Indisponível</span> caso as chaves de API não estejam configuradas no ambiente. A síntese de IA tenta compensar as lacunas com dados qualitativos e inteligência prévia.
             </p>
           </div>
         </div>
       )}
     </div>
   );
 }
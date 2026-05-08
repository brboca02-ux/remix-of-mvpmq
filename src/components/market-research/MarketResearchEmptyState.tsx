 import { Card } from "@/components/ui/card";
 import { Search, Zap, Globe, MessageSquare } from "lucide-react";
 
 export function MarketResearchEmptyState() {
   const examples = [
     { icon: <Zap className="h-4 w-4 text-primary" />, text: "Validar uma fintech para pequenos negócios" },
     { icon: <Globe className="h-4 w-4 text-primary" />, text: "Analisar mercado de energia solar em condomínios" },
     { icon: <MessageSquare className="h-4 w-4 text-primary" />, text: "Mapear concorrentes de uma ferramenta de automação comercial" },
   ];
 
   return (
     <div className="py-12 space-y-12">
       <div className="text-center space-y-4 max-w-2xl mx-auto">
         <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest animate-pulse">
           Aguardando comando
         </div>
         <h2 className="text-3xl font-bold tracking-tight text-white">
           O que vamos pesquisar hoje?
         </h2>
         <p className="text-muted-foreground">
           Descreva sua ideia, nicho ou produto para uma análise completa de mercado, tendências e concorrência.
         </p>
       </div>
 
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {examples.map((example, i) => (
           <Card key={i} className="bg-white/5 border-white/5 p-6 hover:bg-white/10 transition-all cursor-pointer group">
             <div className="space-y-4">
               <div className="p-3 rounded-xl bg-black/40 border border-white/10 w-fit group-hover:border-primary/50 transition-colors">
                 {example.icon}
               </div>
               <p className="text-sm font-medium text-foreground leading-relaxed">
                 "{example.text}"
               </p>
             </div>
           </Card>
         ))}
       </div>
 
       <div className="flex flex-col items-center gap-2 opacity-50">
         <Search className="h-12 w-12 text-muted-foreground/20" />
         <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
           Poder de processamento Lovable Cloud
         </p>
       </div>
     </div>
   );
 }
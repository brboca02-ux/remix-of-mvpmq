 import { createFileRoute } from "@tanstack/react-router";
 import { useState } from "react";
 import { useServerFn } from "@tanstack/react-start";
 import { generateMarketResearchReport } from "@/server/market-research.functions";
 import { MarketResearchInput } from "@/components/market-research/MarketResearchInput";
 import { MarketResearchResult } from "@/components/market-research/MarketResearchResult";
 import { MarketResearchEmptyState } from "@/components/market-research/MarketResearchEmptyState";
 import { MarketResearchReport } from "@/types/market-research";
 import { BarChart3, ArrowLeft } from "lucide-react";
 import { Link } from "@tanstack/react-router";
 import { toast } from "sonner";
 
 export const Route = createFileRoute("/market-research")({
   component: MarketResearchPage,
 });
 
 function MarketResearchPage() {
   const [report, setReport] = useState<MarketResearchReport | null>(null);
   const [isLoading, setIsLoading] = useState(false);
   const generateReport = useServerFn(generateMarketResearchReport);
 
   const handleGenerate = async (input: string) => {
     setIsLoading(true);
     setReport(null);
     try {
       const result = await generateReport({ data: { input } });
       if (result.ok) {
         setReport(result as MarketResearchReport);
         toast.success("Análise concluída com sucesso!");
       } else {
         toast.error("Houve um erro na análise parcial.");
         setReport(result as MarketResearchReport);
       }
     } catch (err) {
       console.error(err);
       toast.error("Erro crítico ao gerar relatório.");
     } finally {
       setIsLoading(false);
     }
   };
 
   return (
     <div className="min-h-screen bg-black text-white p-6 md:p-10">
       <div className="max-w-7xl mx-auto space-y-12">
         {/* Header */}
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
           <div className="space-y-2">
             <Link 
               to="/" 
               className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors mb-4"
             >
               <ArrowLeft className="h-3 w-3" />
               Voltar ao Dashboard
             </Link>
             <h1 className="text-4xl font-extrabold tracking-tight flex items-center gap-4">
               <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                 <BarChart3 className="h-8 w-8 text-primary" />
               </div>
               Pesquisa de Mercado
               <span className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-primary/20 text-primary border border-primary/30 tracking-tighter">
                 MVP Beta
               </span>
             </h1>
             <p className="text-muted-foreground text-lg max-w-2xl">
               Valide ideias, mapeie tendências e descubra concorrentes em segundos usando inteligência de mercado em tempo real.
             </p>
           </div>
         </div>
 
         {/* Input Section */}
         <MarketResearchInput onGenerate={handleGenerate} isLoading={isLoading} />
 
         {/* Result or Empty State */}
         <div className="pt-8">
           {report ? (
             <MarketResearchResult report={report} />
           ) : isLoading ? (
             <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50 animate-pulse">
               <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
               <p className="text-sm font-medium uppercase tracking-widest text-primary">
                 Processando dados das fontes...
               </p>
             </div>
           ) : (
             <MarketResearchEmptyState />
           )}
         </div>
       </div>
     </div>
   );
 }
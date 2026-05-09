 import { createFileRoute } from "@tanstack/react-router";
 import { useState, useEffect } from "react";
 import { useServerFn } from "@tanstack/react-start";
 import { 
   generateMarketResearchReport, 
   saveMarketResearchReport, 
   listMarketResearchReports,
   deleteMarketResearchReport
 } from "@/server/market-research.functions";
 import { MarketResearchInput } from "@/components/market-research/MarketResearchInput";
 import { MarketResearchResult } from "@/components/market-research/MarketResearchResult";
 import { MarketResearchEmptyState } from "@/components/market-research/MarketResearchEmptyState";
 import { MarketResearchHistory } from "@/components/market-research/MarketResearchHistory";
 import { MarketResearchReport, MarketResearchSavedReport } from "@/types/market-research";
 import { BarChart3, ArrowLeft, History } from "lucide-react";
 import { Link } from "@tanstack/react-router";
 import { toast } from "sonner";
 
 export const Route = createFileRoute("/market-research")({
   component: MarketResearchPage,
 });
 
 function MarketResearchPage() {
   const [report, setReport] = useState<MarketResearchReport | null>(null);
   const [isLoading, setIsLoading] = useState(false);
   const [loadingStep, setLoadingStep] = useState(0);
   const [history, setHistory] = useState<MarketResearchSavedReport[]>([]);
   const loadingMessages = [
     "Analisando mercado...",
     "Buscando sinais de tendência...",
     "Identificando concorrentes...",
     "Sintetizando inteligência..."
   ];
 
   useEffect(() => {
     let interval: any;
     if (isLoading) {
       setLoadingStep(0);
       interval = setInterval(() => {
         setLoadingStep(prev => (prev + 1) % loadingMessages.length);
       }, 3000);
     }
     return () => clearInterval(interval);
   }, [isLoading]);
 
   const [isHistoryLoading, setIsHistoryLoading] = useState(true);
 
   const generateReport = useServerFn(generateMarketResearchReport);
   const saveReport = useServerFn(saveMarketResearchReport);
   const listReports = useServerFn(listMarketResearchReports);
   const deleteReport = useServerFn(deleteMarketResearchReport);
 
   const fetchHistory = async () => {
     setIsHistoryLoading(true);
     try {
       const data = await listReports({ data: { limit: 10 } });
       setHistory(data as MarketResearchSavedReport[]);
     } catch (err) {
       console.error("Erro ao carregar histórico:", err);
     } finally {
       setIsHistoryLoading(false);
     }
   };
 
   useEffect(() => {
     fetchHistory();
   }, []);
 
   const handleGenerate = async (input: string) => {
     setIsLoading(true);
     setReport(null);
     try {
       const result = await generateReport({ data: { input } });
       if (result.ok) {
         setReport(result as MarketResearchReport);
         toast.success("Análise concluída com sucesso!");
         
         // Salvar no histórico
         try {
           await saveReport({ 
             data: { 
               input, 
               report: result as MarketResearchReport,
               sources: (result as MarketResearchReport).sources,
               errors: (result as MarketResearchReport).errors
             } 
           });
           fetchHistory();
         } catch (saveErr) {
           console.error("Erro ao salvar no histórico:", saveErr);
           toast.warning("Relatório gerado, mas não foi possível salvar no histórico.");
         }
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
 
   const handleSelectFromHistory = (savedReport: MarketResearchSavedReport) => {
     setReport(savedReport.report);
     window.scrollTo({ top: 0, behavior: 'smooth' });
     toast.info("Relatório antigo carregado.");
   };
 
   const handleDeleteHistory = async (id: string) => {
     try {
       const success = await deleteReport({ data: id });
       if (success) {
         toast.success("Pesquisa excluída.");
         fetchHistory();
       } else {
         toast.error("Erro ao excluir pesquisa.");
       }
     } catch (err) {
       console.error(err);
       toast.error("Falha ao excluir.");
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
         <div className="grid grid-cols-1 xl:grid-cols-4 gap-12">
           <div className="xl:col-span-3 space-y-12">
             <MarketResearchInput onGenerate={handleGenerate} isLoading={isLoading} />
 
             {/* Result or Empty State */}
             <div className="pt-8">
               {report ? (
                 <>
                   {report.partial && (
                     <div className="mb-6 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-sm font-medium flex items-center gap-3">
                       <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
                       A análise demorou mais que o esperado. Mostrando resultados parciais baseados nos dados disponíveis.
                     </div>
                   )}
                   <MarketResearchResult report={report} />
                 </>
               ) : isLoading ? (
                 <MarketResearchSkeleton message={loadingMessages[loadingStep]} />
               ) : (
                 <MarketResearchEmptyState />
               )}
 function MarketResearchSkeleton({ message }: { message: string }) {
   return (
     <div className="space-y-8 animate-pulse">
       <div className="flex flex-col items-center justify-center py-6 gap-3">
         <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
         <p className="text-xs font-bold uppercase tracking-widest text-primary animate-bounce">
           {message}
         </p>
       </div>
 
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <div className="lg:col-span-2 h-48 bg-white/5 rounded-xl border border-white/5" />
         <div className="h-48 bg-white/5 rounded-xl border border-white/5" />
       </div>
 
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="h-40 bg-white/5 rounded-xl border border-white/5" />
         <div className="h-40 bg-white/5 rounded-xl border border-white/5" />
       </div>
 
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="h-64 bg-white/5 rounded-xl border border-white/5" />
         <div className="h-64 bg-white/5 rounded-xl border border-white/5" />
       </div>
     </div>
   );
 }
             </div>
           </div>
 
           {/* History Sidebar */}
           <div className="space-y-6">
             <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-primary/70">
               <History className="h-4 w-4" />
               Histórico Recente
             </div>
             <MarketResearchHistory 
               reports={history} 
               onSelect={handleSelectFromHistory} 
               onDelete={handleDeleteHistory}
               isLoading={isHistoryLoading}
             />
           </div>
         </div>
       </div>
     </div>
   );
 }
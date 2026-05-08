 import { MarketResearchReport } from "@/types/market-research";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Badge } from "@/components/ui/badge";
 import { TrendingUp, TrendingDown, Minus, HelpCircle, Users, Lightbulb, AlertTriangle, ArrowRight } from "lucide-react";
 import { MarketResearchSources } from "./MarketResearchSources";
 import { MarketResearchCharts } from "./MarketResearchCharts";
 
 interface MarketResearchResultProps {
   report: MarketResearchReport;
 }
 
 export function MarketResearchResult({ report }: MarketResearchResultProps) {
   const trendIcons = {
     growing: <TrendingUp className="h-4 w-4 text-green-500" />,
     declining: <TrendingDown className="h-4 w-4 text-red-500" />,
     stable: <Minus className="h-4 w-4 text-blue-500" />,
     unknown: <HelpCircle className="h-4 w-4 text-muted-foreground" />,
   };
 
   const trendLabels = {
     growing: "Em Crescimento",
     declining: "Em Declínio",
     stable: "Estável",
     unknown: "Tendência Incerta",
   };
 
   return (
     <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
       {/* Sumário e Tendência */}
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <Card className="lg:col-span-2 bg-black/40 border-white/5 shadow-2xl">
           <CardHeader>
             <CardTitle className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
               Resumo Executivo
             </CardTitle>
           </CardHeader>
           <CardContent>
             <p className="text-foreground leading-relaxed text-lg">
               {report.summary}
             </p>
           </CardContent>
         </Card>
 
         <Card className="bg-black/40 border-white/5 shadow-2xl">
           <CardHeader>
             <CardTitle className="text-sm font-bold uppercase tracking-wider text-primary">
               Sinal de Mercado
             </CardTitle>
           </CardHeader>
           <CardContent className="flex flex-col items-center justify-center py-6 gap-4">
             <div className="p-4 rounded-full bg-primary/10 ring-1 ring-primary/20">
               {trendIcons[report.trendSignal]}
             </div>
             <span className="text-xl font-bold">{trendLabels[report.trendSignal]}</span>
             <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-tighter">
               Dados Temporais
             </Badge>
           </CardContent>
         </Card>
       </div>
 
       {/* Hipóteses e Perguntas */}
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <Card className="bg-black/40 border-white/5">
           <CardHeader>
             <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
               <Lightbulb className="h-4 w-4 text-yellow-500" />
               Hipóteses de Mercado
             </CardTitle>
           </CardHeader>
           <CardContent>
             <ul className="space-y-3">
               {report.marketHypothesis.map((h, i) => (
                 <li key={i} className="flex gap-3 text-sm text-muted-foreground border-l-2 border-primary/20 pl-4 py-1 italic">
                   {h}
                 </li>
               ))}
             </ul>
           </CardContent>
         </Card>
 
         <Card className="bg-black/40 border-white/5">
           <CardHeader>
             <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
               <HelpCircle className="h-4 w-4 text-blue-500" />
               Dúvidas do Público
             </CardTitle>
           </CardHeader>
           <CardContent>
             <ul className="space-y-3">
               {report.audienceQuestions.map((q, i) => (
                 <li key={i} className="text-sm text-foreground bg-white/5 p-3 rounded-lg border border-white/5">
                   "{q.question}"
                 </li>
               ))}
             </ul>
           </CardContent>
         </Card>
       </div>
 
       {/* Concorrentes e Oportunidades */}
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <Card className="bg-black/40 border-white/5">
           <CardHeader>
             <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
               <Users className="h-4 w-4 text-primary" />
               Concorrentes Identificados
             </CardTitle>
           </CardHeader>
           <CardContent>
             <div className="space-y-4">
               {report.competitors.length > 0 ? report.competitors.map((c, i) => (
                 <div key={i} className="p-4 rounded-xl border border-white/5 bg-white/5 flex flex-col gap-1">
                   <span className="font-bold text-foreground">{c.name}</span>
                   {c.description && <span className="text-xs text-muted-foreground">{c.description}</span>}
                 </div>
               )) : (
                 <p className="text-xs text-muted-foreground italic">Nenhum concorrente direto mapeado via APIs.</p>
               )}
             </div>
           </CardContent>
         </Card>
 
         <div className="space-y-6">
           <Card className="bg-primary/5 border-primary/20 border-dashed">
             <CardHeader>
               <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 text-primary">
                 Oportunidades
               </CardTitle>
             </CardHeader>
             <CardContent>
               <ul className="space-y-2">
                 {report.opportunities.map((o, i) => (
                   <li key={i} className="flex items-start gap-2 text-sm">
                     <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                     {o}
                   </li>
                 ))}
               </ul>
             </CardContent>
           </Card>
 
           <Card className="bg-red-500/5 border-red-500/20 border-dashed">
             <CardHeader>
               <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 text-red-500">
                 <AlertTriangle className="h-4 w-4" />
                 Riscos & Desafios
               </CardTitle>
             </CardHeader>
             <CardContent>
               <ul className="space-y-2">
                 {report.risks.map((r, i) => (
                   <li key={i} className="flex items-start gap-2 text-sm text-red-200/70">
                     <div className="h-1.5 w-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                     {r}
                   </li>
                 ))}
               </ul>
             </CardContent>
           </Card>
         </div>
       </div>
 
       {/* Gráficos e Próximos Passos */}
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <div className="lg:col-span-2">
           <MarketResearchCharts charts={report.charts} />
         </div>
         <Card className="bg-black/40 border-white/5">
           <CardHeader>
             <CardTitle className="text-sm font-bold uppercase tracking-wider text-foreground">
               Próximos Passos
             </CardTitle>
           </CardHeader>
           <CardContent>
             <div className="space-y-4">
               {report.nextSteps.map((s, i) => (
                 <div key={i} className="flex items-center gap-3 text-sm group cursor-default">
                   <div className="h-6 w-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 group-hover:border-primary/50 transition-all">
                     <ArrowRight className="h-3 w-3 text-muted-foreground group-hover:text-primary" />
                   </div>
                   <span>{s}</span>
                 </div>
               ))}
             </div>
           </CardContent>
         </Card>
       </div>
 
       {/* Fontes de Dados */}
       <MarketResearchSources sources={report.sources} errors={report.errors} />
     </div>
   );
 }
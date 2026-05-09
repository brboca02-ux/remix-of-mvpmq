 import { MarketResearchReport } from "@/types/market-research";
 import { cn } from "@/lib/utils";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Badge } from "@/components/ui/badge";
 import { TrendingUp, TrendingDown, Minus, HelpCircle, Users, Lightbulb, AlertTriangle, ArrowRight, Sparkles, Zap, Target } from "lucide-react";
 import { MarketResearchSources } from "./MarketResearchSources";
 import { MarketResearchCharts } from "./MarketResearchCharts";
 
 interface MarketResearchResultProps {
   report: MarketResearchReport;
 }
 
 export function MarketResearchResult({ report }: MarketResearchResultProps) {
   const isLowConfidence = report.confidenceLevel === "low";
 
   const trendIcons = {
     growing: <TrendingUp className="h-4 w-4 text-green-500" />,
     declining: <TrendingDown className="h-4 w-4 text-red-500" />,
     stable: <Minus className="h-4 w-4 text-blue-500" />,
     unknown: <HelpCircle className="h-4 w-4 text-muted-foreground" />,
   };
 
   const trendLabels = {
     growing: "Crescendo",
     declining: "Caindo",
     stable: "Estável",
     unknown: "Tendência Incerta",
   };
 
   const confidenceLabels = {
     high: "Alto",
     medium: "Médio",
     low: "Baixo",
   };
 
   const confidenceColors = {
     high: "text-green-500 bg-green-500/10 border-green-500/20",
     medium: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20",
     low: "text-red-500 bg-red-500/10 border-red-500/20",
   };
 
   return (
     <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
       {isLowConfidence && (
         <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium flex items-center gap-3">
           <AlertTriangle className="h-4 w-4 shrink-0" />
           Dados limitados — use essa análise como direção inicial, não decisão final.
         </div>
       )}
 
       {/* Proposta de Posicionamento - Nova Seção Principal */}
       {report.positioningSuggestion && (
         <Card className="bg-primary/5 border-primary/20 shadow-2xl relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
             <Sparkles className="h-24 w-24 text-primary" />
           </div>
           <CardHeader>
             <div className="flex items-center justify-between gap-4 flex-wrap">
               <CardTitle className="text-xl font-extrabold tracking-tight flex items-center gap-2 text-primary">
                 <Zap className="h-6 w-6" />
                 Proposta de Posicionamento
               </CardTitle>
               <div className="flex gap-2">
                 <Badge variant="outline" className={cn("text-[10px] font-bold uppercase", 
                   report.viabilityScore === 'high' ? "bg-green-500/10 text-green-500 border-green-500/20" :
                   report.viabilityScore === 'low' ? "bg-red-500/10 text-red-500 border-red-500/20" :
                   "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                 )}>
                   Viabilidade: {report.viabilityScore === 'high' ? 'Alta' : report.viabilityScore === 'low' ? 'Baixa' : 'Média'}
                 </Badge>
               </div>
             </div>
           </CardHeader>
           <CardContent className="space-y-6">
             <p className="text-xl font-medium leading-relaxed text-foreground">
               "{report.positioningSuggestion}"
             </p>
 
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-primary/10">
               <div className="space-y-3">
                 <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary/70 flex items-center gap-2">
                   <Users className="h-3 w-3" /> Para quem
                 </h4>
                 <ul className="space-y-1">
                   {report.targetAudience?.map((t, i) => (
                     <li key={i} className="text-sm text-foreground flex items-center gap-2">
                       <div className="h-1 w-1 rounded-full bg-primary/40" /> {t}
                     </li>
                   ))}
                 </ul>
               </div>
               <div className="space-y-3">
                 <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary/70 flex items-center gap-2">
                   <Target className="h-3 w-3" /> Diferenciação
                 </h4>
                 <ul className="space-y-1">
                   {report.differentiationAngles?.map((d, i) => (
                     <li key={i} className="text-sm text-foreground flex items-center gap-2">
                       <div className="h-1 w-1 rounded-full bg-primary/40" /> {d}
                     </li>
                   ))}
                 </ul>
               </div>
               <div className="space-y-3">
                 <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary/70 flex items-center gap-2">
                   <ArrowRight className="h-3 w-3" /> Go-to-Market
                 </h4>
                 <ul className="space-y-1">
                   {report.goToMarketIdeas?.map((g, i) => (
                     <li key={i} className="text-sm text-foreground flex items-center gap-2">
                       <div className="h-1 w-1 rounded-full bg-primary/40" /> {g}
                     </li>
                   ))}
                 </ul>
               </div>
             </div>
           </CardContent>
         </Card>
       )}
 
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
           <CardHeader className="pb-2">
             <CardTitle className="text-sm font-bold uppercase tracking-wider text-primary">
               Sinal de Mercado
             </CardTitle>
           </CardHeader>
           <CardContent className="flex flex-col items-center justify-center py-4 gap-4">
             <div className="p-4 rounded-full bg-primary/10 ring-1 ring-primary/20">
               {trendIcons[report.trendSignal]}
             </div>
             <div className="text-center">
               <div className="text-xl font-bold">{trendLabels[report.trendSignal]}</div>
               <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Tendência</p>
             </div>
             
             <div className="w-full pt-4 border-t border-white/5 flex flex-col items-center gap-2">
               <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-tighter">Nível de Confiança</span>
               <Badge 
                 variant="outline" 
                 className={cn("text-[10px] uppercase font-bold px-3 py-1", confidenceColors[report.confidenceLevel || 'medium'])}
               >
                 {confidenceLabels[report.confidenceLevel || 'medium']}
               </Badge>
             </div>
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
               Oportunidades de Ouro
             </CardTitle>
           </CardHeader>
           <CardContent>
             <ul className="space-y-3">
               {report.opportunities.map((o, i) => (
                 <li key={i} className="flex items-start gap-3 text-sm bg-primary/5 p-3 rounded-lg border border-primary/10">
                   <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center mt-0.5 shrink-0">
                     <Lightbulb className="h-3 w-3 text-primary" />
                   </div>
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
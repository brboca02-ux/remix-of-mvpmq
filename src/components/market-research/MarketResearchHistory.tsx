 import { MarketResearchSavedReport } from "@/types/market-research";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { ScrollArea } from "@/components/ui/scroll-area";
 import { Calendar, Search, Trash2, ExternalLink, Clock } from "lucide-react";
 import { format } from "date-fns";
 import { ptBR } from "date-fns/locale";
 
 interface MarketResearchHistoryProps {
   reports: MarketResearchSavedReport[];
   onSelect: (report: MarketResearchSavedReport) => void;
   onDelete: (id: string) => void;
   isLoading?: boolean;
 }
 
 export function MarketResearchHistory({ 
   reports, 
   onSelect, 
   onDelete,
   isLoading 
 }: MarketResearchHistoryProps) {
   if (isLoading) {
     return (
       <div className="space-y-4 animate-pulse">
         {[1, 2, 3].map((i) => (
           <div key={i} className="h-20 bg-white/5 rounded-xl border border-white/10" />
         ))}
       </div>
     );
   }
 
   if (reports.length === 0) {
     return (
       <Card className="bg-black/40 border-white/5 border-dashed">
         <CardContent className="flex flex-col items-center justify-center py-12 gap-3 opacity-50">
           <Clock className="h-8 w-8 text-muted-foreground" />
           <p className="text-sm font-medium">Nenhuma pesquisa salva ainda.</p>
         </CardContent>
       </Card>
     );
   }
 
   return (
     <ScrollArea className="h-[500px] pr-4">
       <div className="space-y-4">
         {reports.map((report) => (
           <Card 
             key={report.id} 
             className="bg-black/40 border-white/5 hover:border-primary/30 transition-all group"
           >
             <CardContent className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
               <div className="space-y-1 flex-1 min-w-0">
                 <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
                   <Calendar className="h-3 w-3" />
                   {report.createdAt ? format(new Date(report.createdAt), "dd 'de' MMMM, HH:mm", { locale: ptBR }) : 'Data desconhecida'}
                 </div>
                 <h4 className="text-sm font-bold text-foreground truncate flex items-center gap-2">
                   <Search className="h-3 w-3 text-primary opacity-50" />
                   {report.input}
                 </h4>
                 <p className="text-[11px] text-muted-foreground line-clamp-1 italic">
                   {report.report.summary}
                 </p>
               </div>
 
               <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                 <Button 
                   variant="ghost" 
                   size="sm" 
                   className="h-8 text-[10px] font-bold uppercase tracking-tighter hover:bg-primary/10 hover:text-primary"
                   onClick={() => onSelect(report)}
                 >
                   <ExternalLink className="h-3 w-3 mr-2" />
                   Abrir
                 </Button>
                 <Button 
                   variant="ghost" 
                   size="sm" 
                   className="h-8 text-[10px] font-bold uppercase tracking-tighter text-red-400 hover:bg-red-500/10 hover:text-red-500"
                   onClick={() => onDelete(report.id)}
                 >
                   <Trash2 className="h-3 w-3 mr-2" />
                   Excluir
                 </Button>
               </div>
             </CardContent>
           </Card>
         ))}
       </div>
     </ScrollArea>
   );
 }
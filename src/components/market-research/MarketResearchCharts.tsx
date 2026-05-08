 import { MarketResearchChart } from "@/types/market-research";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
 
 interface MarketResearchChartsProps {
   charts: MarketResearchChart[];
 }
 
 export function MarketResearchCharts({ charts }: MarketResearchChartsProps) {
   if (charts.length === 0) {
     return (
       <Card className="h-full bg-black/40 border-white/5 border-dashed flex flex-col items-center justify-center py-12">
         <p className="text-sm text-muted-foreground">Dados quantitativos indisponíveis para esta fonte.</p>
         <p className="text-[10px] text-muted-foreground opacity-50 mt-1 uppercase tracking-tighter">
           Requer ativação das APIs de Tendência (Google Trends / SEMRush)
         </p>
       </Card>
     );
   }
 
   return (
     <div className="space-y-6 h-full">
       {charts.map((chart, index) => (
         <Card key={index} className="bg-black/40 border-white/5 h-full">
           <CardHeader>
             <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
               {chart.title}
             </CardTitle>
           </CardHeader>
           <CardContent className="h-[300px] w-full pt-0">
             <ResponsiveContainer width="100%" height="100%">
               {chart.type === "bar" ? (
                 <BarChart data={chart.data}>
                   <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                   <XAxis dataKey="label" stroke="#666" fontSize={10} />
                   <YAxis stroke="#666" fontSize={10} />
                   <Tooltip 
                     contentStyle={{ backgroundColor: "#111", border: "1px solid #333", fontSize: "10px" }}
                     itemStyle={{ color: "#fff" }}
                   />
                   <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                 </BarChart>
               ) : (
                 <LineChart data={chart.data}>
                   <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                   <XAxis dataKey="label" stroke="#666" fontSize={10} />
                   <YAxis stroke="#666" fontSize={10} />
                   <Tooltip 
                     contentStyle={{ backgroundColor: "#111", border: "1px solid #333", fontSize: "10px" }}
                     itemStyle={{ color: "#fff" }}
                   />
                   <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
                 </LineChart>
               )}
             </ResponsiveContainer>
           </CardContent>
         </Card>
       ))}
     </div>
   );
 }
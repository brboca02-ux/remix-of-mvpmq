import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Info } from "lucide-react";
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function DistributionCharts({
  distribuicaoEstado,
  loading = false,
}: {
  distribuicaoEstado: Record<string, number>;
  loading?: boolean;
}) {
  const estadoData = useMemo(() => 
    Object.entries(distribuicaoEstado)
      .map(([uf, count]) => ({ uf, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  , [distribuicaoEstado]);

  const max = Math.max(...estadoData.map((d) => d.count), 1);

  const heatColor = (count: number) => {
    const t = count / max;
    if (t > 0.75) return "hsl(var(--primary))";
    if (t > 0.5) return "color-mix(in srgb, hsl(var(--primary)) 80%, white)";
    if (t > 0.25) return "color-mix(in srgb, hsl(var(--primary)) 60%, white)";
    return "color-mix(in srgb, hsl(var(--primary)) 40%, white)";
  };

  if (!loading && estadoData.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 border-b border-border/60 bg-card text-muted-foreground text-sm">
        Dados geográficos insuficientes para gerar o mapa de calor.
      </div>
    );
  }

  return (
    <div className="grid gap-6 border-b border-border/60 bg-card p-4 md:grid-cols-1 md:p-6">
      <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-background to-muted/20 p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Distribuição Geográfica</h3>
              <p className="text-[11px] text-muted-foreground">Top 10 estados por densidade de leads reais</p>
            </div>
            <TooltipProvider>
              <UITooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Fonte: Master View (Sincronizado com Receita Federal/CNAE)</p>
                </TooltipContent>
              </UITooltip>
            </TooltipProvider>
          </div>
          <div className="rounded-full bg-primary/10 p-2 text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
          </div>
        </div>
        <div className="h-48 w-full">
          {loading ? (
            <div className="flex items-end gap-2 h-full">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="flex-1" style={{ height: `${Math.random() * 100}%` }} />
              ))}
            </div>
          ) : (
            <ResponsiveContainer>
              <BarChart data={estadoData} layout="vertical" margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.1} />
                <XAxis type="number" hide />
                <YAxis dataKey="uf" type="category" tick={{ fontSize: 10, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(var(--primary), 0.05)' }}
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 11,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={12}>
                  {estadoData.map((d) => (
                    <Cell key={d.uf} fill={heatColor(d.count)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
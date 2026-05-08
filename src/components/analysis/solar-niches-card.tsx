import { useNavigate } from "@tanstack/react-router";
import { Compass, Sparkles, Loader2, ArrowRight, BarChart, CheckCircle, Calculator } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { MarketAnalysis, NicheOpportunity } from "@/lib/types";
import { useState, useMemo } from "react";
import { useServerFn } from "@tanstack/react-start";
import { expandNiches } from "@/server/market.functions";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/format";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function SolarNichesCard({
  analysis,
  onUpdate,
}: {
  analysis: MarketAnalysis;
  onUpdate?: (a: MarketAnalysis) => void;
}) {
  const navigate = useNavigate();
  const expand = useServerFn(expandNiches);
  const [loading, setLoading] = useState(false);
  const [showChecklist, setShowChecklist] = useState<string | null>(null);

  const opportunities = useMemo(() => {
    const opps = [...(analysis.nicheOpportunities || [])];
    return opps.sort((a, b) => (b.tam || 0) - (a.tam || 0));
  }, [analysis.nicheOpportunities]);

  const handleExplosion = async () => {
    setLoading(true);
    try {
      const result = await expand({
        data: {
          idea: analysis.input.idea,
          context: analysis.insights.join(". "),
          analysisId: analysis.id,
        },
      });

      if (result.niches && result.niches.length > 0) {
        toast.success(`${result.niches.length} nichos ocultos descobertos!`);
        if (onUpdate) {
          onUpdate({
            ...analysis,
            nicheOpportunities: result.niches as NicheOpportunity[],
          });
        }
      } else {
        toast.info("Não encontramos nichos ocultos com evidências suficientes.");
      }
    } catch (e) {
      toast.error("Falha ao gerar explosão de nichos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <Compass className="h-4 w-4 text-primary" />
          Modo Explosão de Nichos
          <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
            IA Pro
          </Badge>
        </CardTitle>
        <div className="flex gap-2">
          {opportunities.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExplosion}
              disabled={loading}
              className="h-8 gap-2 text-xs"
            >
              {loading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Sparkles className="h-3 w-3" />
              )}
              Re-executar IA
            </Button>
          )}
          {!opportunities.length && (
            <Button
              size="sm"
              onClick={handleExplosion}
              disabled={loading}
              className="h-8 gap-2 bg-primary text-xs shadow-lg shadow-primary/20"
            >
              {loading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Sparkles className="h-3 w-3" />
              )}
              Gerar 10 Nichos Ocultos
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col rounded-xl border border-border bg-card p-4 space-y-3">
                <div className="flex justify-between">
                  <Skeleton className="h-5 w-1/2" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
                <div className="grid grid-cols-3 gap-1 pt-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : opportunities.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {opportunities.map((n, idx) => (
              <div
                key={n.name}
                className="group relative flex flex-col rounded-xl border border-border bg-card p-4 transition-all duration-500 hover:border-primary/50 hover:shadow-xl hover:scale-[1.03] hover:bg-accent/5 animate-in fade-in zoom-in-95"
              >
                <div className="mb-2 flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                      #{idx + 1}
                    </div>
                    <h4 className="text-sm font-bold">{n.name}</h4>
                  </div>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-[10px]",
                      n.risk === "low"
                        ? "bg-success/10 text-success"
                        : n.risk === "medium"
                        ? "bg-warning/10 text-warning"
                        : "bg-destructive/10 text-destructive"
                    )}
                  >
                    Risco {n.risk === "low" ? "Baixo" : n.risk === "medium" ? "Médio" : "Alto"}
                  </Badge>
                </div>
                
                <p className="mb-4 text-xs text-muted-foreground line-clamp-2">{n.evidence}</p>

                <div className="mt-auto space-y-3">
                  <div className="grid grid-cols-3 gap-1 text-center">
                    <div className="rounded bg-muted/50 p-1.5">
                      <div className="text-[9px] uppercase text-muted-foreground">TAM</div>
                      <div className="text-[10px] font-bold">{n.tam ? formatCurrency(n.tam) : "—"}</div>
                    </div>
                    <div className="rounded bg-muted/50 p-1.5">
                      <div className="text-[9px] uppercase text-muted-foreground">SAM</div>
                      <div className="text-[10px] font-bold">{n.sam ? formatCurrency(n.sam) : "—"}</div>
                    </div>
                    <div className="rounded bg-muted/50 p-1.5">
                      <div className="text-[9px] uppercase text-muted-foreground">SOM</div>
                      <div className="text-[10px] font-bold text-success">{n.som ? formatCurrency(n.som) : "—"}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 flex-1 text-[10px] font-semibold"
                      onClick={() => navigate({ to: "/analyze", search: { q: n.name } })}
                    >
                      Analisar nicho <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                    {n.simulation && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1 px-2 text-[10px] text-primary"
                        onClick={() => setShowChecklist(showChecklist === n.name ? null : n.name)}
                      >
                        <Calculator className="h-3 w-3" />
                        Validar
                      </Button>
                    )}
                  </div>

                  {showChecklist === n.name && n.simulation && (
                    <div className="mt-3 space-y-2 rounded-lg bg-muted/30 p-3 animate-in fade-in slide-in-from-top-2">
                      <div className="flex items-center justify-between border-b border-border/50 pb-1.5 mb-2">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Simulação de Receita</span>
                        <span className="text-[10px] font-bold text-success">{formatCurrency(n.simulation.faturamento_estimado_anual)}/ano</span>
                      </div>
                      <div className="space-y-1.5">
                        {n.simulation.checkpoints.map((cp, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <CheckCircle className="mt-0.5 h-3 w-3 shrink-0 text-success" />
                            <span className="text-[10px] text-muted-foreground leading-tight">{cp}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
            <div className="mb-3 rounded-full bg-muted p-3">
              <Sparkles className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-semibold text-foreground">Aumente sua visão de mercado</h4>
            <p className="max-w-[280px] text-xs">
              Use a IA para processar tendências e CNAEs para descobrir 10 sub-nichos com estimativas financeiras reais.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

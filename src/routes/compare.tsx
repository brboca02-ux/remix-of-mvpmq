import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import { z } from "zod";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAnalysisHistory } from "@/hooks/useAnalysisHistory";
import { formatCurrency, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { MarketAnalysis } from "@/lib/types";

const searchSchema = z.object({ ids: z.string().optional() });

export const Route = createFileRoute("/compare")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Comparar mercados — MarketScope AI" },
      { name: "description", content: "Compare TAM, SAM, SOM, score e concorrência lado a lado." },
    ],
  }),
  component: ComparePage,
});

function ComparePage() {
  const { ids } = Route.useSearch();
  const { items } = useAnalysisHistory();
  const [analyses, setAnalyses] = useState<MarketAnalysis[]>([]);

  useEffect(() => {
    const wanted = (ids || "").split(",").filter(Boolean);
    setAnalyses(wanted.map((id: string) => items.find((i) => i.id === id)).filter(Boolean) as MarketAnalysis[]);
  }, [ids, items]);

  if (analyses.length < 2) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="mx-auto max-w-3xl px-4 py-20 text-center">
          <h1 className="text-3xl font-bold">Selecione 2 ou 3 análises</h1>
          <p className="mt-2 text-muted-foreground">
            Volte ao histórico e escolha as análises que deseja comparar.
          </p>
          <Link
            to="/history"
            className="mt-6 inline-flex h-10 items-center rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Voltar ao histórico
          </Link>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const verdictIcon = { sim: CheckCircle2, talvez: AlertCircle, nao: XCircle };
  const verdictColor = { sim: "text-success", talvez: "text-warning", nao: "text-destructive" };
  const verdictLabel = { sim: "Vale a pena", talvez: "Pode valer", nao: "Não recomendado" };

  const rows: Array<{ label: string; render: (a: MarketAnalysis) => React.ReactNode }> = [
    { label: "Ideia", render: (a) => <span className="font-semibold">{a.input.idea}</span> },
    {
      label: "Score",
      render: (a) => (
        <Badge
          className={cn(
            "text-base font-bold",
            a.score >= 70
              ? "bg-success/15 text-success"
              : a.score >= 40
                ? "bg-warning/15 text-warning"
                : "bg-destructive/15 text-destructive",
          )}
          variant="outline"
        >
          {a.score} ({a.scoreLabel})
        </Badge>
      ),
    },
    { label: "TAM", render: (a) => <span className="font-bold">{formatCurrency(a.tam)}</span> },
    { label: "SAM", render: (a) => <span className="font-bold">{formatCurrency(a.sam)}</span> },
    { label: "SOM", render: (a) => <span className="font-bold text-success">{formatCurrency(a.som)}</span> },
    { label: "Crescimento a.a.", render: (a) => <span>+{a.growthRate.toFixed(1)}%</span> },
    { label: "Volume de busca/mês", render: (a) => formatNumber(a.searchVolume) },
    {
      label: "Concorrência",
      render: (a) => (
        <Badge variant="outline" className="capitalize">
          {a.competition}
        </Badge>
      ),
    },
    { label: "Ticket médio", render: (a) => formatCurrency(a.averageTicket) },
    {
      label: "Veredito",
      render: (a) => {
        const Icon = verdictIcon[a.verdict];
        return (
          <span className={cn("inline-flex items-center gap-1.5 font-semibold", verdictColor[a.verdict])}>
            <Icon className="h-4 w-4" /> {verdictLabel[a.verdict]}
          </span>
        );
      },
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
        <Link
          to="/history"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar ao histórico
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Comparativo de mercados</h1>
        <p className="mt-1 text-muted-foreground">{analyses.length} análises lado a lado</p>

        <Card className="mt-8 overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="sticky left-0 bg-muted/40 px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Métrica
                    </th>
                    {analyses.map((a, i) => (
                      <th key={a.id} className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Análise {i + 1}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.label} className="border-t border-border">
                      <td className="sticky left-0 bg-card px-5 py-4 font-medium text-muted-foreground">
                        {r.label}
                      </td>
                      {analyses.map((a) => (
                        <td key={a.id} className="px-5 py-4 align-top">
                          {r.render(a)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}

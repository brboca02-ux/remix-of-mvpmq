import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { Loader2, Sparkles, Search } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { analyzeMarket } from "@/server/market.functions";
import { useAnalysisHistory } from "@/hooks/useAnalysisHistory";
import type { MarketAnalysis, Region } from "@/lib/types";
import { AnalysisDashboard } from "@/components/analysis-dashboard";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const analyzeSearchSchema = z.object({
  q: fallback(z.string(), "").default(""),
});

export const Route = createFileRoute("/analyze")({
  validateSearch: zodValidator(analyzeSearchSchema),
  head: () => ({
    meta: [
      { title: "Analisar mercado — MarketScope AI" },
      {
        name: "description",
        content: "Descreva sua ideia e receba TAM, SAM, SOM, score e insights estratégicos em segundos.",
      },
      { property: "og:title", content: "Analisar mercado — MarketScope AI" },
      { property: "og:description", content: "Validação de mercado por IA em menos de 1 minuto." },
    ],
  }),
  component: AnalyzePage,
});

function AnalyzePage() {
  const analyze = useServerFn(analyzeMarket);
  const { save } = useAnalysisHistory();
  const navigate = useNavigate();
  const { q } = Route.useSearch();

  const [idea, setIdea] = useState(q ?? "");
  const [audience, setAudience] = useState("");
  const [region, setRegion] = useState<Region>("brasil");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<MarketAnalysis | null>(null);

  // Sync prefill if user navigates between niches
  useEffect(() => {
    if (q && q.trim().length > 0) {
      setIdea(q);
      toast.info("Ideia pré-preenchida — revise e clique em Analisar.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (idea.trim().length < 5) {
      toast.error("Descreva a ideia com mais detalhes.");
      return;
    }
    setLoading(true);
    setAnalysis(null);
    try {
      const result = await analyze({ data: { idea, audience: audience || undefined, region } });
      save(result);
      setAnalysis(result);
      toast.success("Análise concluída!");
      // smooth scroll to results
      setTimeout(() => {
        document.getElementById("results")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Falha ao gerar análise.";
      if (msg.startsWith("RATE_LIMIT:")) toast.error(msg.replace("RATE_LIMIT:", ""));
      else if (msg.startsWith("PAYMENT_REQUIRED:")) toast.error(msg.replace("PAYMENT_REQUIRED:", ""));
      else toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const examples = [
    "Curso de finanças para jovens",
    "App de meditação para mães",
    "SaaS de gestão para clínicas de estética",
    "Marketplace de aulas de tênis",
  ];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              Analise qualquer mercado
            </h1>
            <p className="mt-3 text-muted-foreground">
              Descreva sua ideia. A IA gera TAM, SAM, SOM, score e insights.
            </p>
          </div>

          <Card className="shadow-lg">
            <CardContent className="p-6 md:p-8">
              <form onSubmit={submit} className="space-y-5">
                <div>
                  <Label htmlFor="idea" className="text-sm font-semibold">
                    Sua ideia <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="idea"
                    value={idea}
                    onChange={(e) => setIdea(e.target.value)}
                    placeholder="Ex: Plataforma online que ensina educação financeira para universitários brasileiros..."
                    rows={3}
                    className="mt-2 resize-none text-base"
                    disabled={loading}
                  />
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {examples.map((ex) => (
                      <button
                        key={ex}
                        type="button"
                        onClick={() => setIdea(ex)}
                        disabled={loading}
                        className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground disabled:opacity-50"
                      >
                        {ex}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="audience" className="text-sm font-semibold">
                      Público-alvo <span className="text-muted-foreground">(opcional)</span>
                    </Label>
                    <Input
                      id="audience"
                      value={audience}
                      onChange={(e) => setAudience(e.target.value)}
                      placeholder="Ex: jovens 18-25 anos"
                      className="mt-2"
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">Região</Label>
                    <div className="mt-2 grid grid-cols-3 gap-1 rounded-lg border border-border bg-muted/40 p-1">
                      {(
                        [
                          { v: "brasil", l: "Brasil" },
                          { v: "latam", l: "LatAm" },
                          { v: "global", l: "Global" },
                        ] as const
                      ).map((r) => (
                        <button
                          key={r.v}
                          type="button"
                          onClick={() => setRegion(r.v)}
                          disabled={loading}
                          className={cn(
                            "rounded-md py-1.5 text-xs font-medium transition-colors",
                            region === r.v
                              ? "bg-background text-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground",
                          )}
                        >
                          {r.l}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading || idea.trim().length < 5}
                  className="h-12 w-full text-base font-semibold shadow-lg shadow-primary/20"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Analisando mercado…
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Analisar Mercado
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {loading && (
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-xl border border-border bg-card p-6">
                  <div className="h-3 w-16 animate-pulse rounded bg-muted" />
                  <div className="mt-4 h-8 w-24 animate-pulse rounded bg-muted" />
                  <div className="mt-3 h-3 w-full animate-pulse rounded bg-muted" />
                  <div className="mt-2 h-3 w-3/4 animate-pulse rounded bg-muted" />
                </div>
              ))}
            </div>
          )}

          {!loading && !analysis && (
            <div className="mt-10 flex flex-col items-center gap-3 text-center text-muted-foreground">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                <Search className="h-6 w-6" />
              </div>
              <p className="text-sm">
                Sua análise aparecerá aqui. Comece descrevendo sua ideia acima.
              </p>
              <button
                onClick={() => navigate({ to: "/history" })}
                className="text-sm font-medium text-primary hover:underline"
              >
                Ver análises anteriores →
              </button>
            </div>
          )}
        </div>

        {analysis && (
          <div id="results" className="mt-12">
            <AnalysisDashboard analysis={analysis} onUpdate={(a) => { save(a); setAnalysis(a); }} />
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

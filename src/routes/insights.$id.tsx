import { useEffect, useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { AnalysisDashboard } from "@/components/analysis-dashboard";
import { useAnalysisHistory, getAnalysisById } from "@/hooks/useAnalysisHistory";
import type { MarketAnalysis } from "@/lib/types";

export const Route = createFileRoute("/insights/$id")({
  head: () => ({
    meta: [
      { title: "Análise de mercado — MarketScope AI" },
      { name: "description", content: "Detalhes da sua análise de mercado." },
    ],
  }),
  component: InsightsPage,
  notFoundComponent: () => (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-3xl font-bold">Análise não encontrada</h1>
        <p className="mt-2 text-muted-foreground">
          Ela pode ter sido removida ou está em outro navegador (histórico é local).
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
  ),
});

function InsightsPage() {
  const { id } = Route.useParams();
  const { save } = useAnalysisHistory();
  const [analysis, setAnalysis] = useState<MarketAnalysis | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const found = getAnalysisById(id);
    setAnalysis(found ?? null);
    setHydrated(true);
  }, [id]);

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="mx-auto max-w-7xl px-4 py-20">
          <div className="h-8 w-64 animate-pulse rounded bg-muted" />
        </main>
      </div>
    );
  }

  if (!analysis) {
    throw notFound();
  }

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
        <AnalysisDashboard analysis={analysis} onUpdate={(a) => { save(a); setAnalysis(a); }} />
      </main>
      <SiteFooter />
    </div>
  );
}

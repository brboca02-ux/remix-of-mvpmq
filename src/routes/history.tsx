import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Star, Trash2, ArrowRight, GitCompare, Inbox } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAnalysisHistory } from "@/hooks/useAnalysisHistory";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Histórico — MarketScope AI" },
      { name: "description", content: "Suas análises de mercado salvas localmente. Compare e favorite." },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const { items, remove, toggleFavorite } = useAnalysisHistory();
  const [selected, setSelected] = useState<string[]>([]);
  const navigate = useNavigate();

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length >= 3 ? prev : [...prev, id],
    );
  };

  const compare = () => {
    if (selected.length < 2) return;
    navigate({ to: "/compare", search: { ids: selected.join(",") } });
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Histórico de análises</h1>
            <p className="mt-1 text-muted-foreground">
              {items.length} análise{items.length === 1 ? "" : "s"} salva{items.length === 1 ? "" : "s"} localmente
            </p>
          </div>
          {items.length >= 2 && (
            <Button onClick={compare} disabled={selected.length < 2} variant="default">
              <GitCompare className="h-4 w-4" />
              Comparar ({selected.length}/3)
            </Button>
          )}
        </div>

        {items.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Inbox className="h-7 w-7 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold">Nenhuma análise ainda</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Analise sua primeira ideia em menos de 1 minuto.
                </p>
              </div>
              <Link
                to="/analyze"
                className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Analisar agora <ArrowRight className="h-4 w-4" />
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {items.map((a) => {
              const isSel = selected.includes(a.id);
              return (
                <Card
                  key={a.id}
                  className={cn(
                    "group relative transition-all",
                    isSel && "ring-2 ring-primary",
                  )}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-2">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs font-bold",
                          a.score >= 70
                            ? "border-success/30 bg-success/10 text-success"
                            : a.score >= 40
                              ? "border-warning/30 bg-warning/10 text-warning"
                              : "border-destructive/30 bg-destructive/10 text-destructive",
                        )}
                      >
                        Score {a.score}
                      </Badge>
                      <div className="flex gap-1">
                        <button
                          onClick={() => toggleFavorite(a.id)}
                          className="rounded p-1 text-muted-foreground hover:text-warning"
                          aria-label="Favoritar"
                        >
                          <Star className={cn("h-4 w-4", a.favorite && "fill-warning text-warning")} />
                        </button>
                        <button
                          onClick={() => remove(a.id)}
                          className="rounded p-1 text-muted-foreground hover:text-destructive"
                          aria-label="Remover"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <h3 className="mt-3 line-clamp-2 font-semibold">{a.input.idea}</h3>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <div className="text-muted-foreground">TAM</div>
                        <div className="font-bold">{formatCurrency(a.tam)}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">SAM</div>
                        <div className="font-bold">{formatCurrency(a.sam)}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">SOM</div>
                        <div className="font-bold text-success">{formatCurrency(a.som)}</div>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{formatDate(a.createdAt)}</span>
                      <Link
                        to="/insights/$id"
                        params={{ id: a.id }}
                        className="text-xs font-semibold text-primary hover:underline"
                      >
                        Ver detalhes →
                      </Link>
                    </div>
                    <label className="mt-4 flex cursor-pointer items-center gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={isSel}
                        onChange={() => toggle(a.id)}
                        className="h-4 w-4 rounded border-border accent-primary"
                      />
                      Selecionar para comparar
                    </label>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

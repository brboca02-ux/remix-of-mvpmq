import { useMemo, useState } from "react";
import { TrendingUp, Trophy, Sparkles, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency, formatNumber } from "@/lib/format";
import { getCnaeByCode } from "@/lib/cnae-data";
import type { Company } from "@/lib/company-types";

interface Props {
  companies: Company[];
  total: number;
  onSelect?: (c: Company) => void;
}

export function CompetitiveIntel({ companies, total, onSelect }: Props) {
  const [caseOpen, setCaseOpen] = useState(false);

  const baseline = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of companies) counts.set(c.cnaeCode, (counts.get(c.cnaeCode) || 0) + 1);
    const top = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    let sum = 0;
    let label = "";
    for (const [code] of top) {
      const cnae = getCnaeByCode(code);
      if (cnae) {
        sum += cnae.totalBrasil;
        if (!label) label = cnae.label;
      }
    }
    return { totalBrasil: sum || 100000, topLabel: label || "setor" };
  }, [companies]);

  const top5 = useMemo(
    () =>
      [...companies]
        .sort((a, b) => b.faturamentoEstimado - a.faturamentoEstimado)
        .slice(0, 5),
    [companies],
  );

  if (total === 0) return null;

  const densidade = (total / baseline.totalBrasil) * 100;
  const nivel =
    densidade < 10 ? "Baixa" : densidade < 40 ? "Média" : "Alta";
  const nivelColor =
    nivel === "Alta"
      ? "bg-destructive/15 text-destructive"
      : nivel === "Média"
        ? "bg-primary/15 text-primary"
        : "bg-success/15 text-success";

  const champion = top5[0];
  const caseUplift = champion ? Math.round((champion.faturamentoEstimado / 1_000_000) * 0.15 * 10) / 10 : 0;

  return (
    <>
      <div className="grid gap-3 border-b border-border/60 bg-card px-4 py-3 md:grid-cols-3 md:px-6">
        {/* Concorrência */}
        <div className="rounded-lg border border-border/60 bg-background p-3">
          <div className="mb-2 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-muted-foreground">Concorrência do setor</span>
            <Badge className={`ml-auto text-[10px] ${nivelColor}`} variant="secondary">
              {nivel}
            </Badge>
          </div>
          <div className="text-lg font-bold">
            {formatNumber(total)} <span className="text-xs font-normal text-muted-foreground">/ ~{formatNumber(baseline.totalBrasil)}</span>
          </div>
          <p className="mt-1 line-clamp-1 text-[11px] text-muted-foreground">
            empresas no CNAE {baseline.topLabel}
          </p>
        </div>

        {/* Top 5 Faturamento */}
        <div className="rounded-lg border border-border/60 bg-background p-3">
          <div className="mb-2 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-muted-foreground">Top 5 Faturamento</span>
          </div>
          <ul className="space-y-1">
            {top5.map((c, i) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => onSelect?.(c)}
                  className="flex w-full items-center gap-2 rounded px-1 py-0.5 text-left text-xs hover:bg-muted"
                >
                  <span className="w-3 text-muted-foreground">{i + 1}.</span>
                  <span className="flex-1 truncate">{c.nome}</span>
                  <span className="font-semibold text-success">
                    {formatCurrency(c.faturamentoEstimado)}
                  </span>
                </button>
              </li>
            ))}
            {top5.length === 0 && (
              <li className="text-xs text-muted-foreground">Sem dados</li>
            )}
          </ul>
        </div>

        {/* Maior Case */}
        <div className="rounded-lg border border-border/60 bg-background p-3">
          <div className="mb-2 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-muted-foreground">Maior Case</span>
          </div>
          {champion ? (
            <>
              <div className="line-clamp-1 text-sm font-semibold">{champion.nome}</div>
              <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">
                Cliente similar: <span className="font-semibold text-success">+R$ {caseUplift}M/ano</span> com leads enriquecidos
              </p>
              <Button
                size="sm"
                variant="ghost"
                className="mt-1 h-6 gap-1 px-1 text-[11px]"
                onClick={() => setCaseOpen(true)}
              >
                Ver detalhes <ArrowRight className="h-3 w-3" />
              </Button>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">Sem dados</p>
          )}
        </div>
      </div>

      <Dialog open={caseOpen} onOpenChange={setCaseOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Case: {champion?.nome}</DialogTitle>
            <DialogDescription>
              Resultado obtido por cliente similar do setor {champion?.sector}
            </DialogDescription>
          </DialogHeader>
          {champion && (
            <div className="space-y-3 text-sm">
              <div className="rounded-lg border border-border/60 bg-muted/40 p-3">
                <div className="text-xs text-muted-foreground">Faturamento atual estimado</div>
                <div className="text-xl font-bold">{formatCurrency(champion.faturamentoEstimado)}</div>
              </div>
              <div className="rounded-lg border border-success/30 bg-success/5 p-3">
                <div className="text-xs text-muted-foreground">Uplift projetado com lead intelligence</div>
                <div className="text-xl font-bold text-success">+R$ {caseUplift}M/ano</div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Baseado em média de +15% em conversão B2B com leads enriquecidos por CNPJ real, segmentação por tecnografia e score preditivo.
                </p>
              </div>
              <ul className="ml-4 list-disc space-y-1 text-xs text-muted-foreground">
                <li>Segmentação por porte ({champion.porte}) e região ({champion.cidade}/{champion.estado})</li>
                <li>Filtros de qualidade (e-mail, telefone, site validados)</li>
                <li>Scoring preditivo de propensão de compra</li>
              </ul>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

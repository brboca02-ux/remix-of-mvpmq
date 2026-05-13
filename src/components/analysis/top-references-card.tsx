import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Award,
  ExternalLink,
  Search,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Copy,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CnpjValidationDialog } from "@/components/analysis/cnpj-validation-dialog";
import { lookupCnpj } from "@/lib/cnpj.functions";
import { toast } from "sonner";
import type { MarketAnalysis } from "@/lib/types";

interface Reference {
  nome: string;
  faturamento: string;
  destaque: string;
  cnpj: string;
  site: string;
}

// Top 5 — apenas CNPJs oficiais 2026 validados pelo usuário.
// Sem "Estimado": preferimos mostrar 5 reais a 10 mistos.
const SOLAR_REFS: Reference[] = [
  { nome: "NeoSolar Energia", cnpj: "12.420.339/0001-26", site: "neosolar.com.br", faturamento: "R$ 1,8 bi", destaque: "#1 Distribuidora" },
  { nome: "Aldo Solar", cnpj: "81.106.957/0001-19", site: "aldo.com.br", faturamento: "R$ 1,2 bi", destaque: "Brookfield (Descarbonize)" },
  { nome: "Órigo Energia", cnpj: "12.194.903/0001-30", site: "origoenergia.com.br", faturamento: "R$ 850 mi", destaque: "Usinas GD" },
  { nome: "Helia Solar", cnpj: "44.813.512/0001-42", site: "heliasolar.com.br", faturamento: "R$ 450 mi", destaque: "Campinas SP" },
  { nome: "Sices Brasil", cnpj: "10.708.317/0001-57", site: "sicesbrasil.com.br", faturamento: "R$ 650 mi", destaque: "Distribuição premium" },
];

type Status = "loading" | "active" | "inactive" | "error";

interface ValidationState {
  status: Status;
  situacao?: string;
  sociosCount?: number;
  adminPF?: number;
}

function isSolarAnalysis(a: MarketAnalysis): boolean {
  const text = `${a.input.idea} ${a.input.audience ?? ""}`.toLowerCase();
  return /solar|fotovolt|painel|painéis|gd|geração distribuída|energia limpa|fotovoltaic/.test(text);
}

function truncateCnpj(cnpj: string): string {
  const slash = cnpj.indexOf("/");
  return slash > 0 ? `${cnpj.slice(0, slash)}/…` : cnpj;
}

export function TopReferencesCard({ analysis }: { analysis: MarketAnalysis }) {
  const [selected, setSelected] = useState<Reference | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [validations, setValidations] = useState<Record<string, ValidationState>>(() =>
    Object.fromEntries(SOLAR_REFS.map((r) => [r.cnpj, { status: "loading" as const }])),
  );

  const isSolar = isSolarAnalysis(analysis);

  // Validação live no mount — sequencial com 400ms entre calls para respeitar BrasilAPI rate limit.
  useEffect(() => {
    if (!isSolar) return;
    let cancelled = false;

    (async () => {
      for (const ref of SOLAR_REFS) {
        if (cancelled) return;
        try {
          const r = await lookupCnpj({ data: { cnpj: ref.cnpj } });
          if (cancelled) return;
          if (r.ok) {
            const ativa = r.data.situacao?.toUpperCase().includes("ATIVA");
            const socios = r.data.socios ?? [];
            const adminPF = socios.filter(
              (s) => s.tipo === "PF" && s.qualificacao.toLowerCase().includes("administrador"),
            ).length;
            setValidations((prev) => ({
              ...prev,
              [ref.cnpj]: {
                status: ativa ? "active" : "inactive",
                situacao: r.data.situacao,
                sociosCount: socios.length,
                adminPF,
              },
            }));
          } else {
            setValidations((prev) => ({
              ...prev,
              [ref.cnpj]: { status: "error", situacao: String(r.error) },
            }));
          }
        } catch {
          if (!cancelled) {
            setValidations((prev) => ({
              ...prev,
              [ref.cnpj]: { status: "error" },
            }));
          }
        }
        // Pequeno delay para evitar burst > rate limit BrasilAPI.
        await new Promise((res) => setTimeout(res, 400));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isSolar]);

  if (!isSolar) return null;

  const activeCount = Object.values(validations).filter((v) => v.status === "active").length;
  const stillLoading = Object.values(validations).some((v) => v.status === "loading");

  const copyCnpj = (cnpj: string) => {
    navigator.clipboard.writeText(cnpj).then(
      () => toast.success("CNPJ copiado", { description: cnpj }),
      () => toast.error("Não foi possível copiar"),
    );
  };

  return (
    <TooltipProvider delayDuration={150}>
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2 text-base">
            <Award className="h-4 w-4 text-primary" />
            Top 5 Referências Validadas — Setor Solar
            <Badge
              variant="outline"
              className="ml-1 border-success/30 bg-success/10 text-[10px] text-success"
            >
              {stillLoading ? `${activeCount}/${SOLAR_REFS.length} validadas…` : `${activeCount}/${SOLAR_REFS.length} ativas`}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {SOLAR_REFS.map((r) => {
              const v = validations[r.cnpj] ?? { status: "loading" as const };
              const isExpanded = expanded === r.cnpj;
              return (
                <div
                  key={r.cnpj}
                  className="group rounded-lg border border-border bg-background p-3 text-left transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"
                >
                  <button
                    type="button"
                    onClick={() => setSelected(r)}
                    className="flex w-full items-start justify-between gap-2 text-left focus:outline-none"
                    aria-label={`Ver detalhes de ${r.nome}`}
                  >
                    <h4 className="text-sm font-semibold leading-tight">{r.nome}</h4>
                    <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </button>

                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <Badge
                      variant="outline"
                      className="border-success/30 bg-success/10 text-success"
                    >
                      {r.faturamento}
                    </Badge>
                    <StatusBadge state={v} />
                  </div>

                  {(v.sociosCount ?? 0) > 0 && (
                    <div className="mt-1.5 flex flex-wrap items-center gap-1">
                      <Badge
                        variant="outline"
                        className="gap-0.5 border-border bg-muted/40 text-[10px] text-muted-foreground"
                      >
                        <Users className="h-2.5 w-2.5" />
                        {v.sociosCount} sócio{v.sociosCount! > 1 ? "s" : ""}
                      </Badge>
                      {(v.adminPF ?? 0) > 0 && (
                        <Badge
                          variant="outline"
                          className="border-success/40 bg-success/10 text-[10px] text-success"
                        >
                          ADMIN PF
                        </Badge>
                      )}
                    </div>
                  )}

                  <p className="mt-2 text-xs text-muted-foreground">{r.destaque}</p>

                  {/* CNPJ row: tooltip desktop + tap-to-expand mobile + copy */}
                  <div className="mt-2 flex items-center gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={() => setExpanded(isExpanded ? null : r.cnpj)}
                          className="font-mono text-[10px] text-muted-foreground/80 hover:text-foreground"
                          aria-label={`Mostrar CNPJ completo de ${r.nome}`}
                        >
                          <span className="hidden sm:inline">{r.cnpj}</span>
                          <span className="sm:hidden">
                            {isExpanded ? r.cnpj : truncateCnpj(r.cnpj)}
                          </span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="font-mono text-[11px]">
                        {r.cnpj}
                      </TooltipContent>
                    </Tooltip>
                    <button
                      type="button"
                      onClick={() => copyCnpj(r.cnpj)}
                      className="rounded p-0.5 text-muted-foreground/60 hover:bg-accent hover:text-foreground"
                      aria-label="Copiar CNPJ"
                    >
                      <Copy className="h-2.5 w-2.5" />
                    </button>
                  </div>

                  <a
                    href={`https://${r.site}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 flex items-center gap-1 truncate text-[10px] text-primary hover:underline"
                    title={r.site}
                  >
                    <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                    <span className="truncate">{r.site}</span>
                  </a>
                </div>
              );
            })}
          </div>

          <CnpjValidationDialog
            open={!!selected}
            onOpenChange={(v) => !v && setSelected(null)}
            cnpj={selected?.cnpj ?? ""}
            nome={selected?.nome ?? ""}
          />

          <div className="flex flex-col items-start justify-between gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center">
            <div className="flex items-start gap-2 text-sm">
              <Users className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>
                Encontre <strong>250+ instaladores</strong> com perfil similar a NeoSolar &amp; Aldo
                no buscador filtrado por CNAE.
              </span>
            </div>
            <Button asChild size="sm" className="gap-2">
              <Link
                to="/buscador"
                search={{ cnae: ["4321-5", "3511-5"], porte: [], uf: [] }}
              >
                Buscar leads similares
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>

          <p className="text-[11px] text-muted-foreground">
            Validação ao vivo: OpenCNPJ → BrasilAPI → ReceitaWS (Receita Federal). QSA exibido
            quando disponível. Faturamentos a partir de fontes públicas 2026.
          </p>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}

function StatusBadge({ state }: { state: ValidationState }) {
  switch (state.status) {
    case "loading":
      return (
        <Badge
          variant="outline"
          className="gap-0.5 border-muted-foreground/30 bg-muted text-[10px] text-muted-foreground"
        >
          <Loader2 className="h-2.5 w-2.5 animate-spin" />
          Validando…
        </Badge>
      );
    case "active":
      return (
        <Badge
          variant="outline"
          className="gap-0.5 border-success/40 bg-success/10 text-[10px] text-success"
        >
          <CheckCircle2 className="h-2.5 w-2.5" />
          ATIVA
        </Badge>
      );
    case "inactive":
      return (
        <Badge
          variant="outline"
          className="gap-0.5 border-destructive/40 bg-destructive/10 text-[10px] text-destructive"
        >
          <XCircle className="h-2.5 w-2.5" />
          {state.situacao?.toUpperCase().includes("BAIXADA") ? "BAIXADA" : "INAPTA"}
        </Badge>
      );
    case "error":
    default:
      return (
        <Badge
          variant="outline"
          className="gap-0.5 border-warning/40 bg-warning/10 text-[10px] text-warning"
        >
          <AlertTriangle className="h-2.5 w-2.5" />
          Indisponível
        </Badge>
      );
  }
}

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  BarChart,
  Bar,
} from "recharts";
import {
  CheckCircle2,
  AlertCircle,
  XCircle,
  Sparkles,
  TrendingUp,
  Search,
  Lightbulb,
  Compass,
  Loader2,
  Star,
  ArrowRight,
  Calculator,
  Info,
} from "lucide-react";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { MarketAnalysis } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatNumber } from "@/lib/format";
import { CNAES } from "@/lib/cnae-data";

// Estima nº de empresas ativas no Brasil pelos CNAEs que casam com a ideia
function estimateActiveCompanies(idea: string, audience?: string): number | null {
  const text = `${idea} ${audience ?? ""}`.toLowerCase();
  if (text.trim().length < 3) return null;
  const tokens = text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 4);
  if (tokens.length === 0) return null;
  const matched = CNAES.filter((c) => {
    const hay = `${c.label} ${c.sector}`
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    return tokens.some((t) => hay.includes(t));
  });
  if (matched.length === 0) return null;
  return matched.reduce((s, c) => s + c.totalBrasil, 0);
}
import { cn } from "@/lib/utils";
import { useServerFn } from "@tanstack/react-start";
import { expandNiches } from "@/server/market.functions";
import { toast } from "sonner";
import { AIConsultor } from "@/components/ai-consultor";
import { useAnalysisHistory } from "@/hooks/useAnalysisHistory";
import { TopReferencesCard } from "@/components/analysis/top-references-card";
import { SolarNichesCard } from "@/components/analysis/solar-niches-card";

export function AnalysisDashboard({
  analysis,
  onUpdate,
}: {
  analysis: MarketAnalysis;
  onUpdate?: (a: MarketAnalysis) => void;
}) {
  const { toggleFavorite, items } = useAnalysisHistory();
  const isFav = items.find((i) => i.id === analysis.id)?.favorite;

  return (
    <div className="space-y-6">
      <ScoreHeader analysis={analysis} isFavorite={!!isFav} onToggleFav={() => toggleFavorite(analysis.id)} />
      <MarketSizeCards analysis={analysis} />
      <div className="grid gap-6 lg:grid-cols-3">
        <GrowthChart analysis={analysis} />
        <SearchCard analysis={analysis} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <CompetitionCard analysis={analysis} />
        <RevenueSimulator analysis={analysis} />
      </div>
      <InsightsCard analysis={analysis} />
      <TopReferencesCard analysis={analysis} />
      <ProductIdeasCard analysis={analysis} />
      <SolarNichesCard analysis={analysis} onUpdate={onUpdate} />
      <VerdictCard analysis={analysis} />
      <AIConsultor analysis={analysis} />
    </div>
  );
}

function ScoreHeader({
  analysis,
  isFavorite,
  onToggleFav,
}: {
  analysis: MarketAnalysis;
  isFavorite: boolean;
  onToggleFav: () => void;
}) {
  const color =
    analysis.score >= 70 ? "text-success" : analysis.score >= 40 ? "text-warning" : "text-destructive";
  const bg =
    analysis.score >= 70 ? "bg-success/5 border border-success/20" : analysis.score >= 40 ? "bg-warning/5 border border-warning/20" : "bg-destructive/5 border border-destructive/20";

  return (
    <Card className="overflow-hidden border border-white/5 bg-black text-white shadow-2xl transition-all duration-500 hover:border-primary/30 relative">
      <div className="absolute top-0 left-0 w-1 h-full bg-primary glow-primary" />
      <CardContent className="p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-primary">
              <Sparkles className="h-3 w-3" /> Inteligência de Mercado
            </div>
            <h2 className="text-3xl font-bold md:text-4xl tracking-tighter">{analysis.input.idea}</h2>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              {analysis.input.audience && (
                <Badge variant="secondary" className="bg-white/5 text-white border-white/10 hover:bg-white/10 px-3 font-bold uppercase tracking-widest text-[9px]">
                  Público: {analysis.input.audience}
                </Badge>
              )}
              <Badge variant="secondary" className="bg-white/5 text-white border-white/10 hover:bg-white/10 px-3 font-bold uppercase tracking-widest text-[9px]">
                Região: {analysis.input.region === "brasil" ? "Brasil" : analysis.input.region === "latam" ? "América Latina" : "Global"}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={onToggleFav}
              className="rounded-full bg-white/15 p-3 transition-colors hover:bg-white/25"
              aria-label="Favoritar"
            >
              <Star className={cn("h-5 w-5", isFavorite && "fill-warning text-warning")} />
            </button>
            <div className={cn("flex h-32 w-32 flex-col items-center justify-center rounded-2xl animate-in zoom-in-50 duration-500", bg)}>
              <div className={cn("text-5xl font-bold", color)}>{analysis.score}</div>
              <div className={cn("text-xs font-semibold uppercase tracking-wider", color)}>
                {analysis.scoreLabel}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MarketSizeCards({ analysis }: { analysis: MarketAnalysis }) {
  const activeCompanies = useMemo(
    () => estimateActiveCompanies(analysis.input.idea, analysis.input.audience),
    [analysis.input.idea, analysis.input.audience],
  );

  const tamTooltip = activeCompanies
    ? `Total Addressable Market: o tamanho total do mercado se 100% dos clientes possíveis comprassem seu produto. Estimativa baseada em ~${formatNumber(activeCompanies)} empresas ativas no Brasil (estimativa IBGE/RFB).`
    : "Total Addressable Market: o tamanho total do mercado se 100% dos clientes possíveis comprassem seu produto. É o teto teórico de receita do seu setor.";

  const items = [
    {
      label: "TAM",
      sublabel: "Total Addressable Market",
      value: analysis.tam,
      desc: analysis.tamDescription,
      tone: "primary" as const,
      tooltip: tamTooltip,
      footer: activeCompanies
        ? `~${formatNumber(activeCompanies)} empresas ativas no Brasil (estimado)`
        : null,
    },
    {
      label: "SAM",
      sublabel: "Serviceable Available Market",
      value: analysis.sam,
      desc: analysis.samDescription,
      tone: "primary" as const,
      tooltip: "Serviceable Available Market: a parte do TAM que você consegue atender com seu modelo, canal e região atual. É o mercado realmente acessível.",
      footer: null,
    },
    {
      label: "SOM",
      sublabel: "Serviceable Obtainable Market",
      value: analysis.som,
      desc: analysis.somDescription,
      tone: "success" as const,
      tooltip: "Serviceable Obtainable Market: a fatia realista que você consegue capturar nos primeiros anos, considerando concorrência, recursos e execução.",
      footer: null,
    },
  ];
  return (
    <TooltipProvider delayDuration={200}>
      <div className="grid gap-4 md:grid-cols-3">
        {items.map((it) => (
          <Card key={it.label} className="bg-card/30 border-white/5 backdrop-blur-md hover:border-primary/20 transition-all duration-500">
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">{it.label}</div>
                  <UITooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full"
                        aria-label={`O que é ${it.label}?`}
                      >
                        <Info className="h-3.5 w-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs bg-popover text-popover-foreground border">
                      <p className="text-xs leading-relaxed">{it.tooltip}</p>
                    </TooltipContent>
                  </UITooltip>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[8px] font-bold uppercase tracking-widest px-2 py-0.5",
                    it.tone === "success"
                      ? "border-success/30 bg-success/10 text-success"
                      : "border-primary/30 bg-primary/10 text-primary",
                  )}
                >
                  {it.tone === "success" ? "Capturável" : "Endereçável"}
                </Badge>
              </div>
              <div className="mt-2 text-[10px] text-muted-foreground font-mono uppercase tracking-tighter opacity-50">{it.sublabel}</div>
              <div
                className={cn(
                  "mt-4 text-4xl font-mono font-bold tracking-tighter",
                  it.tone === "success" ? "text-success" : "text-white",
                )}
              >
                {formatCurrency(it.value)}
              </div>
              {it.footer && (
                <div className="mt-1 text-xs font-medium text-primary">{it.footer}</div>
              )}
              <p className="mt-3 text-sm text-muted-foreground">{it.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </TooltipProvider>
  );
}

function GrowthChart({ analysis }: { analysis: MarketAnalysis }) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-success" />
            Projeção de crescimento — 5 anos
          </CardTitle>
          <Badge variant="outline" className="border-success/30 bg-success/10 text-success">
            +{analysis.growthRate.toFixed(1)}% a.a.
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={analysis.growthProjection} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="year" stroke="var(--color-muted-foreground)" fontSize={12} />
              <YAxis
                stroke="var(--color-muted-foreground)"
                fontSize={12}
                tickFormatter={(v) => formatCurrency(Number(v))}
                width={70}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(v) => formatCurrency(Number(v))}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--color-primary)"
                strokeWidth={3}
                dot={{ fill: "var(--color-primary)", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function SearchCard({ analysis }: { analysis: MarketAnalysis }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Search className="h-4 w-4 text-primary" />
          Volume de busca
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{formatNumber(analysis.searchVolume)}</div>
        <div className="text-xs text-muted-foreground">buscas/mês estimadas</div>
        <div className="mt-4 h-24 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analysis.searchTrend} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
              <Bar dataKey="volume" fill="var(--color-primary)" radius={[3, 3, 0, 0]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                  fontSize: 11,
                }}
                formatter={(v) => formatNumber(Number(v))}
                labelFormatter={(l) => `Mês: ${l}`}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function CompetitionCard({ analysis }: { analysis: MarketAnalysis }) {
  const levels: Array<{ key: "baixa" | "media" | "alta"; label: string; color: string }> = [
    { key: "baixa", label: "Baixa", color: "bg-success" },
    { key: "media", label: "Média", color: "bg-warning" },
    { key: "alta", label: "Alta", color: "bg-destructive" },
  ];
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Nível de concorrência</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          {levels.map((l) => (
            <div key={l.key} className="flex-1">
              <div
                className={cn(
                  "h-2 rounded-full",
                  analysis.competition === l.key ? l.color : "bg-muted",
                )}
              />
              <div
                className={cn(
                  "mt-2 text-center text-xs font-medium",
                  analysis.competition === l.key ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {l.label}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-muted-foreground">{analysis.competitionReason}</p>
      </CardContent>
    </Card>
  );
}

function RevenueSimulator({ analysis }: { analysis: MarketAnalysis }) {
  const [pct, setPct] = useState([1]);
  const captured = useMemo(() => analysis.som * (pct[0] / 100), [analysis.som, pct]);
  const monthly = captured / 12;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Calculator className="h-4 w-4 text-success" />
          Simulador de receita
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Capturando do SOM</span>
            <span className="font-bold text-primary">{pct[0]}%</span>
          </div>
          <Slider value={pct} onValueChange={setPct} min={0.1} max={10} step={0.1} />
          <div className="mt-1 flex justify-between text-xs text-muted-foreground">
            <span>0,1%</span>
            <span>10%</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl bg-success/5 border border-success/10 p-6 group hover:border-success/30 transition-all">
            <div className="text-[10px] font-bold text-success uppercase tracking-widest mb-2">Receita Anual</div>
            <div className="text-2xl font-mono font-bold text-success group-hover:scale-105 transition-transform">{formatCurrency(captured)}</div>
          </div>
          <div className="rounded-2xl bg-primary/5 border border-primary/10 p-6 group hover:border-primary/30 transition-all">
            <div className="text-[10px] font-bold text-primary uppercase tracking-widest mb-2">Receita Mensal</div>
            <div className="text-2xl font-mono font-bold text-primary group-hover:scale-105 transition-transform">{formatCurrency(monthly)}</div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Ticket médio estimado: <strong>{formatCurrency(analysis.averageTicket)}</strong>
        </p>
      </CardContent>
    </Card>
  );
}

function InsightsCard({ analysis }: { analysis: MarketAnalysis }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Lightbulb className="h-4 w-4 text-warning" />
          Insights estratégicos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {analysis.insights.map((ins, i) => (
            <li key={i} className="flex gap-3 text-sm">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success/15 text-xs font-bold text-success">
                {i + 1}
              </span>
              <span className="text-foreground">{ins}</span>
            </li>
          ))}
        </ul>
        <div className="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-primary">
            Posicionamento sugerido
          </div>
          <p className="mt-1 text-sm text-foreground">{analysis.positioning}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ProductIdeasCard({ analysis }: { analysis: MarketAnalysis }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Sugestões de produtos & serviços</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {analysis.productIdeas.map((p, i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md"
            >
              <Badge variant="outline" className="mb-3 border-primary/30 bg-primary/5 text-primary">
                {p.type}
              </Badge>
              <h4 className="font-semibold">{p.title}</h4>
              <p className="mt-2 text-sm text-muted-foreground">{p.description}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function HiddenNichesCard({
  analysis,
  onUpdate,
}: {
  analysis: MarketAnalysis;
  onUpdate?: (a: MarketAnalysis) => void;
}) {
  const expand = useServerFn(expandNiches);
  const [loading, setLoading] = useState(false);
  const [opportunities, setOpportunities] = useState<any[]>(analysis.nicheOpportunities || []);

  const explode = async () => {
    setLoading(true);
    try {
      // Extrair contexto real: CNAEs detectados, insights, etc.
      const context = `Ideia: ${analysis.input.idea}. Score: ${analysis.score}. Insights: ${analysis.insights.join(". ")}`;
      
      const { niches } = await expand({
        data: { 
          idea: analysis.input.idea, 
          context,
          analysisId: analysis.id 
        },
      });

      if (niches?.length > 0) {
        setOpportunities(niches);
        const updated = { ...analysis, nicheOpportunities: niches };
        onUpdate?.(updated);
        toast.success(`${niches.length} novas oportunidades baseadas em evidências!`);
      } else {
        toast.info("Evidência insuficiente para gerar nichos confiáveis.");
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro";
      toast.error(msg.includes("RATE_LIMIT") ? "Aguarde alguns segundos." : "Falha ao expandir nichos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-background to-primary/5">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Compass className="h-4 w-4 text-primary" />
            Explosão de Nichos (Auditável)
          </CardTitle>
          <Button 
            onClick={explode} 
            disabled={loading} 
            variant="default" 
            size="sm"
            className="shadow-lg shadow-primary/20 transition-all hover:scale-105"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            Gerar Nichos com Evidências
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {opportunities.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {opportunities.map((opp, i) => (
              <div
                key={i}
                className="group relative rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-md"
              >
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="font-bold text-primary">{opp.name}</h4>
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "text-[10px] uppercase tracking-tighter",
                      opp.risk === 'low' ? 'border-success/30 bg-success/10 text-success' :
                      opp.risk === 'medium' ? 'border-warning/30 bg-warning/10 text-warning' :
                      'border-destructive/30 bg-destructive/10 text-destructive'
                    )}
                  >
                    Risco {opp.risk === 'low' ? 'Baixo' : opp.risk === 'medium' ? 'Médio' : 'Alto'}
                  </Badge>
                </div>
                
                <div className="mb-3 space-y-2">
                  <div className="rounded-lg bg-muted/50 p-2 text-xs">
                    <span className="font-semibold text-muted-foreground uppercase text-[10px] block mb-1">Evidência:</span>
                    {opp.evidence}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span className="font-semibold">Fonte:</span> {opp.source}
                    <span className="mx-1">•</span>
                    <span className="font-semibold">Confiança:</span> {Math.round(opp.confidence * 100)}%
                  </div>
                </div>

                <div className="pt-2 border-t border-border/50">
                  <div className="text-[10px] font-bold text-primary uppercase mb-1">Próximo Passo:</div>
                  <p className="text-xs text-foreground italic">"{opp.nextStep}"</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
            <Compass className="h-10 w-10 opacity-20 mb-3" />
            <p className="text-sm max-w-[280px]">
              {loading ? "Processando evidências reais..." : "Clique no botão acima para gerar oportunidades baseadas em evidências reais do mercado."}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function VerdictCard({ analysis }: { analysis: MarketAnalysis }) {
  const config = {
    sim: {
      icon: CheckCircle2,
      label: "Vale a pena",
      color: "text-success",
      bg: "bg-success/10",
      border: "border-success/30",
    },
    talvez: {
      icon: AlertCircle,
      label: "Pode valer a pena",
      color: "text-warning",
      bg: "bg-warning/10",
      border: "border-warning/30",
    },
    nao: {
      icon: XCircle,
      label: "Não recomendado",
      color: "text-destructive",
      bg: "bg-destructive/10",
      border: "border-destructive/30",
    },
  }[analysis.verdict];

  const Icon = config.icon;
  return (
    <Card className={cn("border-2", config.border)}>
      <CardContent className={cn("p-8", config.bg)}>
        <div className="flex items-start gap-5">
          <div className={cn("flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-background", config.color)}>
            <Icon className="h-8 w-8" />
          </div>
          <div className="flex-1">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Veredito do Validador
            </div>
            <h3 className={cn("mt-1 text-2xl font-bold", config.color)}>{config.label}</h3>
            <p className="mt-3 text-foreground">{analysis.verdictReason}</p>
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <ArrowRight className="h-4 w-4" />
              Use a IA Consultora para planejar os próximos passos
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

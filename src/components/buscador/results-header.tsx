import { Download, Save, AlertTriangle, Sparkles, MessageCircle, Search, X, ShieldCheck, Database, Zap, Loader2, Info, Clock, LayoutList, TrendingUp, DollarSign, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { REAL_COMPANIES } from "@/lib/real-companies";
import { getCnaeByCode } from "@/lib/cnae-data";

function formatBRL(n: number) {
  if (n >= 1_000_000_000) return `R$ ${(n / 1_000_000_000).toFixed(1)} bi`;
  if (n >= 1_000_000) return `R$ ${(n / 1_000_000).toFixed(1)} mi`;
  if (n >= 1_000) return `R$ ${(n / 1_000).toFixed(1)} mil`;
  return `R$ ${n.toLocaleString("pt-BR")}`;
}

function formatTimeAgo(iso: string | null): string {
  if (!iso) return "agora";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `há ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `há ${h}h`;
  const d = Math.floor(h / 24);
  return `há ${d}d`;
}

export interface CacheStatus {
  loading: boolean;
  source: "cache" | "places" | "empty" | "idle";
  fromCache: boolean;
  freshCount: number;
  cachedCount: number;
  lastFreshAt: string | null;
  warning?: string;
  query: { nicho: string | null; cidade: string; uf: string };
}

export function ResultsHeader({
  total,
  potencialMensal,
  qualidadeScore,
  distribuicaoPorte,
  searchText,
  onSearchTextChange,
  onExport,
  onExportWhatsApp,
  onSaveList,
  onSavePreset,
  cacheStatus,
  loading = false,
  updatedAt,
}: {
  total: number;
  potencialMensal: number;
  qualidadeScore: number;
  distribuicaoPorte: Record<string, number>;
  searchText: string;
  onSearchTextChange: (v: string) => void;
  onExport: () => void;
  onExportWhatsApp: () => void;
  onSaveList: () => void;
  onSavePreset: () => void;
  cacheStatus?: CacheStatus;
  loading?: boolean;
  updatedAt?: string;
}) {
  const alert =
    total > 10000
      ? { type: "amplo" as const, msg: "Filtro muito amplo — refine para leads mais qualificados." }
      : total > 0 && total < 5
        ? { type: "restrito" as const, msg: "Filtro muito restrito — amplie para mais opções." }
        : total === 0 && !loading
          ? { type: "vazio" as const, msg: "Sem dados suficientes para os filtros aplicados." }
          : null;

  const suggestion =
    total > 10000
      ? "Outros usuários adicionaram: +MEI ou +estado específico"
      : total < 5 && total > 0
        ? "Tente remover o filtro de qualidade de contato"
        : null;

  const validPortes = ["MEI", "Micro", "Pequena", "Média", "Grande"];

  return (
    <div data-testid="prospecting-page" className="space-y-4 border-b border-border/60 bg-card p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {loading ? <Skeleton className="h-8 w-64" /> : (
              <>
                Você segmenta{" "}
                <span className="text-success">{total.toLocaleString("pt-BR")}</span>{" "}
                empresas
              </>
            )}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
            {loading ? <Skeleton className="h-4 w-96" /> : (
              <>
                <TooltipProvider delayDuration={150}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="flex items-center gap-1 cursor-help">
                        Potencial estimado:{" "}
                        <span className="font-semibold text-foreground">{formatBRL(potencialMensal)}/mês</span>
                        <Info className="h-3 w-3 opacity-50" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs">
                      Calculado com base no capital social e porte (Master View)
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <span>·</span>
                <TooltipProvider delayDuration={150}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="flex items-center gap-1 cursor-help">
                        Qualidade:{" "}
                        <span className="font-semibold text-success">{qualidadeScore}/100</span>
                        <Info className="h-3 w-3 opacity-50" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs">
                      Score de propensão de compra e maturidade digital (IA Engine)
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                {updatedAt && (
                  <>
                    <span>·</span>
                    <span className="flex items-center gap-1 text-[10px] opacity-70">
                      <Clock className="h-3 w-3" />
                      Atualizado {formatTimeAgo(updatedAt)}
                    </span>
                  </>
                )}
              </>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={onSavePreset} className="gap-2">
            <Sparkles className="h-4 w-4" />
            Salvar preset
          </Button>
          <Button data-testid="save-list-button" variant="outline" size="sm" onClick={onSaveList} className="gap-2">
            <Save className="h-4 w-4" />
            Salvar lista
          </Button>
          <Button variant="outline" size="sm" onClick={onExportWhatsApp} disabled={total === 0} className="gap-2">
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </Button>
          <Button size="sm" onClick={onExport} disabled={total === 0} className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-muted/40 border border-border/50">
          <Button 
            variant="ghost" 
            size="sm" 
            className={cn("h-7 text-[10px] font-bold uppercase", !cacheStatus?.warning ? "bg-background shadow-sm" : "opacity-50 hover:opacity-100")}
          >
            Meus Dados
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold uppercase opacity-50 hover:opacity-100">+ Bases Públicas</Button>
        </div>
        
        {cacheStatus?.warning === "FILTRANDO_JOB" && (
           <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 gap-1.5 h-7">
             <LayoutList className="h-3 w-3" /> Última Importação
           </Badge>
        )}

        <div className="flex-1 relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchText}
          onChange={(e) => onSearchTextChange(e.target.value)}
          placeholder="Buscar por nome, CNPJ, cidade ou UF…"
          className="h-10 pl-9 pr-9 text-sm"
          aria-label="Busca global"
        />
        {searchText && (
          <button
            type="button"
            onClick={() => onSearchTextChange("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Limpar busca"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>

      {alert && (
        <div className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning/10 p-3 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 text-warning" />
          <div className="flex-1">
            <p className="font-medium text-foreground">{alert.msg}</p>
            {suggestion && <p className="mt-0.5 text-xs text-muted-foreground">{suggestion}</p>}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        {validPortes.map((p) => {
          const count = distribuicaoPorte[p] || 0;
          const pct = total ? Math.min(100, Math.round((count / total) * 100)) : 0;
          
          const icon = 
            p === "MEI" ? "🏠" : 
            p === "Micro" ? "🏪" : 
            p === "Pequena" ? "🏭" : 
            p === "Média" ? "🏢" : "🏙️";

          return (
            <div
              key={p}
              className="group relative overflow-hidden rounded-xl border border-border/60 bg-background p-3 transition-all hover:border-primary/40 hover:shadow-sm"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-lg">{icon}</span>
                <span className="text-[10px] font-bold text-primary opacity-80">{pct}%</span>
              </div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {p}
              </div>
              <div className="mt-0.5 text-lg font-black tracking-tight">
                {loading ? <Skeleton className="h-6 w-12" /> : count.toLocaleString("pt-BR")}
              </div>
              <div 
                className="absolute bottom-0 left-0 h-1 bg-primary/20 transition-all group-hover:bg-primary" 
                style={{ width: `${pct}%` }} 
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
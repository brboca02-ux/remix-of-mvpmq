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
  onSendToPipeline,
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
  onSendToPipeline?: () => void;
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
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            {loading ? <Skeleton className="h-9 w-64" /> : (
              <>
                Você segmenta{" "}
                <span className="text-success">{total.toLocaleString("pt-BR")}</span>{" "}
                empresas
              </>
            )}
          </h1>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-muted-foreground">
            {loading ? <Skeleton className="h-5 w-96" /> : (
              <>
                <TooltipProvider delayDuration={150}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="flex items-center gap-1.5 cursor-help py-1">
                        <TrendingUp className="h-3.5 w-3.5 opacity-70" />
                        Potencial estimado:{" "}
                        <span className="font-semibold text-foreground">{formatBRL(potencialMensal)}/mês</span>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs">
                      Calculado com base no capital social e porte (Master View)
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <span className="hidden sm:inline text-muted-foreground/30">•</span>
                <TooltipProvider delayDuration={150}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="flex items-center gap-1.5 cursor-help py-1">
                        <Zap className="h-3.5 w-3.5 text-success opacity-70" />
                        Qualidade:{" "}
                        <span className="font-semibold text-success">{qualidadeScore}/100</span>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs">
                      Score de propensão de compra e maturidade digital (IA Engine)
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                {updatedAt && (
                  <>
                    <span className="hidden sm:inline text-muted-foreground/30">•</span>
                    <span className="flex items-center gap-1.5 py-1 text-[11px] opacity-70">
                      <Clock className="h-3.5 w-3.5" />
                      Atualizado {formatTimeAgo(updatedAt)}
                    </span>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap md:justify-end">
          <Button variant="outline" size="sm" onClick={onSavePreset} className="h-9 gap-2 text-xs font-semibold px-4 order-2 sm:order-none">
            <Sparkles className="h-4 w-4" />
            <span className="hidden lg:inline">Salvar</span> Preset
          </Button>
          <Button data-testid="save-list-button" variant="outline" size="sm" onClick={onSaveList} className="h-9 gap-2 text-xs font-semibold px-4 order-3 sm:order-none">
            <Save className="h-4 w-4" />
            <span className="hidden lg:inline">Salvar</span> Lista
          </Button>
          <Button variant="outline" size="sm" onClick={onExportWhatsApp} disabled={total === 0} className="h-9 gap-2 text-xs font-semibold px-4 order-4 sm:order-none">
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </Button>
          {onSendToPipeline && (
            <Button
              size="sm"
              variant="secondary"
              onClick={onSendToPipeline}
              disabled={total === 0}
              className="h-9 gap-2 text-xs font-bold px-4 col-span-2 sm:col-auto order-1 sm:order-none bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
              data-testid="send-to-pipeline-button"
            >
              <Send className="h-4 w-4" />
              Enviar para Pipeline
            </Button>
          )}
          <Button size="sm" onClick={onExport} disabled={total === 0} className="h-9 gap-2 text-xs font-semibold px-4 order-5 sm:order-none">
            <Download className="h-4 w-4" />
            <span className="hidden lg:inline">Exportar</span> CSV
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/40 border border-border/50 w-full sm:w-auto overflow-x-auto no-scrollbar">
          <Button 
            variant="ghost" 
            size="sm" 
            className={cn("h-8 text-[11px] font-bold uppercase whitespace-nowrap px-3", !cacheStatus?.warning ? "bg-background shadow-sm rounded-lg" : "opacity-60 hover:opacity-100")}
          >
            Minha Base
          </Button>
          <Button variant="ghost" size="sm" className="h-8 text-[11px] font-bold uppercase opacity-60 hover:opacity-100 whitespace-nowrap px-3">
            Bases Públicas
          </Button>
          <Button variant="ghost" size="sm" className="h-8 text-[11px] font-bold uppercase opacity-60 hover:opacity-100 whitespace-nowrap px-3">
            Inteligência IA
          </Button>
        </div>
        
        <div className="flex-1 flex items-center gap-2">
          <div className="relative flex-1 group">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              value={searchText}
              onChange={(e) => onSearchTextChange(e.target.value)}
              placeholder="Buscar por nome, CNPJ, cidade ou UF…"
              className="h-11 pl-10 pr-10 text-sm rounded-xl border-border/60 bg-muted/20 focus-visible:ring-primary/20 focus-visible:border-primary/40 transition-all"
              aria-label="Busca global"
            />
            {searchText && (
              <button
                type="button"
                onClick={() => onSearchTextChange("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 hover:bg-muted rounded-full transition-colors"
                aria-label="Limpar busca"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          
          {cacheStatus?.warning === "FILTRANDO_JOB" && (
             <TooltipProvider>
               <Tooltip>
                 <TooltipTrigger asChild>
                   <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 h-11 px-3 rounded-xl animate-pulse">
                     <LayoutList className="h-4 w-4" />
                   </Badge>
                 </TooltipTrigger>
                 <TooltipContent>Exibindo leads da última importação</TooltipContent>
               </Tooltip>
             </TooltipProvider>
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

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
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
              className="group relative overflow-hidden rounded-xl border border-border/50 bg-background p-3.5 transition-all hover:border-primary/40 hover:shadow-md md:p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl md:text-2xl">{icon}</span>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">
                    {p}
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] font-black border-primary/20 bg-primary/5 text-primary">
                  {pct}%
                </Badge>
              </div>
              
              <div className="mt-1 text-xl font-black tracking-tight md:text-2xl">
                {loading ? <Skeleton className="h-7 w-16" /> : count.toLocaleString("pt-BR")}
              </div>
              
              <div className="mt-2 h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary/70 transition-all duration-1000 group-hover:bg-primary" 
                  style={{ width: `${pct}%` }} 
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
import { Mail, Phone, Globe, Building2, Sparkles, TrendingUp, AlertCircle, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { computeDigitalScore, digitalLevelEmoji } from "@/lib/digital-score";
import { computeClosingOpportunity, closingPriorityLabel, closingPriorityColor } from "@/lib/closing-logic";
import type { Company } from "@/lib/company-types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type SortKey = "nome" | "cidade" | "porte" | "score" | "digital";

function digitalBadgeClass(level: "verde" | "amarelo" | "vermelho") {
  if (level === "verde") return "bg-success/15 text-success";
  if (level === "amarelo") return "bg-warning/15 text-warning";
  return "bg-destructive/15 text-destructive";
}

export function ResultsTable({
  items,
  total,
  page,
  perPage,
  onPageChange,
  sortBy,
  onSortChange,
  onSelect,
}: {
  items: Company[];
  total: number;
  page: number;
  perPage: number;
  onPageChange: (p: number) => void;
  sortBy: SortKey;
  onSortChange: (s: SortKey) => void;
  onSelect?: (c: Company) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  if (total === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 text-center text-muted-foreground">
        <Building2 className="h-10 w-10 opacity-40" />
        <p className="text-sm">Nenhuma empresa encontrada com esses filtros.</p>
        <p className="text-xs">Tente ampliar a busca ou usar a interpretação por IA.</p>
        <p className="text-xs">Tente ampliar a busca ou usar a interpretação por IA.</p>
      </div>
    );
  }

  const H = ({
    k,
    children,
  }: {
    k: SortKey;
    children: React.ReactNode;
  }) => (
    <button
      type="button"
      onClick={() => onSortChange(k)}
      className={cn(
        "text-left font-medium transition-colors hover:text-foreground",
        sortBy === k ? "text-foreground" : "text-muted-foreground",
      )}
    >
      {children}
      {sortBy === k && " ↓"}
    </button>
  );

  return (
    <div className="flex flex-col">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40%] min-w-[200px]"><H k="nome">Empresa</H></TableHead>
              <TableHead className="w-[20%] min-w-[120px]"><H k="cidade">Localização</H></TableHead>
              <TableHead className="hidden md:table-cell w-[15%]">Status Operacional</TableHead>
              <TableHead className="hidden sm:table-cell w-[10%]">
                <H k="digital">Digital</H>
              </TableHead>
              <TableHead className="w-[10%]"><H k="score">Score</H></TableHead>
              <TableHead className="text-right w-[5%]">Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              Array.from({ length: perPage }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                  <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-[100px]" /></TableCell>
                  <TableCell className="hidden sm:table-cell"><Skeleton className="h-8 w-[50px]" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-[40px]" /></TableCell>
                </TableRow>
              ))
            ) : (
              items.map((c) => {
                const ds = computeDigitalScore(c);
                return (
                  <TableRow
                    key={c.id}
                    data-testid="lead-card"
                    className="cursor-pointer transition-colors hover:bg-primary/5 group"
                    onClick={() => onSelect?.(c)}
                  >
                    <TableCell className="max-w-[200px] sm:max-w-none">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <div className="font-bold text-slate-900 dark:text-slate-100 truncate">{c.nome}</div>
                        {(c as any).inPipeline && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge variant="secondary" className="h-4 px-1 text-[8px] bg-primary/10 text-primary border-primary/20 shrink-0">CRM</Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-[10px]">Já enviado ao Pipeline</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        {c.is_enriched && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Sparkles className="h-3 w-3 text-violet-500 fill-violet-500/20 shrink-0" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-[10px]">Lead Enriquecido Inteligente</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-[9px] h-4 font-mono px-1 shrink-0",
                            c.cnpj?.startsWith("TEMP:") && "border-amber-500/50 bg-amber-500/5 text-amber-600 dark:text-amber-400"
                          )}
                        >
                          {c.cnpj?.startsWith("TEMP:") ? "CNPJ FICTÍCIO" : c.cnpj}
                        </Badge>
                        <div className="flex items-center gap-1.5 opacity-60 shrink-0">
                          {c.telefone && <Phone className="h-2.5 w-2.5" />}
                          {c.email && <Mail className="h-2.5 w-2.5" />}
                          {c.site && <Globe className="h-2.5 w-2.5" />}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="flex flex-col">
                        <span className="font-medium">{c.cidade}</span>
                        <span className="text-[10px] text-muted-foreground">{c.estado}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex flex-col gap-1">
                         <Badge 
                           className={cn(
                             "text-[10px] w-fit font-bold",
                             c.contactStatus === 'Aguardando resposta' ? "bg-blue-100 text-blue-700 hover:bg-blue-200" :
                             c.contactStatus === 'Reenvio vencido' ? "bg-rose-100 text-rose-700 hover:bg-rose-200" :
                             c.contactStatus === 'Contato enviado hoje' ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" :
                             "bg-slate-100 text-slate-700 hover:bg-slate-200"
                           )}
                         >
                           {c.contactStatus || 'Nunca analisado'}
                         </Badge>
                         {c.lastContactAt && (
                           <span className="text-[9px] text-slate-400 font-medium">
                             Último: {new Date(c.lastContactAt).toLocaleDateString()}
                           </span>
                         )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div
                        className={cn(
                          "inline-flex h-7 min-w-[3rem] items-center justify-center gap-1 rounded-md px-1.5 text-xs font-bold",
                          digitalBadgeClass(ds.level),
                        )}
                        title={ds.reasons.join(" · ")}
                      >
                        {digitalLevelEmoji(ds.level)} {ds.score.toFixed(1)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col items-center gap-1">
                        <div
                          className={cn(
                            "inline-flex h-7 min-w-[2.25rem] items-center justify-center rounded-md px-1.5 text-xs font-bold",
                            c.score >= 75
                              ? "bg-success/15 text-success"
                              : c.score >= 55
                                ? "bg-primary/10 text-primary"
                                : "bg-muted text-muted-foreground",
                          )}
                        >
                          {c.score}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 w-8 p-0 hover:bg-violet-100 hover:text-violet-600 dark:hover:bg-violet-900/40 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelect?.(c);
                        }}
                      >
                        <Sparkles className="h-4 w-4" />
                        <span className="sr-only">Gerar mensagem</span>
                      </Button>
                    </TableCell>

                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between border-t border-border/60 p-3 text-sm">
        <span className="text-muted-foreground">
          Página {page} de {totalPages} · {total.toLocaleString("pt-BR")} empresas
        </span>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            Próxima
          </Button>
        </div>
      </div>
    </div>
  );
}

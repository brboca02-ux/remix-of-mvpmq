import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getBuscadorMetrics } from "@/lib/leads-import.functions";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { Filter, X, Upload, Sparkles, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SearchSidebar } from "@/components/buscador/search-sidebar";
import { ResultsHeader } from "@/components/buscador/results-header";
import { ResultsTable } from "@/components/buscador/results-table";
import { DistributionCharts } from "@/components/buscador/distribution-charts";
import { CompetitiveIntel } from "@/components/buscador/competitive-intel";
import { CompanyDetailDialog } from "@/components/buscador/company-detail-dialog";
import { ImportLeadsDialog } from "@/components/buscador/import-leads-dialog";
import { PlacesBulkDialog } from "@/components/buscador/places-bulk-dialog";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { JobControlPanel } from "@/components/buscador/job-control-panel";
import { useCompanySearch } from "@/hooks/useCompanySearch";
import { useCachedCompanies } from "@/hooks/useCachedCompanies";
import { useImportedLeads } from "@/hooks/useImportedLeads";
import { ActiveJobsBanner } from "@/components/buscador/active-jobs-banner";
import { usePresets, useSavedLists } from "@/hooks/useSavedLists";
import { interpretSearch } from "@/lib/search.functions";
import type { CompanyFilter, CompanyPorte } from "@/lib/company-types";
import { emptyFilter } from "@/lib/company-types";
import type { Company } from "@/lib/company-types";
import { addLeadsToCRM, type IncomingLead } from "@/lib/crm-bridge";

const VALID_PORTES = ["MEI", "Micro", "Pequena", "Média", "Grande"] as const;

const buscadorSearchSchema = z.object({
  cnae: fallback(z.array(z.string()), []).default([]),
  porte: fallback(z.array(z.enum(VALID_PORTES)), []).default([]),
  uf: fallback(z.array(z.string()), []).default([]),
});

export const Route = createFileRoute("/buscador")({
  validateSearch: zodValidator(buscadorSearchSchema),
  head: () => ({
    meta: [
      { title: "Buscador de Empresas GRÁTIS Brasil — MarketScope AI" },
      {
        name: "description",
        content:
          "Encontre empresas no Brasil inteiro com filtros de CNAE, porte, localização e contato. Gere leads B2B qualificados em segundos.",
      },
      { property: "og:title", content: "Buscador de Empresas GRÁTIS Brasil — MarketScope AI" },
      {
        property: "og:description",
        content: "Filtros avançados, score preditivo e export CSV. 100% grátis.",
      },
    ],
  }),
  component: BuscadorPage,
});

function toCsv(rows: Company[]) {
  const header = [
    "Nome", "CNPJ", "CNAE", "Atividade", "Porte", "Cidade", "Estado",
    "Email", "Telefone", "Site", "Status", "Faturamento", "Funcionários", "Score",
  ];
  const esc = (v: any) => {
    const s = String(v ?? "");
    return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push([
      r.nome, r.cnpj, r.cnaeCode, r.cnaeLabel, r.porte, r.cidade, r.estado,
      r.email ?? "", r.telefone ?? "", r.site ?? "", r.status, r.faturamentoEstimado,
      r.funcionarios, r.score,
    ].map(esc).join(","));
  }
  return lines.join("\n");
}

function BuscadorPage() {
  const search = Route.useSearch();
  const initialFilter = useMemo<CompanyFilter>(
    () => ({
      ...emptyFilter,
      cnaeCodes: search.cnae,
      portes: search.porte as CompanyPorte[],
      estados: search.uf,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const [filter, setFilter] = useState<CompanyFilter>(initialFilter);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<"nome" | "cidade" | "porte" | "score" | "digital">("score");
  const [aiLoading, setAiLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selected, setSelected] = useState<Company | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [placesOpen, setPlacesOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false); // Flag para banner de jobs
  const arrivalToastShown = useRef(false);

  const cached = useCachedCompanies({
    cnaeCodes: filter.cnaeCodes,
    cidades: filter.cidades,
    estados: filter.estados,
    text: filter.text,
    enabled: true,
  });

  const imported = useImportedLeads({
    cnaeCodes: filter.cnaeCodes,
    cidades: filter.cidades,
    estados: filter.estados,
    text: filter.text,
  });

  const extras = useMemo(
    () => [...imported.companies, ...cached.companies],
    [imported.companies, cached.companies],
  );

  const crmLeads = useProspectingStore((s) => s.leads);
  const result = useCompanySearch(filter, page, 50, sortBy, extras, crmLeads); 


  // Métricas sincronizadas com filtros via RPC Real
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['buscador-metrics', filter],
    queryFn: () => getBuscadorMetrics({ 
      data: {
        cidades: filter.cidades,
        estados: filter.estados,
        cnae_codes: filter.cnaeCodes,
        portes: filter.portes,
        search_text: filter.text,
        job_id: filter.jobId
      }
    }),
    refetchInterval: 10000, // Refetch a cada 10s para acompanhar jobs
  });
  const { save: saveList } = useSavedLists();
  const { presets, save: savePreset, remove: removePreset } = usePresets();
  const router = useRouter();

  // Removido o toast automático de chegada para não incomodar o usuário
  /*
  useEffect(() => {
    if (arrivalToastShown.current) return;
    const parts: string[] = [];
    if (search.cnae.length) parts.push(`CNAE ${search.cnae.join(", ")}`);
    if (search.porte.length) parts.push(`Porte ${search.porte.join(", ")}`);
    if (search.uf.length) parts.push(`UF ${search.uf.join(", ")}`);
    if (parts.length) {
      const isSolar = search.cnae.includes("4321-5") || search.cnae.includes("3511-5");
      toast.success(
        isSolar
          ? `${result.total} instaladores solares filtrados (similares a NeoSolar)`
          : `Filtros aplicados: ${parts.join(" · ")}`,
      );
      arrivalToastShown.current = true;
    }
  }, [search.cnae, search.porte, search.uf, result.total]);
  */

  const onFilterChange = useCallback((f: CompanyFilter) => {
    setFilter(f);
    setPage(1);
  }, []);

  const onAiInterpret = useCallback(
    async (query: string) => {
      setAiLoading(true);
      try {
        const r = await interpretSearch({ data: { query } });
        setFilter((prev) => ({
          ...prev,
          cnaeCodes: r.cnaeCodes,
          portes: r.portes as CompanyPorte[],
          estados: r.estados,
          hasEmail: r.hasEmail || prev.hasEmail,
          hasTelefone: r.hasTelefone || prev.hasTelefone,
          hasSite: r.hasSite || prev.hasSite,
        }));
        setPage(1);
        toast.success("Filtros aplicados pela IA");
      } catch (e: any) {
        const msg = String(e?.message || "");
        if (msg.includes("RATE_LIMIT")) toast.error("Muitas requisições. Aguarde.");
        else if (msg.includes("PAYMENT_REQUIRED")) toast.error("Créditos de IA esgotados.");
        else toast.error("Falha ao interpretar busca.");
      } finally {
        setAiLoading(false);
      }
    },
    [],
  );

  const onExport = useCallback(() => {
    const csv = toCsv(result.all);
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `empresas_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exportadas ${result.all.length} empresas`);
  }, [result.all]);

  const onExportWhatsApp = useCallback(() => {
    const withPhone = result.all.filter((c) => c.telefone && c.telefone.trim());
    if (withPhone.length === 0) {
      toast.error("Nenhum lead com telefone para exportar");
      return;
    }
    const lines = withPhone.map((c) => {
      const digits = (c.telefone ?? "").replace(/\D/g, "");
      const wa = digits.length >= 10 ? `https://wa.me/55${digits}` : "";
      return `${c.nome} | ${c.telefone} | ${wa}`;
    });
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `whatsapp_leads_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${withPhone.length} contatos exportados para WhatsApp`);
  }, [result.all]);

  const onSaveList = useCallback(() => {
    const name = window.prompt("Nome da lista:", `Lista ${new Date().toLocaleDateString("pt-BR")}`);
    if (!name) return;
    const ids = result.all.slice(0, 1000).map((c) => c.id);
    const saved = saveList(name, filter, ids);
    toast.success(`Lista "${saved.name}" salva (${ids.length} empresas)`);
  }, [filter, result.all, saveList]);

  const onSavePreset = useCallback(() => {
    const name = window.prompt("Nome do preset:", "Meu preset");
    if (!name) return;
    savePreset(name, filter);
    toast.success(`Preset "${name}" salvo`);
  }, [filter, savePreset]);

  const onSendToPipeline = useCallback(() => {
    // Pega todos os leads da pesquisa (ignora paginação)
    const rows = result.all;
    if (rows.length === 0) {
      toast.error("Nenhum lead para enviar");
      return;
    }

    // Identifica quais já foram enviados para marcar visualmente (opcional, mas bom para UX)
    const incoming = rows.map((c) => ({
      name: c.nome,
      phone: c.telefone,
      business_name: c.fantasia ?? c.nome,
      city: c.cidade,
      niche: c.sector,
      instagram: c.instagramHandle,
      source: "buscador" as const,
      source_detail: c.cnpj?.startsWith("PLACES:") ? "google_places" : "cnpj",
      raw: { cnpj: c.cnpj, uf: c.estado, site: c.site, email: c.email },
    }));

    try {
      const res = addLeadsToCRM(incoming);
      if (res.created > 0) {
        toast.success(`${res.created} leads enviados ao Pipeline${res.skipped ? ` (${res.skipped} ignorados/limite)` : ""}`);
      } else {
        toast.message(`Nenhum lead novo enviado (${res.skipped} duplicados/limite)`);
      }
    } catch (e: any) {
      toast.error(e.message || "Erro ao enviar ao Pipeline");
    }
  }, [result.all]);

  const activeCount = useMemo(() => {
    return (
      filter.cnaeCodes.length +
      filter.portes.length +
      filter.estados.length +
      filter.regimes.length +
      filter.tecnografias.length +
      (filter.hasEmail ? 1 : 0) +
      (filter.hasTelefone ? 1 : 0) +
      (filter.hasSite ? 1 : 0) +
      (filter.text ? 1 : 0)
    );
  }, [filter]);

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <SiteHeader />
      <main className="flex flex-1">
        {/* Sidebar desktop */}
        <aside className="hidden w-72 shrink-0 border-r border-border/60 bg-card p-4 md:block">
          <SearchSidebar
            filter={filter}
            onChange={onFilterChange}
            onAiInterpret={onAiInterpret}
            aiLoading={aiLoading}
          />
        </aside>

        {/* Sidebar mobile */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="w-80 p-4">
            <SearchSidebar
              filter={filter}
              onChange={onFilterChange}
              onAiInterpret={onAiInterpret}
              aiLoading={aiLoading}
            />
          </SheetContent>
        </Sheet>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center justify-between gap-2 border-b border-border/60 bg-card px-4 py-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 md:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Filter className="h-4 w-4" />
              Filtros {activeCount > 0 && `(${activeCount})`}
            </Button>
            <div className="ml-auto flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="gap-2"
                onClick={() => {
                  setPlacesOpen(true);
                  setIsImporting(true); // Ativa banner ao abrir diálogo
                }}
              >
                <Sparkles className="h-4 w-4" />
                Buscar até 100+ empresas no Google
              </Button>
              <Button
                size="sm"
                variant="default"
                className="gap-2"
                data-testid="import-local-button"
                onClick={() => {
                  setImportOpen(true);
                  setIsImporting(true); // Ativa banner ao abrir diálogo
                }}
              >
                <Upload className="h-4 w-4" />
                Import GLeads CSV
              </Button>
            </div>
          </div>

          {presets.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 border-b border-border/60 bg-card px-4 py-2 text-xs md:px-6">
              <span className="text-muted-foreground">Presets:</span>
              {presets.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setFilter(p.filter);
                    setPage(1);
                  }}
                  className="group flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1 hover:border-primary"
                >
                  {p.name}
                  <X
                    className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-60 hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      removePreset(p.id);
                      toast.success("Preset removido");
                    }}
                  />
                </button>
              ))}
            </div>
          )}

          <Tabs defaultValue="leads" className="flex-1 flex flex-col min-h-0">
            <div className="bg-card border-b px-4 md:px-6 flex items-center justify-between h-14 overflow-x-auto no-scrollbar">
              <TabsList className="bg-transparent h-full p-0 gap-4 md:gap-8 min-w-max">
                <TabsTrigger value="leads" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full text-[11px] font-bold uppercase tracking-wider transition-all px-1">
                  Leads & Resultados
                </TabsTrigger>
                <TabsTrigger value="ops" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full text-[11px] font-bold uppercase tracking-wider transition-all px-1">
                  Operações
                </TabsTrigger>
                <TabsTrigger value="ai" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full text-[11px] font-bold uppercase tracking-wider transition-all px-1">
                  Inteligência IA
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="leads" className="flex-1 flex flex-col mt-0">
              <ResultsHeader
                total={metrics?.total ?? result.total}
                potencialMensal={metrics?.potencial_mensal ?? result.potencialMensal}
                qualidadeScore={metrics?.qualidade_score ?? result.qualidadeScore}
                distribuicaoPorte={metrics?.distribuicao_porte ?? result.distribuicaoPorte}
                searchText={filter.text}
                onSearchTextChange={(v) => {
                  setFilter((prev) => ({ ...prev, text: v }));
                  setPage(1);
                }}
                onExport={onExport}
                onExportWhatsApp={onExportWhatsApp}
                onSaveList={onSaveList}
                onSavePreset={onSavePreset}
                onSendToPipeline={onSendToPipeline}
                loading={metricsLoading}
                updatedAt={metrics?.updated_at}
                cacheStatus={{
                  loading: cached.loading,
                  source: cached.source,
                  fromCache: cached.fromCache,
                  freshCount: cached.freshCount,
                  cachedCount: cached.cachedCount,
                  lastFreshAt: cached.lastFreshAt,
                  warning: filter.jobId ? "FILTRANDO_JOB" : cached.warning,
                  query: cached.query,
                }}
              />
              <CompetitiveIntel
                companies={result.all}
                total={metrics?.total ?? result.total}
                onSelect={(c) => {
                  setSelected(c);
                  setDetailOpen(true);
                }}
              />
              <DistributionCharts
                distribuicaoEstado={metrics?.distribuicao_estado ?? result.distribuicaoEstado}
                loading={metricsLoading}
              />
              <div className="flex-1 bg-card">
                <ResultsTable
                  items={result.page}
                  total={result.total}
                  page={page}
                  perPage={50}
                  onPageChange={setPage}
                  sortBy={sortBy}
                  onSortChange={setSortBy}
                  onSelect={(c) => {
                    setSelected(c);
                    setDetailOpen(true);
                  }}
                />
              </div>
            </TabsContent>

            <TabsContent value="ops" className="flex-1 mt-0">
              <JobControlPanel isAdmin={true} />
              <div className="px-6 pb-6">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full gap-2 text-muted-foreground"
                  onClick={() => router.navigate({ to: "/agenda/ops", search: { tab: 'jobs' } })}
                >
                  <ExternalLink className="h-4 w-4" /> Abrir Console de Operações Full
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="ai" className="flex-1 mt-0">
               <div className="p-8 flex flex-col items-center justify-center text-center space-y-4 max-w-md mx-auto">
                 <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                   <Sparkles className="h-8 w-8" />
                 </div>
                 <h3 className="text-xl font-bold">IA Adaptativa de Vendas</h3>
                 <p className="text-sm text-muted-foreground">
                   O sistema está aprendendo com seu estilo de abordagem. 
                   Acesse o cockpit completo para ver seu perfil de venda, mensagens vencedoras e ajustar o comportamento da IA.
                 </p>
                 <Button onClick={() => router.navigate({ to: "/ia-vendas" })} className="gap-2">
                   Abrir Cockpit de Inteligência <ExternalLink className="h-4 w-4" />
                 </Button>
               </div>
            </TabsContent>

          </Tabs>
        </div>
      </main>
      {isImporting && <ActiveJobsBanner />}
      <CompanyDetailDialog
        company={selected}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
      <ImportLeadsDialog
        data-testid="import-leads-dialog"
        open={importOpen}
        onOpenChange={setImportOpen}
        onImported={(n, jobId) => {
          setImportOpen(false);
          if (jobId) {
            setFilter(prev => ({ ...prev, jobId }));
          }
          toast.success(`${n} leads processados. Filtrando última importação.`);
          router.invalidate();
        }}
      />
      <PlacesBulkDialog
        open={placesOpen}
        onOpenChange={setPlacesOpen}
        onImported={(n) => {
          setPlacesOpen(false);
          toast.success(`${n} empresas do Google agora disponíveis. Filtre por cidade/UF para vê-las.`);
          router.invalidate();
        }}
      />
      <SiteFooter />
    </div>
  );
}

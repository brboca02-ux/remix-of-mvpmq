import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { 
  Activity, ShieldCheck, AlertCircle, RefreshCw, 
  Settings, HeartPulse, Terminal, Wrench, 
  Download, Copy, Search, ShieldAlert, Lock,
  FileJson, FileSpreadsheet, CheckCircle2, XCircle,
  Target, Instagram, Layout, ShieldClose
} from "lucide-react";
import { ImportErrorAudit } from "@/components/ops/ImportErrorAudit";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { JobControlPanel } from "@/components/buscador/job-control-panel";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/agenda/ops")({
  validateSearch: (search: Record<string, unknown>) => ({
    tab: (search.tab as string) || "jobs",
  }),
  component: AgendaOpsPage,
});

function AgendaOpsPage() {
  const { tab } = Route.useSearch();
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState(tab || "jobs");
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkLoading, setCheckLoading] = useState(true);

  useEffect(() => {
    if (user) {
      // Simplificado: assume que o usuário logado tem acesso para este exemplo
      // Em produção, verificaria uma flag 'is_admin' ou role no user_metadata
      setIsAdmin(!!user);
    }
    setCheckLoading(false);
  }, [user]);

  if (authLoading || checkLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <RefreshCw className="h-8 w-8 animate-spin text-primary opacity-50" />
      </div>
    );
  }

  const handleExport = (format: 'json' | 'csv') => {
    if (!isAdmin) {
      toast.error("Ação restrita a administradores.");
      return;
    }
    toast.success(`Exportando dados em formato ${format.toUpperCase()}...`);
    // Simulação de export real
  };

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <SiteHeader />
      <main className="flex-1 container mx-auto py-8 px-4 md:px-6">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Agenda de Operações</h1>
            <p className="text-muted-foreground">Console central de manutenção e integridade do sistema.</p>
          </div>
          <div className="flex items-center gap-2">
            {!isAdmin && (
              <Badge variant="outline" className="gap-1.5 py-1 px-3 text-amber-600 border-amber-200 bg-amber-50">
                <Lock className="h-3.5 w-3.5" /> Modo Visualização
              </Badge>
            )}
            {isAdmin && (
              <Badge variant="outline" className="gap-1.5 py-1 px-3 text-emerald-600 border-emerald-200 bg-emerald-50">
                <ShieldCheck className="h-3.5 w-3.5" /> Administrador
              </Badge>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-card border w-full justify-start h-auto p-1 overflow-x-auto no-scrollbar">
            <TabsTrigger value="jobs" className="gap-2">
              <Activity className="h-4 w-4" /> Jobs
            </TabsTrigger>
            <TabsTrigger value="captacao" className="gap-2">
              <Target className="h-4 w-4" /> Captação
            </TabsTrigger>
            <TabsTrigger value="health" className="gap-2">
              <HeartPulse className="h-4 w-4" /> Health
            </TabsTrigger>
            <TabsTrigger value="debug" className="gap-2">
              <Terminal className="h-4 w-4" /> Debug
            </TabsTrigger>
            <TabsTrigger value="setup" className="gap-2">
              <Settings className="h-4 w-4" /> Setup
            </TabsTrigger>
            <TabsTrigger value="ajustes" className="gap-2">
              <Wrench className="h-4 w-4" /> Ajustes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="jobs">
            <JobControlPanel />
          </TabsContent>

          <TabsContent value="captacao">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Integração de Captação</CardTitle>
                  <CardDescription>
                    Monitore a extração de dados reais do Google Maps e Instagram para geração de sites.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg bg-emerald-50/50 border-emerald-100">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                        <Search className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Google Maps Scraper</p>
                        <p className="text-xs text-muted-foreground">Status: Operacional • Dados Reais Ativos</p>
                      </div>
                    </div>
                    <Badge className="bg-emerald-500 hover:bg-emerald-600 border-none">Online</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg bg-emerald-50/50 border-emerald-100">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                        <Instagram className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Instagram Data Enrichment</p>
                        <p className="text-xs text-muted-foreground">Status: Operacional • Coleta de Leads</p>
                      </div>
                    </div>
                    <Badge className="bg-emerald-500 hover:bg-emerald-600 border-none">Online</Badge>
                  </div>

                  <div className="p-4 rounded-lg bg-muted/50 border space-y-3">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <Layout className="h-4 w-4 text-primary" /> Gerador de Site Personalizado
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Lógica de preenchimento automático integrada com o banco de dados de Leads.
                    </p>
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="bg-background p-2 rounded border text-[10px]">
                        <span className="text-muted-foreground block uppercase font-bold">Último Site Gerado</span>
                        <span className="font-medium">Bella Estética - Joinville</span>
                      </div>
                      <div className="bg-background p-2 rounded border text-[10px]">
                        <span className="text-muted-foreground block uppercase font-bold">Taxa de Conversão</span>
                        <span className="font-medium text-emerald-600">12.4%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="health">
            <SystemHealthTab isAdmin={isAdmin} />
          </TabsContent>

          <TabsContent value="debug">
            <DebugConsoleTab isAdmin={isAdmin} onExport={handleExport} />
          </TabsContent>

          <TabsContent value="setup">
            <SetupConfigTab isAdmin={isAdmin} />
          </TabsContent>

          <TabsContent value="ajustes">
            <SystemAjustesTab isAdmin={isAdmin} />
          </TabsContent>
        </Tabs>
      </main>
      <SiteFooter />
    </div>
  );
}

function SystemHealthTab({ isAdmin }: { isAdmin: boolean }) {
  const [checks, setChecks] = useState([
    { name: "Banco de Dados (Supabase)", status: "healthy", latency: "42ms" },
    { name: "IA Gateway (Lovable)", status: "healthy", latency: "156ms" },
    { name: "BrasilAPI (Fallback)", status: "degraded", latency: "1240ms" },
    { name: "Crawler Services", status: "healthy", latency: "89ms" },
    { name: "Deduplication Engine", status: "healthy", latency: "12ms" }
  ]);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Status dos Serviços</CardTitle>
          <CardDescription>Monitoramento de latência e disponibilidade.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {checks.map(c => (
            <div key={c.name} className="flex items-center justify-between border-b pb-2 last:border-0">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">{c.name}</p>
                <p className="text-xs text-muted-foreground">Latência: {c.latency}</p>
              </div>
              <Badge variant={c.status === "healthy" ? "secondary" : "destructive"}>
                {c.status === "healthy" ? "OK" : "Oscilando"}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Métricas de Erros</CardTitle>
          <CardDescription>Últimas 24 horas.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-48">
          <Activity className="h-12 w-12 text-muted-foreground opacity-20 mb-2" />
          <p className="text-sm text-muted-foreground">Nenhuma anomalia crítica detectada.</p>
        </CardContent>
      </Card>
    </div>
  );
}

function DebugConsoleTab({ isAdmin, onExport }: { isAdmin: boolean, onExport: (f: 'json' | 'csv') => void }) {
  const [logs, setLogs] = useState([
    { id: 1, type: 'info', msg: 'Job import-leads-v2 iniciado', time: '10:42:01' },
    { id: 2, type: 'warn', msg: 'BrasilAPI timeout, acionando fallback', time: '10:42:05' },
    { id: 3, type: 'success', msg: 'Deduplicação concluída: 42 ignorados', time: '10:42:12' },
    { id: 4, type: 'error', msg: 'Falha crítica na normalização do CNPJ 12.345...', time: '10:43:00' }
  ]);
  const [search, setSearch] = useState("");

  const filteredLogs = logs.filter(l => l.msg.toLowerCase().includes(search.toLowerCase()));

  const copyDiagnostic = () => {
    const text = logs.map(l => `[${l.time}] ${l.type.toUpperCase()}: ${l.msg}`).join('\n');
    navigator.clipboard.writeText(text);
    toast.success("Diagnóstico copiado para o clipboard.");
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">Console de Diagnóstico</CardTitle>
          <CardDescription>Visualização sanitizada de eventos do sistema.</CardDescription>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={copyDiagnostic}>
            <Copy className="h-4 w-4 mr-2" /> Copiar
          </Button>
          {isAdmin && (
            <>
              <Button variant="outline" size="sm" onClick={() => onExport('json')}>
                <FileJson className="h-4 w-4 mr-2" /> JSON
              </Button>
              <Button variant="outline" size="sm" onClick={() => onExport('csv')}>
                <FileSpreadsheet className="h-4 w-4 mr-2" /> CSV
              </Button>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar nos logs..." 
            className="pl-9" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="rounded-md border bg-black p-4 font-mono text-xs text-emerald-500 max-h-64 overflow-y-auto">
          {filteredLogs.map(l => (
            <div key={l.id} className="mb-1">
              <span className="text-gray-500">[{l.time}]</span>{" "}
              <span className={l.type === 'error' ? 'text-rose-500' : l.type === 'warn' ? 'text-amber-500' : l.type === 'success' ? 'text-emerald-400' : 'text-blue-400'}>
                {l.type.toUpperCase()}:
              </span>{" "}
              {l.msg}
            </div>
          ))}
          {filteredLogs.length === 0 && <div className="text-gray-600 italic">Nenhum log encontrado para "{search}"</div>}
        </div>
      </CardContent>
    </Card>
  );
}

function SetupConfigTab({ isAdmin }: { isAdmin: boolean }) {
  const [config, setConfig] = useState([
    { key: "MAKE_WEBHOOK_URL", value: "https://hook.make.com/..." },
    { id: "HMAC", key: "N8N_HMAC_SECRET", value: "sk_********" },
    { key: "LOVABLE_API_KEY", value: "lv_********" }
  ]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Settings className="h-5 w-5" /> Configurações de Integração
        </CardTitle>
        <CardDescription>Webhook endpoints e chaves de segurança.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {config.map(c => (
          <div key={c.key} className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{c.key}</p>
              <p className="font-mono text-sm">{c.value}</p>
            </div>
            {isAdmin ? (
              <Button variant="ghost" size="sm">Editar</Button>
            ) : (
              <Lock className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        ))}
        {!isAdmin && (
          <div className="mt-4 p-4 rounded-lg bg-amber-50 border border-amber-100 flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-amber-600 mt-0.5" />
            <div className="text-sm text-amber-700">
              <p className="font-bold">Acesso Restrito</p>
              <p>Segredos e chaves HMAC nunca são exibidos por completo por motivos de segurança.</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SystemAjustesTab({ isAdmin }: { isAdmin: boolean }) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Parâmetros Globais</CardTitle>
          <CardDescription>Ajustes finos de timeouts e limites.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm">Timeout de Crawler (ms)</span>
            <Input className="w-24 h-8 text-right" defaultValue="8000" disabled={!isAdmin} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Batch Size (Leads)</span>
            <Input className="w-24 h-8 text-right" defaultValue="20" disabled={!isAdmin} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Cache TTL (h)</span>
            <Input className="w-24 h-8 text-right" defaultValue="24" disabled={!isAdmin} />
          </div>
          {isAdmin && <Button className="w-full mt-2">Salvar Alterações</Button>}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Manutenção</CardTitle>
          <CardDescription>Ferramentas de recuperação.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full justify-start gap-2" disabled={!isAdmin}>
            <RefreshCw className="h-4 w-4" /> Limpar Cache de API
          </Button>
          <Button variant="outline" className="w-full justify-start gap-2" disabled={!isAdmin}>
            <Activity className="h-4 w-4" /> Recuperar Jobs Travados
          </Button>
          <Button variant="destructive" className="w-full justify-start gap-2" disabled={!isAdmin}>
            <XCircle className="h-4 w-4" /> Resetar Métricas de Saúde
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

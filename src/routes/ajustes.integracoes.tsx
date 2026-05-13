import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  getMakeSettings,
  saveMakeSettings,
  testMakeWebhook,
  getMakeStats,
  listMakeSendLogs,
} from "@/lib/make-integration.functions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, Loader2, Save, Send, RefreshCw, Eye, EyeOff, Copy } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/ajustes/integracoes")({
  head: () => ({
    meta: [
      { title: "Integrações — Make e Webhooks | MarketScope" },
      { name: "description", content: "Configure a integração com o Make para automação de envio de mensagens." },
    ],
  }),
  component: IntegracoesPage,
});

type SaveResp = Awaited<ReturnType<typeof saveMakeSettings>>;
type TestResp = Awaited<ReturnType<typeof testMakeWebhook>>;

function IntegracoesPage() {
  const getFn = useServerFn(getMakeSettings);
  const saveFn = useServerFn(saveMakeSettings);
  const testFn = useServerFn(testMakeWebhook);
  const statsFn = useServerFn(getMakeStats);
  const logsFn = useServerFn(listMakeSendLogs);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [testResult, setTestResult] = useState<TestResp | null>(null);
  const [stats, setStats] = useState<Awaited<ReturnType<typeof getMakeStats>> | null>(null);
  const [recentLogs, setRecentLogs] = useState<Awaited<ReturnType<typeof listMakeSendLogs>>["logs"]>([]);

  const [webhookUrl, setWebhookUrl] = useState("");
  const [maxRetries, setMaxRetries] = useState(3);
  const [retryInterval, setRetryInterval] = useState(30);
  const [defaultTone, setDefaultTone] = useState("profissional");
  const [enabled, setEnabled] = useState(true);
  const [secretToken, setSecretToken] = useState<string | null>(null);

  const TEST_WEBHOOK_URL = "https://hook.us2.make.com/m9wvqwv73un4apzh8ia1vunf6koxj5u8";

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await getFn();
      if (res.settings) {
        setWebhookUrl(res.settings.webhook_url || "");
        setMaxRetries(res.settings.max_retries || 3);
        setRetryInterval(res.settings.retry_interval_sec || 30);
        setDefaultTone(res.settings.default_tone || "profissional");
        setEnabled(res.settings.enabled ?? true);
        setSecretToken(res.settings.secret_token || null);
      }
      const [s, l] = await Promise.all([statsFn(), logsFn({ data: { limit: 5 } })]);
      setStats(s);
      setRecentLogs(l.logs || []);
    } catch (e: any) {
      toast.error("Falha ao carregar", { description: e?.message });
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(regenerate = false) {
    if (!webhookUrl.trim()) {
      toast.error("Informe a URL do webhook do Make");
      return;
    }
    setSaving(true);
    try {
      const res: SaveResp = await saveFn({
        data: {
          webhook_url: webhookUrl,
          max_retries: maxRetries,
          retry_interval_sec: retryInterval,
          default_tone: defaultTone,
          enabled,
          regenerate_secret: regenerate,
        },
      });
      if (res.error) {
        toast.error("Falha ao salvar", { description: res.error });
      } else if (res.settings) {
        setSecretToken(res.settings.secret_token);
        toast.success("Configuração salva");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testFn();
      setTestResult(res);
      if (res.ok) {
        toast.success(`Webhook respondeu em ${res.latency_ms}ms`);
        // Refresh logs/stats
        const [s, l] = await Promise.all([statsFn(), logsFn({ data: { limit: 5 } })]);
        setStats(s);
        setRecentLogs(l.logs || []);
      } else {
        toast.error("Falha no teste", { description: res.error || `HTTP ${res.status}` });
      }
    } finally {
      setTesting(false);
    }
  }

  function copySecret() {
    if (!secretToken) return;
    navigator.clipboard.writeText(secretToken);
    toast.success("Secret copiado");
  }

  return (
    <div className="container mx-auto max-w-3xl space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Integrações</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure o webhook do Make para envio automatizado de mensagens personalizadas.
        </p>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                      <Send className="h-3.5 w-3.5" />
                    </span>
                    Make.com
                  </CardTitle>
                  <CardDescription>
                    Cole a URL do webhook do seu cenário no Make. As mensagens são assinadas com HMAC-SHA256.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="enabled" className="text-xs">
                    {enabled ? "Ativo" : "Desativado"}
                  </Label>
                  <Switch id="enabled" checked={enabled} onCheckedChange={setEnabled} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="webhook-url">URL do Webhook (HTTPS)</Label>
                <Input
                  id="webhook-url"
                  type="url"
                  placeholder="https://hook.eu2.make.com/..."
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="mt-1 font-mono text-xs"
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Apenas HTTPS. Endereços internos são bloqueados.
                </p>
              </div>

              {webhookUrl !== TEST_WEBHOOK_URL && (
                <div className="rounded-lg bg-violet-500/5 border border-violet-500/20 p-3 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium text-violet-400">Modelo de Teste</p>
                    <p className="text-xs text-muted-foreground">Usar webhook de homologação para validar sua configuração.</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-violet-500/30 hover:bg-violet-500/10 text-violet-400"
                    onClick={() => setWebhookUrl(TEST_WEBHOOK_URL)}
                  >
                    Ativar Webhook Teste
                  </Button>
                </div>
              )}

              {secretToken && (
                <div>
                  <Label>Secret Token (HMAC)</Label>
                  <div className="mt-1 flex gap-2">
                    <Input
                      readOnly
                      value={showSecret ? secretToken : "•".repeat(40)}
                      className="font-mono text-xs"
                    />
                    <Button variant="outline" size="icon" onClick={() => setShowSecret((v) => !v)}>
                      {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button variant="outline" size="icon" onClick={copySecret}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => handleSave(true)} title="Regenerar">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Configure este secret no seu cenário Make para validar a assinatura no header{" "}
                    <code className="rounded bg-muted px-1">X-Lovable-Signature</code>.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="retries">Máx. tentativas</Label>
                  <Input
                    id="retries"
                    type="number"
                    min={1}
                    max={10}
                    value={maxRetries}
                    onChange={(e) => setMaxRetries(Number(e.target.value))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="interval">Intervalo (seg)</Label>
                  <Input
                    id="interval"
                    type="number"
                    min={5}
                    max={600}
                    value={retryInterval}
                    onChange={(e) => setRetryInterval(Number(e.target.value))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="tone">Tom padrão</Label>
                  <Input
                    id="tone"
                    value={defaultTone}
                    onChange={(e) => setDefaultTone(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2">
                <Button variant="outline" onClick={handleTest} disabled={testing || !webhookUrl} className="gap-2">
                  {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Testar webhook
                </Button>
                <Button onClick={() => handleSave(false)} disabled={saving} className="gap-2">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Salvar
                </Button>
              </div>

              {testResult && (
                <div
                  className={`rounded-lg border p-3 text-sm ${
                    testResult.ok
                      ? "border-emerald-500/30 bg-emerald-500/10"
                      : "border-rose-500/30 bg-rose-500/10"
                  }`}
                >
                  <div className="flex items-center gap-2 font-medium">
                    {testResult.ok ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-rose-600" />
                    )}
                    {testResult.ok
                      ? `Sucesso — HTTP ${testResult.status} em ${testResult.latency_ms}ms`
                      : `Falha — ${testResult.error || `HTTP ${testResult.status}`}`}
                  </div>
                  {testResult.response && (
                    <pre className="mt-2 max-h-32 overflow-auto rounded bg-background/50 p-2 text-[11px]">
                      {testResult.response}
                    </pre>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {stats && stats.total > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Estatísticas (últimos 30 dias)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <Stat label="Total de envios" value={stats.total} />
                  <Stat
                    label="Variante A"
                    value={`${stats.A.delivered}/${stats.A.sent}`}
                    sub={stats.A.sent ? `${Math.round((stats.A.delivered / stats.A.sent) * 100)}% entregue` : "—"}
                  />
                  <Stat
                    label="Variante B"
                    value={`${stats.B.delivered}/${stats.B.sent}`}
                    sub={stats.B.sent ? `${Math.round((stats.B.delivered / stats.B.sent) * 100)}% entregue` : "—"}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {recentLogs && recentLogs.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base">Logs Recentes</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => load()} className="h-8 px-2">
                  <RefreshCw className="h-3.5 w-3.5 mr-1" /> Atualizar
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between text-xs border-b border-slate-50 pb-2 last:border-0">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-muted-foreground">{log.request_id?.slice(0, 8)}</span>
                          <span className="capitalize text-muted-foreground">{Array.isArray(log.channels) ? log.channels.join(", ") : "—"}</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {new Date(log.sent_at || "").toLocaleString("pt-BR")}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col items-end">
                          <Badge 
                            variant="secondary" 
                            className={cn(
                              "text-[9px] h-4 font-bold",
                              log.status === "delivered" ? "bg-emerald-500/10 text-emerald-600" : 
                              log.status === "failed" ? "bg-rose-500/10 text-rose-600" :
                              "bg-amber-500/10 text-amber-600"
                            )}
                          >
                            {log.status}
                          </Badge>
                          {log.response_time_ms && (
                            <span className="text-[9px] text-muted-foreground mt-0.5">{log.response_time_ms}ms</span>
                          )}
                        </div>
                        {log.attempts && log.attempts > 1 && (
                          <div className="text-[9px] font-bold text-muted-foreground bg-slate-100 px-1 rounded">
                            {log.attempts}x
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Como configurar no Make</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>1. Crie um cenário no Make com módulo <strong>Webhooks → Custom webhook</strong>.</p>
              <p>2. Cole a URL gerada pelo Make no campo acima e clique em <strong>Salvar</strong>.</p>
              <p>3. (Opcional, recomendado) Adicione um módulo <strong>Tools → Compose a string</strong> e valide o header <code className="rounded bg-muted px-1">X-Lovable-Signature</code> usando o secret acima.</p>
              <p>4. Use os campos do payload (<code>lead</code>, <code>messages</code>, <code>channels</code>) para rotear para WhatsApp/Email/Instagram.</p>
              <p>5. Clique em <strong>Testar webhook</strong> para validar a conexão.</p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
      {sub && <div className="text-[11px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { Shield, AlertTriangle, FileCheck, Building2, Globe, Link2, UserCheck, Lock, History } from 'lucide-react'
import {
  consultarPJ, consultarWhois, consultarSitePublico,
  registrarConsentimentoPF, listarConsentimentos, revogarConsentimento,
  consultarPF, listarAuditoria,
} from '@/server/duediligence.functions'

export const Route = createFileRoute('/due-diligence')({
  component: DueDiligencePage,
  head: () => ({
    meta: [
      { title: 'Due Diligence — Consultas com Consentimento | MarketScope' },
      { name: 'description', content: 'Módulo de consultas de PJ, WHOIS e PF com auditoria LGPD e consentimento do titular.' },
    ],
  }),
})

function DueDiligencePage() {
  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 space-y-6">
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Due Diligence</h1>
        </div>
        <p className="text-muted-foreground">
          Consultas legais de pessoa jurídica, domínios e sites públicos. Pessoa física apenas mediante consentimento.
        </p>
      </header>

      <Alert className="border-warning/40 bg-warning/5">
        <AlertTriangle className="h-4 w-4 text-warning" />
        <AlertTitle>Aviso LGPD</AlertTitle>
        <AlertDescription>
          Toda consulta é registrada em trilha de auditoria imutável (quem, quando, alvo mascarado, base legal).
          Consultas de PF exigem termo de consentimento ativo do titular. CPFs nunca são armazenados em claro.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="pj" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="pj"><Building2 className="h-4 w-4 mr-1" />PJ</TabsTrigger>
          <TabsTrigger value="whois"><Globe className="h-4 w-4 mr-1" />WHOIS</TabsTrigger>
          <TabsTrigger value="site"><Link2 className="h-4 w-4 mr-1" />Site</TabsTrigger>
          <TabsTrigger value="pf"><Lock className="h-4 w-4 mr-1" />PF</TabsTrigger>
          <TabsTrigger value="audit"><History className="h-4 w-4 mr-1" />Auditoria</TabsTrigger>
        </TabsList>

        <TabsContent value="pj"><ConsultaPJTab /></TabsContent>
        <TabsContent value="whois"><WhoisTab /></TabsContent>
        <TabsContent value="site"><SiteTab /></TabsContent>
        <TabsContent value="pf"><ConsultaPFTab /></TabsContent>
        <TabsContent value="audit"><AuditoriaTab /></TabsContent>
      </Tabs>
    </div>
  )
}

// ============ PJ ============
function ConsultaPJTab() {
  const [cnpj, setCnpj] = useState('')
  const fn = useServerFn(consultarPJ)
  const m = useMutation({
    mutationFn: (c: string) => fn({ data: { cnpj: c } }),
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Consulta de Pessoa Jurídica</CardTitle>
        <CardDescription>BrasilAPI + ReceitaWS (fallback). Cache de 7 dias.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input placeholder="00.000.000/0000-00" value={cnpj} onChange={(e) => setCnpj(e.target.value)} maxLength={20} />
          <Button onClick={() => m.mutate(cnpj)} disabled={m.isPending || cnpj.length < 14}>
            {m.isPending ? 'Consultando…' : 'Consultar'}
          </Button>
        </div>
        {m.isPending && <Skeleton className="h-40 w-full" />}
        {m.data && <PJResult data={m.data.data} fonte={m.data.fonte} fromCache={m.data.from_cache} />}
      </CardContent>
    </Card>
  )
}

function PJResult({ data, fonte, fromCache }: { data: any; fonte: string; fromCache: boolean }) {
  return (
    <div className="space-y-4 rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{data.razao_social}</h3>
        <div className="flex gap-2">
          <Badge variant="outline">{fonte}</Badge>
          {fromCache && <Badge variant="secondary">cache</Badge>}
          <Badge variant={data.situacao === 'ATIVA' ? 'default' : 'destructive'}>{data.situacao}</Badge>
        </div>
      </div>
      {data.nome_fantasia && <p className="text-sm text-muted-foreground">{data.nome_fantasia}</p>}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
        <Field label="CNPJ" value={data.cnpj} />
        <Field label="Porte" value={data.porte} />
        <Field label="Capital social" value={data.capital_social ? `R$ ${Number(data.capital_social).toLocaleString('pt-BR')}` : '—'} />
        <Field label="Abertura" value={data.data_abertura} />
        <Field label="Natureza jurídica" value={data.natureza_juridica} />
        <Field label="CNAE principal" value={data.cnae_principal ? `${data.cnae_principal.codigo} — ${data.cnae_principal.descricao}` : '—'} />
      </div>
      {data.endereco && (
        <div className="text-sm">
          <div className="font-medium mb-1">Endereço</div>
          <div className="text-muted-foreground">
            {[data.endereco.logradouro, data.endereco.numero, data.endereco.bairro, data.endereco.cidade, data.endereco.uf, data.endereco.cep].filter(Boolean).join(', ')}
          </div>
        </div>
      )}
      {data.qsa?.length > 0 && (
        <div>
          <div className="font-medium text-sm mb-1">Quadro societário ({data.qsa.length})</div>
          <ul className="text-sm space-y-1">
            {data.qsa.map((s: any, i: number) => (
              <li key={i} className="flex justify-between border-b py-1">
                <span>{s.nome}</span>
                <span className="text-muted-foreground">{s.qualificacao}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function Field({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-medium">{value || '—'}</div>
    </div>
  )
}

// ============ WHOIS ============
function WhoisTab() {
  const [dominio, setDominio] = useState('')
  const fn = useServerFn(consultarWhois)
  const m = useMutation({
    mutationFn: (d: string) => fn({ data: { dominio: d } }),
    onError: (e: Error) => toast.error(e.message),
  })
  return (
    <Card>
      <CardHeader>
        <CardTitle>Consulta WHOIS</CardTitle>
        <CardDescription>registro.br para .br, RDAP para gTLDs.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input placeholder="exemplo.com.br" value={dominio} onChange={(e) => setDominio(e.target.value)} />
          <Button onClick={() => m.mutate(dominio)} disabled={m.isPending || dominio.length < 4}>
            {m.isPending ? 'Consultando…' : 'Consultar'}
          </Button>
        </div>
        {m.isPending && <Skeleton className="h-32 w-full" />}
        {m.data && (
          <div className="space-y-3 rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{m.data.data.dominio}</h3>
              <Badge variant="outline">{m.data.data.fonte}</Badge>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              <Field label="Registrar" value={m.data.data.registrar} />
              <Field label="Titular" value={m.data.data.titular} />
              <Field label="Registrado em" value={m.data.data.registrado_em?.slice(0, 10)} />
              <Field label="Expira em" value={m.data.data.expira_em?.slice(0, 10)} />
              <Field label="Atualizado em" value={m.data.data.atualizado_em?.slice(0, 10)} />
            </div>
            {m.data.data.nameservers && m.data.data.nameservers.length > 0 && (
              <div>
                <div className="text-xs text-muted-foreground mb-1">Nameservers</div>
                <ul className="text-sm font-mono">
                  {m.data.data.nameservers.map((n: string) => <li key={n}>{n}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ============ Site público ============
function SiteTab() {
  const [url, setUrl] = useState('')
  const fn = useServerFn(consultarSitePublico)
  const m = useMutation({
    mutationFn: (u: string) => fn({ data: { url: u } }),
    onError: (e: Error) => toast.error(e.message),
  })
  return (
    <Card>
      <CardHeader>
        <CardTitle>Análise de Site Público</CardTitle>
        <CardDescription>Extrai metadados, contatos e links sociais. Apenas dados públicos do site.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input placeholder="https://exemplo.com" value={url} onChange={(e) => setUrl(e.target.value)} />
          <Button onClick={() => m.mutate(url)} disabled={m.isPending || !url.startsWith('http')}>
            {m.isPending ? 'Analisando…' : 'Analisar'}
          </Button>
        </div>
        {m.isPending && <Skeleton className="h-40 w-full" />}
        {m.data && (
          <div className="space-y-3 rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{m.data.data.titulo || m.data.data.url}</h3>
              <Badge variant="outline">{m.data.data.fonte}</Badge>
            </div>
            {m.data.data.descricao && <p className="text-sm text-muted-foreground">{m.data.data.descricao}</p>}
            {m.data.data.resumo && (
              <div>
                <div className="text-xs text-muted-foreground mb-1">Resumo</div>
                <p className="text-sm">{m.data.data.resumo}</p>
              </div>
            )}
            <div className="grid md:grid-cols-3 gap-3 text-sm">
              <ListBox label="E-mails" items={m.data.data.emails} />
              <ListBox label="Telefones" items={m.data.data.telefones} />
              <ListBox label="Redes sociais" items={m.data.data.links_sociais} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ListBox({ label, items }: { label: string; items?: string[] }) {
  if (!items || items.length === 0) return <Field label={label} value="—" />
  return (
    <div>
      <div className="text-xs text-muted-foreground mb-1">{label} ({items.length})</div>
      <ul className="text-sm space-y-0.5 max-h-40 overflow-auto">
        {items.slice(0, 10).map((i) => <li key={i} className="truncate">{i}</li>)}
      </ul>
    </div>
  )
}

// ============ PF (com consentimento) ============
function ConsultaPFTab() {
  const qc = useQueryClient()
  const listFn = useServerFn(listarConsentimentos)
  const consultarFn = useServerFn(consultarPF)
  const revogarFn = useServerFn(revogarConsentimento)

  const { data, isLoading } = useQuery({
    queryKey: ['consentimentos'],
    queryFn: () => listFn({ data: undefined as never }),
  })

  const consultar = useMutation({
    mutationFn: (v: { cpf: string; consentimento_id: string }) => consultarFn({ data: v }),
    onError: (e: Error) => toast.error(e.message),
  })

  const revogar = useMutation({
    mutationFn: (id: string) => revogarFn({ data: { id } }),
    onSuccess: () => { toast.success('Consentimento revogado.'); qc.invalidateQueries({ queryKey: ['consentimentos'] }) },
  })

  const [cpf, setCpf] = useState('')
  const [consId, setConsId] = useState<string>('')

  return (
    <div className="space-y-4">
      <Alert variant="destructive" className="border-destructive/40 bg-destructive/5">
        <Lock className="h-4 w-4" />
        <AlertTitle>Dados sensíveis — LGPD</AlertTitle>
        <AlertDescription>
          Consultas de PF exigem consentimento ativo do titular (Art. 7º e 11 da LGPD). Toda chamada é auditada.
          Não fazemos scraping de JusBrasil ou PF (ilegal e bloqueado tecnicamente).
        </AlertDescription>
      </Alert>

      <ConsentimentoForm />

      <Card>
        <CardHeader>
          <CardTitle>Realizar consulta de PF</CardTitle>
          <CardDescription>Selecione um consentimento ativo e informe o CPF correspondente.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <Label>CPF</Label>
              <Input value={cpf} onChange={(e) => setCpf(e.target.value)} placeholder="000.000.000-00" />
            </div>
            <div>
              <Label>Consentimento</Label>
              <Select value={consId} onValueChange={setConsId}>
                <SelectTrigger><SelectValue placeholder={isLoading ? 'Carregando…' : 'Selecione…'} /></SelectTrigger>
                <SelectContent>
                  {(data?.items ?? []).filter((c) => !c.revogado_em).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.titular_nome} — {c.finalidade.slice(0, 30)} (exp {c.expira_em.slice(0, 10)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            onClick={() => consultar.mutate({ cpf, consentimento_id: consId })}
            disabled={consultar.isPending || !cpf || !consId}
          >
            {consultar.isPending ? 'Consultando…' : 'Consultar com consentimento'}
          </Button>
          {consultar.data && (
            <Alert className={consultar.data.result.status === 'sucesso' ? 'border-success/40 bg-success/5' : 'border-warning/40 bg-warning/5'}>
              <FileCheck className="h-4 w-4" />
              <AlertTitle>Resultado — CPF {consultar.data.cpf_mascarado}</AlertTitle>
              <AlertDescription>{consultar.data.result.message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Meus consentimentos</CardTitle></CardHeader>
        <CardContent>
          {isLoading && <Skeleton className="h-20 w-full" />}
          {!isLoading && (data?.items?.length ?? 0) === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum consentimento registrado ainda.</p>
          )}
          <div className="space-y-2">
            {(data?.items ?? []).map((c) => (
              <div key={c.id} className="flex items-center justify-between border rounded-md p-3 text-sm">
                <div>
                  <div className="font-medium">{c.titular_nome}</div>
                  <div className="text-xs text-muted-foreground">
                    {c.finalidade} · {c.base_legal} · expira {c.expira_em.slice(0, 10)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {c.revogado_em ? (
                    <Badge variant="destructive">revogado</Badge>
                  ) : new Date(c.expira_em) < new Date() ? (
                    <Badge variant="secondary">expirado</Badge>
                  ) : (
                    <>
                      <Badge>ativo</Badge>
                      <Button size="sm" variant="outline" onClick={() => revogar.mutate(c.id)}>Revogar</Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function ConsentimentoForm() {
  const qc = useQueryClient()
  const fn = useServerFn(registrarConsentimentoPF)
  const [form, setForm] = useState({ cpf: '', titular_nome: '', titular_email: '', finalidade: '', base_legal: 'consentimento', documento_url: '' })
  const m = useMutation({
    mutationFn: () => fn({
      data: {
        cpf: form.cpf,
        titular_nome: form.titular_nome,
        titular_email: form.titular_email || null,
        finalidade: form.finalidade,
        base_legal: form.base_legal as 'consentimento' | 'contrato' | 'obrigacao_legal' | 'legitimo_interesse',
        documento_url: form.documento_url || null,
      },
    }),
    onSuccess: (r) => {
      toast.success(`Consentimento registrado para ${r.cpf_mascarado}`)
      qc.invalidateQueries({ queryKey: ['consentimentos'] })
      setForm({ cpf: '', titular_nome: '', titular_email: '', finalidade: '', base_legal: 'consentimento', documento_url: '' })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><UserCheck className="h-5 w-5" />Registrar consentimento de PF</CardTitle>
        <CardDescription>O titular precisa autorizar a consulta. Anexe o termo assinado quando possível.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid md:grid-cols-2 gap-3">
          <div><Label>CPF do titular</Label><Input value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} /></div>
          <div><Label>Nome completo</Label><Input value={form.titular_nome} onChange={(e) => setForm({ ...form, titular_nome: e.target.value })} /></div>
          <div><Label>E-mail (opcional)</Label><Input type="email" value={form.titular_email} onChange={(e) => setForm({ ...form, titular_email: e.target.value })} /></div>
          <div>
            <Label>Base legal</Label>
            <Select value={form.base_legal} onValueChange={(v) => setForm({ ...form, base_legal: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="consentimento">Consentimento (Art. 7º, I)</SelectItem>
                <SelectItem value="contrato">Execução de contrato (Art. 7º, V)</SelectItem>
                <SelectItem value="obrigacao_legal">Obrigação legal (Art. 7º, II)</SelectItem>
                <SelectItem value="legitimo_interesse">Legítimo interesse (Art. 7º, IX)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label>Finalidade</Label>
          <Textarea
            value={form.finalidade}
            onChange={(e) => setForm({ ...form, finalidade: e.target.value })}
            placeholder="Ex.: Verificação cadastral para abertura de conta comercial."
            maxLength={500}
          />
        </div>
        <div>
          <Label>URL do termo assinado (opcional)</Label>
          <Input value={form.documento_url} onChange={(e) => setForm({ ...form, documento_url: e.target.value })} placeholder="https://…" />
        </div>
        <Button onClick={() => m.mutate()} disabled={m.isPending || !form.cpf || !form.titular_nome || !form.finalidade}>
          {m.isPending ? 'Registrando…' : 'Registrar consentimento'}
        </Button>
      </CardContent>
    </Card>
  )
}

// ============ Auditoria ============
function AuditoriaTab() {
  const fn = useServerFn(listarAuditoria)
  const { data, isLoading } = useQuery({
    queryKey: ['auditoria'],
    queryFn: () => fn({ data: undefined as never }),
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trilha de Auditoria</CardTitle>
        <CardDescription>Registro imutável de todas as consultas. Sem update/delete, mesmo para administradores.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && <Skeleton className="h-40 w-full" />}
        {!isLoading && (data?.items?.length ?? 0) === 0 && (
          <p className="text-sm text-muted-foreground">Nenhuma consulta realizada ainda.</p>
        )}
        <div className="space-y-1.5">
          {(data?.items ?? []).map((r) => (
            <div key={r.id} className="grid grid-cols-12 gap-2 items-center text-xs border-b py-2">
              <div className="col-span-3 text-muted-foreground">{new Date(r.created_at).toLocaleString('pt-BR')}</div>
              <div className="col-span-2"><Badge variant="outline">{r.tipo}</Badge></div>
              <div className="col-span-3 truncate font-mono">{r.alvo_mascarado}</div>
              <div className="col-span-2 text-muted-foreground">{r.provedor}</div>
              <div className="col-span-2">
                <Badge variant={
                  r.status === 'sucesso' ? 'default'
                  : r.status === 'cache_hit' ? 'secondary'
                  : r.status === 'bloqueado_lgpd' ? 'destructive'
                  : 'outline'
                }>{r.status}</Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

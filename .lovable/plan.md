
# Market Whisperer — Plano revisado (incorpora crítica)

Plano aprovado conceitualmente, **reordenado** e com Onda 1 entregando UI visível desde o primeiro ciclo. Esta sessão executa **apenas a Onda 1**. Ondas 2–6 ficam documentadas para ciclos futuros, sem implementação agora.

---

## Nova ordem de execução

1. **Onda 1 — Jobs + feedback mínimo de estado** ← executar agora
2. Onda 2 — n8n resiliente + idempotência
3. Onda 3 — Performance CRM (10k+ leads)
4. Onda 4 — Governança de consumo
5. Onda 5 — UX/UI premium completa
6. Onda 6 — Observabilidade avançada

---

## ONDA 1 — Camada de Jobs + UI de estado (escopo desta execução)

### 1.1 Banco (Lovable Cloud)

Migration única com:

**Tabela `jobs`**
- `id uuid pk`, `tipo text`, `status text` (queued|running|done|failed|queued_external)
- `payload jsonb`, `result jsonb` (truncado a ~32KB; payload bruto NÃO entra aqui)
- `idempotency_key text UNIQUE NOT NULL`
- `attempts int default 0`, `max_attempts int default 1` (default conservador — retry só quando seguro)
- `owner_user_id uuid` (nullable; usa `MOCK_USER_ID` constante enquanto for single-user)
- `error text`, `scheduled_at`, `started_at`, `finished_at`, `created_at`, `updated_at`
- Índices: `(status, scheduled_at)`, `(owner_user_id, created_at desc)`, UNIQUE `(idempotency_key)`

**Tabela `job_events`** (resumo técnico, não payload bruto)
- `id`, `job_id`, `event_type text`, `level text` (info|warn|error)
- `message text`, `metadata jsonb` (truncado a ~4KB)
- `created_at`
- Índice `(job_id, created_at desc)`
- Eventos padronizados: `job_created`, `job_started`, `job_step_changed`, `job_retry_scheduled`, `job_failed`, `job_completed`, `external_call_started`, `external_call_failed`, `external_call_completed`

**RLS**
- Modelo single-user atual: políticas permissivas (`USING (true)`) para reads/writes autenticados; estrutura preparada para multi-user depois (coluna `owner_user_id` já existe).
- Quando login chegar, basta trocar policies para `owner_user_id = auth.uid()`.

**`cost_ledger` NÃO entra na Onda 1** (Onda 4).

### 1.2 Server functions (`src/server/jobs.functions.ts` + `jobs.server.ts`)

- `enqueueJob({ tipo, payload, idempotencyKey, maxAttempts? })`
  - INSERT com `ON CONFLICT (idempotency_key) DO NOTHING RETURNING ...`; se conflitar, retorna o job existente. **Bloqueia duplo clique no servidor**.
- `getJob(jobId)` — leitura pontual.
- `listJobs({ status?, tipo?, limit, cursor })` — keyset pagination, default 20.
- `updateJobStatus({ jobId, status, result?, error? })` — transição validada (queued→running→done|failed; running→queued_external).
- `appendJobEvent({ jobId, eventType, level, message, metadata? })` — trunca metadata.
- `retryJob(jobId)` — manual; apenas se `status in (failed, queued_external)`; incrementa attempts.

Sem `runJob` que execute trabalho pesado dentro do app. **App é controlador e painel; n8n continua sendo o worker**. Para chamadas externas (Places, BrasilAPI, IA), wrappers continuam onde estão na Onda 1 — só passam a registrar `external_call_*` em `job_events` quando recebem `jobId` opcional.

### 1.3 UI mínima (componentes reutilizáveis)

`src/components/jobs/`:
- `JobStatusBadge` — chip semântico por status (queued/running/done/failed/queued_external) com ícone + cor de design token.
- `JobProgressCard` — card padrão: status, tipo, último evento, timestamps, botão retry (quando aplicável).
- `BackgroundJobBanner` — banner fixo (reaproveita layout do `ActiveJobsBanner` atual) que assina Realtime em `jobs` filtrado pelo usuário e mostra jobs em andamento. Substitui o polling atual por Supabase Realtime.
- `RetryButton` — chama `retryJob` com confirmação quando `tipo` está marcado como **não-idempotente** (lista hardcoded por enquanto).
- `JobErrorState` — bloco amigável com mensagem humana + "ver detalhes técnicos" (expande últimos 5 `job_events` level=error).
- `JobHistoryList` — lista paginada para reuso em painéis.

Realtime: `ALTER PUBLICATION supabase_realtime ADD TABLE public.jobs, public.job_events`.

### 1.4 Integração com fluxos existentes (mínimo invasivo)

Envolver as 3 chamadas mais críticas em `enqueueJob` + `updateJobStatus`, **sem mexer no n8n ainda**:

1. **Importação de leads** (`leads-import.functions.ts`) — já tem `lead_import_jobs`; adicionar gravação paralela em `jobs` (espelho) para que o novo banner unifique a experiência. Migração futura unifica as duas.
2. **Places bulk** (`places-bulk.functions.ts`) — envolver em job.
3. **Webhook Make atual** (`/api/public/make-callback`) — quando receber callback, atualizar job correspondente via `idempotency_key` enviado no request original.

Demais fluxos (IA, due diligence, n8n direto) ficam como estão nesta onda — a infra já existe para serem migrados gradualmente.

### 1.5 Proteções obrigatórias

- **Anti-duplo-clique:** UNIQUE em `idempotency_key` no servidor + `disabled` no botão enquanto mutation está em flight no client.
- **Persistência após refresh:** `BackgroundJobBanner` lê estado do banco via Realtime; refresh não perde nada.
- **Erros amigáveis:** `JobErrorState` mapeia códigos comuns (`timeout`, `quota_exceeded`, `provider_unavailable`) para mensagens em pt-BR; detalhes técnicos ficam atrás de toggle.
- **Truncamento:** `payload` e `result` truncados antes de salvar; debug flag `LOVABLE_JOBS_DEBUG=1` (env) permite gravar payload completo temporariamente.

### 1.6 O que NÃO fazer nesta onda (importante)

- Não criar `runJob` worker pesado.
- Não fazer retry automático para nada (só `max_attempts=1` por default; retry só manual).
- Não implementar circuit breaker (Onda 2).
- Não criar `cost_ledger`, quotas, painel de consumo (Onda 4).
- Não fazer redesign completo da UI (Onda 5).
- Não criar `/ajustes/observabilidade` (Onda 6).
- Não migrar todos os fluxos existentes — só os 3 listados em 1.4.
- Não tocar no `n8n` além de aceitar `idempotencyKey` no callback.

### 1.7 Entregáveis e validação manual

Ao final da Onda 1, devolver:

1. Migration aplicada (`jobs`, `job_events`, índices, RLS, publicação Realtime).
2. Lista de arquivos alterados (server functions, componentes, integrações).
3. Build limpo + testes existentes passando.
4. Roteiro de teste manual:
   - Disparar uma importação de leads → ver banner aparecer com status `running` → ver virar `done`.
   - Clicar 3x rápido no botão → confirmar que só 1 job é criado.
   - Refresh da página com job em andamento → banner reaparece com estado correto.
   - Forçar erro (CSV inválido) → ver `JobErrorState` com mensagem amigável + detalhes expansíveis.
   - Clicar retry em job falho → novo attempt registrado.

---

## ONDA 2 (planejada, NÃO executar agora) — n8n resiliente

- `callN8nWorkflow({ workflow, payload, jobId, idempotencyKey })` — sempre envia `jobId` e `idempotencyKey` no body; n8n deve checar antes de executar efeitos colaterais.
- Timeout 25s + `AbortController`.
- **Retry automático apenas para workflows marcados como `idempotent: true`** em registry. Demais: retry **somente manual** via `RetryButton`.
- Endpoint `/api/public/hooks/n8n-callback`:
  - HMAC obrigatório (header `x-mw-signature`)
  - timestamp ±5min para evitar replay
  - valida `jobId` existe e está em estado compatível
  - status whitelist (`done|failed|progress`)
  - sanitiza payload, ignora `owner_user_id` vindo do n8n
- Circuit breaker mínimo: 3 falhas/5min → marca workflow `degraded`, novos jobs vão para `queued_external`, banner avisa, admin pode retry.

## ONDA 3 — Performance CRM
RPC `crm_list_leads` keyset, `@tanstack/react-virtual`, React Query com `keepPreviousData`, debounce 300ms, materialized view para métricas.

## ONDA 4 — Governança de consumo
`external_cache` generalizado, middleware `withCostGuard`, `cost_ledger`, painel `/ajustes/consumo`, cron de limpeza (job_events info >30d, cache expirado, jobs done >90d arquivados).

## ONDA 5 — UX/UI premium
Design tokens revistos, shell consistente, skeletons dedicados, empty states, error/notFound boundaries em todas as rotas, ajustes mobile.

## ONDA 6 — Observabilidade avançada
`/ajustes/observabilidade` admin, health checks via cron, latência p50/p95, top erros, alerta persistente.

---

## Riscos endereçados (da crítica)

| Risco apontado | Mitigação no plano |
|---|---|
| Retry duplica execução em n8n | Onda 1 default `max_attempts=1`; retry automático só Onda 2 e só p/ workflows marcados idempotentes |
| Lovable virar worker pesado | Sem `runJob`; app só controla, n8n executa |
| Observabilidade tarde demais | `job_events` nasce na Onda 1 com taxonomia padronizada |
| `job_events` explodir storage | Truncamento de metadata (4KB) + result (32KB); cleanup só Onda 4 mas truncamento já protege |
| Callback n8n inseguro | Onda 2 detalha HMAC + timestamp + whitelist + sanitização |
| RLS ambígua single-user | Policies permissivas com `owner_user_id=MOCK_USER_ID`; estrutura pronta p/ multi-user |
| UX continuar ruim | Onda 1 já entrega Badge + Banner + ErrorState + Retry visíveis |
| Plano grande demais de uma vez | Esta sessão executa só Onda 1; demais ondas ficam na doc |

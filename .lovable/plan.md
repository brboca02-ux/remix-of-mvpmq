## Estado atual (achado)
- `src/lib/crm-bridge.ts` ainda **não existe** (plano anterior não implementado).
- Não há `src/store/crm-store.ts` — o CRM usa `useProspectingStore` (`src/modules/prospecting/prospecting-store.ts`) e o tipo `ProspectLead` em `src/modules/prospecting/types.ts`.
- Já existe `useFollowupEvaluator` rodando a cada 60s e `followup-rules` (regras com `idleDays` por status). Vamos **reaproveitar e estender**, não duplicar.

Esta ordem assume que os planos anteriores (BLOCO A: score/stage/badges + BLOCO B/C: export WhatsApp + engine) serão implementados na mesma passada — caso contrário a camada de "próxima ação" depende de campos que ainda não existem.

Tudo client-side, zero login, zero backend novo, zero n8n.

---

## ETAPA 1 — Campos de próxima ação

Adicionar em `src/modules/prospecting/types.ts` (opcionais, retrocompat):
- `nextActionAt?: string` (ISO)
- `lastInteractionAt?: string` (ISO) — alinha com `last_interaction` já planejado; **usaremos só `lastInteractionAt`** como fonte única para evitar dois nomes
- `coolingFlag?: boolean` (cache da regra "esfriando")

> Não criar `src/store/crm-store.ts`. Mantemos `prospecting-store` como fonte única (decisão anterior).

---

## ETAPA 2 — Regras de SLA por stage

Novo: `src/lib/crm-sla.ts`

```ts
export const STAGE_SLA_MINUTES: Record<Stage, number> = {
  novo:       10,            // 10 min
  contato:    60 * 24,       // 1 dia
  respondeu:  60 * 24 * 2,   // 2 dias
  proposta:   60 * 24 * 3,   // 3 dias
  fechado:    0,             // sem SLA
};

export function computeNextActionAt(stage: Stage, from = new Date()): string | null;
export function isOverdue(lead): boolean;       // nextActionAt && nextActionAt <= now
export function isCooling(lead): boolean;       // stage='contato' && lastInteractionAt > 3d
```

---

## ETAPA 3 — Hook nas mutações de stage

Em `prospecting-store.ts`, criar **um único helper interno** `applyStageChange(lead, newStage)` que:
- seta `stage = newStage`
- seta `lastInteractionAt = now`
- seta `nextActionAt = computeNextActionAt(newStage)`
- recalcula `coolingFlag`

Usar esse helper em **todos** os pontos que mudam stage:
- `addLeadsToCRM` (stage inicial = `novo` → SLA 10min)
- handlers "Marcar como contatado/respondeu/fechado" (BLOCO A)
- ação genérica "Ação realizada" (ETAPA 6)

Sem duplicar lógica em UI.

---

## ETAPA 4 — UI do CRM (`CRMPage.tsx`)

**Topo — barra de resumo (ETAPA 8):**
- `🔥 N precisam de ação` (overdue)
- `⚡ N quentes` (score > 70)
- `🆕 N novos hoje` (createdAt = hoje)
- `❄️ N esfriando` (coolingFlag)

Cada chip é clicável e aplica filtro correspondente.

**Filtros (estende ETAPA 4 do plano anterior):**
Chips: `Todos` · `Precisa de ação` · `Não contatados` · `Contatados` · `Quentes` · `Esfriando`.

**Ordenação default (ETAPA 5):**
1. `isOverdue` desc (pendentes primeiro)
2. `score` desc
3. `createdAt` desc

**Card do lead:**
- Badge "🔥 Ação necessária — vencida há Xh" quando overdue (vermelho)
- Badge "❄️ Esfriando" quando coolingFlag
- Linha "Próxima ação: em 1d 4h" (relative time) quando `nextActionAt` no futuro
- Bloco "Ações rápidas" (já planejado) ganha botão extra **"Ação realizada"** que chama `applyStageChange(lead, lead.stage)` (mesma stage, só renova SLA)

---

## ETAPA 5 — Avaliação de "esfriando"

Estender `useFollowupEvaluator` (já existe e roda a cada 60s):
- Para cada lead, recalcular `coolingFlag = isCooling(lead)`
- Persistir via `updateLead` apenas quando o flag mudar (evita re-render desnecessário)
- **Não** criar novo intervalo nem novo hook — reusa o evaluator existente.

---

## ETAPA 6 — Migração de leads antigos

Ao montar `CRMPage`, rodar uma vez `useEffect`:
- Para leads sem `nextActionAt` mas com `stage`: setar `nextActionAt = computeNextActionAt(stage, createdAt)`
- Não regrava leads `fechado`.

Garante que dados pré-existentes entrem na nova lógica sem reset manual.

---

## Validação manual
1. Buscador → enviar 3 leads → cada um tem `nextActionAt = +10min`, aparece em "Precisa de ação" após 10min (ou ajustando relógio).
2. Marcar como contatado → SLA pula pra 1 dia, `lastInteractionAt` atualiza.
3. Forçar `lastInteractionAt` 4 dias atrás em stage `contato` → badge "Esfriando" aparece em ≤60s.
4. Clicar "Ação realizada" → `nextActionAt` recalculado, sai da lista de overdue.
5. Topo do CRM mostra contagens corretas; chips filtram.
6. Ordenação: overdue no topo, depois quentes.
7. Intactos: `/dev/jobs`, market-research, n8n, login, BackgroundJobBanner, evaluator antigo (continua disparando tasks de follow-up).

---

## Arquivos

**Criados (1):**
- `src/lib/crm-sla.ts`

**Alterados (4):**
- `src/modules/prospecting/types.ts` — `nextActionAt`, `lastInteractionAt`, `coolingFlag`
- `src/modules/prospecting/prospecting-store.ts` — helper `applyStageChange` + uso nos pontos de mutação
- `src/modules/crm/CRMPage.tsx` — barra de resumo, filtros novos, ordenação, badges, botão "Ação realizada", migração inicial
- `src/modules/crm/useFollowupEvaluator.ts` — recalcular `coolingFlag` no tick existente

**Não tocados:** `src/server/jobs.*`, `dev.jobs.tsx`, market-research, n8n, login, edge functions, `prospect_leads` (tabela), `followup-rules.ts` (mantém regras de tarefa atuais).

---

## Confirmações
- ✅ Tudo client-side via Zustand existente
- ✅ Lógica única em `applyStageChange` (sem duplicar em UI)
- ✅ Reusa evaluator existente (sem novo intervalo)
- ✅ Sem nova store, sem nova tabela, sem login
- ✅ Migração não-destrutiva para leads antigos
- ⚠️ Depende dos campos `stage`/`score` previstos no plano anterior — implementar ambos juntos.

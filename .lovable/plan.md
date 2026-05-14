## Plano refinado — incorpora seus 6 pontos críticos

Mantém a divisão em etapas (estabilizar → compactar → adaptar → escalar), mas agora com **estados de falha previstos**, **scroll containment**, **altura via `dvh` + `min-h-0**` e **density tokens** — sem virar design system gigante.

Escopo: somente `FocusMode.tsx`, `AutonomousDecisionLayer.tsx` e adições mínimas em `styles.css`. Sem mexer em store, tipos ou lógica.

---

## ETAPA 1 — Estabilização estrutural (executar primeiro, isolado)

Objetivo único: parar overlap, eliminar overflow, viewport previsível. Nada mais.

### `src/modules/prospecting/FocusMode.tsx`

1. **Container raiz** (~linha 250):
  `overflow-y-auto p-4 sm:p-8` → `overflow-y-auto px-4 sm:px-8 pt-8 pb-[calc(7rem+env(safe-area-inset-bottom))]` + `[scrollbar-gutter:stable]`.
2. **Grid principal** (linha 315):
  `lg:grid-cols-12` → `xl:grid-cols-12`. Coluna esquerda passa a `xl:col-span-8`, lateral `xl:col-span-4`.
3. **Cadeia `min-h-0`:**
  garantir `min-h-0` em: container raiz, wrapper de grid (linha 265), ambas as colunas (`lg:col-span-8/4`). Sem isso o `max-h` interno não funciona em flex children.
4. **Header "Prospecção Segura"** (linhas 318–350):
  - Remover os dois `absolute top-0 right-0`.  
  - Reescrever como `flex flex-wrap items-start justify-between gap-3` — chips "Modo Seguro" + "Xs análise" viram inline, descem por `flex-wrap` em telas estreitas.  
  - `p-8 rounded-[2.5rem]` → `p-5 sm:p-6 rounded-3xl`.
5. **Lateral (Educação + Abas)** (linhas 489–553):
  - Remover `h-full` do Card.  
  - `CardContent`: `max-h-[calc(100dvh-18rem)] overflow-y-auto [overscroll-behavior:contain] [scrollbar-gutter:stable]` (resolve seu ponto 1+5).  
  - Bloco Educação: `p-4` → `p-3`, fontes `text-[10px]` → `text-xs` (12px mínimo).

### `src/modules/prospecting/components/AutonomousDecisionLayer.tsx`

Compactação primeira passada (estabilizar):

- Card `p-10 gap-10` → `p-5 gap-4`.
- Badge "Hesitação" deixa de ser `absolute` — vira chip inline na linha do título.
- Mensagem `p-8 text-xl font-serif italic` → `p-3 text-sm leading-relaxed`.
- CTA `h-20 text-xl` → `h-11 text-sm`.
- Remover footer "Auditado em tempo real…".

**Validação ETAPA 1:** abrir 375 / 768 / 864 / 1280 / 1440 → zero overlap, zero overflow horizontal, CTA visível na dobra.

---

## ETAPA 2 — Reestruturar Decision Layer em 4 níveis hierárquicos

Substituir o card monolítico pela estrutura cockpit:

```text
[Nível A — AÇÃO]      ícone + título curto + CTA primário (h-11)
[Nível B — RISCO]     chips inline: confiança XX% · risco baixo/médio/alto
[Nível C — CONTEXTO]  mensagem (text-sm, 2–3 linhas máx, line-clamp-3)
[Nível D — DETALHES]  toggle "Ver detalhes" → racional, alternativas, what-if
                       (lazy: só monta quando aberto)
```

Mudanças concretas:

- Header: ícone `w-5 h-5` em caixa `p-2.5`. Título `text-lg font-semibold`. Eyebrow removida.
- Score: caixa única `px-3 py-1.5 rounded-xl`, número `text-2xl tabular-nums`.
- Linha B: chips canal/tipo/impacto em `text-[11px]` separados por `·`.
- Linha C: `<p className="text-sm leading-relaxed line-clamp-3">` (resolve ponto 4).
- Detalhes: `{isOpen && <Details/>}` — montagem condicional já é lazy mount efetivo.

### Estados de falha (seu ponto 6 — bloqueante antes de escalar)

Criar 3 sub-componentes no mesmo arquivo:

```tsx
<DecisionCardSkeleton />   // shimmer com mesma altura final (~360px)
<DecisionCardEmpty />      // "Nenhuma decisão disponível" + CTA "Recalcular"
<DecisionCardDegraded />   // "IA respondeu parcialmente" + dados disponíveis
```

Lógica de seleção no topo do `AutonomousDecisionLayer`:

- `decision === undefined` → Skeleton
- `decision === null` → Empty
- `!decision.readyMessage || !decision.recommendedChannel` → Degraded
- senão → card normal

Todos com a mesma altura aproximada para evitar layout shift.

---

## ETAPA 3 — Density tokens + breakpoints operacionais

### `src/styles.css` (adição mínima ao `:root`)

```css
--density: 1;                           /* standard 1280–1535 */
--space-card: calc(1.25rem * var(--density));
--space-stack: calc(1rem * var(--density));
--text-numeric: calc(1.5rem * var(--density));
```

Media queries adicionando overrides de `--density`:

- `< 768px`        → `--density: 0.85` (mobile)
- `768–1279px`    → `--density: 0.92` (operational compact — o caso 864px do print)
- `1280–1535px`   → `--density: 1`    (standard)
- `≥ 1536px`       → `--density: 1.08` (wide)

Aplicar nos cards de FocusMode/Decision com `p-[var(--space-card)]` apenas onde já existe `p-5/p-6` hardcoded. Não tocar em outros módulos nesta etapa.

### Tipografia padronizada (substituir `text-3xl/4xl/[9px]/[10px]`):

```text
H1 lead       text-2xl font-semibold       (nome empresa)
H2 card       text-base font-semibold      (título de card)
Body          text-sm
Eyebrow       text-xs uppercase tracking-wider text-muted-foreground
Numeric       text-2xl tabular-nums
```

---

## ETAPA 4 — Roadmap (registrado, não implementar agora)

Sem código nesta passada — apenas documentar intenção:

1. **Container queries** (`container-type: inline-size` + `@container`) nos cards IA, lateral e zonas de insight, quando o produto começar a ser embed/painéis modulares.
2. **Footer no fluxo** (`sticky bottom-0` dentro do layout em vez de `fixed`) — habilitar quando entrarem toasts/quick actions/floating actions.
3. **Auditoria virtualizada** (`react-virtual`) quando histórico passar de ~50 itens.
4. **Memoização agressiva** do `AutonomousDecisionLayer` (`React.memo` + selectors estáveis no store) — só após estabilizar layout.

---

## O que NÃO fazer agora (alinhado ao seu ponto)

- Sem novas microanimações, glow, gradients, widgets IA.
- Sem novo design system formalizado (spacing/typography como tokens globais).
- Sem mudar comportamento da store ou do pipeline de decisão.

---

## Ordem de execução e verificação

1. Aplicar ETAPA 1 inteira → testar 375/768/864/1280/1440 → confirmar 0 overlap.
2. Aplicar ETAPA 2 (hierarquia + estados de falha) → simular `decision = null` e `decision.readyMessage = ''` para validar Empty/Degraded.
3. Aplicar ETAPA 3 (density tokens + tipografia) → conferir que nenhum texto fica abaixo de 12px e que o card cabe na dobra em todos os breakpoints.
4. Marcar ETAPA 4 como issues de roadmap no `.lovable/plan.md`.

Critérios objetivos de aceite:

- Card "Ação Recomendada" ≤ 420px de altura na densidade standard.
- Lateral nunca ultrapassa `100dvh - 18rem` e tem scroll interno contido.
- Nenhum `absolute` carregando conteúdo crítico em nenhum dos dois arquivos.
- Footer fixo nunca cobre conteúdo (graças a `pb-[calc(7rem+safe-area)]`).
- Estados Skeleton/Empty/Degraded mantêm altura consistente (sem layout shift).

Refatore a experiência como um cockpit operacional assistido por IA.

Objetivos:

- ação primeiro

- contexto progressivo

- mínima fadiga visual

- densidade adaptativa

- previsibilidade estrutural

- tolerância a falhas parciais

Princípios:

- nenhum elemento crítico pode depender de absolute positioning

- nenhum card pode crescer indefinidamente

- conteúdo contextual deve colapsar automaticamente

- a UI deve permanecer utilizável em 864px

- estados partial/degraded devem parecer intencionais e premium

- scroll interno apenas quando inevitável

- priorizar estabilidade sobre espetáculo visual

Hierarquia obrigatória:

1. ação

2. confiança/risco

3. contexto

4. profundidade opcional

O produto deve parecer:

um sistema operacional de decisão assistida,

não uma dashboard sci-fi decorativa.
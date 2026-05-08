## Objetivo

Reorganizar a relação entre **Funil de Vendas (Pipeline)** e **Buscador de Leads** sem remover nenhuma funcionalidade — apenas redistribuir e refinar.

- **Pipeline** → Kanban minimalista, drag & drop puro, zero ações.
- **Buscador** → centraliza toda inteligência e ações na nova seção **"Ações & Inteligência"** dentro do card.
- **Ponte** → clicar num mini-card da pipeline abre o card completo do buscador num drawer.

---

## 1. `src/modules/prospecting/LeadPipeline.tsx` — reescrito

Reescrever o componente como Kanban minimalista:

- **Remover** as sub-abas internas (`Funil de Vendas` / `Prospecção` / `Solicitações`) e o estado `pipelineView`.
- Manter apenas 4 colunas fixas: `Novo`, `Qualificado`, `Interessado`, `Lead Fechado`.
- Criar componente interno `PipelineMiniCard` contendo APENAS:
  - Bolinha de prioridade (cor por `lead.opportunityLevel`: quente=rose+pulse, boa=emerald, média=amber, baixa=slate)
  - Nome da empresa (truncate)
  - Score numérico em chip pequeno colorido (≥80 rose, ≥60 amber, senão slate)
- Sem botões, sem dropdowns, sem badges de canal, sem chips de contato, sem footer, sem ações.
- Drag & drop continua funcionando (`onDragStart` setando `leadId`, drop chamando `onMoveLead`).
- Click/Enter no mini-card → `onEditLead(lead, 'overview')`.
- Props simplificadas: `{ leads, onMoveLead, onEditLead }` apenas.
- Cabeçalhos de coluna com ícone + nome + contador.

---

## 2. `src/modules/prospecting/LeadCard.tsx` — nova seção "Ações & Inteligência"

Manter integralmente a variante `comfortable`: header com avatar/nome/nicho/cidade, botões de histórico/dropdown, chips de **Contato & Site**, badge de status, badge de oferta, badge de prioridade máxima e bloco **Potencial de Venda**.

### 2.1 Inserir nova seção entre "Contato & Site" e "Potencial de Venda"

Card interno com aparência premium (`bg-slate-50/60 border border-slate-100 rounded-2xl p-4`) contendo, nesta ordem:

**(a) Cabeçalho discreto**
- Label `AÇÕES & INTELIGÊNCIA` em font-black/uppercase/tracking-widest com ícone Sparkles.

**(b) Chips de inteligência (dados reais)**
- **Análise IA**: `lead.socialDiscovery` existe → "Analisado" (emerald); senão → "Não analisado" (slate).
- **Contato**: derivado de `lead.status` + `lead.updatedAt`:
  - status em `['Novo','Lead Gerado']` → "Nunca contatado" (slate)
  - última atualização < 24h e status de envio → "Recente (<24h)" (emerald)
  - senão (status de envio/qualificado/etc) → "Contatado" (amber)
- **Último envio**: filtra `lead.statusNotes` mais recente cujo `status` contenha `WhatsApp`/`Email`/`Instagram`/`Cold Mail`. Renderiza "WhatsApp enviado há 2h" usando `formatDistanceToNow` (pt-BR). Sem registro → "Nenhum envio registrado".
- **Make**: existe nota com `kind: 'system'` cujo status seja de canal de envio → "Configurado" (violet); senão → "Não configurado" (slate).

**(c) Banner "Próxima ação sugerida"**
Função pura `suggestNextAction(lead)` no topo do arquivo, retornando `{ label, icon, action: 'site'|'social'|'make'|'pitch'|'diagnosis' }`:
1. `!lead.websiteUrl` → "Gerar proposta de site" (Layout)
2. `!lead.instagramHandle && !lead.socialDiscovery` → "Analisar Redes com IA" (SearchCode)
3. `lead.opportunityScore >= 80` && nunca contatado → "Enviar via Make" (Send)
4. `lead.socialDiscovery && !lead.generatedPitch` → "Criar Pitch" (MessageSquare)
5. default → "Atualizar diagnóstico" (Sparkles)

Renderizado como banner destacado: gradiente violeta→índigo, ícone grande à esquerda, label + microcopy "Recomendado pela IA", CTA seta à direita. `onClick` despacha o handler correspondente (`onGenerateSite`/`onDiscoverSocial`/`setMakeOpen(true)`/`onGeneratePitch`/`onViewDiagnosis`).

**(d) Ações secundárias** — barra horizontal com 3 botões-ícone (as 4 ações que não viraram principal). Cada um com tooltip via `title` e ícone colorido:
- Diagnóstico (Sparkles violet)
- Criar Pitch (MessageSquare primary)
- Analisar Redes (SearchCode emerald)
- Enviar via Make (Send violet)

Lógica: a ação que já é a "principal" não aparece duplicada; as outras 3 ficam na barra. Tudo respeita `e.stopPropagation()` para não abrir o drawer.

**(e) Histórico colapsável**
`<details>` nativo (fechado por padrão). Summary "Histórico recente" + chevron.
Conteúdo:
- Últimas 3 entradas de `lead.statusNotes` (data formatada, canal/status, snippet de até 80 chars).
- Última análise IA: `lead.socialDiscovery?.lastCheckedAt` (campo existente no tipo) formatado.
- Vazio em ambos → "Nenhum histórico registrado".

### 2.2 Limpeza do `CardFooter`

Remover do footer os 4 botões duplicados (Diagnóstico, Criar Pitch, Analisar Redes, Enviar via Make) + o divider "Ações Inteligentes". Funcionalidade preservada — todas migram para a nova seção.

Manter no footer **apenas** a barra de meta (Negociações/Anexos/Score), agora como `CardFooter` mais enxuto.

### 2.3 Variantes preservadas

`compact` e `ultra` permanecem como estão. A nova seção só renderiza na variante `comfortable`. Pipeline não usa mais `LeadCard` — passa a usar `PipelineMiniCard`.

---

## 3. `src/modules/prospecting/ProspectingPage.tsx` — pequenas adaptações

**3.1 Chamada do `<LeadPipeline />`**: passar somente `leads`, `onMoveLead={handleMoveLead}` e `onEditLead={handleEditLead}`. Remover os outros props.

**3.2 Aba "Visão Completa" no `LeadConfigDialog`**:
- Adicionar nova `TabsTrigger value="overview"` como **primeira** aba do `TabsList` (passa de 4 para 5 colunas no grid).
- Conteúdo da aba: renderiza `<LeadCard density="comfortable" lead={selectedLead} ... />` em modo "preview" — passa todos os handlers reais já existentes (`openSiteGen`, `openPitchGen`, `handleDiscoverSocial`, `moveLead`, `deleteLead`, `handleEditLead`) para que as ações continuem funcionando. Os campos editáveis das outras abas (Digital/Contato/Preview/Histórico) seguem inalterados.
- O `handleEditLead` recebe `initialTab` opcional → quando vier da pipeline com `'overview'`, abre direto na nova aba.

---

## 4. Veracidade (sem mock)

Toda a inteligência lê estritamente de campos já existentes em `ProspectLead`:
- `socialDiscovery` (existência + `lastCheckedAt`)
- `statusNotes` (filtro por canal + `kind: 'system'` para detectar Make)
- `status`, `updatedAt`, `websiteUrl`, `instagramHandle`, `opportunityScore`, `generatedPitch`

Quando faltar dado: labels explícitos "Não configurado" / "Sem registro" / "Não analisado" / "Nenhum histórico registrado". Zero simulação.

---

## 5. Arquivos afetados

| Arquivo | Mudança |
|---|---|
| `src/modules/prospecting/LeadPipeline.tsx` | Reescrito (Kanban minimalista + `PipelineMiniCard` interno) |
| `src/modules/prospecting/LeadCard.tsx` | + `suggestNextAction()`, + seção "Ações & Inteligência", footer limpo |
| `src/modules/prospecting/ProspectingPage.tsx` | Props da pipeline reduzidas, nova aba "Visão Completa" no dialog |

Sem mudanças em store, schema, backend, tipos ou banco. Nenhuma funcionalidade removida — apenas reorganizada.

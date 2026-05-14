# Handoff - Continuação do Projeto Market Whisperer

**Data**: 13/05/2026  
**Projeto**: remix-of-mvpmq (Market Whisperer - Plataforma de Prospecção B2B)  
**Stack**: TanStack Start + React + Supabase + Vite + Bun  
**Repo**: https://github.com/brboca02-ux/remix-of-mvpmq  
**Branch**: main (push direto, sem PR)

---

## Contexto do Projeto

Plataforma de prospecção e CRM para vendas B2B. Módulos principais:
- **Buscador**: Busca e importação de leads (Google Maps, Receita Federal CSV, etc.)
- **CRM**: Gestão de leads com pipeline de vendas
- **Análise**: Dashboard com métricas e inteligência competitiva
- **AI Consultor**: Assistente de vendas com IA

---

## O que foi feito (sessão atual)

### ✅ TASK 1: Inserção direta de leads no Supabase
- Criado `scripts/insert-leads-direct.ts` para inserir leads via CLI
- Parser content-based que detecta campos por padrão (não por posição fixa)
- **Resultado**: ~1889 leads importados com sucesso via UI (Lovable voltou)

### ✅ TASK 2: Fix do CSV Parser (172 → 1889 leads)
**Problema**: Arquivo Receita Federal (comma-delimited, 20+ campos, fantasia vazia) era detectado como "Google Maps format" → só 172 leads parseados.

**Correções em `src/lib/csv-smart-parser.ts`**:
1. `detectGoogleMapsFormat()` — Guard: se linha tem 10+ campos ou CNPJ → NÃO é Google Maps
2. `detectReceitaFederalFormat()` — Nova função: detecta por CNPJ (14 dígitos) ou MATRIZ/FILIAL
3. `parseReceitaFederalLine()` — Parser content-based: detecta campos por regex (CNPJ, telefone, UF, atividade CNAE, etc.) em vez de posição fixa
4. `mapByPosition()` — Removido `!cols[0]` que falhava quando fantasia era vazia
5. Cidade/Bairro — Corrigido ordem: formato é `CIDADE,BAIRRO,UF,CEP`

**Correção em `src/lib/csv-validator.ts`**:
- Adicionada detecção de Receita Federal ANTES da detecção Google Maps
- Quando detectado, retorna `valid: true` com headers virtuais e mensagem clara

### ✅ TASK 3: Infraestrutura de Produção (feito em sessão anterior)
- Monitoring (Sentry-compatible), Performance, Rate limiting, CI/CD
- CRM conectado ao Supabase, dados fake removidos
- Features "Em Desenvolvimento" implementadas (Creative Engine, Follow-up, Playbook, Active Learning)
- Enrichment providers (Hunter, BuiltWith, Apify, ScraperAPI)
- Import-protection errors corrigidos
- CRM limit aumentado para 2000 leads

---

## Estado Atual do Código

### Arquivos-chave modificados:
| Arquivo | Função |
|---------|--------|
| `src/lib/csv-smart-parser.ts` | Parser principal de CSV (Google Maps + Receita Federal + Standard) |
| `src/lib/csv-validator.ts` | Validação pré-import (encoding, delimiter, formato) |
| `src/lib/leads-parser.ts` | Wrapper que chama smartParseCsv + normalizeLead |
| `src/lib/leads-shared.ts` | Interface StandardLead + normalizeLead + identity_hash |
| `scripts/insert-leads-direct.ts` | Script CLI para inserção direta no Supabase |

### Arquitetura do Import:
```
UI (import dialog) 
  → csv-validator.ts (detecta formato, mostra preview)
  → leads-parser.ts → smartParseCsv() 
    → detecta delimiter (pipe/semi/tab/comma)
    → se comma: detectReceitaFederalFormat() → parseReceitaFederalLine()
    → se comma: detectGoogleMapsFormat() → parseGoogleMapsLine()
    → se comma + headers: mapWithHeaders()
    → se comma + sem headers: mapByPosition()
  → normalizeLead() (identity_hash, confidence_score)
  → Supabase upsert (leads_import table, onConflict: identity_hash)
```

---

## Regras Importantes

1. **Lovable está fazendo mudanças simultâneas** — SEMPRE `git pull` antes de `git push`
2. **Push direto na main** — Usuário é dev solo, sem PR
3. **Usar `--no-verify`** nos commits (husky hooks podem falhar)
4. **NUNCA commitar `.env`** — Contém API keys reais
5. **Import protection**: Componentes client NÃO podem importar de `src/server/`. Usar `createServerFn()` como bridge.
6. **Tudo deve ser REAL** — Sem mock data, sem fake responses
7. **Idioma**: Português (Brasil) para comunicação com o usuário

---

## Credenciais (.env)

**⚠️ ATENÇÃO**: O arquivo `.env` contém API keys reais. NUNCA commitar no git.

- `SUPABASE_URL`: https://jjhqgsaxngxrghwqgukd.supabase.co
- `SUPABASE_PUBLISHABLE_KEY`: Anon key (já no .env)
- `SUPABASE_SERVICE_ROLE_KEY`: ⚠️ NÃO está no .env local (configurado apenas na Lovable)
- `APIFY_API_TOKEN`: Token da Apify (enrichment)
- `BUILTWITH_API_KEY`: Token da BuiltWith (tecnologias)
- `HUNTER_API_KEY`: Token da Hunter (encontra emails)
- `SCRAPER_API_KEY`: Token da ScraperAPI (web scraping)

**Verificar `.env.example` para estrutura completa.**

---

## Possíveis Próximos Passos

1. **Enrichment real**: Conectar os providers (Hunter, BuiltWith, Apify) para enriquecer leads importados com email, site, tecnologias
2. **CRM pipeline**: Melhorar o fluxo de vendas (kanban, follow-up automático)
3. **WhatsApp integration**: Export de leads para campanhas WhatsApp
4. **Filtros avançados no Buscador**: Por porte, atividade, capital social, cidade
5. **Dashboard de métricas**: Conversão, leads por nicho, ROI por fonte

---

## Comandos Úteis

```bash
# Dev server
bun run dev

# Build
bun run build

# Rodar script de inserção direta (precisa SUPABASE_SERVICE_ROLE_KEY no .env)
npx tsx scripts/insert-leads-direct.ts caminho/para/arquivo.txt

# Git workflow
git pull origin main --no-rebase --no-edit
git add <files>
git commit --no-verify -m "mensagem"
git push
```

---

## Formato do Arquivo Receita Federal

O arquivo do usuário (`01042026.txt`, ~1889 linhas, ~484KB) é comma-delimited:

```
FANTASIA,TELEFONE,RAZAO_SOCIAL,CNPJ,CAPITAL,TIPO,PORTE,ATIVIDADE,STATUS,DATA,...,LOGRADOURO,NUMERO,COMPLEMENTO,CIDADE,BAIRRO,UF,CEP,...
```

- Primeiro campo (fantasia) frequentemente VAZIO → linha começa com `,`
- CNPJ: 14 dígitos puros
- TIPO: "MATRIZ" ou "FILIAL"
- PORTE: "01" (micro), "03" (pequena), "05" (demais)
- ATIVIDADE: formato CNAE "XXXXXXX - Descrição"
- STATUS: "ATIVA", "BAIXADA", "INAPTA"
- Endereço no final: ...,CIDADE,BAIRRO,UF,CEP,...

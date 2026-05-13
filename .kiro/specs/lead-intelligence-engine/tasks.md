# Implementation Plan: Lead Intelligence Engine

## Overview

Este plano converte o design do **Lead Intelligence Engine (LIE)** em passos incrementais de codificação que podem ser executados por um agente de código. A estratégia é:

1. **Fundação primeiro** (tipos, scoring puro, codec, validator) — testável em isolamento, sem I/O.
2. **Infraestrutura de dados** (migrations, pools, créditos, cache, rate limit) — base para todos os enrichers.
3. **Enrichers** em paralelo (CNPJ, email, site, social, reviews, competitors, advanced) — cada um com fonte primária + fallback.
4. **Orquestrador** une as fontes, calcula scores unificados e persiste.
5. **Cliente + Store + UI** integram ao módulo `/prospecting` existente sem breaking changes.
6. **Automação de prospecção** (WhatsApp, cold email, rotas) consome os dados enriquecidos.

Linguagem: **TypeScript** (React + Vite + Supabase + Zustand, já configurados). Biblioteca de PBT: `fast-check` (a ser adicionada em 1.1). Não existe código orfão — cada componente é integrado ao fluxo existente ao final de sua fase.

Todas as propriedades citadas referem-se à seção **Correctness Properties** do `design.md`. Requisitos referem-se ao `requirements.md`.

## Tasks

- [ ] 1. Fundação: estrutura, tipos e dependências
  - [x] 1.1 Criar estrutura de pastas e instalar `fast-check`
    - Criar `src/modules/prospecting/intel/`, `src/modules/prospecting/intel/__tests__/`, `src/modules/prospecting/intel/components/`
    - Criar `supabase/functions/` (raiz das edge functions): `enrichment-orchestrator/`, `email-discovery/`, `competitor-analyzer/`, `review-analyzer/`, `cnpj-enricher/`, `social-enricher/`, `website-analyzer/`, `advanced-data-integrator/`, `api-key-pool-manager/`
    - Adicionar `fast-check` e `msw` como devDependencies no `package.json`
    - _Requirements: 14.6, 14.7_

  - [ ] 1.2 Definir `intelligence-types.ts` com todos os tipos do LIE
    - Implementar `ConfidenceLevel`, `IdentityStatus`, `FieldConfidence<T>`, `ComputedScores`, `ScoreHistoryEntry`
    - Implementar `DigitalMaturity`, `VulnerabilityFinding`, `TimingSignals`, `CnpjEnrichmentResult`, `EmailDiscoveryResult`, `DiscoveredEmail`
    - Implementar `Competitor`, `CompetitorAnalysis`, `AnalyzedReview`, `ReviewAnalysis`, `SalesIntelligence`, `LeadIntelligence`
    - Implementar `EnrichmentSource`, `EnrichmentRequest`, `EnrichmentPreview`, `EnrichmentResult`, `JobProgress`
    - _Requirements: 4.1-4.10, 5.1-5.10, 7.1-7.8, 8.1-8.8, 20.1-20.12_

  - [ ] 1.3 Estender `ProspectLead` com campo opcional `intelligence`
    - Adicionar `declare module './types'` em `intelligence-types.ts` injetando `intelligence?: LeadIntelligence`
    - Atualizar `src/modules/prospecting/types.ts` com `import type { LeadIntelligence }` e re-export
    - Garantir zero breaking changes: todos os campos atuais permanecem intactos
    - _Requirements: 14.1, 14.2_

  - [ ] 1.4 Criar arbitraries reutilizáveis para property tests
    - Arquivo `intel/__tests__/arbitraries.ts`
    - Exportar `arbConfidenceLevel`, `arbIdentityStatus`, `arbISODate`, `arbPhone`, `arbCNPJ`, `arbURL`
    - Exportar `arbScoreInputs`, `arbDigitalMaturityInputs`, `arbVulnerabilityInputs`, `arbTimingInputs`
    - Exportar `arbLead`, `arbCompetitor`, `arbReview`, `arbLeadIntelligence`, `arbApiKeyPool`
    - Exportar const `PROP_CONFIG = { numRuns: 100, verbose: true }`
    - _Requirements: 20.1-20.12_

- [ ] 2. Scoring engine (puro, sem I/O)
  - [ ] 2.1 Implementar cálculos de score individuais em `scoring-engine.ts`
    - `calculateDigitalMaturityScore(inputs)`: pondera website, SEO, redes, frequência, ads; retorna `0-100`
    - `calculateVulnerabilityScore(inputs)`: pondera vulnerabilidades por severidade (crítica/alta/média/baixa)
    - `calculateTimingScore(inputs)`: pondera idade, crescimento de seguidores/reviews, expansão, menções
    - `calculateDataConfidenceScore(inputs)`: 30% completude + 25% recência + 25% concordância + 20% fonte
    - `calculateSentimentScore(reviews)`: `round(100 * positives / total)`
    - `calculateCompetitivePressureScore(competitors)`: baseado em maturidade média
    - _Requirements: 2.8, 3.7, 5.1-5.5, 6.6, 7.2-7.5, 23.11, 24.7_

  - [ ]* 2.2 Write property test for score bounds
    - **Property 1: Score Bounds**
    - **Validates: Requirements 2.8, 3.7, 5.1, 6.6, 7.1, 20.1-20.5, 23.11, 24.7**

  - [ ]* 2.3 Write property test for score monotonicity
    - **Property 2: Score Monotonicity**
    - **Validates: Requirements 2.8, 3.7, 6.2-6.6, 7.2-7.5, 23.11**

  - [ ] 2.4 Implementar `calculateLeadScore` unificado e `categorizeScore`
    - `calculateLeadScore`: 25% maturity + 30% vulnerability + 25% timing + 20% engagement
    - `categorizeScore(score, scheme)`: "Baixa"/"Média"/"Alta"/"Muito Alta" para `opportunity`, "Inexistente/Básica/..." para `maturity`, "Frio/Morno/..." para `timing`, "unknown/low/medium/high" para `confidence`
    - _Requirements: 2.9, 5.6, 6.7, 7.1, 7.6_

  - [ ]* 2.5 Write property test for score categorization totality
    - **Property 3: Score Categorization Totality**
    - **Validates: Requirements 2.9, 5.6, 6.7, 7.6**

- [ ] 3. Confidence calculator (puro)
  - [ ] 3.1 Implementar `confidence-calculator.ts`
    - `aggregateField<T>(observations, equals)`: agrega múltiplas fontes respeitando `source_trust` e concordância
    - `degradeByAge(level, ageMs)`: rebaixa um nível quando `ageMs >= 90d`, mantém quando `< 90d`
    - `confidenceWeight(level)`: mapeia para `0-1` (`unknown=0`, `low=0.33`, `medium=0.66`, `high=1`)
    - Regra: quando 2+ fontes discordam, resultado é `low` no máximo
    - _Requirements: 5.4, 5.7, 5.8, 5.9, 5.10_

  - [ ]* 3.2 Write property test for confidence monotonicity on agreement
    - **Property 7: Confidence Monotonicity on Agreement**
    - **Validates: Requirements 5.4, 5.7, 5.8**

  - [ ]* 3.3 Write property test for confidence age degradation
    - **Property 8: Confidence Age Degradation**
    - **Validates: Requirement 5.9**

  - [ ]* 3.4 Write property test for field observability
    - **Property 9: Field Observability**
    - **Validates: Requirements 1.7, 22.10, 25.14**

- [ ] 4. Lead codec (parser + pretty printer)
  - [ ] 4.1 Implementar `lead-codec.ts` com parse/serialize para CSV, JSON, TXT
    - `parseLeads(input, opts)`: suporta `csv` (via papaparse já instalado), `json` (schema validation via zod), `txt` (regex customizável)
    - `serializeLeads(leads, opts)`: mesmo conjunto de formatos, indentação configurável, seleção de campos
    - Detectar encoding (UTF-8, ISO-8859-1) no parse
    - Reportar erros com `{ line, field, message }`
    - _Requirements: 17.1-17.8, 18.1-18.7, 19.1-19.7_

  - [ ] 4.2 Implementar `normalizePhone` e `normalizeAddress`
    - `normalizePhone(raw)`: retorna `+55DDNNNNNNNNN` ou `null` se inválido
    - `normalizeAddress(raw)`: remove caracteres especiais, normaliza espaços, preserva acentos
    - _Requirements: 18.5, 18.6_

  - [ ]* 4.3 Write property test for codec round-trip
    - **Property 5: Codec Round-Trip**
    - **Validates: Requirements 17.1-17.8, 18.1-18.8, 19.1-19.7**

  - [ ]* 4.4 Write unit tests for codec edge cases
    - CSV com aspas/escape, JSON aninhado, TXT com linhas vazias, encoding ISO-8859-1, erros de parse reportados por linha/campo
    - _Requirements: 17.7, 18.4_

- [ ] 5. Validator de LeadIntelligence
  - [ ] 5.1 Implementar `validator.ts` em `intel/`
    - `validate(candidate): ValidationResult` — checa ranges `[0,100]`, enums, URLs parseáveis, timestamps ISO 8601, valores monetários `>= 0`
    - Retornar lista detalhada de erros quando inválido
    - _Requirements: 20.1-20.12_

  - [ ]* 5.2 Write property test for validator rejection completeness
    - **Property 18: Validator Rejection Completeness**
    - **Validates: Requirements 20.1-20.12**

- [ ] 6. Checkpoint — Fundação pronta
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Schema do banco (migrations Supabase)
  - [ ] 7.1 Migration `leads_enriched` com índices e RLS
    - Criar tabela com `lead_id PK → prospect_leads(id) CASCADE`, todos os scores com `CHECK [0,100]`, `intelligence JSONB NOT NULL`
    - Índices: `user_id`, `lead_score DESC`, `timing_score DESC`, `data_confidence`, `identity_status`, GIN em `intelligence`
    - RLS habilitado com policy `auth.uid() = user_id`
    - _Requirements: 14.3, 20.1-20.12_

  - [ ] 7.2 Migrations de pools: `api_key_pools`, `api_keys`, `api_key_usage_log`
    - `api_key_pools` com `service UNIQUE`, `rotation_strategy CHECK`, `paid_fallback_key_encrypted`
    - `api_keys` com `key_encrypted` (pgp_sym_encrypt via pgcrypto), status enum, `circuit_open_until`
    - `api_key_usage_log` append-only com índices por `key_id` e `service` + `called_at DESC`
    - _Requirements: 22.1-22.3, 25.1-25.5_

  - [ ] 7.3 Migrations de créditos: `enrichment_credits`, `enrichment_credit_transactions`
    - `enrichment_credits` com `balance >= 0`, `reserved >= 0`, `monthly_allowance`
    - `enrichment_credit_transactions` append-only com `delta`, `reason`, `job_id`
    - RLS `auth.uid() = user_id`
    - _Requirements: 26.7, 26.12_

  - [ ] 7.4 Migrations de jobs e auditoria: `enrichment_jobs`, `data_sources_log`
    - `enrichment_jobs` com status enum, contadores, `errors JSONB`, índice `user_id, status, created_at DESC`
    - `data_sources_log` append-only com `field_name`, `source`, `source_trust`, `confidence`, `raw_response`
    - _Requirements: 1.7, 13.1-13.8, 21.1-21.8, 25.14_

  - [ ] 7.5 Migrations de caches com TTL: `cnpj_cache`, `email_discovery_cache`, `competitor_cache`, `review_sentiment_cache`
    - TTL: 90d / 30d / 7d / 14d respectivamente
    - Índices em `expires_at` para cleanup via pg_cron
    - _Requirements: 15.5, 22.12, 23.12, 24.11_

  - [ ] 7.6 Migration `enrichment_approvals` + cron de manutenção
    - `enrichment_approvals` com `scope IN ('one-time','session','always')`, `expires_at`, `revoked_at`
    - Job pg_cron/edge scheduled para limpar caches expirados e resetar `api_keys.quota_used` por `quota_reset_at`
    - _Requirements: 22.4, 25.13, 26.1-26.2_

- [ ] 8. Serviço de créditos (transacional)
  - [ ] 8.1 Implementar `credit-service.ts` na edge `api-key-pool-manager/` (ou nova `credit-manager/`)
    - `reserveCredits(userId, n)`: `SERIALIZABLE` transaction, incrementa `reserved`, checa `balance >= reserved`
    - `commitCredits(userId, n, jobId)`: debita `balance` e decrementa `reserved`, grava transaction log
    - `rollbackCredits(userId, n)`: apenas decrementa `reserved`
    - `refillCredits(userId, n, reason)`: incrementa `balance`, grava transaction log
    - _Requirements: 26.7, 26.12_

  - [ ]* 8.2 Write property test for credit balance invariants
    - **Property 20: Credit Balance Invariants**
    - **Validates: Requirements 26.7, 26.12**

- [ ] 9. API Key Pool Manager (edge function)
  - [ ] 9.1 Implementar `getNextApiKey` e `incrementQuotaUsed`
    - `getNextApiKey(pool)`: aplica estratégia `round-robin` | `least-used` | `random`, filtra `status='active'` com quota disponível, exclui `circuit_open`
    - `incrementQuotaUsed(keyId)`: UPDATE atômico, respeita `quota_limit`; retorna `quota_exceeded` se estourado
    - Descriptografar `key_encrypted` apenas em memória; nunca logar valor
    - _Requirements: 22.1-22.3, 25.1-25.5_

  - [ ] 9.2 Implementar circuit breaker por key
    - `openCircuit(keyId, durationMs=15*60_000)`: seta `status='circuit_open'` e `circuit_open_until`
    - Abrir após 3 falhas 429 consecutivas; half-open após `openDurationMs`; fechar após 1 sucesso
    - _Requirements: 25.16_

  - [ ] 9.3 Aprovação de fonte paga via `enrichment_approvals`
    - `checkApproval(userId, service)`: retorna approval ativo (não revogado, não expirado) ou `null`
    - `requestPaidApproval(userId, service, scope)`: cria registro em `enrichment_approvals`
    - Pool retorna `null` → orquestrador checa approval → se ausente, resposta tem `requiresApproval: true`
    - _Requirements: 22.4, 25.13, 26.1, 26.2_

  - [ ]* 9.4 Write property test for pool rotation and quota enforcement
    - **Property 11: Pool Rotation Fairness and Quota Enforcement**
    - **Validates: Requirements 22.1-22.3, 25.1-25.5, 26.12**

  - [ ]* 9.5 Write property test for paid source approval gate
    - **Property 12: Paid Source Approval Gate**
    - **Validates: Requirements 22.4, 25.13, 26.1, 26.2**

- [ ] 10. Cache layer unificado
  - [ ] 10.1 Implementar helper `cache-client.ts` em `intel/` (browser) e edge helper em `supabase/functions/_shared/cache.ts`
    - `getCache<T>(table, key)`: retorna `T | null`, respeitando `expires_at > now()`
    - `setCache<T>(table, key, payload, ttl)`: upsert com `expires_at = now() + ttl`
    - Chaves: hash determinístico (SHA-256 hex) de entrada normalizada
    - _Requirements: 15.5, 22.12, 23.12, 24.11_

  - [ ]* 10.2 Write property test for cache consistency
    - **Property 13: Cache Consistency**
    - **Validates: Requirements 15.5, 22.12, 23.12, 24.11**

- [ ] 11. Rate limit e backoff helpers
  - [ ] 11.1 Implementar `scrapeWithRateLimit` e `fetchWithBackoff` em `supabase/functions/_shared/rate-limit.ts`
    - `fetchWithBackoff(fn, { baseDelay, maxDelay, maxRetries, backoffMultiplier })`: retry em 5xx/429, backoff exponencial
    - `rateLimit(windowMs, maxRequests)`: token bucket em memória por key
    - Delay aleatório entre chamadas: `[minDelay, maxDelay]` para scraping
    - _Requirements: 15.6, 25.16_

  - [ ]* 11.2 Write property test for rate limit and backoff
    - **Property 14: Rate Limit and Backoff**
    - **Validates: Requirements 15.6, 25.16**

- [ ] 12. Checkpoint — Infraestrutura pronta
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 13. CNPJ Enricher (edge function)
  - [ ] 13.1 Implementar `cnpj-enricher/index.ts` com BrasilAPI como fonte primária
    - `enrichByCnpj(cnpj)`: normaliza CNPJ, consulta `cnpj_cache` (TTL 90d); cache miss → BrasilAPI
    - Extrair `razaoSocial`, `nomeFantasia`, `dataAbertura`, `porte`, `cnaePrincipal`, `atividadeEconomica`, `enderecoCompleto`, `situacaoCadastral`
    - Calcular `ageMonths` a partir de `dataAbertura`
    - _Requirements: 4.1-4.6, 15.1, 15.5_

  - [ ] 13.2 Implementar fallback ReceitaWS + separação identity/data confidence
    - Se BrasilAPI falhar → tentar ReceitaWS; registrar ambos em `data_sources_log`
    - `identity_status`: `verified` se CNPJ retornou, `invalid_cnpj` se 400/inválido, `not_found` se 404
    - `data_confidence`: `high` se todos campos presentes, `medium` se parciais, `low` se só identidade
    - Marcar `field_confidence` individual em cada campo de `CnpjEnrichmentResult`
    - _Requirements: 4.7-4.10, 15.7, 20.6, 20.7, 20.8_

  - [ ]* 13.3 Write property test for identity/data confidence independence
    - **Property 6: Identity and Data Confidence Independence**
    - **Validates: Requirements 4.7, 4.8, 4.9, 4.10, 20.6-20.8**

- [ ] 14. Email Discovery (edge function)
  - [ ] 14.1 Implementar `email-discovery/index.ts` com cascata Hunter → Snov → Apollo via pool
    - Para cada provider: `getNextApiKey` → chamar API → se sucesso, `incrementQuotaUsed` e cachear
    - Priorizar emails genéricos (`contato@`, `vendas@`) sobre pessoais quando múltiplos retornados
    - Cache 30d em `email_discovery_cache`
    - _Requirements: 22.1-22.4, 22.10, 22.11, 22.12_

  - [ ] 14.2 Implementar fallback scraping + padrões comuns
    - `scrapeWebsiteForEmails(url)`: busca na página de contato, `contato`, `about`, `footer`
    - `generateCommonEmailPatterns(lead)`: gera `contato@`, `vendas@`, `{firstname}@`, `{firstname}.{lastname}@`
    - `verifyEmail(email)`: regex de formato + EmailListVerify API (opcional) ou SMTP ping
    - Marcar `email_confidence`: `high` (verificado), `medium` (inferido por scraping), `low` (padrão comum)
    - _Requirements: 22.5, 22.6, 22.7, 22.8, 22.9_

- [ ] 15. Website Analyzer (edge function)
  - [ ] 15.1 Implementar `website-analyzer/index.ts` com PageSpeed Insights
    - Detectar presença de website a partir de `websiteUrl` ou Google Places
    - PageSpeed API: capturar `performance score`, `FCP`, `LCP`, `speedMs`
    - SEO básico: parsear HTML para `<title>`, `<meta description>`, `<h1>`, alt text em imagens
    - Cache 7d
    - _Requirements: 1.5, 2.1, 2.2, 2.4, 15.3, 15.4_

  - [ ] 15.2 Detecção de tecnologias via Wappalyzer/BuiltWith pools
    - Pool BuiltWith (5 contas) para detecção de stack
    - Pool Wappalyzer (10 contas) como fallback
    - Registrar tecnologias como `FieldConfidence<string[]>`
    - _Requirements: 2.3, 25.1, 25.2_

- [ ] 16. Social Enricher (edge function)
  - [ ] 16.1 Implementar `social-enricher/index.ts` com Apify Instagram + Facebook
    - Pool Apify Instagram: extrair `handle`, `url`, `followers`, `lastPostAt`, `postFrequencyPerMonth`
    - Pool Apify Facebook: extrair URL, likes, last post
    - Respeitar rate limits (100 perfis/dia por conta Instagram, 50 Facebook)
    - Cache 3d em `email_discovery_cache` (usar novo cache se necessário) ou inline via `leads_enriched.intelligence`
    - _Requirements: 1.2, 1.3, 2.5, 2.6, 25.3, 25.5_

  - [ ] 16.2 Discovery e normalização de URLs de redes sociais
    - Normalizar handles (`@nome` → `nome`), validar URLs
    - Detectar LinkedIn via scraping público (sem Apify paga)
    - _Requirements: 1.2, 1.3, 2.5, 20.9_

- [ ] 17. Review Analyzer (edge function)
  - [ ] 17.1 Implementar `review-analyzer/index.ts` capturando reviews do Google Places
    - Fetch até 50 reviews mais recentes via Google Places API
    - Cache 14d em `review_sentiment_cache` por `place_id`
    - _Requirements: 24.1, 24.11_

  - [ ] 17.2 Análise de sentimento via Gemini + extração de temas
    - Chamar Gemini (serviço já configurado em `pitch-generator`) com prompt estruturado
    - Saída: `sentiment: positive|neutral|negative`, `themes[]`, `mentionsCompetitor?`
    - Extrair `painPoints` (até 10), `strengths` (até 10), `recurringThemes[]`
    - Calcular `sentimentScore = round(100 * positives / total)`, `trend: improving|declining|stable`
    - Gerar `reviewInsight` para pitch
    - Processar em background para não bloquear outros enrichers
    - _Requirements: 24.2-24.12_

  - [ ]* 17.3 Write property test for review analysis bounds
    - **Property 22: Review Analysis Bounds**
    - **Validates: Requirements 24.1, 24.3-24.7**

- [ ] 18. Competitor Analyzer (edge function)
  - [ ] 18.1 Implementar `competitor-analyzer/index.ts` com Google Places nearby search
    - Buscar até 20 concorrentes no mesmo nicho em raio 5km (configurável)
    - Calcular `leadRanking` (por rating e review count)
    - Classificar `threats` (rating > lead) e `opportunities` (rating < lead)
    - _Requirements: 23.1-23.5, 23.9_

  - [ ] 18.2 Cálculos agregados e `competitive_insight`
    - `nicheAverage`: `rating`, `reviewCount`
    - `digitalGap`: `% com website`, `% com Instagram`
    - `competitivePressureScore` via `calculateCompetitivePressureScore`
    - Gerar `competitiveInsight` textual (ex: "3 de 5 concorrentes já investem em marketing digital")
    - Cache 7d em `competitor_cache` por `hash(niche+geohash+radius)`
    - _Requirements: 23.6-23.12_

  - [ ]* 18.3 Write property test for competitor analysis constraints
    - **Property 21: Competitor Analysis Constraints**
    - **Validates: Requirements 23.1-23.5**

- [ ] 19. Advanced Data Integrator (edge function)
  - [ ] 19.1 Implementar `advanced-data-integrator/index.ts` com scraping governamental
    - Portal da Transparência: detectar empresas que vencem licitações por CNPJ
    - Jucesp/Jucerja: scraping básico de dados estaduais (quando público)
    - ViaCEP: enriquecer endereço por CEP
    - IBGE API: dados demográficos (renda média, população) por município
    - _Requirements: 25.6-25.9_

  - [ ] 19.2 Rotação de proxies e anti-detecção
    - Configurar pools de proxy (Bright Data residencial, ScraperAPI datacenter) via Supabase secrets
    - `getRandomHeaders`: rotação de User-Agent, Accept-Language, etc
    - Rate limit + delays aleatórios entre requests
    - Circuit breaker por proxy em 403/407
    - _Requirements: 25.11, 25.12, 25.16_

  - [ ] 19.3 Feature flag `ENABLE_ALTERNATIVE_SOURCES` para bases não-oficiais
    - Configurar flag ambiente `ENABLE_ALTERNATIVE_SOURCES=false` por padrão
    - Interfaces `TelegramDataSource` e `LeakedDatabase` apenas como contrato — sem conectores executáveis em produção
    - Aviso legal obrigatório na UI antes do primeiro uso se habilitado
    - Toda fonte alternativa marca `source_trust <= 0.5` e `confidence: low` por padrão
    - _Requirements: 25.10, 25.14_

- [ ] 20. Sales Intelligence Generator
  - [ ] 20.1 Implementar `sales-intelligence/index.ts` (edge function) com Gemini
    - Input: `LeadIntelligence` consolidada; output: `SalesIntelligence`
    - `painPoints` (até 5) derivados de vulnerabilities + review painPoints
    - `personalizedOffers` (até 3) com `headline`, `description`, `estimatedValue`, `addresses[]`
    - `likelyObjections` (até 5) categorizadas em `price|timing|trust|need` com resposta sugerida
    - `closingProbability` 0-100 e `estimatedDealValue` baseado em porte e nicho
    - _Requirements: 8.1, 8.2, 8.6, 8.7, 8.8, 12.1-12.5_

  - [ ] 20.2 Gerar `approachScripts` para 3 canais + `bestContactWindow` + `bestChannel`
    - `approachScripts.whatsapp`, `.email.{subject, body}`, `.inPerson`
    - `bestContactWindow` por heurística de nicho
    - `bestChannel` baseado em presença digital (se tem Instagram ativo → Instagram, senão WhatsApp)
    - _Requirements: 8.3, 8.4, 8.5_

  - [ ]* 20.3 Write property test for intelligence output structure
    - **Property 23: Intelligence Output Structural Invariants**
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.8**

- [ ] 21. Checkpoint — Enrichers e fontes prontas
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 22. Enrichment Orchestrator (edge function)
  - [ ] 22.1 Implementar `enrichment-orchestrator/index.ts` com fan-out paralelo
    - `Promise.allSettled` sobre as `EnrichmentSource` solicitadas
    - Para cada fonte: cache L2 → pool → fallback cascata → persist + log
    - Advisory lock Postgres: `pg_try_advisory_lock(hashtext(lead_id))` — segundo job retorna `skipped`
    - _Requirements: 1.1, 1.6, 1.8, 13.1-13.5, 14.4_

  - [ ] 22.2 Merge, scoring e persistência
    - Consolidar `SourceResult[]` em `LeadIntelligence`
    - Chamar funções de scoring (client-side ou replicadas em edge) para compor `ComputedScores`
    - Atualizar `scoreHistory` com entry `{ at, scores, reason }`
    - `UPSERT leads_enriched` + `INSERT data_sources_log` por campo
    - _Requirements: 1.6, 1.7, 7.7, 7.8, 14.3, 14.5_

  - [ ] 22.3 Gestão de créditos e aprovações
    - Antes de executar: `reserveCredits(userId, totalCost)`; se insuficiente → `blockedReason='insufficient_credits'`
    - Ao final: `commitCredits` se sucesso parcial ou total, `rollbackCredits` se 100% falhas de fontes pagas
    - Checar `approvalToken` para fontes que requerem aprovação; se ausente, retornar `status='quota_exceeded', requiresApproval:true`
    - _Requirements: 22.4, 26.6, 26.7, 26.12_

  - [ ] 22.4 Emissão de eventos e logs estruturados
    - Emitir `enrichment.started`, `enrichment.progress`, `enrichment.completed`, `enrichment.failed`, `intelligence.updated` (via Supabase Realtime channel)
    - Logs estruturados com `leadId`, `jobId`, etapa, tempo, status HTTP, stack trace completo em erros
    - Níveis `debug|info|warn|error` controlados por `LOG_LEVEL`
    - _Requirements: 21.1-21.8_

  - [ ]* 22.5 Write property test for score idempotency
    - **Property 4: Score Idempotency**
    - **Validates: Requirements 7.7, 15.5**

  - [ ]* 22.6 Write property test for orchestrator fault tolerance
    - **Property 10: Orchestrator Fault Tolerance**
    - **Validates: Requirements 1.8, 15.7, 25.15**

- [ ] 23. Intelligence Client (browser)
  - [ ] 23.1 Implementar `intelligence-client.ts` como wrapper sobre edge functions
    - `enrichAuto(leadId)`, `enrichOnDemand(req)`, `getEnrichmentPreview(leadId, sources)`
    - `getQuotaDashboard()`, `cancelJob(jobId)`, `retryFailedLeads(jobId)`
    - Autenticação via sessão Supabase existente
    - _Requirements: 13.3, 13.4, 13.8, 16.1-16.10, 26.1-26.12_

  - [ ] 23.2 Subscribe via Supabase Realtime para progress updates
    - `subscribeJobProgress(jobId, onUpdate)`: canal Realtime para `enrichment_jobs` filtrado por `id`
    - Retornar função `Unsubscribe`
    - _Requirements: 13.3, 13.6, 13.7_

- [ ] 24. Integração com `prospecting-store`
  - [ ] 24.1 Estender state do store com `intelligenceJobs` e `enrichmentCredits`
    - Adicionar `intelligenceJobs: Record<string, JobProgress>` e `enrichmentCredits: number` sem remover campos existentes
    - Selectors: `selectJobsByLead`, `selectCreditsBalance`
    - _Requirements: 14.3, 14.4_

  - [ ] 24.2 Implementar actions: `startEnrichment`, `cancelEnrichmentJob`, `applyIntelligenceUpdate`
    - `startEnrichment(leadId, mode, sources)`: chama `intelligence-client`, subscribe no progress
    - `cancelEnrichmentJob(jobId)`
    - `applyIntelligenceUpdate(leadId, intel)`: chama `updateLead(leadId, { intelligence })` preservando audit log
    - _Requirements: 13.4, 14.3, 14.4, 14.5_

- [ ] 25. Importação de TXT (estetica.txt)
  - [ ] 25.1 Implementar parser TXT com regex customizável em `lead-codec.ts`
    - Padrão default para `estetica.txt`: capturar `nome`, `telefone`, `rating`, `reviews`, `categoria`, `endereço`
    - `fieldMap` permite mapeamento customizado
    - Reportar erros de parsing com linha e campo
    - _Requirements: 17.1-17.8_

  - [ ] 25.2 Validação e criação de leads com status "Novo"
    - Validar campos obrigatórios (nome + telefone ou email)
    - Chamar `createLead` do store com `source: 'import_txt'`
    - Disparar `enrichAuto` para leads com score inicial > 70
    - _Requirements: 17.3, 17.4, 17.5_

- [ ] 26. WhatsApp Dispatcher
  - [ ] 26.1 Implementar `whatsapp-dispatcher.ts` em `intel/`
    - `buildWhatsappLink(phone, msg)`: monta `https://wa.me/{phone}?text={encoded}` com normalização de telefone
    - `parseWhatsappLink(url)`: extrai `{ phone, msg }` de volta
    - Validar telefone via `normalizePhone`; se inválido, marcar lead `status='review_manual'`
    - _Requirements: 10.1, 10.2, 10.7_

  - [ ] 26.2 Batch dispatch com intervalo configurável
    - `dispatchBatch(leads, intervalMs, onSent)`: envia mensagens com `setTimeout` respeitando `intervalMs` entre consecutivas
    - Marcar lead `status='WhatsApp Enviado'` após disparo; registrar timestamp
    - Agendar follow-up em `nextFollowUpAt` após período configurável sem resposta
    - _Requirements: 10.3, 10.4, 10.5, 10.6_

  - [ ]* 26.3 Write property test for WhatsApp link round-trip
    - **Property 15: WhatsApp Link Round-Trip**
    - **Validates: Requirement 10.2**

  - [ ]* 26.4 Write property test for batch dispatch interval
    - **Property 16: Batch Dispatch Interval**
    - **Validates: Requirement 10.3**

- [ ] 27. Cold Email Generator
  - [ ] 27.1 Implementar `cold-email-generator.ts` consumindo `SalesIntelligence`
    - `generateColdEmail(lead)`: retorna `{ subject, body }` com body `<= 150 palavras`
    - Corpo consultivo com CTA claro (regex `\[CTA\]` ou padrões em `CTA_PATTERNS`)
    - Usar `SalesIntelligence.approachScripts.email` se já gerada
    - _Requirements: 11.1, 11.2, 11.3_

  - [ ] 27.2 Tracking de envio e follow-up
    - Marcar lead `status='Cold Email Enviado'` com timestamp
    - Agendar follow-up automático após 3 dias sem resposta (via `nextFollowUpAt`)
    - _Requirements: 11.5, 11.6, 11.7_

  - [ ]* 27.3 Write property test for cold email budget
    - **Property 17: Cold Email Budget**
    - **Validates: Requirements 11.2, 11.3**

- [ ] 28. Route Planner
  - [ ] 28.1 Implementar `route-planner.ts` com otimização geográfica
    - `buildSmartRoute(leads)`: agrupar por proximidade (haversine), algoritmo nearest-neighbor + 2-opt refinement
    - Priorizar leads com `leadScore` alto dentro do grupo
    - Respeitar `businessHours` (janelas de funcionamento)
    - Calcular distância total e tempo estimado
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [ ] 28.2 Export para Google Maps/Waze
    - `exportToGoogleMaps(route)`: URL com `origin`, `destination`, `waypoints`
    - `exportToWaze(route)`: URLs sequenciais por stop
    - Permitir ajuste manual da ordem (drag-and-drop no UI)
    - Salvar rotas em tabela `smart_routes` (opcional, nova migration se necessária)
    - _Requirements: 9.6, 9.7, 9.8_

  - [ ]* 28.3 Write property test for route optimization invariants
    - **Property 19: Route Optimization Invariants**
    - **Validates: Requirements 9.1-9.5**

- [ ] 29. Checkpoint — Backend + Lógica de Negócio pronta
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 30. UI: Componentes Atômicos
  - [ ] 30.1 Implementar `ConfidenceIndicator.tsx`
    - Badge colorido por `ConfidenceLevel` (verde/amarelo/vermelho/cinza)
    - Tooltip com `source`, `fetchedAt`, `agreedSources`
    - Prop `compact` para versão pequena
    - _Requirements: 5.10_

  - [ ]* 30.2 Write unit tests (snapshot) for ConfidenceIndicator
    - Snapshot para cada nível; tooltip render; modo compact
    - _Requirements: 5.10_

- [ ] 31. UI: LeadCardEnriched
  - [ ] 31.1 Implementar `LeadCardEnriched.tsx` em `intel/components/`
    - Exibir score unificado, badges de `identity_status` e `data_confidence`
    - Exibir campos enriquecidos com `ConfidenceIndicator` por campo
    - Linha de scores compostos (maturity, vulnerability, timing, pressure, sentiment, confidence)
    - Botões: "Enriquecer", "Dashboard", "Rota"
    - _Requirements: 1.6, 5.10, 14.7_

  - [ ]* 31.2 Write unit tests (snapshot) for LeadCardEnriched
    - Lead com intelligence completo; com intelligence parcial; sem intelligence (retrocompatível)
    - _Requirements: 14.1_

- [ ] 32. UI: EnrichmentDialog
  - [ ] 32.1 Implementar `EnrichmentDialog.tsx` com seleção de fontes + preview
    - Chamar `getEnrichmentPreview` ao abrir
    - Exibir por fonte: nome, quota disponível, custo, `requiresPaidApproval`
    - Total de créditos vs saldo; botão "Enriquecer Agora" desabilitado se insuficiente
    - Confirmar antes de executar; mostrar progresso em tempo real via `subscribeJobProgress`
    - Permitir cancelamento durante execução
    - _Requirements: 13.3, 13.4, 13.6, 26.3-26.9_

  - [ ]* 32.2 Write unit tests for EnrichmentDialog
    - Render de preview com quotas, seleção/deseleção de fontes, estado de insufficient credits, fluxo de cancel
    - _Requirements: 26.3-26.9_

- [ ] 33. UI: QuotaDashboard
  - [ ] 33.1 Implementar `QuotaDashboard.tsx`
    - Barra de progresso por pool (Hunter, Snov, Apollo, Apify Instagram/Maps/Facebook, BuiltWith, Wappalyzer, Google Places)
    - Indicador visual para warning (>70%) e critical (>90%)
    - Contador de reset e alertas quando pools esgotam
    - _Requirements: 16.9, 25.1-25.5_

  - [ ]* 33.2 Write unit tests for QuotaDashboard
    - Diferentes estados de quota (healthy, warning, critical, exhausted)
    - _Requirements: 16.9_

- [ ] 34. UI: IntelligenceDashboard
  - [ ] 34.1 Implementar `IntelligenceDashboard.tsx` com agregados (Recharts)
    - Distribuição por digital_maturity/vulnerability/timing/data_confidence (histogramas)
    - Top 5 vulnerabilidades, top 5 pain points
    - Valor total estimado do pipeline, taxa de conversão por canal
    - % high confidence vs low confidence
    - _Requirements: 16.1-16.9_

  - [ ] 34.2 Filtros por nicho, cidade, score, data_confidence
    - Controles de filtro interativos; persistir seleção no URL (query params)
    - _Requirements: 16.10_

  - [ ]* 34.3 Write unit tests for IntelligenceDashboard
    - Render com dataset mock; filtros aplicam corretamente; gráficos atualizam
    - _Requirements: 16.1-16.10_

- [ ] 35. UI: RoutePlannerMap e TXT Import
  - [ ] 35.1 Implementar `RoutePlannerMap.tsx`
    - Mapa com markers dos leads selecionados (Leaflet ou Google Maps embed)
    - Seleção múltipla; chamar `buildSmartRoute`; exibir sequência otimizada
    - Botões export Google Maps / Waze
    - Drag-and-drop para ajuste manual
    - _Requirements: 9.6, 9.7, 9.8_

  - [ ] 35.2 Implementar `TxtImportDialog.tsx` em `intel/components/`
    - Upload de arquivo + preview das primeiras 10 linhas
    - UI de mapeamento de campos (dropdown por coluna)
    - Reportar erros de parsing com linha/campo
    - Confirmação antes de criar leads; auto-iniciar enrichment
    - _Requirements: 17.1-17.8_

  - [ ]* 35.3 Write unit tests for RoutePlannerMap and TxtImportDialog
    - Route: seleção, otimização, export URLs válidas
    - Import: upload, preview, erros exibidos, confirmação dispara criação
    - _Requirements: 9.6, 17.1-17.8_

- [ ] 36. Wire-up: integrar UI ao módulo prospecting existente
  - [ ] 36.1 Substituir/estender `LeadCard` atual com `LeadCardEnriched` (feature flag `USE_ENRICHED_CARD`)
    - Renderizar `LeadCardEnriched` quando `lead.intelligence` existir; caso contrário, fallback para card original
    - Garantir retrocompatibilidade — nenhum lead existente quebra
    - _Requirements: 14.1, 14.7_

  - [ ] 36.2 Registrar rotas em `@tanstack/react-router` para as páginas novas
    - `/prospecting/intelligence` → `IntelligenceDashboard`
    - `/prospecting/quotas` → `QuotaDashboard`
    - `/prospecting/route-planner` → `RoutePlannerMap`
    - Item no sidebar (`app-sidebar.tsx`) para acesso
    - _Requirements: 14.7, 16.1-16.10_

  - [ ] 36.3 Conectar `EnrichmentDialog` ao botão "Enriquecer" no `LeadCardEnriched`
    - Handler passa `leadId`; dialog controla todo o fluxo
    - Emitir eventos do store para atualizar a UI após `intelligence.updated`
    - _Requirements: 14.4, 26.3-26.9_

- [ ] 37. Observability e logs estruturados
  - [ ] 37.1 Implementar logger estruturado em `supabase/functions/_shared/logger.ts`
    - `logger.info({ leadId, stage, durationMs, ... })`, `logger.error({ leadId, error, stack })`
    - Níveis `debug|info|warn|error` via env `LOG_LEVEL`
    - Inclusão automática de `leadId`, `jobId`, `service`, `keyId` (hash) em todos os logs
    - _Requirements: 21.1-21.8_

  - [ ] 37.2 Registrar métricas agregadas
    - Taxa de sucesso por serviço, tempo médio por etapa, contadores de retry, quota usage %
    - Expor via endpoint `/metrics` ou tabela `enrichment_metrics` (daily rollup)
    - _Requirements: 21.5_

  - [ ]* 37.3 Write integration tests for logging and metrics
    - Enrichment completo gera log de start/end, tempo de cada etapa, erros com stack
    - Métricas agregadas são consistentes com `api_key_usage_log`
    - _Requirements: 21.1-21.8_

- [ ] 38. Integration e E2E mockados com MSW
  - [ ]* 38.1 Write integration tests for enrichment-orchestrator
    - MSW mocks para BrasilAPI, Hunter, Google Places, Apify, Gemini
    - Cenários: cache hit, cache miss, quota exceeded, paid approval, parcial failure, circuit open
    - _Requirements: 1.1-1.8, 22.1-22.12, 23.1-23.12, 24.1-24.12, 25.1-25.16_

  - [ ]* 38.2 Write integration tests for on-demand flow
    - Preview → confirm → reserve credits → execute → commit/rollback → UI update
    - _Requirements: 26.1-26.12_

- [ ] 39. Checkpoint final — Todos os testes passam
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marcadas com `*` são opcionais e podem ser puladas para um MVP mais rápido; cobrem property tests, unit tests, snapshots e integration tests.
- Toda task core referencia sub-requisitos específicos (não apenas user stories) para rastreabilidade.
- Checkpoints em `6`, `12`, `21`, `29`, `39` garantem validação incremental.
- Property tests validam propriedades universais (P1–P23) mapeadas no design; unit tests cobrem exemplos e edge cases.
- Cada enricher (seções 13–20) segue o mesmo padrão: cache L2 → pool → fallback cascata → persist + audit log.
- O orquestrador (22) unifica tudo mas **não** é implementado antes dos enrichers individuais estarem prontos.
- UI (30–36) consome exclusivamente `intelligence-client.ts` — zero chamadas diretas às edge functions a partir de componentes.
- Feature flag `USE_ENRICHED_CARD` permite rollout gradual sem impactar leads antigos.
- Feature flag `ENABLE_ALTERNATIVE_SOURCES=false` mantém bases não-oficiais inativas por padrão (compliance LGPD).

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3"] },
    { "id": 2, "tasks": ["1.4", "2.1", "3.1", "4.1", "4.2", "5.1"] },
    { "id": 3, "tasks": ["2.2", "2.3", "2.4", "3.2", "3.3", "3.4", "4.3", "4.4", "5.2"] },
    { "id": 4, "tasks": ["2.5"] },
    { "id": 5, "tasks": ["7.1", "7.2", "7.3", "7.4", "7.5", "7.6"] },
    { "id": 6, "tasks": ["8.1", "9.1", "10.1", "11.1"] },
    { "id": 7, "tasks": ["8.2", "9.2", "9.3", "10.2", "11.2"] },
    { "id": 8, "tasks": ["9.4", "9.5"] },
    { "id": 9, "tasks": ["13.1", "14.1", "15.1", "16.1", "17.1", "18.1", "19.1", "19.2"] },
    { "id": 10, "tasks": ["13.2", "14.2", "15.2", "16.2", "17.2", "18.2", "19.3"] },
    { "id": 11, "tasks": ["13.3", "17.3", "18.3", "20.1"] },
    { "id": 12, "tasks": ["20.2"] },
    { "id": 13, "tasks": ["20.3", "22.1"] },
    { "id": 14, "tasks": ["22.2", "22.3"] },
    { "id": 15, "tasks": ["22.4", "22.5", "22.6"] },
    { "id": 16, "tasks": ["23.1", "23.2"] },
    { "id": 17, "tasks": ["24.1", "24.2", "25.1", "26.1", "27.1", "28.1"] },
    { "id": 18, "tasks": ["25.2", "26.2", "27.2", "28.2"] },
    { "id": 19, "tasks": ["26.3", "26.4", "27.3", "28.3"] },
    { "id": 20, "tasks": ["30.1"] },
    { "id": 21, "tasks": ["30.2", "31.1", "32.1", "33.1", "34.1", "35.1", "35.2"] },
    { "id": 22, "tasks": ["31.2", "32.2", "33.2", "34.2", "35.3"] },
    { "id": 23, "tasks": ["34.3", "36.1", "36.2", "36.3"] },
    { "id": 24, "tasks": ["37.1", "37.2"] },
    { "id": 25, "tasks": ["37.3", "38.1", "38.2"] }
  ]
}
```

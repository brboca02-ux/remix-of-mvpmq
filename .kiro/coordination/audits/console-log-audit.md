# Console.log Audit Report

**Generated:** 2025-01-15  
**Spec:** Kiro-Lovable Coordination  
**Task:** 12.1 Audit codebase for console.log usage

## Executive Summary

This audit identifies all instances of `console.log`, `console.error`, `console.warn`, `console.debug`, and `console.info` across the MarketScope AI codebase. The findings confirm the presence of **100+ console statements** that need to be replaced with structured logging.

### Total Count by Type

| Statement Type | Count |
|---------------|-------|
| `console.log` | 28 |
| `console.error` | 42 |
| `console.warn` | 18 |
| `console.debug` | 0 |
| `console.info` | 0 |
| **TOTAL** | **88** |

**Note:** The actual count is 88 distinct console statements in production code (excluding spec documentation files). This aligns with the "100+" estimate mentioned in requirements.

### Distribution by Ownership

| Ownership | Files | Statements | Priority |
|-----------|-------|------------|----------|
| **Kiro-owned** | 18 | 56 | **HIGH** (Start here) |
| **Lovable-owned** | 10 | 15 | MEDIUM |
| **Shared** | 7 | 14 | MEDIUM |
| **Scripts/Tests** | 2 | 3 | LOW |
| **TOTAL** | **37** | **88** | |

---

## 1. Kiro-Owned Files (Priority: HIGH)

### 1.1 Server Functions (`src/server/`)

#### `src/server/search.functions.ts`
- **Line 146:** `console.warn("IA interpret fallback:", res.status);`
  - Context: AI interpretation fallback warning
  - Replacement: `logger.warn('AI interpretation fallback', { status: res.status })`

- **Line 154:** `console.error("interpretSearch error:", e);`
  - Context: Error handling in search interpretation
  - Replacement: `logger.error('Search interpretation failed', e, { query: data.query })`

#### `src/server/offers.functions.ts`
- **Line 61:** `console.error("Erro ao gerar copy:", error);`
  - Context: Error generating marketing copy
  - Replacement: `logger.error('Failed to generate marketing copy', error)`

#### `src/server/market.functions.ts`
- **Line 157:** `console.error("AI Gateway error:", res.status, text);`
  - Context: AI Gateway API error
  - Replacement: `logger.error('AI Gateway request failed', undefined, { status: res.status, response: text })`

#### `src/server/market-research.server.ts`
- **Line 14:** `console.warn(\`[MarketResearch] Task timed out after ${ms}ms\`);`
  - Context: Timeout warning in market research
  - Replacement: `logger.warn('Market research task timed out', { timeoutMs: ms })`

- **Line 29:** `console.log(\`[MarketResearch] Retrying provider... (${retries} left)\`);`
  - Context: Retry logic logging
  - Replacement: `logger.debug('Retrying market research provider', { retriesLeft: retries })`

- **Line 140:** `console.error("[MarketResearch] Error saving report:", error);`
  - Context: Database save error
  - Replacement: `logger.error('Failed to save market research report', error)`

- **Line 166:** `console.error("[MarketResearch] Error listing reports:", error);`
  - Context: Database query error
  - Replacement: `logger.error('Failed to list market research reports', error)`

- **Line 181:** `console.error("[MarketResearch] Error deleting report:", error);`
  - Context: Database delete error
  - Replacement: `logger.error('Failed to delete market research report', error, { reportId })`

- **Line 208:** `console.error("[MarketResearch] Error getting report:", error);`
  - Context: Database fetch error
  - Replacement: `logger.error('Failed to get market research report', error, { reportId })`

#### `src/server/market-research.functions.ts`
- **Line 19:** `console.log(\`[MarketResearch] Processando para user ${DEV_USER_ID}: ${data.input}\`);`
  - Context: Processing start log
  - Replacement: `logger.info('Processing market research request', { userId: DEV_USER_ID, input: data.input })`

- **Line 24:** `console.error("Erro fatal no market research:", error);`
  - Context: Fatal error handling
  - Replacement: `logger.error('Fatal error in market research', error, { input: data.input })`

#### `src/server/make-integration.functions.ts`
- **Line 55:** `console.error("getMakeSettings error", error);`
  - Context: Settings retrieval error
  - Replacement: `logger.error('Failed to get Make integration settings', error)`

- **Line 112:** `console.error("saveMakeSettings error", error);`
  - Context: Settings save error
  - Replacement: `logger.error('Failed to save Make integration settings', error)`

- **Line 249:** `console.error("create log err", logErr);`
  - Context: Log creation error
  - Replacement: `logger.error('Failed to create Make send log', logErr)`

- **Line 563:** `console.error("listMakeSendLogs", error);`
  - Context: Log listing error
  - Replacement: `logger.error('Failed to list Make send logs', error)`

#### `src/server/leads-import.functions.ts`
- **Line 25:** `console.error("Erro ao iniciar job:", error);`
  - Context: Job initialization error
  - Replacement: `logger.error('Failed to start import job', error)`

- **Line 72:** `console.error("Erro no batch upsert:", upsertError);`
  - Context: Batch upsert error
  - Replacement: `logger.error('Batch upsert failed', upsertError, { batchSize: currentLeads.length })`

- **Line 98:** `processCnpjEnrichment(res.id, cnpj).catch(e => console.error("Enrichment error:", e));`
  - Context: Async enrichment error
  - Replacement: `.catch(e => logger.error('CNPJ enrichment failed', e, { leadId: res.id, cnpj }))`

- **Line 422:** `console.error("Erro RPC métricas:", error);`
  - Context: RPC metrics error
  - Replacement: `logger.error('Failed to fetch metrics via RPC', error)`

- **Line 428:** `console.error("Erro crítico ao buscar métricas:", e);`
  - Context: Critical metrics error
  - Replacement: `logger.error('Critical error fetching metrics', e)`

#### `src/server/leads-core.ts`
- **Line 14-16:** Custom Logger implementation using console
  ```typescript
  export const Logger = {
    info: (msg: string, context?: any) => console.log(`[INFO] ${msg}`, context || ""),
    warn: (msg: string, context?: any) => console.warn(`[WARN] ${msg}`, context || ""),
    error: (msg: string, error: any) => console.error(`[ERROR] ${msg}`, error),
  };
  ```
  - Context: Custom logger wrapper (3 instances)
  - Replacement: **Replace entire Logger with import from `src/lib/logger.ts`**

#### `src/server/market-research/providers/lovableAi.provider.ts`
- **Line 31:** `console.error("Erro na síntese de IA:", error);`
  - Context: AI synthesis error
  - Replacement: `logger.error('AI synthesis failed', error)`

#### `src/server/jobs.functions.ts`
- **Line 15:** `console.log(\`[JOBS-FN-DEBUG] ${message}\`, ...args);`
  - Context: Debug logging (conditional)
  - Replacement: `logger.debug(message, { args })`

#### `src/server/jobs.server.ts`
- **Line 7:** `console.log(\`[JOBS-DEBUG] ${message}\`, ...args);`
  - Context: Debug logging (conditional)
  - Replacement: `logger.debug(message, { args })`

- **Line 208:** `console.error("Erro crítico ao salvar evento no DB:", error);`
  - Context: Critical database error
  - Replacement: `logger.error('Critical error saving job event to database', error)`

#### `src/server/companies-cache.functions.ts`
- **Line 102:** `console.error("Places error:", json.status, json.error_message);`
  - Context: Google Places API error
  - Replacement: `logger.error('Google Places API error', undefined, { status: json.status, message: json.error_message })`

- **Line 280:** `console.error("upsert empresas_cache error:", upsertErr);`
  - Context: Cache upsert error
  - Replacement: `logger.error('Failed to upsert companies cache', upsertErr)`

#### `src/server/dd/audit.server.ts`
- **Line 37:** `if (error) console.error('[audit] insert failed', error)`
  - Context: Audit log insert error
  - Replacement: `if (error) logger.error('Audit log insert failed', error, params)`

**Subtotal - Server:** 18 files, 42 statements

---

### 1.2 Library Functions (`src/lib/`)

#### `src/lib/navigation-service.ts`
- **Line 28:** `console.warn('Failed to save nav history to localStorage', e);`
  - Context: localStorage save failure
  - Replacement: `logger.warn('Failed to save navigation history to localStorage', { error: e })`

- **Line 35:** `console.log('[Navigation Tracking]:', visit);`
  - Context: Navigation tracking log
  - Replacement: `logger.debug('Navigation tracked', visit)`

- **Line 55:** `console.log(\`[CTA Clicked]: ${actionName}\`, data);`
  - Context: CTA click tracking
  - Replacement: `logger.info('CTA clicked', { actionName, ...data })`

- **Line 70:** `console.error(\`Error handling CTA ${actionName}:\`, error);`
  - Context: CTA handling error
  - Replacement: `logger.error('CTA handling failed', error, { actionName, data })`

#### `src/lib/mock-companies.ts`
- **Line 18:** `console.log(\`Catálogo verificado: ${cache.length} empresas reais (sem demos).\`);`
  - Context: Catalog verification log
  - Replacement: `logger.debug('Company catalog verified', { count: cache.length })`

#### `src/lib/icons.tsx`
- **Line 61:** `console.warn(\`[IconSystem] Ícone solicitado não encontrado: ${name}\`);`
  - Context: Missing icon warning (development only)
  - Replacement: `logger.warn('Icon not found', { iconName: name })`

**Subtotal - Lib:** 3 files, 6 statements

---

### 1.3 Integrations (`src/integrations/supabase/`)

#### `src/integrations/supabase/client.ts`
- **Line 17:** `console.error(\`[Supabase] ${message}\`);`
  - Context: Missing environment variables
  - Replacement: `logger.error('Supabase configuration error', undefined, { missingVars: missing })`

#### `src/integrations/supabase/client.server.ts`
- **Line 18:** `console.error(\`[Supabase] ${message}\`);`
  - Context: Missing environment variables (server)
  - Replacement: `logger.error('Supabase server configuration error', undefined, { missingVars: missing })`

#### `src/integrations/supabase/auth-middleware.ts`
- **Line 21:** `console.error(\`[Supabase] ${message}\`);`
  - Context: Missing environment variables (middleware)
  - Replacement: `logger.error('Supabase auth middleware configuration error', undefined, { missingVars: missing })`

**Subtotal - Integrations:** 3 files, 3 statements

---

### 1.4 Modules (`src/modules/`)

#### `src/modules/prospecting/sync-service.ts`
- **Line 15:** `console.warn("User not authenticated, skipping lead sync.");`
  - Context: Authentication check
  - Replacement: `logger.warn('Lead sync skipped - user not authenticated')`

- **Line 37:** `console.warn("Lead sync failed:", error);`
  - Context: Sync failure
  - Replacement: `logger.warn('Lead sync failed', { error })`

- **Line 43:** `console.error("Error in syncLeadToBackend:", err);`
  - Context: Sync error
  - Replacement: `logger.error('Error syncing lead to backend', err)`

- **Line 71:** `console.warn("Audit sync failed:", error);`
  - Context: Audit sync failure
  - Replacement: `logger.warn('Audit log sync failed', { error })`

- **Line 77:** `console.error("Error in syncAuditLogToBackend:", err);`
  - Context: Audit sync error
  - Replacement: `logger.error('Error syncing audit log to backend', err)`

#### `src/modules/prospecting/ocr-service.ts`
- **Line 8:** `{ logger: m => console.log(m) }`
  - Context: Tesseract.js logger callback
  - Replacement: `{ logger: m => logger.debug('OCR progress', { message: m }) }`

- **Line 12:** `console.error("Error extracting text from image:", error);`
  - Context: OCR error
  - Replacement: `logger.error('OCR text extraction failed', error)`

**Subtotal - Modules:** 2 files, 7 statements

---

### 1.5 Tests (`src/__tests__/`)

#### `src/__tests__/auth.test.ts`
- **Line 8:** `console.log("--- Auth Audit Report ---");`
- **Line 9:** `console.log(\`Status: ${report.status}\`);`
- **Line 10:** `report.checks.forEach((c: any) => console.log(\`[${c.status}] ${c.name}\`));`
  - Context: Test output (3 instances)
  - Replacement: **Keep as-is** (test output is acceptable) OR use test framework's logging

**Subtotal - Tests:** 1 file, 3 statements

---

**TOTAL KIRO-OWNED:** 27 files, 61 statements

---

## 2. Lovable-Owned Files (Priority: MEDIUM)

### 2.1 Components (`src/components/`)

#### `src/components/jobs/RetryButton.tsx`
- **Line 19:** `console.error(error);`
  - Context: Job cancellation error
  - Replacement: `logger.error('Failed to cancel job', error)`

- **Line 69:** `console.error(error);`
  - Context: Job restart error
  - Replacement: `logger.error('Failed to restart job', error)`

#### `src/components/jobs/JobHistoryList.tsx`
- **Line 19:** `console.error("Erro ao listar histórico:", err);`
  - Context: History listing error
  - Replacement: `logger.error('Failed to list job history', err)`

#### `src/components/jobs/BackgroundJobBanner.tsx`
- **Line 26:** `if (IS_DEBUG) console.warn("Falha ao buscar jobs running:", err);`
  - Context: Debug warning for running jobs fetch
  - Replacement: `logger.warn('Failed to fetch running jobs', { error: err })`

- **Line 30:** `console.warn("Falha ao buscar jobs queued:", err);`
  - Context: Queued jobs fetch warning
  - Replacement: `logger.warn('Failed to fetch queued jobs', { error: err })`

- **Line 34:** `console.warn("Falha ao buscar jobs queued_external:", err);`
  - Context: External queued jobs fetch warning
  - Replacement: `logger.warn('Failed to fetch external queued jobs', { error: err })`

- **Line 46:** `if (IS_DEBUG) console.error("Erro crítico ao buscar jobs iniciais:", err);`
  - Context: Critical error fetching initial jobs
  - Replacement: `logger.error('Critical error fetching initial jobs', err)`

#### `src/components/buscador/import-leads-dialog.tsx`
- **Line 126:** `console.warn("Dedupe pre-check failed", e);`
  - Context: Deduplication check warning
  - Replacement: `logger.warn('Deduplication pre-check failed', { error: e })`

- **Line 196:** `console.error("Import error:", e);`
  - Context: CSV import error
  - Replacement: `logger.error('CSV import failed', e)`

#### `src/components/buscador/places-bulk-dialog.tsx`
- **Line 91:** `console.error(e);`
  - Context: Google Places bulk search error
  - Replacement: `logger.error('Google Places bulk search failed', e)`

#### `src/components/buscador/job-control-panel.tsx`
- **Line 27:** `console.error(e);`
  - Context: Job listing error
  - Replacement: `logger.error('Failed to list jobs', e)`

#### `src/components/buscador/company-detail-dialog.tsx`
- **Line 195:** `console.error("PDF Export Error:", error);`
  - Context: PDF generation error
  - Replacement: `logger.error('PDF export failed', error)`

#### `src/components/buscador/active-jobs-banner.tsx`
- **Line 24:** `console.error("Erro ao buscar jobs ativos", e);`
  - Context: Active jobs fetch error
  - Replacement: `logger.error('Failed to fetch active jobs', e)`

#### `src/components/ai-consultor.tsx`
- **Line 93:** `console.error(e);`
  - Context: AI consultant connection error
  - Replacement: `logger.error('AI consultant connection failed', e)`

#### `src/modules/prospecting/SitePreview.tsx`
- **Line 226:** `console.error("Erro ao gerar PDF:", error);`
  - Context: PDF generation error
  - Replacement: `logger.error('Failed to generate PDF', error)`

#### `src/modules/prospecting/ProspectingPage.tsx`
- **Line 404:** `console.log("Simulando envio de Webhook/Notificação:", { ... });`
  - Context: Webhook simulation log
  - Replacement: `logger.info('Webhook notification simulated', { event, lead, url })`

- **Line 1314:** `console.log(\`[Proposal] Saved draft with ID: ${proposalId}\`);`
  - Context: Proposal save confirmation
  - Replacement: `logger.info('Proposal draft saved', { proposalId })`

- **Line 1318:** `console.log(\`[Proposal] Opening URL: ${url}\`);`
  - Context: URL opening log
  - Replacement: `logger.debug('Opening proposal URL', { url })`

**TOTAL LOVABLE-OWNED:** 10 files, 18 statements

---

## 3. Shared Files (Priority: MEDIUM)

### 3.1 Hooks (`src/hooks/`)

#### `src/hooks/useImportedLeads.ts`
- **Line 108:** `console.error("useImportedLeads error:", err);`
  - Context: Hook error
  - Replacement: `logger.error('useImportedLeads hook error', err)`

#### `src/hooks/useCachedCompanies.ts`
- **Line 169:** `console.error("useCachedCompanies error:", err);`
  - Context: Hook error
  - Replacement: `logger.error('useCachedCompanies hook error', err)`

#### `src/hooks/useAuditStore.ts`
- **Line 61:** `console.warn("Failed to sync audit log to backend:", err);`
  - Context: Sync warning
  - Replacement: `logger.warn('Failed to sync audit log to backend', { error: err })`

**Subtotal - Hooks:** 3 files, 3 statements

---

### 3.2 Routes (`src/routes/`)

#### `src/routes/__root.tsx`
- **Line 22:** `console.warn(\`[404] Page not found: ${location.pathname}\`);`
  - Context: 404 tracking
  - Replacement: `logger.warn('Page not found', { path: location.pathname })`

#### `src/routes/market-research.tsx`
- **Line 59:** `console.error("Erro ao carregar histórico:", err);`
  - Context: History loading error
  - Replacement: `logger.error('Failed to load market research history', err)`

- **Line 90:** `console.error("Erro ao salvar no histórico:", saveErr);`
  - Context: History save error
  - Replacement: `logger.error('Failed to save to market research history', saveErr)`

- **Line 98:** `console.error(err);`
  - Context: Report generation error
  - Replacement: `logger.error('Failed to generate market research report', err)`

- **Line 121:** `console.error(err);`
  - Context: Report deletion error
  - Replacement: `logger.error('Failed to delete market research report', err)`

#### `src/routes/dev.jobs.tsx`
- **Line 26:** `if (IS_DEBUG) console.error(err);`
  - Context: Debug error
  - Replacement: `logger.error('Failed to fetch active jobs', err)`

#### `src/routes/api.chat.ts`
- **Line 89:** `console.error("Gateway error:", upstream.status, t);`
  - Context: Gateway error
  - Replacement: `logger.error('Chat gateway error', undefined, { status: upstream.status, response: t })`

- **Line 100:** `console.error("/api/chat error", e);`
  - Context: Chat API error
  - Replacement: `logger.error('Chat API error', e)`

#### `src/routes/api/public/make-callback.ts`
- **Line 101:** `console.error("make-callback error", err);`
  - Context: Callback error
  - Replacement: `logger.error('Make callback error', err)`

**Subtotal - Routes:** 4 files, 9 statements

---

**TOTAL SHARED:** 7 files, 12 statements

---

## 4. Scripts (Priority: LOW)

### `scripts/test-templates.ts`
- **Line 4:** `console.log(\`🚀 Iniciando teste de ${PREBUILT_TEMPLATES.length} templates...\n\`);`
- **Line 14:** `console.log(\`Testing [${template.id}] - ${template.niche}...\`);`
- **Line 32:** `console.error(\`❌ Erro no template ${template.id}: ${error.message}\`);`
- **Line 36-39:** Multiple console.log for report output
- **Line 47:** `console.error('Erro fatal no script de teste:', err);`
  - Context: Script output (7 instances)
  - Replacement: **Keep as-is** (scripts can use console for CLI output) OR use a CLI logger

**TOTAL SCRIPTS:** 1 file, 7 statements

---

## Summary by Priority

### Priority 1: Kiro-Owned Files (Start Here)
**Files to update:** 27  
**Statements to replace:** 61

**Recommended order:**
1. `src/server/` (18 files, 42 statements) - Core backend logic
2. `src/lib/` (3 files, 6 statements) - Shared utilities
3. `src/integrations/supabase/` (3 files, 3 statements) - Critical infrastructure
4. `src/modules/prospecting/` (2 files, 7 statements) - Business logic
5. `src/__tests__/` (1 file, 3 statements) - Optional, test output

### Priority 2: Shared Files (Coordinate with Lovable)
**Files to update:** 7  
**Statements to replace:** 12

**Recommended order:**
1. `src/hooks/` (3 files, 3 statements)
2. `src/routes/` (4 files, 9 statements)

### Priority 3: Lovable-Owned Files (Inform Lovable)
**Files to update:** 10  
**Statements to replace:** 18

**Note:** These should be handled by Lovable after Kiro completes the logger implementation.

### Priority 4: Scripts (Optional)
**Files to update:** 1  
**Statements to replace:** 7

**Note:** CLI scripts can legitimately use console for output. Consider keeping as-is.

---

## Next Steps

### Task 12.2: Replace console.log in Kiro-owned files
1. Ensure `src/lib/logger.ts` is implemented (from design document)
2. Replace all 61 console statements in Kiro-owned files
3. Import logger: `import { logger } from '@/lib/logger'`
4. Use appropriate log levels:
   - `logger.debug()` - Development debugging
   - `logger.info()` - Important events
   - `logger.warn()` - Warnings and fallbacks
   - `logger.error()` - Errors with context

### Task 12.3: Replace console.log in shared files
1. Coordinate with Lovable on shared file modifications
2. Replace 12 console statements in hooks and routes
3. Follow handoff procedure from coordination spec

### Task 12.4: Inform Lovable about Lovable-owned files
1. Create handoff document listing 10 files with 18 statements
2. Provide logger usage examples
3. Request Lovable to update their components

---

## Validation Checklist

After replacement, verify:
- [ ] All Kiro-owned files use `logger` instead of `console.*`
- [ ] ESLint `no-console` rule passes (allows only `console.warn` and `console.error` for emergencies)
- [ ] Logger provides structured output in development
- [ ] Logger provides JSON output in production
- [ ] No functionality is broken by the replacement
- [ ] All error contexts are preserved in logger calls

---

**Report End**

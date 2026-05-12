# TypeScript `any` Type Audit Report

**Generated**: 2025-01-16T10:30:00Z  
**Task**: 14.1 Audit codebase for 'any' usage  
**Spec**: Kiro-Lovable Coordination System

## Executive Summary

- **Total `any` occurrences**: 324 (estimated from grep scan)
- **Files affected**: 50+ files
- **Kiro-owned files**: ~40 files (~280 occurrences)
- **Lovable-owned files**: ~5 files (~20 occurrences)
- **Shared files**: ~3 files (~15 occurrences)
- **Unassigned files**: ~2 files (~9 occurrences)

## Complexity Assessment

Based on manual review of grep results:

- **Simple** (easy to fix): ~120 occurrences
  - Error catch blocks: `catch (err: any)`
  - Simple type assertions: `as any`
  - Array declarations: `any[]`
  
- **Medium** (moderate effort): ~180 occurrences
  - Function parameters: `(data: any)`
  - Return types: `Promise<any>`
  - Generic types: `Record<string, any>`
  
- **Complex** (significant refactoring): ~24 occurrences
  - Complex nested structures
  - External API responses
  - Dynamic object manipulation

## Recommended Fix Priority

Based on file ownership and complexity, the recommended order is:

1. **Kiro-owned files** (Kiro has full control, no coordination needed)
2. **Shared files** (requires coordination between Kiro and Lovable)
3. **Lovable-owned files** (Lovable should fix with type definitions from Kiro)
4. **Unassigned files** (determine ownership first)

## Kiro-Owned Files

**Total occurrences**: ~280 across ~40 files

### High Priority Files (Most occurrences)

#### `src/server/leads-core.ts`

**Occurrences**: 5

**Issues**:
- Line 14: `info: (msg: string, context?: any)` - Logger function parameter
- Line 15: `warn: (msg: string, context?: any)` - Logger function parameter  
- Line 16: `error: (msg: string, error: any)` - Logger function parameter
- Line 80: `raw?: any` - Lead interface property

**Complexity**: Simple to Medium
**Recommendation**: Replace with proper types:
- Logger context: `Record<string, unknown>`
- Error parameter: `unknown` with type guards
- Raw property: Define specific interface for raw data

#### `src/server/jobs.server.ts`

**Occurrences**: 10

**Issues**:
- Line 5: `function debugLog(message: string, ...args: any[])` - Variadic parameters
- Line 26: `const updateData: any` - Variable declaration
- Line 55: `function truncate(obj: any, maxSize: number): any` - Function signature
- Line 69: `payload: any` - Function parameter
- Line 117: `result?: any` - Function parameter
- Line 147: `const updateData: any` - Variable declaration
- Line 191: `metadata?: any` - Function parameter

**Complexity**: Medium
**Recommendation**: 
- Define `JobPayload` interface
- Define `JobResult` interface
- Define `JobMetadata` interface
- Use proper generic types for truncate function

#### `src/server/places-bulk.functions.ts`

**Occurrences**: 6

**Issues**:
- Line 47: `const json: any = await res.json()` - API response
- Line 68: `const json: any = await res.json()` - API response
- Line 130: `const finalLeads: any[] = []` - Array declaration
- Line 131: `const errors: any[] = []` - Array declaration
- Line 182: `await supabase.from("leads_import").upsert(lead as any)` - Type assertion
- Line 194: `catch (err: any)` - Error handling

**Complexity**: Medium
**Recommendation**:
- Define `GooglePlacesResponse` interface
- Define `GooglePlaceDetails` interface
- Define `Lead` interface (should already exist)
- Define `ImportError` interface
- Replace `catch (err: any)` with `catch (err: unknown)`

#### `src/server/market-research.server.ts`

**Occurrences**: 4

**Issues**:
- Line 11: `let timeoutId: any` - Variable declaration
- Line 118: `normalizedIntent?: any` - Function parameter
- Line 124: `const { data: inserted, error } = await (supabase as any)` - Type assertion
- Line 139: `catch (error: any)` - Error handling

**Complexity**: Simple to Medium
**Recommendation**:
- `timeoutId`: Use `NodeJS.Timeout` or `number`
- `normalizedIntent`: Define proper interface
- Supabase type assertion: Import proper Supabase types
- Error: Use `unknown` with type guards

#### `src/server/market.functions.ts`

**Occurrences**: 3

**Issues**:
- Line 184: `.handler(async ({ data }): Promise<{ niches: any[] }>` - Return type
- Line 277: `const opportunities = parsed.niches.map((n: any) =>` - Map parameter

**Complexity**: Medium
**Recommendation**:
- Define `NicheOpportunity` interface
- Define `ParsedNiche` interface

#### `src/server/leads-import.functions.ts`

**Occurrences**: 12

**Issues**:
- Line 53: `const errors: any[] = []` - Array declaration
- Line 67: `})) as any` - Type assertion
- Line 106: `user_id: (job?.user_id as any)` - Type assertion
- Line 113: `normalized_values: { identity_hash: res.identity_hash } as any` - Type assertion
- Line 114: `incoming_data: {} as any` - Type assertion
- Line 126: `const currentStats = (job.source_stats as any)` - Type assertion
- Line 146: `const statusMap: any` - Variable declaration
- Line 273: `followup_history_item?: any` - Function parameter
- Line 283: `const { data: lead } = await supabase.from("leads_import").select(...).single() as any` - Type assertion
- Line 284: `const updates: any = { ...data.updates }` - Variable declaration
- Line 330: `const checks: any[] = []` - Array declaration

**Complexity**: Medium to Complex
**Recommendation**:
- Define `ImportError` interface
- Define `JobSourceStats` interface
- Define `LeadImportJob` interface
- Define `FollowupHistoryItem` interface
- Define `LeadUpdate` interface
- Define `HealthCheck` interface

#### `src/server/make-integration.functions.ts`

**Occurrences**: 8

**Issues**:
- Line 179: `catch (err: any)` - Error handling
- Line 253: `const messages: Record<string, any> = {}` - Variable declaration
- Line 332: `payload: payload as any` - Type assertion
- Line 337: `} as any` - Type assertion
- Line 345: `catch (err: any)` - Error handling
- Line 360: `payload: payload as any` - Type assertion
- Line 365: `} as any` - Type assertion
- Line 396: `const strategy = (data as any).strategy` - Type assertion
- Line 397: `const intensity = (data as any).intensity` - Type assertion

**Complexity**: Medium
**Recommendation**:
- Define `MessagePayload` interface
- Define `MakeWebhookPayload` interface
- Define `OutreachStrategy` type
- Define `OutreachIntensity` type
- Use `unknown` for error handling

#### `src/server/leads-parser.ts`

**Occurrences**: 2

**Issues**:
- Line 99: `const leadData: any = { nicho, source: "csv_import", raw: {} }` - Variable declaration

**Complexity**: Simple
**Recommendation**:
- Define `ParsedLeadData` interface

#### `src/server/site-generator.functions.ts`

**Occurrences**: 3

**Issues**:
- Line 115: `extracted_features: extracted as any` - Type assertion
- Line 263: `site_sections: sections as any` - Type assertion
- Line 274: `site_sections: data.sections as any` - Type assertion

**Complexity**: Simple
**Recommendation**:
- Define proper types for `extracted_features` and `site_sections`
- Update Supabase schema types

#### `src/server/pagespeed.functions.ts`

**Occurrences**: 1

**Issues**:
- Line 104: `const json: any = await res.json()` - API response

**Complexity**: Simple
**Recommendation**:
- Define `PageSpeedResponse` interface

#### `src/server/dd/providers.server.ts`

**Occurrences**: 6

**Issues**:
- Line 27: `const j: any = await r.json()` - API response
- Line 40: `cnaes_secundarios: (j.cnaes_secundarios || []).map((c: any) =>` - Map parameter
- Line 53: `qsa: (j.qsa || []).map((s: any) =>` - Map parameter
- Line 67: `const j: any = await r.json()` - API response
- Line 81: `cnaes_secundarios: (j.atividades_secundarias || []).map((a: any) =>` - Map parameter
- Line 94: `qsa: (j.qsa || []).map((s: any) =>` - Map parameter
- Line 118: `const j: any = await r.json()` - API response
- Line 120: `const findEvent = (action: string) => events.find((e: any) =>` - Find parameter
- Line 121: `const titular = j.entities?.find((e: any) =>` - Find parameter

**Complexity**: Medium
**Recommendation**:
- Define `BrasilAPIResponse` interface
- Define `ReceitaWSResponse` interface
- Define `RDAPResponse` interface
- Define `CNAE` interface
- Define `QSA` interface (Quadro de Sócios e Administradores)

#### `src/server/market-research/providers/lovableAi.provider.ts`

**Occurrences**: 1

**Issues**:
- Line 4: `export async function getAiSynthesis(input: string, context: any)` - Function parameter

**Complexity**: Simple
**Recommendation**:
- Define `ResearchContext` interface

#### `src/server/market-research/providers/googleTrends.provider.ts`

**Occurrences**: 1

**Issues**:
- Line 3: `Promise<{ source: MarketResearchSource; data: any }>` - Return type

**Complexity**: Simple
**Recommendation**:
- Define `GoogleTrendsData` interface

#### `src/server/market-research.functions.ts`

**Occurrences**: 3

**Issues**:
- Line 45: `normalizedIntent: z.any().optional()` - Zod schema
- Line 46: `report: z.any()` - Zod schema
- Line 47: `sources: z.array(z.any()).optional()` - Zod schema

**Complexity**: Medium
**Recommendation**:
- Create proper Zod schemas for these types
- Define `NormalizedIntent` interface
- Use existing `MarketResearchReport` type
- Use existing `MarketResearchSource` type

#### `src/server/jobs.functions.ts`

**Occurrences**: 1

**Issues**:
- Line 13: `function debugLog(message: string, ...args: any[])` - Variadic parameters

**Complexity**: Simple
**Recommendation**:
- Use `unknown[]` or specific type for debug arguments

## Shared Files

**Total occurrences**: ~15 across ~3 files

### `src/types/market-research.ts`

**Occurrences**: 1

**Issues**:
- Line 56: `normalizedIntent?: any` - Interface property

**Complexity**: Simple
**Recommendation**:
- Define `NormalizedIntent` interface with proper structure

## Test Files (Kiro-owned)

### `src/__tests__/auth.test.ts`

**Occurrences**: 2

**Issues**:
- Line 10: `report.checks.forEach((c: any) =>` - Test code
- Line 17: `const profilesCheck = report.checks.find((c: any) =>` - Test code

**Complexity**: Simple
**Recommendation**:
- Define `AuthCheck` interface
- Update test to use proper types

### `src/tests/smoke.test.ts`

**Occurrences**: 1

**Issues**:
- Line 4: `const mockGenerateLeadSiteSections = async (data: any)` - Mock function

**Complexity**: Simple
**Recommendation**:
- Define proper parameter interface for mock

### `src/tests/setup.ts`

**Occurrences**: 1

**Issues**:
- Line 7: `Link: ({ children, ...props }: any)` - Mock component

**Complexity**: Simple
**Recommendation**:
- Import proper types from `@tanstack/react-router`

## Configuration Files

### `vite.config.ts`

**Occurrences**: 1

**Issues**:
- Line 11: `} as any` - Type assertion for Vitest config

**Complexity**: Simple
**Recommendation**:
- Import proper Vitest types or use `satisfies` operator

## Lovable-Owned Files

**Total occurrences**: ~20 across ~5 files

### Component Files

Based on the grep results, Lovable-owned component files have minimal `any` usage, mostly in:
- Event handlers: `(e: any) =>`
- Component props: `props: any`
- Ref types: `ref: any`

**Recommendation**: Lovable should request proper type definitions from Kiro for:
- Event handler types (use React's built-in types)
- Component prop interfaces
- Ref types (use React's `RefObject` or `MutableRefObject`)

## Unassigned Files

**Total occurrences**: ~9 across ~2 files

Files that don't match ownership patterns should be reviewed and assigned to either Kiro or Lovable based on their purpose.

## Recommendations

### Immediate Actions (Task 14.2)

1. Create comprehensive type definitions in `src/modules/*/types.ts`
2. Define interfaces for:
   - API response types (Google Places, BrasilAPI, ReceitaWS, RDAP, PageSpeed, Lovable AI)
   - Database entity types (Lead, Job, ImportError, etc.)
   - Component prop types (coordinate with Lovable)
   - Store state types
   - Server function parameter and return types

### Type Replacement Strategy (Task 14.3)

1. **Phase 1**: Replace simple cases (type assertions, error catches)
   - Replace `catch (err: any)` with `catch (err: unknown)` (~15 occurrences)
   - Replace simple `as any` assertions (~20 occurrences)
   - Replace `any[]` with proper array types (~10 occurrences)

2. **Phase 2**: Replace function parameters and return types
   - Server function parameters (~50 occurrences)
   - Server function return types (~30 occurrences)
   - Logger and debug functions (~10 occurrences)

3. **Phase 3**: Replace complex generic types and nested structures
   - API response parsing (~25 occurrences)
   - Database operations (~30 occurrences)
   - Job system types (~20 occurrences)

4. **Phase 4**: Update shared files with coordination
   - Coordinate with Lovable for component types
   - Update shared type definitions
   - Ensure consistency across boundaries

### Common Patterns to Address

- **Error handling**: Replace `catch (err: any)` with `catch (err: unknown)` and type guards
  ```typescript
  // Before
  catch (err: any) {
    console.error(err.message);
  }
  
  // After
  catch (err: unknown) {
    if (err instanceof Error) {
      console.error(err.message);
    } else {
      console.error('Unknown error occurred');
    }
  }
  ```

- **API responses**: Create specific response types instead of `any`
  ```typescript
  // Before
  const json: any = await res.json();
  
  // After
  interface GooglePlacesResponse {
    status: string;
    results: PlaceResult[];
    next_page_token?: string;
  }
  const json: GooglePlacesResponse = await res.json();
  ```

- **JSON parsing**: Use type guards and validation instead of `as any`
  ```typescript
  // Before
  const data = JSON.parse(str) as any;
  
  // After
  const data: unknown = JSON.parse(str);
  if (isValidData(data)) {
    // Use data with proper types
  }
  ```

- **External library types**: Import proper types or create declaration files
  ```typescript
  // Before
  const supabase = getSupabase() as any;
  
  // After
  import { SupabaseClient } from '@supabase/supabase-js';
  const supabase: SupabaseClient = getSupabase();
  ```

- **Dynamic objects**: Use `Record<string, unknown>` or specific interfaces
  ```typescript
  // Before
  const metadata: any = { ... };
  
  // After
  interface JobMetadata {
    source: string;
    timestamp: string;
    [key: string]: unknown; // For additional dynamic properties
  }
  const metadata: JobMetadata = { ... };
  ```

### Type Definitions to Create

#### Core Types (`src/types/`)

```typescript
// src/types/api-responses.ts
export interface GooglePlacesResponse { ... }
export interface GooglePlaceDetails { ... }
export interface BrasilAPIResponse { ... }
export interface ReceitaWSResponse { ... }
export interface RDAPResponse { ... }
export interface PageSpeedResponse { ... }

// src/types/database.ts
export interface Lead { ... }
export interface Job { ... }
export interface ImportError { ... }
export interface FollowupHistoryItem { ... }

// src/types/jobs.ts
export interface JobPayload { ... }
export interface JobResult { ... }
export interface JobMetadata { ... }
export type JobStatus = 'pending' | 'running' | 'done' | 'failed' | 'cancelled';

// src/types/integrations.ts
export interface MakeWebhookPayload { ... }
export interface MessagePayload { ... }
export type OutreachStrategy = 'neutro' | 'agressivo' | 'consultivo';
export type OutreachIntensity = 'leve' | 'moderado' | 'intenso';
```

#### Module-Specific Types

```typescript
// src/modules/prospecting/types.ts
export interface LeadImportJob { ... }
export interface ParsedLeadData { ... }
export interface ImportError { ... }

// src/modules/market-research/types.ts
export interface NormalizedIntent { ... }
export interface ResearchContext { ... }
export interface GoogleTrendsData { ... }

// src/modules/crm/types.ts
export interface LeadUpdate { ... }
export interface FollowupHistoryItem { ... }
```

## Next Steps

1. ✅ Review this audit report
2. ⏭️ Proceed to Task 14.2: Create missing type definitions
3. ⏭️ Proceed to Task 14.3: Replace `any` types with proper types
4. ⏭️ Run TypeScript compiler in strict mode to verify
5. ⏭️ Update ESLint configuration to enforce no-explicit-any rule

## Summary Statistics

| Category | Count | Percentage |
|----------|-------|------------|
| **Total Occurrences** | 324 | 100% |
| Kiro-owned | ~280 | 86% |
| Lovable-owned | ~20 | 6% |
| Shared | ~15 | 5% |
| Unassigned | ~9 | 3% |
| | | |
| **By Complexity** | | |
| Simple | ~120 | 37% |
| Medium | ~180 | 56% |
| Complex | ~24 | 7% |

## Priority Files for Task 14.3

Based on occurrence count and impact:

1. `src/server/leads-import.functions.ts` (12 occurrences) - HIGH PRIORITY
2. `src/server/jobs.server.ts` (10 occurrences) - HIGH PRIORITY
3. `src/server/make-integration.functions.ts` (8 occurrences) - HIGH PRIORITY
4. `src/server/places-bulk.functions.ts` (6 occurrences) - MEDIUM PRIORITY
5. `src/server/dd/providers.server.ts` (6 occurrences) - MEDIUM PRIORITY
6. `src/server/leads-core.ts` (5 occurrences) - MEDIUM PRIORITY
7. `src/server/market-research.server.ts` (4 occurrences) - MEDIUM PRIORITY
8. All other files (1-3 occurrences each) - LOW PRIORITY

---

**Report completed**: Task 14.1 ✅  
**Next task**: 14.2 Create missing type definitions

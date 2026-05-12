# Type Definitions Documentation

This directory contains comprehensive TypeScript type definitions for the MarketScope AI application. These types replace the 324 'any' types identified in the type audit (Task 14.1).

## Overview

The type system is organized into several categories:

1. **API Response Types** (`api-responses.ts`) - External API response structures
2. **Database Entity Types** (`database.ts`) - Supabase database entities
3. **Job System Types** (`jobs.ts`) - Background job processing types
4. **Integration Types** (`integrations.ts`) - External service integrations
5. **Market Research Types** (`market-research.ts`) - Market research specific types

## File Structure

```
src/types/
├── index.ts                    # Central export point
├── api-responses.ts            # External API response types
├── database.ts                 # Database entity types
├── jobs.ts                     # Job system types
├── integrations.ts             # Integration types
├── market-research.ts          # Market research types
└── README.md                   # This file

src/modules/
├── prospecting/types.ts        # Prospecting module types
├── market-research/types.ts    # Market research module types
└── crm/types.ts               # CRM module types
```

## Usage

### Importing Types

You can import types from the central index:

```typescript
import { GooglePlacesResponse, Lead, JobPayload } from '@/types';
```

Or from specific files:

```typescript
import { GooglePlacesResponse } from '@/types/api-responses';
import { Lead } from '@/types/database';
import { JobPayload } from '@/types/jobs';
```

### Module-Specific Types

For module-specific types, import from the module:

```typescript
import { ProspectLead, LeadImportJob } from '@/modules/prospecting/types';
import { ResearchContext, GoogleTrendsData } from '@/modules/market-research/types';
import { LeadUpdate, PipelineStage } from '@/modules/crm/types';
```

## Type Categories

### 1. API Response Types (`api-responses.ts`)

External API response structures for:

- **Google Places API**
  - `GooglePlacesResponse` - Search results
  - `GooglePlaceDetails` - Detailed place information
  - `GooglePlaceResult` - Individual place result

- **Brazilian APIs**
  - `BrasilAPIResponse` - BrasilAPI CNPJ data
  - `ReceitaWSResponse` - ReceitaWS CNPJ data
  - `RDAPResponse` - Domain registration data
  - `CNAE` - Business activity classification
  - `QSA` - Partners and administrators

- **PageSpeed API**
  - `PageSpeedResponse` - Google PageSpeed Insights

- **Lovable AI**
  - `LovableAIResponse` - AI synthesis response

**Usage Example:**
```typescript
import { GooglePlacesResponse } from '@/types/api-responses';

async function searchPlaces(query: string): Promise<GooglePlacesResponse> {
  const response = await fetch(`https://maps.googleapis.com/...`);
  const data: GooglePlacesResponse = await response.json();
  return data;
}
```

### 2. Database Entity Types (`database.ts`)

Supabase database entity types:

- **Lead Types**
  - `Lead` - Core lead entity (alias for ProspectLead)
  - `LeadUpdate` - Partial lead update
  - `LeadCreateInput` - Lead creation input

- **Job Types**
  - `Job` - Background job entity
  - `JobStatus` - Job status enum
  - `JobSourceStats` - Import job statistics
  - `JobCreateInput` - Job creation input

- **Import Error Types**
  - `ImportError` - Import error entity
  - `ImportErrorSeverity` - Error severity levels
  - `ImportErrorCreateInput` - Error creation input

- **Followup Types**
  - `FollowupHistoryItem` - Followup history record
  - `FollowupHistoryCreateInput` - Followup creation input

- **Market Research Types**
  - `MarketResearchReport` - Saved research report
  - `NormalizedIntent` - Normalized search intent

- **Helper Types**
  - `SupabaseResponse<T>` - Generic Supabase response
  - `SupabaseError` - Supabase error type
  - `PaginatedResponse<T>` - Paginated response wrapper

**Usage Example:**
```typescript
import { Lead, LeadUpdate } from '@/types/database';

async function updateLead(id: string, updates: LeadUpdate): Promise<Lead> {
  const { data, error } = await supabase
    .from('leads_import')
    .update(updates)
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
}
```

### 3. Job System Types (`jobs.ts`)

Background job processing types:

- **Job Payload Types**
  - `BaseJobPayload` - Base payload interface
  - `LeadImportJobPayload` - Lead import job
  - `PlacesBulkJobPayload` - Places bulk search
  - `MarketResearchJobPayload` - Market research job
  - `SiteGenerationJobPayload` - Site generation job
  - `FollowupJobPayload` - Followup automation job
  - `JobPayload` - Union of all payloads

- **Job Result Types**
  - `BaseJobResult` - Base result interface
  - `LeadImportJobResult` - Lead import result
  - `PlacesBulkJobResult` - Places search result
  - `MarketResearchJobResult` - Research result
  - `SiteGenerationJobResult` - Site generation result
  - `FollowupJobResult` - Followup result
  - `JobResult` - Union of all results

- **Job Metadata Types**
  - `JobMetadata` - Job execution metadata
  - `JobProgress` - Progress update
  - `JobQueueConfig` - Queue configuration
  - `JobQueueStats` - Queue statistics
  - `JobEvent` - Job event
  - `JobError` - Job error

- **Type Guards**
  - `isLeadImportJobPayload()` - Check payload type
  - `isLeadImportJobResult()` - Check result type
  - And more...

**Usage Example:**
```typescript
import { JobPayload, JobResult, isLeadImportJobPayload } from '@/types/jobs';

async function processJob(payload: JobPayload): Promise<JobResult> {
  if (isLeadImportJobPayload(payload)) {
    // TypeScript knows payload is LeadImportJobPayload here
    return await processLeadImport(payload);
  }
  // Handle other job types...
}
```

### 4. Integration Types (`integrations.ts`)

External service integration types:

- **Make.com Integration**
  - `MakeWebhookPayload` - Webhook payload
  - `MakeWebhookResponse` - Webhook response
  - `LeadExportPayload` - Lead export to Make

- **Messaging Platform Types**
  - `MessagePayload` - Generic message payload
  - `MessageResponse` - Message response
  - `WhatsAppMessagePayload` - WhatsApp specific
  - `InstagramMessagePayload` - Instagram specific
  - `EmailMessagePayload` - Email specific

- **Outreach Types**
  - `OutreachStrategy` - Strategy enum ('neutro' | 'agressivo' | 'consultivo')
  - `OutreachIntensity` - Intensity enum ('leve' | 'moderado' | 'intenso')
  - `OutreachConfig` - Outreach configuration
  - `OutreachResult` - Outreach result

- **Webhook Types**
  - `WebhookPayload` - Generic webhook payload
  - `WebhookConfig` - Webhook configuration
  - `WebhookDeliveryResult` - Delivery result

- **CRM Integration**
  - `CRMSyncPayload` - CRM sync payload
  - `CRMSyncResult` - CRM sync result

- **Type Guards**
  - `isValidOutreachStrategy()` - Validate strategy
  - `isValidOutreachIntensity()` - Validate intensity
  - `isValidMessageChannel()` - Validate channel

**Usage Example:**
```typescript
import { 
  OutreachStrategy, 
  OutreachIntensity, 
  MessagePayload,
  isValidOutreachStrategy 
} from '@/types/integrations';

function sendMessage(
  recipient: string,
  message: string,
  strategy: string
): Promise<void> {
  if (!isValidOutreachStrategy(strategy)) {
    throw new Error('Invalid strategy');
  }
  
  const payload: MessagePayload = {
    recipient,
    message,
    channel: 'WhatsApp',
    metadata: { strategy }
  };
  
  return sendToChannel(payload);
}
```

### 5. Market Research Types (`market-research.ts`)

Market research specific types:

- **Core Types**
  - `MarketResearchReport` - Complete research report
  - `MarketResearchSource` - Data source information
  - `MarketResearchTrendSignal` - Trend signal enum
  - `MarketResearchConfidenceLevel` - Confidence level enum
  - `NormalizedIntent` - Normalized search intent

- **Report Components**
  - `MarketResearchCompetitor` - Competitor information
  - `MarketResearchQuestion` - Audience question
  - `MarketResearchChart` - Chart data

**Usage Example:**
```typescript
import { MarketResearchReport, MarketResearchSource } from '@/types/market-research';

async function generateReport(input: string): Promise<MarketResearchReport> {
  const sources: MarketResearchSource[] = await fetchSources(input);
  
  return {
    ok: true,
    summary: 'Market analysis...',
    trendSignal: 'growing',
    confidenceLevel: 'high',
    // ... other fields
  };
}
```

## Module-Specific Types

### Prospecting Module (`modules/prospecting/types.ts`)

Extended types for the prospecting module:

- **Lead Types** - `ProspectLead`, `LeadStatus`, `ContactStatus`
- **Import Types** - `LeadImportJob`, `ParsedLeadData`, `LeadValidationResult`
- **Social Discovery** - `SocialDiscoveryData`, `SocialDiscoveryStatus`
- **Playbook Types** - `Playbook`, `PlaybookStage`
- **Revenue Types** - `LeadRevenueInsight`, `SalesService`
- **Automation Types** - `FollowUpSequence`, `AutonomousDecision`
- **Analysis Types** - `EmotionalAnalysis`, `PsychologicalAnalysis`

### Market Research Module (`modules/market-research/types.ts`)

Extended types for market research:

- **Context Types** - `ResearchContext`, `NormalizedIntent`
- **Provider Types** - `ResearchProvider`, `ResearchProviderResult`
- **Google Trends** - `GoogleTrendsData`
- **AI Synthesis** - `AISynthesisRequest`, `AISynthesisResponse`
- **Report Building** - `ReportBuilderContext`, `ReportSection`
- **Market Analysis** - `MarketSizeEstimate`, `CompetitiveLandscape`

### CRM Module (`modules/crm/types.ts`)

Extended types for the CRM module:

- **Update Types** - `LeadUpdate`
- **Pipeline Types** - `PipelineStage`, `PipelineStageConfig`, `PipelineStatistics`
- **Activity Types** - `CRMActivity`, `ActivityType`
- **Task Types** - `CRMTask`, `TaskPriority`, `TaskStatus`
- **Filter Types** - `LeadFilterCriteria`, `LeadSortOptions`
- **Export Types** - `ExportOptions`, `ExportResult`, `ExportFormat`
- **Dashboard Types** - `DashboardMetrics`, `DashboardChartData`
- **Notification Types** - `CRMNotification`, `NotificationType`

## Type Safety Best Practices

### 1. Use Type Guards

Type guards help narrow types safely:

```typescript
import { JobPayload, isLeadImportJobPayload } from '@/types/jobs';

function handleJob(payload: JobPayload) {
  if (isLeadImportJobPayload(payload)) {
    // TypeScript knows payload.source exists here
    console.log(payload.source);
  }
}
```

### 2. Avoid 'any'

Always use proper types instead of 'any':

```typescript
// ❌ Bad
const data: any = await response.json();

// ✅ Good
import { GooglePlacesResponse } from '@/types/api-responses';
const data: GooglePlacesResponse = await response.json();
```

### 3. Use 'unknown' for Error Handling

Use 'unknown' instead of 'any' in catch blocks:

```typescript
// ❌ Bad
catch (err: any) {
  console.error(err.message);
}

// ✅ Good
catch (err: unknown) {
  if (err instanceof Error) {
    console.error(err.message);
  } else {
    console.error('Unknown error occurred');
  }
}
```

### 4. Leverage Union Types

Use union types for enums and variants:

```typescript
import { JobStatus } from '@/types/database';

// JobStatus is 'pending' | 'running' | 'done' | 'failed' | 'cancelled'
function updateJobStatus(id: string, status: JobStatus) {
  // TypeScript ensures only valid statuses are passed
}
```

### 5. Use Partial for Updates

Use `Partial<T>` for update operations:

```typescript
import { Lead } from '@/types/database';

// Only update specific fields
const updates: Partial<Lead> = {
  status: 'Qualificado',
  lastContactAt: new Date().toISOString()
};
```

## Zod Schemas

For runtime validation, create Zod schemas alongside TypeScript types:

```typescript
import { z } from 'zod';
import type { LeadCreateInput } from '@/types/database';

export const leadCreateInputSchema = z.object({
  companyName: z.string().min(1),
  niche: z.string().min(1),
  city: z.string().min(1),
  source: z.string().min(1),
  opportunityScore: z.number().min(0).max(100).optional(),
  // ... other fields
}) satisfies z.ZodType<LeadCreateInput>;
```

## Migration Guide

### Replacing 'any' Types

When replacing 'any' types in existing code:

1. **Identify the data structure** - Look at how the data is used
2. **Find or create the appropriate type** - Check if a type already exists
3. **Import the type** - Add the import statement
4. **Replace 'any'** - Update the type annotation
5. **Fix type errors** - Address any TypeScript errors that arise

Example:

```typescript
// Before
const json: any = await res.json();
const places = json.results;

// After
import { GooglePlacesResponse } from '@/types/api-responses';

const json: GooglePlacesResponse = await res.json();
const places = json.results; // TypeScript knows this is GooglePlaceResult[]
```

### Common Patterns

**API Responses:**
```typescript
// Before: const data: any = await response.json();
// After:
import { GooglePlacesResponse } from '@/types/api-responses';
const data: GooglePlacesResponse = await response.json();
```

**Database Operations:**
```typescript
// Before: const updates: any = { status: 'done' };
// After:
import { LeadUpdate } from '@/types/database';
const updates: LeadUpdate = { status: 'Qualificado' };
```

**Job Processing:**
```typescript
// Before: function processJob(payload: any): Promise<any>
// After:
import { JobPayload, JobResult } from '@/types/jobs';
function processJob(payload: JobPayload): Promise<JobResult>
```

## Contributing

When adding new types:

1. **Choose the right file** - Place types in the appropriate category
2. **Add JSDoc comments** - Document the purpose and usage
3. **Export the type** - Make it available for import
4. **Update this README** - Document the new type
5. **Create type guards** - Add type guards for union types
6. **Consider Zod schemas** - Add runtime validation if needed

## Related Documentation

- [Type Audit Report](../../../.kiro/coordination/audits/any-type-audit.md)
- [Design Document](../../../.kiro/specs/kiro-lovable-coordination/design.md)
- [Requirements Document](../../../.kiro/specs/kiro-lovable-coordination/requirements.md)

## Support

For questions or issues with types:

1. Check this README first
2. Review the type audit report
3. Check the design document for architectural guidance
4. Consult the TypeScript documentation

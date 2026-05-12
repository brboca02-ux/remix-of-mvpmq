# Design Document: Kiro-Lovable Coordination System

## Overview

The Kiro-Lovable Coordination System is a comprehensive framework for managing collaborative development between two AI tools (Kiro and Lovable) on the MarketScope AI project. This system addresses the challenges of simultaneous development by establishing clear ownership boundaries, coordination workflows, automated quality gates, and conflict resolution mechanisms.

### Problem Statement

The MarketScope AI project currently faces several coordination challenges:
- **100+ console.log statements** scattered throughout the codebase
- **100+ `any` types** compromising type safety
- **Memory leaks** in useEffect hooks without cleanup
- **1000+ line store file** requiring refactoring
- **Mock authentication** still present in production code
- **Merge conflicts** from simultaneous file modifications
- **Inconsistent code patterns** between Kiro and Lovable contributions

### Solution Approach

This design implements a multi-layered coordination system:

1. **File Ownership System**: Clear boundaries preventing simultaneous modifications
2. **Coordination Workflows**: Structured handoff procedures for shared files
3. **Automated Quality Gates**: Pre-commit hooks and linting rules enforcing standards
4. **Conflict Detection**: Early warning system for overlapping work
5. **Documentation Standards**: Consistent patterns for both tools
6. **Testing Infrastructure**: Comprehensive testing requirements for both tools

### Key Design Principles

- **Simplicity**: No additional paid tools, manageable by a single developer
- **Automation**: Enforce standards through tooling, not manual review
- **Clarity**: Explicit ownership and unambiguous workflows
- **Reversibility**: Easy rollback strategies for problematic changes
- **Traceability**: Clear attribution of changes to specific tools



## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    User (Developer)                          │
│  - Coordinates between Kiro and Lovable                     │
│  - Reviews handoffs and resolves conflicts                  │
└────────────┬────────────────────────────────┬───────────────┘
             │                                │
    ┌────────▼────────┐              ┌───────▼────────┐
    │      Kiro       │              │    Lovable     │
    │  (Backend/Logic)│              │   (UI/Design)  │
    └────────┬────────┘              └───────┬────────┘
             │                                │
             └────────────┬───────────────────┘
                          │
         ┌────────────────▼────────────────────┐
         │   Coordination Infrastructure       │
         ├─────────────────────────────────────┤
         │ • File Ownership Registry           │
         │ • Work Log System                   │
         │ • Quality Gates (ESLint, TS, Hooks) │
         │ • Conflict Detection                │
         │ • Documentation Templates           │
         └─────────────────────────────────────┘
                          │
         ┌────────────────▼────────────────────┐
         │        Git Repository               │
         │  - Version control                  │
         │  - Commit attribution               │
         │  - Conflict resolution              │
         └─────────────────────────────────────┘
```

### Data Flow

**1. Work Initiation Flow**
```
User Request → Tool Selection → Work Log Update → File Ownership Check → 
Conflict Detection → Work Execution → Quality Gates → Commit → Handoff (if needed)
```

**2. Shared File Modification Flow**
```
Tool Requests Change → User Approval → Current State Read → 
Modification → Documentation → Other Tool Notification → Verification
```

**3. Conflict Resolution Flow**
```
Conflict Detected → Ownership Check → Responsible Tool Identified → 
Resolution Execution → Testing → Commit → Both Tools Notified
```

### Integration Points

1. **Git Hooks**: Pre-commit validation, ownership enforcement
2. **ESLint**: Code quality rules, console.log detection, type safety
3. **TypeScript Compiler**: Strict mode enforcement, type checking
4. **Vitest**: Test execution and validation
5. **Package Manager (bun)**: Dependency coordination
6. **File System**: Ownership registry, work logs, documentation



## Components and Interfaces

### 1. File Ownership Registry

**Location**: `.kiro/coordination/ownership.json`

**Purpose**: Central registry mapping file patterns to tool ownership

**Schema**:
```typescript
interface OwnershipRegistry {
  version: string;
  lastUpdated: string;
  ownership: {
    kiro: OwnershipPattern[];
    lovable: OwnershipPattern[];
    shared: OwnershipPattern[];
  };
}

interface OwnershipPattern {
  pattern: string;        // Glob pattern (e.g., "src/server/**/*")
  description: string;    // Human-readable explanation
  rationale: string;      // Why this ownership assignment
  examples?: string[];    // Example file paths
}
```

**Example Content**:
```json
{
  "version": "1.0.0",
  "lastUpdated": "2025-01-15T10:00:00Z",
  "ownership": {
    "kiro": [
      {
        "pattern": "src/server/**/*",
        "description": "All server-side functions and API endpoints",
        "rationale": "Kiro handles complex backend logic and integrations",
        "examples": ["src/server/auth.ts", "src/server/api/leads.ts"]
      },
      {
        "pattern": "src/lib/**/*",
        "description": "Utility libraries and helper functions",
        "rationale": "Kiro manages reusable logic and algorithms"
      },
      {
        "pattern": "src/modules/*/types.ts",
        "description": "TypeScript type definitions for modules",
        "rationale": "Kiro defines and maintains type system"
      },
      {
        "pattern": "src/integrations/supabase/**/*",
        "description": "Supabase integration and database logic",
        "rationale": "Kiro handles database operations and queries"
      },
      {
        "pattern": "src/**/__tests__/**/*",
        "description": "Test files and test utilities",
        "rationale": "Kiro creates comprehensive test suites"
      }
    ],
    "lovable": [
      {
        "pattern": "src/components/ui/**/*",
        "description": "shadcn/ui component library",
        "rationale": "Lovable manages design system components"
      },
      {
        "pattern": "src/components/templates/**/*",
        "description": "Page templates and layouts",
        "rationale": "Lovable creates visual templates"
      },
      {
        "pattern": "src/components/**/*.tsx",
        "description": "React components (excluding ui and templates)",
        "rationale": "Lovable builds user interface components"
      },
      {
        "pattern": "src/styles.css",
        "description": "Global styles",
        "rationale": "Lovable manages styling"
      },
      {
        "pattern": "tailwind.config.*",
        "description": "Tailwind configuration",
        "rationale": "Lovable configures design tokens"
      }
    ],
    "shared": [
      {
        "pattern": "src/routes/**/*.tsx",
        "description": "TanStack Router route definitions",
        "rationale": "Routes connect UI (Lovable) with data (Kiro)",
        "examples": ["src/routes/index.tsx", "src/routes/crm.tsx"]
      },
      {
        "pattern": "src/hooks/**/*",
        "description": "React hooks",
        "rationale": "Hooks bridge UI logic and business logic"
      },
      {
        "pattern": "package.json",
        "description": "Project dependencies",
        "rationale": "Both tools add dependencies"
      },
      {
        "pattern": "tsconfig.json",
        "description": "TypeScript configuration",
        "rationale": "Affects both tools' code"
      }
    ]
  }
}
```

**Validation CLI**: `bun run check-ownership <file-path>`

Returns: `kiro`, `lovable`, `shared`, or `unassigned`

---

### 2. Work Log System

**Location**: `.kiro/coordination/work-log.md`

**Purpose**: Track current work to prevent conflicts

**Format**:
```markdown
# Work Log

## Current Work

### [Kiro] 2025-01-15 10:30 - Authentication Implementation
**Status**: In Progress
**Files**:
- src/server/auth.ts
- src/integrations/supabase/auth-client.ts
- src/modules/auth/types.ts

**Description**: Implementing real Supabase authentication to replace mock auth

**Expected Completion**: 2025-01-15 14:00

**Handoff Needed**: Yes - Lovable will need to update login UI components

---

### [Lovable] 2025-01-15 09:00 - CRM Dashboard UI
**Status**: Completed
**Files**:
- src/components/crm/CRMSummaryBar.tsx
- src/components/crm/LeadCard.tsx
- src/routes/crm.tsx

**Description**: Created new CRM summary bar and lead card components

**Completed**: 2025-01-15 10:15

**Handoff**: Kiro - New components need type definitions for props

---

## Completed Work (Last 7 Days)

[Archive of completed work items...]
```

**Update Commands**:
- `bun run work-log:start <tool> <description>` - Start new work
- `bun run work-log:complete <id>` - Mark work complete
- `bun run work-log:status` - Show current work

---

### 3. Handoff Document Template

**Location**: `.kiro/coordination/templates/handoff-template.md`

**Purpose**: Standardize context transfer between tools

**Template**:
```markdown
# Handoff: [Feature Name]

**From**: [Kiro/Lovable]
**To**: [Lovable/Kiro]
**Date**: YYYY-MM-DD HH:MM

## Summary
[Brief description of what was accomplished]

## Files Modified
- `path/to/file1.ts` - [What changed]
- `path/to/file2.tsx` - [What changed]

## New Types/Interfaces (Kiro → Lovable)
```typescript
// Copy relevant type definitions here
```

## New Components (Lovable → Kiro)
- `ComponentName` - Purpose and props
- `AnotherComponent` - Purpose and props

## Integration Points
[Describe how the work connects to the other tool's domain]

## Dependencies Added
- `package-name@version` - Why it was added

## Next Steps for Receiving Tool
1. [Specific action needed]
2. [Another action]

## Testing Notes
[What was tested, what still needs testing]

## Questions/Clarifications Needed
- [Any unclear points]
```

---

### 4. Quality Gate System

#### 4.1 ESLint Configuration Enhancement

**Location**: `eslint.config.js`

**New Rules**:
```javascript
export default tseslint.config(
  { ignores: ["dist", ".output", ".vinxi"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      
      // ===== COORDINATION SYSTEM RULES =====
      
      // Prohibit console.log in production
      "no-console": ["error", { 
        allow: ["warn", "error"] 
      }],
      
      // Enforce explicit types (no 'any')
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/explicit-function-return-type": ["error", {
        allowExpressions: true,
        allowTypedFunctionExpressions: true
      }],
      
      // Require parameter types
      "@typescript-eslint/explicit-module-boundary-types": "error",
      
      // Prohibit @ts-ignore without justification
      "@typescript-eslint/ban-ts-comment": ["error", {
        "ts-ignore": "allow-with-description",
        "minimumDescriptionLength": 10
      }],
      
      // Enforce error handling
      "no-empty": ["error", { 
        allowEmptyCatch: false 
      }],
      
      // Require cleanup in useEffect
      "react-hooks/exhaustive-deps": "error",
      
      // Enforce single responsibility (max function length)
      "max-lines-per-function": ["warn", {
        max: 50,
        skipBlankLines: true,
        skipComments: true
      }],
      
      // Prohibit magic numbers
      "no-magic-numbers": ["warn", {
        ignore: [0, 1, -1],
        ignoreArrayIndexes: true,
        enforceConst: true
      }],
      
      // Unused variables (re-enable for coordination)
      "@typescript-eslint/no-unused-vars": ["error", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_"
      }]
    },
  },
  eslintPluginPrettier,
);
```

#### 4.2 Structured Logging Utility

**Location**: `src/lib/logger.ts`

**Purpose**: Replace console.log with structured logging

**Implementation**:
```typescript
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;

  private log(level: LogLevel, message: string, context?: LogContext): void {
    if (!this.isDevelopment && level === 'debug') {
      return; // Skip debug logs in production
    }

    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...context,
    };

    // In development: pretty print
    if (this.isDevelopment) {
      const emoji = {
        debug: '🔍',
        info: 'ℹ️',
        warn: '⚠️',
        error: '❌',
      }[level];
      
      console[level === 'debug' ? 'log' : level](
        `${emoji} [${level.toUpperCase()}] ${message}`,
        context || ''
      );
    } else {
      // In production: structured JSON (for log aggregation)
      console[level === 'error' ? 'error' : 'warn'](JSON.stringify(logEntry));
    }
  }

  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error, context?: LogContext): void {
    this.log('error', message, {
      ...context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : undefined,
    });
  }
}

export const logger = new Logger();

// Usage examples:
// logger.debug('User clicked button', { userId: '123', buttonId: 'submit' });
// logger.info('Lead created', { leadId: lead.id, source: 'google_places' });
// logger.warn('API rate limit approaching', { remaining: 10, limit: 100 });
// logger.error('Failed to save lead', error, { leadId: '456' });
```

#### 4.3 Pre-commit Hook

**Location**: `.husky/pre-commit` (requires husky installation)

**Purpose**: Enforce quality gates before commit

**Implementation**:
```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

echo "🔍 Running pre-commit checks..."

# 1. Check file ownership
echo "📋 Checking file ownership..."
bun run check-ownership:staged
if [ $? -ne 0 ]; then
  echo "❌ Ownership violation detected. Please review file ownership rules."
  exit 1
fi

# 2. Run TypeScript type checking
echo "🔷 Running TypeScript checks..."
bun run tsc --noEmit
if [ $? -ne 0 ]; then
  echo "❌ TypeScript errors detected. Please fix type errors."
  exit 1
fi

# 3. Run ESLint
echo "🔍 Running ESLint..."
bun run lint
if [ $? -ne 0 ]; then
  echo "❌ Linting errors detected. Please fix linting errors."
  exit 1
fi

# 4. Run tests
echo "🧪 Running tests..."
bun run test:quick
if [ $? -ne 0 ]; then
  echo "❌ Tests failed. Please fix failing tests."
  exit 1
fi

echo "✅ All pre-commit checks passed!"
```

---

### 5. Conflict Detection System

#### 5.1 Recent Changes Checker

**Location**: `scripts/check-recent-changes.ts`

**Purpose**: Detect files recently modified by the other tool

**Implementation**:
```typescript
import { execSync } from 'child_process';
import { readFileSync } from 'fs';

interface RecentChange {
  file: string;
  tool: 'Kiro' | 'Lovable';
  timestamp: string;
  commitHash: string;
}

function getRecentChanges(hours: number = 24): RecentChange[] {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  
  const gitLog = execSync(
    `git log --since="${since}" --name-only --pretty=format:"%H|%ai|%s"`,
    { encoding: 'utf-8' }
  );

  const changes: RecentChange[] = [];
  const commits = gitLog.split('\n\n');

  for (const commit of commits) {
    const lines = commit.split('\n');
    const [hash, timestamp, message] = lines[0].split('|');
    
    const tool = message.startsWith('[Kiro]') ? 'Kiro' : 
                 message.startsWith('[Lovable]') ? 'Lovable' : null;
    
    if (!tool) continue;

    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        changes.push({
          file: lines[i].trim(),
          tool,
          timestamp,
          commitHash: hash,
        });
      }
    }
  }

  return changes;
}

function checkConflicts(filesToModify: string[]): void {
  const recentChanges = getRecentChanges(24);
  const conflicts: Array<{ file: string; lastModifiedBy: string; when: string }> = [];

  for (const file of filesToModify) {
    const recentChange = recentChanges.find(c => c.file === file);
    if (recentChange) {
      conflicts.push({
        file,
        lastModifiedBy: recentChange.tool,
        when: recentChange.timestamp,
      });
    }
  }

  if (conflicts.length > 0) {
    console.warn('⚠️  Potential conflicts detected:');
    conflicts.forEach(c => {
      console.warn(`   ${c.file} - last modified by ${c.lastModifiedBy} at ${c.when}`);
    });
    console.warn('\n💡 Consider coordinating with the other tool before proceeding.');
  }
}

// Usage: bun run check-conflicts src/routes/crm.tsx src/hooks/useLeads.ts
const filesToCheck = process.argv.slice(2);
checkConflicts(filesToCheck);
```

#### 5.2 Work Log Conflict Detector

**Location**: `scripts/check-work-log.ts`

**Purpose**: Check if files are currently being worked on

**Implementation**:
```typescript
import { readFileSync } from 'fs';

interface WorkItem {
  tool: 'Kiro' | 'Lovable';
  files: string[];
  status: 'In Progress' | 'Completed';
}

function parseWorkLog(): WorkItem[] {
  const workLog = readFileSync('.kiro/coordination/work-log.md', 'utf-8');
  const items: WorkItem[] = [];
  
  const sections = workLog.split('###').slice(1);
  
  for (const section of sections) {
    const toolMatch = section.match(/\[(Kiro|Lovable)\]/);
    const statusMatch = section.match(/\*\*Status\*\*: (In Progress|Completed)/);
    const filesMatch = section.match(/\*\*Files\*\*:\n((?:- .+\n?)+)/);
    
    if (toolMatch && statusMatch && filesMatch) {
      const files = filesMatch[1]
        .split('\n')
        .filter(line => line.trim().startsWith('-'))
        .map(line => line.replace(/^- /, '').trim());
      
      items.push({
        tool: toolMatch[1] as 'Kiro' | 'Lovable',
        files,
        status: statusMatch[1] as 'In Progress' | 'Completed',
      });
    }
  }
  
  return items.filter(item => item.status === 'In Progress');
}

function checkWorkLogConflicts(filesToModify: string[]): void {
  const activeWork = parseWorkLog();
  const conflicts: Array<{ file: string; activeBy: string }> = [];

  for (const file of filesToModify) {
    for (const work of activeWork) {
      if (work.files.includes(file)) {
        conflicts.push({
          file,
          activeBy: work.tool,
        });
      }
    }
  }

  if (conflicts.length > 0) {
    console.error('🚫 Work log conflicts detected:');
    conflicts.forEach(c => {
      console.error(`   ${c.file} - currently being worked on by ${c.activeBy}`);
    });
    console.error('\n❌ Please coordinate before modifying these files.');
    process.exit(1);
  }
}

// Usage: bun run check-work-log src/routes/crm.tsx
const filesToCheck = process.argv.slice(2);
checkWorkLogConflicts(filesToCheck);
```



## Data Models

### 1. Ownership Registry Schema

```typescript
// .kiro/coordination/ownership.json
interface OwnershipRegistry {
  version: string;                    // Semantic version (e.g., "1.0.0")
  lastUpdated: string;                // ISO 8601 timestamp
  ownership: {
    kiro: OwnershipPattern[];
    lovable: OwnershipPattern[];
    shared: OwnershipPattern[];
  };
}

interface OwnershipPattern {
  pattern: string;                    // Glob pattern
  description: string;                // Human-readable description
  rationale: string;                  // Why this ownership
  examples?: string[];                // Example file paths
  exceptions?: string[];              // Glob patterns for exceptions
}
```

### 2. Work Log Schema

```typescript
// Parsed from .kiro/coordination/work-log.md
interface WorkLog {
  currentWork: WorkItem[];
  completedWork: WorkItem[];
}

interface WorkItem {
  id: string;                         // Auto-generated UUID
  tool: 'Kiro' | 'Lovable';
  title: string;
  description: string;
  status: 'In Progress' | 'Completed' | 'Blocked';
  files: string[];                    // File paths
  startedAt: string;                  // ISO 8601 timestamp
  completedAt?: string;               // ISO 8601 timestamp
  expectedCompletion?: string;        // ISO 8601 timestamp
  handoffNeeded: boolean;
  handoffTo?: 'Kiro' | 'Lovable';
  blockingReason?: string;
}
```

### 3. Handoff Document Schema

```typescript
interface HandoffDocument {
  from: 'Kiro' | 'Lovable';
  to: 'Kiro' | 'Lovable';
  date: string;                       // ISO 8601 timestamp
  featureName: string;
  summary: string;
  filesModified: FileChange[];
  newTypes?: TypeDefinition[];        // Kiro → Lovable
  newComponents?: ComponentInfo[];    // Lovable → Kiro
  integrationPoints: string[];
  dependenciesAdded: Dependency[];
  nextSteps: string[];
  testingNotes: string;
  questions: string[];
}

interface FileChange {
  path: string;
  changeDescription: string;
}

interface TypeDefinition {
  name: string;
  definition: string;                 // TypeScript code
  location: string;                   // File path
}

interface ComponentInfo {
  name: string;
  purpose: string;
  props: string;                      // TypeScript interface
  location: string;                   // File path
}

interface Dependency {
  name: string;
  version: string;
  reason: string;
}
```

### 4. Commit Message Schema

```typescript
interface CommitMessage {
  tool: 'Kiro' | 'Lovable';
  type: 'feat' | 'fix' | 'refactor' | 'test' | 'docs' | 'chore';
  scope?: string;                     // Module or feature name
  description: string;
  body?: string;
  breaking?: boolean;
}

// Format: [Tool] type(scope): description
// Example: [Kiro] feat(auth): implement Supabase authentication
// Example: [Lovable] fix(crm): correct lead card layout
```

### 5. Module Structure

```typescript
// Standard module organization
interface ModuleStructure {
  name: string;                       // kebab-case (e.g., "prospecting")
  path: string;                       // src/modules/{name}/
  files: {
    types: string;                    // types.ts (Kiro-owned)
    store: string;                    // {name}-store.ts (Kiro-owned)
    server?: string[];                // server functions (Kiro-owned)
    hooks?: string[];                 // React hooks (Shared)
    components?: string[];            // UI components (Lovable-owned)
    index: string;                    // index.ts - public API (Kiro-owned)
  };
}

// Example: src/modules/prospecting/
// ├── types.ts                 (Kiro)
// ├── prospecting-store.ts     (Kiro)
// ├── server/
// │   ├── create-lead.ts       (Kiro)
// │   └── update-lead.ts       (Kiro)
// ├── hooks/
// │   └── useLeads.ts          (Shared)
// ├── components/
// │   ├── LeadCard.tsx         (Lovable)
// │   └── LeadForm.tsx         (Lovable)
// └── index.ts                 (Kiro)
```

### 6. Store Refactoring Schema

```typescript
// Target structure for breaking up 1000+ line store
interface StoreModule {
  name: string;
  path: string;                       // src/modules/{module}/{name}-store.ts
  maxLines: 300;                      // Enforce size limit
  responsibilities: string[];
  exports: {
    state: StateDefinition[];
    actions: ActionDefinition[];
    selectors: SelectorDefinition[];
  };
}

interface StateDefinition {
  name: string;
  type: string;                       // TypeScript type
  initialValue: string;               // Code representation
}

interface ActionDefinition {
  name: string;
  parameters: Parameter[];
  returnType: string;
  description: string;
}

interface SelectorDefinition {
  name: string;
  returnType: string;
  description: string;
}

interface Parameter {
  name: string;
  type: string;
  optional: boolean;
}
```

### 7. Test File Schema

```typescript
interface TestFile {
  path: string;                       // Mirrors source file path
  type: 'unit' | 'integration' | 'property' | 'smoke';
  sourceFile: string;                 // File being tested
  framework: 'vitest';
  describes: TestSuite[];
}

interface TestSuite {
  description: string;
  tests: TestCase[];
}

interface TestCase {
  description: string;
  type: 'example' | 'property' | 'edge-case';
  propertyReference?: string;         // Links to design property
  iterations?: number;                // For property tests (min 100)
}

// Naming convention:
// src/server/auth.ts → src/__tests__/server/auth.test.ts
// src/components/LeadCard.tsx → src/__tests__/components/LeadCard.test.tsx
```



## Error Handling

### 1. Ownership Violations

**Scenario**: Tool attempts to modify file owned by the other tool

**Detection**: Pre-commit hook checks file ownership

**Resolution**:
```typescript
class OwnershipViolationError extends Error {
  constructor(
    public file: string,
    public attemptedBy: 'Kiro' | 'Lovable',
    public ownedBy: 'Kiro' | 'Lovable'
  ) {
    super(`Ownership violation: ${file} is owned by ${ownedBy}, attempted by ${attemptedBy}`);
  }
}

// Handler
function handleOwnershipViolation(error: OwnershipViolationError): void {
  logger.error('Ownership violation detected', error, {
    file: error.file,
    attemptedBy: error.attemptedBy,
    ownedBy: error.ownedBy,
  });
  
  console.error(`
❌ Ownership Violation

File: ${error.file}
Owned by: ${error.ownedBy}
Attempted by: ${error.attemptedBy}

Resolution:
1. If this is a shared file, follow the coordination workflow
2. If ownership is incorrect, update .kiro/coordination/ownership.json
3. If this is an emergency, document the reason and proceed with caution
  `);
  
  process.exit(1);
}
```

### 2. Merge Conflicts

**Scenario**: Git merge conflict occurs

**Detection**: Git merge/pull operation fails

**Resolution Strategy**:
```typescript
interface ConflictResolution {
  file: string;
  ownership: 'kiro' | 'lovable' | 'shared';
  strategy: 'accept-kiro' | 'accept-lovable' | 'manual-merge';
  reason: string;
}

function resolveConflict(file: string): ConflictResolution {
  const ownership = checkOwnership(file);
  
  if (ownership === 'kiro') {
    return {
      file,
      ownership,
      strategy: 'accept-kiro',
      reason: 'File is Kiro-owned, Kiro changes take precedence',
    };
  }
  
  if (ownership === 'lovable') {
    return {
      file,
      ownership,
      strategy: 'accept-lovable',
      reason: 'File is Lovable-owned, Lovable changes take precedence',
    };
  }
  
  return {
    file,
    ownership,
    strategy: 'manual-merge',
    reason: 'Shared file requires manual review and merge',
  };
}
```

**Manual Merge Workflow**:
1. User reviews both versions
2. User creates merged version incorporating both changes
3. User tests merged version
4. User commits with message: `[Manual] merge: resolve conflict in {file}`

### 3. Type Errors

**Scenario**: TypeScript compilation fails

**Detection**: `tsc --noEmit` in pre-commit hook

**Resolution**:
```typescript
interface TypeErrorHandler {
  file: string;
  line: number;
  column: number;
  message: string;
  ownership: 'kiro' | 'lovable' | 'shared';
}

function handleTypeError(error: TypeErrorHandler): void {
  logger.error('TypeScript error detected', undefined, error);
  
  if (error.ownership === 'kiro') {
    console.error(`
❌ Type Error in Kiro-owned file

File: ${error.file}:${error.line}:${error.column}
Error: ${error.message}

Action Required:
→ Kiro must fix this type error before committing
→ If new types are needed, add them to src/modules/*/types.ts
    `);
  } else if (error.ownership === 'lovable') {
    console.error(`
❌ Type Error in Lovable-owned file

File: ${error.file}:${error.line}:${error.column}
Error: ${error.message}

Action Required:
→ Lovable must fix this type error before committing
→ If types are missing, request them from Kiro
→ Do NOT use 'any' as a workaround
    `);
  } else {
    console.error(`
❌ Type Error in Shared file

File: ${error.file}:${error.line}:${error.column}
Error: ${error.message}

Action Required:
→ Coordinate with both tools to resolve
→ Determine which tool should fix based on the nature of the error
    `);
  }
  
  process.exit(1);
}
```

### 4. Test Failures

**Scenario**: Test suite fails

**Detection**: `vitest run` in pre-commit hook

**Resolution**:
```typescript
interface TestFailure {
  testFile: string;
  testName: string;
  sourceFile: string;
  ownership: 'kiro' | 'lovable' | 'shared';
  error: string;
}

function handleTestFailure(failure: TestFailure): void {
  logger.error('Test failure detected', undefined, failure);
  
  console.error(`
❌ Test Failure

Test: ${failure.testName}
File: ${failure.testFile}
Source: ${failure.sourceFile}
Owned by: ${failure.ownership}

Error:
${failure.error}

Action Required:
→ ${failure.ownership === 'kiro' ? 'Kiro' : 'Lovable'} must fix the failing test
→ If the test is outdated, update it to match new behavior
→ If the behavior is wrong, fix the source code
→ Do NOT skip or comment out failing tests
  `);
  
  process.exit(1);
}
```

### 5. Dependency Conflicts

**Scenario**: Both tools add conflicting dependencies

**Detection**: Package manager reports peer dependency conflicts

**Resolution**:
```typescript
interface DependencyConflict {
  package: string;
  kiroVersion: string;
  lovableVersion: string;
  reason: string;
}

function resolveDependencyConflict(conflict: DependencyConflict): void {
  logger.warn('Dependency conflict detected', conflict);
  
  console.warn(`
⚠️  Dependency Conflict

Package: ${conflict.package}
Kiro wants: ${conflict.kiroVersion}
Lovable wants: ${conflict.lovableVersion}

Resolution Steps:
1. Check if versions are compatible (minor version differences usually OK)
2. If incompatible, determine which version is required
3. Update package.json to use the required version
4. Inform both tools of the chosen version
5. Test that both tools' features work with the chosen version
  `);
}
```

### 6. Work Log Conflicts

**Scenario**: Both tools try to work on the same file simultaneously

**Detection**: Work log checker script

**Resolution**:
```typescript
interface WorkLogConflict {
  file: string;
  currentTool: 'Kiro' | 'Lovable';
  requestingTool: 'Kiro' | 'Lovable';
  workItem: WorkItem;
}

function handleWorkLogConflict(conflict: WorkLogConflict): void {
  logger.error('Work log conflict detected', undefined, conflict);
  
  console.error(`
🚫 Work Log Conflict

File: ${conflict.file}
Currently being worked on by: ${conflict.currentTool}
Requested by: ${conflict.requestingTool}

Work Item: ${conflict.workItem.title}
Started: ${conflict.workItem.startedAt}
Expected completion: ${conflict.workItem.expectedCompletion || 'Unknown'}

Action Required:
1. Wait for ${conflict.currentTool} to complete work
2. OR coordinate with user to sequence the work
3. OR if urgent, ${conflict.currentTool} can commit current progress and hand off
  `);
  
  process.exit(1);
}
```

### 7. Rollback Procedures

**Scenario**: Recent changes cause issues and need to be reverted

**Process**:
```typescript
interface RollbackRequest {
  commitHash: string;
  reason: string;
  affectedTool: 'Kiro' | 'Lovable';
  filesAffected: string[];
}

function executeRollback(request: RollbackRequest): void {
  logger.warn('Executing rollback', request);
  
  console.warn(`
⏮️  Rollback Initiated

Commit: ${request.commitHash}
Tool: ${request.affectedTool}
Reason: ${request.reason}

Files affected:
${request.filesAffected.map(f => `  - ${f}`).join('\n')}

Steps:
1. Creating backup branch: backup/${request.commitHash}
2. Reverting commit: ${request.commitHash}
3. Running tests to verify rollback
4. Notifying ${request.affectedTool} of rollback
  `);
  
  // Execute git revert
  execSync(`git branch backup/${request.commitHash}`);
  execSync(`git revert ${request.commitHash} --no-edit`);
  
  // Notify both tools
  const notification = `
Rollback completed for commit ${request.commitHash}

Reason: ${request.reason}

${request.affectedTool}, please review the rollback and address the issues before re-implementing.

Backup branch created: backup/${request.commitHash}
  `;
  
  appendToWorkLog(notification);
  
  logger.info('Rollback completed', { commitHash: request.commitHash });
}
```



## Testing Strategy

### 1. Testing Philosophy

The coordination system requires a dual testing approach:

- **Unit Tests**: Verify specific behaviors and edge cases
- **Integration Tests**: Verify coordination workflows end-to-end
- **Smoke Tests**: Verify system health after changes

Property-based testing is **NOT applicable** for this coordination system because:
- The system is primarily configuration and workflow management
- Most components are declarative (JSON schemas, markdown templates)
- Behavior is deterministic based on file patterns and git state
- Testing focuses on specific scenarios rather than universal properties

### 2. Test Organization

```
src/
├── __tests__/
│   ├── coordination/
│   │   ├── ownership.test.ts           # Ownership registry tests
│   │   ├── work-log.test.ts            # Work log parsing tests
│   │   ├── conflict-detection.test.ts  # Conflict detection tests
│   │   └── handoff.test.ts             # Handoff workflow tests
│   ├── quality-gates/
│   │   ├── eslint-rules.test.ts        # ESLint rule tests
│   │   ├── logger.test.ts              # Logger utility tests
│   │   └── pre-commit.test.ts          # Pre-commit hook tests
│   └── integration/
│       ├── full-workflow.test.ts       # End-to-end workflow tests
│       └── rollback.test.ts            # Rollback procedure tests
```

### 3. Unit Test Requirements

#### 3.1 Ownership Registry Tests

**File**: `src/__tests__/coordination/ownership.test.ts`

**Test Cases**:
```typescript
import { describe, it, expect } from 'vitest';
import { checkOwnership, loadOwnershipRegistry } from '@/lib/ownership';

describe('Ownership Registry', () => {
  it('should correctly identify Kiro-owned files', () => {
    expect(checkOwnership('src/server/auth.ts')).toBe('kiro');
    expect(checkOwnership('src/lib/utils.ts')).toBe('kiro');
    expect(checkOwnership('src/modules/prospecting/types.ts')).toBe('kiro');
  });

  it('should correctly identify Lovable-owned files', () => {
    expect(checkOwnership('src/components/ui/button.tsx')).toBe('lovable');
    expect(checkOwnership('src/components/LeadCard.tsx')).toBe('lovable');
    expect(checkOwnership('src/styles.css')).toBe('lovable');
  });

  it('should correctly identify shared files', () => {
    expect(checkOwnership('src/routes/index.tsx')).toBe('shared');
    expect(checkOwnership('src/hooks/useLeads.ts')).toBe('shared');
    expect(checkOwnership('package.json')).toBe('shared');
  });

  it('should return unassigned for files not in registry', () => {
    expect(checkOwnership('random-file.txt')).toBe('unassigned');
  });

  it('should handle glob patterns correctly', () => {
    expect(checkOwnership('src/server/api/leads.ts')).toBe('kiro');
    expect(checkOwnership('src/components/crm/LeadCard.tsx')).toBe('lovable');
  });

  it('should load and validate registry schema', () => {
    const registry = loadOwnershipRegistry();
    expect(registry).toHaveProperty('version');
    expect(registry).toHaveProperty('ownership');
    expect(registry.ownership).toHaveProperty('kiro');
    expect(registry.ownership).toHaveProperty('lovable');
    expect(registry.ownership).toHaveProperty('shared');
  });
});
```

#### 3.2 Work Log Tests

**File**: `src/__tests__/coordination/work-log.test.ts`

**Test Cases**:
```typescript
import { describe, it, expect } from 'vitest';
import { parseWorkLog, checkWorkLogConflicts } from '@/lib/work-log';

describe('Work Log Parser', () => {
  it('should parse work items correctly', () => {
    const workLog = `
### [Kiro] 2025-01-15 10:30 - Authentication
**Status**: In Progress
**Files**:
- src/server/auth.ts
- src/lib/auth-utils.ts
    `;
    
    const items = parseWorkLog(workLog);
    expect(items).toHaveLength(1);
    expect(items[0].tool).toBe('Kiro');
    expect(items[0].status).toBe('In Progress');
    expect(items[0].files).toContain('src/server/auth.ts');
  });

  it('should detect conflicts with active work', () => {
    const activeWork = [
      {
        tool: 'Kiro',
        files: ['src/server/auth.ts'],
        status: 'In Progress',
      },
    ];
    
    const conflicts = checkWorkLogConflicts(['src/server/auth.ts'], activeWork);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].activeBy).toBe('Kiro');
  });

  it('should not detect conflicts for completed work', () => {
    const completedWork = [
      {
        tool: 'Kiro',
        files: ['src/server/auth.ts'],
        status: 'Completed',
      },
    ];
    
    const conflicts = checkWorkLogConflicts(['src/server/auth.ts'], completedWork);
    expect(conflicts).toHaveLength(0);
  });
});
```

#### 3.3 Logger Tests

**File**: `src/__tests__/quality-gates/logger.test.ts`

**Test Cases**:
```typescript
import { describe, it, expect, vi } from 'vitest';
import { logger } from '@/lib/logger';

describe('Logger', () => {
  it('should log debug messages in development', () => {
    const consoleSpy = vi.spyOn(console, 'log');
    logger.debug('Test message', { key: 'value' });
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should format error logs with stack traces', () => {
    const consoleSpy = vi.spyOn(console, 'error');
    const error = new Error('Test error');
    logger.error('Error occurred', error);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Test error')
    );
  });

  it('should include context in log entries', () => {
    const consoleSpy = vi.spyOn(console, 'log');
    logger.info('User action', { userId: '123', action: 'click' });
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('User action'),
      expect.objectContaining({ userId: '123' })
    );
  });
});
```

### 4. Integration Test Requirements

#### 4.1 Full Workflow Test

**File**: `src/__tests__/integration/full-workflow.test.ts`

**Test Scenario**: Complete workflow from work initiation to handoff

```typescript
import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';

describe('Full Coordination Workflow', () => {
  it('should complete Kiro → Lovable handoff workflow', async () => {
    // 1. Kiro starts work
    execSync('bun run work-log:start Kiro "Implement auth types"');
    
    // 2. Kiro modifies files
    const files = ['src/modules/auth/types.ts'];
    
    // 3. Check ownership (should pass)
    const ownership = checkOwnership(files[0]);
    expect(ownership).toBe('kiro');
    
    // 4. Run quality gates
    execSync('bun run lint');
    execSync('bun run tsc --noEmit');
    
    // 5. Commit with proper format
    execSync('git add src/modules/auth/types.ts');
    execSync('git commit -m "[Kiro] feat(auth): add authentication types"');
    
    // 6. Complete work and create handoff
    execSync('bun run work-log:complete');
    execSync('bun run handoff:create Kiro Lovable "Auth types ready"');
    
    // 7. Verify handoff document exists
    const handoffExists = existsSync('.kiro/coordination/handoffs/latest.md');
    expect(handoffExists).toBe(true);
  });
});
```

### 5. Smoke Test Requirements

**File**: `src/__tests__/coordination/smoke.test.ts`

**Purpose**: Verify system health after changes

```typescript
import { describe, it, expect } from 'vitest';

describe('Coordination System Smoke Tests', () => {
  it('should have valid ownership registry', () => {
    const registry = loadOwnershipRegistry();
    expect(registry.version).toBeTruthy();
    expect(registry.ownership.kiro.length).toBeGreaterThan(0);
    expect(registry.ownership.lovable.length).toBeGreaterThan(0);
  });

  it('should have accessible work log', () => {
    const workLogExists = existsSync('.kiro/coordination/work-log.md');
    expect(workLogExists).toBe(true);
  });

  it('should have pre-commit hook installed', () => {
    const hookExists = existsSync('.husky/pre-commit');
    expect(hookExists).toBe(true);
  });

  it('should have ESLint configured with coordination rules', () => {
    const config = loadESLintConfig();
    expect(config.rules['no-console']).toBeDefined();
    expect(config.rules['@typescript-eslint/no-explicit-any']).toBe('error');
  });

  it('should have TypeScript strict mode enabled', () => {
    const tsConfig = loadTSConfig();
    expect(tsConfig.compilerOptions.strict).toBe(true);
  });
});
```

### 6. Test Execution

**Commands**:
```json
{
  "scripts": {
    "test": "vitest",
    "test:quick": "vitest run --reporter=dot",
    "test:coordination": "vitest run src/__tests__/coordination",
    "test:quality-gates": "vitest run src/__tests__/quality-gates",
    "test:integration": "vitest run src/__tests__/integration",
    "test:smoke": "vitest run src/__tests__/coordination/smoke.test.ts",
    "test:coverage": "vitest run --coverage"
  }
}
```

### 7. Test Coverage Requirements

- **Ownership Registry**: 100% coverage (critical path)
- **Work Log Parser**: 90% coverage
- **Conflict Detection**: 90% coverage
- **Logger**: 80% coverage
- **Integration Tests**: All major workflows covered

### 8. Continuous Testing

**Pre-commit Hook Integration**:
```bash
# Run quick tests before commit
bun run test:quick

# If tests fail, prevent commit
if [ $? -ne 0 ]; then
  echo "❌ Tests failed. Please fix failing tests before committing."
  exit 1
fi
```

**CI/CD Integration** (if applicable):
```yaml
# .github/workflows/test.yml
name: Test Coordination System
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run test:coordination
      - run: bun run test:quality-gates
      - run: bun run test:integration
```



## Implementation Details

### 1. File Structure

```
.kiro/
├── coordination/
│   ├── ownership.json              # File ownership registry
│   ├── work-log.md                 # Current and completed work
│   ├── handoffs/                   # Handoff documents
│   │   ├── 2025-01-15-auth.md
│   │   └── 2025-01-16-crm-ui.md
│   └── templates/
│       ├── handoff-template.md     # Handoff document template
│       └── work-item-template.md   # Work log entry template
├── specs/
│   └── kiro-lovable-coordination/
│       ├── requirements.md
│       ├── design.md
│       └── tasks.md
└── steering/
    └── coordination-guide.md       # Quick reference guide

scripts/
├── check-ownership.ts              # Ownership validation
├── check-recent-changes.ts         # Recent changes checker
├── check-work-log.ts               # Work log conflict detector
├── work-log-cli.ts                 # Work log management
└── handoff-cli.ts                  # Handoff document generator

src/
├── lib/
│   ├── logger.ts                   # Structured logging utility
│   ├── ownership.ts                # Ownership checking logic
│   └── work-log.ts                 # Work log parsing logic
└── __tests__/
    ├── coordination/
    │   ├── ownership.test.ts
    │   ├── work-log.test.ts
    │   ├── conflict-detection.test.ts
    │   └── smoke.test.ts
    └── quality-gates/
        └── logger.test.ts

.husky/
└── pre-commit                      # Pre-commit quality gates

.gitignore                          # Updated with .env
eslint.config.js                    # Enhanced with coordination rules
tsconfig.json                       # Strict mode enabled
package.json                        # New scripts added
```

### 2. CLI Commands

Add to `package.json`:
```json
{
  "scripts": {
    "check-ownership": "bun run scripts/check-ownership.ts",
    "check-ownership:staged": "git diff --cached --name-only | xargs bun run scripts/check-ownership.ts",
    "check-conflicts": "bun run scripts/check-recent-changes.ts",
    "check-work-log": "bun run scripts/check-work-log.ts",
    "work-log:start": "bun run scripts/work-log-cli.ts start",
    "work-log:complete": "bun run scripts/work-log-cli.ts complete",
    "work-log:status": "bun run scripts/work-log-cli.ts status",
    "handoff:create": "bun run scripts/handoff-cli.ts create",
    "handoff:list": "bun run scripts/handoff-cli.ts list",
    "coordination:setup": "bun run scripts/setup-coordination.ts",
    "coordination:validate": "bun run scripts/validate-coordination.ts"
  }
}
```

### 3. Setup Script

**Location**: `scripts/setup-coordination.ts`

**Purpose**: Initialize coordination system

```typescript
import { mkdirSync, writeFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';

function setupCoordination(): void {
  console.log('🚀 Setting up Kiro-Lovable Coordination System...\n');

  // 1. Create directory structure
  console.log('📁 Creating directory structure...');
  const dirs = [
    '.kiro/coordination',
    '.kiro/coordination/handoffs',
    '.kiro/coordination/templates',
    'scripts',
  ];
  
  dirs.forEach(dir => {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
      console.log(`   ✓ Created ${dir}`);
    }
  });

  // 2. Create ownership registry
  console.log('\n📋 Creating ownership registry...');
  const ownershipRegistry = {
    version: '1.0.0',
    lastUpdated: new Date().toISOString(),
    ownership: {
      kiro: [
        {
          pattern: 'src/server/**/*',
          description: 'All server-side functions and API endpoints',
          rationale: 'Kiro handles complex backend logic and integrations',
        },
        {
          pattern: 'src/lib/**/*',
          description: 'Utility libraries and helper functions',
          rationale: 'Kiro manages reusable logic and algorithms',
        },
        {
          pattern: 'src/modules/*/types.ts',
          description: 'TypeScript type definitions for modules',
          rationale: 'Kiro defines and maintains type system',
        },
        {
          pattern: 'src/integrations/supabase/**/*',
          description: 'Supabase integration and database logic',
          rationale: 'Kiro handles database operations and queries',
        },
        {
          pattern: 'src/**/__tests__/**/*',
          description: 'Test files and test utilities',
          rationale: 'Kiro creates comprehensive test suites',
        },
      ],
      lovable: [
        {
          pattern: 'src/components/ui/**/*',
          description: 'shadcn/ui component library',
          rationale: 'Lovable manages design system components',
        },
        {
          pattern: 'src/components/templates/**/*',
          description: 'Page templates and layouts',
          rationale: 'Lovable creates visual templates',
        },
        {
          pattern: 'src/components/**/*.tsx',
          description: 'React components (excluding ui and templates)',
          rationale: 'Lovable builds user interface components',
        },
        {
          pattern: 'src/styles.css',
          description: 'Global styles',
          rationale: 'Lovable manages styling',
        },
        {
          pattern: 'tailwind.config.*',
          description: 'Tailwind configuration',
          rationale: 'Lovable configures design tokens',
        },
      ],
      shared: [
        {
          pattern: 'src/routes/**/*.tsx',
          description: 'TanStack Router route definitions',
          rationale: 'Routes connect UI (Lovable) with data (Kiro)',
        },
        {
          pattern: 'src/hooks/**/*',
          description: 'React hooks',
          rationale: 'Hooks bridge UI logic and business logic',
        },
        {
          pattern: 'package.json',
          description: 'Project dependencies',
          rationale: 'Both tools add dependencies',
        },
        {
          pattern: 'tsconfig.json',
          description: 'TypeScript configuration',
          rationale: 'Affects both tools\' code',
        },
      ],
    },
  };
  
  writeFileSync(
    '.kiro/coordination/ownership.json',
    JSON.stringify(ownershipRegistry, null, 2)
  );
  console.log('   ✓ Created ownership.json');

  // 3. Create work log
  console.log('\n📝 Creating work log...');
  const workLog = `# Work Log

## Current Work

_No active work items_

---

## Completed Work (Last 7 Days)

_No completed work items_
`;
  
  writeFileSync('.kiro/coordination/work-log.md', workLog);
  console.log('   ✓ Created work-log.md');

  // 4. Create templates
  console.log('\n📄 Creating templates...');
  const handoffTemplate = `# Handoff: [Feature Name]

**From**: [Kiro/Lovable]
**To**: [Lovable/Kiro]
**Date**: YYYY-MM-DD HH:MM

## Summary
[Brief description of what was accomplished]

## Files Modified
- \`path/to/file1.ts\` - [What changed]
- \`path/to/file2.tsx\` - [What changed]

## New Types/Interfaces (Kiro → Lovable)
\`\`\`typescript
// Copy relevant type definitions here
\`\`\`

## New Components (Lovable → Kiro)
- \`ComponentName\` - Purpose and props
- \`AnotherComponent\` - Purpose and props

## Integration Points
[Describe how the work connects to the other tool's domain]

## Dependencies Added
- \`package-name@version\` - Why it was added

## Next Steps for Receiving Tool
1. [Specific action needed]
2. [Another action]

## Testing Notes
[What was tested, what still needs testing]

## Questions/Clarifications Needed
- [Any unclear points]
`;
  
  writeFileSync('.kiro/coordination/templates/handoff-template.md', handoffTemplate);
  console.log('   ✓ Created handoff-template.md');

  // 5. Install husky (if not already installed)
  console.log('\n🪝 Setting up git hooks...');
  try {
    execSync('bun add -d husky', { stdio: 'inherit' });
    execSync('bunx husky init', { stdio: 'inherit' });
    console.log('   ✓ Installed husky');
  } catch (error) {
    console.log('   ⚠️  Husky installation failed (may already be installed)');
  }

  // 6. Create pre-commit hook
  const preCommitHook = `#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

echo "🔍 Running pre-commit checks..."

# Check file ownership
echo "📋 Checking file ownership..."
bun run check-ownership:staged
if [ $? -ne 0 ]; then
  echo "❌ Ownership violation detected."
  exit 1
fi

# TypeScript check
echo "🔷 Running TypeScript checks..."
bun run tsc --noEmit
if [ $? -ne 0 ]; then
  echo "❌ TypeScript errors detected."
  exit 1
fi

# ESLint
echo "🔍 Running ESLint..."
bun run lint
if [ $? -ne 0 ]; then
  echo "❌ Linting errors detected."
  exit 1
fi

# Tests
echo "🧪 Running tests..."
bun run test:quick
if [ $? -ne 0 ]; then
  echo "❌ Tests failed."
  exit 1
fi

echo "✅ All pre-commit checks passed!"
`;
  
  writeFileSync('.husky/pre-commit', preCommitHook);
  execSync('chmod +x .husky/pre-commit');
  console.log('   ✓ Created pre-commit hook');

  console.log('\n✅ Coordination system setup complete!\n');
  console.log('Next steps:');
  console.log('1. Review .kiro/coordination/ownership.json');
  console.log('2. Run: bun run coordination:validate');
  console.log('3. Start using: bun run work-log:start <tool> <description>');
}

setupCoordination();
```

### 4. Validation Script

**Location**: `scripts/validate-coordination.ts`

**Purpose**: Verify coordination system is properly configured

```typescript
import { existsSync, readFileSync } from 'fs';

interface ValidationResult {
  passed: boolean;
  message: string;
}

function validate(): void {
  console.log('🔍 Validating Coordination System...\n');
  
  const checks: ValidationResult[] = [];

  // 1. Check ownership registry exists
  checks.push({
    passed: existsSync('.kiro/coordination/ownership.json'),
    message: 'Ownership registry exists',
  });

  // 2. Check work log exists
  checks.push({
    passed: existsSync('.kiro/coordination/work-log.md'),
    message: 'Work log exists',
  });

  // 3. Check pre-commit hook exists
  checks.push({
    passed: existsSync('.husky/pre-commit'),
    message: 'Pre-commit hook exists',
  });

  // 4. Check ESLint config has coordination rules
  if (existsSync('eslint.config.js')) {
    const eslintConfig = readFileSync('eslint.config.js', 'utf-8');
    checks.push({
      passed: eslintConfig.includes('no-console'),
      message: 'ESLint has no-console rule',
    });
    checks.push({
      passed: eslintConfig.includes('@typescript-eslint/no-explicit-any'),
      message: 'ESLint has no-explicit-any rule',
    });
  }

  // 5. Check TypeScript strict mode
  if (existsSync('tsconfig.json')) {
    const tsConfig = JSON.parse(readFileSync('tsconfig.json', 'utf-8'));
    checks.push({
      passed: tsConfig.compilerOptions?.strict === true,
      message: 'TypeScript strict mode enabled',
    });
  }

  // 6. Check logger utility exists
  checks.push({
    passed: existsSync('src/lib/logger.ts'),
    message: 'Logger utility exists',
  });

  // 7. Check .gitignore has .env
  if (existsSync('.gitignore')) {
    const gitignore = readFileSync('.gitignore', 'utf-8');
    checks.push({
      passed: gitignore.includes('.env'),
      message: '.gitignore includes .env',
    });
  }

  // Print results
  let allPassed = true;
  checks.forEach(check => {
    const icon = check.passed ? '✅' : '❌';
    console.log(`${icon} ${check.message}`);
    if (!check.passed) allPassed = false;
  });

  console.log('\n' + '='.repeat(50));
  if (allPassed) {
    console.log('✅ All validation checks passed!');
  } else {
    console.log('❌ Some validation checks failed.');
    console.log('Run: bun run coordination:setup');
    process.exit(1);
  }
}

validate();
```

### 5. State Management Refactoring Guide

**Current Problem**: 1000+ line store file

**Solution**: Split into focused modules

**Example Refactoring**:

```typescript
// BEFORE: src/store/app-store.ts (1000+ lines)
// Everything in one file

// AFTER: Modular structure

// src/modules/prospecting/prospecting-store.ts (< 300 lines)
import { create } from 'zustand';
import type { ProspectLead } from './types';

interface ProspectingState {
  leads: ProspectLead[];
  selectedLead: ProspectLead | null;
  filters: LeadFilters;
}

interface ProspectingActions {
  addLead: (lead: ProspectLead) => void;
  updateLead: (id: string, updates: Partial<ProspectLead>) => void;
  selectLead: (id: string) => void;
  setFilters: (filters: LeadFilters) => void;
}

export const useProspectingStore = create<ProspectingState & ProspectingActions>((set) => ({
  leads: [],
  selectedLead: null,
  filters: {},
  
  addLead: (lead) => set((state) => ({
    leads: [...state.leads, lead],
  })),
  
  updateLead: (id, updates) => set((state) => ({
    leads: state.leads.map(lead => 
      lead.id === id ? { ...lead, ...updates } : lead
    ),
  })),
  
  selectLead: (id) => set((state) => ({
    selectedLead: state.leads.find(lead => lead.id === id) || null,
  })),
  
  setFilters: (filters) => set({ filters }),
}));

// src/modules/auth/auth-store.ts (< 300 lines)
// Authentication state management

// src/modules/jobs/jobs-store.ts (< 300 lines)
// Background jobs state management
```

### 6. Documentation Standards

#### 6.1 JSDoc for Server Functions (Kiro)

```typescript
/**
 * Creates a new prospect lead in the database
 * 
 * @param lead - The lead data to create
 * @param lead.companyName - Name of the company
 * @param lead.email - Contact email address
 * @param lead.niche - Business niche/category
 * 
 * @returns Promise resolving to the created lead with generated ID
 * 
 * @throws {ValidationError} If lead data is invalid
 * @throws {DatabaseError} If database operation fails
 * 
 * @example
 * ```typescript
 * const lead = await createLead({
 *   companyName: 'Acme Corp',
 *   email: 'contact@acme.com',
 *   niche: 'solar',
 * });
 * ```
 */
export async function createLead(lead: CreateLeadInput): Promise<ProspectLead> {
  // Implementation
}
```

#### 6.2 Component Documentation (Lovable)

```typescript
/**
 * LeadCard - Displays a prospect lead with actions
 * 
 * Shows lead information including company name, status, and opportunity score.
 * Provides quick actions for contacting and managing the lead.
 * 
 * @component
 * @example
 * ```tsx
 * <LeadCard
 *   lead={lead}
 *   onSelect={() => handleSelect(lead.id)}
 *   onContact={() => handleContact(lead.id)}
 * />
 * ```
 */
interface LeadCardProps {
  /** The lead data to display */
  lead: ProspectLead;
  /** Callback when lead is selected */
  onSelect: () => void;
  /** Callback when contact action is triggered */
  onContact: () => void;
  /** Optional CSS class name */
  className?: string;
}

export function LeadCard({ lead, onSelect, onContact, className }: LeadCardProps): JSX.Element {
  // Implementation
}
```

### 7. Performance Optimization Patterns

#### 7.1 React.memo for Expensive Components (Lovable)

```typescript
import { memo } from 'react';

interface LeadCardProps {
  lead: ProspectLead;
  onSelect: () => void;
}

// Memoize to prevent unnecessary re-renders
export const LeadCard = memo(function LeadCard({ lead, onSelect }: LeadCardProps) {
  return (
    <div onClick={onSelect}>
      {/* Component content */}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison: only re-render if lead data changed
  return prevProps.lead.id === nextProps.lead.id &&
         prevProps.lead.status === nextProps.lead.status;
});
```

#### 7.2 Server Function Caching (Kiro)

```typescript
import { cache } from '@tanstack/react-router';

/**
 * Fetches leads with caching
 * Cache duration: 5 minutes
 */
export const getLeads = cache(
  async (filters: LeadFilters): Promise<ProspectLead[]> => {
    // Implementation
  },
  {
    key: 'leads',
    ttl: 5 * 60 * 1000, // 5 minutes
  }
);
```



## Workflow Diagrams

### 1. Work Initiation Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                     User Requests Feature                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
                    ┌────────────────────┐
                    │ User Selects Tool  │
                    │ (Kiro or Lovable)  │
                    └─────────┬──────────┘
                              │
                              ▼
                    ┌────────────────────┐
                    │ Tool Checks Files  │
                    │ to be Modified     │
                    └─────────┬──────────┘
                              │
                              ▼
                    ┌────────────────────┐
                    │ Check Ownership    │
                    └─────────┬──────────┘
                              │
                ┌─────────────┼─────────────┐
                │             │             │
                ▼             ▼             ▼
         ┌──────────┐  ┌──────────┐  ┌──────────┐
         │  Owned   │  │  Shared  │  │  Other   │
         │  by Tool │  │   File   │  │  Tool's  │
         └────┬─────┘  └────┬─────┘  └────┬─────┘
              │             │             │
              │             │             ▼
              │             │      ┌──────────────┐
              │             │      │ STOP: Request│
              │             │      │ Coordination │
              │             │      └──────────────┘
              │             │
              │             ▼
              │      ┌──────────────────┐
              │      │ User Approves    │
              │      │ Shared File Edit │
              │      └────────┬─────────┘
              │               │
              └───────────────┴──────────┐
                                         │
                                         ▼
                              ┌────────────────────┐
                              │ Check Work Log for │
                              │ Active Conflicts   │
                              └─────────┬──────────┘
                                        │
                          ┌─────────────┼─────────────┐
                          │                           │
                          ▼                           ▼
                   ┌──────────┐              ┌──────────────┐
                   │ No       │              │ Conflict     │
                   │ Conflict │              │ Detected     │
                   └────┬─────┘              └──────┬───────┘
                        │                           │
                        │                           ▼
                        │                    ┌──────────────┐
                        │                    │ STOP: Wait   │
                        │                    │ or Coordinate│
                        │                    └──────────────┘
                        │
                        ▼
              ┌────────────────────┐
              │ Update Work Log    │
              │ (Start Work Item)  │
              └─────────┬──────────┘
                        │
                        ▼
              ┌────────────────────┐
              │ Tool Executes Work │
              └─────────┬──────────┘
                        │
                        ▼
              ┌────────────────────┐
              │ Pre-commit Checks  │
              │ - Ownership        │
              │ - TypeScript       │
              │ - ESLint           │
              │ - Tests            │
              └─────────┬──────────┘
                        │
                  ┌─────┴─────┐
                  │           │
                  ▼           ▼
            ┌─────────┐  ┌─────────┐
            │  Pass   │  │  Fail   │
            └────┬────┘  └────┬────┘
                 │            │
                 │            ▼
                 │     ┌──────────────┐
                 │     │ Fix Issues   │
                 │     │ and Retry    │
                 │     └──────────────┘
                 │
                 ▼
        ┌────────────────────┐
        │ Commit with Format │
        │ [Tool] type: desc  │
        └─────────┬──────────┘
                  │
                  ▼
        ┌────────────────────┐
        │ Update Work Log    │
        │ (Complete Item)    │
        └─────────┬──────────┘
                  │
                  ▼
        ┌────────────────────┐
        │ Handoff Needed?    │
        └─────────┬──────────┘
                  │
            ┌─────┴─────┐
            │           │
            ▼           ▼
        ┌───────┐  ┌────────────┐
        │  No   │  │    Yes     │
        └───┬───┘  └─────┬──────┘
            │            │
            │            ▼
            │   ┌────────────────┐
            │   │ Create Handoff │
            │   │ Document       │
            │   └────────┬───────┘
            │            │
            │            ▼
            │   ┌────────────────┐
            │   │ Notify Other   │
            │   │ Tool           │
            │   └────────────────┘
            │
            └────────────┐
                         │
                         ▼
                  ┌──────────┐
                  │   Done   │
                  └──────────┘
```

### 2. Shared File Modification Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│              Tool Needs to Modify Shared File                    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
                    ┌────────────────────┐
                    │ Tool Announces     │
                    │ Intended Changes   │
                    │ to User            │
                    └─────────┬──────────┘
                              │
                              ▼
                    ┌────────────────────┐
                    │ User Reviews       │
                    │ Request            │
                    └─────────┬──────────┘
                              │
                        ┌─────┴─────┐
                        │           │
                        ▼           ▼
                  ┌─────────┐  ┌─────────┐
                  │ Approve │  │ Reject  │
                  └────┬────┘  └────┬────┘
                       │            │
                       │            ▼
                       │     ┌──────────────┐
                       │     │ Tool Waits   │
                       │     │ or Adjusts   │
                       │     └──────────────┘
                       │
                       ▼
              ┌────────────────────┐
              │ Tool Reads Current │
              │ File State         │
              └─────────┬──────────┘
                        │
                        ▼
              ┌────────────────────┐
              │ Tool Makes Changes │
              └─────────┬──────────┘
                        │
                        ▼
              ┌────────────────────┐
              │ Tool Documents     │
              │ What Changed       │
              └─────────┬──────────┘
                        │
                        ▼
              ┌────────────────────┐
              │ Commit Changes     │
              └─────────┬──────────┘
                        │
                        ▼
              ┌────────────────────┐
              │ User Notifies      │
              │ Other Tool         │
              └─────────┬──────────┘
                        │
                        ▼
              ┌────────────────────┐
              │ Other Tool Reads   │
              │ Updated File       │
              └─────────┬──────────┘
                        │
                        ▼
                  ┌──────────┐
                  │   Done   │
                  └──────────┘
```

### 3. Conflict Resolution Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Merge Conflict Detected                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
                    ┌────────────────────┐
                    │ Identify Conflicted│
                    │ Files              │
                    └─────────┬──────────┘
                              │
                              ▼
                    ┌────────────────────┐
                    │ For Each File:     │
                    │ Check Ownership    │
                    └─────────┬──────────┘
                              │
                ┌─────────────┼─────────────┐
                │             │             │
                ▼             ▼             ▼
         ┌──────────┐  ┌──────────┐  ┌──────────┐
         │  Kiro    │  │ Lovable  │  │  Shared  │
         │  Owned   │  │  Owned   │  │   File   │
         └────┬─────┘  └────┬─────┘  └────┬─────┘
              │             │             │
              ▼             ▼             ▼
       ┌──────────┐  ┌──────────┐  ┌──────────────┐
       │ Kiro     │  │ Lovable  │  │ User Manually│
       │ Resolves │  │ Resolves │  │ Merges Both  │
       └────┬─────┘  └────┬─────┘  └──────┬───────┘
            │             │                │
            └─────────────┴────────────────┘
                          │
                          ▼
                ┌────────────────────┐
                │ Run Tests to       │
                │ Verify Resolution  │
                └─────────┬──────────┘
                          │
                    ┌─────┴─────┐
                    │           │
                    ▼           ▼
              ┌─────────┐  ┌─────────┐
              │  Pass   │  │  Fail   │
              └────┬────┘  └────┬────┘
                   │            │
                   │            ▼
                   │     ┌──────────────┐
                   │     │ Fix and      │
                   │     │ Re-test      │
                   │     └──────────────┘
                   │
                   ▼
          ┌────────────────────┐
          │ Commit Resolution  │
          │ [Manual] merge:... │
          └─────────┬──────────┘
                    │
                    ▼
          ┌────────────────────┐
          │ Notify Both Tools  │
          │ of Resolution      │
          └─────────┬──────────┘
                    │
                    ▼
              ┌──────────┐
              │   Done   │
              └──────────┘
```

### 4. Handoff Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                   Tool Completes Feature Work                    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
                    ┌────────────────────┐
                    │ Tool Determines    │
                    │ Handoff Needed?    │
                    └─────────┬──────────┘
                              │
                        ┌─────┴─────┐
                        │           │
                        ▼           ▼
                  ┌─────────┐  ┌─────────┐
                  │   No    │  │   Yes   │
                  └────┬────┘  └────┬────┘
                       │            │
                       │            ▼
                       │   ┌────────────────────┐
                       │   │ Tool Gathers Info: │
                       │   │ - Files modified   │
                       │   │ - New types/comps  │
                       │   │ - Dependencies     │
                       │   │ - Integration pts  │
                       │   └─────────┬──────────┘
                       │             │
                       │             ▼
                       │   ┌────────────────────┐
                       │   │ Tool Creates       │
                       │   │ Handoff Document   │
                       │   └─────────┬──────────┘
                       │             │
                       │             ▼
                       │   ┌────────────────────┐
                       │   │ User Reviews       │
                       │   │ Handoff Doc        │
                       │   └─────────┬──────────┘
                       │             │
                       │             ▼
                       │   ┌────────────────────┐
                       │   │ User Switches to   │
                       │   │ Receiving Tool     │
                       │   └─────────┬──────────┘
                       │             │
                       │             ▼
                       │   ┌────────────────────┐
                       │   │ User Provides      │
                       │   │ Handoff Context    │
                       │   └─────────┬──────────┘
                       │             │
                       │             ▼
                       │   ┌────────────────────┐
                       │   │ Receiving Tool     │
                       │   │ Acknowledges       │
                       │   └─────────┬──────────┘
                       │             │
                       │             ▼
                       │   ┌────────────────────┐
                       │   │ Receiving Tool     │
                       │   │ Begins Work        │
                       │   └─────────┬──────────┘
                       │             │
                       └─────────────┘
                                     │
                                     ▼
                              ┌──────────┐
                              │   Done   │
                              └──────────┘
```

### 5. Review Checkpoint Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Tool Completes Work                           │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
                    ┌────────────────────┐
                    │ Tool Provides      │
                    │ Summary of Changes │
                    └─────────┬──────────┘
                              │
                              ▼
                    ┌────────────────────┐
                    │ User Reviews Based │
                    │ on Tool Type       │
                    └─────────┬──────────┘
                              │
                ┌─────────────┼─────────────┐
                │                           │
                ▼                           ▼
         ┌──────────────┐          ┌──────────────┐
         │ Kiro Review  │          │Lovable Review│
         │ Checklist:   │          │ Checklist:   │
         │ - Type safety│          │ - Component  │
         │ - Error      │          │   structure  │
         │   handling   │          │ - Accessibil.│
         │ - Tests      │          │ - Integration│
         │ - Docs       │          │ - Responsive │
         └──────┬───────┘          └──────┬───────┘
                │                         │
                └────────────┬────────────┘
                             │
                             ▼
                    ┌────────────────────┐
                    │ User Checks All    │
                    │ Items              │
                    └─────────┬──────────┘
                              │
                        ┌─────┴─────┐
                        │           │
                        ▼           ▼
                  ┌─────────┐  ┌─────────┐
                  │ All Pass│  │ Issues  │
                  └────┬────┘  └────┬────┘
                       │            │
                       │            ▼
                       │     ┌──────────────┐
                       │     │ Tool Fixes   │
                       │     │ Issues       │
                       │     └──────┬───────┘
                       │            │
                       │            ▼
                       │     ┌──────────────┐
                       │     │ Re-review    │
                       │     └──────────────┘
                       │
                       ▼
              ┌────────────────────┐
              │ Approve for Merge  │
              └─────────┬──────────┘
                        │
                        ▼
              ┌────────────────────┐
              │ Merge to Main      │
              └─────────┬──────────┘
                        │
                        ▼
                  ┌──────────┐
                  │   Done   │
                  └──────────┘
```

## Deployment and Rollout

### Phase 1: Setup (Week 1)

**Objective**: Install coordination infrastructure

**Tasks**:
1. Run `bun run coordination:setup`
2. Review and adjust `.kiro/coordination/ownership.json`
3. Install and configure pre-commit hooks
4. Update ESLint configuration with coordination rules
5. Create logger utility (`src/lib/logger.ts`)
6. Run `bun run coordination:validate`

**Success Criteria**:
- All validation checks pass
- Pre-commit hook blocks commits with violations
- ESLint catches console.log and `any` types

### Phase 2: Documentation (Week 1-2)

**Objective**: Document existing code and establish standards

**Tasks**:
1. Add JSDoc comments to all server functions (Kiro)
2. Add component documentation to reusable components (Lovable)
3. Create module README files
4. Document API endpoints
5. Update main README with coordination guidelines

**Success Criteria**:
- All exported functions have JSDoc
- All reusable components have usage examples
- README includes coordination workflow

### Phase 3: Code Quality Cleanup (Week 2-3)

**Objective**: Eliminate existing quality issues

**Tasks**:
1. Replace all `console.log` with `logger` utility
2. Fix all `any` types with explicit types
3. Add cleanup functions to useEffect hooks
4. Add error handling to async functions
5. Run full test suite and fix failures

**Success Criteria**:
- Zero console.log statements
- Zero `any` types
- Zero memory leaks
- All tests passing

### Phase 4: Store Refactoring (Week 3-4)

**Objective**: Break up 1000+ line store file

**Tasks**:
1. Identify logical boundaries in current store
2. Create module-specific stores
3. Migrate state and actions to new stores
4. Update components to use new stores
5. Test all functionality

**Success Criteria**:
- No store file exceeds 300 lines
- All functionality preserved
- Performance maintained or improved

### Phase 5: Testing Infrastructure (Week 4-5)

**Objective**: Establish comprehensive testing

**Tasks**:
1. Create test files for all server functions
2. Create test files for critical components
3. Add smoke tests for coordination system
4. Configure test coverage reporting
5. Integrate tests into pre-commit hook

**Success Criteria**:
- All server functions have unit tests
- Critical components have tests
- Test coverage > 70%
- Pre-commit hook runs tests

### Phase 6: Workflow Training (Week 5)

**Objective**: Establish coordination workflows

**Tasks**:
1. Practice work log workflow
2. Practice handoff workflow
3. Practice conflict resolution
4. Document lessons learned
5. Refine workflows based on experience

**Success Criteria**:
- Both tools successfully complete handoff
- Conflicts resolved without data loss
- Work log accurately reflects activity

### Phase 7: Continuous Improvement (Ongoing)

**Objective**: Refine and optimize coordination

**Tasks**:
1. Monitor coordination effectiveness
2. Collect feedback on pain points
3. Adjust ownership boundaries as needed
4. Enhance tooling based on needs
5. Update documentation

**Success Criteria**:
- Merge conflicts < 1 per week
- Handoffs complete in < 30 minutes
- Quality gates catch issues before commit

## Maintenance and Evolution

### Regular Maintenance Tasks

**Daily**:
- Review work log for active conflicts
- Check pre-commit hook is functioning
- Monitor for ownership violations

**Weekly**:
- Archive completed work items
- Review and update ownership registry if needed
- Check test coverage metrics
- Review recent handoffs for improvements

**Monthly**:
- Audit code quality metrics (console.log, any types, etc.)
- Review and update coordination workflows
- Assess effectiveness of quality gates
- Plan improvements to tooling

### Evolution Strategy

**When to Update Ownership Registry**:
- New modules are added to the project
- Architectural changes shift responsibilities
- Patterns emerge showing better ownership boundaries
- Conflicts repeatedly occur in specific files

**When to Enhance Quality Gates**:
- New quality issues are identified
- Team adopts new best practices
- New tools or frameworks are introduced
- Performance issues are detected

**When to Refine Workflows**:
- Handoffs take too long
- Conflicts occur frequently
- Tools report confusion about process
- New coordination patterns emerge

### Metrics to Track

**Coordination Effectiveness**:
- Number of merge conflicts per week
- Average handoff completion time
- Ownership violations caught by pre-commit hook
- Work log conflicts detected

**Code Quality**:
- Number of console.log statements
- Number of `any` types
- Test coverage percentage
- TypeScript errors in CI/CD

**Development Velocity**:
- Time from feature request to completion
- Number of rollbacks required
- Time spent resolving conflicts
- Developer satisfaction with coordination


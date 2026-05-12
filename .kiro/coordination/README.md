# Coordination System

This directory contains the Kiro-Lovable Coordination System infrastructure for managing collaborative development between Kiro and Lovable on the MarketScope AI project.

## Directory Structure

```
.kiro/coordination/
├── README.md                    # This file
├── ownership.json               # File ownership registry
├── work-log.md                  # Active work tracking
├── templates/                   # Document templates
│   ├── handoff-template.md     # Handoff documentation template
│   └── ...                     # Other templates
└── audits/                     # Audit reports and logs
```

## Files

### ownership.json

Central registry mapping file patterns to tool ownership (Kiro, Lovable, or Shared).

**Usage:**
```bash
bun run check-ownership <file-path>
bun run check-ownership:staged  # Check staged files
```

**See:** `scripts/check-ownership.ts`

### work-log.md

Active work tracking to prevent simultaneous modifications and merge conflicts.

**Format:**
- **Current Work**: Active work items (In Progress or Blocked)
- **Completed Work**: Work completed in last 7 days
- **Archive**: Older completed work

**Usage:**
```bash
bun run work-log:status              # Show current active work
bun run work-log:check <file>...     # Check if files have conflicts
```

**See:** `scripts/check-work-log.ts`

## Scripts

### Conflict Detection

The coordination system provides multiple scripts for detecting and preventing conflicts:

#### check-recent-changes.ts

Detects files recently modified by either Kiro or Lovable using git history.

**Usage:**
```bash
# Check specific files for recent changes
bun run check-conflicts <file1> <file2> ...
bun run check-recent-changes <file1> <file2> ...

# Check with custom time window (default: 24 hours)
bun run check-conflicts --hours 48 <file1> ...

# Show all recent changes grouped by tool
bun run check-conflicts --all
bun run check-conflicts --all --hours 72

# Show help
bun run check-conflicts --help
```

**Features:**
- Parses git log to identify changes by Kiro or Lovable (based on commit message prefix)
- Detects potential conflicts when files were recently modified by the other tool
- Provides human-readable time ago format (e.g., "2 hours ago")
- Groups changes by tool for easy review

**Requirements:** 8.1, 8.4

#### check-work-log.ts

Checks if files are currently being worked on by either tool.

**Usage:**
```bash
# Show current active work
bun run work-log:status

# Check specific files for work log conflicts
bun run work-log:check <file1> <file2> ...

# Show help
bun run work-log:check --help
```

**Features:**
- Parses work-log.md to extract active work items
- Detects conflicts when files are being actively worked on
- Shows detailed status of current work
- Exits with error code if conflicts detected (useful for CI/CD)

**Requirements:** 8.2, 8.3

#### check-ownership.ts

Validates file ownership against the ownership registry.

**Usage:**
```bash
# Check specific files
bun run check-ownership <file1> <file2> ...

# Check staged files (for pre-commit hook)
bun run check-ownership:staged
```

**Features:**
- Validates files against ownership.json patterns
- Identifies Kiro-owned, Lovable-owned, and shared files
- Used in pre-commit hook to prevent ownership violations

**Requirements:** 1.1-1.12

### Combined Workflow

For maximum safety, use all three scripts before starting work:

```bash
# 1. Check recent changes
bun run check-conflicts --all

# 2. Check work log status
bun run work-log:status

# 3. Check ownership of files you plan to modify
bun run check-ownership src/path/to/file.ts

# 4. Check specific files for conflicts
bun run check-conflicts src/path/to/file.ts
bun run work-log:check src/path/to/file.ts
```

## Workflow

### Starting New Work

1. **Check work log** for conflicts:
   ```bash
   bun run work-log:status
   ```

2. **Add entry** to work-log.md under "Current Work":
   ```markdown
   ### [Kiro] 2025-01-15 14:30 - Feature Name
   **Status**: In Progress
   **Files**:
   - path/to/file1.ts
   - path/to/file2.tsx
   
   **Description**: Brief description
   
   **Expected Completion**: 2025-01-15 16:00
   
   **Handoff Needed**: Yes/No
   ```

3. **Check file ownership**:
   ```bash
   bun run check-ownership path/to/file1.ts
   ```

4. **Proceed with work** if no conflicts

### Completing Work

1. **Move entry** from "Current Work" to "Completed Work"
2. **Update status** to "Completed"
3. **Add completion timestamp**
4. **Document handoff** if needed

### Before Committing

Pre-commit hook automatically checks:
- File ownership (no violations)
- TypeScript errors (none)
- ESLint errors (none)
- Tests (all passing)

**Setup Git Hooks:**
```bash
npm run setup-hooks
```

See [GIT-HOOKS-SETUP.md](./GIT-HOOKS-SETUP.md) for detailed documentation.

## Requirements Addressed

- **Requirement 8.1**: Recent changes detection to identify files modified by other tool
- **Requirement 8.2**: Work log system for tracking active work
- **Requirement 8.3**: Active work conflict detection
- **Requirement 8.4**: Git history analysis for coordination
- **Requirement 1.1-1.12**: File ownership rules and enforcement
- **Requirement 2.1-2.5**: Coordination workflow for shared files

## Scripts

All coordination scripts are in `scripts/`:

- `check-ownership.ts` - Validate file ownership against registry
- `check-work-log.ts` - Detect active work conflicts from work log
- `check-recent-changes.ts` - Check git history for recent modifications by other tool
- `test-conflict-detection.ts` - Test suite for conflict detection functionality

## Documentation

See `.kiro/coordination/templates/` for:
- Handoff documentation template
- Module documentation template
- API documentation template
- Component documentation template

## Support

For questions or issues with the coordination system:
1. Review this README
2. Check the design document: `.kiro/specs/kiro-lovable-coordination/design.md`
3. Review requirements: `.kiro/specs/kiro-lovable-coordination/requirements.md`

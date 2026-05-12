# Conflict Detection Quick Reference

This guide provides quick reference for using the conflict detection scripts in the Kiro-Lovable Coordination System.

## Overview

The coordination system provides three complementary conflict detection mechanisms:

1. **Recent Changes Detection** (`check-recent-changes.ts`) - Analyzes git history
2. **Work Log Checking** (`check-work-log.ts`) - Checks active work tracking
3. **Ownership Validation** (`check-ownership.ts`) - Validates file ownership

## Quick Start

### Before Starting Work

Run these commands to check for potential conflicts:

```bash
# 1. See what's currently being worked on
bun run work-log:status

# 2. See recent changes by both tools
bun run check-conflicts --all

# 3. Check specific files you plan to modify
bun run check-conflicts src/path/to/file.ts
bun run work-log:check src/path/to/file.ts
bun run check-ownership src/path/to/file.ts
```

### During Work

Update the work log to inform the other tool:

```bash
# Edit .kiro/coordination/work-log.md
# Add your work item under "Current Work"
```

### After Completing Work

```bash
# Move your work item to "Completed Work" in work-log.md
# Commit with proper prefix: [Kiro] or [Lovable]
git commit -m "[Kiro] feat: implement feature X"
```

## Command Reference

### check-recent-changes (check-conflicts)

**Purpose:** Detect files recently modified by the other tool using git history.

**Basic Usage:**
```bash
# Check specific files
bun run check-conflicts src/routes/crm.tsx src/hooks/useLeads.ts

# Show all recent changes
bun run check-conflicts --all

# Check with custom time window (default: 24 hours)
bun run check-conflicts --hours 48 src/server/auth.ts

# Show all changes in last 72 hours
bun run check-conflicts --all --hours 72
```

**Output:**
- ✅ No conflicts detected
- ⚠️ Potential conflicts with details (file, tool, time ago, commit message)
- Groups changes by tool (Kiro, Lovable, Unknown)

**When to Use:**
- Before modifying any file
- To see what the other tool has been working on
- To understand recent activity patterns

**Requirements:** 8.1, 8.4

---

### check-work-log (work-log:check)

**Purpose:** Check if files are currently being actively worked on.

**Basic Usage:**
```bash
# Show current active work
bun run work-log:status

# Check specific files
bun run work-log:check src/routes/crm.tsx src/components/LeadCard.tsx

# Show help
bun run work-log:check --help
```

**Output:**
- ✅ No active work / No conflicts
- 🚫 Work log conflicts with details (file, tool, task title)
- 📋 Current active work summary

**When to Use:**
- Before starting work on any file
- To see current work in progress
- To coordinate with the other tool

**Exit Codes:**
- 0: No conflicts
- 1: Conflicts detected or error

**Requirements:** 8.2, 8.3

---

### check-ownership

**Purpose:** Validate file ownership against the ownership registry.

**Basic Usage:**
```bash
# Check specific files
bun run check-ownership src/server/auth.ts src/components/ui/button.tsx

# Check staged files (used in pre-commit hook)
bun run check-ownership:staged
```

**Output:**
- File ownership: Kiro, Lovable, or Shared
- Ownership violations (if any)

**When to Use:**
- Before modifying any file
- To understand file ownership boundaries
- Automatically in pre-commit hook

**Requirements:** 1.1-1.12

## Workflow Examples

### Example 1: Starting Work on a Server Function

```bash
# 1. Check if anyone is working on it
bun run work-log:status

# 2. Check recent changes
bun run check-conflicts src/server/leads.ts

# 3. Verify ownership (should be Kiro-owned)
bun run check-ownership src/server/leads.ts

# 4. If all clear, add to work log
# Edit .kiro/coordination/work-log.md:
### [Kiro] 2025-01-15 14:30 - Implement lead validation
**Status**: In Progress
**Files**:
- src/server/leads.ts
- src/modules/prospecting/types.ts

**Description**: Add validation for lead data

**Expected Completion**: 2025-01-15 16:00

# 5. Start work
```

### Example 2: Modifying a Shared File

```bash
# 1. Check ownership (should show "Shared")
bun run check-ownership src/routes/crm.tsx

# 2. Check recent changes
bun run check-conflicts src/routes/crm.tsx

# 3. Check work log
bun run work-log:check src/routes/crm.tsx

# 4. If recently modified by other tool, coordinate first
# 5. Add to work log with clear description
# 6. Proceed with caution
```

### Example 3: Reviewing Recent Activity

```bash
# See all recent changes grouped by tool
bun run check-conflicts --all

# See changes in last 48 hours
bun run check-conflicts --all --hours 48

# See current active work
bun run work-log:status
```

## Conflict Resolution

### If Recent Changes Detected

**Scenario:** File was recently modified by the other tool.

**Actions:**
1. Review the commit message to understand what changed
2. Pull latest changes: `git pull`
3. Review the actual changes in the file
4. Decide if coordination is needed
5. If needed, communicate with the other tool (via user)
6. Update work log before proceeding

### If Work Log Conflict Detected

**Scenario:** File is currently being worked on by the other tool.

**Actions:**
1. **STOP** - Do not modify the file
2. Check work log for expected completion time
3. Wait for the other tool to complete
4. Or coordinate with the other tool to sequence changes
5. Update work log once clear to proceed

### If Ownership Violation Detected

**Scenario:** Attempting to modify file owned by the other tool.

**Actions:**
1. Verify ownership is correct in `ownership.json`
2. If ownership is correct:
   - Request the other tool to make the change
   - Or coordinate for a handoff
3. If ownership is incorrect:
   - Update `ownership.json` with justification
   - Document the change

## Best Practices

### 1. Always Check Before Starting

Run all three checks before modifying any file:
```bash
bun run check-conflicts <file>
bun run work-log:check <file>
bun run check-ownership <file>
```

### 2. Keep Work Log Updated

- Add entries when starting work
- Update status as work progresses
- Move to "Completed" when done
- Include expected completion times

### 3. Use Proper Commit Prefixes

Always prefix commits with `[Kiro]` or `[Lovable]`:
```bash
git commit -m "[Kiro] feat: add lead validation"
git commit -m "[Lovable] fix: correct button styling"
```

### 4. Review Recent Changes Regularly

Check what the other tool has been working on:
```bash
bun run check-conflicts --all
```

### 5. Coordinate on Shared Files

For shared files (routes, hooks):
- Check recent changes first
- Document your changes clearly
- Inform the other tool after completion

### 6. Respect Ownership Boundaries

- Kiro: server, lib, types, integrations, tests
- Lovable: components, ui, templates, styles
- Shared: routes, hooks, config files

## Troubleshooting

### "No git history found"

**Cause:** Not a git repository or no commits yet.

**Solution:** Initialize git or make initial commit.

### "Work log not found"

**Cause:** `.kiro/coordination/work-log.md` doesn't exist.

**Solution:** Create the file using the template in `templates/`.

### "Ownership registry not found"

**Cause:** `.kiro/coordination/ownership.json` doesn't exist.

**Solution:** Create the file or run setup script.

### "Bun command not found"

**Cause:** Bun is not installed or not in PATH.

**Solution:** Install Bun or use alternative runtime (Node with tsx).

## Integration with Pre-commit Hook

The pre-commit hook automatically runs:
1. `check-ownership:staged` - Validates staged files
2. TypeScript type checking
3. ESLint
4. Tests

To bypass (emergency only):
```bash
git commit --no-verify -m "[Kiro] emergency: fix critical bug"
```

## Additional Resources

- **Full Documentation:** `.kiro/coordination/README.md`
- **Design Document:** `.kiro/specs/kiro-lovable-coordination/design.md`
- **Requirements:** `.kiro/specs/kiro-lovable-coordination/requirements.md`
- **Work Log Template:** `.kiro/coordination/templates/handoff-template.md`

## Support

For issues or questions:
1. Review this guide
2. Check the main README
3. Review the design document
4. Consult the requirements document

---

**Last Updated:** 2025-01-15
**Version:** 1.0.0
**Requirements:** 8.1, 8.2, 8.3, 8.4

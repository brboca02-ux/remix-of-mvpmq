# File Ownership Checking Tool

## Overview

The `check-ownership.ts` script validates file ownership against the ownership registry (`.kiro/coordination/ownership.json`) to prevent Kiro and Lovable from modifying each other's files and causing conflicts.

## Requirements

This tool implements Requirements 1.1-1.12 from the Kiro-Lovable Coordination System specification.

## Installation

The tool is already installed and configured in `package.json`. No additional setup is required.

## Usage

### Check Ownership of Specific Files

```bash
bun run check-ownership <file1> <file2> ...
```

Example:
```bash
bun run check-ownership src/server/auth.ts src/lib/utils.ts
```

Output:
```
📋 File Ownership:

🔧 Kiro (2 files):
   - src/server/auth.ts
   - src/lib/utils.ts
```

### Check Ownership of Staged Files

```bash
bun run check-ownership:staged
```

This command checks all files currently staged in git (useful for pre-commit hooks).

Example output:
```
📋 Checking ownership of 3 staged file(s)...

📋 File Ownership:

🔧 Kiro (2 files):
   - src/server/offers.functions.ts
   - src/lib/logger.ts

🎨 Lovable (1 files):
   - src/components/crm/CRMSummaryBar.tsx

✅ Ownership check complete.
```

### Validate Ownership for a Specific Tool

```bash
bun run check-ownership --validate <tool> <file1> <file2> ...
```

Where `<tool>` is either `kiro` or `lovable`.

Example:
```bash
bun run check-ownership --validate kiro src/server/auth.ts src/lib/utils.ts
```

This will exit with an error if any files are not owned by the specified tool (or shared).

### Show Help

```bash
bun run check-ownership --help
```

## Ownership Categories

The tool categorizes files into four ownership types:

- **🔧 Kiro**: Files owned by Kiro (backend, logic, types, tests)
- **🎨 Lovable**: Files owned by Lovable (UI components, styling)
- **🤝 Shared**: Files requiring coordination between both tools
- **❓ Unassigned**: Files not yet assigned to any owner

## Ownership Rules

### Kiro-Owned Files

- `src/server/**/*` - All server-side functions and API endpoints
- `src/lib/**/*` - Utility libraries and helper functions
- `src/modules/*/types.ts` - TypeScript type definitions
- `src/integrations/supabase/**/*` - Supabase integration
- `src/**/__tests__/**/*` - Test files
- `src/tests/**/*` - Additional test files

### Lovable-Owned Files

- `src/components/ui/**/*` - shadcn/ui component library
- `src/components/templates/**/*` - Page templates and layouts
- `src/components/**/*.tsx` - React components (excluding ui and templates)
- `src/styles.css` - Global styles
- `tailwind.config.*` - Tailwind configuration

### Shared Files

- `src/routes/**/*.tsx` - TanStack Router route definitions
- `src/hooks/**/*` - React hooks
- `package.json` - Project dependencies
- `tsconfig.json` - TypeScript configuration

## Glob Pattern Matching

The tool supports standard glob patterns:

- `*` - Matches any characters except path separator
- `**` - Matches any characters including path separators (recursive)
- `?` - Matches exactly one character
- Exact paths - `package.json` matches only that file

Examples:
- `src/server/**/*` matches all files under `src/server/` recursively
- `src/components/*.tsx` matches only direct children of `src/components/`
- `src/modules/*/types.ts` matches `src/modules/crm/types.ts`, `src/modules/auth/types.ts`, etc.

## Exception Patterns

Some ownership patterns include exceptions. For example:

```json
{
  "pattern": "src/components/**/*.tsx",
  "description": "React components",
  "exceptions": [
    "src/components/ui/**/*",
    "src/components/templates/**/*"
  ]
}
```

This means `src/components/**/*.tsx` matches all `.tsx` files in components, EXCEPT those in `ui/` and `templates/` subdirectories.

## Integration with Pre-Commit Hooks

To integrate with git pre-commit hooks (using husky):

1. Install husky: `bun add -D husky`
2. Initialize husky: `bunx husky init`
3. Add to `.husky/pre-commit`:

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

echo "🔍 Checking file ownership..."
bun run check-ownership:staged
if [ $? -ne 0 ]; then
  echo "❌ Ownership check failed. Please review file ownership rules."
  exit 1
fi
```

## Exit Codes

- `0` - Success (all files properly owned or displayed)
- `1` - Error (ownership violations, missing registry, or invalid arguments)

## Error Messages

### Ownership Violation

```
❌ Ownership Violations Detected:

   src/components/ui/button.tsx
   └─ Owned by: lovable
   └─ Attempted by: kiro

Resolution:
1. If this is a shared file, update ownership.json to mark it as shared
2. If ownership is incorrect, update .kiro/coordination/ownership.json
3. If this is intentional, coordinate with the other tool first
```

### Unassigned Files Warning

```
⚠️  Unassigned Files:

   - README.md
   - docs/guide.md

💡 Consider adding these files to the ownership registry.
```

## Testing

Unit tests are provided in `scripts/check-ownership.test.ts`.

Run tests with:
```bash
bun test scripts/check-ownership.test.ts
```

Or with vitest:
```bash
npx vitest run scripts/check-ownership.test.ts
```

## Troubleshooting

### "Ownership registry not found"

Make sure `.kiro/coordination/ownership.json` exists. This file should have been created in Phase 1, Task 1 of the implementation plan.

### "Could not get staged files"

This warning appears if you're not in a git repository or git is not available. The tool will return an empty list of staged files.

### Pattern not matching expected files

Check that:
1. File paths use forward slashes (`/`) or the tool will normalize them
2. Patterns use `**` for recursive matching
3. Exception patterns are properly defined

## Examples

### Example 1: Check a single file

```bash
$ bun run check-ownership src/server/offers.functions.ts

📋 File Ownership:

🔧 Kiro (1 files):
   - src/server/offers.functions.ts
```

### Example 2: Check multiple files with different owners

```bash
$ bun run check-ownership src/server/auth.ts src/components/ui/button.tsx src/routes/crm.tsx

📋 File Ownership:

🔧 Kiro (1 files):
   - src/server/auth.ts

🎨 Lovable (1 files):
   - src/components/ui/button.tsx

🤝 Shared (1 files):
   - src/routes/crm.tsx
```

### Example 3: Validate Kiro ownership (with violation)

```bash
$ bun run check-ownership --validate kiro src/server/auth.ts src/components/ui/button.tsx

❌ Ownership Violations Detected:

   src/components/ui/button.tsx
   └─ Owned by: lovable
   └─ Attempted by: kiro

Resolution:
1. If this is a shared file, update ownership.json to mark it as shared
2. If ownership is incorrect, update .kiro/coordination/ownership.json
3. If this is intentional, coordinate with the other tool first

Exit code: 1
```

### Example 4: Check staged files

```bash
$ git add src/server/auth.ts src/lib/logger.ts
$ bun run check-ownership:staged

📋 Checking ownership of 2 staged file(s)...

📋 File Ownership:

🔧 Kiro (2 files):
   - src/server/auth.ts
   - src/lib/logger.ts

✅ Ownership check complete.
```

## Related Tools

- `check-work-log.ts` - Check if files are currently being worked on
- `check-recent-changes.ts` - Detect files recently modified by other tool

## Support

For issues or questions about the ownership checking tool, refer to:
- `.kiro/coordination/ownership.json` - The ownership registry
- `design.md` - The coordination system design document
- `requirements.md` - The coordination system requirements

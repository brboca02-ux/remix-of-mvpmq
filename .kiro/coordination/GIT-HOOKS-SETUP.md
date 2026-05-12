# Git Hooks Setup Guide

## Overview

The Kiro-Lovable Coordination System uses git hooks to enforce code quality standards before commits. This ensures that all code meets the project's requirements for ownership, type safety, linting, and testing.

## Installation

### Automatic Setup

Run the setup script to install git hooks:

```bash
npm run setup-hooks
```

This will install a pre-commit hook that runs automatically before each commit.

### Manual Setup

If the automatic setup fails, you can manually copy the hook:

1. Copy `scripts/setup-git-hooks.js` content
2. Run it with Node.js: `node scripts/setup-git-hooks.js`

## Pre-commit Hook Checks

The pre-commit hook runs the following checks in order:

### 1. File Ownership Validation
- **Command**: `npm run check-ownership:staged`
- **Purpose**: Ensures files are modified by the correct tool (Kiro or Lovable)
- **Requirements**: 4.1-4.7, 7.1-7.7, 19.1, 19.5
- **Failure**: Commit is blocked if ownership rules are violated
- **Fix**: Review `.kiro/coordination/ownership.json` and modify only files you own

### 2. TypeScript Type Checking
- **Command**: `npm run typecheck`
- **Purpose**: Ensures no TypeScript errors exist in the codebase
- **Requirements**: 4.1-4.7
- **Failure**: Commit is blocked if type errors exist
- **Fix**: Run `npm run typecheck` to see errors and fix them

### 3. ESLint Code Quality
- **Command**: `npm run lint`
- **Purpose**: Enforces code quality standards (no console.log, no 'any' types, etc.)
- **Requirements**: 7.1-7.7
- **Failure**: Commit is blocked if linting errors exist
- **Fix**: Run `npm run lint` to see errors and fix them

### 4. Test Suite Execution
- **Command**: `npm run test:quick`
- **Purpose**: Ensures all tests pass before committing
- **Requirements**: 19.1, 19.5
- **Failure**: Commit is blocked if tests fail
- **Fix**: Run `npm run test` to see failing tests and fix them

## Bypassing Hooks (Not Recommended)

In emergency situations, you can bypass the pre-commit hook:

```bash
git commit --no-verify
```

**Warning**: Only use this in emergencies. Bypassing hooks can introduce:
- Ownership conflicts
- Type errors
- Code quality issues
- Broken tests

## Troubleshooting

### Hook Not Running

If the hook doesn't run automatically:

1. Check if `.git/hooks/pre-commit` exists
2. Verify the file is executable (Unix/Mac): `chmod +x .git/hooks/pre-commit`
3. Re-run setup: `npm run setup-hooks`

### Hook Fails on Windows

On Windows, git hooks run in Git Bash. Ensure:
- Git for Windows is installed
- npm and node are in your PATH
- You're using Git Bash or a compatible shell

### Slow Hook Execution

The pre-commit hook runs multiple checks. To speed it up:

1. **Ownership check**: Fast, no optimization needed
2. **TypeScript check**: Can be slow on large codebases
   - Consider using `--incremental` flag in tsconfig.json
3. **ESLint**: Can be slow on many files
   - Consider using ESLint cache: `eslint --cache`
4. **Tests**: Can be slow with many tests
   - Use `test:quick` which runs with minimal output
   - Consider running only affected tests

### Hook Blocks Valid Commit

If the hook incorrectly blocks a valid commit:

1. **Ownership violation**: Update `.kiro/coordination/ownership.json` if ownership rules are incorrect
2. **Type errors**: Fix legitimate type errors or add proper type definitions
3. **Linting errors**: Fix code quality issues or update ESLint rules if they're too strict
4. **Test failures**: Fix failing tests or update tests if they're incorrect

## Updating Hooks

When the coordination system is updated, re-run the setup:

```bash
npm run setup-hooks
```

This will overwrite the existing hook with the latest version.

## Hook Configuration

The hook behavior is configured in:
- `scripts/setup-git-hooks.js` - Hook installation script
- `.kiro/coordination/ownership.json` - Ownership rules
- `tsconfig.json` - TypeScript configuration
- `eslint.config.js` - ESLint rules
- `package.json` - Test scripts

## Requirements Addressed

This git hooks infrastructure addresses the following requirements:

- **Requirement 4.1-4.7**: TypeScript strict mode enforcement
- **Requirement 7.1-7.7**: Code quality standards (no console.log, no 'any', etc.)
- **Requirement 19.1**: Verify project builds successfully
- **Requirement 19.5**: Check for TypeScript errors before committing

## Additional Resources

- [Git Hooks Documentation](https://git-scm.com/book/en/v2/Customizing-Git-Git-Hooks)
- [Coordination System Overview](.kiro/coordination/README.md)
- [Ownership Rules](.kiro/coordination/ownership.json)
- [Code Quality Standards](../design.md#code-quality-standards)

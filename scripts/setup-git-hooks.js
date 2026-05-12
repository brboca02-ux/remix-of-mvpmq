#!/usr/bin/env node

/**
 * Setup Git Hooks for Kiro-Lovable Coordination System
 * 
 * This script installs pre-commit hooks directly into .git/hooks/
 * without requiring husky or other dependencies.
 */

import { writeFileSync, chmodSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');
const hooksDir = join(projectRoot, '.git', 'hooks');

// Check if .git directory exists
if (!existsSync(join(projectRoot, '.git'))) {
  console.error('❌ Error: .git directory not found. Are you in a git repository?');
  process.exit(1);
}

// Pre-commit hook content
const preCommitHook = `#!/bin/sh
# Kiro-Lovable Coordination System Pre-commit Hook
# This hook enforces code quality standards before commits

echo "🔍 Running pre-commit checks..."

# 1. Check file ownership
echo "📋 Checking file ownership..."
npm run check-ownership:staged
if [ $? -ne 0 ]; then
  echo "❌ Ownership violation detected. Please review file ownership rules."
  echo "   See .kiro/coordination/ownership.json for ownership assignments."
  exit 1
fi

# 2. Run TypeScript type checking
echo "🔷 Running TypeScript checks..."
npm run typecheck
if [ $? -ne 0 ]; then
  echo "❌ TypeScript errors detected. Please fix type errors before committing."
  exit 1
fi

# 3. Run ESLint
echo "🔍 Running ESLint..."
npm run lint
if [ $? -ne 0 ]; then
  echo "❌ Linting errors detected. Please fix linting errors before committing."
  echo "   Run 'npm run lint' to see detailed errors."
  exit 1
fi

# 4. Run tests
echo "🧪 Running tests..."
npm run test:quick
if [ $? -ne 0 ]; then
  echo "❌ Tests failed. Please fix failing tests before committing."
  echo "   Run 'npm run test' to see detailed test results."
  exit 1
fi

echo "✅ All pre-commit checks passed!"
exit 0
`;

// Install pre-commit hook
const preCommitPath = join(hooksDir, 'pre-commit');

try {
  console.log('📝 Installing pre-commit hook...');
  writeFileSync(preCommitPath, preCommitHook, { mode: 0o755 });
  
  // Make the hook executable (Unix-like systems)
  try {
    chmodSync(preCommitPath, 0o755);
  } catch (err) {
    // chmod might fail on Windows, but that's okay
    console.log('⚠️  Note: Could not set executable permissions (this is normal on Windows)');
  }
  
  console.log('✅ Pre-commit hook installed successfully!');
  console.log('');
  console.log('The following checks will run before each commit:');
  console.log('  1. File ownership validation');
  console.log('  2. TypeScript type checking');
  console.log('  3. ESLint code quality checks');
  console.log('  4. Test suite execution');
  console.log('');
  console.log('To skip hooks temporarily (not recommended), use:');
  console.log('  git commit --no-verify');
  
} catch (err) {
  console.error('❌ Error installing pre-commit hook:', err.message);
  process.exit(1);
}

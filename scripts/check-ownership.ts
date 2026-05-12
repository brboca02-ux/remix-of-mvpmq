#!/usr/bin/env bun
/**
 * File Ownership Validation Script
 * 
 * This script validates file ownership against the ownership registry to prevent
 * Kiro and Lovable from modifying each other's files and causing conflicts.
 * 
 * Usage:
 *   bun run check-ownership <file1> <file2> ...
 *   bun run check-ownership:staged
 * 
 * Requirements: 1.1-1.12
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, relative } from 'path';
import { execSync } from 'child_process';

interface OwnershipPattern {
  pattern: string;
  description: string;
  rationale: string;
  examples?: string[];
  exceptions?: string[];
}

interface OwnershipRegistry {
  version: string;
  lastUpdated: string;
  ownership: {
    kiro: OwnershipPattern[];
    lovable: OwnershipPattern[];
    shared: OwnershipPattern[];
  };
}

type Owner = 'kiro' | 'lovable' | 'shared' | 'unassigned';

/**
 * Load the ownership registry from JSON file
 */
function loadOwnershipRegistry(registryPath: string): OwnershipRegistry {
  if (!existsSync(registryPath)) {
    console.error(`❌ Ownership registry not found at: ${registryPath}`);
    console.error('   Please create .kiro/coordination/ownership.json');
    process.exit(1);
  }

  try {
    const content = readFileSync(registryPath, 'utf-8');
    return JSON.parse(content) as OwnershipRegistry;
  } catch (error) {
    console.error(`❌ Failed to parse ownership registry: ${error}`);
    process.exit(1);
  }
}

/**
 * Convert a glob pattern to a regular expression
 * Supports: *, **, ?, and basic path matching
 */
function globToRegex(pattern: string): RegExp {
  // Normalize path separators to forward slashes
  const normalizedPattern = pattern.replace(/\\/g, '/');
  
  // Handle **/* as a special case - it should match any path depth
  // src/server/**/* should match both src/server/auth.ts and src/server/api/leads.ts
  let regexPattern = normalizedPattern
    // Escape regex special chars (but not * and ?)
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    // Replace **/* with a pattern that matches any depth (at least one path component)
    .replace(/\*\*\/\*/g, '.+')
    // Replace remaining ** with pattern that matches any chars including /
    .replace(/\*\*/g, '.*')
    // Replace single * with pattern that matches anything except /
    .replace(/\*/g, '[^/]*')
    // Replace ? with pattern that matches exactly one char except /
    .replace(/\?/g, '[^/]');
  
  // Anchor the pattern
  regexPattern = `^${regexPattern}$`;
  
  return new RegExp(regexPattern);
}

/**
 * Check if a file path matches a glob pattern
 */
function matchesPattern(filePath: string, pattern: string): boolean {
  // Normalize both paths to forward slashes
  const normalizedFile = filePath.replace(/\\/g, '/');
  const regex = globToRegex(pattern);
  return regex.test(normalizedFile);
}

/**
 * Check if a file matches any exception patterns
 */
function matchesException(filePath: string, exceptions?: string[]): boolean {
  if (!exceptions || exceptions.length === 0) {
    return false;
  }
  
  return exceptions.some(exception => matchesPattern(filePath, exception));
}

/**
 * Determine the owner of a file based on the ownership registry
 */
function getFileOwner(filePath: string, registry: OwnershipRegistry): Owner {
  // Normalize file path to be relative to project root
  const normalizedPath = filePath.replace(/\\/g, '/');
  
  // Check Kiro ownership
  for (const pattern of registry.ownership.kiro) {
    if (matchesPattern(normalizedPath, pattern.pattern)) {
      if (!matchesException(normalizedPath, pattern.exceptions)) {
        return 'kiro';
      }
    }
  }
  
  // Check Lovable ownership
  for (const pattern of registry.ownership.lovable) {
    if (matchesPattern(normalizedPath, pattern.pattern)) {
      if (!matchesException(normalizedPath, pattern.exceptions)) {
        return 'lovable';
      }
    }
  }
  
  // Check Shared ownership
  for (const pattern of registry.ownership.shared) {
    if (matchesPattern(normalizedPath, pattern.pattern)) {
      if (!matchesException(normalizedPath, pattern.exceptions)) {
        return 'shared';
      }
    }
  }
  
  return 'unassigned';
}

/**
 * Get list of staged files from git
 */
function getStagedFiles(): string[] {
  try {
    const output = execSync('git diff --cached --name-only --diff-filter=ACM', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    
    return output
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
  } catch (error) {
    // If git command fails (e.g., not in a git repo), return empty array
    console.warn('⚠️  Could not get staged files. Not in a git repository?');
    return [];
  }
}

/**
 * Display ownership information for files
 */
function displayOwnership(files: string[], registryPath: string): void {
  const registry = loadOwnershipRegistry(registryPath);
  
  console.log('📋 File Ownership:\n');
  
  const ownershipMap: Record<Owner, string[]> = {
    kiro: [],
    lovable: [],
    shared: [],
    unassigned: [],
  };
  
  for (const file of files) {
    const owner = getFileOwner(file, registry);
    ownershipMap[owner].push(file);
  }
  
  // Display by ownership category
  const ownerEmojis: Record<Owner, string> = {
    kiro: '🔧',
    lovable: '🎨',
    shared: '🤝',
    unassigned: '❓',
  };
  
  for (const [owner, fileList] of Object.entries(ownershipMap)) {
    if (fileList.length > 0) {
      const emoji = ownerEmojis[owner as Owner];
      const ownerLabel = owner.charAt(0).toUpperCase() + owner.slice(1);
      console.log(`${emoji} ${ownerLabel} (${fileList.length} files):`);
      fileList.forEach(file => console.log(`   - ${file}`));
      console.log('');
    }
  }
  
  // Warn about unassigned files
  if (ownershipMap.unassigned.length > 0) {
    console.warn('⚠️  Warning: Some files are not assigned to any owner.');
    console.warn('   Consider updating .kiro/coordination/ownership.json\n');
  }
}

/**
 * Validate ownership for a specific tool
 */
function validateOwnership(
  files: string[],
  expectedOwner: 'kiro' | 'lovable',
  registryPath: string
): void {
  const registry = loadOwnershipRegistry(registryPath);
  
  const violations: Array<{ file: string; actualOwner: Owner }> = [];
  const warnings: string[] = [];
  
  for (const file of files) {
    const actualOwner = getFileOwner(file, registry);
    
    // Check for violations (modifying other tool's files)
    if (actualOwner !== expectedOwner && actualOwner !== 'shared' && actualOwner !== 'unassigned') {
      violations.push({ file, actualOwner });
    }
    
    // Warn about unassigned files
    if (actualOwner === 'unassigned') {
      warnings.push(file);
    }
  }
  
  // Report violations
  if (violations.length > 0) {
    console.error('❌ Ownership Violations Detected:\n');
    
    for (const { file, actualOwner } of violations) {
      console.error(`   ${file}`);
      console.error(`   └─ Owned by: ${actualOwner}`);
      console.error(`   └─ Attempted by: ${expectedOwner}\n`);
    }
    
    console.error('Resolution:');
    console.error('1. If this is a shared file, update ownership.json to mark it as shared');
    console.error('2. If ownership is incorrect, update .kiro/coordination/ownership.json');
    console.error('3. If this is intentional, coordinate with the other tool first\n');
    
    process.exit(1);
  }
  
  // Report warnings
  if (warnings.length > 0) {
    console.warn('⚠️  Unassigned Files:\n');
    warnings.forEach(file => console.warn(`   - ${file}`));
    console.warn('\n💡 Consider adding these files to the ownership registry.\n');
  }
  
  // Success message
  if (violations.length === 0) {
    console.log(`✅ All files are properly owned by ${expectedOwner} or shared.`);
    
    if (warnings.length === 0) {
      console.log('✅ No unassigned files detected.\n');
    }
  }
}

/**
 * Check ownership of staged files (for pre-commit hook)
 */
function checkStagedFiles(registryPath: string): void {
  const stagedFiles = getStagedFiles();
  
  if (stagedFiles.length === 0) {
    console.log('ℹ️  No staged files to check.');
    return;
  }
  
  console.log(`📋 Checking ownership of ${stagedFiles.length} staged file(s)...\n`);
  
  displayOwnership(stagedFiles, registryPath);
  
  // For staged files, we just display ownership without enforcing
  // The pre-commit hook can be configured to enforce if needed
  console.log('✅ Ownership check complete.\n');
}

/**
 * Main execution
 */
function main(): void {
  const args = process.argv.slice(2);
  const registryPath = resolve(process.cwd(), '.kiro/coordination/ownership.json');
  
  // Show help
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
File Ownership Validation

Usage:
  bun run check-ownership <file1> <file2> ...   Check ownership of specific files
  bun run check-ownership:staged                 Check ownership of staged files
  bun run check-ownership --validate <tool>      Validate files for specific tool
  bun run check-ownership --help                 Show this help message

Options:
  --validate <tool>    Validate that files are owned by 'kiro' or 'lovable'
                       Exits with error if violations are found

Examples:
  bun run check-ownership src/routes/crm.tsx
  bun run check-ownership src/server/auth.ts src/lib/utils.ts
  bun run check-ownership:staged
  bun run check-ownership --validate kiro src/server/auth.ts

Requirements: 1.1-1.12
    `);
    return;
  }
  
  // Check staged files
  if (args.includes('--staged')) {
    checkStagedFiles(registryPath);
    return;
  }
  
  // Validate ownership for a specific tool
  if (args.includes('--validate')) {
    const validateIndex = args.indexOf('--validate');
    const tool = args[validateIndex + 1];
    
    if (!tool || (tool !== 'kiro' && tool !== 'lovable')) {
      console.error('❌ Invalid tool specified. Use "kiro" or "lovable".');
      process.exit(1);
    }
    
    const files = args.slice(validateIndex + 2);
    
    if (files.length === 0) {
      console.error('❌ No files specified for validation.');
      process.exit(1);
    }
    
    validateOwnership(files, tool as 'kiro' | 'lovable', registryPath);
    return;
  }
  
  // Display ownership for specified files
  if (args.length === 0) {
    console.error('❌ No files specified.');
    console.error('   Use --help for usage information.');
    process.exit(1);
  }
  
  displayOwnership(args, registryPath);
}

// Run if executed directly
if (import.meta.main) {
  main();
}

// Export functions for testing
export {
  loadOwnershipRegistry,
  globToRegex,
  matchesPattern,
  matchesException,
  getFileOwner,
  getStagedFiles,
  displayOwnership,
  validateOwnership,
  checkStagedFiles,
};

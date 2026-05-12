#!/usr/bin/env bun
/**
 * Audit script for 'any' type usage in TypeScript codebase
 * Part of Kiro-Lovable Coordination System - Task 14.1
 */

import { readdirSync, readFileSync, statSync, existsSync, mkdirSync } from 'fs';
import { join, relative } from 'path';

interface AnyOccurrence {
  file: string;
  line: number;
  column: number;
  context: string;
  category: 'parameter' | 'return-type' | 'variable' | 'type-assertion' | 'generic' | 'other';
  complexity: 'simple' | 'medium' | 'complex';
}

interface FileAudit {
  file: string;
  ownership: 'kiro' | 'lovable' | 'shared' | 'unassigned';
  occurrences: AnyOccurrence[];
  totalCount: number;
}

interface AuditReport {
  totalCount: number;
  byOwnership: {
    kiro: FileAudit[];
    lovable: FileAudit[];
    shared: FileAudit[];
    unassigned: FileAudit[];
  };
  byComplexity: {
    simple: number;
    medium: number;
    complex: number;
  };
  summary: {
    filesAffected: number;
    kiroFiles: number;
    lovableFiles: number;
    sharedFiles: number;
    unassignedFiles: number;
  };
}

// File ownership patterns based on coordination spec
const OWNERSHIP_PATTERNS = {
  kiro: [
    /^src\/server\//,
    /^src\/lib\//,
    /^src\/modules\/.*\/types\.ts$/,
    /^src\/integrations\/supabase\//,
    /^src\/__tests__\//,
    /^src\/tests\//,
  ],
  lovable: [
    /^src\/components\/ui\//,
    /^src\/components\/templates\//,
    /^src\/components\/.*\.tsx$/,
    /^src\/styles\.css$/,
    /^tailwind\.config\./,
  ],
  shared: [
    /^src\/routes\/.*\.tsx$/,
    /^src\/hooks\//,
    /^package\.json$/,
    /^tsconfig\.json$/,
  ],
};

function determineOwnership(filePath: string): 'kiro' | 'lovable' | 'shared' | 'unassigned' {
  const normalizedPath = filePath.replace(/\\/g, '/');
  
  for (const pattern of OWNERSHIP_PATTERNS.kiro) {
    if (pattern.test(normalizedPath)) return 'kiro';
  }
  
  for (const pattern of OWNERSHIP_PATTERNS.lovable) {
    if (pattern.test(normalizedPath)) return 'lovable';
  }
  
  for (const pattern of OWNERSHIP_PATTERNS.shared) {
    if (pattern.test(normalizedPath)) return 'shared';
  }
  
  return 'unassigned';
}

function categorizeAnyUsage(line: string, context: string): AnyOccurrence['category'] {
  // Parameter type
  if (/\([^)]*:\s*any/.test(context) || /\.\.\.[^:]*:\s*any/.test(context)) {
    return 'parameter';
  }
  
  // Return type
  if (/\):\s*any\b/.test(context) || /Promise<any>/.test(context)) {
    return 'return-type';
  }
  
  // Type assertion
  if (/as\s+any\b/.test(context)) {
    return 'type-assertion';
  }
  
  // Generic type
  if (/<any>/.test(context) || /Array<any>/.test(context) || /Record<[^,]+,\s*any>/.test(context)) {
    return 'generic';
  }
  
  // Variable declaration
  if (/(?:const|let|var)\s+[^:]+:\s*any/.test(context)) {
    return 'variable';
  }
  
  return 'other';
}

function assessComplexity(line: string, context: string, category: AnyOccurrence['category']): AnyOccurrence['complexity'] {
  // Simple cases - easy to fix
  if (category === 'type-assertion' && /as\s+any\s*[;,\)]/.test(context)) {
    return 'simple';
  }
  
  if (category === 'variable' && /:\s*any\[\]/.test(context)) {
    return 'simple';
  }
  
  // Complex cases - require significant refactoring
  if (context.includes('catch') && /err.*:\s*any/.test(context)) {
    return 'simple'; // Error types are straightforward
  }
  
  if (category === 'return-type' && /Promise<any>/.test(context)) {
    return 'medium';
  }
  
  if (category === 'generic' && /Record<.*,\s*any>/.test(context)) {
    return 'medium';
  }
  
  // Default to medium complexity
  return 'medium';
}

function scanFile(filePath: string): AnyOccurrence[] {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const occurrences: AnyOccurrence[] = [];
  
  const anyPattern = /\bany\b/g;
  
  lines.forEach((line, index) => {
    let match;
    anyPattern.lastIndex = 0; // Reset regex
    
    while ((match = anyPattern.exec(line)) !== null) {
      // Get context (3 lines before and after)
      const contextStart = Math.max(0, index - 1);
      const contextEnd = Math.min(lines.length - 1, index + 1);
      const context = lines.slice(contextStart, contextEnd + 1).join('\n');
      
      const category = categorizeAnyUsage(line, context);
      const complexity = assessComplexity(line, context, category);
      
      occurrences.push({
        file: filePath,
        line: index + 1,
        column: match.index + 1,
        context: line.trim(),
        category,
        complexity,
      });
    }
  });
  
  return occurrences;
}

function scanDirectory(dir: string, baseDir: string): FileAudit[] {
  const results: FileAudit[] = [];
  
  try {
    const entries = readdirSync(dir);
    
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Skip node_modules, dist, .git, etc.
        if (['node_modules', 'dist', '.git', '.output', '.vinxi', 'build'].includes(entry)) {
          continue;
        }
        results.push(...scanDirectory(fullPath, baseDir));
      } else if (stat.isFile() && (entry.endsWith('.ts') || entry.endsWith('.tsx'))) {
        const occurrences = scanFile(fullPath);
        
        if (occurrences.length > 0) {
          const relativePath = relative(baseDir, fullPath);
          const ownership = determineOwnership(relativePath);
          
          results.push({
            file: relativePath,
            ownership,
            occurrences,
            totalCount: occurrences.length,
          });
        }
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${dir}:`, error);
  }
  
  return results;
}

function generateReport(audits: FileAudit[]): AuditReport {
  const byOwnership = {
    kiro: audits.filter(a => a.ownership === 'kiro'),
    lovable: audits.filter(a => a.ownership === 'lovable'),
    shared: audits.filter(a => a.ownership === 'shared'),
    unassigned: audits.filter(a => a.ownership === 'unassigned'),
  };
  
  const allOccurrences = audits.flatMap(a => a.occurrences);
  const byComplexity = {
    simple: allOccurrences.filter(o => o.complexity === 'simple').length,
    medium: allOccurrences.filter(o => o.complexity === 'medium').length,
    complex: allOccurrences.filter(o => o.complexity === 'complex').length,
  };
  
  return {
    totalCount: allOccurrences.length,
    byOwnership,
    byComplexity,
    summary: {
      filesAffected: audits.length,
      kiroFiles: byOwnership.kiro.length,
      lovableFiles: byOwnership.lovable.length,
      sharedFiles: byOwnership.shared.length,
      unassignedFiles: byOwnership.unassigned.length,
    },
  };
}

function formatMarkdownReport(report: AuditReport): string {
  const md: string[] = [];
  
  md.push('# TypeScript `any` Type Audit Report');
  md.push('');
  md.push('**Generated**: ' + new Date().toISOString());
  md.push('**Task**: 14.1 Audit codebase for \'any\' usage');
  md.push('**Spec**: Kiro-Lovable Coordination System');
  md.push('');
  
  // Executive Summary
  md.push('## Executive Summary');
  md.push('');
  md.push(`- **Total \`any\` occurrences**: ${report.totalCount}`);
  md.push(`- **Files affected**: ${report.summary.filesAffected}`);
  md.push(`- **Kiro-owned files**: ${report.summary.kiroFiles} (${report.byOwnership.kiro.reduce((sum, f) => sum + f.totalCount, 0)} occurrences)`);
  md.push(`- **Lovable-owned files**: ${report.summary.lovableFiles} (${report.byOwnership.lovable.reduce((sum, f) => sum + f.totalCount, 0)} occurrences)`);
  md.push(`- **Shared files**: ${report.summary.sharedFiles} (${report.byOwnership.shared.reduce((sum, f) => sum + f.totalCount, 0)} occurrences)`);
  md.push(`- **Unassigned files**: ${report.summary.unassignedFiles} (${report.byOwnership.unassigned.reduce((sum, f) => sum + f.totalCount, 0)} occurrences)`);
  md.push('');
  
  // Complexity Breakdown
  md.push('## Complexity Assessment');
  md.push('');
  md.push(`- **Simple** (easy to fix): ${report.byComplexity.simple} occurrences`);
  md.push(`- **Medium** (moderate effort): ${report.byComplexity.medium} occurrences`);
  md.push(`- **Complex** (significant refactoring): ${report.byComplexity.complex} occurrences`);
  md.push('');
  
  // Priority Order
  md.push('## Recommended Fix Priority');
  md.push('');
  md.push('Based on file ownership and complexity, the recommended order is:');
  md.push('');
  md.push('1. **Kiro-owned files** (Kiro has full control, no coordination needed)');
  md.push('2. **Shared files** (requires coordination between Kiro and Lovable)');
  md.push('3. **Lovable-owned files** (Lovable should fix with type definitions from Kiro)');
  md.push('4. **Unassigned files** (determine ownership first)');
  md.push('');
  
  // Detailed Breakdown by Ownership
  const ownerships: Array<keyof typeof report.byOwnership> = ['kiro', 'lovable', 'shared', 'unassigned'];
  
  for (const ownership of ownerships) {
    const files = report.byOwnership[ownership];
    if (files.length === 0) continue;
    
    const totalOccurrences = files.reduce((sum, f) => sum + f.totalCount, 0);
    
    md.push(`## ${ownership.charAt(0).toUpperCase() + ownership.slice(1)}-Owned Files`);
    md.push('');
    md.push(`**Total occurrences**: ${totalOccurrences} across ${files.length} files`);
    md.push('');
    
    // Sort files by occurrence count (descending)
    const sortedFiles = [...files].sort((a, b) => b.totalCount - a.totalCount);
    
    for (const fileAudit of sortedFiles) {
      md.push(`### \`${fileAudit.file}\``);
      md.push('');
      md.push(`**Occurrences**: ${fileAudit.totalCount}`);
      md.push('');
      
      // Group by category
      const byCategory = new Map<string, AnyOccurrence[]>();
      for (const occ of fileAudit.occurrences) {
        if (!byCategory.has(occ.category)) {
          byCategory.set(occ.category, []);
        }
        byCategory.get(occ.category)!.push(occ);
      }
      
      for (const [category, occurrences] of byCategory) {
        md.push(`#### ${category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} (${occurrences.length})`);
        md.push('');
        
        for (const occ of occurrences) {
          md.push(`- **Line ${occ.line}:${occ.column}** [${occ.complexity}]`);
          md.push(`  \`\`\`typescript`);
          md.push(`  ${occ.context}`);
          md.push(`  \`\`\``);
          md.push('');
        }
      }
    }
  }
  
  // Recommendations
  md.push('## Recommendations');
  md.push('');
  md.push('### Immediate Actions (Task 14.2)');
  md.push('');
  md.push('1. Create comprehensive type definitions in `src/modules/*/types.ts`');
  md.push('2. Define interfaces for:');
  md.push('   - API response types');
  md.push('   - Database entity types');
  md.push('   - Component prop types');
  md.push('   - Store state types');
  md.push('   - Server function parameter and return types');
  md.push('');
  
  md.push('### Type Replacement Strategy (Task 14.3)');
  md.push('');
  md.push('1. **Phase 1**: Replace simple cases (type assertions, error catches)');
  md.push('2. **Phase 2**: Replace function parameters and return types');
  md.push('3. **Phase 3**: Replace complex generic types and nested structures');
  md.push('4. **Phase 4**: Update shared files with coordination');
  md.push('');
  
  md.push('### Common Patterns to Address');
  md.push('');
  md.push('- **Error handling**: Replace `catch (err: any)` with `catch (err: unknown)` and type guards');
  md.push('- **API responses**: Create specific response types instead of `any`');
  md.push('- **JSON parsing**: Use type guards and validation instead of `as any`');
  md.push('- **External library types**: Import proper types or create declaration files');
  md.push('- **Dynamic objects**: Use `Record<string, unknown>` or specific interfaces');
  md.push('');
  
  md.push('## Next Steps');
  md.push('');
  md.push('1. Review this audit report');
  md.push('2. Proceed to Task 14.2: Create missing type definitions');
  md.push('3. Proceed to Task 14.3: Replace `any` types with proper types');
  md.push('4. Run TypeScript compiler in strict mode to verify');
  md.push('5. Update ESLint configuration to enforce no-explicit-any rule');
  md.push('');
  
  return md.join('\n');
}

// Main execution
const projectRoot = process.cwd();
const srcDir = join(projectRoot, 'src');

console.log('🔍 Scanning TypeScript files for "any" type usage...');
console.log(`📁 Project root: ${projectRoot}`);
console.log('');

const audits = scanDirectory(srcDir, projectRoot);
const report = generateReport(audits);

console.log('✅ Scan complete!');
console.log('');
console.log(`📊 Found ${report.totalCount} occurrences of "any" across ${report.summary.filesAffected} files`);
console.log('');
console.log('Breakdown by ownership:');
console.log(`  - Kiro: ${report.byOwnership.kiro.reduce((sum, f) => sum + f.totalCount, 0)} occurrences in ${report.summary.kiroFiles} files`);
console.log(`  - Lovable: ${report.byOwnership.lovable.reduce((sum, f) => sum + f.totalCount, 0)} occurrences in ${report.summary.lovableFiles} files`);
console.log(`  - Shared: ${report.byOwnership.shared.reduce((sum, f) => sum + f.totalCount, 0)} occurrences in ${report.summary.sharedFiles} files`);
console.log(`  - Unassigned: ${report.byOwnership.unassigned.reduce((sum, f) => sum + f.totalCount, 0)} occurrences in ${report.summary.unassignedFiles} files`);
console.log('');

// Generate markdown report
const markdown = formatMarkdownReport(report);

// Ensure output directory exists
const outputDir = join(projectRoot, '.kiro', 'coordination', 'audits');
if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}

const outputPath = join(outputDir, 'any-type-audit.md');
const { writeFileSync } = await import('fs');
writeFileSync(outputPath, markdown, 'utf-8');

console.log(`📝 Report saved to: ${relative(projectRoot, outputPath)}`);
console.log('');
console.log('Next steps:');
console.log('  1. Review the audit report');
console.log('  2. Proceed to Task 14.2: Create missing type definitions');
console.log('  3. Proceed to Task 14.3: Replace "any" types with proper types');

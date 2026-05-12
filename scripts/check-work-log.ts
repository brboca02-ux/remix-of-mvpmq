#!/usr/bin/env bun
/**
 * Work Log Conflict Detection Script
 * 
 * This script checks if files are currently being worked on by either Kiro or Lovable
 * to prevent simultaneous modifications and merge conflicts.
 * 
 * Usage:
 *   bun run check-work-log <file1> <file2> ...
 *   bun run check-work-log:status
 * 
 * Requirements: 8.2, 8.3
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

interface WorkItem {
  tool: 'Kiro' | 'Lovable';
  title: string;
  status: 'In Progress' | 'Completed' | 'Blocked';
  files: string[];
  description: string;
  startedAt?: string;
  expectedCompletion?: string;
  handoffNeeded?: string;
  blockingReason?: string;
}

/**
 * Parse the work log markdown file and extract work items
 */
function parseWorkLog(workLogPath: string): WorkItem[] {
  if (!existsSync(workLogPath)) {
    console.error(`❌ Work log not found at: ${workLogPath}`);
    console.error('   Please create .kiro/coordination/work-log.md');
    process.exit(1);
  }

  const workLog = readFileSync(workLogPath, 'utf-8');
  const items: WorkItem[] = [];

  // Split by work item headers (### [Tool] ...)
  const sections = workLog.split(/^### /m).slice(1);

  for (const section of sections) {
    // Extract tool from [Kiro] or [Lovable]
    const toolMatch = section.match(/^\[(Kiro|Lovable)\]/);
    if (!toolMatch) continue;

    const tool = toolMatch[1] as 'Kiro' | 'Lovable';

    // Extract title (everything after [Tool] until newline)
    const titleMatch = section.match(/^\[(?:Kiro|Lovable)\]\s+(.+?)$/m);
    const title = titleMatch ? titleMatch[1].trim() : 'Unknown';

    // Extract status
    const statusMatch = section.match(/\*\*Status\*\*:\s*(In Progress|Completed|Blocked)/);
    if (!statusMatch) continue;

    const status = statusMatch[1] as 'In Progress' | 'Completed' | 'Blocked';

    // Extract files list
    const filesMatch = section.match(/\*\*Files\*\*:\s*\n((?:- .+\n?)+)/);
    const files = filesMatch
      ? filesMatch[1]
          .split('\n')
          .filter(line => line.trim().startsWith('-'))
          .map(line => line.replace(/^- /, '').trim())
      : [];

    // Extract description
    const descMatch = section.match(/\*\*Description\*\*:\s*(.+?)(?:\n\n|\*\*|$)/s);
    const description = descMatch ? descMatch[1].trim() : '';

    // Extract optional fields
    const startedAtMatch = section.match(/\*\*Started\*\*:\s*(.+?)$/m);
    const expectedCompletionMatch = section.match(/\*\*Expected Completion\*\*:\s*(.+?)$/m);
    const handoffMatch = section.match(/\*\*Handoff Needed\*\*:\s*(.+?)$/m);
    const blockingMatch = section.match(/\*\*Blocking Reason\*\*:\s*(.+?)$/m);

    items.push({
      tool,
      title,
      status,
      files,
      description,
      startedAt: startedAtMatch?.[1].trim(),
      expectedCompletion: expectedCompletionMatch?.[1].trim(),
      handoffNeeded: handoffMatch?.[1].trim(),
      blockingReason: blockingMatch?.[1].trim(),
    });
  }

  return items;
}

/**
 * Get only active work items (In Progress or Blocked)
 */
function getActiveWork(items: WorkItem[]): WorkItem[] {
  return items.filter(item => item.status === 'In Progress' || item.status === 'Blocked');
}

/**
 * Check if any of the specified files are being actively worked on
 */
function checkWorkLogConflicts(filesToModify: string[], workLogPath: string): void {
  const allItems = parseWorkLog(workLogPath);
  const activeWork = getActiveWork(allItems);

  if (activeWork.length === 0) {
    console.log('✅ No active work in progress. Safe to proceed.');
    return;
  }

  const conflicts: Array<{ file: string; activeBy: string; title: string }> = [];

  for (const file of filesToModify) {
    // Normalize file paths for comparison
    const normalizedFile = file.replace(/\\/g, '/');

    for (const work of activeWork) {
      for (const workFile of work.files) {
        const normalizedWorkFile = workFile.replace(/\\/g, '/');
        
        // Check for exact match or if one path contains the other
        if (
          normalizedFile === normalizedWorkFile ||
          normalizedFile.includes(normalizedWorkFile) ||
          normalizedWorkFile.includes(normalizedFile)
        ) {
          conflicts.push({
            file,
            activeBy: work.tool,
            title: work.title,
          });
        }
      }
    }
  }

  if (conflicts.length > 0) {
    console.error('🚫 Work log conflicts detected:\n');
    conflicts.forEach(c => {
      console.error(`   ${c.file}`);
      console.error(`   └─ Currently being worked on by ${c.activeBy}`);
      console.error(`   └─ Task: ${c.title}\n`);
    });
    console.error('❌ Please coordinate before modifying these files.');
    console.error('   Update the work log or wait for the other tool to complete.\n');
    process.exit(1);
  } else {
    console.log('✅ No work log conflicts detected. Safe to proceed.');
  }
}

/**
 * Display current work status
 */
function showWorkStatus(workLogPath: string): void {
  const allItems = parseWorkLog(workLogPath);
  const activeWork = getActiveWork(allItems);

  if (activeWork.length === 0) {
    console.log('📋 No active work in progress.\n');
    return;
  }

  console.log('📋 Current Active Work:\n');

  for (const work of activeWork) {
    const statusEmoji = work.status === 'In Progress' ? '🔄' : '🚫';
    console.log(`${statusEmoji} [${work.tool}] ${work.title}`);
    console.log(`   Status: ${work.status}`);
    
    if (work.description) {
      console.log(`   Description: ${work.description}`);
    }
    
    if (work.files.length > 0) {
      console.log(`   Files (${work.files.length}):`);
      work.files.slice(0, 5).forEach(file => {
        console.log(`     - ${file}`);
      });
      if (work.files.length > 5) {
        console.log(`     ... and ${work.files.length - 5} more`);
      }
    }
    
    if (work.expectedCompletion) {
      console.log(`   Expected: ${work.expectedCompletion}`);
    }
    
    if (work.blockingReason) {
      console.log(`   ⚠️  Blocked: ${work.blockingReason}`);
    }
    
    console.log('');
  }
}

/**
 * Main execution
 */
function main(): void {
  const args = process.argv.slice(2);
  const workLogPath = resolve(process.cwd(), '.kiro/coordination/work-log.md');

  // If no arguments or --status flag, show status
  if (args.length === 0 || args[0] === '--status') {
    showWorkStatus(workLogPath);
    return;
  }

  // If --help flag, show usage
  if (args[0] === '--help' || args[0] === '-h') {
    console.log(`
Work Log Conflict Detection

Usage:
  bun run check-work-log <file1> <file2> ...    Check if files have conflicts
  bun run check-work-log --status               Show current active work
  bun run check-work-log --help                 Show this help message

Examples:
  bun run check-work-log src/routes/crm.tsx
  bun run check-work-log src/server/auth.ts src/lib/utils.ts
  bun run check-work-log --status

Requirements: 8.2, 8.3
    `);
    return;
  }

  // Check for conflicts with specified files
  checkWorkLogConflicts(args, workLogPath);
}

// Run if executed directly
if (import.meta.main) {
  main();
}

// Export functions for testing
export { parseWorkLog, getActiveWork, checkWorkLogConflicts, showWorkStatus };

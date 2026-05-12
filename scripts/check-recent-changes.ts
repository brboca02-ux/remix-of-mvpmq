#!/usr/bin/env bun
/**
 * Recent Changes Detection Script
 * 
 * This script detects files recently modified by either Kiro or Lovable
 * to prevent conflicts and enable coordination between tools.
 * 
 * Usage:
 *   bun run check-recent-changes <file1> <file2> ...
 *   bun run check-recent-changes --hours 48 <file1> <file2> ...
 *   bun run check-recent-changes --all
 * 
 * Requirements: 8.1, 8.4
 */

import { execSync } from 'child_process';

interface RecentChange {
  file: string;
  tool: 'Kiro' | 'Lovable' | 'Unknown';
  timestamp: string;
  commitHash: string;
  commitMessage: string;
}

/**
 * Get recent changes from git log
 */
function getRecentChanges(hours: number = 24): RecentChange[] {
  try {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    
    // Get git log with file names
    const gitLog = execSync(
      `git log --since="${since}" --name-only --pretty=format:"%H|%ai|%s"`,
      { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] }
    ).trim();

    if (!gitLog) {
      return [];
    }

    const changes: RecentChange[] = [];
    const commits = gitLog.split('\n\n').filter(c => c.trim());

    for (const commit of commits) {
      const lines = commit.split('\n').filter(l => l.trim());
      if (lines.length === 0) continue;

      const [hash, timestamp, ...messageParts] = lines[0].split('|');
      const message = messageParts.join('|'); // Rejoin in case message contains |
      
      // Determine tool from commit message
      let tool: 'Kiro' | 'Lovable' | 'Unknown' = 'Unknown';
      if (message.startsWith('[Kiro]')) {
        tool = 'Kiro';
      } else if (message.startsWith('[Lovable]')) {
        tool = 'Lovable';
      }

      // Extract file names (skip the first line which is the commit info)
      for (let i = 1; i < lines.length; i++) {
        const file = lines[i].trim();
        if (file && !file.includes('|')) {
          changes.push({
            file,
            tool,
            timestamp,
            commitHash: hash,
            commitMessage: message,
          });
        }
      }
    }

    return changes;
  } catch (error) {
    // If git command fails (e.g., not a git repo, no commits), return empty array
    if (error instanceof Error && 'status' in error) {
      console.warn('⚠️  Unable to retrieve git history. Is this a git repository?');
    }
    return [];
  }
}

/**
 * Check for conflicts with specified files
 */
function checkConflicts(filesToModify: string[], hours: number = 24): void {
  const recentChanges = getRecentChanges(hours);
  
  if (recentChanges.length === 0) {
    console.log(`✅ No recent changes in the last ${hours} hours. Safe to proceed.`);
    return;
  }

  const conflicts: Array<{
    file: string;
    lastModifiedBy: string;
    when: string;
    commitMessage: string;
  }> = [];

  for (const file of filesToModify) {
    // Normalize file paths for comparison (handle both forward and back slashes)
    const normalizedFile = file.replace(/\\/g, '/');

    // Find the most recent change for this file
    const recentChange = recentChanges.find(c => {
      const normalizedChangeFile = c.file.replace(/\\/g, '/');
      return normalizedChangeFile === normalizedFile ||
             normalizedFile.includes(normalizedChangeFile) ||
             normalizedChangeFile.includes(normalizedFile);
    });

    if (recentChange) {
      conflicts.push({
        file,
        lastModifiedBy: recentChange.tool,
        when: recentChange.timestamp,
        commitMessage: recentChange.commitMessage,
      });
    }
  }

  if (conflicts.length > 0) {
    console.warn(`⚠️  Potential conflicts detected (${conflicts.length} file${conflicts.length > 1 ? 's' : ''}):\n`);
    conflicts.forEach(c => {
      const timeAgo = getTimeAgo(c.when);
      console.warn(`   📄 ${c.file}`);
      console.warn(`   └─ Last modified by ${c.lastModifiedBy} ${timeAgo}`);
      console.warn(`   └─ Commit: ${c.commitMessage.substring(0, 60)}${c.commitMessage.length > 60 ? '...' : ''}`);
      console.warn('');
    });
    console.warn('💡 Consider coordinating with the other tool before proceeding.');
    console.warn('   Review recent changes and update the work log if needed.\n');
  } else {
    console.log(`✅ No conflicts detected for specified files in the last ${hours} hours.`);
  }
}

/**
 * Show all recent changes
 */
function showAllRecentChanges(hours: number = 24): void {
  const recentChanges = getRecentChanges(hours);

  if (recentChanges.length === 0) {
    console.log(`📋 No changes in the last ${hours} hours.\n`);
    return;
  }

  // Group changes by tool
  const kiroChanges = recentChanges.filter(c => c.tool === 'Kiro');
  const lovableChanges = recentChanges.filter(c => c.tool === 'Lovable');
  const unknownChanges = recentChanges.filter(c => c.tool === 'Unknown');

  console.log(`📋 Recent Changes (last ${hours} hours):\n`);

  if (kiroChanges.length > 0) {
    console.log(`🔷 Kiro (${kiroChanges.length} file${kiroChanges.length > 1 ? 's' : ''}):`);
    const uniqueKiroFiles = [...new Set(kiroChanges.map(c => c.file))];
    uniqueKiroFiles.slice(0, 10).forEach(file => {
      console.log(`   - ${file}`);
    });
    if (uniqueKiroFiles.length > 10) {
      console.log(`   ... and ${uniqueKiroFiles.length - 10} more`);
    }
    console.log('');
  }

  if (lovableChanges.length > 0) {
    console.log(`💜 Lovable (${lovableChanges.length} file${lovableChanges.length > 1 ? 's' : ''}):`);
    const uniqueLovableFiles = [...new Set(lovableChanges.map(c => c.file))];
    uniqueLovableFiles.slice(0, 10).forEach(file => {
      console.log(`   - ${file}`);
    });
    if (uniqueLovableFiles.length > 10) {
      console.log(`   ... and ${uniqueLovableFiles.length - 10} more`);
    }
    console.log('');
  }

  if (unknownChanges.length > 0) {
    console.log(`❓ Unknown Tool (${unknownChanges.length} file${unknownChanges.length > 1 ? 's' : ''}):`);
    console.log('   (Commits without [Kiro] or [Lovable] prefix)');
    const uniqueUnknownFiles = [...new Set(unknownChanges.map(c => c.file))];
    uniqueUnknownFiles.slice(0, 5).forEach(file => {
      console.log(`   - ${file}`);
    });
    if (uniqueUnknownFiles.length > 5) {
      console.log(`   ... and ${uniqueUnknownFiles.length - 5} more`);
    }
    console.log('');
  }
}

/**
 * Get human-readable time ago string
 */
function getTimeAgo(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) {
    return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  } else {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  }
}

/**
 * Main execution
 */
function main(): void {
  const args = process.argv.slice(2);

  // Parse arguments
  let hours = 24;
  let files: string[] = [];
  let showAll = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h') {
      console.log(`
Recent Changes Detection

Usage:
  bun run check-recent-changes <file1> <file2> ...           Check specific files
  bun run check-recent-changes --hours 48 <file1> ...        Check with custom time window
  bun run check-recent-changes --all                         Show all recent changes
  bun run check-recent-changes --all --hours 48              Show all changes in last 48 hours
  bun run check-recent-changes --help                        Show this help message

Examples:
  bun run check-recent-changes src/routes/crm.tsx
  bun run check-recent-changes --hours 48 src/server/auth.ts
  bun run check-recent-changes --all
  bun run check-recent-changes --all --hours 72

Options:
  --hours <n>    Look back n hours (default: 24)
  --all          Show all recent changes grouped by tool
  --help, -h     Show this help message

Requirements: 8.1, 8.4
      `);
      return;
    } else if (arg === '--hours') {
      i++;
      if (i < args.length) {
        const parsedHours = parseInt(args[i], 10);
        if (!isNaN(parsedHours) && parsedHours > 0) {
          hours = parsedHours;
        } else {
          console.error('❌ Invalid hours value. Using default (24).');
        }
      }
    } else if (arg === '--all') {
      showAll = true;
    } else if (!arg.startsWith('--')) {
      files.push(arg);
    }
  }

  // Show all recent changes if --all flag is present
  if (showAll) {
    showAllRecentChanges(hours);
    return;
  }

  // If no files specified, show help
  if (files.length === 0) {
    console.log('❌ No files specified. Use --all to see all recent changes or specify files to check.\n');
    console.log('Usage: bun run check-recent-changes <file1> <file2> ...');
    console.log('       bun run check-recent-changes --help\n');
    process.exit(1);
  }

  // Check for conflicts with specified files
  checkConflicts(files, hours);
}

// Run if executed directly
if (import.meta.main) {
  main();
}

// Export functions for testing
export { getRecentChanges, checkConflicts, showAllRecentChanges };

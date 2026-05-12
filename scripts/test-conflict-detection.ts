#!/usr/bin/env bun
/**
 * Test script for conflict detection functionality
 * 
 * This script tests both check-recent-changes and check-work-log scripts
 * to ensure they work correctly together.
 */

import { getRecentChanges, showAllRecentChanges } from './check-recent-changes';
import { parseWorkLog, getActiveWork, showWorkStatus } from './check-work-log';
import { resolve } from 'path';

console.log('🧪 Testing Conflict Detection Scripts\n');
console.log('=' .repeat(60));

// Test 1: Recent Changes Detection
console.log('\n📋 Test 1: Recent Changes Detection');
console.log('-'.repeat(60));

try {
  const recentChanges = getRecentChanges(24);
  console.log(`✅ Retrieved ${recentChanges.length} recent changes from git log`);
  
  if (recentChanges.length > 0) {
    const kiroChanges = recentChanges.filter(c => c.tool === 'Kiro').length;
    const lovableChanges = recentChanges.filter(c => c.tool === 'Lovable').length;
    const unknownChanges = recentChanges.filter(c => c.tool === 'Unknown').length;
    
    console.log(`   - Kiro changes: ${kiroChanges}`);
    console.log(`   - Lovable changes: ${lovableChanges}`);
    console.log(`   - Unknown changes: ${unknownChanges}`);
    
    console.log('\n   Sample recent changes:');
    showAllRecentChanges(24);
  } else {
    console.log('   ℹ️  No recent changes found (this is normal for a new repo)');
  }
} catch (error) {
  console.error('❌ Test 1 failed:', error);
  process.exit(1);
}

// Test 2: Work Log Parsing
console.log('\n📋 Test 2: Work Log Parsing');
console.log('-'.repeat(60));

try {
  const workLogPath = resolve(process.cwd(), '.kiro/coordination/work-log.md');
  const allItems = parseWorkLog(workLogPath);
  const activeItems = getActiveWork(allItems);
  
  console.log(`✅ Parsed ${allItems.length} work items from work log`);
  console.log(`   - Active items: ${activeItems.length}`);
  console.log(`   - Completed items: ${allItems.length - activeItems.length}`);
  
  if (activeItems.length > 0) {
    console.log('\n   Current active work:');
    showWorkStatus(workLogPath);
  } else {
    console.log('   ℹ️  No active work in progress');
  }
} catch (error) {
  console.error('❌ Test 2 failed:', error);
  process.exit(1);
}

// Test 3: Integration Test
console.log('\n📋 Test 3: Integration Test');
console.log('-'.repeat(60));

try {
  console.log('Testing conflict detection for sample files...\n');
  
  const testFiles = [
    'scripts/check-recent-changes.ts',
    'scripts/check-work-log.ts',
    'src/server/offers.functions.ts',
  ];
  
  const recentChanges = getRecentChanges(24);
  const workLogPath = resolve(process.cwd(), '.kiro/coordination/work-log.md');
  const activeWork = getActiveWork(parseWorkLog(workLogPath));
  
  let hasConflicts = false;
  
  for (const file of testFiles) {
    const normalizedFile = file.replace(/\\/g, '/');
    
    // Check recent changes
    const recentChange = recentChanges.find(c => {
      const normalizedChangeFile = c.file.replace(/\\/g, '/');
      return normalizedChangeFile === normalizedFile ||
             normalizedFile.includes(normalizedChangeFile) ||
             normalizedChangeFile.includes(normalizedFile);
    });
    
    // Check work log
    const workLogConflict = activeWork.find(work =>
      work.files.some(f => {
        const normalizedWorkFile = f.replace(/\\/g, '/');
        return normalizedWorkFile === normalizedFile ||
               normalizedFile.includes(normalizedWorkFile) ||
               normalizedWorkFile.includes(normalizedFile);
      })
    );
    
    if (recentChange || workLogConflict) {
      hasConflicts = true;
      console.log(`⚠️  ${file}`);
      if (recentChange) {
        console.log(`   └─ Recently modified by ${recentChange.tool}`);
      }
      if (workLogConflict) {
        console.log(`   └─ Currently being worked on by ${workLogConflict.tool}`);
      }
    } else {
      console.log(`✅ ${file} - No conflicts`);
    }
  }
  
  if (!hasConflicts) {
    console.log('\n✅ No conflicts detected for test files');
  } else {
    console.log('\n⚠️  Some conflicts detected (this is expected if files were recently modified)');
  }
} catch (error) {
  console.error('❌ Test 3 failed:', error);
  process.exit(1);
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('✅ All conflict detection tests completed successfully!');
console.log('='.repeat(60));
console.log('\nAvailable commands:');
console.log('  - bun run check-conflicts <file1> <file2> ...');
console.log('  - bun run check-recent-changes --all');
console.log('  - bun run work-log:status');
console.log('  - bun run work-log:check <file1> <file2> ...');
console.log('');

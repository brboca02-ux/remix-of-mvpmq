#!/usr/bin/env bun
/**
 * Simple test for work log parser
 */

import { parseWorkLog, getActiveWork, showWorkStatus } from './check-work-log';
import { resolve } from 'path';

const workLogPath = resolve(process.cwd(), '.kiro/coordination/work-log.md');

console.log('Testing work log parser...\n');

try {
  // Test parsing
  console.log('1. Testing parseWorkLog()...');
  const allItems = parseWorkLog(workLogPath);
  console.log(`   ✅ Parsed ${allItems.length} work items\n`);

  // Test active work filtering
  console.log('2. Testing getActiveWork()...');
  const activeItems = getActiveWork(allItems);
  console.log(`   ✅ Found ${activeItems.length} active work items\n`);

  // Test status display
  console.log('3. Testing showWorkStatus()...');
  showWorkStatus(workLogPath);

  // Test conflict detection
  console.log('4. Testing conflict detection...');
  const testFiles = [
    'scripts/check-work-log.ts',
    'src/components/ui/button.tsx',
  ];
  
  console.log(`   Checking files: ${testFiles.join(', ')}`);
  
  const conflicts: Array<{ file: string; activeBy: string }> = [];
  for (const file of testFiles) {
    for (const work of activeItems) {
      if (work.files.some(f => f.includes(file) || file.includes(f))) {
        conflicts.push({ file, activeBy: work.tool });
      }
    }
  }
  
  if (conflicts.length > 0) {
    console.log(`   ⚠️  Found ${conflicts.length} conflict(s):`);
    conflicts.forEach(c => console.log(`      - ${c.file} (active by ${c.activeBy})`));
  } else {
    console.log('   ✅ No conflicts detected');
  }

  console.log('\n✅ All tests passed!');
} catch (error) {
  console.error('❌ Test failed:', error);
  process.exit(1);
}

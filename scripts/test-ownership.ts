#!/usr/bin/env bun
/**
 * Test script for check-ownership.ts
 * 
 * This script tests the ownership checking logic without requiring execution permissions.
 */

import {
  loadOwnershipRegistry,
  globToRegex,
  matchesPattern,
  getFileOwner,
} from './check-ownership';
import { resolve } from 'path';

function runTests(): void {
  console.log('🧪 Testing check-ownership.ts functionality\n');
  
  const registryPath = resolve(process.cwd(), '.kiro/coordination/ownership.json');
  
  try {
    // Test 1: Load registry
    console.log('Test 1: Loading ownership registry...');
    const registry = loadOwnershipRegistry(registryPath);
    console.log(`✅ Registry loaded successfully (version ${registry.version})\n`);
    
    // Test 2: Glob pattern matching
    console.log('Test 2: Testing glob pattern matching...');
    const testCases = [
      { file: 'src/server/auth.ts', pattern: 'src/server/**/*', expected: true },
      { file: 'src/lib/utils.ts', pattern: 'src/lib/**/*', expected: true },
      { file: 'src/components/ui/button.tsx', pattern: 'src/components/ui/**/*', expected: true },
      { file: 'src/components/crm/LeadCard.tsx', pattern: 'src/components/**/*.tsx', expected: true },
      { file: 'src/routes/index.tsx', pattern: 'src/routes/**/*.tsx', expected: true },
      { file: 'package.json', pattern: 'package.json', expected: true },
      { file: 'src/server/auth.ts', pattern: 'src/lib/**/*', expected: false },
    ];
    
    let passed = 0;
    let failed = 0;
    
    for (const { file, pattern, expected } of testCases) {
      const result = matchesPattern(file, pattern);
      if (result === expected) {
        console.log(`  ✅ ${file} vs ${pattern}: ${result}`);
        passed++;
      } else {
        console.log(`  ❌ ${file} vs ${pattern}: expected ${expected}, got ${result}`);
        failed++;
      }
    }
    
    console.log(`\nPattern matching: ${passed} passed, ${failed} failed\n`);
    
    // Test 3: File ownership detection
    console.log('Test 3: Testing file ownership detection...');
    const ownershipTests = [
      { file: 'src/server/offers.functions.ts', expected: 'kiro' },
      { file: 'src/lib/logger.ts', expected: 'kiro' },
      { file: 'src/components/ui/button.tsx', expected: 'lovable' },
      { file: 'src/components/crm/CRMSummaryBar.tsx', expected: 'lovable' },
      { file: 'src/routes/crm.tsx', expected: 'shared' },
      { file: 'src/hooks/useLeads.ts', expected: 'shared' },
      { file: 'package.json', expected: 'shared' },
      { file: 'README.md', expected: 'unassigned' },
    ];
    
    passed = 0;
    failed = 0;
    
    for (const { file, expected } of ownershipTests) {
      const owner = getFileOwner(file, registry);
      if (owner === expected) {
        console.log(`  ✅ ${file}: ${owner}`);
        passed++;
      } else {
        console.log(`  ❌ ${file}: expected ${expected}, got ${owner}`);
        failed++;
      }
    }
    
    console.log(`\nOwnership detection: ${passed} passed, ${failed} failed\n`);
    
    // Summary
    const totalPassed = passed;
    const totalFailed = failed;
    
    if (totalFailed === 0) {
      console.log('✅ All tests passed!\n');
    } else {
      console.log(`⚠️  ${totalFailed} test(s) failed.\n`);
      process.exit(1);
    }
    
  } catch (error) {
    console.error(`❌ Test failed with error: ${error}\n`);
    process.exit(1);
  }
}

// Run tests
runTests();

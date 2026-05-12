/**
 * Unit tests for check-ownership.ts
 * 
 * Tests the file ownership validation logic including glob pattern matching
 * and ownership determination.
 */

import { describe, it, expect } from 'vitest';
import {
  globToRegex,
  matchesPattern,
  matchesException,
  getFileOwner,
} from './check-ownership';

describe('check-ownership', () => {
  describe('globToRegex', () => {
    it('should convert simple glob patterns to regex', () => {
      const regex = globToRegex('src/server/*.ts');
      expect(regex.test('src/server/auth.ts')).toBe(true);
      expect(regex.test('src/server/api/leads.ts')).toBe(false);
    });

    it('should handle double star patterns', () => {
      const regex = globToRegex('src/server/**/*');
      expect(regex.test('src/server/auth.ts')).toBe(true);
      expect(regex.test('src/server/api/leads.ts')).toBe(true);
      expect(regex.test('src/server/api/v1/users.ts')).toBe(true);
    });

    it('should handle question mark wildcards', () => {
      const regex = globToRegex('src/test?.ts');
      expect(regex.test('src/test1.ts')).toBe(true);
      expect(regex.test('src/test12.ts')).toBe(false);
    });

    it('should normalize backslashes to forward slashes', () => {
      const regex = globToRegex('src\\server\\*.ts');
      expect(regex.test('src/server/auth.ts')).toBe(true);
    });
  });

  describe('matchesPattern', () => {
    it('should match exact file paths', () => {
      expect(matchesPattern('package.json', 'package.json')).toBe(true);
      expect(matchesPattern('tsconfig.json', 'package.json')).toBe(false);
    });

    it('should match single star patterns', () => {
      expect(matchesPattern('src/server/auth.ts', 'src/server/*.ts')).toBe(true);
      expect(matchesPattern('src/server/api/leads.ts', 'src/server/*.ts')).toBe(false);
    });

    it('should match double star patterns', () => {
      expect(matchesPattern('src/server/auth.ts', 'src/server/**/*')).toBe(true);
      expect(matchesPattern('src/server/api/leads.ts', 'src/server/**/*')).toBe(true);
      expect(matchesPattern('src/lib/utils.ts', 'src/server/**/*')).toBe(false);
    });

    it('should match component patterns with exceptions', () => {
      expect(matchesPattern('src/components/crm/LeadCard.tsx', 'src/components/**/*.tsx')).toBe(true);
      expect(matchesPattern('src/components/ui/button.tsx', 'src/components/**/*.tsx')).toBe(true);
    });

    it('should handle Windows-style paths', () => {
      expect(matchesPattern('src\\server\\auth.ts', 'src/server/**/*')).toBe(true);
    });
  });

  describe('matchesException', () => {
    it('should return false when no exceptions provided', () => {
      expect(matchesException('src/components/ui/button.tsx', undefined)).toBe(false);
      expect(matchesException('src/components/ui/button.tsx', [])).toBe(false);
    });

    it('should match exception patterns', () => {
      const exceptions = ['src/components/ui/**/*', 'src/components/templates/**/*'];
      expect(matchesException('src/components/ui/button.tsx', exceptions)).toBe(true);
      expect(matchesException('src/components/templates/SolarTemplate.tsx', exceptions)).toBe(true);
      expect(matchesException('src/components/crm/LeadCard.tsx', exceptions)).toBe(false);
    });
  });

  describe('getFileOwner', () => {
    const mockRegistry = {
      version: '1.0.0',
      lastUpdated: '2025-01-15T10:00:00Z',
      ownership: {
        kiro: [
          {
            pattern: 'src/server/**/*',
            description: 'Server functions',
            rationale: 'Kiro handles backend',
          },
          {
            pattern: 'src/lib/**/*',
            description: 'Utility libraries',
            rationale: 'Kiro manages logic',
          },
        ],
        lovable: [
          {
            pattern: 'src/components/ui/**/*',
            description: 'UI components',
            rationale: 'Lovable manages design',
          },
          {
            pattern: 'src/components/**/*.tsx',
            description: 'React components',
            rationale: 'Lovable builds UI',
            exceptions: ['src/components/ui/**/*'],
          },
        ],
        shared: [
          {
            pattern: 'src/routes/**/*.tsx',
            description: 'Route definitions',
            rationale: 'Routes connect UI and data',
          },
          {
            pattern: 'package.json',
            description: 'Dependencies',
            rationale: 'Both tools add dependencies',
          },
        ],
      },
    };

    it('should identify Kiro-owned files', () => {
      expect(getFileOwner('src/server/auth.ts', mockRegistry)).toBe('kiro');
      expect(getFileOwner('src/server/api/leads.ts', mockRegistry)).toBe('kiro');
      expect(getFileOwner('src/lib/logger.ts', mockRegistry)).toBe('kiro');
    });

    it('should identify Lovable-owned files', () => {
      expect(getFileOwner('src/components/ui/button.tsx', mockRegistry)).toBe('lovable');
      expect(getFileOwner('src/components/crm/LeadCard.tsx', mockRegistry)).toBe('lovable');
    });

    it('should identify shared files', () => {
      expect(getFileOwner('src/routes/crm.tsx', mockRegistry)).toBe('shared');
      expect(getFileOwner('package.json', mockRegistry)).toBe('shared');
    });

    it('should identify unassigned files', () => {
      expect(getFileOwner('README.md', mockRegistry)).toBe('unassigned');
      expect(getFileOwner('docs/guide.md', mockRegistry)).toBe('unassigned');
    });

    it('should respect exception patterns', () => {
      // src/components/ui/**/* should match lovable's first pattern, not the second
      expect(getFileOwner('src/components/ui/button.tsx', mockRegistry)).toBe('lovable');
      
      // src/components/crm/**/* should match lovable's second pattern (not in exceptions)
      expect(getFileOwner('src/components/crm/LeadCard.tsx', mockRegistry)).toBe('lovable');
    });

    it('should handle Windows-style paths', () => {
      expect(getFileOwner('src\\server\\auth.ts', mockRegistry)).toBe('kiro');
      expect(getFileOwner('src\\components\\ui\\button.tsx', mockRegistry)).toBe('lovable');
    });
  });
});

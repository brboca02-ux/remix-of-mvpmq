/**
 * Monitoring Unit Tests
 * 
 * Tests for monitoring service.
 * 
 * @module lib/__tests__/monitoring
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { monitoring, PerformanceTransaction } from '../monitoring';

describe('Monitoring Service', () => {
  beforeEach(() => {
    monitoring.clearBreadcrumbs();
    monitoring.setUser(null);
  });

  describe('captureException', () => {
    it('should capture exception without throwing', () => {
      const error = new Error('Test error');
      expect(() => monitoring.captureException(error)).not.toThrow();
    });

    it('should capture exception with context', () => {
      const error = new Error('Context error');
      expect(() =>
        monitoring.captureException(error, {
          tags: { module: 'test' },
          extra: { userId: '123' },
        })
      ).not.toThrow();
    });
  });

  describe('captureMessage', () => {
    it('should capture info message', () => {
      expect(() => monitoring.captureMessage('Test info', 'info')).not.toThrow();
    });

    it('should capture warning message', () => {
      expect(() => monitoring.captureMessage('Test warning', 'warning')).not.toThrow();
    });

    it('should capture error message', () => {
      expect(() => monitoring.captureMessage('Test error', 'error')).not.toThrow();
    });

    it('should capture with context', () => {
      expect(() =>
        monitoring.captureMessage('Test', 'info', {
          tags: { type: 'test' },
          extra: { value: 123 },
        })
      ).not.toThrow();
    });
  });

  describe('setUser', () => {
    it('should set user context', () => {
      const user = {
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
      };
      expect(() => monitoring.setUser(user)).not.toThrow();
    });

    it('should clear user context', () => {
      monitoring.setUser({ id: 'user-123' });
      expect(() => monitoring.setUser(null)).not.toThrow();
    });
  });

  describe('setContext', () => {
    it('should set context data', () => {
      expect(() =>
        monitoring.setContext('feature', {
          name: 'dashboard',
          version: '1.0',
        })
      ).not.toThrow();
    });
  });

  describe('setTag', () => {
    it('should set tag', () => {
      expect(() => monitoring.setTag('environment', 'test')).not.toThrow();
    });
  });

  describe('Breadcrumbs', () => {
    it('should add breadcrumb', () => {
      monitoring.addBreadcrumb({
        category: 'navigation',
        message: 'User navigated to /dashboard',
      });

      const breadcrumbs = monitoring.getBreadcrumbs();
      expect(breadcrumbs.length).toBeGreaterThan(0);
      expect(breadcrumbs[breadcrumbs.length - 1].message).toBe(
        'User navigated to /dashboard'
      );
    });

    it('should limit breadcrumbs to max size', () => {
      // Clear first
      monitoring.clearBreadcrumbs();

      // Add many breadcrumbs
      for (let i = 0; i < 100; i++) {
        monitoring.addBreadcrumb({
          category: 'test',
          message: `Breadcrumb ${i}`,
        });
      }

      const breadcrumbs = monitoring.getBreadcrumbs();
      expect(breadcrumbs.length).toBeLessThanOrEqual(50);
    });

    it('should clear breadcrumbs', () => {
      monitoring.addBreadcrumb({
        category: 'test',
        message: 'Test',
      });

      monitoring.clearBreadcrumbs();
      expect(monitoring.getBreadcrumbs()).toHaveLength(0);
    });

    it('should add timestamp to breadcrumbs', () => {
      monitoring.addBreadcrumb({
        category: 'test',
        message: 'Test',
      });

      const breadcrumbs = monitoring.getBreadcrumbs();
      expect(breadcrumbs[breadcrumbs.length - 1].timestamp).toBeDefined();
    });
  });

  describe('Performance Metrics', () => {
    it('should track metric', () => {
      expect(() =>
        monitoring.trackMetric({
          name: 'api.response_time',
          value: 250,
          unit: 'ms',
          tags: { endpoint: '/api/leads' },
        })
      ).not.toThrow();
    });

    it('should start and finish transaction', () => {
      const transaction = monitoring.startTransaction('test-transaction', 'navigation');
      expect(transaction).toBeInstanceOf(PerformanceTransaction);

      // Wait a tiny bit
      const duration = transaction.finish();
      expect(duration).toBeGreaterThanOrEqual(0);
    });

    it('should set tags on transaction', () => {
      const transaction = monitoring.startTransaction('test-tags', 'custom');
      transaction.setTag('module', 'test');
      transaction.setTag('feature', 'unit-test');

      const duration = transaction.finish();
      expect(duration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Flush', () => {
    it('should flush without errors', async () => {
      await expect(monitoring.flush(1000)).resolves.not.toThrow();
    });
  });

  describe('Init', () => {
    it('should initialize with default config', () => {
      expect(() => monitoring.init()).not.toThrow();
    });

    it('should initialize with custom config', () => {
      expect(() =>
        monitoring.init({
          enabled: false,
          environment: 'development',
          sampleRate: 0.5,
          tracesSampleRate: 0.1,
        })
      ).not.toThrow();
    });
  });
});

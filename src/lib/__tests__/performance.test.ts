/**
 * Performance Tracker Unit Tests
 * 
 * @module lib/__tests__/performance
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  performanceTracker,
  createRenderTimer,
  WEB_VITALS_THRESHOLDS,
} from '../performance';

describe('Performance Tracker', () => {
  beforeEach(() => {
    performanceTracker.clearMetrics();
  });

  describe('Marks', () => {
    it('should start and end mark', () => {
      performanceTracker.startMark('test-operation');
      const duration = performanceTracker.endMark('test-operation');

      expect(duration).toBeGreaterThanOrEqual(0);
    });

    it('should return 0 for non-existent mark', () => {
      const duration = performanceTracker.endMark('non-existent');
      expect(duration).toBe(0);
    });

    it('should support tags on marks', () => {
      performanceTracker.startMark('tagged-operation');
      const duration = performanceTracker.endMark('tagged-operation', {
        module: 'test',
      });

      expect(duration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Record Metric', () => {
    it('should record custom metric', () => {
      performanceTracker.recordMetric({
        name: 'api.response_time',
        value: 150,
        unit: 'ms',
      });

      const metrics = performanceTracker.getMetrics();
      expect(metrics['api.response_time']).toBe(150);
    });

    it('should record metric with tags', () => {
      performanceTracker.recordMetric({
        name: 'bundle.size',
        value: 250000,
        unit: 'bytes',
        tags: { bundle: 'main' },
      });

      const metrics = performanceTracker.getMetrics();
      expect(metrics['bundle.size']).toBe(250000);
    });
  });

  describe('Measure Async', () => {
    it('should measure async operation', async () => {
      const result = await performanceTracker.measure(
        'async-test',
        async () => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          return 'success';
        }
      );

      expect(result).toBe('success');
      const metrics = performanceTracker.getMetrics();
      expect(metrics['async-test']).toBeGreaterThanOrEqual(0);
    });

    it('should record metric even when async fails', async () => {
      await expect(
        performanceTracker.measure('async-fail', async () => {
          throw new Error('Test error');
        })
      ).rejects.toThrow('Test error');

      const metrics = performanceTracker.getMetrics();
      expect(metrics['async-fail']).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Measure Sync', () => {
    it('should measure sync operation', () => {
      const result = performanceTracker.measureSync('sync-test', () => {
        return 42;
      });

      expect(result).toBe(42);
      const metrics = performanceTracker.getMetrics();
      expect(metrics['sync-test']).toBeGreaterThanOrEqual(0);
    });

    it('should record metric even when sync fails', () => {
      expect(() =>
        performanceTracker.measureSync('sync-fail', () => {
          throw new Error('Sync error');
        })
      ).toThrow('Sync error');

      const metrics = performanceTracker.getMetrics();
      expect(metrics['sync-fail']).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Web Vitals', () => {
    it('should record web vital', () => {
      expect(() =>
        performanceTracker.recordWebVital({
          name: 'LCP',
          value: 2000,
          rating: 'good',
          delta: 0,
          id: 'v1-123',
        })
      ).not.toThrow();
    });

    it('should record poor web vital', () => {
      expect(() =>
        performanceTracker.recordWebVital({
          name: 'CLS',
          value: 0.3,
          rating: 'poor',
          delta: 0,
          id: 'v1-456',
        })
      ).not.toThrow();
    });
  });

  describe('Clear Metrics', () => {
    it('should clear all metrics', () => {
      performanceTracker.recordMetric({
        name: 'test-metric',
        value: 100,
      });

      performanceTracker.clearMetrics();
      const metrics = performanceTracker.getMetrics();
      expect(Object.keys(metrics)).toHaveLength(0);
    });
  });

  describe('Web Vitals Thresholds', () => {
    it('should have correct thresholds defined', () => {
      expect(WEB_VITALS_THRESHOLDS.LCP.good).toBe(2500);
      expect(WEB_VITALS_THRESHOLDS.FCP.good).toBe(1800);
      expect(WEB_VITALS_THRESHOLDS.CLS.good).toBe(0.1);
      expect(WEB_VITALS_THRESHOLDS.FID.good).toBe(100);
      expect(WEB_VITALS_THRESHOLDS.TTFB.good).toBe(800);
      expect(WEB_VITALS_THRESHOLDS.INP.good).toBe(200);
    });
  });

  describe('Render Timer', () => {
    it('should create render timer', () => {
      const timer = createRenderTimer('TestComponent');
      expect(typeof timer).toBe('function');

      // Should not throw when called
      expect(() => timer()).not.toThrow();
    });
  });
});

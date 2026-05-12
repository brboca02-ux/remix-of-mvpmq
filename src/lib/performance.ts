/**
 * Performance Monitoring
 * 
 * Tracks application performance metrics using Web Vitals and custom metrics.
 * 
 * Recommendation: ALTA - Implement before production
 * 
 * @module lib/performance
 */

import { logger } from './logger';
import { monitoring } from './monitoring';

// ============================================================================
// Types
// ============================================================================

export interface WebVitalMetric {
  name: 'FCP' | 'LCP' | 'CLS' | 'FID' | 'TTFB' | 'INP';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
}

export interface CustomMetric {
  name: string;
  value: number;
  unit?: 'ms' | 'seconds' | 'bytes' | 'percent' | 'count';
  tags?: Record<string, string>;
}

// ============================================================================
// Web Vitals Thresholds (Google recommendations)
// ============================================================================

export const WEB_VITALS_THRESHOLDS = {
  // Largest Contentful Paint
  LCP: {
    good: 2500,
    needsImprovement: 4000,
  },
  // First Contentful Paint
  FCP: {
    good: 1800,
    needsImprovement: 3000,
  },
  // Cumulative Layout Shift
  CLS: {
    good: 0.1,
    needsImprovement: 0.25,
  },
  // First Input Delay
  FID: {
    good: 100,
    needsImprovement: 300,
  },
  // Time to First Byte
  TTFB: {
    good: 800,
    needsImprovement: 1800,
  },
  // Interaction to Next Paint
  INP: {
    good: 200,
    needsImprovement: 500,
  },
} as const;

// ============================================================================
// Performance Tracker
// ============================================================================

class PerformanceTracker {
  private metrics: Map<string, number> = new Map();
  private marks: Map<string, number> = new Map();

  /**
   * Start timing a custom operation
   */
  startMark(name: string): void {
    this.marks.set(name, performance.now());
  }

  /**
   * End timing and record metric
   */
  endMark(name: string, tags?: Record<string, string>): number {
    const start = this.marks.get(name);
    if (!start) {
      logger.warn('Performance mark not found', { name });
      return 0;
    }

    const duration = performance.now() - start;
    this.marks.delete(name);

    this.recordMetric({
      name,
      value: duration,
      unit: 'ms',
      tags,
    });

    return duration;
  }

  /**
   * Record custom metric
   */
  recordMetric(metric: CustomMetric): void {
    this.metrics.set(metric.name, metric.value);

    monitoring.trackMetric({
      name: metric.name,
      value: metric.value,
      unit: metric.unit,
      tags: metric.tags,
    });

    // Log slow operations
    if (metric.unit === 'ms' && metric.value > 1000) {
      logger.warn('Slow operation detected', {
        name: metric.name,
        duration: metric.value,
        tags: metric.tags,
      });
    }
  }

  /**
   * Record Web Vital
   */
  recordWebVital(metric: WebVitalMetric): void {
    logger.info('Web Vital recorded', {
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
    });

    monitoring.trackMetric({
      name: `web_vital.${metric.name}`,
      value: metric.value,
      unit: metric.name === 'CLS' ? 'count' : 'ms',
      tags: {
        rating: metric.rating,
      },
    });

    // Alert on poor metrics
    if (metric.rating === 'poor') {
      monitoring.captureMessage(`Poor Web Vital: ${metric.name}`, 'warning', {
        tags: {
          metric: metric.name,
          rating: metric.rating,
        },
        extra: {
          value: metric.value,
          threshold: WEB_VITALS_THRESHOLDS[metric.name],
        },
      });
    }
  }

  /**
   * Measure async operation
   */
  async measure<T>(
    name: string,
    fn: () => Promise<T>,
    tags?: Record<string, string>
  ): Promise<T> {
    this.startMark(name);
    try {
      const result = await fn();
      this.endMark(name, { ...tags, status: 'success' });
      return result;
    } catch (error) {
      this.endMark(name, { ...tags, status: 'error' });
      throw error;
    }
  }

  /**
   * Measure sync operation
   */
  measureSync<T>(name: string, fn: () => T, tags?: Record<string, string>): T {
    this.startMark(name);
    try {
      const result = fn();
      this.endMark(name, { ...tags, status: 'success' });
      return result;
    } catch (error) {
      this.endMark(name, { ...tags, status: 'error' });
      throw error;
    }
  }

  /**
   * Get all recorded metrics
   */
  getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics.clear();
    this.marks.clear();
  }

  /**
   * Get navigation timing metrics
   */
  getNavigationTiming(): Record<string, number> | null {
    if (typeof window === 'undefined' || !window.performance) return null;

    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (!nav) return null;

    return {
      dns: nav.domainLookupEnd - nav.domainLookupStart,
      tcp: nav.connectEnd - nav.connectStart,
      ttfb: nav.responseStart - nav.requestStart,
      download: nav.responseEnd - nav.responseStart,
      domInteractive: nav.domInteractive - nav.fetchStart,
      domComplete: nav.domComplete - nav.fetchStart,
      loadComplete: nav.loadEventEnd - nav.fetchStart,
    };
  }

  /**
   * Get resource timing summary
   */
  getResourceTimingSummary(): {
    total: number;
    byType: Record<string, { count: number; totalSize: number; avgDuration: number }>;
  } {
    if (typeof window === 'undefined' || !window.performance) {
      return { total: 0, byType: {} };
    }

    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const byType: Record<string, { count: number; totalSize: number; avgDuration: number }> = {};

    resources.forEach((resource) => {
      const type = resource.initiatorType || 'other';
      if (!byType[type]) {
        byType[type] = { count: 0, totalSize: 0, avgDuration: 0 };
      }
      byType[type].count++;
      byType[type].totalSize += resource.transferSize || 0;
      byType[type].avgDuration += resource.duration;
    });

    // Calculate averages
    Object.values(byType).forEach((stats) => {
      stats.avgDuration = stats.avgDuration / stats.count;
    });

    return {
      total: resources.length,
      byType,
    };
  }
}

// ============================================================================
// Export singleton
// ============================================================================

export const performanceTracker = new PerformanceTracker();

// ============================================================================
// React Hook Helper
// ============================================================================

/**
 * Utility to measure component render time
 * 
 * Usage:
 * ```tsx
 * function MyComponent() {
 *   const measureRender = useRenderTimer('MyComponent');
 *   useEffect(() => {
 *     measureRender();
 *   });
 *   return <div>...</div>;
 * }
 * ```
 */
export function createRenderTimer(componentName: string): () => void {
  const startTime = performance.now();
  return (): void => {
    const duration = performance.now() - startTime;
    if (duration > 16) {
      // Longer than one frame (60fps = 16.67ms)
      logger.debug('Slow component render', {
        component: componentName,
        duration: `${duration.toFixed(2)}ms`,
      });
    }
  };
}

// ============================================================================
// Auto-initialize Web Vitals tracking
// ============================================================================

if (typeof window !== 'undefined') {
  // Track navigation timing on load
  window.addEventListener('load', () => {
    setTimeout(() => {
      const timing = performanceTracker.getNavigationTiming();
      if (timing) {
        logger.info('Navigation timing', timing);
        Object.entries(timing).forEach(([key, value]) => {
          performanceTracker.recordMetric({
            name: `navigation.${key}`,
            value,
            unit: 'ms',
          });
        });
      }
    }, 0);
  });

  // Track long tasks
  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.duration > 50) {
            logger.debug('Long task detected', {
              name: entry.name,
              duration: `${entry.duration.toFixed(2)}ms`,
              startTime: entry.startTime,
            });
          }
        });
      });
      observer.observe({ entryTypes: ['longtask'] });
    } catch (e) {
      // Browser doesn't support longtask
    }
  }
}

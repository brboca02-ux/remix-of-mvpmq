/**
 * Monitoring & Error Tracking
 * 
 * Centralized monitoring module with Sentry-compatible API.
 * Can be easily swapped with actual Sentry SDK when ready for production.
 * 
 * Recommendation: ALTA - Implement before production deployment
 * 
 * @module lib/monitoring
 */

import { logger } from './logger';

// ============================================================================
// Types
// ============================================================================

export interface MonitoringUser {
  id?: string;
  email?: string;
  username?: string;
}

export interface MonitoringContext {
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
  user?: MonitoringUser;
  level?: 'debug' | 'info' | 'warning' | 'error' | 'fatal';
}

export interface PerformanceMetric {
  name: string;
  value: number;
  unit?: 'ms' | 'seconds' | 'bytes' | 'percent' | 'count';
  tags?: Record<string, string>;
}

export interface BreadcrumbData {
  category: string;
  message: string;
  level?: 'debug' | 'info' | 'warning' | 'error';
  data?: Record<string, unknown>;
  timestamp?: number;
}

// ============================================================================
// Configuration
// ============================================================================

interface MonitoringConfig {
  enabled: boolean;
  environment: 'development' | 'staging' | 'production';
  sampleRate: number;
  tracesSampleRate: number;
  release?: string;
  dsn?: string;
}

const DEFAULT_CONFIG: MonitoringConfig = {
  enabled: false,
  environment: (import.meta.env.MODE as 'development' | 'staging' | 'production') || 'development',
  sampleRate: 1.0,
  tracesSampleRate: 0.1,
  release: import.meta.env.VITE_APP_VERSION,
  dsn: import.meta.env.VITE_SENTRY_DSN,
};

// ============================================================================
// Monitoring Class
// ============================================================================

class MonitoringService {
  private config: MonitoringConfig = DEFAULT_CONFIG;
  private breadcrumbs: BreadcrumbData[] = [];
  private currentUser: MonitoringUser | null = null;
  private maxBreadcrumbs = 50;

  /**
   * Initialize monitoring service
   */
  init(config?: Partial<MonitoringConfig>): void {
    this.config = { ...DEFAULT_CONFIG, ...config };

    if (this.config.enabled && this.config.dsn) {
      logger.info('Monitoring service initialized', {
        environment: this.config.environment,
        hasDsn: !!this.config.dsn,
      });
      // TODO: Initialize actual Sentry SDK here when ready
      // import * as Sentry from '@sentry/react';
      // Sentry.init({ dsn: this.config.dsn, ... });
    } else {
      logger.debug('Monitoring in local-only mode (Sentry not configured)');
    }
  }

  /**
   * Capture exception
   */
  captureException(error: Error, context?: MonitoringContext): void {
    const eventId = this.generateEventId();

    logger.error('Exception captured', error, {
      eventId,
      ...context?.extra,
      tags: context?.tags,
      user: context?.user || this.currentUser,
    });

    if (this.config.enabled && this.shouldSample()) {
      // TODO: Send to Sentry
      // Sentry.captureException(error, { tags, extra, user });
    }
  }

  /**
   * Capture message
   */
  captureMessage(
    message: string,
    level: 'debug' | 'info' | 'warning' | 'error' | 'fatal' = 'info',
    context?: MonitoringContext
  ): void {
    const eventId = this.generateEventId();

    const logContext = {
      eventId,
      level,
      ...context?.extra,
      tags: context?.tags,
    };

    switch (level) {
      case 'error':
      case 'fatal':
        logger.error(message, undefined, logContext);
        break;
      case 'warning':
        logger.warn(message, logContext);
        break;
      case 'info':
        logger.info(message, logContext);
        break;
      case 'debug':
        logger.debug(message, logContext);
        break;
    }

    if (this.config.enabled && this.shouldSample()) {
      // TODO: Send to Sentry
      // Sentry.captureMessage(message, level);
    }
  }

  /**
   * Set user context
   */
  setUser(user: MonitoringUser | null): void {
    this.currentUser = user;
    if (user) {
      logger.debug('User context set', { userId: user.id });
    }

    if (this.config.enabled) {
      // TODO: Set user in Sentry
      // Sentry.setUser(user);
    }
  }

  /**
   * Set extra context
   */
  setContext(key: string, context: Record<string, unknown>): void {
    logger.debug('Context set', { key, context });

    if (this.config.enabled) {
      // TODO: Set context in Sentry
      // Sentry.setContext(key, context);
    }
  }

  /**
   * Set tags
   */
  setTag(key: string, value: string): void {
    if (this.config.enabled) {
      // TODO: Set tag in Sentry
      // Sentry.setTag(key, value);
    }
  }

  /**
   * Add breadcrumb for debugging
   */
  addBreadcrumb(breadcrumb: BreadcrumbData): void {
    const withTimestamp = {
      ...breadcrumb,
      timestamp: breadcrumb.timestamp || Date.now(),
    };

    this.breadcrumbs.push(withTimestamp);
    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs.shift();
    }

    if (this.config.enabled) {
      // TODO: Add breadcrumb to Sentry
      // Sentry.addBreadcrumb(withTimestamp);
    }
  }

  /**
   * Track performance metric
   */
  trackMetric(metric: PerformanceMetric): void {
    logger.debug('Performance metric', {
      name: metric.name,
      value: metric.value,
      unit: metric.unit,
      tags: metric.tags,
    });

    if (this.config.enabled) {
      // TODO: Send to monitoring service
    }
  }

  /**
   * Start performance transaction
   */
  startTransaction(name: string, op: string = 'navigation'): PerformanceTransaction {
    return new PerformanceTransaction(name, op, this);
  }

  /**
   * Get all breadcrumbs (for debugging)
   */
  getBreadcrumbs(): BreadcrumbData[] {
    return [...this.breadcrumbs];
  }

  /**
   * Clear breadcrumbs
   */
  clearBreadcrumbs(): void {
    this.breadcrumbs = [];
  }

  /**
   * Flush any pending events
   */
  async flush(timeout = 2000): Promise<boolean> {
    if (!this.config.enabled) return true;

    // TODO: Flush Sentry events
    // return Sentry.flush(timeout);
    return true;
  }

  // ==========================================================================
  // Private helpers
  // ==========================================================================

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  private shouldSample(): boolean {
    return Math.random() < this.config.sampleRate;
  }
}

// ============================================================================
// Performance Transaction
// ============================================================================

export class PerformanceTransaction {
  private startTime: number;
  private endTime: number | null = null;
  private name: string;
  private op: string;
  private service: MonitoringService;
  private tags: Record<string, string> = {};

  constructor(name: string, op: string, service: MonitoringService) {
    this.name = name;
    this.op = op;
    this.service = service;
    this.startTime = performance.now();
  }

  setTag(key: string, value: string): void {
    this.tags[key] = value;
  }

  finish(): number {
    this.endTime = performance.now();
    const duration = this.endTime - this.startTime;

    this.service.trackMetric({
      name: this.name,
      value: duration,
      unit: 'ms',
      tags: {
        op: this.op,
        ...this.tags,
      },
    });

    return duration;
  }
}

// ============================================================================
// Export singleton
// ============================================================================

export const monitoring = new MonitoringService();

// Initialize on module load
if (typeof window !== 'undefined') {
  monitoring.init({
    enabled: import.meta.env.PROD,
    dsn: import.meta.env.VITE_SENTRY_DSN,
  });

  // Capture unhandled errors
  window.addEventListener('error', (event) => {
    monitoring.captureException(event.error || new Error(event.message), {
      tags: { type: 'unhandled_error' },
      extra: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    });
  });

  // Capture unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const error =
      event.reason instanceof Error ? event.reason : new Error(String(event.reason));
    monitoring.captureException(error, {
      tags: { type: 'unhandled_rejection' },
    });
  });
}

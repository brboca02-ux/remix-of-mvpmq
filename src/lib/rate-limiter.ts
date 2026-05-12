/**
 * Rate Limiter
 * 
 * Client-side rate limiting to prevent API abuse and respect quotas.
 * 
 * Recommendation: ALTA - Implement before production
 * 
 * @module lib/rate-limiter
 */

import { logger } from './logger';
import { AppError, ErrorCodes } from './error-handler';

// ============================================================================
// Types
// ============================================================================

export interface RateLimitConfig {
  /** Maximum number of requests */
  maxRequests: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Key to identify the rate limit (e.g., 'google-places', 'supabase') */
  key: string;
  /** Whether to queue requests when limit is reached */
  queue?: boolean;
  /** Max queue size */
  maxQueueSize?: number;
}

export interface RateLimitStatus {
  /** Current number of requests in window */
  current: number;
  /** Maximum allowed requests */
  max: number;
  /** Time until reset in milliseconds */
  resetInMs: number;
  /** Whether limit is reached */
  limited: boolean;
  /** Number of requests in queue */
  queued: number;
}

// ============================================================================
// Token Bucket Rate Limiter
// ============================================================================

class TokenBucket {
  private tokens: number;
  private lastRefill: number;
  private queue: Array<() => void> = [];

  constructor(
    private readonly capacity: number,
    private readonly refillPerMs: number,
    private readonly maxQueueSize: number = 100
  ) {
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }

  /**
   * Try to consume a token
   */
  tryConsume(): boolean {
    this.refill();
    if (this.tokens >= 1) {
      this.tokens -= 1;
      return true;
    }
    return false;
  }

  /**
   * Consume a token, waiting if necessary
   */
  async consume(): Promise<void> {
    if (this.tryConsume()) return;

    // Check queue size
    if (this.queue.length >= this.maxQueueSize) {
      throw new AppError(
        ErrorCodes.RATE_LIMIT_EXCEEDED,
        'Fila de requisições cheia. Tente novamente mais tarde.',
        { queueSize: this.queue.length }
      );
    }

    // Wait for next available token
    return new Promise((resolve) => {
      this.queue.push(resolve);
    });
  }

  /**
   * Refill tokens based on time passed
   */
  private refill(): void {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    const tokensToAdd = timePassed * this.refillPerMs;

    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefill = now;

    // Process queue if tokens available
    while (this.queue.length > 0 && this.tokens >= 1) {
      const next = this.queue.shift();
      if (next) {
        this.tokens -= 1;
        next();
      }
    }
  }

  /**
   * Get current status
   */
  getStatus(): { available: number; queued: number; capacity: number } {
    this.refill();
    return {
      available: Math.floor(this.tokens),
      queued: this.queue.length,
      capacity: this.capacity,
    };
  }
}

// ============================================================================
// Sliding Window Rate Limiter
// ============================================================================

class SlidingWindowLimiter {
  private requests: number[] = [];

  constructor(
    private readonly maxRequests: number,
    private readonly windowMs: number
  ) {}

  /**
   * Try to record a request
   */
  tryRequest(): boolean {
    this.cleanup();
    if (this.requests.length < this.maxRequests) {
      this.requests.push(Date.now());
      return true;
    }
    return false;
  }

  /**
   * Get current status
   */
  getStatus(): RateLimitStatus {
    this.cleanup();
    const now = Date.now();
    const oldestRequest = this.requests[0];
    const resetInMs = oldestRequest
      ? Math.max(0, this.windowMs - (now - oldestRequest))
      : 0;

    return {
      current: this.requests.length,
      max: this.maxRequests,
      resetInMs,
      limited: this.requests.length >= this.maxRequests,
      queued: 0,
    };
  }

  /**
   * Remove expired requests
   */
  private cleanup(): void {
    const now = Date.now();
    const cutoff = now - this.windowMs;
    this.requests = this.requests.filter((time) => time > cutoff);
  }

  /**
   * Reset the limiter
   */
  reset(): void {
    this.requests = [];
  }
}

// ============================================================================
// Rate Limiter Service
// ============================================================================

class RateLimiterService {
  private limiters: Map<string, SlidingWindowLimiter> = new Map();
  private buckets: Map<string, TokenBucket> = new Map();

  /**
   * Get or create a sliding window limiter
   */
  getLimiter(config: RateLimitConfig): SlidingWindowLimiter {
    let limiter = this.limiters.get(config.key);
    if (!limiter) {
      limiter = new SlidingWindowLimiter(config.maxRequests, config.windowMs);
      this.limiters.set(config.key, limiter);
      logger.debug('Rate limiter created', {
        key: config.key,
        maxRequests: config.maxRequests,
        windowMs: config.windowMs,
      });
    }
    return limiter;
  }

  /**
   * Get or create a token bucket
   */
  getBucket(
    key: string,
    capacity: number,
    refillPerMs: number,
    maxQueueSize = 100
  ): TokenBucket {
    let bucket = this.buckets.get(key);
    if (!bucket) {
      bucket = new TokenBucket(capacity, refillPerMs, maxQueueSize);
      this.buckets.set(key, bucket);
      logger.debug('Token bucket created', {
        key,
        capacity,
        refillPerMs,
      });
    }
    return bucket;
  }

  /**
   * Check if request is allowed (throws if not)
   */
  checkLimit(config: RateLimitConfig): void {
    const limiter = this.getLimiter(config);
    if (!limiter.tryRequest()) {
      const status = limiter.getStatus();
      logger.warn('Rate limit exceeded', {
        key: config.key,
        status,
      });
      throw new AppError(
        ErrorCodes.RATE_LIMIT_EXCEEDED,
        `Limite de requisições atingido. Tente novamente em ${Math.ceil(status.resetInMs / 1000)}s.`,
        {
          key: config.key,
          resetInMs: status.resetInMs,
          current: status.current,
          max: status.max,
        }
      );
    }
  }

  /**
   * Execute function with rate limiting
   */
  async withRateLimit<T>(
    config: RateLimitConfig,
    fn: () => Promise<T>
  ): Promise<T> {
    this.checkLimit(config);
    return fn();
  }

  /**
   * Execute function with token bucket (queues if limit reached)
   */
  async withTokenBucket<T>(
    key: string,
    capacity: number,
    refillPerMs: number,
    fn: () => Promise<T>
  ): Promise<T> {
    const bucket = this.getBucket(key, capacity, refillPerMs);
    await bucket.consume();
    return fn();
  }

  /**
   * Get status of a specific limiter
   */
  getStatus(key: string): RateLimitStatus | null {
    const limiter = this.limiters.get(key);
    return limiter ? limiter.getStatus() : null;
  }

  /**
   * Get status of all limiters
   */
  getAllStatuses(): Record<string, RateLimitStatus> {
    const statuses: Record<string, RateLimitStatus> = {};
    this.limiters.forEach((limiter, key) => {
      statuses[key] = limiter.getStatus();
    });
    return statuses;
  }

  /**
   * Reset a specific limiter
   */
  reset(key: string): void {
    const limiter = this.limiters.get(key);
    if (limiter) {
      limiter.reset();
      logger.info('Rate limiter reset', { key });
    }
  }

  /**
   * Reset all limiters
   */
  resetAll(): void {
    this.limiters.forEach((limiter) => limiter.reset());
    this.buckets.clear();
    logger.info('All rate limiters reset');
  }
}

// ============================================================================
// Predefined Rate Limits for Common APIs
// ============================================================================

export const RATE_LIMITS = {
  // Google Places API: 100 requests per minute
  GOOGLE_PLACES: {
    key: 'google-places',
    maxRequests: 100,
    windowMs: 60 * 1000,
  },
  // BrasilAPI: 30 requests per minute
  BRASIL_API: {
    key: 'brasil-api',
    maxRequests: 30,
    windowMs: 60 * 1000,
  },
  // ReceitaWS: 3 requests per minute
  RECEITA_WS: {
    key: 'receita-ws',
    maxRequests: 3,
    windowMs: 60 * 1000,
  },
  // Lovable AI: 50 requests per minute
  LOVABLE_AI: {
    key: 'lovable-ai',
    maxRequests: 50,
    windowMs: 60 * 1000,
  },
  // Internal API: 200 requests per minute per user
  INTERNAL_API: {
    key: 'internal-api',
    maxRequests: 200,
    windowMs: 60 * 1000,
  },
  // WhatsApp exports: 10 per minute
  WHATSAPP_EXPORT: {
    key: 'whatsapp-export',
    maxRequests: 10,
    windowMs: 60 * 1000,
  },
  // Lead import: 5 per hour
  LEAD_IMPORT: {
    key: 'lead-import',
    maxRequests: 5,
    windowMs: 60 * 60 * 1000,
  },
} as const;

// ============================================================================
// Export singleton
// ============================================================================

export const rateLimiter = new RateLimiterService();

// ============================================================================
// Convenience functions
// ============================================================================

/**
 * Execute function with predefined rate limit
 */
export async function withRateLimit<T>(
  config: RateLimitConfig,
  fn: () => Promise<T>
): Promise<T> {
  return rateLimiter.withRateLimit(config, fn);
}

/**
 * Check if limit would be exceeded without consuming a request
 */
export function isRateLimited(key: string): boolean {
  const status = rateLimiter.getStatus(key);
  return status?.limited ?? false;
}

/**
 * Get time until rate limit resets
 */
export function getResetTime(key: string): number {
  const status = rateLimiter.getStatus(key);
  return status?.resetInMs ?? 0;
}

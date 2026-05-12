/**
 * Rate Limiter Unit Tests
 * 
 * Tests for rate limiting utilities.
 * 
 * @module lib/__tests__/rate-limiter
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  rateLimiter,
  withRateLimit,
  isRateLimited,
  getResetTime,
  RATE_LIMITS,
} from '../rate-limiter';

describe('Rate Limiter', () => {
  beforeEach(() => {
    rateLimiter.resetAll();
  });

  describe('Sliding Window Limiter', () => {
    it('should allow requests within limit', () => {
      const config = {
        key: 'test-1',
        maxRequests: 5,
        windowMs: 1000,
      };

      // Should not throw for first 5 requests
      for (let i = 0; i < 5; i++) {
        expect(() => rateLimiter.checkLimit(config)).not.toThrow();
      }
    });

    it('should throw when limit exceeded', () => {
      const config = {
        key: 'test-2',
        maxRequests: 3,
        windowMs: 1000,
      };

      // Fill up the limit
      rateLimiter.checkLimit(config);
      rateLimiter.checkLimit(config);
      rateLimiter.checkLimit(config);

      // Next request should throw
      expect(() => rateLimiter.checkLimit(config)).toThrow();
    });

    it('should reset after window expires', async () => {
      const config = {
        key: 'test-3',
        maxRequests: 2,
        windowMs: 100,
      };

      rateLimiter.checkLimit(config);
      rateLimiter.checkLimit(config);

      // Should be limited
      expect(() => rateLimiter.checkLimit(config)).toThrow();

      // Wait for window to expire
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Should work again
      expect(() => rateLimiter.checkLimit(config)).not.toThrow();
    });
  });

  describe('withRateLimit', () => {
    it('should execute function when not rate limited', async () => {
      const config = {
        key: 'test-fn',
        maxRequests: 5,
        windowMs: 1000,
      };

      const fn = vi.fn().mockResolvedValue('success');
      const result = await withRateLimit(config, fn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should throw when rate limited', async () => {
      const config = {
        key: 'test-fn-limit',
        maxRequests: 1,
        windowMs: 1000,
      };

      const fn = vi.fn().mockResolvedValue('success');
      await withRateLimit(config, fn);

      await expect(withRateLimit(config, fn)).rejects.toThrow();
    });
  });

  describe('Status Methods', () => {
    it('should report correct status', () => {
      const config = {
        key: 'test-status',
        maxRequests: 5,
        windowMs: 1000,
      };

      rateLimiter.checkLimit(config);
      rateLimiter.checkLimit(config);

      const status = rateLimiter.getStatus('test-status');
      expect(status).not.toBeNull();
      expect(status?.current).toBe(2);
      expect(status?.max).toBe(5);
      expect(status?.limited).toBe(false);
    });

    it('should detect when rate limited', () => {
      const config = {
        key: 'test-limited',
        maxRequests: 2,
        windowMs: 1000,
      };

      rateLimiter.checkLimit(config);
      rateLimiter.checkLimit(config);

      expect(isRateLimited('test-limited')).toBe(true);
    });

    it('should return null for non-existent key', () => {
      expect(rateLimiter.getStatus('non-existent')).toBeNull();
    });

    it('should return 0 reset time for non-existent key', () => {
      expect(getResetTime('non-existent')).toBe(0);
    });
  });

  describe('Reset', () => {
    it('should reset specific limiter', () => {
      const config = {
        key: 'test-reset',
        maxRequests: 2,
        windowMs: 1000,
      };

      rateLimiter.checkLimit(config);
      rateLimiter.checkLimit(config);

      expect(() => rateLimiter.checkLimit(config)).toThrow();

      rateLimiter.reset('test-reset');
      expect(() => rateLimiter.checkLimit(config)).not.toThrow();
    });

    it('should reset all limiters', () => {
      const config1 = { key: 'test-all-1', maxRequests: 1, windowMs: 1000 };
      const config2 = { key: 'test-all-2', maxRequests: 1, windowMs: 1000 };

      rateLimiter.checkLimit(config1);
      rateLimiter.checkLimit(config2);

      rateLimiter.resetAll();

      expect(() => rateLimiter.checkLimit(config1)).not.toThrow();
      expect(() => rateLimiter.checkLimit(config2)).not.toThrow();
    });
  });

  describe('Predefined Rate Limits', () => {
    it('should have Google Places config', () => {
      expect(RATE_LIMITS.GOOGLE_PLACES.key).toBe('google-places');
      expect(RATE_LIMITS.GOOGLE_PLACES.maxRequests).toBe(100);
    });

    it('should have Brasil API config', () => {
      expect(RATE_LIMITS.BRASIL_API.maxRequests).toBe(30);
    });

    it('should have Receita WS config', () => {
      expect(RATE_LIMITS.RECEITA_WS.maxRequests).toBe(3);
    });

    it('should have Lead Import config', () => {
      expect(RATE_LIMITS.LEAD_IMPORT.windowMs).toBe(60 * 60 * 1000);
    });
  });

  describe('Token Bucket', () => {
    it('should create and use token bucket', async () => {
      const bucket = rateLimiter.getBucket('test-bucket', 10, 1);
      const status = bucket.getStatus();

      expect(status.capacity).toBe(10);
      expect(status.available).toBeLessThanOrEqual(10);
    });

    it('should execute with token bucket', async () => {
      const fn = vi.fn().mockResolvedValue('bucket-success');
      const result = await rateLimiter.withTokenBucket(
        'test-exec-bucket',
        5,
        1,
        fn
      );

      expect(result).toBe('bucket-success');
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('Get All Statuses', () => {
    it('should return all rate limiter statuses', () => {
      rateLimiter.checkLimit({ key: 'status-1', maxRequests: 5, windowMs: 1000 });
      rateLimiter.checkLimit({ key: 'status-2', maxRequests: 10, windowMs: 1000 });

      const allStatuses = rateLimiter.getAllStatuses();

      expect(Object.keys(allStatuses).length).toBeGreaterThanOrEqual(2);
      expect(allStatuses['status-1']).toBeDefined();
      expect(allStatuses['status-2']).toBeDefined();
    });
  });
});

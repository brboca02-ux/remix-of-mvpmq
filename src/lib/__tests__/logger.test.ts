/**
 * Logger Unit Tests
 * 
 * Tests for structured logger.
 * 
 * Task 24 - Phase 5: Testing Infrastructure
 * 
 * @module lib/__tests__/logger
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger } from '../logger';

describe('Logger', () => {
  let consoleSpy: {
    log: ReturnType<typeof vi.spyOn>;
    info: ReturnType<typeof vi.spyOn>;
    warn: ReturnType<typeof vi.spyOn>;
    error: ReturnType<typeof vi.spyOn>;
  };

  beforeEach(() => {
    consoleSpy = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      info: vi.spyOn(console, 'info').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    };
  });

  afterEach(() => {
    consoleSpy.log.mockRestore();
    consoleSpy.info.mockRestore();
    consoleSpy.warn.mockRestore();
    consoleSpy.error.mockRestore();
  });

  describe('debug', () => {
    it('should log debug message', () => {
      logger.debug('Debug message');
      expect(consoleSpy.log).toHaveBeenCalled();
    });

    it('should log debug message with context', () => {
      logger.debug('Debug message', { userId: '123' });
      expect(consoleSpy.log).toHaveBeenCalled();
    });
  });

  describe('info', () => {
    it('should log info message', () => {
      logger.info('Info message');
      expect(consoleSpy.info).toHaveBeenCalled();
    });

    it('should log info message with context', () => {
      logger.info('Info message', { leadId: '456' });
      expect(consoleSpy.info).toHaveBeenCalled();
    });
  });

  describe('warn', () => {
    it('should log warning message', () => {
      logger.warn('Warning message');
      expect(consoleSpy.warn).toHaveBeenCalled();
    });

    it('should log warning with context', () => {
      logger.warn('Rate limit approaching', { remaining: 10 });
      expect(consoleSpy.warn).toHaveBeenCalled();
    });
  });

  describe('error', () => {
    it('should log error message', () => {
      logger.error('Error message');
      expect(consoleSpy.error).toHaveBeenCalled();
    });

    it('should log error with Error object', () => {
      const error = new Error('Test error');
      logger.error('Failed to save', error);
      expect(consoleSpy.error).toHaveBeenCalled();
    });

    it('should log error with Error object and context', () => {
      const error = new Error('Database error');
      logger.error('Failed to save lead', error, { leadId: '789' });
      expect(consoleSpy.error).toHaveBeenCalled();
    });

    it('should handle undefined error', () => {
      logger.error('Error without error object');
      expect(consoleSpy.error).toHaveBeenCalled();
    });
  });

  describe('logger instance', () => {
    it('should be a singleton', () => {
      expect(logger).toBeDefined();
      expect(typeof logger.debug).toBe('function');
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.error).toBe('function');
    });

    it('should handle empty context', () => {
      logger.info('Message with empty context', {});
      expect(consoleSpy.info).toHaveBeenCalled();
    });

    it('should handle complex context objects', () => {
      logger.info('Complex message', {
        user: { id: '123', name: 'Test' },
        action: 'create',
        metadata: { timestamp: Date.now() },
      });
      expect(consoleSpy.info).toHaveBeenCalled();
    });
  });
});

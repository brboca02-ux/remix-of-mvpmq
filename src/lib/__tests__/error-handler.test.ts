/**
 * Error Handler Unit Tests
 * 
 * Tests for error handler utilities.
 * 
 * Task 24 - Phase 5: Testing Infrastructure
 * 
 * @module lib/__tests__/error-handler
 */

import { describe, it, expect, vi } from 'vitest';
import {
  AppError,
  ErrorCodes,
  createErrorResponse,
  createSuccessResponse,
  handleServerError,
  withRetry,
  createUserFriendlyErrorResponse,
  handleServerErrorWithUserMessage,
  isErrorRecoverable,
  getResponseErrorSeverity,
} from '../error-handler';

describe('Error Handler', () => {
  describe('AppError', () => {
    it('should create AppError with correct properties', () => {
      const error = new AppError(
        ErrorCodes.VALIDATION_ERROR,
        'Invalid data',
        { field: 'email' },
        400
      );

      expect(error.code).toBe(ErrorCodes.VALIDATION_ERROR);
      expect(error.message).toBe('Invalid data');
      expect(error.details).toEqual({ field: 'email' });
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('AppError');
    });

    it('should default statusCode to 500', () => {
      const error = new AppError(ErrorCodes.INTERNAL_ERROR, 'Server error');
      expect(error.statusCode).toBe(500);
    });

    it('should be instance of Error', () => {
      const error = new AppError(ErrorCodes.UNKNOWN_ERROR, 'Unknown');
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('createErrorResponse', () => {
    it('should create error response with correct structure', () => {
      const response = createErrorResponse(
        ErrorCodes.NOT_FOUND,
        'Resource not found',
        { id: '123' }
      );

      expect(response.success).toBe(false);
      expect(response.error.code).toBe(ErrorCodes.NOT_FOUND);
      expect(response.error.message).toBe('Resource not found');
      expect(response.error.details).toEqual({ id: '123' });
      expect(response.error.timestamp).toBeDefined();
    });

    it('should create error response without details', () => {
      const response = createErrorResponse(ErrorCodes.UNKNOWN_ERROR, 'Unknown');
      expect(response.error.details).toBeUndefined();
    });
  });

  describe('createSuccessResponse', () => {
    it('should create success response with data', () => {
      const response = createSuccessResponse({ id: '123', name: 'Test' });
      expect(response.success).toBe(true);
      expect(response.data).toEqual({ id: '123', name: 'Test' });
    });

    it('should handle array data', () => {
      const response = createSuccessResponse([1, 2, 3]);
      expect(response.data).toEqual([1, 2, 3]);
    });

    it('should handle null data', () => {
      const response = createSuccessResponse(null);
      expect(response.data).toBeNull();
    });
  });

  describe('handleServerError', () => {
    it('should handle AppError', () => {
      const error = new AppError(ErrorCodes.NOT_FOUND, 'Not found');
      const response = handleServerError(error);

      expect(response.success).toBe(false);
      expect(response.error.code).toBe(ErrorCodes.NOT_FOUND);
    });

    it('should handle rate limit error', () => {
      const error = new Error('RATE_LIMIT exceeded');
      const response = handleServerError(error);

      expect(response.error.code).toBe(ErrorCodes.RATE_LIMIT_EXCEEDED);
    });

    it('should handle payment required error', () => {
      const error = new Error('PAYMENT_REQUIRED: credits depleted');
      const response = handleServerError(error);

      expect(response.error.code).toBe(ErrorCodes.PAYMENT_REQUIRED);
    });

    it('should handle timeout error', () => {
      const error = new Error('Request timeout exceeded');
      const response = handleServerError(error);

      expect(response.error.code).toBe(ErrorCodes.TIMEOUT);
    });

    it('should handle network error', () => {
      const error = new Error('Failed to fetch');
      const response = handleServerError(error);

      expect(response.error.code).toBe(ErrorCodes.EXTERNAL_API_ERROR);
    });

    it('should handle generic Error', () => {
      const error = new Error('Something went wrong');
      const response = handleServerError(error);

      expect(response.error.code).toBe(ErrorCodes.INTERNAL_ERROR);
    });

    it('should handle unknown error type', () => {
      const response = handleServerError('string error');
      expect(response.error.code).toBe(ErrorCodes.UNKNOWN_ERROR);
    });
  });

  describe('withRetry', () => {
    it('should succeed on first attempt', async () => {
      const fn = vi.fn().mockResolvedValue('success');
      const result = await withRetry(fn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      let attempts = 0;
      const fn = vi.fn().mockImplementation(async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('network error');
        }
        return 'success';
      });

      const result = await withRetry(fn, { maxAttempts: 3, delayMs: 10 });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should throw after max attempts', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('network error'));

      await expect(
        withRetry(fn, { maxAttempts: 2, delayMs: 10 })
      ).rejects.toThrow('network error');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should not retry on non-retryable errors', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('validation error'));

      await expect(
        withRetry(fn, { maxAttempts: 3, delayMs: 10 })
      ).rejects.toThrow('validation error');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should call onRetry callback', async () => {
      const onRetry = vi.fn();
      let attempts = 0;
      const fn = vi.fn().mockImplementation(async () => {
        attempts++;
        if (attempts < 2) throw new Error('network error');
        return 'success';
      });

      await withRetry(fn, { maxAttempts: 3, delayMs: 10, onRetry });

      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error));
    });
  });

  describe('createUserFriendlyErrorResponse', () => {
    it('should create response with user-friendly message', () => {
      const response = createUserFriendlyErrorResponse(
        'NETWORK_TIMEOUT' as any,
        'Technical: timeout exceeded'
      );

      expect(response.success).toBe(false);
      expect(response.error.userMessage).toBeDefined();
      expect(response.error.suggestions).toBeDefined();
      expect(response.error.suggestions!.length).toBeGreaterThan(0);
    });

    it('should include technical details in response', () => {
      const response = createUserFriendlyErrorResponse(
        'LEAD_CREATION_FAILED' as any,
        'Database connection lost'
      );

      expect(response.error.message).toBe('Database connection lost');
    });
  });

  describe('handleServerErrorWithUserMessage', () => {
    it('should handle rate limit with user-friendly message', () => {
      const error = new Error('RATE_LIMIT exceeded');
      const response = handleServerErrorWithUserMessage(error);

      expect(response.error.userMessage).toContain('muitas requisições');
    });

    it('should handle timeout with user-friendly message', () => {
      const error = new Error('Operation timeout');
      const response = handleServerErrorWithUserMessage(error);

      expect(response.error.userMessage).toContain('muito tempo');
    });

    it('should handle network error with user-friendly message', () => {
      const error = new Error('Failed to fetch data');
      const response = handleServerErrorWithUserMessage(error);

      expect(response.error.userMessage).toBeDefined();
    });

    it('should handle validation error', () => {
      const error = new Error('validation failed');
      const response = handleServerErrorWithUserMessage(error);

      expect(response.error.userMessage).toBeDefined();
      expect(response.error.code).toBeDefined();
    });

    it('should handle duplicate error', () => {
      const error = new Error('duplicate key value');
      const response = handleServerErrorWithUserMessage(error);

      expect(response.error.userMessage).toContain('registro');
    });
  });

  describe('isErrorRecoverable', () => {
    it('should check if error is recoverable', () => {
      const response = createErrorResponse(ErrorCodes.TIMEOUT, 'Timeout');
      response.error.recoverable = true;

      expect(isErrorRecoverable(response)).toBe(true);
    });

    it('should handle undefined recoverable field', () => {
      const response = createUserFriendlyErrorResponse(
        'NETWORK_TIMEOUT' as any,
        'Timeout'
      );

      expect(isErrorRecoverable(response)).toBe(true);
    });
  });

  describe('getResponseErrorSeverity', () => {
    it('should return severity from response', () => {
      const response = createUserFriendlyErrorResponse(
        'NETWORK_OFFLINE' as any,
        'Offline'
      );

      expect(getResponseErrorSeverity(response)).toBe('high');
    });

    it('should handle low severity errors', () => {
      const response = createUserFriendlyErrorResponse(
        'NETWORK_RATE_LIMIT' as any,
        'Rate limited'
      );

      expect(getResponseErrorSeverity(response)).toBe('low');
    });
  });

  describe('Error Codes', () => {
    it('should have all error codes defined', () => {
      expect(ErrorCodes.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
      expect(ErrorCodes.UNAUTHORIZED).toBe('UNAUTHORIZED');
      expect(ErrorCodes.NOT_FOUND).toBe('NOT_FOUND');
      expect(ErrorCodes.TIMEOUT).toBe('TIMEOUT');
      expect(ErrorCodes.INTERNAL_ERROR).toBe('INTERNAL_ERROR');
    });
  });
});

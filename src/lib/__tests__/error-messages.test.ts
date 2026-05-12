/**
 * Error Messages Unit Tests
 * 
 * Tests for user-friendly error messages mapping.
 * 
 * Task 24 - Phase 5: Testing Infrastructure
 * 
 * @module lib/__tests__/error-messages
 */

import { describe, it, expect } from 'vitest';
import {
  ERROR_MESSAGES,
  getErrorMessage,
  formatError,
  isRecoverableError,
  getErrorSeverity,
  type ErrorCode,
} from '../error-messages';

describe('Error Messages', () => {
  describe('ERROR_MESSAGES mapping', () => {
    it('should have all required error codes defined', () => {
      const requiredCodes: ErrorCode[] = [
        'AUTH_INVALID_CREDENTIALS',
        'NETWORK_TIMEOUT',
        'DATA_NOT_FOUND',
        'API_GOOGLE_PLACES_ERROR',
        'IMPORT_INVALID_FORMAT',
        'LEAD_CREATION_FAILED',
        'JOB_EXECUTION_FAILED',
        'UNKNOWN_ERROR',
      ];

      requiredCodes.forEach((code) => {
        expect(ERROR_MESSAGES[code]).toBeDefined();
      });
    });

    it('should have all messages in Portuguese', () => {
      Object.values(ERROR_MESSAGES).forEach((msg) => {
        expect(msg.title).toBeDefined();
        expect(msg.message).toBeDefined();
        expect(msg.title.length).toBeGreaterThan(0);
        expect(msg.message.length).toBeGreaterThan(0);
      });
    });

    it('should have at least one suggestion for each error', () => {
      Object.values(ERROR_MESSAGES).forEach((msg) => {
        expect(msg.suggestions).toBeDefined();
        expect(msg.suggestions.length).toBeGreaterThan(0);
      });
    });

    it('should have valid severity levels', () => {
      const validSeverities = ['low', 'medium', 'high', 'critical'];
      Object.values(ERROR_MESSAGES).forEach((msg) => {
        expect(validSeverities).toContain(msg.severity);
      });
    });

    it('should have boolean recoverable field', () => {
      Object.values(ERROR_MESSAGES).forEach((msg) => {
        expect(typeof msg.recoverable).toBe('boolean');
      });
    });
  });

  describe('getErrorMessage', () => {
    it('should return correct message for valid code', () => {
      const msg = getErrorMessage('AUTH_INVALID_CREDENTIALS');
      expect(msg.title).toBe('Credenciais Inválidas');
      expect(msg.recoverable).toBe(true);
      expect(msg.severity).toBe('medium');
    });

    it('should return UNKNOWN_ERROR for invalid code', () => {
      const msg = getErrorMessage('INVALID_CODE' as ErrorCode);
      expect(msg.title).toBe('Erro Inesperado');
    });

    it('should return network error details correctly', () => {
      const msg = getErrorMessage('NETWORK_OFFLINE');
      expect(msg.title).toBe('Sem Conexão');
      expect(msg.severity).toBe('high');
    });
  });

  describe('formatError', () => {
    it('should format error with user-friendly message', () => {
      const formatted = formatError('LEAD_CREATION_FAILED', 'Database error: timeout');
      
      expect(formatted.title).toBe('Erro ao Criar Lead');
      expect(formatted.technicalDetails).toBe('Database error: timeout');
      expect(formatted.recoverable).toBe(true);
      expect(formatted.suggestions).toBeDefined();
    });

    it('should format without technical details', () => {
      const formatted = formatError('DATA_NOT_FOUND');
      expect(formatted.technicalDetails).toBeUndefined();
      expect(formatted.title).toBe('Não Encontrado');
    });
  });

  describe('isRecoverableError', () => {
    it('should return true for recoverable errors', () => {
      expect(isRecoverableError('NETWORK_TIMEOUT')).toBe(true);
      expect(isRecoverableError('DATA_VALIDATION_ERROR')).toBe(true);
      expect(isRecoverableError('AUTH_SESSION_EXPIRED')).toBe(true);
    });

    it('should return false for non-recoverable errors', () => {
      expect(isRecoverableError('AUTH_UNAUTHORIZED')).toBe(false);
      expect(isRecoverableError('PERMISSION_DENIED')).toBe(false);
      expect(isRecoverableError('DATA_NOT_FOUND')).toBe(false);
    });
  });

  describe('getErrorSeverity', () => {
    it('should return correct severity for each error', () => {
      expect(getErrorSeverity('NETWORK_RATE_LIMIT')).toBe('low');
      expect(getErrorSeverity('AUTH_INVALID_CREDENTIALS')).toBe('medium');
      expect(getErrorSeverity('NETWORK_SERVER_ERROR')).toBe('high');
      expect(getErrorSeverity('AUTH_UNAUTHORIZED')).toBe('high');
    });
  });

  describe('Authentication Errors', () => {
    it('should have AUTH_INVALID_CREDENTIALS with correct message', () => {
      const msg = ERROR_MESSAGES.AUTH_INVALID_CREDENTIALS;
      expect(msg.message).toContain('email ou senha');
      expect(msg.recoverable).toBe(true);
    });

    it('should have AUTH_SESSION_EXPIRED as recoverable', () => {
      expect(ERROR_MESSAGES.AUTH_SESSION_EXPIRED.recoverable).toBe(true);
    });

    it('should have AUTH_UNAUTHORIZED as non-recoverable', () => {
      expect(ERROR_MESSAGES.AUTH_UNAUTHORIZED.recoverable).toBe(false);
    });
  });

  describe('Network Errors', () => {
    it('should have NETWORK_OFFLINE with high severity', () => {
      expect(ERROR_MESSAGES.NETWORK_OFFLINE.severity).toBe('high');
    });

    it('should have NETWORK_TIMEOUT as recoverable', () => {
      expect(ERROR_MESSAGES.NETWORK_TIMEOUT.recoverable).toBe(true);
    });
  });

  describe('Data Errors', () => {
    it('should have DATA_DUPLICATE as low severity', () => {
      expect(ERROR_MESSAGES.DATA_DUPLICATE.severity).toBe('low');
    });

    it('should have DATA_VALIDATION_ERROR with helpful suggestions', () => {
      const msg = ERROR_MESSAGES.DATA_VALIDATION_ERROR;
      expect(msg.suggestions.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Import Errors', () => {
    it('should have IMPORT_INVALID_FORMAT with template suggestion', () => {
      const msg = ERROR_MESSAGES.IMPORT_INVALID_FORMAT;
      expect(msg.suggestions.some((s) => s.toLowerCase().includes('template'))).toBe(true);
    });

    it('should have IMPORT_TOO_LARGE with size info', () => {
      const msg = ERROR_MESSAGES.IMPORT_TOO_LARGE;
      expect(msg.suggestions.some((s) => s.includes('1000'))).toBe(true);
    });
  });
});

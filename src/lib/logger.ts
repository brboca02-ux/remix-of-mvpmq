/* eslint-disable no-console */
/**
 * Structured Logger
 * 
 * Provides structured logging with different log levels.
 * In development: pretty-printed with emojis
 * In production: JSON format for log aggregation
 * 
 * @module lib/logger
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;

  private log(level: LogLevel, message: string, context?: LogContext): void {
    if (!this.isDevelopment && level === 'debug') {
      return; // Skip debug logs in production
    }

    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...context,
    };

    // In development: pretty print
    if (this.isDevelopment) {
      const emoji = {
        debug: '🔍',
        info: 'ℹ️',
        warn: '⚠️',
        error: '❌',
      }[level];
      
      console[level === 'debug' ? 'log' : level](
        `${emoji} [${level.toUpperCase()}] ${message}`,
        context || ''
      );
    } else {
      // In production: structured JSON (for log aggregation)
      console[level === 'error' ? 'error' : 'warn'](JSON.stringify(logEntry));
    }
  }

  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error, context?: LogContext): void {
    this.log('error', message, {
      ...context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : undefined,
    });
  }
}

export const logger = new Logger();

// Usage examples:
// logger.debug('User clicked button', { userId: '123', buttonId: 'submit' });
// logger.info('Lead created', { leadId: lead.id, source: 'google_places' });
// logger.warn('API rate limit approaching', { remaining: 10, limit: 100 });
// logger.error('Failed to save lead', error, { leadId: '456' });

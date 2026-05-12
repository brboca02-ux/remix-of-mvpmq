import { logger } from './logger';

/**
 * Standard error response structure for server functions
 */
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    timestamp: string;
  };
}

/**
 * Standard success response structure for server functions
 */
export interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
}

/**
 * Union type for all server responses
 */
export type ServerResponse<T = unknown> = SuccessResponse<T> | ErrorResponse;

/**
 * Error codes for different types of errors
 */
export const ErrorCodes = {
  // Validation errors (400)
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  
  // Authentication/Authorization errors (401/403)
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_TOKEN: 'INVALID_TOKEN',
  
  // Resource errors (404)
  NOT_FOUND: 'NOT_FOUND',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  
  // Rate limiting (429)
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  
  // Payment/Billing (402)
  PAYMENT_REQUIRED: 'PAYMENT_REQUIRED',
  INSUFFICIENT_CREDITS: 'INSUFFICIENT_CREDITS',
  
  // External API errors (502/503)
  EXTERNAL_API_ERROR: 'EXTERNAL_API_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  TIMEOUT: 'TIMEOUT',
  
  // Database errors (500)
  DATABASE_ERROR: 'DATABASE_ERROR',
  QUERY_FAILED: 'QUERY_FAILED',
  
  // Configuration errors (500)
  CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',
  MISSING_ENV_VAR: 'MISSING_ENV_VAR',
  
  // Generic errors (500)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

/**
 * Custom error class for application errors
 */
export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public details?: Record<string, unknown>,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  code: ErrorCode,
  message: string,
  details?: Record<string, unknown>
): ErrorResponse {
  return {
    success: false,
    error: {
      code,
      message,
      details,
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Create a standardized success response
 */
export function createSuccessResponse<T>(data: T): SuccessResponse<T> {
  return {
    success: true,
    data,
  };
}

/**
 * Handle errors in server functions with proper logging and user-friendly messages
 */
export function handleServerError(
  error: unknown,
  context?: Record<string, unknown>
): ErrorResponse {
  // Handle AppError instances
  if (error instanceof AppError) {
    logger.error(error.message, error, { ...context, code: error.code, ...error.details });
    return createErrorResponse(error.code, error.message, error.details);
  }

  // Handle standard Error instances
  if (error instanceof Error) {
    // Check for specific error patterns
    if (error.message.includes('RATE_LIMIT')) {
      logger.warn('Rate limit exceeded', { ...context, error: error.message });
      return createErrorResponse(
        ErrorCodes.RATE_LIMIT_EXCEEDED,
        'Muitas requisições. Aguarde alguns segundos e tente novamente.',
        { originalError: error.message }
      );
    }

    if (error.message.includes('PAYMENT_REQUIRED')) {
      logger.warn('Payment required', { ...context, error: error.message });
      return createErrorResponse(
        ErrorCodes.PAYMENT_REQUIRED,
        'Créditos de IA esgotados. Adicione créditos em Settings > Workspace > Usage.',
        { originalError: error.message }
      );
    }

    if (error.message.includes('timeout') || error.message.includes('TIMEOUT')) {
      logger.error('Request timeout', error, context);
      return createErrorResponse(
        ErrorCodes.TIMEOUT,
        'A operação demorou muito tempo. Tente novamente.',
        { originalError: error.message }
      );
    }

    if (error.message.includes('fetch') || error.message.includes('network')) {
      logger.error('Network error', error, context);
      return createErrorResponse(
        ErrorCodes.EXTERNAL_API_ERROR,
        'Erro de conexão com serviço externo. Verifique sua conexão e tente novamente.',
        { originalError: error.message }
      );
    }

    // Generic error
    logger.error('Server error', error, context);
    return createErrorResponse(
      ErrorCodes.INTERNAL_ERROR,
      'Ocorreu um erro inesperado. Tente novamente.',
      { originalError: error.message }
    );
  }

  // Handle unknown error types
  logger.error('Unknown error type', undefined, { ...context, error: String(error) });
  return createErrorResponse(
    ErrorCodes.UNKNOWN_ERROR,
    'Ocorreu um erro inesperado. Tente novamente.',
    { error: String(error) }
  );
}

/**
 * Wrap async operations with error handling and retry logic
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    delayMs?: number;
    onRetry?: (attempt: number, error: Error) => void;
    shouldRetry?: (error: Error) => boolean;
  } = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delayMs = 1000,
    onRetry,
    shouldRetry = (error: Error) => {
      // Retry on network errors and timeouts by default
      return (
        error.message.includes('fetch') ||
        error.message.includes('network') ||
        error.message.includes('timeout') ||
        error.message.includes('ECONNREFUSED')
      );
    },
  } = options;

  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry if this is the last attempt or if we shouldn't retry this error
      if (attempt === maxAttempts || !shouldRetry(lastError)) {
        throw lastError;
      }

      // Call onRetry callback if provided
      if (onRetry) {
        onRetry(attempt, lastError);
      }

      // Wait before retrying (exponential backoff)
      await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
    }
  }

  throw lastError!;
}

/**
 * Validate required environment variables
 */
export function requireEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new AppError(
      ErrorCodes.MISSING_ENV_VAR,
      `Variável de ambiente ${name} não configurada.`,
      { envVar: name },
      500
    );
  }
  return value;
}

/**
 * Validate database response
 */
export function validateDatabaseResponse<T>(
  data: T | null,
  error: Error | null,
  resourceName: string
): T {
  if (error) {
    throw new AppError(
      ErrorCodes.DATABASE_ERROR,
      `Erro ao acessar ${resourceName}.`,
      { originalError: error.message },
      500
    );
  }

  if (!data) {
    throw new AppError(
      ErrorCodes.NOT_FOUND,
      `${resourceName} não encontrado.`,
      undefined,
      404
    );
  }

  return data;
}

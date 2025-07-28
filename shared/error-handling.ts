/**
 * Standardized Error Handling
 * Replaces inconsistent error handling patterns across the codebase
 */

export abstract class DomainError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;
  
  constructor(message: string, public readonly context?: Record<string, unknown>) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ValidationError extends DomainError {
  readonly code = 'VALIDATION_ERROR';
  readonly statusCode = 400;
}

export class NotFoundError extends DomainError {
  readonly code = 'NOT_FOUND';
  readonly statusCode = 404;
}

export class OperationError extends DomainError {
  readonly code = 'OPERATION_ERROR';
  readonly statusCode = 422;
}

export class InfrastructureError extends DomainError {
  readonly code = 'INFRASTRUCTURE_ERROR';
  readonly statusCode = 500;
}

export class ConfigurationError extends DomainError {
  readonly code = 'CONFIGURATION_ERROR';
  readonly statusCode = 500;
}

/**
 * Result pattern for operations that might fail
 */
export type Result<T, E = DomainError> = 
  | { success: true; data: T; error?: undefined }
  | { success: false; data?: undefined; error: E };

/**
 * Creates a successful result
 */
export function success<T>(data: T): Result<T, never> {
  return { success: true, data };
}

/**
 * Creates a failed result
 */
export function failure<E extends DomainError>(error: E): Result<never, E> {
  return { success: false, error };
}

/**
 * Safe wrapper for operations that might throw
 */
export async function safeAsync<T>(
  operation: () => Promise<T>,
  errorFactory?: (error: unknown) => DomainError
): Promise<Result<T, DomainError>> {
  try {
    const data = await operation();
    return success(data);
  } catch (error) {
    let domainError: DomainError;
    
    if (errorFactory) {
      try {
        domainError = errorFactory(error);
        // Validate that errorFactory actually returned a DomainError
        if (!domainError || !(domainError instanceof DomainError)) {
          throw new Error('errorFactory must return a DomainError instance');
        }
      } catch (factoryError) {
        // Fallback if errorFactory itself throws or returns invalid result
        domainError = new OperationError(
          `Error factory failed: ${factoryError instanceof Error ? factoryError.message : 'Unknown factory error'}`,
          { originalError: error, factoryError }
        );
      }
    } else {
      domainError = new OperationError(
        error instanceof Error ? error.message : 'Operation failed',
        { originalError: error }
      );
    }
    
    return failure(domainError);
  }
}

/**
 * Safe wrapper for synchronous operations that might throw
 */
export function safe<T>(
  operation: () => T,
  errorFactory?: (error: unknown) => DomainError
): Result<T, DomainError> {
  try {
    const data = operation();
    return success(data);
  } catch (error) {
    const domainError = errorFactory 
      ? errorFactory(error)
      : new OperationError(
          error instanceof Error ? error.message : 'Operation failed',
          { originalError: error }
        );
    return failure(domainError);
  }
}

/**
 * Error logger interface
 */
export interface ErrorLogger {
  logError(error: DomainError, context?: Record<string, unknown>): void;
}

/**
 * Console error logger implementation
 */
export class ConsoleErrorLogger implements ErrorLogger {
  logError(error: DomainError, context?: Record<string, unknown>): void {
    console.error(`[${error.code}] ${error.message}`, {
      ...error.context,
      ...context
    });
  }
}
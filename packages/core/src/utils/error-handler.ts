/**
 * Error Handler
 * Provides error boundaries and consistent error handling
 */

import { logger } from '../logger/logger.js';

export class ErrorHandler {
  /**
   * Wrap an async function with error handling
   */
  static wrapAsync<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    context: string
  ): T {
    return (async (...args: Parameters<T>) => {
      try {
        return await fn(...args);
      } catch (error) {
        logger.error(`Error in ${context}`, { args }, error as Error);
        
        // Re-throw with more context
        if (error instanceof Error) {
          error.message = `[${context}] ${error.message}`;
          throw error;
        } else {
          throw new Error(`[${context}] Unknown error: ${String(error)}`);
        }
      }
    }) as T;
  }

  /**
   * Wrap a sync function with error handling
   */
  static wrapSync<T extends (...args: any[]) => any>(
    fn: T,
    context: string
  ): T {
    return ((...args: Parameters<T>) => {
      try {
        return fn(...args);
      } catch (error) {
        logger.error(`Error in ${context}`, { args }, error as Error);
        
        // Re-throw with more context
        if (error instanceof Error) {
          error.message = `[${context}] ${error.message}`;
          throw error;
        } else {
          throw new Error(`[${context}] Unknown error: ${String(error)}`);
        }
      }
    }) as T;
  }

  /**
   * Create a safe version of a function that returns a result object
   */
  static createSafe<T extends (...args: any[]) => any>(
    fn: T,
    context: string
  ): (...args: Parameters<T>) => { success: boolean; result?: ReturnType<T>; error?: Error } {
    return (...args: Parameters<T>) => {
      try {
        const result = fn(...args);
        return { success: true, result };
      } catch (error) {
        logger.error(`Error in ${context}`, { args }, error as Error);
        return {
          success: false,
          error: error instanceof Error ? error : new Error(String(error)),
        };
      }
    };
  }

  /**
   * Create a safe async version of a function
   */
  static createSafeAsync<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    context: string
  ): (...args: Parameters<T>) => Promise<{ success: boolean; result?: Awaited<ReturnType<T>>; error?: Error }> {
    return async (...args: Parameters<T>) => {
      try {
        const result = await fn(...args);
        return { success: true, result };
      } catch (error) {
        logger.error(`Error in ${context}`, { args }, error as Error);
        return {
          success: false,
          error: error instanceof Error ? error : new Error(String(error)),
        };
      }
    };
  }

  /**
   * Retry a function with exponential backoff
   */
  static async retry<T>(
    fn: () => Promise<T>,
    options: {
      maxAttempts?: number;
      initialDelay?: number;
      maxDelay?: number;
      backoffFactor?: number;
      context?: string;
    } = {}
  ): Promise<T> {
    const {
      maxAttempts = 3,
      initialDelay = 1000,
      maxDelay = 30000,
      backoffFactor = 2,
      context = 'retry operation',
    } = options;

    let lastError: Error | undefined;
    let delay = initialDelay;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt === maxAttempts) {
          logger.error(`${context} failed after ${maxAttempts} attempts`, {}, lastError);
          throw lastError;
        }

        logger.warn(`${context} failed, retrying...`, {
          attempt,
          maxAttempts,
          nextDelayMs: delay,
        });

        await new Promise(resolve => setTimeout(resolve, delay));
        delay = Math.min(delay * backoffFactor, maxDelay);
      }
    }

    throw lastError || new Error(`${context} failed after ${maxAttempts} attempts`);
  }

  /**
   * Handle different error types consistently
   */
  static formatError(error: unknown): {
    message: string;
    code?: string;
    details?: any;
  } {
    if (error instanceof Error) {
      const formatted: any = {
        message: error.message,
      };

      // Handle specific error types
      if ('code' in error) {
        formatted.code = (error as any).code;
      }

      if ('details' in error) {
        formatted.details = (error as any).details;
      }

      return formatted;
    }

    if (typeof error === 'string') {
      return { message: error };
    }

    if (typeof error === 'object' && error !== null) {
      return {
        message: 'Unknown error object',
        details: error,
      };
    }

    return { message: String(error) };
  }

  /**
   * Create a timeout wrapper
   */
  static withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    context: string = 'operation'
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`${context} timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      promise
        .then(result => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  /**
   * Graceful shutdown handler
   */
  static setupGracefulShutdown(cleanup: () => Promise<void>): void {
    let isShuttingDown = false;

    const shutdown = async (signal: string) => {
      if (isShuttingDown) {
        logger.info('Shutdown already in progress');
        return;
      }

      isShuttingDown = true;
      logger.info(`Received ${signal}, starting graceful shutdown`);

      try {
        // Give cleanup 30 seconds to complete
        await this.withTimeout(cleanup(), 30000, 'cleanup');
        logger.info('Graceful shutdown complete');
        process.exit(0);
      } catch (error) {
        logger.error('Error during shutdown', {}, error as Error);
        process.exit(1);
      }
    };

    // Handle different signals
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    
    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception', {}, error);
      shutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled rejection', { promise }, reason as Error);
      shutdown('unhandledRejection');
    });
  }
}
/**
 * Error Handler
 * Provides error boundaries and consistent error handling
 */
export declare class ErrorHandler {
    /**
     * Wrap an async function with error handling
     */
    static wrapAsync<T extends (...args: any[]) => Promise<any>>(fn: T, context: string): T;
    /**
     * Wrap a sync function with error handling
     */
    static wrapSync<T extends (...args: any[]) => any>(fn: T, context: string): T;
    /**
     * Create a safe version of a function that returns a result object
     */
    static createSafe<T extends (...args: any[]) => any>(fn: T, context: string): (...args: Parameters<T>) => {
        success: boolean;
        result?: ReturnType<T>;
        error?: Error;
    };
    /**
     * Create a safe async version of a function
     */
    static createSafeAsync<T extends (...args: any[]) => Promise<any>>(fn: T, context: string): (...args: Parameters<T>) => Promise<{
        success: boolean;
        result?: Awaited<ReturnType<T>>;
        error?: Error;
    }>;
    /**
     * Retry a function with exponential backoff
     */
    static retry<T>(fn: () => Promise<T>, options?: {
        maxAttempts?: number;
        initialDelay?: number;
        maxDelay?: number;
        backoffFactor?: number;
        context?: string;
    }): Promise<T>;
    /**
     * Handle different error types consistently
     */
    static formatError(error: unknown): {
        message: string;
        code?: string;
        details?: any;
    };
    /**
     * Create a timeout wrapper
     */
    static withTimeout<T>(promise: Promise<T>, timeoutMs: number, context?: string): Promise<T>;
    /**
     * Graceful shutdown handler
     */
    static setupGracefulShutdown(cleanup: () => Promise<void>): void;
}
//# sourceMappingURL=error-handler.d.ts.map
/**
 * Shared Common Types
 * Consolidates common patterns across the application
 */
export interface Result<T> {
    success: boolean;
    data?: T;
    error?: string;
}
export interface ServiceResponse<T> extends Result<T> {
}
export interface Logger {
    debug(message: string, context?: Record<string, unknown>): void;
    info(message: string, context?: Record<string, unknown>): void;
    warn(message: string, context?: Record<string, unknown>): void;
    error(message: string, error?: Error, context?: Record<string, unknown>): void;
}
export interface ExportOptions {
    format: 'json' | 'csv' | 'markdown';
    file?: string;
    includeArchived?: boolean;
}
export interface ImportOptions {
    format?: 'json' | 'csv' | 'markdown';
    file: string;
    mergeStrategy?: 'replace' | 'merge' | 'skip';
}
export declare function createSuccessResult<T>(data: T): Result<T>;
export declare function createErrorResult<T>(error: string): Result<T>;

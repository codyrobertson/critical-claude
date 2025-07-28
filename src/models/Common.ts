/**
 * Shared Common Types
 * Consolidates common patterns across the application
 */

// Result pattern for operations
export interface Result<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Service response patterns
export interface ServiceResponse<T> extends Result<T> {
  // Additional response metadata can go here
}

// Basic logger interface
export interface Logger {
  debug(message: string, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, error?: Error, context?: Record<string, unknown>): void;
}

// File operation types
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

// Utility functions
export function createSuccessResult<T>(data: T): Result<T> {
  return { success: true, data };
}

export function createErrorResult<T>(error: string): Result<T> {
  return { success: false, error };
}

// Removed unused isSuccess function - can be added back if needed
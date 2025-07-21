/**
 * Shared Types
 * Common types used across layers
 */

// Result type for operations that can fail
export type Result<T, E = Error> = 
  | { success: true; value: T }
  | { success: false; error: E };

// Option type for nullable values
export type Option<T> = T | null;

// Predicate type
export type Predicate<T> = (item: T) => boolean;

// Comparator type
export type Comparator<T> = (a: T, b: T) => number;

// Mapper type
export type Mapper<T, U> = (item: T) => U;

// Reducer type
export type Reducer<T, U> = (accumulator: U, current: T) => U;

// Async versions
export type AsyncPredicate<T> = (item: T) => Promise<boolean>;
export type AsyncMapper<T, U> = (item: T) => Promise<U>;
export type AsyncReducer<T, U> = (accumulator: U, current: T) => Promise<U>;

// Event types
export type EventListener<T> = (event: T) => void;
export type AsyncEventListener<T> = (event: T) => Promise<void>;

// Time units
export type TimeUnit = 'milliseconds' | 'seconds' | 'minutes' | 'hours' | 'days';

// Disposable interface
export interface IDisposable {
  dispose(): void;
}

// Async disposable interface
export interface IAsyncDisposable {
  dispose(): Promise<void>;
}

// Subscription interface
export interface ISubscription extends IDisposable {
  readonly id: string;
  readonly isActive: boolean;
}

// Observable interface
export interface IObservable<T> {
  subscribe(listener: EventListener<T>): ISubscription;
}

// Performance metrics
export interface PerformanceMetrics {
  operationName: string;
  startTime: number;
  endTime: number;
  duration: number;
  metadata?: Record<string, unknown>;
}

// Validation result
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

// Pagination
export interface PageRequest {
  page: number;
  pageSize: number;
  sort?: SortOptions[];
}

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

export interface Page<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// Cache entry
export interface CacheEntry<T> {
  value: T;
  expires: number;
  hits: number;
}

// Rate limiter
export interface RateLimiterOptions {
  maxRequests: number;
  windowMs: number;
}

// Retry options
export interface RetryOptions {
  maxAttempts: number;
  delayMs: number;
  backoffMultiplier?: number;
  maxDelayMs?: number;
  shouldRetry?: (error: Error, attempt: number) => boolean;
}
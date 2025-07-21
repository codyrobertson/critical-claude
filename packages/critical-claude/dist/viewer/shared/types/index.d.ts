/**
 * Shared Types
 * Common types used across layers
 */
export type Result<T, E = Error> = {
    success: true;
    value: T;
} | {
    success: false;
    error: E;
};
export type Option<T> = T | null;
export type Predicate<T> = (item: T) => boolean;
export type Comparator<T> = (a: T, b: T) => number;
export type Mapper<T, U> = (item: T) => U;
export type Reducer<T, U> = (accumulator: U, current: T) => U;
export type AsyncPredicate<T> = (item: T) => Promise<boolean>;
export type AsyncMapper<T, U> = (item: T) => Promise<U>;
export type AsyncReducer<T, U> = (accumulator: U, current: T) => Promise<U>;
export type EventListener<T> = (event: T) => void;
export type AsyncEventListener<T> = (event: T) => Promise<void>;
export type TimeUnit = 'milliseconds' | 'seconds' | 'minutes' | 'hours' | 'days';
export interface IDisposable {
    dispose(): void;
}
export interface IAsyncDisposable {
    dispose(): Promise<void>;
}
export interface ISubscription extends IDisposable {
    readonly id: string;
    readonly isActive: boolean;
}
export interface IObservable<T> {
    subscribe(listener: EventListener<T>): ISubscription;
}
export interface PerformanceMetrics {
    operationName: string;
    startTime: number;
    endTime: number;
    duration: number;
    metadata?: Record<string, unknown>;
}
export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
}
export interface ValidationError {
    field: string;
    message: string;
    code?: string;
}
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
export interface CacheEntry<T> {
    value: T;
    expires: number;
    hits: number;
}
export interface RateLimiterOptions {
    maxRequests: number;
    windowMs: number;
}
export interface RetryOptions {
    maxAttempts: number;
    delayMs: number;
    backoffMultiplier?: number;
    maxDelayMs?: number;
    shouldRetry?: (error: Error, attempt: number) => boolean;
}
//# sourceMappingURL=index.d.ts.map
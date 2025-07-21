/**
 * Performance Utilities
 * Helpers for measuring and optimizing performance
 */
import { PerformanceMetrics } from '../types/index.js';
export declare class PerformanceMonitor {
    private metrics;
    private activeTimers;
    startTimer(operationName: string): void;
    endTimer(operationName: string, metadata?: Record<string, unknown>): PerformanceMetrics | null;
    measure<T>(operationName: string, operation: () => Promise<T>, metadata?: Record<string, unknown>): Promise<T>;
    measureSync<T>(operationName: string, operation: () => T, metadata?: Record<string, unknown>): T;
    getMetrics(operationName?: string): PerformanceMetrics[];
    getStats(operationName: string): PerformanceStats | null;
    clear(operationName?: string): void;
}
export interface PerformanceStats {
    operationName: string;
    count: number;
    min: number;
    max: number;
    mean: number;
    median: number;
    p95: number;
    p99: number;
}
export declare function debounce<T extends (...args: any[]) => any>(func: T, waitMs: number): (...args: Parameters<T>) => void;
export declare function throttle<T extends (...args: any[]) => any>(func: T, limitMs: number): (...args: Parameters<T>) => void;
export declare function memoize<T extends (...args: any[]) => any>(func: T, keyGenerator?: (...args: Parameters<T>) => string): T;
export declare class RateLimiter {
    private maxRequests;
    private windowMs;
    private requests;
    constructor(maxRequests: number, windowMs: number);
    tryAcquire(): boolean;
    acquire(): Promise<void>;
    reset(): void;
}
export declare class FrameRateController {
    private lastFrameTime;
    private frameInterval;
    constructor(targetFps?: number);
    shouldRender(): boolean;
    reset(): void;
}
//# sourceMappingURL=performance.d.ts.map
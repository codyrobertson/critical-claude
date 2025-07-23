/**
 * Performance Utilities
 * Helpers for measuring and optimizing performance
 */

import { PerformanceMetrics } from '../types/index.js';

export class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics[]> = new Map();
  private activeTimers: Map<string, number> = new Map();

  startTimer(operationName: string): void {
    this.activeTimers.set(operationName, performance.now());
  }

  endTimer(operationName: string, metadata?: Record<string, unknown>): PerformanceMetrics | null {
    const startTime = this.activeTimers.get(operationName);
    if (startTime === undefined) {
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    const metric: PerformanceMetrics = {
      operationName,
      startTime,
      endTime,
      duration,
      metadata
    };

    // Store metric
    if (!this.metrics.has(operationName)) {
      this.metrics.set(operationName, []);
    }
    this.metrics.get(operationName)!.push(metric);

    // Clean up
    this.activeTimers.delete(operationName);

    return metric;
  }

  async measure<T>(
    operationName: string,
    operation: () => Promise<T>,
    metadata?: Record<string, unknown>
  ): Promise<T> {
    this.startTimer(operationName);
    try {
      const result = await operation();
      this.endTimer(operationName, { ...metadata, success: true });
      return result;
    } catch (error) {
      this.endTimer(operationName, { ...metadata, success: false, error: String(error) });
      throw error;
    }
  }

  measureSync<T>(
    operationName: string,
    operation: () => T,
    metadata?: Record<string, unknown>
  ): T {
    this.startTimer(operationName);
    try {
      const result = operation();
      this.endTimer(operationName, { ...metadata, success: true });
      return result;
    } catch (error) {
      this.endTimer(operationName, { ...metadata, success: false, error: String(error) });
      throw error;
    }
  }

  getMetrics(operationName?: string): PerformanceMetrics[] {
    if (operationName) {
      return this.metrics.get(operationName) || [];
    }
    
    const allMetrics: PerformanceMetrics[] = [];
    for (const metrics of this.metrics.values()) {
      allMetrics.push(...metrics);
    }
    return allMetrics;
  }

  getStats(operationName: string): PerformanceStats | null {
    const metrics = this.getMetrics(operationName);
    if (metrics.length === 0) return null;

    const durations = metrics.map(m => m.duration);
    const sorted = [...durations].sort((a, b) => a - b);

    return {
      operationName,
      count: metrics.length,
      min: Math.min(...durations),
      max: Math.max(...durations),
      mean: durations.reduce((a, b) => a + b, 0) / durations.length,
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)]
    };
  }

  clear(operationName?: string): void {
    if (operationName) {
      this.metrics.delete(operationName);
    } else {
      this.metrics.clear();
    }
  }
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

// Debounce function
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  waitMs: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, waitMs);
  };
}

// Throttle function
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limitMs: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  let lastArgs: Parameters<T> | null = null;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;

      setTimeout(() => {
        inThrottle = false;
        if (lastArgs) {
          func(...lastArgs);
          lastArgs = null;
        }
      }, limitMs);
    } else {
      lastArgs = args;
    }
  };
}

// Memoize function
export function memoize<T extends (...args: any[]) => any>(
  func: T,
  keyGenerator?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();
  const defaultKeyGen = (...args: Parameters<T>) => JSON.stringify(args);
  const getKey = keyGenerator || defaultKeyGen;

  return ((...args: Parameters<T>) => {
    const key = getKey(...args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = func(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

// Rate limiter
export class RateLimiter {
  private requests: number[] = [];

  constructor(
    private maxRequests: number,
    private windowMs: number
  ) {}

  tryAcquire(): boolean {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);

    if (this.requests.length < this.maxRequests) {
      this.requests.push(now);
      return true;
    }

    return false;
  }

  async acquire(): Promise<void> {
    while (!this.tryAcquire()) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  reset(): void {
    this.requests = [];
  }
}

// Frame rate controller for animations
export class FrameRateController {
  private lastFrameTime = 0;
  private frameInterval: number;

  constructor(targetFps: number = 60) {
    this.frameInterval = 1000 / targetFps;
  }

  shouldRender(): boolean {
    const now = performance.now();
    const elapsed = now - this.lastFrameTime;

    if (elapsed >= this.frameInterval) {
      this.lastFrameTime = now - (elapsed % this.frameInterval);
      return true;
    }

    return false;
  }

  reset(): void {
    this.lastFrameTime = 0;
  }
}
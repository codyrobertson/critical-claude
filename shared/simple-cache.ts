/**
 * Simple In-Memory Cache
 * Lightweight caching for performance optimization
 */

interface CacheEntry<T> {
  value: T;
  expiry: number;
  hits: number;
}

export class SimpleCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private maxSize: number;
  private defaultTtlMs: number;

  constructor(maxSize = 1000, defaultTtlMs = 300000) { // 5 minute default TTL
    this.maxSize = maxSize;
    this.defaultTtlMs = defaultTtlMs;
  }

  /**
   * Get cached value
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return undefined;
    }
    
    // Check if expired
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return undefined;
    }
    
    // Increment hit counter
    entry.hits++;
    
    return entry.value;
  }

  /**
   * Set cached value
   */
  set(key: string, value: T, ttlMs?: number): void {
    // Evict if at capacity
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLeastUsed();
    }
    
    const expiry = Date.now() + (ttlMs || this.defaultTtlMs);
    
    this.cache.set(key, {
      value,
      expiry,
      hits: 0
    });
  }

  /**
   * Delete cached value
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cached values
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    let totalHits = 0;
    let expiredCount = 0;
    const now = Date.now();
    
    for (const entry of this.cache.values()) {
      totalHits += entry.hits;
      if (now > entry.expiry) {
        expiredCount++;
      }
    }
    
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      totalHits,
      expiredCount,
      hitRate: this.cache.size > 0 ? totalHits / this.cache.size : 0
    };
  }

  /**
   * Get or compute cached value
   */
  async getOrSet<K>(
    key: string, 
    factory: () => Promise<T>, 
    ttlMs?: number
  ): Promise<T> {
    const cached = this.get(key);
    if (cached !== undefined) {
      return cached;
    }
    
    const value = await factory();
    this.set(key, value, ttlMs);
    return value;
  }

  /**
   * Evict least recently used items
   */
  private evictLeastUsed(): void {
    let leastUsedKey: string | undefined;
    let leastHits = Infinity;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.hits < leastHits) {
        leastHits = entry.hits;
        leastUsedKey = key;
      }
    }
    
    if (leastUsedKey) {
      this.cache.delete(leastUsedKey);
    }
  }

  /**
   * Clean up expired entries
   */
  cleanup(): number {
    const now = Date.now();
    let removed = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.cache.delete(key);
        removed++;
      }
    }
    
    return removed;
  }
}

// Global caches for common use cases
export const taskCache = new SimpleCache<any>(500, 60000); // 1 minute TTL for tasks
export const searchCache = new SimpleCache<any>(200, 300000); // 5 minute TTL for searches
export const aiResponseCache = new SimpleCache<string>(100, 1800000); // 30 minute TTL for AI responses

// Auto-cleanup expired entries every 5 minutes
setInterval(() => {
  taskCache.cleanup();
  searchCache.cleanup();
  aiResponseCache.cleanup();
}, 300000);

/**
 * Performance monitoring utilities
 */
export class PerformanceMonitor {
  private measurements = new Map<string, number[]>();

  /**
   * Start timing an operation
   */
  startTiming(operation: string): () => number {
    const start = performance.now();
    
    return () => {
      const duration = performance.now() - start;
      this.recordTiming(operation, duration);
      return duration;
    };
  }

  /**
   * Record timing for an operation
   */
  private recordTiming(operation: string, duration: number): void {
    if (!this.measurements.has(operation)) {
      this.measurements.set(operation, []);
    }
    
    const times = this.measurements.get(operation)!;
    times.push(duration);
    
    // Keep only last 100 measurements per operation
    if (times.length > 100) {
      times.shift();
    }
  }

  /**
   * Get performance statistics
   */
  getStats(operation?: string) {
    if (operation) {
      const times = this.measurements.get(operation) || [];
      return this.calculateStats(times);
    }
    
    const allStats: Record<string, any> = {};
    for (const [op, times] of this.measurements.entries()) {
      allStats[op] = this.calculateStats(times);
    }
    return allStats;
  }

  private calculateStats(times: number[]) {
    if (times.length === 0) {
      return { count: 0, avg: 0, min: 0, max: 0, p95: 0 };
    }
    
    const sorted = [...times].sort((a, b) => a - b);
    const sum = times.reduce((a, b) => a + b, 0);
    
    return {
      count: times.length,
      avg: Math.round(sum / times.length * 100) / 100,
      min: Math.round(sorted[0] * 100) / 100,
      max: Math.round(sorted[sorted.length - 1] * 100) / 100,
      p95: Math.round(sorted[Math.floor(sorted.length * 0.95)] * 100) / 100
    };
  }
}

export const perfMonitor = new PerformanceMonitor();
/**
 * Performance Utilities
 * Helpers for measuring and optimizing performance
 */
export class PerformanceMonitor {
    metrics = new Map();
    activeTimers = new Map();
    startTimer(operationName) {
        this.activeTimers.set(operationName, performance.now());
    }
    endTimer(operationName, metadata) {
        const startTime = this.activeTimers.get(operationName);
        if (startTime === undefined) {
            return null;
        }
        const endTime = performance.now();
        const duration = endTime - startTime;
        const metric = {
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
        this.metrics.get(operationName).push(metric);
        // Clean up
        this.activeTimers.delete(operationName);
        return metric;
    }
    async measure(operationName, operation, metadata) {
        this.startTimer(operationName);
        try {
            const result = await operation();
            this.endTimer(operationName, { ...metadata, success: true });
            return result;
        }
        catch (error) {
            this.endTimer(operationName, { ...metadata, success: false, error: String(error) });
            throw error;
        }
    }
    measureSync(operationName, operation, metadata) {
        this.startTimer(operationName);
        try {
            const result = operation();
            this.endTimer(operationName, { ...metadata, success: true });
            return result;
        }
        catch (error) {
            this.endTimer(operationName, { ...metadata, success: false, error: String(error) });
            throw error;
        }
    }
    getMetrics(operationName) {
        if (operationName) {
            return this.metrics.get(operationName) || [];
        }
        const allMetrics = [];
        for (const metrics of this.metrics.values()) {
            allMetrics.push(...metrics);
        }
        return allMetrics;
    }
    getStats(operationName) {
        const metrics = this.getMetrics(operationName);
        if (metrics.length === 0)
            return null;
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
    clear(operationName) {
        if (operationName) {
            this.metrics.delete(operationName);
        }
        else {
            this.metrics.clear();
        }
    }
}
// Debounce function
export function debounce(func, waitMs) {
    let timeoutId = null;
    return (...args) => {
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
export function throttle(func, limitMs) {
    let inThrottle = false;
    let lastArgs = null;
    return (...args) => {
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
        }
        else {
            lastArgs = args;
        }
    };
}
// Memoize function
export function memoize(func, keyGenerator) {
    const cache = new Map();
    const defaultKeyGen = (...args) => JSON.stringify(args);
    const getKey = keyGenerator || defaultKeyGen;
    return ((...args) => {
        const key = getKey(...args);
        if (cache.has(key)) {
            return cache.get(key);
        }
        const result = func(...args);
        cache.set(key, result);
        return result;
    });
}
// Rate limiter
export class RateLimiter {
    maxRequests;
    windowMs;
    requests = [];
    constructor(maxRequests, windowMs) {
        this.maxRequests = maxRequests;
        this.windowMs = windowMs;
    }
    tryAcquire() {
        const now = Date.now();
        this.requests = this.requests.filter(time => now - time < this.windowMs);
        if (this.requests.length < this.maxRequests) {
            this.requests.push(now);
            return true;
        }
        return false;
    }
    async acquire() {
        while (!this.tryAcquire()) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
    reset() {
        this.requests = [];
    }
}
// Frame rate controller for animations
export class FrameRateController {
    lastFrameTime = 0;
    frameInterval;
    constructor(targetFps = 60) {
        this.frameInterval = 1000 / targetFps;
    }
    shouldRender() {
        const now = performance.now();
        const elapsed = now - this.lastFrameTime;
        if (elapsed >= this.frameInterval) {
            this.lastFrameTime = now - (elapsed % this.frameInterval);
            return true;
        }
        return false;
    }
    reset() {
        this.lastFrameTime = 0;
    }
}
//# sourceMappingURL=performance.js.map
/**
 * Semaphore implementation for controlling concurrent operations
 * Prevents resource exhaustion attacks
 */
export declare class Semaphore {
    private permits;
    private queue;
    constructor(permits: number);
    acquire<T>(operation: () => Promise<T>): Promise<T>;
    private executeOperation;
    private release;
    get availablePermits(): number;
    get queueLength(): number;
}
//# sourceMappingURL=semaphore.d.ts.map
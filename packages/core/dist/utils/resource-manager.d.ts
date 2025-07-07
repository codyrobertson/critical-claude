/**
 * Resource Manager
 * Tracks and limits resource usage to prevent exhaustion
 */
export interface ResourceUsage {
    memoryMB: number;
    filesProcessed: number;
    startTime: number;
    peakMemoryMB: number;
}
export interface ResourceLimits {
    maxMemoryMB: number;
    maxFiles: number;
    maxFileSize: number;
    maxProcessingTimeMs: number;
}
export declare class ResourceManager {
    private usage;
    private limits;
    private memoryCheckInterval;
    constructor(limits?: Partial<ResourceLimits>);
    /**
     * Check if we can process another file
     */
    canProcessFile(fileSizeBytes: number): {
        allowed: boolean;
        reason?: string;
    };
    /**
     * Record that a file was processed
     */
    recordFileProcessed(): void;
    /**
     * Get current resource usage
     */
    getUsage(): ResourceUsage;
    /**
     * Get resource limits
     */
    getLimits(): ResourceLimits;
    /**
     * Clean up resources
     */
    cleanup(): void;
    /**
     * Start monitoring memory usage
     */
    private startMemoryMonitoring;
    /**
     * Get current memory usage in MB
     */
    private getCurrentMemoryUsage;
    /**
     * Update memory usage statistics
     */
    private updateMemoryUsage;
    /**
     * Create a resource-aware file processor
     */
    createFileProcessor<T>(processor: (filePath: string, content: string) => Promise<T>): (filePath: string, content: string) => Promise<T | null>;
}
//# sourceMappingURL=resource-manager.d.ts.map
/**
 * Resource Manager
 * Tracks and limits resource usage to prevent exhaustion
 */

import { logger } from './logger.js';

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

export class ResourceManager {
  private usage: ResourceUsage;
  private limits: ResourceLimits;
  private memoryCheckInterval: NodeJS.Timeout | null = null;

  constructor(limits?: Partial<ResourceLimits>) {
    this.limits = {
      maxMemoryMB: limits?.maxMemoryMB || 500, // 500MB default
      maxFiles: limits?.maxFiles || 50000,
      maxFileSize: limits?.maxFileSize || 10 * 1024 * 1024, // 10MB
      maxProcessingTimeMs: limits?.maxProcessingTimeMs || 5 * 60 * 1000, // 5 minutes
    };

    this.usage = {
      memoryMB: 0,
      filesProcessed: 0,
      startTime: Date.now(),
      peakMemoryMB: 0,
    };

    // Start memory monitoring
    this.startMemoryMonitoring();
  }

  /**
   * Check if we can process another file
   */
  canProcessFile(fileSizeBytes: number): { allowed: boolean; reason?: string } {
    // Check file count
    if (this.usage.filesProcessed >= this.limits.maxFiles) {
      return {
        allowed: false,
        reason: `File limit reached (${this.limits.maxFiles} files)`,
      };
    }

    // Check file size
    if (fileSizeBytes > this.limits.maxFileSize) {
      return {
        allowed: false,
        reason: `File too large (${Math.round(fileSizeBytes / 1024 / 1024)}MB > ${Math.round(this.limits.maxFileSize / 1024 / 1024)}MB)`,
      };
    }

    // Check memory usage
    const currentMemory = this.getCurrentMemoryUsage();
    if (currentMemory > this.limits.maxMemoryMB * 0.9) { // 90% threshold
      return {
        allowed: false,
        reason: `Memory limit approaching (${Math.round(currentMemory)}MB / ${this.limits.maxMemoryMB}MB)`,
      };
    }

    // Check processing time
    const elapsedMs = Date.now() - this.usage.startTime;
    if (elapsedMs > this.limits.maxProcessingTimeMs) {
      return {
        allowed: false,
        reason: `Processing time limit exceeded (${Math.round(elapsedMs / 1000)}s)`,
      };
    }

    return { allowed: true };
  }

  /**
   * Record that a file was processed
   */
  recordFileProcessed(): void {
    this.usage.filesProcessed++;
    this.updateMemoryUsage();
  }

  /**
   * Get current resource usage
   */
  getUsage(): ResourceUsage {
    this.updateMemoryUsage();
    return { ...this.usage };
  }

  /**
   * Get resource limits
   */
  getLimits(): ResourceLimits {
    return { ...this.limits };
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
      this.memoryCheckInterval = null;
    }

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
  }

  /**
   * Start monitoring memory usage
   */
  private startMemoryMonitoring(): void {
    // Check memory every 5 seconds
    this.memoryCheckInterval = setInterval(() => {
      this.updateMemoryUsage();
      
      // Log warning if memory is high
      if (this.usage.memoryMB > this.limits.maxMemoryMB * 0.8) {
        logger.warn('High memory usage detected', {
          currentMB: Math.round(this.usage.memoryMB),
          limitMB: this.limits.maxMemoryMB,
          percentage: Math.round((this.usage.memoryMB / this.limits.maxMemoryMB) * 100),
        });
      }
    }, 5000);

    // Don't let the interval keep the process alive
    this.memoryCheckInterval.unref();
  }

  /**
   * Get current memory usage in MB
   */
  private getCurrentMemoryUsage(): number {
    const usage = process.memoryUsage();
    return (usage.heapUsed + usage.external) / 1024 / 1024;
  }

  /**
   * Update memory usage statistics
   */
  private updateMemoryUsage(): void {
    this.usage.memoryMB = this.getCurrentMemoryUsage();
    this.usage.peakMemoryMB = Math.max(this.usage.peakMemoryMB, this.usage.memoryMB);
  }

  /**
   * Create a resource-aware file processor
   */
  createFileProcessor<T>(
    processor: (filePath: string, content: string) => Promise<T>
  ): (filePath: string, content: string) => Promise<T | null> {
    return async (filePath: string, content: string) => {
      const sizeBytes = Buffer.byteLength(content, 'utf8');
      const canProcess = this.canProcessFile(sizeBytes);

      if (!canProcess.allowed) {
        logger.warn('File processing skipped due to resource limits', {
          file: filePath,
          reason: canProcess.reason,
        });
        return null;
      }

      try {
        const result = await processor(filePath, content);
        this.recordFileProcessed();
        return result;
      } catch (error) {
        logger.error('Error processing file', { file: filePath }, error as Error);
        throw error;
      }
    };
  }
}
/**
 * Semaphore implementation for controlling concurrent operations
 * Prevents resource exhaustion attacks
 */

export class Semaphore {
  private permits: number;
  private queue: Array<() => void> = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire<T>(operation: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      if (this.permits > 0) {
        this.permits--;
        this.executeOperation(operation, resolve, reject);
      } else {
        this.queue.push(() => {
          this.permits--;
          this.executeOperation(operation, resolve, reject);
        });
      }
    });
  }

  private async executeOperation<T>(
    operation: () => Promise<T>,
    resolve: (value: T) => void,
    reject: (reason?: any) => void
  ): Promise<void> {
    try {
      const result = await operation();
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      this.release();
    }
  }

  private release(): void {
    this.permits++;
    const next = this.queue.shift();
    if (next) {
      next();
    }
  }

  get availablePermits(): number {
    return this.permits;
  }

  get queueLength(): number {
    return this.queue.length;
  }
}

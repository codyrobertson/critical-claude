/**
 * Semaphore implementation for controlling concurrent operations
 * Prevents resource exhaustion attacks
 */
export class Semaphore {
    permits;
    queue = [];
    constructor(permits) {
        this.permits = permits;
    }
    async acquire(operation) {
        return new Promise((resolve, reject) => {
            if (this.permits > 0) {
                this.permits--;
                this.executeOperation(operation, resolve, reject);
            }
            else {
                this.queue.push(() => {
                    this.permits--;
                    this.executeOperation(operation, resolve, reject);
                });
            }
        });
    }
    async executeOperation(operation, resolve, reject) {
        try {
            const result = await operation();
            resolve(result);
        }
        catch (error) {
            reject(error);
        }
        finally {
            this.release();
        }
    }
    release() {
        this.permits++;
        const next = this.queue.shift();
        if (next) {
            next();
        }
    }
    get availablePermits() {
        return this.permits;
    }
    get queueLength() {
        return this.queue.length;
    }
}
//# sourceMappingURL=semaphore.js.map
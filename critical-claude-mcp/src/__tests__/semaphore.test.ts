/**
 * Tests for Semaphore implementation
 */

import { describe, it, expect } from '@jest/globals';
import { Semaphore } from '../semaphore.js';

describe('Semaphore', () => {
  it('should allow immediate execution when permits available', async () => {
    const semaphore = new Semaphore(2);
    let executed = false;

    const result = await semaphore.acquire(async () => {
      executed = true;
      return 'success';
    });

    expect(executed).toBe(true);
    expect(result).toBe('success');
    expect(semaphore.availablePermits).toBe(2);
  });

  it('should queue operations when no permits available', async () => {
    const semaphore = new Semaphore(1);
    let firstExecuted = false;
    let secondExecuted = false;

    // Start first operation (will acquire permit)
    const firstPromise = semaphore.acquire(async () => {
      firstExecuted = true;
      await new Promise((resolve) => setTimeout(resolve, 100));
      return 'first';
    });

    // Start second operation (should be queued)
    const secondPromise = semaphore.acquire(async () => {
      secondExecuted = true;
      return 'second';
    });

    // Second should not execute immediately
    expect(secondExecuted).toBe(false);
    expect(semaphore.queueLength).toBe(1);

    // Wait for both to complete
    const results = await Promise.all([firstPromise, secondPromise]);

    expect(results).toEqual(['first', 'second']);
    expect(firstExecuted).toBe(true);
    expect(secondExecuted).toBe(true);
    expect(semaphore.availablePermits).toBe(1);
    expect(semaphore.queueLength).toBe(0);
  });

  it('should handle operation errors correctly', async () => {
    const semaphore = new Semaphore(1);

    await expect(
      semaphore.acquire(async () => {
        throw new Error('Test error');
      })
    ).rejects.toThrow('Test error');

    // Permit should be released even after error
    expect(semaphore.availablePermits).toBe(1);
  });

  it('should handle concurrent operations correctly', async () => {
    const semaphore = new Semaphore(2);
    const results: string[] = [];

    const operations = Array.from({ length: 5 }, (_, i) =>
      semaphore.acquire(async () => {
        results.push(`op-${i}`);
        await new Promise((resolve) => setTimeout(resolve, 50));
        return `result-${i}`;
      })
    );

    const allResults = await Promise.all(operations);

    expect(allResults).toHaveLength(5);
    expect(results).toHaveLength(5);
    expect(semaphore.availablePermits).toBe(2);
  });
});

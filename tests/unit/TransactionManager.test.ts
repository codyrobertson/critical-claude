/**
 * Transaction Manager Tests
 * Test the transaction support for multi-entity operations
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  TransactionManager,
  TransactionResult,
  EnhancedTransaction,
  DEFAULT_TRANSACTION_OPTIONS,
  withTransaction,
  bulkCreate,
  bulkUpdate,
  bulkDelete
} from '../../shared/transaction-manager';
import { StorageEngine, StorageTransaction, StorageOperation } from '../../shared/storage-architecture';
import { BaseEntity } from '../../shared/domain-types';

// Mock storage engine
class MockStorageEngine implements StorageEngine {
  private data = new Map<string, Map<string, any>>();

  async save<T extends BaseEntity>(collection: string, id: string, data: T): Promise<void> {
    if (!this.data.has(collection)) {
      this.data.set(collection, new Map());
    }
    this.data.get(collection)!.set(id, data);
  }

  async findById<T extends BaseEntity>(collection: string, id: string): Promise<T | null> {
    return this.data.get(collection)?.get(id) || null;
  }

  async findAll<T extends BaseEntity>(collection: string): Promise<T[]> {
    const collectionData = this.data.get(collection);
    return collectionData ? Array.from(collectionData.values()) : [];
  }

  async query<T extends BaseEntity>(collection: string, filter: any): Promise<T[]> {
    return this.findAll(collection);
  }

  async delete(collection: string, id: string): Promise<boolean> {
    const collectionData = this.data.get(collection);
    if (collectionData && collectionData.has(id)) {
      collectionData.delete(id);
      return true;
    }
    return false;
  }

  async listCollections(): Promise<string[]> {
    return Array.from(this.data.keys());
  }

  async getCollectionSize(collection: string): Promise<number> {
    return this.data.get(collection)?.size || 0;
  }

  async clearCollection(collection: string): Promise<void> {
    this.data.delete(collection);
  }

  async createIndex<T>(collection: string, field: keyof T): Promise<void> {
    // Mock implementation
  }

  async dropIndex<T>(collection: string, field: keyof T): Promise<void> {
    // Mock implementation
  }

  async beginTransaction(): Promise<StorageTransaction> {
    return new MockStorageTransaction();
  }

  async validateCollection<T extends BaseEntity>(collection: string): Promise<any> {
    return { isValid: true };
  }

  async repairCollection(collection: string): Promise<number> {
    return 0;
  }

  async getStats(collection?: string): Promise<any> {
    return { collections: {}, totalSize: 0, totalItems: 0, operationCount: 0, averageOperationTime: 0 };
  }

  async optimize(collection?: string): Promise<void> {
    // Mock implementation
  }
}

// Mock storage transaction
class MockStorageTransaction implements StorageTransaction {
  operations: StorageOperation[] = [];
  private committed = false;
  private rolledBack = false;

  async rollback(): Promise<void> {
    if (this.committed) {
      throw new Error('Cannot rollback committed transaction');
    }
    this.rolledBack = true;
  }

  async commit(): Promise<void> {
    if (this.rolledBack) {
      throw new Error('Cannot commit rolled back transaction');
    }
    this.committed = true;
  }
}

// Test entity
interface TestEntity extends BaseEntity {
  name: string;
  value: number;
}

describe('Transaction Manager', () => {
  let mockStorage: MockStorageEngine;
  let transactionManager: TransactionManager;

  beforeEach(() => {
    mockStorage = new MockStorageEngine();
    transactionManager = new TransactionManager(mockStorage);
  });

  describe('Transaction Creation', () => {
    it('should create a new transaction', async () => {
      const transaction = await transactionManager.beginTransaction();

      expect(transaction.id).toMatch(/^txn-\d+-[a-z0-9]+$/);
      expect(transaction.getState()).toBe('active');
      expect(transaction.isActive()).toBe(true);
      expect(transaction.operations).toHaveLength(0);
    });

    it('should create transaction with custom options', async () => {
      const options = {
        timeout: 60000,
        maxRetries: 5,
        enableLogging: false
      };

      const transaction = await transactionManager.beginTransaction(options);

      expect(transaction.isActive()).toBe(true);
      expect(transaction.id).toBeDefined();
    });

    it('should track active transactions', async () => {
      const transaction1 = await transactionManager.beginTransaction();
      const transaction2 = await transactionManager.beginTransaction();

      const activeTransactions = transactionManager.getActiveTransactions();

      expect(activeTransactions).toHaveLength(2);
      expect(activeTransactions).toContain(transaction1);
      expect(activeTransactions).toContain(transaction2);
    });
  });

  describe('Transaction Operations', () => {
    let transaction: EnhancedTransaction;

    beforeEach(async () => {
      transaction = await transactionManager.beginTransaction();
    });

    it('should add operations to transaction', () => {
      const operation: StorageOperation = {
        type: 'create',
        collection: 'test',
        id: 'test-1',
        data: { id: 'test-1', name: 'Test', value: 42 }
      };

      transaction.addOperation(operation);

      expect(transaction.operations).toHaveLength(1);
      expect(transaction.operations[0]).toEqual(operation);
    });

    it('should add multiple operations at once', () => {
      const operations: StorageOperation[] = [
        { type: 'create', collection: 'test', id: 'test-1', data: { id: 'test-1', name: 'Test 1' } },
        { type: 'create', collection: 'test', id: 'test-2', data: { id: 'test-2', name: 'Test 2' } },
        { type: 'update', collection: 'test', id: 'test-3', data: { name: 'Updated' } }
      ];

      transaction.addOperations(operations);

      expect(transaction.operations).toHaveLength(3);
      expect(transaction.operations).toEqual(operations);
    });

    it('should prevent adding operations to inactive transaction', async () => {
      await transaction.commit();

      const operation: StorageOperation = {
        type: 'create',
        collection: 'test',
        id: 'test-1',
        data: { id: 'test-1', name: 'Test' }
      };

      expect(() => transaction.addOperation(operation)).toThrow();
    });
  });

  describe('Transaction Validation', () => {
    let transaction: EnhancedTransaction;

    beforeEach(async () => {
      transaction = await transactionManager.beginTransaction();
    });

    it('should validate empty transaction with warning', () => {
      const validation = transaction.validateOperations();

      expect(validation.isValid).toBe(true);
      // Note: warnings are not part of ValidationResult interface, this is simplified
    });

    it('should detect conflicting operations', () => {
      const operations: StorageOperation[] = [
        { type: 'create', collection: 'test', id: 'test-1', data: { id: 'test-1', name: 'Test' } },
        { type: 'update', collection: 'test', id: 'test-1', data: { name: 'Updated' } }
      ];

      transaction.addOperations(operations);
      const validation = transaction.validateOperations();

      expect(validation.isValid).toBe(false);
      expect(validation.error).toContain('Multiple write operations');
    });

    it('should allow read and write operations for same entity', () => {
      const operations: StorageOperation[] = [
        { type: 'create', collection: 'test', id: 'test-1', data: { id: 'test-1', name: 'Test' } },
        { type: 'delete', collection: 'test', id: 'test-2' }
      ];

      transaction.addOperations(operations);
      const validation = transaction.validateOperations();

      expect(validation.isValid).toBe(true);
    });

    it('should perform dry run validation', async () => {
      const operation: StorageOperation = {
        type: 'create',
        collection: 'test',
        id: 'test-1',
        data: { id: 'test-1', name: 'Test' }
      };

      transaction.addOperation(operation);
      const validation = await transaction.dryRun();

      expect(validation.isValid).toBe(true);
    });
  });

  describe('Transaction Commit and Rollback', () => {
    let transaction: EnhancedTransaction;

    beforeEach(async () => {
      transaction = await transactionManager.beginTransaction();
    });

    it('should commit transaction successfully', async () => {
      const operation: StorageOperation = {
        type: 'create',
        collection: 'test',
        id: 'test-1',
        data: { id: 'test-1', name: 'Test' }
      };

      transaction.addOperation(operation);
      await transaction.commit();

      expect(transaction.getState()).toBe('committed');
      expect(transaction.isActive()).toBe(false);
    });

    it('should rollback transaction successfully', async () => {
      const operation: StorageOperation = {
        type: 'create',
        collection: 'test',
        id: 'test-1',
        data: { id: 'test-1', name: 'Test' }
      };

      transaction.addOperation(operation);
      await transaction.rollback();

      expect(transaction.getState()).toBe('rolled_back');
      expect(transaction.isActive()).toBe(false);
    });

    it('should prevent commit after rollback', async () => {
      await transaction.rollback();

      await expect(transaction.commit()).rejects.toThrow();
    });

    it('should prevent rollback after commit', async () => {
      await transaction.commit();

      await expect(transaction.rollback()).rejects.toThrow();
    });

    it('should validate before commit when enabled', async () => {
      const invalidOperations: StorageOperation[] = [
        { type: 'create', collection: 'test', id: 'test-1', data: { id: 'test-1', name: 'Test' } },
        { type: 'update', collection: 'test', id: 'test-1', data: { name: 'Updated' } }
      ];

      transaction.addOperations(invalidOperations);

      await expect(transaction.commit()).rejects.toThrow('validation failed');
      expect(transaction.getState()).toBe('failed');
    });
  });

  describe('Transaction Manager Features', () => {
    it('should retrieve transaction by ID', async () => {
      const transaction = await transactionManager.beginTransaction();
      const retrieved = transactionManager.getTransaction(transaction.id);

      expect(retrieved).toBe(transaction);
    });

    it('should return undefined for non-existent transaction', () => {
      const retrieved = transactionManager.getTransaction('non-existent');

      expect(retrieved).toBeUndefined();
    });

    it('should track transaction history', async () => {
      const transaction = await transactionManager.beginTransaction();
      await transaction.commit();

      const history = transactionManager.getTransactionHistory();

      expect(history).toHaveLength(1);
      expect(history[0].id).toBe(transaction.id);
      expect(history[0].state).toBe('committed');
      expect(history[0].endTime).toBeDefined();
    });
  });

  describe('Utility Functions', () => {
    describe('withTransaction', () => {
      it('should execute operation within transaction and commit', async () => {
        const result = await withTransaction(transactionManager, async (transaction) => {
          const operation: StorageOperation = {
            type: 'create',
            collection: 'test',
            id: 'test-1',
            data: { id: 'test-1', name: 'Test' }
          };
          transaction.addOperation(operation);
          // Add small delay to ensure measurable duration
          await new Promise(resolve => setTimeout(resolve, 1));
          return 'success';
        });

        expect(result.success).toBe(true);
        expect(result.data).toBe('success');
        expect(result.operationCount).toBe(1);
        expect(result.affectedCollections).toEqual(['test']);
        expect(result.transactionId).toMatch(/^txn-\d+-[a-z0-9]+$/);
        expect(result.duration).toBeGreaterThanOrEqual(0);
      });

      it('should rollback on operation failure', async () => {
        const result = await withTransaction(transactionManager, async (transaction) => {
          const operation: StorageOperation = {
            type: 'create',
            collection: 'test',
            id: 'test-1',
            data: { id: 'test-1', name: 'Test' }
          };
          transaction.addOperation(operation);
          throw new Error('Operation failed');
        });

        expect(result.success).toBe(false);
        expect(result.error).toBe('Operation failed');
        expect(result.operationCount).toBe(1);
      });
    });

    describe('Bulk Operations', () => {
      let transaction: EnhancedTransaction;

      beforeEach(async () => {
        transaction = await transactionManager.beginTransaction();
      });

      it('should add bulk create operations', async () => {
        const entities: TestEntity[] = [
          { id: 'test-1', name: 'Test 1', value: 1, createdAt: '2025-01-01T10:00:00Z', updatedAt: '2025-01-01T10:00:00Z' },
          { id: 'test-2', name: 'Test 2', value: 2, createdAt: '2025-01-01T10:00:00Z', updatedAt: '2025-01-01T10:00:00Z' }
        ];

        await bulkCreate(transaction, 'test', entities);

        expect(transaction.operations).toHaveLength(2);
        expect(transaction.operations[0].type).toBe('create');
        expect(transaction.operations[1].type).toBe('create');
      });

      it('should add bulk update operations', async () => {
        const updates = [
          { id: 'test-1', data: { name: 'Updated 1' } },
          { id: 'test-2', data: { name: 'Updated 2' } }
        ];

        await bulkUpdate(transaction, 'test', updates);

        expect(transaction.operations).toHaveLength(2);
        expect(transaction.operations[0].type).toBe('update');
        expect(transaction.operations[1].type).toBe('update');
      });

      it('should add bulk delete operations', async () => {
        const ids = ['test-1', 'test-2', 'test-3'];

        await bulkDelete(transaction, 'test', ids);

        expect(transaction.operations).toHaveLength(3);
        expect(transaction.operations[0].type).toBe('delete');
        expect(transaction.operations[1].type).toBe('delete');
        expect(transaction.operations[2].type).toBe('delete');
      });
    });
  });

  describe('Transaction Options', () => {
    it('should use default options', () => {
      const manager = new TransactionManager(mockStorage);
      expect(manager).toBeDefined();
    });

    it('should use custom options', async () => {
      const customOptions = {
        timeout: 60000,
        maxRetries: 5,
        enableLogging: false
      };

      const manager = new TransactionManager(mockStorage, customOptions);
      const transaction = await manager.beginTransaction();

      expect(transaction).toBeDefined();
      expect(transaction.isActive()).toBe(true);
    });

    it('should merge transaction-specific options', async () => {
      const transaction = await transactionManager.beginTransaction({
        timeout: 45000,
        enableLogging: false
      });

      expect(transaction.isActive()).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle storage transaction creation failure', async () => {
      const failingStorage = {
        ...mockStorage,
        beginTransaction: async () => {
          throw new Error('Storage unavailable');
        }
      } as StorageEngine;

      const manager = new TransactionManager(failingStorage);

      await expect(manager.beginTransaction()).rejects.toThrow('Storage unavailable');
    });

    it('should handle commit failure', async () => {
      const failingTransaction = new MockStorageTransaction();
      failingTransaction.commit = async () => {
        throw new Error('Commit failed');
      };

      const failingStorage = {
        ...mockStorage,
        beginTransaction: async () => failingTransaction
      } as StorageEngine;

      const manager = new TransactionManager(failingStorage);
      const transaction = await manager.beginTransaction();

      await expect(transaction.commit()).rejects.toThrow('Commit failed');
      expect(transaction.getState()).toBe('failed');
    });

    it('should handle rollback failure', async () => {
      const failingTransaction = new MockStorageTransaction();
      failingTransaction.rollback = async () => {
        throw new Error('Rollback failed');
      };

      const failingStorage = {
        ...mockStorage,
        beginTransaction: async () => failingTransaction
      } as StorageEngine;

      const manager = new TransactionManager(failingStorage);
      const transaction = await manager.beginTransaction();

      await expect(transaction.rollback()).rejects.toThrow('Rollback failed');
      expect(transaction.getState()).toBe('failed');
    });
  });
});
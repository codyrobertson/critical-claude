/**
 * Transaction Manager - Multi-Entity Operation Support
 * 
 * Provides transaction support for atomic operations across multiple entities
 * and collections, ensuring data consistency and rollback capabilities.
 */

import { BaseEntity, ValidationResult } from './domain-types';
import { StorageOperation, StorageTransaction, StorageEngine } from './storage-architecture';

// Transaction state management
export type TransactionState = 'pending' | 'active' | 'committed' | 'rolled_back' | 'failed';

export interface TransactionMetadata {
  id: string;
  state: TransactionState;
  startTime: string;
  endTime?: string;
  operations: StorageOperation[];
  rollbackOperations: StorageOperation[];
  errorMessage?: string;
}

// Transaction result interface
export interface TransactionResult<T = any> {
  success: boolean;
  transactionId: string;
  data?: T;
  affectedCollections: string[];
  operationCount: number;
  duration?: number;
  error?: string;
  warnings?: string[];
}

// Enhanced transaction interface with more operations
export interface EnhancedTransaction extends StorageTransaction {
  id: string;
  metadata: TransactionMetadata;
  
  // Add operation to transaction
  addOperation(operation: StorageOperation): void;
  
  // Batch operations
  addOperations(operations: StorageOperation[]): void;
  
  // State management
  getState(): TransactionState;
  isActive(): boolean;
  canRollback(): boolean;
  
  // Operation validation
  validateOperations(): ValidationResult;
  
  // Dry run (validate without executing)
  dryRun(): Promise<ValidationResult>;
}

// Transaction isolation levels
export type IsolationLevel = 'read_uncommitted' | 'read_committed' | 'repeatable_read' | 'serializable';

// Transaction options
export interface TransactionOptions {
  isolationLevel?: IsolationLevel;
  timeout?: number; // milliseconds
  maxRetries?: number;
  retryDelay?: number; // milliseconds
  enableLogging?: boolean;
  validateBeforeCommit?: boolean;
}

// Default transaction options
export const DEFAULT_TRANSACTION_OPTIONS: Required<TransactionOptions> = {
  isolationLevel: 'read_committed',
  timeout: 30000, // 30 seconds
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  enableLogging: true,
  validateBeforeCommit: true
};

// Transaction manager implementation
export class TransactionManager {
  private activeTransactions = new Map<string, EnhancedTransaction>();
  private transactionHistory = new Map<string, TransactionMetadata>();
  private operationId = 0;

  constructor(
    private storageEngine: StorageEngine,
    private options: TransactionOptions = DEFAULT_TRANSACTION_OPTIONS
  ) {}

  // Create a new transaction
  async beginTransaction(options?: Partial<TransactionOptions>): Promise<EnhancedTransaction> {
    const finalOptions = { ...this.options, ...options };
    const transactionId = this.generateTransactionId();
    
    const metadata: TransactionMetadata = {
      id: transactionId,
      state: 'pending',
      startTime: new Date().toISOString(),
      operations: [],
      rollbackOperations: []
    };

    // Create the underlying storage transaction
    const storageTransaction = await this.storageEngine.beginTransaction();
    
    // Create enhanced transaction wrapper
    const enhancedTransaction = new EnhancedTransactionImpl(
      transactionId,
      metadata,
      storageTransaction,
      finalOptions,
      this
    );

    this.activeTransactions.set(transactionId, enhancedTransaction);
    metadata.state = 'active';

    if (finalOptions.enableLogging) {
      console.log(`Transaction ${transactionId} started with options:`, finalOptions);
    }

    return enhancedTransaction;
  }

  // Get transaction by ID
  getTransaction(id: string): EnhancedTransaction | undefined {
    return this.activeTransactions.get(id);
  }

  // Get all active transactions
  getActiveTransactions(): EnhancedTransaction[] {
    return Array.from(this.activeTransactions.values());
  }

  // Get transaction history
  getTransactionHistory(): TransactionMetadata[] {
    return Array.from(this.transactionHistory.values());
  }

  // Clean up completed transaction
  completeTransaction(transaction: EnhancedTransaction, result: TransactionResult): void {
    const metadata = transaction.metadata;
    metadata.endTime = new Date().toISOString();
    
    this.transactionHistory.set(transaction.id, metadata);
    this.activeTransactions.delete(transaction.id);

    if (this.options.enableLogging) {
      console.log(`Transaction ${transaction.id} completed:`, result);
    }
  }

  // Retry logic for failed operations
  private async retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number,
    retryDelay: number
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt < maxRetries) {
          await this.delay(retryDelay);
          retryDelay *= 2; // Exponential backoff
        }
      }
    }
    
    throw lastError!;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private generateTransactionId(): string {
    return `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Enhanced transaction implementation
class EnhancedTransactionImpl implements EnhancedTransaction {
  constructor(
    public readonly id: string,
    public readonly metadata: TransactionMetadata,
    private readonly storageTransaction: StorageTransaction,
    private readonly options: Required<TransactionOptions>,
    private readonly manager: TransactionManager
  ) {}

  get operations(): StorageOperation[] {
    return this.metadata.operations;
  }

  addOperation(operation: StorageOperation): void {
    if (!this.isActive()) {
      throw new Error(`Cannot add operation to transaction ${this.id}: transaction is ${this.metadata.state}`);
    }

    // Generate rollback operation
    const rollbackOperation = this.createRollbackOperation(operation);
    
    this.metadata.operations.push(operation);
    this.metadata.rollbackOperations.unshift(rollbackOperation); // LIFO for rollback
  }

  addOperations(operations: StorageOperation[]): void {
    operations.forEach(op => this.addOperation(op));
  }

  getState(): TransactionState {
    return this.metadata.state;
  }

  isActive(): boolean {
    return this.metadata.state === 'active';
  }

  canRollback(): boolean {
    return this.metadata.state === 'active' || this.metadata.state === 'failed';
  }

  validateOperations(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic validation
    if (this.metadata.operations.length === 0) {
      warnings.push('Transaction has no operations');
    }

    // Check for conflicting operations
    const operationsByEntity = new Map<string, StorageOperation[]>();
    
    for (const operation of this.metadata.operations) {
      const key = `${operation.collection}:${operation.id}`;
      const existing = operationsByEntity.get(key) || [];
      existing.push(operation);
      operationsByEntity.set(key, existing);
    }

    // Check for conflicts (multiple writes to same entity)
    for (const [key, ops] of operationsByEntity) {
      const writes = ops.filter(op => op.type === 'create' || op.type === 'update');
      if (writes.length > 1) {
        errors.push(`Multiple write operations for entity ${key} in single transaction`);
      }
    }

    return {
      isValid: errors.length === 0,
      error: errors.join('; ') || undefined
    };
  }

  async dryRun(): Promise<ValidationResult> {
    try {
      // Validate operations structure
      const validation = this.validateOperations();
      if (!validation.isValid) {
        return validation;
      }

      // Additional validation could include:
      // - Checking if entities exist for update/delete operations
      // - Validating data schemas
      // - Checking permissions
      // For now, return the basic validation

      return validation;
    } catch (error) {
      return {
        isValid: false,
        error: `Dry run failed: ${error instanceof Error ? error.message : error}`
      };
    }
  }

  async commit(): Promise<void> {
    if (!this.isActive()) {
      throw new Error(`Cannot commit transaction ${this.id}: transaction is ${this.metadata.state}`);
    }

    try {
      // Validate before commit if enabled
      if (this.options.validateBeforeCommit) {
        const validation = await this.dryRun();
        if (!validation.isValid) {
          this.metadata.state = 'failed';
          this.metadata.errorMessage = validation.error;
          throw new Error(`Transaction validation failed: ${validation.error}`);
        }
      }

      // Set timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Transaction timeout')), this.options.timeout);
      });

      // Execute commit with timeout
      await Promise.race([
        this.storageTransaction.commit(),
        timeoutPromise
      ]);

      this.metadata.state = 'committed';
      
      // Notify manager of completion
      this.manager.completeTransaction(this, {
        success: true,
        transactionId: this.id,
        affectedCollections: Array.from(new Set(this.metadata.operations.map(op => op.collection))),
        operationCount: this.metadata.operations.length
      });
      
      if (this.options.enableLogging) {
        console.log(`Transaction ${this.id} committed successfully with ${this.metadata.operations.length} operations`);
      }
    } catch (error) {
      this.metadata.state = 'failed';
      this.metadata.errorMessage = error instanceof Error ? error.message : String(error);
      
      // Notify manager of failure
      this.manager.completeTransaction(this, {
        success: false,
        transactionId: this.id,
        affectedCollections: Array.from(new Set(this.metadata.operations.map(op => op.collection))),
        operationCount: this.metadata.operations.length,
        error: this.metadata.errorMessage
      });
      
      if (this.options.enableLogging) {
        console.error(`Transaction ${this.id} commit failed:`, error);
      }
      
      throw error;
    }
  }

  async rollback(): Promise<void> {
    if (!this.canRollback()) {
      throw new Error(`Cannot rollback transaction ${this.id}: transaction is ${this.metadata.state}`);
    }

    try {
      await this.storageTransaction.rollback();
      this.metadata.state = 'rolled_back';
      
      // Notify manager of rollback
      this.manager.completeTransaction(this, {
        success: false,
        transactionId: this.id,
        affectedCollections: Array.from(new Set(this.metadata.operations.map(op => op.collection))),
        operationCount: this.metadata.operations.length,
        error: 'Transaction rolled back'
      });
      
      if (this.options.enableLogging) {
        console.log(`Transaction ${this.id} rolled back successfully`);
      }
    } catch (error) {
      this.metadata.state = 'failed';
      this.metadata.errorMessage = error instanceof Error ? error.message : String(error);
      
      // Notify manager of failure
      this.manager.completeTransaction(this, {
        success: false,
        transactionId: this.id,
        affectedCollections: Array.from(new Set(this.metadata.operations.map(op => op.collection))),
        operationCount: this.metadata.operations.length,
        error: this.metadata.errorMessage
      });
      
      if (this.options.enableLogging) {
        console.error(`Transaction ${this.id} rollback failed:`, error);
      }
      
      throw error;
    }
  }

  private createRollbackOperation(operation: StorageOperation): StorageOperation {
    switch (operation.type) {
      case 'create':
        return {
          type: 'delete',
          collection: operation.collection,
          id: operation.id
        };
      case 'update':
        // For updates, we'd need to store the original data
        // This is a simplified implementation
        return {
          type: 'update',
          collection: operation.collection,
          id: operation.id,
          data: undefined // Would need original data here
        };
      case 'delete':
        return {
          type: 'create',
          collection: operation.collection,
          id: operation.id,
          data: operation.data // Would need original data here
        };
      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }
  }
}

// Utility functions for common transaction patterns
export async function withTransaction<T>(
  manager: TransactionManager,
  operation: (transaction: EnhancedTransaction) => Promise<T>,
  options?: Partial<TransactionOptions>
): Promise<TransactionResult<T>> {
  const startTime = Date.now();
  let transaction: EnhancedTransaction | undefined;
  
  try {
    transaction = await manager.beginTransaction(options);
    const result = await operation(transaction);
    
    await transaction.commit();
    
    return {
      success: true,
      transactionId: transaction.id,
      data: result,
      affectedCollections: Array.from(new Set(transaction.operations.map(op => op.collection))),
      operationCount: transaction.operations.length,
      duration: Date.now() - startTime
    };
  } catch (error) {
    if (transaction) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error('Rollback failed:', rollbackError);
      }
    }
    
    return {
      success: false,
      transactionId: transaction?.id || 'unknown',
      affectedCollections: transaction?.operations ? Array.from(new Set(transaction.operations.map(op => op.collection))) : [],
      operationCount: transaction?.operations?.length || 0,
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// Bulk operation helpers
export async function bulkCreate<T extends BaseEntity>(
  transaction: EnhancedTransaction,
  collection: string,
  entities: T[]
): Promise<void> {
  const operations: StorageOperation[] = entities.map(entity => ({
    type: 'create',
    collection,
    id: entity.id,
    data: entity
  }));
  
  transaction.addOperations(operations);
}

export async function bulkUpdate<T extends BaseEntity>(
  transaction: EnhancedTransaction,
  collection: string,
  updates: Array<{ id: string; data: Partial<T> }>
): Promise<void> {
  const operations: StorageOperation[] = updates.map(update => ({
    type: 'update',
    collection,
    id: update.id,
    data: update.data
  }));
  
  transaction.addOperations(operations);
}

export async function bulkDelete(
  transaction: EnhancedTransaction,
  collection: string,
  ids: string[]
): Promise<void> {
  const operations: StorageOperation[] = ids.map(id => ({
    type: 'delete',
    collection,
    id
  }));
  
  transaction.addOperations(operations);
}
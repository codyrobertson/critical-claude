/**
 * Storage Architecture - Standardized Collection Patterns
 * 
 * Unified storage abstraction to resolve inconsistent storage patterns
 * across collections (individual files vs unified files).
 */

import { BaseEntity, ValidationResult } from './domain-types';

// Storage strategy enumeration
export type StorageStrategy = 'individual' | 'unified';

// Collection configuration interface
export interface CollectionConfig<T extends BaseEntity> {
  name: string;
  storageStrategy: StorageStrategy;
  indexFields: (keyof T)[];
  validator?: (item: unknown) => ValidationResult;
  defaultSort?: keyof T;
  maxItems?: number;
}

// Query filter interface
export interface QueryFilter<T> {
  where?: Partial<T>;
  orderBy?: keyof T;
  order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

// Storage operation interface
export interface StorageOperation {
  type: 'create' | 'update' | 'delete';
  collection: string;
  id: string;
  data?: unknown;
}

// Transaction interface for atomic operations
export interface StorageTransaction {
  operations: StorageOperation[];
  rollback(): Promise<void>;
  commit(): Promise<void>;
}

// Unified storage engine interface
export interface StorageEngine {
  // Basic CRUD operations
  save<T extends BaseEntity>(collection: string, id: string, data: T): Promise<void>;
  findById<T extends BaseEntity>(collection: string, id: string): Promise<T | null>;
  findAll<T extends BaseEntity>(collection: string): Promise<T[]>;
  query<T extends BaseEntity>(collection: string, filter: QueryFilter<T>): Promise<T[]>;
  delete(collection: string, id: string): Promise<boolean>;
  
  // Collection management
  listCollections(): Promise<string[]>;
  getCollectionSize(collection: string): Promise<number>;
  clearCollection(collection: string): Promise<void>;
  
  // Indexing support
  createIndex<T>(collection: string, field: keyof T): Promise<void>;
  dropIndex<T>(collection: string, field: keyof T): Promise<void>;
  
  // Transaction support
  beginTransaction(): Promise<StorageTransaction>;
  
  // Validation and consistency
  validateCollection<T extends BaseEntity>(collection: string): Promise<ValidationResult>;
  repairCollection(collection: string): Promise<number>;
  
  // Performance and monitoring
  getStats(collection?: string): Promise<StorageStats>;
  optimize(collection?: string): Promise<void>;
}

// Storage statistics interface
export interface StorageStats {
  collections: {
    [collectionName: string]: {
      itemCount: number;
      totalSize: number;
      lastModified: string;
      strategy: StorageStrategy;
      indexes: string[];
    };
  };
  totalSize: number;
  totalItems: number;
  operationCount: number;
  averageOperationTime: number;
}

// Collection registry for managing different entity types
export class CollectionRegistry {
  private collections = new Map<string, CollectionConfig<any>>();

  register<T extends BaseEntity>(config: CollectionConfig<T>): void {
    this.collections.set(config.name, config);
  }

  get<T extends BaseEntity>(name: string): CollectionConfig<T> | undefined {
    return this.collections.get(name);
  }

  getAll(): CollectionConfig<any>[] {
    return Array.from(this.collections.values());
  }

  getByStrategy(strategy: StorageStrategy): CollectionConfig<any>[] {
    return this.getAll().filter(config => config.storageStrategy === strategy);
  }
}

// Default collection configurations
export const DEFAULT_COLLECTIONS: CollectionConfig<any>[] = [
  {
    name: 'tasks',
    storageStrategy: 'individual',
    indexFields: ['status', 'priority', 'assignee'],
    defaultSort: 'createdAt',
    maxItems: 10000
  },
  {
    name: 'templates',
    storageStrategy: 'unified',
    indexFields: ['name', 'category'],
    defaultSort: 'name',
    maxItems: 1000
  },
  {
    name: 'analytics',
    storageStrategy: 'unified',
    indexFields: ['timestamp', 'type'],
    defaultSort: 'timestamp',
    maxItems: 50000
  },
  {
    name: 'research',
    storageStrategy: 'individual',
    indexFields: ['status', 'type'],
    defaultSort: 'createdAt',
    maxItems: 5000
  }
];

// Storage adapter interface for migrating between strategies
export interface StorageAdapter<T extends BaseEntity> {
  fromIndividual(items: Map<string, T>): Promise<T[]>;
  toIndividual(items: T[]): Promise<Map<string, T>>;
  fromUnified(data: T[]): Promise<T[]>;
  toUnified(items: Map<string, T>): Promise<T[]>;
}

// Migration interface for evolving storage patterns
export interface StorageMigration {
  version: number;
  description: string;
  up(engine: StorageEngine): Promise<void>;
  down(engine: StorageEngine): Promise<void>;
}

// Storage events for monitoring and hooks
export interface StorageEvent {
  type: 'create' | 'update' | 'delete' | 'query' | 'error';
  collection: string;
  id?: string;
  timestamp: string;
  duration?: number;
  error?: string;
}

export type StorageEventHandler = (event: StorageEvent) => void;

// Enhanced storage engine with events and middleware
export interface EnhancedStorageEngine extends StorageEngine {
  // Event handling
  on(eventType: StorageEvent['type'], handler: StorageEventHandler): void;
  off(eventType: StorageEvent['type'], handler: StorageEventHandler): void;
  emit(event: StorageEvent): void;
  
  // Middleware support
  use(middleware: StorageMiddleware): void;
  
  // Configuration
  configure(options: StorageConfiguration): void;
  getConfiguration(): StorageConfiguration;
}

// Storage middleware interface
export interface StorageMiddleware {
  before?(operation: StorageOperation): Promise<StorageOperation>;
  after?(operation: StorageOperation, result: any): Promise<any>;
  error?(operation: StorageOperation, error: Error): Promise<void>;
}

// Storage configuration interface
export interface StorageConfiguration {
  basePath: string;
  enableCaching: boolean;
  cacheSize: number;
  enableCompression: boolean;
  backupEnabled: boolean;
  backupInterval: number;
  maxBackups: number;
  enableValidation: boolean;
  enableEvents: boolean;
  performanceLogging: boolean;
}

// Default storage configuration
export const DEFAULT_STORAGE_CONFIG: StorageConfiguration = {
  basePath: process.env.CRITICAL_CLAUDE_DATA_PATH || '~/.critical-claude',
  enableCaching: true,
  cacheSize: 1000,
  enableCompression: false,
  backupEnabled: true,
  backupInterval: 24 * 60 * 60 * 1000, // 24 hours
  maxBackups: 7,
  enableValidation: true,
  enableEvents: true,
  performanceLogging: false
};

// Storage health check interface
export interface StorageHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  issues: string[];
  lastCheck: string;
  collections: {
    [name: string]: {
      status: 'ok' | 'warning' | 'error';
      message?: string;
    };
  };
}

// Storage backup interface
export interface StorageBackup {
  create(collections?: string[]): Promise<string>;
  restore(backupPath: string): Promise<void>;
  list(): Promise<Array<{
    path: string;
    timestamp: string;
    size: number;
    collections: string[];
  }>>;
  cleanup(keepCount?: number): Promise<number>;
}

// Query builder for complex queries
export class QueryBuilder<T extends BaseEntity> {
  private filter: QueryFilter<T> = {};

  where(field: keyof T, value: any): QueryBuilder<T> {
    if (!this.filter.where) this.filter.where = {};
    this.filter.where[field] = value;
    return this;
  }

  orderBy(field: keyof T, order: 'asc' | 'desc' = 'asc'): QueryBuilder<T> {
    this.filter.orderBy = field;
    this.filter.order = order;
    return this;
  }

  limit(count: number): QueryBuilder<T> {
    this.filter.limit = count;
    return this;
  }

  offset(count: number): QueryBuilder<T> {
    this.filter.offset = count;
    return this;
  }

  build(): QueryFilter<T> {
    return { ...this.filter };
  }
}

// Utility functions for storage operations
export function createQuery<T extends BaseEntity>(): QueryBuilder<T> {
  return new QueryBuilder<T>();
}

export function isValidStorageStrategy(strategy: string): strategy is StorageStrategy {
  return strategy === 'individual' || strategy === 'unified';
}

export function getOptimalStrategy(itemCount: number, itemSize: number): StorageStrategy {
  // Use individual files for large collections with frequent updates
  // Use unified files for small collections with infrequent updates
  if (itemCount >= 1000 || itemSize >= 10000) {
    return 'individual';
  }
  return 'unified';
}
/**
 * Common Types - Shared Kernel
 * Essential shared types used across domains
 */

// Import canonical domain types
export * from './domain-types';

// Simple Result Pattern
export interface Result<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Simple Repository Interface
export interface Repository<T> {
  findById(id: string): Promise<T | null>;
  findAll(): Promise<T[]>;
  save(entity: T): Promise<void>;
  delete(id: string): Promise<boolean>;
}

// Basic Logger Interface
export interface Logger {
  debug(message: string): void;
  info(message: string): void;
  warn(message: string): void;
  error(message: string, error?: Error): void;
}
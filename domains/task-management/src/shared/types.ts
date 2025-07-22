/**
 * Local Types for Task Management Domain
 * Copied from shared common-types to avoid cross-domain dependencies
 */

// Simple Result Pattern
export interface Result<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Common Types
export type Priority = 'critical' | 'high' | 'medium' | 'low';
export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'blocked' | 'archived';

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
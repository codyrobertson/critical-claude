/**
 * Canonical Domain Types - Single Source of Truth
 * 
 * This file contains the authoritative type definitions for the entire application.
 * All other modules should import from this file to ensure consistency.
 */

// Priority Types - Canonical Definition
export const PRIORITIES = ['critical', 'high', 'medium', 'low'] as const;
export type Priority = typeof PRIORITIES[number];

// Task Status Types - Canonical Definition
export const TASK_STATUSES = ['todo', 'in_progress', 'done', 'blocked', 'archived'] as const;
export type TaskStatus = typeof TASK_STATUSES[number];

// Type Guards for Runtime Validation
export const isPriority = (value: string): value is Priority => 
  PRIORITIES.includes(value as Priority);

export const isTaskStatus = (value: string): value is TaskStatus => 
  TASK_STATUSES.includes(value as TaskStatus);

// Default Values
export const DEFAULT_PRIORITY: Priority = 'medium';
export const DEFAULT_TASK_STATUS: TaskStatus = 'todo';

// Validation Functions
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export const validatePriority = (value: unknown): ValidationResult => {
  if (typeof value !== 'string') {
    return { isValid: false, error: 'Priority must be a string' };
  }
  if (!isPriority(value)) {
    return { 
      isValid: false, 
      error: `Invalid priority: ${value}. Must be one of: ${PRIORITIES.join(', ')}` 
    };
  }
  return { isValid: true };
};

export const validateTaskStatus = (value: unknown): ValidationResult => {
  if (typeof value !== 'string') {
    return { isValid: false, error: 'Task status must be a string' };
  }
  if (!isTaskStatus(value)) {
    return { 
      isValid: false, 
      error: `Invalid task status: ${value}. Must be one of: ${TASK_STATUSES.join(', ')}` 
    };
  }
  return { isValid: true };
};

// Common ID types
export type TaskId = string;
export type TemplateId = string;
export type ResearchId = string;
export type AnalyticsId = string;

// Timestamp type for consistency
export type Timestamp = string; // ISO 8601 format

// Base entity interface
export interface BaseEntity {
  id: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Entity Reference for cross-domain relationships
export interface EntityReference {
  entityType: 'task' | 'template' | 'research' | 'analytics';
  entityId: string;
  relationshipType: 'created_by' | 'depends_on' | 'derived_from' | 'relates_to';
}
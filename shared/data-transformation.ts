/**
 * Data Transformation Layer - Clear Data Boundaries
 * 
 * Provides transformation utilities for converting between different data representations
 * (API models, storage entities, domain objects) with type safety and validation.
 */

import { BaseEntity, Priority, TaskStatus, ValidationResult } from './domain-types';
import { validateTaskData, sanitizeTaskData, ValidationReport } from './input-validation';

// API Data Transfer Objects (DTOs)
export interface TaskDTO {
  id?: string;
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  labels?: string[];
  assignee?: string;
  estimatedHours?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface TaskCreateDTO {
  title: string;
  description?: string;
  priority?: string;
  labels?: string[];
  assignee?: string;
  estimatedHours?: number;
}

export interface TaskUpdateDTO {
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  labels?: string[];
  assignee?: string;
  estimatedHours?: number;
}

// Domain Entities (internal representation)
export interface TaskEntity extends BaseEntity {
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  labels: string[];
  assignee?: string;
  estimatedHours?: number;
}

// Storage Models (persistence layer)
export interface TaskStorageModel {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  labels: string;  // JSON stringified array
  assignee?: string;
  estimatedHours?: number;
  createdAt: string;
  updatedAt: string;
  version?: number;  // For optimistic locking
}

// Transformation Results
export interface TransformationResult<T> {
  success: boolean;
  data?: T;
  errors?: string[];
  warnings?: string[];
}

// Data Transformer Interface
export interface DataTransformer<From, To> {
  transform(input: From): TransformationResult<To>;
  canTransform(input: unknown): boolean;
}

/**
 * DTO to Domain Entity Transformers
 */
export class TaskDTOToDomainTransformer implements DataTransformer<TaskDTO, TaskEntity> {
  transform(dto: TaskDTO): TransformationResult<TaskEntity> {
    try {
      // Sanitize and validate input
      const sanitized = sanitizeTaskData(dto);
      if (!sanitized) {
        return {
          success: false,
          errors: ['Invalid task data format']
        };
      }

      const validation = validateTaskData(sanitized);
      if (!validation.isValid) {
        return {
          success: false,
          errors: validation.errors.map(e => e.error || 'Validation error'),
          warnings: validation.warnings.map(w => w.error || 'Warning')
        };
      }

      // Transform to domain entity with defaults
      const now = new Date().toISOString();
      const entity: TaskEntity = {
        id: dto.id || this.generateId(),
        title: sanitized.title!,
        description: sanitized.description || '',
        status: (sanitized.status as TaskStatus) || 'todo',
        priority: (sanitized.priority as Priority) || 'medium',
        labels: sanitized.labels || [],
        assignee: sanitized.assignee,
        estimatedHours: sanitized.estimatedHours,
        createdAt: dto.createdAt || now,
        updatedAt: dto.updatedAt || now
      };

      return {
        success: true,
        data: entity,
        warnings: validation.warnings.map(w => w.error || 'Warning')
      };
    } catch (error) {
      return {
        success: false,
        errors: [`Transformation failed: ${error instanceof Error ? error.message : error}`]
      };
    }
  }

  canTransform(input: unknown): boolean {
    return typeof input === 'object' && input !== null && 'title' in input;
  }

  private generateId(): string {
    return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Domain Entity to Storage Model Transformers
 */
export class TaskDomainToStorageTransformer implements DataTransformer<TaskEntity, TaskStorageModel> {
  transform(entity: TaskEntity): TransformationResult<TaskStorageModel> {
    try {
      const storageModel: TaskStorageModel = {
        id: entity.id,
        title: entity.title,
        description: entity.description,
        status: entity.status,
        priority: entity.priority,
        labels: JSON.stringify(entity.labels),
        assignee: entity.assignee,
        estimatedHours: entity.estimatedHours,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
        version: 1  // Start with version 1
      };

      return {
        success: true,
        data: storageModel
      };
    } catch (error) {
      return {
        success: false,
        errors: [`Storage transformation failed: ${error instanceof Error ? error.message : error}`]
      };
    }
  }

  canTransform(input: unknown): boolean {
    return typeof input === 'object' && input !== null && 
           'id' in input && 'title' in input && 'status' in input;
  }
}

/**
 * Storage Model to Domain Entity Transformers
 */
export class TaskStorageToDomainTransformer implements DataTransformer<TaskStorageModel, TaskEntity> {
  transform(storage: TaskStorageModel): TransformationResult<TaskEntity> {
    try {
      let labels: string[] = [];
      
      // Parse labels JSON safely
      if (storage.labels) {
        try {
          labels = JSON.parse(storage.labels);
          if (!Array.isArray(labels)) {
            labels = [];
          }
        } catch {
          // If JSON parsing fails, treat as empty array
          labels = [];
        }
      }

      const entity: TaskEntity = {
        id: storage.id,
        title: storage.title,
        description: storage.description,
        status: storage.status as TaskStatus,
        priority: storage.priority as Priority,
        labels,
        assignee: storage.assignee,
        estimatedHours: storage.estimatedHours,
        createdAt: storage.createdAt,
        updatedAt: storage.updatedAt
      };

      // Validate the resulting entity
      const validation = validateTaskData(entity);
      if (!validation.isValid) {
        return {
          success: false,
          errors: validation.errors.map(e => e.error || 'Validation error'),
          warnings: validation.warnings.map(w => w.error || 'Warning')
        };
      }

      return {
        success: true,
        data: entity,
        warnings: validation.warnings.map(w => w.error || 'Warning')
      };
    } catch (error) {
      return {
        success: false,
        errors: [`Domain transformation failed: ${error instanceof Error ? error.message : error}`]
      };
    }
  }

  canTransform(input: unknown): boolean {
    return typeof input === 'object' && input !== null && 
           'id' in input && 'title' in input && 'labels' in input;
  }
}

/**
 * Domain Entity to DTO Transformers
 */
export class TaskDomainToDTOTransformer implements DataTransformer<TaskEntity, TaskDTO> {
  transform(entity: TaskEntity): TransformationResult<TaskDTO> {
    try {
      // Validate the entity before transformation
      const validation = validateTaskData(entity);
      if (!validation.isValid) {
        return {
          success: false,
          errors: validation.errors.map(e => e.error || 'Validation error'),
          warnings: validation.warnings.map(w => w.error || 'Warning')
        };
      }

      const dto: TaskDTO = {
        id: entity.id,
        title: entity.title,
        description: entity.description,
        status: entity.status,
        priority: entity.priority,
        labels: [...entity.labels], // Create copy to prevent mutation
        assignee: entity.assignee,
        estimatedHours: entity.estimatedHours,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt
      };

      return {
        success: true,
        data: dto,
        warnings: validation.warnings.map(w => w.error || 'Warning')
      };
    } catch (error) {
      return {
        success: false,
        errors: [`DTO transformation failed: ${error instanceof Error ? error.message : error}`]
      };
    }
  }

  canTransform(input: unknown): boolean {
    return typeof input === 'object' && input !== null && 
           'id' in input && 'title' in input && 'status' in input;
  }
}

/**
 * Transformation Pipeline for chaining transformers
 */
export class TransformationPipeline<T> {
  private transformers: Array<DataTransformer<any, any>> = [];

  add<U>(transformer: DataTransformer<T, U>): TransformationPipeline<U> {
    this.transformers.push(transformer);
    return this as any;
  }

  execute(input: any): TransformationResult<T> {
    let current = input;
    const allWarnings: string[] = [];

    for (const transformer of this.transformers) {
      if (!transformer.canTransform(current)) {
        return {
          success: false,
          errors: [`Transformer cannot handle input type`]
        };
      }

      const result = transformer.transform(current);
      if (!result.success) {
        return result;
      }

      current = result.data;
      if (result.warnings) {
        allWarnings.push(...result.warnings);
      }
    }

    return {
      success: true,
      data: current,
      warnings: allWarnings.length > 0 ? allWarnings : undefined
    };
  }
}

/**
 * Factory for creating common transformation pipelines
 */
export class TransformationFactory {
  // API → Domain → Storage
  static createApiToStoragePipeline(): TransformationPipeline<TaskStorageModel> {
    return new TransformationPipeline<TaskDTO>()
      .add(new TaskDTOToDomainTransformer())
      .add(new TaskDomainToStorageTransformer());
  }

  // Storage → Domain → API
  static createStorageToApiPipeline(): TransformationPipeline<TaskDTO> {
    return new TransformationPipeline<TaskStorageModel>()
      .add(new TaskStorageToDomainTransformer())
      .add(new TaskDomainToDTOTransformer());
  }

  // API → Domain (for business logic)
  static createApiToDomainPipeline(): TransformationPipeline<TaskEntity> {
    return new TransformationPipeline<TaskDTO>()
      .add(new TaskDTOToDomainTransformer());
  }

  // Domain → API (for responses)
  static createDomainToApiPipeline(): TransformationPipeline<TaskDTO> {
    return new TransformationPipeline<TaskEntity>()
      .add(new TaskDomainToDTOTransformer());
  }
}

/**
 * Utility functions for common transformations
 */
export function transformTaskForApi(entity: TaskEntity): TaskDTO {
  const transformer = new TaskDomainToDTOTransformer();
  const result = transformer.transform(entity);
  
  if (!result.success) {
    throw new Error(`Failed to transform task for API: ${result.errors?.join(', ')}`);
  }
  
  return result.data!;
}

export function transformTaskForStorage(dto: TaskDTO): TaskStorageModel {
  const pipeline = TransformationFactory.createApiToStoragePipeline();
  const result = pipeline.execute(dto);
  
  if (!result.success) {
    throw new Error(`Failed to transform task for storage: ${result.errors?.join(', ')}`);
  }
  
  return result.data!;
}

export function transformTaskFromStorage(storage: TaskStorageModel): TaskEntity {
  const transformer = new TaskStorageToDomainTransformer();
  const result = transformer.transform(storage);
  
  if (!result.success) {
    throw new Error(`Failed to transform task from storage: ${result.errors?.join(', ')}`);
  }
  
  return result.data!;
}

/**
 * Batch transformation utilities
 */
export function transformTaskCollectionForApi(entities: TaskEntity[]): TaskDTO[] {
  const transformer = new TaskDomainToDTOTransformer();
  const results: TaskDTO[] = [];
  const errors: string[] = [];

  for (const entity of entities) {
    const result = transformer.transform(entity);
    if (result.success && result.data) {
      results.push(result.data);
    } else {
      errors.push(`Failed to transform task ${entity.id}: ${result.errors?.join(', ')}`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`Batch transformation errors: ${errors.join('; ')}`);
  }

  return results;
}

export function transformTaskCollectionFromStorage(storageModels: TaskStorageModel[]): TaskEntity[] {
  const transformer = new TaskStorageToDomainTransformer();
  const results: TaskEntity[] = [];
  const errors: string[] = [];

  for (const model of storageModels) {
    const result = transformer.transform(model);
    if (result.success && result.data) {
      results.push(result.data);
    } else {
      errors.push(`Failed to transform stored task ${model.id}: ${result.errors?.join(', ')}`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`Batch transformation errors: ${errors.join('; ')}`);
  }

  return results;
}

// Type guards for runtime type checking
export function isTaskDTO(input: unknown): input is TaskDTO {
  return typeof input === 'object' && input !== null && 'title' in input;
}

export function isTaskEntity(input: unknown): input is TaskEntity {
  return typeof input === 'object' && input !== null && 
         'id' in input && 'title' in input && 'status' in input && 'createdAt' in input;
}

export function isTaskStorageModel(input: unknown): input is TaskStorageModel {
  return typeof input === 'object' && input !== null && 
         'id' in input && 'title' in input && 'labels' in input && typeof (input as any).labels === 'string';
}
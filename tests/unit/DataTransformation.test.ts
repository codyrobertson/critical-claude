/**
 * Data Transformation Layer Tests
 * Test the transformation utilities for converting between data representations
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  TaskDTO,
  TaskEntity,
  TaskStorageModel,
  TaskDTOToDomainTransformer,
  TaskDomainToStorageTransformer,
  TaskStorageToDomainTransformer,
  TaskDomainToDTOTransformer,
  TransformationPipeline,
  TransformationFactory,
  transformTaskForApi,
  transformTaskForStorage,
  transformTaskFromStorage,
  transformTaskCollectionForApi,
  transformTaskCollectionFromStorage,
  isTaskDTO,
  isTaskEntity,
  isTaskStorageModel
} from '../../shared/data-transformation';

describe('Data Transformation Layer', () => {
  const sampleTaskDTO: TaskDTO = {
    id: 'test-task-123',
    title: 'Test Task',
    description: 'A test task for transformation',
    status: 'todo',
    priority: 'high',
    labels: ['test', 'transformation'],
    assignee: 'test@example.com',
    estimatedHours: 5,
    createdAt: '2025-01-01T10:00:00.000Z',
    updatedAt: '2025-01-01T10:00:00.000Z'
  };

  const sampleTaskEntity: TaskEntity = {
    id: 'test-task-123',
    title: 'Test Task',
    description: 'A test task for transformation',
    status: 'todo',
    priority: 'high',
    labels: ['test', 'transformation'],
    assignee: 'test@example.com',
    estimatedHours: 5,
    createdAt: '2025-01-01T10:00:00.000Z',
    updatedAt: '2025-01-01T10:00:00.000Z'
  };

  const sampleStorageModel: TaskStorageModel = {
    id: 'test-task-123',
    title: 'Test Task',
    description: 'A test task for transformation',
    status: 'todo',
    priority: 'high',
    labels: '["test","transformation"]',
    assignee: 'test@example.com',
    estimatedHours: 5,
    createdAt: '2025-01-01T10:00:00.000Z',
    updatedAt: '2025-01-01T10:00:00.000Z',
    version: 1
  };

  describe('TaskDTOToDomainTransformer', () => {
    let transformer: TaskDTOToDomainTransformer;

    beforeEach(() => {
      transformer = new TaskDTOToDomainTransformer();
    });

    it('should transform valid DTO to domain entity', () => {
      const result = transformer.transform(sampleTaskDTO);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.id).toBe(sampleTaskDTO.id);
      expect(result.data!.title).toBe(sampleTaskDTO.title);
      expect(result.data!.status).toBe('todo');
      expect(result.data!.priority).toBe('high');
      expect(result.data!.labels).toEqual(['test', 'transformation']);
    });

    it('should generate ID when not provided', () => {
      const dtoWithoutId = { ...sampleTaskDTO };
      delete dtoWithoutId.id;

      const result = transformer.transform(dtoWithoutId);

      expect(result.success).toBe(true);
      expect(result.data!.id).toMatch(/^task-\d+-[a-z0-9]+$/);
    });

    it('should apply defaults for optional fields', () => {
      const minimalDTO: TaskDTO = {
        title: 'Minimal Task'
      };

      const result = transformer.transform(minimalDTO);

      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('todo');
      expect(result.data!.priority).toBe('medium');
      expect(result.data!.labels).toEqual([]);
      expect(result.data!.description).toBe('');
    });

    it('should reject invalid data', () => {
      const invalidDTO = {
        title: '', // Empty title
        status: 'invalid-status',
        priority: 'invalid-priority'
      };

      const result = transformer.transform(invalidDTO);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
    });

    it('should validate input type', () => {
      expect(transformer.canTransform(sampleTaskDTO)).toBe(true);
      expect(transformer.canTransform({ title: 'Valid' })).toBe(true);
      expect(transformer.canTransform({})).toBe(false);
      expect(transformer.canTransform(null)).toBe(false);
      expect(transformer.canTransform('string')).toBe(false);
    });
  });

  describe('TaskDomainToStorageTransformer', () => {
    let transformer: TaskDomainToStorageTransformer;

    beforeEach(() => {
      transformer = new TaskDomainToStorageTransformer();
    });

    it('should transform domain entity to storage model', () => {
      const result = transformer.transform(sampleTaskEntity);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.id).toBe(sampleTaskEntity.id);
      expect(result.data!.title).toBe(sampleTaskEntity.title);
      expect(result.data!.labels).toBe('["test","transformation"]');
      expect(result.data!.version).toBe(1);
    });

    it('should handle empty labels array', () => {
      const entityWithoutLabels = { ...sampleTaskEntity, labels: [] };

      const result = transformer.transform(entityWithoutLabels);

      expect(result.success).toBe(true);
      expect(result.data!.labels).toBe('[]');
    });

    it('should validate input type', () => {
      expect(transformer.canTransform(sampleTaskEntity)).toBe(true);
      expect(transformer.canTransform({})).toBe(false);
      expect(transformer.canTransform(null)).toBe(false);
    });
  });

  describe('TaskStorageToDomainTransformer', () => {
    let transformer: TaskStorageToDomainTransformer;

    beforeEach(() => {
      transformer = new TaskStorageToDomainTransformer();
    });

    it('should transform storage model to domain entity', () => {
      const result = transformer.transform(sampleStorageModel);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.id).toBe(sampleStorageModel.id);
      expect(result.data!.title).toBe(sampleStorageModel.title);
      expect(result.data!.labels).toEqual(['test', 'transformation']);
    });

    it('should handle invalid labels JSON gracefully', () => {
      const invalidLabelsModel = { 
        ...sampleStorageModel, 
        labels: 'invalid-json' 
      };

      const result = transformer.transform(invalidLabelsModel);

      expect(result.success).toBe(true);
      expect(result.data!.labels).toEqual([]);
    });

    it('should handle empty labels string', () => {
      const emptyLabelsModel = { 
        ...sampleStorageModel, 
        labels: '' 
      };

      const result = transformer.transform(emptyLabelsModel);

      expect(result.success).toBe(true);
      expect(result.data!.labels).toEqual([]);
    });

    it('should validate transformed entity', () => {
      const invalidStorageModel = {
        ...sampleStorageModel,
        status: 'invalid-status'
      };

      const result = transformer.transform(invalidStorageModel);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should validate input type', () => {
      expect(transformer.canTransform(sampleStorageModel)).toBe(true);
      expect(transformer.canTransform({})).toBe(false);
      expect(transformer.canTransform(null)).toBe(false);
    });
  });

  describe('TaskDomainToDTOTransformer', () => {
    let transformer: TaskDomainToDTOTransformer;

    beforeEach(() => {
      transformer = new TaskDomainToDTOTransformer();
    });

    it('should transform domain entity to DTO', () => {
      const result = transformer.transform(sampleTaskEntity);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.id).toBe(sampleTaskEntity.id);
      expect(result.data!.title).toBe(sampleTaskEntity.title);
      expect(result.data!.labels).toEqual(['test', 'transformation']);
      // Ensure labels array is a copy
      expect(result.data!.labels).not.toBe(sampleTaskEntity.labels);
    });

    it('should validate input type', () => {
      expect(transformer.canTransform(sampleTaskEntity)).toBe(true);
      expect(transformer.canTransform({})).toBe(false);
      expect(transformer.canTransform(null)).toBe(false);
    });
  });

  describe('TransformationPipeline', () => {
    it('should chain transformations successfully', () => {
      const pipeline = new TransformationPipeline<TaskDTO>()
        .add(new TaskDTOToDomainTransformer())
        .add(new TaskDomainToStorageTransformer());

      const result = pipeline.execute(sampleTaskDTO);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.id).toBe(sampleTaskDTO.id);
      expect(result.data!.labels).toBe('["test","transformation"]');
      expect(result.data!.version).toBe(1);
    });

    it('should fail if transformer cannot handle input', () => {
      const pipeline = new TransformationPipeline<TaskDTO>()
        .add(new TaskDTOToDomainTransformer());

      const result = pipeline.execute('invalid-input');

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should accumulate warnings from transformers', () => {
      // Create DTO with warning-causing data
      const dtoWithWarnings: TaskDTO = {
        title: 'Test Task',
        assignee: 'invalid-email' // This should cause a warning
      };

      const pipeline = new TransformationPipeline<TaskDTO>()
        .add(new TaskDTOToDomainTransformer());

      const result = pipeline.execute(dtoWithWarnings);

      expect(result.success).toBe(true);
      expect(result.warnings).toBeDefined();
      expect(result.warnings!.length).toBeGreaterThan(0);
    });
  });

  describe('TransformationFactory', () => {
    it('should create API to Storage pipeline', () => {
      const pipeline = TransformationFactory.createApiToStoragePipeline();
      const result = pipeline.execute(sampleTaskDTO);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(typeof result.data!.labels).toBe('string');
    });

    it('should create Storage to API pipeline', () => {
      const pipeline = TransformationFactory.createStorageToApiPipeline();
      const result = pipeline.execute(sampleStorageModel);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data!.labels)).toBe(true);
    });

    it('should create API to Domain pipeline', () => {
      const pipeline = TransformationFactory.createApiToDomainPipeline();
      const result = pipeline.execute(sampleTaskDTO);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.status).toBe('todo');
    });

    it('should create Domain to API pipeline', () => {
      const pipeline = TransformationFactory.createDomainToApiPipeline();
      const result = pipeline.execute(sampleTaskEntity);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.id).toBe(sampleTaskEntity.id);
    });
  });

  describe('Utility Functions', () => {
    describe('transformTaskForApi', () => {
      it('should transform entity to DTO', () => {
        const dto = transformTaskForApi(sampleTaskEntity);

        expect(dto.id).toBe(sampleTaskEntity.id);
        expect(dto.title).toBe(sampleTaskEntity.title);
        expect(dto.labels).toEqual(sampleTaskEntity.labels);
      });

      it('should throw on transformation failure', () => {
        const invalidEntity = { ...sampleTaskEntity, status: 'invalid' as any };

        expect(() => transformTaskForApi(invalidEntity)).toThrow();
      });
    });

    describe('transformTaskForStorage', () => {
      it('should transform DTO to storage model', () => {
        const storage = transformTaskForStorage(sampleTaskDTO);

        expect(storage.id).toBe(sampleTaskDTO.id);
        expect(storage.title).toBe(sampleTaskDTO.title);
        expect(storage.labels).toBe('["test","transformation"]');
        expect(storage.version).toBe(1);
      });

      it('should throw on transformation failure', () => {
        const invalidDTO = { title: '' }; // Empty title

        expect(() => transformTaskForStorage(invalidDTO)).toThrow();
      });
    });

    describe('transformTaskFromStorage', () => {
      it('should transform storage model to entity', () => {
        const entity = transformTaskFromStorage(sampleStorageModel);

        expect(entity.id).toBe(sampleStorageModel.id);
        expect(entity.title).toBe(sampleStorageModel.title);
        expect(entity.labels).toEqual(['test', 'transformation']);
      });

      it('should throw on transformation failure', () => {
        const invalidStorage = { ...sampleStorageModel, status: 'invalid' };

        expect(() => transformTaskFromStorage(invalidStorage)).toThrow();
      });
    });

    describe('transformTaskCollectionForApi', () => {
      it('should transform array of entities to DTOs', () => {
        const entities = [sampleTaskEntity, { ...sampleTaskEntity, id: 'task-2' }];
        const dtos = transformTaskCollectionForApi(entities);

        expect(dtos).toHaveLength(2);
        expect(dtos[0].id).toBe(sampleTaskEntity.id);
        expect(dtos[1].id).toBe('task-2');
      });

      it('should throw if any transformation fails', () => {
        const entities = [
          sampleTaskEntity, 
          { ...sampleTaskEntity, id: 'task-2', status: 'invalid' as any }
        ];

        expect(() => transformTaskCollectionForApi(entities)).toThrow();
      });
    });

    describe('transformTaskCollectionFromStorage', () => {
      it('should transform array of storage models to entities', () => {
        const storageModels = [sampleStorageModel, { ...sampleStorageModel, id: 'task-2' }];
        const entities = transformTaskCollectionFromStorage(storageModels);

        expect(entities).toHaveLength(2);
        expect(entities[0].id).toBe(sampleStorageModel.id);
        expect(entities[1].id).toBe('task-2');
      });

      it('should throw if any transformation fails', () => {
        const storageModels = [
          sampleStorageModel, 
          { ...sampleStorageModel, id: 'task-2', status: 'invalid' }
        ];

        expect(() => transformTaskCollectionFromStorage(storageModels)).toThrow();
      });
    });
  });

  describe('Type Guards', () => {
    describe('isTaskDTO', () => {
      it('should identify valid DTOs', () => {
        expect(isTaskDTO(sampleTaskDTO)).toBe(true);
        expect(isTaskDTO({ title: 'Test' })).toBe(true);
      });

      it('should reject invalid inputs', () => {
        expect(isTaskDTO({})).toBe(false);
        expect(isTaskDTO(null)).toBe(false);
        expect(isTaskDTO('string')).toBe(false);
        expect(isTaskDTO(123)).toBe(false);
      });
    });

    describe('isTaskEntity', () => {
      it('should identify valid entities', () => {
        expect(isTaskEntity(sampleTaskEntity)).toBe(true);
      });

      it('should reject invalid inputs', () => {
        expect(isTaskEntity({})).toBe(false);
        expect(isTaskEntity({ title: 'Test' })).toBe(false); // Missing required fields
        expect(isTaskEntity(null)).toBe(false);
        expect(isTaskEntity('string')).toBe(false);
      });
    });

    describe('isTaskStorageModel', () => {
      it('should identify valid storage models', () => {
        expect(isTaskStorageModel(sampleStorageModel)).toBe(true);
      });

      it('should reject invalid inputs', () => {
        expect(isTaskStorageModel({})).toBe(false);
        expect(isTaskStorageModel({ id: 'test', title: 'Test' })).toBe(false); // Missing labels
        expect(isTaskStorageModel({ ...sampleStorageModel, labels: ['array'] })).toBe(false); // labels should be string
        expect(isTaskStorageModel(null)).toBe(false);
        expect(isTaskStorageModel('string')).toBe(false);
      });
    });
  });

  describe('End-to-End Transformation', () => {
    it('should maintain data integrity through full transformation cycle', () => {
      // DTO → Entity → Storage → Entity → DTO
      const originalDTO = sampleTaskDTO;

      // Transform to entity
      const entityTransformer = new TaskDTOToDomainTransformer();
      const entityResult = entityTransformer.transform(originalDTO);
      expect(entityResult.success).toBe(true);
      const entity = entityResult.data!;

      // Transform to storage
      const storageTransformer = new TaskDomainToStorageTransformer();
      const storageResult = storageTransformer.transform(entity);
      expect(storageResult.success).toBe(true);
      const storage = storageResult.data!;

      // Transform back to entity
      const backToEntityTransformer = new TaskStorageToDomainTransformer();
      const backToEntityResult = backToEntityTransformer.transform(storage);
      expect(backToEntityResult.success).toBe(true);
      const entityRestored = backToEntityResult.data!;

      // Transform back to DTO
      const dtoTransformer = new TaskDomainToDTOTransformer();
      const dtoResult = dtoTransformer.transform(entityRestored);
      expect(dtoResult.success).toBe(true);
      const finalDTO = dtoResult.data!;

      // Verify data integrity
      expect(finalDTO.id).toBe(originalDTO.id);
      expect(finalDTO.title).toBe(originalDTO.title);
      expect(finalDTO.description).toBe(originalDTO.description);
      expect(finalDTO.status).toBe(originalDTO.status);
      expect(finalDTO.priority).toBe(originalDTO.priority);
      expect(finalDTO.labels).toEqual(originalDTO.labels);
      expect(finalDTO.assignee).toBe(originalDTO.assignee);
      expect(finalDTO.estimatedHours).toBe(originalDTO.estimatedHours);
    });
  });
});
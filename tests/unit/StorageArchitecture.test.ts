/**
 * Storage Architecture Tests
 * Test the new unified storage architecture patterns
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { 
  CollectionRegistry, 
  DEFAULT_COLLECTIONS, 
  QueryBuilder,
  createQuery,
  isValidStorageStrategy,
  getOptimalStrategy,
  StorageStrategy
} from '../../shared/storage-architecture';
import { BaseEntity } from '../../shared/domain-types';

// Test entity interface
interface TestEntity extends BaseEntity {
  name: string;
  category: string;
  value: number;
}

describe('Storage Architecture', () => {
  let registry: CollectionRegistry;

  beforeEach(() => {
    registry = new CollectionRegistry();
  });

  describe('CollectionRegistry', () => {
    it('should register and retrieve collections', () => {
      const config = {
        name: 'test',
        storageStrategy: 'individual' as StorageStrategy,
        indexFields: ['name'],
        defaultSort: 'name' as keyof TestEntity
      };

      registry.register(config);
      const retrieved = registry.get('test');

      expect(retrieved).toEqual(config);
    });

    it('should filter collections by strategy', () => {
      const individualConfig = {
        name: 'individual-test',
        storageStrategy: 'individual' as StorageStrategy,
        indexFields: ['name']
      };

      const unifiedConfig = {
        name: 'unified-test',
        storageStrategy: 'unified' as StorageStrategy,
        indexFields: ['name']
      };

      registry.register(individualConfig);
      registry.register(unifiedConfig);

      const individualCollections = registry.getByStrategy('individual');
      const unifiedCollections = registry.getByStrategy('unified');

      expect(individualCollections).toHaveLength(1);
      expect(unifiedCollections).toHaveLength(1);
      expect(individualCollections[0].name).toBe('individual-test');
      expect(unifiedCollections[0].name).toBe('unified-test');
    });

    it('should return undefined for non-existent collections', () => {
      const result = registry.get('non-existent');
      expect(result).toBeUndefined();
    });
  });

  describe('Default Collections Configuration', () => {
    it('should have valid default collections', () => {
      expect(DEFAULT_COLLECTIONS).toHaveLength(4);
      
      const taskConfig = DEFAULT_COLLECTIONS.find(c => c.name === 'tasks');
      expect(taskConfig).toBeDefined();
      expect(taskConfig?.storageStrategy).toBe('individual');
      expect(taskConfig?.indexFields).toContain('status');
      expect(taskConfig?.indexFields).toContain('priority');

      const templateConfig = DEFAULT_COLLECTIONS.find(c => c.name === 'templates');
      expect(templateConfig).toBeDefined();
      expect(templateConfig?.storageStrategy).toBe('unified');
    });

    it('should have reasonable limits for collections', () => {
      DEFAULT_COLLECTIONS.forEach(config => {
        expect(config.maxItems).toBeGreaterThan(0);
        expect(config.indexFields.length).toBeGreaterThan(0);
      });
    });
  });

  describe('QueryBuilder', () => {
    let builder: QueryBuilder<TestEntity>;

    beforeEach(() => {
      builder = new QueryBuilder<TestEntity>();
    });

    it('should build simple where queries', () => {
      const query = builder
        .where('name', 'test')
        .build();

      expect(query.where).toEqual({ name: 'test' });
    });

    it('should build complex queries with multiple conditions', () => {
      const query = builder
        .where('name', 'test')
        .where('category', 'example')
        .orderBy('value', 'desc')
        .limit(10)
        .offset(5)
        .build();

      expect(query).toEqual({
        where: { name: 'test', category: 'example' },
        orderBy: 'value',
        order: 'desc',
        limit: 10,
        offset: 5
      });
    });

    it('should default to ascending order', () => {
      const query = builder
        .orderBy('name')
        .build();

      expect(query.order).toBe('asc');
    });

    it('should support method chaining', () => {
      const result = builder
        .where('name', 'test')
        .orderBy('value')
        .limit(5);

      expect(result).toBe(builder);
    });
  });

  describe('Utility Functions', () => {
    describe('createQuery', () => {
      it('should create a new QueryBuilder instance', () => {
        const builder = createQuery<TestEntity>();
        expect(builder).toBeInstanceOf(QueryBuilder);
      });
    });

    describe('isValidStorageStrategy', () => {
      it('should validate correct storage strategies', () => {
        expect(isValidStorageStrategy('individual')).toBe(true);
        expect(isValidStorageStrategy('unified')).toBe(true);
      });

      it('should reject invalid storage strategies', () => {
        expect(isValidStorageStrategy('invalid')).toBe(false);
        expect(isValidStorageStrategy('')).toBe(false);
        expect(isValidStorageStrategy('INDIVIDUAL')).toBe(false);
      });
    });

    describe('getOptimalStrategy', () => {
      it('should recommend individual strategy for large collections', () => {
        expect(getOptimalStrategy(2000, 5000)).toBe('individual');
        expect(getOptimalStrategy(500, 15000)).toBe('individual');
      });

      it('should recommend unified strategy for small collections', () => {
        expect(getOptimalStrategy(100, 5000)).toBe('unified');
        expect(getOptimalStrategy(500, 8000)).toBe('unified');
      });

      it('should handle edge cases', () => {
        expect(getOptimalStrategy(1000, 10000)).toBe('individual');
        expect(getOptimalStrategy(999, 9999)).toBe('unified');
      });
    });
  });

  describe('Storage Strategy Selection', () => {
    it('should provide consistent strategy recommendations', () => {
      // Test scenarios based on real-world usage patterns
      const scenarios = [
        { items: 50, size: 1000, expected: 'unified', name: 'small templates' },
        { items: 5000, size: 2000, expected: 'individual', name: 'large task collection' },
        { items: 100, size: 500, expected: 'unified', name: 'configuration data' },
        { items: 1500, size: 8000, expected: 'individual', name: 'research documents' }
      ];

      scenarios.forEach(scenario => {
        const strategy = getOptimalStrategy(scenario.items, scenario.size);
        expect(strategy, `Strategy for ${scenario.name}`).toBe(scenario.expected);
      });
    });
  });
});

describe('Storage Architecture Integration', () => {
  it('should support the complete workflow', () => {
    // 1. Create registry
    const registry = new CollectionRegistry();

    // 2. Register collections
    DEFAULT_COLLECTIONS.forEach(config => {
      registry.register(config);
    });

    // 3. Verify all collections are registered
    expect(registry.getAll()).toHaveLength(4);

    // 4. Build a complex query
    const query = createQuery<TestEntity>()
      .where('category', 'important')
      .orderBy('value', 'desc')
      .limit(20)
      .build();

    expect(query).toEqual({
      where: { category: 'important' },
      orderBy: 'value',
      order: 'desc',
      limit: 20
    });

    // 5. Verify strategy filtering works
    const individualCollections = registry.getByStrategy('individual');
    const unifiedCollections = registry.getByStrategy('unified');

    expect(individualCollections.length).toBeGreaterThan(0);
    expect(unifiedCollections.length).toBeGreaterThan(0);
    expect(individualCollections.length + unifiedCollections.length).toBe(4);
  });
});
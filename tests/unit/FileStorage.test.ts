import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { FileStorage } from '../../src/storage/FileStorage.js';

// Mock fs/promises
vi.mock('fs/promises', () => ({
  mkdir: vi.fn(),
  writeFile: vi.fn(),
  readFile: vi.fn(),
  unlink: vi.fn(),
  readdir: vi.fn(),
  stat: vi.fn(),
  access: vi.fn(),
  rename: vi.fn()
}));

vi.mock('os', () => ({
  homedir: vi.fn(() => '/mock-home')
}));

// Mock ProjectDetection
vi.mock('../../src/utils/ProjectDetection.js', () => ({
  ProjectDetection: {
    getProjectStoragePath: vi.fn(() => Promise.resolve('/mock-home/.critical-claude/projects/critical_claude')),
    detectProject: vi.fn(() => Promise.resolve({
      name: 'critical_claude',
      root: '/mock-project',
      type: 'git',
      storagePrefix: 'critical_claude'
    }))
  }
}));

// Mock Logger
vi.mock('../../src/utils/Logger.js', () => ({
  logger: {
    operation: vi.fn(),
    performance: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    silentError: vi.fn()
  }
}));

const mockFs = fs as any;

describe('FileStorage', () => {
  let storage: FileStorage;
  const testStorageDir = '/mock-home/.critical-claude/projects/critical_claude';

  beforeEach(() => {
    vi.clearAllMocks();
    storage = new FileStorage();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('initialization', () => {
    it('should create storage directory on first use', async () => {
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue('{"items":[]}');
      
      await storage.save('tasks', 'test-id', { title: 'Test Task' });
      
      // Should create project directory, tasks subdirectory, and backups subdirectory
      expect(mockFs.mkdir).toHaveBeenCalledWith(
        testStorageDir,
        { recursive: true }
      );
      expect(mockFs.mkdir).toHaveBeenCalledWith(
        path.join(testStorageDir, 'tasks'),
        { recursive: true }
      );
    });
  });

  describe('save', () => {
    it('should save data to file', async () => {
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue('{"items":[]}');
      
      const testData = { id: 'test-id', title: 'Test Task' };
      
      await storage.save('tasks', 'test-id', testData);
      
      // With atomic writes, data is written to individual file (.tmp first)
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        path.join(testStorageDir, 'tasks', 'test-id.json.tmp'),
        JSON.stringify(testData, null, 2),
        'utf8'
      );
      
      // Then renamed to final location
      expect(mockFs.rename).toHaveBeenCalledWith(
        path.join(testStorageDir, 'tasks', 'test-id.json.tmp'),
        path.join(testStorageDir, 'tasks', 'test-id.json')
      );
    });

    it('should handle save errors', async () => {
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue('{"items":[]}');
      mockFs.writeFile.mockRejectedValue(new Error('Write failed'));
      
      await expect(storage.save('tasks', 'test-id', { id: 'test-id', title: 'Test' }))
        .rejects.toThrow('Write failed');
    });
  });

  describe('findById', () => {
    it('should find and return data by ID', async () => {
      const testData = { id: 'test-id', title: 'Test Task' };
      
      // Mock readdir to return file names  
      mockFs.readdir.mockResolvedValue(['test-id.json']);
      // Mock readFile to return file content
      mockFs.readFile.mockResolvedValue(JSON.stringify(testData));
      
      const result = await storage.findById('tasks', 'test-id');
      
      expect(result).toEqual(testData);
      expect(mockFs.readdir).toHaveBeenCalledWith(
        path.join(testStorageDir, 'tasks')
      );
      expect(mockFs.readFile).toHaveBeenCalledWith(
        path.join(testStorageDir, 'tasks', 'test-id.json'),
        'utf-8'
      );
    });

    it('should return null when item not found', async () => {
      mockFs.readFile.mockRejectedValue({ code: 'ENOENT' });
      
      const result = await storage.findById('tasks', 'nonexistent');
      
      expect(result).toBeNull();
    });

    it('should handle empty collection file', async () => {
      mockFs.readFile.mockRejectedValue({ code: 'ENOENT' });
      
      const result = await storage.findById('tasks', 'test-id');
      
      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all items in collection', async () => {
      const testData1 = { id: 'task-1', title: 'Task 1' };
      const testData2 = { id: 'task-2', title: 'Task 2' };
      
      // Mock readdir to return file names
      mockFs.readdir.mockResolvedValue(['task-1.json', 'task-2.json']);
      // Mock readFile to return individual file contents
      mockFs.readFile
        .mockResolvedValueOnce(JSON.stringify(testData1))
        .mockResolvedValueOnce(JSON.stringify(testData2));
      
      const result = await storage.findAll('tasks');
      
      expect(result).toHaveLength(2);
      expect(result).toContainEqual(testData1);
      expect(result).toContainEqual(testData2);
    });

    it('should handle empty collection', async () => {
      mockFs.readdir.mockResolvedValue([]);
      
      const result = await storage.findAll('tasks');
      
      expect(result).toEqual([]);
    });

    it('should handle collection file not found', async () => {
      mockFs.readdir.mockRejectedValue({ code: 'ENOENT' });
      
      const result = await storage.findAll('tasks');
      
      expect(result).toEqual([]);
    });
  });

  describe('delete', () => {
    it('should delete item by ID', async () => {
      const testData = { id: 'test-id', title: 'Test Task' };
      
      // Mock collection loading (item exists)
      mockFs.readdir.mockResolvedValue(['test-id.json']);
      mockFs.readFile.mockResolvedValue(JSON.stringify(testData));
      mockFs.unlink.mockResolvedValue(undefined);
      
      const result = await storage.delete('tasks', 'test-id');
      
      expect(result).toBe(true);
      // Should unlink the individual file
      expect(mockFs.unlink).toHaveBeenCalledWith(
        path.join(testStorageDir, 'tasks', 'test-id.json')
      );
    });

    it('should return false when item not found', async () => {
      mockFs.unlink.mockRejectedValue({ code: 'ENOENT' });
      
      const result = await storage.delete('tasks', 'nonexistent');
      
      expect(result).toBe(false);
    });
  });

  describe('caching', () => {
    it('should cache loaded collections', async () => {
      const testData = { id: 'task-1', title: 'Task 1' };
      mockFs.readdir.mockResolvedValue(['task-1.json']);
      mockFs.readFile.mockResolvedValue(JSON.stringify(testData));
      
      // First call should read from disk
      await storage.findAll('tasks');
      expect(mockFs.readdir).toHaveBeenCalledTimes(1);
      expect(mockFs.readFile).toHaveBeenCalledTimes(1);
      
      // Second call should use cache
      await storage.findAll('tasks');
      expect(mockFs.readdir).toHaveBeenCalledTimes(1); // No additional calls
      expect(mockFs.readFile).toHaveBeenCalledTimes(1); // No additional calls
    });

    it('should update cache on save', async () => {
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);
      mockFs.rename.mockResolvedValue(undefined);
      mockFs.readdir.mockResolvedValue([]);
      
      // Load collection to cache it (empty initially)
      await storage.findAll('tasks');
      expect(mockFs.readdir).toHaveBeenCalledTimes(1);
      
      // Save should update cache and write to disk
      await storage.save('tasks', 'new-task', { id: 'new-task', title: 'New Task' });
      
      // Next findAll should use updated cache
      const result = await storage.findAll('tasks');
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ id: 'new-task', title: 'New Task' });
    });
  });
});
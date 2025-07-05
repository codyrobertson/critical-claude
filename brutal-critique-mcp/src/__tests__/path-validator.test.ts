/**
 * Comprehensive tests for PathValidator
 */

import { PathValidator } from '../path-validator.js';
import fs from 'fs/promises';
import path from 'path';

// Mock fs to control test behavior
jest.mock('fs/promises');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('PathValidator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateRootPath', () => {
    it('should reject empty path', async () => {
      await expect(PathValidator.validateRootPath('')).rejects.toThrow('Root path must be a non-empty string');
    });

    it('should reject non-string path', async () => {
      await expect(PathValidator.validateRootPath(null as any)).rejects.toThrow('Root path must be a non-empty string');
    });

    it('should reject system directories', async () => {
      await expect(PathValidator.validateRootPath('/etc')).rejects.toThrow('Access denied: Cannot analyze system directory /etc');
      await expect(PathValidator.validateRootPath('/bin')).rejects.toThrow('Access denied: Cannot analyze system directory /bin');
    });

    it('should reject paths with traversal sequences', async () => {
      await expect(PathValidator.validateRootPath('/home/user/../../../etc')).rejects.toThrow('Path traversal detected');
    });

    it('should handle non-existent directory', async () => {
      mockFs.stat.mockRejectedValue({ code: 'ENOENT' });
      
      await expect(PathValidator.validateRootPath('/nonexistent')).rejects.toThrow('Directory does not exist');
    });

    it('should handle permission denied', async () => {
      mockFs.stat.mockRejectedValue({ code: 'EACCES' });
      
      await expect(PathValidator.validateRootPath('/denied')).rejects.toThrow('Permission denied');
    });

    it('should reject files (not directories)', async () => {
      mockFs.stat.mockResolvedValue({
        isDirectory: () => false
      } as any);
      
      await expect(PathValidator.validateRootPath('/some/file.txt')).rejects.toThrow('Path is not a directory');
    });

    it('should accept valid directory', async () => {
      const testPath = '/valid/project';
      mockFs.stat.mockResolvedValue({
        isDirectory: () => true
      } as any);
      
      const result = await PathValidator.validateRootPath(testPath);
      expect(result).toBe(path.resolve(testPath));
    });
  });

  describe('isSafeToRead', () => {
    it('should allow files within root directory', () => {
      const rootPath = '/project';
      const filePath = '/project/src/index.ts';
      
      expect(PathValidator.isSafeToRead(filePath, rootPath)).toBe(true);
    });

    it('should reject files outside root directory', () => {
      const rootPath = '/project';
      const filePath = '/etc/passwd';
      
      expect(PathValidator.isSafeToRead(filePath, rootPath)).toBe(false);
    });

    it('should reject path traversal attempts', () => {
      const rootPath = '/project';
      const filePath = '/project/../../../etc/passwd';
      
      expect(PathValidator.isSafeToRead(filePath, rootPath)).toBe(false);
    });
  });
});
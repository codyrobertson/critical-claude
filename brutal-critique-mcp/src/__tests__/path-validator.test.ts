/**
 * Comprehensive tests for PathValidator
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import path from 'path';

// Mock fs/promises before importing PathValidator
const mockStat = jest.fn();
jest.unstable_mockModule('fs/promises', () => ({
  default: {
    stat: mockStat,
  },
  stat: mockStat,
}));

// Import after mocking
const { PathValidator } = await import('../path-validator.js');

describe('PathValidator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateRootPath', () => {
    it('should reject empty path', async () => {
      await expect(PathValidator.validateRootPath('')).rejects.toThrow(
        'Root path must be a non-empty string'
      );
    });

    it('should reject non-string path', async () => {
      await expect(PathValidator.validateRootPath(null as any)).rejects.toThrow(
        'Root path must be a non-empty string'
      );
    });

    it('should reject system directories', async () => {
      await expect(PathValidator.validateRootPath('/etc')).rejects.toThrow(
        'Access denied: Cannot analyze system directory /etc'
      );
      await expect(PathValidator.validateRootPath('/bin')).rejects.toThrow(
        'Access denied: Cannot analyze system directory /bin'
      );
    });

    it('should reject paths with traversal sequences', async () => {
      // This path gets normalized to /etc which is blocked
      await expect(PathValidator.validateRootPath('/home/user/../../../etc')).rejects.toThrow(
        'Access denied: Cannot analyze system directory /etc'
      );
    });

    it('should handle non-existent directory', async () => {
      const error = new Error('ENOENT');
      (error as any).code = 'ENOENT';
      mockStat.mockRejectedValue(error);

      await expect(PathValidator.validateRootPath('/nonexistent')).rejects.toThrow(
        'Invalid directory path: Directory does not exist or is not accessible'
      );
    });

    it('should handle permission denied', async () => {
      const error = new Error('EACCES');
      (error as any).code = 'EACCES';
      mockStat.mockRejectedValue(error);

      await expect(PathValidator.validateRootPath('/denied')).rejects.toThrow(
        'Invalid directory path: Permission denied'
      );
    });

    it('should reject files (not directories)', async () => {
      mockStat.mockResolvedValue({
        isDirectory: () => false,
      } as any);

      await expect(PathValidator.validateRootPath('/some/file.txt')).rejects.toThrow(
        'Invalid directory path: Cannot access the specified directory'
      );
    });

    it('should accept valid directory', async () => {
      const testPath = '/valid/project';
      mockStat.mockResolvedValue({
        isDirectory: () => true,
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

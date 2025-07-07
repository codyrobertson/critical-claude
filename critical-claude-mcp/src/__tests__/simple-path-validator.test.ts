/**
 * Simple tests for PathValidator without mocking
 */

import { describe, it, expect } from '@jest/globals';
import { PathValidator } from '../path-validator.js';

describe('PathValidator - Simple Tests', () => {
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

    it('should reject paths with simple traversal', async () => {
      // Path starting with .. gets rejected as invalid
      await expect(PathValidator.validateRootPath('../../../etc')).rejects.toThrow(
        'Invalid directory path'
      );
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

    it('should handle relative paths', () => {
      const rootPath = '/project';
      const filePath = '/project/../etc/passwd';

      expect(PathValidator.isSafeToRead(filePath, rootPath)).toBe(false);
    });
  });
});

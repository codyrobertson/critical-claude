/**
 * Path validator tests without mocking
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { PathValidator } from '../path-validator.js';
import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

describe('PathValidator - Integration Tests', () => {
  let tempDir: string;

  beforeEach(async () => {
    // Create a temporary directory for testing
    tempDir = await mkdtemp(join(tmpdir(), 'brutal-test-'));
  });

  afterEach(async () => {
    // Clean up temp directory
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  describe('validateRootPath', () => {
    it('should accept valid temporary directory', async () => {
      const result = await PathValidator.validateRootPath(tempDir);
      expect(result).toBe(tempDir);
    });

    it('should reject empty path', async () => {
      await expect(PathValidator.validateRootPath('')).rejects.toThrow(
        'Root path must be a non-empty string'
      );
    });

    it('should reject null path', async () => {
      await expect(PathValidator.validateRootPath(null as any)).rejects.toThrow(
        'Root path must be a non-empty string'
      );
    });

    it('should reject system directories', async () => {
      await expect(PathValidator.validateRootPath('/etc')).rejects.toThrow(
        'Access denied: Cannot analyze system directory /etc'
      );
    });

    it('should handle non-existent paths', async () => {
      const nonExistentPath = join(tempDir, 'does-not-exist');
      await expect(PathValidator.validateRootPath(nonExistentPath)).rejects.toThrow(
        'Invalid directory path'
      );
    });
  });

  describe('isSafeToRead', () => {
    it('should allow files within root directory', () => {
      const filePath = join(tempDir, 'file.txt');
      expect(PathValidator.isSafeToRead(filePath, tempDir)).toBe(true);
    });

    it('should allow nested files', () => {
      const filePath = join(tempDir, 'src', 'deep', 'file.ts');
      expect(PathValidator.isSafeToRead(filePath, tempDir)).toBe(true);
    });

    it('should reject files outside root', () => {
      const filePath = '/etc/passwd';
      expect(PathValidator.isSafeToRead(filePath, tempDir)).toBe(false);
    });

    it('should reject traversal attempts', () => {
      const filePath = join(tempDir, '..', '..', 'etc', 'passwd');
      expect(PathValidator.isSafeToRead(filePath, tempDir)).toBe(false);
    });
  });
});

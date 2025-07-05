/**
 * Integration tests for CodebaseExplorer
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock all dependencies before imports
const mockReaddir = jest.fn();
const mockStat = jest.fn();
const mockReadFile = jest.fn();

jest.unstable_mockModule('fs/promises', () => ({
  default: {
    readdir: mockReaddir,
    stat: mockStat,
    readFile: mockReadFile,
  },
  readdir: mockReaddir,
  stat: mockStat,
  readFile: mockReadFile,
}));

const mockValidateRootPath = jest.fn();
const mockIsSafeToRead = jest.fn();

jest.unstable_mockModule('../path-validator.js', () => ({
  PathValidator: {
    validateRootPath: mockValidateRootPath,
    isSafeToRead: mockIsSafeToRead,
  },
}));

jest.unstable_mockModule('../logger.js', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
  },
}));

// Import after mocking
const { CodebaseExplorer } = await import('../codebase-explorer.js');

describe('CodebaseExplorer', () => {
  let explorer: CodebaseExplorer;

  beforeEach(() => {
    jest.clearAllMocks();
    explorer = new CodebaseExplorer();

    // Default mock implementations
    mockValidateRootPath.mockResolvedValue('/validated/path');
    mockIsSafeToRead.mockReturnValue(true);
  });

  describe('exploreCodebase', () => {
    it('should validate root path before exploration', async () => {
      const testPath = '/test/path';

      // Mock successful validation and empty directory
      mockReaddir.mockResolvedValue([]);

      await explorer.exploreCodebase(testPath);

      expect(mockValidateRootPath).toHaveBeenCalledWith(testPath);
    });

    it('should handle validation errors gracefully', async () => {
      const testPath = '/invalid/path';
      const validationError = new Error('Invalid path');

      mockValidateRootPath.mockRejectedValue(validationError);

      await expect(explorer.exploreCodebase(testPath)).rejects.toThrow('Invalid path');
    });

    it('should process files and directories correctly', async () => {
      // Mock directory with files
      const mockEntries = [
        { name: 'index.ts', isDirectory: () => false, isFile: () => true },
        { name: 'src', isDirectory: () => true, isFile: () => false },
        { name: 'node_modules', isDirectory: () => true, isFile: () => false },
      ];

      mockReaddir.mockResolvedValue(mockEntries as any);
      mockStat.mockResolvedValue({
        size: 1024,
        isDirectory: () => false,
        isFile: () => true,
      } as any);

      // Mock empty subdirectory
      mockReaddir.mockResolvedValueOnce(mockEntries as any).mockResolvedValue([]);

      const result = await explorer.exploreCodebase('/test');

      expect(result.totalFiles).toBe(1);
      expect(result.filesByType.has('.ts')).toBe(true);
    });

    it('should respect file size limits', async () => {
      const largeFile = {
        name: 'large.ts',
        isDirectory: () => false,
        isFile: () => true,
      };

      mockReaddir.mockResolvedValue([largeFile] as any);
      mockStat.mockResolvedValue({
        size: 20 * 1024 * 1024,
        isDirectory: () => false,
        isFile: () => true,
      } as any); // 20MB

      const result = await explorer.exploreCodebase('/test');

      // Large file should be skipped
      expect(result.totalFiles).toBe(0);
    });

    it('should detect languages correctly', async () => {
      const files = [
        { name: 'app.ts', isDirectory: () => false, isFile: () => true },
        { name: 'script.js', isDirectory: () => false, isFile: () => true },
        { name: 'main.py', isDirectory: () => false, isFile: () => true },
      ];

      mockReaddir.mockResolvedValue(files as any);
      mockStat.mockResolvedValue({
        size: 1024,
        isDirectory: () => false,
        isFile: () => true,
      } as any);

      const result = await explorer.exploreCodebase('/test');

      expect(result.mainLanguages).toContain('TypeScript');
      expect(result.mainLanguages).toContain('JavaScript');
      expect(result.mainLanguages).toContain('Python');
    });
  });

  describe('createBrutalPlan', () => {
    it('should identify strengths correctly', async () => {
      const structure = {
        rootPath: '/test',
        totalFiles: 10,
        totalSize: 10000,
        filesByType: new Map([
          [
            '.ts',
            [{ path: '/test/app.ts', size: 1000, extension: '.ts', type: 'source' as const }],
          ],
          [
            '.test',
            [
              {
                path: '/test/app.test.ts',
                size: 500,
                extension: '.test',
                type: 'test' as const,
              },
            ],
          ],
        ]),
        directories: [],
        mainLanguages: ['TypeScript'],
        frameworkIndicators: ['Node.js'],
        architecturePatterns: [],
      };

      const plan = await explorer.createBrutalPlan(structure, []);

      expect(plan.currentState.strengths).toContain('Has test coverage');
      expect(plan.currentState.strengths).toContain('Type safety with TypeScript');
    });

    it('should identify risks for untested code', async () => {
      const structure = {
        rootPath: '/test',
        totalFiles: 10,
        totalSize: 10000,
        filesByType: new Map([
          [
            '.ts',
            [{ path: '/test/app.ts', size: 1000, extension: '.ts', type: 'source' as const }],
          ],
        ]),
        directories: [],
        mainLanguages: ['TypeScript'],
        frameworkIndicators: [],
        architecturePatterns: [],
      };

      const plan = await explorer.createBrutalPlan(structure, []);

      expect(plan.currentState.risks).toContain('No test coverage - changes are risky');
    });

    it('should prioritize critical issues in recommendations', async () => {
      const structure = {
        rootPath: '/test',
        totalFiles: 10,
        totalSize: 10000,
        filesByType: new Map(),
        directories: [],
        mainLanguages: [],
        frameworkIndicators: [],
        architecturePatterns: [],
      };

      const criticalIssue = {
        severity: 'CRITICAL',
        type: 'SECURITY',
        location: { file: 'test.ts', lines: [1] },
        brutal_feedback: 'SQL injection vulnerability',
        actual_impact: 'Data breach',
      };

      const plan = await explorer.createBrutalPlan(structure, [criticalIssue]);

      expect(plan.recommendations.immediate).toContain(
        'Fix all CRITICAL security vulnerabilities before any other work'
      );
      expect(plan.estimatedEffort.immediate).toBe('2 hours');
    });
  });
});

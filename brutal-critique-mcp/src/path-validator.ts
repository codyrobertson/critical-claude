/**
 * Path validation utilities to prevent security vulnerabilities
 */

import fs from 'fs/promises';
import path from 'path';

export class PathValidator {
  private static readonly BLOCKED_PATHS = new Set([
    '/etc',
    '/bin',
    '/sbin',
    '/usr/bin',
    '/usr/sbin',
    '/root',
    '/home/.ssh',
    '/var/log',
    '/proc',
    '/sys',
  ]);

  /**
   * Validates and normalizes a root path for codebase analysis
   * @param rootPath The path to validate
   * @returns Normalized absolute path
   * @throws Error if path is invalid or inaccessible
   */
  static async validateRootPath(rootPath: string): Promise<string> {
    if (!rootPath || typeof rootPath !== 'string') {
      throw new Error('Root path must be a non-empty string');
    }

    // Normalize and resolve the path
    const normalizedPath = path.resolve(rootPath);

    // Check for blocked system paths
    for (const blocked of this.BLOCKED_PATHS) {
      if (normalizedPath.startsWith(blocked)) {
        throw new Error(`Access denied: Cannot analyze system directory ${blocked}`);
      }
    }

    // Verify path exists and is a directory
    try {
      const stats = await fs.stat(normalizedPath);
      if (!stats.isDirectory()) {
        throw new Error(`Path is not a directory: ${normalizedPath}`);
      }
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        throw new Error('Invalid directory path: Directory does not exist or is not accessible');
      }
      if (error.code === 'EACCES') {
        throw new Error('Invalid directory path: Permission denied');
      }
      throw new Error('Invalid directory path: Cannot access the specified directory');
    }

    // Additional security check - prevent traversal to parent directories
    if (normalizedPath.includes('..')) {
      throw new Error('Path traversal detected: .. sequences not allowed');
    }

    return normalizedPath;
  }

  /**
   * Checks if a path is safe to read
   * @param filePath The file path to check
   * @param rootPath The validated root path
   * @returns true if safe to read
   */
  static isSafeToRead(filePath: string, rootPath: string): boolean {
    const resolvedFile = path.resolve(filePath);
    const resolvedRoot = path.resolve(rootPath);

    // Ensure file is within the root directory
    return resolvedFile.startsWith(resolvedRoot);
  }
}

/**
 * Codebase Explorer for Brutal Critique MCP
 * Analyzes entire project structure to provide architectural insights
 */

import fs from 'fs/promises';
import path from 'path';
import { PathValidator } from './path-validator.js';
import { logger } from './logger.js';

export type FileInfo = {
  path: string;
  size: number;
  extension: string;
  type: 'source' | 'config' | 'test' | 'doc' | 'other';
};

export type DirectoryInfo = {
  path: string;
  fileCount: number;
  totalSize: number;
  subdirectories: string[];
};

export type CodebaseStructure = {
  rootPath: string;
  totalFiles: number;
  totalSize: number;
  filesByType: Map<string, FileInfo[]>;
  directories: DirectoryInfo[];
  mainLanguages: string[];
  frameworkIndicators: string[];
  architecturePatterns: string[];
};

export type ArchitecturalPlan = {
  title: string;
  currentState: {
    strengths: string[];
    weaknesses: string[];
    risks: string[];
  };
  recommendations: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
  antiPatterns: string[];
  estimatedEffort: {
    immediate: string;
    shortTerm: string;
    longTerm: string;
  };
};

export class CodebaseExplorer {
  private readonly IGNORED_DIRS = new Set([
    'node_modules',
    '.git',
    'dist',
    'build',
    'coverage',
    '.next',
    '.nuxt',
    'vendor',
    '__pycache__',
    '.pytest_cache',
  ]);

  private readonly SOURCE_EXTENSIONS = new Set([
    '.js',
    '.ts',
    '.jsx',
    '.tsx',
    '.py',
    '.java',
    '.go',
    '.rb',
    '.php',
    '.c',
    '.cpp',
    '.cs',
    '.swift',
    '.kt',
  ]);

  private readonly CONFIG_FILES = new Set([
    'package.json',
    'tsconfig.json',
    'webpack.config.js',
    'requirements.txt',
    'pom.xml',
    'build.gradle',
    'go.mod',
    'Gemfile',
    'composer.json',
    '.eslintrc',
    '.prettierrc',
  ]);

  async exploreCodebase(rootPath: string): Promise<CodebaseStructure> {
    logger.info('Starting codebase exploration', { rootPath });

    // Validate and normalize the path
    const validatedPath = await PathValidator.validateRootPath(rootPath);
    logger.info('Path validated successfully', { validatedPath });

    const structure: CodebaseStructure = {
      rootPath: validatedPath,
      totalFiles: 0,
      totalSize: 0,
      filesByType: new Map(),
      directories: [],
      mainLanguages: [],
      frameworkIndicators: [],
      architecturePatterns: [],
    };

    try {
      await this.walkDirectory(validatedPath, structure);
      this.detectLanguages(structure);
      this.detectFrameworks(structure);
      this.detectArchitecturePatterns(structure);

      logger.info('Codebase exploration completed', {
        totalFiles: structure.totalFiles,
        totalSize: structure.totalSize,
        languages: structure.mainLanguages,
      });

      return structure;
    } catch (error) {
      logger.error('Failed to explore codebase', { rootPath: validatedPath }, error as Error);
      throw new Error(`Codebase exploration failed: ${(error as Error).message}`);
    }
  }

  private async walkDirectory(
    dirPath: string,
    structure: CodebaseStructure,
    depth = 0
  ): Promise<void> {
    // Prevent infinite recursion and symlink loops
    if (depth > 20) {
      logger.warn('Maximum directory depth reached', { dirPath, depth });
      return;
    }

    // Memory protection - stop if we've processed too many files
    if (structure.totalFiles > 50000) {
      logger.warn('Maximum file limit reached, stopping exploration', {
        totalFiles: structure.totalFiles,
        currentPath: dirPath,
      });
      return;
    }

    try {
      // Validate path is still within allowed bounds
      if (!PathValidator.isSafeToRead(dirPath, structure.rootPath)) {
        logger.warn('Path traversal detected, skipping directory', { dirPath });
        return;
      }

      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      const dirInfo: DirectoryInfo = {
        path: dirPath,
        fileCount: 0,
        totalSize: 0,
        subdirectories: [],
      };

      // Process files and directories in parallel batches
      const batchSize = 50;
      for (let i = 0; i < entries.length; i += batchSize) {
        const batch = entries.slice(i, i + batchSize);
        const promises = batch.map(async (entry) => {
          const fullPath = path.join(dirPath, entry.name);

          try {
            if (entry.isDirectory()) {
              if (!this.IGNORED_DIRS.has(entry.name) && !entry.name.startsWith('.')) {
                dirInfo.subdirectories.push(entry.name);
                await this.walkDirectory(fullPath, structure, depth + 1);
              }
            } else if (entry.isFile()) {
              const stats = await fs.stat(fullPath);

              // Skip large files to prevent memory issues
              if (stats.size > 10 * 1024 * 1024) {
                // 10MB limit
                logger.debug('Skipping large file', { path: fullPath, size: stats.size });
                return;
              }

              const fileInfo: FileInfo = {
                path: fullPath,
                size: stats.size,
                extension: path.extname(entry.name),
                type: this.classifyFile(entry.name),
              };

              dirInfo.fileCount++;
              dirInfo.totalSize += stats.size;
              structure.totalFiles++;
              structure.totalSize += stats.size;

              const ext = fileInfo.extension || 'no-extension';
              const MAX_FILES_PER_TYPE = 1000; // Prevent memory exhaustion

              const existingFiles = structure.filesByType.get(ext) || [];
              if (existingFiles.length < MAX_FILES_PER_TYPE) {
                if (!structure.filesByType.has(ext)) {
                  structure.filesByType.set(ext, []);
                }
                structure.filesByType.get(ext)!.push(fileInfo);
              } else {
                logger.debug('File type limit reached, skipping file', {
                  extension: ext,
                  limit: MAX_FILES_PER_TYPE,
                  path: fullPath,
                });
              }
            }
          } catch (fileError) {
            logger.debug('Failed to process file/directory', {
              path: fullPath,
              error: (fileError as Error).message,
            });
            // Continue processing other files
          }
        });

        await Promise.all(promises);
      }

      if (dirInfo.fileCount > 0 || dirInfo.subdirectories.length > 0) {
        structure.directories.push(dirInfo);
      }
    } catch (error) {
      logger.warn('Failed to read directory', {
        dirPath,
        error: (error as Error).message,
      });
      // Don't throw - continue with other directories
    }
  }

  private classifyFile(filename: string): FileInfo['type'] {
    const ext = path.extname(filename);
    const basename = path.basename(filename);

    if (this.SOURCE_EXTENSIONS.has(ext)) return 'source';
    if (this.CONFIG_FILES.has(basename)) return 'config';
    if (filename.includes('test') || filename.includes('spec')) return 'test';
    if (['.md', '.txt', '.rst'].includes(ext)) return 'doc';
    return 'other';
  }

  private static readonly LANGUAGE_CACHE = new Map<string, string | null>();

  private detectLanguages(structure: CodebaseStructure): void {
    const languageCounts = new Map<string, number>();

    // Use optimized iteration with caching for performance
    for (const [ext, files] of structure.filesByType) {
      let language = CodebaseExplorer.LANGUAGE_CACHE.get(ext);
      if (language === undefined) {
        language = this.extToLanguage(ext);
        CodebaseExplorer.LANGUAGE_CACHE.set(ext, language);
      }

      if (language) {
        const currentCount = languageCounts.get(language) || 0;
        languageCounts.set(language, currentCount + files.length);
      }
    }

    // Get top 3 languages by file count
    structure.mainLanguages = Array.from(languageCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([lang]) => lang);

    logger.debug('Detected languages', {
      languages: Object.fromEntries(languageCounts),
      cacheSize: CodebaseExplorer.LANGUAGE_CACHE.size,
    });
  }

  private detectFrameworks(structure: CodebaseStructure): void {
    const indicators: string[] = [];

    // Check config files for framework indicators
    const packageJson = structure.filesByType
      .get('.json')
      ?.find((f) => f.path.endsWith('package.json'));
    if (packageJson) {
      // This is simplified - in real implementation, you'd read and parse the file
      indicators.push('Node.js');
    }

    if (structure.filesByType.get('.tsx')?.length) {
      indicators.push('React');
    }

    if (structure.filesByType.get('.go')?.length) {
      indicators.push('Go');
    }

    structure.frameworkIndicators = indicators;
  }

  private detectArchitecturePatterns(structure: CodebaseStructure): void {
    const patterns: string[] = [];

    // Check directory structure for patterns
    const dirNames = structure.directories.map((d) => path.basename(d.path));

    if (dirNames.includes('controllers') && dirNames.includes('models')) {
      patterns.push('MVC');
    }

    if (dirNames.includes('services') || dirNames.includes('domain')) {
      patterns.push('Domain-Driven Design');
    }

    if (dirNames.includes('adapters') && dirNames.includes('ports')) {
      patterns.push('Hexagonal Architecture');
    }

    structure.architecturePatterns = patterns;
  }

  private extToLanguage(ext: string): string | null {
    const mapping: Record<string, string> = {
      '.js': 'JavaScript',
      '.ts': 'TypeScript',
      '.jsx': 'JavaScript',
      '.tsx': 'TypeScript',
      '.py': 'Python',
      '.java': 'Java',
      '.go': 'Go',
      '.rb': 'Ruby',
      '.php': 'PHP',
      '.cs': 'C#',
      '.cpp': 'C++',
      '.c': 'C',
      '.swift': 'Swift',
      '.kt': 'Kotlin',
    };
    return mapping[ext] || null;
  }

  async createCriticalPlan(structure: CodebaseStructure, issues: any[]): Promise<ArchitecturalPlan> {
    const plan: ArchitecturalPlan = {
      title: `Brutal Architecture Plan for ${path.basename(structure.rootPath)}`,
      currentState: {
        strengths: [],
        weaknesses: [],
        risks: [],
      },
      recommendations: {
        immediate: [],
        shortTerm: [],
        longTerm: [],
      },
      antiPatterns: [],
      estimatedEffort: {
        immediate: '1-2 days',
        shortTerm: '1-2 weeks',
        longTerm: '1-3 months',
      },
    };

    // Analyze strengths
    if (structure.filesByType.get('.test')?.length || structure.filesByType.get('.spec')?.length) {
      plan.currentState.strengths.push('Has test coverage');
    }

    if (structure.mainLanguages.includes('TypeScript')) {
      plan.currentState.strengths.push('Type safety with TypeScript');
    }

    // Analyze weaknesses
    if (structure.totalFiles > 1000 && !structure.architecturePatterns.length) {
      plan.currentState.weaknesses.push('Large codebase without clear architecture patterns');
    }

    // Identify risks
    if (!structure.filesByType.get('.test')?.length) {
      plan.currentState.risks.push('No test coverage - changes are risky');
    }

    // Generate recommendations based on issues
    const criticalIssues = issues.filter((i) => i.severity === 'CRITICAL');
    const highIssues = issues.filter((i) => i.severity === 'HIGH');

    if (criticalIssues.length > 0) {
      plan.recommendations.immediate.push(
        'Fix all CRITICAL security vulnerabilities before any other work'
      );
      plan.estimatedEffort.immediate = `${criticalIssues.length * 2} hours`;
    }

    if (highIssues.length > 0) {
      plan.recommendations.shortTerm.push('Address HIGH priority issues in next sprint');
    }

    // Anti-patterns based on codebase size
    if (structure.totalFiles < 50 && structure.architecturePatterns.includes('Microservices')) {
      plan.antiPatterns.push('Microservices for small application - massive overhead');
    }

    return plan;
  }
}

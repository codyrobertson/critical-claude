/**
 * Backup Tasks Use Case
 * Creates automatic backups of task data with rotation
 */

import { ITaskRepository } from '../../domain/repositories/ITaskRepository.js';
import { ExportTasksUseCase } from './ExportTasksUseCase.js';
import path from 'path';
import os from 'os';

export interface BackupTasksRequest {
  backupDir?: string;
  maxBackups?: number;
  format?: 'json' | 'csv';
}

export interface BackupTasksResponse {
  success: boolean;
  backupPath?: string;
  cleanedUpCount?: number;
  error?: string;
}

export class BackupTasksUseCase {
  constructor(private taskRepository: ITaskRepository) {}

  async execute(request: BackupTasksRequest = {}): Promise<BackupTasksResponse> {
    try {
      const backupDir = request.backupDir || path.join(os.homedir(), '.critical-claude', 'backups');
      const maxBackups = request.maxBackups || 10;
      const format = request.format || 'json';

      // Ensure backup directory exists
      await this.ensureBackupDirectory(backupDir);

      // Create backup
      const exportUseCase = new ExportTasksUseCase(this.taskRepository);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = `backup-${timestamp}.${format}`;
      const backupPath = path.join(backupDir, backupFileName);

      const exportResult = await exportUseCase.execute({
        format,
        includeArchived: true,
        outputPath: backupPath
      });

      if (!exportResult.success) {
        return {
          success: false,
          error: exportResult.error
        };
      }

      // Clean up old backups
      const cleanedUpCount = await this.cleanupOldBackups(backupDir, maxBackups);

      return {
        success: true,
        backupPath,
        cleanedUpCount
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Backup failed'
      };
    }
  }

  private async ensureBackupDirectory(backupDir: string): Promise<void> {
    const fs = await import('fs/promises');
    try {
      await fs.access(backupDir);
    } catch {
      await fs.mkdir(backupDir, { recursive: true });
    }
  }

  private async cleanupOldBackups(backupDir: string, maxBackups: number): Promise<number> {
    try {
      const fs = await import('fs/promises');
      const files = await fs.readdir(backupDir);
      
      const backupFiles = files
        .filter(file => file.startsWith('backup-') && (file.endsWith('.json') || file.endsWith('.csv')))
        .map(file => ({
          name: file,
          path: path.join(backupDir, file)
        }));

      if (backupFiles.length <= maxBackups) {
        return 0;
      }

      // Sort by filename (which includes timestamp)
      backupFiles.sort((a, b) => a.name.localeCompare(b.name));

      // Remove oldest files
      const filesToRemove = backupFiles.slice(0, backupFiles.length - maxBackups);
      
      for (const file of filesToRemove) {
        await fs.unlink(file.path);
      }

      return filesToRemove.length;
    } catch (error) {
      // Don't fail backup if cleanup fails
      console.warn('Failed to cleanup old backups:', error);
      return 0;
    }
  }

  async listBackups(backupDir?: string): Promise<{success: boolean, backups?: string[], error?: string}> {
    try {
      const dir = backupDir || path.join(os.homedir(), '.critical-claude', 'backups');
      const fs = await import('fs/promises');
      
      try {
        const files = await fs.readdir(dir);
        const backups = files
          .filter(file => file.startsWith('backup-') && (file.endsWith('.json') || file.endsWith('.csv')))
          .sort()
          .reverse(); // Newest first

        return { success: true, backups };
      } catch {
        return { success: true, backups: [] };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list backups'
      };
    }
  }
}
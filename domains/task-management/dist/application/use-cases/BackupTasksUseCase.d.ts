/**
 * Backup Tasks Use Case
 * Creates automatic backups of task data with rotation
 */
import { ITaskRepository } from '../../domain/repositories/ITaskRepository.js';
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
export declare class BackupTasksUseCase {
    private taskRepository;
    constructor(taskRepository: ITaskRepository);
    execute(request?: BackupTasksRequest): Promise<BackupTasksResponse>;
    private ensureBackupDirectory;
    private cleanupOldBackups;
    listBackups(backupDir?: string): Promise<{
        success: boolean;
        backups?: string[];
        error?: string;
    }>;
}
//# sourceMappingURL=BackupTasksUseCase.d.ts.map
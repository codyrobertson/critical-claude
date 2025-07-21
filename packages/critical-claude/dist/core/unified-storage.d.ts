/**
 * Unified Storage Manager - Single source of truth for all task data
 * Unified storage system replacing all fragmented task storage systems
 */
import { CommonTask, CreateTaskInput, UpdateTaskInput, TaskListOptions } from '../types/common-task.js';
export interface UnifiedStorageConfig {
    basePath: string;
    migrationEnabled: boolean;
    backupEnabled: boolean;
    autoCleanup: boolean;
}
export declare class UnifiedStorageManager {
    private config;
    private initialized;
    constructor(config?: Partial<UnifiedStorageConfig>);
    initialize(): Promise<void>;
    private ensureDirectories;
    private migrateFromFragmentedStorage;
    private migrateTasks;
    private cleanupOldDirectories;
    createTask(input: CreateTaskInput): Promise<CommonTask>;
    getTask(taskId: string): Promise<CommonTask | null>;
    updateTask(input: UpdateTaskInput): Promise<CommonTask | null>;
    deleteTask(taskId: string): Promise<boolean>;
    archiveTask(taskId: string): Promise<CommonTask | null>;
    listTasks(options?: TaskListOptions): Promise<CommonTask[]>;
    private getArchivedTasks;
    private matchesFilter;
    private sortTasks;
    private saveTask;
    private generateTaskId;
    getTaskPath(taskId: string): string;
    getSprintPath(sprintId: string): string;
    getEpicPath(epicId: string): string;
    getPhasePath(phaseId: string): string;
    getStats(): Promise<{
        totalTasks: number;
        tasksByStatus: Record<string, number>;
        tasksByPriority: Record<string, number>;
        archivedTasks: number;
    }>;
    backup(): Promise<string>;
}
//# sourceMappingURL=unified-storage.d.ts.map
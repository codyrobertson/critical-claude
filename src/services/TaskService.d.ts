/**
 * Simplified Task Service
 * Consolidates TaskService + 10 UseCase classes into direct service methods
 */
import { Task, CreateTaskData, UpdateTaskData, TaskFilters, Result, ExportOptions, ImportOptions } from '../models/index.js';
import { FileStorage } from '../storage/index.js';
export interface TaskStats {
    total: number;
    todo: number;
    in_progress: number;
    done: number;
    blocked: number;
    archived: number;
}
export interface BackupResult {
    backupPath: string;
    taskCount: number;
}
export declare class TaskService {
    private storage;
    private readonly COLLECTION;
    constructor(storage: FileStorage);
    createTask(data: CreateTaskData): Promise<Result<Task>>;
    listTasks(filters?: TaskFilters): Promise<Result<Task[]>>;
    viewTask(id: string): Promise<Result<Task>>;
    updateTask(id: string, updates: UpdateTaskData): Promise<Result<Task>>;
    deleteTask(id: string): Promise<Result<boolean>>;
    archiveTask(id: string): Promise<Result<Task>>;
    getTaskStats(): Promise<Result<TaskStats>>;
    exportTasks(options: ExportOptions): Promise<Result<{
        filePath: string;
        taskCount: number;
    }>>;
    importTasks(options: ImportOptions, data: string): Promise<Result<{
        imported: number;
        errors: string[];
    }>>;
    backupTasks(): Promise<Result<BackupResult>>;
    private tasksToCSV;
    private tasksToMarkdown;
}
//# sourceMappingURL=TaskService.d.ts.map
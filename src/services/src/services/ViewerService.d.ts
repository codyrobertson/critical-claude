/**
 * Simplified Viewer Service
 * Consolidates ViewerService functionality into direct service methods
 */
import { Task, Result } from '../models/index.js';
import { FileStorage } from '../storage/index.js';
export interface ViewerOptions {
    logLevel?: 'debug' | 'info' | 'warn' | 'error';
    theme?: 'dark' | 'light';
}
export interface ViewerResult {
    success: boolean;
    error?: string;
}
export declare class ViewerService {
    private storage;
    private readonly COLLECTION;
    private dependenciesChecked;
    private dependencyErrors;
    constructor(storage: FileStorage);
    private validateStorage;
    private checkDependencies;
    launchViewer(options: ViewerOptions): Promise<ViewerResult>;
    getTasksForViewer(): Promise<Result<Task[]>>;
    searchTasks(query: string): Promise<Result<Task[]>>;
    toggleTaskStatus(taskId: string): Promise<Result<Task>>;
}

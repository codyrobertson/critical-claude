/**
 * Task Repository Implementation
 * File-based storage implementation for tasks
 */
import { Task } from '../domain/entities/Task.js';
import { ITaskRepository } from '../domain/repositories/ITaskRepository.js';
export declare class TaskRepository implements ITaskRepository {
    private readonly storageBasePath;
    constructor(storageBasePath: string);
    findById(id: string): Promise<Task | null>;
    findAll(): Promise<Task[]>;
    save(task: Task): Promise<void>;
    delete(id: string): Promise<boolean>;
    findByStatus(status: string): Promise<Task[]>;
    findByAssignee(assignee: string): Promise<Task[]>;
    findByLabels(labels: string[]): Promise<Task[]>;
    countTotal(): Promise<number>;
    archive(id: string): Promise<Task | null>;
    private getTaskPath;
    private ensureTasksDirectory;
    private ensureArchiveDirectory;
    private mapToStorage;
    private mapFromStorage;
}
//# sourceMappingURL=TaskRepository.d.ts.map
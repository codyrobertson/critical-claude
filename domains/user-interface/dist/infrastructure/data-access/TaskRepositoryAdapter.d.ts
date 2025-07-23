/**
 * Task Repository Adapter
 * Simplified adapter that provides basic task storage for the viewer
 */
import { ITaskRepository, TaskFilter, TaskSort, PaginationOptions, PaginatedResult } from '../../domain/repositories/ITaskRepository.js';
import { Task } from '../../domain/entities/Task.js';
import { TaskId } from '../../domain/value-objects/TaskId.js';
import { TaskStatus } from '../../domain/value-objects/TaskStatus.js';
export declare class TaskRepositoryAdapter implements ITaskRepository {
    private storagePath;
    private tasksFile;
    private initialized;
    constructor();
    initialize(): Promise<void>;
    findById(id: TaskId): Promise<Task | null>;
    findAll(filter?: TaskFilter, sort?: TaskSort, pagination?: PaginationOptions): Promise<PaginatedResult<Task>>;
    findByIds(ids: TaskId[]): Promise<Task[]>;
    search(query: string, limit?: number): Promise<Task[]>;
    save(task: Task): Promise<void>;
    saveMany(tasks: Task[]): Promise<void>;
    delete(id: TaskId): Promise<void>;
    deleteMany(ids: TaskId[]): Promise<void>;
    findSubtasks(parentId: TaskId): Promise<Task[]>;
    findRootTasks(): Promise<Task[]>;
    countByStatus(status: TaskStatus): Promise<number>;
    findOverdueTasks(): Promise<Task[]>;
    beginTransaction(): Promise<void>;
    commitTransaction(): Promise<void>;
    rollbackTransaction(): Promise<void>;
    private loadTasks;
    private saveTasks;
    private convertFromStoredTask;
    private convertToStoredTask;
    private mapStatus;
    private mapPriority;
}
//# sourceMappingURL=TaskRepositoryAdapter.d.ts.map
/**
 * Task Repository Adapter
 * Adapts between Critical Claude storage and viewer domain model
 */
import { ITaskRepository, TaskFilter, TaskSort, PaginationOptions, PaginatedResult } from '../../domain/repositories/ITaskRepository';
import { Task } from '../../domain/entities/Task';
import { TaskId } from '../../domain/value-objects/TaskId';
import { TaskStatus } from '../../domain/value-objects/TaskStatus';
export declare class TaskRepositoryAdapter implements ITaskRepository {
    private storage;
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
    private convertFromCommonTask;
    private mapStatusToString;
    private mapStringToStatus;
    private mapPriorityToString;
    private mapStringToPriority;
}
//# sourceMappingURL=TaskRepositoryAdapter.d.ts.map
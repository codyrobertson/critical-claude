/**
 * In-Memory Task Repository
 * Simple in-memory implementation for development and testing
 */
import { ITaskRepository, TaskFilter, TaskSort, PaginationOptions, PaginatedResult } from '../../domain/repositories/ITaskRepository';
import { Task } from '../../domain/entities/Task.js';
import { TaskId } from '../../domain/value-objects/TaskId.js';
import { TaskStatus } from '../../domain/value-objects/TaskStatus.js';
export declare class InMemoryTaskRepository implements ITaskRepository {
    private tasks;
    private transactionTasks;
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
    private getActiveStore;
    private applyFilter;
    private applySort;
    private calculateSearchScore;
    seed(tasks: Task[]): Promise<void>;
    clear(): Promise<void>;
}
//# sourceMappingURL=InMemoryTaskRepository.d.ts.map
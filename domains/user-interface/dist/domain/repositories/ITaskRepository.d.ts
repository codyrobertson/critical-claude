/**
 * Task Repository Interface
 * Follows Repository pattern and Dependency Inversion Principle
 */
import { Task } from '../entities/Task.js';
import { TaskId } from '../value-objects/TaskId.js';
import { TaskStatus } from '../value-objects/TaskStatus.js';
import { TaskPriority } from '../value-objects/TaskPriority.js';
export interface TaskFilter {
    status?: TaskStatus[];
    priority?: TaskPriority[];
    tags?: string[];
    search?: string;
    parentId?: TaskId;
    hasSubtasks?: boolean;
    createdAfter?: Date;
    createdBefore?: Date;
    updatedAfter?: Date;
    updatedBefore?: Date;
}
export interface TaskSort {
    field: 'createdAt' | 'updatedAt' | 'priority' | 'title' | 'status';
    direction: 'asc' | 'desc';
}
export interface PaginationOptions {
    page: number;
    pageSize: number;
}
export interface PaginatedResult<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}
export interface ITaskRepository {
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
}
//# sourceMappingURL=ITaskRepository.d.ts.map
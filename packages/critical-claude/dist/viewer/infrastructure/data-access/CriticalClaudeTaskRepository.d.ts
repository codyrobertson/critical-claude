/**
 * Critical Claude Task Repository
 * Integrates with the existing Critical Claude task storage
 */
import { ITaskRepository } from '../../domain/repositories/ITaskRepository';
import { Task } from '../../domain/entities/Task';
import { TaskId } from '../../domain/value-objects/TaskId';
import { TaskStatus } from '../../domain/value-objects/TaskStatus';
import { TaskPriority } from '../../domain/value-objects/TaskPriority';
export declare class CriticalClaudeTaskRepository implements ITaskRepository {
    private storage;
    private initialized;
    constructor();
    initialize(): Promise<void>;
    getById(id: TaskId): Promise<Task | null>;
    getAll(): Promise<Task[]>;
    save(task: Task): Promise<void>;
    delete(id: TaskId): Promise<void>;
    search(query: string): Promise<Task[]>;
    getByStatus(status: TaskStatus): Promise<Task[]>;
    getByPriority(priority: TaskPriority): Promise<Task[]>;
    getByAssignee(assignee: string): Promise<Task[]>;
    getByLabel(label: string): Promise<Task[]>;
    count(): Promise<number>;
    seed(tasks: Task[]): Promise<void>;
    private convertFromCommonTask;
    private convertToCommonTask;
    private mapStatusToString;
    private mapStringToStatus;
    private mapPriorityToString;
    private mapStringToPriority;
}
//# sourceMappingURL=CriticalClaudeTaskRepository.d.ts.map
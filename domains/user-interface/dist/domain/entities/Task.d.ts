/**
 * Task Entity - Core business logic for tasks
 * Following Domain-Driven Design principles
 */
import { TaskId } from '../value-objects/TaskId.js';
import { TaskStatus } from '../value-objects/TaskStatus.js';
import { TaskPriority } from '../value-objects/TaskPriority.js';
import { TaskMetadata } from '../value-objects/TaskMetadata.js';
import { DomainEvent } from '../events/DomainEvent.js';
export interface ITask {
    readonly id: TaskId;
    readonly title: string;
    readonly description: string;
    readonly status: TaskStatus;
    readonly priority: TaskPriority;
    readonly metadata: TaskMetadata;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly completedAt?: Date;
    readonly tags: Set<string>;
    readonly subtasks: TaskId[];
    readonly parentId?: TaskId;
}
export declare class Task implements ITask {
    readonly id: TaskId;
    readonly title: string;
    readonly description: string;
    readonly status: TaskStatus;
    readonly priority: TaskPriority;
    readonly metadata: TaskMetadata;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly completedAt?: Date | undefined;
    readonly tags: Set<string>;
    readonly subtasks: TaskId[];
    readonly parentId?: TaskId | undefined;
    private _events;
    constructor(id: TaskId, title: string, description: string, status: TaskStatus, priority: TaskPriority, metadata: TaskMetadata, createdAt: Date, updatedAt: Date, completedAt?: Date | undefined, tags?: Set<string>, subtasks?: TaskId[], parentId?: TaskId | undefined);
    complete(): Task;
    updatePriority(priority: TaskPriority): Task;
    addTag(tag: string): Task;
    getEvents(): DomainEvent[];
    clearEvents(): void;
}
//# sourceMappingURL=Task.d.ts.map
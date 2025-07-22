/**
 * Task Domain Entity
 * Core business entity representing a task in the system
 */
import { Priority, TaskStatus } from '../../shared/types.js';
export interface TaskId {
    readonly value: string;
}
export declare class Task {
    readonly id: TaskId;
    readonly title: string;
    readonly description: string;
    readonly status: TaskStatus;
    readonly priority: Priority;
    readonly labels: readonly string[];
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly assignee?: string | undefined;
    readonly estimatedHours?: number | undefined;
    readonly dependencies: readonly TaskId[];
    readonly draft: boolean;
    constructor(id: TaskId, title: string, description: string, status: TaskStatus, priority: Priority, labels: readonly string[], createdAt: Date, updatedAt: Date, assignee?: string | undefined, estimatedHours?: number | undefined, dependencies?: readonly TaskId[], draft?: boolean);
    updateStatus(newStatus: TaskStatus): Task;
    addLabel(label: string): Task;
    assignTo(assignee: string): Task;
    canBeAssigned(): boolean;
    isBlocked(): boolean;
    isComplete(): boolean;
}
export declare const TaskId: {
    create: (value: string) => TaskId;
    generate: () => TaskId;
};
//# sourceMappingURL=Task.d.ts.map
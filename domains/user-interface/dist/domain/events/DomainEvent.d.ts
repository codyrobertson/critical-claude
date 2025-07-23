/**
 * Domain Event Interface
 * Base interface for all domain events
 */
export interface DomainEvent {
    type: string;
    aggregateId: string;
    timestamp: Date;
    payload: Record<string, unknown>;
}
export interface TaskCreatedEvent extends DomainEvent {
    type: 'TaskCreated';
    payload: {
        taskId: string;
        title: string;
        priority: string;
        status: string;
    };
}
export interface TaskCompletedEvent extends DomainEvent {
    type: 'TaskCompleted';
    payload: {
        taskId: string;
        completedAt: Date;
    };
}
export interface TaskPriorityChangedEvent extends DomainEvent {
    type: 'TaskPriorityChanged';
    payload: {
        taskId: string;
        oldPriority: string;
        newPriority: string;
    };
}
export interface TaskStatusChangedEvent extends DomainEvent {
    type: 'TaskStatusChanged';
    payload: {
        taskId: string;
        oldStatus: string;
        newStatus: string;
    };
}
export interface TaskDeletedEvent extends DomainEvent {
    type: 'TaskDeleted';
    payload: {
        taskId: string;
    };
}
export type TaskEvent = TaskCreatedEvent | TaskCompletedEvent | TaskPriorityChangedEvent | TaskStatusChangedEvent | TaskDeletedEvent;
//# sourceMappingURL=DomainEvent.d.ts.map
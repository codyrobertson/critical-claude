/**
 * TaskStatus Value Object
 * Represents the status of a task with type safety
 */
export type StatusValue = 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'blocked';
export declare class TaskStatus {
    readonly value: StatusValue;
    private constructor();
    static pending(): TaskStatus;
    static inProgress(): TaskStatus;
    static completed(): TaskStatus;
    static cancelled(): TaskStatus;
    static blocked(): TaskStatus;
    static fromString(value: string): TaskStatus;
    private static isValidStatus;
    isPending(): boolean;
    isInProgress(): boolean;
    isCompleted(): boolean;
    isCancelled(): boolean;
    isBlocked(): boolean;
    isActive(): boolean;
    equals(other: TaskStatus): boolean;
    toString(): string;
}
//# sourceMappingURL=TaskStatus.d.ts.map
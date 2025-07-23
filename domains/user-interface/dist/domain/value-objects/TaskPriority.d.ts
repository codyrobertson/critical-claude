/**
 * TaskPriority Value Object
 * Encapsulates task priority with validation
 */
export type PriorityValue = 'critical' | 'high' | 'medium' | 'low';
export declare class TaskPriority {
    readonly value: PriorityValue;
    private static readonly PRIORITY_ORDER;
    private constructor();
    static critical(): TaskPriority;
    static high(): TaskPriority;
    static medium(): TaskPriority;
    static low(): TaskPriority;
    static fromString(value: string): TaskPriority;
    private static isValidPriority;
    getOrder(): number;
    isHigherThan(other: TaskPriority): boolean;
    isLowerThan(other: TaskPriority): boolean;
    equals(other: TaskPriority): boolean;
    toString(): string;
}
//# sourceMappingURL=TaskPriority.d.ts.map
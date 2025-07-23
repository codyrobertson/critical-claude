/**
 * TaskId Value Object
 * Ensures task IDs are valid and provides type safety
 */
export declare class TaskId {
    readonly value: string;
    constructor(value: string);
    equals(other: TaskId): boolean;
    toString(): string;
    static generate(): TaskId;
}
//# sourceMappingURL=TaskId.d.ts.map
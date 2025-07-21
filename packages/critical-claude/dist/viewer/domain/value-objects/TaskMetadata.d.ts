/**
 * TaskMetadata Value Object
 * Encapsulates task metadata with immutability
 */
export interface ITaskMetadata {
    readonly source: string;
    readonly context?: string;
    readonly estimatedDuration?: number;
    readonly actualDuration?: number;
    readonly dependencies: string[];
    readonly customFields: Record<string, unknown>;
}
export declare class TaskMetadata implements ITaskMetadata {
    readonly source: string;
    readonly context?: string | undefined;
    readonly estimatedDuration?: number | undefined;
    readonly actualDuration?: number | undefined;
    readonly dependencies: string[];
    readonly customFields: Record<string, unknown>;
    constructor(source: string, context?: string | undefined, estimatedDuration?: number | undefined, actualDuration?: number | undefined, dependencies?: string[], customFields?: Record<string, unknown>);
    withEstimatedDuration(duration: number): TaskMetadata;
    withActualDuration(duration: number): TaskMetadata;
    addDependency(dependency: string): TaskMetadata;
    setCustomField(key: string, value: unknown): TaskMetadata;
}
//# sourceMappingURL=TaskMetadata.d.ts.map
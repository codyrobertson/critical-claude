/**
 * TaskMetadata Value Object
 * Encapsulates task metadata with immutability
 */

export interface ITaskMetadata {
  readonly source: string;
  readonly context?: string;
  readonly estimatedDuration?: number; // in minutes
  readonly actualDuration?: number; // in minutes
  readonly dependencies: string[];
  readonly customFields: Record<string, unknown>;
}

export class TaskMetadata implements ITaskMetadata {
  constructor(
    public readonly source: string,
    public readonly context?: string,
    public readonly estimatedDuration?: number,
    public readonly actualDuration?: number,
    public readonly dependencies: string[] = [],
    public readonly customFields: Record<string, unknown> = {}
  ) {}

  withEstimatedDuration(duration: number): TaskMetadata {
    return new TaskMetadata(
      this.source,
      this.context,
      duration,
      this.actualDuration,
      this.dependencies,
      this.customFields
    );
  }

  withActualDuration(duration: number): TaskMetadata {
    return new TaskMetadata(
      this.source,
      this.context,
      this.estimatedDuration,
      duration,
      this.dependencies,
      this.customFields
    );
  }

  addDependency(dependency: string): TaskMetadata {
    return new TaskMetadata(
      this.source,
      this.context,
      this.estimatedDuration,
      this.actualDuration,
      [...this.dependencies, dependency],
      this.customFields
    );
  }

  setCustomField(key: string, value: unknown): TaskMetadata {
    return new TaskMetadata(
      this.source,
      this.context,
      this.estimatedDuration,
      this.actualDuration,
      this.dependencies,
      { ...this.customFields, [key]: value }
    );
  }
}
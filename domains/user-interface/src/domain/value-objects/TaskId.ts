/**
 * TaskId Value Object
 * Ensures task IDs are valid and provides type safety
 */

export class TaskId {
  constructor(public readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('TaskId cannot be empty');
    }
  }

  equals(other: TaskId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  static generate(): TaskId {
    return new TaskId(crypto.randomUUID());
  }
}
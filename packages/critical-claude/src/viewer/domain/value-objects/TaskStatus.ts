/**
 * TaskStatus Value Object
 * Represents the status of a task with type safety
 */

export type StatusValue = 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'blocked';

export class TaskStatus {
  private constructor(public readonly value: StatusValue) {}

  static pending(): TaskStatus {
    return new TaskStatus('pending');
  }

  static inProgress(): TaskStatus {
    return new TaskStatus('in_progress');
  }

  static completed(): TaskStatus {
    return new TaskStatus('completed');
  }

  static cancelled(): TaskStatus {
    return new TaskStatus('cancelled');
  }

  static blocked(): TaskStatus {
    return new TaskStatus('blocked');
  }

  static fromString(value: string): TaskStatus {
    if (!this.isValidStatus(value)) {
      throw new Error(`Invalid task status: ${value}`);
    }
    return new TaskStatus(value as StatusValue);
  }

  private static isValidStatus(value: string): boolean {
    return ['pending', 'in_progress', 'completed', 'cancelled', 'blocked'].includes(value);
  }

  isPending(): boolean {
    return this.value === 'pending';
  }

  isInProgress(): boolean {
    return this.value === 'in_progress';
  }

  isCompleted(): boolean {
    return this.value === 'completed';
  }

  isCancelled(): boolean {
    return this.value === 'cancelled';
  }

  isBlocked(): boolean {
    return this.value === 'blocked';
  }

  isActive(): boolean {
    return this.isPending() || this.isInProgress() || this.isBlocked();
  }

  equals(other: TaskStatus): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
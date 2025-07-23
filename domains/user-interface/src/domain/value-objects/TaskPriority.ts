/**
 * TaskPriority Value Object
 * Encapsulates task priority with validation
 */

export type PriorityValue = 'critical' | 'high' | 'medium' | 'low';

export class TaskPriority {
  private static readonly PRIORITY_ORDER: Record<PriorityValue, number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1
  };

  private constructor(public readonly value: PriorityValue) {}

  static critical(): TaskPriority {
    return new TaskPriority('critical');
  }

  static high(): TaskPriority {
    return new TaskPriority('high');
  }

  static medium(): TaskPriority {
    return new TaskPriority('medium');
  }

  static low(): TaskPriority {
    return new TaskPriority('low');
  }

  static fromString(value: string): TaskPriority {
    if (!this.isValidPriority(value)) {
      throw new Error(`Invalid task priority: ${value}`);
    }
    return new TaskPriority(value as PriorityValue);
  }

  private static isValidPriority(value: string): boolean {
    return ['critical', 'high', 'medium', 'low'].includes(value);
  }

  getOrder(): number {
    return TaskPriority.PRIORITY_ORDER[this.value];
  }

  isHigherThan(other: TaskPriority): boolean {
    return this.getOrder() > other.getOrder();
  }

  isLowerThan(other: TaskPriority): boolean {
    return this.getOrder() < other.getOrder();
  }

  equals(other: TaskPriority): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
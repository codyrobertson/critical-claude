
/**
 * Task Domain Entity
 * Core business entity representing a task in the system
 */

import { Priority, TaskStatus } from '../../shared/types.js';

export interface TaskId {
  readonly value: string;
}

export class Task {
  constructor(
    public readonly id: TaskId,
    public readonly title: string,
    public readonly description: string,
    public readonly status: TaskStatus,
    public readonly priority: Priority,
    public readonly labels: readonly string[],
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly assignee?: string,
    public readonly estimatedHours?: number,
    public readonly dependencies: readonly TaskId[] = [],
    public readonly draft: boolean = false
  ) {}

  // Domain methods
  updateStatus(newStatus: TaskStatus): Task {
    return new Task(
      this.id,
      this.title,
      this.description,
      newStatus,
      this.priority,
      this.labels,
      this.createdAt,
      new Date(),
      this.assignee,
      this.estimatedHours,
      this.dependencies,
      this.draft
    );
  }

  addLabel(label: string): Task {
    if (this.labels.includes(label)) {
      return this;
    }

    return new Task(
      this.id,
      this.title,
      this.description,
      this.status,
      this.priority,
      [...this.labels, label],
      this.createdAt,
      new Date(),
      this.assignee,
      this.estimatedHours,
      this.dependencies,
      this.draft
    );
  }

  assignTo(assignee: string): Task {
    return new Task(
      this.id,
      this.title,
      this.description,
      this.status,
      this.priority,
      this.labels,
      this.createdAt,
      new Date(),
      assignee,
      this.estimatedHours,
      this.dependencies,
      this.draft
    );
  }

  // Business rules
  canBeAssigned(): boolean {
    return this.status !== 'done' && this.status !== 'archived';
  }

  isBlocked(): boolean {
    return this.status === 'blocked';
  }

  isComplete(): boolean {
    return this.status === 'done';
  }
}

// Factory functions
export const TaskId = {
  create: (value: string): TaskId => ({ value }),
  generate: (): TaskId => ({ 
    value: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  })
};

/**
 * Task Entity - Core business logic for tasks
 * Following Domain-Driven Design principles
 */

import { TaskId } from '../value-objects/TaskId.js';
import { TaskStatus } from '../value-objects/TaskStatus.js';
import { TaskPriority } from '../value-objects/TaskPriority.js';
import { TaskMetadata } from '../value-objects/TaskMetadata.js';
import { DomainEvent } from '../events/DomainEvent.js';

export interface ITask {
  readonly id: TaskId;
  readonly title: string;
  readonly description: string;
  readonly status: TaskStatus;
  readonly priority: TaskPriority;
  readonly metadata: TaskMetadata;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly completedAt?: Date;
  readonly tags: Set<string>;
  readonly subtasks: TaskId[];
  readonly parentId?: TaskId;
}

export class Task implements ITask {
  private _events: DomainEvent[] = [];

  constructor(
    public readonly id: TaskId,
    public readonly title: string,
    public readonly description: string,
    public readonly status: TaskStatus,
    public readonly priority: TaskPriority,
    public readonly metadata: TaskMetadata,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly completedAt?: Date,
    public readonly tags: Set<string> = new Set(),
    public readonly subtasks: TaskId[] = [],
    public readonly parentId?: TaskId
  ) {}

  // Domain methods
  complete(): Task {
    if (this.status.isCompleted()) {
      throw new Error('Task is already completed');
    }
    
    const newStatus = TaskStatus.completed();
    const completedTask = new Task(
      this.id,
      this.title,
      this.description,
      newStatus,
      this.priority,
      this.metadata,
      this.createdAt,
      new Date(),
      new Date(),
      this.tags,
      this.subtasks,
      this.parentId
    );
    
    completedTask._events.push({
      type: 'TaskCompleted',
      aggregateId: this.id.value,
      timestamp: new Date(),
      payload: { taskId: this.id.value }
    });
    
    return completedTask;
  }

  updatePriority(priority: TaskPriority): Task {
    const updatedTask = new Task(
      this.id,
      this.title,
      this.description,
      this.status,
      priority,
      this.metadata,
      this.createdAt,
      new Date(),
      this.completedAt,
      this.tags,
      this.subtasks,
      this.parentId
    );
    
    updatedTask._events.push({
      type: 'TaskPriorityChanged',
      aggregateId: this.id.value,
      timestamp: new Date(),
      payload: { 
        taskId: this.id.value,
        oldPriority: this.priority.value,
        newPriority: priority.value
      }
    });
    
    return updatedTask;
  }

  addTag(tag: string): Task {
    const newTags = new Set(this.tags);
    newTags.add(tag);
    
    return new Task(
      this.id,
      this.title,
      this.description,
      this.status,
      this.priority,
      this.metadata,
      this.createdAt,
      new Date(),
      this.completedAt,
      newTags,
      this.subtasks,
      this.parentId
    );
  }

  getEvents(): DomainEvent[] {
    return [...this._events];
  }

  clearEvents(): void {
    this._events = [];
  }
}
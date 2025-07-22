/**
 * Task Repository Interface
 * Simple repository interface for task persistence
 */

import { Task } from '../entities/Task.js';
import { Repository } from '../../shared/types.js';

export interface ITaskRepository extends Repository<Task> {
  // Basic CRUD operations inherited from Repository<Task>:
  // - findById(id: string): Promise<Task | null>
  // - findAll(): Promise<Task[]>
  // - save(entity: Task): Promise<void>
  // - delete(id: string): Promise<boolean>

  // Additional task-specific methods
  findByStatus(status: string): Promise<Task[]>;
  findByAssignee(assignee: string): Promise<Task[]>;
  findByLabels(labels: string[]): Promise<Task[]>;
  countTotal(): Promise<number>;
}
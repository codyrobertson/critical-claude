
/**
 * Create Task Use Case
 * Application service for creating new tasks
 */

import { Task, TaskId } from '../../domain/entities/Task.js';
import { Priority, TaskStatus, Repository, Result } from '../../shared/types.js';

export interface CreateTaskRequest {
  title: string;
  description?: string;
  priority?: Priority;
  assignee?: string;
  labels?: string[];
  estimatedHours?: number;
  draft?: boolean;
}

export interface CreateTaskResponse {
  success: boolean;
  task?: Task;
  error?: string;
}

export class CreateTaskUseCase {
  constructor(
    private readonly taskRepository: Repository<Task>
  ) {}

  async execute(request: CreateTaskRequest): Promise<CreateTaskResponse> {
    try {
      // Validate business rules
      if (!request.title?.trim()) {
        return {
          success: false,
          error: 'Task title is required'
        };
      }

      // Create task entity with simple pattern
      const task = new Task(
        TaskId.generate(),
        request.title.trim(),
        request.description || '',
        'todo' as TaskStatus,
        request.priority || 'medium',
        request.labels || [],
        new Date(),
        new Date(),
        request.assignee,
        request.estimatedHours,
        [],
        request.draft || false
      );

      // Persist via repository
      await this.taskRepository.save(task);

      return {
        success: true,
        task
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}

/**
 * View Task Use Case
 * Application service for retrieving a single task by ID
 */

import { Task, TaskId } from '../../domain/entities/Task.js';
import { Repository, Result } from '../../shared/types.js';

export interface ViewTaskRequest {
  taskId: string;
}

export interface ViewTaskResponse {
  success: boolean;
  task?: Task;
  error?: string;
}

export class ViewTaskUseCase {
  constructor(
    private readonly taskRepository: Repository<Task>
  ) {}

  async execute(request: ViewTaskRequest): Promise<ViewTaskResponse> {
    try {
      // Validate input
      if (!request.taskId?.trim()) {
        return {
          success: false,
          error: 'Task ID is required'
        };
      }

      // Find task by ID
      const task = await this.taskRepository.findById(request.taskId.trim());

      if (!task) {
        return {
          success: false,
          error: `Task not found: ${request.taskId}`
        };
      }

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
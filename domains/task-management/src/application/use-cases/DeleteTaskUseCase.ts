/**
 * Delete Task Use Case
 * Application service for deleting tasks from the system
 */

import { Task } from '../../domain/entities/Task.js';
import { Repository, Result } from '../../shared/types.js';

export interface DeleteTaskRequest {
  taskId: string;
}

export interface DeleteTaskResponse {
  success: boolean;
  deletedTask?: {
    id: string;
    title: string;
  };
  error?: string;
}

export class DeleteTaskUseCase {
  constructor(
    private readonly taskRepository: Repository<Task>
  ) {}

  async execute(request: DeleteTaskRequest): Promise<DeleteTaskResponse> {
    try {
      // Validate input
      if (!request.taskId?.trim()) {
        return {
          success: false,
          error: 'Task ID is required'
        };
      }

      // Find existing task to get details before deletion
      const existingTask = await this.taskRepository.findById(request.taskId.trim());
      if (!existingTask) {
        return {
          success: false,
          error: `Task not found: ${request.taskId}`
        };
      }

      // Business rule: Can't delete tasks that have dependencies (other tasks depend on this one)
      // This would require a more complex check in a real system, but for now we'll just proceed
      
      // Delete the task
      const deleteSuccess = await this.taskRepository.delete(request.taskId.trim());

      if (!deleteSuccess) {
        return {
          success: false,
          error: 'Failed to delete task'
        };
      }

      return {
        success: true,
        deletedTask: {
          id: existingTask.id.value,
          title: existingTask.title
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}
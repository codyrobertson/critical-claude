/**
 * List Tasks Use Case
 * Application service for retrieving and filtering tasks
 */

import { Task, TaskId } from '../../domain/entities/Task.js';
import { Priority, TaskStatus, Repository, Result } from '../../shared/types.js';

export interface ListTasksRequest {
  status?: TaskStatus;
  priority?: Priority;
  assignee?: string;
  labels?: string[];
  includeArchived?: boolean;
  includeDrafts?: boolean;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'priority' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface ListTasksResponse {
  success: boolean;
  tasks?: Task[];
  count?: number;
  error?: string;
}

export class ListTasksUseCase {
  constructor(
    private readonly taskRepository: Repository<Task>
  ) {}

  async execute(request: ListTasksRequest = {}): Promise<ListTasksResponse> {
    try {
      // Get all tasks from repository
      const allTasks = await this.taskRepository.findAll();
      
      // Apply filters
      let filteredTasks = allTasks.filter(task => {
        // Status filter
        if (request.status && task.status !== request.status) {
          return false;
        }

        // Priority filter
        if (request.priority && task.priority !== request.priority) {
          return false;
        }

        // Assignee filter
        if (request.assignee && task.assignee !== request.assignee) {
          return false;
        }

        // Labels filter
        if (request.labels && request.labels.length > 0) {
          const hasMatchingLabel = request.labels.some(label => 
            task.labels.includes(label)
          );
          if (!hasMatchingLabel) {
            return false;
          }
        }

        // Archive filter
        if (!request.includeArchived && task.status === 'archived') {
          return false;
        }

        // Draft filter
        if (!request.includeDrafts && task.draft) {
          return false;
        }

        return true;
      });

      // Apply sorting
      const sortBy = request.sortBy || 'updatedAt';
      const sortOrder = request.sortOrder || 'desc';
      
      filteredTasks.sort((a, b) => {
        let aValue: any = a[sortBy];
        let bValue: any = b[sortBy];

        // Handle date sorting
        if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
          aValue = aValue.getTime();
          bValue = bValue.getTime();
        }

        // Handle priority sorting (map to numbers for comparison)
        if (sortBy === 'priority') {
          const priorityMap: Record<Priority, number> = { critical: 4, high: 3, medium: 2, low: 1 };
          aValue = priorityMap[aValue as Priority] || 0;
          bValue = priorityMap[bValue as Priority] || 0;
        }

        const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        return sortOrder === 'asc' ? comparison : -comparison;
      });

      // Apply limit
      if (request.limit && request.limit > 0) {
        filteredTasks = filteredTasks.slice(0, request.limit);
      }

      return {
        success: true,
        tasks: filteredTasks,
        count: filteredTasks.length
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}
/**
 * View Tasks Use Case
 * Implements the business logic for viewing and filtering tasks
 */

import { ITaskRepository, TaskFilter, TaskSort } from '../../domain/repositories/ITaskRepository.js';
import { Task } from '../../domain/entities/Task.js';
import { IEventBus } from '../ports/IEventBus.js';
import { ILogger } from '../ports/ILogger.js';

export interface ViewTasksRequest {
  filter?: TaskFilter;
  sort?: TaskSort;
  page?: number;
  pageSize?: number;
}

export interface ViewTasksResponse {
  tasks: Task[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface IViewTasksUseCase {
  execute(request: ViewTasksRequest): Promise<ViewTasksResponse>;
}

export class ViewTasksUseCase implements IViewTasksUseCase {
  constructor(
    private readonly taskRepository: ITaskRepository,
    private readonly eventBus: IEventBus,
    private readonly logger: ILogger
  ) {}

  async execute(request: ViewTasksRequest): Promise<ViewTasksResponse> {
    this.logger.info('Executing ViewTasksUseCase', { request });

    try {
      const { filter, sort, page = 1, pageSize = 50 } = request;

      const result = await this.taskRepository.findAll(
        filter,
        sort,
        { page, pageSize }
      );

      await this.eventBus.publish({
        type: 'TasksViewed',
        aggregateId: 'system',
        timestamp: new Date(),
        payload: {
          filter,
          sort,
          count: result.items.length
        }
      });

      return {
        tasks: result.items,
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        totalPages: result.totalPages
      };
    } catch (error) {
      this.logger.error('Failed to view tasks', error as Error, { request });
      throw error;
    }
  }
}
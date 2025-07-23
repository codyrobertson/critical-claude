/**
 * Search Tasks Use Case
 * Implements fuzzy search functionality for tasks
 */

import { ITaskRepository } from '../../domain/repositories/ITaskRepository.js';
import { Task } from '../../domain/entities/Task.js';
import { ILogger } from '../ports/ILogger.js';

export interface SearchTasksRequest {
  query: string;
  limit?: number;
}

export interface SearchTasksResponse {
  tasks: Task[];
  query: string;
  totalFound: number;
}

export interface ISearchTasksUseCase {
  execute(request: SearchTasksRequest): Promise<SearchTasksResponse>;
}

export class SearchTasksUseCase implements ISearchTasksUseCase {
  private static readonly DEFAULT_LIMIT = 20;
  private static readonly MAX_LIMIT = 100;

  constructor(
    private readonly taskRepository: ITaskRepository,
    private readonly logger: ILogger
  ) {}

  async execute(request: SearchTasksRequest): Promise<SearchTasksResponse> {
    this.logger.info('Executing SearchTasksUseCase', { request });

    try {
      const { query, limit = SearchTasksUseCase.DEFAULT_LIMIT } = request;

      if (!query || query.trim().length === 0) {
        return {
          tasks: [],
          query,
          totalFound: 0
        };
      }

      const effectiveLimit = Math.min(limit, SearchTasksUseCase.MAX_LIMIT);
      const tasks = await this.taskRepository.search(query, effectiveLimit);

      this.logger.debug('Search completed', {
        query,
        found: tasks.length,
        limit: effectiveLimit
      });

      return {
        tasks,
        query,
        totalFound: tasks.length
      };
    } catch (error) {
      this.logger.error('Failed to search tasks', error as Error, { request });
      throw error;
    }
  }
}
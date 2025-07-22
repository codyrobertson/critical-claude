/**
 * Task Service
 * High-level application service orchestrating task operations
 */

import {
  CreateTaskUseCase,
  ListTasksUseCase,
  ViewTaskUseCase,
  UpdateTaskUseCase,
  DeleteTaskUseCase,
  ArchiveTaskUseCase,
  GetTaskStatsUseCase,
  type CreateTaskRequest,
  type CreateTaskResponse,
  type ListTasksRequest,
  type ListTasksResponse,
  type ViewTaskRequest,
  type ViewTaskResponse,
  type UpdateTaskRequest,
  type UpdateTaskResponse,
  type DeleteTaskRequest,
  type DeleteTaskResponse,
  type ArchiveTaskRequest,
  type ArchiveTaskResponse,
  type GetTaskStatsResponse
} from '../use-cases/index.js';
import { Repository } from '../../shared/types.js';
import { Task } from '../../domain/entities/Task.js';

export class TaskService {
  private createTaskUseCase: CreateTaskUseCase;
  private listTasksUseCase: ListTasksUseCase;
  private viewTaskUseCase: ViewTaskUseCase;
  private updateTaskUseCase: UpdateTaskUseCase;
  private deleteTaskUseCase: DeleteTaskUseCase;
  private archiveTaskUseCase: ArchiveTaskUseCase;
  private getTaskStatsUseCase: GetTaskStatsUseCase;

  constructor(taskRepository: Repository<Task>) {
    this.createTaskUseCase = new CreateTaskUseCase(taskRepository);
    this.listTasksUseCase = new ListTasksUseCase(taskRepository);
    this.viewTaskUseCase = new ViewTaskUseCase(taskRepository);
    this.updateTaskUseCase = new UpdateTaskUseCase(taskRepository);
    this.deleteTaskUseCase = new DeleteTaskUseCase(taskRepository);
    this.archiveTaskUseCase = new ArchiveTaskUseCase(taskRepository);
    this.getTaskStatsUseCase = new GetTaskStatsUseCase(taskRepository);
  }

  // Core task operations
  async createTask(request: CreateTaskRequest): Promise<CreateTaskResponse> {
    return this.createTaskUseCase.execute(request);
  }

  async listTasks(request?: ListTasksRequest): Promise<ListTasksResponse> {
    return this.listTasksUseCase.execute(request);
  }

  async viewTask(request: ViewTaskRequest): Promise<ViewTaskResponse> {
    return this.viewTaskUseCase.execute(request);
  }

  async updateTask(request: UpdateTaskRequest): Promise<UpdateTaskResponse> {
    return this.updateTaskUseCase.execute(request);
  }

  async deleteTask(request: DeleteTaskRequest): Promise<DeleteTaskResponse> {
    return this.deleteTaskUseCase.execute(request);
  }

  async archiveTask(request: ArchiveTaskRequest): Promise<ArchiveTaskResponse> {
    return this.archiveTaskUseCase.execute(request);
  }

  async getStats(): Promise<GetTaskStatsResponse> {
    return this.getTaskStatsUseCase.execute();
  }

  // Convenience methods for common operations
  async getActiveTaskCount(): Promise<number> {
    const response = await this.listTasks({ includeArchived: false });
    return response.success ? response.count || 0 : 0;
  }

  async getTasksByPriority(priority: 'critical' | 'high' | 'medium' | 'low'): Promise<Task[]> {
    const response = await this.listTasks({ priority, includeArchived: false });
    return response.success ? response.tasks || [] : [];
  }

  async getTasksByAssignee(assignee: string): Promise<Task[]> {
    const response = await this.listTasks({ assignee, includeArchived: false });
    return response.success ? response.tasks || [] : [];
  }
}
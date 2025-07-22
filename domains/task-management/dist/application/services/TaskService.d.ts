/**
 * Task Service
 * High-level application service orchestrating task operations
 */
import { type CreateTaskRequest, type CreateTaskResponse, type ListTasksRequest, type ListTasksResponse, type ViewTaskRequest, type ViewTaskResponse, type UpdateTaskRequest, type UpdateTaskResponse, type DeleteTaskRequest, type DeleteTaskResponse, type ArchiveTaskRequest, type ArchiveTaskResponse, type GetTaskStatsResponse } from '../use-cases/index.js';
import { Repository } from '../../shared/types.js';
import { Task } from '../../domain/entities/Task.js';
export declare class TaskService {
    private createTaskUseCase;
    private listTasksUseCase;
    private viewTaskUseCase;
    private updateTaskUseCase;
    private deleteTaskUseCase;
    private archiveTaskUseCase;
    private getTaskStatsUseCase;
    constructor(taskRepository: Repository<Task>);
    createTask(request: CreateTaskRequest): Promise<CreateTaskResponse>;
    listTasks(request?: ListTasksRequest): Promise<ListTasksResponse>;
    viewTask(request: ViewTaskRequest): Promise<ViewTaskResponse>;
    updateTask(request: UpdateTaskRequest): Promise<UpdateTaskResponse>;
    deleteTask(request: DeleteTaskRequest): Promise<DeleteTaskResponse>;
    archiveTask(request: ArchiveTaskRequest): Promise<ArchiveTaskResponse>;
    getStats(): Promise<GetTaskStatsResponse>;
    getActiveTaskCount(): Promise<number>;
    getTasksByPriority(priority: 'critical' | 'high' | 'medium' | 'low'): Promise<Task[]>;
    getTasksByAssignee(assignee: string): Promise<Task[]>;
}
//# sourceMappingURL=TaskService.d.ts.map
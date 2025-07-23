/**
 * Task Service
 * High-level application service orchestrating task operations
 */
import { type CreateTaskRequest, type CreateTaskResponse, type ListTasksRequest, type ListTasksResponse, type ViewTaskRequest, type ViewTaskResponse, type UpdateTaskRequest, type UpdateTaskResponse, type DeleteTaskRequest, type DeleteTaskResponse, type ArchiveTaskRequest, type ArchiveTaskResponse, type GetTaskStatsResponse } from '../use-cases/index.js';
import { type ExportTasksRequest, type ExportTasksResponse } from '../use-cases/ExportTasksUseCase.js';
import { type ImportTasksRequest, type ImportTasksResponse } from '../use-cases/ImportTasksUseCase.js';
import { type BackupTasksRequest, type BackupTasksResponse } from '../use-cases/BackupTasksUseCase.js';
import { Task } from '../../domain/entities/Task.js';
import { ITaskRepository } from '../../domain/repositories/ITaskRepository.js';
export declare class TaskService {
    private createTaskUseCase;
    private listTasksUseCase;
    private viewTaskUseCase;
    private updateTaskUseCase;
    private deleteTaskUseCase;
    private archiveTaskUseCase;
    private getTaskStatsUseCase;
    private exportTasksUseCase;
    private importTasksUseCase;
    private backupTasksUseCase;
    constructor(taskRepository: ITaskRepository);
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
    exportTasks(request: ExportTasksRequest): Promise<ExportTasksResponse>;
    importTasks(request: ImportTasksRequest): Promise<ImportTasksResponse>;
    backupTasks(request?: BackupTasksRequest): Promise<BackupTasksResponse>;
    listBackups(backupDir?: string): Promise<{
        success: boolean;
        backups?: string[];
        error?: string;
    }>;
}
//# sourceMappingURL=TaskService.d.ts.map
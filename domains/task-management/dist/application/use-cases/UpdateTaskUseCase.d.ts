/**
 * Update Task Use Case
 * Application service for updating existing tasks
 */
import { Task } from '../../domain/entities/Task.js';
import { Priority, TaskStatus, Repository } from '../../shared/types.js';
export interface UpdateTaskRequest {
    taskId: string;
    title?: string;
    description?: string;
    status?: TaskStatus;
    priority?: Priority;
    assignee?: string;
    labels?: string[];
    estimatedHours?: number;
}
export interface UpdateTaskResponse {
    success: boolean;
    task?: Task;
    error?: string;
}
export declare class UpdateTaskUseCase {
    private readonly taskRepository;
    constructor(taskRepository: Repository<Task>);
    execute(request: UpdateTaskRequest): Promise<UpdateTaskResponse>;
}
//# sourceMappingURL=UpdateTaskUseCase.d.ts.map
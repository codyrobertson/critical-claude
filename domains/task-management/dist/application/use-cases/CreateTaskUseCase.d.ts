/**
 * Create Task Use Case
 * Application service for creating new tasks
 */
import { Task } from '../../domain/entities/Task.js';
import { Priority, Repository } from '../../shared/types.js';
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
export declare class CreateTaskUseCase {
    private readonly taskRepository;
    constructor(taskRepository: Repository<Task>);
    execute(request: CreateTaskRequest): Promise<CreateTaskResponse>;
}
//# sourceMappingURL=CreateTaskUseCase.d.ts.map
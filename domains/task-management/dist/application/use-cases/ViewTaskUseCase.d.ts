/**
 * View Task Use Case
 * Application service for retrieving a single task by ID
 */
import { Task } from '../../domain/entities/Task.js';
import { Repository } from '../../shared/types.js';
export interface ViewTaskRequest {
    taskId: string;
}
export interface ViewTaskResponse {
    success: boolean;
    task?: Task;
    error?: string;
}
export declare class ViewTaskUseCase {
    private readonly taskRepository;
    constructor(taskRepository: Repository<Task>);
    execute(request: ViewTaskRequest): Promise<ViewTaskResponse>;
}
//# sourceMappingURL=ViewTaskUseCase.d.ts.map
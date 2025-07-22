/**
 * Delete Task Use Case
 * Application service for deleting tasks from the system
 */
import { Task } from '../../domain/entities/Task.js';
import { Repository } from '../../../../../shared/common-types.js';
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
export declare class DeleteTaskUseCase {
    private readonly taskRepository;
    constructor(taskRepository: Repository<Task>);
    execute(request: DeleteTaskRequest): Promise<DeleteTaskResponse>;
}
//# sourceMappingURL=DeleteTaskUseCase.d.ts.map
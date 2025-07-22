/**
 * Archive Task Use Case
 * Application service for archiving tasks (soft delete)
 */
import { Task } from '../../domain/entities/Task.js';
import { Repository } from '../../../../../shared/common-types.js';
export interface ArchiveTaskRequest {
    taskId: string;
}
export interface ArchiveTaskResponse {
    success: boolean;
    archivedTask?: Task;
    error?: string;
}
export declare class ArchiveTaskUseCase {
    private readonly taskRepository;
    constructor(taskRepository: Repository<Task>);
    execute(request: ArchiveTaskRequest): Promise<ArchiveTaskResponse>;
}
//# sourceMappingURL=ArchiveTaskUseCase.d.ts.map
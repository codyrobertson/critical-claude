/**
 * List Tasks Use Case
 * Application service for retrieving and filtering tasks
 */
import { Task } from '../../domain/entities/Task.js';
import { Priority, TaskStatus, Repository } from '../../../../../shared/common-types.js';
export interface ListTasksRequest {
    status?: TaskStatus;
    priority?: Priority;
    assignee?: string;
    labels?: string[];
    includeArchived?: boolean;
    includeDrafts?: boolean;
    limit?: number;
    sortBy?: 'createdAt' | 'updatedAt' | 'priority' | 'title';
    sortOrder?: 'asc' | 'desc';
}
export interface ListTasksResponse {
    success: boolean;
    tasks?: Task[];
    count?: number;
    error?: string;
}
export declare class ListTasksUseCase {
    private readonly taskRepository;
    constructor(taskRepository: Repository<Task>);
    execute(request?: ListTasksRequest): Promise<ListTasksResponse>;
}
//# sourceMappingURL=ListTasksUseCase.d.ts.map
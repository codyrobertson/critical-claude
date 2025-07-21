/**
 * View Tasks Use Case
 * Implements the business logic for viewing and filtering tasks
 */
import { ITaskRepository, TaskFilter, TaskSort } from '../../domain/repositories/ITaskRepository';
import { Task } from '../../domain/entities/Task';
import { IEventBus } from '../ports/IEventBus';
import { ILogger } from '../ports/ILogger';
export interface ViewTasksRequest {
    filter?: TaskFilter;
    sort?: TaskSort;
    page?: number;
    pageSize?: number;
}
export interface ViewTasksResponse {
    tasks: Task[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}
export interface IViewTasksUseCase {
    execute(request: ViewTasksRequest): Promise<ViewTasksResponse>;
}
export declare class ViewTasksUseCase implements IViewTasksUseCase {
    private readonly taskRepository;
    private readonly eventBus;
    private readonly logger;
    constructor(taskRepository: ITaskRepository, eventBus: IEventBus, logger: ILogger);
    execute(request: ViewTasksRequest): Promise<ViewTasksResponse>;
}
//# sourceMappingURL=ViewTasksUseCase.d.ts.map
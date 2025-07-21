/**
 * Search Tasks Use Case
 * Implements fuzzy search functionality for tasks
 */
import { ITaskRepository } from '../../domain/repositories/ITaskRepository';
import { Task } from '../../domain/entities/Task';
import { ILogger } from '../ports/ILogger';
export interface SearchTasksRequest {
    query: string;
    limit?: number;
}
export interface SearchTasksResponse {
    tasks: Task[];
    query: string;
    totalFound: number;
}
export interface ISearchTasksUseCase {
    execute(request: SearchTasksRequest): Promise<SearchTasksResponse>;
}
export declare class SearchTasksUseCase implements ISearchTasksUseCase {
    private readonly taskRepository;
    private readonly logger;
    private static readonly DEFAULT_LIMIT;
    private static readonly MAX_LIMIT;
    constructor(taskRepository: ITaskRepository, logger: ILogger);
    execute(request: SearchTasksRequest): Promise<SearchTasksResponse>;
}
//# sourceMappingURL=SearchTasksUseCase.d.ts.map
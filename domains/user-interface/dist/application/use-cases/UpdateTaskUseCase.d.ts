/**
 * Update Task Use Case
 * Handles task updates with domain logic
 */
import { ITaskRepository } from '../../domain/repositories/ITaskRepository.js';
import { Task } from '../../domain/entities/Task.js';
import { IEventBus } from '../ports/IEventBus.js';
import { ILogger } from '../ports/ILogger.js';
export interface UpdateTaskRequest {
    taskId: string;
    title?: string;
    description?: string;
    status?: string;
    priority?: string;
    tags?: string[];
}
export interface UpdateTaskResponse {
    task: Task;
    previousVersion: Task;
}
export interface IUpdateTaskUseCase {
    execute(request: UpdateTaskRequest): Promise<UpdateTaskResponse>;
}
export declare class UpdateTaskUseCase implements IUpdateTaskUseCase {
    private readonly taskRepository;
    private readonly eventBus;
    private readonly logger;
    constructor(taskRepository: ITaskRepository, eventBus: IEventBus, logger: ILogger);
    execute(request: UpdateTaskRequest): Promise<UpdateTaskResponse>;
    private getChanges;
    private setsEqual;
}
//# sourceMappingURL=UpdateTaskUseCase.d.ts.map
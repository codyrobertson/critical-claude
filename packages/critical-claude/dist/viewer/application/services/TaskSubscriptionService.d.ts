/**
 * Task Subscription Service
 * Manages real-time task updates and subscriptions
 */
import { IEventBus } from '../ports/IEventBus.js';
import { ITaskRepository } from '../../domain/repositories/ITaskRepository.js';
import { TaskEvent } from '../../domain/events/DomainEvent.js';
import { TaskId } from '../../domain/value-objects/TaskId.js';
import { Task } from '../../domain/entities/Task.js';
import { ILogger } from '../ports/ILogger.js';
export type TaskChangeHandler = (task: Task, event: TaskEvent) => void;
export type TaskListChangeHandler = (tasks: Task[]) => void;
export interface ITaskSubscriptionService {
    subscribeToTask(taskId: TaskId, handler: TaskChangeHandler): () => void;
    subscribeToAllTasks(handler: TaskListChangeHandler): () => void;
    subscribeToFilteredTasks(filter: (task: Task) => boolean, handler: TaskListChangeHandler): () => void;
}
export declare class TaskSubscriptionService implements ITaskSubscriptionService {
    private readonly eventBus;
    private readonly taskRepository;
    private readonly logger;
    private taskSubscriptions;
    private allTasksSubscriptions;
    private filteredSubscriptions;
    constructor(eventBus: IEventBus, taskRepository: ITaskRepository, logger: ILogger);
    subscribeToTask(taskId: TaskId, handler: TaskChangeHandler): () => void;
    subscribeToAllTasks(handler: TaskListChangeHandler): () => void;
    subscribeToFilteredTasks(filter: (task: Task) => boolean, handler: TaskListChangeHandler): () => void;
    private initializeEventHandlers;
    private handleTaskEvent;
    private notifyAllTasksSubscribers;
    private notifyFilteredSubscribers;
}
//# sourceMappingURL=TaskSubscriptionService.d.ts.map
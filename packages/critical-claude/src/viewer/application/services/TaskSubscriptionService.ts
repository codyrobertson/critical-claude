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
  subscribeToFilteredTasks(
    filter: (task: Task) => boolean,
    handler: TaskListChangeHandler
  ): () => void;
}

export class TaskSubscriptionService implements ITaskSubscriptionService {
  private taskSubscriptions = new Map<string, Set<TaskChangeHandler>>();
  private allTasksSubscriptions = new Set<TaskListChangeHandler>();
  private filteredSubscriptions = new Map<TaskListChangeHandler, (task: Task) => boolean>();

  constructor(
    private readonly eventBus: IEventBus,
    private readonly taskRepository: ITaskRepository,
    private readonly logger: ILogger
  ) {
    this.initializeEventHandlers();
  }

  subscribeToTask(taskId: TaskId, handler: TaskChangeHandler): () => void {
    const id = taskId.value;
    
    if (!this.taskSubscriptions.has(id)) {
      this.taskSubscriptions.set(id, new Set());
    }
    
    this.taskSubscriptions.get(id)!.add(handler);
    
    this.logger.debug('Subscribed to task', { taskId: id });

    // Return unsubscribe function
    return () => {
      const handlers = this.taskSubscriptions.get(id);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.taskSubscriptions.delete(id);
        }
      }
      this.logger.debug('Unsubscribed from task', { taskId: id });
    };
  }

  subscribeToAllTasks(handler: TaskListChangeHandler): () => void {
    this.allTasksSubscriptions.add(handler);
    
    this.logger.debug('Subscribed to all tasks');

    return () => {
      this.allTasksSubscriptions.delete(handler);
      this.logger.debug('Unsubscribed from all tasks');
    };
  }

  subscribeToFilteredTasks(
    filter: (task: Task) => boolean,
    handler: TaskListChangeHandler
  ): () => void {
    this.filteredSubscriptions.set(handler, filter);
    
    this.logger.debug('Subscribed to filtered tasks');

    return () => {
      this.filteredSubscriptions.delete(handler);
      this.logger.debug('Unsubscribed from filtered tasks');
    };
  }

  private initializeEventHandlers(): void {
    // Subscribe to all task events
    this.eventBus.subscribe<TaskEvent>('TaskCreated', this.handleTaskEvent.bind(this));
    this.eventBus.subscribe<TaskEvent>('TaskCompleted', this.handleTaskEvent.bind(this));
    this.eventBus.subscribe<TaskEvent>('TaskPriorityChanged', this.handleTaskEvent.bind(this));
    this.eventBus.subscribe<TaskEvent>('TaskStatusChanged', this.handleTaskEvent.bind(this));
    this.eventBus.subscribe<TaskEvent>('TaskDeleted', this.handleTaskEvent.bind(this));
  }

  private async handleTaskEvent(event: TaskEvent): Promise<void> {
    try {
      const taskId = new TaskId(event.aggregateId);
      
      // Handle task-specific subscriptions
      const taskHandlers = this.taskSubscriptions.get(taskId.value);
      if (taskHandlers && taskHandlers.size > 0) {
        const task = await this.taskRepository.findById(taskId);
        if (task) {
          taskHandlers.forEach(handler => {
            try {
              handler(task, event);
            } catch (error) {
              this.logger.error('Task handler error', error as Error, { event });
            }
          });
        }
      }

      // Handle all-tasks subscriptions
      if (this.allTasksSubscriptions.size > 0) {
        await this.notifyAllTasksSubscribers();
      }

      // Handle filtered subscriptions
      if (this.filteredSubscriptions.size > 0) {
        await this.notifyFilteredSubscribers();
      }
    } catch (error) {
      this.logger.error('Failed to handle task event', error as Error, { event });
    }
  }

  private async notifyAllTasksSubscribers(): Promise<void> {
    const result = await this.taskRepository.findAll();
    const tasks = result.items;

    this.allTasksSubscriptions.forEach(handler => {
      try {
        handler(tasks);
      } catch (error) {
        this.logger.error('All tasks handler error', error as Error);
      }
    });
  }

  private async notifyFilteredSubscribers(): Promise<void> {
    const result = await this.taskRepository.findAll();
    const allTasks = result.items;

    this.filteredSubscriptions.forEach((filter, handler) => {
      try {
        const filteredTasks = allTasks.filter(filter);
        handler(filteredTasks);
      } catch (error) {
        this.logger.error('Filtered tasks handler error', error as Error);
      }
    });
  }
}
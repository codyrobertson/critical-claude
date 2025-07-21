/**
 * Task Subscription Service
 * Manages real-time task updates and subscriptions
 */
import { TaskId } from '../../domain/value-objects/TaskId';
export class TaskSubscriptionService {
    eventBus;
    taskRepository;
    logger;
    taskSubscriptions = new Map();
    allTasksSubscriptions = new Set();
    filteredSubscriptions = new Map();
    constructor(eventBus, taskRepository, logger) {
        this.eventBus = eventBus;
        this.taskRepository = taskRepository;
        this.logger = logger;
        this.initializeEventHandlers();
    }
    subscribeToTask(taskId, handler) {
        const id = taskId.value;
        if (!this.taskSubscriptions.has(id)) {
            this.taskSubscriptions.set(id, new Set());
        }
        this.taskSubscriptions.get(id).add(handler);
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
    subscribeToAllTasks(handler) {
        this.allTasksSubscriptions.add(handler);
        this.logger.debug('Subscribed to all tasks');
        return () => {
            this.allTasksSubscriptions.delete(handler);
            this.logger.debug('Unsubscribed from all tasks');
        };
    }
    subscribeToFilteredTasks(filter, handler) {
        this.filteredSubscriptions.set(handler, filter);
        this.logger.debug('Subscribed to filtered tasks');
        return () => {
            this.filteredSubscriptions.delete(handler);
            this.logger.debug('Unsubscribed from filtered tasks');
        };
    }
    initializeEventHandlers() {
        // Subscribe to all task events
        this.eventBus.subscribe('TaskCreated', this.handleTaskEvent.bind(this));
        this.eventBus.subscribe('TaskCompleted', this.handleTaskEvent.bind(this));
        this.eventBus.subscribe('TaskPriorityChanged', this.handleTaskEvent.bind(this));
        this.eventBus.subscribe('TaskStatusChanged', this.handleTaskEvent.bind(this));
        this.eventBus.subscribe('TaskDeleted', this.handleTaskEvent.bind(this));
    }
    async handleTaskEvent(event) {
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
                        }
                        catch (error) {
                            this.logger.error('Task handler error', error, { event });
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
        }
        catch (error) {
            this.logger.error('Failed to handle task event', error, { event });
        }
    }
    async notifyAllTasksSubscribers() {
        const result = await this.taskRepository.findAll();
        const tasks = result.items;
        this.allTasksSubscriptions.forEach(handler => {
            try {
                handler(tasks);
            }
            catch (error) {
                this.logger.error('All tasks handler error', error);
            }
        });
    }
    async notifyFilteredSubscribers() {
        const result = await this.taskRepository.findAll();
        const allTasks = result.items;
        this.filteredSubscriptions.forEach((filter, handler) => {
            try {
                const filteredTasks = allTasks.filter(filter);
                handler(filteredTasks);
            }
            catch (error) {
                this.logger.error('Filtered tasks handler error', error);
            }
        });
    }
}
//# sourceMappingURL=TaskSubscriptionService.js.map
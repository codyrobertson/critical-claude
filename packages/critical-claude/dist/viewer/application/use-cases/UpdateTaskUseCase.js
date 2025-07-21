/**
 * Update Task Use Case
 * Handles task updates with domain logic
 */
import { Task } from '../../domain/entities/Task';
import { TaskId } from '../../domain/value-objects/TaskId';
import { TaskStatus } from '../../domain/value-objects/TaskStatus';
import { TaskPriority } from '../../domain/value-objects/TaskPriority';
export class UpdateTaskUseCase {
    taskRepository;
    eventBus;
    logger;
    constructor(taskRepository, eventBus, logger) {
        this.taskRepository = taskRepository;
        this.eventBus = eventBus;
        this.logger = logger;
    }
    async execute(request) {
        this.logger.info('Executing UpdateTaskUseCase', { request });
        try {
            const taskId = new TaskId(request.taskId);
            const existingTask = await this.taskRepository.findById(taskId);
            if (!existingTask) {
                throw new Error(`Task not found: ${taskId.value}`);
            }
            let updatedTask = existingTask;
            // Apply status change if requested
            if (request.status && request.status !== existingTask.status.value) {
                const newStatus = TaskStatus.fromString(request.status);
                if (newStatus.isCompleted() && !existingTask.status.isCompleted()) {
                    updatedTask = updatedTask.complete();
                }
                else {
                    // Create new task with updated status
                    updatedTask = new Task(updatedTask.id, updatedTask.title, updatedTask.description, newStatus, updatedTask.priority, updatedTask.metadata, updatedTask.createdAt, new Date(), newStatus.isCompleted() ? new Date() : updatedTask.completedAt, updatedTask.tags, updatedTask.subtasks, updatedTask.parentId);
                }
            }
            // Apply priority change if requested
            if (request.priority && request.priority !== existingTask.priority.value) {
                const newPriority = TaskPriority.fromString(request.priority);
                updatedTask = updatedTask.updatePriority(newPriority);
            }
            // Apply other updates
            if (request.title || request.description || request.tags) {
                updatedTask = new Task(updatedTask.id, request.title || updatedTask.title, request.description || updatedTask.description, updatedTask.status, updatedTask.priority, updatedTask.metadata, updatedTask.createdAt, new Date(), updatedTask.completedAt, request.tags ? new Set(request.tags) : updatedTask.tags, updatedTask.subtasks, updatedTask.parentId);
            }
            // Save and publish events
            await this.taskRepository.save(updatedTask);
            const events = updatedTask.getEvents();
            if (events.length > 0) {
                await this.eventBus.publishMany(events);
                updatedTask.clearEvents();
            }
            this.logger.info('Task updated successfully', {
                taskId: taskId.value,
                changes: this.getChanges(existingTask, updatedTask)
            });
            return {
                task: updatedTask,
                previousVersion: existingTask
            };
        }
        catch (error) {
            this.logger.error('Failed to update task', error, { request });
            throw error;
        }
    }
    getChanges(original, updated) {
        const changes = {};
        if (original.title !== updated.title)
            changes.title = updated.title;
        if (original.description !== updated.description)
            changes.description = updated.description;
        if (!original.status.equals(updated.status))
            changes.status = updated.status.value;
        if (!original.priority.equals(updated.priority))
            changes.priority = updated.priority.value;
        if (!this.setsEqual(original.tags, updated.tags))
            changes.tags = Array.from(updated.tags);
        return changes;
    }
    setsEqual(a, b) {
        if (a.size !== b.size)
            return false;
        for (const item of a) {
            if (!b.has(item))
                return false;
        }
        return true;
    }
}
//# sourceMappingURL=UpdateTaskUseCase.js.map
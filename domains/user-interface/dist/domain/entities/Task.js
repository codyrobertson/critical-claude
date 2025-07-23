/**
 * Task Entity - Core business logic for tasks
 * Following Domain-Driven Design principles
 */
import { TaskStatus } from '../value-objects/TaskStatus.js';
export class Task {
    id;
    title;
    description;
    status;
    priority;
    metadata;
    createdAt;
    updatedAt;
    completedAt;
    tags;
    subtasks;
    parentId;
    _events = [];
    constructor(id, title, description, status, priority, metadata, createdAt, updatedAt, completedAt, tags = new Set(), subtasks = [], parentId) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.status = status;
        this.priority = priority;
        this.metadata = metadata;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.completedAt = completedAt;
        this.tags = tags;
        this.subtasks = subtasks;
        this.parentId = parentId;
    }
    // Domain methods
    complete() {
        if (this.status.isCompleted()) {
            throw new Error('Task is already completed');
        }
        const newStatus = TaskStatus.completed();
        const completedTask = new Task(this.id, this.title, this.description, newStatus, this.priority, this.metadata, this.createdAt, new Date(), new Date(), this.tags, this.subtasks, this.parentId);
        completedTask._events.push({
            type: 'TaskCompleted',
            aggregateId: this.id.value,
            timestamp: new Date(),
            payload: { taskId: this.id.value }
        });
        return completedTask;
    }
    updatePriority(priority) {
        const updatedTask = new Task(this.id, this.title, this.description, this.status, priority, this.metadata, this.createdAt, new Date(), this.completedAt, this.tags, this.subtasks, this.parentId);
        updatedTask._events.push({
            type: 'TaskPriorityChanged',
            aggregateId: this.id.value,
            timestamp: new Date(),
            payload: {
                taskId: this.id.value,
                oldPriority: this.priority.value,
                newPriority: priority.value
            }
        });
        return updatedTask;
    }
    addTag(tag) {
        const newTags = new Set(this.tags);
        newTags.add(tag);
        return new Task(this.id, this.title, this.description, this.status, this.priority, this.metadata, this.createdAt, new Date(), this.completedAt, newTags, this.subtasks, this.parentId);
    }
    getEvents() {
        return [...this._events];
    }
    clearEvents() {
        this._events = [];
    }
}
//# sourceMappingURL=Task.js.map
/**
 * Task Domain Entity
 * Core business entity representing a task in the system
 */
export class Task {
    id;
    title;
    description;
    status;
    priority;
    labels;
    createdAt;
    updatedAt;
    assignee;
    estimatedHours;
    dependencies;
    draft;
    constructor(id, title, description, status, priority, labels, createdAt, updatedAt, assignee, estimatedHours, dependencies = [], draft = false) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.status = status;
        this.priority = priority;
        this.labels = labels;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.assignee = assignee;
        this.estimatedHours = estimatedHours;
        this.dependencies = dependencies;
        this.draft = draft;
    }
    // Domain methods
    updateStatus(newStatus) {
        return new Task(this.id, this.title, this.description, newStatus, this.priority, this.labels, this.createdAt, new Date(), this.assignee, this.estimatedHours, this.dependencies, this.draft);
    }
    addLabel(label) {
        if (this.labels.includes(label)) {
            return this;
        }
        return new Task(this.id, this.title, this.description, this.status, this.priority, [...this.labels, label], this.createdAt, new Date(), this.assignee, this.estimatedHours, this.dependencies, this.draft);
    }
    assignTo(assignee) {
        return new Task(this.id, this.title, this.description, this.status, this.priority, this.labels, this.createdAt, new Date(), assignee, this.estimatedHours, this.dependencies, this.draft);
    }
    // Business rules
    canBeAssigned() {
        return this.status !== 'done' && this.status !== 'archived';
    }
    isBlocked() {
        return this.status === 'blocked';
    }
    isComplete() {
        return this.status === 'done';
    }
}
// Factory functions
export const TaskId = {
    create: (value) => ({ value }),
    generate: () => ({
        value: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    })
};
//# sourceMappingURL=Task.js.map
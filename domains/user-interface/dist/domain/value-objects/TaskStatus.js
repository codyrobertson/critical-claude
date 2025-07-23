/**
 * TaskStatus Value Object
 * Represents the status of a task with type safety
 */
export class TaskStatus {
    value;
    constructor(value) {
        this.value = value;
    }
    static pending() {
        return new TaskStatus('pending');
    }
    static inProgress() {
        return new TaskStatus('in_progress');
    }
    static completed() {
        return new TaskStatus('completed');
    }
    static cancelled() {
        return new TaskStatus('cancelled');
    }
    static blocked() {
        return new TaskStatus('blocked');
    }
    static fromString(value) {
        if (!this.isValidStatus(value)) {
            throw new Error(`Invalid task status: ${value}`);
        }
        return new TaskStatus(value);
    }
    static isValidStatus(value) {
        return ['pending', 'in_progress', 'completed', 'cancelled', 'blocked'].includes(value);
    }
    isPending() {
        return this.value === 'pending';
    }
    isInProgress() {
        return this.value === 'in_progress';
    }
    isCompleted() {
        return this.value === 'completed';
    }
    isCancelled() {
        return this.value === 'cancelled';
    }
    isBlocked() {
        return this.value === 'blocked';
    }
    isActive() {
        return this.isPending() || this.isInProgress() || this.isBlocked();
    }
    equals(other) {
        return this.value === other.value;
    }
    toString() {
        return this.value;
    }
}
//# sourceMappingURL=TaskStatus.js.map
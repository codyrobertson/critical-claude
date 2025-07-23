/**
 * TaskPriority Value Object
 * Encapsulates task priority with validation
 */
export class TaskPriority {
    value;
    static PRIORITY_ORDER = {
        critical: 4,
        high: 3,
        medium: 2,
        low: 1
    };
    constructor(value) {
        this.value = value;
    }
    static critical() {
        return new TaskPriority('critical');
    }
    static high() {
        return new TaskPriority('high');
    }
    static medium() {
        return new TaskPriority('medium');
    }
    static low() {
        return new TaskPriority('low');
    }
    static fromString(value) {
        if (!this.isValidPriority(value)) {
            throw new Error(`Invalid task priority: ${value}`);
        }
        return new TaskPriority(value);
    }
    static isValidPriority(value) {
        return ['critical', 'high', 'medium', 'low'].includes(value);
    }
    getOrder() {
        return TaskPriority.PRIORITY_ORDER[this.value];
    }
    isHigherThan(other) {
        return this.getOrder() > other.getOrder();
    }
    isLowerThan(other) {
        return this.getOrder() < other.getOrder();
    }
    equals(other) {
        return this.value === other.value;
    }
    toString() {
        return this.value;
    }
}
//# sourceMappingURL=TaskPriority.js.map
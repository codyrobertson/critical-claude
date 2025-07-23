/**
 * TaskId Value Object
 * Ensures task IDs are valid and provides type safety
 */
export class TaskId {
    value;
    constructor(value) {
        this.value = value;
        if (!value || value.trim().length === 0) {
            throw new Error('TaskId cannot be empty');
        }
    }
    equals(other) {
        return this.value === other.value;
    }
    toString() {
        return this.value;
    }
    static generate() {
        return new TaskId(crypto.randomUUID());
    }
}
//# sourceMappingURL=TaskId.js.map
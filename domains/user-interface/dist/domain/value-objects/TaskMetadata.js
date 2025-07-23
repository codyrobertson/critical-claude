/**
 * TaskMetadata Value Object
 * Encapsulates task metadata with immutability
 */
export class TaskMetadata {
    source;
    context;
    estimatedDuration;
    actualDuration;
    dependencies;
    customFields;
    constructor(source, context, estimatedDuration, actualDuration, dependencies = [], customFields = {}) {
        this.source = source;
        this.context = context;
        this.estimatedDuration = estimatedDuration;
        this.actualDuration = actualDuration;
        this.dependencies = dependencies;
        this.customFields = customFields;
    }
    withEstimatedDuration(duration) {
        return new TaskMetadata(this.source, this.context, duration, this.actualDuration, this.dependencies, this.customFields);
    }
    withActualDuration(duration) {
        return new TaskMetadata(this.source, this.context, this.estimatedDuration, duration, this.dependencies, this.customFields);
    }
    addDependency(dependency) {
        return new TaskMetadata(this.source, this.context, this.estimatedDuration, this.actualDuration, [...this.dependencies, dependency], this.customFields);
    }
    setCustomField(key, value) {
        return new TaskMetadata(this.source, this.context, this.estimatedDuration, this.actualDuration, this.dependencies, { ...this.customFields, [key]: value });
    }
}
//# sourceMappingURL=TaskMetadata.js.map
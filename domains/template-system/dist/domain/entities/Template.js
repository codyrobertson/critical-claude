/**
 * Template Entity
 * Represents a task template with variables and metadata
 */
export class TemplateId {
    _value;
    constructor(_value) {
        this._value = _value;
    }
    static create(value) {
        if (!value?.trim()) {
            throw new Error('Template ID cannot be empty');
        }
        return new TemplateId(value.trim());
    }
    static generate() {
        return new TemplateId(`template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
    }
    get value() {
        return this._value;
    }
    equals(other) {
        return this._value === other._value;
    }
}
export class Template {
    id;
    name;
    description;
    tasks;
    variables;
    metadata;
    constructor(id, name, description, tasks, variables, metadata) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.tasks = tasks;
        this.variables = variables;
        this.metadata = metadata;
        if (!name?.trim()) {
            throw new Error('Template name cannot be empty');
        }
        if (!tasks || tasks.length === 0) {
            throw new Error('Template must have at least one task');
        }
    }
    static create(name, description, tasks, variables = {}, metadata = {}) {
        const now = new Date();
        const fullMetadata = {
            createdAt: now,
            updatedAt: now,
            ...metadata
        };
        return new Template(TemplateId.generate(), name, description, tasks, variables, fullMetadata);
    }
    updateDescription(description) {
        return new Template(this.id, this.name, description, this.tasks, this.variables, { ...this.metadata, updatedAt: new Date() });
    }
    addVariable(key, value) {
        return new Template(this.id, this.name, this.description, this.tasks, { ...this.variables, [key]: value }, { ...this.metadata, updatedAt: new Date() });
    }
    getTaskCount() {
        const countTasks = (tasks) => {
            return tasks.reduce((count, task) => {
                return count + 1 + (task.subtasks ? countTasks(task.subtasks) : 0);
            }, 0);
        };
        return countTasks(this.tasks);
    }
    processVariables(values) {
        const processString = (str) => {
            return Object.entries(values).reduce((result, [key, value]) => {
                return result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
            }, str);
        };
        const processTasks = (tasks) => {
            return tasks.map(task => ({
                ...task,
                title: processString(task.title),
                description: task.description ? processString(task.description) : undefined,
                subtasks: task.subtasks ? processTasks(task.subtasks) : undefined
            }));
        };
        return new Template(this.id, processString(this.name), processString(this.description), processTasks(this.tasks), this.variables, { ...this.metadata, updatedAt: new Date() });
    }
}
//# sourceMappingURL=Template.js.map
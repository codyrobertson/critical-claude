/**
 * Template Entity
 * Represents a task template with variables and metadata
 */

export class TemplateId {
  private constructor(private readonly _value: string) {}

  static create(value: string): TemplateId {
    if (!value?.trim()) {
      throw new Error('Template ID cannot be empty');
    }
    return new TemplateId(value.trim());
  }

  static generate(): TemplateId {
    return new TemplateId(`template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  }

  get value(): string {
    return this._value;
  }

  equals(other: TemplateId): boolean {
    return this._value === other._value;
  }
}

export interface TemplateTask {
  title: string;
  description?: string;
  priority?: 'critical' | 'high' | 'medium' | 'low';
  labels?: string[];
  points?: number;
  hours?: number;
  dependsOn?: string[];
  subtasks?: TemplateTask[];
}

export interface TemplateMetadata {
  version?: string;
  author?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export class Template {
  constructor(
    public readonly id: TemplateId,
    public readonly name: string,
    public readonly description: string,
    public readonly tasks: TemplateTask[],
    public readonly variables: Record<string, string>,
    public readonly metadata: TemplateMetadata
  ) {
    if (!name?.trim()) {
      throw new Error('Template name cannot be empty');
    }
    if (!tasks || tasks.length === 0) {
      throw new Error('Template must have at least one task');
    }
  }

  static create(
    name: string,
    description: string,
    tasks: TemplateTask[],
    variables: Record<string, string> = {},
    metadata: Partial<TemplateMetadata> = {}
  ): Template {
    const now = new Date();
    const fullMetadata: TemplateMetadata = {
      createdAt: now,
      updatedAt: now,
      ...metadata
    };

    return new Template(
      TemplateId.generate(),
      name,
      description,
      tasks,
      variables,
      fullMetadata
    );
  }

  updateDescription(description: string): Template {
    return new Template(
      this.id,
      this.name,
      description,
      this.tasks,
      this.variables,
      { ...this.metadata, updatedAt: new Date() }
    );
  }

  addVariable(key: string, value: string): Template {
    return new Template(
      this.id,
      this.name,
      this.description,
      this.tasks,
      { ...this.variables, [key]: value },
      { ...this.metadata, updatedAt: new Date() }
    );
  }

  getTaskCount(): number {
    const countTasks = (tasks: TemplateTask[]): number => {
      return tasks.reduce((count, task) => {
        return count + 1 + (task.subtasks ? countTasks(task.subtasks) : 0);
      }, 0);
    };
    return countTasks(this.tasks);
  }

  processVariables(values: Record<string, string>): Template {
    const processString = (str: string): string => {
      return Object.entries(values).reduce((result, [key, value]) => {
        return result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
      }, str);
    };

    const processTasks = (tasks: TemplateTask[]): TemplateTask[] => {
      return tasks.map(task => ({
        ...task,
        title: processString(task.title),
        description: task.description ? processString(task.description) : undefined,
        subtasks: task.subtasks ? processTasks(task.subtasks) : undefined
      }));
    };

    return new Template(
      this.id,
      processString(this.name),
      processString(this.description),
      processTasks(this.tasks),
      this.variables,
      { ...this.metadata, updatedAt: new Date() }
    );
  }
}
/**
 * Research Project Entity
 * Represents a research project with query, findings, and metadata
 */

export class ResearchId {
  private constructor(private readonly _value: string) {}

  static create(value: string): ResearchId {
    if (!value?.trim()) {
      throw new Error('Research ID cannot be empty');
    }
    return new ResearchId(value.trim());
  }

  static generate(): ResearchId {
    return new ResearchId(`research-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  }

  get value(): string {
    return this._value;
  }

  equals(other: ResearchId): boolean {
    return this._value === other._value;
  }
}

export interface ResearchQuery {
  query: string;
  files?: string[];
  maxDepth?: number;
  teamSize?: number;
  outputFormat?: 'tasks' | 'report' | 'both';
}

export interface ResearchFinding {
  area: string;
  summary: string;
  insights: string[];
  sources: string[];
  confidence: number; // 0-1
}

export interface ResearchReport {
  executiveSummary: string;
  findings: ResearchFinding[];
  methodology: string;
  conclusions: string[];
  recommendations: string[];
  nextSteps: string[];
  qualityScore: number; // 0-1
}

export interface ResearchMetadata {
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  duration?: number; // in milliseconds
  researcher?: string;
}

export class ResearchProject {
  constructor(
    public readonly id: ResearchId,
    public readonly query: ResearchQuery,
    public readonly report: ResearchReport | null,
    public readonly metadata: ResearchMetadata
  ) {
    if (!query.query?.trim()) {
      throw new Error('Research query cannot be empty');
    }
  }

  static create(
    query: ResearchQuery,
    researcher?: string
  ): ResearchProject {
    const metadata: ResearchMetadata = {
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'pending',
      researcher
    };

    return new ResearchProject(
      ResearchId.generate(),
      query,
      null,
      metadata
    );
  }

  startResearch(): ResearchProject {
    const updatedMetadata: ResearchMetadata = {
      ...this.metadata,
      status: 'in_progress',
      updatedAt: new Date()
    };

    return new ResearchProject(
      this.id,
      this.query,
      this.report,
      updatedMetadata
    );
  }

  completeResearch(report: ResearchReport): ResearchProject {
    const completedAt = new Date();
    const duration = completedAt.getTime() - this.metadata.createdAt.getTime();

    const updatedMetadata: ResearchMetadata = {
      ...this.metadata,
      status: 'completed',
      updatedAt: completedAt,
      completedAt,
      duration
    };

    return new ResearchProject(
      this.id,
      this.query,
      report,
      updatedMetadata
    );
  }

  failResearch(error: string): ResearchProject {
    const updatedMetadata: ResearchMetadata = {
      ...this.metadata,
      status: 'failed',
      updatedAt: new Date()
    };

    return new ResearchProject(
      this.id,
      this.query,
      this.report,
      updatedMetadata
    );
  }

  isCompleted(): boolean {
    return this.metadata.status === 'completed' && this.report !== null;
  }

  getDuration(): number {
    if (this.metadata.duration) {
      return this.metadata.duration;
    }
    
    const endTime = this.metadata.completedAt || new Date();
    return endTime.getTime() - this.metadata.createdAt.getTime();
  }

  getFormattedDuration(): string {
    const durationMs = this.getDuration();
    const seconds = Math.floor(durationMs / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  }

  generateTasksFromReport(): any[] {
    if (!this.report) {
      return [];
    }

    const tasks = [];

    // Create a main research summary task
    tasks.push({
      title: `Research Summary: ${this.query.query}`,
      description: this.report.executiveSummary,
      priority: 'medium',
      labels: ['research', 'summary'],
      hours: 1
    });

    // Create tasks from recommendations
    this.report.recommendations.forEach((rec, index) => {
      tasks.push({
        title: `Implement: ${rec.substring(0, 50)}${rec.length > 50 ? '...' : ''}`,
        description: rec,
        priority: 'high',
        labels: ['research', 'implementation'],
        hours: 2
      });
    });

    // Create tasks from next steps
    this.report.nextSteps.forEach((step, index) => {
      tasks.push({
        title: `Next Step: ${step.substring(0, 50)}${step.length > 50 ? '...' : ''}`,
        description: step,
        priority: 'medium',
        labels: ['research', 'next-steps'],
        hours: 1
      });
    });

    return tasks;
  }
}
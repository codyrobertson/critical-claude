/**
 * Research Project Entity
 * Represents a research project with query, findings, and metadata
 */
export class ResearchId {
    _value;
    constructor(_value) {
        this._value = _value;
    }
    static create(value) {
        if (!value?.trim()) {
            throw new Error('Research ID cannot be empty');
        }
        return new ResearchId(value.trim());
    }
    static generate() {
        return new ResearchId(`research-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
    }
    get value() {
        return this._value;
    }
    equals(other) {
        return this._value === other._value;
    }
}
export class ResearchProject {
    id;
    query;
    report;
    metadata;
    constructor(id, query, report, metadata) {
        this.id = id;
        this.query = query;
        this.report = report;
        this.metadata = metadata;
        if (!query.query?.trim()) {
            throw new Error('Research query cannot be empty');
        }
    }
    static create(query, researcher) {
        const metadata = {
            createdAt: new Date(),
            updatedAt: new Date(),
            status: 'pending',
            researcher
        };
        return new ResearchProject(ResearchId.generate(), query, null, metadata);
    }
    startResearch() {
        const updatedMetadata = {
            ...this.metadata,
            status: 'in_progress',
            updatedAt: new Date()
        };
        return new ResearchProject(this.id, this.query, this.report, updatedMetadata);
    }
    completeResearch(report) {
        const completedAt = new Date();
        const duration = completedAt.getTime() - this.metadata.createdAt.getTime();
        const updatedMetadata = {
            ...this.metadata,
            status: 'completed',
            updatedAt: completedAt,
            completedAt,
            duration
        };
        return new ResearchProject(this.id, this.query, report, updatedMetadata);
    }
    failResearch(error) {
        const updatedMetadata = {
            ...this.metadata,
            status: 'failed',
            updatedAt: new Date()
        };
        return new ResearchProject(this.id, this.query, this.report, updatedMetadata);
    }
    isCompleted() {
        return this.metadata.status === 'completed' && this.report !== null;
    }
    getDuration() {
        if (this.metadata.duration) {
            return this.metadata.duration;
        }
        const endTime = this.metadata.completedAt || new Date();
        return endTime.getTime() - this.metadata.createdAt.getTime();
    }
    getFormattedDuration() {
        const durationMs = this.getDuration();
        const seconds = Math.floor(durationMs / 1000);
        const minutes = Math.floor(seconds / 60);
        if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        }
        return `${seconds}s`;
    }
    generateTasksFromReport() {
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
//# sourceMappingURL=ResearchProject.js.map
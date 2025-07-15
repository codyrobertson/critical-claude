/**
 * BacklogManager - Core data persistence for AGILE hierarchy
 * Handles Phase > Epic > Sprint > Task management with markdown storage
 */
import { Phase, Epic, Sprint, EnhancedTask, AITaskSuggestion, TaskStatus } from '../types/agile.js';
export interface BacklogConfig {
    backlogPath: string;
    phasesPath: string;
    epicsPath: string;
    sprintsPath: string;
    tasksPath: string;
}
export declare class BacklogManager {
    private config;
    private stateManager;
    private _initialized;
    constructor(config?: Partial<BacklogConfig>);
    initialize(): Promise<void>;
    isInitialized(): boolean;
    private ensureDirectories;
    createPhase(phaseData: Partial<Phase>): Promise<Phase>;
    getPhases(statusFilter?: string): Promise<Phase[]>;
    getPhase(id: string): Promise<Phase | null>;
    updatePhase(id: string, updates: Partial<Phase>): Promise<Phase | null>;
    private savePhase;
    createEpic(epicData: Partial<Epic> & {
        phaseId: string;
    }): Promise<Epic>;
    getEpics(phaseId?: string, statusFilter?: string): Promise<Epic[]>;
    private saveEpic;
    createSprint(sprintData: Partial<Sprint> & {
        epicId: string;
    }): Promise<Sprint>;
    getSprint(id: string): Promise<Sprint | null>;
    getSprints(epicId?: string, statusFilter?: string): Promise<Sprint[]>;
    getEpic(id: string): Promise<Epic | null>;
    updateSprint(id: string, updates: Partial<Sprint>): Promise<Sprint | null>;
    private saveSprint;
    createTask(taskData: any): Promise<EnhancedTask>;
    createTasksFromSuggestions(suggestions: AITaskSuggestion[], sprintId?: string): Promise<EnhancedTask[]>;
    private saveTask;
    generateMarkdownSummary(): Promise<string>;
    getProjectStats(): Promise<{
        totalPhases: number;
        totalEpics: number;
        totalSprints: number;
        totalTasks: number;
        aiGeneratedTasks: number;
    }>;
    changeTaskState(taskId: string, newState: TaskStatus, changedBy: string, reason?: string, metadata?: Record<string, any>): Promise<{
        success: boolean;
        message: string;
        task?: EnhancedTask;
    }>;
    focusTask(taskId: string, developerId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    blockTask(taskId: string, blockedBy: string, reason: string, expectedResolution?: Date): Promise<{
        success: boolean;
        message: string;
    }>;
    completeTask(taskId: string, completedBy: string, verificationNotes?: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getTask(id: string): Promise<EnhancedTask | null>;
    private ensureAcceptanceCriteria;
    private ensureTaskDependencies;
    private convertAcceptanceCriteria;
    private convertTaskDependencies;
}
//# sourceMappingURL=backlog-manager.d.ts.map
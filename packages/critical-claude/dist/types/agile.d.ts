/**
 * AGILE hierarchy types for Critical Claude Backlog
 * Phase > Epic > Sprint > Task structure
 */
export interface Phase {
    id: string;
    name: string;
    description: string;
    startDate: Date;
    endDate: Date;
    status: 'planning' | 'active' | 'completed' | 'cancelled';
    epics: string[];
    goals: string[];
    createdAt: Date;
    updatedAt: Date;
}
export interface Epic {
    id: string;
    phaseId: string;
    name: string;
    description: string;
    businessValue: string;
    acceptanceCriteria: string[];
    sprints: string[];
    estimatedEffort: number;
    actualEffort?: number;
    priority: 'critical' | 'high' | 'medium' | 'low';
    status: 'backlog' | 'planning' | 'in-progress' | 'completed' | 'cancelled';
    assignee?: string;
    labels: string[];
    createdAt: Date;
    updatedAt: Date;
}
export interface Sprint {
    id: string;
    epicId: string;
    name: string;
    goal: string;
    startDate: Date;
    endDate: Date;
    capacity: number;
    tasks: EnhancedTask[];
    status: 'planning' | 'active' | 'review' | 'completed';
    velocity?: number;
    burndownData?: BurndownPoint[];
    retrospective?: {
        whatWentWell: string[];
        whatCouldImprove: string[];
        actionItems: string[];
    };
    createdAt: Date;
    updatedAt: Date;
}
export interface EnhancedTask {
    id: string;
    sprintId?: string;
    title: string;
    description: string;
    status: TaskStatus;
    assignee?: string;
    storyPoints: number;
    priority: 'critical' | 'high' | 'medium' | 'low';
    labels: string[];
    acceptanceCriteria: AcceptanceCriterion[];
    dependencies: TaskDependency[];
    notes?: TaskNote[];
    codeReferences: CodeReference[];
    generatedBy: 'manual' | 'ai' | 'hook' | 'analysis';
    aiMetadata?: {
        confidence: number;
        reasoning: string;
        suggestedEffort: number;
        riskFactors: string[];
    };
    timeTracking: {
        estimated: number;
        actual: number;
        remaining: number;
        lastActivity?: Date;
    };
    stateHistory: TaskStateTransition[];
    blockerInfo?: {
        reason: string;
        expectedResolution?: Date;
        escalatedAt?: Date;
        blockedBy?: string;
    };
    focusMetadata?: {
        focusedAt: Date;
        estimatedCompletion: Date;
        lastCommit?: Date;
        lastTimeEntry?: Date;
    };
    createdAt: Date;
    updatedAt: Date;
    completedAt?: Date;
    archivedAt?: Date;
    archivedReason?: string;
}
export type TaskStatus = 'todo' | 'focused' | 'in-progress' | 'blocked' | 'dimmed' | 'done' | 'archived_done' | 'archived_blocked' | 'archived_dimmed';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export interface AcceptanceCriterion {
    id: string;
    description: string;
    verified: boolean;
    verifiedBy?: string;
    verifiedAt?: Date;
    testCases?: string[];
}
export interface TaskDependency {
    taskId: string;
    type: 'blocks' | 'blocked_by' | 'related';
    createdAt: Date;
    createdBy: string;
    reason?: string;
}
export interface TaskStateTransition {
    id: string;
    fromState: TaskStatus | null;
    toState: TaskStatus;
    changedBy: string;
    changedAt: Date;
    reason?: string;
    validationResult?: StateValidationResult;
    criticalClaudeAnalysis?: Record<string, any>;
}
export interface StateValidationResult {
    valid: boolean;
    reason?: string;
    warnings?: string[];
    requiredActions?: StateAction[];
    criticalClaudeRecommendations?: string[];
}
export interface StateAction {
    type: 'block_transition' | 'create_task' | 'escalate' | 'notify' | 'run_analysis';
    target: string;
    metadata: Record<string, any>;
}
export interface TaskNote {
    id: string;
    content: string;
    author: string;
    createdAt: Date;
    type: 'progress' | 'blocker' | 'question' | 'decision' | 'state_change';
}
export interface CodeReference {
    filePath: string;
    lineStart?: number;
    lineEnd?: number;
    type: 'implementation' | 'test' | 'documentation' | 'related';
    description?: string;
}
export interface BurndownPoint {
    date: Date;
    remainingStoryPoints: number;
    completedStoryPoints: number;
    idealRemaining: number;
}
export interface AITaskSuggestion {
    title: string;
    description: string;
    estimatedEffort: number;
    priority: 'critical' | 'high' | 'medium' | 'low';
    labels: string[];
    acceptanceCriteria: string[];
    reasoning: string;
    confidence: number;
    codeReferences: CodeReference[];
    dependencies: string[];
}
export interface SprintAnalysis {
    sprintId: string;
    velocityTrend: number[];
    riskFactors: string[];
    suggestions: string[];
    predictedCompletion: Date;
    confidenceLevel: number;
    blockers: {
        taskId: string;
        reason: string;
        suggestedAction: string;
    }[];
}
export interface HookTrigger {
    type: 'commit' | 'pr' | 'ci' | 'deployment';
    pattern?: string;
    action: HookAction;
    conditions?: Record<string, any>;
}
export interface HookAction {
    type: 'create_task' | 'analyze_code' | 'update_task' | 'notify_team';
    template?: string;
    aiTools?: string[];
    assignee?: string;
    priority?: 'critical' | 'high' | 'medium' | 'low';
    labels?: string[];
    sprint?: string;
}
export interface AgileCommand {
    entity: 'phase' | 'epic' | 'sprint' | 'task';
    action: 'create' | 'list' | 'edit' | 'delete' | 'start' | 'complete';
    options: Record<string, any>;
}
export interface CriticalClaudeCommand {
    tool: 'plan' | 'analyze' | 'estimate' | 'review' | 'sprint-plan';
    target?: string;
    options: Record<string, any>;
}
export interface BacklogFile {
    type: 'phase' | 'epic' | 'sprint' | 'task';
    id: string;
    filePath: string;
    metadata: Record<string, any>;
    content: string;
    lastModified: Date;
}
export interface BacklogWorkspace {
    name: string;
    rootPath: string;
    phases: Phase[];
    config: BacklogConfig;
    hooks: HookTrigger[];
}
export interface BacklogConfig {
    defaultSprintLength: number;
    defaultCapacity: number;
    storyPointScale: number[];
    aiEnabled: boolean;
    hooksEnabled: boolean;
    maxFocusedTasks: number;
    maxInProgressTasks: number;
    autoArchiveDays: number;
    blockerEscalationDays: number;
    criticalClaudeEndpoint?: string;
    teamMembers: {
        username: string;
        name: string;
        role: string;
        capacity: number;
        maxFocusedTasks?: number;
    }[];
}
//# sourceMappingURL=agile.d.ts.map
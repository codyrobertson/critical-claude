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
  epics: Epic[];
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
  sprints: Sprint[];
  estimatedEffort: number; // story points
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
  capacity: number; // story points
  tasks: EnhancedTask[];
  status: 'planning' | 'active' | 'review' | 'completed';
  velocity?: number; // actual story points completed
  burndownData: BurndownPoint[];
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
  status: 'todo' | 'in-progress' | 'review' | 'done' | 'blocked';
  assignee?: string;
  storyPoints: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  labels: string[];
  acceptanceCriteria: string[];
  dependencies: string[]; // task IDs
  notes: TaskNote[];
  codeReferences: CodeReference[];
  generatedBy: 'manual' | 'ai' | 'hook' | 'analysis';
  aiMetadata?: {
    confidence: number;
    reasoning: string;
    suggestedEffort: number;
    riskFactors: string[];
  };
  timeTracking: {
    estimated: number; // hours
    actual: number; // hours
    remaining: number; // hours
  };
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface TaskNote {
  id: string;
  content: string;
  author: string;
  createdAt: Date;
  type: 'progress' | 'blocker' | 'question' | 'decision';
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

// AI Integration Types
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

// Hook Integration Types
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

// CLI Command Types
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

// File System Types (extending Backlog.md structure)
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
  defaultSprintLength: number; // days
  defaultCapacity: number; // story points
  storyPointScale: number[]; // [1, 2, 3, 5, 8, 13, 21]
  aiEnabled: boolean;
  hooksEnabled: boolean;
  criticalClaudeEndpoint?: string;
  teamMembers: {
    username: string;
    name: string;
    role: string;
    capacity: number; // story points per sprint
  }[];
}
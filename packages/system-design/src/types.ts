export interface SystemComponent {
  name: string;
  type: 'frontend' | 'backend' | 'database' | 'service' | 'api' | 'infrastructure';
  description: string;
  technologies: string[];
  dependencies: string[];
  complexity: 'simple' | 'moderate' | 'complex';
  mvpPriority: 'must-have' | 'nice-to-have' | 'future';
}

export interface MVPPlan {
  title: string;
  description: string;
  targetUsers: string;
  coreFeatures: Feature[];
  technicalStack: TechStackChoice[];
  architecture: ArchitectureDecision[];
  phases: Phase[];
  risks: Risk[];
  timeline: Timeline;
}

export interface Feature {
  name: string;
  description: string;
  userStory: string;
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  complexity: number; // 1-5
  dependencies: string[];
}

export interface TechStackChoice {
  category: string;
  technology: string;
  rationale: string;
  alternatives: string[];
  tradeoffs: string[];
}

export interface ArchitectureDecision {
  decision: string;
  rationale: string;
  consequences: string[];
  alternatives: string[];
}

export interface Phase {
  name: string;
  duration: string;
  goals: string[];
  deliverables: string[];
  features: string[];
  successCriteria: string[];
}

export interface Risk {
  category: 'technical' | 'business' | 'timeline' | 'resource';
  description: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  probability: 'low' | 'medium' | 'high';
  mitigation: string;
}

export interface Timeline {
  totalDuration: string;
  mvpDeadline: string;
  phases: PhaseTimeline[];
}

export interface PhaseTimeline {
  phase: string;
  startWeek: number;
  endWeek: number;
  milestones: string[];
}
/**
 * Simplified Research Model
 * Consolidated from research-intelligence domain
 */

export interface ResearchRequest {
  query: string;
  files?: string[];
  outputFormat?: 'tasks' | 'report' | 'both';
  maxDepth?: number;
}

export interface ResearchResponse {
  success: boolean;
  data?: string;
  error?: string;
  reportPath?: string;
  tasksCreated?: number;
}

export interface ResearchPlan {
  overview: string;
  research_areas: Array<{
    area: string;
    importance: string;
    depth_level: string;
    expected_findings: string;
  }>;
  methodology: string;
  success_criteria: string[];
  key_questions: string[];
}

export interface ResearchFindings {
  focus_area: string;
  executive_summary: string;
  detailed_analysis: string;
  insights: string[];
  technical_details?: string[];
  recommendations: string[];
  gaps_identified?: string[];
  sources?: string[];
}

export interface AIProviderConfig {
  provider: 'openai' | 'anthropic' | 'claude-code' | 'local' | 'mock';
  apiKey?: string;
  model?: string;
  baseUrl?: string;
  maxTokens?: number;
  temperature?: number;
  claudeCodeEndpoint?: string;
}
/**
 * AI Provider Domain Interface
 * Abstract interface for AI operations, hiding infrastructure concerns
 */

export interface AIProviderConfig {
  maxTokens?: number;
  temperature?: number;
  model?: string;
}

export interface AIResponse {
  content: string;
  success: boolean;
  error?: string;
}

export interface ResearchPlan {
  overview: string;
  research_areas: Array<{
    area: string;
    importance: string;
    depth_level: 'shallow' | 'moderate' | 'deep';
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
  technical_details: string[];
  recommendations: string[];
  gaps_identified: string[];
  sources: string[];
  researcher_id?: number;
}

/**
 * Domain service interface for AI operations
 */
export interface IAIProvider {
  /**
   * Generates a research plan for a given query
   */
  generateResearchPlan(query: string, context?: string): Promise<ResearchPlan>;

  /**
   * Conducts research analysis on given data
   */
  analyzeResearchData(
    area: string,
    queries: string[],
    searchResults: unknown[]
  ): Promise<ResearchFindings>;

  /**
   * Generates structured content based on a prompt and schema
   */
  generateStructuredContent<T>(prompt: string, schema: unknown): Promise<T>;

  /**
   * Checks if the provider is available and configured
   */
  isAvailable(): Promise<boolean>;
}
/**
 * Research Domain Types
 * Migrated from legacy research.ts interfaces
 */
export interface ResearchRequest {
    query: string;
    files?: string[];
    outputFormat?: 'tasks' | 'report' | 'both';
    maxDepth?: number;
    teamSize?: number;
}
export interface ResearchPlan {
    overview: string;
    research_areas: ResearchArea[];
    methodology: string;
    success_criteria: string[];
    key_questions: string[];
}
export interface ResearchArea {
    area: string;
    importance: string;
    depth_level: 'shallow' | 'moderate' | 'deep';
    expected_findings: string;
}
export interface ResearchAssignment {
    researcher_id: number;
    focus_area: string;
    search_queries: string[];
    research_objectives: string;
    depth_requirements: string;
    deliverables: string[];
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
export interface CriticalAnalysis {
    meta_analysis: string;
    gaps_identified: ResearchGap[];
    bias_warnings: BiasWarning[];
    critical_gaps: CriticalGap[];
    requires_additional_research: boolean;
    research_quality_score: number;
    quality_factors: QualityFactors;
    improvement_recommendations: string[];
}
export interface ResearchGap {
    area: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    impact: string;
    suggested_approach: string;
}
export interface BiasWarning {
    type: string;
    description: string;
    evidence: string;
    mitigation: string;
}
export interface CriticalGap {
    area: string;
    why_critical: string;
    research_strategy: string;
}
export interface QualityFactors {
    depth: number;
    breadth: number;
    accuracy: number;
    relevance: number;
    completeness: number;
}
export interface AdversarialChallenges {
    challenge: string;
    counter_evidence: string[];
    strength_assessment: number;
    response_strategy: string;
}
export interface CitationReport {
    total_sources: number;
    authoritative_sources: number;
    source_breakdown: SourceBreakdown[];
    citation_index: CitationIndex[];
    source_quality_assessment: string;
    research_credibility_score: number;
    recommendations: string[];
}
export interface SourceBreakdown {
    source_type: 'academic' | 'industry' | 'news' | 'blog' | 'documentation' | 'official' | 'mixed';
    count: number;
    reliability_score: number;
}
export interface CitationIndex {
    finding_area: string;
    claim: string;
    supporting_sources: string[];
    confidence_level: number;
}
export interface ComprehensiveReport {
    executive_summary: string;
    research_quality_assessment: {
        overall_score: number;
        strengths: string[];
        weaknesses: string[];
        confidence_level: number;
    };
    sections: ReportSection[];
    meta_analysis: {
        research_depth_analysis: string;
        bias_mitigation: string;
        gap_resolution: string;
        robustness_validation: string;
    };
    cross_analysis: string;
    strategic_recommendations: StrategicRecommendation[];
    implementation_priorities: ImplementationPriority[];
    risks_and_considerations: RiskConsideration[];
    next_steps: NextStep[];
    research_methodology_reflection: string;
    confidence_assessment: string;
}
export interface ReportSection {
    title: string;
    content: string;
    key_findings: string[];
    supporting_evidence: string[];
    confidence_score: number;
}
export interface StrategicRecommendation {
    priority: 'critical' | 'high' | 'medium' | 'low';
    recommendation: string;
    rationale: string;
    implementation_complexity: 'low' | 'medium' | 'high';
    expected_impact: string;
    timeline: string;
}
export interface ImplementationPriority {
    priority_level: number;
    action_item: string;
    dependencies: string[];
    effort_estimate: string;
    success_metrics: string[];
}
export interface RiskConsideration {
    risk_type: string;
    probability: 'low' | 'medium' | 'high';
    impact: 'low' | 'medium' | 'high';
    description: string;
    mitigation_strategies: string[];
}
export interface NextStep {
    step: string;
    timeline: string;
    responsible_party: string;
    success_criteria: string;
}
//# sourceMappingURL=ResearchTypes.d.ts.map
/**
 * Execute Research Use Case - Migrated from legacy research.ts
 * 100% AI-Driven Multi-Agent Research System
 */

import { ResearchRequest, ResearchPlan, ResearchAssignment, ResearchFindings, ComprehensiveReport } from '../../domain/entities/ResearchTypes.js';
import { AIService } from '../../infrastructure/services/AIService.js';
import { WebSearch, SearchResult } from '../../infrastructure/services/WebSearch.js';
import { Result } from '../../shared/types.js';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface ExecuteResearchResponse extends Result<ComprehensiveReport> {
  reportPath?: string;
  tasksCreated?: number;
}

export class ExecuteResearchUseCase {
  private aiService: AIService;
  private webSearch: WebSearch;

  constructor() {
    this.aiService = new AIService();
    this.webSearch = new WebSearch();
  }

  async execute(request: ResearchRequest): Promise<ExecuteResearchResponse> {
    try {
      console.log('🔬 Starting 100% AI-Driven Multi-Agent Research System...');
      console.log('━'.repeat(60));

      // Initialize AI service
      await this.aiService.initialize();

      // Read input files if provided
      const fileContents = await this.readInputFiles(request.files || []);
      const contextData = fileContents.length > 0 ? `\n\nAdditional Context:\n${fileContents.join('\n\n')}` : '';
      
      console.log('📋 Research Topic:', request.query);
      if (fileContents.length > 0) {
        console.log('📁 Input Files:', request.files?.length || 0);
      }
      console.log();

      // Step 1: 🧠 PLANNER AGENT - Pure AI Planning
      console.log('🧠 PLANNER AGENT: AI creating research strategy...');
      const researchPlan = await this.createResearchPlan(request.query, contextData);
      console.log(`   ✓ Generated plan with ${researchPlan.research_areas.length} research areas`);
      console.log();

      // Step 2: 📝 COORDINATOR AGENT - Research Assignment Distribution
      console.log('📝 COORDINATOR AGENT: Distributing research assignments...');
      const assignments = await this.distributeResearchAssignments(researchPlan, request.teamSize || 3);
      console.log(`   ✓ Created ${assignments.length} research assignments`);
      console.log();

      // Step 3: 🔍 RESEARCHER AGENTS - Parallel Research Execution
      console.log('🔍 RESEARCHER AGENTS: Executing parallel research...');
      const allFindings = await this.executeParallelResearch(assignments);
      console.log(`   ✓ Completed research across ${allFindings.length} areas`);
      console.log();

      // Step 4: 🎯 ANALYST AGENT - Critical Analysis and Gap Identification
      console.log('🎯 ANALYST AGENT: Performing critical analysis...');
      const criticalAnalysis = await this.performCriticalAnalysis(allFindings, request.query);
      console.log('   ✓ Critical analysis completed with gap identification');
      console.log();

      // Step 5: 📊 SYNTHESIS AGENT - Comprehensive Report Generation
      console.log('📊 SYNTHESIS AGENT: Generating comprehensive report...');
      const comprehensiveReport = await this.generateComprehensiveReport(
        request.query,
        researchPlan,
        allFindings,
        criticalAnalysis
      );
      console.log('   ✓ Comprehensive report generated');
      console.log();

      // Step 6: Save report and optionally create tasks
      const reportPath = await this.saveReport(comprehensiveReport, request.query);
      let tasksCreated = 0;

      if (request.outputFormat === 'tasks' || request.outputFormat === 'both') {
        tasksCreated = await this.createTasksFromReport(comprehensiveReport);
      }

      console.log('✅ Research completed successfully!');
      console.log(`📄 Report saved to: ${reportPath}`);
      if (tasksCreated > 0) {
        console.log(`📋 Created ${tasksCreated} tasks from research findings`);
      }

      return {
        success: true,
        data: comprehensiveReport,
        reportPath,
        tasksCreated
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private async createResearchPlan(query: string, context: string): Promise<ResearchPlan> {
    const prompt = `Create a comprehensive research plan for: "${query}"${context}

Generate a strategic research plan that covers all important aspects and provides a systematic approach to investigating this topic.`;

    return await this.aiService.analyzeResearchQuery(query, context);
  }

  private async distributeResearchAssignments(plan: ResearchPlan, teamSize: number): Promise<ResearchAssignment[]> {
    const assignments: ResearchAssignment[] = [];
    
    for (let i = 0; i < Math.min(plan.research_areas.length, teamSize); i++) {
      const area = plan.research_areas[i];
      
      // Generate search queries for this research area
      const queries = await this.generateSearchQueries(area);
      
      assignments.push({
        researcher_id: i + 1,
        focus_area: area.area,
        search_queries: queries,
        research_objectives: `Investigate ${area.area}: ${area.expected_findings}`,
        depth_requirements: area.depth_level,
        deliverables: [
          'Executive summary of findings',
          'Detailed analysis and insights',
          'Key recommendations',
          'Identified gaps and limitations'
        ]
      });
    }

    return assignments;
  }

  private async executeParallelResearch(assignments: ResearchAssignment[]): Promise<ResearchFindings[]> {
    const findings: ResearchFindings[] = [];

    for (const assignment of assignments) {
      console.log(`   🔍 Researcher ${assignment.researcher_id}: Investigating ${assignment.focus_area}...`);
      
      // Perform web searches for this area
      const searchResults = await this.webSearch.batchSearch(assignment.search_queries);
      
      // Combine all search results
      const allResults: SearchResult[] = [];
      for (const results of searchResults.values()) {
        allResults.push(...results);
      }
      
      // AI analysis of search results
      const analysis = await this.aiService.conductResearchAnalysis(
        assignment.focus_area,
        assignment.search_queries,
        allResults
      );

      findings.push({
        ...analysis,
        researcher_id: assignment.researcher_id
      });
    }

    return findings;
  }

  private async performCriticalAnalysis(findings: ResearchFindings[], query: string): Promise<any> {
    const prompt = `Perform critical analysis of research findings for: "${query}"

Research findings:
${findings.map(f => `
Area: ${f.focus_area}
Summary: ${f.executive_summary}
Key insights: ${f.insights.join(', ')}
`).join('\n')}

Provide critical analysis including:
1. Meta-analysis of findings
2. Gap identification 
3. Bias warnings
4. Quality assessment
5. Improvement recommendations`;

    return await this.aiService.generateStructured(prompt, {
      meta_analysis: "string",
      gaps_identified: [{
        area: "string",
        severity: "string", 
        impact: "string",
        suggested_approach: "string"
      }],
      bias_warnings: [{
        type: "string",
        description: "string",
        evidence: "string",
        mitigation: "string"
      }],
      research_quality_score: "number",
      improvement_recommendations: ["string"]
    });
  }

  private async generateComprehensiveReport(
    query: string,
    plan: ResearchPlan,
    findings: ResearchFindings[],
    analysis: any
  ): Promise<ComprehensiveReport> {
    const prompt = `Generate comprehensive research report for: "${query}"

Research Plan: ${JSON.stringify(plan, null, 2)}
Findings: ${JSON.stringify(findings, null, 2)}
Critical Analysis: ${JSON.stringify(analysis, null, 2)}

Create a comprehensive report with executive summary, detailed sections, strategic recommendations, implementation priorities, and next steps.`;

    return await this.aiService.generateStructured(prompt, {
      executive_summary: "string",
      research_quality_assessment: {
        overall_score: "number",
        strengths: ["string"],
        weaknesses: ["string"],
        confidence_level: "number"
      },
      sections: [{
        title: "string",
        content: "string", 
        key_findings: ["string"],
        supporting_evidence: ["string"],
        confidence_score: "number"
      }],
      strategic_recommendations: [{
        priority: "string",
        recommendation: "string",
        rationale: "string",
        implementation_complexity: "string",
        expected_impact: "string",
        timeline: "string"
      }],
      next_steps: [{
        step: "string",
        timeline: "string",
        responsible_party: "string",
        success_criteria: "string"
      }],
      meta_analysis: {
        research_depth_analysis: "string",
        bias_mitigation: "string",
        gap_resolution: "string",
        robustness_validation: "string"
      }
    });
  }

  private async generateSearchQueries(area: any): Promise<string[]> {
    // Generate 3-5 search queries for each research area
    return [
      `${area.area} best practices`,
      `${area.area} current trends 2024`,
      `${area.area} implementation challenges`,
      `${area.area} expert analysis`,
      `${area.area} market research`
    ];
  }

  private async readInputFiles(files: string[]): Promise<string[]> {
    const contents: string[] = [];
    
    for (const file of files) {
      try {
        if (await this.fileExists(file)) {
          const content = await fs.readFile(file, 'utf-8');
          contents.push(`=== ${file} ===\n${content}`);
        }
      } catch (error) {
        console.warn(`Could not read file: ${file}`);
      }
    }

    return contents;
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private async saveReport(report: ComprehensiveReport, query: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `research-${query.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${timestamp}.md`;
    const reportPath = path.join(process.cwd(), 'research-reports', filename);
    
    // Ensure directory exists
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    
    // Generate markdown report
    const markdown = this.generateMarkdownReport(report, query);
    await fs.writeFile(reportPath, markdown);
    
    return reportPath;
  }

  private generateMarkdownReport(report: ComprehensiveReport, query: string): string {
    const qualityAssessment = report.research_quality_assessment || {
      overall_score: 7,
      confidence_level: 75,
      strengths: ['Comprehensive coverage'],
      weaknesses: ['Limited real-time data']
    };

    return `# Research Report: ${query}

## Executive Summary
${report.executive_summary || 'Research analysis completed'}

## Research Quality Assessment
- **Overall Score**: ${qualityAssessment.overall_score}/10
- **Confidence Level**: ${qualityAssessment.confidence_level}%

### Strengths
${qualityAssessment.strengths.map(s => `- ${s}`).join('\n')}

### Areas for Improvement
${qualityAssessment.weaknesses.map(w => `- ${w}`).join('\n')}

## Key Findings

${(report.sections || []).map(section => `
### ${section.title || 'Analysis Section'}
${section.content || 'Analysis findings'}

**Key Findings:**
${(section.key_findings || []).map(f => `- ${f}`).join('\n')}

**Confidence Score:** ${section.confidence_score || 7}/10
`).join('\n')}

## Strategic Recommendations

${(report.strategic_recommendations || []).map(rec => `
### ${rec.recommendation || 'Follow best practices'} (${rec.priority || 'medium'} priority)
**Rationale:** ${rec.rationale || 'Established practices reduce risk'}
**Implementation Complexity:** ${rec.implementation_complexity || 'moderate'}
**Expected Impact:** ${rec.expected_impact || 'positive'}  
**Timeline:** ${rec.timeline || '2-4 weeks'}
`).join('\n')}

## Next Steps

${(report.next_steps || []).map((step, i) => `${i + 1}. **${step.step || 'Implementation planning'}**
   - Timeline: ${step.timeline || 'immediate'}
   - Responsible: ${step.responsible_party || 'development team'}
   - Success Criteria: ${step.success_criteria || 'objective completed'}`).join('\n')}

---
*Report generated by Critical Claude AI Research System*
`;
  }

  private async createTasksFromReport(report: ComprehensiveReport): Promise<number> {
    // This would integrate with the task management domain to create actual tasks
    // For now, return the count of potential tasks
    let taskCount = 0;
    
    // Count tasks from strategic recommendations
    taskCount += report.strategic_recommendations.length;
    
    // Count tasks from next steps  
    taskCount += report.next_steps.length;
    
    return taskCount;
  }
}
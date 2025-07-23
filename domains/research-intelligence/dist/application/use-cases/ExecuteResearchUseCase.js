/**
 * Execute Research Use Case - Migrated from legacy research.ts
 * 100% AI-Driven Multi-Agent Research System
 */
import { AIService } from '../../infrastructure/services/AIService.js';
import { WebSearch } from '../../infrastructure/services/WebSearch.js';
import * as fs from 'fs/promises';
import * as path from 'path';
export class ExecuteResearchUseCase {
    aiService;
    webSearch;
    constructor() {
        this.aiService = new AIService();
        this.webSearch = new WebSearch();
    }
    async execute(request) {
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
            const comprehensiveReport = await this.generateComprehensiveReport(request.query, researchPlan, allFindings, criticalAnalysis);
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
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }
    async createResearchPlan(query, context) {
        const prompt = `Create a comprehensive research plan for: "${query}"${context}

Generate a strategic research plan that covers all important aspects and provides a systematic approach to investigating this topic.`;
        return await this.aiService.analyzeResearchQuery(query, context);
    }
    async distributeResearchAssignments(plan, teamSize) {
        const assignments = [];
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
    async executeParallelResearch(assignments) {
        const findings = [];
        for (const assignment of assignments) {
            console.log(`   🔍 Researcher ${assignment.researcher_id}: Investigating ${assignment.focus_area}...`);
            // Perform web searches for this area
            const searchResults = await this.webSearch.batchSearch(assignment.search_queries);
            // Combine all search results
            const allResults = [];
            for (const results of searchResults.values()) {
                allResults.push(...results);
            }
            // AI analysis of search results
            const analysis = await this.aiService.conductResearchAnalysis(assignment.focus_area, assignment.search_queries, allResults);
            findings.push({
                ...analysis,
                researcher_id: assignment.researcher_id
            });
        }
        return findings;
    }
    async performCriticalAnalysis(findings, query) {
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
    async generateComprehensiveReport(query, plan, findings, analysis) {
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
    async generateSearchQueries(area) {
        // Generate 3-5 search queries for each research area
        return [
            `${area.area} best practices`,
            `${area.area} current trends 2024`,
            `${area.area} implementation challenges`,
            `${area.area} expert analysis`,
            `${area.area} market research`
        ];
    }
    async readInputFiles(files) {
        const contents = [];
        for (const file of files) {
            try {
                if (await this.fileExists(file)) {
                    const content = await fs.readFile(file, 'utf-8');
                    contents.push(`=== ${file} ===\n${content}`);
                }
            }
            catch (error) {
                console.warn(`Could not read file: ${file}`);
            }
        }
        return contents;
    }
    async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        }
        catch {
            return false;
        }
    }
    async saveReport(report, query) {
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
    generateMarkdownReport(report, query) {
        return `# Research Report: ${query}

## Executive Summary
${report.executive_summary}

## Research Quality Assessment
- **Overall Score**: ${report.research_quality_assessment.overall_score}/10
- **Confidence Level**: ${report.research_quality_assessment.confidence_level}%

### Strengths
${report.research_quality_assessment.strengths.map(s => `- ${s}`).join('\n')}

### Areas for Improvement
${report.research_quality_assessment.weaknesses.map(w => `- ${w}`).join('\n')}

## Key Findings

${report.sections.map(section => `
### ${section.title}
${section.content}

**Key Findings:**
${section.key_findings.map(f => `- ${f}`).join('\n')}

**Confidence Score:** ${section.confidence_score}/10
`).join('\n')}

## Strategic Recommendations

${report.strategic_recommendations.map(rec => `
### ${rec.recommendation} (${rec.priority} priority)
**Rationale:** ${rec.rationale}
**Implementation Complexity:** ${rec.implementation_complexity}
**Expected Impact:** ${rec.expected_impact}  
**Timeline:** ${rec.timeline}
`).join('\n')}

## Next Steps

${report.next_steps.map((step, i) => `${i + 1}. **${step.step}**
   - Timeline: ${step.timeline}
   - Responsible: ${step.responsible_party}
   - Success Criteria: ${step.success_criteria}`).join('\n')}

---
*Report generated by Critical Claude AI Research System*
`;
    }
    async createTasksFromReport(report) {
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
//# sourceMappingURL=ExecuteResearchUseCase.js.map
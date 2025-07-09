/**
 * Claude Code Provider for Critical Claude Backlog
 * Uses Claude Code CLI as the model provider for AI-powered task generation
 */
import { spawn } from 'child_process';
// Simple logger for now
const logger = {
    info: (msg, data) => console.log(`[INFO] ${msg}`, data || ''),
    error: (msg, error) => console.error(`[ERROR] ${msg}`, error?.message || ''),
    warn: (msg, data) => console.warn(`[WARN] ${msg}`, data || '')
};
export class ClaudeCodeProvider {
    config;
    constructor(config) {
        this.config = {
            modelId: 'sonnet',
            maxTokens: 64000,
            temperature: 0.1, // Low temperature for consistent task breakdown
            maxTurns: 3,
            permissionMode: 'plan', // Plan mode for task generation
            allowedTools: ['Read', 'LS', 'Grep', 'Glob'], // Read-only operations
            ...config
        };
        logger.info('ClaudeCodeProvider initialized', this.config);
    }
    /**
     * Generate tasks from feature description using Claude Code
     */
    async generateTasksFromFeature(featureDescription, projectContext) {
        const prompt = this.buildTaskGenerationPrompt(featureDescription, projectContext);
        try {
            const response = await this.callClaudeCode(prompt);
            return this.parseTaskResponse(response, featureDescription);
        }
        catch (error) {
            logger.error('Failed to generate tasks via Claude Code', error);
            // Fallback to basic task generation
            return this.generateFallbackTasks(featureDescription);
        }
    }
    /**
     * Analyze code for improvement tasks using Claude Code
     */
    async analyzeCodeForTasks(filePath) {
        const prompt = this.buildCodeAnalysisPrompt(filePath);
        try {
            const response = await this.callClaudeCode(prompt);
            return this.parseCodeAnalysisResponse(response, filePath);
        }
        catch (error) {
            logger.error('Failed to analyze code via Claude Code', error);
            return [{
                    title: `Review code quality in ${filePath}`,
                    description: 'Manual code review required - automated analysis failed',
                    estimatedEffort: 3,
                    priority: 'medium',
                    labels: ['code-review', 'manual'],
                    acceptanceCriteria: ['Code reviewed for quality issues'],
                    reasoning: 'Automated analysis unavailable',
                    confidence: 0.5,
                    codeReferences: [{ filePath, type: 'implementation' }],
                    dependencies: []
                }];
        }
    }
    /**
     * Build comprehensive prompt for task generation
     */
    buildTaskGenerationPrompt(featureDescription, context) {
        return `You are a brutal senior engineering manager who breaks down features into actionable tasks.

FEATURE TO IMPLEMENT:
${featureDescription}

PROJECT CONTEXT:
- Team size: ${context.teamSize} developers
- Sprint length: ${context.sprintLength} days
- Tech stack: ${context.techStack?.join(', ') || 'Not specified'}

TASK BREAKDOWN REQUIREMENTS:
1. Break this feature into 3-7 specific, actionable tasks
2. Each task should be completable by one developer in 1-3 days
3. Include proper acceptance criteria for each task
4. Estimate effort in story points (1, 2, 3, 5, 8, 13, 21)
5. Assign priority based on dependencies and business value
6. Consider technical dependencies between tasks

OUTPUT FORMAT (JSON array):
[
  {
    "title": "Specific actionable task title",
    "description": "Detailed description of what needs to be done",
    "estimatedEffort": 5,
    "priority": "high|medium|low|critical", 
    "labels": ["relevant", "labels"],
    "acceptanceCriteria": ["Specific AC 1", "Specific AC 2"],
    "reasoning": "Why this task is needed and how it fits the feature",
    "confidence": 0.85,
    "dependencies": []
  }
]

Be brutal about:
- Breaking down large tasks into smaller ones
- Identifying hidden complexity
- Calling out potential blockers
- Being realistic about effort estimates

Generate the task breakdown now:`;
    }
    /**
     * Build prompt for code analysis
     */
    buildCodeAnalysisPrompt(filePath) {
        return `You are a brutal code reviewer looking for issues that need to become tasks.

ANALYZE FILE: ${filePath}

First, read the file and understand its purpose. Then identify specific improvement tasks.

FOCUS ON:
1. Security vulnerabilities that need fixing
2. Performance issues that impact users
3. Code quality issues that will cause bugs
4. Missing error handling
5. Technical debt that blocks future development

IGNORE:
- Minor style issues
- Theoretical optimizations
- Perfect-world refactoring

For each real issue found, create a task with:
- Specific title describing the fix needed
- Clear description of the problem and solution
- Realistic effort estimate
- Priority based on actual risk

OUTPUT FORMAT (JSON array):
[
  {
    "title": "Fix specific issue in ${filePath}",
    "description": "What's wrong and how to fix it",
    "estimatedEffort": 3,
    "priority": "high|medium|low|critical",
    "labels": ["bug", "security", "performance"],
    "acceptanceCriteria": ["Specific fix completed", "Tests pass"],
    "reasoning": "Why this matters for production",
    "confidence": 0.9
  }
]

Read the file and generate improvement tasks:`;
    }
    /**
     * Call Claude Code CLI with the given prompt
     */
    async callClaudeCode(prompt) {
        return new Promise((resolve, reject) => {
            const args = [
                '--print', // Non-interactive mode
                '--model', this.config.modelId,
                '--output-format', 'text'
            ];
            // Add tool restrictions using correct Claude Code CLI format
            if (this.config.allowedTools) {
                args.push('--allowedTools', ...this.config.allowedTools);
            }
            if (this.config.disallowedTools) {
                args.push('--disallowedTools', ...this.config.disallowedTools);
            }
            // Add the prompt as the last argument
            args.push(prompt);
            const claudeProcess = spawn('claude', args, {
                stdio: ['inherit', 'pipe', 'pipe']
            });
            let output = '';
            let errorOutput = '';
            claudeProcess.stdout.on('data', (data) => {
                output += data.toString();
            });
            claudeProcess.stderr.on('data', (data) => {
                errorOutput += data.toString();
            });
            claudeProcess.on('close', (code) => {
                if (code === 0) {
                    resolve(output);
                }
                else {
                    reject(new Error(`Claude Code process failed with code ${code}: ${errorOutput}`));
                }
            });
            claudeProcess.on('error', (error) => {
                reject(new Error(`Failed to spawn Claude Code process: ${error.message}`));
            });
        });
    }
    /**
     * Parse Claude Code response for task generation
     */
    parseTaskResponse(response, featureDescription) {
        try {
            // Extract JSON from response (Claude might include explanation text)
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (!jsonMatch) {
                throw new Error('No JSON array found in response');
            }
            const tasks = JSON.parse(jsonMatch[0]);
            return tasks.map((task, index) => ({
                title: task.title || `Task ${index + 1} for ${featureDescription}`,
                description: task.description || 'Description not provided',
                estimatedEffort: task.estimatedEffort || 5,
                priority: task.priority || 'medium',
                labels: task.labels || ['ai-generated'],
                acceptanceCriteria: task.acceptanceCriteria || ['Task completed'],
                reasoning: task.reasoning || 'Generated by AI',
                confidence: task.confidence || 0.7,
                codeReferences: [],
                dependencies: task.dependencies || []
            }));
        }
        catch (error) {
            logger.error('Failed to parse Claude Code response', error);
            return this.generateFallbackTasks(featureDescription);
        }
    }
    /**
     * Parse Claude Code response for code analysis
     */
    parseCodeAnalysisResponse(response, filePath) {
        try {
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (!jsonMatch) {
                // No issues found
                return [];
            }
            const tasks = JSON.parse(jsonMatch[0]);
            return tasks.map((task, index) => ({
                title: task.title || `Code improvement ${index + 1} in ${filePath}`,
                description: task.description || 'Code improvement needed',
                estimatedEffort: task.estimatedEffort || 3,
                priority: task.priority || 'medium',
                labels: task.labels || ['code-quality'],
                acceptanceCriteria: task.acceptanceCriteria || ['Issue resolved'],
                reasoning: task.reasoning || 'Code analysis identified issue',
                confidence: task.confidence || 0.8,
                codeReferences: [{ filePath, type: 'implementation' }],
                dependencies: []
            }));
        }
        catch (error) {
            logger.error('Failed to parse code analysis response', error);
            return [];
        }
    }
    /**
     * Fallback task generation when Claude Code fails
     */
    generateFallbackTasks(featureDescription) {
        logger.warn('Using fallback task generation');
        return [{
                title: `Implement ${featureDescription}`,
                description: `Core implementation for: ${featureDescription}. Claude Code analysis failed, manual breakdown required.`,
                estimatedEffort: 8,
                priority: 'medium',
                labels: ['manual-breakdown-needed'],
                acceptanceCriteria: [`${featureDescription} implemented and tested`],
                reasoning: 'Fallback task - needs manual breakdown',
                confidence: 0.5,
                codeReferences: [],
                dependencies: []
            }];
    }
}
//# sourceMappingURL=claude-code-provider.js.map
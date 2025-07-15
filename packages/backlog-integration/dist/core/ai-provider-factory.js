/**
 * AI Provider Factory for Critical Claude Backlog
 * Supports multiple AI providers: Claude Code, OpenAI, Anthropic API
 */
import { EnhancedClaudeCodeProvider } from './enhanced-claude-code-provider.js';
const logger = {
    info: (msg, data) => console.log(`[INFO] ${msg}`, data || ''),
    error: (msg, error) => console.error(`[ERROR] ${msg}`, error || ''),
    warn: (msg, data) => console.warn(`[WARN] ${msg}`, data || '')
};
export class AIProviderFactory {
    static createProvider(config) {
        switch (config.type) {
            case 'claude-code':
                return new EnhancedClaudeCodeProvider({
                    modelId: config.modelId || 'sonnet',
                    temperature: config.temperature || 0.1,
                    maxTokens: config.maxTokens || 64000,
                    permissionMode: config.permissionMode || 'plan',
                    allowedTools: config.allowedTools || ['Read', 'LS', 'Grep', 'Glob'],
                    disallowedTools: config.disallowedTools
                });
            case 'openai':
                return new OpenAIProvider({
                    modelId: config.modelId || 'gpt-4o',
                    apiKey: config.apiKey || process.env.OPENAI_API_KEY,
                    temperature: config.temperature || 0.1,
                    maxTokens: config.maxTokens || 16000,
                    baseURL: config.baseURL
                });
            case 'anthropic':
                return new AnthropicProvider({
                    modelId: config.modelId || 'claude-3-5-sonnet-20241022',
                    apiKey: config.apiKey || process.env.ANTHROPIC_API_KEY,
                    temperature: config.temperature || 0.1,
                    maxTokens: config.maxTokens || 64000
                });
            default:
                throw new Error(`Unsupported provider type: ${config.type}`);
        }
    }
}
/**
 * OpenAI Provider (GPT-4o, GPT-o3, etc.)
 */
class OpenAIProvider {
    config;
    constructor(config) {
        this.config = config;
        logger.info('OpenAI Provider initialized', { modelId: config.modelId });
    }
    async generateTasksFromFeature(featureDescription, projectContext) {
        try {
            // Check if OpenAI is available
            const openai = await this.getOpenAI();
            const prompt = this.buildFeaturePrompt(featureDescription, projectContext);
            const response = await openai.chat.completions.create({
                model: this.config.modelId,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a senior software architect breaking down features into implementable tasks. Always respond with valid JSON arrays only.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: this.config.temperature,
                max_tokens: this.config.maxTokens,
                response_format: { type: 'json_object' }
            });
            const content = response.choices[0]?.message?.content;
            if (!content) {
                throw new Error('No response from OpenAI');
            }
            return this.parseTasksFromResponse(content, featureDescription);
        }
        catch (error) {
            logger.error('OpenAI task generation failed', error);
            return this.getFallbackTasks(featureDescription);
        }
    }
    async analyzeCodeForTasks(filePath) {
        try {
            // For now, return empty - would need file reading capability
            logger.warn('OpenAI code analysis not yet implemented - requires file access');
            return [];
        }
        catch (error) {
            logger.error('OpenAI code analysis failed', error);
            return [];
        }
    }
    async getOpenAI() {
        try {
            // @ts-ignore - Dynamic import at runtime
            const { OpenAI } = require('openai');
            return new OpenAI({
                apiKey: this.config.apiKey,
                baseURL: this.config.baseURL
            });
        }
        catch (error) {
            throw new Error('OpenAI package not installed. Run: npm install openai');
        }
    }
    buildFeaturePrompt(featureDescription, context) {
        return `Break down this feature into 3-7 specific, implementable tasks:

Feature: ${featureDescription}

${context ? `Context: Team of ${context.teamSize}, ${context.sprintLength} day sprints` : ''}

Return a JSON object with a "tasks" array. Each task should have:
- title: Clear, specific task title
- description: Technical implementation details
- estimatedEffort: Story points (1, 2, 3, 5, 8, 13, or 21)
- priority: "low", "medium", "high", or "critical"
- labels: Array of relevant tags
- acceptanceCriteria: Array of specific, testable criteria
- reasoning: Why this task is needed
- confidence: Number between 0 and 1

Focus on tasks that are:
- Completable in 1-3 days
- Technically specific
- Independently testable
- Following best practices`;
    }
    parseTasksFromResponse(content, featureDescription) {
        try {
            const parsed = JSON.parse(content);
            const tasks = parsed.tasks || parsed;
            if (!Array.isArray(tasks)) {
                throw new Error('Response is not an array');
            }
            return tasks.map((task) => ({
                title: task.title || 'Untitled Task',
                description: task.description || '',
                estimatedEffort: this.normalizeEffort(task.estimatedEffort),
                priority: this.normalizePriority(task.priority),
                labels: Array.isArray(task.labels) ? task.labels : ['openai-generated'],
                acceptanceCriteria: Array.isArray(task.acceptanceCriteria) ? task.acceptanceCriteria : [],
                reasoning: task.reasoning || 'Generated by OpenAI',
                confidence: typeof task.confidence === 'number' ? task.confidence : 0.8,
                dependencies: [],
                codeReferences: []
            }));
        }
        catch (error) {
            logger.error('Failed to parse OpenAI response', error);
            return this.getFallbackTasks(featureDescription);
        }
    }
    normalizeEffort(effort) {
        const validPoints = [1, 2, 3, 5, 8, 13, 21];
        const parsed = parseInt(effort);
        if (isNaN(parsed))
            return 5;
        return validPoints.reduce((prev, curr) => Math.abs(curr - parsed) < Math.abs(prev - parsed) ? curr : prev);
    }
    normalizePriority(priority) {
        const p = String(priority).toLowerCase();
        if (['low', 'medium', 'high', 'critical'].includes(p)) {
            return p;
        }
        return 'medium';
    }
    getFallbackTasks(description) {
        return [{
                title: `Implement: ${description.slice(0, 50)}...`,
                description: `OpenAI generation failed. Manual breakdown needed: ${description}`,
                estimatedEffort: 8,
                priority: 'medium',
                labels: ['needs-refinement', 'openai-fallback'],
                acceptanceCriteria: ['Feature implemented', 'Tests pass'],
                reasoning: 'Fallback task - OpenAI generation failed',
                confidence: 0.3,
                dependencies: [],
                codeReferences: []
            }];
    }
}
/**
 * Anthropic Provider (Claude API directly)
 */
class AnthropicProvider {
    config;
    constructor(config) {
        this.config = config;
        logger.info('Anthropic Provider initialized', { modelId: config.modelId });
    }
    async generateTasksFromFeature(featureDescription, projectContext) {
        try {
            const anthropic = await this.getAnthropic();
            const prompt = this.buildFeaturePrompt(featureDescription, projectContext);
            const response = await anthropic.messages.create({
                model: this.config.modelId,
                max_tokens: this.config.maxTokens,
                temperature: this.config.temperature,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ]
            });
            const content = response.content[0];
            if (content.type !== 'text') {
                throw new Error('Invalid response type from Anthropic');
            }
            return this.parseTasksFromResponse(content.text, featureDescription);
        }
        catch (error) {
            logger.error('Anthropic task generation failed', error);
            return this.getFallbackTasks(featureDescription);
        }
    }
    async analyzeCodeForTasks(filePath) {
        // Similar limitation as OpenAI - needs file reading
        logger.warn('Anthropic code analysis not yet implemented - requires file access');
        return [];
    }
    async getAnthropic() {
        try {
            // @ts-ignore - Dynamic import at runtime
            const { Anthropic } = require('@anthropic-ai/sdk');
            return new Anthropic({
                apiKey: this.config.apiKey
            });
        }
        catch (error) {
            throw new Error('Anthropic SDK not installed. Run: npm install @anthropic-ai/sdk');
        }
    }
    buildFeaturePrompt(featureDescription, context) {
        return `You are a senior software architect. Break down this feature into specific, implementable tasks.

Feature: ${featureDescription}

${context ? `Context: ${context.teamSize} developers, ${context.sprintLength} day sprints` : ''}

Return ONLY a JSON array of tasks. Each task must have:
- title: Specific, actionable title
- description: Technical implementation details  
- estimatedEffort: Story points (1, 2, 3, 5, 8, 13, 21)
- priority: "low", "medium", "high", or "critical"
- labels: Array of relevant labels
- acceptanceCriteria: Array of testable criteria
- reasoning: Why this task is necessary
- confidence: Confidence score (0-1)

Example:
[
  {
    "title": "Set up user authentication API endpoints",
    "description": "Create REST endpoints for login, logout, and token refresh",
    "estimatedEffort": 5,
    "priority": "high",
    "labels": ["backend", "auth", "api"],
    "acceptanceCriteria": ["POST /auth/login returns JWT", "Token validation works", "Unit tests pass"],
    "reasoning": "Core authentication functionality needed before other features",
    "confidence": 0.9
  }
]

Respond with ONLY the JSON array, no other text.`;
    }
    parseTasksFromResponse(content, featureDescription) {
        try {
            // Extract JSON array from response
            const jsonMatch = content.match(/\[[\s\S]*\]/);
            if (!jsonMatch) {
                throw new Error('No JSON array found in response');
            }
            const tasks = JSON.parse(jsonMatch[0]);
            return tasks.map((task) => ({
                title: task.title || 'Untitled Task',
                description: task.description || '',
                estimatedEffort: this.normalizeEffort(task.estimatedEffort),
                priority: this.normalizePriority(task.priority),
                labels: Array.isArray(task.labels) ? task.labels : ['anthropic-generated'],
                acceptanceCriteria: Array.isArray(task.acceptanceCriteria) ? task.acceptanceCriteria : [],
                reasoning: task.reasoning || 'Generated by Anthropic',
                confidence: typeof task.confidence === 'number' ? task.confidence : 0.8,
                dependencies: [],
                codeReferences: []
            }));
        }
        catch (error) {
            logger.error('Failed to parse Anthropic response', error);
            return this.getFallbackTasks(featureDescription);
        }
    }
    normalizeEffort(effort) {
        const validPoints = [1, 2, 3, 5, 8, 13, 21];
        const parsed = parseInt(effort);
        if (isNaN(parsed))
            return 5;
        return validPoints.reduce((prev, curr) => Math.abs(curr - parsed) < Math.abs(prev - parsed) ? curr : prev);
    }
    normalizePriority(priority) {
        const p = String(priority).toLowerCase();
        if (['low', 'medium', 'high', 'critical'].includes(p)) {
            return p;
        }
        return 'medium';
    }
    getFallbackTasks(description) {
        return [{
                title: `Implement: ${description.slice(0, 50)}...`,
                description: `Anthropic generation failed. Manual breakdown needed: ${description}`,
                estimatedEffort: 8,
                priority: 'medium',
                labels: ['needs-refinement', 'anthropic-fallback'],
                acceptanceCriteria: ['Feature implemented', 'Tests pass'],
                reasoning: 'Fallback task - Anthropic generation failed',
                confidence: 0.3,
                dependencies: [],
                codeReferences: []
            }];
    }
}
//# sourceMappingURL=ai-provider-factory.js.map
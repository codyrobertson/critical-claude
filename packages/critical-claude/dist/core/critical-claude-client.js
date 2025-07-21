/**
 * Critical Claude Client - Simplified AI-powered task management
 */
import { AIService } from './ai-service.js';
import { UnifiedStorageManager } from './unified-storage.js';
import { AITaskManager } from './ai-task-manager.js';
const logger = {
    info: (msg, data) => console.log(`[INFO] ${msg}`, data || ''),
    error: (msg, error) => console.error(`[ERROR] ${msg}`, error?.message || ''),
    warn: (msg, data) => console.warn(`[WARN] ${msg}`, data || '')
};
export class CriticalClaudeClient {
    aiService;
    storage;
    aiTaskManager;
    constructor() {
        this.aiService = new AIService(); // Auto-detect Claude Code
        this.storage = new UnifiedStorageManager();
        this.aiTaskManager = new AITaskManager(this.storage);
    }
    async initialize() {
        await this.storage.initialize();
        logger.info('Critical Claude client initialized');
    }
    /**
     * Generate tasks from feature description using AI
     */
    async generateTasks(description, options = {}) {
        try {
            const tasks = await this.aiService.generateProjectTasks(description, options);
            logger.info(`Generated ${tasks.length} tasks from AI`);
            return tasks;
        }
        catch (error) {
            logger.error('Task generation failed', error);
            return [];
        }
    }
    /**
     * Analyze task complexity using AI
     */
    async analyzeTask(title, description) {
        try {
            const analysis = await this.aiService.analyzeTask(description);
            logger.info(`Analyzed task: ${title}`);
            return analysis;
        }
        catch (error) {
            logger.error('Task analysis failed', error);
            return null;
        }
    }
    /**
     * Get AI service health status
     */
    async getStatus() {
        return {
            healthy: true,
            provider: this.aiService.config?.provider || 'unknown'
        };
    }
}
//# sourceMappingURL=critical-claude-client.js.map
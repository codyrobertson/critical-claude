/**
 * Context Manager - Maintains context for smart defaults and better DX
 * Remembers active sprint, recent labels, team members, etc.
 */
import fs from 'fs/promises';
import path from 'path';
import { logger } from './logger.js';
export class ContextManager {
    contextPath;
    context = null;
    cacheExpiry = 5 * 60 * 1000; // 5 minutes
    initialized = false;
    constructor(projectPath) {
        this.contextPath = path.join(projectPath || process.cwd(), '.critical-claude', 'context.json');
    }
    /**
     * Initialize context manager (lazy - only when needed)
     */
    async initialize() {
        if (this.initialized)
            return;
        try {
            await this.loadContext();
            this.initialized = true;
        }
        catch (error) {
            logger.warn('Failed to load context, using defaults', error);
            this.context = this.getDefaultContext();
            this.initialized = true;
        }
    }
    /**
     * Get current context with smart defaults
     */
    async getCurrentContext() {
        if (!this.initialized) {
            await this.initialize();
        }
        if (!this.context) {
            this.context = this.getDefaultContext();
        }
        // Update today's date if needed
        const today = new Date().toISOString().split('T')[0];
        if (this.context.lastActivityDate !== today) {
            this.context.tasksCreatedToday = 0;
            this.context.lastActivityDate = today;
        }
        return this.context;
    }
    /**
     * Update context with new information
     */
    async updateContext(updates) {
        if (!this.initialized) {
            await this.initialize();
        }
        const context = await this.getCurrentContext();
        // Merge updates
        this.context = {
            ...context,
            ...updates,
            lastActivityDate: new Date().toISOString().split('T')[0]
        };
        // Update cache timestamps
        if (updates.activeSprint) {
            this.context.cacheTimestamps.activeSprint = Date.now();
        }
        if (updates.teamMembers) {
            this.context.cacheTimestamps.teamMembers = Date.now();
        }
        // Keep recent lists bounded
        if (this.context.recentLabels.length > 20) {
            this.context.recentLabels = this.context.recentLabels.slice(-20);
        }
        if (this.context.recentAssignees.length > 10) {
            this.context.recentAssignees = this.context.recentAssignees.slice(-10);
        }
        if (this.context.focusedTasks.length > 5) {
            this.context.focusedTasks = this.context.focusedTasks.slice(-5);
        }
        await this.saveContext();
    }
    /**
     * Add a label to recent labels (maintaining uniqueness and order)
     */
    async addRecentLabel(label) {
        const context = await this.getCurrentContext();
        // Remove if exists and add to end
        const labels = context.recentLabels.filter(l => l !== label);
        labels.push(label);
        await this.updateContext({ recentLabels: labels });
    }
    /**
     * Add an assignee to recent assignees
     */
    async addRecentAssignee(assignee) {
        const context = await this.getCurrentContext();
        // Remove if exists and add to end
        const assignees = context.recentAssignees.filter(a => a !== assignee);
        assignees.push(assignee);
        await this.updateContext({ recentAssignees: assignees });
    }
    /**
     * Mark a task as focused
     */
    async focusTask(taskId) {
        const context = await this.getCurrentContext();
        // Remove if exists and add to end
        const focused = context.focusedTasks.filter(t => t !== taskId);
        focused.push(taskId);
        await this.updateContext({ focusedTasks: focused });
    }
    /**
     * Increment today's task count
     */
    async incrementTaskCount() {
        const context = await this.getCurrentContext();
        await this.updateContext({
            tasksCreatedToday: context.tasksCreatedToday + 1
        });
    }
    /**
     * Check if cached data is still valid
     */
    isCacheValid(cacheType) {
        if (!this.context?.cacheTimestamps[cacheType]) {
            return false;
        }
        const age = Date.now() - this.context.cacheTimestamps[cacheType];
        return age < this.cacheExpiry;
    }
    /**
     * Clear specific cache
     */
    async invalidateCache(cacheType) {
        if (this.context?.cacheTimestamps) {
            delete this.context.cacheTimestamps[cacheType];
            await this.saveContext();
        }
    }
    /**
     * Get smart label suggestions based on context
     */
    async getSuggestedLabels(taskTitle) {
        const context = await this.getCurrentContext();
        const suggestions = [];
        const lowerTitle = taskTitle.toLowerCase();
        // Suggest labels based on keywords
        const labelKeywords = {
            bug: ['fix', 'error', 'broken', 'crash', 'issue'],
            feature: ['add', 'implement', 'create', 'new'],
            refactor: ['refactor', 'clean', 'improve', 'optimize'],
            security: ['security', 'auth', 'password', 'token', 'vulnerability'],
            performance: ['slow', 'performance', 'optimize', 'speed'],
            ui: ['ui', 'design', 'style', 'layout', 'responsive'],
            api: ['api', 'endpoint', 'rest', 'graphql'],
            database: ['database', 'db', 'query', 'migration'],
            test: ['test', 'spec', 'testing', 'coverage'],
            docs: ['doc', 'document', 'readme', 'comment']
        };
        for (const [label, keywords] of Object.entries(labelKeywords)) {
            if (keywords.some(keyword => lowerTitle.includes(keyword))) {
                suggestions.push(label);
            }
        }
        // Add recent labels that might be relevant
        const recentRelevant = context.recentLabels.filter(label => !suggestions.includes(label) && Math.random() > 0.7 // 30% chance
        ).slice(0, 2);
        suggestions.push(...recentRelevant);
        return suggestions;
    }
    /**
     * Load context from disk
     */
    async loadContext() {
        try {
            const data = await fs.readFile(this.contextPath, 'utf8');
            this.context = JSON.parse(data);
            logger.debug('Context loaded', { path: this.contextPath });
        }
        catch (error) {
            if (error.code === 'ENOENT') {
                // File doesn't exist, use defaults
                this.context = this.getDefaultContext();
                await this.saveContext();
            }
            else {
                throw error;
            }
        }
    }
    /**
     * Save context to disk
     */
    async saveContext() {
        if (!this.context)
            return;
        try {
            // Ensure directory exists
            const dir = path.dirname(this.contextPath);
            await fs.mkdir(dir, { recursive: true });
            // Save context
            await fs.writeFile(this.contextPath, JSON.stringify(this.context, null, 2));
            logger.debug('Context saved', { path: this.contextPath });
        }
        catch (error) {
            logger.error('Failed to save context', error);
        }
    }
    /**
     * Get default context
     */
    getDefaultContext() {
        return {
            recentLabels: [],
            recentAssignees: [],
            focusedTasks: [],
            teamMembers: [],
            tasksCreatedToday: 0,
            lastActivityDate: new Date().toISOString().split('T')[0],
            cacheTimestamps: {}
        };
    }
}
//# sourceMappingURL=context-manager.js.map
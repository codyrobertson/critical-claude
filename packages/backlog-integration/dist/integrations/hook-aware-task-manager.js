/**
 * Hook-Aware Task Manager - Manages task state transitions based on Claude Code hooks
 */
import { BacklogManager } from '../cli/backlog-manager.js';
const logger = {
    info: (msg, data) => console.log(`[INFO] ${msg}`, data || ''),
    error: (msg, error) => console.error(`[ERROR] ${msg}`, error?.message || ''),
    warn: (msg, data) => console.warn(`[WARN] ${msg}`, data || '')
};
export class HookAwareTaskManager {
    backlogManager;
    transitionHistory = [];
    constructor() {
        this.backlogManager = new BacklogManager();
    }
    async initialize() {
        await this.backlogManager.initialize();
    }
    /**
     * Process a hook event and update relevant task states
     */
    async processHookEvent(event) {
        logger.info('Processing hook event', {
            type: event.type,
            tool: event.tool,
            file: event.file
        });
        const transitions = [];
        try {
            // Get all active tasks that might be affected by this hook
            const activeTasks = await this.getRelevantTasks(event);
            for (const task of activeTasks) {
                const transition = await this.evaluateTaskTransition(task, event);
                if (transition) {
                    transitions.push(transition);
                    await this.applyTransition(transition);
                }
            }
            // Store transitions in history
            this.transitionHistory.push(...transitions);
            logger.info('Hook event processed', {
                transitionCount: transitions.length,
                transitions: transitions.map(t => ({ taskId: t.taskId, fromStatus: t.fromStatus, toStatus: t.toStatus }))
            });
            return transitions;
        }
        catch (error) {
            logger.error('Hook event processing failed', error);
            return [];
        }
    }
    /**
     * Get tasks that might be relevant to this hook event
     */
    async getRelevantTasks(event) {
        const allTasks = await this.backlogManager.listTasks();
        // Filter tasks based on hook event
        return allTasks.filter(task => {
            // Don't process completed or archived tasks
            if (['done', 'archived_done', 'archived_blocked', 'archived_dimmed'].includes(task.status)) {
                return false;
            }
            // Include tasks that are currently focused or in-progress
            if (['focused', 'in-progress'].includes(task.status)) {
                return true;
            }
            // Include tasks that mention the file being worked on
            if (event.file && this.taskReferencesFile(task, event.file)) {
                return true;
            }
            // Include tasks related to the tool being used
            if (event.tool && this.taskRelatesToTool(task, event.tool)) {
                return true;
            }
            return false;
        });
    }
    /**
     * Check if task references a specific file
     */
    taskReferencesFile(task, filePath) {
        const fileRef = this.extractFileReference(filePath);
        // Check if task title or description mentions this file
        const searchText = `${task.title} ${task.description || ''}`.toLowerCase();
        return searchText.includes(fileRef.toLowerCase()) ||
            searchText.includes(filePath.toLowerCase());
    }
    /**
     * Check if task relates to a specific tool
     */
    taskRelatesToTool(task, tool) {
        const searchText = `${task.title} ${task.description || ''}`.toLowerCase();
        // Map tools to task keywords
        const toolKeywords = {
            'Write': ['create', 'write', 'add', 'implement'],
            'Edit': ['edit', 'modify', 'update', 'fix', 'change'],
            'MultiEdit': ['refactor', 'restructure', 'update multiple'],
            'TodoWrite': ['task', 'todo', 'plan'],
            'TodoRead': ['review', 'check', 'list'],
            'Read': ['analyze', 'review', 'understand'],
            'Bash': ['build', 'test', 'deploy', 'run']
        };
        const keywords = toolKeywords[tool] || [];
        return keywords.some(keyword => searchText.includes(keyword));
    }
    /**
     * Extract a meaningful file reference from a full path
     */
    extractFileReference(filePath) {
        const parts = filePath.split('/');
        const fileName = parts[parts.length - 1];
        const parentDir = parts[parts.length - 2];
        return parentDir ? `${parentDir}/${fileName}` : fileName;
    }
    /**
     * Evaluate if a task should transition based on the hook event
     */
    async evaluateTaskTransition(task, event) {
        const currentStatus = task.status;
        let newStatus = null;
        let trigger = '';
        // Define transition rules based on hook events
        switch (event.type) {
            case 'PostToolUse':
                newStatus = this.evaluatePostToolUseTransition(task, event);
                trigger = `PostToolUse:${event.tool}`;
                break;
            case 'Stop':
                newStatus = this.evaluateStopTransition(task, event);
                trigger = 'Stop';
                break;
        }
        // Only create transition if status actually changes
        if (newStatus && newStatus !== currentStatus) {
            return {
                taskId: task.id,
                fromStatus: currentStatus,
                toStatus: newStatus,
                trigger,
                timestamp: new Date()
            };
        }
        return null;
    }
    /**
     * Evaluate transitions for PostToolUse events
     */
    evaluatePostToolUseTransition(task, event) {
        const tool = event.tool;
        const currentStatus = task.status;
        // Task starts when work begins
        if (currentStatus === 'todo' && ['Write', 'Edit', 'MultiEdit'].includes(tool || '')) {
            return 'in-progress';
        }
        // Task may be focused when being actively worked on
        if (currentStatus === 'in-progress' && this.isActiveWorkTool(tool)) {
            return 'focused';
        }
        // Complex completion logic would go here
        // For now, we'll be conservative and not auto-complete tasks
        return null;
    }
    /**
     * Evaluate transitions for Stop events
     */
    evaluateStopTransition(task, event) {
        const currentStatus = task.status;
        // When Claude Code session stops, focused tasks go back to in-progress
        if (currentStatus === 'focused') {
            return 'in-progress';
        }
        return null;
    }
    /**
     * Check if a tool represents active work
     */
    isActiveWorkTool(tool) {
        const activeTools = ['Write', 'Edit', 'MultiEdit', 'Bash'];
        return activeTools.includes(tool || '');
    }
    /**
     * Apply a transition to update the task
     */
    async applyTransition(transition) {
        try {
            await this.backlogManager.updateTask(transition.taskId, {
                status: transition.toStatus,
                updatedAt: transition.timestamp
            });
            logger.info('Task transition applied', {
                taskId: transition.taskId,
                fromStatus: transition.fromStatus,
                toStatus: transition.toStatus,
                trigger: transition.trigger
            });
        }
        catch (error) {
            logger.error('Failed to apply task transition', error);
        }
    }
    /**
     * Get transition history for a specific task
     */
    getTaskTransitionHistory(taskId) {
        return this.transitionHistory.filter(t => t.taskId === taskId);
    }
    /**
     * Get all recent transitions
     */
    getRecentTransitions(limit = 10) {
        return this.transitionHistory
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, limit);
    }
    /**
     * Clear old transition history
     */
    clearOldTransitions(olderThanDays = 7) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
        this.transitionHistory = this.transitionHistory.filter(t => t.timestamp > cutoffDate);
    }
}
//# sourceMappingURL=hook-aware-task-manager.js.map
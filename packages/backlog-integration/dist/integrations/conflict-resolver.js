/**
 * Conflict Resolver - Handles conflicts between Critical Claude tasks and Claude Code todos
 */
const logger = {
    info: (msg, data) => console.log(`[INFO] ${msg}`, data || ''),
    error: (msg, error) => console.error(`[ERROR] ${msg}`, error?.message || ''),
    warn: (msg, data) => console.warn(`[WARN] ${msg}`, data || '')
};
export class ConflictResolver {
    conflicts = [];
    resolutionOptions;
    constructor(options) {
        this.resolutionOptions = {
            defaultStrategy: 'last_write_wins',
            autoResolveTypes: ['status_mismatch', 'priority_mismatch'],
            manualReviewRequired: ['content_mismatch'],
            ...options
        };
    }
    /**
     * Detect conflicts between Critical Claude tasks and Claude Code todos
     */
    detectConflicts(criticalClaudeTasks, claudeCodeTodos) {
        logger.info('Detecting conflicts between task systems', {
            criticalClaudeCount: criticalClaudeTasks.length,
            claudeCodeCount: claudeCodeTodos.length
        });
        const conflicts = [];
        // Create lookup maps for efficient comparison
        const taskMap = new Map(criticalClaudeTasks.map(task => [task.id, task]));
        const todoMap = new Map(claudeCodeTodos.map(todo => [todo.id, todo]));
        // Find conflicts in existing items
        for (const task of criticalClaudeTasks) {
            const correspondingTodo = todoMap.get(task.id);
            if (correspondingTodo) {
                // Check for data mismatches
                const itemConflicts = this.compareTaskAndTodo(task, correspondingTodo);
                conflicts.push(...itemConflicts);
            }
            else {
                // Task exists in Critical Claude but not in Claude Code
                conflicts.push({
                    id: `missing_in_claude_code_${task.id}`,
                    type: 'missing_in_target',
                    taskId: task.id,
                    description: `Task "${task.title}" exists in Critical Claude but not in Claude Code`,
                    criticalClaudeData: task,
                    detectedAt: new Date(),
                    resolved: false
                });
            }
        }
        // Find todos that exist in Claude Code but not in Critical Claude
        for (const todo of claudeCodeTodos) {
            if (!taskMap.has(todo.id)) {
                conflicts.push({
                    id: `missing_in_critical_claude_${todo.id}`,
                    type: 'missing_in_source',
                    taskId: todo.id,
                    description: `Todo "${todo.content}" exists in Claude Code but not in Critical Claude`,
                    claudeCodeData: todo,
                    detectedAt: new Date(),
                    resolved: false
                });
            }
        }
        // Store detected conflicts
        this.conflicts.push(...conflicts);
        logger.info('Conflict detection completed', {
            conflictCount: conflicts.length,
            types: this.getConflictTypeCounts(conflicts)
        });
        return conflicts;
    }
    /**
     * Compare a task and todo to find specific conflicts
     */
    compareTaskAndTodo(task, todo) {
        const conflicts = [];
        // Status mismatch
        const mappedTaskStatus = this.mapTaskStatusToTodoStatus(task.status);
        if (mappedTaskStatus !== todo.status) {
            conflicts.push({
                id: `status_mismatch_${task.id}`,
                type: 'status_mismatch',
                taskId: task.id,
                description: `Status mismatch: Critical Claude has "${task.status}" but Claude Code has "${todo.status}"`,
                criticalClaudeData: { status: task.status, updatedAt: task.updatedAt },
                claudeCodeData: { status: todo.status },
                detectedAt: new Date(),
                resolved: false
            });
        }
        // Priority mismatch
        if (task.priority !== todo.priority) {
            conflicts.push({
                id: `priority_mismatch_${task.id}`,
                type: 'priority_mismatch',
                taskId: task.id,
                description: `Priority mismatch: Critical Claude has "${task.priority}" but Claude Code has "${todo.priority}"`,
                criticalClaudeData: { priority: task.priority },
                claudeCodeData: { priority: todo.priority },
                detectedAt: new Date(),
                resolved: false
            });
        }
        return conflicts;
    }
    /**
     * Resolve conflicts automatically based on configured strategies
     */
    async resolveConflicts(conflicts) {
        logger.info('Resolving conflicts', { count: conflicts.length });
        const resolutions = [];
        for (const conflict of conflicts) {
            try {
                let resolution = null;
                // Check if this conflict type should be auto-resolved
                if (this.resolutionOptions.autoResolveTypes.includes(conflict.type)) {
                    resolution = await this.autoResolveConflict(conflict);
                }
                else if (this.resolutionOptions.manualReviewRequired.includes(conflict.type)) {
                    resolution = await this.createManualResolution(conflict);
                }
                else {
                    // Use default strategy
                    resolution = await this.applyDefaultStrategy(conflict);
                }
                if (resolution) {
                    conflict.resolution = resolution;
                    conflict.resolved = true;
                    resolutions.push(resolution);
                    logger.info('Conflict resolved', {
                        conflictId: conflict.id,
                        strategy: resolution.strategy
                    });
                }
            }
            catch (error) {
                logger.error(`Failed to resolve conflict ${conflict.id}`, error);
            }
        }
        return resolutions;
    }
    /**
     * Auto-resolve a conflict based on its type
     */
    async autoResolveConflict(conflict) {
        switch (conflict.type) {
            case 'status_mismatch':
                return this.resolveStatusConflict(conflict);
            case 'priority_mismatch':
                return this.resolvePriorityConflict(conflict);
            case 'missing_in_source':
                return this.resolveMissingInSource(conflict);
            case 'missing_in_target':
                return this.resolveMissingInTarget(conflict);
            default:
                return this.applyDefaultStrategy(conflict);
        }
    }
    /**
     * Resolve status conflicts by preferring the most recent change
     */
    resolveStatusConflict(conflict) {
        const criticalClaudeStatus = conflict.criticalClaudeData?.status;
        const claudeCodeStatus = conflict.claudeCodeData?.status;
        // Status progression priority: todo < in-progress < focused < done
        const statusPriority = {
            'pending': 1,
            'todo': 1,
            'in-progress': 2,
            'in_progress': 2,
            'focused': 3,
            'completed': 4,
            'done': 4
        };
        const criticalPriority = statusPriority[criticalClaudeStatus] || 0;
        const claudePriority = statusPriority[claudeCodeStatus] || 0;
        const winningStatus = criticalPriority >= claudePriority ? criticalClaudeStatus : claudeCodeStatus;
        const strategy = criticalPriority >= claudePriority ? 'critical_claude_wins' : 'claude_code_wins';
        return {
            strategy,
            appliedAt: new Date(),
            resolvedData: { status: winningStatus },
            notes: `Selected more advanced status: ${winningStatus}`
        };
    }
    /**
     * Resolve priority conflicts by preferring higher priority
     */
    resolvePriorityConflict(conflict) {
        const criticalClaudePriority = conflict.criticalClaudeData?.priority;
        const claudeCodePriority = conflict.claudeCodeData?.priority;
        // Priority values: critical > high > medium > low
        const priorityValues = {
            'critical': 4,
            'high': 3,
            'medium': 2,
            'low': 1
        };
        const criticalValue = priorityValues[criticalClaudePriority] || 0;
        const claudeValue = priorityValues[claudeCodePriority] || 0;
        const winningPriority = criticalValue >= claudeValue ? criticalClaudePriority : claudeCodePriority;
        const strategy = criticalValue >= claudeValue ? 'critical_claude_wins' : 'claude_code_wins';
        return {
            strategy,
            appliedAt: new Date(),
            resolvedData: { priority: winningPriority },
            notes: `Selected higher priority: ${winningPriority}`
        };
    }
    /**
     * Resolve missing in source (exists in Claude Code but not Critical Claude)
     */
    resolveMissingInSource(conflict) {
        return {
            strategy: 'claude_code_wins',
            appliedAt: new Date(),
            resolvedData: conflict.claudeCodeData,
            notes: 'Create new task in Critical Claude from Claude Code todo'
        };
    }
    /**
     * Resolve missing in target (exists in Critical Claude but not Claude Code)
     */
    resolveMissingInTarget(conflict) {
        return {
            strategy: 'critical_claude_wins',
            appliedAt: new Date(),
            resolvedData: conflict.criticalClaudeData,
            notes: 'Create new todo in Claude Code from Critical Claude task'
        };
    }
    /**
     * Create a manual resolution (requires human intervention)
     */
    async createManualResolution(conflict) {
        return {
            strategy: 'manual_merge',
            appliedAt: new Date(),
            resolvedData: {
                requiresManualReview: true,
                conflict: conflict
            },
            notes: 'Manual review required - conflict too complex for automatic resolution'
        };
    }
    /**
     * Apply the default resolution strategy
     */
    applyDefaultStrategy(conflict) {
        return {
            strategy: this.resolutionOptions.defaultStrategy,
            appliedAt: new Date(),
            resolvedData: this.selectDataByStrategy(conflict, this.resolutionOptions.defaultStrategy),
            notes: `Applied default strategy: ${this.resolutionOptions.defaultStrategy}`
        };
    }
    /**
     * Select data based on resolution strategy
     */
    selectDataByStrategy(conflict, strategy) {
        switch (strategy) {
            case 'critical_claude_wins':
                return conflict.criticalClaudeData;
            case 'claude_code_wins':
                return conflict.claudeCodeData;
            case 'last_write_wins':
                const ccUpdated = conflict.criticalClaudeData?.updatedAt;
                const claudeUpdated = new Date();
                return ccUpdated && ccUpdated > claudeUpdated ?
                    conflict.criticalClaudeData : conflict.claudeCodeData;
            default:
                return conflict.criticalClaudeData;
        }
    }
    /**
     * Get conflict type counts for reporting
     */
    getConflictTypeCounts(conflicts) {
        const counts = {};
        for (const conflict of conflicts) {
            counts[conflict.type] = (counts[conflict.type] || 0) + 1;
        }
        return counts;
    }
    /**
     * Map task status to todo status for comparison
     */
    mapTaskStatusToTodoStatus(status) {
        const mapping = {
            'todo': 'pending',
            'focused': 'in_progress',
            'in-progress': 'in_progress',
            'blocked': 'pending',
            'dimmed': 'pending',
            'done': 'completed'
        };
        return mapping[status] || 'pending';
    }
    /**
     * Get all unresolved conflicts
     */
    getUnresolvedConflicts() {
        return this.conflicts.filter(c => !c.resolved);
    }
    /**
     * Get conflict statistics
     */
    getConflictStats() {
        const total = this.conflicts.length;
        const resolved = this.conflicts.filter(c => c.resolved).length;
        const unresolved = total - resolved;
        const byType = this.getConflictTypeCounts(this.conflicts);
        return { total, resolved, unresolved, byType };
    }
    /**
     * Clear old resolved conflicts
     */
    clearOldConflicts(olderThanDays = 7) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
        this.conflicts = this.conflicts.filter(c => !c.resolved || c.detectedAt > cutoffDate);
    }
}
//# sourceMappingURL=conflict-resolver.js.map
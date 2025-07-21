/**
 * Common Task Interface - Unified type for all task management systems
 * Provides consistent API across the entire unified task system
 */
// Type guards for legacy compatibility
export function isMCPSimpleTask(task) {
    return task && typeof task.id === 'string' && task.id.startsWith('task-');
}
export function isSimpleManagerTask(task) {
    return task && typeof task.id === 'string' && task.archived !== undefined;
}
// Conversion utilities
export function toCommonTask(task) {
    if (isMCPSimpleTask(task)) {
        return {
            id: task.id,
            title: task.title,
            description: task.description,
            status: normalizeStatus(task.status),
            priority: normalizePriority(task.priority),
            assignee: task.assignee || undefined,
            labels: task.labels || [],
            createdAt: task.createdAt,
            updatedAt: task.updatedAt,
            source: 'manual'
        };
    }
    if (isSimpleManagerTask(task)) {
        return {
            id: task.id,
            title: task.title,
            description: task.description,
            status: task.archived ? 'archived' : task.status,
            priority: task.priority,
            assignee: task.assignee,
            labels: task.labels,
            createdAt: task.createdAt,
            updatedAt: task.updatedAt,
            source: 'manual'
        };
    }
    // Already a CommonTask
    return task;
}
function normalizeStatus(status) {
    const statusMap = {
        'To Do': 'todo',
        'to_do': 'todo',
        'todo': 'todo',
        'In Progress': 'in_progress',
        'in_progress': 'in_progress',
        'Done': 'done',
        'done': 'done',
        'Blocked': 'blocked',
        'blocked': 'blocked',
        'Archived': 'archived',
        'archived': 'archived'
    };
    return statusMap[status] || 'todo';
}
function normalizePriority(priority) {
    const priorityMap = {
        'critical': 'critical',
        'high': 'high',
        'medium': 'medium',
        'low': 'low'
    };
    return priorityMap[priority.toLowerCase()] || 'medium';
}
//# sourceMappingURL=common-task.js.map
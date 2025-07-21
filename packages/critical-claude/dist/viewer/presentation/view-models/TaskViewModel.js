/**
 * Task View Model
 * Transforms domain entities for presentation layer
 */
export class TaskViewModelMapper {
    static STATUS_ICONS = {
        pending: '○',
        in_progress: '◐',
        completed: '●',
        cancelled: '✗',
        blocked: '⊘'
    };
    static STATUS_COLORS = {
        pending: 'gray',
        in_progress: 'blue',
        completed: 'green',
        cancelled: 'red',
        blocked: 'orange'
    };
    static PRIORITY_ICONS = {
        critical: '🔴',
        high: '🟠',
        medium: '🟡',
        low: '🟢'
    };
    static PRIORITY_COLORS = {
        critical: 'red',
        high: 'orange',
        medium: 'yellow',
        low: 'green'
    };
    static toViewModel(task) {
        const duration = this.calculateDuration(task);
        const progress = this.calculateProgress(task);
        const isOverdue = this.checkIfOverdue(task);
        return {
            id: task.id.value,
            title: task.title,
            description: task.description,
            status: task.status.value,
            statusIcon: this.STATUS_ICONS[task.status.value],
            statusColor: this.STATUS_COLORS[task.status.value],
            priority: task.priority.value,
            priorityIcon: this.PRIORITY_ICONS[task.priority.value],
            priorityColor: this.PRIORITY_COLORS[task.priority.value],
            tags: Array.from(task.tags),
            createdAt: this.formatDate(task.createdAt),
            updatedAt: this.formatDate(task.updatedAt),
            completedAt: task.completedAt ? this.formatDate(task.completedAt) : undefined,
            duration,
            hasSubtasks: task.subtasks.length > 0,
            subtaskCount: task.subtasks.length,
            isOverdue,
            progress
        };
    }
    static toViewModels(tasks) {
        return tasks.map(task => this.toViewModel(task));
    }
    static formatDate(date) {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor(diff / (1000 * 60));
        if (days > 7) {
            return date.toLocaleDateString();
        }
        else if (days > 0) {
            return `${days}d ago`;
        }
        else if (hours > 0) {
            return `${hours}h ago`;
        }
        else if (minutes > 0) {
            return `${minutes}m ago`;
        }
        else {
            return 'just now';
        }
    }
    static calculateDuration(task) {
        if (!task.status.isCompleted() || !task.completedAt) {
            return undefined;
        }
        const duration = task.completedAt.getTime() - task.createdAt.getTime();
        const hours = Math.floor(duration / (1000 * 60 * 60));
        const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        else {
            return `${minutes}m`;
        }
    }
    static calculateProgress(task) {
        if (task.status.isCompleted())
            return 100;
        if (task.status.isPending())
            return 0;
        if (task.status.isInProgress())
            return 50;
        if (task.status.isBlocked())
            return 25;
        return 0;
    }
    static checkIfOverdue(task) {
        if (task.status.isCompleted() || task.status.isCancelled()) {
            return false;
        }
        // Check if task has a due date in metadata
        const dueDate = task.metadata.customFields['dueDate'];
        if (!dueDate)
            return false;
        return new Date(dueDate) < new Date();
    }
}
//# sourceMappingURL=TaskViewModel.js.map
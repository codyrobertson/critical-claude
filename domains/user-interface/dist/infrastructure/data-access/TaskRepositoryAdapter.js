/**
 * Task Repository Adapter
 * Simplified adapter that provides basic task storage for the viewer
 */
import { Task } from '../../domain/entities/Task.js';
import { TaskId } from '../../domain/value-objects/TaskId.js';
import { TaskStatus } from '../../domain/value-objects/TaskStatus.js';
import { TaskPriority } from '../../domain/value-objects/TaskPriority.js';
import { TaskMetadata } from '../../domain/value-objects/TaskMetadata.js';
import path from 'path';
import os from 'os';
import fs from 'fs/promises';
export class TaskRepositoryAdapter {
    storagePath;
    tasksFile;
    initialized = false;
    constructor() {
        this.storagePath = path.join(os.homedir(), '.critical-claude');
        this.tasksFile = path.join(this.storagePath, 'tasks.json');
    }
    async initialize() {
        if (!this.initialized) {
            await fs.mkdir(this.storagePath, { recursive: true });
            this.initialized = true;
        }
    }
    // Read operations
    async findById(id) {
        await this.initialize();
        const tasks = await this.loadTasks();
        const stored = tasks.find(t => t.id === id.value);
        return stored ? this.convertFromStoredTask(stored) : null;
    }
    async findAll(filter, sort, pagination) {
        await this.initialize();
        let tasks = await this.loadTasks();
        // Apply filters
        if (filter) {
            if (filter.status && filter.status.length > 0) {
                const statusValues = filter.status.map(s => s.value);
                tasks = tasks.filter(t => statusValues.includes(t.status));
            }
            if (filter.priority && filter.priority.length > 0) {
                const priorityValues = filter.priority.map(p => p.value);
                tasks = tasks.filter(t => priorityValues.includes(t.priority));
            }
            if (filter.tags && filter.tags.length > 0) {
                tasks = tasks.filter(t => filter.tags.some(tag => t.tags.includes(tag)));
            }
            if (filter.search) {
                const searchLower = filter.search.toLowerCase();
                tasks = tasks.filter(t => t.title.toLowerCase().includes(searchLower) ||
                    (t.description && t.description.toLowerCase().includes(searchLower)));
            }
        }
        // Apply sorting
        if (sort) {
            tasks.sort((a, b) => {
                let comparison = 0;
                switch (sort.field) {
                    case 'createdAt':
                        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                        break;
                    case 'updatedAt':
                        comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
                        break;
                    case 'title':
                        comparison = a.title.localeCompare(b.title);
                        break;
                    case 'status':
                        comparison = a.status.localeCompare(b.status);
                        break;
                    case 'priority':
                        comparison = a.priority.localeCompare(b.priority);
                        break;
                }
                return sort.direction === 'asc' ? comparison : -comparison;
            });
        }
        // Apply pagination
        const total = tasks.length;
        if (pagination) {
            const startIndex = (pagination.page - 1) * pagination.pageSize;
            tasks = tasks.slice(startIndex, startIndex + pagination.pageSize);
        }
        return {
            items: tasks.map(t => this.convertFromStoredTask(t)),
            total,
            page: pagination?.page || 1,
            pageSize: pagination?.pageSize || total,
            totalPages: pagination ? Math.ceil(total / pagination.pageSize) : 1
        };
    }
    async findByIds(ids) {
        await this.initialize();
        const tasks = await this.loadTasks();
        const idValues = ids.map(id => id.value);
        return tasks
            .filter(t => idValues.includes(t.id))
            .map(t => this.convertFromStoredTask(t));
    }
    async search(query, limit) {
        await this.initialize();
        const tasks = await this.loadTasks();
        const lowerQuery = query.toLowerCase();
        let filtered = tasks.filter(t => t.title.toLowerCase().includes(lowerQuery) ||
            (t.description && t.description.toLowerCase().includes(lowerQuery)) ||
            t.tags.some(tag => tag.toLowerCase().includes(lowerQuery)));
        if (limit) {
            filtered = filtered.slice(0, limit);
        }
        return filtered.map(t => this.convertFromStoredTask(t));
    }
    // Write operations
    async save(task) {
        await this.initialize();
        const tasks = await this.loadTasks();
        const stored = this.convertToStoredTask(task);
        const existingIndex = tasks.findIndex(t => t.id === task.id.value);
        if (existingIndex >= 0) {
            tasks[existingIndex] = stored;
        }
        else {
            tasks.push(stored);
        }
        await this.saveTasks(tasks);
    }
    async saveMany(tasks) {
        for (const task of tasks) {
            await this.save(task);
        }
    }
    async delete(id) {
        await this.initialize();
        const tasks = await this.loadTasks();
        const filtered = tasks.filter(t => t.id !== id.value);
        await this.saveTasks(filtered);
    }
    async deleteMany(ids) {
        await this.initialize();
        const tasks = await this.loadTasks();
        const idValues = ids.map(id => id.value);
        const filtered = tasks.filter(t => !idValues.includes(t.id));
        await this.saveTasks(filtered);
    }
    // Specialized queries
    async findSubtasks(parentId) {
        await this.initialize();
        const tasks = await this.loadTasks();
        return tasks
            .filter(t => t.parentId === parentId.value)
            .map(t => this.convertFromStoredTask(t));
    }
    async findRootTasks() {
        await this.initialize();
        const tasks = await this.loadTasks();
        return tasks
            .filter(t => !t.parentId)
            .map(t => this.convertFromStoredTask(t));
    }
    async countByStatus(status) {
        await this.initialize();
        const tasks = await this.loadTasks();
        return tasks.filter(t => t.status === status.value).length;
    }
    async findOverdueTasks() {
        // For simplicity, return empty array - viewer doesn't need this
        return [];
    }
    // Transaction support (no-ops for file-based storage)
    async beginTransaction() {
        // No-op
    }
    async commitTransaction() {
        // No-op
    }
    async rollbackTransaction() {
        // No-op
    }
    // Helper methods
    async loadTasks() {
        try {
            const data = await fs.readFile(this.tasksFile, 'utf-8');
            return JSON.parse(data);
        }
        catch {
            return [];
        }
    }
    async saveTasks(tasks) {
        await fs.writeFile(this.tasksFile, JSON.stringify(tasks, null, 2));
    }
    convertFromStoredTask(stored) {
        return new Task(new TaskId(stored.id), stored.title, stored.description || '', this.mapStatus(stored.status), this.mapPriority(stored.priority), new TaskMetadata('file-storage', 'viewer'), new Date(stored.createdAt), new Date(stored.updatedAt), stored.completedAt ? new Date(stored.completedAt) : undefined, new Set(stored.tags), stored.subtasks.map(id => new TaskId(id)), stored.parentId ? new TaskId(stored.parentId) : undefined);
    }
    convertToStoredTask(task) {
        return {
            id: task.id.value,
            title: task.title,
            description: task.description,
            status: task.status.value,
            priority: task.priority.value,
            tags: Array.from(task.tags),
            createdAt: task.createdAt.toISOString(),
            updatedAt: task.updatedAt.toISOString(),
            completedAt: task.completedAt?.toISOString(),
            parentId: task.parentId?.value,
            subtasks: task.subtasks.map(id => id.value)
        };
    }
    mapStatus(status) {
        // Normalize status values
        const normalized = status.toLowerCase();
        switch (normalized) {
            case 'todo':
                return TaskStatus.fromString('pending');
            case 'inprogress':
            case 'in_progress':
                return TaskStatus.fromString('in_progress');
            case 'done':
                return TaskStatus.fromString('completed');
            case 'pending':
            case 'completed':
            case 'blocked':
            case 'cancelled':
                return TaskStatus.fromString(normalized);
            default:
                return TaskStatus.fromString('pending');
        }
    }
    mapPriority(priority) {
        const normalized = priority.toLowerCase();
        switch (normalized) {
            case 'critical':
            case 'high':
            case 'medium':
            case 'low':
                return TaskPriority.fromString(normalized);
            default:
                return TaskPriority.fromString('medium');
        }
    }
}
//# sourceMappingURL=TaskRepositoryAdapter.js.map
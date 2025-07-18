/**
 * BacklogManager - Core data persistence for AGILE hierarchy
 * Handles Phase > Epic > Sprint > Task management with markdown storage
 */
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
// Simple logger for now
const logger = {
    info: (msg, data) => console.log(`[INFO] ${msg}`, data || ''),
    error: (msg, error) => console.error(`[ERROR] ${msg}`, error?.message || ''),
    warn: (msg, data) => console.warn(`[WARN] ${msg}`, data || '')
};
import TaskStateManager from '../core/task-state-manager.js';
export class BacklogManager {
    config;
    stateManager;
    _initialized = false;
    constructor(config) {
        const defaultPath = process.cwd();
        this.config = {
            backlogPath: path.join(defaultPath, '.critical-claude'),
            phasesPath: path.join(defaultPath, '.critical-claude', 'phases'),
            epicsPath: path.join(defaultPath, '.critical-claude', 'epics'),
            sprintsPath: path.join(defaultPath, '.critical-claude', 'sprints'),
            tasksPath: path.join(defaultPath, '.critical-claude', 'tasks'),
            ...config
        };
        this.stateManager = new TaskStateManager();
    }
    async initialize() {
        if (this._initialized)
            return;
        await this.ensureDirectories();
        this._initialized = true;
    }
    isInitialized() {
        return this._initialized;
    }
    async ensureDirectories() {
        try {
            await fs.mkdir(this.config.backlogPath, { recursive: true });
            await fs.mkdir(this.config.phasesPath, { recursive: true });
            await fs.mkdir(this.config.epicsPath, { recursive: true });
            await fs.mkdir(this.config.sprintsPath, { recursive: true });
            await fs.mkdir(this.config.tasksPath, { recursive: true });
        }
        catch (error) {
            logger.error('Failed to create backlog directories', error);
        }
    }
    // Phase Management
    async createPhase(phaseData) {
        const phase = {
            id: uuidv4(),
            name: phaseData.name || 'Untitled Phase',
            description: phaseData.description || '',
            status: phaseData.status || 'planning',
            startDate: phaseData.startDate || new Date(),
            endDate: phaseData.endDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            goals: phaseData.goals || [],
            epics: [],
            createdAt: new Date(),
            updatedAt: new Date()
        };
        await this.savePhase(phase);
        logger.info('Phase created', { phaseId: phase.id, name: phase.name });
        return phase;
    }
    async getPhases(statusFilter) {
        try {
            const files = await fs.readdir(this.config.phasesPath);
            const phases = [];
            for (const file of files) {
                if (file.endsWith('.json')) {
                    const filePath = path.join(this.config.phasesPath, file);
                    const content = await fs.readFile(filePath, 'utf8');
                    const phase = JSON.parse(content);
                    // Convert date strings back to Date objects
                    phase.startDate = new Date(phase.startDate);
                    phase.endDate = new Date(phase.endDate);
                    phase.createdAt = new Date(phase.createdAt);
                    phase.updatedAt = new Date(phase.updatedAt);
                    if (!statusFilter || phase.status === statusFilter) {
                        phases.push(phase);
                    }
                }
            }
            return phases.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
        }
        catch (error) {
            logger.error('Failed to get phases', error);
            return [];
        }
    }
    async getPhase(id) {
        try {
            const filePath = path.join(this.config.phasesPath, `${id}.json`);
            const content = await fs.readFile(filePath, 'utf8');
            const phase = JSON.parse(content);
            // Convert date strings back to Date objects
            phase.startDate = new Date(phase.startDate);
            phase.endDate = new Date(phase.endDate);
            phase.createdAt = new Date(phase.createdAt);
            phase.updatedAt = new Date(phase.updatedAt);
            return phase;
        }
        catch (error) {
            return null;
        }
    }
    async updatePhase(id, updates) {
        const existingPhase = await this.getPhase(id);
        if (!existingPhase)
            return null;
        const updatedPhase = {
            ...existingPhase,
            ...updates,
            id, // Ensure ID doesn't change
            updatedAt: new Date()
        };
        await this.savePhase(updatedPhase);
        logger.info('Phase updated', { phaseId: id });
        return updatedPhase;
    }
    async savePhase(phase) {
        const filePath = path.join(this.config.phasesPath, `${phase.id}.json`);
        await fs.writeFile(filePath, JSON.stringify(phase, null, 2));
    }
    // Epic Management
    async createEpic(epicData) {
        const epic = {
            id: uuidv4(),
            phaseId: epicData.phaseId,
            name: epicData.name || 'Untitled Epic',
            description: epicData.description || '',
            businessValue: epicData.businessValue || '',
            status: epicData.status || 'planning',
            priority: epicData.priority || 'medium',
            estimatedEffort: epicData.estimatedEffort || 0,
            acceptanceCriteria: epicData.acceptanceCriteria || [],
            labels: epicData.labels || [],
            sprints: [],
            createdAt: new Date(),
            updatedAt: new Date()
        };
        await this.saveEpic(epic);
        // Update phase to include this epic
        const phase = await this.getPhase(epicData.phaseId);
        if (phase) {
            phase.epics.push(epic.id);
            await this.savePhase(phase);
        }
        logger.info('Epic created', { epicId: epic.id, name: epic.name, phaseId: epicData.phaseId });
        return epic;
    }
    async getEpics(phaseId, statusFilter) {
        try {
            const files = await fs.readdir(this.config.epicsPath);
            const epics = [];
            for (const file of files) {
                if (file.endsWith('.json')) {
                    const filePath = path.join(this.config.epicsPath, file);
                    const content = await fs.readFile(filePath, 'utf8');
                    const epic = JSON.parse(content);
                    // Convert date strings back to Date objects
                    epic.createdAt = new Date(epic.createdAt);
                    epic.updatedAt = new Date(epic.updatedAt);
                    const matchesPhase = !phaseId || epic.phaseId === phaseId;
                    const matchesStatus = !statusFilter || epic.status === statusFilter;
                    if (matchesPhase && matchesStatus) {
                        epics.push(epic);
                    }
                }
            }
            return epics.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        }
        catch (error) {
            logger.error('Failed to get epics', error);
            return [];
        }
    }
    async saveEpic(epic) {
        const filePath = path.join(this.config.epicsPath, `${epic.id}.json`);
        await fs.writeFile(filePath, JSON.stringify(epic, null, 2));
    }
    // Sprint Management
    async createSprint(sprintData) {
        const sprint = {
            id: uuidv4(),
            epicId: sprintData.epicId,
            name: sprintData.name || 'Untitled Sprint',
            goal: sprintData.goal || '',
            status: sprintData.status || 'planning',
            capacity: sprintData.capacity || 20,
            startDate: sprintData.startDate || new Date(),
            endDate: sprintData.endDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            tasks: [],
            burndownData: [],
            createdAt: new Date(),
            updatedAt: new Date()
        };
        await this.saveSprint(sprint);
        // Update epic to include this sprint
        const epic = await this.getEpic(sprintData.epicId);
        if (epic) {
            epic.sprints.push(sprint.id);
            await this.saveEpic(epic);
        }
        logger.info('Sprint created', { sprintId: sprint.id, name: sprint.name, epicId: sprintData.epicId });
        return sprint;
    }
    async getSprint(id) {
        try {
            const filePath = path.join(this.config.sprintsPath, `${id}.json`);
            const content = await fs.readFile(filePath, 'utf8');
            const sprint = JSON.parse(content);
            // Convert date strings back to Date objects
            sprint.startDate = new Date(sprint.startDate);
            sprint.endDate = new Date(sprint.endDate);
            sprint.createdAt = new Date(sprint.createdAt);
            sprint.updatedAt = new Date(sprint.updatedAt);
            return sprint;
        }
        catch (error) {
            return null;
        }
    }
    async getSprints(epicId, statusFilter) {
        try {
            const files = await fs.readdir(this.config.sprintsPath);
            const sprints = [];
            for (const file of files) {
                if (file.endsWith('.json')) {
                    const filePath = path.join(this.config.sprintsPath, file);
                    const content = await fs.readFile(filePath, 'utf8');
                    const sprint = JSON.parse(content);
                    // Convert date strings back to Date objects
                    sprint.startDate = new Date(sprint.startDate);
                    sprint.endDate = new Date(sprint.endDate);
                    sprint.createdAt = new Date(sprint.createdAt);
                    sprint.updatedAt = new Date(sprint.updatedAt);
                    const matchesEpic = !epicId || sprint.epicId === epicId;
                    const matchesStatus = !statusFilter || sprint.status === statusFilter;
                    if (matchesEpic && matchesStatus) {
                        sprints.push(sprint);
                    }
                }
            }
            return sprints.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
        }
        catch (error) {
            logger.error('Failed to get sprints', error);
            return [];
        }
    }
    async getEpic(id) {
        try {
            const filePath = path.join(this.config.epicsPath, `${id}.json`);
            const content = await fs.readFile(filePath, 'utf8');
            const epic = JSON.parse(content);
            // Convert date strings back to Date objects
            epic.createdAt = new Date(epic.createdAt);
            epic.updatedAt = new Date(epic.updatedAt);
            return epic;
        }
        catch (error) {
            return null;
        }
    }
    async updateSprint(id, updates) {
        const existingSprint = await this.getSprint(id);
        if (!existingSprint)
            return null;
        const updatedSprint = {
            ...existingSprint,
            ...updates,
            id, // Ensure ID doesn't change
            updatedAt: new Date()
        };
        await this.saveSprint(updatedSprint);
        logger.info('Sprint updated', { sprintId: id });
        return updatedSprint;
    }
    async saveSprint(sprint) {
        const filePath = path.join(this.config.sprintsPath, `${sprint.id}.json`);
        await fs.writeFile(filePath, JSON.stringify(sprint, null, 2));
    }
    // Task Management
    async createTask(taskData) {
        const task = {
            id: uuidv4(),
            title: taskData.title || 'Untitled Task',
            description: taskData.description || '',
            status: taskData.status || 'todo',
            assignee: taskData.assignee,
            storyPoints: taskData.storyPoints || 1,
            priority: taskData.priority || 'medium',
            labels: taskData.labels || [],
            acceptanceCriteria: this.ensureAcceptanceCriteria(taskData.acceptanceCriteria || []),
            dependencies: this.ensureTaskDependencies(taskData.dependencies || []),
            notes: taskData.notes || [],
            codeReferences: taskData.codeReferences || [],
            generatedBy: taskData.generatedBy || 'manual',
            aiMetadata: taskData.aiMetadata,
            timeTracking: taskData.timeTracking || {
                estimated: 0,
                actual: 0,
                remaining: 0
            },
            stateHistory: [{
                    id: uuidv4(),
                    fromState: null,
                    toState: 'todo',
                    changedBy: 'system',
                    changedAt: new Date(),
                    reason: 'Task created'
                }],
            createdAt: new Date(),
            updatedAt: new Date()
        };
        await this.saveTask(task);
        // Add task to sprint if specified
        if (taskData.sprintId) {
            const sprint = await this.getSprint(taskData.sprintId);
            if (sprint) {
                sprint.tasks.push(task);
                await this.saveSprint(sprint);
            }
        }
        logger.info('Task created', { taskId: task.id, title: task.title, sprintId: taskData.sprintId });
        return task;
    }
    async createTasksFromSuggestions(suggestions, sprintId) {
        const createdTasks = [];
        for (const suggestion of suggestions) {
            const createdTask = await this.createTask({
                title: suggestion.title,
                description: suggestion.description,
                storyPoints: suggestion.estimatedEffort,
                priority: suggestion.priority,
                labels: suggestion.labels,
                acceptanceCriteria: suggestion.acceptanceCriteria, // string[] will be converted
                dependencies: suggestion.dependencies, // string[] will be converted
                codeReferences: suggestion.codeReferences,
                generatedBy: 'ai',
                aiMetadata: {
                    confidence: suggestion.confidence,
                    reasoning: suggestion.reasoning,
                    suggestedEffort: suggestion.estimatedEffort,
                    riskFactors: []
                },
                sprintId
            });
            createdTasks.push(createdTask);
        }
        return createdTasks;
    }
    async saveTask(task) {
        const filePath = path.join(this.config.tasksPath, `${task.id}.json`);
        await fs.writeFile(filePath, JSON.stringify(task, null, 2));
    }
    // Reporting and Analytics
    async generateMarkdownSummary() {
        const phases = await this.getPhases();
        let markdown = '# Critical Claude Backlog Summary\n\n';
        markdown += `Generated: ${new Date().toISOString()}\n\n`;
        for (const phase of phases) {
            markdown += `## Phase: ${phase.name}\n`;
            markdown += `**Status:** ${phase.status}\n`;
            markdown += `**Period:** ${phase.startDate.toISOString().split('T')[0]} → ${phase.endDate.toISOString().split('T')[0]}\n`;
            markdown += `**Description:** ${phase.description}\n\n`;
            if (phase.goals.length > 0) {
                markdown += `**Goals:**\n`;
                phase.goals.forEach(goal => {
                    markdown += `- ${goal}\n`;
                });
                markdown += '\n';
            }
            const epics = await this.getEpics(phase.id);
            if (epics.length > 0) {
                markdown += '### Epics:\n';
                for (const epic of epics) {
                    markdown += `- **${epic.name}** (${epic.status}) - ${epic.estimatedEffort} points\n`;
                    markdown += `  ${epic.description}\n`;
                }
                markdown += '\n';
            }
        }
        return markdown;
    }
    async getProjectStats() {
        const phases = await this.getPhases();
        const epics = await this.getEpics();
        // Get all sprints at once instead of individual lookups (O(n) instead of O(n²))
        const allSprints = await this.getSprints();
        // Get all tasks for detailed statistics
        const allTasks = await this.listTasks();
        // Create lookup map for O(1) sprint access
        const sprintMap = new Map(allSprints.map(sprint => [sprint.id, sprint]));
        let totalSprints = 0;
        let totalTasksFromSprints = 0;
        let aiGeneratedTasks = 0;
        for (const epic of epics) {
            totalSprints += epic.sprints.length;
            // Use map lookup instead of individual getSprint() calls
            for (const sprintId of epic.sprints) {
                const sprint = sprintMap.get(sprintId);
                if (sprint) {
                    totalTasksFromSprints += sprint.tasks.length;
                    aiGeneratedTasks += sprint.tasks.filter(task => task.generatedBy === 'ai').length;
                }
            }
        }
        // Calculate task statistics by status and priority
        const byStatus = {};
        const byPriority = {};
        for (const task of allTasks) {
            // Count by status
            byStatus[task.status] = (byStatus[task.status] || 0) + 1;
            // Count by priority
            byPriority[task.priority] = (byPriority[task.priority] || 0) + 1;
        }
        return {
            totalPhases: phases.length,
            totalEpics: epics.length,
            totalSprints,
            totalTasks: Math.max(totalTasksFromSprints, allTasks.length), // Use the higher count (some tasks might not be in sprints)
            aiGeneratedTasks,
            // For test compatibility
            total: allTasks.length,
            byStatus,
            byPriority
        };
    }
    // Brutal state management methods
    async changeTaskState(taskId, newState, changedBy, reason, metadata) {
        try {
            const task = await this.getTask(taskId);
            if (!task) {
                return { success: false, message: `Task ${taskId} not found` };
            }
            const result = await this.stateManager.changeTaskState(task, newState, changedBy, reason, metadata);
            if (result.success && result.updatedTask) {
                await this.saveTask(result.updatedTask);
                return {
                    success: true,
                    message: `Task state changed from ${task.status} to ${newState}`,
                    task: result.updatedTask
                };
            }
            else {
                return {
                    success: false,
                    message: result.validation.reason || 'State change validation failed'
                };
            }
        }
        catch (error) {
            logger.error('Failed to change task state', error);
            return {
                success: false,
                message: `State change failed: ${error.message}`
            };
        }
    }
    async focusTask(taskId, developerId) {
        return this.changeTaskState(taskId, 'focused', developerId, 'Developer focused on task');
    }
    async blockTask(taskId, blockedBy, reason, expectedResolution) {
        return this.changeTaskState(taskId, 'blocked', blockedBy, `Blocked: ${reason}`, {
            blockerReason: reason,
            expectedResolution
        });
    }
    async completeTask(taskId, completedBy, verificationNotes) {
        return this.changeTaskState(taskId, 'done', completedBy, `Completed: ${verificationNotes || 'No notes'}`);
    }
    async getTask(id) {
        try {
            const filePath = path.join(this.config.tasksPath, `${id}.json`);
            const content = await fs.readFile(filePath, 'utf8');
            const task = JSON.parse(content);
            // Convert date strings back to Date objects
            task.createdAt = new Date(task.createdAt);
            task.updatedAt = new Date(task.updatedAt);
            if (task.completedAt)
                task.completedAt = new Date(task.completedAt);
            if (task.archivedAt)
                task.archivedAt = new Date(task.archivedAt);
            // Convert state history dates
            task.stateHistory = task.stateHistory.map(sh => ({
                ...sh,
                changedAt: new Date(sh.changedAt)
            }));
            return task;
        }
        catch (error) {
            return null;
        }
    }
    async listTasks() {
        try {
            const files = await fs.readdir(this.config.tasksPath);
            const tasks = [];
            for (const file of files) {
                if (file.endsWith('.json')) {
                    const taskId = file.replace('.json', '');
                    const task = await this.getTask(taskId);
                    if (task) {
                        tasks.push(task);
                    }
                }
            }
            // Sort by creation date (newest first)
            tasks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
            return tasks;
        }
        catch (error) {
            logger.error('Failed to list tasks', error);
            return [];
        }
    }
    async updateTask(taskId, updates) {
        const existingTask = await this.getTask(taskId);
        if (!existingTask) {
            throw new Error(`Task not found: ${taskId}`);
        }
        // Merge updates with existing task
        const updatedTask = {
            ...existingTask,
            ...updates,
            id: taskId, // Ensure ID doesn't change
            updatedAt: new Date()
        };
        // If status changed, update state history
        if (updates.status && updates.status !== existingTask.status) {
            updatedTask.stateHistory = [
                ...existingTask.stateHistory,
                {
                    id: uuidv4(),
                    fromState: existingTask.status,
                    toState: updates.status,
                    changedAt: new Date(),
                    changedBy: 'user',
                    reason: 'Manual update via UI'
                }
            ];
        }
        await this.saveTask(updatedTask);
        logger.info(`Task updated: ${updatedTask.title}`);
        return updatedTask;
    }
    async deleteTask(taskId) {
        const existingTask = await this.getTask(taskId);
        if (!existingTask) {
            throw new Error(`Task not found: ${taskId}`);
        }
        try {
            const filePath = path.join(this.config.tasksPath, `${taskId}.json`);
            await fs.unlink(filePath);
            logger.info(`Task deleted: ${existingTask.title}`);
        }
        catch (error) {
            throw new Error(`Failed to delete task: ${error.message}`);
        }
    }
    // Helper methods for type conversion
    ensureAcceptanceCriteria(criteria) {
        if (criteria.length === 0)
            return [];
        // If first item is a string, convert all
        if (typeof criteria[0] === 'string') {
            return criteria.map(description => ({
                id: uuidv4(),
                description,
                verified: false
            }));
        }
        return criteria;
    }
    ensureTaskDependencies(dependencies) {
        if (dependencies.length === 0)
            return [];
        // If first item is a string, convert all
        if (typeof dependencies[0] === 'string') {
            return dependencies.map(taskId => ({
                taskId,
                type: 'blocked_by',
                createdAt: new Date(),
                createdBy: 'system'
            }));
        }
        return dependencies;
    }
    convertAcceptanceCriteria(criteria) {
        return criteria.map(description => ({
            id: uuidv4(),
            description,
            verified: false
        }));
    }
    convertTaskDependencies(dependencies) {
        return dependencies.map(taskId => ({
            taskId,
            type: 'blocked_by',
            createdAt: new Date(),
            createdBy: 'system'
        }));
    }
}
//# sourceMappingURL=backlog-manager.js.map
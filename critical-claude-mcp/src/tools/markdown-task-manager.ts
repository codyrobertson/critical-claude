/**
 * Markdown-Native Task Manager for Critical Claude
 * Inspired by Backlog.md - tasks as markdown files in git repo
 */

import fs from 'fs/promises';
import path from 'path';
import { EventEmitter } from 'events';
import { exec } from 'child_process';
import { promisify } from 'util';
import { logger } from '../logger.js';

const execAsync = promisify(exec);

export interface MarkdownTask {
  id: string;
  title: string;
  description?: string;
  status: 'To Do' | 'In Progress' | 'Done' | 'Blocked';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  assignee?: string;
  labels: string[];
  parent?: string;
  dependencies: string[];
  plan?: string;
  acceptanceCriteria: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  filePath: string;
}

export interface TaskConfig {
  backlogDir: string;
  defaultStatus: string;
  statuses: string[];
  defaultAssignee?: string;
  autoCommit: boolean;
  dateFormat: string;
  defaultEditor: string;
  zeroPaddedIds: boolean;
}

export class MarkdownTaskManager extends EventEmitter {
  private config: TaskConfig;
  private projectRoot: string;
  private backlogDir: string;
  private nextId: number = 1;

  constructor(projectRoot: string, config: Partial<TaskConfig> = {}) {
    super();
    this.projectRoot = projectRoot;
    
    this.config = {
      backlogDir: 'critical-claude',
      defaultStatus: 'To Do',
      statuses: ['To Do', 'In Progress', 'Done', 'Blocked'],
      autoCommit: false,
      dateFormat: 'yyyy-mm-dd',
      defaultEditor: process.env.EDITOR || 'nano',
      zeroPaddedIds: false,
      ...config
    };

    this.backlogDir = path.join(this.projectRoot, this.config.backlogDir);
  }

  async initialize(): Promise<void> {
    try {
      // Create backlog directory structure
      await fs.mkdir(this.backlogDir, { recursive: true });
      await fs.mkdir(path.join(this.backlogDir, 'tasks'), { recursive: true });
      await fs.mkdir(path.join(this.backlogDir, 'completed'), { recursive: true });
      await fs.mkdir(path.join(this.backlogDir, 'drafts'), { recursive: true });

      // Create config file if it doesn't exist
      const configPath = path.join(this.backlogDir, 'config.yml');
      try {
        await fs.access(configPath);
      } catch {
        await this.createConfigFile(configPath);
      }

      // Initialize next ID
      await this.loadNextId();

      logger.info('Markdown task manager initialized', {
        backlogDir: this.backlogDir,
        autoCommit: this.config.autoCommit
      });

    } catch (error) {
      logger.error('Failed to initialize markdown task manager', error as Error);
      throw error;
    }
  }

  async createTask(data: {
    title: string;
    description?: string;
    status?: string;
    priority?: string;
    assignee?: string;
    labels?: string[];
    parent?: string;
    dependencies?: string[];
    plan?: string;
    acceptanceCriteria?: string[];
    notes?: string;
    isDraft?: boolean;
  }): Promise<MarkdownTask> {
    const id = this.generateTaskId();
    const now = new Date().toISOString();
    
    const task: MarkdownTask = {
      id,
      title: data.title,
      description: data.description,
      status: (data.status || this.config.defaultStatus) as any,
      priority: data.priority as any,
      assignee: data.assignee || this.config.defaultAssignee,
      labels: data.labels || [],
      parent: data.parent,
      dependencies: data.dependencies || [],
      plan: data.plan,
      acceptanceCriteria: data.acceptanceCriteria || [],
      notes: data.notes,
      createdAt: now,
      updatedAt: now,
      filePath: ''
    };

    // Create markdown file
    const fileName = `task-${id} - ${this.sanitizeFileName(data.title)}.md`;
    const subDir = data.isDraft ? 'drafts' : 'tasks';
    const filePath = path.join(this.backlogDir, subDir, fileName);
    
    task.filePath = filePath;

    const markdownContent = this.generateMarkdownContent(task);
    await fs.writeFile(filePath, markdownContent);

    // Auto-commit if enabled
    if (this.config.autoCommit) {
      await this.commitChanges(`Create task-${id}: ${data.title}`);
    }

    this.emit('taskCreated', task);
    logger.info('Task created', { id, title: data.title, filePath });

    return task;
  }

  async listTasks(filters: {
    status?: string;
    assignee?: string;
    parent?: string;
    labels?: string[];
    includeDrafts?: boolean;
  } = {}): Promise<MarkdownTask[]> {
    const tasks: MarkdownTask[] = [];
    
    // Load tasks from tasks directory
    const tasksDir = path.join(this.backlogDir, 'tasks');
    try {
      const files = await fs.readdir(tasksDir);
      const taskFiles = files.filter(f => f.startsWith('task-') && f.endsWith('.md'));
      
      for (const file of taskFiles) {
        const filePath = path.join(tasksDir, file);
        const task = await this.loadTaskFromFile(filePath);
        if (task) tasks.push(task);
      }
    } catch {
      // Tasks directory doesn't exist yet
    }

    // Load drafts if requested
    if (filters.includeDrafts) {
      const draftsDir = path.join(this.backlogDir, 'drafts');
      try {
        const files = await fs.readdir(draftsDir);
        const draftFiles = files.filter(f => f.startsWith('task-') && f.endsWith('.md'));
        
        for (const file of draftFiles) {
          const filePath = path.join(draftsDir, file);
          const task = await this.loadTaskFromFile(filePath);
          if (task) tasks.push(task);
        }
      } catch {
        // Drafts directory doesn't exist yet
      }
    }

    // Apply filters
    let filteredTasks = tasks;

    if (filters.status) {
      filteredTasks = filteredTasks.filter(t => t.status === filters.status);
    }

    if (filters.assignee) {
      filteredTasks = filteredTasks.filter(t => t.assignee === filters.assignee);
    }

    if (filters.parent) {
      filteredTasks = filteredTasks.filter(t => t.parent === filters.parent);
    }

    if (filters.labels && filters.labels.length > 0) {
      filteredTasks = filteredTasks.filter(t => 
        filters.labels!.some(label => t.labels.includes(label))
      );
    }

    // Sort by ID (newest first)
    return filteredTasks.sort((a, b) => {
      const aNum = parseInt(a.id);
      const bNum = parseInt(b.id);
      return bNum - aNum;
    });
  }

  async getTask(id: string): Promise<MarkdownTask | null> {
    // Try tasks directory first
    const taskFile = await this.findTaskFile(id, 'tasks');
    if (taskFile) {
      return await this.loadTaskFromFile(taskFile);
    }

    // Try drafts directory
    const draftFile = await this.findTaskFile(id, 'drafts');
    if (draftFile) {
      return await this.loadTaskFromFile(draftFile);
    }

    // Try completed directory
    const completedFile = await this.findTaskFile(id, 'completed');
    if (completedFile) {
      return await this.loadTaskFromFile(completedFile);
    }

    return null;
  }

  async updateTask(id: string, updates: Partial<MarkdownTask>): Promise<MarkdownTask | null> {
    const task = await this.getTask(id);
    if (!task) {
      throw new Error(`Task ${id} not found`);
    }

    // Apply updates
    const updatedTask = {
      ...task,
      ...updates,
      id: task.id, // Preserve ID
      updatedAt: new Date().toISOString()
    };

    // Handle status change (move between directories if needed)
    if (updates.status && updates.status !== task.status) {
      await this.moveTaskToStatusDirectory(updatedTask);
    }

    // Update markdown content
    const markdownContent = this.generateMarkdownContent(updatedTask);
    await fs.writeFile(updatedTask.filePath, markdownContent);

    // Auto-commit if enabled
    if (this.config.autoCommit) {
      await this.commitChanges(`Update task-${id}: ${updatedTask.title}`);
    }

    this.emit('taskUpdated', updatedTask, task);
    logger.info('Task updated', { id, changes: Object.keys(updates) });

    return updatedTask;
  }

  async archiveTask(id: string): Promise<boolean> {
    const task = await this.getTask(id);
    if (!task) {
      return false;
    }

    // Move to completed directory
    const completedDir = path.join(this.backlogDir, 'completed');
    const fileName = path.basename(task.filePath);
    const newPath = path.join(completedDir, fileName);

    await fs.rename(task.filePath, newPath);

    // Auto-commit if enabled
    if (this.config.autoCommit) {
      await this.commitChanges(`Archive task-${id}: ${task.title}`);
    }

    this.emit('taskArchived', task);
    logger.info('Task archived', { id, title: task.title });

    return true;
  }

  async generateKanbanBoard(): Promise<string> {
    const tasks = await this.listTasks();
    
    let board = '# 📊 Critical Claude Project Status\n\n';
    board += `Generated on: ${new Date().toLocaleString()}\n\n`;

    // Group tasks by status
    const tasksByStatus: Record<string, MarkdownTask[]> = {};
    for (const status of this.config.statuses) {
      tasksByStatus[status] = tasks.filter(t => t.status === status);
    }

    // Create columns
    const columns = this.config.statuses.map(status => {
      const statusTasks = tasksByStatus[status] || [];
      let column = `## ${status}\n\n`;
      
      if (statusTasks.length === 0) {
        column += '*No tasks*\n\n';
      } else {
        for (const task of statusTasks) {
          const assigneeText = task.assignee ? ` (${task.assignee})` : '';
          const labelsText = task.labels.length > 0 ? ` [${task.labels.join(', ')}]` : '';
          const priorityIcon = this.getPriorityIcon(task.priority);
          
          column += `${priorityIcon} **task-${task.id}** - ${task.title}${assigneeText}${labelsText}\n`;
          if (task.description) {
            column += `   ${task.description}\n`;
          }
          column += '\n';
        }
      }
      
      return column;
    }).join('');

    return board + columns;
  }

  private generateTaskId(): string {
    const id = this.nextId.toString();
    this.nextId++;
    
    if (this.config.zeroPaddedIds) {
      return id.padStart(3, '0');
    }
    
    return id;
  }

  private sanitizeFileName(title: string): string {
    return title
      .replace(/[^a-zA-Z0-9\s-]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 50);
  }

  private generateMarkdownContent(task: MarkdownTask): string {
    let content = `# ${task.title}\n\n`;
    
    // Metadata section
    content += '## Metadata\n\n';
    content += `- **ID**: task-${task.id}\n`;
    content += `- **Status**: ${task.status}\n`;
    if (task.priority) content += `- **Priority**: ${task.priority}\n`;
    if (task.assignee) content += `- **Assignee**: ${task.assignee}\n`;
    if (task.labels.length > 0) content += `- **Labels**: ${task.labels.join(', ')}\n`;
    if (task.parent) content += `- **Parent**: task-${task.parent}\n`;
    if (task.dependencies.length > 0) content += `- **Dependencies**: ${task.dependencies.map(d => `task-${d}`).join(', ')}\n`;
    content += `- **Created**: ${task.createdAt}\n`;
    content += `- **Updated**: ${task.updatedAt}\n`;
    if (task.dueDate) content += `- **Due Date**: ${task.dueDate}\n`;
    if (task.estimatedHours) content += `- **Estimated Hours**: ${task.estimatedHours}\n`;
    if (task.actualHours) content += `- **Actual Hours**: ${task.actualHours}\n`;
    content += '\n';

    // Description
    if (task.description) {
      content += '## Description\n\n';
      content += `${task.description}\n\n`;
    }

    // Plan
    if (task.plan) {
      content += '## Plan\n\n';
      content += `${task.plan}\n\n`;
    }

    // Acceptance Criteria
    if (task.acceptanceCriteria.length > 0) {
      content += '## Acceptance Criteria\n\n';
      for (const criterion of task.acceptanceCriteria) {
        content += `- [ ] ${criterion}\n`;
      }
      content += '\n';
    }

    // Notes
    if (task.notes) {
      content += '## Notes\n\n';
      content += `${task.notes}\n\n`;
    }

    return content;
  }

  private async loadTaskFromFile(filePath: string): Promise<MarkdownTask | null> {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      return this.parseMarkdownTask(content, filePath);
    } catch (error) {
      logger.warn('Failed to load task file', { filePath, error: (error as Error).message });
      return null;
    }
  }

  private parseMarkdownTask(content: string, filePath: string): MarkdownTask | null {
    try {
      const lines = content.split('\n');
      
      // Extract title from first heading
      const titleMatch = lines.find(line => line.startsWith('# '));
      const title = titleMatch ? titleMatch.substring(2).trim() : 'Untitled';

      // Extract metadata
      const metadataStart = lines.findIndex(line => line.includes('## Metadata'));
      const metadataEnd = lines.findIndex((line, i) => i > metadataStart && line.startsWith('## ') && !line.includes('Metadata'));
      
      const metadata: any = {};
      if (metadataStart !== -1) {
        const metadataLines = lines.slice(metadataStart + 1, metadataEnd === -1 ? undefined : metadataEnd);
        
        for (const line of metadataLines) {
          const match = line.match(/- \*\*(.+?)\*\*: (.+)/);
          if (match) {
            const [, key, value] = match;
            metadata[key.toLowerCase().replace(' ', '')] = value;
          }
        }
      }

      // Extract ID from metadata or filename
      const idFromMetadata = metadata.id?.replace('task-', '');
      const idFromFilename = path.basename(filePath).match(/task-(\d+)/)?.[1];
      const id = idFromMetadata || idFromFilename || '0';

      // Parse other sections
      const description = this.extractSection(lines, '## Description');
      const plan = this.extractSection(lines, '## Plan');
      const notes = this.extractSection(lines, '## Notes');
      const acceptanceCriteria = this.extractAcceptanceCriteria(lines);

      const task: MarkdownTask = {
        id,
        title,
        description,
        status: (metadata.status || 'To Do') as any,
        priority: metadata.priority as any,
        assignee: metadata.assignee,
        labels: metadata.labels ? metadata.labels.split(', ') : [],
        parent: metadata.parent?.replace('task-', ''),
        dependencies: metadata.dependencies ? 
          metadata.dependencies.split(', ').map((d: string) => d.replace('task-', '')) : [],
        plan,
        acceptanceCriteria,
        notes,
        createdAt: metadata.created || new Date().toISOString(),
        updatedAt: metadata.updated || new Date().toISOString(),
        dueDate: metadata.duedate,
        estimatedHours: metadata.estimatedhours ? parseInt(metadata.estimatedhours) : undefined,
        actualHours: metadata.actualhours ? parseInt(metadata.actualhours) : undefined,
        filePath
      };

      return task;
    } catch (error) {
      logger.error('Failed to parse markdown task', { filePath, error: (error as Error).message });
      return null;
    }
  }

  private extractSection(lines: string[], heading: string): string | undefined {
    const startIndex = lines.findIndex(line => line.trim() === heading);
    if (startIndex === -1) return undefined;

    const endIndex = lines.findIndex((line, i) => i > startIndex && line.startsWith('## '));
    const sectionLines = lines.slice(startIndex + 1, endIndex === -1 ? undefined : endIndex);
    
    return sectionLines.join('\n').trim() || undefined;
  }

  private extractAcceptanceCriteria(lines: string[]): string[] {
    const startIndex = lines.findIndex(line => line.trim() === '## Acceptance Criteria');
    if (startIndex === -1) return [];

    const endIndex = lines.findIndex((line, i) => i > startIndex && line.startsWith('## '));
    const sectionLines = lines.slice(startIndex + 1, endIndex === -1 ? undefined : endIndex);
    
    return sectionLines
      .filter(line => line.trim().startsWith('- [ ]') || line.trim().startsWith('- [x]'))
      .map(line => line.replace(/- \[[ x]\] /, '').trim());
  }

  private async findTaskFile(id: string, subDir: string): Promise<string | null> {
    try {
      const dir = path.join(this.backlogDir, subDir);
      const files = await fs.readdir(dir);
      const taskFile = files.find(f => f.startsWith(`task-${id} - `) && f.endsWith('.md'));
      return taskFile ? path.join(dir, taskFile) : null;
    } catch {
      return null;
    }
  }

  private async moveTaskToStatusDirectory(task: MarkdownTask): Promise<void> {
    // For now, all active tasks stay in the tasks directory
    // Only "Done" tasks might move to completed in the future
    const newContent = this.generateMarkdownContent(task);
    await fs.writeFile(task.filePath, newContent);
  }

  private getPriorityIcon(priority?: string): string {
    switch (priority) {
      case 'critical': return '🔴';
      case 'high': return '🟠';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  }

  private async loadNextId(): Promise<void> {
    try {
      const tasks = await this.listTasks({ includeDrafts: true });
      if (tasks.length === 0) {
        this.nextId = 1;
        return;
      }

      const maxId = Math.max(...tasks.map(t => parseInt(t.id)));
      this.nextId = maxId + 1;
    } catch {
      this.nextId = 1;
    }
  }

  private async createConfigFile(configPath: string): Promise<void> {
    const configContent = `# Critical Claude Task Management Configuration

# Default status for new tasks
default_status: "To Do"

# Available statuses (columns in Kanban board)
statuses:
  - "To Do"
  - "In Progress" 
  - "Done"
  - "Blocked"

# Default assignee for new tasks (optional)
# default_assignee: "@username"

# Automatically commit task changes to git
auto_commit: false

# Date format for timestamps
date_format: "yyyy-mm-dd"

# Default editor for opening tasks
default_editor: "${this.config.defaultEditor}"

# Use zero-padded IDs (001, 002, etc.)
zero_padded_ids: false
`;

    await fs.writeFile(configPath, configContent);
  }

  private async commitChanges(message: string): Promise<void> {
    try {
      await execAsync('git add .', { cwd: this.projectRoot });
      await execAsync(`git commit -m "${message}"`, { cwd: this.projectRoot });
      logger.info('Changes committed to git', { message });
    } catch (error) {
      logger.warn('Failed to commit changes', { error: (error as Error).message });
    }
  }
}
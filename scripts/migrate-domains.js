#!/usr/bin/env node

/**
 * Domain Migration Script
 * Moves existing code into DDD structure and updates imports
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.dirname(__dirname);

// File mapping for DDD migration
const MIGRATION_MAP = {
  // Task Management Domain
  'task-management': {
    'domain/entities/Task.ts': 'packages/critical-claude/src/types/common-task.ts',
    'domain/repositories/ITaskRepository.ts': 'packages/critical-claude/src/viewer/domain/repositories/ITaskRepository.ts',
    'domain/services/TaskDomainService.ts': 'packages/critical-claude/src/core/unified-storage.ts', // Extract domain logic
    'application/use-cases/CreateTaskUseCase.ts': 'packages/critical-claude/src/commands/unified-task.ts', // Extract use case
    'application/use-cases/UpdateTaskUseCase.ts': 'packages/critical-claude/src/viewer/application/use-cases/UpdateTaskUseCase.ts',
    'application/use-cases/ViewTasksUseCase.ts': 'packages/critical-claude/src/viewer/application/use-cases/ViewTasksUseCase.ts',
    'infrastructure/TaskRepositoryAdapter.ts': 'packages/critical-claude/src/viewer/infrastructure/data-access/TaskRepositoryAdapter.ts'
  },

  // Project Management Domain
  'project-management': {
    'domain/entities/Project.ts': 'NEW', // Extract from unified-storage
    'domain/services/ProjectDomainService.ts': 'NEW', // Extract project logic
    'application/use-cases/SwitchProjectUseCase.ts': 'NEW',
    'application/use-cases/DetectProjectUseCase.ts': 'NEW'
  },

  // Research Intelligence Domain
  'research-intelligence': {
    'domain/entities/ResearchSession.ts': 'packages/critical-claude/src/types/research.ts',
    'domain/entities/ResearchPlan.ts': 'packages/critical-claude/src/types/research.ts',
    'domain/services/ResearchDomainService.ts': 'packages/critical-claude/src/services/research-service.ts',
    'application/use-cases/StartResearchUseCase.ts': 'packages/critical-claude/src/commands/research.ts'
  },

  // Template System Domain
  'template-system': {
    'domain/entities/Template.ts': 'NEW',
    'domain/services/TemplateDomainService.ts': 'packages/critical-claude/src/commands/template.ts',
    'application/use-cases/LoadTemplateUseCase.ts': 'packages/critical-claude/src/commands/template.ts'
  },

  // Integration Layer Domain
  'integration-layer': {
    'domain/services/MCPService.ts': 'packages/critical-claude/src/mcp-server.ts',
    'domain/services/AIService.ts': 'packages/critical-claude/src/core/ai-service.ts',
    'application/use-cases/SyncWithClaudeUseCase.ts': 'NEW'
  },

  // User Interface Domain
  'user-interface': {
    'cli/CLIApplication.ts': 'packages/critical-claude/src/cli/cc-main.ts',
    'web/WebApplication.ts': 'packages/critical-claude-web/server/index.js',
    'viewer/TerminalViewerApplication.ts': 'packages/critical-claude/src/viewer/index.ts'
  }
};

async function migrateDomains() {
  console.log('🚚 Starting domain migration...\n');

  try {
    // 1. Create domain structures
    await createDomainStructures();
    
    // 2. Extract and migrate domain entities
    await extractDomainEntities();
    
    // 3. Extract use cases
    await extractUseCases();
    
    // 4. Create domain services
    await createDomainServices();
    
    // 5. Update import statements
    await updateImportStatements();
    
    console.log('✅ Domain migration complete!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

async function createDomainStructures() {
  console.log('📁 Creating domain directory structures...');
  
  for (const [domain, files] of Object.entries(MIGRATION_MAP)) {
    const domainPath = path.join(rootDir, 'domains', domain);
    
    // Create standard DDD structure
    const dirs = [
      'src/domain/entities',
      'src/domain/value-objects', 
      'src/domain/services',
      'src/domain/repositories',
      'src/application/use-cases',
      'src/application/services',
      'src/infrastructure',
      'tests/unit',
      'tests/integration'
    ];
    
    for (const dir of dirs) {
      await fs.mkdir(path.join(domainPath, dir), { recursive: true });
    }
    
    // Create domain index file
    const indexContent = `
/**
 * ${domain.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} Domain
 * ${getDomainDescription(domain)}
 */

// Domain Entities
export * from './src/domain/entities/index.js';

// Domain Services  
export * from './src/domain/services/index.js';

// Use Cases
export * from './src/application/use-cases/index.js';

// Infrastructure
export * from './src/infrastructure/index.js';
`;

    await fs.writeFile(path.join(domainPath, 'index.ts'), indexContent);
    
    console.log(`  ✓ Created structure for ${domain}`);
  }
}

async function extractDomainEntities() {
  console.log('🏗️  Extracting domain entities...');
  
  // Task Entity
  const taskEntity = `
/**
 * Task Domain Entity
 * Core business entity representing a task in the system
 */

import { DomainEvent } from '@critical-claude/shared-kernel';

export interface TaskId {
  readonly value: string;
}

export interface TaskPriority {
  readonly level: 'critical' | 'high' | 'medium' | 'low';
}

export interface TaskStatus {
  readonly value: 'todo' | 'in_progress' | 'done' | 'blocked' | 'archived';
}

export class Task {
  constructor(
    public readonly id: TaskId,
    public readonly title: string,
    public readonly description: string,
    public readonly status: TaskStatus,
    public readonly priority: TaskPriority,
    public readonly labels: readonly string[],
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly assignee?: string,
    public readonly estimatedHours?: number,
    public readonly dependencies: readonly TaskId[] = [],
    public readonly draft: boolean = false
  ) {}

  // Domain methods
  updateStatus(newStatus: TaskStatus): Task {
    const updatedTask = new Task(
      this.id,
      this.title,
      this.description,
      newStatus,
      this.priority,
      this.labels,
      this.createdAt,
      new Date(),
      this.assignee,
      this.estimatedHours,
      this.dependencies,
      this.draft
    );

    // Emit domain event
    DomainEvent.create('TaskStatusUpdated', {
      taskId: this.id.value,
      oldStatus: this.status.value,
      newStatus: newStatus.value
    });

    return updatedTask;
  }

  addLabel(label: string): Task {
    if (this.labels.includes(label)) {
      return this;
    }

    return new Task(
      this.id,
      this.title,
      this.description,
      this.status,
      this.priority,
      [...this.labels, label],
      this.createdAt,
      new Date(),
      this.assignee,
      this.estimatedHours,
      this.dependencies,
      this.draft
    );
  }

  assignTo(assignee: string): Task {
    return new Task(
      this.id,
      this.title,
      this.description,
      this.status,
      this.priority,
      this.labels,
      this.createdAt,
      new Date(),
      assignee,
      this.estimatedHours,
      this.dependencies,
      this.draft
    );
  }

  // Business rules
  canBeAssigned(): boolean {
    return this.status.value !== 'done' && this.status.value !== 'archived';
  }

  isBlocked(): boolean {
    return this.status.value === 'blocked';
  }

  isComplete(): boolean {
    return this.status.value === 'done';
  }
}

// Factory functions
export const TaskId = {
  create: (value: string): TaskId => ({ value }),
  generate: (): TaskId => ({ 
    value: \`task-\${Date.now()}-\${Math.random().toString(36).substr(2, 9)}\`
  })
};

export const TaskStatus = {
  TODO: { value: 'todo' as const },
  IN_PROGRESS: { value: 'in_progress' as const },
  DONE: { value: 'done' as const },
  BLOCKED: { value: 'blocked' as const },
  ARCHIVED: { value: 'archived' as const }
};

export const TaskPriority = {
  CRITICAL: { level: 'critical' as const },
  HIGH: { level: 'high' as const },
  MEDIUM: { level: 'medium' as const },
  LOW: { level: 'low' as const }
};
`;

  await fs.writeFile(
    path.join(rootDir, 'domains', 'task-management', 'src', 'domain', 'entities', 'Task.ts'),
    taskEntity
  );

  console.log('  ✓ Created Task entity');
}

async function extractUseCases() {
  console.log('🎯 Extracting use cases...');
  
  // Create Task Use Case
  const createTaskUseCase = `
/**
 * Create Task Use Case
 * Application service for creating new tasks
 */

import { Task, TaskId, TaskStatus, TaskPriority } from '../../../domain/entities/Task.js';
import { ITaskRepository } from '../../../domain/repositories/ITaskRepository.js';
import { DomainEvent } from '@critical-claude/shared-kernel';

export interface CreateTaskRequest {
  title: string;
  description?: string;
  priority?: 'critical' | 'high' | 'medium' | 'low';
  assignee?: string;
  labels?: string[];
  estimatedHours?: number;
  draft?: boolean;
}

export interface CreateTaskResponse {
  success: boolean;
  task?: Task;
  error?: string;
}

export class CreateTaskUseCase {
  constructor(
    private readonly taskRepository: ITaskRepository
  ) {}

  async execute(request: CreateTaskRequest): Promise<CreateTaskResponse> {
    try {
      // Validate business rules
      if (!request.title?.trim()) {
        return {
          success: false,
          error: 'Task title is required'
        };
      }

      // Create task entity
      const task = new Task(
        TaskId.generate(),
        request.title.trim(),
        request.description || '',
        TaskStatus.TODO,
        this.mapPriority(request.priority),
        request.labels || [],
        new Date(),
        new Date(),
        request.assignee,
        request.estimatedHours,
        [],
        request.draft || false
      );

      // Persist via repository
      await this.taskRepository.save(task);

      // Emit domain event
      DomainEvent.create('TaskCreated', {
        taskId: task.id.value,
        title: task.title,
        priority: task.priority.level
      });

      return {
        success: true,
        task
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private mapPriority(priority?: string): TaskPriority {
    switch (priority) {
      case 'critical': return TaskPriority.CRITICAL;
      case 'high': return TaskPriority.HIGH;
      case 'medium': return TaskPriority.MEDIUM;
      case 'low': return TaskPriority.LOW;
      default: return TaskPriority.MEDIUM;
    }
  }
}
`;

  await fs.writeFile(
    path.join(rootDir, 'domains', 'task-management', 'src', 'application', 'use-cases', 'CreateTaskUseCase.ts'),
    createTaskUseCase
  );

  console.log('  ✓ Created CreateTaskUseCase');
}

async function createDomainServices() {
  console.log('🏢 Creating domain services...');
  
  // Task Domain Service
  const taskDomainService = `
/**
 * Task Domain Service
 * Encapsulates complex business logic that doesn't belong to a single entity
 */

import { Task, TaskId } from '../entities/Task.js';
import { ITaskRepository } from '../repositories/ITaskRepository.js';

export class TaskDomainService {
  constructor(
    private readonly taskRepository: ITaskRepository
  ) {}

  async calculateTaskDependencies(task: Task): Promise<Task[]> {
    const dependencies: Task[] = [];
    
    for (const depId of task.dependencies) {
      const dependency = await this.taskRepository.findById(depId);
      if (dependency) {
        dependencies.push(dependency);
      }
    }
    
    return dependencies;
  }

  async canCompleteTask(taskId: TaskId): Promise<boolean> {
    const task = await this.taskRepository.findById(taskId);
    if (!task) return false;

    // Check if all dependencies are complete
    const dependencies = await this.calculateTaskDependencies(task);
    return dependencies.every(dep => dep.isComplete());
  }

  async estimateTaskComplexity(task: Task): Promise<number> {
    // Business logic for complexity estimation
    let complexity = 1;
    
    // Factor in dependencies
    complexity += task.dependencies.length * 0.5;
    
    // Factor in estimated hours
    if (task.estimatedHours) {
      complexity += Math.log(task.estimatedHours);
    }
    
    // Factor in labels (certain labels indicate complexity)
    const complexLabels = ['backend', 'database', 'integration', 'security'];
    complexity += task.labels.filter(label => 
      complexLabels.includes(label.toLowerCase())
    ).length * 0.3;
    
    return Math.min(complexity, 10); // Cap at 10
  }

  async suggestRelatedTasks(task: Task): Promise<Task[]> {
    // Find tasks with similar labels or assignee
    const allTasks = await this.taskRepository.findAll();
    
    return allTasks.filter(t => 
      t.id.value !== task.id.value &&
      (
        t.assignee === task.assignee ||
        task.labels.some(label => t.labels.includes(label))
      )
    );
  }
}
`;

  await fs.writeFile(
    path.join(rootDir, 'domains', 'task-management', 'src', 'domain', 'services', 'TaskDomainService.ts'),
    taskDomainService
  );

  console.log('  ✓ Created TaskDomainService');
}

async function updateImportStatements() {
  console.log('🔗 Updating import statements...');
  
  // This is a placeholder - the actual implementation would:
  // 1. Scan all TypeScript files
  // 2. Replace old import paths with new DDD paths
  // 3. Update package.json dependencies
  // 4. Generate barrel exports
  
  console.log('  ⚠️  Import update logic to be implemented in next phase');
}

function getDomainDescription(domain) {
  const descriptions = {
    'task-management': 'Core task operations, CRUD, business rules and task lifecycle management',
    'project-management': 'Project isolation, workspace switching, and project-specific storage',
    'research-intelligence': 'Multi-agent research system with AI-powered analysis and knowledge extraction',
    'template-system': 'Task templates, code generation, and project scaffolding',
    'integration-layer': 'External integrations including MCP, Claude Desktop, and AI services',
    'user-interface': 'All user interaction layers: CLI, Web UI, and terminal interfaces'
  };
  
  return descriptions[domain] || 'Domain description not available';
}

// Execute migration
if (import.meta.url === `file://${__filename}`) {
  migrateDomains();
}

export { migrateDomains, MIGRATION_MAP };
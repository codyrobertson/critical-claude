import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SimplifiedCLI } from '../../src/cli/SimplifiedCLI.js';

// Mock all external dependencies
vi.mock('fs/promises');
vi.mock('commander', () => ({
  Command: vi.fn().mockImplementation(() => ({
    name: vi.fn().mockReturnThis(),
    description: vi.fn().mockReturnThis(),
    version: vi.fn().mockReturnThis(),
    command: vi.fn().mockReturnThis(),
    argument: vi.fn().mockReturnThis(),
    option: vi.fn().mockReturnThis(),
    alias: vi.fn().mockReturnThis(),
    action: vi.fn().mockReturnThis(),
    parseAsync: vi.fn().mockResolvedValue(undefined)
  }))
}));

vi.mock('../../src/storage/FileStorage.js', () => ({
  FileStorage: vi.fn().mockImplementation(() => ({
    save: vi.fn().mockResolvedValue(undefined),
    findById: vi.fn().mockResolvedValue(null),
    findAll: vi.fn().mockResolvedValue([]),
    delete: vi.fn().mockResolvedValue(false),
    ensureDirectory: vi.fn().mockResolvedValue(undefined)
  }))
}));

// Mock Logger
vi.mock('../../src/utils/Logger.js', () => ({
  logger: {
    operation: vi.fn(),
    performance: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    silentError: vi.fn(),
    setLevel: vi.fn(),
    getLevel: vi.fn().mockReturnValue('info')
  }
}));

// Mock ConfigValidator
vi.mock('../../src/config/ConfigValidator.js', () => ({
  ConfigValidator: {
    loadAndValidate: vi.fn().mockResolvedValue({
      valid: true,
      errors: [],
      warnings: [],
      config: {
        storagePath: '/mock-storage',
        logLevel: 'info',
        analytics: { enabled: true, retentionDays: 30 },
        templates: { customPath: '/mock-templates' },
        viewer: { theme: 'dark', pageSize: 20 }
      }
    })
  }
}));

describe('SimplifiedCLI Integration', () => {
  let cli: SimplifiedCLI;
  let consoleLogSpy: any;
  let consoleErrorSpy: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    cli = new SimplifiedCLI();
    
    // Initialize services as they're now initialized in initializeServices()
    try {
      await (cli as any).initializeServices();
    } catch (error) {
      // Services might fail to initialize in test environment, that's OK
      // We'll mock them individually for the tests that need them
    }
    
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('CLI initialization', () => {
    it('should initialize CLI instance', () => {
      expect(cli).toBeDefined();
      expect(cli).toBeInstanceOf(SimplifiedCLI);
    });

    it('should handle initialization process', async () => {
      // Test that CLI can be created and doesn't throw
      const testCli = new SimplifiedCLI();
      expect(testCli).toBeDefined();
    });
  });

  describe('Task commands', () => {
    it('should handle task create command', async () => {
      // Set up mock service
      const mockTaskService = {
        createTask: vi.fn().mockResolvedValue({
          success: true,
          data: {
            id: 'test-task-id',
            title: 'Test Task',
            status: 'todo',
            priority: 'medium',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        })
      };
      
      (cli as any).taskService = mockTaskService;

      await cli['handleTaskCommand']('create', [], { title: 'Test Task' });

      expect(mockTaskService.createTask).toHaveBeenCalledWith({
        title: 'Test Task',
        description: undefined,
        priority: undefined,
        status: undefined,
        assignee: undefined,
        labels: undefined,
        estimatedHours: undefined
      });

      expect(consoleLogSpy).toHaveBeenCalledWith('✅ Task created: Test Task');
    });

    it('should handle task list command', async () => {
      const mockTasks = [
        { 
          id: 'task-1', 
          title: 'Task 1', 
          description: 'Description 1', 
          status: 'todo', 
          priority: 'medium',
          labels: [],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        { 
          id: 'task-2', 
          title: 'Task 2', 
          description: 'Description 2', 
          status: 'done', 
          priority: 'high',
          labels: ['urgent'],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const mockTaskService = {
        listTasks: vi.fn().mockResolvedValue({
          success: true,
          data: mockTasks
        })
      };
      
      (cli as any).taskService = mockTaskService;

      await cli['handleTaskCommand']('list', [], {});

      expect(mockTaskService.listTasks).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith('📋 Found 2 tasks:\n');
    });

    it('should handle task view command', async () => {
      const mockTask = {
        id: 'task-1',
        title: 'Test Task',
        description: 'Task description',
        status: 'todo',
        priority: 'medium',
        labels: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (cli as any).taskService.viewTask = vi.fn().mockResolvedValue({
        success: true,
        data: mockTask
      });

      await cli['handleTaskCommand']('view', ['task-1'], {});

      expect((cli as any).taskService.viewTask).toHaveBeenCalledWith('task-1');
      expect(consoleLogSpy).toHaveBeenCalledWith('📋 Task: Test Task\n');
    });

    it('should handle task update command', async () => {
      const mockUpdatedTask = {
        id: 'task-1',
        title: 'Updated Task',
        status: 'in_progress',
        priority: 'high',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (cli as any).taskService.updateTask = vi.fn().mockResolvedValue({
        success: true,
        data: mockUpdatedTask
      });

      await cli['handleTaskCommand']('update', ['task-1'], {
        title: 'Updated Task',
        status: 'in_progress',
        priority: 'high'
      });

      expect((cli as any).taskService.updateTask).toHaveBeenCalledWith('task-1', {
        title: 'Updated Task',
        description: undefined,
        priority: 'high',
        status: 'in_progress',
        assignee: undefined,
        labels: undefined,
        estimatedHours: undefined
      });

      expect(consoleLogSpy).toHaveBeenCalledWith('✅ Task updated: Updated Task');
    });

    it('should handle task delete command', async () => {
      (cli as any).taskService.deleteTask = vi.fn().mockResolvedValue({
        success: true
      });

      await cli['handleTaskCommand']('delete', ['task-1'], {});

      expect((cli as any).taskService.deleteTask).toHaveBeenCalledWith('task-1');
      expect(consoleLogSpy).toHaveBeenCalledWith('✅ Task deleted');
    });
  });

  describe('Template commands', () => {
    it('should handle template list command', async () => {
      const mockTemplates = [
        {
          id: 'basic-project',
          name: 'basic-project',
          description: 'Basic project template',
          tasks: [],
          variables: {},
          metadata: { author: 'System', tags: [], version: '1.0.0', createdAt: new Date(), updatedAt: new Date() }
        }
      ];

      (cli as any).templateService.listTemplates = vi.fn().mockResolvedValue({
        success: true,
        data: mockTemplates
      });

      await cli['handleTemplateCommand']('list', [], {});

      expect((cli as any).templateService.listTemplates).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith('📋 Available templates (1):\n');
    });

    it('should handle template apply command', async () => {
      const mockTasks = [
        { id: 'task-1', title: 'Generated Task 1' },
        { id: 'task-2', title: 'Generated Task 2' }
      ];

      (cli as any).templateService.applyTemplate = vi.fn().mockResolvedValue({
        success: true,
        data: mockTasks,
        templateName: 'basic-project',
        tasksCreated: 2
      });

      await cli['handleTemplateCommand']('apply', ['basic-project'], {
        variables: ['project_name=Test Project']
      });

      expect((cli as any).templateService.applyTemplate).toHaveBeenCalledWith({
        templateName: 'basic-project',
        variables: { project_name: 'Test Project' }
      });

      expect(consoleLogSpy).toHaveBeenCalledWith('✅ Applied template: basic-project');
      expect(consoleLogSpy).toHaveBeenCalledWith('   Tasks created: 2');
    });

    it('should handle template view command', async () => {
      const mockTemplate = {
        id: 'basic-project',
        name: 'basic-project',
        description: 'Basic project template',
        tasks: [{ title: 'Task 1', description: 'Description 1' }],
        variables: { project_name: 'Default Project' },
        metadata: { author: 'System', tags: ['project'], version: '1.0.0', createdAt: new Date(), updatedAt: new Date() }
      };

      (cli as any).templateService.viewTemplate = vi.fn().mockResolvedValue({
        success: true,
        data: mockTemplate,
        taskCount: 1
      });

      await cli['handleTemplateCommand']('view', ['basic-project'], {});

      expect((cli as any).templateService.viewTemplate).toHaveBeenCalledWith({ nameOrId: 'basic-project' });
      expect(consoleLogSpy).toHaveBeenCalledWith('📋 Template: basic-project\n');
    });
  });


  describe('Error handling', () => {
    it('should handle service errors in task commands', async () => {
      (cli as any).taskService.createTask = vi.fn().mockResolvedValue({
        success: false,
        error: 'Task title is required'
      });

      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });

      await expect(
        cli['handleTaskCommand']('create', [], { title: '' })
      ).rejects.toThrow('process.exit called');

      expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Task title is required');
      expect(processExitSpy).toHaveBeenCalledWith(1);

      processExitSpy.mockRestore();
    });

    it('should handle unknown task actions', async () => {
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });

      await expect(
        cli['handleTaskCommand']('unknown', [], {})
      ).rejects.toThrow('process.exit called');

      expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Unknown action: unknown');

      processExitSpy.mockRestore();
    });
  });
});
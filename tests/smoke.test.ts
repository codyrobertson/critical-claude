import { describe, it, expect, vi } from 'vitest';

// Basic smoke tests to verify the build system and imports work
describe('Smoke Tests', () => {
  it('should import core modules without errors', async () => {
    // Mock external dependencies
    vi.mock('fs/promises');
    vi.mock('os', () => ({ homedir: () => '/mock-home' }));
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

    // Test that all core modules can be imported
    const { FileStorage } = await import('../src/storage/FileStorage.js');
    const { TaskService } = await import('../src/services/TaskService.js');
    const { TemplateService } = await import('../src/services/TemplateService.js');
    const { AnalyticsService } = await import('../src/services/AnalyticsService.js');
    const { ResearchService } = await import('../src/services/ResearchService.js');
    const { ViewerService } = await import('../src/services/ViewerService.js');
    const { SimplifiedCLI } = await import('../src/cli/SimplifiedCLI.js');

    expect(FileStorage).toBeDefined();
    expect(TaskService).toBeDefined();
    expect(TemplateService).toBeDefined();
    expect(AnalyticsService).toBeDefined();
    expect(ResearchService).toBeDefined();
    expect(ViewerService).toBeDefined();
    expect(SimplifiedCLI).toBeDefined();
  });

  it('should create instances without errors', async () => {
    // Mock dependencies
    vi.mock('fs/promises');
    vi.mock('os', () => ({ homedir: () => '/mock-home' }));
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

    const { FileStorage } = await import('../src/storage/FileStorage.js');
    const { TaskService } = await import('../src/services/TaskService.js');
    const { TemplateService } = await import('../src/services/TemplateService.js');
    const { SimplifiedCLI } = await import('../src/cli/SimplifiedCLI.js');

    expect(() => new FileStorage()).not.toThrow();
    expect(() => new TaskService()).not.toThrow();
    expect(() => new TemplateService()).not.toThrow();
    expect(() => new SimplifiedCLI()).not.toThrow();
  });

  it('should have correct TypeScript types', async () => {
    vi.mock('fs/promises');
    vi.mock('os', () => ({ homedir: () => '/mock-home' }));

    const { Task, Priority, TaskStatus } = await import('../src/models/Task.js');
    const { Template } = await import('../src/models/Template.js');
    const { AnalyticsEvent } = await import('../src/models/Analytics.js');

    // Type tests - these will fail at compile time if types are wrong
    const task: Task = {
      id: 'test',
      title: 'Test Task',
      description: 'Description',
      status: 'todo' as TaskStatus,
      priority: 'medium' as Priority,
      labels: ['test'],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const template: Template = {
      id: 'test-template',
      name: 'test',
      description: 'Test template',
      tasks: [],
      variables: {},
      metadata: {
        author: 'Test',
        tags: [],
        version: '1.0.0',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    };

    const event: AnalyticsEvent = {
      id: 'test-event',
      command: 'test',
      action: 'test',
      success: true,
      executionTime: 100,
      timestamp: new Date()
    };

    expect(task.id).toBe('test');
    expect(template.name).toBe('test');
    expect(event.success).toBe(true);
  });
});
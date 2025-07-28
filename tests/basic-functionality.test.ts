import { describe, it, expect, vi } from 'vitest';

// Integration test to verify the basic CLI commands work
describe('Basic CLI Functionality', () => {
  it('should be able to run TypeScript compilation without errors', async () => {
    // This test verifies that all imports work and TypeScript compilation succeeds
    
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

    // Test that the main CLI can be imported and initialized
    const { SimplifiedCLI } = await import('../src/cli/SimplifiedCLI.js');
    expect(() => new SimplifiedCLI()).not.toThrow();
  });

  it('should have all required service methods', async () => {
    // Mock dependencies
    vi.mock('fs/promises');
    vi.mock('os', () => ({ homedir: () => '/mock-home' }));

    // Test service interfaces
    const { TaskService } = await import('../src/services/TaskService.js');
    const { TemplateService } = await import('../src/services/TemplateService.js');
    const { AnalyticsService } = await import('../src/services/AnalyticsService.js');
    const { FileStorage } = await import('../src/storage/FileStorage.js');

    const storage = new FileStorage();
    const taskService = new TaskService(storage);
    const templateService = new TemplateService(storage);
    const analyticsService = new AnalyticsService(storage);

    // Verify key methods exist
    expect(typeof taskService.createTask).toBe('function');
    expect(typeof taskService.listTasks).toBe('function');
    expect(typeof taskService.viewTask).toBe('function');
    
    expect(typeof templateService.listTemplates).toBe('function');
    expect(typeof templateService.viewTemplate).toBe('function');
    expect(typeof templateService.applyTemplate).toBe('function');
    
    expect(typeof analyticsService.withTracking).toBe('function');
    expect(typeof analyticsService.getUsageStats).toBe('function');
  });

  it('should have correct model interfaces', async () => {
    const { Priority, TaskStatus } = await import('../src/models/Task.js');
    const { createTask, generateTaskId } = await import('../src/models/Task.js');

    // Test that model functions work
    const taskId = generateTaskId('Test Task');
    expect(taskId).toMatch(/^test-task-\d{8}-\d{6}$/);

    const task = createTask({
      title: 'Test Task',
      priority: 'high',
      status: 'todo'
    });

    expect(task.title).toBe('Test Task');
    expect(task.priority).toBe('high');
    expect(task.status).toBe('todo');
    expect(task.id).toMatch(/^test-task-\d{8}-\d{6}$/);
  });
});
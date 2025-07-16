/**
 * Test utilities and helpers
 */
import { jest } from '@jest/globals';
/**
 * Create a mock BacklogManager for testing
 */
export function createMockBacklogManager() {
    return {
        initialize: jest.fn().mockResolvedValue(undefined),
        listTasks: jest.fn().mockResolvedValue([]),
        createTask: jest.fn().mockResolvedValue(global.createMockTask()),
        updateTask: jest.fn().mockResolvedValue(global.createMockTask()),
        deleteTask: jest.fn().mockResolvedValue(undefined),
        getTask: jest.fn().mockResolvedValue(global.createMockTask()),
        searchTasks: jest.fn().mockResolvedValue([]),
        getProjectStats: jest.fn().mockResolvedValue({
            total: 0,
            byStatus: {},
            byPriority: {}
        })
    };
}
/**
 * Create mock file system operations
 */
export function mockFileSystem() {
    const fs = require('fs/promises');
    return {
        access: jest.spyOn(fs, 'access').mockResolvedValue(undefined),
        mkdir: jest.spyOn(fs, 'mkdir').mockResolvedValue(undefined),
        readdir: jest.spyOn(fs, 'readdir').mockResolvedValue([]),
        readFile: jest.spyOn(fs, 'readFile').mockResolvedValue('{}'),
        writeFile: jest.spyOn(fs, 'writeFile').mockResolvedValue(undefined),
        unlink: jest.spyOn(fs, 'unlink').mockResolvedValue(undefined)
    };
}
/**
 * Create mock child process operations
 */
export function mockChildProcess() {
    const childProcess = require('child_process');
    const mockProcess = {
        stdout: {
            on: jest.fn()
        },
        stderr: {
            on: jest.fn()
        },
        on: jest.fn()
    };
    return jest.spyOn(childProcess, 'spawn').mockReturnValue(mockProcess);
}
/**
 * Mock console methods with optional capture
 */
export function mockConsole() {
    return {
        log: jest.spyOn(console, 'log').mockImplementation(() => { }),
        error: jest.spyOn(console, 'error').mockImplementation(() => { }),
        warn: jest.spyOn(console, 'warn').mockImplementation(() => { }),
        info: jest.spyOn(console, 'info').mockImplementation(() => { }),
        clear: jest.spyOn(console, 'clear').mockImplementation(() => { })
    };
}
/**
 * Mock process.stdout for testing terminal output
 */
export function mockProcessStdout() {
    return jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
}
/**
 * Create a test task with realistic data
 */
export function createTestTask(overrides = {}) {
    return {
        id: `task-${Date.now()}`,
        title: 'Test Task Implementation',
        description: 'Implement a test feature with proper error handling',
        status: 'todo',
        priority: 'medium',
        labels: ['test', 'feature'],
        storyPoints: 5,
        assignee: 'test-user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        stateHistory: [],
        acceptanceCriteria: [],
        dependencies: [],
        notes: [],
        codeReferences: [],
        generatedBy: 'manual',
        timeTracking: {
            estimated: 0,
            actual: 0,
            remaining: 0
        },
        ...overrides
    };
}
/**
 * Create a test Claude Code todo
 */
export function createTestClaudeCodeTodo(overrides = {}) {
    return {
        id: `todo-${Date.now()}`,
        content: 'Implement user authentication @high #security 8pts',
        status: 'pending',
        priority: 'high',
        ...overrides
    };
}
/**
 * Wait for async operations to complete
 */
export function waitForAsync(ms = 0) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
/**
 * Test helper for natural language parsing
 */
export const naturalLanguageTestCases = {
    priorities: [
        { text: 'Task @critical', expected: 'critical' },
        { text: 'Task @high', expected: 'high' },
        { text: 'Task @medium', expected: 'medium' },
        { text: 'Task @low', expected: 'low' },
        { text: 'Regular task', expected: 'medium' }
    ],
    labels: [
        { text: 'Task #frontend #api', expected: ['frontend', 'api'] },
        { text: 'Task #bug-fix', expected: ['bug-fix'] },
        { text: 'Task without labels', expected: [] }
    ],
    storyPoints: [
        { text: 'Task 8pts', expected: 8 },
        { text: 'Task 13 points', expected: 13 },
        { text: 'Task with no points', expected: 0 }
    ],
    assignees: [
        { text: 'Task for:john.doe', expected: 'john.doe' },
        { text: 'Task for:@alice', expected: 'alice' },
        { text: 'Task without assignee', expected: undefined }
    ]
};
/**
 * Performance testing helper
 */
export async function measurePerformance(operation, maxDurationMs = 1000) {
    const startTime = Date.now();
    const result = await operation();
    const endTime = Date.now();
    const duration = endTime - startTime;
    return {
        result,
        duration,
        withinLimit: duration <= maxDurationMs
    };
}
/**
 * Mock environment setup for different test scenarios
 */
export function setupTestEnvironment(scenario) {
    const originalEnv = process.env.NODE_ENV;
    switch (scenario) {
        case 'development':
            process.env.NODE_ENV = 'development';
            process.env.DEBUG = 'true';
            break;
        case 'production':
            process.env.NODE_ENV = 'production';
            process.env.DEBUG = 'false';
            break;
        case 'ci':
            process.env.NODE_ENV = 'test';
            process.env.CI = 'true';
            break;
    }
    return () => {
        process.env.NODE_ENV = originalEnv;
    };
}
//# sourceMappingURL=test-utils.js.map
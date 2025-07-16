/**
 * Test setup file
 */

import { jest } from '@jest/globals';

// Global test setup
beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();
  
  // Reset environment variables
  process.env.NODE_ENV = 'test';
  
  // Mock console methods by default to reduce noise
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'info').mockImplementation(() => {});
});

afterEach(() => {
  // Restore all mocks after each test
  jest.restoreAllMocks();
});

// Extend global interface for test utilities
declare global {
  var createMockTask: (overrides?: any) => any;
  var createMockClaudeCodeTodo: (overrides?: any) => any;
  var advanceTimers: (ms: number) => void;
}

// Global test utilities
(global as any).createMockTask = (overrides = {}) => ({
  id: 'test-task-id',
  title: 'Test Task',
  description: 'Test task description',
  status: 'todo',
  priority: 'medium',
  labels: [],
  storyPoints: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides
});

(global as any).createMockClaudeCodeTodo = (overrides = {}) => ({
  id: 'test-todo-id',
  content: 'Test todo content',
  status: 'pending',
  priority: 'medium',
  ...overrides
});

// Mock timers for testing
(global as any).advanceTimers = (ms: number) => {
  jest.advanceTimersByTime(ms);
};
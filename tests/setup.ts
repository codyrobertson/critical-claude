/**
 * Jest Test Setup
 * Global test configuration and utilities
 */

import { jest } from '@jest/globals';

// Extend Jest timeout for longer operations
jest.setTimeout(30000);

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.CRITICAL_CLAUDE_HOME = '/tmp/critical-claude-test';

// Suppress console output during tests unless debugging
const originalConsole = console;
const mockConsole = {
  ...console,
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
};

// Use mock console unless VERBOSE_TESTS is set
if (!process.env.VERBOSE_TESTS) {
  global.console = mockConsole as Console;
}

// Global test utilities
global.testUtils = {
  // Reset console mocks
  resetConsoleMocks: () => {
    jest.clearAllMocks();
  },

  // Get console output
  getConsoleOutput: () => ({
    log: (mockConsole.log as jest.MockedFunction<typeof console.log>).mock.calls,
    info: (mockConsole.info as jest.MockedFunction<typeof console.info>).mock.calls,
    warn: (mockConsole.warn as jest.MockedFunction<typeof console.warn>).mock.calls,
    error: (mockConsole.error as jest.MockedFunction<typeof console.error>).mock.calls,
    debug: (mockConsole.debug as jest.MockedFunction<typeof console.debug>).mock.calls
  }),

  // Restore original console for debugging
  useRealConsole: () => {
    global.console = originalConsole;
  },

  // Sleep utility for async tests
  sleep: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),

  // Create temporary directory
  createTempDir: async () => {
    const { mkdtemp } = await import('fs/promises');
    const { join } = await import('path');
    const { tmpdir } = await import('os');
    
    return mkdtemp(join(tmpdir(), 'critical-claude-test-'));
  },

  // Clean up temporary directory
  cleanupTempDir: async (dir: string) => {
    const { rm } = await import('fs/promises');
    try {
      await rm(dir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors in tests
    }
  }
};

// Declare global types
declare global {
  var testUtils: {
    resetConsoleMocks: () => void;
    getConsoleOutput: () => {
      log: any[][];
      info: any[][];
      warn: any[][];
      error: any[][];
      debug: any[][];
    };
    useRealConsole: () => void;
    sleep: (ms: number) => Promise<void>;
    createTempDir: () => Promise<string>;
    cleanupTempDir: (dir: string) => Promise<void>;
  };
}

// Cleanup after each test
afterEach(() => {
  // Reset all mocks
  jest.clearAllMocks();
  
  // Reset environment
  delete process.env.CRITICAL_CLAUDE_TEST_MODE;
});

// Global cleanup
afterAll(() => {
  // Restore original console
  global.console = originalConsole;
});
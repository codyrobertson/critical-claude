/**
 * Claude Code SDK Integration Tests
 * Test the proper SDK usage instead of subprocess calls
 */

import { describe, it, expect, beforeEach, vi, type MockedFunction } from 'vitest';
import { ClaudeCodeProvider, type ClaudeCodeConfig } from '../../src/ai/ClaudeCodeProvider';

// Mock the Claude Code SDK
vi.mock('@anthropic-ai/claude-code', () => ({
  query: vi.fn()
}));

import { query } from '@anthropic-ai/claude-code';
const mockQuery = query as MockedFunction<typeof query>;

// Mock logger
const mockLogger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
};

describe('Claude Code SDK Integration', () => {
  let provider: ClaudeCodeProvider;
  let defaultConfig: ClaudeCodeConfig;

  beforeEach(() => {
    vi.clearAllMocks();
    defaultConfig = {
      maxTurns: 5,
      cwd: '/test/project',
      timeout: 30000
    };
    provider = new ClaudeCodeProvider(defaultConfig, mockLogger);
  });

  describe('Configuration', () => {
    it('should initialize with default configuration', () => {
      const config = provider.getConfig();
      expect(config.maxTurns).toBe(5);
      expect(config.cwd).toBe('/test/project');
      expect(config.timeout).toBe(30000);
    });

    it('should use defaults for missing config values', () => {
      const provider = new ClaudeCodeProvider({}, mockLogger);
      const config = provider.getConfig();
      
      expect(config.maxTurns).toBe(10);
      expect(config.cwd).toBe(process.cwd());
      expect(config.timeout).toBe(60000);
    });

    it('should update configuration correctly', () => {
      provider.updateConfig({ maxTurns: 15, timeout: 45000 });
      const config = provider.getConfig();
      
      expect(config.maxTurns).toBe(15);
      expect(config.timeout).toBe(45000);
      expect(config.cwd).toBe('/test/project'); // Should preserve existing values
    });
  });

  describe('SDK Integration', () => {
    it('should use SDK query function instead of subprocess', async () => {
      // Mock successful SDK response
      const mockMessages = [
        { type: 'text', content: 'Hello, this is Claude!' }
      ];
      
      mockQuery.mockImplementation(async function* () {
        yield* mockMessages;
      });

      const result = await provider.execute('Hello Claude');

      expect(mockQuery).toHaveBeenCalledWith({
        prompt: 'Hello Claude',
        abortController: expect.any(AbortController),
        options: {
          maxTurns: 5,
          cwd: '/test/project',
          executable: undefined,
          executableArgs: undefined,
          pathToClaudeCodeExecutable: undefined
        }
      });

      expect(result.success).toBe(true);
      expect(result.content).toBe('Hello, this is Claude!');
    });

    it('should handle multiple message types correctly', async () => {
      const mockMessages = [
        { type: 'text', content: 'Here is the code:' },
        { type: 'tool_use', name: 'edit_file', content: 'console.log("hello");' },
        { type: 'tool_result', content: 'File edited successfully' },
        { type: 'text', content: 'Done!' }
      ];
      
      mockQuery.mockImplementation(async function* () {
        yield* mockMessages;
      });

      const result = await provider.execute('Write a hello world');

      expect(result.success).toBe(true);
      expect(result.content).toContain('Here is the code:');
      expect(result.content).toContain('[Tool: edit_file]');
      expect(result.content).toContain('console.log("hello");');
      expect(result.content).toContain('[Result]');
      expect(result.content).toContain('File edited successfully');
      expect(result.content).toContain('Done!');
    });

    it('should handle SDK errors gracefully', async () => {
      mockQuery.mockImplementation(async function* () {
        throw new Error('SDK connection failed');
      });

      const result = await provider.execute('Test prompt');

      expect(result.success).toBe(false);
      expect(result.error).toContain('SDK connection failed');
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Claude Code SDK request failed',
        { error: expect.stringContaining('SDK connection failed') }
      );
    });

    it('should handle empty responses', async () => {
      mockQuery.mockImplementation(async function* () {
        // No messages yielded
      });

      const result = await provider.execute('Empty test');

      expect(result.success).toBe(false);
      expect(result.error).toBe('No content received from Claude Code SDK');
    });

    it('should respect timeout configuration', async () => {
      provider.updateConfig({ timeout: 50 }); // Very short timeout
      
      mockQuery.mockImplementation(async function* (options) {
        // Check if the request is aborted during execution
        const checkAborted = () => {
          if (options.abortController.signal.aborted) {
            throw new Error('The operation was aborted.');
          }
        };
        
        // Simulate a long-running operation that checks for abort
        for (let i = 0; i < 10; i++) {
          await new Promise(resolve => setTimeout(resolve, 20));
          checkAborted();
        }
        
        yield { type: 'text', content: 'This should timeout' };
      });

      const result = await provider.execute('Timeout test');

      expect(result.success).toBe(false);
      expect(result.error).toContain('timed out');
    });
  });

  describe('Availability Check', () => {
    it('should return true when SDK is working', async () => {
      mockQuery.mockImplementation(async function* () {
        yield { type: 'text', content: 'test response' };
      });

      const isAvailable = await provider.isAvailable();
      
      expect(isAvailable).toBe(true);
      expect(mockQuery).toHaveBeenCalledWith({
        prompt: 'test',
        abortController: expect.any(AbortController),
        options: {
          maxTurns: 1,
          cwd: '/test/project'
        }
      });
    });

    it('should return false when SDK throws error', async () => {
      mockQuery.mockImplementation(async function* () {
        throw new Error('Not authenticated');
      });

      const isAvailable = await provider.isAvailable();
      
      expect(isAvailable).toBe(false);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Claude Code SDK availability check failed',
        { error: expect.any(Error) }
      );
    });
  });

  describe('Structured Generation', () => {
    it('should generate structured content with JSON parsing', async () => {
      const mockResponse = {
        type: 'text',
        content: '```json\n{"name": "test", "value": 42}\n```'
      };
      
      mockQuery.mockImplementation(async function* () {
        yield mockResponse;
      });

      const schema = { name: 'string', value: 'number' };
      const result = await provider.generateStructured('Generate JSON', schema);

      expect(result).toEqual({ name: 'test', value: 42 });
    });

    it('should handle malformed JSON gracefully', async () => {
      const mockResponse = {
        type: 'text',
        content: 'This is not JSON'
      };
      
      mockQuery.mockImplementation(async function* () {
        yield mockResponse;
      });

      const result = await provider.generateStructured('Generate JSON');

      expect(result).toBeNull();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Failed to parse structured response as JSON',
        expect.objectContaining({
          parseError: expect.any(Error),
          responsePreview: 'This is not JSON'
        })
      );
    });

    it('should handle SDK failure during structured generation', async () => {
      mockQuery.mockImplementation(async function* () {
        throw new Error('Network error');
      });

      const result = await provider.generateStructured('Generate JSON');

      expect(result).toBeNull();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Failed to generate structured content',
        { error: 'Claude Code SDK error: Network error' }
      );
    });
  });

  describe('Full Conversation Tracking', () => {
    it('should return all messages from a conversation', async () => {
      const mockMessages = [
        { type: 'text', content: 'First message' },
        { type: 'tool_use', name: 'read_file', content: 'file.txt' },
        { type: 'tool_result', content: 'File contents' },
        { type: 'text', content: 'Second message' }
      ];
      
      mockQuery.mockImplementation(async function* () {
        yield* mockMessages;
      });

      const messages = await provider.getFullConversation('Test conversation');

      expect(messages).toHaveLength(4);
      expect(messages[0]).toEqual({ type: 'text', content: 'First message' });
      expect(messages[1]).toEqual({ type: 'tool_use', name: 'read_file', content: 'file.txt' });
      expect(messages[2]).toEqual({ type: 'tool_result', content: 'File contents' });
      expect(messages[3]).toEqual({ type: 'text', content: 'Second message' });
    });

    it('should handle errors in full conversation tracking', async () => {
      mockQuery.mockImplementation(async function* () {
        throw new Error('Conversation failed');
      });

      const messages = await provider.getFullConversation('Error test');

      expect(messages).toEqual([]);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to get full conversation',
        expect.any(Error)
      );
    });
  });

  describe('Logging Integration', () => {
    it('should log debug information for successful requests', async () => {
      mockQuery.mockImplementation(async function* () {
        yield { type: 'text', content: 'Success response' };
      });

      await provider.execute('Test prompt');

      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Executing Claude Code SDK request',
        { promptLength: 11, maxTurns: 5 }
      );
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Claude Code SDK request successful',
        { responseLength: 16 }
      );
    });

    it('should log warnings for failed requests', async () => {
      mockQuery.mockImplementation(async function* () {
        throw new Error('Request failed');
      });

      await provider.execute('Test prompt');

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Claude Code SDK request failed',
        { error: 'Claude Code SDK error: Request failed' }
      );
    });

    it('should log configuration updates', () => {
      provider.updateConfig({ maxTurns: 20 });

      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Claude Code SDK configuration updated',
        { config: expect.objectContaining({ maxTurns: 20 }) }
      );
    });
  });
});
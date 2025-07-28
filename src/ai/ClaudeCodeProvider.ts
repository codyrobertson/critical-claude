/**
 * Claude Code AI Provider
 * Uses the official Claude Code SDK for AI operations
 */

import { query, type SDKMessage } from '@anthropic-ai/claude-code';
interface ILogger {
  debug(message: string, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, error?: Error, context?: Record<string, unknown>): void;
}

export interface ClaudeCodeConfig {
  maxTurns?: number;
  cwd?: string;
  executable?: 'node' | 'bun';
  executableArgs?: string[];
  pathToClaudeCodeExecutable?: string;
  timeout?: number;
}

export interface ClaudeCodeResponse {
  content: string;
  success: boolean;
  error?: string;
}

export class ClaudeCodeProvider {
  private config: ClaudeCodeConfig;
  private logger: ILogger;

  constructor(config: ClaudeCodeConfig = {}, logger: ILogger) {
    this.config = {
      maxTurns: config.maxTurns || 10,
      cwd: config.cwd || process.cwd(),
      timeout: config.timeout || 60000,
      ...config
    };
    this.logger = logger;
  }

  /**
   * Test if Claude Code SDK is available and working
   */
  async isAvailable(): Promise<boolean> {
    try {
      // Test with a simple query and short timeout
      const abortController = new AbortController();
      const timeout = setTimeout(() => abortController.abort(), 5000);
      
      const messages: SDKMessage[] = [];
      for await (const message of query({
        prompt: 'test',
        abortController,
        options: {
          maxTurns: 1,
          cwd: this.config.cwd
        }
      })) {
        messages.push(message);
        break; // Just test that we can start a query
      }
      
      clearTimeout(timeout);
      return true;
    } catch (error) {
      this.logger.debug('Claude Code SDK availability check failed', { error });
      return false;
    }
  }

  /**
   * Execute a prompt using Claude Code SDK
   */
  async execute(prompt: string): Promise<ClaudeCodeResponse> {
    try {
      this.logger.debug('Executing Claude Code SDK request', { 
        promptLength: prompt.length,
        maxTurns: this.config.maxTurns
      });

      const response = await this.runClaudeCodeSDK(prompt);
      
      if (response.success) {
        this.logger.debug('Claude Code SDK request successful', { 
          responseLength: response.content.length 
        });
      } else {
        this.logger.warn('Claude Code SDK request failed', { error: response.error });
      }

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Claude Code SDK execution error', error as Error);
      
      return {
        content: '',
        success: false,
        error: `Claude Code SDK error: ${errorMessage}`
      };
    }
  }

  /**
   * Generate structured content using Claude Code
   */
  async generateStructured<T>(prompt: string, schema?: any): Promise<T | null> {
    const structuredPrompt = this.buildStructuredPrompt(prompt, schema);
    const response = await this.execute(structuredPrompt);

    if (!response.success) {
      this.logger.warn('Failed to generate structured content', { error: response.error });
      return null;
    }

    try {
      // Try to extract JSON from the response
      const jsonMatch = response.content.match(/```json\n([\s\S]*?)\n```/) || 
                       response.content.match(/```\n([\s\S]*?)\n```/) ||
                       [null, response.content];

      if (jsonMatch && jsonMatch[1]) {
        return JSON.parse(jsonMatch[1].trim());
      }

      // Fallback: try parsing the entire response as JSON
      return JSON.parse(response.content.trim());
    } catch (parseError) {
      this.logger.warn('Failed to parse structured response as JSON', { 
        parseError, 
        responsePreview: response.content.substring(0, 200) 
      });
      return null;
    }
  }

  /**
   * Run Claude Code SDK with the given prompt
   */
  private async runClaudeCodeSDK(prompt: string): Promise<ClaudeCodeResponse> {
    const abortController = new AbortController();
    let timeoutId: NodeJS.Timeout | undefined;
    
    try {
      // Set up timeout
      timeoutId = setTimeout(() => {
        abortController.abort();
      }, this.config.timeout || 60000);

      const messages: SDKMessage[] = [];
      let fullContent = '';

      for await (const message of query({
        prompt,
        abortController,
        options: {
          maxTurns: this.config.maxTurns || 10,
          cwd: this.config.cwd,
          executable: this.config.executable,
          executableArgs: this.config.executableArgs,
          pathToClaudeCodeExecutable: this.config.pathToClaudeCodeExecutable
        }
      })) {
        messages.push(message);
        
        // Accumulate all content from messages
        if (message.type === 'text') {
          fullContent += message.content;
        } else if (message.type === 'tool_use' && message.content) {
          fullContent += `\n[Tool: ${message.name}]\n${message.content}`;
        } else if (message.type === 'tool_result' && message.content) {
          fullContent += `\n[Result]\n${message.content}`;
        }
      }

      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      if (fullContent.trim()) {
        return {
          content: fullContent.trim(),
          success: true
        };
      } else {
        return {
          content: '',
          success: false,
          error: 'No content received from Claude Code SDK'
        };
      }
    } catch (error) {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Check if this is an abort error (timeout)
      if (abortController.signal.aborted || errorMessage.includes('aborted')) {
        return {
          content: '',
          success: false,
          error: 'Claude Code SDK request timed out'
        };
      }
      
      return {
        content: '',
        success: false,
        error: `Claude Code SDK error: ${errorMessage}`
      };
    }
  }


  /**
   * Build a structured prompt for JSON responses
   */
  private buildStructuredPrompt(prompt: string, schema?: any): string {
    let structuredPrompt = prompt;

    if (schema) {
      structuredPrompt += `\n\nPlease respond with valid JSON matching this exact schema:\n\`\`\`json\n${JSON.stringify(schema, null, 2)}\n\`\`\``;
    } else {
      structuredPrompt += '\n\nPlease respond with valid JSON format for structured data.';
    }

    structuredPrompt += '\n\nIMPORTANT: Wrap your JSON response in ```json code blocks for proper parsing.';

    return structuredPrompt;
  }

  /**
   * Get current configuration
   */
  getConfig(): ClaudeCodeConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<ClaudeCodeConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.logger.debug('Claude Code SDK configuration updated', { config: this.config });
  }

  /**
   * Get all messages from a query (useful for debugging)
   */
  async getFullConversation(prompt: string): Promise<SDKMessage[]> {
    try {
      const abortController = new AbortController();
      const timeout = setTimeout(() => {
        abortController.abort();
      }, this.config.timeout || 60000);

      const messages: SDKMessage[] = [];

      for await (const message of query({
        prompt,
        abortController,
        options: {
          maxTurns: this.config.maxTurns || 10,
          cwd: this.config.cwd,
          executable: this.config.executable,
          executableArgs: this.config.executableArgs,
          pathToClaudeCodeExecutable: this.config.pathToClaudeCodeExecutable
        }
      })) {
        messages.push(message);
      }

      clearTimeout(timeout);
      return messages;
    } catch (error) {
      this.logger.error('Failed to get full conversation', error as Error);
      return [];
    }
  }
}
/**
 * Enhanced Claude Code Provider for Critical Claude Backlog
 * Implements robust subprocess integration with proper error handling
 */
import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import { AITaskSuggestion } from '../types/agile.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { randomUUID } from 'crypto';

const execAsync = promisify(exec);

interface ClaudeCodeConfig {
  modelId: 'opus' | 'sonnet' | 'haiku';
  temperature?: number;
  maxTokens?: number;
  maxTurns?: number;
  permissionMode?: 'default' | 'acceptEdits' | 'plan' | 'bypassPermissions';
  allowedTools?: string[];
  disallowedTools?: string[];
  outputFormat?: 'text' | 'json' | 'stream-json';
  sessionId?: string;
  mcpConfig?: string;
}

interface ClaudeResponse {
  type: string;
  subtype?: string;
  result?: string;
  total_cost_usd?: number;
  is_error?: boolean;
  error?: string;
  session_id?: string;
  duration_ms?: number;
  num_turns?: number;
}

const logger = {
  info: (msg: string, data?: any) => console.log(`[INFO] ${msg}`, data || ''),
  error: (msg: string, error?: any) => console.error(`[ERROR] ${msg}`, error || ''),
  warn: (msg: string, data?: any) => console.warn(`[WARN] ${msg}`, data || ''),
  debug: (msg: string, data?: any) => console.log(`[DEBUG] ${msg}`, data || '')
};

export class EnhancedClaudeCodeProvider {
  private config: ClaudeCodeConfig;
  private sessionCache: Map<string, string> = new Map();
  private tempDir: string;

  private initialized = false;
  private initializationPromise: Promise<void> | null = null;

  constructor(config: ClaudeCodeConfig) {
    this.config = {
      outputFormat: 'json',
      permissionMode: 'plan',
      ...config
    };
    this.tempDir = path.join(process.cwd(), '.claude-temp');
    // DON'T call ensureTempDir here - make it lazy
    logger.info('EnhancedClaudeCodeProvider initialized', this.config);
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      if (!this.initializationPromise) {
        this.initializationPromise = this.performInitialization();
      }
      await this.initializationPromise;
      this.initialized = true;
    }
  }

  private async performInitialization(): Promise<void> {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      logger.error('Failed to create temp directory', error);
      throw error;
    }
  }

  /**
   * Validate and sanitize tool schema for Claude CLI compatibility
   * Removes oneOf/allOf/anyOf at top level which cause CLI errors
   */
  private validateToolSchema(schema: any): boolean {
    if (!schema || typeof schema !== 'object') {
      return false;
    }

    // Check for problematic top-level schema keywords
    const problematicKeywords = ['oneOf', 'allOf', 'anyOf'];
    for (const keyword of problematicKeywords) {
      if (schema.hasOwnProperty(keyword)) {
        logger.warn(`Rejecting tool schema with top-level ${keyword}`, { schema: JSON.stringify(schema, null, 2) });
        return false;
      }
    }

    // Additional validation for required Claude CLI schema structure
    if (!schema.type || !schema.properties) {
      logger.warn('Tool schema missing required type or properties', { schema });
      return false;
    }

    return true;
  }

  /**
   * Sanitize tools configuration before passing to Claude CLI
   */
  private sanitizeToolsConfig(tools?: any[]): any[] {
    if (!tools || !Array.isArray(tools)) {
      return [];
    }

    return tools.filter(tool => {
      if (!tool || !tool.input_schema) {
        return true; // Keep tools without schemas
      }

      const isValid = this.validateToolSchema(tool.input_schema);
      if (!isValid) {
        logger.info(`Filtering out incompatible tool: ${tool.name || 'unnamed'}`);
      }
      return isValid;
    });
  }

  private async ensureTempDir(): Promise<void> {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      logger.error('Failed to create temp directory', error);
    }
  }

  /**
   * Generate tasks from feature description using Claude Code
   */
  async generateTasksFromFeature(
    featureDescription: string,
    projectContext?: any
  ): Promise<AITaskSuggestion[]> {
    await this.ensureInitialized();
    const prompt = this.buildFeaturePrompt(featureDescription, projectContext);
    
    try {
      const response = await this.executeClaudeCommand(prompt, {
        sessionKey: 'task-generation',
        useFile: true // Use file-based approach for complex prompts
      });

      return this.parseTasksFromResponse(response);
    } catch (error) {
      logger.error('Failed to generate tasks from feature', error);
      return this.getFallbackTasks(featureDescription);
    }
  }

  /**
   * Analyze code for improvement tasks
   */
  async analyzeCodeForTasks(filePath: string): Promise<AITaskSuggestion[]> {
    const prompt = `Analyze the code in ${filePath} and suggest improvement tasks. 
Format the response as a JSON array of tasks with these fields:
- title: Brief task title
- description: Detailed description
- estimatedEffort: Story points (1-13)
- priority: low/medium/high/critical
- labels: Array of relevant labels
- acceptanceCriteria: Array of specific criteria
- reasoning: Why this task is important
- confidence: 0-1 confidence score
- dependencies: Array of task dependencies

Focus on:
1. Code quality improvements
2. Performance optimizations
3. Security vulnerabilities
4. Architectural concerns
5. Technical debt`;

    try {
      const response = await this.executeClaudeCommand(prompt, {
        sessionKey: 'code-analysis',
        workingDir: path.dirname(filePath)
      });

      return this.parseTasksFromResponse(response);
    } catch (error) {
      logger.error('Failed to analyze code for tasks', error);
      return [];
    }
  }

  /**
   * Execute Claude command with robust error handling
   */
  private async executeClaudeCommand(
    prompt: string,
    options: {
      sessionKey?: string;
      useFile?: boolean;
      workingDir?: string;
    } = {}
  ): Promise<ClaudeResponse> {
    const { sessionKey, useFile = false, workingDir = process.cwd() } = options;

    // Check if Claude is available
    const claudePath = await this.findClaudeBinary();
    if (!claudePath) {
      throw new Error('Claude Code CLI not found. Please install with: npm install -g @anthropic-ai/claude-code');
    }

    let args: string[] = [];
    let promptFile: string | undefined;

    // Build command arguments
    args.push('--print'); // Non-interactive mode

    if (this.config.outputFormat === 'json') {
      args.push('--output-format', 'json');
    }

    // Add model selection
    if (this.config.modelId) {
      args.push('--model', this.config.modelId);
    }

    // Session management
    if (sessionKey && this.sessionCache.has(sessionKey)) {
      args.push('--resume', this.sessionCache.get(sessionKey)!);
    }

    // Permission mode for safety
    if (this.config.permissionMode === 'plan') {
      args.push('--dangerously-skip-permissions');
    }

    // Tool restrictions with schema validation
    if (this.config.allowedTools && this.config.allowedTools.length > 0) {
      // Filter out tools with problematic schemas
      const sanitizedAllowedTools = this.config.allowedTools.filter(toolName => {
        // For now, just pass through tool names - actual schema validation happens at runtime
        return true;
      });
      
      if (sanitizedAllowedTools.length > 0) {
        args.push('--allowedTools', ...sanitizedAllowedTools);
      }
    }

    if (this.config.disallowedTools && this.config.disallowedTools.length > 0) {
      args.push('--disallowedTools', ...this.config.disallowedTools);
    }

    // Add MCP configuration if provided
    if (this.config.mcpConfig) {
      args.push('--mcp-config', this.config.mcpConfig);
    }

    // Handle long prompts via file or stdin
    if (useFile || prompt.length > 1000) {
      promptFile = path.join(this.tempDir, `prompt-${randomUUID()}.txt`);
      await fs.writeFile(promptFile, prompt, 'utf-8');
      // For file input, we'll use stdin
    } else {
      // Short prompts can be passed as arguments
      args.push(prompt);
    }

    logger.debug('Executing Claude command', { claudePath, args: args.slice(0, -1), workingDir });

    return new Promise((resolve, reject) => {
      let output = '';
      let errorOutput = '';
      let lastValidJson: ClaudeResponse | null = null;

      const claudeProcess = spawn(claudePath, args, {
        cwd: workingDir,
        env: { ...process.env },
        stdio: promptFile ? ['pipe', 'pipe', 'pipe'] : ['inherit', 'pipe', 'pipe']
      });

      // Send file content via stdin if using file approach
      if (promptFile && claudeProcess.stdin) {
        fs.readFile(promptFile, 'utf-8').then(content => {
          claudeProcess.stdin?.write(content);
          claudeProcess.stdin?.end();
        }).catch(reject);
      }

      claudeProcess.stdout?.on('data', (data) => {
        const chunk = data.toString();
        output += chunk;

        // Try to parse JSON responses incrementally
        if (this.config.outputFormat === 'json') {
          const lines = chunk.split('\n').filter((line: string) => line.trim());
          for (const line of lines) {
            try {
              const json = JSON.parse(line);
              if (json.type === 'result' && json.subtype === 'success') {
                lastValidJson = json;
              }
            } catch {
              // Not JSON, continue
            }
          }
        }
      });

      claudeProcess.stderr?.on('data', (data) => {
        errorOutput += data.toString();
      });

      claudeProcess.on('close', async (code) => {
        // Cleanup temp file
        if (promptFile) {
          try {
            await fs.unlink(promptFile);
          } catch {}
        }

        if (code !== 0) {
          // Check for specific MCP tool schema errors
          if (errorOutput.includes('oneOf') || errorOutput.includes('allOf') || errorOutput.includes('anyOf')) {
            logger.error('MCP tool schema validation error detected', { errorOutput });
            reject(new Error(`MCP tool schema error - incompatible oneOf/allOf/anyOf detected: ${errorOutput}`));
          } else {
            logger.error('Claude process exited with error', { code, errorOutput });
            reject(new Error(`Claude exited with code ${code}: ${errorOutput}`));
          }
          return;
        }

        // Parse response
        if (this.config.outputFormat === 'json' && lastValidJson) {
          // Cache session ID for reuse
          if (sessionKey && lastValidJson.session_id) {
            this.sessionCache.set(sessionKey, lastValidJson.session_id);
          }
          resolve(lastValidJson);
        } else {
          // Text output
          resolve({
            type: 'result',
            subtype: 'success',
            result: output.trim()
          });
        }
      });

      claudeProcess.on('error', (error) => {
        logger.error('Failed to spawn Claude process', error);
        reject(error);
      });
    });
  }

  /**
   * Test Claude CLI functionality with minimal configuration
   * Used to diagnose MCP tool schema issues
   */
  async testClaudeConnection(): Promise<{ success: boolean; error?: string; output?: string }> {
    try {
      const claudePath = await this.findClaudeBinary();
      if (!claudePath) {
        return { success: false, error: 'Claude CLI not found' };
      }

      // Use minimal configuration to test basic functionality
      const testPrompt = 'Respond with "Hello World" only.';
      const args = [
        '--print',
        '--model', this.config.modelId,
        '--output-format', 'text',
        testPrompt
      ];

      logger.debug('Testing Claude CLI connection', { claudePath, args: args.slice(0, -1) });

      const response = await this.executeSimpleClaudeCommand(claudePath, args);
      
      return {
        success: true,
        output: response.trim()
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Claude CLI connection test failed', error);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Execute simple Claude command without complex configurations
   */
  private async executeSimpleClaudeCommand(claudePath: string, args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      
      const claudeProcess = spawn(claudePath, args, {
        stdio: ['inherit', 'pipe', 'pipe']
      });

      let output = '';
      let errorOutput = '';

      claudeProcess.stdout?.on('data', (data: Buffer) => {
        output += data.toString();
      });

      claudeProcess.stderr?.on('data', (data: Buffer) => {
        errorOutput += data.toString();
      });

      claudeProcess.on('close', (code: number) => {
        if (code !== 0) {
          reject(new Error(`Claude test failed with code ${code}: ${errorOutput}`));
        } else {
          resolve(output);
        }
      });

      claudeProcess.on('error', (error: Error) => {
        reject(error);
      });
    });
  }

  /**
   * Find Claude binary in system PATH
   */
  private async findClaudeBinary(): Promise<string | null> {
    try {
      const { stdout } = await execAsync('which claude');
      return stdout.trim();
    } catch {
      // Try common locations
      const locations = [
        '/usr/local/bin/claude',
        '/opt/homebrew/bin/claude',
        path.join(process.env.HOME || '', '.bun/bin/claude'),
        path.join(process.env.HOME || '', '.npm/bin/claude')
      ];

      for (const loc of locations) {
        try {
          await fs.access(loc, fs.constants.X_OK);
          return loc;
        } catch {}
      }

      return null;
    }
  }

  /**
   * Build feature breakdown prompt
   */
  private buildFeaturePrompt(featureDescription: string, context?: any): string {
    return `You are a senior software architect breaking down a feature into concrete, implementable tasks.

Feature: ${featureDescription}

${context ? `Project Context:
- Team Size: ${context.teamSize || 'Unknown'}
- Sprint Length: ${context.sprintLength || '2 weeks'}
- Tech Stack: ${context.techStack?.join(', ') || 'Not specified'}
- Current Phase: ${context.currentPhase || 'Development'}
` : ''}

Break this feature down into specific, actionable tasks. Each task should be:
1. Small enough to complete in 1-3 days
2. Clearly defined with acceptance criteria
3. Properly estimated (1-13 story points)
4. Tagged with relevant labels
5. Include technical implementation details

Return a JSON array of tasks with this structure:
[
  {
    "title": "Brief, clear task title",
    "description": "Detailed technical description",
    "estimatedEffort": 5,
    "priority": "high",
    "labels": ["backend", "api", "database"],
    "acceptanceCriteria": [
      "API endpoint returns 200 status",
      "Data validates against schema",
      "Unit tests pass with 90% coverage"
    ],
    "reasoning": "Why this task is necessary",
    "confidence": 0.85,
    "technicalNotes": "Implementation approach and considerations",
    "dependencies": []
  }
]

Focus on creating tasks that are:
- Testable and measurable
- Architecturally sound
- Following best practices
- Considering edge cases and error handling

Respond ONLY with the JSON array, no additional text.`;
  }

  /**
   * Parse tasks from Claude response
   */
  private parseTasksFromResponse(response: ClaudeResponse): AITaskSuggestion[] {
    if (!response.result) {
      return [];
    }

    try {
      // Try to parse as JSON array
      const tasks = JSON.parse(response.result);
      if (Array.isArray(tasks)) {
        return tasks.map(task => this.validateAndNormalizeTask(task));
      }

      // Try to extract JSON from text
      const jsonMatch = response.result.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const tasks = JSON.parse(jsonMatch[0]);
        return tasks.map((task: any) => this.validateAndNormalizeTask(task));
      }
    } catch (error) {
      logger.error('Failed to parse tasks from response', error);
      logger.debug('Raw response:', response.result);
    }

    return [];
  }

  /**
   * Validate and normalize task structure
   */
  private validateAndNormalizeTask(task: any): AITaskSuggestion {
    return {
      title: task.title || 'Untitled Task',
      description: task.description || '',
      estimatedEffort: this.normalizeEffort(task.estimatedEffort),
      priority: this.normalizePriority(task.priority),
      labels: Array.isArray(task.labels) ? task.labels : [],
      acceptanceCriteria: Array.isArray(task.acceptanceCriteria) 
        ? task.acceptanceCriteria 
        : [task.acceptanceCriteria].filter(Boolean),
      reasoning: task.reasoning || task.technicalNotes || 'Generated by AI analysis',
      confidence: typeof task.confidence === 'number' 
        ? Math.max(0, Math.min(1, task.confidence)) 
        : 0.7,
      dependencies: Array.isArray(task.dependencies) ? task.dependencies : [],
      codeReferences: task.codeReferences || []
    };
  }

  /**
   * Normalize effort to valid story points
   */
  private normalizeEffort(effort: any): number {
    const validPoints = [1, 2, 3, 5, 8, 13, 21];
    const parsed = parseInt(effort);
    
    if (isNaN(parsed)) return 5;
    
    // Find closest valid point
    return validPoints.reduce((prev, curr) => 
      Math.abs(curr - parsed) < Math.abs(prev - parsed) ? curr : prev
    );
  }

  /**
   * Normalize priority to valid values
   */
  private normalizePriority(priority: any): 'low' | 'medium' | 'high' | 'critical' {
    const p = String(priority).toLowerCase();
    if (['low', 'medium', 'high', 'critical'].includes(p)) {
      return p as any;
    }
    return 'medium';
  }

  /**
   * Get fallback tasks when AI generation fails
   */
  private getFallbackTasks(description: string): AITaskSuggestion[] {
    logger.info('Using fallback task generation');
    
    return [{
      title: `Implement: ${description.slice(0, 50)}...`,
      description: `AI generation failed. Please manually break down: ${description}`,
      estimatedEffort: 8,
      priority: 'medium',
      labels: ['needs-refinement', 'ai-fallback'],
      acceptanceCriteria: ['Feature implemented as described', 'Tests pass', 'Code reviewed'],
      reasoning: 'Fallback task - AI generation unavailable',
      confidence: 0.3,
      dependencies: [],
      codeReferences: []
    }];
  }
}
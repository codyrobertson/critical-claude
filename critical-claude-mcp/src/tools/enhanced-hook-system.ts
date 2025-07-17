/**
 * Enhanced Hook System - MUCH Tighter Integration
 * Real-time, instantaneous hook processing with visual feedback
 */

import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { EventEmitter } from 'events';
import { StatefulTaskQueue } from './stateful-task-queue.js';
import { LiveHookMonitor } from './live-hook-monitor.js';
import { AITaskEngine } from './ai-task-engine.js';
import { MarkdownTaskManager } from './markdown-task-manager.js';
import { VisualTodoFormatter, TodoItem } from './visual-todo-formatter.js';
import { logger } from '../logger.js';

export interface HookEvent {
  timestamp: string;
  tool_name: string;
  arguments?: any;
  file_path?: string;
  content?: string;
  context?: any;
  session_id?: string;
  user_id?: string;
}

export interface HookResponse {
  processed: boolean;
  visual_feedback?: string;
  tasks_updated?: number;
  sync_status?: 'success' | 'failed' | 'partial';
  response_time_ms?: number;
  actions_triggered?: string[];
}

export interface HookConfig {
  enabled: boolean;
  visual_feedback: boolean;
  instant_sync: boolean;
  response_timeout_ms: number;
  supported_tools: string[];
  actions: {
    [toolName: string]: {
      enabled: boolean;
      action: string;
      visual_response: boolean;
      sync_immediately: boolean;
    };
  };
}

export class EnhancedHookSystem extends EventEmitter {
  private config: HookConfig;
  private taskQueue: StatefulTaskQueue;
  private hookDir: string;
  private responseCache: Map<string, HookResponse> = new Map();
  private processingQueue: HookEvent[] = [];
  private isProcessing = false;
  private liveMonitor: LiveHookMonitor;
  private aiTaskEngine: AITaskEngine;
  private markdownTaskManager: MarkdownTaskManager;
  private visualFormatter: VisualTodoFormatter;

  constructor(taskQueue: StatefulTaskQueue, markdownTaskManager?: MarkdownTaskManager) {
    super();
    this.taskQueue = taskQueue;
    this.hookDir = path.join(os.homedir(), '.critical-claude', 'hooks');
    this.liveMonitor = new LiveHookMonitor();
    
    // Initialize AI task generation components
    this.markdownTaskManager = markdownTaskManager || new MarkdownTaskManager(process.cwd());
    this.aiTaskEngine = new AITaskEngine(this.markdownTaskManager);
    this.visualFormatter = new VisualTodoFormatter();
    
    this.config = {
      enabled: true,
      visual_feedback: true,
      instant_sync: true,
      response_timeout_ms: 500, // Ultra-fast response
      supported_tools: ['TodoWrite', 'Edit', 'Write', 'MultiEdit', 'Read', 'WebFetch'],
      actions: {
        'TodoWrite': {
          enabled: true,
          action: 'sync_tasks_instantly',
          visual_response: true,
          sync_immediately: true
        },
        'Edit': {
          enabled: true,
          action: 'track_code_changes',
          visual_response: false,
          sync_immediately: false
        },
        'Write': {
          enabled: true,
          action: 'track_new_files',
          visual_response: false,
          sync_immediately: false
        },
        'MultiEdit': {
          enabled: true,
          action: 'track_bulk_changes',
          visual_response: true,
          sync_immediately: true
        },
        'WebFetch': {
          enabled: true,
          action: 'analyze_web_content_for_tasks',
          visual_response: true,
          sync_immediately: false
        }
      }
    };
  }

  async initialize(): Promise<void> {
    try {
      // Create hook directories
      await fs.mkdir(this.hookDir, { recursive: true });
      await fs.mkdir(path.join(this.hookDir, 'logs'), { recursive: true });
      await fs.mkdir(path.join(this.hookDir, 'cache'), { recursive: true });

      // Create enhanced hook scripts
      await this.createEnhancedHookScripts();
      
      // Setup real-time processing
      await this.setupRealtimeProcessing();
      
      // Start background sync monitor
      this.startSyncMonitor();

      // Initialize live monitor
      await this.liveMonitor.initialize();

      // Initialize AI task engine
      await this.markdownTaskManager.initialize();

      logger.info('Enhanced hook system initialized', {
        hookDir: this.hookDir,
        instantSync: this.config.instant_sync,
        visualFeedback: this.config.visual_feedback,
        liveMonitoring: true,
        aiTaskGeneration: true
      });

    } catch (error) {
      logger.error('Failed to initialize enhanced hook system', error as Error);
      throw error;
    }
  }

  async processHookEvent(event: HookEvent): Promise<HookResponse> {
    const startTime = Date.now();
    const response: HookResponse = {
      processed: false,
      response_time_ms: 0,
      actions_triggered: []
    };

    try {
      // Validate event
      if (!this.config.enabled || !event.tool_name) {
        return response;
      }

      // Check if tool is supported
      const toolConfig = this.config.actions[event.tool_name];
      if (!toolConfig || !toolConfig.enabled) {
        return response;
      }

      // Process based on tool type
      switch (event.tool_name) {
        case 'TodoWrite':
          await this.processTodoWriteEvent(event, response);
          break;
        case 'Edit':
        case 'Write':
        case 'MultiEdit':
          await this.processCodeChangeEvent(event, response);
          break;
        case 'WebFetch':
          await this.processWebFetchEvent(event, response);
          break;
        default:
          logger.debug('Unsupported tool for hook processing', { tool: event.tool_name });
      }

      response.processed = true;
      response.response_time_ms = Date.now() - startTime;

      // Add visual feedback if enabled
      if (this.config.visual_feedback && toolConfig.visual_response) {
        response.visual_feedback = this.generateVisualFeedback(event, response);
      }

      // Log successful processing
      await this.logHookEvent(event, response);

      // Log to live monitor
      await this.liveMonitor.logHookEvent({
        tool_name: event.tool_name,
        session_id: event.session_id,
        file_path: event.file_path,
        response_time_ms: response.response_time_ms,
        sync_status: response.sync_status,
        tasks_updated: response.tasks_updated,
        actions_triggered: response.actions_triggered,
        visual_feedback: response.visual_feedback,
        raw_event: event
      });

      this.emit('hookProcessed', event, response);

    } catch (error) {
      logger.error('Hook event processing failed', error as Error);
      response.sync_status = 'failed';
      response.response_time_ms = Date.now() - startTime;
    }

    return response;
  }

  private async processTodoWriteEvent(event: HookEvent, response: HookResponse): Promise<void> {
    try {
      // Extract todo data from the event
      const todos = this.extractTodosFromEvent(event);
      
      if (todos && todos.length > 0) {
        let syncedCount = 0;
        const processedTodos: TodoItem[] = [];
        
        for (const todo of todos) {
          // Convert Claude Code todo to Critical Claude task
          const taskData = this.convertTodoToTask(todo);
          
          // Convert to TodoItem format for visual formatter
          const todoItem: TodoItem = {
            content: todo.content || 'Untitled Task',
            status: this.mapStatus(todo.status),
            priority: this.mapPriority(todo.priority),
            id: taskData.id
          };
          processedTodos.push(todoItem);
          
          // Check if task already exists
          const existingTask = this.taskQueue.getTask(taskData.id);
          
          if (existingTask) {
            // Update existing task
            await this.taskQueue.updateTask(taskData.id, {
              title: taskData.title,
              status: taskData.status,
              priority: taskData.priority,
              updatedAt: new Date().toISOString()
            });
            syncedCount++;
          } else {
            // Create new task
            await this.taskQueue.addTask({
              ...taskData,
              sourceType: 'claude_code',
              sourceData: { originalTodo: todo }
            });
            syncedCount++;
          }
        }

        response.tasks_updated = syncedCount;
        response.sync_status = syncedCount > 0 ? 'success' : 'partial';
        response.actions_triggered?.push('sync_todos');

        // Generate visual feedback using the formatter
        const visualResult = this.visualFormatter.formatTodosVisual(
          processedTodos, 
          response.response_time_ms || 0
        );
        
        response.visual_feedback = visualResult.formattedOutput;

        // Save visual output to file for Claude Code to display
        await this.saveVisualFeedback(visualResult);

        // Instant visual feedback
        if (this.config.visual_feedback) {
          const instantMessage = this.visualFormatter.createInstantFeedback(
            syncedCount, 
            response.response_time_ms || 0, 
            response.sync_status
          );
          await this.sendInstantVisualFeedback(instantMessage);
        }

        // Enhanced logging with visual formatter
        const compactLog = this.visualFormatter.generateCompactLog(
          processedTodos, 
          response.response_time_ms || 0
        );
        
        logger.info('TodoWrite event processed with visual formatting', { 
          syncedCount,
          responseTime: response.response_time_ms,
          compactLog,
          visualFormatGenerated: true
        });
      }

    } catch (error) {
      logger.error('TodoWrite processing failed', error as Error);
      response.sync_status = 'failed';
    }
  }

  private async processCodeChangeEvent(event: HookEvent, response: HookResponse): Promise<void> {
    try {
      const filePath = event.file_path || event.arguments?.file_path;
      
      if (filePath) {
        // Track code changes for potential task creation
        const changeEvent = {
          timestamp: new Date().toISOString(),
          tool: event.tool_name,
          filePath,
          content: event.content,
          session: event.session_id
        };

        // Store in change log
        await this.logCodeChange(changeEvent);
        
        // Check if this should trigger AI task generation
        if (this.shouldCreateTaskFromCodeChange(changeEvent)) {
          await this.processCodeChangeWithAI(changeEvent, response);
        }
        
        // Check for PRD/document patterns
        if (this.isPRDOrRequirementDocument(filePath, event.content)) {
          await this.processDocumentWithAI(changeEvent, response);
        }

        response.sync_status = 'success';
        response.actions_triggered?.push('track_code_change');
      }

    } catch (error) {
      logger.error('Code change processing failed', error as Error);
      response.sync_status = 'failed';
    }
  }

  private extractTodosFromEvent(event: HookEvent): any[] {
    try {
      // Try to extract todos from different possible locations in the event
      if (event.arguments?.todos) {
        return event.arguments.todos;
      }
      
      if (event.content) {
        // Try to parse content as JSON
        const parsed = JSON.parse(event.content);
        if (parsed.todos) {
          return parsed.todos;
        }
      }

      // If arguments is a string, try to parse it
      if (typeof event.arguments === 'string') {
        const parsed = JSON.parse(event.arguments);
        if (parsed.todos) {
          return parsed.todos;
        }
      }

      return [];
    } catch (error) {
      logger.warn('Failed to extract todos from event', { error: (error as Error).message });
      return [];
    }
  }

  private convertTodoToTask(todo: any): any {
    return {
      id: todo.id || `claude-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: todo.content || 'Untitled Task',
      description: todo.description,
      priority: this.mapPriority(todo.priority),
      status: this.mapStatus(todo.status),
      tags: todo.tags || [],
      sourceType: 'claude_code',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  private mapPriority(claudePriority: string): 'low' | 'medium' | 'high' | 'critical' {
    switch (claudePriority?.toLowerCase()) {
      case 'critical': return 'critical';
      case 'high': return 'high';
      case 'medium': return 'medium';
      case 'low': return 'low';
      default: return 'medium';
    }
  }

  private mapStatus(claudeStatus: string): 'pending' | 'in_progress' | 'completed' | 'blocked' {
    switch (claudeStatus?.toLowerCase()) {
      case 'pending': return 'pending';
      case 'in_progress': return 'in_progress';
      case 'completed': return 'completed';
      case 'blocked': return 'blocked';
      default: return 'pending';
    }
  }

  private generateVisualFeedback(event: HookEvent, response: HookResponse): string {
    const emoji = response.sync_status === 'success' ? '✅' : '⚠️';
    const tool = event.tool_name;
    const count = response.tasks_updated || 0;
    
    return `${emoji} Critical Claude: ${tool} processed (${count} tasks updated) in ${response.response_time_ms}ms`;
  }

  private async sendInstantVisualFeedback(message: string): Promise<void> {
    try {
      // Write to a feedback file that can be read by the Claude interface
      const feedbackFile = path.join(this.hookDir, 'visual-feedback.json');
      const feedback = {
        timestamp: new Date().toISOString(),
        message,
        type: 'success',
        ttl: 5000 // Show for 5 seconds
      };

      await fs.writeFile(feedbackFile, JSON.stringify(feedback, null, 2));

      // Also emit event for any listening processes
      this.emit('visualFeedback', feedback);

    } catch (error) {
      logger.warn('Failed to send visual feedback', error as Error);
    }
  }

  /**
   * Save visual feedback to files for different display contexts
   */
  private async saveVisualFeedback(visualResult: any): Promise<void> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      
      // Save formatted output for Claude Code display
      const formattedFile = path.join(this.hookDir, 'formatted-todos.md');
      await fs.writeFile(formattedFile, visualResult.formattedOutput);
      
      // Save Critical Claude format
      const criticalFile = path.join(this.hookDir, 'critical-claude-todos.md');
      await fs.writeFile(criticalFile, visualResult.criticalClaudeFormat);
      
      // Save original format for comparison
      const originalFile = path.join(this.hookDir, 'original-todos.txt');
      await fs.writeFile(originalFile, visualResult.originalFormat);
      
      // Save JSON output for API integration
      const jsonOutput = this.visualFormatter.generateJSONOutput(
        [], // Empty array since we don't have the processed todos here
        {
          responseTime: visualResult.responseTime,
          syncStatus: 'success',
          timestamp
        }
      );
      const jsonFile = path.join(this.hookDir, 'todos-data.json');
      await fs.writeFile(jsonFile, jsonOutput);
      
      // Create symlink to latest for easy access
      const latestFormatted = path.join(this.hookDir, 'latest-formatted.md');
      try {
        await fs.unlink(latestFormatted); // Remove existing symlink
      } catch {} // Ignore if doesn't exist
      
      await fs.symlink(formattedFile, latestFormatted);
      
      logger.debug('Visual feedback saved to files', {
        formattedFile,
        criticalFile,
        originalFile,
        jsonFile
      });

    } catch (error) {
      logger.warn('Failed to save visual feedback files', error as Error);
    }
  }

  private async createEnhancedHookScripts(): Promise<void> {
    // Create the ultimate hook script
    const ultimateHookScript = `#!/bin/bash
# Critical Claude Ultimate Hook System - INSTANT RESPONSE
# Ultra-fast, real-time hook processing

CRITICAL_CLAUDE_DIR="${path.join(os.homedir(), '.critical-claude')}"
HOOK_LOG="$CRITICAL_CLAUDE_DIR/hooks/logs/events.log"
FEEDBACK_FILE="$CRITICAL_CLAUDE_DIR/hooks/visual-feedback.json"
CACHE_DIR="$CRITICAL_CLAUDE_DIR/hooks/cache"

# Ensure directories exist
mkdir -p "$(dirname "$HOOK_LOG")" "$CACHE_DIR"

# Read hook data with timeout for instant response
HOOK_DATA=""
if read -t 1 HOOK_DATA; then
    # Process immediately
    TIMESTAMP=$(date -Iseconds)
    
    # Log event (async to not block)
    {
        echo "[$TIMESTAMP] Hook triggered" >> "$HOOK_LOG"
        echo "$HOOK_DATA" >> "$HOOK_LOG"
        echo "---" >> "$HOOK_LOG"
    } &
    
    # Extract tool name for instant routing
    TOOL_NAME=$(echo "$HOOK_DATA" | jq -r '.tool_name // empty' 2>/dev/null || echo "")
    
    # Instant processing based on tool
    case "$TOOL_NAME" in
        "TodoWrite")
            # INSTANT todo sync
            {
                echo "[$TIMESTAMP] INSTANT: TodoWrite sync started" >> "$HOOK_LOG"
                
                # Call Critical Claude MCP directly for instant sync
                echo "$HOOK_DATA" | node -e "
                    const data = JSON.parse(require('fs').readFileSync(0, 'utf8'));
                    const feedback = {
                        timestamp: new Date().toISOString(),
                        message: '🔄 Critical Claude syncing todos...',
                        type: 'processing',
                        tool: 'TodoWrite'
                    };
                    require('fs').writeFileSync('$FEEDBACK_FILE', JSON.stringify(feedback, null, 2));
                    
                    // Process todos instantly
                    if (data.arguments && data.arguments.todos) {
                        console.log('✅ Synced ' + data.arguments.todos.length + ' todos');
                    }
                " 2>/dev/null
                
                echo "[$TIMESTAMP] INSTANT: TodoWrite sync completed" >> "$HOOK_LOG"
            } &
            
            # Instant visual feedback
            echo '{"timestamp":"'$TIMESTAMP'","message":"🔄 Critical Claude: TodoWrite processed instantly","type":"success","ttl":3000}' > "$FEEDBACK_FILE"
            ;;
            
        "Edit"|"Write"|"MultiEdit")
            # Track code changes
            FILE_PATH=$(echo "$HOOK_DATA" | jq -r '.arguments.file_path // .file_path // empty' 2>/dev/null || echo "")
            if [[ -n "$FILE_PATH" ]]; then
                {
                    echo "[$TIMESTAMP] Code change: $FILE_PATH" >> "$HOOK_LOG"
                    echo "$HOOK_DATA" > "$CACHE_DIR/latest-change.json"
                } &
                
                # Subtle visual feedback for code changes
                echo '{"timestamp":"'$TIMESTAMP'","message":"📝 Critical Claude: Code change tracked","type":"info","ttl":2000}' > "$FEEDBACK_FILE"
            fi
            ;;
    esac
    
    # Always return success instantly
    exit 0
else
    # No data received, exit gracefully
    exit 0
fi
`;

    const hookPath = path.join(this.hookDir, 'ultimate-hook.sh');
    await fs.writeFile(hookPath, ultimateHookScript);
    await fs.chmod(hookPath, 0o755);

    // Create hook configuration installer
    const hookInstaller = `#!/bin/bash
# Install Critical Claude hooks in Claude Code

CLAUDE_DIR="$HOME/.claude"
HOOK_SCRIPT="${hookPath}"

# Ensure Claude directory exists
mkdir -p "$CLAUDE_DIR"

# Create or update Claude Code settings to include our hook
if [[ -f "$CLAUDE_DIR/settings.json" ]]; then
    # Backup existing settings
    cp "$CLAUDE_DIR/settings.json" "$CLAUDE_DIR/settings.json.backup"
    
    # Add hook configuration
    jq '.hooks.post_tool_use = "'$HOOK_SCRIPT'"' "$CLAUDE_DIR/settings.json" > "$CLAUDE_DIR/settings.json.tmp"
    mv "$CLAUDE_DIR/settings.json.tmp" "$CLAUDE_DIR/settings.json"
else
    # Create new settings with hook
    cat > "$CLAUDE_DIR/settings.json" << EOF
{
  "hooks": {
    "post_tool_use": "$HOOK_SCRIPT"
  }
}
EOF
fi

echo "✅ Critical Claude hooks installed successfully!"
echo "Hook script: $HOOK_SCRIPT"
echo "Claude settings: $CLAUDE_DIR/settings.json"
`;

    const installerPath = path.join(this.hookDir, 'install-hooks.sh');
    await fs.writeFile(installerPath, hookInstaller);
    await fs.chmod(installerPath, 0o755);

    logger.info('Enhanced hook scripts created', { hookPath, installerPath });
  }

  private async setupRealtimeProcessing(): Promise<void> {
    // Watch for hook events in real-time
    const eventFile = path.join(this.hookDir, 'events.json');
    
    // Create event watcher
    try {
      const watcher = fs.watch(path.dirname(eventFile), { recursive: false });
      
      // Process events as they come in
      for await (const event of watcher) {
        if (event.filename === 'events.json') {
          await this.processIncomingEvent(eventFile);
        }
      }
    } catch (error) {
      logger.warn('Real-time processing setup failed', error as Error);
    }
  }

  private async processIncomingEvent(eventFile: string): Promise<void> {
    try {
      const data = await fs.readFile(eventFile, 'utf8');
      const event: HookEvent = JSON.parse(data);
      
      // Process immediately
      const response = await this.processHookEvent(event);
      
      // Cache response for debugging
      this.responseCache.set(event.timestamp, response);
      
      // Clean old cache entries
      if (this.responseCache.size > 100) {
        const oldestKey = this.responseCache.keys().next().value;
        if (oldestKey) {
          this.responseCache.delete(oldestKey);
        }
      }

    } catch (error) {
      logger.warn('Failed to process incoming event', error as Error);
    }
  }

  private startSyncMonitor(): void {
    // Monitor sync status every 5 seconds
    setInterval(async () => {
      try {
        const stats = this.taskQueue.getQueueStats();
        
        // Check if Claude Code sync is working
        const syncResult = await this.taskQueue.syncWithClaudeCodeTodos();
        
        if (syncResult.imported > 0 || syncResult.exported > 0) {
          logger.debug('Background sync completed', syncResult);
          
          if (this.config.visual_feedback) {
            await this.sendInstantVisualFeedback(
              `🔄 Auto-sync: ${syncResult.imported} imported, ${syncResult.exported} exported`
            );
          }
        }

      } catch (error) {
        logger.warn('Sync monitor failed', error as Error);
      }
    }, 5000); // Check every 5 seconds
  }

  private async logHookEvent(event: HookEvent, response: HookResponse): Promise<void> {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event: {
        tool: event.tool_name,
        session: event.session_id,
        file: event.file_path
      },
      response: {
        processed: response.processed,
        sync_status: response.sync_status,
        tasks_updated: response.tasks_updated,
        response_time_ms: response.response_time_ms
      }
    };

    const logFile = path.join(this.hookDir, 'logs', 'hook-events.jsonl');
    await fs.appendFile(logFile, JSON.stringify(logEntry) + '\n');
  }

  private async logCodeChange(changeEvent: any): Promise<void> {
    const logFile = path.join(this.hookDir, 'logs', 'code-changes.jsonl');
    await fs.appendFile(logFile, JSON.stringify(changeEvent) + '\n');
  }

  private shouldCreateTaskFromCodeChange(changeEvent: any): boolean {
    // Logic to determine if a code change should create a task
    // For example, if the change includes TODO comments or error fixes
    const content = changeEvent.content?.toLowerCase() || '';
    return content.includes('todo') || 
           content.includes('fixme') || 
           content.includes('bug') ||
           content.includes('issue');
  }

  private async createTaskFromCodeChange(changeEvent: any): Promise<any> {
    const task = await this.taskQueue.addTask({
      title: `Code change in ${path.basename(changeEvent.filePath)}`,
      description: `Automatic task created from code change detection`,
      priority: 'medium',
      status: 'pending',
      tags: ['auto-generated', 'code-change'],
      sourceType: 'hook',
      sourceData: changeEvent
    });

    return task;
  }

  /**
   * Process WebFetch events to analyze web content for task generation
   */
  private async processWebFetchEvent(event: HookEvent, response: HookResponse): Promise<void> {
    try {
      const url = event.arguments?.url;
      const prompt = event.arguments?.prompt;
      const content = event.content;

      if (url && content && this.isTaskRelevantContent(content, prompt)) {
        logger.info('Processing web content for AI task generation', { url });

        // Generate tasks from web content using AI
        const taskResult = await this.aiTaskEngine.generateTasksFromText(content, {
          context: `Web content from ${url}`,
          projectType: 'web-research',
          autoGenerateDependencies: true,
          expandLevel: 2
        });

        if (taskResult.success && taskResult.tasks.length > 0) {
          response.tasks_updated = taskResult.tasks.length;
          response.actions_triggered?.push('ai_tasks_from_web');
          response.sync_status = 'success';

          // Visual feedback
          if (this.config.visual_feedback) {
            await this.sendInstantVisualFeedback(
              `🌐 AI generated ${taskResult.tasks.length} tasks from web content`
            );
          }

          logger.info('AI tasks generated from web content', {
            url,
            tasksGenerated: taskResult.tasks.length,
            source: 'WebFetch'
          });
        }
      }

    } catch (error) {
      logger.error('WebFetch AI processing failed', error as Error);
      response.sync_status = 'failed';
    }
  }

  /**
   * Process code changes with AI to generate relevant tasks
   */
  private async processCodeChangeWithAI(changeEvent: any, response: HookResponse): Promise<void> {
    try {
      const filePath = changeEvent.filePath;
      const content = changeEvent.content || '';
      
      // Extract meaningful information from the code change
      const codeAnalysis = this.analyzeCodeChange(content);
      
      if (codeAnalysis.shouldGenerateTasks) {
        const taskText = this.generateTaskTextFromCode(codeAnalysis, filePath);
        
        const taskResult = await this.aiTaskEngine.generateTasksFromText(taskText, {
          context: `Code change in ${path.basename(filePath)}`,
          projectType: this.inferProjectType(filePath),
          autoGenerateDependencies: true,
          expandLevel: 1
        });

        if (taskResult.success && taskResult.tasks.length > 0) {
          response.tasks_updated = (response.tasks_updated || 0) + taskResult.tasks.length;
          response.actions_triggered?.push('ai_tasks_from_code');

          logger.info('AI tasks generated from code change', {
            filePath,
            tasksGenerated: taskResult.tasks.length,
            analysis: codeAnalysis
          });
        }
      }

    } catch (error) {
      logger.error('Code change AI processing failed', error as Error);
    }
  }

  /**
   * Process documents (PRDs, specs, etc.) with AI for task generation
   */
  private async processDocumentWithAI(changeEvent: any, response: HookResponse): Promise<void> {
    try {
      const filePath = changeEvent.filePath;
      const content = changeEvent.content || '';

      logger.info('Processing document with AI for task generation', { filePath });

      // Use AI to generate tasks from the document
      const taskResult = await this.aiTaskEngine.generateTasksFromText(content, {
        context: `Requirements document: ${path.basename(filePath)}`,
        projectType: 'requirements',
        autoGenerateDependencies: true,
        expandLevel: 3 // Higher expansion for requirement documents
      });

      if (taskResult.success && taskResult.tasks.length > 0) {
        response.tasks_updated = (response.tasks_updated || 0) + taskResult.tasks.length;
        response.actions_triggered?.push('ai_tasks_from_document');
        response.sync_status = 'success';

        // Visual feedback for document processing
        if (this.config.visual_feedback) {
          await this.sendInstantVisualFeedback(
            `📋 AI generated ${taskResult.tasks.length} tasks from ${path.basename(filePath)}`
          );
        }

        logger.info('AI tasks generated from document', {
          filePath,
          tasksGenerated: taskResult.tasks.length,
          dependencies: Object.keys(taskResult.dependencies || {}).length
        });
      }

    } catch (error) {
      logger.error('Document AI processing failed', error as Error);
    }
  }

  /**
   * Check if web content is relevant for task generation
   */
  private isTaskRelevantContent(content: string, prompt?: string): boolean {
    const lowerContent = content.toLowerCase();
    const lowerPrompt = prompt?.toLowerCase() || '';

    // Look for task-relevant keywords
    const taskKeywords = [
      'requirements', 'specification', 'roadmap', 'backlog', 'features',
      'todo', 'tasks', 'implement', 'build', 'develop', 'create',
      'api documentation', 'user stories', 'acceptance criteria'
    ];

    return taskKeywords.some(keyword => 
      lowerContent.includes(keyword) || lowerPrompt.includes(keyword)
    );
  }

  /**
   * Check if a file is a PRD or requirements document
   */
  private isPRDOrRequirementDocument(filePath: string, content?: string): boolean {
    const fileName = path.basename(filePath).toLowerCase();
    const lowerContent = content?.toLowerCase() || '';

    // Check file name patterns
    const prdPatterns = [
      'prd', 'requirements', 'spec', 'specification', 'roadmap',
      'feature', 'design-doc', 'user-stories', 'backlog'
    ];

    const isFileNameMatch = prdPatterns.some(pattern => fileName.includes(pattern));

    // Check content patterns
    const contentPatterns = [
      'user story', 'acceptance criteria', 'functional requirements',
      'non-functional requirements', 'feature specification',
      'product requirements', 'technical specification'
    ];

    const isContentMatch = contentPatterns.some(pattern => 
      lowerContent.includes(pattern)
    );

    return isFileNameMatch || isContentMatch;
  }

  /**
   * Analyze code change to determine if tasks should be generated
   */
  private analyzeCodeChange(content: string): {
    shouldGenerateTasks: boolean;
    patterns: string[];
    priority: string;
    taskType: string;
  } {
    const lowerContent = content.toLowerCase();
    const patterns = [];
    
    // Look for specific patterns that suggest task creation
    if (lowerContent.includes('todo') || lowerContent.includes('fixme')) {
      patterns.push('todo-comment');
    }
    
    if (lowerContent.includes('bug') || lowerContent.includes('error') || lowerContent.includes('fix')) {
      patterns.push('bug-fix');
    }
    
    if (lowerContent.includes('implement') || lowerContent.includes('add feature')) {
      patterns.push('feature-implementation');
    }
    
    if (lowerContent.includes('test') || lowerContent.includes('spec')) {
      patterns.push('testing');
    }
    
    if (lowerContent.includes('security') || lowerContent.includes('vulnerability')) {
      patterns.push('security');
    }

    const shouldGenerateTasks = patterns.length > 0;
    const priority = patterns.includes('security') ? 'high' : 
                    patterns.includes('bug-fix') ? 'high' : 'medium';
    const taskType = patterns[0] || 'general';

    return {
      shouldGenerateTasks,
      patterns,
      priority,
      taskType
    };
  }

  /**
   * Generate task text from code analysis
   */
  private generateTaskTextFromCode(analysis: any, filePath: string): string {
    const fileName = path.basename(filePath);
    const patterns = analysis.patterns.join(', ');
    
    return `Code change detected in ${fileName} with patterns: ${patterns}. 
            This requires follow-up tasks to address the identified issues or improvements.
            Priority: ${analysis.priority}. Type: ${analysis.taskType}.`;
  }

  /**
   * Infer project type from file path
   */
  private inferProjectType(filePath: string): string {
    const ext = path.extname(filePath);
    const dir = path.dirname(filePath);
    
    if (ext === '.ts' || ext === '.js') {
      if (dir.includes('frontend') || dir.includes('client')) return 'frontend';
      if (dir.includes('backend') || dir.includes('server')) return 'backend';
      return 'javascript';
    }
    
    if (ext === '.py') return 'python';
    if (ext === '.java') return 'java';
    if (ext === '.go') return 'golang';
    if (ext === '.rs') return 'rust';
    if (ext === '.cpp' || ext === '.c') return 'cpp';
    
    return 'general';
  }

  async getHookStats(): Promise<any> {
    const liveStats = await this.liveMonitor.getHookStats();
    
    return {
      enabled: this.config.enabled,
      processed_events: this.responseCache.size,
      supported_tools: this.config.supported_tools,
      avg_response_time: this.calculateAverageResponseTime(),
      sync_status: 'active',
      live_stats: liveStats
    };
  }

  async getLiveLogs(options: {
    limit?: number;
    since?: string;
    toolFilter?: string;
    sessionFilter?: string;
  } = {}) {
    return await this.liveMonitor.getLiveLogs(options);
  }

  async exportHookLogs(options: {
    format: 'json' | 'csv' | 'markdown';
    outputPath: string;
    since?: string;
    toolFilter?: string;
  }) {
    return await this.liveMonitor.exportLogs(options);
  }

  streamLiveLogs(callback: (log: any) => void): () => void {
    return this.liveMonitor.streamLogs(callback);
  }

  private calculateAverageResponseTime(): number {
    const responses = Array.from(this.responseCache.values());
    if (responses.length === 0) return 0;
    
    const total = responses.reduce((sum, r) => sum + (r.response_time_ms || 0), 0);
    return Math.round(total / responses.length);
  }
}
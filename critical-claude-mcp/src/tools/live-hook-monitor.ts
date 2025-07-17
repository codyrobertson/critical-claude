/**
 * Live Hook Monitor - Real-time hook event streaming and logging
 * Provides live monitoring of all hook events with real-time updates
 */

import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { EventEmitter } from 'events';
import { logger } from '../logger.js';

export interface HookLogEntry {
  timestamp: string;
  event_id: string;
  tool_name: string;
  session_id?: string;
  file_path?: string;
  response_time_ms?: number;
  sync_status?: 'success' | 'failed' | 'partial';
  tasks_updated?: number;
  actions_triggered?: string[];
  visual_feedback?: string;
  raw_event?: any;
}

export interface LiveMonitorConfig {
  maxLogEntries: number;
  logRetentionHours: number;
  enableRealTimeStream: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

export class LiveHookMonitor extends EventEmitter {
  private config: LiveMonitorConfig;
  private logBuffer: HookLogEntry[] = [];
  private logFile: string;
  private streamFile: string;
  private isStreaming: boolean = false;
  private cleanupInterval?: NodeJS.Timeout;

  constructor(config: Partial<LiveMonitorConfig> = {}) {
    super();
    
    this.config = {
      maxLogEntries: 1000,
      logRetentionHours: 24,
      enableRealTimeStream: true,
      logLevel: 'info',
      ...config
    };

    const hookDir = path.join(os.homedir(), '.critical-claude', 'hooks');
    this.logFile = path.join(hookDir, 'live-monitor.jsonl');
    this.streamFile = path.join(hookDir, 'live-stream.json');
  }

  async initialize(): Promise<void> {
    try {
      // Ensure directories exist
      await fs.mkdir(path.dirname(this.logFile), { recursive: true });

      // Load existing logs
      await this.loadExistingLogs();

      // Start real-time streaming if enabled
      if (this.config.enableRealTimeStream) {
        await this.startRealTimeStream();
      }

      // Setup cleanup interval
      this.setupCleanup();

      logger.info('Live hook monitor initialized', {
        maxLogEntries: this.config.maxLogEntries,
        logFile: this.logFile,
        streamingEnabled: this.config.enableRealTimeStream
      });

    } catch (error) {
      logger.error('Failed to initialize live hook monitor', error as Error);
      throw error;
    }
  }

  async logHookEvent(entry: Partial<HookLogEntry>): Promise<void> {
    const logEntry: HookLogEntry = {
      timestamp: new Date().toISOString(),
      event_id: `hook-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      tool_name: entry.tool_name || 'unknown',
      session_id: entry.session_id,
      file_path: entry.file_path,
      response_time_ms: entry.response_time_ms,
      sync_status: entry.sync_status,
      tasks_updated: entry.tasks_updated,
      actions_triggered: entry.actions_triggered,
      visual_feedback: entry.visual_feedback,
      raw_event: entry.raw_event
    };

    // Add to buffer
    this.logBuffer.push(logEntry);

    // Maintain buffer size
    if (this.logBuffer.length > this.config.maxLogEntries) {
      this.logBuffer = this.logBuffer.slice(-this.config.maxLogEntries);
    }

    // Write to persistent log
    await this.appendToPersistentLog(logEntry);

    // Update real-time stream
    if (this.config.enableRealTimeStream) {
      await this.updateRealTimeStream();
    }

    // Emit event for subscribers
    this.emit('hookEvent', logEntry);

    logger.debug('Hook event logged', { 
      eventId: logEntry.event_id, 
      tool: logEntry.tool_name,
      responseTime: logEntry.response_time_ms 
    });
  }

  async getLiveLogs(options: {
    limit?: number;
    since?: string;
    toolFilter?: string;
    sessionFilter?: string;
  } = {}): Promise<HookLogEntry[]> {
    let logs = [...this.logBuffer];

    // Apply filters
    if (options.since) {
      const sinceTime = new Date(options.since).getTime();
      logs = logs.filter(log => new Date(log.timestamp).getTime() >= sinceTime);
    }

    if (options.toolFilter) {
      logs = logs.filter(log => log.tool_name === options.toolFilter);
    }

    if (options.sessionFilter) {
      logs = logs.filter(log => log.session_id === options.sessionFilter);
    }

    // Apply limit
    if (options.limit) {
      logs = logs.slice(-options.limit);
    }

    return logs.reverse(); // Most recent first
  }

  async getHookStats(): Promise<{
    totalEvents: number;
    recentEvents: number;
    averageResponseTime: number;
    toolBreakdown: Record<string, number>;
    successRate: number;
    lastEventTime?: string;
  }> {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);

    const recentLogs = this.logBuffer.filter(log => 
      new Date(log.timestamp).getTime() >= oneHourAgo
    );

    const successfulEvents = recentLogs.filter(log => 
      log.sync_status === 'success'
    ).length;

    const totalResponseTime = recentLogs.reduce((sum, log) => 
      sum + (log.response_time_ms || 0), 0
    );

    const toolBreakdown: Record<string, number> = {};
    recentLogs.forEach(log => {
      toolBreakdown[log.tool_name] = (toolBreakdown[log.tool_name] || 0) + 1;
    });

    return {
      totalEvents: this.logBuffer.length,
      recentEvents: recentLogs.length,
      averageResponseTime: recentLogs.length > 0 ? 
        Math.round(totalResponseTime / recentLogs.length) : 0,
      toolBreakdown,
      successRate: recentLogs.length > 0 ? 
        Math.round((successfulEvents / recentLogs.length) * 100) : 0,
      lastEventTime: this.logBuffer.length > 0 ? 
        this.logBuffer[this.logBuffer.length - 1].timestamp : undefined
    };
  }

  async exportLogs(options: {
    format: 'json' | 'csv' | 'markdown';
    outputPath: string;
    since?: string;
    toolFilter?: string;
  }): Promise<void> {
    const logs = await this.getLiveLogs({
      since: options.since,
      toolFilter: options.toolFilter
    });

    let content: string;

    switch (options.format) {
      case 'json':
        content = JSON.stringify(logs, null, 2);
        break;

      case 'csv':
        const headers = ['timestamp', 'tool_name', 'session_id', 'response_time_ms', 
                        'sync_status', 'tasks_updated', 'actions_triggered'];
        const csvRows = logs.map(log => 
          headers.map(header => {
            const value = log[header as keyof HookLogEntry];
            return Array.isArray(value) ? value.join(';') : (value || '');
          }).join(',')
        );
        content = [headers.join(','), ...csvRows].join('\n');
        break;

      case 'markdown':
        content = '# Hook Event Log\n\n';
        content += `Generated: ${new Date().toISOString()}\n\n`;
        content += '| Time | Tool | Session | Response (ms) | Status | Tasks Updated |\n';
        content += '|------|------|---------|---------------|--------|---------------|\n';
        logs.forEach(log => {
          const time = new Date(log.timestamp).toLocaleTimeString();
          content += `| ${time} | ${log.tool_name} | ${log.session_id || '-'} | `;
          content += `${log.response_time_ms || '-'} | ${log.sync_status || '-'} | `;
          content += `${log.tasks_updated || 0} |\n`;
        });
        break;

      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }

    await fs.writeFile(options.outputPath, content);
    logger.info('Hook logs exported', { 
      format: options.format, 
      outputPath: options.outputPath,
      logCount: logs.length 
    });
  }

  private async loadExistingLogs(): Promise<void> {
    try {
      const content = await fs.readFile(this.logFile, 'utf8');
      const lines = content.trim().split('\n').filter(line => line.length > 0);
      
      // Load recent logs up to maxLogEntries
      const recentLines = lines.slice(-this.config.maxLogEntries);
      
      for (const line of recentLines) {
        try {
          const entry = JSON.parse(line);
          this.logBuffer.push(entry);
        } catch {
          // Skip invalid JSON lines
        }
      }

      logger.info('Existing logs loaded', { count: this.logBuffer.length });
    } catch {
      // No existing log file, start fresh
      logger.info('No existing logs found, starting fresh');
    }
  }

  private async appendToPersistentLog(entry: HookLogEntry): Promise<void> {
    try {
      const logLine = JSON.stringify(entry) + '\n';
      await fs.appendFile(this.logFile, logLine);
    } catch (error) {
      logger.warn('Failed to append to persistent log', error as Error);
    }
  }

  private async startRealTimeStream(): Promise<void> {
    this.isStreaming = true;
    await this.updateRealTimeStream();
    logger.info('Real-time stream started', { streamFile: this.streamFile });
  }

  private async updateRealTimeStream(): Promise<void> {
    if (!this.isStreaming) return;

    try {
      const streamData = {
        lastUpdated: new Date().toISOString(),
        recentEvents: this.logBuffer.slice(-50), // Last 50 events
        stats: await this.getHookStats(),
        isLive: true
      };

      await fs.writeFile(this.streamFile, JSON.stringify(streamData, null, 2));
    } catch (error) {
      logger.warn('Failed to update real-time stream', error as Error);
    }
  }

  private setupCleanup(): void {
    // Clean up old logs every hour
    this.cleanupInterval = setInterval(async () => {
      await this.cleanupOldLogs();
    }, 60 * 60 * 1000); // 1 hour
  }

  private async cleanupOldLogs(): Promise<void> {
    try {
      const cutoffTime = Date.now() - (this.config.logRetentionHours * 60 * 60 * 1000);
      
      // Filter in-memory buffer
      this.logBuffer = this.logBuffer.filter(log => 
        new Date(log.timestamp).getTime() >= cutoffTime
      );

      // Rewrite persistent log file with current buffer
      const logContent = this.logBuffer.map(entry => JSON.stringify(entry)).join('\n');
      if (logContent) {
        await fs.writeFile(this.logFile, logContent + '\n');
      }

      logger.info('Old logs cleaned up', { 
        retainedEntries: this.logBuffer.length,
        cutoffHours: this.config.logRetentionHours 
      });
    } catch (error) {
      logger.warn('Failed to cleanup old logs', error as Error);
    }
  }

  async shutdown(): Promise<void> {
    this.isStreaming = false;
    
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    // Final cleanup
    await this.cleanupOldLogs();
    
    logger.info('Live hook monitor shutdown');
  }

  // Stream logs in real-time (for UI consumption)
  streamLogs(callback: (log: HookLogEntry) => void): () => void {
    this.on('hookEvent', callback);
    
    // Return unsubscribe function
    return () => {
      this.off('hookEvent', callback);
    };
  }
}
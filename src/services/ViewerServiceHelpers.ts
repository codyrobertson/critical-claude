/**
 * Helper methods for ViewerService that were missing from the main implementation
 */

import { Task } from '../models/index.js';
import { logger } from '../utils/Logger.js';

export class ViewerHelpers {
  static getErrorMessage(error: any): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return String(error);
  }

  static getDisplayLength(text: string): number {
    // Remove ANSI escape sequences to get actual display length
    return text.replace(/\x1b\[[0-9;]*m/g, '').length;
  }

  static wrapText(text: string, maxWidth: number): string[] {
    const lines: string[] = [];
    const paragraphs = text.split('\n');
    
    for (const paragraph of paragraphs) {
      if (paragraph.trim() === '') {
        lines.push('');
        continue;
      }
      
      const words = paragraph.split(' ');
      let currentLine = '  '; // Indent description content
      
      for (const word of words) {
        if (currentLine.length + word.length + 1 > maxWidth) {
          if (currentLine.trim()) {
            lines.push(currentLine);
            currentLine = '  ' + word;
          } else {
            // Single word too long, just add it
            lines.push('  ' + word);
            currentLine = '  ';
          }
        } else {
          currentLine += (currentLine.trim() ? ' ' : '') + word;
        }
      }
      
      if (currentLine.trim()) {
        lines.push(currentLine);
      }
    }
    
    return lines;
  }

  static renderDetailLineWithHighlighting(line: string, maxWidth: number): string {
    // Apply markdown-style highlighting
    let processedLine = line;
    
    // Headers (# ## ###)
    if (processedLine.match(/^(\s*)#{1,3}\s/)) {
      processedLine = processedLine.replace(/^(\s*)(#{1,3})\s(.+)/, '$1\x1b[1m\x1b[36m$2 $3\x1b[0m');
    }
    
    // Bold (**text**)
    processedLine = processedLine.replace(/\*\*([^*]+)\*\*/g, '\x1b[1m$1\x1b[0m');
    
    // Italic (*text*)
    processedLine = processedLine.replace(/\*([^*]+)\*/g, '\x1b[3m$1\x1b[0m');
    
    // Inline code (`code`)
    processedLine = processedLine.replace(/`([^`]+)`/g, '\x1b[100m\x1b[37m$1\x1b[0m');
    
    // Truncate if still too long after processing
    if (this.getDisplayLength(processedLine) > maxWidth) {
      // Find a good truncation point that doesn't break escape sequences
      let truncated = processedLine;
      while (this.getDisplayLength(truncated) > maxWidth - 3) {
        truncated = truncated.slice(0, -1);
      }
      processedLine = truncated + '...';
    }
    
    return processedLine;
  }

  static getTaskDetailLines(task: Task): string[] {
    const lines = [
      `TITLE: ${task.title}`,
      `STATUS: ${task.status}`,
      `PRIORITY: ${task.priority}`,
      '',
      'DESCRIPTION:',
      ...(task.description ? this.wrapText(task.description, 50) : ['  No description']),
      ''
    ];
    
    if (task.assignee) {
      lines.push(`ASSIGNEE: ${task.assignee}`);
    }
    
    if (task.labels && task.labels.length > 0) {
      lines.push(`LABELS: ${task.labels.join(', ')}`);
    }
    
    if (task.estimatedHours) {
      lines.push(`ESTIMATED HOURS: ${task.estimatedHours}`);
    }
    
    lines.push('');
    lines.push(`CREATED: ${new Date(task.createdAt).toLocaleDateString()}`);
    lines.push(`UPDATED: ${new Date(task.updatedAt).toLocaleDateString()}`);
    
    return lines;
  }
}
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

  // Helper method for truncating text while preserving ANSI escape sequences
  static truncateWithAnsi(text: string, maxLength: number): string {
    let result = '';
    let displayLength = 0;
    let i = 0;
    
    while (i < text.length && displayLength < maxLength) {
      if (text[i] === '\x1b' && text[i + 1] === '[') {
        // Find the end of the ANSI sequence
        let j = i + 2;
        while (j < text.length && !/[a-zA-Z]/.test(text[j])) {
          j++;
        }
        if (j < text.length) {
          j++; // Include the ending character
        }
        result += text.slice(i, j);
        i = j;
      } else {
        result += text[i];
        displayLength++;
        i++;
      }
    }
    
    return result;
  }

  // Enhanced status display with icons
  static getStatusWithIcon(status: string): string {
    const statusMap = {
      todo: '\x1b[37m○ Todo\x1b[0m',
      in_progress: '\x1b[33m● In Progress\x1b[0m',
      done: '\x1b[32m✓ Done\x1b[0m',
      blocked: '\x1b[31m⊘ Blocked\x1b[0m',
      archived: '\x1b[90m□ Archived\x1b[0m'
    };
    return statusMap[status as keyof typeof statusMap] || `\x1b[90m? ${status}\x1b[0m`;
  }

  // Enhanced priority display with icons
  static getPriorityWithIcon(priority: string): string {
    const priorityMap = {
      critical: '\x1b[91m⚠ Critical\x1b[0m',
      high: '\x1b[93m⬆ High\x1b[0m',
      medium: '\x1b[96m⭕ Medium\x1b[0m',
      low: '\x1b[90m⬇ Low\x1b[0m'
    };
    return priorityMap[priority as keyof typeof priorityMap] || `\x1b[90m? ${priority}\x1b[0m`;
  }

  // Format dates in a more human-readable way
  static formatRelativeDate(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 1) {
      return 'Just now';
    } else if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  static getDisplayLength(text: string): number {
    // Remove ANSI escape sequences to get actual display length
    return text.replace(/\x1b\[[0-9;]*m/g, '').length;
  }

  static wrapText(text: string, maxWidth: number): string[] {
    const lines: string[] = [];
    const paragraphs = text.split('\n');
    
    // Responsive width adjustment
    const actualMaxWidth = Math.max(20, maxWidth - 2); // Ensure minimum readable width
    
    for (const paragraph of paragraphs) {
      if (paragraph.trim() === '') {
        lines.push('');
        continue;
      }
      
      // Handle very long words (URLs, code, etc.) specially
      const words = paragraph.split(' ');
      let currentLine = '  '; // Indent description content
      
      for (const word of words) {
        const wordLength = this.getDisplayLength(word);
        const currentLineLength = this.getDisplayLength(currentLine);
        
        // If adding this word would exceed width
        if (currentLineLength + wordLength + 1 > actualMaxWidth) {
          if (currentLine.trim()) {
            lines.push(currentLine);
            
            // Handle very long words that don't fit on their own line
            if (wordLength > actualMaxWidth - 2) {
              const chunks = this.breakLongWord(word, actualMaxWidth - 2);
              for (let i = 0; i < chunks.length; i++) {
                if (i === 0) {
                  currentLine = '  ' + chunks[i];
                } else {
                  lines.push('  ' + chunks[i]);
                  currentLine = '  ';
                }
              }
            } else {
              currentLine = '  ' + word;
            }
          } else {
            // Current line is just indent, handle long word
            if (wordLength > actualMaxWidth - 2) {
              const chunks = this.breakLongWord(word, actualMaxWidth - 2);
              chunks.forEach(chunk => lines.push('  ' + chunk));
              currentLine = '  ';
            } else {
              lines.push('  ' + word);
              currentLine = '  ';
            }
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

  // Break long words intelligently (preserving URLs, code, etc.)
  static breakLongWord(word: string, maxLength: number): string[] {
    if (word.length <= maxLength) {
      return [word];
    }
    
    const chunks: string[] = [];
    let current = word;
    
    // Try to break at natural points first (- _ . /)
    const breakChars = ['-', '_', '.', '/', '=', '&', '?'];
    
    while (current.length > maxLength) {
      let breakPoint = -1;
      
      // Find the last natural break point within maxLength
      for (let i = maxLength - 1; i >= Math.floor(maxLength * 0.7); i--) {
        if (breakChars.includes(current[i])) {
          breakPoint = i + 1; // Break after the character
          break;
        }
      }
      
      if (breakPoint === -1) {
        // No natural break point, force break
        breakPoint = maxLength;
      }
      
      chunks.push(current.substring(0, breakPoint));
      current = current.substring(breakPoint);
    }
    
    if (current) {
      chunks.push(current);
    }
    
    return chunks;
  }

  static renderDetailLineWithHighlighting(line: string, maxWidth: number): string {
    // Enhanced markdown-style highlighting with more features
    let processedLine = line;
    
    // Headers (# ## ### #### ##### ######) with different colors per level
    if (processedLine.match(/^(\s*)#{1,6}\s/)) {
      processedLine = processedLine.replace(/^(\s*)(#{1})\s(.+)/, '$1\x1b[1m\x1b[95m$2 $3\x1b[0m'); // Bright magenta for H1
      processedLine = processedLine.replace(/^(\s*)(#{2})\s(.+)/, '$1\x1b[1m\x1b[94m$2 $3\x1b[0m'); // Bright blue for H2
      processedLine = processedLine.replace(/^(\s*)(#{3})\s(.+)/, '$1\x1b[1m\x1b[96m$2 $3\x1b[0m'); // Bright cyan for H3
      processedLine = processedLine.replace(/^(\s*)(#{4,6})\s(.+)/, '$1\x1b[1m\x1b[93m$2 $3\x1b[0m'); // Bright yellow for H4-H6
    }
    
    // Bold (**text** or __text__) with bright white
    processedLine = processedLine.replace(/\*\*([^*]+)\*\*/g, '\x1b[1m\x1b[97m$1\x1b[0m');
    processedLine = processedLine.replace(/__([^_]+)__/g, '\x1b[1m\x1b[97m$1\x1b[0m');
    
    // Italic (*text* or _text_) with light gray
    processedLine = processedLine.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '\x1b[3m\x1b[37m$1\x1b[0m');
    processedLine = processedLine.replace(/(?<!_)_([^_]+)_(?!_)/g, '\x1b[3m\x1b[37m$1\x1b[0m');
    
    // Inline code (`code`) with dark background and bright text
    processedLine = processedLine.replace(/`([^`]+)`/g, '\x1b[40m\x1b[93m $1 \x1b[0m');
    
    // Links [text](url) with underline and cyan color
    processedLine = processedLine.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '\x1b[4m\x1b[36m$1\x1b[0m');
    
    // Strikethrough (~~text~~) with dim and strikethrough
    processedLine = processedLine.replace(/~~([^~]+)~~/g, '\x1b[2m\x1b[9m$1\x1b[0m');
    
    // List items (- or * or +) with bullet styling
    if (processedLine.match(/^(\s*)[-*+]\s/)) {
      processedLine = processedLine.replace(/^(\s*)[-*+]\s/, '$1\x1b[33m•\x1b[0m ');
    }
    
    // Numbered lists (1. 2. etc.) with number styling
    if (processedLine.match(/^(\s*)\d+\.\s/)) {
      processedLine = processedLine.replace(/^(\s*)(\d+)\.(\s)/, '$1\x1b[33m$2.\x1b[0m$3');
    }
    
    // Block quotes (>) with left border styling
    if (processedLine.match(/^(\s*)>\s/)) {
      processedLine = processedLine.replace(/^(\s*)>\s(.+)/, '$1\x1b[90m│\x1b[0m \x1b[3m\x1b[37m$2\x1b[0m');
    }
    
    // Horizontal rules (--- or ***)
    if (processedLine.match(/^(\s*)(-{3,}|\*{3,})\s*$/)) {
      processedLine = processedLine.replace(/^(\s*)(-{3,}|\*{3,})\s*$/, '$1\x1b[90m' + '─'.repeat(Math.min(maxWidth - 2, 40)) + '\x1b[0m');
    }
    
    // Truncate if still too long after processing, preserving ANSI codes
    if (this.getDisplayLength(processedLine) > maxWidth) {
      processedLine = this.truncateWithAnsi(processedLine, maxWidth - 3) + '\x1b[90m...\x1b[0m';
    }
    
    return processedLine;
  }

  static getTaskDetailLines(task: Task, maxWidth: number = 50): string[] {
    // Responsive width calculation
    const detailWidth = Math.max(30, Math.min(maxWidth, 80));
    
    const lines = [
      `\x1b[1m\x1b[97mTITLE:\x1b[0m ${task.title}`,
      `\x1b[1m\x1b[93mSTATUS:\x1b[0m ${this.getStatusWithIcon(task.status)}`,
      `\x1b[1m\x1b[95mPRIORITY:\x1b[0m ${this.getPriorityWithIcon(task.priority)}`,
      '',
      '\x1b[1m\x1b[96mDESCRIPTION:\x1b[0m',
      ...(task.description ? this.wrapText(task.description, detailWidth) : ['  \x1b[90mNo description\x1b[0m']),
      ''
    ];
    
    if (task.assignee) {
      lines.push(`\x1b[1m\x1b[36mASSIGNEE:\x1b[0m @${task.assignee}`);
    }
    
    if (task.labels && task.labels.length > 0) {
      // Responsive label display - wrap long label lists
      const labelText = task.labels.map(label => `\x1b[33m#${label}\x1b[0m`).join(' ');
      if (this.getDisplayLength(labelText) > detailWidth - 10) {
        lines.push('\x1b[1m\x1b[92mLABELS:\x1b[0m');
        const wrappedLabels = this.wrapText(task.labels.map(l => `#${l}`).join(' '), detailWidth);
        lines.push(...wrappedLabels.map(line => `  \x1b[33m${line.trim()}\x1b[0m`));
      } else {
        lines.push(`\x1b[1m\x1b[92mLABELS:\x1b[0m ${labelText}`);
      }
    }
    
    if (task.estimatedHours) {
      lines.push(`\x1b[1m\x1b[94mESTIMATED HOURS:\x1b[0m ${task.estimatedHours}`);
    }
    
    lines.push('');
    
    // Enhanced date formatting with responsive layout
    const createdDate = new Date(task.createdAt);
    const updatedDate = new Date(task.updatedAt);
    const now = new Date();
    const isRecent = (now.getTime() - updatedDate.getTime()) < 86400000; // 24 hours
    
    const createdText = this.formatRelativeDate(createdDate);
    const updatedText = this.formatRelativeDate(updatedDate);
    
    if (detailWidth < 50) {
      // Compact layout for narrow displays
      lines.push(`\x1b[1m\x1b[90mCREATED:\x1b[0m ${createdText}`);
      lines.push(`\x1b[1m\x1b[90mUPDATED:\x1b[0m ${updatedText}${isRecent ? ' •' : ''}`);
    } else {
      // Full layout for wider displays
      lines.push(`\x1b[1m\x1b[90mCREATED:\x1b[0m ${createdText}`);
      lines.push(`\x1b[1m\x1b[90mUPDATED:\x1b[0m ${updatedText}${isRecent ? ' \x1b[92m• Recent\x1b[0m' : ''}`);
    }
    
    if (task.id && detailWidth > 40) {
      lines.push('');
      lines.push(`\x1b[90mID: ${task.id}\x1b[0m`);
    }
    
    return lines;
  }
}
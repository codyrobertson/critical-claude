/**
 * Vim Keybindings
 * Implements vim-style keyboard navigation and commands
 */

import { KeyModifiers } from '../views/IView.js';

export type VimMode = 'normal' | 'insert' | 'visual' | 'command';

export interface VimCommand {
  keys: string[];
  mode: VimMode[];
  action: string;
  description: string;
}

export interface VimState {
  mode: VimMode;
  commandBuffer: string;
  count: number;
  register: string;
  lastCommand?: VimCommand;
  visualStart?: { line: number; column: number };
  visualEnd?: { line: number; column: number };
}

export class VimKeybindings {
  private state: VimState = {
    mode: 'normal',
    commandBuffer: '',
    count: 0,
    register: '"'
  };

  private commands: VimCommand[] = [
    // Movement commands
    { keys: ['h'], mode: ['normal', 'visual'], action: 'move-left', description: 'Move left' },
    { keys: ['j'], mode: ['normal', 'visual'], action: 'move-down', description: 'Move down' },
    { keys: ['k'], mode: ['normal', 'visual'], action: 'move-up', description: 'Move up' },
    { keys: ['l'], mode: ['normal', 'visual'], action: 'move-right', description: 'Move right' },
    
    { keys: ['w'], mode: ['normal', 'visual'], action: 'move-word-forward', description: 'Move word forward' },
    { keys: ['b'], mode: ['normal', 'visual'], action: 'move-word-backward', description: 'Move word backward' },
    { keys: ['e'], mode: ['normal', 'visual'], action: 'move-word-end', description: 'Move to word end' },
    
    { keys: ['0'], mode: ['normal', 'visual'], action: 'move-line-start', description: 'Move to line start' },
    { keys: ['$'], mode: ['normal', 'visual'], action: 'move-line-end', description: 'Move to line end' },
    { keys: ['^'], mode: ['normal', 'visual'], action: 'move-first-non-blank', description: 'Move to first non-blank' },
    
    { keys: ['g', 'g'], mode: ['normal', 'visual'], action: 'move-file-start', description: 'Move to file start' },
    { keys: ['G'], mode: ['normal', 'visual'], action: 'move-file-end', description: 'Move to file end' },
    
    { keys: ['ctrl+f'], mode: ['normal', 'visual'], action: 'page-down', description: 'Page down' },
    { keys: ['ctrl+b'], mode: ['normal', 'visual'], action: 'page-up', description: 'Page up' },
    { keys: ['ctrl+d'], mode: ['normal', 'visual'], action: 'half-page-down', description: 'Half page down' },
    { keys: ['ctrl+u'], mode: ['normal', 'visual'], action: 'half-page-up', description: 'Half page up' },
    
    // Mode switching
    { keys: ['i'], mode: ['normal'], action: 'enter-insert', description: 'Enter insert mode' },
    { keys: ['a'], mode: ['normal'], action: 'enter-insert-after', description: 'Enter insert mode after cursor' },
    { keys: ['o'], mode: ['normal'], action: 'open-below', description: 'Open line below' },
    { keys: ['O'], mode: ['normal'], action: 'open-above', description: 'Open line above' },
    { keys: ['v'], mode: ['normal'], action: 'enter-visual', description: 'Enter visual mode' },
    { keys: ['V'], mode: ['normal'], action: 'enter-visual-line', description: 'Enter visual line mode' },
    { keys: ['Escape'], mode: ['insert', 'visual', 'command'], action: 'enter-normal', description: 'Enter normal mode' },
    { keys: [':'], mode: ['normal'], action: 'enter-command', description: 'Enter command mode' },
    
    // Editing
    { keys: ['x'], mode: ['normal'], action: 'delete-char', description: 'Delete character' },
    { keys: ['d', 'd'], mode: ['normal'], action: 'delete-line', description: 'Delete line' },
    { keys: ['d', 'w'], mode: ['normal'], action: 'delete-word', description: 'Delete word' },
    { keys: ['c', 'c'], mode: ['normal'], action: 'change-line', description: 'Change line' },
    { keys: ['c', 'w'], mode: ['normal'], action: 'change-word', description: 'Change word' },
    { keys: ['y', 'y'], mode: ['normal'], action: 'yank-line', description: 'Yank line' },
    { keys: ['p'], mode: ['normal'], action: 'paste-after', description: 'Paste after' },
    { keys: ['P'], mode: ['normal'], action: 'paste-before', description: 'Paste before' },
    { keys: ['u'], mode: ['normal'], action: 'undo', description: 'Undo' },
    { keys: ['ctrl+r'], mode: ['normal'], action: 'redo', description: 'Redo' },
    
    // Search
    { keys: ['/'], mode: ['normal'], action: 'search-forward', description: 'Search forward' },
    { keys: ['?'], mode: ['normal'], action: 'search-backward', description: 'Search backward' },
    { keys: ['n'], mode: ['normal'], action: 'search-next', description: 'Next search result' },
    { keys: ['N'], mode: ['normal'], action: 'search-previous', description: 'Previous search result' },
    { keys: ['*'], mode: ['normal'], action: 'search-word-forward', description: 'Search word forward' },
    { keys: ['#'], mode: ['normal'], action: 'search-word-backward', description: 'Search word backward' },
    
    // Task-specific
    { keys: ['Enter'], mode: ['normal'], action: 'select-task', description: 'Select task' },
    { keys: ['space'], mode: ['normal'], action: 'toggle-task', description: 'Toggle task status' },
    { keys: ['t', 'c'], mode: ['normal'], action: 'complete-task', description: 'Complete task' },
    { keys: ['t', 'p'], mode: ['normal'], action: 'change-priority', description: 'Change task priority' },
    { keys: ['t', 't'], mode: ['normal'], action: 'add-tag', description: 'Add tag to task' },
    { keys: ['t', 'd'], mode: ['normal'], action: 'delete-task', description: 'Delete task' },
  ];

  private commandTimeout: NodeJS.Timeout | null = null;

  processKey(key: string, modifiers: KeyModifiers): string | null {
    // Handle special keys
    const normalizedKey = this.normalizeKey(key, modifiers);
    
    // Add to command buffer
    this.state.commandBuffer += normalizedKey;
    
    // Clear previous timeout
    if (this.commandTimeout) {
      clearTimeout(this.commandTimeout);
    }
    
    // Check for number prefix (count)
    if (this.state.mode === 'normal' && /^\d+$/.test(this.state.commandBuffer)) {
      this.state.count = parseInt(this.state.commandBuffer, 10);
      this.commandTimeout = setTimeout(() => this.resetCommandBuffer(), 1000);
      return null;
    }
    
    // Find matching command
    const matchingCommands = this.findMatchingCommands();
    
    if (matchingCommands.exact.length > 0) {
      // Execute the command
      const command = matchingCommands.exact[0];
      const action = this.executeCommand(command);
      this.resetCommandBuffer();
      return action;
    } else if (matchingCommands.partial.length > 0) {
      // Wait for more input
      this.commandTimeout = setTimeout(() => this.resetCommandBuffer(), 1000);
      return null;
    } else {
      // No match, reset
      this.resetCommandBuffer();
      return null;
    }
  }

  getMode(): VimMode {
    return this.state.mode;
  }

  setMode(mode: VimMode): void {
    this.state.mode = mode;
    this.resetCommandBuffer();
  }

  getState(): VimState {
    return { ...this.state };
  }

  private normalizeKey(key: string, modifiers: KeyModifiers): string {
    if (modifiers.ctrl) {
      return `ctrl+${key.toLowerCase()}`;
    }
    if (modifiers.shift && key.length === 1) {
      return key.toUpperCase();
    }
    return key;
  }

  private findMatchingCommands(): { exact: VimCommand[]; partial: VimCommand[] } {
    const buffer = this.state.commandBuffer;
    const exact: VimCommand[] = [];
    const partial: VimCommand[] = [];
    
    for (const command of this.commands) {
      if (!command.mode.includes(this.state.mode)) continue;
      
      const commandKey = command.keys.join('');
      
      if (commandKey === buffer) {
        exact.push(command);
      } else if (commandKey.startsWith(buffer)) {
        partial.push(command);
      }
    }
    
    return { exact, partial };
  }

  private executeCommand(command: VimCommand): string {
    // Apply count to the action
    const count = this.state.count || 1;
    let action = command.action;
    
    // Reset count after use
    this.state.count = 0;
    
    // Store last command for repeat
    this.state.lastCommand = command;
    
    // Handle mode changes
    switch (action) {
      case 'enter-insert':
      case 'enter-insert-after':
      case 'open-below':
      case 'open-above':
        this.state.mode = 'insert';
        break;
      case 'enter-visual':
      case 'enter-visual-line':
        this.state.mode = 'visual';
        break;
      case 'enter-command':
        this.state.mode = 'command';
        break;
      case 'enter-normal':
        this.state.mode = 'normal';
        break;
    }
    
    // Return action with count
    return count > 1 ? `${action}:${count}` : action;
  }

  private resetCommandBuffer(): void {
    this.state.commandBuffer = '';
    this.commandTimeout = null;
  }

  getCommands(mode?: VimMode): VimCommand[] {
    return mode 
      ? this.commands.filter(cmd => cmd.mode.includes(mode))
      : this.commands;
  }

  getKeybindingHelp(): string[] {
    const help: string[] = [];
    const commandsByMode = new Map<VimMode, VimCommand[]>();
    
    // Group commands by mode
    for (const command of this.commands) {
      for (const mode of command.mode) {
        if (!commandsByMode.has(mode)) {
          commandsByMode.set(mode, []);
        }
        commandsByMode.get(mode)!.push(command);
      }
    }
    
    // Format help text
    for (const [mode, commands] of commandsByMode) {
      help.push(`=== ${mode.toUpperCase()} MODE ===`);
      for (const command of commands) {
        const keys = command.keys.join('');
        help.push(`  ${keys.padEnd(15)} ${command.description}`);
      }
      help.push('');
    }
    
    return help;
  }
}
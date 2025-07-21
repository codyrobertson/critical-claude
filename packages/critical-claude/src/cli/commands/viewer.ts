/**
 * Task Viewer Command
 * Launch the terminal-based task viewer with vim keybindings
 */

import chalk from 'chalk';
import { TaskViewerApplication } from '../../viewer/index.js';
import { LogLevel } from '../../viewer/infrastructure/logging/ConsoleLogger.js';

export class ViewerCommand {
  async execute(options: any): Promise<void> {
    console.log(chalk.cyan('🚀 Launching Critical Claude Task Viewer...'));
    
    // Determine log level from options
    const logLevel = this.getLogLevel(options);
    
    // Create and start the viewer application
    const app = new TaskViewerApplication(logLevel);
    
    // Handle graceful shutdown
    const shutdown = () => {
      console.log(chalk.yellow('\n\n👋 Shutting down Task Viewer...'));
      app.stop();
      process.exit(0);
    };
    
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    
    try {
      await app.start();
    } catch (error) {
      console.error(chalk.red('❌ Failed to start Task Viewer:'), error);
      process.exit(1);
    }
  }
  
  private getLogLevel(options: any): LogLevel {
    if (options.debug) return LogLevel.DEBUG;
    if (options.verbose) return LogLevel.INFO;
    if (options.quiet) return LogLevel.ERROR;
    return LogLevel.INFO;
  }
  
  getUsageHelp(): string {
    return `🖥️  Critical Claude Task Viewer

Usage: cc viewer [options]

Launch a terminal-based task viewer with vim keybindings and split pane support.

Options:
  -d, --debug      Enable debug logging
  -v, --verbose    Enable verbose logging
  -q, --quiet      Suppress non-error output
  -h, --help       Show this help message

Keybindings:
  j/k            Navigate up/down
  h/l            Navigate left/right between panes
  /              Start search
  n/N            Next/previous search result
  Enter          View task details
  Space          Toggle task selection
  v              Split vertically
  s              Split horizontally
  q              Quit viewer
  ?              Show help

Examples:
  cc viewer              # Launch task viewer
  cc viewer --debug      # Launch with debug logging
  cc viewer --quiet      # Launch with minimal output`;
  }
}
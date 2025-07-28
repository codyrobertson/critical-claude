#!/usr/bin/env node
/**
 * Critical Claude CLI Application
 * Entry point for the DDD-structured CLI application
 */
import { Command } from 'commander';
// Use unified services (canonical implementations)
import { TaskService } from '../../../src/services/TaskService.js';
import { TemplateService } from '../../../src/services/TemplateService.js';
import { ResearchService } from '../../../domains/research-intelligence/dist/src/application/services/ResearchService.js';
import { ViewerService } from '../../../dist/services/ViewerService.js';
import { FileStorage } from '../../../dist/storage/FileStorage.js';
import { AnalyticsService } from '../../../src/services/AnalyticsService.js';
import { TaskCommandHandler } from './handlers/task-command-handler.js';
import { CliHelpers } from './utils/cli-helpers.js';
import path from 'path';
import os from 'os';
export class CLIApplication {
    taskService;
    templateService;
    researchService;
    viewerService;
    analyticsService;
    taskCommandHandler;
    constructor() {
        // Setup unified services with shared storage
        const storagePath = path.join(os.homedir(), '.critical-claude');
        const storage = new FileStorage(storagePath);
        // Use unified service implementations (canonical)
        this.taskService = new TaskService(storage);
        this.templateService = new TemplateService(storage);
        this.viewerService = new ViewerService(storage);
        this.analyticsService = new AnalyticsService(storage);
        // ResearchService initialized lazily to avoid AI provider initialization for basic operations
        this.researchService = null;
        // Initialize command handlers with lazy research service
        this.taskCommandHandler = new TaskCommandHandler(this.taskService, () => this.getResearchService());
    }
    getResearchService() {
        if (!this.researchService) {
            this.researchService = new ResearchService();
        }
        return this.researchService;
    }
    async start() {
        const program = new Command();
        program
            .name('cc')
            .description('Critical Claude CLI - DDD Architecture')
            .version('2.3.9');
        // Task management commands
        program
            .command('task')
            .description('Task management')
            .argument('<action>', 'Action: create, list, view, update, delete, archive, export, import, backup, ai, research')
            .argument('[args...]', 'Action arguments')
            .option('-t, --title <title>', 'Task title')
            .option('-d, --description <desc>', 'Task description')
            .option('-p, --priority <priority>', 'Priority: critical, high, medium, low', 'medium')
            .option('-s, --status <status>', 'Status: todo, in_progress, done, blocked', 'todo')
            .option('-a, --assignee <assignee>', 'Task assignee')
            .option('--labels <labels...>', 'Task labels')
            .option('--hours <hours>', 'Estimated hours', parseFloat)
            .option('--format <format>', 'Export/import format: json, csv, markdown', 'json')
            .option('--file <file>', 'File path for import/export')
            .option('--include-archived', 'Include archived tasks in export')
            .option('--merge-strategy <strategy>', 'Import merge strategy: replace, merge, skip', 'merge')
            .action(async (action, args, options) => {
            await this.analyticsService.withTracking('task', action, async () => {
                await this.handleTaskCommand(action, args, options);
            }).catch(error => {
                console.error('❌ Task operation failed:', error instanceof Error ? error.message : error);
                process.exit(1);
            });
        });
        // Template management commands
        program
            .command('template')
            .description('Template operations')
            .argument('<action>', 'Action: list, apply, view')
            .argument('[args...]', 'Action arguments')
            .option('-v, --variables <vars...>', 'Template variables (key=value)')
            .action(async (action, args, options) => {
            await this.analyticsService.withTracking('template', action, async () => {
                await this.handleTemplateCommand(action, args, options);
            }).catch(error => {
                console.error('❌ Template operation failed:', error instanceof Error ? error.message : error);
                process.exit(1);
            });
        });
        // Research commands
        program
            .command('research')
            .description('AI research operations')
            .argument('<query>', 'Research query')
            .option('-f, --files <files...>', 'Files to include')
            .option('--format <format>', 'Output format: tasks, report, both', 'both')
            .option('--depth <number>', 'Max research depth', parseInt, 3)
            .action(async (query, options) => {
            await this.analyticsService.withTracking('research', undefined, async () => {
                await this.handleResearchCommand(query, options);
            }).catch(error => {
                console.error('❌ Research operation failed:', error instanceof Error ? error.message : error);
                process.exit(1);
            });
        });
        // Viewer commands
        program
            .command('viewer')
            .description('Launch task viewer')
            .option('--log-level <level>', 'Log level: debug, info, warn, error', 'info')
            .option('--theme <theme>', 'Theme: dark, light', 'dark')
            .action(async (options) => {
            await this.analyticsService.withTracking('viewer', undefined, async () => {
                await this.handleViewerCommand(options);
            }).catch(error => {
                console.error('❌ Viewer operation failed:', error instanceof Error ? error.message : error);
                process.exit(1);
            });
        });
        // Analytics commands  
        program
            .command('analytics')
            .description('Usage analytics and statistics')
            .argument('[action]', 'Action: stats, export, clear', 'stats')
            .option('--format <format>', 'Export format: json, csv', 'json')
            .action(async (action, options) => {
            await this.analyticsService.withTracking('analytics', action, async () => {
                await this.handleAnalyticsCommand(action, options);
            }).catch(error => {
                console.error('❌ Analytics operation failed:', error instanceof Error ? error.message : error);
                process.exit(1);
            });
        });
        // Help commands
        program
            .command('shortcuts')
            .alias('keys')
            .description('Show keyboard shortcuts and keybindings')
            .action(async () => {
            await this.analyticsService.withTracking('help', 'shortcuts', async () => {
                await this.handleShortcutsCommand();
            }).catch(error => {
                console.error('❌ Help operation failed:', error instanceof Error ? error.message : error);
                process.exit(1);
            });
        });
        // Installation verification commands
        program
            .command('verify')
            .alias('check')
            .description('Verify Critical Claude installation')
            .option('--health', 'Run health check instead of full verification')
            .option('--skip-docker', 'Skip Docker-related tests')
            .option('--skip-performance', 'Skip performance benchmarks')
            .option('-v, --verbose', 'Enable verbose output')
            .action(async (options) => {
            await this.analyticsService.withTracking('system', 'verify', async () => {
                await this.handleVerifyCommand(options);
            }).catch(error => {
                console.error('❌ Verification failed:', error instanceof Error ? error.message : error);
                process.exit(1);
            });
        });
        await program.parseAsync(process.argv);
    }
    async handleTaskCommand(action, args, options) {
        return CliHelpers.safeExecute(async () => {
            switch (action) {
                case 'create':
                    return this.taskCommandHandler.handleCreate(options);
                case 'list':
                    return this.taskCommandHandler.handleList(options);
                case 'view':
                    return this.taskCommandHandler.handleView(args);
                case 'update':
                    return this.taskCommandHandler.handleUpdate(args, options);
                case 'delete':
                    return this.taskCommandHandler.handleDelete(args);
                case 'archive':
                    return this.taskCommandHandler.handleArchive(args);
                case 'export':
                    return this.taskCommandHandler.handleExport(options);
                case 'import':
                    return this.taskCommandHandler.handleImport(options);
                case 'backup':
                    return this.taskCommandHandler.handleBackup(options);
                case 'ai':
                    return this.taskCommandHandler.handleAi(args);
                case 'research':
                    return this.taskCommandHandler.handleResearch(args);
                default:
                    console.error(`❌ Unknown action: ${action}`);
                    console.log('Available actions: create, list, view, update, delete, archive, export, import, backup, ai, research');
                    process.exit(1);
            }
        }, 'Task command failed');
    }
    async handleTemplateCommand(action, args, options) {
        switch (action) {
            case 'apply':
            case 'use':
                if (!args[0]) {
                    console.error('❌ Template name is required');
                    process.exit(1);
                }
                const applyResult = await this.templateService.applyTemplate({
                    templateName: args[0],
                    variables: options.variables || {}
                });
                if (applyResult.success && applyResult.data) {
                    console.log(`✅ Applied template: ${applyResult.templateName}`);
                    console.log(`   Tasks created: ${applyResult.tasksCreated}`);
                    console.log('\nCreated tasks:');
                    applyResult.data.forEach(task => {
                        console.log(`  📌 ${task.title} (${task.priority || 'medium'} priority)`);
                        if (task.subtasks && task.subtasks.length > 0) {
                            task.subtasks.forEach(subtask => {
                                console.log(`    - ${subtask.title}`);
                            });
                        }
                    });
                }
                else {
                    console.error(`❌ ${applyResult.error}`);
                }
                break;
            case 'list':
            case 'ls':
                const listResult = await this.templateService.listTemplates();
                if (listResult.success && listResult.data) {
                    console.log(`📋 Available templates (${listResult.data.length}):\n`);
                    // Group by built-in vs user templates
                    const builtInTemplates = listResult.data.filter(t => t.metadata.author === 'Critical Claude');
                    const userTemplates = listResult.data.filter(t => t.metadata.author !== 'Critical Claude');
                    if (builtInTemplates.length > 0) {
                        console.log('📦 Built-in Templates:');
                        builtInTemplates.forEach(template => {
                            console.log(`  ${template.name} - ${template.description}`);
                            console.log(`    Tasks: ${template.getTaskCount()} | Tags: ${template.metadata.tags?.join(', ') || 'none'}`);
                            console.log('');
                        });
                    }
                    if (userTemplates.length > 0) {
                        console.log('👤 User Templates:');
                        userTemplates.forEach(template => {
                            console.log(`  ${template.name} - ${template.description}`);
                            console.log(`    Tasks: ${template.getTaskCount()} | Author: ${template.metadata.author || 'unknown'}`);
                            console.log('');
                        });
                    }
                    console.log('Use "cc template apply <name>" to apply a template');
                }
                else {
                    console.error(`❌ ${listResult.error}`);
                }
                break;
            case 'show':
            case 'view':
                if (!args[0]) {
                    console.error('❌ Template name is required');
                    process.exit(1);
                }
                const viewResult = await this.templateService.viewTemplate({ nameOrId: args[0] });
                if (viewResult.success && viewResult.data) {
                    const template = viewResult.data;
                    console.log(`📋 Template: ${template.name}\n`);
                    console.log(`Description: ${template.description}`);
                    console.log(`Tasks: ${viewResult.taskCount}`);
                    console.log(`Created: ${template.metadata.createdAt.toLocaleDateString()}`);
                    console.log(`Updated: ${template.metadata.updatedAt.toLocaleDateString()}`);
                    if (template.metadata.author) {
                        console.log(`Author: ${template.metadata.author}`);
                    }
                    if (template.metadata.tags && template.metadata.tags.length > 0) {
                        console.log(`Tags: ${template.metadata.tags.join(', ')}`);
                    }
                    if (Object.keys(template.variables).length > 0) {
                        console.log('\nVariables:');
                        Object.entries(template.variables).forEach(([key, value]) => {
                            console.log(`  ${key}: ${value}`);
                        });
                    }
                    console.log('\nTasks:');
                    template.tasks.forEach((task, index) => {
                        console.log(`  ${index + 1}. ${task.title} (${task.priority || 'medium'} priority)`);
                        if (task.description) {
                            console.log(`     ${task.description}`);
                        }
                        if (task.subtasks && task.subtasks.length > 0) {
                            task.subtasks.forEach(subtask => {
                                console.log(`     - ${subtask.title}`);
                            });
                        }
                    });
                }
                else {
                    console.error(`❌ ${viewResult.error}`);
                }
                break;
            default:
                console.error(`❌ Unknown template action: ${action}`);
                console.log('Available actions: list, apply, view');
                process.exit(1);
        }
    }
    async handleResearchCommand(query, options) {
        try {
            const result = await this.researchService.executeResearch({
                query,
                files: options.files,
                outputFormat: options.format,
                maxDepth: options.depth
            });
            if (result.success) {
                console.log(`✅ Research completed successfully`);
                if (result.reportPath) {
                    console.log(`   Report: ${result.reportPath}`);
                }
                if (result.tasksCreated) {
                    console.log(`   Tasks created: ${result.tasksCreated}`);
                }
            }
            else {
                console.error(`❌ ${result.error || 'Research failed'}`);
            }
        }
        catch (error) {
            console.error(`❌ Research operation failed: ${error instanceof Error ? error.message : error}`);
        }
    }
    async handleViewerCommand(options) {
        const result = await this.viewerService.launchViewer({
            logLevel: options.logLevel,
            theme: options.theme
        });
        if (result.success) {
            console.log(`✅ Viewer launched successfully`);
        }
        else {
            console.error(`❌ ${result.error}`);
        }
    }
    async handleAnalyticsCommand(action, options) {
        switch (action) {
            case 'stats':
                const stats = await this.analyticsService.getUsageStats();
                console.log('📊 Critical Claude Usage Statistics\n');
                console.log(`Total commands tracked: ${stats.totalMetrics}`);
                console.log(`Recent commands (7 days): ${stats.recentCommands}`);
                console.log(`Success rate: ${(stats.successRate * 100).toFixed(1)}%\n`);
                if (stats.topCommands.length > 0) {
                    console.log('🏆 Most used commands:');
                    stats.topCommands.forEach(({ command, count }, index) => {
                        console.log(`  ${index + 1}. ${command}: ${count} times`);
                    });
                    console.log('');
                }
                if (stats.errorBreakdown.length > 0) {
                    console.log('⚠️  Error breakdown:');
                    stats.errorBreakdown.forEach(({ error, count }) => {
                        console.log(`  ${error}: ${count} times`);
                    });
                }
                break;
            case 'export':
                const exportData = await this.analyticsService.exportMetrics(options.format);
                const filename = `critical-claude-analytics-${new Date().toISOString().split('T')[0]}.${options.format}`;
                const fs = await import('fs/promises');
                await fs.writeFile(filename, exportData);
                console.log(`✅ Analytics exported to ${filename}`);
                break;
            case 'clear':
                await this.analyticsService.clearAllMetrics();
                console.log('✅ All analytics data cleared');
                break;
            default:
                console.error(`❌ Unknown analytics action: ${action}`);
                console.log('Available actions: stats, export, clear');
                process.exit(1);
        }
    }
    async handleShortcutsCommand() {
        console.log('🎮 Critical Claude Keyboard Shortcuts\n');
        console.log('📋 VIEWER SHORTCUTS (cc viewer)');
        console.log('================================\n');
        // Import VimKeybindings dynamically to get help
        try {
            const { VimKeybindings } = await import('../../../domains/user-interface/dist/presentation/keybindings/VimKeybindings.js');
            const vim = new VimKeybindings();
            const help = vim.getKeybindingHelp();
            help.forEach(line => console.log(line));
        }
        catch (error) {
            console.log('Basic Viewer Controls:');
            console.log('  j/k or ↑/↓      Navigate up/down');
            console.log('  h/l or ←/→      Navigate left/right');
            console.log('  /               Search tasks');
            console.log('  f               Filter by status');
            console.log('  Enter           Select task');
            console.log('  Space           Toggle task status');
            console.log('  q               Quit');
            console.log('  ?               Show help');
        }
        console.log('\n💻 CLI SHORTCUTS');
        console.log('================\n');
        console.log('Quick Task Creation:');
        console.log('  cc task create -t "Title" -d "Description"');
        console.log('  cc task create -t "Bug fix" -p high -s todo');
        console.log('');
        console.log('Data Management:');
        console.log('  cc task export --format json');
        console.log('  cc task import --file backup.json');
        console.log('  cc task backup');
        console.log('');
        console.log('Quick Filters:');
        console.log('  cc task list --status todo');
        console.log('  cc task list --priority high');
        console.log('  cc task list --assignee user@example.com');
        console.log('');
        console.log('Analytics:');
        console.log('  cc analytics stats');
        console.log('  cc analytics export --format csv');
        console.log('');
        console.log('📖 For complete documentation:');
        console.log('  View docs/KEYBOARD_SHORTCUTS.md');
        console.log('  Run cc --help for command help');
        console.log('  Run cc <command> --help for specific command help');
    }
    async handleVerifyCommand(options) {
        console.log('🔍 Critical Claude Installation Verification\n');
        if (options.health) {
            // Run health check
            console.log('Running health check...\n');
            try {
                const { default: HealthChecker } = await import('../../../scripts/health-check.js');
                const checker = new HealthChecker();
                const isHealthy = await checker.runAllChecks();
                if (isHealthy) {
                    console.log('\n🎉 Health check passed! Critical Claude is ready to use.');
                }
                else {
                    console.log('\n⚠️  Health check found issues. See report above.');
                    process.exit(1);
                }
            }
            catch (error) {
                console.error('❌ Health check failed to run:', error instanceof Error ? error.message : error);
                process.exit(1);
            }
        }
        else {
            // Run full verification script
            console.log('Running full installation verification...\n');
            const { spawn } = await import('child_process');
            const path = await import('path');
            const scriptPath = path.join(process.cwd(), 'scripts', 'verify-installation.sh');
            const args = [];
            if (options.skipDocker)
                args.push('--skip-docker');
            if (options.skipPerformance)
                args.push('--skip-performance');
            if (options.verbose)
                args.push('--verbose');
            const verification = spawn('bash', [scriptPath, ...args], {
                stdio: 'inherit'
            });
            verification.on('close', (code) => {
                if (code === 0) {
                    console.log('\n🎉 Installation verification completed successfully!');
                }
                else {
                    console.log('\n⚠️  Installation verification found issues.');
                    process.exit(code || 1);
                }
            });
            verification.on('error', (error) => {
                console.error('❌ Verification script failed to run:', error.message);
                process.exit(1);
            });
        }
    }
}
// Application bootstrap function with proper error recovery
async function main() {
    let app;
    try {
        app = new CLIApplication();
    }
    catch (initError) {
        console.error('❌ Failed to initialize CLI application:', initError);
        console.error('🔧 Try running with --verbose for more details');
        console.error('💡 Common fixes:');
        console.error('   - Ensure ~/.critical-claude directory is writable');
        console.error('   - Check disk space availability');
        console.error('   - Verify Node.js permissions');
        process.exit(1);
    }
    try {
        await app.start();
    }
    catch (startError) {
        console.error('❌ CLI Application startup failed:', startError);
        // Attempt graceful degradation for common issues
        if (startError instanceof Error) {
            if (startError.message.includes('ENOENT') || startError.message.includes('permission')) {
                console.error('🔧 Storage access issue. Attempting to create required directories...');
                try {
                    const path = await import('path');
                    const fs = await import('fs/promises');
                    const os = await import('os');
                    const storageDir = path.join(os.homedir(), '.critical-claude');
                    await fs.mkdir(storageDir, { recursive: true });
                    console.log('✅ Created storage directory. Please try again.');
                }
                catch (recoveryError) {
                    console.error('❌ Recovery failed:', recoveryError);
                }
            }
        }
        process.exit(1);
    }
}
// Start the application
main().catch(error => {
    console.error('❌ Unexpected application error:', error);
    console.error('📧 Please report this issue with the full error details');
    process.exit(1);
});
//# sourceMappingURL=index.js.map
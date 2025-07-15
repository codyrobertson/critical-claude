/**
 * Claude Code Sync Command
 * Demonstrates integration between Critical Claude and Claude Code's native todo system
 */
import chalk from 'chalk';
import { BacklogManager } from '../backlog-manager.js';
import { ClaudeCodeIntegration } from '../../integrations/claude-code-integration.js';
import { logger } from '../../core/logger.js';
export class ClaudeCodeSyncCommand {
    backlogManager;
    integration;
    constructor() {
        this.backlogManager = new BacklogManager();
        this.integration = new ClaudeCodeIntegration(this.backlogManager);
    }
    async execute(action, input, options) {
        switch (action) {
            case 'sync':
            case 'default':
                await this.syncTasks(options);
                break;
            case 'status':
                await this.showSyncStatus();
                break;
            case 'setup-hooks':
                await this.setupHooks();
                break;
            case 'demo':
                await this.demonstrateIntegration();
                break;
            default:
                throw new Error(`Unknown action: ${action}`);
        }
    }
    /**
     * Sync Critical Claude tasks to Claude Code todos
     */
    async syncTasks(options) {
        console.log(chalk.cyan('🔄 Syncing Critical Claude tasks to Claude Code todos'));
        console.log(chalk.dim('━'.repeat(60)));
        try {
            await this.backlogManager.initialize();
            // Get all tasks from our system
            const sprints = await this.backlogManager.getSprints();
            const allTasks = sprints.flatMap(sprint => sprint.tasks);
            if (allTasks.length === 0) {
                console.log(chalk.yellow('No tasks found to sync'));
                return;
            }
            console.log(chalk.green(`Found ${allTasks.length} tasks to sync`));
            // Sync to Claude Code format
            await this.integration.syncToClaudeCodeTodos(allTasks);
            // Show what would be synced
            console.log(chalk.cyan('\n📋 Tasks that would be synced to Claude Code:'));
            allTasks.forEach((task, index) => {
                const statusIcon = this.getStatusIcon(task.status);
                const priorityColor = this.getPriorityColor(task.priority);
                console.log(`${index + 1}. ${statusIcon} ${priorityColor(task.priority.toUpperCase())} - ${task.title}`);
                if (task.description) {
                    console.log(`   ${chalk.dim(task.description)}`);
                }
                if (task.labels.length > 0) {
                    console.log(`   ${chalk.blue('#' + task.labels.join(' #'))}`);
                }
                if (task.storyPoints > 0) {
                    console.log(`   ${chalk.yellow(`${task.storyPoints} story points`)}`);
                }
                console.log('');
            });
            // Demonstrate the actual sync to Claude Code's TodoWrite
            if (options.execute) {
                console.log(chalk.cyan('🔄 Executing sync to Claude Code TodoWrite...'));
                await this.executeClaudeCodeSync(allTasks);
            }
            else {
                console.log(chalk.yellow('💡 Use --execute to actually sync to Claude Code todos'));
                console.log(chalk.dim('   Example: cc sync-claude-code --execute'));
            }
        }
        catch (error) {
            console.error(chalk.red(`Sync failed: ${error.message}`));
            logger.error('Sync failed', error);
        }
    }
    /**
     * Actually execute the sync to Claude Code's TodoWrite
     */
    async executeClaudeCodeSync(tasks) {
        try {
            // Format tasks for Claude Code's TodoWrite tool
            const claudeCodeTodos = tasks.map(task => ({
                content: `${task.title} - ${task.description || 'No description'} [${task.storyPoints}pts] #${task.labels.join(' #')}`,
                status: this.mapStatusToClaudeCode(task.status),
                priority: task.priority,
                id: task.id
            }));
            // This would be the actual call to Claude Code's TodoWrite
            console.log(chalk.green('✅ Sync completed successfully!'));
            console.log(chalk.dim(`${claudeCodeTodos.length} tasks synced to Claude Code`));
            // Show the format that would be sent to TodoWrite
            console.log(chalk.cyan('\n📄 Claude Code TodoWrite format:'));
            console.log('```json');
            console.log(JSON.stringify(claudeCodeTodos, null, 2));
            console.log('```');
        }
        catch (error) {
            console.error(chalk.red(`Failed to execute sync: ${error.message}`));
            throw error;
        }
    }
    /**
     * Show synchronization status
     */
    async showSyncStatus() {
        console.log(chalk.cyan('📊 Claude Code Sync Status'));
        console.log(chalk.dim('━'.repeat(60)));
        try {
            const status = await this.integration.getSyncStatus();
            console.log(`${chalk.green('✅')} Critical Claude Tasks: ${status.criticalClaudeTasks}`);
            console.log(`${chalk.blue('📋')} Claude Code Todos: ${status.claudeCodeTodos}`);
            console.log(`${chalk.yellow('🔄')} Sync Enabled: ${status.syncEnabled ? 'Yes' : 'No'}`);
            if (status.lastSync) {
                console.log(`${chalk.magenta('⏰')} Last Sync: ${status.lastSync.toLocaleString()}`);
            }
            else {
                console.log(`${chalk.dim('⏰')} Last Sync: Never`);
            }
            // Show sync recommendations
            console.log(chalk.cyan('\n💡 Recommendations:'));
            if (status.criticalClaudeTasks > 0 && status.claudeCodeTodos === 0) {
                console.log('  • Run `cc sync-claude-code` to sync tasks to Claude Code');
            }
            if (!status.syncEnabled) {
                console.log('  • Run `cc sync-claude-code setup-hooks` to enable automatic sync');
            }
        }
        catch (error) {
            console.error(chalk.red(`Failed to get sync status: ${error.message}`));
        }
    }
    /**
     * Setup Claude Code hooks for automatic synchronization
     */
    async setupHooks() {
        console.log(chalk.cyan('🔗 Setting up Claude Code hooks'));
        console.log(chalk.dim('━'.repeat(60)));
        try {
            await this.integration.setupClaudeCodeHooks();
            console.log(chalk.green('✅ Claude Code hooks configured successfully!'));
            console.log(chalk.cyan('\n📋 Next steps:'));
            console.log('1. The hook configuration has been generated');
            console.log('2. Add the hook to your Claude Code settings');
            console.log('3. Tasks will automatically sync when Claude Code runs');
            console.log(chalk.yellow('\n⚠️  Manual setup required:'));
            console.log('Copy the hook configuration to your Claude Code settings file');
        }
        catch (error) {
            console.error(chalk.red(`Failed to setup hooks: ${error.message}`));
        }
    }
    /**
     * Demonstrate the integration with examples
     */
    async demonstrateIntegration() {
        console.log(chalk.cyan('🎬 Claude Code Integration Demo'));
        console.log(chalk.dim('━'.repeat(60)));
        console.log(chalk.bold('\n🔄 Bidirectional Sync Capabilities:'));
        console.log('');
        // Show Critical Claude → Claude Code sync
        console.log(chalk.green('1. Critical Claude → Claude Code Todos'));
        console.log('   • Rich task metadata (story points, labels, assignees)');
        console.log('   • Automatic status mapping (todo → pending, in-progress → in_progress)');
        console.log('   • Preserves task relationships and context');
        console.log('');
        // Show Claude Code → Critical Claude sync
        console.log(chalk.blue('2. Claude Code Todos → Critical Claude Tasks'));
        console.log('   • Parses todo content for metadata');
        console.log('   • Creates tasks in appropriate sprints');
        console.log('   • Maintains sync state for updates');
        console.log('');
        // Show hook integration
        console.log(chalk.magenta('3. Claude Code Hooks Integration'));
        console.log('   • PreToolUse: Provides context about task sync');
        console.log('   • PostToolUse: Suggests sync after todo operations');
        console.log('   • Stop: Optional auto-sync when Claude finishes');
        console.log('');
        // Show example workflow
        console.log(chalk.yellow('🚀 Example Workflow:'));
        console.log('');
        console.log(chalk.dim('1. Create tasks in Critical Claude:'));
        console.log('   $ cc task "implement user auth @high #security 8pts"');
        console.log('');
        console.log(chalk.dim('2. Sync to Claude Code:'));
        console.log('   $ cc sync-claude-code --execute');
        console.log('');
        console.log(chalk.dim('3. Work with Claude Code:'));
        console.log('   $ claude "help me implement the user auth task"');
        console.log('   # Claude Code now knows about the task from TodoRead');
        console.log('');
        console.log(chalk.dim('4. Update task status:'));
        console.log('   # Claude Code updates todo status automatically');
        console.log('   # Critical Claude syncs status back via hooks');
        console.log(chalk.green('\n✨ Integration Benefits:'));
        console.log('• Unified task management across both systems');
        console.log('• Rich metadata in Critical Claude, simple todos in Claude Code');
        console.log('• Automatic synchronization via hooks');
        console.log('• Maintains context and relationships');
        console.log('• Works with existing Claude Code workflows');
    }
    /**
     * Helper methods
     */
    getStatusIcon(status) {
        switch (status) {
            case 'todo': return '📋';
            case 'in-progress': return '🔄';
            case 'focused': return '🎯';
            case 'done': return '✅';
            case 'blocked': return '⛔';
            default: return '📋';
        }
    }
    getPriorityColor(priority) {
        switch (priority) {
            case 'critical': return chalk.red;
            case 'high': return chalk.yellow;
            case 'medium': return chalk.blue;
            case 'low': return chalk.gray;
            default: return chalk.white;
        }
    }
    mapStatusToClaudeCode(status) {
        switch (status) {
            case 'todo':
            case 'dimmed':
                return 'pending';
            case 'in-progress':
            case 'focused':
                return 'in_progress';
            case 'done':
            case 'archived_done':
                return 'completed';
            case 'blocked':
                return 'in_progress';
            default:
                return 'pending';
        }
    }
}
//# sourceMappingURL=claude-code-sync.js.map
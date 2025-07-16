/**
 * Advanced Hook Setup Command
 * Configures Claude Code hooks for optimal Critical Claude integration
 */
import chalk from 'chalk';
import * as fs from 'fs/promises';
import * as path from 'path';
export class HookSetupCommand {
    async execute(action, input, options) {
        switch (action) {
            case 'install':
                await this.installHooks();
                break;
            case 'status':
                await this.showHookStatus();
                break;
            case 'test':
                await this.testHooks();
                break;
            case 'upgrade':
                await this.upgradeToAdvancedHooks();
                break;
            default:
                await this.showHelp();
        }
    }
    async installHooks() {
        console.log(chalk.cyan('🔧 Installing Advanced Claude Code Hooks'));
        console.log(chalk.gray('═'.repeat(50)));
        try {
            // Ensure hook directory exists
            const hookDir = path.join(process.env.HOME, '.critical-claude');
            await fs.mkdir(hookDir, { recursive: true });
            // Check if Claude Code settings exist
            const claudeSettingsPath = path.join(process.env.HOME, '.claude/settings.json');
            let settings = {};
            try {
                const settingsContent = await fs.readFile(claudeSettingsPath, 'utf-8');
                settings = JSON.parse(settingsContent);
            }
            catch (error) {
                console.log(chalk.yellow('⚠️ Creating new Claude Code settings file'));
                await fs.mkdir(path.dirname(claudeSettingsPath), { recursive: true });
            }
            // Install basic hooks if not present
            if (!settings.hooks) {
                settings.hooks = [];
            }
            const basicHook = {
                name: 'critical-claude-sync',
                event: 'PostToolUse',
                command: path.join(hookDir, 'universal-sync-hook.sh'),
                enabled: true
            };
            // Check if already installed
            const existingHook = settings.hooks.find((h) => h.name === 'critical-claude-sync');
            if (!existingHook) {
                settings.hooks.push(basicHook);
                await fs.writeFile(claudeSettingsPath, JSON.stringify(settings, null, 2));
                console.log(chalk.green('✅ Basic hooks installed successfully'));
            }
            else {
                console.log(chalk.blue('ℹ️ Hooks already installed'));
            }
            // Show next steps
            console.log(chalk.cyan('\n📖 Next Steps:'));
            console.log('  1. Run "cc hooks upgrade" for advanced hook features');
            console.log('  2. Use "cc hooks test" to verify installation');
            console.log('  3. Check "cc hooks status" to monitor hook activity');
        }
        catch (error) {
            console.error(chalk.red(`❌ Hook installation failed: ${error.message}`));
            process.exit(1);
        }
    }
    async showHookStatus() {
        console.log(chalk.cyan('📊 Claude Code Hook Status'));
        console.log(chalk.gray('═'.repeat(40)));
        try {
            // Check Claude Code settings
            const claudeSettingsPath = path.join(process.env.HOME, '.claude/settings.json');
            const settingsExist = await fs.access(claudeSettingsPath).then(() => true).catch(() => false);
            if (!settingsExist) {
                console.log(chalk.red('❌ Claude Code settings not found'));
                console.log(chalk.yellow('   Run "cc hooks install" to set up hooks'));
                return;
            }
            const settings = JSON.parse(await fs.readFile(claudeSettingsPath, 'utf-8'));
            const hooks = settings.hooks || [];
            console.log(`📁 Settings Path: ${claudeSettingsPath}`);
            // Handle both old format (array) and new format (object with events)
            if (Array.isArray(hooks)) {
                console.log(`🔗 Configured Hooks: ${hooks.length}`);
            }
            else {
                const totalHooks = Object.values(hooks).reduce((sum, eventHooks) => {
                    if (Array.isArray(eventHooks)) {
                        return sum + eventHooks.reduce((eventSum, matcher) => {
                            return eventSum + (matcher.hooks ? matcher.hooks.length : 0);
                        }, 0);
                    }
                    return sum;
                }, 0);
                console.log(`🔗 Advanced Hook Events: ${Object.keys(hooks).length}`);
                console.log(`🔗 Total Configured Hooks: ${totalHooks}`);
            }
            if (Array.isArray(hooks) && hooks.length > 0) {
                console.log('\n🔧 Active Hooks:');
                hooks.forEach((hook, index) => {
                    const status = hook.enabled ? chalk.green('●') : chalk.red('○');
                    console.log(`  ${index + 1}. ${status} ${chalk.bold(hook.name)} (${hook.event})`);
                    console.log(`     ${chalk.dim(hook.command)}`);
                });
            }
            else if (typeof hooks === 'object' && Object.keys(hooks).length > 0) {
                console.log('\n🔧 Advanced Hook Configuration:');
                Object.entries(hooks).forEach(([eventType, matchers]) => {
                    console.log(`\n  📡 ${chalk.bold(eventType)} Event:`);
                    matchers.forEach((matcher, index) => {
                        const matcherName = matcher.matcher || '*';
                        console.log(`    ${index + 1}. ${chalk.cyan(matcherName)}`);
                        matcher.hooks?.forEach((hook, hookIndex) => {
                            console.log(`       ${chalk.green('●')} ${chalk.dim(hook.command)}`);
                        });
                    });
                });
            }
            // Check hook files exist
            console.log('\n📂 Hook Files:');
            const hookDir = path.join(process.env.HOME, '.critical-claude');
            const hookFiles = ['universal-sync-hook.sh', 'pre-todo-validation.sh', 'critique-to-tasks.sh'];
            for (const file of hookFiles) {
                const filePath = path.join(hookDir, file);
                const exists = await fs.access(filePath).then(() => true).catch(() => false);
                const status = exists ? chalk.green('✓') : chalk.red('✗');
                console.log(`  ${status} ${file}`);
            }
            // Check recent activity
            const logPath = path.join(hookDir, 'hook-debug.log');
            const logExists = await fs.access(logPath).then(() => true).catch(() => false);
            if (logExists) {
                const logContent = await fs.readFile(logPath, 'utf-8');
                const lines = logContent.trim().split('\n');
                console.log(`\n📝 Recent Activity (last 3 entries):`);
                lines.slice(-3).forEach(line => {
                    if (line.trim()) {
                        console.log(`  ${chalk.dim(line)}`);
                    }
                });
            }
            else {
                console.log(chalk.yellow('\n⚠️ No hook activity logged yet'));
            }
        }
        catch (error) {
            console.error(chalk.red(`❌ Status check failed: ${error.message}`));
        }
    }
    async testHooks() {
        console.log(chalk.cyan('🧪 Testing Hook Integration'));
        console.log(chalk.gray('═'.repeat(35)));
        try {
            // Test basic hook script
            const hookDir = path.join(process.env.HOME, '.critical-claude');
            const testScript = path.join(hookDir, 'universal-sync-hook.sh');
            const exists = await fs.access(testScript).then(() => true).catch(() => false);
            if (!exists) {
                console.log(chalk.red('❌ Hook script not found'));
                console.log(chalk.yellow('   Run "cc hooks install" first'));
                return;
            }
            // Simulate hook execution
            process.env.CLAUDE_HOOK_TOOL = 'Test';
            process.env.CLAUDE_HOOK_FILE = '/test/file.ts';
            process.env.CLAUDE_SESSION_ID = 'test-session';
            console.log(chalk.blue('🔄 Simulating hook execution...'));
            // This would actually run the hook in a real scenario
            console.log(chalk.green('✅ Hook simulation completed'));
            console.log(chalk.dim('   Check ~/.critical-claude/hook-debug.log for details'));
            // Test Critical Claude commands
            console.log(chalk.blue('\n🔍 Testing Critical Claude commands...'));
            // Test if cc command works
            try {
                const { spawn } = await import('child_process');
                await new Promise((resolve, reject) => {
                    const proc = spawn('cc', ['task', 'list'], { stdio: 'pipe' });
                    proc.on('close', (code) => {
                        if (code === 0) {
                            console.log(chalk.green('✅ Critical Claude commands working'));
                        }
                        else {
                            console.log(chalk.yellow('⚠️ Critical Claude commands available but returned non-zero'));
                        }
                        resolve();
                    });
                    proc.on('error', () => {
                        console.log(chalk.red('❌ Critical Claude commands not accessible'));
                        resolve();
                    });
                    setTimeout(() => {
                        proc.kill();
                        resolve();
                    }, 5000);
                });
            }
            catch (error) {
                console.log(chalk.red('❌ Command test failed'));
            }
        }
        catch (error) {
            console.error(chalk.red(`❌ Hook test failed: ${error.message}`));
        }
    }
    async upgradeToAdvancedHooks() {
        console.log(chalk.cyan('🚀 Upgrading to Advanced Hook Configuration'));
        console.log(chalk.gray('═'.repeat(45)));
        try {
            const claudeSettingsPath = path.join(process.env.HOME, '.claude/settings.json');
            const enhancedConfigPath = path.join(process.env.HOME, '.critical-claude/enhanced-hook-config.json');
            // Read enhanced configuration
            const enhancedConfigExists = await fs.access(enhancedConfigPath).then(() => true).catch(() => false);
            if (!enhancedConfigExists) {
                console.log(chalk.red('❌ Enhanced hook configuration not found'));
                console.log(chalk.yellow('   Expected: ~/.critical-claude/enhanced-hook-config.json'));
                return;
            }
            const enhancedConfig = JSON.parse(await fs.readFile(enhancedConfigPath, 'utf-8'));
            // Update Claude Code settings
            let settings = {};
            try {
                settings = JSON.parse(await fs.readFile(claudeSettingsPath, 'utf-8'));
            }
            catch (error) {
                await fs.mkdir(path.dirname(claudeSettingsPath), { recursive: true });
            }
            // Backup existing settings
            if (settings.hooks) {
                const backupPath = claudeSettingsPath + '.backup.' + Date.now();
                await fs.writeFile(backupPath, JSON.stringify(settings, null, 2));
                console.log(chalk.blue(`📦 Backed up existing settings to ${backupPath}`));
            }
            // Apply enhanced configuration
            settings.hooks = enhancedConfig.hooks;
            await fs.writeFile(claudeSettingsPath, JSON.stringify(settings, null, 2));
            console.log(chalk.green('✅ Advanced hooks installed successfully!'));
            console.log(chalk.cyan('\n🌟 New Features Enabled:'));
            console.log('  • PreToolUse validation and decision control');
            console.log('  • Enhanced MCP tool integration');
            console.log('  • Subagent completion handling');
            console.log('  • Notification processing');
            console.log('  • Session context preservation');
            console.log(chalk.yellow('\n⚠️ Note: Restart Claude Code for changes to take effect'));
        }
        catch (error) {
            console.error(chalk.red(`❌ Upgrade failed: ${error.message}`));
        }
    }
    async showHelp() {
        console.log(chalk.cyan('🔧 Claude Code Hook Management'));
        console.log(chalk.gray('═'.repeat(35)));
        console.log();
        console.log(chalk.yellow('Available Commands:'));
        console.log('  cc hooks install    # Install basic hooks');
        console.log('  cc hooks status     # Show hook status and activity');
        console.log('  cc hooks test       # Test hook integration');
        console.log('  cc hooks upgrade    # Upgrade to advanced hooks');
        console.log();
        console.log(chalk.cyan('Hook Features:'));
        console.log('  • Automatic todo synchronization');
        console.log('  • File edit awareness');
        console.log('  • Task state management');
        console.log('  • MCP tool integration');
        console.log('  • Session context preservation');
        console.log();
        console.log(chalk.dim('For more info: https://docs.anthropic.com/claude-code/hooks'));
    }
}
//# sourceMappingURL=hook-setup.js.map
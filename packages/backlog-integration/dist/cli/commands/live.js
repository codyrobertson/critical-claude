/**
 * Live Command - Simple live feed monitor using chalk
 */
import chalk from 'chalk';
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { BacklogManager } from '../backlog-manager.js';
export class LiveCommand {
    backlogManager;
    hookEvents = [];
    syncEvents = [];
    taskStats = { total: 0, pending: 0, inProgress: 0, completed: 0 };
    lastSync = 'Never';
    refreshInterval = null;
    animationFrame = 0;
    pulseState = 0;
    lastUpdateTime = Date.now();
    constructor() {
        this.backlogManager = new BacklogManager();
    }
    async execute(action, input, options) {
        await this.backlogManager.initialize();
        // Initial task load and header display
        await this.refreshTaskStats();
        this.displayHeader();
        // Start monitoring
        this.startWatching();
        // Show initial activity sections
        this.displayInitialActivity();
        // More responsive refresh - update every 3 seconds to prevent layout issues
        this.refreshInterval = setInterval(async () => {
            this.animationFrame++;
            this.pulseState = (this.pulseState + 1) % 4;
            await this.refreshTaskStats();
            // Full redraw instead of in-place updates to prevent overlapping
            this.displayHeader();
            this.displayInitialActivity();
        }, 3000);
        // Handle exit
        process.on('SIGINT', () => {
            this.cleanup();
            process.exit(0);
        });
    }
    startWatching() {
        // Watch hook debug log
        const hookLogPath = path.join(process.env.HOME, '.critical-claude/hook-debug.log');
        if (fs.existsSync(hookLogPath)) {
            const tail = spawn('tail', ['-f', hookLogPath]);
            tail.stdout.on('data', (data) => {
                const lines = data.toString().split('\n').filter(line => line.trim());
                lines.forEach(line => {
                    if (line.includes('Hook triggered')) {
                        const time = new Date().toLocaleTimeString();
                        const event = `${chalk.gray(time)} ${chalk.green('🔔 Hook triggered')}`;
                        this.hookEvents.unshift(event);
                        if (this.hookEvents.length > 5)
                            this.hookEvents.pop();
                        this.addHookEvent(event);
                    }
                });
            });
        }
        // Watch sync log
        const syncLogPath = path.join(process.env.HOME, '.critical-claude/sync.log');
        if (fs.existsSync(syncLogPath)) {
            const tail = spawn('tail', ['-f', syncLogPath]);
            tail.stdout.on('data', (data) => {
                const lines = data.toString().split('\n').filter(line => line.trim());
                lines.forEach(line => {
                    if (line.includes('tasks synced')) {
                        const time = new Date().toLocaleTimeString();
                        const match = line.match(/(\\d+) tasks synced/);
                        const count = match ? match[1] : '?';
                        const event = `${chalk.gray(time)} ${chalk.yellow(`✅ ${count} tasks synced`)}`;
                        this.syncEvents.unshift(event);
                        this.lastSync = time;
                        if (this.syncEvents.length > 10)
                            this.syncEvents.pop();
                        this.addSyncEvent(event);
                        // Refresh task stats after sync
                        this.refreshTaskStats();
                        this.updateStats();
                    }
                    else if (line.includes('No tasks found')) {
                        const time = new Date().toLocaleTimeString();
                        const event = `${chalk.gray(time)} ${chalk.dim('No tasks to sync')}`;
                        this.syncEvents.unshift(event);
                        this.lastSync = time;
                        if (this.syncEvents.length > 10)
                            this.syncEvents.pop();
                        this.addSyncEvent(event);
                        this.updateStats();
                    }
                });
            });
        }
        // Initial task load
        this.refreshTaskStats();
    }
    async refreshTaskStats() {
        try {
            const tasks = await this.backlogManager.listTasks();
            this.taskStats = {
                total: tasks.length,
                pending: tasks.filter(t => t.status === 'todo').length,
                inProgress: tasks.filter(t => t.status === 'in_progress').length,
                completed: tasks.filter(t => t.status === 'done').length
            };
        }
        catch (error) {
            // Ignore errors during refresh
        }
    }
    displayHeader() {
        console.clear();
        // Enhanced header with animation and better colors
        const title = '🚀 Critical Claude Live Sync Monitor';
        const subtitle = '⚡ Real-time Task & Hook Monitoring System';
        const titleWidth = Math.max(title.length, subtitle.length) + 6;
        const titleLine = '═'.repeat(titleWidth);
        console.log(chalk.hex('#FF6B6B').bold(`\n╔${titleLine}╗`));
        console.log(chalk.hex('#FF6B6B').bold(`║  ${chalk.hex('#4ECDC4').bold(title.padEnd(titleWidth - 2))}  ║`));
        console.log(chalk.hex('#FF6B6B').bold(`║  ${chalk.hex('#45B7D1').italic(subtitle.padEnd(titleWidth - 2))}  ║`));
        console.log(chalk.hex('#FF6B6B').bold(`╚${titleLine}╝\n`));
        // Enhanced status indicator
        const statusIndicator = this.getStatusIndicator();
        console.log(chalk.hex('#96CEB4')(`${statusIndicator} System Status: ${chalk.green.bold('● ONLINE')} | Monitoring: ${chalk.cyan.bold('ACTIVE')}\n`));
        // Enhanced Task Statistics with progress bars
        console.log(chalk.hex('#4ECDC4').bold('📊 Task Statistics') + this.getPulseIndicator());
        console.log(chalk.hex('#4ECDC4')('┌' + '─'.repeat(70) + '┐'));
        // Main stats row
        console.log(chalk.hex('#4ECDC4')('│ ') +
            `${chalk.hex('#FFE66D').bold('Total:')} ${chalk.hex('#FF6B6B').bold(this.taskStats.total.toString().padEnd(4))} ` +
            `${chalk.gray('│')} ` +
            `${chalk.hex('#FFE66D')('📋 Todo:')} ${chalk.hex('#FFE66D').bold(this.taskStats.pending.toString().padEnd(4))} ` +
            `${chalk.gray('│')} ` +
            `${chalk.hex('#45B7D1')('🚀 Active:')} ${chalk.hex('#45B7D1').bold(this.taskStats.inProgress.toString().padEnd(4))} ` +
            `${chalk.gray('│')} ` +
            `${chalk.hex('#96CEB4')('✅ Done:')} ${chalk.hex('#96CEB4').bold(this.taskStats.completed.toString().padEnd(4))} ` +
            chalk.hex('#4ECDC4')(' │'));
        // Progress bars
        const pendingBar = this.getProgressBar(this.taskStats.pending, this.taskStats.total, 15, '📋', '#FFE66D');
        const activeBar = this.getProgressBar(this.taskStats.inProgress, this.taskStats.total, 15, '🚀', '#45B7D1');
        const doneBar = this.getProgressBar(this.taskStats.completed, this.taskStats.total, 15, '✅', '#96CEB4');
        console.log(chalk.hex('#4ECDC4')('│ ') + pendingBar + chalk.hex('#4ECDC4')(' │'));
        console.log(chalk.hex('#4ECDC4')('│ ') + activeBar + chalk.hex('#4ECDC4')(' │'));
        console.log(chalk.hex('#4ECDC4')('│ ') + doneBar + chalk.hex('#4ECDC4')(' │'));
        console.log(chalk.hex('#4ECDC4')('└' + '─'.repeat(70) + '┘'));
        // Enhanced sync status
        const syncStatus = this.getSyncStatus();
        console.log(chalk.hex('#FECA57')(`   ${syncStatus} Last Sync: ${chalk.white.bold(this.lastSync)} ${this.getTimeSince()}\n`));
        // Enhanced Hook Activity header
        console.log(chalk.hex('#FF9FF3').bold('🪝 Hook Activity') + chalk.gray(' (Live)') + this.getActivityIndicator());
        console.log(chalk.hex('#FF9FF3')('┌' + '─'.repeat(48) + '┐'));
    }
    displayInitialActivity() {
        // Show hook events if any
        console.log(chalk.hex('#FF9FF3')('┌' + '─'.repeat(48) + '┐'));
        if (this.hookEvents.length === 0) {
            console.log(chalk.hex('#FF9FF3')('│ ') + chalk.gray('🔮 Waiting for hook activity...').padEnd(46) + chalk.hex('#FF9FF3')(' │'));
        }
        else {
            this.hookEvents.slice(0, 3).forEach(event => {
                const cleanEvent = event.replace(/\x1b\[[0-9;]*m/g, ''); // Strip ANSI codes for length calc
                const truncated = cleanEvent.length > 46 ? cleanEvent.substring(0, 43) + '...' : cleanEvent;
                console.log(chalk.hex('#FF9FF3')('│ ') + truncated.padEnd(46) + chalk.hex('#FF9FF3')(' │'));
            });
        }
        console.log(chalk.hex('#FF9FF3')('└' + '─'.repeat(48) + '┘\n'));
        // Enhanced Sync Activity with better width management
        console.log(chalk.hex('#54A0FF').bold('🔄 Sync Activity') + chalk.gray(' (Real-time)'));
        console.log(chalk.hex('#54A0FF')('┌' + '─'.repeat(50) + '┐'));
        if (this.syncEvents.length === 0) {
            console.log(chalk.hex('#54A0FF')('│ ') + chalk.gray('⏳ Waiting for sync events...').padEnd(48) + chalk.hex('#54A0FF')(' │'));
        }
        else {
            this.syncEvents.slice(0, 3).forEach(event => {
                const cleanEvent = event.replace(/\x1b\[[0-9;]*m/g, ''); // Strip ANSI codes
                const truncated = cleanEvent.length > 48 ? cleanEvent.substring(0, 45) + '...' : cleanEvent;
                console.log(chalk.hex('#54A0FF')('│ ') + truncated.padEnd(48) + chalk.hex('#54A0FF')(' │'));
            });
        }
        console.log(chalk.hex('#54A0FF')('└' + '─'.repeat(50) + '┘\n'));
        // Enhanced footer
        const footerText = '🎯 Live Monitor Active - Press Ctrl+C to exit';
        console.log(chalk.magenta('┌' + '─'.repeat(footerText.length + 2) + '┐'));
        console.log(chalk.magenta('│ ') + chalk.white.bold(footerText) + chalk.magenta(' │'));
        console.log(chalk.magenta('└' + '─'.repeat(footerText.length + 2) + '┘'));
    }
    updateStats() {
        // Don't use cursor positioning - it causes overlapping text
        // Just update the stats in the header when we do a full redraw
        this.taskStats = this.taskStats; // Keep stats current
    }
    addHookEvent(event) {
        // Add to hookEvents array and update the hook activity section
        this.hookEvents.unshift(event);
        if (this.hookEvents.length > 5) {
            this.hookEvents.pop(); // Keep only last 5 events
        }
        this.updateHookActivity();
        console.log(chalk.cyan('│ ') + event + chalk.cyan(' │'));
    }
    addSyncEvent(event) {
        // Add to syncEvents array and update the sync activity section
        this.syncEvents.unshift(event);
        if (this.syncEvents.length > 5) {
            this.syncEvents.pop(); // Keep only last 5 events
        }
        this.updateSyncActivity();
        console.log(chalk.green('│ ') + event + chalk.green(' │'));
    }
    updateHookActivity() {
        // Update hook activity section in place
        process.stdout.write('\u001b[s'); // Save cursor
        process.stdout.write('\u001b[15;1H'); // Move to hook activity content
        if (this.hookEvents.length === 0) {
            process.stdout.write('\u001b[2K'); // Clear line
            console.log(chalk.cyan('│ ') + chalk.gray('🔮 Waiting for hook activity...') + chalk.cyan('        │'));
        }
        else {
            // Clear and redraw hook events
            for (let i = 0; i < 5; i++) {
                process.stdout.write('\u001b[2K'); // Clear line
                if (i < this.hookEvents.length) {
                    console.log(chalk.cyan('│ ') + this.hookEvents[i] + chalk.cyan(' │'));
                }
                else {
                    console.log(chalk.cyan('│') + ' '.repeat(48) + chalk.cyan('│'));
                }
                if (i < 4)
                    process.stdout.write('\u001b[1B'); // Move down
            }
        }
        process.stdout.write('\u001b[u'); // Restore cursor
    }
    updateSyncActivity() {
        // Update sync activity section in place
        process.stdout.write('\u001b[s'); // Save cursor
        process.stdout.write('\u001b[20;1H'); // Move to sync activity content
        if (this.syncEvents.length === 0) {
            process.stdout.write('\u001b[2K'); // Clear line
            console.log(chalk.green('│ ') + chalk.gray('⏳ Waiting for sync events...') + chalk.green('                     │'));
        }
        else {
            // Clear and redraw sync events
            for (let i = 0; i < 5; i++) {
                process.stdout.write('\u001b[2K'); // Clear line
                if (i < this.syncEvents.length) {
                    console.log(chalk.green('│ ') + this.syncEvents[i] + chalk.green(' │'));
                }
                else {
                    console.log(chalk.green('│') + ' '.repeat(58) + chalk.green('│'));
                }
                if (i < 4)
                    process.stdout.write('\u001b[1B'); // Move down
            }
        }
        process.stdout.write('\u001b[u'); // Restore cursor
    }
    getStatusIndicator() {
        const indicators = ['⚡', '🔥', '✨', '💫'];
        return indicators[this.pulseState];
    }
    getPulseIndicator() {
        const pulses = [' ●', ' ◐', ' ◑', ' ◒'];
        return chalk.hex('#FF6B6B')(pulses[this.pulseState]);
    }
    getActivityIndicator() {
        const activity = [' ▫', ' ▪', ' ▫', ' ▪'];
        return chalk.hex('#FF9FF3')(activity[this.pulseState]);
    }
    getSyncIndicator() {
        const sync = [' ◐', ' ◓', ' ◑', ' ◒'];
        return chalk.hex('#54A0FF')(sync[this.pulseState]);
    }
    getProgressBar(value, total, width, icon, color) {
        if (total === 0)
            return `${icon} ${chalk.gray('─'.repeat(width))} 0%`.padEnd(68);
        const percentage = Math.round((value / total) * 100);
        const filled = Math.round((value / total) * width);
        const empty = width - filled;
        const bar = chalk.hex(color)('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
        const label = `${icon} ${bar} ${percentage}%`;
        return label.padEnd(68);
    }
    getSyncStatus() {
        const timeSince = Date.now() - this.lastUpdateTime;
        if (timeSince < 5000)
            return '🟢';
        if (timeSince < 30000)
            return '🟡';
        return '🔴';
    }
    getTimeSince() {
        if (this.lastSync === 'Never')
            return '';
        const now = new Date();
        const syncTime = new Date();
        const timeParts = this.lastSync.split(/[:\s]/);
        if (timeParts.length >= 3) {
            let hours = parseInt(timeParts[0]);
            const minutes = parseInt(timeParts[1]);
            const seconds = parseInt(timeParts[2]);
            const ampm = timeParts[3];
            if (ampm === 'PM' && hours !== 12)
                hours += 12;
            if (ampm === 'AM' && hours === 12)
                hours = 0;
            syncTime.setHours(hours, minutes, seconds, 0);
            const diffMs = now.getTime() - syncTime.getTime();
            const diffSecs = Math.floor(diffMs / 1000);
            if (diffSecs < 60)
                return chalk.green(`(${diffSecs}s ago)`);
            if (diffSecs < 3600)
                return chalk.yellow(`(${Math.floor(diffSecs / 60)}m ago)`);
            return chalk.red(`(${Math.floor(diffSecs / 3600)}h ago)`);
        }
        return '';
    }
    updateAnimations() {
        // Update status indicator animation
        process.stdout.write('\u001b[s'); // Save cursor
        process.stdout.write('\u001b[7;1H'); // Move to status line
        process.stdout.write('\u001b[2K'); // Clear line
        const statusIndicator = this.getStatusIndicator();
        console.log(chalk.hex('#96CEB4')(`${statusIndicator} System Status: ${chalk.green.bold('● ONLINE')} | Monitoring: ${chalk.cyan.bold('ACTIVE')}`));
        // Update pulse indicator in task statistics header
        process.stdout.write('\u001b[9;1H'); // Task stats header
        process.stdout.write('\u001b[2K');
        console.log(chalk.hex('#4ECDC4').bold('📊 Task Statistics') + this.getPulseIndicator());
        // Update activity indicator in hook header (approximate line 18)
        process.stdout.write('\u001b[18;1H');
        process.stdout.write('\u001b[2K');
        console.log(chalk.hex('#FF9FF3').bold('🪝 Hook Activity') + chalk.gray(' (Live)') + this.getActivityIndicator());
        // Update sync indicator in sync header (approximate line 22)
        process.stdout.write('\u001b[22;1H');
        process.stdout.write('\u001b[2K');
        console.log(chalk.hex('#54A0FF').bold('🔄 Sync Activity') + chalk.gray(' (Real-time)') + this.getSyncIndicator());
        process.stdout.write('\u001b[u'); // Restore cursor
    }
    cleanup() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        console.clear();
        // Beautiful goodbye message
        const goodbyeText = '👋 Live Monitor Stopped - Thanks for using Critical Claude!';
        console.log(chalk.magenta('\n╔' + '═'.repeat(goodbyeText.length + 2) + '╗'));
        console.log(chalk.magenta('║ ') + chalk.yellow.bold(goodbyeText) + chalk.magenta(' ║'));
        console.log(chalk.magenta('╚' + '═'.repeat(goodbyeText.length + 2) + '╝\n'));
    }
}
//# sourceMappingURL=live.js.map
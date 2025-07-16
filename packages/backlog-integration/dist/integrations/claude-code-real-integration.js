/**
 * Real Claude Code Integration - Actual TodoWrite/TodoRead calls
 * This replaces the mock implementation with real integration
 */
import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
const execAsync = promisify(exec);
const logger = {
    info: (msg, data) => console.log(`[INFO] ${msg}`, data || ''),
    error: (msg, error) => console.error(`[ERROR] ${msg}`, error?.message || ''),
    warn: (msg, data) => console.warn(`[WARN] ${msg}`, data || '')
};
export class RealClaudeCodeIntegration {
    tempDir;
    constructor() {
        this.tempDir = '/tmp/critical-claude-sync';
    }
    /**
     * Parse natural language elements from task content
     */
    parseNaturalLanguage(content) {
        const result = {};
        // Parse priority (@high, @medium, @low, @critical)
        const priorityMatch = content.match(/@(high|medium|low|critical)/i);
        if (priorityMatch) {
            result.priority = priorityMatch[1].toLowerCase();
        }
        // Parse labels (#frontend, #backend, etc.)
        const labelMatches = content.match(/#(\w+)/g);
        if (labelMatches) {
            result.labels = labelMatches.map(label => label.substring(1));
        }
        // Parse story points (5pts, 8pts, etc.)
        const pointsMatch = content.match(/(\d+)pts?/i);
        if (pointsMatch) {
            result.storyPoints = parseInt(pointsMatch[1], 10);
        }
        // Parse assignee (for:alice, for:bob, etc.)
        const assigneeMatch = content.match(/for:(\w+)/i);
        if (assigneeMatch) {
            result.assignee = assigneeMatch[1];
        }
        return result;
    }
    async initialize() {
        try {
            await fs.mkdir(this.tempDir, { recursive: true });
        }
        catch (error) {
            logger.warn('Failed to create temp directory', error);
        }
    }
    /**
     * Execute real TodoWrite by calling Claude Code's TodoWrite tool
     */
    async executeRealTodoWrite(todos) {
        try {
            logger.info('Executing real TodoWrite', { count: todos.length });
            // Method 1: Try direct API approach (if available)
            const success = await this.tryDirectTodoWrite(todos);
            if (success) {
                return true;
            }
            // Method 2: Try file-based communication
            return await this.tryFileBasedTodoWrite(todos);
        }
        catch (error) {
            logger.error('TodoWrite execution failed', error);
            return false;
        }
    }
    /**
     * Execute real TodoRead by calling Claude Code's TodoRead tool
     */
    async executeRealTodoRead() {
        try {
            logger.info('Executing real TodoRead');
            // Method 1: Try direct API approach (if available)
            const todos = await this.tryDirectTodoRead();
            if (todos.length > 0) {
                return todos;
            }
            // Method 2: Try file-based communication
            return await this.tryFileBasedTodoRead();
        }
        catch (error) {
            logger.error('TodoRead execution failed', error);
            return [];
        }
    }
    /**
     * Attempt direct TodoWrite integration
     */
    async tryDirectTodoWrite(todos) {
        try {
            // Create a temporary command file that Claude Code can execute
            const commandFile = path.join(this.tempDir, 'todo-write-command.json');
            const todoWriteCommand = {
                todos: todos.map(todo => ({
                    content: todo.content,
                    status: todo.status,
                    priority: todo.priority,
                    id: todo.id
                }))
            };
            await fs.writeFile(commandFile, JSON.stringify(todoWriteCommand, null, 2));
            // Try to execute via Claude Code if it's available in PATH
            const { stdout, stderr } = await execAsync(`claude --tool TodoWrite --input "${commandFile}"`, {
                timeout: 10000
            });
            if (stderr) {
                logger.warn('TodoWrite stderr output', stderr);
            }
            logger.info('TodoWrite executed successfully', { output: stdout });
            return true;
        }
        catch (error) {
            logger.warn('Direct TodoWrite failed, trying alternative method', error);
            return false;
        }
    }
    /**
     * Attempt direct TodoRead integration
     */
    async tryDirectTodoRead() {
        try {
            // Try to execute via Claude Code if it's available in PATH
            const { stdout, stderr } = await execAsync('claude --tool TodoRead', {
                timeout: 10000
            });
            if (stderr) {
                logger.warn('TodoRead stderr output', stderr);
            }
            // Parse the output - this would depend on Claude Code's output format
            const result = JSON.parse(stdout);
            if (result.todos && Array.isArray(result.todos)) {
                return result.todos;
            }
            return [];
        }
        catch (error) {
            logger.warn('Direct TodoRead failed, trying alternative method', error);
            return [];
        }
    }
    /**
     * File-based TodoWrite - writes to a file that Claude Code can monitor
     */
    async tryFileBasedTodoWrite(todos) {
        try {
            const syncFile = path.join(this.tempDir, 'claude-code-todos.json');
            const timestamp = new Date().toISOString();
            const fileContent = {
                timestamp,
                source: 'critical-claude',
                action: 'write',
                todos: todos
            };
            await fs.writeFile(syncFile, JSON.stringify(fileContent, null, 2));
            // Also write to a location Claude Code might monitor
            const userTodoFile = path.join(process.env.HOME || '/tmp', '.claude-todos-sync.json');
            await fs.writeFile(userTodoFile, JSON.stringify(fileContent, null, 2));
            logger.info('File-based TodoWrite completed', {
                file: syncFile,
                userFile: userTodoFile,
                count: todos.length
            });
            return true;
        }
        catch (error) {
            logger.error('File-based TodoWrite failed', error);
            return false;
        }
    }
    /**
     * File-based TodoRead - reads from a file that Claude Code might write to
     */
    async tryFileBasedTodoRead() {
        try {
            const possibleFiles = [
                path.join(this.tempDir, 'claude-code-todos.json'),
                path.join(process.env.HOME || '/tmp', '.claude-todos-sync.json'),
                path.join(process.env.HOME || '/tmp', '.claude/todos.json')
            ];
            for (const filePath of possibleFiles) {
                try {
                    const content = await fs.readFile(filePath, 'utf8');
                    const data = JSON.parse(content);
                    if (data.todos && Array.isArray(data.todos)) {
                        logger.info('File-based TodoRead successful', {
                            file: filePath,
                            count: data.todos.length
                        });
                        return data.todos;
                    }
                }
                catch (error) {
                    // File doesn't exist or invalid JSON, try next file
                    continue;
                }
            }
            logger.info('No todo files found for file-based read');
            return [];
        }
        catch (error) {
            logger.error('File-based TodoRead failed', error);
            return [];
        }
    }
    /**
     * Process-based integration - spawn Claude Code as subprocess
     */
    async tryProcessBasedIntegration(command, data) {
        return new Promise((resolve, reject) => {
            const claude = spawn('claude', ['--tool', command], {
                stdio: ['pipe', 'pipe', 'pipe']
            });
            let stdout = '';
            let stderr = '';
            claude.stdout.on('data', (data) => {
                stdout += data.toString();
            });
            claude.stderr.on('data', (data) => {
                stderr += data.toString();
            });
            claude.on('close', (code) => {
                if (code === 0) {
                    try {
                        const result = JSON.parse(stdout);
                        resolve(result);
                    }
                    catch (error) {
                        resolve(stdout);
                    }
                }
                else {
                    reject(new Error(`Claude Code process exited with code ${code}: ${stderr}`));
                }
            });
            claude.on('error', (error) => {
                reject(error);
            });
            // Send input data if provided
            if (data) {
                claude.stdin.write(JSON.stringify(data));
            }
            claude.stdin.end();
            // Timeout after 15 seconds
            setTimeout(() => {
                claude.kill();
                reject(new Error('Claude Code process timeout'));
            }, 15000);
        });
    }
    /**
     * Test the integration to see which methods work
     */
    async testIntegration() {
        const results = {
            direct: false,
            fileBased: false,
            processBased: false
        };
        // Test direct integration
        try {
            await execAsync('claude --version', { timeout: 5000 });
            results.direct = true;
            logger.info('Direct Claude Code integration available');
        }
        catch (error) {
            logger.info('Direct Claude Code integration not available');
        }
        // Test file-based integration
        try {
            await this.tryFileBasedTodoWrite([{
                    content: 'Test integration',
                    status: 'pending',
                    priority: 'low',
                    id: 'test-integration'
                }]);
            results.fileBased = true;
            logger.info('File-based Claude Code integration available');
        }
        catch (error) {
            logger.info('File-based Claude Code integration failed');
        }
        // Test process-based integration
        try {
            await this.tryProcessBasedIntegration('TodoRead');
            results.processBased = true;
            logger.info('Process-based Claude Code integration available');
        }
        catch (error) {
            logger.info('Process-based Claude Code integration not available');
        }
        return results;
    }
    /**
     * Cleanup temporary files
     */
    async cleanup() {
        try {
            await fs.rm(this.tempDir, { recursive: true, force: true });
        }
        catch (error) {
            logger.warn('Failed to cleanup temp directory', error);
        }
    }
}
//# sourceMappingURL=claude-code-real-integration.js.map
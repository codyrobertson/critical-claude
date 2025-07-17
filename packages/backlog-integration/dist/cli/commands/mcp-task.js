/**
 * MCP Task Command - Uses the new AI-powered MCP server for task management
 * Connects to critical-claude-mcp server for enhanced task operations
 */
import chalk from 'chalk';
import { MCPClientManager } from '../mcp-client.js';
export class MCPTaskCommand {
    constructor() {
        // MCP client will be initialized automatically
    }
    async execute(action, input, options) {
        try {
            switch (action) {
                case 'create':
                    await this.createTask(input, options);
                    break;
                case 'list':
                    await this.listTasks(options);
                    break;
                case 'view':
                case 'show':
                    await this.viewTask(input, options);
                    break;
                case 'edit':
                case 'update':
                    await this.updateTask(input, options);
                    break;
                case 'archive':
                    await this.archiveTask(input);
                    break;
                case 'board':
                    await this.showBoard(options);
                    break;
                case 'ai-create':
                case 'ai':
                    await this.aiCreateTasks(input, options);
                    break;
                case 'ai-expand':
                    await this.aiExpandTask(input, options);
                    break;
                case 'ai-deps':
                case 'dependencies':
                    await this.aiAnalyzeDependencies(input, options);
                    break;
                case 'init':
                    await this.initializeTaskSystem();
                    break;
                default:
                    await this.listTasks(options);
            }
        }
        catch (error) {
            console.error(chalk.red('❌ Error:'), error.message);
            process.exit(1);
        }
    }
    /**
     * Get the MCP client instance
     */
    async getMCPClient() {
        return await MCPClientManager.getClient();
    }
    async createTask(input, options) {
        const title = Array.isArray(input) ? input.join(' ') : input || '';
        if (!title) {
            console.error(chalk.red('❌ Task title is required'));
            return;
        }
        console.log(chalk.blue('📝 Creating task with AI-powered task management...'));
        const client = await this.getMCPClient();
        const response = await client.createTask({
            title,
            description: options.description,
            priority: options.priority,
            assignee: options.assignee,
            labels: options.labels,
            status: options.status || 'To Do',
            draft: options.draft
        });
        this.displayResponse(response);
    }
    async listTasks(options) {
        console.log(chalk.blue('📋 Fetching tasks from AI-powered task system...'));
        const client = await this.getMCPClient();
        const response = await client.listTasks({
            status: options.status,
            assignee: options.assignee,
            labels: options.labels,
            includeDrafts: options.includeDrafts || false,
            plain: options.plain || false
        });
        this.displayResponse(response);
    }
    async viewTask(input, options) {
        const taskId = Array.isArray(input) ? input[0] : input;
        if (!taskId) {
            console.error(chalk.red('❌ Task ID is required'));
            return;
        }
        console.log(chalk.blue(`🔍 Viewing task ${taskId}...`));
        const response = await this.callMCPServer('task.view', {
            id: taskId,
            plain: options.plain || false
        });
        this.displayResponse(response);
    }
    async updateTask(input, options) {
        const taskId = Array.isArray(input) ? input[0] : input;
        if (!taskId) {
            console.error(chalk.red('❌ Task ID is required'));
            return;
        }
        console.log(chalk.blue(`✏️ Updating task ${taskId}...`));
        const args = {
            id: taskId,
            title: options.title,
            description: options.description,
            status: options.status,
            priority: options.priority,
            assignee: options.assignee,
            labels: options.labels
        };
        // Remove undefined values
        Object.keys(args).forEach(key => {
            if (args[key] === undefined) {
                delete args[key];
            }
        });
        const response = await this.callMCPServer('task.edit', args);
        this.displayResponse(response);
    }
    async archiveTask(input) {
        const taskId = Array.isArray(input) ? input[0] : input;
        if (!taskId) {
            console.error(chalk.red('❌ Task ID is required'));
            return;
        }
        console.log(chalk.blue(`🗄️ Archiving task ${taskId}...`));
        const response = await this.callMCPServer('task.archive', { id: taskId });
        this.displayResponse(response);
    }
    async showBoard(options) {
        console.log(chalk.blue('📊 Generating Kanban board...'));
        const response = await this.callMCPServer('board.view', {});
        this.displayResponse(response);
    }
    async aiCreateTasks(input, options) {
        const text = Array.isArray(input) ? input.join(' ') : input || '';
        if (!text) {
            console.error(chalk.red('❌ Text or file path is required for AI task creation'));
            return;
        }
        console.log(chalk.blue('🧠 AI is generating tasks...'));
        // Check if input looks like a file path
        if (text.includes('.') && (text.includes('/') || text.includes('\\\\'))) {
            const response = await this.callMCPServer('ai.from-file', {
                filePath: text,
                projectContext: options.context,
                expandLevel: options.expand || 2,
                autoGenerateDependencies: options.deps !== false
            });
            this.displayResponse(response);
        }
        else {
            const response = await this.callMCPServer('ai.from-text', {
                text,
                projectContext: options.context,
                expandLevel: options.expand || 2,
                autoGenerateDependencies: options.deps !== false
            });
            this.displayResponse(response);
        }
    }
    async aiExpandTask(input, options) {
        const taskId = Array.isArray(input) ? input[0] : input;
        if (!taskId) {
            console.error(chalk.red('❌ Task ID is required for expansion'));
            return;
        }
        console.log(chalk.blue(`🔄 AI is expanding task ${taskId} into subtasks...`));
        const response = await this.callMCPServer('ai.expand', {
            parentId: taskId,
            projectContext: options.context,
            expandLevel: options.level || 2
        });
        this.displayResponse(response);
    }
    async aiAnalyzeDependencies(input, options) {
        const taskId = Array.isArray(input) ? input[0] : input;
        console.log(chalk.blue('🔗 AI is analyzing task dependencies...'));
        const response = await this.callMCPServer('ai.dependencies', {
            id: taskId // Optional - analyzes specific task or all tasks
        });
        this.displayResponse(response);
    }
    async initializeTaskSystem() {
        console.log(chalk.blue('🚀 Initializing Critical Claude task system...'));
        const response = await this.callMCPServer('init', {});
        this.displayResponse(response);
    }
    /**
     * Display the MCP server response in a user-friendly format
     */
    displayResponse(response) {
        if (response.content && Array.isArray(response.content)) {
            for (const content of response.content) {
                if (content.type === 'text') {
                    console.log(content.text);
                }
            }
        }
        else if (response.text) {
            console.log(response.text);
        }
        else if (response.message) {
            console.log(response.message);
        }
        else {
            console.log(JSON.stringify(response, null, 2));
        }
    }
    /**
     * Show usage information
     */
    showUsage() {
        console.log(chalk.blue('\n📚 Critical Claude AI-Powered Task Management\n'));
        console.log(chalk.yellow('Basic Commands:'));
        console.log('  cc task list                     - List all tasks');
        console.log('  cc task create "Task title"      - Create a new task');
        console.log('  cc task view <id>                - View task details');
        console.log('  cc task edit <id>                - Edit a task');
        console.log('  cc task archive <id>             - Archive a task');
        console.log('  cc task board                    - Show Kanban board');
        console.log(chalk.yellow('\nAI-Powered Commands:'));
        console.log('  cc task ai "Build auth system"   - AI generates tasks from description');
        console.log('  cc task ai ./requirements.md     - AI generates tasks from PRD file');
        console.log('  cc task ai-expand <id>           - AI expands task into subtasks');
        console.log('  cc task dependencies             - AI analyzes task dependencies');
        console.log(chalk.yellow('\nOptions:'));
        console.log('  --priority <level>               - Set priority (low|medium|high|critical)');
        console.log('  --status <status>                - Set status (To Do|In Progress|Done|Blocked)');
        console.log('  --assignee <user>                - Assign to user');
        console.log('  --labels <label1,label2>         - Add labels');
        console.log('  --context <project>              - Set project context for AI');
        console.log('  --expand <level>                 - AI expansion depth (1-3)');
        console.log('  --plain                          - Plain text output (no formatting)');
        console.log(chalk.green('\n✨ Powered by Critical Claude AI task generation'));
    }
}
//# sourceMappingURL=mcp-task.js.map
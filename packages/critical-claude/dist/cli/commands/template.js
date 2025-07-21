/**
 * Task Template Command
 * Generate project scaffolding from task templates
 */
import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import toml from '@iarna/toml';
import { UnifiedStorageManager } from '../../core/unified-storage.js';
import { AITaskManager } from '../../core/ai-task-manager.js';
export class TemplateCommand {
    storage;
    aiManager;
    constructor() {
        this.storage = new UnifiedStorageManager();
        this.aiManager = new AITaskManager(this.storage);
    }
    async execute(action, args, options) {
        await this.storage.initialize();
        // AI Manager doesn't need initialization
        switch (action) {
            case 'list':
            case 'ls':
                await this.listTemplates(options);
                break;
            case 'apply':
            case 'use':
                await this.applyTemplate(args[0], options);
                break;
            case 'create':
            case 'new':
                await this.createTemplate(args[0], options);
                break;
            case 'show':
            case 'view':
                await this.showTemplate(args[0], options);
                break;
            case 'export':
                await this.exportTemplate(args[0], options);
                break;
            default:
                console.log(this.getUsageHelp());
        }
    }
    async listTemplates(options) {
        console.log(chalk.cyan('📋 Available Task Templates:\n'));
        // Built-in templates
        const builtInTemplates = await this.getBuiltInTemplates();
        console.log(chalk.yellow('Built-in Templates:'));
        for (const template of builtInTemplates) {
            console.log(`  ${chalk.green(template.name)} - ${template.description}`);
        }
        // User templates
        const userTemplates = await this.getUserTemplates();
        if (userTemplates.length > 0) {
            console.log(chalk.yellow('\nUser Templates:'));
            for (const template of userTemplates) {
                console.log(`  ${chalk.blue(template.name)} - ${template.description}`);
            }
        }
        console.log(chalk.gray('\nUse "cc template apply <name>" to apply a template'));
    }
    async applyTemplate(templateName, options) {
        if (!templateName) {
            throw new Error('Template name is required');
        }
        console.log(chalk.cyan(`🚀 Applying template: ${templateName}`));
        const template = await this.loadTemplate(templateName);
        if (!template) {
            throw new Error(`Template not found: ${templateName}`);
        }
        // Process variables
        const variables = await this.processVariables(template, options);
        // Create tasks from template
        const createdTasks = await this.createTasksFromTemplate(template, variables, options);
        console.log(chalk.green(`✅ Created ${createdTasks.length} tasks from template: ${templateName}`));
        if (!options.quiet) {
            console.log(chalk.cyan('\nCreated tasks:'));
            for (const task of createdTasks) {
                console.log(`  ${chalk.green('✓')} ${task.title} (${task.id})`);
            }
        }
    }
    async createTemplate(templateName, options) {
        if (!templateName) {
            throw new Error('Template name is required');
        }
        console.log(chalk.cyan(`📝 Creating template from current tasks: ${templateName}`));
        // Get tasks to include in template
        const tasks = await this.selectTasksForTemplate(options);
        if (tasks.length === 0) {
            throw new Error('No tasks selected for template');
        }
        // Build template structure
        const template = {
            name: templateName,
            description: options.description || `Template created from ${tasks.length} tasks`,
            tasks: tasks.map(task => this.convertTaskToTemplate(task)),
            variables: {}
        };
        // Save template
        await this.saveTemplate(template);
        console.log(chalk.green(`✅ Created template: ${templateName} with ${tasks.length} tasks`));
    }
    async showTemplate(templateName, options) {
        if (!templateName) {
            throw new Error('Template name is required');
        }
        const template = await this.loadTemplate(templateName);
        if (!template) {
            throw new Error(`Template not found: ${templateName}`);
        }
        console.log(chalk.cyan(`📋 Template: ${template.name}\n`));
        console.log(`Description: ${template.description}`);
        console.log(`Tasks: ${template.tasks.length}`);
        if (template.variables && Object.keys(template.variables).length > 0) {
            console.log(chalk.yellow('\nVariables:'));
            for (const [key, value] of Object.entries(template.variables)) {
                console.log(`  ${key}: ${value}`);
            }
        }
        console.log(chalk.yellow('\nTasks:'));
        this.printTemplateTasks(template.tasks, '  ');
    }
    async exportTemplate(templateName, options) {
        if (!templateName) {
            throw new Error('Template name is required');
        }
        const template = await this.loadTemplate(templateName);
        if (!template) {
            throw new Error(`Template not found: ${templateName}`);
        }
        const outputPath = options.output || `${templateName}.toml`;
        const content = toml.stringify(template);
        await fs.writeFile(outputPath, content, 'utf8');
        console.log(chalk.green(`✅ Exported template to: ${outputPath}`));
    }
    // Helper methods
    async getBuiltInTemplates() {
        return [
            {
                name: 'web-app',
                description: 'Full-stack web application with React and Node.js',
                tasks: []
            },
            {
                name: 'api-service',
                description: 'RESTful API service with authentication',
                tasks: []
            },
            {
                name: 'cli-tool',
                description: 'Command-line tool with TypeScript',
                tasks: []
            },
            {
                name: 'mobile-app',
                description: 'Mobile application with React Native',
                tasks: []
            }
        ];
    }
    async getUserTemplates() {
        const templates = [];
        // Check both .cc/templates and .critical-claude/templates
        const templateDirs = [
            path.join(process.cwd(), '.cc', 'templates'),
            path.join(process.cwd(), '.critical-claude', 'templates')
        ];
        for (const templateDir of templateDirs) {
            try {
                await fs.access(templateDir);
                const files = await fs.readdir(templateDir);
                for (const file of files) {
                    if (file.endsWith('.toml')) {
                        const content = await fs.readFile(path.join(templateDir, file), 'utf8');
                        const template = toml.parse(content);
                        templates.push(template);
                    }
                }
            }
            catch {
                // Directory doesn't exist, skip it
            }
        }
        return templates;
    }
    async loadTemplate(name) {
        // Check built-in templates first
        const builtIn = await this.loadBuiltInTemplate(name);
        if (builtIn)
            return builtIn;
        // Check user templates in both directories
        const userTemplatePaths = [
            path.join(process.cwd(), '.cc', 'templates', `${name}.toml`),
            path.join(process.cwd(), '.critical-claude', 'templates', `${name}.toml`)
        ];
        for (const templatePath of userTemplatePaths) {
            try {
                const content = await fs.readFile(templatePath, 'utf8');
                return toml.parse(content);
            }
            catch {
                // File doesn't exist, try next path
            }
        }
        return null;
    }
    async loadBuiltInTemplate(name) {
        const templates = {
            'web-app': {
                name: 'web-app',
                description: 'Full-stack web application with React and Node.js',
                variables: {
                    project_name: 'my-app',
                    database: 'postgresql'
                },
                tasks: [
                    {
                        title: 'Project Setup',
                        description: 'Initialize project structure and dependencies',
                        priority: 'high',
                        labels: ['setup', 'infrastructure'],
                        points: 3,
                        subtasks: [
                            {
                                title: 'Initialize Git repository',
                                labels: ['git', 'setup']
                            },
                            {
                                title: 'Setup monorepo structure',
                                labels: ['monorepo', 'setup']
                            },
                            {
                                title: 'Configure ESLint and Prettier',
                                labels: ['tooling', 'setup']
                            }
                        ]
                    },
                    {
                        title: 'Backend API Development',
                        description: 'Create RESTful API with {{database}} database',
                        priority: 'high',
                        labels: ['backend', 'api'],
                        points: 8,
                        depends_on: ['Project Setup'],
                        subtasks: [
                            {
                                title: 'Setup Express server',
                                labels: ['express', 'backend']
                            },
                            {
                                title: 'Implement authentication',
                                labels: ['auth', 'security']
                            },
                            {
                                title: 'Create database models',
                                labels: ['database', 'models']
                            }
                        ]
                    },
                    {
                        title: 'Frontend Development',
                        description: 'Build React frontend for {{project_name}}',
                        priority: 'high',
                        labels: ['frontend', 'react'],
                        points: 8,
                        depends_on: ['Project Setup'],
                        subtasks: [
                            {
                                title: 'Setup React with Vite',
                                labels: ['react', 'vite']
                            },
                            {
                                title: 'Implement routing',
                                labels: ['routing', 'frontend']
                            },
                            {
                                title: 'Create UI components',
                                labels: ['ui', 'components']
                            }
                        ]
                    },
                    {
                        title: 'Testing',
                        description: 'Implement comprehensive test coverage',
                        priority: 'medium',
                        labels: ['testing', 'quality'],
                        points: 5,
                        depends_on: ['Backend API Development', 'Frontend Development']
                    },
                    {
                        title: 'Deployment',
                        description: 'Deploy to production environment',
                        priority: 'medium',
                        labels: ['deployment', 'devops'],
                        points: 3,
                        depends_on: ['Testing']
                    }
                ]
            }
        };
        return templates[name] || null;
    }
    async processVariables(template, options) {
        const variables = {};
        if (template.variables) {
            for (const [key, defaultValue] of Object.entries(template.variables)) {
                variables[key] = options[key] || defaultValue;
            }
        }
        return variables;
    }
    async createTasksFromTemplate(template, variables, options) {
        const createdTasks = [];
        const taskMap = new Map(); // template title -> created task ID
        // Create tasks in order, respecting dependencies
        for (const templateTask of template.tasks) {
            const task = await this.createTaskFromTemplate(templateTask, variables, taskMap, options);
            createdTasks.push(task);
        }
        return createdTasks;
    }
    async createTaskFromTemplate(templateTask, variables, taskMap, options, parentId) {
        // Replace variables in title and description
        const title = this.replaceVariables(templateTask.title, variables);
        const description = templateTask.description
            ? this.replaceVariables(templateTask.description, variables)
            : undefined;
        // Build dependencies
        const dependencies = [];
        if (templateTask.depends_on) {
            for (const depTitle of templateTask.depends_on) {
                const depId = taskMap.get(depTitle);
                if (depId) {
                    dependencies.push(depId);
                }
            }
        }
        // Create the task
        const task = await this.storage.createTask({
            title,
            description,
            priority: (templateTask.priority || 'medium'),
            labels: templateTask.labels || [],
            storyPoints: templateTask.points,
            estimatedHours: templateTask.hours,
            dependencies: dependencies.length > 0 ? dependencies : undefined,
            aiGenerated: false,
            source: 'manual',
            draft: options.draft || false,
            customFields: templateTask.custom
        });
        // Store mapping for dependency resolution
        taskMap.set(templateTask.title, task.id);
        // Create subtasks if any
        if (templateTask.subtasks) {
            for (const subtask of templateTask.subtasks) {
                await this.createTaskFromTemplate(subtask, variables, taskMap, options, task.id);
            }
        }
        return task;
    }
    replaceVariables(text, variables) {
        let result = text;
        for (const [key, value] of Object.entries(variables)) {
            const pattern = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
            result = result.replace(pattern, value);
        }
        return result;
    }
    async selectTasksForTemplate(options) {
        const filter = {
            status: options.status,
            priority: options.priority,
            labels: options.labels,
            includeArchived: false
        };
        const tasks = await this.storage.listTasks({
            filter,
            sortBy: 'createdAt',
            sortOrder: 'asc',
            plain: false
        });
        return tasks;
    }
    convertTaskToTemplate(task) {
        return {
            title: task.title,
            description: task.description,
            priority: task.priority,
            labels: task.labels,
            points: task.storyPoints,
            hours: task.estimatedHours,
            depends_on: task.dependencies
        };
    }
    async saveTemplate(template) {
        const templateDir = path.join(process.cwd(), '.cc', 'templates');
        // Ensure directory exists
        await fs.mkdir(templateDir, { recursive: true });
        const filePath = path.join(templateDir, `${template.name}.toml`);
        const content = toml.stringify(template);
        await fs.writeFile(filePath, content, 'utf8');
    }
    printTemplateTasks(tasks, indent = '') {
        for (const task of tasks) {
            console.log(`${indent}• ${task.title}`);
            if (task.labels && task.labels.length > 0) {
                console.log(chalk.gray(`${indent}  Labels: ${task.labels.join(', ')}`));
            }
            if (task.depends_on && task.depends_on.length > 0) {
                console.log(chalk.gray(`${indent}  Depends on: ${task.depends_on.join(', ')}`));
            }
            if (task.subtasks) {
                this.printTemplateTasks(task.subtasks, indent + '  ');
            }
        }
    }
    getUsageHelp() {
        return `📋 Critical Claude Task Templates

Usage: cc template [action] [args...] [options]

Actions:
  list, ls                 List available templates
  apply, use <name>        Apply a template to create tasks
  create, new <name>       Create a template from existing tasks
  show, view <name>        Show template details
  export <name>            Export template to file

Options:
  -d, --description <desc> Template description
  -o, --output <file>      Output file for export
  --draft                  Create tasks as drafts
  --status <status>        Filter tasks by status (for create)
  --priority <priority>    Filter tasks by priority (for create)
  --labels <labels...>     Filter tasks by labels (for create)
  -q, --quiet              Suppress detailed output

Variables:
  Templates support variables using {{variable_name}} syntax.
  Pass variables as options when applying templates:
  cc template apply web-app --project_name "my-awesome-app" --database "mongodb"

Examples:
  cc template list
  cc template apply web-app --project_name "my-app"
  cc template create my-workflow --description "My custom workflow"
  cc template show web-app
  cc template export my-workflow -o my-workflow.toml`;
    }
}
//# sourceMappingURL=template.js.map
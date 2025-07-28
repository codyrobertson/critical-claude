/**
 * Simplified Template Service
 * Consolidates TemplateService + 4 UseCase classes into direct service methods
 */
import { createTemplate, getTaskCount, processTemplateVariables, createTask, createSuccessResult, createErrorResult } from '../models/index.js';
import { logger } from '../utils/Logger.js';
export class TemplateService {
    storage;
    COLLECTION = 'templates';
    TASKS_COLLECTION = 'tasks';
    constructor(storage) {
        this.storage = storage;
    }
    // Built-in templates
    getBuiltInTemplates() {
        const now = new Date();
        return [
            {
                id: 'basic-project',
                name: 'basic-project',
                description: 'Generic project structure with common phases',
                variables: {
                    project_name: 'My Project',
                    project_type: 'Web Application'
                },
                metadata: {
                    author: 'Critical Claude',
                    tags: ['project', 'basic', 'generic'],
                    version: '1.0.0',
                    createdAt: now,
                    updatedAt: now
                },
                tasks: [
                    {
                        title: 'Project Setup for {{project_name}}',
                        description: 'Initialize {{project_type}} project structure and dependencies',
                        priority: 'high',
                        labels: ['setup', 'initialization'],
                        hours: 4
                    },
                    {
                        title: 'Design System Architecture',
                        description: 'Define overall architecture and technology stack for {{project_name}}',
                        priority: 'high',
                        labels: ['architecture', 'design'],
                        hours: 8
                    },
                    {
                        title: 'Development Environment Setup',
                        description: 'Configure development tools, linting, testing framework',
                        priority: 'medium',
                        labels: ['development', 'tools'],
                        hours: 6
                    },
                    {
                        title: 'Core Feature Implementation',
                        description: 'Implement main functionality for {{project_name}}',
                        priority: 'high',
                        labels: ['development', 'features'],
                        hours: 24
                    },
                    {
                        title: 'Testing & Quality Assurance',
                        description: 'Write tests and perform quality checks',
                        priority: 'medium',
                        labels: ['testing', 'qa'],
                        hours: 12
                    },
                    {
                        title: 'Documentation & Deployment',
                        description: 'Create documentation and deploy {{project_name}}',
                        priority: 'medium',
                        labels: ['documentation', 'deployment'],
                        hours: 8
                    }
                ]
            },
            {
                id: 'bug-fix',
                name: 'bug-fix',
                description: 'Systematic bug fix workflow',
                variables: {
                    bug_description: 'Bug description',
                    affected_component: 'Component name'
                },
                metadata: {
                    author: 'Critical Claude',
                    tags: ['bug', 'fix', 'workflow'],
                    version: '1.0.0',
                    createdAt: now,
                    updatedAt: now
                },
                tasks: [
                    {
                        title: 'Bug Investigation: {{bug_description}}',
                        description: 'Reproduce and analyze the bug in {{affected_component}}',
                        priority: 'high',
                        labels: ['bug', 'investigation'],
                        hours: 2
                    },
                    {
                        title: 'Root Cause Analysis',
                        description: 'Identify the root cause of {{bug_description}}',
                        priority: 'high',
                        labels: ['analysis', 'debugging'],
                        hours: 3
                    },
                    {
                        title: 'Fix Implementation',
                        description: 'Implement fix for {{bug_description}} in {{affected_component}}',
                        priority: 'high',
                        labels: ['fix', 'implementation'],
                        hours: 4
                    },
                    {
                        title: 'Testing & Verification',
                        description: 'Test the fix and verify bug is resolved',
                        priority: 'high',
                        labels: ['testing', 'verification'],
                        hours: 2
                    },
                    {
                        title: 'Regression Testing',
                        description: 'Ensure fix doesn\'t break existing functionality',
                        priority: 'medium',
                        labels: ['testing', 'regression'],
                        hours: 3
                    }
                ]
            },
            {
                id: 'webapp',
                name: 'webapp',
                description: 'Full-stack web application development',
                variables: {
                    app_name: 'Web App',
                    tech_stack: 'React/Node.js'
                },
                metadata: {
                    author: 'Critical Claude',
                    tags: ['webapp', 'fullstack', 'development'],
                    version: '1.0.0',
                    createdAt: now,
                    updatedAt: now
                },
                tasks: [
                    {
                        title: 'Backend API Design for {{app_name}}',
                        description: 'Design RESTful API endpoints and data models',
                        priority: 'high',
                        labels: ['backend', 'api', 'design'],
                        hours: 8
                    },
                    {
                        title: 'Database Schema Design',
                        description: 'Create database schema and migrations',
                        priority: 'high',
                        labels: ['database', 'schema'],
                        hours: 6
                    },
                    {
                        title: 'Frontend Architecture Setup',
                        description: 'Setup {{tech_stack}} frontend structure and routing',
                        priority: 'high',
                        labels: ['frontend', 'setup'],
                        hours: 8
                    },
                    {
                        title: 'Authentication System',
                        description: 'Implement user authentication and authorization',
                        priority: 'high',
                        labels: ['auth', 'security'],
                        hours: 12
                    },
                    {
                        title: 'Core Features Development',
                        description: 'Develop main features for {{app_name}}',
                        priority: 'high',
                        labels: ['features', 'development'],
                        hours: 32
                    },
                    {
                        title: 'UI/UX Implementation',
                        description: 'Implement responsive design and user experience',
                        priority: 'medium',
                        labels: ['ui', 'ux', 'design'],
                        hours: 16
                    },
                    {
                        title: 'Testing & Deployment',
                        description: 'End-to-end testing and production deployment',
                        priority: 'medium',
                        labels: ['testing', 'deployment'],
                        hours: 12
                    }
                ]
            }
        ];
    }
    async listTemplates() {
        const startTime = Date.now();
        logger.operation('Listing templates');
        try {
            const userTemplates = await this.storage.findAll(this.COLLECTION);
            const builtInTemplates = this.getBuiltInTemplates();
            const allTemplates = [...builtInTemplates, ...userTemplates];
            logger.performance('Template listing', startTime);
            logger.debug('Templates listed', { builtIn: builtInTemplates.length, user: userTemplates.length });
            return {
                success: true,
                data: allTemplates
            };
        }
        catch (error) {
            logger.error('Failed to list templates', error);
            return {
                success: false,
                error: `Failed to list templates: ${error instanceof Error ? error.message : error}`
            };
        }
    }
    async viewTemplate(options) {
        try {
            // Check built-in templates first
            const builtInTemplates = this.getBuiltInTemplates();
            const builtIn = builtInTemplates.find(t => t.id === options.nameOrId || t.name === options.nameOrId);
            if (builtIn) {
                return {
                    success: true,
                    data: builtIn,
                    taskCount: getTaskCount(builtIn)
                };
            }
            // Check user templates
            const userTemplate = await this.storage.findById(this.COLLECTION, options.nameOrId);
            if (userTemplate) {
                return {
                    success: true,
                    data: userTemplate,
                    taskCount: getTaskCount(userTemplate)
                };
            }
            return {
                success: false,
                error: `Template '${options.nameOrId}' not found`
            };
        }
        catch (error) {
            return {
                success: false,
                error: `Failed to view template: ${error instanceof Error ? error.message : error}`
            };
        }
    }
    async applyTemplate(options) {
        try {
            // Find template
            const templateResult = await this.viewTemplate({ nameOrId: options.templateName });
            if (!templateResult.success || !templateResult.data) {
                return {
                    success: false,
                    error: templateResult.error
                };
            }
            const template = templateResult.data;
            // Process variables
            const processedTemplate = processTemplateVariables(template, options.variables);
            // Convert template tasks to actual tasks
            const tasks = [];
            const convertTemplateTasks = (templateTasks) => {
                templateTasks.forEach(templateTask => {
                    const task = createTask({
                        title: templateTask.title,
                        description: templateTask.description || '',
                        priority: templateTask.priority || 'medium',
                        labels: templateTask.labels || [],
                        estimatedHours: templateTask.hours
                    });
                    tasks.push(task);
                    // Handle subtasks
                    if (templateTask.subtasks) {
                        convertTemplateTasks(templateTask.subtasks);
                    }
                });
            };
            convertTemplateTasks(processedTemplate.tasks);
            // Save tasks to storage
            for (const task of tasks) {
                await this.storage.save(this.TASKS_COLLECTION, task.id, task);
            }
            return {
                success: true,
                data: tasks,
                templateName: template.name,
                tasksCreated: tasks.length
            };
        }
        catch (error) {
            return {
                success: false,
                error: `Failed to apply template: ${error instanceof Error ? error.message : error}`
            };
        }
    }
    async createTemplate(data) {
        try {
            // Validate input
            if (!data.name?.trim()) {
                return createErrorResult('Template name is required');
            }
            if (!data.tasks || data.tasks.length === 0) {
                return createErrorResult('Template must have at least one task');
            }
            // Check if template with same name already exists
            const existing = await this.storage.findById(this.COLLECTION, data.name);
            if (existing) {
                return createErrorResult(`Template with name '${data.name}' already exists`);
            }
            const template = createTemplate(data);
            await this.storage.save(this.COLLECTION, template.id, template);
            return createSuccessResult(template);
        }
        catch (error) {
            return createErrorResult(`Failed to create template: ${error instanceof Error ? error.message : error}`);
        }
    }
    async deleteTemplate(nameOrId) {
        try {
            // Don't allow deletion of built-in templates
            const builtInTemplates = this.getBuiltInTemplates();
            const isBuiltIn = builtInTemplates.some(t => t.id === nameOrId || t.name === nameOrId);
            if (isBuiltIn) {
                return createErrorResult('Cannot delete built-in templates');
            }
            const deleted = await this.storage.delete(this.COLLECTION, nameOrId);
            if (!deleted) {
                return createErrorResult(`Template '${nameOrId}' not found`);
            }
            return createSuccessResult(true);
        }
        catch (error) {
            return createErrorResult(`Failed to delete template: ${error instanceof Error ? error.message : error}`);
        }
    }
    // Utility method for variable processing (exposed for testing)
    processTemplateVariables(text, variables) {
        return Object.entries(variables).reduce((result, [key, value]) => {
            return result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
        }, text);
    }
}
//# sourceMappingURL=TemplateService.js.map
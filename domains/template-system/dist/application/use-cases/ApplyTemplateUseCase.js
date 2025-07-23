/**
 * Apply Template Use Case
 * Application service for applying templates to create tasks
 */
export class ApplyTemplateUseCase {
    templateRepository;
    constructor(templateRepository) {
        this.templateRepository = templateRepository;
    }
    async execute(request) {
        try {
            // Validate input
            if (!request.templateName?.trim()) {
                return {
                    success: false,
                    error: 'Template name is required'
                };
            }
            // Find template
            const template = await this.templateRepository.findByName(request.templateName.trim());
            if (!template) {
                return {
                    success: false,
                    error: `Template not found: ${request.templateName}`
                };
            }
            // Merge template variables with provided variables
            const variables = { ...template.variables, ...request.variables };
            // Process template with variables
            const processedTemplate = template.processVariables(variables);
            // Convert template tasks to created tasks
            const createdTasks = this.convertTemplateTasksToCreated(processedTemplate.tasks);
            // Count total tasks including subtasks
            const totalTasks = this.countTasks(createdTasks);
            return {
                success: true,
                data: createdTasks,
                templateName: template.name,
                tasksCreated: totalTasks,
                variablesUsed: variables
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }
    convertTemplateTasksToCreated(templateTasks) {
        return templateTasks.map(task => ({
            title: task.title,
            description: task.description,
            priority: task.priority,
            labels: task.labels,
            hours: task.hours,
            subtasks: task.subtasks ? this.convertTemplateTasksToCreated(task.subtasks) : undefined
        }));
    }
    countTasks(tasks) {
        return tasks.reduce((count, task) => {
            return count + 1 + (task.subtasks ? this.countTasks(task.subtasks) : 0);
        }, 0);
    }
}
//# sourceMappingURL=ApplyTemplateUseCase.js.map
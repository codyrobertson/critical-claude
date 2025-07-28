/**
 * Simplified Template Model
 * Consolidated from template-system domain
 */
// Utility functions
export function generateTemplateId(name) {
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
    const timeComponent = Date.now().toString().slice(-6); // Last 6 digits of timestamp
    if (name) {
        // Create semantic slug from name
        const slug = name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
            .replace(/\s+/g, '-') // Replace spaces with hyphens
            .slice(0, 20); // Limit length
        return `tpl-${slug}-${timestamp}-${timeComponent}`;
    }
    return `template-${timestamp}-${timeComponent}`;
}
export function createTemplate(data) {
    const now = new Date();
    return {
        id: generateTemplateId(data.name),
        name: data.name,
        description: data.description,
        tasks: data.tasks,
        variables: data.variables || {},
        metadata: {
            createdAt: now,
            updatedAt: now,
            ...data.metadata
        }
    };
}
export function getTaskCount(template) {
    const countTasks = (tasks) => {
        return tasks.reduce((count, task) => {
            return count + 1 + (task.subtasks ? countTasks(task.subtasks) : 0);
        }, 0);
    };
    return countTasks(template.tasks);
}
export function processTemplateVariables(template, values) {
    // Optimization: Create a single regex pattern that matches all variables at once
    // and compile regex patterns only once for better performance
    const variableKeys = Object.keys(values);
    if (variableKeys.length === 0) {
        return template; // No variables to process, return as-is
    }
    // Create a single regex pattern that captures all variables: {{var1}}|{{var2}}|{{var3}}
    const escapedKeys = variableKeys.map(key => key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const combinedPattern = new RegExp(`\\{\\{(${escapedKeys.join('|')})\\}\\}`, 'g');
    const processString = (str) => {
        if (!str || typeof str !== 'string')
            return str;
        // Use single pass replacement with callback for better performance
        return str.replace(combinedPattern, (match, variableName) => {
            return values[variableName] || match; // Fallback to original if variable not found
        });
    };
    const processTasks = (tasks) => {
        return tasks.map(task => ({
            ...task,
            title: processString(task.title),
            description: task.description ? processString(task.description) : undefined,
            labels: task.labels ? task.labels.map(label => processString(label)) : undefined,
            subtasks: task.subtasks ? processTasks(task.subtasks) : undefined
        }));
    };
    return {
        ...template,
        name: processString(template.name),
        description: processString(template.description),
        tasks: processTasks(template.tasks),
        metadata: {
            ...template.metadata,
            updatedAt: new Date()
        }
    };
}

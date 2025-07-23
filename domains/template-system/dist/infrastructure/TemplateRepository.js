/**
 * Template Repository Implementation
 * File-based storage implementation for templates
 */
import { Template, TemplateId } from '../domain/entities/Template.js';
import fs from 'fs/promises';
import path from 'path';
export class TemplateRepository {
    storageBasePath;
    constructor(storageBasePath) {
        this.storageBasePath = storageBasePath;
    }
    async findById(id) {
        try {
            const templatePath = this.getTemplatePath(id);
            const content = await fs.readFile(templatePath, 'utf-8');
            const data = JSON.parse(content);
            return this.mapFromStorage(data);
        }
        catch {
            return null;
        }
    }
    async findAll() {
        try {
            const templatesDir = path.join(this.storageBasePath, 'templates');
            const files = await fs.readdir(templatesDir);
            const templateFiles = files.filter(f => f.endsWith('.json'));
            const templates = [];
            for (const file of templateFiles) {
                try {
                    const content = await fs.readFile(path.join(templatesDir, file), 'utf-8');
                    const data = JSON.parse(content);
                    templates.push(this.mapFromStorage(data));
                }
                catch {
                    // Skip invalid files
                }
            }
            return templates.sort((a, b) => b.metadata.updatedAt.getTime() - a.metadata.updatedAt.getTime());
        }
        catch {
            return [];
        }
    }
    async findByName(name) {
        const allTemplates = await this.findAll();
        return allTemplates.find(t => t.name.toLowerCase() === name.toLowerCase()) || null;
    }
    async save(template) {
        await this.ensureTemplatesDirectory();
        const templatePath = this.getTemplatePath(template.id.value);
        const data = this.mapToStorage(template);
        await fs.writeFile(templatePath, JSON.stringify(data, null, 2));
    }
    async delete(id) {
        try {
            const templatePath = this.getTemplatePath(id);
            await fs.unlink(templatePath);
            return true;
        }
        catch {
            return false;
        }
    }
    async findByTag(tag) {
        const allTemplates = await this.findAll();
        return allTemplates.filter(t => t.metadata.tags && t.metadata.tags.includes(tag));
    }
    async findBuiltIn() {
        // Built-in templates have predefined names/patterns
        const builtInTemplates = [];
        // Create some default built-in templates if they don't exist
        const defaultTemplates = await this.getDefaultTemplates();
        for (const template of defaultTemplates) {
            const existing = await this.findByName(template.name);
            if (!existing) {
                await this.save(template);
                builtInTemplates.push(template);
            }
            else {
                builtInTemplates.push(existing);
            }
        }
        return builtInTemplates;
    }
    async findUserCreated() {
        const allTemplates = await this.findAll();
        const builtIn = await this.findBuiltIn();
        const builtInIds = new Set(builtIn.map(t => t.id.value));
        return allTemplates.filter(t => !builtInIds.has(t.id.value));
    }
    getTemplatePath(id) {
        return path.join(this.storageBasePath, 'templates', `${id}.json`);
    }
    async ensureTemplatesDirectory() {
        const templatesDir = path.join(this.storageBasePath, 'templates');
        await fs.mkdir(templatesDir, { recursive: true });
    }
    mapToStorage(template) {
        return {
            id: template.id.value,
            name: template.name,
            description: template.description,
            tasks: template.tasks,
            variables: template.variables,
            metadata: {
                ...template.metadata,
                createdAt: template.metadata.createdAt.toISOString(),
                updatedAt: template.metadata.updatedAt.toISOString()
            }
        };
    }
    mapFromStorage(data) {
        const metadata = {
            ...data.metadata,
            createdAt: new Date(data.metadata.createdAt),
            updatedAt: new Date(data.metadata.updatedAt)
        };
        return new Template(TemplateId.create(data.id), data.name, data.description, data.tasks || [], data.variables || {}, metadata);
    }
    async getDefaultTemplates() {
        return [
            Template.create('basic-project', 'Basic project structure with common tasks', [
                {
                    title: 'Project Setup',
                    description: 'Initialize {{project_name}} project structure',
                    priority: 'high',
                    labels: ['setup', 'initialization'],
                    hours: 2
                },
                {
                    title: 'Requirements Analysis',
                    description: 'Analyze and document requirements for {{project_name}}',
                    priority: 'high',
                    labels: ['analysis', 'requirements'],
                    hours: 4
                },
                {
                    title: 'Implementation',
                    description: 'Implement core functionality',
                    priority: 'medium',
                    labels: ['development', 'core'],
                    hours: 8,
                    subtasks: [
                        {
                            title: 'Backend Implementation',
                            description: 'Implement backend services',
                            priority: 'high',
                            hours: 4
                        },
                        {
                            title: 'Frontend Implementation',
                            description: 'Implement user interface',
                            priority: 'high',
                            hours: 4
                        }
                    ]
                },
                {
                    title: 'Testing',
                    description: 'Write and run tests',
                    priority: 'high',
                    labels: ['testing', 'quality'],
                    hours: 3
                }
            ], { project_name: 'MyProject' }, { version: '1.0', author: 'Critical Claude', tags: ['project', 'basic'] }),
            Template.create('bug-fix', 'Standard bug fix workflow', [
                {
                    title: 'Reproduce Issue',
                    description: 'Reproduce and understand the bug: {{bug_description}}',
                    priority: 'high',
                    labels: ['bug', 'investigation'],
                    hours: 1
                },
                {
                    title: 'Root Cause Analysis',
                    description: 'Identify the root cause of the issue',
                    priority: 'high',
                    labels: ['analysis', 'debugging'],
                    hours: 2
                },
                {
                    title: 'Implement Fix',
                    description: 'Implement solution for {{bug_description}}',
                    priority: 'high',
                    labels: ['fix', 'development'],
                    hours: 3
                },
                {
                    title: 'Test Fix',
                    description: 'Verify the fix works and doesn\'t break anything else',
                    priority: 'high',
                    labels: ['testing', 'verification'],
                    hours: 1
                }
            ], { bug_description: 'Bug description here' }, { version: '1.0', author: 'Critical Claude', tags: ['bug', 'fix'] })
        ];
    }
}
//# sourceMappingURL=TemplateRepository.js.map
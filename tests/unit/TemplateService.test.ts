import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Logger with vi.doMock for immediate effect
vi.doMock('../../src/utils/Logger.js', () => ({
  logger: {
    operation: vi.fn(),
    performance: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    silentError: vi.fn()
  }
}));

// Mock FileStorage
vi.doMock('../../src/storage/FileStorage.js', () => ({
  FileStorage: vi.fn().mockImplementation(() => ({
    save: vi.fn(),
    findById: vi.fn(),
    findAll: vi.fn(),
    delete: vi.fn(),
    ensureDirectory: vi.fn()
  }))
}));

// Import modules dynamically after mocks are set up
const { TemplateService } = await import('../../src/services/TemplateService.js');
const { FileStorage } = await import('../../src/storage/FileStorage.js');
const { processTemplateVariables, Template } = await import('../../src/models/template.js');

// Create mock storage instance
const mockStorage = {
  save: vi.fn(),
  findById: vi.fn(),
  findAll: vi.fn(),
  delete: vi.fn(),
  ensureDirectory: vi.fn()
};

describe('TemplateService', () => {
  let templateService: TemplateService;
  let storage: FileStorage;

  beforeEach(() => {
    vi.clearAllMocks();
    storage = new FileStorage();
    templateService = new TemplateService(storage);
  });

  describe('listTemplates', () => {
    it('should return built-in and user templates', async () => {
      const userTemplates = [
        {
          id: 'user-template-1',
          name: 'custom-template',
          description: 'User created template',
          tasks: [],
          variables: {},
          metadata: { author: 'User', tags: [], version: '1.0.0', createdAt: new Date(), updatedAt: new Date() }
        }
      ];
      mockStorage.findAll.mockResolvedValue(userTemplates);

      const result = await templateService.listTemplates();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(4); // 3 built-in + 1 user template
      
      // Check built-in templates are included
      const templateNames = result.data!.map(t => t.name);
      expect(templateNames).toContain('basic-project');
      expect(templateNames).toContain('bug-fix');
      expect(templateNames).toContain('webapp');
      expect(templateNames).toContain('custom-template');
    });

    it('should handle storage errors gracefully', async () => {
      mockStorage.findAll.mockRejectedValue(new Error('Storage failed'));

      const result = await templateService.listTemplates();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to list templates: Storage failed');
    });
  });

  describe('viewTemplate', () => {
    it('should return built-in template by name', async () => {
      const result = await templateService.viewTemplate({ nameOrId: 'basic-project' });

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('basic-project');
      expect(result.data?.description).toBe('Generic project structure with common phases');
      expect(result.taskCount).toBeGreaterThan(0);
    });

    it('should return user template by ID', async () => {
      const userTemplate = {
        id: 'user-template-1',
        name: 'custom-template',
        description: 'User template',
        tasks: [{ title: 'Custom Task', description: 'Description' }],
        variables: {},
        metadata: { author: 'User', tags: [], version: '1.0.0', createdAt: new Date(), updatedAt: new Date() }
      };
      mockStorage.findById.mockResolvedValue(userTemplate);

      const result = await templateService.viewTemplate({ nameOrId: 'user-template-1' });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(userTemplate);
      expect(result.taskCount).toBe(1);
    });

    it('should handle template not found', async () => {
      mockStorage.findById.mockResolvedValue(null);

      const result = await templateService.viewTemplate({ nameOrId: 'nonexistent' });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Template 'nonexistent' not found");
    });
  });

  describe('applyTemplate', () => {
    it('should apply built-in template without variables', async () => {
      mockStorage.save.mockResolvedValue({ success: true });

      const result = await templateService.applyTemplate({
        templateName: 'basic-project',
        variables: {}
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.templateName).toBe('basic-project');
      expect(result.tasksCreated).toBeGreaterThan(0);
      
      // Verify tasks were saved
      expect(mockStorage.save).toHaveBeenCalled();
    });

    it('should apply template with variable substitution', async () => {
      mockStorage.save.mockResolvedValue({ success: true });

      const result = await templateService.applyTemplate({
        templateName: 'basic-project',
        variables: {
          project_name: 'My Awesome Project',
          project_type: 'Web Application'
        }
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      
      // Check that variables were substituted in task titles/descriptions
      const tasks = result.data!;
      const hasSubstitution = tasks.some(task => 
        task.title.includes('My Awesome Project') || 
        task.description?.includes('Web Application')
      );
      expect(hasSubstitution).toBe(true);
    });

    it('should handle template not found', async () => {
      mockStorage.findById.mockResolvedValue(null);

      const result = await templateService.applyTemplate({
        templateName: 'nonexistent',
        variables: {}
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Template 'nonexistent' not found");
    });

    it('should handle storage errors during task creation', async () => {
      mockStorage.save.mockRejectedValue(new Error('Storage failed'));

      const result = await templateService.applyTemplate({
        templateName: 'basic-project',
        variables: {}
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to apply template: Storage failed');
    });
  });

  describe('variable processing', () => {
    it('should process template variables in text', () => {
      const text = 'Project: {{project_name}} - Type: {{project_type}}';
      const variables = {
        project_name: 'Test Project',
        project_type: 'Mobile App'
      };

      const result = templateService['processTemplateVariables'](text, variables);
      
      expect(result).toBe('Project: Test Project - Type: Mobile App');
    });

    it('should handle missing variables gracefully', () => {
      const text = 'Project: {{project_name}} - Type: {{missing_var}}';
      const variables = {
        project_name: 'Test Project'
      };

      const result = templateService['processTemplateVariables'](text, variables);
      
      expect(result).toBe('Project: Test Project - Type: {{missing_var}}');
    });

    it('should handle empty variables object', () => {
      const text = 'Project: {{project_name}}';
      const variables = {};

      const result = templateService['processTemplateVariables'](text, variables);
      
      expect(result).toBe('Project: {{project_name}}');
    });
  });

  describe('built-in templates', () => {
    it('should have basic-project template with expected structure', async () => {
      const result = await templateService.viewTemplate({ nameOrId: 'basic-project' });

      expect(result.success).toBe(true);
      expect(result.data?.tasks).toBeDefined();
      expect(result.data?.variables).toHaveProperty('project_name');
      expect(result.data?.variables).toHaveProperty('project_type');
    });

    it('should have bug-fix template with workflow steps', async () => {
      const result = await templateService.viewTemplate({ nameOrId: 'bug-fix' });

      expect(result.success).toBe(true);
      expect(result.data?.tasks).toBeDefined();
      expect(result.data?.variables).toHaveProperty('bug_description');
      expect(result.data?.variables).toHaveProperty('affected_component');
    });

    it('should have webapp template with comprehensive tasks', async () => {
      const result = await templateService.viewTemplate({ nameOrId: 'webapp' });

      expect(result.success).toBe(true);
      expect(result.data?.tasks).toBeDefined();
      expect(result.data?.tasks.length).toBeGreaterThan(5);
    });
  });

  describe('processTemplateVariables optimization', () => {
    it('should efficiently process multiple variables in a single pass', () => {
      const template: Template = {
        id: 'test-template',
        name: '{{project_name}} Setup',
        description: 'Setup {{project_type}} project with {{framework}}',
        tasks: [
          {
            title: 'Initialize {{project_name}}',
            description: 'Create {{project_type}} using {{framework}} framework',
            priority: 'high',
            labels: ['{{project_type}}', '{{framework}}']
          },
          {
            title: 'Configure {{framework}}',
            description: 'Setup {{framework}} for {{project_name}}',
            priority: 'medium'
          }
        ],
        variables: {
          project_name: 'Default Name',
          project_type: 'Default Type',
          framework: 'Default Framework'
        },
        metadata: {
          author: 'Test',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };

      const variables = {
        project_name: 'MyApp',
        project_type: 'React',
        framework: 'Next.js'
      };

      const result = processTemplateVariables(template, variables);

      // Verify all variables were replaced correctly
      expect(result.name).toBe('MyApp Setup');
      expect(result.description).toBe('Setup React project with Next.js');
      expect(result.tasks[0].title).toBe('Initialize MyApp');
      expect(result.tasks[0].description).toBe('Create React using Next.js framework');
      expect(result.tasks[0].labels).toEqual(['React', 'Next.js']);
      expect(result.tasks[1].title).toBe('Configure Next.js');
      expect(result.tasks[1].description).toBe('Setup Next.js for MyApp');
    });

    it('should handle empty variables gracefully', () => {
      const template: Template = {
        id: 'test-template',
        name: 'Test Template',
        description: 'No variables here',
        tasks: [{ title: 'Simple task', priority: 'medium' }],
        variables: {},
        metadata: {
          author: 'Test',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };

      const result = processTemplateVariables(template, {});

      // Should return template unchanged when no variables
      expect(result.name).toBe(template.name);
      expect(result.description).toBe(template.description);
      expect(result.tasks[0].title).toBe(template.tasks[0].title);
    });

    it('should handle missing variables by keeping original placeholders', () => {
      const template: Template = {
        id: 'test-template',
        name: '{{missing_var}} Test',
        description: 'Has {{existing_var}} and {{missing_var}}',
        tasks: [],
        variables: {},
        metadata: {
          author: 'Test',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };

      const variables = {
        existing_var: 'Found'
      };

      const result = processTemplateVariables(template, variables);

      // Should replace existing variables and keep missing ones as placeholders
      expect(result.name).toBe('{{missing_var}} Test');
      expect(result.description).toBe('Has Found and {{missing_var}}');
    });

    it('should handle special regex characters in variable names', () => {
      const template: Template = {
        id: 'test-template',
        name: '{{var.with.dots}} and {{var-with-dashes}}',
        description: 'Test {{var[with]brackets}}',
        tasks: [],
        variables: {},
        metadata: {
          author: 'Test',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };

      const variables = {
        'var.with.dots': 'DottedVar',
        'var-with-dashes': 'DashedVar',
        'var[with]brackets': 'BracketVar'
      };

      const result = processTemplateVariables(template, variables);

      expect(result.name).toBe('DottedVar and DashedVar');
      expect(result.description).toBe('Test BracketVar');
    });
  });
});
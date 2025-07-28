import { describe, it, expect } from 'vitest';
import { processTemplateVariables, Template } from '../../src/models/template.js';

describe('Template Variable Processing Optimization', () => {
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

  it('should process nested task structures correctly', () => {
    const template: Template = {
      id: 'test-template',
      name: '{{project_name}} Development',
      description: 'Development tasks for {{project_name}}',
      tasks: [
        {
          title: 'Phase 1: {{phase_name}}',
          description: 'Initial setup for {{project_name}}',
          priority: 'high',
          subtasks: [
            {
              title: 'Setup {{project_name}} repository',
              description: 'Initialize {{project_name}} with {{framework}}',
              priority: 'high'
            }
          ]
        }
      ],
      variables: {},
      metadata: {
        author: 'Test',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    };

    const variables = {
      project_name: 'AwesomeApp',
      phase_name: 'Foundation',
      framework: 'React'
    };

    const result = processTemplateVariables(template, variables);

    expect(result.tasks[0].title).toBe('Phase 1: Foundation');
    expect(result.tasks[0].description).toBe('Initial setup for AwesomeApp');
    expect(result.tasks[0].subtasks![0].title).toBe('Setup AwesomeApp repository');
    expect(result.tasks[0].subtasks![0].description).toBe('Initialize AwesomeApp with React');
  });

  it('should maintain performance with many variables', () => {
    // Test with many variables to ensure the optimization works
    const variables: Record<string, string> = {};
    const expectedReplacements: Record<string, string> = {};
    
    // Create 100 variables
    for (let i = 1; i <= 100; i++) {
      variables[`var${i}`] = `Value${i}`;
      expectedReplacements[`var${i}`] = `Value${i}`;
    }

    const template: Template = {
      id: 'performance-test',
      name: 'Template with {{var1}} and {{var50}} and {{var100}}',
      description: 'Testing {{var25}} performance {{var75}} optimization',
      tasks: [
        {
          title: 'Task with {{var10}} and {{var90}}',
          description: 'Multiple {{var1}} variables {{var100}} in {{var50}} description',
          priority: 'medium',
          labels: ['{{var1}}', '{{var2}}', '{{var3}}']
        }
      ],
      variables: {},
      metadata: {
        author: 'Test',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    };

    const startTime = Date.now();
    const result = processTemplateVariables(template, variables);
    const duration = Date.now() - startTime;

    // Should process quickly (under 10ms for 100 variables)
    expect(duration).toBeLessThan(10);

    // Verify correctness
    expect(result.name).toBe('Template with Value1 and Value50 and Value100');
    expect(result.description).toBe('Testing Value25 performance Value75 optimization');
    expect(result.tasks[0].title).toBe('Task with Value10 and Value90');
    expect(result.tasks[0].labels).toEqual(['Value1', 'Value2', 'Value3']);
  });
});
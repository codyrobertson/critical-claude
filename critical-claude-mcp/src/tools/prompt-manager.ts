/**
 * PromptManager - Developer prompt management system
 * Helps developers organize and reuse code review prompts
 */

import fs from 'fs/promises';
import path from 'path';
import { logger } from '../logger.js';

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  category: PromptCategory;
  template: string;
  variables: string[];
  tags: string[];
  created_at: string;
  updated_at: string;
}

export type PromptCategory = 
  | 'security'
  | 'performance' 
  | 'architecture'
  | 'code-review'
  | 'debugging'
  | 'refactoring'
  | 'testing'
  | 'documentation'
  | 'custom';

export interface PromptLibrary {
  version: string;
  prompts: PromptTemplate[];
  categories: Record<PromptCategory, string>;
}

export class PromptManager {
  private promptsDir: string;
  private libraryPath: string;

  constructor(projectRoot?: string) {
    const root = projectRoot || process.cwd();
    this.promptsDir = path.join(root, '.critical-claude', 'prompts');
    this.libraryPath = path.join(this.promptsDir, 'library.json');
  }

  /**
   * Initialize the prompt management system
   */
  async initialize(): Promise<void> {
    try {
      // Create prompts directory if it doesn't exist
      await fs.mkdir(this.promptsDir, { recursive: true });

      // Create library file if it doesn't exist
      try {
        await fs.access(this.libraryPath);
      } catch {
        await this.createDefaultLibrary();
      }

      logger.info('Prompt manager initialized', { promptsDir: this.promptsDir });
    } catch (error) {
      logger.error('Failed to initialize prompt manager', error as Error);
      throw error;
    }
  }

  /**
   * Create default prompt library with starter templates
   */
  private async createDefaultLibrary(): Promise<void> {
    const defaultLibrary: PromptLibrary = {
      version: '1.0.0',
      categories: {
        'security': 'Security vulnerability analysis',
        'performance': 'Performance optimization',
        'architecture': 'Architecture and design patterns',
        'code-review': 'General code review',
        'debugging': 'Bug investigation and debugging',
        'refactoring': 'Code refactoring and cleanup',
        'testing': 'Test strategy and coverage',
        'documentation': 'Documentation and comments',
        'custom': 'Custom project-specific prompts'
      },
      prompts: [
        {
          id: 'security-audit',
          name: 'Security Audit',
          description: 'Comprehensive security vulnerability analysis',
          category: 'security',
          template: `Perform a thorough security audit of this {{FILE_TYPE}} code:

{{CODE}}

Focus on:
- SQL injection vulnerabilities
- XSS attack vectors
- Authentication/authorization bypasses
- Input validation issues
- Data exposure risks
- OWASP Top 10 violations

Provide specific exploit scenarios and complete fixes for each issue found.`,
          variables: ['FILE_TYPE', 'CODE'],
          tags: ['security', 'audit', 'owasp'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'performance-bottleneck',
          name: 'Performance Bottleneck Analysis',
          description: 'Identify performance issues and scaling problems',
          category: 'performance',
          template: `Analyze this {{LANGUAGE}} code for performance bottlenecks:

{{CODE}}

Consider:
- Algorithmic complexity (Big O analysis)
- Memory usage patterns
- Database query efficiency
- Network request patterns
- Caching opportunities
- Concurrency issues

Expected load: {{EXPECTED_LOAD}} concurrent users
Current performance target: {{PERFORMANCE_TARGET}}

Provide specific optimizations with measurable impact estimates.`,
          variables: ['LANGUAGE', 'CODE', 'EXPECTED_LOAD', 'PERFORMANCE_TARGET'],
          tags: ['performance', 'scaling', 'optimization'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'architecture-review',
          name: 'Architecture Pattern Review',
          description: 'Evaluate architectural decisions and patterns',
          category: 'architecture',
          template: `Review the architecture of this {{SYSTEM_TYPE}} system:

{{CODE}}

System context:
- Team size: {{TEAM_SIZE}} developers
- Expected users: {{USER_COUNT}}
- Current stage: {{PROJECT_STAGE}}

Analyze:
- SOLID principle adherence
- Design pattern appropriateness
- Separation of concerns
- Coupling and cohesion
- Maintainability and extensibility
- Over-engineering risks

Focus on practical improvements that match the system's actual scale and requirements.`,
          variables: ['SYSTEM_TYPE', 'CODE', 'TEAM_SIZE', 'USER_COUNT', 'PROJECT_STAGE'],
          tags: ['architecture', 'patterns', 'design'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'production-readiness',
          name: 'Production Readiness Check',
          description: 'Evaluate code readiness for production deployment',
          category: 'code-review',
          template: `Evaluate production readiness of this {{COMPONENT_TYPE}}:

{{CODE}}

Check for:
- Error handling completeness
- Logging and monitoring hooks
- Configuration management
- Resource cleanup
- Graceful degradation
- Health check endpoints
- Deployment considerations

Target environment: {{ENVIRONMENT}}
Expected traffic: {{TRAFFIC_PATTERN}}

Identify deployment blockers and provide complete fixes.`,
          variables: ['COMPONENT_TYPE', 'CODE', 'ENVIRONMENT', 'TRAFFIC_PATTERN'],
          tags: ['production', 'deployment', 'monitoring'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]
    };

    await fs.writeFile(this.libraryPath, JSON.stringify(defaultLibrary, null, 2));
    logger.info('Created default prompt library', { promptCount: defaultLibrary.prompts.length });
  }

  /**
   * Load prompt library from disk
   */
  async loadLibrary(): Promise<PromptLibrary> {
    try {
      const content = await fs.readFile(this.libraryPath, 'utf8');
      return JSON.parse(content) as PromptLibrary;
    } catch (error) {
      logger.error('Failed to load prompt library', error as Error);
      throw new Error('Failed to load prompt library');
    }
  }

  /**
   * Save prompt library to disk
   */
  async saveLibrary(library: PromptLibrary): Promise<void> {
    try {
      await fs.writeFile(this.libraryPath, JSON.stringify(library, null, 2));
      logger.info('Saved prompt library', { promptCount: library.prompts.length });
    } catch (error) {
      logger.error('Failed to save prompt library', error as Error);
      throw error;
    }
  }

  /**
   * List all available prompts
   */
  async listPrompts(category?: PromptCategory): Promise<PromptTemplate[]> {
    const library = await this.loadLibrary();
    
    if (category) {
      return library.prompts.filter(p => p.category === category);
    }
    
    return library.prompts;
  }

  /**
   * Get a specific prompt by ID
   */
  async getPrompt(id: string): Promise<PromptTemplate | null> {
    const library = await this.loadLibrary();
    return library.prompts.find(p => p.id === id) || null;
  }

  /**
   * Add a new prompt template
   */
  async addPrompt(prompt: Omit<PromptTemplate, 'created_at' | 'updated_at'>): Promise<void> {
    const library = await this.loadLibrary();
    
    // Check for duplicate IDs
    if (library.prompts.find(p => p.id === prompt.id)) {
      throw new Error(`Prompt with ID '${prompt.id}' already exists`);
    }

    const newPrompt: PromptTemplate = {
      ...prompt,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    library.prompts.push(newPrompt);
    await this.saveLibrary(library);
    
    logger.info('Added new prompt', { id: prompt.id, category: prompt.category });
  }

  /**
   * Update an existing prompt template
   */
  async updatePrompt(id: string, updates: Partial<Omit<PromptTemplate, 'id' | 'created_at' | 'updated_at'>>): Promise<void> {
    const library = await this.loadLibrary();
    const promptIndex = library.prompts.findIndex(p => p.id === id);
    
    if (promptIndex === -1) {
      throw new Error(`Prompt with ID '${id}' not found`);
    }

    library.prompts[promptIndex] = {
      ...library.prompts[promptIndex],
      ...updates,
      updated_at: new Date().toISOString()
    };

    await this.saveLibrary(library);
    logger.info('Updated prompt', { id, updates: Object.keys(updates) });
  }

  /**
   * Delete a prompt template
   */
  async deletePrompt(id: string): Promise<void> {
    const library = await this.loadLibrary();
    const promptIndex = library.prompts.findIndex(p => p.id === id);
    
    if (promptIndex === -1) {
      throw new Error(`Prompt with ID '${id}' not found`);
    }

    library.prompts.splice(promptIndex, 1);
    await this.saveLibrary(library);
    
    logger.info('Deleted prompt', { id });
  }

  /**
   * Render a prompt template with variables
   */
  async renderPrompt(id: string, variables: Record<string, string>): Promise<string> {
    const prompt = await this.getPrompt(id);
    
    if (!prompt) {
      throw new Error(`Prompt with ID '${id}' not found`);
    }

    let rendered = prompt.template;
    
    // Replace variables in the template
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      rendered = rendered.replace(new RegExp(placeholder, 'g'), value);
    }

    // Check for unresolved variables
    const unresolvedMatches = rendered.match(/\{\{[^}]+\}\}/g);
    if (unresolvedMatches) {
      const unresolved = unresolvedMatches.map(m => m.slice(2, -2));
      logger.warn('Unresolved variables in prompt', { id, unresolved });
    }

    return rendered;
  }

  /**
   * Search prompts by tags or text
   */
  async searchPrompts(query: string): Promise<PromptTemplate[]> {
    const library = await this.loadLibrary();
    const lowercaseQuery = query.toLowerCase();
    
    return library.prompts.filter(prompt => 
      prompt.name.toLowerCase().includes(lowercaseQuery) ||
      prompt.description.toLowerCase().includes(lowercaseQuery) ||
      prompt.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)) ||
      prompt.template.toLowerCase().includes(lowercaseQuery)
    );
  }

  /**
   * Export prompts to a file
   */
  async exportPrompts(filePath: string, category?: PromptCategory): Promise<void> {
    const prompts = await this.listPrompts(category);
    const exportData = {
      exported_at: new Date().toISOString(),
      category: category || 'all',
      prompts
    };

    await fs.writeFile(filePath, JSON.stringify(exportData, null, 2));
    logger.info('Exported prompts', { filePath, count: prompts.length, category });
  }

  /**
   * Import prompts from a file
   */
  async importPrompts(filePath: string, overwrite = false): Promise<number> {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const importData = JSON.parse(content);
      
      if (!importData.prompts || !Array.isArray(importData.prompts)) {
        throw new Error('Invalid import file format');
      }

      const library = await this.loadLibrary();
      let importedCount = 0;

      for (const prompt of importData.prompts) {
        const existingIndex = library.prompts.findIndex(p => p.id === prompt.id);
        
        if (existingIndex !== -1) {
          if (overwrite) {
            library.prompts[existingIndex] = {
              ...prompt,
              updated_at: new Date().toISOString()
            };
            importedCount++;
          }
        } else {
          library.prompts.push({
            ...prompt,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          importedCount++;
        }
      }

      await this.saveLibrary(library);
      logger.info('Imported prompts', { filePath, importedCount, overwrite });
      
      return importedCount;
    } catch (error) {
      logger.error('Failed to import prompts', { filePath }, error as Error);
      throw error;
    }
  }
}
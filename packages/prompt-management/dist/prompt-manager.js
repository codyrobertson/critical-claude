/**
 * PromptManager - Developer prompt management system
 * Helps developers organize and reuse code review prompts
 */
import fs from 'fs/promises';
import path from 'path';
import { logger } from '@critical-claude/core';
export class PromptManager {
    promptsDir;
    libraryPath;
    constructor(projectRoot) {
        const root = projectRoot || process.cwd();
        this.promptsDir = path.join(root, '.critical-claude', 'prompts');
        this.libraryPath = path.join(this.promptsDir, 'library.json');
    }
    /**
     * Initialize the prompt management system
     */
    async initialize() {
        try {
            // Create prompts directory if it doesn't exist
            await fs.mkdir(this.promptsDir, { recursive: true });
            // Create library file if it doesn't exist
            try {
                await fs.access(this.libraryPath);
            }
            catch {
                await this.createDefaultLibrary();
            }
            logger.info('Prompt manager initialized', { promptsDir: this.promptsDir });
        }
        catch (error) {
            logger.error('Failed to initialize prompt manager', error);
            throw error;
        }
    }
    /**
     * Create default prompt library with starter templates
     */
    async createDefaultLibrary() {
        const defaultLibrary = {
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
    async loadLibrary() {
        try {
            const content = await fs.readFile(this.libraryPath, 'utf8');
            return JSON.parse(content);
        }
        catch (error) {
            logger.error('Failed to load prompt library', error);
            throw new Error('Failed to load prompt library');
        }
    }
    /**
     * Save prompt library to disk
     */
    async saveLibrary(library) {
        try {
            await fs.writeFile(this.libraryPath, JSON.stringify(library, null, 2));
            logger.info('Saved prompt library', { promptCount: library.prompts.length });
        }
        catch (error) {
            logger.error('Failed to save prompt library', error);
            throw error;
        }
    }
    /**
     * List all available prompts
     */
    async listPrompts(category) {
        const library = await this.loadLibrary();
        if (category) {
            return library.prompts.filter(p => p.category === category);
        }
        return library.prompts;
    }
    /**
     * Get a specific prompt by ID
     */
    async getPrompt(id) {
        const library = await this.loadLibrary();
        return library.prompts.find(p => p.id === id) || null;
    }
    /**
     * Add a new prompt template
     */
    async addPrompt(prompt) {
        const library = await this.loadLibrary();
        // Check for duplicate IDs
        if (library.prompts.find(p => p.id === prompt.id)) {
            throw new Error(`Prompt with ID '${prompt.id}' already exists`);
        }
        const newPrompt = {
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
    async updatePrompt(id, updates) {
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
    async deletePrompt(id) {
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
    async renderPrompt(id, variables) {
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
    async searchPrompts(query) {
        const library = await this.loadLibrary();
        const lowercaseQuery = query.toLowerCase();
        return library.prompts.filter(prompt => prompt.name.toLowerCase().includes(lowercaseQuery) ||
            prompt.description.toLowerCase().includes(lowercaseQuery) ||
            prompt.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)) ||
            prompt.template.toLowerCase().includes(lowercaseQuery));
    }
    /**
     * Export prompts to a file
     */
    async exportPrompts(filePath, category) {
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
    async importPrompts(filePath, overwrite = false) {
        try {
            // Path validation
            const safePath = await this.validateImportPath(filePath);
            // Size limit to prevent DoS
            const stats = await fs.stat(safePath);
            if (stats.size > 5 * 1024 * 1024) { // 5MB limit
                throw new Error('Import file too large');
            }
            const content = await fs.readFile(safePath, 'utf8');
            // Safe JSON parsing with prototype pollution prevention
            const importData = this.safeJsonParse(content);
            // Validate structure
            if (!this.isValidImportStructure(importData)) {
                throw new Error('Invalid import file structure');
            }
            const library = await this.loadLibrary();
            let importedCount = 0;
            for (const prompt of importData.prompts) {
                // Deep sanitization of each prompt
                const sanitized = this.deepSanitizePrompt(prompt);
                if (!sanitized) {
                    logger.warn('Skipped invalid prompt during import', { promptId: prompt.id });
                    continue;
                }
                // Additional security checks
                if (this.containsMaliciousPatterns(sanitized)) {
                    logger.warn('Malicious prompt blocked', { promptId: prompt.id });
                    continue;
                }
                const existingIndex = library.prompts.findIndex(p => p.id === sanitized.id);
                if (existingIndex !== -1) {
                    if (overwrite) {
                        library.prompts[existingIndex] = {
                            ...sanitized,
                            updated_at: new Date().toISOString()
                        };
                        importedCount++;
                    }
                }
                else {
                    library.prompts.push({
                        ...sanitized,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    });
                    importedCount++;
                }
            }
            await this.saveLibrary(library);
            logger.info('Imported prompts', { filePath: safePath, importedCount, overwrite });
            return importedCount;
        }
        catch (error) {
            logger.error('Failed to import prompts', { filePath }, error);
            throw error;
        }
    }
    async validateImportPath(filePath) {
        const resolved = path.resolve(filePath);
        const promptsDir = path.resolve(this.promptsDir);
        // Must be within prompts directory or current directory
        const allowedDirs = [promptsDir, process.cwd()];
        const isInAllowedDir = allowedDirs.some(dir => resolved.startsWith(dir));
        if (!isInAllowedDir || !resolved.endsWith('.json')) {
            throw new Error('Invalid import file path');
        }
        return resolved;
    }
    safeJsonParse(content) {
        // Parse with reviver to block dangerous keys
        return JSON.parse(content, (key, value) => {
            // Block prototype pollution
            const dangerousKeys = ['__proto__', 'constructor', 'prototype'];
            if (dangerousKeys.includes(key)) {
                logger.warn('Prototype pollution attempt blocked', { key });
                return undefined;
            }
            // Block function serialization attempts
            if (typeof value === 'string' && value.includes('function')) {
                if (/function\s*\(|=>\s*{/.test(value)) {
                    logger.warn('Function injection attempt blocked');
                    return undefined;
                }
            }
            return value;
        });
    }
    isValidImportStructure(data) {
        return data &&
            typeof data === 'object' &&
            Array.isArray(data.prompts) &&
            data.prompts.every((p) => p && typeof p === 'object' &&
                typeof p.id === 'string' &&
                typeof p.name === 'string');
    }
    deepSanitizePrompt(prompt) {
        if (!prompt || typeof prompt !== 'object')
            return null;
        // Create new object to avoid reference pollution
        const sanitized = {};
        // Whitelist allowed fields only
        const allowedFields = ['id', 'name', 'description', 'category', 'template', 'variables', 'tags'];
        for (const field of allowedFields) {
            if (field in prompt) {
                switch (field) {
                    case 'id':
                    case 'name':
                    case 'description':
                    case 'template':
                        sanitized[field] = this.sanitizePromptString(String(prompt[field]));
                        break;
                    case 'category':
                        sanitized[field] = this.validatePromptCategory(prompt[field]);
                        break;
                    case 'variables':
                    case 'tags':
                        if (Array.isArray(prompt[field])) {
                            sanitized[field] = prompt[field]
                                .filter((v) => typeof v === 'string')
                                .map((v) => this.sanitizePromptString(v))
                                .slice(0, 20);
                        }
                        else {
                            sanitized[field] = [];
                        }
                        break;
                }
            }
        }
        // Ensure required fields
        if (!sanitized.id || !sanitized.name || !sanitized.template) {
            return null;
        }
        // Add defaults for missing fields
        sanitized.description = sanitized.description || '';
        sanitized.category = sanitized.category || 'custom';
        sanitized.variables = sanitized.variables || [];
        sanitized.tags = sanitized.tags || [];
        return sanitized;
    }
    containsMaliciousPatterns(prompt) {
        const patterns = [
            /require\s*\(/,
            /import\s+/,
            /eval\s*\(/,
            /Function\s*\(/,
            /\bexec\s*\(/,
            /<script/i,
            /javascript:/i
        ];
        const allText = JSON.stringify(prompt);
        return patterns.some(pattern => pattern.test(allText));
    }
    sanitizePromptString(input) {
        return input
            .substring(0, 10000) // Max length
            .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
            .trim();
    }
    validatePromptCategory(category) {
        const validCategories = [
            'security', 'performance', 'architecture', 'code-review',
            'debugging', 'refactoring', 'testing', 'documentation', 'custom'
        ];
        if (validCategories.includes(category)) {
            return category;
        }
        return 'custom';
    }
}
//# sourceMappingURL=prompt-manager.js.map
/**
 * PromptManager - Developer prompt management system
 * Helps developers organize and reuse code review prompts
 */
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
export type PromptCategory = 'security' | 'performance' | 'architecture' | 'code-review' | 'debugging' | 'refactoring' | 'testing' | 'documentation' | 'custom';
export interface PromptLibrary {
    version: string;
    prompts: PromptTemplate[];
    categories: Record<PromptCategory, string>;
}
export declare class PromptManager {
    private promptsDir;
    private libraryPath;
    constructor(projectRoot?: string);
    /**
     * Initialize the prompt management system
     */
    initialize(): Promise<void>;
    /**
     * Create default prompt library with starter templates
     */
    private createDefaultLibrary;
    /**
     * Load prompt library from disk
     */
    loadLibrary(): Promise<PromptLibrary>;
    /**
     * Save prompt library to disk
     */
    saveLibrary(library: PromptLibrary): Promise<void>;
    /**
     * List all available prompts
     */
    listPrompts(category?: PromptCategory): Promise<PromptTemplate[]>;
    /**
     * Get a specific prompt by ID
     */
    getPrompt(id: string): Promise<PromptTemplate | null>;
    /**
     * Add a new prompt template
     */
    addPrompt(prompt: Omit<PromptTemplate, 'created_at' | 'updated_at'>): Promise<void>;
    /**
     * Update an existing prompt template
     */
    updatePrompt(id: string, updates: Partial<Omit<PromptTemplate, 'id' | 'created_at' | 'updated_at'>>): Promise<void>;
    /**
     * Delete a prompt template
     */
    deletePrompt(id: string): Promise<void>;
    /**
     * Render a prompt template with variables
     */
    renderPrompt(id: string, variables: Record<string, string>): Promise<string>;
    /**
     * Search prompts by tags or text
     */
    searchPrompts(query: string): Promise<PromptTemplate[]>;
    /**
     * Export prompts to a file
     */
    exportPrompts(filePath: string, category?: PromptCategory): Promise<void>;
    /**
     * Import prompts from a file
     */
    importPrompts(filePath: string, overwrite?: boolean): Promise<number>;
    private validateImportPath;
    private safeJsonParse;
    private isValidImportStructure;
    private deepSanitizePrompt;
    private containsMaliciousPatterns;
    private sanitizePromptString;
    private validatePromptCategory;
}
//# sourceMappingURL=prompt-manager.d.ts.map
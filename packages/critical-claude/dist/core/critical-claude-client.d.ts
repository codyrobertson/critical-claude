/**
 * Critical Claude Client - Simplified AI-powered task management
 */
export declare class CriticalClaudeClient {
    private aiService;
    private storage;
    private aiTaskManager;
    constructor();
    initialize(): Promise<void>;
    /**
     * Generate tasks from feature description using AI
     */
    generateTasks(description: string, options?: {
        maxTasks?: number;
        teamSize?: number;
        experience?: string;
    }): Promise<any[]>;
    /**
     * Analyze task complexity using AI
     */
    analyzeTask(title: string, description: string): Promise<any>;
    /**
     * Get AI service health status
     */
    getStatus(): Promise<{
        healthy: boolean;
        provider: string;
    }>;
}
//# sourceMappingURL=critical-claude-client.d.ts.map
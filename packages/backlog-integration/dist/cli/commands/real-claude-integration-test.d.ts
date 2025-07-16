/**
 * Real Claude Code Integration Test
 * Spawns actual Claude Code instances to test hook integration
 */
export declare class RealClaudeIntegrationTestCommand {
    private backlogManager;
    private testSessions;
    private hookLogPath;
    private testResults;
    constructor();
    execute(action: string, input: any, options: any): Promise<void>;
    private clearHookLogs;
    private testTodoWriteIntegration;
    private testMCPToolIntegration;
    private testFileEditIntegration;
    private testNotificationIntegration;
    private spawnClaudeSession;
    private getHookLogLineCount;
    private getRecentHookEvents;
    private extractToolFromEvent;
    private generateReport;
}
//# sourceMappingURL=real-claude-integration-test.d.ts.map
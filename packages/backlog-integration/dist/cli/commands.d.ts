/**
 * Critical Claude Backlog CLI Commands
 * Enhanced AGILE commands with AI integration
 */
import { Command } from 'commander';
export declare class CriticalClaudeCommands {
    private _client?;
    private _backlogManager?;
    private get client();
    private get backlogManager();
    initialize(): Promise<void>;
    /**
     * Execute command with action-based routing
     */
    execute(action: string, input: any, options: any): Promise<void>;
    /**
     * Handle AGILE subcommands
     */
    private handleAgileCommand;
    /**
     * Register all Critical Claude commands with Commander
     */
    registerCommands(program: Command): void;
    private registerAgileCommands;
    private registerAICommands;
    private registerAnalysisCommands;
    private registerHookCommands;
    private createPhase;
    private aiPlanFeature;
    private aiAnalyzeCode;
    private listPhases;
    private editPhase;
    private createEpic;
    private listEpics;
    private createSprint;
    private startSprint;
    private completeSprint;
    private generateSprintReport;
    private aiSprintPlan;
    private aiEstimateTasks;
    private analyzeVelocity;
    private analyzeRisks;
    private generateBurndown;
    private enableHook;
    private disableHook;
    private configureHooks;
    private testHooks;
    /**
     * Show project status overview
     */
    private showStatus;
}
//# sourceMappingURL=commands.d.ts.map
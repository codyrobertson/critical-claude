/**
 * Advanced Hook Setup Command
 * Configures Claude Code hooks for optimal Critical Claude integration
 */
import { CommandHandler } from '../command-registry.js';
export declare class HookSetupCommand implements CommandHandler {
    execute(action: string, input: any, options: any): Promise<void>;
    private installHooks;
    private showHookStatus;
    private testHooks;
    private upgradeToAdvancedHooks;
    private showHelp;
}
//# sourceMappingURL=hook-setup.d.ts.map
/**
 * Live Command - Simple live feed monitor using chalk
 */
import { CommandHandler } from '../command-registry.js';
export declare class LiveCommand implements CommandHandler {
    private backlogManager;
    private hookEvents;
    private syncEvents;
    private taskStats;
    private lastSync;
    private refreshInterval;
    private animationFrame;
    private pulseState;
    private lastUpdateTime;
    constructor();
    execute(action: string, input: any, options: any): Promise<void>;
    private startWatching;
    private refreshTaskStats;
    private displayHeader;
    private displayInitialActivity;
    private updateStats;
    private addHookEvent;
    private addSyncEvent;
    private updateHookActivity;
    private updateSyncActivity;
    private getStatusIndicator;
    private getPulseIndicator;
    private getActivityIndicator;
    private getSyncIndicator;
    private getProgressBar;
    private getSyncStatus;
    private getTimeSince;
    private updateAnimations;
    private cleanup;
}
//# sourceMappingURL=live.d.ts.map
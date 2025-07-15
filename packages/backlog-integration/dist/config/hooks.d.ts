/**
 * Hook Configuration
 * Controls experimental hook features with canary flags
 */
export interface HookConfig {
    enabled: boolean;
    canary: boolean;
    visualFormatting: boolean;
    liveMonitoring: boolean;
    syncEnabled: boolean;
}
export declare const DEFAULT_HOOK_CONFIG: HookConfig;
export declare function getHookConfig(): HookConfig;
export declare function isHookFeatureEnabled(feature: keyof HookConfig): boolean;
export declare function getCanaryWarning(): string;
//# sourceMappingURL=hooks.d.ts.map
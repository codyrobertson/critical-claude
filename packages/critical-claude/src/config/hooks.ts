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

export const DEFAULT_HOOK_CONFIG: HookConfig = {
  enabled: false,          // CANARY: Hooks are disabled by default
  canary: true,           // This is a canary feature
  visualFormatting: true, // Visual formatting is stable
  liveMonitoring: false,  // Live monitoring needs work
  syncEnabled: true       // Sync is stable
};

export function getHookConfig(): HookConfig {
  // Check environment variables for overrides
  const envConfig: Partial<HookConfig> = {
    enabled: process.env.CRITICAL_CLAUDE_HOOKS_ENABLED === 'true',
    canary: process.env.CRITICAL_CLAUDE_HOOKS_CANARY !== 'false',
    visualFormatting: process.env.CRITICAL_CLAUDE_VISUAL_FORMAT !== 'false',
    liveMonitoring: process.env.CRITICAL_CLAUDE_LIVE_MONITOR === 'true',
    syncEnabled: process.env.CRITICAL_CLAUDE_SYNC_ENABLED !== 'false'
  };

  return {
    ...DEFAULT_HOOK_CONFIG,
    ...envConfig
  };
}

export function isHookFeatureEnabled(feature: keyof HookConfig): boolean {
  const config = getHookConfig();
  return config.enabled && config[feature];
}

export function getCanaryWarning(): string {
  return `
⚠️  CANARY FEATURE WARNING ⚠️
Hooks are experimental and may cause issues.
Only enable in development environments.

To enable hooks:
export CRITICAL_CLAUDE_HOOKS_ENABLED=true

For production use, wait for stable release.
`;
}
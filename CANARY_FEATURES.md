# 🚨 Canary Features in Critical Claude

## Overview

Critical Claude uses a canary release system for experimental features that may not be production-ready. These features are **disabled by default** and require explicit activation.

## Current Canary Features

### 🔗 Hook System Integration
**Status**: Canary (Disabled by default)  
**Risk Level**: Medium  
**Affects**: Claude Code integration, task synchronization

#### What it does:
- Automatically syncs tasks between Critical Claude and Claude Code
- Provides real-time visual feedback for TodoWrite operations
- Enables live monitoring of task status changes

#### Why it's canary:
- Hook scripts may interfere with normal Claude Code operation
- File watching can consume system resources
- Synchronization conflicts may cause data inconsistencies
- Not all edge cases have been thoroughly tested

#### How to enable:
```bash
# Enable basic hook functionality (development only)
export CRITICAL_CLAUDE_HOOKS_ENABLED=true

# Enable live monitoring (experimental)
export CRITICAL_CLAUDE_LIVE_MONITOR=true

# Enable visual formatting
export CRITICAL_CLAUDE_VISUAL_FORMAT=true
```

### 🎯 Live Task Monitoring
**Status**: Canary (Disabled by default)  
**Risk Level**: High  
**Affects**: File system watching, performance

#### What it does:
- Monitors Claude Code hook logs in real-time
- Provides live updates on task status changes
- Shows visual indicators for task completion

#### Why it's canary:
- High resource usage from file watching
- Potential race conditions with rapid task updates
- May cause performance degradation
- File system permission issues on some systems

## How to Use Canary Features

### 1. Development Environment Only
```bash
# Set environment variables
export CRITICAL_CLAUDE_HOOKS_ENABLED=true
export CRITICAL_CLAUDE_LIVE_MONITOR=true

# Run Critical Claude
npm run start
```

### 2. Configuration File
Create `.critical-claude.json` in your project root:
```json
{
  "hooks": {
    "enabled": false,
    "canary": true,
    "development_only": true
  }
}
```

### 3. Check Feature Status
```bash
# Check which features are enabled
npx critical-claude status --features

# Test hook integration
npx critical-claude test hooks
```

## Warning Signs

If you experience any of these issues, disable canary features immediately:

- **Performance Issues**: Slow task operations or high CPU usage
- **Synchronization Problems**: Tasks not updating correctly
- **File System Errors**: Permission denied or file watching failures
- **Claude Code Interference**: Normal Claude Code operations failing

## Disabling Canary Features

### Quick Disable
```bash
# Disable all hook features
export CRITICAL_CLAUDE_HOOKS_ENABLED=false

# Or unset the variables
unset CRITICAL_CLAUDE_HOOKS_ENABLED
unset CRITICAL_CLAUDE_LIVE_MONITOR
```

### Permanent Disable
Remove or comment out environment variables from your shell profile:
```bash
# ~/.zshrc or ~/.bashrc
# export CRITICAL_CLAUDE_HOOKS_ENABLED=true  # Commented out
```

## Stability Roadmap

### Phase 1: Canary (Current)
- Basic hook integration
- Development environment testing
- Community feedback collection

### Phase 2: Beta
- Performance optimizations
- Edge case handling
- Comprehensive testing

### Phase 3: Stable
- Production-ready release
- Default enabled features
- Full documentation

## Contributing to Canary Testing

### Reporting Issues
1. **Check Environment**: Ensure you're using development setup
2. **Collect Logs**: Include hook logs and error messages
3. **Describe Impact**: Rate severity and reproducibility
4. **Provide Context**: OS, Node version, project type

### Testing Guidelines
- **Never use in production**: Canary features are for development only
- **Test gradually**: Enable one feature at a time
- **Monitor performance**: Watch for resource usage spikes
- **Document issues**: Help improve stability for everyone

## Technical Implementation

### Hook Configuration
```typescript
// src/config/hooks.ts
export const DEFAULT_HOOK_CONFIG: HookConfig = {
  enabled: false,          // CANARY: Disabled by default
  canary: true,           // This is a canary feature
  visualFormatting: true, // Visual formatting is stable
  liveMonitoring: false,  // Live monitoring needs work
  syncEnabled: true       // Sync is stable
};
```

### Feature Gates
```typescript
// Check before using hook features
if (!isHookFeatureEnabled('syncEnabled')) {
  logger.warn('Hook sync disabled - enable with CRITICAL_CLAUDE_HOOKS_ENABLED=true');
  return;
}
```

## Support

For canary feature issues:
- **GitHub Issues**: [critical-claude/issues](https://github.com/critical-claude/critical-claude/issues)
- **Discord**: #canary-testing channel
- **Email**: canary@critical-claude.dev

---

⚠️ **Remember**: Canary features are experimental. Use at your own risk and never in production environments.

*"Better to catch bugs in development than in production."*
# Migration Plan: brutal-critique → critical_claude

## Executive Summary
This document outlines the complete migration plan for renaming the "brutal-critique-mcp" to "critical_claude" with a new, more intuitive command structure.

## New Command Structure

### Base Commands
- Primary: `cc`
- Alternative: `critical-claude`

### Module Organization
```
cc [module] [action] [args]
```

#### Modules:
1. **crit** - Code critique and analysis
   - `cc crit code` - Analyze code for issues
   - `cc crit arch` - Architecture review
   - `cc crit security` - Security analysis
   - `cc crit explore` - Explore codebase

2. **plan** - Planning and estimation
   - `cc plan timeline` - Generate project timeline
   - `cc plan arch` - Architecture improvement plan

## Detailed Changes

### 1. Directory and Package Renaming

#### Commands to execute:
```bash
# Create new branch
git checkout -b rename-to-critical-claude

# Rename the directory
mv brutal-critique-mcp critical-claude-mcp

# Update directory references in settings
cd critical-claude-mcp
```

#### File: `package.json`
```json
{
  "name": "critical-claude-mcp",
  "version": "1.0.0",
  "description": "Critical Claude - Battle-hardened code review and planning system",
  "bin": {
    "critical-claude-mcp": "./build/index.js"
  },
  // ... rest unchanged
}
```

### 2. Tool Name Mapping

| Current Tool Name | New Tool Name | Usage |
|-------------------|---------------|-------|
| `pragmatic_review` | `cc_crit_code` | `cc crit code` |
| `architecture_review` | `cc_crit_arch` | `cc crit arch` |
| `brutal_plan` | `cc_plan_arch` | `cc plan arch` |
| `brutal_timeline` | `cc_plan_timeline` | `cc plan timeline` |
| `explore_codebase` | `cc_crit_explore` | `cc crit explore` |

### 3. Code Changes

#### File: `src/index.ts`

1. Update server metadata (lines 556-561):
```typescript
const server = new Server(
  {
    name: 'Critical Claude MCP Server',
    version: '1.0.0',
  },
  {
    capabilities: {
      resources: {},
      tools: {},
    },
  }
);
```

2. Update tool registrations in `ListToolsRequestSchema` handler (lines 717-850):
```typescript
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'cc_crit_code',
        description: 'Critical code review that identifies REAL problems, not theoretical issues',
        inputSchema: {
          type: 'object',
          properties: {
            code: {
              type: 'string',
              description: 'The source code to analyze',
            },
            filename: {
              type: 'string',
              description: 'Name of the file being analyzed (helps determine context)',
            },
          },
          required: ['code', 'filename'],
        },
      },
      {
        name: 'cc_crit_arch',
        description: 'Architecture review that matches patterns to problem size',
        inputSchema: {
          type: 'object',
          properties: {
            code: {
              type: 'string',
              description: 'The source code to analyze',
            },
            filename: {
              type: 'string',
              description: 'Name of the file being analyzed',
            },
            context: {
              type: 'object',
              description: 'Additional context about the system',
              properties: {
                user_count: {
                  type: 'number',
                  description: 'Current number of users',
                },
                team_size: {
                  type: 'number',
                  description: 'Development team size',
                },
                current_problems: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Actual problems being experienced',
                },
              },
            },
          },
          required: ['code', 'filename'],
        },
      },
      {
        name: 'cc_crit_explore',
        description: 'Explores entire codebase structure to understand architecture and identify patterns',
        inputSchema: {
          type: 'object',
          properties: {
            rootPath: {
              type: 'string',
              description: 'Root directory path of the codebase to explore',
            },
          },
          required: ['rootPath'],
        },
      },
      {
        name: 'cc_plan_arch',
        description: 'Creates a critical but pragmatic architectural improvement plan based on codebase analysis',
        inputSchema: {
          type: 'object',
          properties: {
            rootPath: {
              type: 'string',
              description: 'Root directory path of the codebase',
            },
            includeAnalysis: {
              type: 'boolean',
              description: 'Whether to run full analysis on key files',
              default: true,
            },
          },
          required: ['rootPath'],
        },
      },
      {
        name: 'cc_plan_timeline',
        description: 'Generate critical reality-based project plans from natural language',
        inputSchema: {
          type: 'object',
          properties: {
            input: {
              type: 'string',
              description: 'Natural language description of what you want to build',
            },
            estimatedDays: {
              type: 'number',
              description: 'Your optimistic estimate in days (optional)',
            },
            context: {
              type: 'object',
              description: 'Additional context (all optional)',
              properties: {
                teamSize: {
                  type: 'number',
                  description: 'Number of developers',
                },
                hasDeadline: {
                  type: 'boolean',
                  description: 'Is there a hard deadline?',
                },
                techStack: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Technology stack being used',
                },
              },
            },
          },
          required: ['input'],
        },
      },
    ],
  };
});
```

3. Update tool handler cases in `CallToolRequestSchema` (lines 857-1181):
```typescript
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  switch (request.params.name) {
    case 'cc_crit_code': {
      // Former pragmatic_review logic
    }
    case 'cc_crit_arch': {
      // Former architecture_review logic
    }
    case 'cc_crit_explore': {
      // Former explore_codebase logic
    }
    case 'cc_plan_arch': {
      // Former brutal_plan logic
    }
    case 'cc_plan_timeline': {
      // Former brutal_timeline logic
    }
    default:
      throw new Error(`Unknown tool: ${request.params.name}`);
  }
});
```

### 4. Configuration File Updates

#### File: `.claude/settings.json`
```json
{
  "mcpServers": {
    "critical-claude": {
      "command": "node",
      "args": ["/Users/Cody/code_projects/critical_claude/critical-claude-mcp/build/index.js"]
    }
  }
}
```

#### File: `.claude/settings.local.json`
Update permissions to use new tool names:
```json
{
  "permissions": {
    "allow": [
      "cc_crit_code",
      "cc_crit_arch",
      "cc_crit_explore",
      "cc_plan_arch",
      "cc_plan_timeline",
      // ... other permissions
    ]
  }
}
```

### 5. Documentation Updates

#### File: `README.md`
- Update title to "🔥 Critical Claude MCP Server"
- Replace all instances of "brutal-critique" with "critical-claude"
- Update tool usage examples:

```markdown
## 🛠️ Available Tools

### Modern Tools (Recommended)

These tools provide focused, pragmatic analysis:

### `cc_crit_code`
Critical code review that identifies REAL problems affecting users.

**Usage:** `cc crit code`

### `cc_crit_arch`
Architecture review that matches patterns to problem size.

**Usage:** `cc crit arch`

### `cc_plan_timeline`
Generate reality-based project timelines with configurable multipliers.

**Usage:** `cc plan timeline`

### `cc_crit_explore`
Analyze entire project structure to provide architectural insights.

**Usage:** `cc crit explore`

### `cc_plan_arch`
Create architectural improvement plans based on codebase analysis.

**Usage:** `cc plan arch`
```

#### File: `CONFIG.md`
Update all references from "brutal-critique" to "critical-claude":
- Configuration path: `~/.config/critical-claude/config.toml`
- Update example paths

### 6. Internal References Update

Search and replace in all source files:
- `brutal-critique` → `critical-claude`
- `Brutal Code Critique` → `Critical Claude`
- `brutal_` → `cc_` (for function/variable prefixes where appropriate)
- `BRUTAL` → `CRITICAL` (in constants and headers)

### 7. Test Updates

Update test files to use new tool names:
- Update mock calls
- Update test descriptions
- Update expected outputs

### 8. Build and Test Commands

```bash
# After making all changes
cd /Users/Cody/code_projects/critical_claude/critical-claude-mcp

# Install dependencies
npm install

# Build the project
npm run build

# Run tests to ensure everything works
npm test

# Test with MCP Inspector
npx @modelcontextprotocol/inspector build/index.js
```

### 9. Git Operations

```bash
# Stage all changes
git add -A

# Commit with descriptive message
git commit -m "feat: Rename brutal-critique to critical_claude with new command structure

- Renamed package from brutal-critique-mcp to critical-claude-mcp
- Implemented new command structure: cc [module] [action]
- Updated all tool names to follow cc_module_action pattern
- Updated documentation and configuration files
- Maintained backward compatibility for configuration

New tool mapping:
- pragmatic_review → cc_crit_code
- architecture_review → cc_crit_arch
- brutal_plan → cc_plan_arch
- brutal_timeline → cc_plan_timeline
- explore_codebase → cc_crit_explore"

# Push the branch
git push origin rename-to-critical-claude
```

## Migration Checklist

- [ ] Create new branch `rename-to-critical-claude`
- [ ] Rename directory from `brutal-critique-mcp` to `critical-claude-mcp`
- [ ] Update `package.json` with new name and bin entry
- [ ] Update tool names in `src/index.ts`
- [ ] Update server metadata in `src/index.ts`
- [ ] Update `.claude/settings.json` with new paths
- [ ] Update `.claude/settings.local.json` permissions
- [ ] Update `README.md` with new naming and examples
- [ ] Update `CONFIG.md` references
- [ ] Search and replace all internal references
- [ ] Update test files
- [ ] Build and test the changes
- [ ] Test with MCP Inspector
- [ ] Commit all changes
- [ ] Create pull request

## Rollback Plan

If issues arise:
```bash
# Switch back to main branch
git checkout main

# Delete the migration branch locally
git branch -D rename-to-critical-claude

# Restore original configuration
git checkout HEAD -- .claude/settings.json
```

## Post-Migration

After successful migration:
1. Update any external documentation
2. Notify users of the new command structure
3. Consider adding aliases for backward compatibility
4. Update any CI/CD pipelines
5. Tag a new release version

## Notes

- The new command structure `cc [module] [action]` provides better organization
- Tool names follow the pattern `cc_module_action` for MCP compatibility
- All functionality remains the same, only naming changes
- Configuration system remains compatible
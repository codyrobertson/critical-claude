# 🚀 Critical Claude Installation Guide

**The ultimate AI-powered code critique and task management system for all major editors and AI tools.**

## 🎯 Quick Start (Choose Your Editor)

| Editor | Installation Method | Time | Difficulty |
|--------|-------------------|------|-----------|
| [Claude Code](#claude-code) | MCP Configuration | 2 minutes | ⭐ Easy |
| [Cursor](#cursor) | Project Rules | 3 minutes | ⭐ Easy |
| [Zed](#zed) | Assistant Integration | 5 minutes | ⭐⭐ Medium |
| [VSCode](#vscode) | Extension + MCP | 7 minutes | ⭐⭐⭐ Advanced |

---

## 📋 Prerequisites

```bash
# Required: Node.js 18+ and npm
node --version  # Should be 18.0.0 or higher
npm --version   # Should be 8.0.0 or higher

# Install Critical Claude globally
npm install -g critical-claude
```

---

## 🔧 Claude Code Integration

### Method 1: Automatic Installation (Recommended)

```bash
# Install and configure automatically
critical-claude install claude-code

# Or using npx (no global install)
npx critical-claude install claude-code
```

### Method 2: Manual Configuration

1. **Locate your Claude Code config file:**
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%/Claude/claude_desktop_config.json`
   - **Linux**: `~/.config/Claude/claude_desktop_config.json`

2. **Add Critical Claude MCP server:**

```json
{
  "mcpServers": {
    "critical-claude": {
      "command": "npx",
      "args": [
        "-y",
        "critical-claude-mcp"
      ],
      "env": {
        "CRITICAL_CLAUDE_PROJECT_PATH": "/path/to/your/project"
      }
    }
  }
}
```

3. **Restart Claude Code**

4. **Test the integration:**
   ```
   Use the cc_crit_code tool to analyze this file: src/index.js
   ```

### Available Tools in Claude Code:
- `cc_crit_code` - Critical code review
- `cc_crit_arch` - Architecture analysis
- `cc_plan_timeline` - Project timeline planning
- `cc_mvp_plan` - MVP planning and prioritization
- `cc_system_design_analyze` - System design analysis
- `cc_data_flow_diagram` - Generate data flow diagrams

---

## 🎨 Cursor Integration

### Method 1: Automatic Installation

```bash
# Install Cursor rules automatically
critical-claude install cursor

# Or for specific project
cd /path/to/your/project
critical-claude init cursor
```

### Method 2: Manual Setup

1. **Create `.cursorrules` file in your project root:**

```bash
# Create the rules file
critical-claude generate cursorrules > .cursorrules
```

2. **Or copy our optimized rules:**

```
You are Critical Claude, a battle-hardened senior software engineer with 15+ years of enterprise experience.

# Core Identity
- Zero tolerance for code that "works on my machine" but fails in production
- Focus on preventing disasters before they happen
- Provide brutal honesty wrapped in constructive solutions

# Code Analysis Framework
## Security Analysis (30%)
- Authentication and authorization flaws
- Injection vulnerabilities (SQL, XSS, command injection)
- Insecure data handling and storage
- OWASP Top 10 violations

## Performance & Scalability (25%)
- Algorithmic complexity issues (O(n²) where O(n) exists)
- Memory leaks and resource management
- Database query optimization
- Concurrency issues and race conditions

## Architecture Assessment (20%)
- SOLID principle violations
- Tight coupling and poor separation of concerns
- Code duplication and DRY violations
- Technical debt accumulation

## Code Quality (15%)
- Readability and clarity issues
- Poor naming conventions
- Excessive complexity and nesting
- Missing error handling

## Testing Strategy (10%)
- Missing test coverage for critical paths
- Inadequate edge case testing
- Untestable code architecture

# Response Format
For every code review, provide:
1. **Severity Classification** (🔴 Critical, 🟠 High, 🟡 Medium, 🔵 Low)
2. **Specific Evidence** with file:line references
3. **Complete Working Solutions** with tests
4. **Real-World Impact** assessment
5. **Prevention Strategies**

# Task Management Integration
- Track code review tasks with priority levels
- Link code issues to sprint planning
- Generate actionable improvement roadmaps
- Monitor technical debt accumulation

Always provide production-ready code or don't ship at all.
```

3. **Enable Cursor's AI features:**
   - Open Command Palette (`Cmd+Shift+P`)
   - Run "Cursor: Enable AI Features"
   - The rules will automatically apply to all AI interactions

---

## ⚡ Zed Integration

### Method 1: Automatic Installation

```bash
# Install Zed assistant configuration
critical-claude install zed
```

### Method 2: Manual Setup

1. **Open Zed Settings:**
   - `Cmd+,` (macOS) or `Ctrl+,` (Windows/Linux)
   - Or `Zed > Settings` from menu

2. **Add Critical Claude configuration:**

```json
{
  "agent": {
    "default_model": {
      "provider": "anthropic",
      "model": "claude-3-5-sonnet-20240620"
    },
    "custom_tools": [
      {
        "name": "critical-claude-review",
        "description": "Critical code review with production-ready analysis",
        "command": "npx",
        "args": ["critical-claude", "review", "--format", "zed"],
        "working_directory": "${workspaceFolder}"
      },
      {
        "name": "critical-claude-plan",
        "description": "Generate project timeline and MVP planning",
        "command": "npx",
        "args": ["critical-claude", "plan", "--interactive"],
        "working_directory": "${workspaceFolder}"
      }
    ]
  },
  "language_models": {
    "anthropic": {
      "api_url": "https://api.anthropic.com",
      "available_models": [
        {
          "name": "claude-3-5-sonnet-20240620",
          "display_name": "Critical Claude Sonnet",
          "max_tokens": 128000,
          "supports_tools": true,
          "supports_images": true
        }
      ]
    }
  }
}
```

3. **Create assistant context file:**

```bash
# Create Zed assistant context
critical-claude generate zed-context > ~/.config/zed/assistant_context.md
```

4. **Usage in Zed:**
   - Open Assistant panel (`Cmd+Shift+A`)
   - Type `/critical-claude-review` to run code analysis
   - Type `/critical-claude-plan` for project planning

---

## 🆚 VSCode Integration

### Method 1: Extension (Recommended)

```bash
# Install the official extension
code --install-extension critical-claude.vscode-critical-claude

# Or search "Critical Claude" in VSCode Extensions
```

### Method 2: Manual MCP Setup

1. **Install MCP extension:**
   ```bash
   code --install-extension modelcontextprotocol.mcp-vscode
   ```

2. **Configure in VSCode settings:**

```json
{
  "mcp.servers": {
    "critical-claude": {
      "command": "npx",
      "args": ["-y", "critical-claude-mcp"],
      "env": {
        "CRITICAL_CLAUDE_PROJECT_PATH": "${workspaceFolder}"
      }
    }
  },
  "mcp.authentication": {
    "oauth": {
      "clientId": "critical-claude-vscode",
      "redirectUri": "vscode://critical-claude.vscode-critical-claude/auth"
    }
  }
}
```

3. **Available Commands:**
   - `Ctrl+Shift+P` → "Critical Claude: Review File"
   - `Ctrl+Shift+P` → "Critical Claude: Analyze Architecture"
   - `Ctrl+Shift+P` → "Critical Claude: Generate Timeline"
   - `Ctrl+Shift+P` → "Critical Claude: Task Management"

---

## 🔧 Configuration Files

### agents.md (AI Assistant Instructions)

```bash
# Generate AI assistant instructions
critical-claude generate agents > agents.md
```

### claude.md (Claude-Specific Setup)

```bash
# Generate Claude-specific configuration
critical-claude generate claude > claude.md
```

### Project-Specific Configuration

Create `.critical-claude.json` in your project root:

```json
{
  "version": "1.0.0",
  "project": {
    "name": "My Project",
    "type": "web-app",
    "language": "typescript",
    "framework": "react"
  },
  "critique": {
    "severity_threshold": "medium",
    "focus_areas": ["security", "performance", "architecture"],
    "exclude_patterns": ["node_modules/**", "dist/**", "build/**"]
  },
  "tasks": {
    "integration": "claude-code",
    "hook_enabled": true,
    "auto_sync": true
  },
  "team": {
    "size": "small",
    "experience": "intermediate",
    "timezone": "UTC"
  }
}
```

---

## 🧪 Testing Your Installation

### 1. Test CLI Installation
```bash
# Test global installation
critical-claude --version
critical-claude status

# Test MCP server
npx critical-claude-mcp --help
```

### 2. Test Editor Integration

#### Claude Code:
```
Use the cc_crit_code tool to analyze this simple function:
function add(a, b) { return a + b; }
```

#### Cursor:
- Open any code file
- Ask: "Review this file using Critical Claude standards"
- Should see detailed analysis with severity levels

#### Zed:
- Open Assistant panel
- Type: `/critical-claude-review`
- Should see code analysis tools available

#### VSCode:
- `Ctrl+Shift+P` → "Critical Claude: Review File"
- Should see the extension running

### 3. Test Task Management Integration

```bash
# Test task creation
critical-claude task add "Test installation"

# Test Claude Code sync
critical-claude sync claude-code

# Test live monitoring
critical-claude ui monitor
```

---

## 🚨 Troubleshooting

### Common Issues

#### 1. "Command not found: critical-claude"
```bash
# Reinstall globally
npm uninstall -g critical-claude
npm install -g critical-claude

# Or use npx
npx critical-claude --version
```

#### 2. MCP Server Not Loading
```bash
# Check MCP server directly
npx critical-claude-mcp

# Check Claude Code logs
tail -f ~/Library/Logs/Claude/claude.log
```

#### 3. Cursor Rules Not Applied
```bash
# Regenerate rules
critical-claude generate cursorrules > .cursorrules

# Restart Cursor
# Clear Cursor cache: Cmd+Shift+P → "Cursor: Clear Cache"
```

#### 4. Zed Assistant Not Working
```bash
# Check Zed configuration
cat ~/.config/zed/settings.json

# Restart Zed
# Check Zed logs in Activity Monitor
```

#### 5. VSCode Extension Issues
```bash
# Reload VSCode
# Check Developer Console: Help → Toggle Developer Tools
# Look for Critical Claude extension logs
```

### Getting Help

- 🐛 **Issues**: [GitHub Issues](https://github.com/critical-claude/critical-claude/issues)
- 📖 **Documentation**: [Full Docs](https://critical-claude.dev/docs)
- 💬 **Discord**: [Community Server](https://discord.gg/critical-claude)
- 🐦 **Twitter**: [@CriticalClaude](https://twitter.com/CriticalClaude)

---

## 🎯 Next Steps

1. **Complete the installation** for your preferred editor
2. **Configure project-specific settings** with `.critical-claude.json`
3. **Set up team collaboration** with shared configuration
4. **Explore advanced features** like timeline planning and MVP analysis
5. **Join our community** for tips and best practices

---

**🚀 Ready to ship bulletproof code? Let's get started!**

*"The best code review is the one that finds the bug that would have taken down production on Black Friday."*
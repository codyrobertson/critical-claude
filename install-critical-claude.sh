#!/bin/bash

# 🔥 Critical Claude - One-Script Installation
# Installs Critical Claude, configures Claude Desktop MCP, and sets up custom prompts
# ===============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Configuration
CRITICAL_CLAUDE_DIR="$HOME/.critical-claude"
CLAUDE_CONFIG_DIR="$HOME/.claude"
CLAUDE_CONFIG_FILE="$CLAUDE_CONFIG_DIR/settings.json"
CLAUDE_CONFIG_LOCAL="$CLAUDE_CONFIG_DIR/settings.local.json"
CLAUDE_MD_FILE="$CLAUDE_CONFIG_DIR/CLAUDE.md"

# Function to print colored output
print_header() {
    echo -e "\n${CYAN}${BOLD}🔥 $1${NC}"
    echo -e "${CYAN}$( printf '=%.0s' {1..60} )${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to detect package manager
detect_package_manager() {
    if command_exists npm; then
        echo "npm"
    elif command_exists yarn; then
        echo "yarn"
    elif command_exists pnpm; then
        echo "pnpm"
    else
        echo ""
    fi
}

# Function to backup existing file
backup_file() {
    local file="$1"
    if [[ -f "$file" ]]; then
        local backup="${file}.backup.$(date +%Y%m%d_%H%M%S)"
        cp "$file" "$backup"
        print_info "Backed up existing file to: $backup"
    fi
}

# Function to check Node.js version
check_node_version() {
    if ! command_exists node; then
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        echo "Visit: https://nodejs.org/"
        exit 1
    fi
    
    local node_version=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [[ $node_version -lt 18 ]]; then
        print_error "Node.js version 18+ is required. Current version: $(node -v)"
        exit 1
    fi
    
    print_success "Node.js version: $(node -v)"
}

# Function to install dependencies
install_dependencies() {
    local package_manager=$(detect_package_manager)
    
    if [[ -z "$package_manager" ]]; then
        print_error "No package manager found. Please install npm, yarn, or pnpm."
        exit 1
    fi
    
    print_info "Using package manager: $package_manager"
    
    # Install dependencies
    case "$package_manager" in
        "npm")
            npm install
            npm run build
            ;;
        "yarn")
            yarn install
            yarn build
            ;;
        "pnpm")
            pnpm install
            pnpm build
            ;;
    esac
}

# Function to setup Critical Claude directory
setup_critical_claude_dir() {
    if [[ ! -d "$CRITICAL_CLAUDE_DIR" ]]; then
        mkdir -p "$CRITICAL_CLAUDE_DIR"
        print_success "Created Critical Claude directory: $CRITICAL_CLAUDE_DIR"
    else
        print_info "Critical Claude directory already exists: $CRITICAL_CLAUDE_DIR"
    fi
    
    # Create subdirectories
    mkdir -p "$CRITICAL_CLAUDE_DIR/prompts"
    mkdir -p "$CRITICAL_CLAUDE_DIR/templates" 
    mkdir -p "$CRITICAL_CLAUDE_DIR/config"
}

# Function to configure Claude Desktop MCP
configure_claude_desktop() {
    print_header "Configuring Claude Desktop MCP Integration"
    
    # Create .claude directory if it doesn't exist
    mkdir -p "$CLAUDE_CONFIG_DIR"
    
    # Get current directory for absolute paths
    local current_dir=$(pwd)
    
    # Backup existing configuration
    backup_file "$CLAUDE_CONFIG_FILE"
    backup_file "$CLAUDE_CONFIG_LOCAL"
    
    # Create MCP configuration
    cat > "$CLAUDE_CONFIG_FILE" << EOF
{
  "mcpServers": {
    "critical-claude-code-critique": {
      "command": "node",
      "args": ["$current_dir/packages/code-critique/dist/server.js"],
      "cwd": "$current_dir"
    },
    "critical-claude-project-management": {
      "command": "node", 
      "args": ["$current_dir/packages/project-management/dist/server.js"],
      "cwd": "$current_dir"
    },
    "critical-claude-prompt-management": {
      "command": "node",
      "args": ["$current_dir/packages/prompt-management/dist/server.js"], 
      "cwd": "$current_dir"
    },
    "critical-claude-backlog-integration": {
      "command": "node",
      "args": ["$current_dir/packages/backlog-integration/dist/cli/cc-main.js"],
      "cwd": "$current_dir"
    }
  }
}
EOF
    
    print_success "Created Claude Desktop MCP configuration"
    print_info "Configuration file: $CLAUDE_CONFIG_FILE"
}

# Function to create custom prompts
create_custom_prompts() {
    print_header "Setting Up Custom Task Management Prompts"
    
    # Create the custom CLAUDE.md with task management integration
    if [[ -f "custom-prompts-template.md" ]]; then
        cp "custom-prompts-template.md" "$CLAUDE_MD_FILE"
        print_success "Integrated custom prompt template from custom-prompts-template.md"
    else
        print_info "Using embedded template (custom-prompts-template.md not found)"
        cat > "$CLAUDE_MD_FILE" << 'EOF'
# 🔥 Critical Claude Task Management Integration

## Core Mission
You are a senior software engineer integrated with Critical Claude's task management system. Your role is to provide brutal but constructive code analysis while creating actionable tasks for improvement.

## Task Creation Workflow

When analyzing code, you should:

1. **Identify Issues**: Use Critical Claude's analysis tools to find real problems
2. **Create Tasks**: Convert code issues into specific, actionable tasks
3. **Prioritize Brutally**: Focus on production-breaking issues, not theoretical perfection
4. **Track Progress**: Update tasks as work progresses

## Available Commands

### Critical Claude Analysis
- `cc_crit_code` - Analyze code for security, performance, and architecture issues
- `cc_crit_arch` - Review architecture patterns matching problem size
- `cc_plan_timeline` - Generate realistic project timelines with multipliers

### Task Management  
- `cc task create "title" --priority high --description "details"` - Create new task
- `cc task list` - Show current tasks
- `cc task ui` - Open interactive task manager
- `cc task sync` - Sync with Claude Code todos

### Prompt Management
- `cc_prompt_mgmt action=list` - Show available templates
- `cc_prompt_mgmt action=render id=security-audit` - Use security template

## Custom Prompt Templates

Use these templates for common scenarios:

### Code Review → Task Creation
```
Analyze this code with Critical Claude and create tasks for any issues found:

{CODE}

Focus on:
- Security vulnerabilities that could cause data breaches
- Performance bottlenecks that will break under load  
- Architecture violations that create maintenance hell
- Missing error handling that will cause production failures

For each issue found:
1. Assess real-world impact (not theoretical)
2. Create a specific task with acceptance criteria
3. Set priority based on production risk
4. Estimate effort realistically (add 3x multiplier)
```

### Architecture Analysis → Improvement Plan
```
Perform brutal architecture review and create improvement roadmap:

Context:
- Team size: {TEAM_SIZE}
- User count: {USER_COUNT}  
- Technology: {TECH_STACK}

Current problems:
{CURRENT_ISSUES}

Generate:
1. Critical issues that need immediate attention
2. Technical debt that's slowing development
3. Over-engineering that should be simplified
4. Missing pieces that will cause future pain

Create tasks prioritized by business impact and development velocity.
```

### Performance Investigation → Optimization Tasks
```
Investigate performance issues and create optimization tasks:

Performance problem: {PROBLEM_DESCRIPTION}
Scale: {USER_COUNT} users, {TEAM_SIZE} developers

Analyze:
- Algorithmic complexity issues
- Database query problems
- Memory leaks and resource management
- Scaling bottlenecks

Create tasks with:
- Specific performance targets (e.g., "Reduce response time from 2s to 200ms")
- Measurement criteria (benchmarks, monitoring)
- Implementation steps that won't break existing functionality
```

## Task Prioritization Framework

### 🚨 CRITICAL (Fix This Week)
- Security vulnerabilities enabling attacks
- Performance issues breaking user experience
- Data corruption or loss scenarios
- Production deployment blockers

### 🔥 HIGH (Fix Before Next Release)  
- User-facing bugs affecting core workflows
- Performance degradation under normal load
- Technical debt slowing feature development
- Missing monitoring for critical systems

### 📋 MEDIUM (Fix This Quarter)
- Code quality issues affecting maintainability
- Missing tests for important features
- Documentation gaps for team knowledge
- Refactoring opportunities for cleaner code

### 📝 LOW (Fix When Time Permits)
- Style guide violations
- Minor naming inconsistencies  
- Nice-to-have optimizations
- Theoretical improvements without clear benefit

## Integration Guidelines

### When to Create Tasks
- Any issue that could cause production problems
- Technical debt that's actively slowing development
- Missing features that users are requesting
- Security or compliance requirements

### When NOT to Create Tasks
- Theoretical improvements without business value
- Perfect code that's already working well
- Over-engineering for scale you don't have
- Refactoring just for refactoring's sake

### Task Creation Best Practices
1. **Be Specific**: "Fix authentication bug causing 401 errors" not "Improve auth"
2. **Include Context**: Link to relevant code, error logs, or user reports
3. **Set Clear Criteria**: Define what "done" looks like with measurable outcomes
4. **Estimate Realistically**: Use 3x multiplier for complex features, add buffer for unknowns

## Remember: Perfect is the Enemy of Good

Focus on shipping working code that solves real problems. Use Critical Claude's brutal honesty to prioritize what actually matters for your users and business.
EOF
    fi
    
    print_success "Created custom task management prompts"
    print_info "Prompts file: $CLAUDE_MD_FILE"
}

# Function to create CLI symlinks
create_cli_symlinks() {
    print_header "Setting Up CLI Commands"
    
    local current_dir=$(pwd)
    
    # Create symlinks for easy CLI access
    if [[ -d "/usr/local/bin" ]] && [[ -w "/usr/local/bin" ]]; then
        ln -sf "$current_dir/packages/backlog-integration/dist/cli/cc-main.js" "/usr/local/bin/cc"
        print_success "Created CLI symlink: cc command available globally"
    else
        print_warning "Cannot create global CLI symlink. Run with sudo if you want global access."
        print_info "You can still use: node $current_dir/packages/backlog-integration/dist/cli/cc-main.js"
    fi
}

# Function to verify installation
verify_installation() {
    print_header "Verifying Installation"
    
    # Check if build was successful
    if [[ -f "packages/backlog-integration/dist/cli/cc-main.js" ]]; then
        print_success "Critical Claude build successful"
    else
        print_error "Build failed - main CLI file not found"
        exit 1
    fi
    
    # Test basic CLI functionality
    if timeout 5s node packages/backlog-integration/dist/cli/cc-main.js --help >/dev/null 2>&1; then
        print_success "CLI functionality verified"
    else
        print_warning "CLI test failed - may still work with full commands"
    fi
    
    # Check Claude Desktop configuration
    if [[ -f "$CLAUDE_CONFIG_FILE" ]]; then
        print_success "Claude Desktop MCP configuration created"
    else
        print_error "Claude Desktop configuration missing"
    fi
    
    # Check custom prompts
    if [[ -f "$CLAUDE_MD_FILE" ]]; then
        print_success "Custom task management prompts installed"
    else
        print_error "Custom prompts file missing"
    fi
    
    # Verify task system works
    if timeout 10s node packages/backlog-integration/dist/cli/cc-main.js task list >/dev/null 2>&1; then
        print_success "Task management system verified"
    else
        print_warning "Task system test failed - may need manual setup"
    fi
}

# Function to show completion message
show_completion() {
    print_header "Installation Complete! 🎉"
    
    echo -e "${GREEN}Critical Claude has been successfully installed and configured!${NC}\n"
    
    echo -e "${BOLD}📋 What's been set up:${NC}"
    echo -e "   ✅ Critical Claude packages built and ready"
    echo -e "   ✅ Claude Desktop MCP integration configured" 
    echo -e "   ✅ Custom task management prompts installed"
    echo -e "   ✅ CLI commands available\n"
    
    echo -e "${BOLD}🚀 Next Steps:${NC}"
    echo -e "   1. Restart Claude Desktop to load MCP configuration"
    echo -e "   2. Test task management: ${CYAN}cc task ui${NC}"
    echo -e "   3. Try code analysis: ${CYAN}cc_crit_code${NC} (in Claude Desktop)"
    echo -e "   4. View all tasks: ${CYAN}cc task list${NC}\n"
    
    echo -e "${BOLD}📖 Quick Commands:${NC}"
    echo -e "   ${CYAN}cc task create \"Fix bug\" --priority high${NC}  # Create task"
    echo -e "   ${CYAN}cc task ui${NC}                                # Interactive UI"
    echo -e "   ${CYAN}cc task sync${NC}                              # Sync with Claude Code"
    echo -e "   ${CYAN}node packages/backlog-integration/dist/cli/cc-main.js --help${NC}  # Full help\n"
    
    echo -e "${BOLD}🔧 Configuration Files:${NC}"
    echo -e "   Claude Desktop: ${YELLOW}$CLAUDE_CONFIG_FILE${NC}"
    echo -e "   Custom Prompts: ${YELLOW}$CLAUDE_MD_FILE${NC}"
    echo -e "   Critical Claude: ${YELLOW}$CRITICAL_CLAUDE_DIR${NC}\n"
    
    echo -e "${YELLOW}Need help? Check the README or run: cc --help${NC}"
}

# Main installation flow
main() {
    print_header "Critical Claude Installation Starting"
    
    echo -e "${BOLD}This script will:${NC}"
    echo -e "   🔧 Install and build Critical Claude packages"
    echo -e "   ⚙️  Configure Claude Desktop MCP integration"  
    echo -e "   📝 Set up custom task management prompts"
    echo -e "   🔗 Create CLI shortcuts for easy access"
    echo -e ""
    
    read -p "Continue with installation? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Installation cancelled."
        exit 0
    fi
    
    # Run installation steps
    check_node_version
    print_header "Installing Dependencies"
    install_dependencies
    
    setup_critical_claude_dir
    configure_claude_desktop
    create_custom_prompts
    create_cli_symlinks
    verify_installation
    show_completion
}

# Run main function
main "$@"
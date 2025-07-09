# Critical Claude CLI Command Reference

## Core Commands

### Code Review & Analysis
```bash
cc crit code <file>              # Brutal code review
cc crit arch <file>              # Architecture review with context
  -u, --users <count>            # Current user count
  -t, --team <size>              # Team size
  -p, --problems <problems...>   # Current problems

cc explore <path>                # Explore codebase structure
```

### Planning & Timeline
```bash
cc plan timeline <description>   # Generate brutal timeline
  -d, --days <days>              # Estimated days
  -t, --team <size>              # Team size
  --deadline                     # Has hard deadline
  --stack <tech...>              # Tech stack

cc plan arch <path>              # Architecture improvement plan
  --no-analysis                  # Skip code analysis
```

### Project Management
```bash
cc init [name]                   # Initialize Critical Claude
cc mvp <name>                    # Generate MVP plan
  -d, --description <desc>       # Product description (required)
  -u, --users <users>            # Target users (required)
  -b, --budget <amount>          # Budget in USD
  -t, --timeline <time>          # Timeline (e.g., "3 months")
  --team <size>                  # Team size
```

### System Design
```bash
cc design analyze <path>         # System architecture analysis
  -f, --focus <area>             # Focus: scalability|performance|maintainability|security|all

cc stack                         # Tech stack recommendations
  -t, --type <type>              # Project type (required): web-app|mobile-app|api|desktop-app|microservices
  -r, --requirements <reqs...>   # Requirements (required)
  -e, --experience <level>       # Team experience (required): beginner|intermediate|advanced
  -b, --budget <level>           # Budget: low|medium|high
  --timeline <period>            # Timeline: weeks|months|years
```

### Data Flow Analysis
```bash
cc flow analyze <path>           # Analyze data flow patterns
cc flow trace <entry>            # Trace from entry point
  -r, --root <path>              # Root directory (required)
cc flow diagram <path>           # Generate flow diagrams
  -t, --type <type>              # Diagram type: system|critical-path|database|all
```

### Prompt Management
```bash
cc prompt list                   # List all prompts
  -c, --category <category>      # Filter by category
cc prompt get <id>               # Get specific prompt
cc prompt add <id>               # Add new prompt
  -n, --name <name>              # Name (required)
  -d, --description <desc>       # Description (required)
  -t, --template <template>      # Template (required)
  -c, --category <category>      # Category
  --tags <tags...>               # Tags
```

### Backlog Management
```bash
cc backlog sprint create         # Create new sprint
cc backlog task add              # Add task
cc backlog task list             # List tasks
cc backlog task focus <id>       # Focus on task
cc backlog task block <id>       # Block task
cc backlog task done <id>        # Complete task
cc backlog generate <feature>    # AI task generation
```

### Direct Chat
```bash
cc chat <prompt>                 # Direct Claude chat
cc <prompt>                      # Shorthand for chat
```

## Global Options
```bash
-m, --model <model>              # Claude model: opus|sonnet|haiku (default: sonnet)
-j, --json                       # Output in JSON format
-q, --quiet                      # Suppress output during execution
--help                           # Show help for any command
```

## Examples

### Quick Tasks
```bash
# Code review
cc crit code src/api/auth.ts

# Architecture review with context
cc crit arch src/server.ts -u 50000 -t 3 -p "slow queries" "memory leaks"

# Generate timeline
cc plan timeline "implement real-time chat" -d 30 -t 2 --deadline

# Create MVP plan
cc mvp "TaskMaster" -d "Project management for developers" -u "Small dev teams" -b 50000

# Analyze system design
cc design analyze . -f performance

# Recommend tech stack
cc stack -t web-app -r real-time collaboration offline-support -e intermediate -b medium

# Direct questions
cc "What's the best way to implement rate limiting?"
```

### Workflow Examples
```bash
# Initialize new project
cc init "my-awesome-app"

# Explore and plan architecture
cc explore .
cc plan arch . --no-analysis

# Set up backlog
cc backlog sprint create "Sprint 1" -d 14
cc backlog generate "user authentication system"
cc backlog task list
cc backlog task focus TASK-001

# Review implementation
cc crit code src/auth/login.ts
cc flow analyze .
```

## Aliases (after running setup-alias.sh)
```bash
alias cc='cc'
alias ccr='cc crit code'
alias cca='cc crit arch'
alias ccp='cc plan timeline'
alias ccx='cc explore'
alias ccb='cc backlog'
```
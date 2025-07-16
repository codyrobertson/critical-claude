# 🎯 Standardized Command Structure - Critical Claude

## 🚨 **Current Problem**
Commands are a complete mess:
- Duplicated commands (`hooks` appears 8 times!)
- Inconsistent naming (`cc-hooks-status` vs `hooks status`)
- Confusing aliases (`task|t`, `backlog|b`, `crit|review`)
- Multiple CLIs (`cc`, `cc-backlog`) doing similar things
- Non-intuitive command paths

## ✅ **New Standardized Structure**

### **Single Entry Point: `cc` (Critical Claude)**

```bash
# CORE COMMANDS - Simple, memorable, logical
cc task <action>          # Task management
cc hook <action>          # Hook management  
cc crit <target>          # Code critique
cc plan <input>           # AI planning
cc ui                     # Interactive interfaces
cc status                 # System status
```

### **Detailed Command Structure**

#### **📋 Task Management: `cc task`**
```bash
cc task list              # List all tasks
cc task show <id>         # Show task details
cc task add "<title>"     # Add new task
cc task edit <id>         # Edit task
cc task delete <id>       # Delete task
cc task ui                # Interactive task UI
```

#### **🔧 Hook Management: `cc hook`**
```bash
cc hook status            # Show hook status
cc hook install           # Install hooks
cc hook test              # Test hooks
cc hook upgrade           # Upgrade to advanced hooks
```

#### **🔍 Code Critique: `cc crit`**
```bash
cc crit code <file>       # Critique code file
cc crit arch <path>       # Architecture analysis
cc crit explore <path>    # Explore codebase
```

#### **🤖 AI Planning: `cc plan`**
```bash
cc plan feature "<desc>"  # Plan feature development
cc plan timeline "<desc>" # Generate timeline
cc plan mvp "<desc>"      # MVP planning
```

#### **🎮 Interactive UI: `cc ui`**
```bash
cc ui                     # Default task UI
cc ui monitor             # Live monitoring
cc ui status              # Status dashboard
```

#### **📊 System Status: `cc status`**
```bash
cc status                 # Overall system status
cc status tasks           # Task statistics
cc status hooks           # Hook status
cc status sync            # Sync status
```

## 🔄 **Migration Plan**

### **Phase 1: Create Unified CLI Router**
- Single `cc` entry point
- Route all commands through standardized paths
- Maintain backward compatibility

### **Phase 2: Implement Clean Commands**
- `cc task` - All task operations
- `cc hook` - All hook operations
- `cc crit` - All critique operations
- `cc plan` - All planning operations
- `cc ui` - All interactive interfaces
- `cc status` - All status information

### **Phase 3: Deprecate Old Commands**
- Mark `cc-backlog` commands as deprecated
- Add migration warnings
- Eventually remove redundant CLIs

## 📖 **New Usage Examples**

```bash
# Task Management
cc task list                    # List tasks
cc task add "Fix login bug"     # Add task
cc task ui                      # Interactive UI

# Hook Management  
cc hook status                  # Check hooks
cc hook install                 # Install hooks
cc hook test                    # Test hooks

# Code Critique
cc crit code src/auth.ts        # Critique file
cc crit arch .                  # Analyze architecture

# AI Planning
cc plan feature "user auth"     # Plan feature
cc plan timeline "chat app"     # Generate timeline

# Interactive UIs
cc ui                           # Task management UI
cc ui monitor                   # Live monitor

# System Status
cc status                       # Overall status
cc status hooks                 # Hook status
```

## 🎯 **Benefits of Standardization**

1. **Intuitive**: Commands follow logical patterns
2. **Memorable**: Short, clear command names
3. **Consistent**: Same patterns across all features
4. **Discoverable**: `cc <tab>` shows all main commands
5. **Extensible**: Easy to add new commands
6. **Professional**: Enterprise-ready command structure
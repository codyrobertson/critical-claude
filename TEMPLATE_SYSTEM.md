# Critical Claude Task Template System

## Overview

The task template system allows users to define project-specific task templates that can be instantly loaded when starting new projects. This system significantly speeds up project initialization by providing pre-defined task hierarchies with dependencies.

## Features Implemented

### 1. **TOML Format Support**
- Templates are defined in TOML format for easy readability and editing
- Full support for nested structures, arrays, and metadata

### 2. **Multiple Project Types**
Built-in templates for:
- **webapp**: Full-stack web application (React + Node.js)
- **api**: RESTful API service
- **mobile-app**: Cross-platform mobile app (React Native)
- **cli-tool**: Command-line interface tool
- **microservice**: Microservice architecture with Docker/K8s
- **machine-learning**: ML project with data pipeline and MLOps

### 3. **Task Hierarchies with Dependencies**
- Support for phases to group related tasks
- Task dependencies ensure proper sequencing
- Parent-child task relationships for subtasks
- Automatic dependency resolution when loading templates

### 4. **Custom Fields and Metadata**
Templates include:
- Project metadata (timeline, team size, difficulty)
- Task priorities and story points
- Labels and categories
- Custom metadata fields

### 5. **AI Integration**
- Templates work seamlessly with existing AI task generation
- AI can enhance template tasks with better descriptions
- Templates provide context for AI expansion

### 6. **Template Inheritance and Composition**
- Templates can inherit from other templates
- Allows building specialized templates on top of base templates
- Example: microservice template inherits from api template

### 7. **CLI Commands**

```bash
# List available templates
cc task template list

# Load a template
cc task template webapp

# Load with custom variables
cc task template webapp --project_name myapp --auth_type oauth

# View template details
cc task template show webapp

# Create a new template
cc task template create my-template --type custom
```

## Implementation Details

### File Structure
```
packages/critical-claude/
├── src/cli/commands/unified-task.ts  # Extended with template functionality
├── templates/                        # Default templates directory
│   ├── webapp.toml
│   ├── api.toml
│   ├── mobile-app.toml
│   ├── cli-tool.toml
│   ├── microservice.toml
│   ├── machine-learning.toml
│   └── README.md
```

### Template Structure

```toml
name = "template-name"
description = "Template description"
type = "project-type"
version = "1.0.0"
author = "Author Name"
inherits = ["parent-template"]  # Optional

[metadata]
tags = ["tag1", "tag2"]
difficulty = "intermediate"
team_size = 3
timeline = "8-12 weeks"

[variables.project_name]
type = "string"
default = "my-project"
description = "Project name"
required = true

[[phases]]
name = "phase-name"
description = "Phase description"

[[phases.tasks]]
id = "task-id"
title = "Task title with {{project_name}}"
priority = "high"
labels = ["label1", "label2"]
storyPoints = 5
dependencies = ["other-task-id"]
```

### Variable Substitution
- Templates support variable placeholders using `{{variable_name}}` syntax
- Variables can be passed via CLI options
- Default values are used when variables aren't provided

### Template Loading Process
1. Read template from TOML file
2. Process template inheritance
3. Substitute variables with provided values
4. Create tasks in the storage system
5. Resolve and apply dependencies
6. Sync with Claude Code hooks

## Usage Examples

### Basic Template Loading
```bash
cc task template webapp
```

### With Custom Variables
```bash
cc task template api --project_name user-service --framework fastify
```

### Creating Custom Templates
```bash
cc task template create saas-platform --type web --description "SaaS platform template"
```

Then edit `.cc-templates/saas-platform.toml` to customize.

## Benefits

1. **Rapid Project Setup**: Initialize projects with dozens of properly structured tasks in seconds
2. **Consistency**: Ensure all projects follow organizational standards
3. **Knowledge Capture**: Encode best practices and lessons learned into templates
4. **Flexibility**: Customize templates with variables for different scenarios
5. **Integration**: Works seamlessly with existing AI and hook systems

## Future Enhancements

Potential improvements:
- Template marketplace/sharing
- Visual template editor
- Template versioning
- Conditional task inclusion based on variables
- Integration with external project management tools
- Template analytics and usage tracking
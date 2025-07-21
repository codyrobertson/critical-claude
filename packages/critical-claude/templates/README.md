# Critical Claude Task Templates

This directory contains pre-defined task templates for common project types. These templates help you quickly scaffold comprehensive task lists for various development projects.

## Available Templates

### 1. **webapp** - Full-Stack Web Application
- React frontend + Node.js backend
- 3 phases: Setup, Core Features, Testing & Deployment
- Timeline: 8-12 weeks
- Team size: 3 developers

### 2. **api** - RESTful API Service
- Backend API with authentication and database
- Single phase with 8 core tasks
- Timeline: 4-6 weeks
- Team size: 2 developers

### 3. **mobile-app** - Cross-Platform Mobile App
- React Native application
- 3 phases: Setup, UI Components, Native Features
- Timeline: 10-14 weeks
- Team size: 2 developers

### 4. **cli-tool** - Command Line Tool
- Node.js CLI application
- Single phase with 8 tasks
- Timeline: 2-3 weeks
- Team size: 1 developer

### 5. **microservice** - Microservice Architecture
- Distributed services with Docker/K8s
- 3 phases: Infrastructure, Core Services, Observability
- Timeline: 12-16 weeks
- Team size: 4 developers
- Inherits from: api template

### 6. **machine-learning** - ML Project
- Data pipeline + model development + MLOps
- 4 phases: Data Engineering, Model Development, MLOps, Documentation
- Timeline: 12-16 weeks
- Team size: 3 developers

## Using Templates

### List available templates:
```bash
cc task template list
```

### Load a template:
```bash
cc task template webapp
```

### Load with custom variables:
```bash
cc task template webapp --project_name myapp --use_typescript true --auth_type oauth
```

### View template details:
```bash
cc task template show webapp
```

### Create a custom template:
```bash
cc task template create my-template --type custom --description "My custom template"
```

## Template Structure

Templates are written in TOML format with the following structure:

```toml
name = "template-name"
description = "Template description"
type = "project-type"
version = "1.0.0"
author = "Author Name"
inherits = ["parent-template"]  # Optional

[metadata]
tags = ["tag1", "tag2"]
difficulty = "beginner|intermediate|advanced"
team_size = 3
experience_level = "junior|intermediate|senior"
timeline = "4-6 weeks"

[variables.variable_name]
type = "string|boolean|number"
default = "default value"
description = "Variable description"
required = true

[[phases]]
name = "phase-name"
description = "Phase description"

[[phases.tasks]]
id = "task-id"
title = "Task title with {{variable_name}}"
priority = "high|medium|low"
labels = ["label1", "label2"]
storyPoints = 5
dependencies = ["other-task-id"]

# Or direct tasks without phases
[[tasks]]
id = "task-id"
title = "Task title"
# ... same properties as above
```

## Creating Custom Templates

1. Create a new `.toml` file in the templates directory
2. Define the template metadata and structure
3. Add variables for customization
4. Define tasks with dependencies
5. Use `{{variable_name}}` syntax for variable substitution

### Example Custom Template:

```toml
name = "my-project"
description = "My custom project template"
type = "custom"
version = "1.0.0"
author = "Your Name"

[metadata]
tags = ["custom", "example"]
team_size = 2
timeline = "4 weeks"

[variables.project_name]
type = "string"
default = "my-project"
required = true

[[tasks]]
id = "setup"
title = "Set up {{project_name}}"
priority = "high"
labels = ["setup"]
storyPoints = 3
```

## Template Inheritance

Templates can inherit from other templates using the `inherits` field:

```toml
inherits = ["api"]  # Inherits all tasks from the api template
```

This allows you to build upon existing templates and create specialized variations.

## Best Practices

1. **Use meaningful IDs**: Task IDs are used for dependencies
2. **Define clear phases**: Group related tasks into phases
3. **Set realistic estimates**: Consider team size and experience
4. **Include all necessary tasks**: Don't forget testing, documentation, and deployment
5. **Use variables**: Make templates reusable with variables
6. **Document dependencies**: Clearly define task dependencies for proper sequencing

## Contributing Templates

To contribute a new template:

1. Create a well-structured template following the patterns above
2. Test it thoroughly with different variable combinations
3. Include comprehensive documentation in the template
4. Submit a pull request with your template

## Template Directory Locations

Templates are loaded from these locations in order:
1. Local project: `.cc-templates/`
2. Package default: `~/.critical-claude/templates/`

You can override default templates by creating a local `.cc-templates` directory in your project.
# Creating Custom Task Templates in Critical Claude

Critical Claude supports custom task templates with user-defined fields, allowing you to create templates that match your specific workflow and requirements.

## Template Location

Custom templates should be placed in one of these directories:
- `.critical-claude/templates/<name>.toml`
- `.cc/templates/<name>.toml`

## Template Structure

Templates use TOML format and consist of several sections:

### 1. Metadata Section

```toml
[metadata]
name = "template-name"
displayName = "Human Readable Name"
description = "What this template does"
version = "1.0.0"
author = "Your Name"
tags = ["tag1", "tag2", "tag3"]
```

### 2. Custom Field Definitions

Define custom fields that tasks in this template can use:

```toml
[fields.FieldName]
type = "string"  # Types: string, text, number, boolean, array, select, date, url
required = true
description = "What this field represents"
example = "Example value"
default = "Default value"

# For select fields:
[fields.Priority]
type = "select"
options = ["low", "medium", "high", "critical"]
default = "medium"

# With validation:
[fields.TaskID]
type = "string"
validation = { pattern = "^TASK-[0-9]+$", minLength = 6, maxLength = 20 }
```

### 3. Variables Section

Define variables that can be customized when loading the template:

```toml
[variables]
project_name = "my-project"
team_size = 3
default_priority = "medium"
```

### 4. Phases Section

Organize tasks into phases:

```toml
[phases]
planning = "Planning & Analysis"
development = "Development"
testing = "Testing & QA"
deployment = "Deployment & Release"
```

### 5. Tasks Section

Define tasks organized by phase:

```toml
[[tasks.planning]]
title = "{{project_name}}-001: Requirements Analysis"
description = "Analyze and document requirements"
priority = "{{default_priority}}"
labels = ["requirements", "analysis"]
story_points = 5
estimated_hours = 8

# Dependencies reference other task titles
[[tasks.development]]
title = "{{project_name}}-002: Implementation"
dependencies = ["{{project_name}}-001: Requirements Analysis"]
```

## Complete Example: Development Task Template

Here's a complete example that includes custom fields for tracking problem statements, solutions, and acceptance criteria:

```toml
# Development Task Template with Custom Fields
[metadata]
name = "development-task"
displayName = "Development Task Template"
description = "Comprehensive task template with problem definition, solution spec, and acceptance criteria"
version = "1.0.0"
author = "Your Team"
tags = ["development", "engineering", "custom-fields"]

# Custom field definitions
[fields.ID]
type = "string"
required = true
description = "Unique task identifier"
example = "TASK-001"
validation = { pattern = "^[A-Z]+-[0-9]+$" }

[fields.Problem]
type = "text"
required = true
description = "Clear problem statement that this task solves"
example = "Users cannot reset their passwords"

[fields.Solution]
type = "text"
required = true
description = "Technical solution specification"
example = "Implement password reset flow with email verification"

[fields.AcceptanceCriteria]
type = "array"
required = true
description = "List of acceptance criteria"
example = ["User can request reset", "Email is sent", "Link expires after 24h"]

[fields.Risks]
type = "array"
required = false
description = "Potential risks or concerns"

[fields.EstimatedComplexity]
type = "select"
required = true
options = ["trivial", "simple", "medium", "complex", "very-complex"]
default = "medium"

# Variables
[variables]
project_prefix = "PROJ"
default_priority = "medium"

# Phases
[phases]
planning = "Planning & Design"
implementation = "Core Implementation"
testing = "Testing & Quality"

# Tasks
[[tasks.planning]]
title = "{{project_prefix}}-001: Define Requirements"
description = "Gather and document all requirements"
priority = "critical"
labels = ["planning", "requirements"]
story_points = 3
estimated_hours = 6

[[tasks.implementation]]
title = "{{project_prefix}}-002: Implement Core Feature"
description = "Main implementation task"
priority = "{{default_priority}}"
labels = ["feature", "core"]
story_points = 8
estimated_hours = 16
dependencies = ["{{project_prefix}}-001: Define Requirements"]
```

## Using Custom Templates

### List available templates:
```bash
cc task template list
```

### View template details:
```bash
cc task template show development-task
```

### Load a template with custom variables:
```bash
cc task template development-task --project_prefix=MYAPP --default_priority=high
```

## Custom Fields in Tasks

When tasks are created from templates with custom fields, they are stored in the task's `customFields` property. These fields will be displayed when viewing task details:

```bash
cc task view <task-id>
```

The custom fields will appear in a dedicated section:

```
📌 Custom Fields:
ID: MYAPP-001
Problem: Users cannot reset their passwords
Solution: Implement password reset flow with email verification
AcceptanceCriteria:
  • User can request password reset
  • Email is sent with reset link
  • Link expires after 24 hours
EstimatedComplexity: medium
```

## Best Practices

1. **Use meaningful field names** - Field names should clearly indicate their purpose
2. **Provide examples** - Help users understand what values are expected
3. **Use validation** - Add validation rules to ensure data quality
4. **Document fields** - Use the description property to explain each field
5. **Organize by phases** - Group related tasks into logical phases
6. **Use variables** - Make templates reusable with customizable variables

## Advanced Features

### Field Types

- **string**: Short text values
- **text**: Long text values (descriptions, specifications)
- **number**: Numeric values
- **boolean**: True/false values
- **array**: Lists of strings
- **select**: Predefined options
- **date**: Date values
- **url**: URL values

### Validation Options

- **pattern**: Regular expression pattern (for strings)
- **min/max**: Minimum/maximum values (for numbers)
- **minLength/maxLength**: Length constraints (for strings)

### Template Inheritance

Templates can extend other templates using the `extends` property in metadata:

```toml
[metadata]
extends = "base-template"
```

This allows you to build specialized templates on top of more general ones.
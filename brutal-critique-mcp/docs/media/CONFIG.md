# Brutal Critique MCP Configuration Guide

The Brutal Critique MCP system uses a TOML configuration file to control multipliers, thresholds, and behavior across all tools. This guide covers all configuration options and best practices for customization.

## Quick Start

To get started, copy the example config:

```bash
cp config.toml ~/.config/brutal-critique/config.toml
```

Or create a project-specific config in your repository root.

## Configuration File Location

The system searches for `config.toml` in these locations (in order):

1. Current working directory (`./config.toml`)
2. Parent directories (up to 5 levels up)
3. User config directory (`~/.config/brutal-critique/config.toml`)
4. Falls back to built-in defaults if no config file is found

### Configuration Priority

Settings are loaded hierarchically:
1. Built-in defaults (always present)
2. User config file (if found)
3. Project-specific config (if found)
4. Environment variables (if set)

Later sources override earlier ones, allowing for project-specific customization.

## Configuration Sections

### General Settings

```toml
[general]
log_level = "info"              # Log verbosity: error, warn, info, debug
max_files = 50000              # Max files to analyze in codebase
max_file_size_mb = 10          # Skip files larger than this
max_files_per_type = 1000      # Memory limit per file type
max_directory_depth = 20       # Max recursion depth
```

### Brutal Plan Configuration

The brutal plan system uses a three-tier multiplier approach:

1. **Base Multipliers** - Reality factors for different feature types
2. **Complexity Factors** - Additional multipliers for challenging conditions
3. **Efficiency Factors** - Reduction factors for favorable conditions

#### Phase Distribution

```toml
[brutal_plan.phases]
research_percent = 25          # Research and planning phase
implementation_percent = 60    # Core development phase
hardening_percent = 15         # Testing, security, polish phase
```

### Brutal Plan Multipliers

#### Base Multipliers

Control the reality factor for different feature types:

```toml
[brutal_plan.base_multipliers]
auth = 3.5          # Authentication always explodes in complexity
payment = 5.0       # Payment integration is never simple
search = 3.0        # Search has hidden complexity
upload = 4.0        # File uploads need security & scaling
integration = 4.0   # Third-party integrations are complex
data = 2.0          # Data processing features
api = 2.8           # API development
ui = 2.2            # User interface features
reporting = 3.5     # Reporting and analytics
mobile = 3.2        # Mobile-specific features
default = 2.5       # Default for unlisted features
```

#### Complexity Factors

Multiply base estimates when these conditions apply:

```toml
[brutal_plan.complexity_factors]
pci_compliance = 1.5         # Payment card compliance adds 50%
hipaa_compliance = 1.6       # Healthcare compliance adds 60%
legacy_integration = 2.0     # Legacy systems double complexity
first_time_tech = 1.4        # New technology adds 40%
multiple_apis = 1.3          # Multiple API integrations add 30%
distributed_system = 1.8     # Distributed systems add 80%
real_time_requirements = 1.6 # Real-time features add 60%
vague_requirements = 1.7     # Unclear requirements add 70%
changing_requirements = 1.5  # Changing requirements add 50%
custom_protocol = 1.4        # Custom protocols add 40%
```

#### Efficiency Factors

Reduce estimates when these conditions apply:

```toml
[brutal_plan.efficiency_factors]
existing_codebase = 0.9      # Can reuse code: 10% faster
experienced_team = 0.85      # Team knows the domain: 15% faster
prototype_quality = 0.7      # POC quality acceptable: 30% faster
proven_architecture = 0.8    # Known architecture: 20% faster
good_documentation = 0.9     # Well-documented code: 10% faster
automated_testing = 0.95     # Good test coverage: 5% faster
internal_only = 0.9          # Internal tools: 10% faster
simple_ui = 0.8              # Simple UI requirements: 20% faster
```

## Using Custom Multipliers

When using the `brutal_timeline` tool, you can apply these factors:

```javascript
{
  "requirement": "Build payment processing with Stripe",
  "estimatedDays": 5,
  "context": {
    // Specify feature type (uses base multiplier)
    "featureType": "payment",

    // Apply complexity factors
    "complexityFactors": ["pci_compliance", "multiple_apis"],

    // Apply efficiency factors
    "efficiencyFactors": ["experienced_team"],

    // Team experience level
    "teamExperience": "senior",

    // Whether building on existing code
    "hasExistingCode": true,

    // Or override with custom multiplier
    "customMultiplier": 6.5
  }
}
```

## Calculation Example

For a payment processing feature:

```
Base estimate: 5 days
Feature type: payment = 5.0x

Complexity factors:
- PCI compliance: × 1.5 = 7.5x
- Multiple APIs: × 1.3 = 9.75x

Efficiency factors:
- Experienced team: × 0.85 = 8.2875x

Final calculation: 5 days × 8.2875 = 41.4 days

Phase breakdown:
- Research (25%): 10.4 days
- Implementation (60%): 24.8 days
- Hardening (15%): 6.2 days
```

## Critique Configuration

### Severity Thresholds

Configure how strict the code review should be based on system type:

```toml
[critique.severity_thresholds]
security_weight = 0.3           # Security analysis weight (30%)
performance_weight = 0.25       # Performance analysis weight (25%)
architecture_weight = 0.2       # Architecture analysis weight (20%)
code_quality_weight = 0.15      # Code quality analysis weight (15%)
testing_weight = 0.1            # Testing analysis weight (10%)

[critique.patterns]
# Security patterns to detect
sql_injection_patterns = ["query(", "execute(", "prepare("]
xss_patterns = ["innerHTML", "outerHTML", "document.write"]
auth_bypass_patterns = ["admin", "role", "permission"]

# Performance patterns to detect
n_plus_one_patterns = ["for", "while", "forEach"]
memory_leak_patterns = ["setInterval", "setTimeout", "addEventListener"]
blocking_patterns = ["sync", "Sync", "readFileSync"]
```

### Architecture Analysis

Configure what patterns to detect and when to warn:

```toml
[architecture.patterns]
# Pattern detection indicators
mvc_indicators = ["controllers", "models", "views"]
ddd_indicators = ["domain", "services", "repositories"]
microservices_indicators = ["api-gateway", "service-", "docker-compose"]
layered_indicators = ["presentation", "business", "data"]

[architecture.anti_patterns]
# Size-based thresholds
small_app_microservices_threshold = 100  # Warn if <100 files use microservices
large_app_no_structure_threshold = 1000  # Warn if >1000 files lack structure
too_many_dependencies_threshold = 50     # Warn if >50 dependencies
god_class_line_threshold = 500           # Warn if class >500 lines
deep_nesting_threshold = 6               # Warn if nesting >6 levels

# Quality thresholds
test_coverage_threshold = 0.8            # Warn if <80% test coverage
cyclomatic_complexity_threshold = 10     # Warn if complexity >10
duplication_threshold = 0.1              # Warn if >10% code duplication
```

## Environment Variables

You can override config values using environment variables:

```bash
# Override log level
export BRUTAL_CRITIQUE_LOG_LEVEL=debug

# Override base multipliers
export BRUTAL_CRITIQUE_PAYMENT_MULTIPLIER=6.0

# Override complexity factors
export BRUTAL_CRITIQUE_PCI_COMPLIANCE_FACTOR=1.8
```

## Best Practices

1. **Start Conservative**: Begin with default multipliers and adjust based on your team's actual performance
2. **Track Actuals**: Compare estimates to reality and update multipliers accordingly
3. **Context Matters**: Use complexity/efficiency factors rather than overriding multipliers
4. **Team-Specific**: Different teams may need different multipliers - create team-specific configs
5. **Regular Reviews**: Review and update multipliers quarterly based on project data
6. **Version Control**: Keep your config.toml in version control to track changes
7. **Documentation**: Document why you changed multipliers for future reference

## Customization Tips

### For Different Organizations

- **Startups**: Increase `vague_requirements` and `changing_requirements` multipliers
- **Enterprises**: Increase compliance-related multipliers, reduce `prototype_quality` efficiency
- **Agencies**: Add client-specific complexity factors, increase `changing_requirements`
- **Open Source**: Reduce `internal_only` efficiency factor impact
- **Consulting**: Increase `first_time_tech` and `legacy_integration` multipliers

### For Different Technologies

- **Mobile Apps**: Increase `mobile` base multiplier, add device-specific complexity factors
- **Web Apps**: Focus on `ui` and `integration` multipliers
- **APIs**: Emphasize `api` and `integration` multipliers
- **Data Processing**: Increase `data` multiplier, add volume-based complexity factors
- **Machine Learning**: Add ML-specific complexity factors for data quality, model training

### For Different Team Sizes

- **Solo Developers**: Increase most multipliers (no peer review, single point of failure)
- **Small Teams (2-5)**: Standard multipliers work well
- **Large Teams (10+)**: Add coordination complexity factors
- **Distributed Teams**: Add communication complexity factors

## Validation

The configuration system validates:

- All multipliers are positive numbers
- Phase percentages sum to 100%
- Weights sum to 1.0
- File paths are valid and accessible
- Threshold values are within reasonable ranges

Invalid configurations will fall back to defaults with warnings logged.

## Migration

When upgrading, the config system:

1. Loads your existing config
2. Adds new default values for missing keys
3. Validates all values
4. Logs warnings for deprecated keys
5. Provides migration suggestions

Remember: These multipliers come from real project data across thousands of software projects. Trust them more than optimistic estimates!

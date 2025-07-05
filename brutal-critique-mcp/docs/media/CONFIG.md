# Brutal Critique MCP Configuration Guide

The Brutal Critique MCP system uses a TOML configuration file to control multipliers, thresholds, and behavior across all tools.

## Configuration File Location

The system looks for `config.toml` in these locations (in order):
1. Current working directory
2. Installation directory
3. `~/.brutal-critique/config.toml`

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

### Brutal Plan Multipliers

#### Base Multipliers
Control the reality factor for different feature types:

```toml
[brutal_plan.base_multipliers]
auth = 3.5          # Authentication always explodes in complexity
payment = 5.0       # Payment integration is never simple
search = 3.0        # Search has hidden complexity
upload = 4.0        # File uploads need security & scaling
# ... see config.toml for full list
```

#### Complexity Factors
Multiply base estimates when these conditions apply:

```toml
[brutal_plan.complexity_factors]
pci_compliance = 1.5       # Payment card compliance adds 50%
hipaa_compliance = 1.6     # Healthcare compliance adds 60%
legacy_integration = 1.5   # Legacy systems add 50%
first_time_tech = 1.4      # New technology adds 40%
# ... see config.toml for full list
```

#### Efficiency Factors
Reduce estimates when these conditions apply:

```toml
[brutal_plan.efficiency_factors]
existing_codebase = 0.8    # Can reuse code: 20% faster
experienced_team = 0.85    # Team knows the domain: 15% faster
prototype_quality = 0.7    # POC quality acceptable: 30% faster
# ... see config.toml for full list
```

## Using Custom Multipliers

When using the `brutal_timeline` tool, you can apply these factors:

```javascript
{
  "requirement": "Build payment processing with Stripe",
  "estimatedDays": 5,
  "context": {
    // Apply complexity factors
    "complexityFactors": ["pci_compliance", "multiple_apis"],
    
    // Apply efficiency factors
    "efficiencyFactors": ["experienced_team"],
    
    // Or override with custom multiplier
    "customMultiplier": 6.5
  }
}
```

## Calculation Example

Base: payment = 5.0x
+ PCI compliance: × 1.5 = 7.5x
+ Multiple APIs: × 1.3 = 9.75x
- Experienced team: × 0.85 = 8.2875x

Final timeline: 5 days × 8.2875 = 42 days

## Critique Severity Thresholds

Configure how strict the code review should be based on system type:

```toml
[critique.severity_thresholds.web_small]
security_threshold = "high"      # Small apps still need security
performance_threshold = "medium" # Performance matters less
over_engineering_alert = true    # Warn about unnecessary complexity

[critique.severity_thresholds.enterprise]
security_threshold = "critical"  # Enterprise needs maximum security
performance_threshold = "high"   # Performance always critical
over_engineering_alert = false   # Complex patterns often justified
```

## Architecture Patterns

Configure what patterns to detect:

```toml
[architecture.patterns]
mvc_indicators = ["controllers", "models", "views"]
ddd_indicators = ["domain", "services", "repositories"]
microservices_indicators = ["api-gateway", "service-", "docker-compose"]
```

## Anti-Pattern Thresholds

When to warn about architectural issues:

```toml
[architecture.anti_patterns]
small_app_microservices_threshold = 100  # Warn if <100 files use microservices
large_app_no_structure_threshold = 1000  # Warn if >1000 files lack structure
too_many_dependencies_threshold = 50     # Warn if >50 dependencies
```

## Best Practices

1. **Start Conservative**: Begin with default multipliers and adjust based on your team's actual performance
2. **Track Actuals**: Compare estimates to reality and update multipliers accordingly
3. **Context Matters**: Use complexity/efficiency factors rather than overriding multipliers
4. **Team-Specific**: Different teams may need different multipliers - create team-specific configs
5. **Regular Reviews**: Review and update multipliers quarterly based on project data

## Customization Tips

- **For Startups**: Increase `vague_requirements` and `changing_requirements` multipliers
- **For Enterprises**: Increase compliance-related multipliers
- **For Agencies**: Add client-specific complexity factors
- **For Open Source**: Reduce `internal_only` efficiency factor impact

Remember: These multipliers come from real project data. Trust them more than optimistic estimates!
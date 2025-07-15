# Critical Claude Migration - Task Breakdown

## Overview
This document contains the task breakdown for migrating brutal-critique to critical_claude with enhanced features. Tasks are structured following the backlog.md format and are designed to be atomic and independently implementable.

## Task Creation Commands

Execute these commands in order to create the full task backlog:

### Phase 1: Core Rename Tasks

```bash
# Task 1: Rename package and directory structure
backlog task create "Rename brutal-critique-mcp to critical-claude-mcp" \
  -d "Rename the core package and directory to establish the new critical_claude identity. This is the foundational change that all other tasks will build upon." \
  --ac "Directory renamed from brutal-critique-mcp to critical-claude-mcp,Package.json updated with new name and version,All file paths in settings updated,Build succeeds with new name,MCP server starts without errors" \
  -l rename,core,infrastructure

# Task 2: Update tool naming convention
backlog task create "Implement cc_module_action tool naming pattern" \
  -d "Update all tool names to follow the new cc_module_action pattern for better organization and consistency. This establishes the command structure foundation." \
  --ac "All tool names updated in index.ts,Tool handlers updated to match new names,ListToolsRequestSchema returns new tool names,CallToolRequestSchema handles new tool names,All tool calls work correctly" \
  -l tools,api,refactor

# Task 3: Update server metadata and branding
backlog task create "Update server metadata to Critical Claude" \
  -d "Update all server metadata, descriptions, and branding from brutal-critique to Critical Claude to complete the identity change." \
  --ac "Server name updated to Critical Claude MCP Server,Version bumped to 1.0.0,All descriptions updated to reflect new branding,Resource URIs updated to critical-claude scheme,No references to brutal-critique remain in user-facing text" \
  -l branding,metadata

# Task 4: Update configuration system paths
backlog task create "Update configuration paths for critical-claude" \
  -d "Update all configuration file paths and search locations to use critical-claude instead of brutal-critique for consistency." \
  --ac "Config search paths updated to use .critical-claude directory,Config loader looks for critical-claude paths,Default config paths updated,Config loading works with new paths,Backward compatibility maintained for existing configs" \
  -l config,infrastructure
```

### Phase 2: Web Search Integration Tasks

```bash
# Task 5: Create web search tool infrastructure
backlog task create "Implement WebSearchTool class with Exa integration" \
  -d "Create the foundational WebSearchTool class that will integrate with Exa MCP for grounding facts and searching for vulnerabilities. This tool will be used internally by other critique functions." \
  --ac "WebSearchTool class created in src/tools/web-search.ts,Exa client initialization implemented,Methods for searchForVulnerabilities implemented,Methods for verifyBestPractices implemented,Methods for checkLibraryIssues implemented,Error handling for API failures implemented" \
  -l websearch,integration,tools

# Task 6: Integrate web search with security analyzer
backlog task create "Enhance security analyzer with web search grounding" \
  -d "Integrate the WebSearchTool with the security analyzer to provide real-time vulnerability checking against CVE databases and security advisories." \
  --ac "Security analyzer imports WebSearchTool,Vulnerability patterns checked against web search,CVE database integration working,False positive rate reduced,Security findings include external references" \
  --dep task-5 \
  -l security,websearch,enhancement

# Task 7: Add web search configuration options
backlog task create "Add web search configuration to config.toml structure" \
  -d "Extend the configuration system to support web search settings including API keys, search depth, and feature toggles." \
  --ac "Config interface updated with web_search section,Exa API key configurable via environment variable,Search depth configurable,Feature toggle for web search implemented,Config validation includes web search settings" \
  --dep task-5 \
  -l config,websearch

# Task 8: Implement fact-checking for critique results
backlog task create "Add fact-checking layer to critique engine" \
  -d "Implement a fact-checking layer that uses web search to verify and ground the critique recommendations in current best practices." \
  --ac "Fact-checking method implemented in critique engine,Best practices verified via web search,Outdated recommendations flagged,Critique results include confidence scores,Performance impact minimal (< 2s added latency)" \
  --dep task-5,task-6 \
  -l critique,websearch,quality
```

### Phase 3: Project Initialization Tasks

```bash
# Task 9: Create project initialization wizard framework
backlog task create "Implement InitWizard class for project setup" \
  -d "Create the core InitWizard class that will handle interactive project initialization, including project detection and configuration generation." \
  --ac "InitWizard class created in src/tools/init-wizard.ts,Project type detection implemented,Interactive prompt system working,Configuration generation implemented,Error handling for edge cases" \
  -l init,wizard,tools

# Task 10: Implement project type detection
backlog task create "Add automatic project type detection" \
  -d "Implement logic to automatically detect project type based on files present (package.json, go.mod, etc.) and frameworks used." \
  --ac "Detection works for Node.js projects,Detection works for Python projects,Detection works for Go projects,Framework detection implemented (React Django Rails etc),Confidence score provided for detection" \
  --dep task-9 \
  -l init,detection,automation

# Task 11: Create configuration templates
backlog task create "Create project-specific config templates" \
  -d "Create configuration templates for different project types (web-app, cli-tool, library, enterprise) to provide sensible defaults during initialization." \
  --ac "Template created for web applications,Template created for CLI tools,Template created for libraries,Template created for enterprise apps,Templates use appropriate severity thresholds" \
  -l init,config,templates

# Task 12: Implement cc_init_project tool
backlog task create "Add cc_init_project tool to MCP server" \
  -d "Integrate the initialization wizard into the MCP server as a callable tool that can be invoked via 'cc init' command." \
  --ac "Tool registered in ListToolsRequestSchema,Tool handler implemented in CallToolRequestSchema,Tool accepts optional project name parameter,Tool returns success message with created files,Tool creates .critical-claude directory structure" \
  --dep task-9,task-10,task-11 \
  -l init,tools,integration

# Task 13: Generate Claude commands during init
backlog task create "Auto-generate .claude/commands during initialization" \
  -d "Automatically create useful Claude commands in .claude/commands/ directory based on the detected project type and configuration." \
  --ac "Commands directory created if not exists,critique.md command generated,plan-feature.md command generated,Commands use appropriate MCP tools,Commands include project context" \
  --dep task-9,task-12 \
  -l init,commands,automation
```

### Phase 4: Prompt Management Tasks

```bash
# Task 14: Create prompt template system
backlog task create "Implement prompt template management system" \
  -d "Create a structured system for managing prompt templates that can be selected based on context, severity, and project type." \
  --ac "PromptTemplate interface defined,PromptManager class implemented,Template storage structure created,Template selection logic implemented,Variable interpolation working" \
  -l prompts,architecture,internal

# Task 15: Create category-specific prompt templates
backlog task create "Create prompt templates for each critique category" \
  -d "Develop specific prompt templates for security, performance, architecture, and quality critiques to ensure consistent and high-quality analysis." \
  --ac "Security prompt templates created,Performance prompt templates created,Architecture prompt templates created,Quality prompt templates created,Templates follow consistent structure" \
  --dep task-14 \
  -l prompts,content,internal

# Task 16: Implement context-aware prompt selection
backlog task create "Add context-aware prompt selection logic" \
  -d "Implement logic to automatically select the most appropriate prompt template based on the current analysis context including language, framework, and project type." \
  --ac "Context detection implemented,Prompt selection based on language,Prompt selection based on framework,Prompt selection based on severity,Fallback prompts available" \
  --dep task-14,task-15 \
  -l prompts,logic,internal
```

### Phase 5: Documentation and Testing Tasks

```bash
# Task 17: Update all documentation for critical_claude
backlog task create "Update README and documentation for new branding" \
  -d "Comprehensively update all documentation to reflect the new critical_claude branding, command structure, and enhanced features." \
  --ac "README.md updated with new branding,All tool examples updated,Installation instructions updated,CONFIG.md updated,No brutal-critique references remain" \
  --dep task-1,task-2,task-3 \
  -l docs,branding

# Task 18: Create developer documentation for prompt system
backlog task create "Document prompt management system for developers" \
  -d "Create comprehensive documentation for MCP developers on how to use and extend the prompt management system." \
  --ac "Prompt system architecture documented,Template creation guide written,Context system explained,Examples provided,API reference complete" \
  --dep task-14,task-15,task-16 \
  -l docs,prompts,internal

# Task 19: Update and expand test suite
backlog task create "Update tests for new features and naming" \
  -d "Update all existing tests to use new tool names and add comprehensive tests for new features including web search and initialization." \
  --ac "All tests updated with new tool names,Web search functionality tested,Init wizard functionality tested,Prompt system tested,All tests passing" \
  --dep task-5,task-9,task-14 \
  -l tests,quality

# Task 20: Create integration tests for full workflow
backlog task create "Add end-to-end integration tests" \
  -d "Create integration tests that verify the complete workflow from initialization through critique with web search enhancement works correctly." \
  --ac "Init to critique workflow tested,Web search integration tested end-to-end,Configuration loading tested,Command generation tested,Performance benchmarks established" \
  --dep task-19 \
  -l tests,integration,quality
```

### Phase 6: Final Migration Tasks

```bash
# Task 21: Create migration script for existing users
backlog task create "Create automated migration script" \
  -d "Create a script that helps existing brutal-critique users migrate their configurations and settings to critical_claude smoothly." \
  --ac "Migration script created,Config files automatically converted,Backup of original configs created,Migration guide documented,Rollback option available" \
  --dep task-1,task-4 \
  -l migration,tooling,dx

# Task 22: Update CI/CD and build processes
backlog task create "Update build and deployment processes" \
  -d "Update all CI/CD pipelines, build scripts, and deployment processes to use the new critical_claude naming and structure." \
  --ac "Package.json scripts updated,GitHub Actions updated,Build artifacts use new name,NPM publishing configured,Version tagging updated" \
  --dep task-1 \
  -l ci,build,infrastructure

# Task 23: Create example projects with initialization
backlog task create "Create example projects demonstrating features" \
  -d "Create several example projects that demonstrate the initialization process and enhanced critique features for different project types." \
  --ac "Web app example created,CLI tool example created,Library example created,Each example includes config.toml,Each example includes .claude/commands" \
  --dep task-12,task-13 \
  -l examples,docs,dx

# Task 24: Final cleanup and release preparation
backlog task create "Perform final cleanup and prepare release" \
  -d "Perform final cleanup tasks including removing deprecated code, updating version numbers, and preparing release notes for critical_claude 1.0.0." \
  --ac "All deprecated code removed,Version numbers consistent,CHANGELOG.md updated,Release notes prepared,Git tags created" \
  --dep task-1,task-17,task-22 \
  -l release,cleanup
```

## Task Dependencies Visualization

```
Phase 1 (Core Rename):
├── Task 1: Rename package
├── Task 2: Update tool naming
├── Task 3: Update server metadata
└── Task 4: Update config paths

Phase 2 (Web Search):
├── Task 5: Create WebSearchTool
├── Task 6: Integrate with security (depends on 5)
├── Task 7: Add config options (depends on 5)
└── Task 8: Add fact-checking (depends on 5, 6)

Phase 3 (Init System):
├── Task 9: Create InitWizard
├── Task 10: Project detection (depends on 9)
├── Task 11: Config templates
├── Task 12: cc_init_project tool (depends on 9, 10, 11)
└── Task 13: Generate commands (depends on 9, 12)

Phase 4 (Prompts):
├── Task 14: Prompt template system
├── Task 15: Category templates (depends on 14)
└── Task 16: Context selection (depends on 14, 15)

Phase 5 (Docs/Tests):
├── Task 17: Update docs (depends on 1, 2, 3)
├── Task 18: Prompt docs (depends on 14, 15, 16)
├── Task 19: Update tests (depends on 5, 9, 14)
└── Task 20: Integration tests (depends on 19)

Phase 6 (Final):
├── Task 21: Migration script (depends on 1, 4)
├── Task 22: Update CI/CD (depends on 1)
├── Task 23: Examples (depends on 12, 13)
└── Task 24: Release prep (depends on 1, 17, 22)
```

## Implementation Notes

- Tasks are designed to be atomic and can be completed independently within their phase
- Each task represents approximately 2-8 hours of work
- Dependencies only reference previous tasks (lower IDs)
- All tasks include clear acceptance criteria that can be objectively verified
- The structure allows for parallel work within each phase
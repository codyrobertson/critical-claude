/**
 * Project Initializer for Critical Claude
 * Sets up complete project configuration with templates and best practices
 */

import fs from 'fs/promises';
import path from 'path';
import { logger } from '../logger.js';

export interface ProjectSetupOptions {
  projectType: 'web-app' | 'api' | 'cli' | 'library' | 'mobile-app' | 'desktop-app';
  framework?: string;
  language: 'javascript' | 'typescript' | 'python' | 'go' | 'rust' | 'java';
  includeTemplates: boolean;
  setupCI: boolean;
  setupTesting: boolean;
}

export interface ProjectSetupResult {
  success: boolean;
  filesCreated?: string[];
  templatesAdded?: boolean;
  templates?: string[];
  ciConfigured?: boolean;
  testingSetup?: boolean;
  errors?: string[];
}

export class ProjectInitializer {
  private config: any;

  constructor(config: any = {}) {
    this.config = config;
  }

  async setupProject(options: ProjectSetupOptions): Promise<ProjectSetupResult> {
    const errors: string[] = [];
    const filesCreated: string[] = [];
    const templates: string[] = [];
    
    try {
      logger.info('Setting up project', options);

      // Create Critical Claude configuration
      await this.createCriticalClaudeConfig(options);
      filesCreated.push('.critical-claude/config.json');

      // Create project-specific CLAUDE.md
      await this.createProjectClaudeMd(options);
      filesCreated.push('.claude/CLAUDE.md');

      // Set up templates if requested
      let templatesAdded = false;
      if (options.includeTemplates) {
        const templateFiles = await this.setupTemplates(options);
        templates.push(...templateFiles);
        filesCreated.push(...templateFiles);
        templatesAdded = templateFiles.length > 0;
      }

      // Set up CI/CD if requested
      let ciConfigured = false;
      if (options.setupCI) {
        const ciFiles = await this.setupCI(options);
        filesCreated.push(...ciFiles);
        ciConfigured = ciFiles.length > 0;
      }

      // Set up testing if requested
      let testingSetup = false;
      if (options.setupTesting) {
        const testFiles = await this.setupTesting(options);
        filesCreated.push(...testFiles);
        testingSetup = testFiles.length > 0;
      }

      // Create language-specific configuration
      const langFiles = await this.setupLanguageSpecific(options);
      filesCreated.push(...langFiles);

      logger.info('Project setup completed', { 
        filesCreated: filesCreated.length,
        templatesAdded,
        ciConfigured,
        testingSetup
      });

      return {
        success: true,
        filesCreated,
        templatesAdded,
        templates,
        ciConfigured,
        testingSetup
      };
    } catch (error) {
      logger.error('Project setup failed', error as Error);
      errors.push((error as Error).message);
      
      return {
        success: false,
        filesCreated,
        errors
      };
    }
  }

  private async createCriticalClaudeConfig(options: ProjectSetupOptions): Promise<void> {
    const configDir = '.critical-claude';
    await fs.mkdir(configDir, { recursive: true });

    const config = {
      version: '1.0.0',
      project: {
        name: path.basename(process.cwd()),
        type: options.projectType,
        language: options.language,
        framework: options.framework || 'none',
        setup_date: new Date().toISOString()
      },
      analysis: {
        security_focus: true,
        performance_monitoring: options.projectType !== 'library',
        architecture_review: true,
        code_quality_threshold: 'medium'
      },
      templates: {
        enabled: options.includeTemplates,
        type: options.projectType
      },
      ci_cd: {
        enabled: options.setupCI,
        platform: 'github-actions'
      },
      testing: {
        enabled: options.setupTesting,
        framework: this.getTestingFramework(options.language)
      },
      rules: this.getProjectTypeRules(options.projectType, options.language)
    };

    await fs.writeFile(
      path.join(configDir, 'config.json'),
      JSON.stringify(config, null, 2)
    );
  }

  private async createProjectClaudeMd(options: ProjectSetupOptions): Promise<void> {
    const claudeDir = '.claude';
    await fs.mkdir(claudeDir, { recursive: true });

    const projectName = path.basename(process.cwd());
    const content = this.generateProjectClaudeMd(projectName, options);

    await fs.writeFile(path.join(claudeDir, 'CLAUDE.md'), content);
  }

  private async setupTemplates(options: ProjectSetupOptions): Promise<string[]> {
    const templatesDir = '.critical-claude/templates';
    await fs.mkdir(templatesDir, { recursive: true });

    const templates: string[] = [];

    // Create project-specific templates
    switch (options.projectType) {
      case 'web-app':
        templates.push(...await this.createWebAppTemplates(templatesDir, options));
        break;
      case 'api':
        templates.push(...await this.createApiTemplates(templatesDir, options));
        break;
      case 'cli':
        templates.push(...await this.createCliTemplates(templatesDir, options));
        break;
      case 'library':
        templates.push(...await this.createLibraryTemplates(templatesDir, options));
        break;
      default:
        templates.push(...await this.createGenericTemplates(templatesDir, options));
    }

    return templates;
  }

  private async setupCI(options: ProjectSetupOptions): Promise<string[]> {
    const ciDir = '.github/workflows';
    await fs.mkdir(ciDir, { recursive: true });

    const files: string[] = [];

    // Create basic CI workflow
    const workflowContent = this.generateCIWorkflow(options);
    const workflowFile = path.join(ciDir, 'ci.yml');
    await fs.writeFile(workflowFile, workflowContent);
    files.push(workflowFile);

    // Create security workflow
    const securityWorkflow = this.generateSecurityWorkflow(options);
    const securityFile = path.join(ciDir, 'security.yml');
    await fs.writeFile(securityFile, securityWorkflow);
    files.push(securityFile);

    return files;
  }

  private async setupTesting(options: ProjectSetupOptions): Promise<string[]> {
    const files: string[] = [];

    switch (options.language) {
      case 'typescript':
      case 'javascript':
        files.push(...await this.setupJavaScriptTesting(options));
        break;
      case 'python':
        files.push(...await this.setupPythonTesting(options));
        break;
      case 'go':
        files.push(...await this.setupGoTesting(options));
        break;
      case 'rust':
        files.push(...await this.setupRustTesting(options));
        break;
      case 'java':
        files.push(...await this.setupJavaTesting(options));
        break;
    }

    return files;
  }

  private async setupLanguageSpecific(options: ProjectSetupOptions): Promise<string[]> {
    const files: string[] = [];

    switch (options.language) {
      case 'typescript':
        files.push(...await this.setupTypeScript(options));
        break;
      case 'python':
        files.push(...await this.setupPython(options));
        break;
      case 'go':
        files.push(...await this.setupGo(options));
        break;
      case 'rust':
        files.push(...await this.setupRust(options));
        break;
      case 'java':
        files.push(...await this.setupJava(options));
        break;
    }

    return files;
  }

  // Template creation methods
  private async createWebAppTemplates(templatesDir: string, options: ProjectSetupOptions): Promise<string[]> {
    const templates: string[] = [];

    if (options.language === 'typescript' || options.language === 'javascript') {
      // Create component template
      const componentTemplate = `import React from 'react';

interface {{ComponentName}}Props {
  // Define your props here
}

export const {{ComponentName}}: React.FC<{{ComponentName}}Props> = (props) => {
  return (
    <div>
      {/* Component implementation */}
    </div>
  );
};
`;
      const componentFile = path.join(templatesDir, 'component.tsx.template');
      await fs.writeFile(componentFile, componentTemplate);
      templates.push(componentFile);

      // Create hook template
      const hookTemplate = `import { useState, useEffect } from 'react';

export const use{{HookName}} = () => {
  const [state, setState] = useState();

  useEffect(() => {
    // Effect logic here
  }, []);

  return {
    state,
    setState
  };
};
`;
      const hookFile = path.join(templatesDir, 'hook.ts.template');
      await fs.writeFile(hookFile, hookTemplate);
      templates.push(hookFile);
    }

    return templates;
  }

  private async createApiTemplates(templatesDir: string, options: ProjectSetupOptions): Promise<string[]> {
    const templates: string[] = [];

    if (options.language === 'typescript' || options.language === 'javascript') {
      // Create endpoint template
      const endpointTemplate = `import { Request, Response } from 'express';

export const {{endpointName}} = async (req: Request, res: Response) => {
  try {
    // Validate input
    const { } = req.body;

    // Business logic here

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
`;
      const endpointFile = path.join(templatesDir, 'endpoint.ts.template');
      await fs.writeFile(endpointFile, endpointTemplate);
      templates.push(endpointFile);

      // Create middleware template
      const middlewareTemplate = `import { Request, Response, NextFunction } from 'express';

export const {{middlewareName}} = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Middleware logic here
    
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
`;
      const middlewareFile = path.join(templatesDir, 'middleware.ts.template');
      await fs.writeFile(middlewareFile, middlewareTemplate);
      templates.push(middlewareFile);
    }

    return templates;
  }

  private async createCliTemplates(templatesDir: string, options: ProjectSetupOptions): Promise<string[]> {
    const templates: string[] = [];

    // Create command template
    const commandTemplate = `export interface {{CommandName}}Options {
  // Define command options here
}

export const {{commandName}}Command = async (options: {{CommandName}}Options) => {
  try {
    // Command implementation here
    
    console.log('Command executed successfully');
  } catch (error) {
    console.error('Command failed:', error.message);
    process.exit(1);
  }
};
`;
    const commandFile = path.join(templatesDir, 'command.ts.template');
    await fs.writeFile(commandFile, commandTemplate);
    templates.push(commandFile);

    return templates;
  }

  private async createLibraryTemplates(templatesDir: string, options: ProjectSetupOptions): Promise<string[]> {
    const templates: string[] = [];

    // Create class template
    const classTemplate = `export interface {{ClassName}}Options {
  // Define options here
}

export class {{ClassName}} {
  private options: {{ClassName}}Options;

  constructor(options: {{ClassName}}Options) {
    this.options = options;
  }

  public async {{methodName}}(): Promise<void> {
    // Method implementation here
  }
}
`;
    const classFile = path.join(templatesDir, 'class.ts.template');
    await fs.writeFile(classFile, classTemplate);
    templates.push(classFile);

    return templates;
  }

  private async createGenericTemplates(templatesDir: string, options: ProjectSetupOptions): Promise<string[]> {
    const templates: string[] = [];

    // Create generic class template
    const genericTemplate = `// Generic template for ${options.projectType}
// Customize based on your specific needs
`;
    const genericFile = path.join(templatesDir, 'generic.template');
    await fs.writeFile(genericFile, genericTemplate);
    templates.push(genericFile);

    return templates;
  }

  // Language-specific setup methods
  private async setupTypeScript(options: ProjectSetupOptions): Promise<string[]> {
    const files: string[] = [];

    // Create tsconfig.json
    const tsConfig = {
      compilerOptions: {
        target: 'ES2020',
        lib: ['ES2020'],
        module: 'commonjs',
        declaration: true,
        outDir: './dist',
        rootDir: './src',
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true
      },
      include: ['src/**/*'],
      exclude: ['node_modules', 'dist']
    };

    await fs.writeFile('tsconfig.json', JSON.stringify(tsConfig, null, 2));
    files.push('tsconfig.json');

    return files;
  }

  private async setupJavaScriptTesting(options: ProjectSetupOptions): Promise<string[]> {
    const files: string[] = [];

    // Create Jest configuration
    const jestConfig = {
      preset: options.language === 'typescript' ? 'ts-jest' : undefined,
      testEnvironment: 'node',
      collectCoverage: true,
      coverageDirectory: 'coverage',
      coverageReporters: ['text', 'lcov', 'html']
    };

    await fs.writeFile('jest.config.json', JSON.stringify(jestConfig, null, 2));
    files.push('jest.config.json');

    return files;
  }

  private async setupPython(options: ProjectSetupOptions): Promise<string[]> {
    const files: string[] = [];

    // Create requirements.txt
    const requirements = `# Production dependencies
fastapi>=0.68.0
uvicorn>=0.15.0

# Development dependencies
pytest>=6.0.0
black>=21.0.0
flake8>=3.9.0
mypy>=0.910
`;

    await fs.writeFile('requirements.txt', requirements);
    files.push('requirements.txt');

    return files;
  }

  private async setupPythonTesting(options: ProjectSetupOptions): Promise<string[]> {
    const files: string[] = [];

    // Create pytest configuration
    const pytestConfig = `[tool:pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts = --verbose --cov=src --cov-report=html --cov-report=term
`;

    await fs.writeFile('pytest.ini', pytestConfig);
    files.push('pytest.ini');

    return files;
  }

  private async setupGo(options: ProjectSetupOptions): Promise<string[]> {
    const files: string[] = [];

    // Create go.mod
    const projectName = path.basename(process.cwd());
    const goMod = `module ${projectName}

go 1.19

require (
    // Add your dependencies here
)
`;

    await fs.writeFile('go.mod', goMod);
    files.push('go.mod');

    return files;
  }

  private async setupGoTesting(options: ProjectSetupOptions): Promise<string[]> {
    return []; // Go has built-in testing
  }

  private async setupRust(options: ProjectSetupOptions): Promise<string[]> {
    const files: string[] = [];

    // Create Cargo.toml
    const projectName = path.basename(process.cwd());
    const cargoToml = `[package]
name = "${projectName}"
version = "0.1.0"
edition = "2021"

[dependencies]
# Add your dependencies here

[dev-dependencies]
# Add your test dependencies here
`;

    await fs.writeFile('Cargo.toml', cargoToml);
    files.push('Cargo.toml');

    return files;
  }

  private async setupRustTesting(options: ProjectSetupOptions): Promise<string[]> {
    return []; // Rust has built-in testing
  }

  private async setupJava(options: ProjectSetupOptions): Promise<string[]> {
    const files: string[] = [];

    // Create build.gradle
    const buildGradle = `plugins {
    id 'java'
    id 'application'
}

repositories {
    mavenCentral()
}

dependencies {
    // Add your dependencies here
    testImplementation 'org.junit.jupiter:junit-jupiter:5.8.2'
}

test {
    useJUnitPlatform()
}

application {
    mainClass = 'Main'
}
`;

    await fs.writeFile('build.gradle', buildGradle);
    files.push('build.gradle');

    return files;
  }

  private async setupJavaTesting(options: ProjectSetupOptions): Promise<string[]> {
    return []; // Already configured in build.gradle
  }

  // Utility methods
  private getTestingFramework(language: string): string {
    switch (language) {
      case 'javascript':
      case 'typescript':
        return 'jest';
      case 'python':
        return 'pytest';
      case 'go':
        return 'go-test';
      case 'rust':
        return 'cargo-test';
      case 'java':
        return 'junit';
      default:
        return 'unknown';
    }
  }

  private getProjectTypeRules(projectType: string, language: string): any {
    return {
      security: {
        input_validation: projectType === 'api' || projectType === 'web-app',
        authentication: projectType === 'api' || projectType === 'web-app',
        authorization: projectType === 'api' || projectType === 'web-app'
      },
      performance: {
        async_operations: projectType !== 'cli',
        caching: projectType === 'api' || projectType === 'web-app',
        optimization: true
      },
      architecture: {
        separation_of_concerns: true,
        dependency_injection: projectType !== 'cli',
        error_handling: true
      }
    };
  }

  private generateProjectClaudeMd(projectName: string, options: ProjectSetupOptions): string {
    return `# Critical Claude Project Configuration - ${projectName}

## Project Context
- **Name**: ${projectName}
- **Type**: ${options.projectType}
- **Language**: ${options.language}
- **Framework**: ${options.framework || 'None'}

## Critical Claude Integration

This project is configured with Critical Claude for AI-powered code analysis and task management.

### Available MCP Tools

#### Code Analysis
- \`cc_crit_code\` - Critical code review and security analysis
- \`cc_crit_arch\` - Architecture review and recommendations
- \`cc_crit_explore\` - Codebase structure analysis

#### Project Management
- \`cc_task_manage\` - Task management and tracking
- \`cc_project_setup\` - Project configuration management

#### Planning Tools
- \`cc_plan_timeline\` - Project timeline generation
- \`cc_mvp_plan\` - MVP planning and feature prioritization

### Project-Specific Standards

#### Security Focus (${options.projectType})
${this.getSecurityFocus(options.projectType)}

#### Performance Requirements
${this.getPerformanceRequirements(options.projectType)}

#### Architecture Patterns
${this.getArchitecturePatterns(options.projectType, options.language)}

### Usage Examples

\`\`\`
Use cc_crit_code to analyze this ${options.language} function for security vulnerabilities:

[Your code here]
\`\`\`

\`\`\`
Use cc_task_create to add a new feature task:

Action: create
Title: "Implement user authentication"
Priority: high
\`\`\`

---

*Generated by Critical Claude Project Initializer*
`;
  }

  private getSecurityFocus(projectType: string): string {
    switch (projectType) {
      case 'api':
        return `- Input validation and sanitization
- Authentication and authorization
- Rate limiting and DDoS protection
- SQL injection prevention
- API security headers`;
      case 'web-app':
        return `- XSS prevention
- CSRF protection
- Content Security Policy
- Authentication flows
- Data encryption`;
      case 'cli':
        return `- Input validation
- File system security
- Command injection prevention
- Credential management`;
      default:
        return `- General security best practices
- Input validation
- Error handling security
- Dependency security`;
    }
  }

  private getPerformanceRequirements(projectType: string): string {
    switch (projectType) {
      case 'api':
        return `- Response time: < 200ms for standard endpoints
- Throughput: 1000+ requests/second
- Database query optimization
- Caching strategies`;
      case 'web-app':
        return `- Page load time: < 3 seconds
- Time to interactive: < 5 seconds
- Bundle size optimization
- Image optimization`;
      case 'cli':
        return `- Startup time: < 1 second
- Memory usage: < 100MB
- Command execution: < 5 seconds`;
      default:
        return `- Efficient algorithms
- Memory usage optimization
- Resource management`;
    }
  }

  private getArchitecturePatterns(projectType: string, language: string): string {
    const basePatterns = `- Single Responsibility Principle
- Dependency Injection
- Error handling standards
- Logging and monitoring`;

    switch (projectType) {
      case 'api':
        return `${basePatterns}
- RESTful design patterns
- Middleware architecture
- Repository pattern
- Service layer pattern`;
      case 'web-app':
        return `${basePatterns}
- Component-based architecture
- State management patterns
- Routing architecture
- Data flow patterns`;
      default:
        return basePatterns;
    }
  }

  private generateCIWorkflow(options: ProjectSetupOptions): string {
    return `name: CI

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup ${options.language}
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run tests
      run: npm test
      
    - name: Run Critical Claude analysis
      run: npx critical-claude crit explore .
`;
  }

  private generateSecurityWorkflow(options: ProjectSetupOptions): string {
    return `name: Security

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  security:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Run security analysis
      run: npx critical-claude crit code --security-focus
      
    - name: Dependency vulnerability scan
      run: npm audit
`;
  }
}
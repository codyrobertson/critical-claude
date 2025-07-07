/**
 * Project Initialization Wizard for Critical Claude
 * Helps users set up project-specific configuration and commands
 */

import fs from 'fs/promises';
import path from 'path';
import { logger } from '@critical-claude/core';
import toml from '@iarna/toml';

export type ProjectType = 
  | 'web-app' 
  | 'cli-tool' 
  | 'library' 
  | 'api-service'
  | 'enterprise-app'
  | 'microservice'
  | 'monorepo'
  | 'unknown';

export interface ProjectConfig {
  name: string;
  type: ProjectType;
  language: string;
  framework?: string;
  teamSize?: number;
  userCount?: number;
  performanceRequirements?: {
    responseTime?: string;
    concurrentUsers?: number;
  };
  securityRequirements?: {
    level: 'basic' | 'standard' | 'high' | 'critical';
    compliance?: string[];
  };
}

export interface InitOptions {
  projectName?: string;
  interactive?: boolean;
}

export class InitWizard {
  private projectRoot: string;
  
  constructor(projectRoot?: string) {
    this.projectRoot = projectRoot || process.cwd();
  }
  
  /**
   * Run the initialization wizard
   */
  async run(options?: InitOptions): Promise<void> {
    const projectName = options?.projectName || path.basename(this.projectRoot);
    
    logger.info('Starting project initialization', { 
      projectName, 
      root: this.projectRoot 
    });
    
    try {
      // Detect project type and characteristics
      const projectType = await this.detectProjectType();
      const language = await this.detectLanguage();
      const framework = await this.detectFramework(language);
      
      // Build configuration
      const config: ProjectConfig = {
        name: projectName,
        type: projectType,
        language,
        framework,
        // Default values - in real implementation, these would be gathered interactively
        teamSize: 1,
        userCount: projectType === 'enterprise-app' ? 10000 : 100,
        performanceRequirements: {
          responseTime: projectType === 'web-app' ? '200ms' : '1s',
          concurrentUsers: projectType === 'enterprise-app' ? 1000 : 100
        },
        securityRequirements: {
          level: projectType === 'enterprise-app' ? 'high' : 'standard',
          compliance: []
        }
      };
      
      // Create directories
      await this.createDirectoryStructure();
      
      // Generate configuration file
      await this.generateConfig(config);
      
      // Set up Claude commands
      await this.setupCommands(config);
      
      // Create CLAUDE.md
      await this.createClaudeMd(config);
      
      // Create project metadata
      await this.createProjectMetadata(config);
      
      logger.info('Project initialization complete', { projectName });
      
    } catch (error) {
      logger.error('Project initialization failed', error as Error);
      throw error;
    }
  }
  
  /**
   * Detect project type based on files present
   */
  async detectProjectType(): Promise<ProjectType> {
    try {
      const files = await fs.readdir(this.projectRoot);
      
      // Check for specific indicators
      if (files.includes('package.json')) {
        const packageJson = JSON.parse(
          await fs.readFile(path.join(this.projectRoot, 'package.json'), 'utf-8')
        );
        
        // CLI tool indicators
        if (packageJson.bin || packageJson.name?.includes('cli')) {
          return 'cli-tool';
        }
        
        // Library indicators
        if (packageJson.main && !packageJson.scripts?.start) {
          return 'library';
        }
        
        // Check dependencies for framework indicators
        const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
        
        if (deps.express || deps.fastify || deps.koa || deps.nestjs) {
          return 'api-service';
        }
        
        if (deps.react || deps.vue || deps.angular || deps.svelte) {
          return 'web-app';
        }
        
        if (deps.lerna || files.includes('lerna.json')) {
          return 'monorepo';
        }
      }
      
      // Python project
      if (files.includes('setup.py') || files.includes('pyproject.toml')) {
        if (files.includes('cli.py') || files.includes('__main__.py')) {
          return 'cli-tool';
        }
        
        if (files.includes('setup.py')) {
          return 'library';
        }
      }
      
      // Go project
      if (files.includes('go.mod')) {
        if (files.includes('main.go')) {
          const mainContent = await fs.readFile(
            path.join(this.projectRoot, 'main.go'), 
            'utf-8'
          );
          
          if (mainContent.includes('http.ListenAndServe')) {
            return 'api-service';
          }
          
          return 'cli-tool';
        }
      }
      
      // Docker/Kubernetes indicators
      if (files.includes('docker-compose.yml') || files.includes('k8s')) {
        return 'microservice';
      }
      
      // Large project indicators
      const fileCount = files.length;
      if (fileCount > 50 || files.includes('.gitlab-ci.yml') || files.includes('.github')) {
        return 'enterprise-app';
      }
      
      return 'unknown';
    } catch (error) {
      logger.warn('Failed to detect project type', error as Error);
      return 'unknown';
    }
  }
  
  /**
   * Detect primary programming language
   */
  async detectLanguage(): Promise<string> {
    try {
      const files = await fs.readdir(this.projectRoot);
      
      // Count file extensions
      const extensions: Record<string, number> = {};
      for (const file of files) {
        const ext = path.extname(file).toLowerCase();
        if (ext) {
          extensions[ext] = (extensions[ext] || 0) + 1;
        }
      }
      
      // Language mapping
      const langMap: Record<string, string> = {
        '.js': 'JavaScript',
        '.ts': 'TypeScript',
        '.py': 'Python',
        '.go': 'Go',
        '.java': 'Java',
        '.rs': 'Rust',
        '.rb': 'Ruby',
        '.php': 'PHP',
        '.cs': 'C#',
        '.cpp': 'C++',
        '.c': 'C',
        '.swift': 'Swift',
        '.kt': 'Kotlin'
      };
      
      // Find most common language extension
      let maxCount = 0;
      let detectedLang = 'Unknown';
      
      for (const [ext, count] of Object.entries(extensions)) {
        if (langMap[ext] && count > maxCount) {
          maxCount = count;
          detectedLang = langMap[ext];
        }
      }
      
      return detectedLang;
    } catch (error) {
      logger.warn('Failed to detect language', error as Error);
      return 'Unknown';
    }
  }
  
  /**
   * Detect framework based on language and dependencies
   */
  async detectFramework(language: string): Promise<string | undefined> {
    try {
      if (language === 'JavaScript' || language === 'TypeScript') {
        const packageJsonPath = path.join(this.projectRoot, 'package.json');
        if (await this.fileExists(packageJsonPath)) {
          const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
          const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
          
          if (deps.react) return 'React';
          if (deps.vue) return 'Vue';
          if (deps.angular) return 'Angular';
          if (deps.svelte) return 'Svelte';
          if (deps.express) return 'Express';
          if (deps.fastify) return 'Fastify';
          if (deps.nestjs) return 'NestJS';
          if (deps.next) return 'Next.js';
          if (deps.nuxt) return 'Nuxt';
        }
      }
      
      if (language === 'Python') {
        const files = await fs.readdir(this.projectRoot);
        
        if (files.includes('manage.py')) return 'Django';
        if (files.includes('app.py') || files.includes('application.py')) {
          try {
            const appContent = await fs.readFile(
              path.join(this.projectRoot, files.includes('app.py') ? 'app.py' : 'application.py'),
              'utf-8'
            );
            if (appContent.includes('flask') || appContent.includes('Flask')) return 'Flask';
            if (appContent.includes('fastapi') || appContent.includes('FastAPI')) return 'FastAPI';
          } catch {}
        }
      }
      
      if (language === 'Ruby') {
        const files = await fs.readdir(this.projectRoot);
        if (files.includes('Gemfile')) {
          const gemfile = await fs.readFile(path.join(this.projectRoot, 'Gemfile'), 'utf-8');
          if (gemfile.includes('rails')) return 'Rails';
          if (gemfile.includes('sinatra')) return 'Sinatra';
        }
      }
      
      return undefined;
    } catch (error) {
      logger.warn('Failed to detect framework', error as Error);
      return undefined;
    }
  }
  
  /**
   * Create necessary directory structure
   */
  private async createDirectoryStructure(): Promise<void> {
    const dirs = [
      '.critical-claude',
      '.claude/commands'
    ];
    
    for (const dir of dirs) {
      const fullPath = path.join(this.projectRoot, dir);
      await fs.mkdir(fullPath, { recursive: true });
    }
  }
  
  /**
   * Generate project-specific configuration
   */
  private async generateConfig(config: ProjectConfig): Promise<void> {
    const configPath = path.join(this.projectRoot, '.critical-claude', 'config.toml');
    
    const tomlConfig = {
      project: {
        name: config.name,
        type: config.type,
        language: config.language,
        framework: config.framework,
        team_size: config.teamSize,
        user_count: config.userCount,
        initialized_at: new Date().toISOString()
      },
      requirements: {
        security_level: config.securityRequirements?.level,
        performance_target: config.performanceRequirements?.responseTime,
        concurrent_users: config.performanceRequirements?.concurrentUsers
      },
      critique: {
        // Adjust thresholds based on project type
        severity_overrides: this.getSeverityOverrides(config.type)
      }
    };
    
    const tomlString = toml.stringify(tomlConfig as any);
    await fs.writeFile(configPath, tomlString, 'utf-8');
    
    logger.info('Generated project configuration', { path: configPath });
  }
  
  /**
   * Set up Claude commands for the project
   */
  private async setupCommands(config: ProjectConfig): Promise<void> {
    const commandsDir = path.join(this.projectRoot, '.claude', 'commands');
    
    // Critique command
    const critiqueCommand = `---
allowed-tools: mcp__critical-claude__cc_crit_code, mcp__critical-claude__cc_crit_arch
description: Run comprehensive critique on current changes
---

## Context
- Project: ${config.name}
- Type: ${config.type}
- Language: ${config.language}${config.framework ? `\n- Framework: ${config.framework}` : ''}
- Changed files: !\`git diff --name-only\`

## Your task
Run a comprehensive critical review on all changed files using:
1. Code critique for security and performance issues
2. Architecture review for design problems

Focus on ${config.type === 'enterprise-app' ? 'enterprise-grade reliability and security' : 'practical issues that affect real users'}.
`;
    
    await fs.writeFile(
      path.join(commandsDir, 'critique.md'),
      critiqueCommand,
      'utf-8'
    );
    
    // Plan feature command
    const planCommand = `---
allowed-tools: mcp__critical-claude__cc_plan_timeline
description: Plan a new feature with realistic timeline
---

## Context
- Project config: @.critical-claude/config.toml
- Team size: ${config.teamSize}
- Current user count: ${config.userCount}

## Your task
Create a realistic timeline for: $ARGUMENTS

Consider the ${config.type} architecture and ${config.language} ecosystem.
`;
    
    await fs.writeFile(
      path.join(commandsDir, 'plan-feature.md'),
      planCommand,
      'utf-8'
    );
    
    logger.info('Created Claude commands', { count: 2 });
  }
  
  /**
   * Create CLAUDE.md for project-specific instructions
   */
  private async createClaudeMd(config: ProjectConfig): Promise<void> {
    const claudeMdPath = path.join(this.projectRoot, '.claude', 'CLAUDE.md');
    
    const content = `# Project-Specific Critical Claude Configuration

## Project Context
- **Name**: ${config.name}
- **Type**: ${config.type}
- **Language**: ${config.language}${config.framework ? `\n- **Framework**: ${config.framework}` : ''}
- **Team Size**: ${config.teamSize}
- **User Count**: ${config.userCount}

## Critical Paths
${this.getCriticalPaths(config.type)}

## Security Requirements
- **Level**: ${config.securityRequirements?.level}
${config.securityRequirements?.compliance?.length ? `- **Compliance**: ${config.securityRequirements.compliance.join(', ')}` : ''}

## Performance Targets
- **Response Time**: ${config.performanceRequirements?.responseTime}
- **Concurrent Users**: ${config.performanceRequirements?.concurrentUsers}

## Project-Specific Standards

### Security Focus Areas
${this.getSecurityFocus(config.type)}

### Performance Requirements
${this.getPerformanceRequirements(config.type)}

### Architecture Patterns
${this.getArchitecturePatterns(config.type)}

## Custom Commands

- \`/project:critique\` - Run comprehensive code critique
- \`/project:plan-feature\` - Plan new feature with timeline

---

*This configuration extends the global Critical Claude system for project-specific needs.*
`;
    
    await fs.writeFile(claudeMdPath, content, 'utf-8');
    logger.info('Created CLAUDE.md');
  }
  
  /**
   * Create project metadata file
   */
  private async createProjectMetadata(config: ProjectConfig): Promise<void> {
    const metadataPath = path.join(this.projectRoot, '.critical-claude', 'project.json');
    
    await fs.writeFile(
      metadataPath,
      JSON.stringify(config, null, 2),
      'utf-8'
    );
    
    logger.info('Created project metadata');
  }
  
  /**
   * Helper to check if file exists
   */
  private async fileExists(path: string): Promise<boolean> {
    try {
      await fs.access(path);
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * Get severity overrides based on project type
   */
  private getSeverityOverrides(projectType: ProjectType): Record<string, string> {
    switch (projectType) {
      case 'enterprise-app':
        return {
          security_threshold: 'critical',
          performance_threshold: 'high'
        };
      case 'cli-tool':
        return {
          security_threshold: 'medium',
          performance_threshold: 'low'
        };
      case 'library':
        return {
          security_threshold: 'high',
          performance_threshold: 'medium'
        };
      default:
        return {
          security_threshold: 'high',
          performance_threshold: 'medium'
        };
    }
  }
  
  /**
   * Get critical paths based on project type
   */
  private getCriticalPaths(projectType: ProjectType): string {
    const paths: Record<ProjectType, string> = {
      'web-app': '- Authentication/authorization flows\n- Payment processing\n- User data handling\n- API endpoints',
      'cli-tool': '- File system operations\n- Command parsing\n- Error handling\n- Output formatting',
      'library': '- Public API surface\n- Error handling\n- Performance-critical paths\n- Security boundaries',
      'api-service': '- Authentication middleware\n- Rate limiting\n- Data validation\n- Database queries',
      'enterprise-app': '- Security boundaries\n- Transaction processing\n- Audit logging\n- Integration points',
      'microservice': '- Service boundaries\n- Message handling\n- Circuit breakers\n- Health checks',
      'monorepo': '- Package boundaries\n- Shared dependencies\n- Build pipeline\n- Cross-package APIs',
      'unknown': '- Core business logic\n- External integrations\n- Data processing\n- Error handling'
    };
    
    return paths[projectType];
  }
  
  /**
   * Get security focus areas based on project type
   */
  private getSecurityFocus(projectType: ProjectType): string {
    const focus: Record<ProjectType, string> = {
      'web-app': '- XSS prevention\n- CSRF protection\n- Authentication/authorization\n- Input validation',
      'cli-tool': '- Command injection\n- Path traversal\n- Permission handling\n- Secure defaults',
      'library': '- Input validation\n- Safe defaults\n- Security documentation\n- Vulnerability disclosure',
      'api-service': '- Authentication/authorization\n- Rate limiting\n- Input validation\n- SQL injection prevention',
      'enterprise-app': '- Role-based access control\n- Audit logging\n- Data encryption\n- Compliance requirements',
      'microservice': '- Service-to-service auth\n- API gateway security\n- Secret management\n- Network policies',
      'monorepo': '- Dependency security\n- Access control\n- Build security\n- Package isolation',
      'unknown': '- OWASP Top 10\n- Input validation\n- Authentication\n- Error handling'
    };
    
    return focus[projectType];
  }
  
  /**
   * Get performance requirements based on project type
   */
  private getPerformanceRequirements(projectType: ProjectType): string {
    const reqs: Record<ProjectType, string> = {
      'web-app': '- Page load time < 3s\n- Time to interactive < 5s\n- API response < 200ms\n- Smooth animations (60fps)',
      'cli-tool': '- Startup time < 100ms\n- Command execution < 1s\n- Memory usage < 100MB\n- Responsive output',
      'library': '- Minimal overhead\n- O(1) or O(log n) operations\n- Memory efficiency\n- Zero dependencies preferred',
      'api-service': '- Response time < 200ms\n- Concurrent requests > 1000\n- Database query < 50ms\n- Efficient caching',
      'enterprise-app': '- Response time < 500ms\n- 99.9% uptime\n- Handle 10k concurrent users\n- Horizontal scalability',
      'microservice': '- Response time < 100ms\n- Circuit breaker thresholds\n- Retry policies\n- Graceful degradation',
      'monorepo': '- Build time < 5 minutes\n- Test execution < 10 minutes\n- Incremental builds\n- Parallel execution',
      'unknown': '- Response time < 1s\n- Efficient algorithms\n- Resource optimization\n- Scalability planning'
    };
    
    return reqs[projectType];
  }
  
  /**
   * Get architecture patterns based on project type
   */
  private getArchitecturePatterns(projectType: ProjectType): string {
    const patterns: Record<ProjectType, string> = {
      'web-app': '- Component-based architecture\n- State management patterns\n- API integration layer\n- Progressive enhancement',
      'cli-tool': '- Command pattern\n- Plugin architecture\n- Configuration management\n- Output formatting',
      'library': '- Clean API design\n- Minimal dependencies\n- Extensibility points\n- Version compatibility',
      'api-service': '- RESTful design\n- Middleware architecture\n- Service layer pattern\n- Repository pattern',
      'enterprise-app': '- Domain-driven design\n- Event sourcing\n- CQRS pattern\n- Microservices architecture',
      'microservice': '- Service mesh\n- Event-driven architecture\n- Saga pattern\n- API gateway pattern',
      'monorepo': '- Package architecture\n- Shared libraries\n- Build orchestration\n- Dependency management',
      'unknown': '- Layered architecture\n- Dependency injection\n- Error handling\n- Logging strategy'
    };
    
    return patterns[projectType];
  }
}
#!/usr/bin/env node

/**
 * DDD Monorepo Restructuring Script
 * Migrates the current structure to Domain-Driven Design architecture
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.dirname(__dirname);

// DDD Structure Definition
const DDD_STRUCTURE = {
  // Domain Contexts (Business Logic)
  domains: {
    'task-management': {
      description: 'Core task operations, CRUD, business rules',
      currentSources: [
        'packages/critical-claude/src/core/unified-storage.ts',
        'packages/critical-claude/src/types/common-task.ts',
        'packages/critical-claude/src/commands/unified-task.ts'
      ]
    },
    'project-management': {
      description: 'Project isolation, switching, workspace management',
      currentSources: [
        'packages/critical-claude/src/core/project-detector.ts',
        // Project-specific storage logic from unified-storage
      ]
    },
    'research-intelligence': {
      description: 'Multi-agent research, AI analysis, knowledge extraction',
      currentSources: [
        'packages/critical-claude/src/services/research-service.ts',
        'packages/critical-claude/src/commands/research.ts',
        'packages/critical-claude/src/types/research.ts'
      ]
    },
    'template-system': {
      description: 'Task templates, code generation, project scaffolding',
      currentSources: [
        'packages/critical-claude/src/commands/template.ts',
        'packages/critical-claude/src/core/template-manager.ts'
      ]
    },
    'integration-layer': {
      description: 'External integrations: MCP, Claude Desktop, APIs',
      currentSources: [
        'packages/critical-claude/src/mcp-server.ts',
        'packages/critical-claude/src/core/critical-claude-client.ts',
        'packages/critical-claude/src/core/ai-service.ts'
      ]
    },
    'user-interface': {
      description: 'All user interaction: CLI, Web, Terminal UI',
      currentSources: [
        'packages/critical-claude/src/cli/',
        'packages/critical-claude/src/viewer/',
        'packages/critical-claude-web/'
      ]
    }
  },

  // Infrastructure & Shared
  infrastructure: {
    'shared-kernel': {
      description: 'Common types, interfaces, domain events',
      currentSources: [
        'packages/core/',
        'packages/critical-claude/src/types/'
      ]
    },
    'infrastructure': {
      description: 'Cross-cutting: storage, logging, config, monitoring',
      currentSources: [
        'packages/critical-claude/src/core/logger.ts',
        'packages/critical-claude/src/core/config.ts'
      ]
    }
  },

  // Application Services
  applications: {
    'cli-application': {
      description: 'CLI entry point and orchestration',
      currentSources: [
        'packages/critical-claude/src/cli/cc-main.ts',
        'bin/'
      ]
    },
    'web-application': {
      description: 'Web interface and API server',
      currentSources: [
        'packages/critical-claude-web/'
      ]
    }
  }
};

// Path Resolution Utilities
class PathResolver {
  static getDomainPath(domain) {
    return path.join(rootDir, 'domains', domain);
  }

  static getInfrastructurePath(component) {
    return path.join(rootDir, 'infrastructure', component);
  }

  static getApplicationPath(app) {
    return path.join(rootDir, 'applications', app);
  }

  static getSharedPath() {
    return path.join(rootDir, 'shared');
  }
}

// Main restructuring logic
async function restructureMonorepo() {
  console.log('🏗️  Starting DDD Monorepo Restructuring...\n');

  try {
    // 1. Create new directory structure
    await createDDDDirectories();
    
    // 2. Generate path resolution scripts
    await generatePathResolutionScripts();
    
    // 3. Create domain package.json files
    await createDomainPackageFiles();
    
    // 4. Generate TypeScript path mappings
    await generateTypeScriptConfig();
    
    // 5. Create dependency injection setup
    await createDependencyInjectionConfig();
    
    console.log('✅ DDD restructuring preparation complete!');
    console.log('\nNext steps:');
    console.log('1. Run: npm run migrate:domains');
    console.log('2. Run: npm run update:imports');
    console.log('3. Run: npm run build:all');
    
  } catch (error) {
    console.error('❌ Restructuring failed:', error);
    process.exit(1);
  }
}

async function createDDDDirectories() {
  console.log('📁 Creating DDD directory structure...');
  
  // Create domain directories
  for (const [domain, config] of Object.entries(DDD_STRUCTURE.domains)) {
    const domainPath = PathResolver.getDomainPath(domain);
    await fs.mkdir(path.join(domainPath, 'src', 'domain', 'entities'), { recursive: true });
    await fs.mkdir(path.join(domainPath, 'src', 'domain', 'value-objects'), { recursive: true });
    await fs.mkdir(path.join(domainPath, 'src', 'domain', 'services'), { recursive: true });
    await fs.mkdir(path.join(domainPath, 'src', 'domain', 'repositories'), { recursive: true });
    await fs.mkdir(path.join(domainPath, 'src', 'application', 'use-cases'), { recursive: true });
    await fs.mkdir(path.join(domainPath, 'src', 'application', 'services'), { recursive: true });
    await fs.mkdir(path.join(domainPath, 'src', 'infrastructure'), { recursive: true });
    await fs.mkdir(path.join(domainPath, 'tests'), { recursive: true });
    
    console.log(`  ✓ Created domain: ${domain}`);
  }
  
  // Create infrastructure directories
  for (const [component, config] of Object.entries(DDD_STRUCTURE.infrastructure)) {
    const infraPath = PathResolver.getInfrastructurePath(component);
    await fs.mkdir(path.join(infraPath, 'src'), { recursive: true });
    await fs.mkdir(path.join(infraPath, 'tests'), { recursive: true });
    
    console.log(`  ✓ Created infrastructure: ${component}`);
  }
  
  // Create application directories
  for (const [app, config] of Object.entries(DDD_STRUCTURE.applications)) {
    const appPath = PathResolver.getApplicationPath(app);
    await fs.mkdir(path.join(appPath, 'src'), { recursive: true });
    await fs.mkdir(path.join(appPath, 'dist'), { recursive: true });
    
    console.log(`  ✓ Created application: ${app}`);
  }
}

async function generatePathResolutionScripts() {
  console.log('🔧 Generating path resolution scripts...');
  
  // Domain path resolver
  const domainPathResolver = `
/**
 * Domain Path Resolver
 * Provides standardized path resolution for DDD domains
 */

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const rootDir = path.resolve(__filename, '../..');

export class DomainPathResolver {
  static getDomainRoot(domain: string): string {
    return path.join(rootDir, 'domains', domain);
  }
  
  static getDomainSrc(domain: string): string {
    return path.join(this.getDomainRoot(domain), 'src');
  }
  
  static getDomainDist(domain: string): string {
    return path.join(this.getDomainRoot(domain), 'dist');
  }
  
  static getEntity(domain: string, entity: string): string {
    return path.join(this.getDomainSrc(domain), 'domain', 'entities', entity);
  }
  
  static getUseCase(domain: string, useCase: string): string {
    return path.join(this.getDomainSrc(domain), 'application', 'use-cases', useCase);
  }
  
  static getRepository(domain: string, repo: string): string {
    return path.join(this.getDomainSrc(domain), 'domain', 'repositories', repo);
  }
  
  static getInfrastructure(component: string): string {
    return path.join(rootDir, 'infrastructure', component);
  }
  
  static getSharedKernel(): string {
    return path.join(rootDir, 'infrastructure', 'shared-kernel');
  }
}

// Domain registry for dependency injection
export const DOMAIN_REGISTRY = {
  ${Object.keys(DDD_STRUCTURE.domains).map(domain => 
    `'${domain}': '${domain}'`
  ).join(',\n  ')}
};

export const INFRASTRUCTURE_REGISTRY = {
  ${Object.keys(DDD_STRUCTURE.infrastructure).map(component => 
    `'${component}': '${component}'`
  ).join(',\n  ')}
};
`;

  await fs.writeFile(
    path.join(rootDir, 'shared', 'path-resolver.ts'),
    domainPathResolver
  );
  
  console.log('  ✓ Generated domain path resolver');
}

async function createDomainPackageFiles() {
  console.log('📦 Creating domain package.json files...');
  
  for (const [domain, config] of Object.entries(DDD_STRUCTURE.domains)) {
    const packageConfig = {
      name: `@critical-claude/${domain}`,
      version: "1.0.0",
      description: config.description,
      type: "module",
      main: "dist/index.js",
      types: "dist/index.d.ts",
      scripts: {
        build: "tsc",
        dev: "tsc --watch",
        test: "vitest run",
        "test:watch": "vitest",
        clean: "rm -rf dist",
        lint: "eslint src/**/*.ts",
        typecheck: "tsc --noEmit"
      },
      dependencies: {
        "@critical-claude/shared-kernel": "workspace:*"
      },
      devDependencies: {
        "@types/node": "^22.10.5",
        "typescript": "^5.7.3",
        "vitest": "^1.6.1",
        "eslint": "^8.57.0"
      }
    };
    
    const domainPath = PathResolver.getDomainPath(domain);
    await fs.writeFile(
      path.join(domainPath, 'package.json'),
      JSON.stringify(packageConfig, null, 2)
    );
    
    console.log(`  ✓ Created package.json for ${domain}`);
  }
}

async function generateTypeScriptConfig() {
  console.log('⚙️  Generating TypeScript configuration...');
  
  // Root tsconfig with path mappings
  const rootTsConfig = {
    files: [],
    references: [
      // Infrastructure first (dependencies)
      ...Object.keys(DDD_STRUCTURE.infrastructure).map(component => ({ 
        path: `./infrastructure/${component}` 
      })),
      // Domains (business logic)
      ...Object.keys(DDD_STRUCTURE.domains).map(domain => ({ 
        path: `./domains/${domain}` 
      })),
      // Applications last (dependents)
      ...Object.keys(DDD_STRUCTURE.applications).map(app => ({ 
        path: `./applications/${app}` 
      }))
    ],
    compilerOptions: {
      composite: true,
      baseUrl: ".",
      paths: {
        // Domain path mappings
        ...Object.fromEntries(
          Object.keys(DDD_STRUCTURE.domains).map(domain => [
            `@critical-claude/${domain}/*`,
            [`./domains/${domain}/src/*`]
          ])
        ),
        // Infrastructure path mappings
        ...Object.fromEntries(
          Object.keys(DDD_STRUCTURE.infrastructure).map(component => [
            `@critical-claude/${component}/*`,
            [`./infrastructure/${component}/src/*`]
          ])
        ),
        // Shared kernel
        "@critical-claude/shared/*": ["./shared/*"]
      }
    }
  };
  
  await fs.writeFile(
    path.join(rootDir, 'tsconfig.json'),
    JSON.stringify(rootTsConfig, null, 2)
  );
  
  console.log('  ✓ Generated root TypeScript configuration');
}

async function createDependencyInjectionConfig() {
  console.log('🔌 Creating dependency injection configuration...');
  
  const diConfig = `
/**
 * Dependency Injection Container
 * Central registry for DDD domain dependencies
 */

import { Container } from 'inversify';
import { DOMAIN_REGISTRY, INFRASTRUCTURE_REGISTRY } from './path-resolver.js';

// Dependency injection container
export const container = new Container();

// Domain service identifiers
export const TYPES = {
  // Task Management Domain
  TaskRepository: Symbol.for('TaskRepository'),
  TaskService: Symbol.for('TaskService'),
  CreateTaskUseCase: Symbol.for('CreateTaskUseCase'),
  
  // Project Management Domain
  ProjectRepository: Symbol.for('ProjectRepository'),
  ProjectService: Symbol.for('ProjectService'),
  SwitchProjectUseCase: Symbol.for('SwitchProjectUseCase'),
  
  // Research Intelligence Domain
  ResearchService: Symbol.for('ResearchService'),
  ResearchRepository: Symbol.for('ResearchRepository'),
  StartResearchUseCase: Symbol.for('StartResearchUseCase'),
  
  // Template System Domain
  TemplateRepository: Symbol.for('TemplateRepository'),
  TemplateService: Symbol.for('TemplateService'),
  LoadTemplateUseCase: Symbol.for('LoadTemplateUseCase'),
  
  // Integration Layer Domain
  MCPService: Symbol.for('MCPService'),
  AIService: Symbol.for('AIService'),
  
  // Infrastructure
  Logger: Symbol.for('Logger'),
  Config: Symbol.for('Config'),
  Storage: Symbol.for('Storage'),
  EventBus: Symbol.for('EventBus')
};

// Auto-binding helper
export function bindDomainServices() {
  // This will be populated during domain migration
  console.log('🔌 Binding domain services...');
}

// Domain event bus
export interface DomainEvent {
  aggregateId: string;
  eventType: string;
  occurredOn: Date;
  eventData: Record<string, any>;
}

export interface DomainEventBus {
  publish(event: DomainEvent): Promise<void>;
  subscribe(eventType: string, handler: (event: DomainEvent) => Promise<void>): void;
}
`;

  await fs.mkdir(path.join(rootDir, 'shared'), { recursive: true });
  await fs.writeFile(
    path.join(rootDir, 'shared', 'dependency-injection.ts'),
    diConfig
  );
  
  console.log('  ✓ Created dependency injection configuration');
}

// Execute restructuring
if (import.meta.url === `file://${__filename}`) {
  restructureMonorepo();
}

export { restructureMonorepo, PathResolver, DDD_STRUCTURE };
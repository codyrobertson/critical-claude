#!/usr/bin/env node

/**
 * Import Path Updater
 * Updates all import statements to use the new DDD structure
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'glob';
const { glob } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.dirname(__dirname);

// Import mapping rules
const IMPORT_MAPPINGS = {
  // Old package imports -> New DDD imports
  '@critical-claude/core': '@critical-claude/shared-kernel',
  '../core/unified-storage': '@critical-claude/task-management/TaskRepository',
  '../types/common-task': '@critical-claude/task-management/Task',
  '../services/research-service': '@critical-claude/research-intelligence/ResearchService',
  '../commands/template': '@critical-claude/template-system/LoadTemplateUseCase',
  '../mcp-server': '@critical-claude/integration-layer/MCPService',
  
  // Relative imports within domains
  './unified-task': '../application/use-cases/CreateTaskUseCase',
  './research': '../application/use-cases/StartResearchUseCase'
};

// File patterns to update
const FILE_PATTERNS = [
  'domains/**/*.ts',
  'infrastructure/**/*.ts', 
  'applications/**/*.ts',
  'shared/**/*.ts'
];

async function updateImports() {
  console.log('🔗 Starting import path updates...\n');

  try {
    // 1. Find all TypeScript files
    const files = await findTypescriptFiles();
    console.log(`📁 Found ${files.length} TypeScript files to process`);

    // 2. Update import statements
    await updateImportStatements(files);

    // 3. Generate barrel exports
    await generateBarrelExports();

    // 4. Update package.json files
    await updatePackageJsonFiles();

    console.log('\n✅ Import updates complete!');

  } catch (error) {
    console.error('❌ Import update failed:', error);
    process.exit(1);
  }
}

async function findTypescriptFiles() {
  const allFiles = [];
  
  for (const pattern of FILE_PATTERNS) {
    try {
      const files = await glob(pattern, { cwd: rootDir });
      if (Array.isArray(files)) {
        allFiles.push(...files.map(f => path.join(rootDir, f)));
      }
    } catch (error) {
      console.warn(`⚠️  Could not find files for pattern ${pattern}: ${error.message}`);
    }
  }
  
  return allFiles;
}

async function updateImportStatements(files) {
  console.log('🔄 Updating import statements...');
  let updatedCount = 0;

  for (const filePath of files) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      let updatedContent = content;
      let hasChanges = false;

      // Update each import mapping
      for (const [oldImport, newImport] of Object.entries(IMPORT_MAPPINGS)) {
        const oldPattern = new RegExp(
          `(import\\s+[^}]+from\\s+['"])(${oldImport.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')})(['"])`,
          'g'
        );
        
        const newContent = updatedContent.replace(oldPattern, `$1${newImport}$3`);
        if (newContent !== updatedContent) {
          updatedContent = newContent;
          hasChanges = true;
        }
      }

      // Update relative imports to use domain boundaries
      updatedContent = updateRelativeImports(updatedContent, filePath);
      if (updatedContent !== content) {
        hasChanges = true;
      }

      if (hasChanges) {
        await fs.writeFile(filePath, updatedContent);
        updatedCount++;
        console.log(`  ✓ Updated ${path.relative(rootDir, filePath)}`);
      }

    } catch (error) {
      console.warn(`  ⚠️  Failed to update ${filePath}: ${error.message}`);
    }
  }

  console.log(`  📊 Updated ${updatedCount} files`);
}

function updateRelativeImports(content, filePath) {
  // Determine which domain this file belongs to
  const relativePath = path.relative(rootDir, filePath);
  const pathParts = relativePath.split(path.sep);
  
  if (pathParts[0] === 'domains') {
    const currentDomain = pathParts[1];
    
    // Update imports to stay within domain boundaries
    content = content.replace(
      /import\s+([^}]+)\s+from\s+['"]\.\.\/\.\.\/([^'"]+)['"]/g,
      (match, imports, importPath) => {
        // Cross-domain import - convert to package import
        const targetDomain = determineDomainFromPath(importPath);
        if (targetDomain && targetDomain !== currentDomain) {
          return `import ${imports} from '@critical-claude/${targetDomain}/${importPath}'`;
        }
        return match;
      }
    );
  }
  
  return content;
}

function determineDomainFromPath(importPath) {
  // Map file paths to domains
  const domainMappings = {
    'task': 'task-management',
    'project': 'project-management',
    'research': 'research-intelligence',
    'template': 'template-system',
    'mcp': 'integration-layer',
    'cli': 'user-interface',
    'web': 'user-interface'
  };
  
  for (const [key, domain] of Object.entries(domainMappings)) {
    if (importPath.toLowerCase().includes(key)) {
      return domain;
    }
  }
  
  return null;
}

async function generateBarrelExports() {
  console.log('📦 Generating barrel exports...');

  // Generate domain index files
  const domains = ['task-management', 'project-management', 'research-intelligence', 
                  'template-system', 'integration-layer', 'user-interface'];

  for (const domain of domains) {
    const domainPath = path.join(rootDir, 'domains', domain);
    
    if (await directoryExists(domainPath)) {
      await generateDomainIndex(domain, domainPath);
      console.log(`  ✓ Generated index for ${domain}`);
    }
  }

  // Generate infrastructure index files
  const infrastructure = ['shared-kernel', 'infrastructure'];
  
  for (const component of infrastructure) {
    const componentPath = path.join(rootDir, 'infrastructure', component);
    
    if (await directoryExists(componentPath)) {
      await generateInfrastructureIndex(component, componentPath);
      console.log(`  ✓ Generated index for ${component}`);
    }
  }
}

async function generateDomainIndex(domain, domainPath) {
  const indexContent = `
/**
 * ${domain.replace('-', ' ').replace(/\\b\\w/g, l => l.toUpperCase())} Domain
 * Public API exports for the ${domain} domain
 */

// Domain Entities
export * from './src/domain/entities/index.js';

// Value Objects
export * from './src/domain/value-objects/index.js';

// Domain Services
export * from './src/domain/services/index.js';

// Repository Interfaces
export * from './src/domain/repositories/index.js';

// Use Cases (Application Services)
export * from './src/application/use-cases/index.js';

// Application Services
export * from './src/application/services/index.js';

// Infrastructure Adapters (only interfaces, not implementations)
export * from './src/infrastructure/index.js';
`;

  await fs.writeFile(path.join(domainPath, 'index.ts'), indexContent);

  // Generate sub-index files
  const subDirs = ['entities', 'value-objects', 'services', 'repositories'];
  
  for (const subDir of subDirs) {
    const subDirPath = path.join(domainPath, 'src', 'domain', subDir);
    if (await directoryExists(subDirPath)) {
      await generateSubIndex(subDirPath);
    }
  }
}

async function generateSubIndex(dirPath) {
  try {
    const files = await fs.readdir(dirPath);
    const tsFiles = files.filter(f => f.endsWith('.ts') && f !== 'index.ts');
    
    const exports = tsFiles.map(f => {
      const name = path.basename(f, '.ts');
      return `export * from './${name}.js';`;
    }).join('\\n');
    
    await fs.writeFile(path.join(dirPath, 'index.ts'), exports);
  } catch (error) {
    // Directory doesn't exist or is empty, skip
  }
}

async function generateInfrastructureIndex(component, componentPath) {
  const indexContent = `
/**
 * ${component.replace('-', ' ').replace(/\\b\\w/g, l => l.toUpperCase())}
 * Infrastructure component exports
 */

export * from './src/index.js';
`;

  await fs.writeFile(path.join(componentPath, 'index.ts'), indexContent);
}

async function updatePackageJsonFiles() {
  console.log('📋 Updating package.json dependencies...');

  // Update domain package.json files with proper dependencies
  const domains = await fs.readdir(path.join(rootDir, 'domains')).catch(() => []);
  
  for (const domain of domains) {
    const packagePath = path.join(rootDir, 'domains', domain, 'package.json');
    
    try {
      const packageContent = await fs.readFile(packagePath, 'utf-8');
      const packageData = JSON.parse(packageContent);
      
      // Add common dependencies
      packageData.dependencies = packageData.dependencies || {};
      packageData.dependencies['@critical-claude/shared-kernel'] = 'workspace:*';
      
      // Add domain-specific dependencies based on imports
      if (domain === 'task-management') {
        packageData.dependencies['@critical-claude/project-management'] = 'workspace:*';
      }
      
      if (domain === 'research-intelligence') {
        packageData.dependencies['@critical-claude/task-management'] = 'workspace:*';
        packageData.dependencies['@critical-claude/integration-layer'] = 'workspace:*';
      }
      
      await fs.writeFile(packagePath, JSON.stringify(packageData, null, 2));
      console.log(`  ✓ Updated ${domain} package.json`);
      
    } catch (error) {
      console.warn(`  ⚠️  Failed to update ${domain} package.json: ${error.message}`);
    }
  }
}

async function directoryExists(dirPath) {
  try {
    const stat = await fs.stat(dirPath);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

// Execute import updates
if (import.meta.url === `file://${__filename}`) {
  updateImports();
}

export { updateImports, IMPORT_MAPPINGS };
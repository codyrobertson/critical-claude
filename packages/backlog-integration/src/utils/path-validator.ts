/**
 * Path Validator - Detect directory/configuration mismatches
 * Prevents issues like UI reading from different .critical-claude directories
 */

import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

export interface PathValidationResult {
  isValid: boolean;
  warnings: string[];
  recommendations: string[];
  detectedPaths: string[];
}

export class PathValidator {
  
  /**
   * Detect multiple .critical-claude directories that could cause conflicts
   */
  static async detectCriticalClaudeDirectories(rootPath?: string): Promise<string[]> {
    const searchRoot = rootPath || process.cwd();
    const foundPaths: string[] = [];
    
    // Search up the directory tree for .critical-claude directories
    let currentDir = searchRoot;
    const maxDepth = 5; // Prevent infinite loops
    let depth = 0;
    
    while (depth < maxDepth && currentDir !== path.dirname(currentDir)) {
      const criticalClaudePath = path.join(currentDir, '.critical-claude');
      
      if (fs.existsSync(criticalClaudePath) && fs.statSync(criticalClaudePath).isDirectory()) {
        foundPaths.push(criticalClaudePath);
      }
      
      currentDir = path.dirname(currentDir);
      depth++;
    }
    
    return foundPaths;
  }
  
  /**
   * Validate that task operations will use the expected directory
   */
  static async validateTaskDirectory(): Promise<PathValidationResult> {
    const result: PathValidationResult = {
      isValid: true,
      warnings: [],
      recommendations: [],
      detectedPaths: []
    };
    
    try {
      // Find all .critical-claude directories
      const criticalClaudePaths = await this.detectCriticalClaudeDirectories();
      result.detectedPaths = criticalClaudePaths;
      
      if (criticalClaudePaths.length === 0) {
        result.warnings.push('No .critical-claude directories found');
        result.recommendations.push('Run task creation to initialize directory structure');
        return result;
      }
      
      if (criticalClaudePaths.length > 1) {
        result.isValid = false;
        result.warnings.push(`Found ${criticalClaudePaths.length} .critical-claude directories - this can cause confusion`);
        result.warnings.push('UI and CLI may read from different locations');
        
        // Determine which one is being used by current working directory
        const cwdPath = path.join(process.cwd(), '.critical-claude');
        const activePath = criticalClaudePaths.find(p => p === cwdPath) || criticalClaudePaths[0];
        
        result.recommendations.push(`Active directory: ${activePath}`);
        result.recommendations.push('Consider consolidating to single .critical-claude directory');
        result.recommendations.push('Or run commands from consistent directory location');
      }
      
      // Check if active directory has tasks
      const activePath = path.join(process.cwd(), '.critical-claude', 'tasks');
      if (fs.existsSync(activePath)) {
        const tasks = fs.readdirSync(activePath).filter(f => f.endsWith('.json'));
        if (tasks.length === 0) {
          result.warnings.push('Active tasks directory is empty');
          result.recommendations.push('Create some tasks or check if tasks exist in other locations');
        }
      }
      
    } catch (error) {
      result.isValid = false;
      result.warnings.push(`Path validation error: ${(error as Error).message}`);
    }
    
    return result;
  }
  
  /**
   * Display validation results with colors
   */
  static displayValidationResults(results: PathValidationResult): void {
    console.log(chalk.bold.yellow('\n🔍 Critical Claude Path Validation'));
    console.log(chalk.gray('════════════════════════════════════'));
    
    if (results.isValid) {
      console.log(chalk.green('✅ Path configuration looks good'));
    } else {
      console.log(chalk.red('⚠️  Path configuration issues detected'));
    }
    
    if (results.detectedPaths.length > 0) {
      console.log(chalk.blue('\n📁 Detected .critical-claude directories:'));
      results.detectedPaths.forEach(p => {
        const isActive = p === path.join(process.cwd(), '.critical-claude');
        const marker = isActive ? chalk.green('→ ACTIVE') : chalk.gray('  ');
        console.log(`   ${marker} ${p}`);
      });
    }
    
    if (results.warnings.length > 0) {
      console.log(chalk.yellow('\n⚠️  Warnings:'));
      results.warnings.forEach(w => console.log(`   • ${w}`));
    }
    
    if (results.recommendations.length > 0) {
      console.log(chalk.cyan('\n💡 Recommendations:'));
      results.recommendations.forEach(r => console.log(`   • ${r}`));
    }
    
    console.log('');
  }
  
  /**
   * Quick diagnostic command for troubleshooting
   */
  static async runDiagnostic(): Promise<void> {
    console.log(chalk.bold.cyan('🔧 Critical Claude Diagnostic'));
    console.log(chalk.gray('═══════════════════════════════'));
    
    // Basic info
    console.log(`Current directory: ${chalk.white(process.cwd())}`);
    console.log(`Node version: ${chalk.white(process.version)}`);
    
    // Path validation
    const validation = await this.validateTaskDirectory();
    this.displayValidationResults(validation);
    
    // Check for common files
    const commonPaths = [
      'packages/backlog-integration/dist/cli/cc-main.js',
      'package.json',
      '.critical-claude/config.json'
    ];
    
    console.log(chalk.blue('📄 File existence check:'));
    for (const filePath of commonPaths) {
      const exists = fs.existsSync(filePath);
      const status = exists ? chalk.green('✅') : chalk.red('❌');
      console.log(`   ${status} ${filePath}`);
    }
    
    console.log('');
  }
}

export default PathValidator;
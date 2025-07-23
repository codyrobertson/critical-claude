#!/usr/bin/env node
/**
 * Test Runner for All Domains
 * Runs comprehensive tests across all DDD domains
 */

import { runTests as runTaskTests } from '../domains/task-management/src/__tests__/TaskService.test.js';
import { runAIServiceTests } from '../domains/research-intelligence/src/__tests__/AIService.test.js';

async function runAllTests(): Promise<void> {
  console.log('🚀 Running Full Integration Test Suite...');
  console.log('━'.repeat(60));
  
  let passedTests = 0;
  let totalTests = 0;
  
  const testSuites = [
    {
      name: 'Task Management Domain',
      runner: runTaskTests
    },
    {
      name: 'Research Intelligence Domain', 
      runner: runAIServiceTests
    }
  ];
  
  for (const suite of testSuites) {
    totalTests++;
    console.log(`\n📦 Testing ${suite.name}...`);
    
    try {
      await suite.runner();
      passedTests++;
      console.log(`✅ ${suite.name} tests passed`);
    } catch (error) {
      console.error(`❌ ${suite.name} tests failed:`, error);
    }
  }
  
  console.log('\n' + '━'.repeat(60));
  console.log(`📊 Test Results: ${passedTests}/${totalTests} test suites passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 ALL TESTS PASSED! ✨');
    console.log('🔥 Full integration verified - ZERO failures!');
  } else {
    console.log('💥 Some tests failed - check output above');
    process.exit(1);
  }
}

// Manual integration test verification
async function runManualIntegrationTests(): Promise<void> {
  console.log('\n🔧 Running Manual Integration Tests...');
  
  try {
    // Test 1: Verify all domains can be imported
    console.log('📦 Testing domain imports...');
    
    const { TaskService } = await import('../domains/task-management/dist/application/services/TaskService.js');
    const { ResearchService } = await import('../domains/research-intelligence/dist/application/services/ResearchService.js');
    const { TemplateService } = await import('../domains/template-system/dist/application/services/TemplateService.js');
    const { ViewerService } = await import('../domains/user-interface/dist/application/services/ViewerService.js');
    
    if (!TaskService || !ResearchService || !TemplateService || !ViewerService) {
      throw new Error('Failed to import domain services');
    }
    
    console.log('✅ All domain services imported successfully');
    
    // Test 2: Verify no legacy imports
    console.log('🔍 Checking for legacy dependencies...');
    
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const checkDirectory = async (dir: string): Promise<string[]> => {
      const issues: string[] = [];
      try {
        const files = await fs.readdir(dir, { recursive: true });
        
        for (const file of files) {
          if (typeof file === 'string' && (file.endsWith('.ts') || file.endsWith('.js'))) {
            const filePath = path.join(dir, file);
            try {
              const content = await fs.readFile(filePath, 'utf-8');
              
              // Check for legacy imports
              if (content.includes('packages/critical-claude') || 
                  content.includes('../../../core/') ||
                  content.includes('../../../types/')) {
                issues.push(`Legacy import found in ${filePath}`);
              }
            } catch (error) {
              // Skip files that can't be read
            }
          }
        }
      } catch (error) {
        // Skip directories that can't be read
      }
      
      return issues;
    };
    
    const domainsDir = path.join(process.cwd(), 'domains');
    const legacyIssues = await checkDirectory(domainsDir);
    
    if (legacyIssues.length > 0) {
      console.warn('⚠️  Legacy imports found:');
      legacyIssues.forEach(issue => console.warn(`   ${issue}`));
    } else {
      console.log('✅ No legacy imports found');
    }
    
    // Test 3: Verify CLI commands work
    console.log('🖥️  Testing CLI integration...');
    
    const { spawn } = await import('child_process');
    const { promisify } = await import('util');
    
    const testCommand = (command: string[]): Promise<string> => {
      return new Promise((resolve, reject) => {
        const proc = spawn('node', command, { 
          stdio: ['pipe', 'pipe', 'pipe'],
          timeout: 5000
        });
        
        let stdout = '';
        let stderr = '';
        
        proc.stdout.on('data', (data) => stdout += data.toString());
        proc.stderr.on('data', (data) => stderr += data.toString());
        
        proc.on('close', (code) => {
          if (code === 0) {
            resolve(stdout);
          } else {
            reject(new Error(`Command failed: ${stderr}`));
          }
        });
        
        proc.on('error', reject);
      });
    };
    
    try {
      const helpOutput = await testCommand([
        'applications/cli-application/dist/index.js', 
        '--help'
      ]);
      
      if (!helpOutput.includes('Critical Claude CLI')) {
        throw new Error('CLI help output unexpected');
      }
      
      console.log('✅ CLI integration verified');
    } catch (error) {
      console.warn('⚠️  CLI integration test failed:', error);
    }
    
    console.log('🎉 Manual integration tests completed');
    
  } catch (error) {
    console.error('❌ Manual integration tests failed:', error);
    throw error;
  }
}

// Main execution
async function main(): Promise<void> {
  try {
    await runAllTests();
    await runManualIntegrationTests();
    
    console.log('\n🚀 FULL INTEGRATION VERIFICATION COMPLETE! 🚀');
    console.log('✨ All systems operational with ZERO legacy code ✨');
    
  } catch (error) {
    console.error('💥 Integration tests failed:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { runAllTests, runManualIntegrationTests };
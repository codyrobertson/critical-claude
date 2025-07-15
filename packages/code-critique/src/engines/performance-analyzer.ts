/**
 * Performance Analyzer
 * Identifies performance bottlenecks and scalability issues
 */

import { logger } from '@critical-claude/core';

export interface PerformanceIssue {
  type: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  location: {
    file: string;
    line: number;
  };
  description: string;
  impact: string;
  fix: string;
  complexity: 'simple' | 'moderate' | 'complex';
}

export class PerformanceAnalyzer {
  /**
   * Analyze code for performance issues
   */
  analyze(code: string, filename: string): PerformanceIssue[] {
    const issues: PerformanceIssue[] = [];

    // Check each performance pattern
    this.checkNestedLoops(code, filename, issues);
    this.checkSynchronousOperations(code, filename, issues);
    this.checkMemoryLeaks(code, filename, issues);
    this.checkIneffientAlgorithms(code, filename, issues);
    this.checkDatabaseQueries(code, filename, issues);
    this.checkCaching(code, filename, issues);

    return issues;
  }

  private checkNestedLoops(code: string, filename: string, issues: PerformanceIssue[]): void {
    // Find nested loops
    const lines = code.split('\n');
    let inLoop = false;
    let loopDepth = 0;
    let firstLoopLine = 0;

    lines.forEach((line, index) => {
      // Simple loop detection (could be improved)
      if (line.match(/\b(for|while)\s*\(/)) {
        if (loopDepth === 0) firstLoopLine = index + 1;
        loopDepth++;
        
        if (loopDepth > 1) {
          // Check if it's actually processing collections
          const contextStart = Math.max(0, index - 5);
          const contextEnd = Math.min(lines.length, index + 5);
          const context = lines.slice(contextStart, contextEnd).join('\n');
          
          if (context.match(/\b(array|list|items|users|data|records)\b/i)) {
            issues.push({
              type: 'Nested Loops',
              severity: 'HIGH',
              location: { file: filename, line: index + 1 },
              description: `Nested loop with depth ${loopDepth} processing collections`,
              impact: 'O(n²) or worse complexity - 1000 items = 1M operations',
              fix: 'Use Map/Set for O(1) lookups or optimize algorithm',
              complexity: 'moderate',
            });
          }
        }
      }
      
      // Simple closing detection
      if (line.includes('}') && loopDepth > 0) {
        loopDepth--;
      }
    });
  }

  private checkSynchronousOperations(code: string, filename: string, issues: PerformanceIssue[]): void {
    const syncPatterns = [
      { pattern: 'readFileSync', operation: 'file read' },
      { pattern: 'writeFileSync', operation: 'file write' },
      { pattern: 'execSync', operation: 'command execution' },
      { pattern: 'spawnSync', operation: 'process spawn' },
    ];

    syncPatterns.forEach(({ pattern, operation }) => {
      if (code.includes(pattern)) {
        const line = this.getLineNumber(code, pattern);
        issues.push({
          type: 'Blocking Operation',
          severity: 'HIGH',
          location: { file: filename, line },
          description: `Synchronous ${operation} blocks event loop`,
          impact: 'Server freezes during operation, all requests timeout',
          fix: `Use async version: ${pattern.replace('Sync', '')}`,
          complexity: 'simple',
        });
      }
    });
  }

  private checkMemoryLeaks(code: string, filename: string, issues: PerformanceIssue[]): void {
    // Event listeners without cleanup
    if (code.includes('addEventListener') && !code.includes('removeEventListener')) {
      issues.push({
        type: 'Memory Leak',
        severity: 'HIGH',
        location: { file: filename, line: this.getLineNumber(code, 'addEventListener') },
        description: 'Event listener without cleanup',
        impact: 'Memory grows over time, eventual crash',
        fix: 'Store listener reference and remove on cleanup',
        complexity: 'simple',
      });
    }

    // setInterval without clearInterval
    if (code.includes('setInterval') && !code.includes('clearInterval')) {
      issues.push({
        type: 'Memory Leak',
        severity: 'HIGH',
        location: { file: filename, line: this.getLineNumber(code, 'setInterval') },
        description: 'Interval without cleanup',
        impact: 'Runs forever, accumulates memory, CPU waste',
        fix: 'Store interval ID and clear on cleanup',
        complexity: 'simple',
      });
    }

    // Global variable accumulation
    const globalAssignments = code.match(/window\.\w+\s*=|global\.\w+\s*=/g) || [];
    if (globalAssignments.length > 3) {
      issues.push({
        type: 'Memory Leak Risk',
        severity: 'MEDIUM',
        location: { file: filename, line: 1 },
        description: `${globalAssignments.length} global assignments detected`,
        impact: 'Globals never garbage collected, memory grows',
        fix: 'Use module scope or proper state management',
        complexity: 'moderate',
      });
    }
  }

  private checkIneffientAlgorithms(code: string, filename: string, issues: PerformanceIssue[]): void {
    // Array operations in loops
    const arrayInLoopPattern = /for.*\{[^}]*\.(push|unshift|splice)\(/gs;
    if (arrayInLoopPattern.test(code)) {
      issues.push({
        type: 'Inefficient Algorithm',
        severity: 'MEDIUM',
        location: { file: filename, line: this.getLineNumber(code, '.push(') },
        description: 'Array mutations inside loop',
        impact: 'Repeated array resizing, O(n²) behavior',
        fix: 'Pre-allocate array or use functional approach',
        complexity: 'simple',
      });
    }

    // String concatenation in loops
    const stringConcatPattern = /for.*\{[^}]*\+=/gs;
    if (stringConcatPattern.test(code)) {
      const match = code.match(stringConcatPattern);
      if (match && match[0].includes('+=') && (match[0].includes('"') || match[0].includes("'"))) {
        issues.push({
          type: 'Inefficient String Building',
          severity: 'MEDIUM',
          location: { file: filename, line: this.getLineNumber(code, '+=') },
          description: 'String concatenation in loop',
          impact: 'Creates new string each iteration, O(n²) memory',
          fix: 'Use array.join() or template literals',
          complexity: 'simple',
        });
      }
    }

    // Multiple array iterations
    const mapCount = (code.match(/\.map\(/g) || []).length;
    const filterCount = (code.match(/\.filter\(/g) || []).length;
    const forEachCount = (code.match(/\.forEach\(/g) || []).length;
    
    if (mapCount + filterCount + forEachCount > 5) {
      issues.push({
        type: 'Multiple Iterations',
        severity: 'MEDIUM',
        location: { file: filename, line: 1 },
        description: 'Multiple array iterations detected',
        impact: 'Each iteration is O(n), combine for single pass',
        fix: 'Use reduce() or single loop for multiple operations',
        complexity: 'moderate',
      });
    }
  }

  private checkDatabaseQueries(code: string, filename: string, issues: PerformanceIssue[]): void {
    // N+1 query problem
    const queryInLoopPattern = /for.*\{[^}]*(query|find|select|fetch)/gsi;
    if (queryInLoopPattern.test(code)) {
      issues.push({
        type: 'N+1 Query Problem',
        severity: 'CRITICAL',
        location: { file: filename, line: this.getLineNumber(code, 'query') },
        description: 'Database query inside loop',
        impact: '100 items = 101 queries, database overload',
        fix: 'Use JOIN or batch fetch with IN clause',
        complexity: 'moderate',
      });
    }

    // Missing indexes
    if (code.includes('WHERE') && code.includes('ORDER BY')) {
      const whereMatch = code.match(/WHERE\s+(\w+)/i);
      if (whereMatch) {
        issues.push({
          type: 'Potential Missing Index',
          severity: 'MEDIUM',
          location: { file: filename, line: this.getLineNumber(code, 'WHERE') },
          description: 'Complex query without index hint',
          impact: 'Full table scan on large datasets',
          fix: 'Ensure indexes on WHERE and ORDER BY columns',
          complexity: 'simple',
        });
      }
    }

    // SELECT * usage
    if (code.match(/SELECT\s+\*/i)) {
      issues.push({
        type: 'Inefficient Query',
        severity: 'LOW',
        location: { file: filename, line: this.getLineNumber(code, 'SELECT') },
        description: 'SELECT * fetches unnecessary data',
        impact: 'Network overhead, memory waste',
        fix: 'Select only required columns',
        complexity: 'simple',
      });
    }
  }

  private checkCaching(code: string, filename: string, issues: PerformanceIssue[]): void {
    // API calls without caching
    const apiCallPatterns = ['fetch(', 'axios.', 'http.get', '$.ajax'];
    const hasCaching = code.includes('cache') || code.includes('Cache') || code.includes('memoize');
    
    const hasApiCalls = apiCallPatterns.some(pattern => code.includes(pattern));
    
    if (hasApiCalls && !hasCaching) {
      issues.push({
        type: 'Missing Cache',
        severity: 'MEDIUM',
        location: { file: filename, line: this.getLineNumber(code, apiCallPatterns.find(p => code.includes(p)) || 'fetch(') },
        description: 'API calls without caching strategy',
        impact: 'Repeated expensive calls, poor performance',
        fix: 'Implement caching layer (Redis, in-memory, HTTP cache)',
        complexity: 'moderate',
      });
    }

    // Expensive computations without memoization
    const complexPatterns = ['Math.pow', 'factorial', 'fibonacci', 'prime', 'sort('];
    const hasComplexComputation = complexPatterns.some(pattern => code.includes(pattern));
    
    if (hasComplexComputation && !code.includes('memo')) {
      issues.push({
        type: 'Missing Memoization',
        severity: 'MEDIUM',
        location: { file: filename, line: 1 },
        description: 'Complex computation without memoization',
        impact: 'Repeated expensive calculations',
        fix: 'Use memoization for pure functions',
        complexity: 'simple',
      });
    }
  }

  private getLineNumber(code: string, search: string): number {
    const index = code.indexOf(search);
    if (index === -1) return 1;
    return code.substring(0, index).split('\n').length;
  }
}
/**
 * Architecture Analyzer
 * Analyzes code architecture and identifies anti-patterns based on context
 */

import { logger } from './logger.js';

export interface ArchitectureContext {
  teamSize?: number;
  userCount?: number;
  currentProblems?: string[];
}

export interface ArchitectureIssue {
  pattern: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  impact: string;
  recommendation: string;
}

export class ArchitectureAnalyzer {
  /**
   * Analyze architecture based on problem size
   */
  analyzeArchitecture(
    code: string,
    filename: string,
    context: ArchitectureContext
  ): {
    issues: ArchitectureIssue[];
    overEngineering: string[];
    goodPatterns: string[];
  } {
    const issues: ArchitectureIssue[] = [];
    const overEngineering: string[] = [];
    const goodPatterns: string[] = [];

    // Estimate system size
    const systemSize = this.estimateSystemSize(code, context);

    // Check for over-engineering
    if (systemSize === 'small') {
      this.checkSmallSystemOverEngineering(code, overEngineering);
    }

    // Check for under-engineering
    if (systemSize === 'large') {
      this.checkLargeSystemUnderEngineering(code, issues);
    }

    // Pattern detection
    this.detectArchitecturalPatterns(code, systemSize, issues, goodPatterns);

    // Anti-pattern detection
    this.detectAntiPatterns(code, filename, issues);

    return { issues, overEngineering, goodPatterns };
  }

  private estimateSystemSize(
    code: string,
    context: ArchitectureContext
  ): 'small' | 'medium' | 'large' {
    const userCount = context.userCount || 0;
    const teamSize = context.teamSize || 1;
    const codeLines = code.split('\n').length;

    if (userCount > 10000 || teamSize > 10 || codeLines > 5000) {
      return 'large';
    }
    if (userCount > 1000 || teamSize > 3 || codeLines > 1000) {
      return 'medium';
    }
    return 'small';
  }

  private checkSmallSystemOverEngineering(code: string, overEngineering: string[]): void {
    // Microservices for small apps
    if (code.includes('microservice') || code.includes('kafka') || code.includes('rabbitmq')) {
      overEngineering.push(
        'Microservices detected for small app - Each service adds 40hrs of overhead'
      );
    }

    // Enterprise patterns
    if (code.includes('AbstractFactory') || code.includes('interface I')) {
      overEngineering.push(
        'Enterprise patterns in small app - YAGNI (You Ain\'t Gonna Need It)'
      );
    }

    // GraphQL for simple CRUD
    if (code.includes('GraphQL') && !code.includes('subscription')) {
      const queryCount = (code.match(/type Query/g) || []).length;
      if (queryCount < 10) {
        overEngineering.push(
          'GraphQL for simple CRUD - REST would be 10x faster to implement'
        );
      }
    }

    // Kubernetes for small apps
    if (code.includes('kubernetes') || code.includes('k8s')) {
      overEngineering.push(
        'Kubernetes for <1000 users - A $20 VPS would work fine'
      );
    }

    // Too many layers
    const layerIndicators = [
      'Controller',
      'Service',
      'Repository',
      'Mapper',
      'Dto',
      'Entity'
    ];
    const layerCount = layerIndicators.filter(layer => 
      code.includes(layer) || code.includes(layer.toLowerCase())
    ).length;
    
    if (layerCount > 3) {
      overEngineering.push(
        `${layerCount} layers of abstraction - This isn't enterprise Java`
      );
    }
  }

  private checkLargeSystemUnderEngineering(code: string, issues: ArchitectureIssue[]): void {
    // No clear architecture
    const hasArchitecture = 
      code.includes('Controller') ||
      code.includes('Service') ||
      code.includes('model') ||
      code.includes('routes');

    if (!hasArchitecture) {
      issues.push({
        pattern: 'No Architecture',
        severity: 'HIGH',
        description: 'Large system with no clear architectural pattern',
        impact: 'Spaghetti code, impossible to maintain with team > 3',
        recommendation: 'Adopt MVC, Clean Architecture, or similar pattern',
      });
    }

    // No dependency injection
    if (!code.includes('inject') && !code.includes('provider') && !code.includes('container')) {
      issues.push({
        pattern: 'No Dependency Injection',
        severity: 'MEDIUM',
        description: 'Large system without DI - testing will be hell',
        impact: 'Tightly coupled code, hard to test, hard to change',
        recommendation: 'Use a DI container or at least constructor injection',
      });
    }
  }

  private detectArchitecturalPatterns(
    code: string,
    systemSize: 'small' | 'medium' | 'large',
    issues: ArchitectureIssue[],
    goodPatterns: string[]
  ): void {
    // God objects
    const classRegex = /class\s+(\w+)/g;
    let match;
    while ((match = classRegex.exec(code)) !== null) {
      const className = match[1];
      const classStart = match.index;
      
      // Find class end
      let braceCount = 0;
      let i = code.indexOf('{', classStart);
      let classEnd = i;
      
      if (i !== -1) {
        braceCount = 1;
        i++;
        while (i < code.length && braceCount > 0) {
          if (code[i] === '{') braceCount++;
          else if (code[i] === '}') {
            braceCount--;
            if (braceCount === 0) classEnd = i;
          }
          i++;
        }
        
        const classContent = code.substring(classStart, classEnd);
        const methodCount = (classContent.match(/\b(public|private|protected)?\s*(async\s+)?(\w+)\s*\(/g) || []).length;
        
        if (methodCount > 20) {
          issues.push({
            pattern: 'God Object',
            severity: 'HIGH',
            description: `Class ${className} has ${methodCount} methods`,
            impact: 'Violates SRP, impossible to understand, high coupling',
            recommendation: 'Split into focused classes with single responsibilities',
          });
        }
      }
    }

    // Good patterns detection
    if (code.includes('async') && code.includes('await')) {
      goodPatterns.push('Async/await for clean asynchronous code');
    }

    if (code.includes('interface') || code.includes('implements')) {
      goodPatterns.push('Interface-based design for flexibility');
    }

    if (code.includes('.map(') && code.includes('.filter(') && code.includes('.reduce(')) {
      goodPatterns.push('Functional programming patterns for data transformation');
    }
  }

  private detectAntiPatterns(
    code: string,
    filename: string,
    issues: ArchitectureIssue[]
  ): void {
    // Anemic domain model
    const getterMatches = code.match(/get\w+\(\)/g);
    if (code.includes('class') && getterMatches && getterMatches.length > 10) {
      const setterCount = (code.match(/set\w+\(/g) || []).length;
      const businessLogicCount = (code.match(/\b(calculate|validate|process|handle)\w+/g) || []).length;
      
      if (setterCount > 5 && businessLogicCount < 2) {
        issues.push({
          pattern: 'Anemic Domain Model',
          severity: 'MEDIUM',
          description: 'Classes with only getters/setters, no business logic',
          impact: 'Logic scattered everywhere, no encapsulation',
          recommendation: 'Move business logic into domain objects',
        });
      }
    }

    // Copy-paste code
    const functionBodies: string[] = [];
    const funcRegex = /function\s+\w+\s*\([^)]*\)\s*{([^}]+)}/g;
    let funcMatch;
    
    while ((funcMatch = funcRegex.exec(code)) !== null) {
      const body = funcMatch[1].trim();
      if (body.length > 50) {
        functionBodies.push(body);
      }
    }
    
    // Check for similar function bodies
    for (let i = 0; i < functionBodies.length; i++) {
      for (let j = i + 1; j < functionBodies.length; j++) {
        const similarity = this.calculateSimilarity(functionBodies[i], functionBodies[j]);
        if (similarity > 0.8) {
          issues.push({
            pattern: 'Code Duplication',
            severity: 'MEDIUM',
            description: 'Similar code detected in multiple functions',
            impact: 'Maintenance nightmare, bugs need fixing in multiple places',
            recommendation: 'Extract common logic into shared functions',
          });
          break;
        }
      }
    }
  }

  private calculateSimilarity(str1: string, str2: string): number {
    // Simple similarity calculation (could be improved)
    const set1 = new Set(str1.split(/\s+/));
    const set2 = new Set(str2.split(/\s+/));
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    return intersection.size / union.size;
  }
}
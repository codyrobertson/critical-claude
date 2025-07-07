/**
 * Smart Security Analyzer that avoids false positives
 * Understands context like comments, strings, and example code
 */

import { logger } from '@critical-claude/core';

// Define types locally since they're specific to this service
export interface CodeIssue {
  type: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  location: { file: string; lines: number[] };
  critical_feedback: string;
  actual_impact: string;
  fix?: {
    description: string;
    working_code: string;
    complexity: 'simple' | 'moderate' | 'complex';
    roi: 'high' | 'medium' | 'low';
  };
}

export interface SecurityFinding {
  type: string;
  severity: string;
  description: string;
  vulnerability: string;
  cve?: string;
  source?: string;
}

// Simplified WebSearchTool interface for this service
export interface WebSearchTool {
  searchForVulnerabilities(code: string, context: string): Promise<SecurityFinding[]>;
  verifyBestPractices(pattern: string, language: string): Promise<BestPractice[]>;
  checkLibraryIssues(dependencies: string[]): Promise<LibraryIssue[]>;
}

export interface BestPractice {
  practice: string;
  recommendation: string;
  confidence: string;
  source?: string;
  lastUpdated?: string;
}

export interface LibraryIssue {
  library: string;
  vulnerability: string;
  severity: string;
  cve?: string;
  fixVersion?: string;
  advisory?: string;
  issues: string[];
  alternatives?: string[];
}

export class SecurityAnalyzer {
  private webSearchTool: WebSearchTool;
  
  constructor(webSearchTool?: WebSearchTool) {
    this.webSearchTool = webSearchTool || {
      searchForVulnerabilities: async () => [],
      verifyBestPractices: async () => [],
      checkLibraryIssues: async () => []
    };
  }
  /**
   * Check if a code snippet is within a comment or string literal
   */
  private isInCommentOrString(code: string, position: number): boolean {
    // Simple heuristic - check if we're inside a comment
    const lineStart = code.lastIndexOf('\n', position) + 1;
    const lineEnd = code.indexOf('\n', position);
    const line = code.substring(lineStart, lineEnd === -1 ? code.length : lineEnd);
    
    // Check for single-line comments
    if (line.includes('//') && line.indexOf('//') < position - lineStart) {
      return true;
    }
    
    // Check for multi-line comments
    const lastCommentStart = code.lastIndexOf('/*', position);
    const lastCommentEnd = code.lastIndexOf('*/', position);
    if (lastCommentStart > lastCommentEnd) {
      return true;
    }
    
    // Check if we're inside a string literal (simplified)
    const beforePosition = code.substring(0, position);
    const singleQuotes = (beforePosition.match(/'/g) || []).length;
    const doubleQuotes = (beforePosition.match(/"/g) || []).length;
    const backticks = (beforePosition.match(/`/g) || []).length;
    
    // If odd number of quotes, we're likely inside a string
    return singleQuotes % 2 === 1 || doubleQuotes % 2 === 1 || backticks % 2 === 1;
  }

  /**
   * Find actual vulnerable patterns, not example code
   */
  private findVulnerablePattern(
    code: string, 
    pattern: string, 
    additionalCheck?: (index: number) => boolean
  ): number[] {
    const positions: number[] = [];
    let index = 0;
    
    while ((index = code.indexOf(pattern, index)) !== -1) {
      // Skip if in comment or string
      if (!this.isInCommentOrString(code, index)) {
        // Apply additional check if provided
        if (!additionalCheck || additionalCheck(index)) {
          positions.push(index);
        }
      }
      index += pattern.length;
    }
    
    return positions;
  }

  /**
   * Get line number from position
   */
  private getLineNumber(code: string, position: number): number {
    return code.substring(0, position).split('\n').length;
  }

  /**
   * Analyze SQL injection vulnerabilities
   */
  analyzeSQLInjection(code: string, filename: string): CodeIssue[] {
    const issues: CodeIssue[] = [];
    
    // Look for SQL query patterns
    const sqlPatterns = ['query(', 'execute(', 'exec(', '.raw('];
    const vulnerableStringPatterns = ['${', '" +', "' +", '` +'];
    
    for (const sqlPattern of sqlPatterns) {
      const positions = this.findVulnerablePattern(code, sqlPattern);
      
      for (const pos of positions) {
        // Find the end of the function call
        let depth = 1;
        let i = pos + sqlPattern.length;
        let functionEnd = -1;
        
        while (i < code.length && depth > 0) {
          if (code[i] === '(') depth++;
          else if (code[i] === ')') {
            depth--;
            if (depth === 0) functionEnd = i;
          }
          i++;
        }
        
        if (functionEnd === -1) continue;
        
        // Extract the function call content
        const queryContent = code.substring(pos, functionEnd + 1);
        
        // Check for string concatenation in the query
        let hasVulnerability = false;
        for (const pattern of vulnerableStringPatterns) {
          if (queryContent.includes(pattern)) {
            hasVulnerability = true;
            break;
          }
        }
        
        if (hasVulnerability) {
          issues.push({
            type: 'SECURITY',
            severity: 'CRITICAL',
            location: { 
              file: filename, 
              lines: [this.getLineNumber(code, pos)] 
            },
            critical_feedback: 'SQL injection vulnerability - string concatenation in query',
            actual_impact: 'Database compromise, data exfiltration, privilege escalation',
            fix: {
              description: 'Use parameterized queries or prepared statements',
              working_code: `// Use parameterized queries:
db.query('SELECT * FROM users WHERE id = ?', [userId])

// Or use a query builder:
db.select('*').from('users').where('id', userId)

// For dynamic queries, use a safe builder:
const query = db.table('users');
if (sortBy) query.orderBy(db.raw('??', [sortBy]));`,
              complexity: 'simple',
              roi: 'high',
            },
          });
        }
      }
    }
    
    return issues;
  }

  /**
   * Analyze XSS vulnerabilities
   */
  analyzeXSS(code: string, filename: string): CodeIssue[] {
    const issues: CodeIssue[] = [];
    
    // Look for dangerous DOM manipulation
    const dangerousPatterns = [
      { pattern: 'innerHTML', severity: 'HIGH' as const },
      { pattern: 'outerHTML', severity: 'HIGH' as const },
      { pattern: 'document.write', severity: 'CRITICAL' as const },
      { pattern: 'insertAdjacentHTML', severity: 'HIGH' as const },
    ];
    
    for (const { pattern, severity } of dangerousPatterns) {
      const positions = this.findVulnerablePattern(code, pattern);
      
      for (const pos of positions) {
        // Check if there's user input nearby
        const lineStart = code.lastIndexOf('\n', pos) + 1;
        const lineEnd = code.indexOf('\n', pos);
        const line = code.substring(lineStart, lineEnd === -1 ? code.length : lineEnd);
        
        // Look for signs of dynamic content
        if (line.includes('${') || line.includes('+') || line.includes('user') || line.includes('input')) {
          issues.push({
            type: 'SECURITY',
            severity,
            location: { 
              file: filename, 
              lines: [this.getLineNumber(code, pos)] 
            },
            critical_feedback: `XSS vulnerability - unsafe use of ${pattern}`,
            actual_impact: 'Session hijacking, credential theft, malicious redirects',
            fix: {
              description: 'Use safe DOM methods or sanitize input',
              working_code: `// Safe alternatives:
element.textContent = userInput;  // Plain text only

// If HTML is needed, sanitize it:
import DOMPurify from 'dompurify';
element.innerHTML = DOMPurify.sanitize(userInput);

// Or use a template library with auto-escaping:
element.innerHTML = escapeHtml\`<div>\${userInput}</div>\`;`,
              complexity: 'simple',
              roi: 'high',
            },
          });
        }
      }
    }
    
    return issues;
  }

  /**
   * Analyze code execution vulnerabilities
   */
  analyzeCodeExecution(code: string, filename: string): CodeIssue[] {
    const issues: CodeIssue[] = [];
    
    // Look for eval and similar patterns
    const dangerousPatterns = [
      { pattern: 'eval(', name: 'eval' },
      { pattern: 'new Function(', name: 'Function constructor' },
      { pattern: 'setTimeout(', name: 'setTimeout with string', checkString: true },
      { pattern: 'setInterval(', name: 'setInterval with string', checkString: true },
    ];
    
    for (const { pattern, name, checkString } of dangerousPatterns) {
      const positions = this.findVulnerablePattern(code, pattern);
      
      for (const pos of positions) {
        // For setTimeout/setInterval, check if first argument is a string
        if (checkString) {
          const nextChar = code[pos + pattern.length];
          if (nextChar !== '"' && nextChar !== "'" && nextChar !== '`') {
            continue; // Not a string argument, likely safe
          }
        }
        
        issues.push({
          type: 'SECURITY',
          severity: 'CRITICAL',
          location: { 
            file: filename, 
            lines: [this.getLineNumber(code, pos)] 
          },
          critical_feedback: `Code execution vulnerability - ${name} is dangerous`,
          actual_impact: 'Remote code execution, complete system compromise',
          fix: {
            description: `Never use ${name} with dynamic input`,
            working_code: `// For JSON parsing:
const data = JSON.parse(jsonString);

// For dynamic function execution:
const functions = {
  add: (a, b) => a + b,
  subtract: (a, b) => a - b
};
const result = functions[operationName]?.(a, b);

// For setTimeout/setInterval:
setTimeout(() => executeAction(), delay);  // Use function, not string`,
            complexity: 'moderate',
            roi: 'high',
          },
        });
      }
    }
    
    return issues;
  }

  /**
   * Main analysis function
   */
  async analyze(code: string, filename: string): Promise<CodeIssue[]> {
    const issues: CodeIssue[] = [];
    
    // Skip analysis for test files and example files
    if (filename.includes('.test.') || filename.includes('.spec.') || filename.includes('example')) {
      return issues;
    }
    
    // Run all security analyses
    issues.push(...this.analyzeSQLInjection(code, filename));
    issues.push(...this.analyzeXSS(code, filename));
    issues.push(...this.analyzeCodeExecution(code, filename));
    
    // Enhance with web search if enabled
    if (this.webSearchTool) {
      try {
        const webFindings = await this.webSearchTool.searchForVulnerabilities(code, filename);
        issues.push(...this.convertWebFindings(webFindings, filename));
      } catch (error) {
        logger.warn('Failed to enhance with web search', error as Error);
      }
    }
    
    return issues;
  }
  
  /**
   * Convert web search findings to CodeIssue format
   */
  private convertWebFindings(findings: SecurityFinding[], filename: string): CodeIssue[] {
    return findings.map(finding => ({
      type: 'SECURITY' as const,
      severity: finding.severity as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW',
      location: {
        file: filename,
        lines: [1] // Web findings don't have specific line numbers
      },
      critical_feedback: `${finding.vulnerability} - ${finding.description}`,
      actual_impact: `Verified vulnerability from ${finding.source}`,
      fix: {
        description: 'Review security best practices and apply recommended fixes',
        working_code: '// See source for detailed remediation steps',
        complexity: 'moderate' as const,
        roi: 'high' as const
      }
    }));
  }
}
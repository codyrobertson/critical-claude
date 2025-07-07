/**
 * Web Search Tool for Critical Claude
 * Integrates with Exa MCP for grounding facts and searching for vulnerabilities
 */

import { logger } from '../logger.js';

export interface SecurityFinding {
  vulnerability: string;
  cve?: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  source: string;
  publishedDate?: string;
}

export interface BestPractice {
  practice: string;
  description: string;
  source: string;
  confidence: number;
}

export interface LibraryIssue {
  library: string;
  version?: string;
  issues: string[];
  alternatives?: string[];
  source: string;
}

interface ExaSearchResult {
  title: string;
  url: string;
  snippet: string;
  publishedDate?: string;
}

export class WebSearchTool {
  private enabled: boolean = false;
  private searchDepth: 'basic' | 'comprehensive' = 'basic';
  
  constructor(config?: { enabled?: boolean; searchDepth?: string }) {
    this.enabled = config?.enabled ?? false;
    this.searchDepth = (config?.searchDepth as 'basic' | 'comprehensive') ?? 'basic';
    
    if (this.enabled) {
      logger.info('WebSearchTool initialized', { 
        enabled: this.enabled, 
        searchDepth: this.searchDepth 
      });
    }
  }
  
  /**
   * Search for known vulnerabilities in code patterns
   */
  async searchForVulnerabilities(code: string, context: string): Promise<SecurityFinding[]> {
    if (!this.enabled) {
      logger.debug('Web search disabled, skipping vulnerability search');
      return [];
    }
    
    try {
      logger.info('Searching for vulnerabilities', { context });
      
      // Extract potential vulnerability patterns from code
      const patterns = this.extractVulnerabilityPatterns(code);
      if (patterns.length === 0) {
        return [];
      }
      
      const findings: SecurityFinding[] = [];
      
      // For now, we'll simulate the search results
      // In real implementation, this would call Exa MCP
      for (const pattern of patterns) {
        const results = await this.simulateExaSearch(
          `${pattern.type} vulnerability CVE ${pattern.context}`,
          'security'
        );
        
        findings.push(...this.parseSecurityResults(results, pattern));
      }
      
      logger.info('Vulnerability search complete', { 
        patternsChecked: patterns.length,
        findingsCount: findings.length 
      });
      
      return findings;
    } catch (error) {
      logger.error('Error searching for vulnerabilities', error as Error);
      return [];
    }
  }
  
  /**
   * Verify best practices against current standards
   */
  async verifyBestPractices(pattern: string, language: string): Promise<BestPractice[]> {
    if (!this.enabled) {
      return [];
    }
    
    try {
      logger.info('Verifying best practices', { pattern, language });
      
      const query = `${language} best practices ${pattern} ${new Date().getFullYear()}`;
      const results = await this.simulateExaSearch(query, 'technical');
      
      const practices = results.map(result => ({
        practice: this.extractPractice(result.title),
        description: result.snippet,
        source: result.url,
        confidence: this.calculateConfidence(result)
      }));
      
      return practices.filter(p => p.confidence > 0.7);
    } catch (error) {
      logger.error('Error verifying best practices', error as Error);
      return [];
    }
  }
  
  /**
   * Check for known issues with specific library versions
   */
  async checkLibraryIssues(dependencies: string[]): Promise<LibraryIssue[]> {
    if (!this.enabled || dependencies.length === 0) {
      return [];
    }
    
    try {
      logger.info('Checking library issues', { count: dependencies.length });
      
      const issues: LibraryIssue[] = [];
      
      for (const dep of dependencies) {
        const [library, version] = dep.split('@');
        const query = `${library} ${version || ''} security vulnerability issues`;
        
        const results = await this.simulateExaSearch(query, 'security');
        
        if (results.length > 0) {
          issues.push({
            library,
            version,
            issues: results.map(r => r.snippet).slice(0, 3),
            alternatives: this.suggestAlternatives(library),
            source: results[0].url
          });
        }
      }
      
      return issues;
    } catch (error) {
      logger.error('Error checking library issues', error as Error);
      return [];
    }
  }
  
  /**
   * Extract potential vulnerability patterns from code
   */
  private extractVulnerabilityPatterns(code: string): Array<{type: string; context: string}> {
    const patterns: Array<{type: string; context: string}> = [];
    
    // SQL Injection patterns
    if (code.includes('query(') && code.includes('${')) {
      patterns.push({ type: 'SQL injection', context: 'string interpolation in query' });
    }
    
    // XSS patterns
    if (code.includes('innerHTML') && !code.includes('sanitize')) {
      patterns.push({ type: 'XSS', context: 'innerHTML without sanitization' });
    }
    
    // Command injection
    if (code.includes('exec(') || code.includes('spawn(')) {
      patterns.push({ type: 'Command injection', context: 'shell command execution' });
    }
    
    // Path traversal
    if (code.includes('../') || code.includes('..\\')) {
      patterns.push({ type: 'Path traversal', context: 'directory traversal attempt' });
    }
    
    return patterns;
  }
  
  /**
   * Simulate Exa search results (to be replaced with actual Exa MCP calls)
   */
  private async simulateExaSearch(
    query: string, 
    category: 'security' | 'technical'
  ): Promise<ExaSearchResult[]> {
    // This is a simulation - in real implementation, this would call Exa MCP
    logger.debug('Simulating Exa search', { query, category });
    
    if (category === 'security' && query.includes('SQL injection')) {
      return [{
        title: 'SQL Injection Prevention - OWASP',
        url: 'https://owasp.org/www-community/attacks/SQL_Injection',
        snippet: 'SQL injection attacks occur when untrusted data is sent to an interpreter...',
        publishedDate: '2024-01-15'
      }];
    }
    
    if (category === 'security' && query.includes('XSS')) {
      return [{
        title: 'Cross-Site Scripting (XSS) - OWASP',
        url: 'https://owasp.org/www-community/attacks/xss/',
        snippet: 'Cross-Site Scripting attacks are a type of injection where malicious scripts...',
        publishedDate: '2024-02-01'
      }];
    }
    
    return [];
  }
  
  /**
   * Parse security search results into findings
   */
  private parseSecurityResults(
    results: ExaSearchResult[], 
    pattern: {type: string; context: string}
  ): SecurityFinding[] {
    return results.map(result => ({
      vulnerability: pattern.type,
      severity: this.determineSeverity(pattern.type),
      description: `${pattern.context}: ${result.snippet}`,
      source: result.url,
      publishedDate: result.publishedDate
    }));
  }
  
  /**
   * Determine severity based on vulnerability type
   */
  private determineSeverity(vulnerabilityType: string): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' {
    const severityMap: Record<string, 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'> = {
      'SQL injection': 'CRITICAL',
      'XSS': 'HIGH',
      'Command injection': 'CRITICAL',
      'Path traversal': 'HIGH',
      'CSRF': 'MEDIUM',
      'Information disclosure': 'MEDIUM'
    };
    
    return severityMap[vulnerabilityType] || 'MEDIUM';
  }
  
  /**
   * Extract practice from search result title
   */
  private extractPractice(title: string): string {
    // Simple extraction - can be enhanced
    return title.replace(/[-–—].*$/, '').trim();
  }
  
  /**
   * Calculate confidence score for a search result
   */
  private calculateConfidence(result: ExaSearchResult): number {
    let confidence = 0.5;
    
    // Boost confidence for authoritative sources
    const authoritativeDomains = ['owasp.org', 'mozilla.org', 'w3.org', 'github.com'];
    const url = new URL(result.url);
    if (authoritativeDomains.some(domain => url.hostname.includes(domain))) {
      confidence += 0.3;
    }
    
    // Boost for recent content
    if (result.publishedDate) {
      const age = Date.now() - new Date(result.publishedDate).getTime();
      const oneYear = 365 * 24 * 60 * 60 * 1000;
      if (age < oneYear) {
        confidence += 0.2;
      }
    }
    
    return Math.min(confidence, 1.0);
  }
  
  /**
   * Suggest alternative libraries
   */
  private suggestAlternatives(library: string): string[] {
    const alternatives: Record<string, string[]> = {
      'request': ['axios', 'node-fetch', 'got'],
      'moment': ['date-fns', 'dayjs'],
      'underscore': ['lodash', 'ramda']
    };
    
    return alternatives[library] || [];
  }
}
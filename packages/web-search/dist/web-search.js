/**
 * Web Search Tool for Critical Claude
 * Integrates with Exa MCP for grounding facts and searching for vulnerabilities
 */
import { logger } from '@critical-claude/core';
export class WebSearchTool {
    enabled = false;
    searchDepth = 'basic';
    constructor(config) {
        this.enabled = config?.enabled ?? false;
        this.searchDepth = config?.searchDepth ?? 'basic';
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
    async searchForVulnerabilities(code, context) {
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
            const findings = [];
            // For now, we'll simulate the search results
            // In real implementation, this would call Exa MCP
            for (const pattern of patterns) {
                const results = await this.simulateExaSearch(`${pattern.type} vulnerability CVE ${pattern.context}`, 'security');
                findings.push(...this.parseSecurityResults(results, pattern));
            }
            logger.info('Vulnerability search complete', {
                patternsChecked: patterns.length,
                findingsCount: findings.length
            });
            return findings;
        }
        catch (error) {
            logger.error('Error searching for vulnerabilities', error);
            return [];
        }
    }
    /**
     * Verify best practices against current standards
     */
    async verifyBestPractices(pattern, language) {
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
        }
        catch (error) {
            logger.error('Error verifying best practices', error);
            return [];
        }
    }
    /**
     * Check for known issues with specific library versions
     */
    async checkLibraryIssues(dependencies) {
        if (!this.enabled || dependencies.length === 0) {
            return [];
        }
        try {
            logger.info('Checking library issues', { count: dependencies.length });
            const issues = [];
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
        }
        catch (error) {
            logger.error('Error checking library issues', error);
            return [];
        }
    }
    /**
     * Extract potential vulnerability patterns from code
     */
    extractVulnerabilityPatterns(code) {
        const patterns = [];
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
    async simulateExaSearch(query, category) {
        // Input validation and sanitization
        const sanitizedQuery = this.sanitizeSearchQuery(query);
        if (!sanitizedQuery) {
            logger.error('Malicious search query blocked', {
                originalQuery: query,
                category
            });
            return [];
        }
        // Log for security monitoring
        logger.info('Search query sanitized', {
            original: query.length,
            sanitized: sanitizedQuery.length,
            removed: query.length - sanitizedQuery.length
        });
        // This is a simulation - in real implementation, this would call Exa MCP
        logger.debug('Simulating Exa search', { query: sanitizedQuery, category });
        if (category === 'security' && sanitizedQuery.includes('SQL injection')) {
            return [{
                    title: 'SQL Injection Prevention - OWASP',
                    url: 'https://owasp.org/www-community/attacks/SQL_Injection',
                    snippet: 'SQL injection attacks occur when untrusted data is sent to an interpreter...',
                    publishedDate: '2024-01-15'
                }];
        }
        if (category === 'security' && sanitizedQuery.includes('XSS')) {
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
    parseSecurityResults(results, pattern) {
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
    determineSeverity(vulnerabilityType) {
        const severityMap = {
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
    extractPractice(title) {
        // Simple extraction - can be enhanced
        return title.replace(/[-–—].*$/, '').trim();
    }
    /**
     * Calculate confidence score for a search result
     */
    calculateConfidence(result) {
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
    suggestAlternatives(library) {
        const alternatives = {
            'request': ['axios', 'node-fetch', 'got'],
            'moment': ['date-fns', 'dayjs'],
            'underscore': ['lodash', 'ramda']
        };
        return alternatives[library] || [];
    }
    sanitizeSearchQuery(query) {
        // Length validation
        if (query.length > 500) {
            return null;
        }
        // Remove all potentially dangerous characters
        const dangerousChars = /[;&|`$(){}[\]<>\\'\"]/g;
        const sanitized = query.replace(dangerousChars, '');
        // Remove any remaining non-alphanumeric except basic punctuation
        const safePattern = /[^a-zA-Z0-9\s\-_.,:]/g;
        const doubleSanitized = sanitized.replace(safePattern, '');
        // Check for injection patterns even after sanitization
        const injectionPatterns = [
            /\b(exec|eval|spawn|require|import)\b/i,
            /\b(curl|wget|nc|bash|sh|cmd)\b/i,
            /\.(sh|exe|bat|cmd|ps1)$/i
        ];
        if (injectionPatterns.some(pattern => pattern.test(doubleSanitized))) {
            logger.warn('Injection pattern detected after sanitization', { query });
            return null;
        }
        return doubleSanitized.trim();
    }
}
//# sourceMappingURL=web-search.js.map
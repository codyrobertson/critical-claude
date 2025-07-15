/**
 * Pragmatic Critique Engine
 * Analyzes code for real problems that affect users, not theoretical violations
 */
import { SecurityAnalyzer } from './security-analyzer.js';
import { logger } from '@critical-claude/core';
export class PragmaticCritiqueEngine {
    securityAnalyzer;
    webSearchTool;
    constructor(webSearchTool) {
        this.webSearchTool = webSearchTool || {
            searchForVulnerabilities: async () => [],
            verifyBestPractices: async () => [],
            checkLibraryIssues: async () => []
        };
        this.securityAnalyzer = new SecurityAnalyzer(this.webSearchTool);
    }
    /**
     * Analyze code with pragmatic context
     */
    async analyzeCode(code, filename, context) {
        logger.info('Starting pragmatic code analysis', { filename });
        const systemType = this.detectSystemType(code, filename);
        const issues = [];
        // Run all analyses
        await this.analyzeSecurity(code, filename, systemType, issues);
        this.analyzePerformance(code, filename, systemType, issues);
        this.analyzeArchitecture(code, filename, systemType, issues);
        this.analyzeQuality(code, filename, systemType, issues);
        // Check for over-engineering
        const overEngineeringRisks = this.detectOverEngineering(code, systemType);
        // Identify good decisions
        const goodDecisions = this.identifyGoodDecisions(code, filename);
        // Enhance with fact-checking if enabled
        if (this.webSearchTool && context?.enableFactChecking !== false) {
            await this.enhanceWithFactChecking(issues, code, filename);
        }
        // Generate verdict
        const criticalCount = issues.filter((i) => i.severity === 'CRITICAL').length;
        const highCount = issues.filter((i) => i.severity === 'HIGH').length;
        let verdict = 'APPROVED';
        if (criticalCount > 0)
            verdict = 'BLOCKED';
        else if (highCount > 0)
            verdict = 'CONDITIONAL';
        // Generate pragmatic action plan
        const actionPlan = this.generateActionPlan(issues, systemType);
        logger.info('Analysis complete', {
            filename,
            issueCount: issues.length,
            verdict,
        });
        return {
            system_context: systemType,
            deployment_verdict: verdict,
            critical_count: criticalCount,
            high_count: highCount,
            issues,
            good_decisions: goodDecisions.length > 0 ? goodDecisions : ["Code is working - that's already a win"],
            over_engineering_risks: overEngineeringRisks,
            action_plan: actionPlan,
        };
    }
    detectSystemType(code, filename) {
        const lowerCode = code.toLowerCase();
        const lowerFilename = filename.toLowerCase();
        // API detection
        if (lowerFilename.includes('api') ||
            code.includes('express') ||
            code.includes('fastify') ||
            code.includes('@Get') ||
            code.includes('@Post')) {
            return 'api';
        }
        // Enterprise patterns
        if (code.includes('AbstractFactory') ||
            code.includes('dependency injection') ||
            code.includes('enterprise')) {
            return 'enterprise';
        }
        // Startup indicators
        if (code.includes('MVP') || code.includes('// TODO: refactor later')) {
            return 'startup';
        }
        // Size detection
        const lineCount = code.split('\n').length;
        if (lineCount > 1000)
            return 'web_large';
        if (lineCount < 200)
            return 'web_small';
        return 'unknown';
    }
    async analyzeSecurity(code, filename, systemType, issues) {
        // Use the smart security analyzer to avoid false positives
        const securityIssues = await this.securityAnalyzer.analyze(code, filename);
        // Convert security issues to match the expected format
        for (const issue of securityIssues) {
            issues.push({
                type: issue.type,
                severity: issue.severity,
                location: issue.location,
                critical_feedback: issue.critical_feedback,
                actual_impact: issue.actual_impact,
                fix: issue.fix,
            });
        }
    }
    analyzePerformance(code, filename, systemType, issues) {
        // Nested loops - context matters
        const nestedLoopRegex = /for\s*\([^)]*\)\s*{[^}]*for\s*\([^)]*\)/g;
        const matches = code.match(nestedLoopRegex);
        if (matches && matches.length > 0) {
            // Check if it's actually processing large datasets
            if (code.includes('users') || code.includes('items') || code.includes('data')) {
                issues.push({
                    type: 'PERFORMANCE',
                    severity: systemType === 'web_large' ? 'HIGH' : 'MEDIUM',
                    location: { file: filename, lines: [this.findLineNumber(code, matches[0])] },
                    critical_feedback: 'Nested loops will destroy performance at scale',
                    actual_impact: '100 users = 10k operations. 10k users = 100M operations. Do the math.',
                    fix: {
                        description: 'Use Map/Set for O(1) lookups or optimize algorithm',
                        working_code: `// Instead of nested loops:
const userMap = new Map(users.map(u => [u.id, u]));
items.forEach(item => {
  const user = userMap.get(item.userId); // O(1) lookup
});`,
                        complexity: 'moderate',
                        roi: 'high',
                    },
                });
            }
        }
        // Synchronous file operations
        if (code.includes('readFileSync') || code.includes('writeFileSync')) {
            issues.push({
                type: 'PERFORMANCE',
                severity: 'HIGH',
                location: { file: filename, lines: [this.findLineNumber(code, 'Sync')] },
                critical_feedback: 'Sync operations block the entire process',
                actual_impact: 'Your server freezes while reading files. Users rage quit.',
                fix: {
                    description: 'Use async file operations',
                    working_code: `// Use: await fs.readFile(path, 'utf8')
// Not: fs.readFileSync(path, 'utf8')`,
                    complexity: 'simple',
                    roi: 'high',
                },
            });
        }
        // Memory leaks
        if (code.includes('setInterval') && !code.includes('clearInterval')) {
            issues.push({
                type: 'PERFORMANCE',
                severity: 'HIGH',
                location: { file: filename, lines: [this.findLineNumber(code, 'setInterval')] },
                critical_feedback: 'Memory leak - this interval runs forever',
                actual_impact: 'Server OOMs after a few days. Pager duty at 3 AM.',
                fix: {
                    description: 'Store interval ID and clear it',
                    working_code: `const intervalId = setInterval(() => {...}, 1000);
// On cleanup: clearInterval(intervalId);`,
                    complexity: 'simple',
                    roi: 'high',
                },
            });
        }
    }
    analyzeArchitecture(code, filename, systemType, issues) {
        // God functions
        const functionRegex = /function\s+\w+\s*\([^)]*\)\s*{|const\s+\w+\s*=\s*(?:async\s*)?\([^)]*\)\s*=>\s*{/g;
        let match;
        while ((match = functionRegex.exec(code)) !== null) {
            const start = match.index;
            let braceCount = 1;
            let i = code.indexOf('{', start) + 1;
            while (i < code.length && braceCount > 0) {
                if (code[i] === '{')
                    braceCount++;
                else if (code[i] === '}')
                    braceCount--;
                i++;
            }
            const functionLength = code.substring(start, i).split('\n').length;
            if (functionLength > 50) {
                issues.push({
                    type: 'ARCHITECTURE',
                    severity: systemType === 'startup' ? 'LOW' : 'MEDIUM',
                    location: { file: filename, lines: [this.findLineNumber(code, match[0])] },
                    critical_feedback: `Function is ${functionLength} lines - unreadable and untestable`,
                    actual_impact: "Nobody understands it. Bugs hide here. You'll rewrite it in 6 months.",
                    fix: {
                        description: 'Break into smaller, focused functions',
                        working_code: `// Extract logical chunks into separate functions
function validateInput(data) { ... }
function processData(validData) { ... }
function saveResults(results) { ... }`,
                        complexity: 'moderate',
                        roi: 'medium',
                    },
                });
            }
        }
        // Callback hell
        const callbackHell = /\}\s*\)\s*\}\s*\)\s*\}\s*\)/;
        if (callbackHell.test(code)) {
            issues.push({
                type: 'ARCHITECTURE',
                severity: 'MEDIUM',
                location: { file: filename, lines: [1] },
                critical_feedback: 'Callback hell detected - welcome to 2010',
                actual_impact: 'Impossible to debug. Error handling is a nightmare.',
                fix: {
                    description: 'Use async/await',
                    working_code: `// Modern approach:
try {
  const result1 = await operation1();
  const result2 = await operation2(result1);
  const result3 = await operation3(result2);
} catch (error) {
  // Clean error handling
}`,
                    complexity: 'simple',
                    roi: 'high',
                },
            });
        }
    }
    analyzeQuality(code, filename, systemType, issues) {
        // Console.log in production code
        if (code.includes('console.log') && !filename.includes('test')) {
            issues.push({
                type: 'QUALITY',
                severity: 'LOW',
                location: { file: filename, lines: [this.findLineNumber(code, 'console.log')] },
                critical_feedback: 'console.log in production - amateur hour',
                actual_impact: 'No structured logging. Good luck debugging production.',
                fix: {
                    description: 'Use proper logging library',
                    working_code: `import { logger } from './logger';
logger.info('User action', { userId, action });`,
                    complexity: 'simple',
                    roi: 'medium',
                },
            });
        }
        // No error handling
        const tryCount = (code.match(/try\s*{/g) || []).length;
        const catchCount = (code.match(/catch\s*\(/g) || []).length;
        const promiseCount = (code.match(/\.(then|catch)\(/g) || []).length;
        const asyncCount = (code.match(/async\s+/g) || []).length;
        if (asyncCount > 0 && tryCount === 0 && promiseCount === 0) {
            issues.push({
                type: 'QUALITY',
                severity: 'HIGH',
                location: { file: filename, lines: [1] },
                critical_feedback: 'No error handling for async operations',
                actual_impact: 'Unhandled promise rejections. Silent failures. Angry users.',
                fix: {
                    description: 'Add try/catch blocks',
                    working_code: `try {
  const result = await riskyOperation();
} catch (error) {
  logger.error('Operation failed', error);
  // Handle gracefully
}`,
                    complexity: 'simple',
                    roi: 'high',
                },
            });
        }
    }
    detectOverEngineering(code, systemType) {
        const risks = [];
        // Small app with enterprise patterns
        if (systemType === 'web_small' || systemType === 'startup') {
            if (code.includes('AbstractFactory') || code.includes('interface I')) {
                risks.push('Using enterprise patterns for a simple app - YAGNI');
            }
            if (code.includes('microservice') || code.includes('kafka')) {
                risks.push('Microservices for <1000 users - you played yourself');
            }
            const repoMatches = code.match(/class \w+Repository/g);
            if (repoMatches && repoMatches.length > 5) {
                risks.push('Repository pattern everywhere - this isn\'t Java');
            }
        }
        // GraphQL for simple CRUD
        if (code.includes('GraphQL') && !code.includes('subscription')) {
            const queryCount = (code.match(/Query:/g) || []).length;
            if (queryCount < 5) {
                risks.push('GraphQL for 5 queries - REST would be simpler');
            }
        }
        return risks;
    }
    identifyGoodDecisions(code, filename) {
        const good = [];
        if (code.includes('async') && code.includes('await')) {
            good.push('Using async/await - modern and readable');
        }
        if (code.includes('try') && code.includes('catch')) {
            good.push('Has error handling - production ready');
        }
        if (code.includes('test') || filename.includes('.test.')) {
            good.push('Has tests - you actually care about quality');
        }
        if (code.includes('logger') && !code.includes('console.log')) {
            good.push('Structured logging - debuggable in production');
        }
        return good;
    }
    generateActionPlan(issues, systemType) {
        const immediate = [];
        const nextSprint = [];
        const niceToHave = [];
        const avoid = [];
        issues.forEach((issue) => {
            const desc = `Fix ${issue.type} issue at ${issue.location.file}:${issue.location.lines[0]}`;
            switch (issue.severity) {
                case 'CRITICAL':
                    immediate.push(desc + ' - ' + issue.critical_feedback);
                    break;
                case 'HIGH':
                    nextSprint.push(desc + ' - ' + issue.actual_impact);
                    break;
                case 'MEDIUM':
                    niceToHave.push(desc);
                    break;
                case 'LOW':
                    // Don't add to any action list
                    break;
            }
        });
        // Context-specific advice
        if (systemType === 'startup' || systemType === 'web_small') {
            avoid.push("Don't add dependency injection unless you have multiple implementations");
            avoid.push("Don't split into microservices - you're not at that scale yet");
            avoid.push("Don't over-optimize for millions of users until you have thousands");
        }
        if (systemType === 'enterprise') {
            avoid.push("Don't skip security reviews - compliance matters here");
            avoid.push("Don't ignore monitoring and observability");
        }
        return {
            immediate,
            next_sprint: nextSprint,
            nice_to_have: niceToHave,
            avoid
        };
    }
    findLineNumber(code, search) {
        const index = code.indexOf(search);
        if (index === -1)
            return 1;
        return code.substring(0, index).split('\n').length;
    }
    /**
     * Enhance critique results with fact-checking via web search
     */
    async enhanceWithFactChecking(issues, code, filename) {
        try {
            logger.info('Enhancing critique with fact-checking', { filename });
            // Extract language from filename
            const language = this.detectLanguage(filename);
            // Fact-check performance recommendations
            for (const issue of issues) {
                if (issue.type === 'PERFORMANCE' && issue.fix) {
                    const bestPractices = await this.webSearchTool.verifyBestPractices(issue.fix.description, language);
                    if (bestPractices.length > 0) {
                        // Enhance the fix with verified best practices
                        issue.fix.description += `\n\nVerified best practices:\n${bestPractices.map((bp) => `- ${bp.practice}: ${bp.recommendation}`).join('\n')}`;
                    }
                }
            }
            // Check for library vulnerabilities
            const dependencies = this.extractDependencies(code, filename);
            if (dependencies.length > 0) {
                const libraryIssues = await this.webSearchTool.checkLibraryIssues(dependencies);
                // Add library vulnerability issues
                for (const libIssue of libraryIssues) {
                    issues.push({
                        type: 'SECURITY',
                        severity: 'HIGH',
                        location: {
                            file: filename,
                            lines: [1] // Dependencies are usually at the top
                        },
                        critical_feedback: `Library ${libIssue.library} has known vulnerabilities`,
                        actual_impact: libIssue.issues.join('; '),
                        fix: {
                            description: `Update ${libIssue.library} or switch to alternatives: ${libIssue.alternatives?.join(', ') || 'research alternatives'}`,
                            working_code: `// Update package.json or requirements file`,
                            complexity: 'simple',
                            roi: 'high'
                        }
                    });
                }
            }
            logger.info('Fact-checking complete', {
                enhancedIssues: issues.filter(i => i.fix?.description.includes('Verified')).length
            });
        }
        catch (error) {
            logger.warn('Fact-checking failed, continuing without enhancements', error);
        }
    }
    /**
     * Detect programming language from filename
     */
    detectLanguage(filename) {
        const ext = filename.split('.').pop()?.toLowerCase() || '';
        const languageMap = {
            'js': 'JavaScript',
            'ts': 'TypeScript',
            'py': 'Python',
            'java': 'Java',
            'go': 'Go',
            'rs': 'Rust',
            'rb': 'Ruby',
            'php': 'PHP'
        };
        return languageMap[ext] || 'Unknown';
    }
    /**
     * Extract dependencies from code
     */
    extractDependencies(code, filename) {
        const dependencies = [];
        // JavaScript/TypeScript imports
        if (filename.endsWith('.js') || filename.endsWith('.ts')) {
            const importMatches = code.matchAll(/import\s+.*from\s+['"]([^'"]+)['"]/g);
            for (const match of importMatches) {
                if (!match[1].startsWith('.') && !match[1].startsWith('/')) {
                    dependencies.push(match[1]);
                }
            }
            const requireMatches = code.matchAll(/require\(['"]([^'"]+)['"]\)/g);
            for (const match of requireMatches) {
                if (!match[1].startsWith('.') && !match[1].startsWith('/')) {
                    dependencies.push(match[1]);
                }
            }
        }
        // Python imports
        if (filename.endsWith('.py')) {
            const importMatches = code.matchAll(/(?:from|import)\s+(\S+)/g);
            for (const match of importMatches) {
                const lib = match[1].split('.')[0];
                if (!lib.startsWith('_') && lib !== 'from') {
                    dependencies.push(lib);
                }
            }
        }
        return [...new Set(dependencies)]; // Remove duplicates
    }
    /**
     * Formats pragmatic feedback for MCP response
     */
    formatPragmaticFeedback(result) {
        let output = '🔥 CRITICAL CODE REVIEW RESULTS 🔥\n';
        output += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
        output += `📊 SYSTEM CONTEXT: ${result.system_context.toUpperCase()}\n`;
        output += `📊 DEPLOYMENT VERDICT: ${result.deployment_verdict}\n`;
        output += `⚡ Critical Issues: ${result.critical_count} - MUST FIX BEFORE DEPLOYMENT\n`;
        output += `⚠️  High Priority: ${result.high_count} - FIX BEFORE MERGE\n`;
        output += `📝 Total Issues: ${result.issues.length}\n\n`;
        // Critical issues that actually matter
        const criticalIssues = result.issues.filter((i) => i.severity === 'CRITICAL');
        if (criticalIssues.length > 0) {
            output += '🚨 CRITICAL ISSUES - DEPLOYMENT BLOCKED\n';
            output +=
                '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
            criticalIssues.forEach((issue, index) => {
                output += `${index + 1}. ${issue.type}\n`;
                output += `📄 Location: ${issue.location.file}:${issue.location.lines.join(',')}\n`;
                output += `❌ Issue: ${issue.critical_feedback}\n`;
                output += `💀 Impact: ${issue.actual_impact}\n`;
                if (issue.fix) {
                    output += `🔧 Fix (${issue.fix.complexity}, ROI: ${issue.fix.roi}): ${issue.fix.description}\n`;
                    output += `\`\`\`\n${issue.fix.working_code}\n\`\`\`\n`;
                }
                output += '\n';
            });
        }
        // High priority issues
        const highIssues = result.issues.filter((i) => i.severity === 'HIGH');
        if (highIssues.length > 0) {
            output += '⚠️  HIGH PRIORITY FIXES REQUIRED\n';
            output +=
                '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
            highIssues.forEach((issue, index) => {
                output += `${index + 1}. ${issue.type}\n`;
                output += `📄 Location: ${issue.location.file}:${issue.location.lines.join(',')}\n`;
                output += `⚠️  Issue: ${issue.critical_feedback}\n`;
                output += `📊 Impact: ${issue.actual_impact}\n`;
                if (issue.fix) {
                    output += `🔧 Fix: ${issue.fix.description}\n`;
                }
                output += '\n';
            });
        }
        // Good decisions
        output += '💚 GOOD ARCHITECTURAL DECISIONS\n';
        output += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
        result.good_decisions.forEach((decision) => {
            output += `✅ ${decision}\n`;
        });
        output += '\n';
        // Over-engineering risks
        if (result.over_engineering_risks.length > 0) {
            output += '⚠️  OVER-ENGINEERING RISKS\n';
            output += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
            result.over_engineering_risks.forEach((risk) => {
                output += `❌ ${risk}\n`;
            });
            output += '\n';
        }
        // Pragmatic action plan
        output += '📋 IMPLEMENTATION CHECKLIST\n';
        output += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
        if (result.action_plan.immediate.length > 0) {
            output += 'Immediate Actions (Before deployment):\n';
            result.action_plan.immediate.forEach((action) => {
                output += `□ ${action}\n`;
            });
            output += '\n';
        }
        if (result.action_plan.next_sprint.length > 0) {
            output += 'Sprint Actions (Before next release):\n';
            result.action_plan.next_sprint.forEach((action) => {
                output += `□ ${action}\n`;
            });
            output += '\n';
        }
        if (result.action_plan.nice_to_have.length > 0) {
            output += 'Nice to Have (When time permits):\n';
            result.action_plan.nice_to_have.forEach((action) => {
                output += `□ ${action}\n`;
            });
            output += '\n';
        }
        if (result.action_plan.avoid.length > 0) {
            output += 'Never (Avoid These):\n';
            result.action_plan.avoid.forEach((action) => {
                output += `□ ${action}\n`;
            });
        }
        output +=
            '\n💭 Remember: Perfect is the enemy of good. Ship working code that solves real problems.';
        return output;
    }
}
//# sourceMappingURL=pragmatic-critique-engine.js.map
// Local logger implementation
const logger = {
    info: (msg, data) => console.log(`[INFO] ${msg}`, data || ''),
    warn: (msg, data) => console.warn(`[WARN] ${msg}`, data || ''),
    error: (msg, data) => console.error(`[ERROR] ${msg}`, data || ''),
    debug: (msg, data) => console.debug(`[DEBUG] ${msg}`, data || '')
};
import * as fs from 'fs/promises';
import * as path from 'path';
export class SystemDesignAnalyzer {
    async analyzeArchitecture(rootPath) {
        logger.info('Analyzing system architecture', { rootPath });
        const components = [];
        const decisions = [];
        const recommendations = [];
        // Analyze project structure
        const structure = await this.analyzeProjectStructure(rootPath);
        // Detect frameworks and patterns
        const patterns = await this.detectPatterns(rootPath);
        // Identify components
        if (structure.hasFrontend) {
            components.push({
                name: 'Frontend Application',
                type: 'frontend',
                description: 'User interface layer',
                technologies: patterns.frontend || [],
                dependencies: ['API Gateway'],
                complexity: this.assessComplexity(patterns.frontend || []),
                mvpPriority: 'must-have'
            });
        }
        if (structure.hasBackend) {
            components.push({
                name: 'Backend API',
                type: 'backend',
                description: 'Business logic and API endpoints',
                technologies: patterns.backend || [],
                dependencies: structure.hasDatabase ? ['Database'] : [],
                complexity: this.assessComplexity(patterns.backend || []),
                mvpPriority: 'must-have'
            });
        }
        if (structure.hasDatabase) {
            components.push({
                name: 'Database',
                type: 'database',
                description: 'Data persistence layer',
                technologies: patterns.database || [],
                dependencies: [],
                complexity: 'simple',
                mvpPriority: 'must-have'
            });
        }
        // Generate architecture decisions
        if (patterns.isMonolith && structure.totalFiles > 1000) {
            decisions.push({
                decision: 'Consider microservices migration',
                rationale: 'Large monolith becoming difficult to maintain',
                consequences: ['Increased operational complexity', 'Better scalability', 'Team autonomy'],
                alternatives: ['Modular monolith', 'Keep monolith with better boundaries']
            });
            recommendations.push('Start with modular monolith before full microservices');
        }
        if (patterns.frontend.includes('React') && !patterns.frontend.includes('TypeScript')) {
            recommendations.push('Add TypeScript to React app for better type safety');
        }
        if (!structure.hasTests) {
            recommendations.push('CRITICAL: Add test coverage immediately');
        }
        return { components, decisions, recommendations };
    }
    async analyzeProjectStructure(rootPath) {
        const structure = {
            hasFrontend: false,
            hasBackend: false,
            hasDatabase: false,
            hasTests: false,
            totalFiles: 0
        };
        try {
            // Check for common project indicators
            const files = await fs.readdir(rootPath);
            if (files.includes('package.json')) {
                const pkg = JSON.parse(await fs.readFile(path.join(rootPath, 'package.json'), 'utf8'));
                // Check dependencies for framework indicators
                const deps = { ...pkg.dependencies, ...pkg.devDependencies };
                if (deps['react'] || deps['vue'] || deps['angular'] || deps['svelte']) {
                    structure.hasFrontend = true;
                }
                if (deps['express'] || deps['fastify'] || deps['koa'] || deps['nest']) {
                    structure.hasBackend = true;
                }
                if (deps['pg'] || deps['mysql'] || deps['mongodb'] || deps['sqlite']) {
                    structure.hasDatabase = true;
                }
                if (deps['jest'] || deps['mocha'] || deps['vitest']) {
                    structure.hasTests = true;
                }
            }
            // Count total files recursively
            structure.totalFiles = await this.countFiles(rootPath);
        }
        catch (error) {
            logger.error('Failed to analyze project structure', error);
        }
        return structure;
    }
    async detectPatterns(rootPath) {
        return {
            frontend: [],
            backend: [],
            database: [],
            isMonolith: true,
            isMicroservices: false
        };
    }
    assessComplexity(technologies) {
        if (!technologies || technologies.length <= 2)
            return 'simple';
        if (technologies.length <= 5)
            return 'moderate';
        return 'complex';
    }
    async countFiles(dir) {
        let count = 0;
        try {
            const entries = await fs.readdir(dir, { withFileTypes: true });
            for (const entry of entries) {
                if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
                    count += await this.countFiles(path.join(dir, entry.name));
                }
                else if (entry.isFile()) {
                    count++;
                }
            }
        }
        catch (error) {
            logger.warn('Error counting files', error);
        }
        return count;
    }
    async analyzeSystemArchitecture(rootPath, focus = 'all') {
        // Delegate to the main analyze method
        return await this.analyzeArchitecture(rootPath);
    }
    recommendTechStack(projectType, requirements, teamExperience, constraints) {
        const recommendations = {
            projectType,
            teamExperience,
            recommended: {},
            alternatives: [],
            considerations: []
        };
        // Base recommendations by project type
        switch (projectType) {
            case 'web-app':
                recommendations.recommended = {
                    'Frontend': teamExperience === 'beginner' ? 'React' : 'Next.js',
                    'Backend': teamExperience === 'beginner' ? 'Express.js' : 'Node.js + TypeScript',
                    'Database': 'PostgreSQL',
                    'Hosting': 'Vercel or Netlify'
                };
                break;
            case 'api':
                recommendations.recommended = {
                    'Framework': teamExperience === 'beginner' ? 'Express.js' : 'Fastify',
                    'Database': 'PostgreSQL',
                    'Authentication': 'JWT',
                    'Documentation': 'Swagger/OpenAPI'
                };
                break;
            case 'mobile-app':
                recommendations.recommended = {
                    'Framework': teamExperience === 'beginner' ? 'React Native' : 'Flutter',
                    'State Management': 'Redux Toolkit',
                    'Backend': 'Firebase or Node.js',
                    'Database': 'Firebase Firestore'
                };
                break;
            default:
                recommendations.recommended = {
                    'Frontend': 'React',
                    'Backend': 'Node.js',
                    'Database': 'PostgreSQL'
                };
        }
        // Add alternatives
        recommendations.alternatives = [
            {
                name: 'Vue.js',
                description: 'Progressive JavaScript framework',
                pros: ['Gentle learning curve', 'Great documentation'],
                cons: ['Smaller ecosystem than React']
            },
            {
                name: 'Angular',
                description: 'Full-featured framework',
                pros: ['Enterprise-ready', 'TypeScript by default'],
                cons: ['Steep learning curve', 'Verbose']
            }
        ];
        // Add considerations based on requirements
        if (requirements.includes('real-time')) {
            recommendations.considerations.push('Consider WebSockets or Server-Sent Events');
        }
        if (requirements.includes('high-throughput')) {
            recommendations.considerations.push('Consider microservices architecture');
        }
        if (requirements.includes('offline-support')) {
            recommendations.considerations.push('Implement service workers and local storage');
        }
        return recommendations;
    }
}
//# sourceMappingURL=system-design-analyzer.js.map
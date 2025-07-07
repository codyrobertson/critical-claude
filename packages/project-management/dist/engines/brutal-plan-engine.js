/**
 * Brutal Plan Engine - Reality-based project planning
 * Exposes hidden complexity and provides realistic timelines
 */
import { logger, getConfig } from '@critical-claude/core';
import fs from 'fs/promises';
import path from 'path';
export class BrutalPlanEngine {
    config = null;
    /**
     * Simple extraction - let the AI handle the complexity
     */
    extractRequirements(input) {
        // Simple approach - just use the input as-is and let the plan generation handle the intelligence
        return {
            requirement: input,
            estimatedDays: 10, // Default estimate
            context: {
                originalInput: input,
            },
        };
    }
    /**
     * Process natural language input using AI-style prompting
     * This simulates how an AI would understand and extract requirements
     */
    processNaturalLanguageInput(request) {
        const input = request.context?.originalInput || request.requirement;
        const lower = input.toLowerCase();
        // AI-style understanding of the request
        const analysis = this.analyzeInputLikeAI(input);
        // Extract a clean title from the input
        let title = input;
        // Handle different input patterns
        if (lower.startsWith('i want to') || lower.startsWith('i need to')) {
            title = input.replace(/^i (want|need) to /i, '').trim();
            title = title.charAt(0).toUpperCase() + title.slice(1);
        }
        else if (lower.startsWith('create') || lower.startsWith('build')) {
            title = input.charAt(0).toUpperCase() + input.slice(1);
        }
        else if (input.includes('\n')) {
            // Multi-line input - likely a PRD or document
            const lines = input.split('\n');
            const firstMeaningfulLine = lines.find((line) => line.trim() && !line.startsWith('#') && line.length > 10);
            title = firstMeaningfulLine || 'Project Requirements Document';
        }
        // Truncate if too long
        if (title.length > 100) {
            title = title.substring(0, 97) + '...';
        }
        return {
            title,
            featureType: analysis.featureType,
            complexityFactors: analysis.complexityFactors,
            efficiencyFactors: analysis.efficiencyFactors,
        };
    }
    /**
     * Analyze input as an AI would - understanding context, implications, and hidden complexity
     */
    analyzeInputLikeAI(input) {
        const lower = input.toLowerCase();
        // Determine feature type based on semantic understanding
        let featureType = 'default';
        // Authentication/Security features
        if (lower.match(/\b(auth|login|sign\s*(up|in)|password|oauth|sso|2fa|security)\b/)) {
            featureType = 'auth';
        }
        // Payment/Financial features
        else if (lower.match(/\b(payment|billing|checkout|stripe|paypal|subscription|invoice)\b/)) {
            featureType = 'payment';
        }
        // Search/Discovery features
        else if (lower.match(/\b(search|filter|find|discover|query|elastic|algolia)\b/)) {
            featureType = 'search';
        }
        // File/Media handling
        else if (lower.match(/\b(upload|file|image|video|media|s3|cdn|attachment)\b/)) {
            featureType = 'upload';
        }
        // API/Integration features
        else if (lower.match(/\b(api|endpoint|rest|graphql|webhook|integration)\b/)) {
            featureType = 'api';
        }
        // Analytics/Reporting
        else if (lower.match(/\b(dashboard|analytics|report|metric|chart|visualization)\b/)) {
            featureType = 'reporting';
        }
        // Mobile features
        else if (lower.match(/\b(mobile|ios|android|app|native|flutter|react native)\b/)) {
            featureType = 'mobile';
        }
        // Data processing
        else if (lower.match(/\b(data|etl|pipeline|migration|import|export|batch)\b/)) {
            featureType = 'data';
        }
        // UI/Frontend features
        else if (lower.match(/\b(ui|interface|frontend|design|component|layout|responsive)\b/)) {
            featureType = 'ui';
        }
        // Detect complexity factors from context
        const complexityFactors = [];
        // Compliance and regulations
        if (lower.match(/\b(pci|payment card|compliance)\b/))
            complexityFactors.push('pci_compliance');
        if (lower.match(/\b(hipaa|healthcare|medical|patient)\b/))
            complexityFactors.push('hipaa_compliance');
        if (lower.match(/\b(gdpr|privacy|data protection)\b/))
            complexityFactors.push('gdpr_compliance');
        // Technical complexity
        if (lower.match(/\b(legacy|old system|mainframe|cobol)\b/))
            complexityFactors.push('legacy_integration');
        if (lower.match(/\b(real\s*time|websocket|live|streaming)\b/))
            complexityFactors.push('real_time_requirements');
        if (lower.match(/\b(distributed|microservice|kubernetes|docker)\b/))
            complexityFactors.push('distributed_system');
        if (lower.match(/\b(scale|million|concurrent|high traffic)\b/))
            complexityFactors.push('high_scale');
        // Process complexity
        if (lower.match(/\b(multiple|several|various|different)\s+(api|service|system)/))
            complexityFactors.push('multiple_apis');
        if (lower.match(/\b(first time|new to|never done|learning)\b/))
            complexityFactors.push('first_time_tech');
        if (lower.match(/\b(unclear|vague|tbd|figure out|not sure)\b/))
            complexityFactors.push('vague_requirements');
        if (lower.match(/\b(changing|evolving|fluid|agile)\s+(requirement|spec)/))
            complexityFactors.push('changing_requirements');
        // Detect efficiency factors
        const efficiencyFactors = [];
        // Team factors
        if (lower.match(/\b(experienced|senior|expert|veteran)\s+(team|dev|engineer)/))
            efficiencyFactors.push('experienced_team');
        if (lower.match(/\b(existing|reuse|already have|built before)\b/))
            efficiencyFactors.push('existing_codebase');
        if (lower.match(/\b(prototype|poc|proof of concept|mvp)\b/))
            efficiencyFactors.push('prototype_quality');
        if (lower.match(/\b(proven|battle.?tested|production|stable)\s+(architecture|system)/))
            efficiencyFactors.push('proven_architecture');
        if (lower.match(/\b(well documented|good docs|documentation exists)\b/))
            efficiencyFactors.push('good_documentation');
        if (lower.match(/\b(internal|not public|staff only|employee)\b/))
            efficiencyFactors.push('internal_only');
        if (lower.match(/\b(simple|basic|minimal|straightforward)\s+(ui|interface|design)/))
            efficiencyFactors.push('simple_ui');
        // Note: Additional context factors are merged in analyzeRequirement method
        return {
            featureType,
            complexityFactors: [...new Set(complexityFactors)], // Remove duplicates
            efficiencyFactors: [...new Set(efficiencyFactors)],
        };
    }
    async generatePlan(request) {
        logger.info('Generating brutal plan', { requirement: request.requirement });
        // Load config if not already loaded
        if (!this.config) {
            this.config = await getConfig();
        }
        // Analyze the requirement
        const analysis = await this.analyzeRequirement(request);
        // Generate MDX content
        const mdxContent = this.buildMDX(analysis);
        // Save the plan
        const filename = `brutal_plan_${analysis.id}.mdx`;
        const filepath = path.join(process.cwd(), filename);
        await fs.writeFile(filepath, mdxContent);
        logger.info('Brutal plan generated', {
            filename,
            multiplier: analysis.multiplier,
            realDays: analysis.realDays,
        });
        return { filename, content: mdxContent };
    }
    async analyzeRequirement(request) {
        // Process natural language input using AI-style analysis
        const processedInput = this.processNaturalLanguageInput(request);
        const featureType = processedInput.featureType;
        // Merge extracted factors with any provided in context
        const mergedContext = {
            ...request.context,
            complexityFactors: [
                ...(request.context?.complexityFactors || []),
                ...processedInput.complexityFactors,
            ],
            efficiencyFactors: [
                ...(request.context?.efficiencyFactors || []),
                ...processedInput.efficiencyFactors,
            ],
        };
        // Calculate the final multiplier with fine-tuning
        const finalMultiplier = this.calculateFinalMultiplier(featureType, mergedContext);
        const userEstimate = request.estimatedDays || 10;
        const realDays = Math.ceil(userEstimate * finalMultiplier);
        // Adjust for team context using config
        const teamAdjustments = this.config.brutal_plan.team_adjustments;
        let adjustedDays = realDays;
        if (request.context?.teamSize && request.context.teamSize === 1) {
            adjustedDays = Math.ceil(realDays * teamAdjustments.solo_dev_multiplier);
        }
        if (request.context?.hasDeadline) {
            adjustedDays = Math.ceil(adjustedDays * teamAdjustments.deadline_pressure_multiplier);
        }
        const id = `${featureType}_${Date.now()}`;
        const title = processedInput.title;
        return {
            id,
            title,
            featureType,
            multiplier: finalMultiplier,
            userEstimate,
            realDays: adjustedDays,
            realTimeline: `${adjustedDays} days (your estimate: ${userEstimate} days)`,
            brutalTruth: this.generateBrutalTruth(featureType, finalMultiplier, adjustedDays),
            hiddenTasks: this.getHiddenTasks(featureType),
            productionRisks: this.getProductionRisks(featureType),
            phases: this.generatePhases(featureType, adjustedDays),
        };
    }
    calculateFinalMultiplier(featureType, context) {
        const config = this.config.brutal_plan;
        // Start with base multiplier or custom override
        let multiplier = context?.customMultiplier ||
            config.base_multipliers[featureType] ||
            config.base_multipliers.default;
        // Apply complexity factors (increase multiplier)
        if (context?.complexityFactors) {
            for (const factor of context.complexityFactors) {
                if (config.complexity_factors[factor]) {
                    multiplier *= config.complexity_factors[factor];
                }
            }
        }
        // Apply efficiency factors (decrease multiplier)
        if (context?.efficiencyFactors) {
            for (const factor of context.efficiencyFactors) {
                if (config.efficiency_factors[factor]) {
                    multiplier *= config.efficiency_factors[factor];
                }
            }
        }
        // Ensure minimum multiplier of 1.5x
        return Math.max(1.5, multiplier);
    }
    detectFeatureType(requirement) {
        const lower = requirement.toLowerCase();
        const baseMultipliers = this.config.brutal_plan.base_multipliers;
        // Check for specific feature types
        for (const key of Object.keys(baseMultipliers)) {
            if (key !== 'default' && lower.includes(key)) {
                return key;
            }
        }
        // Additional pattern matching
        if (lower.includes('login') || (lower.includes('user') && lower.includes('management')))
            return 'auth';
        if (lower.includes('stripe') || lower.includes('billing'))
            return 'payment';
        if (lower.includes('file') || lower.includes('image'))
            return 'upload';
        if (lower.includes('websocket') || lower.includes('real-time'))
            return 'realtime';
        if (lower.includes('email') || lower.includes('sms'))
            return 'notification';
        return 'default';
    }
    extractTitle(requirement) {
        // Extract a concise title from the requirement
        const cleaned = requirement.replace(/[^\w\s]/g, ' ').trim();
        const words = cleaned.split(' ').slice(0, 5).join(' ');
        return words.charAt(0).toUpperCase() + words.slice(1);
    }
    generateBrutalTruth(featureType, multiplier, realDays) {
        const truths = {
            auth: `Your "simple login" will balloon into a complete identity management system with OAuth, MFA, password policies, session management, email verification, and audit logging. Every auth system eventually needs all of these.`,
            payment: `Payment integration is never just "add Stripe". You'll need webhook handling, idempotency, failed payment recovery, subscription lifecycle management, invoicing, tax compliance, and reconciliation. This is why it's ${multiplier}x.`,
            search: `Search is an iceberg. The visible part is the search box. Hidden beneath: indexing pipeline, relevance tuning, filters, faceted search, autocomplete, typo tolerance, and performance optimization at scale.`,
            upload: `File upload means validation, virus scanning, format conversion, size limits, progress tracking, resumable uploads, CDN integration, and access control. Users will upload things you never imagined.`,
            realtime: `Real-time features mean WebSocket infrastructure, connection management, reconnection logic, state synchronization, conflict resolution, and scaling challenges. "Just use WebSockets" is never just.`,
            migration: `Data migrations are where optimism goes to die. You'll need rollback plans, data validation, progress tracking, zero-downtime strategies, and extensive testing. Something WILL go wrong.`,
            notification: `Notifications mean delivery infrastructure, template management, user preferences, unsubscribe handling, bounce processing, and compliance (CAN-SPAM, GDPR). Email will go to spam.`,
            default: `This feature hides complexity you haven't considered. Error handling, edge cases, monitoring, documentation, and testing will consume most of your time.`,
        };
        const truth = truths[featureType] || truths.default;
        return `${truth}\n\n⏱️ Reality: ${realDays} days with a ${multiplier}x multiplier.`;
    }
    getHiddenTasks(featureType) {
        const hiddenWork = {
            auth: [
                'Password strength requirements and validation',
                'Password reset flow with secure tokens',
                'Email verification system',
                'Session management across devices',
                'Remember me functionality',
                'Account lockout after failed attempts',
                'Audit logging for compliance',
                'Social login integration (each provider is different)',
                'GDPR compliance for user data',
                'Account deletion workflow',
            ],
            payment: [
                'Webhook endpoint with signature verification',
                'Idempotency to prevent double charges',
                'Failed payment retry logic',
                'Subscription state machine',
                'Proration calculations',
                'Invoice generation and storage',
                'Tax calculation per jurisdiction',
                'Refund and dispute handling',
                'PCI compliance documentation',
                'Payment method update flow',
            ],
            search: [
                'Search index schema design',
                'Incremental indexing pipeline',
                'Query parsing and validation',
                'Relevance scoring algorithm',
                'Filter and facet implementation',
                'Search result highlighting',
                'Autocomplete with debouncing',
                'Search analytics tracking',
                'Performance optimization',
                'Handling special characters and languages',
            ],
            upload: [
                'File type validation (MIME type spoofing)',
                'Virus scanning integration',
                'Image resizing and optimization',
                'Progress tracking for large files',
                'Resumable upload support',
                'S3/CDN integration',
                'Access control and signed URLs',
                'Cleanup of orphaned files',
                'Rate limiting per user',
                'Handling network interruptions',
            ],
            notification: [
                'Email service provider integration',
                'Template management system',
                'User preference management',
                'Unsubscribe handling',
                'Bounce and complaint processing',
                'SMS fallback for critical alerts',
                'Notification grouping/batching',
                'Timezone-aware scheduling',
                'A/B testing infrastructure',
                'Delivery tracking and analytics',
            ],
            default: [
                'Comprehensive error handling',
                'Input validation for all fields',
                'Loading and error states in UI',
                'Optimistic updates with rollback',
                'API versioning strategy',
                'Rate limiting',
                'Monitoring and alerting',
                'Documentation for other developers',
                'Integration tests',
                'Performance benchmarking',
            ],
        };
        return hiddenWork[featureType] || hiddenWork.default;
    }
    getProductionRisks(featureType) {
        const risks = {
            auth: [
                'Brute force attacks will happen within days',
                'Password reset emails will go to spam',
                'Session hijacking attempts are guaranteed',
                'OAuth provider will change their API',
                'Users will lock themselves out constantly',
            ],
            payment: [
                'Webhook delivery will fail silently',
                'Double charges from retry logic',
                'Tax calculation errors in edge cases',
                'Subscription renewals will fail',
                'Chargebacks and disputes will spike',
            ],
            search: [
                'Search queries will be slower than expected',
                'Relevance will be poor initially',
                'Index size will grow exponentially',
                "Users will search for things you didn't index",
                'Special characters will break queries',
            ],
            upload: [
                'Users will upload 4GB videos',
                'Malicious files will slip through',
                'S3 costs will explode',
                'Upload progress will hang at 99%',
                'Mobile uploads will fail on slow connections',
            ],
            default: [
                'Edge cases will emerge in production',
                'Performance will degrade under load',
                'Third-party APIs will have outages',
                'Error rates will spike randomly',
                'Users will do unexpected things',
            ],
        };
        return risks[featureType] || risks.default;
    }
    generatePhases(featureType, totalDays) {
        // Allocate time across phases using config
        const phases = this.config.brutal_plan.phases;
        const phase1Days = Math.ceil((totalDays * phases.research_percent) / 100);
        const phase2Days = Math.ceil((totalDays * phases.implementation_percent) / 100);
        const phase3Days = Math.ceil((totalDays * phases.hardening_percent) / 100);
        return [
            {
                name: 'Phase 1: Research & Hidden Complexity Discovery',
                duration: `${phase1Days} days`,
                tasks: [
                    'Deep dive into all requirements (including hidden ones)',
                    'Research all third-party integrations',
                    'Security threat modeling',
                    'Performance requirement analysis',
                    'Create technical design document',
                    'Identify all edge cases upfront',
                ],
                warnings: [
                    'This phase ALWAYS reveals complexity that doubles the estimate',
                    'Stakeholders will add requirements during this phase',
                ],
            },
            {
                name: 'Phase 2: Core Implementation',
                duration: `${phase2Days} days`,
                tasks: this.getImplementationTasks(featureType),
                warnings: [
                    'Each task will reveal 2-3 subtasks',
                    'Integration points will be more complex than documented',
                    'You will refactor at least once',
                ],
            },
            {
                name: 'Phase 3: Production Hardening',
                duration: `${phase3Days} days`,
                tasks: [
                    'Comprehensive error handling',
                    'Load testing and performance optimization',
                    'Security audit and penetration testing',
                    'Monitoring and alerting setup',
                    'Documentation and runbooks',
                    'Rollback plan implementation',
                    'Team knowledge transfer',
                ],
                warnings: [
                    'Testing will reveal issues requiring Phase 2 rework',
                    'Production will still surprise you',
                ],
            },
        ];
    }
    getImplementationTasks(featureType) {
        const tasks = {
            auth: [
                'User model and database schema',
                'Registration endpoint with validation',
                'Login endpoint with rate limiting',
                'Password hashing with bcrypt',
                'JWT token generation and validation',
                'Session management implementation',
                'Password reset flow',
                'Email verification system',
                'OAuth provider integration',
                'Account security features',
            ],
            payment: [
                'Payment provider SDK integration',
                'Customer and subscription models',
                'Checkout flow implementation',
                'Webhook handling with verification',
                'Payment state machine',
                'Invoice generation',
                'Subscription lifecycle handling',
                'Payment failure recovery',
                'Admin dashboard for payments',
                'Revenue reporting',
            ],
            default: [
                'Core feature implementation',
                'API endpoint development',
                'Database schema and queries',
                'Business logic layer',
                'Frontend UI implementation',
                'Integration with existing systems',
                'Basic error handling',
                'Initial testing',
            ],
        };
        return tasks[featureType] || tasks.default;
    }
    buildMDX(analysis) {
        return `---
id: ${analysis.id}
created: ${new Date().toISOString()}
feature_type: ${analysis.featureType}
multiplier: ${analysis.multiplier}
estimated_days: ${analysis.userEstimate}
real_days: ${analysis.realDays}
---

# 🔥 BRUTAL PLAN: ${analysis.title}

## ⚠️ Reality Check

${analysis.brutalTruth}

## 📊 Timeline Reality

| Metric | Value |
|--------|-------|
| Your estimate | ${analysis.userEstimate} days |
| Reality multiplier | ${analysis.multiplier}x |
| **Actual timeline** | **${analysis.realDays} days** |
| Buffer needed | +20% (${Math.ceil(analysis.realDays * 0.2)} days) |
| **Total with buffer** | **${Math.ceil(analysis.realDays * 1.2)} days** |

## 😱 Hidden Work You Didn't Consider

${analysis.hiddenTasks.map((task) => `- ${task}`).join('\n')}

## 💀 What WILL Go Wrong in Production

${analysis.productionRisks.map((risk) => `- ${risk}`).join('\n')}

## 📋 The Actual Implementation Plan

${analysis.phases
            .map((phase) => `
### ${phase.name}
**Duration: ${phase.duration}**

${phase.tasks.map((task) => `- [ ] ${task}`).join('\n')}

${phase.warnings.length > 0
            ? `
> ⚠️ **Reality Check:**
${phase.warnings.map((w) => `> - ${w}`).join('\n')}
`
            : ''}
`)
            .join('\n')}

## 🎯 How to Actually Succeed

1. **Accept the timeline** - The multiplier is based on real data
2. **Add 20% buffer** - Because this estimate is still optimistic  
3. **Communicate early** - Tell stakeholders the real timeline NOW
4. **Cut scope** - Remove features rather than rushing
5. **Test in production-like environment** - Find issues before users do

## 📈 Track Your Actuals

Use this table to track reality vs. estimates:

| Phase | Estimated | Actual | Notes |
|-------|-----------|--------|-------|
| Research | ${analysis.phases[0].duration} | ___ days | |
| Implementation | ${analysis.phases[1].duration} | ___ days | |
| Hardening | ${analysis.phases[2].duration} | ___ days | |
| **Total** | **${analysis.realDays} days** | **___ days** | |

## 🔮 Final Wisdom

> "The first 90% of the code accounts for the first 90% of the development time. 
> The remaining 10% of the code accounts for the other 90% of the development time."
> 
> This plan accounts for both 90%s.

---

*Generated by Brutal Plan - where optimistic estimates meet harsh reality*
`;
    }
}
//# sourceMappingURL=brutal-plan-engine.js.map
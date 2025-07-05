/**
 * Brutal Plan Engine - Reality-based project planning
 * Exposes hidden complexity and provides realistic timelines
 */

import { logger } from './logger.js';
import fs from 'fs/promises';
import path from 'path';

// Battle-tested reality multipliers from real projects
const BRUTAL_MULTIPLIERS: Record<string, number> = {
  'auth': 3.5,          // Always includes password reset, MFA, sessions
  'payment': 5.0,       // PCI compliance, webhooks, edge cases
  'search': 3.0,        // Relevance, performance, filters
  'upload': 4.0,        // Validation, storage, security, previews
  'realtime': 4.5,      // WebSockets, reconnection, scaling
  'migration': 6.0,     // Always goes wrong, needs rollback plan
  'api': 3.0,           // Versioning, docs, rate limiting
  'dashboard': 3.5,     // Filters, exports, real-time updates
  'integration': 4.0,   // API changes, rate limits, error handling
  'notification': 3.5,  // Email, SMS, preferences, unsubscribe
  'crud': 2.0,          // Even simple CRUD has complexity
  'default': 2.5        // Everything takes 2.5x longer minimum
};

interface BrutalPlanRequest {
  requirement: string;
  estimatedDays?: number;
  context?: {
    teamSize?: number;
    hasDeadline?: boolean;
    techStack?: string[];
    projectType?: string;
  };
}

interface PlanPhase {
  name: string;
  duration: string;
  tasks: string[];
  warnings: string[];
}

interface BrutalAnalysis {
  id: string;
  title: string;
  featureType: string;
  multiplier: number;
  userEstimate: number;
  realDays: number;
  realTimeline: string;
  brutalTruth: string;
  hiddenTasks: string[];
  productionRisks: string[];
  phases: PlanPhase[];
}

export class BrutalPlanEngine {
  async generatePlan(request: BrutalPlanRequest): Promise<{ filename: string; content: string }> {
    logger.info('Generating brutal plan', { requirement: request.requirement });
    
    // Analyze the requirement
    const analysis = this.analyzeRequirement(request);
    
    // Generate MDX content
    const mdxContent = this.buildMDX(analysis);
    
    // Save the plan
    const filename = `brutal_plan_${analysis.id}.mdx`;
    const filepath = path.join(process.cwd(), filename);
    await fs.writeFile(filepath, mdxContent);
    
    logger.info('Brutal plan generated', { 
      filename, 
      multiplier: analysis.multiplier, 
      realDays: analysis.realDays 
    });
    
    return { filename, content: mdxContent };
  }
  
  private analyzeRequirement(request: BrutalPlanRequest): BrutalAnalysis {
    const featureType = this.detectFeatureType(request.requirement);
    const multiplier = BRUTAL_MULTIPLIERS[featureType] || BRUTAL_MULTIPLIERS.default;
    const userEstimate = request.estimatedDays || 10;
    const realDays = Math.ceil(userEstimate * multiplier);
    
    // Adjust for team context
    let adjustedDays = realDays;
    if (request.context?.teamSize && request.context.teamSize === 1) {
      adjustedDays = Math.ceil(realDays * 1.3); // Solo dev tax
    }
    if (request.context?.hasDeadline) {
      adjustedDays = Math.ceil(adjustedDays * 1.2); // Deadline pressure tax
    }
    
    const id = `${featureType}_${Date.now()}`;
    const title = this.extractTitle(request.requirement);
    
    return {
      id,
      title,
      featureType,
      multiplier,
      userEstimate,
      realDays: adjustedDays,
      realTimeline: `${adjustedDays} days (your estimate: ${userEstimate} days)`,
      brutalTruth: this.generateBrutalTruth(featureType, multiplier, adjustedDays),
      hiddenTasks: this.getHiddenTasks(featureType),
      productionRisks: this.getProductionRisks(featureType),
      phases: this.generatePhases(featureType, adjustedDays)
    };
  }
  
  private detectFeatureType(requirement: string): string {
    const lower = requirement.toLowerCase();
    
    // Check for specific feature types
    for (const [key, _] of Object.entries(BRUTAL_MULTIPLIERS)) {
      if (key !== 'default' && lower.includes(key)) {
        return key;
      }
    }
    
    // Additional pattern matching
    if (lower.includes('login') || lower.includes('user') && lower.includes('management')) return 'auth';
    if (lower.includes('stripe') || lower.includes('billing')) return 'payment';
    if (lower.includes('file') || lower.includes('image')) return 'upload';
    if (lower.includes('websocket') || lower.includes('real-time')) return 'realtime';
    if (lower.includes('email') || lower.includes('sms')) return 'notification';
    
    return 'default';
  }
  
  private extractTitle(requirement: string): string {
    // Extract a concise title from the requirement
    const cleaned = requirement.replace(/[^\w\s]/g, ' ').trim();
    const words = cleaned.split(' ').slice(0, 5).join(' ');
    return words.charAt(0).toUpperCase() + words.slice(1);
  }
  
  private generateBrutalTruth(featureType: string, multiplier: number, realDays: number): string {
    const truths: Record<string, string> = {
      'auth': `Your "simple login" will balloon into a complete identity management system with OAuth, MFA, password policies, session management, email verification, and audit logging. Every auth system eventually needs all of these.`,
      'payment': `Payment integration is never just "add Stripe". You'll need webhook handling, idempotency, failed payment recovery, subscription lifecycle management, invoicing, tax compliance, and reconciliation. This is why it's ${multiplier}x.`,
      'search': `Search is an iceberg. The visible part is the search box. Hidden beneath: indexing pipeline, relevance tuning, filters, faceted search, autocomplete, typo tolerance, and performance optimization at scale.`,
      'upload': `File upload means validation, virus scanning, format conversion, size limits, progress tracking, resumable uploads, CDN integration, and access control. Users will upload things you never imagined.`,
      'realtime': `Real-time features mean WebSocket infrastructure, connection management, reconnection logic, state synchronization, conflict resolution, and scaling challenges. "Just use WebSockets" is never just.`,
      'migration': `Data migrations are where optimism goes to die. You'll need rollback plans, data validation, progress tracking, zero-downtime strategies, and extensive testing. Something WILL go wrong.`,
      'notification': `Notifications mean delivery infrastructure, template management, user preferences, unsubscribe handling, bounce processing, and compliance (CAN-SPAM, GDPR). Email will go to spam.`,
      'default': `This feature hides complexity you haven't considered. Error handling, edge cases, monitoring, documentation, and testing will consume most of your time.`
    };
    
    const truth = truths[featureType] || truths.default;
    return `${truth}\n\n⏱️ Reality: ${realDays} days with a ${multiplier}x multiplier.`;
  }
  
  private getHiddenTasks(featureType: string): string[] {
    const hiddenWork: Record<string, string[]> = {
      'auth': [
        'Password strength requirements and validation',
        'Password reset flow with secure tokens',
        'Email verification system',
        'Session management across devices',
        'Remember me functionality',
        'Account lockout after failed attempts',
        'Audit logging for compliance',
        'Social login integration (each provider is different)',
        'GDPR compliance for user data',
        'Account deletion workflow'
      ],
      'payment': [
        'Webhook endpoint with signature verification',
        'Idempotency to prevent double charges',
        'Failed payment retry logic',
        'Subscription state machine',
        'Proration calculations',
        'Invoice generation and storage',
        'Tax calculation per jurisdiction',
        'Refund and dispute handling',
        'PCI compliance documentation',
        'Payment method update flow'
      ],
      'search': [
        'Search index schema design',
        'Incremental indexing pipeline',
        'Query parsing and validation',
        'Relevance scoring algorithm',
        'Filter and facet implementation',
        'Search result highlighting',
        'Autocomplete with debouncing',
        'Search analytics tracking',
        'Performance optimization',
        'Handling special characters and languages'
      ],
      'upload': [
        'File type validation (MIME type spoofing)',
        'Virus scanning integration',
        'Image resizing and optimization',
        'Progress tracking for large files',
        'Resumable upload support',
        'S3/CDN integration',
        'Access control and signed URLs',
        'Cleanup of orphaned files',
        'Rate limiting per user',
        'Handling network interruptions'
      ],
      'notification': [
        'Email service provider integration',
        'Template management system',
        'User preference management',
        'Unsubscribe handling',
        'Bounce and complaint processing',
        'SMS fallback for critical alerts',
        'Notification grouping/batching',
        'Timezone-aware scheduling',
        'A/B testing infrastructure',
        'Delivery tracking and analytics'
      ],
      'default': [
        'Comprehensive error handling',
        'Input validation for all fields',
        'Loading and error states in UI',
        'Optimistic updates with rollback',
        'API versioning strategy',
        'Rate limiting',
        'Monitoring and alerting',
        'Documentation for other developers',
        'Integration tests',
        'Performance benchmarking'
      ]
    };
    
    return hiddenWork[featureType] || hiddenWork.default;
  }
  
  private getProductionRisks(featureType: string): string[] {
    const risks: Record<string, string[]> = {
      'auth': [
        'Brute force attacks will happen within days',
        'Password reset emails will go to spam',
        'Session hijacking attempts are guaranteed',
        'OAuth provider will change their API',
        'Users will lock themselves out constantly'
      ],
      'payment': [
        'Webhook delivery will fail silently',
        'Double charges from retry logic',
        'Tax calculation errors in edge cases',
        'Subscription renewals will fail',
        'Chargebacks and disputes will spike'
      ],
      'search': [
        'Search queries will be slower than expected',
        'Relevance will be poor initially',
        'Index size will grow exponentially',
        'Users will search for things you didn\'t index',
        'Special characters will break queries'
      ],
      'upload': [
        'Users will upload 4GB videos',
        'Malicious files will slip through',
        'S3 costs will explode',
        'Upload progress will hang at 99%',
        'Mobile uploads will fail on slow connections'
      ],
      'default': [
        'Edge cases will emerge in production',
        'Performance will degrade under load',
        'Third-party APIs will have outages',
        'Error rates will spike randomly',
        'Users will do unexpected things'
      ]
    };
    
    return risks[featureType] || risks.default;
  }
  
  private generatePhases(featureType: string, totalDays: number): PlanPhase[] {
    // Allocate time across phases
    const phase1Days = Math.ceil(totalDays * 0.2);  // 20% research/design
    const phase2Days = Math.ceil(totalDays * 0.5);  // 50% implementation
    const phase3Days = Math.ceil(totalDays * 0.3);  // 30% hardening/testing
    
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
          'Identify all edge cases upfront'
        ],
        warnings: [
          'This phase ALWAYS reveals complexity that doubles the estimate',
          'Stakeholders will add requirements during this phase'
        ]
      },
      {
        name: 'Phase 2: Core Implementation',
        duration: `${phase2Days} days`,
        tasks: this.getImplementationTasks(featureType),
        warnings: [
          'Each task will reveal 2-3 subtasks',
          'Integration points will be more complex than documented',
          'You will refactor at least once'
        ]
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
          'Team knowledge transfer'
        ],
        warnings: [
          'Testing will reveal issues requiring Phase 2 rework',
          'Production will still surprise you'
        ]
      }
    ];
  }
  
  private getImplementationTasks(featureType: string): string[] {
    const tasks: Record<string, string[]> = {
      'auth': [
        'User model and database schema',
        'Registration endpoint with validation',
        'Login endpoint with rate limiting',
        'Password hashing with bcrypt',
        'JWT token generation and validation',
        'Session management implementation',
        'Password reset flow',
        'Email verification system',
        'OAuth provider integration',
        'Account security features'
      ],
      'payment': [
        'Payment provider SDK integration',
        'Customer and subscription models',
        'Checkout flow implementation',
        'Webhook handling with verification',
        'Payment state machine',
        'Invoice generation',
        'Subscription lifecycle handling',
        'Payment failure recovery',
        'Admin dashboard for payments',
        'Revenue reporting'
      ],
      'default': [
        'Core feature implementation',
        'API endpoint development',
        'Database schema and queries',
        'Business logic layer',
        'Frontend UI implementation',
        'Integration with existing systems',
        'Basic error handling',
        'Initial testing'
      ]
    };
    
    return tasks[featureType] || tasks.default;
  }
  
  private buildMDX(analysis: BrutalAnalysis): string {
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

${analysis.hiddenTasks.map(task => `- ${task}`).join('\n')}

## 💀 What WILL Go Wrong in Production

${analysis.productionRisks.map(risk => `- ${risk}`).join('\n')}

## 📋 The Actual Implementation Plan

${analysis.phases.map(phase => `
### ${phase.name}
**Duration: ${phase.duration}**

${phase.tasks.map(task => `- [ ] ${task}`).join('\n')}

${phase.warnings.length > 0 ? `
> ⚠️ **Reality Check:**
${phase.warnings.map(w => `> - ${w}`).join('\n')}
` : ''}
`).join('\n')}

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
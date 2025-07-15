import { logger } from '@critical-claude/core';
import { MVPPlan, Feature, TechStackChoice, Phase, Risk, Timeline, ArchitectureDecision } from './types.js';

export class MVPPlanner {
  generateMVPPlan(input: {
    projectName: string;
    description: string;
    targetUsers: string;
    constraints?: {
      budget?: number;
      timeline?: string;
      teamSize?: number;
    };
  }): MVPPlan {
    logger.info('Generating MVP plan', { projectName: input.projectName });
    
    const coreFeatures = this.identifyCoreFeatures(input.description);
    const techStack = this.recommendTechStack(coreFeatures);
    const phases = this.planPhases(coreFeatures, input.constraints);
    const risks = this.identifyRisks(input, techStack);
    const timeline = this.createTimeline(phases, input.constraints?.timeline);
    
    return {
      projectName: input.projectName,
      title: `MVP Plan: ${input.projectName}`,
      description: input.description,
      targetUsers: input.targetUsers,
      features: coreFeatures, // Also add as 'features' for backward compatibility
      coreFeatures,
      techStack: this.convertTechStackForOutput(techStack), // Add techStack format
      technicalStack: techStack,
      architecture: this.generateArchitectureDecisions(techStack, coreFeatures),
      phases,
      risks,
      timeline,
      estimatedBudget: this.calculateBudget(phases, input.constraints?.budget)
    };
  }
  
  private identifyCoreFeatures(description: string): Feature[] {
    const features: Feature[] = [];
    
    // Parse description for key features (simplified for example)
    const keywords = {
      auth: ['login', 'auth', 'user', 'account', 'signup'],
      payment: ['payment', 'billing', 'subscription', 'checkout'],
      social: ['share', 'comment', 'like', 'follow', 'social'],
      data: ['dashboard', 'analytics', 'report', 'visualization'],
      search: ['search', 'filter', 'find', 'query'],
      messaging: ['message', 'chat', 'notification', 'email']
    };
    
    const desc = description.toLowerCase();
    
    // Check for authentication needs
    if (keywords.auth.some(k => desc.includes(k))) {
      features.push({
        name: 'User Authentication',
        description: 'Secure user registration and login system',
        userStory: 'As a user, I want to create an account and log in securely',
        priority: 'P0',
        complexity: 2,
        dependencies: []
      });
    }
    
    // Check for payment features
    if (keywords.payment.some(k => desc.includes(k))) {
      features.push({
        name: 'Payment Processing',
        description: 'Handle payments and subscriptions',
        userStory: 'As a user, I want to make secure payments',
        priority: 'P1',
        complexity: 4,
        dependencies: ['User Authentication']
      });
    }
    
    // Always include core CRUD for MVP
    features.push({
      name: 'Core Data Management',
      description: 'Create, read, update, delete core entities',
      userStory: 'As a user, I want to manage my data',
      priority: 'P0',
      complexity: 3,
      dependencies: ['User Authentication']
    });
    
    return features;
  }
  
  private recommendTechStack(features: Feature[]): TechStackChoice[] {
    const stack: TechStackChoice[] = [];
    
    // Frontend recommendation
    const hasComplexUI = features.some(f => f.complexity >= 4);
    stack.push({
      category: 'Frontend',
      technology: hasComplexUI ? 'React + TypeScript' : 'Next.js',
      rationale: hasComplexUI 
        ? 'Complex UI requires flexible component architecture' 
        : 'Next.js provides fastest path to production with SSR/SSG',
      alternatives: ['Vue.js', 'SvelteKit'],
      tradeoffs: ['Learning curve vs development speed', 'Flexibility vs convention']
    });
    
    // Backend recommendation
    const needsRealtime = features.some(f => 
      f.name.toLowerCase().includes('chat') || 
      f.name.toLowerCase().includes('notification')
    );
    
    stack.push({
      category: 'Backend',
      technology: needsRealtime ? 'Node.js + Socket.io' : 'Node.js + Express',
      rationale: needsRealtime 
        ? 'Real-time features require WebSocket support'
        : 'Simple REST API with familiar ecosystem',
      alternatives: ['Python + FastAPI', 'Go + Gin'],
      tradeoffs: ['Performance vs ecosystem', 'Type safety vs flexibility']
    });
    
    // Database recommendation
    const needsRelational = features.some(f => 
      f.dependencies.length > 2 || f.name.includes('Analytics')
    );
    
    stack.push({
      category: 'Database',
      technology: needsRelational ? 'PostgreSQL' : 'MongoDB',
      rationale: needsRelational
        ? 'Complex relationships require ACID compliance'
        : 'Flexible schema for rapid iteration',
      alternatives: ['MySQL', 'DynamoDB'],
      tradeoffs: ['Consistency vs flexibility', 'Cost vs features']
    });
    
    // Deployment recommendation
    stack.push({
      category: 'Deployment',
      technology: 'Vercel/Railway',
      rationale: 'Zero-config deployment for MVP speed',
      alternatives: ['AWS', 'Google Cloud', 'Heroku'],
      tradeoffs: ['Control vs convenience', 'Cost vs scalability']
    });
    
    return stack;
  }
  
  private planPhases(features: Feature[], constraints?: any): Phase[] {
    const phases: Phase[] = [];
    
    // Phase 1: Foundation (2-3 weeks)
    phases.push({
      name: 'Foundation',
      duration: '2-3 weeks',
      goals: [
        'Set up development environment',
        'Implement authentication',
        'Create basic UI framework'
      ],
      deliverables: [
        'Development environment',
        'CI/CD pipeline',
        'Authentication system',
        'Basic UI components'
      ],
      features: features
        .filter(f => f.priority === 'P0' && f.complexity <= 2)
        .map(f => f.name),
      successCriteria: [
        'Users can register and log in',
        'Automated deployment working',
        'Basic UI responsive on mobile'
      ]
    });
    
    // Phase 2: Core Features (3-4 weeks)
    phases.push({
      name: 'Core Features',
      duration: '3-4 weeks',
      goals: [
        'Implement primary user workflows',
        'Add data persistence',
        'Basic error handling'
      ],
      deliverables: [
        'Core CRUD operations',
        'Data models and API',
        'Error handling system'
      ],
      features: features
        .filter(f => f.priority === 'P0' && f.complexity >= 3)
        .map(f => f.name),
      successCriteria: [
        'Users can perform core actions',
        'Data persists between sessions',
        'Graceful error handling'
      ]
    });
    
    // Phase 3: Polish & Launch (2 weeks)
    phases.push({
      name: 'Polish & Launch',
      duration: '2 weeks',
      goals: [
        'Fix critical bugs',
        'Improve performance',
        'Prepare for launch'
      ],
      deliverables: [
        'Bug-free core experience',
        'Performance optimizations',
        'Launch materials'
      ],
      features: [],
      successCriteria: [
        'No critical bugs',
        'Page load < 3 seconds',
        'Ready for beta users'
      ]
    });
    
    return phases;
  }
  
  private identifyRisks(input: any, techStack: TechStackChoice[]): Risk[] {
    const risks: Risk[] = [];
    
    // Technical risks
    if (techStack.some(t => t.technology.includes('Socket.io'))) {
      risks.push({
        category: 'technical',
        description: 'Real-time features add complexity',
        impact: 'medium',
        probability: 'medium',
        mitigation: 'Start with polling, upgrade to WebSockets if needed'
      });
    }
    
    // Timeline risks
    if (!input.constraints?.teamSize || input.constraints.teamSize < 3) {
      risks.push({
        category: 'timeline',
        description: 'Small team may cause delays',
        impact: 'high',
        probability: 'high',
        mitigation: 'Focus ruthlessly on MVP features, defer nice-to-haves'
      });
    }
    
    // Business risks
    risks.push({
      category: 'business',
      description: 'Market validation not confirmed',
      impact: 'critical',
      probability: 'medium',
      mitigation: 'Launch beta quickly to validate assumptions'
    });
    
    return risks;
  }
  
  private createTimeline(phases: Phase[], deadline?: string): Timeline {
    let currentWeek = 1;
    const phaseTimelines = phases.map(phase => {
      const duration = parseInt(phase.duration.split('-')[1]?.split(' ')[0] || '3');
      const timeline = {
        phase: phase.name,
        startWeek: currentWeek,
        endWeek: currentWeek + duration - 1,
        milestones: phase.deliverables.slice(0, 2)
      };
      currentWeek += duration;
      return timeline;
    });
    
    return {
      totalDuration: `${currentWeek - 1} weeks`,
      mvpDeadline: deadline || `Week ${currentWeek - 1}`,
      phases: phaseTimelines
    };
  }
  
  private generateArchitectureDecisions(
    techStack: TechStackChoice[], 
    features: Feature[]
  ): ArchitectureDecision[] {
    const decisions: ArchitectureDecision[] = [];
    
    // Monolith vs Microservices for MVP
    decisions.push({
      decision: 'Start with Monolithic Architecture',
      rationale: 'Faster to develop and deploy for MVP',
      consequences: [
        'Simpler deployment',
        'Easier debugging',
        'May need refactoring later'
      ],
      alternatives: ['Microservices', 'Serverless functions']
    });
    
    // API Design
    decisions.push({
      decision: 'RESTful API with JSON',
      rationale: 'Well-understood, good tooling support',
      consequences: [
        'Easy to implement',
        'Good client support',
        'May need GraphQL later for complex queries'
      ],
      alternatives: ['GraphQL', 'gRPC']
    });
    
    return decisions;
  }
  
  formatMVPPlan(plan: MVPPlan): string {
    let output = `# ${plan.title}\n\n`;
    output += `**Target Users:** ${plan.targetUsers}\n\n`;
    output += `## 📋 Executive Summary\n${plan.description}\n\n`;
    
    output += `## 🎯 Core Features (MVP)\n`;
    plan.coreFeatures
      .filter(f => f.priority === 'P0')
      .forEach(f => {
        output += `- **${f.name}** (Complexity: ${f.complexity}/5)\n`;
        output += `  - ${f.userStory}\n`;
      });
    
    output += `\n## 🛠️ Technical Stack\n`;
    plan.technicalStack.forEach(t => {
      output += `- **${t.category}:** ${t.technology}\n`;
      output += `  - Rationale: ${t.rationale}\n`;
    });
    
    output += `\n## 📅 Timeline: ${plan.timeline.totalDuration}\n`;
    plan.phases.forEach(phase => {
      output += `\n### ${phase.name} (${phase.duration})\n`;
      output += `**Goals:**\n`;
      phase.goals.forEach(g => output += `- ${g}\n`);
      output += `**Success Criteria:**\n`;
      phase.successCriteria.forEach(s => output += `- ${s}\n`);
    });
    
    output += `\n## ⚠️ Risks & Mitigations\n`;
    plan.risks
      .filter(r => r.impact === 'high' || r.impact === 'critical')
      .forEach(r => {
        output += `- **${r.description}** (${r.impact} impact)\n`;
        output += `  - Mitigation: ${r.mitigation}\n`;
      });
    
    output += `\n## 🏗️ Architecture Decisions\n`;
    plan.architecture.forEach(a => {
      output += `- **${a.decision}**\n`;
      output += `  - Rationale: ${a.rationale}\n`;
    });
    
    output += `\n## 🚀 Next Steps\n`;
    output += `1. Validate technical assumptions with POC\n`;
    output += `2. Set up development environment\n`;
    output += `3. Begin Phase 1: Foundation\n`;
    output += `4. Schedule weekly progress reviews\n`;
    
    return output;
  }
  
  private convertTechStackForOutput(techStack: TechStackChoice[]): Record<string, string> {
    const output: Record<string, string> = {};
    
    techStack.forEach(choice => {
      output[choice.category] = choice.technology;
    });
    
    return output;
  }
  
  private calculateBudget(phases: Phase[], suggestedBudget?: number): number {
    if (suggestedBudget) return suggestedBudget;
    
    // Simple budget calculation based on phases
    const totalWeeks = phases.reduce((total, phase) => {
      // Extract number from duration string like "4 weeks"
      const weeks = parseInt(phase.duration.match(/\d+/)?.[0] || '2');
      return total + weeks;
    }, 0);
    
    // Assume $5000 per week for a 2-person team
    return totalWeeks * 5000;
  }
}
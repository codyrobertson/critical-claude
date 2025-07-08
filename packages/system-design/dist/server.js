import { MVPPlanner } from './mvp-planner.js';
import { SystemDesignAnalyzer } from './system-design-analyzer.js';
export class SystemDesignServer {
    mvpPlanner;
    analyzer;
    constructor() {
        this.mvpPlanner = new MVPPlanner();
        this.analyzer = new SystemDesignAnalyzer();
    }
    getTools() {
        return [
            {
                name: 'cc_mvp_plan',
                description: 'Generate an MVP plan for a new product or feature',
                inputSchema: {
                    type: 'object',
                    properties: {
                        projectName: {
                            type: 'string',
                            description: 'Name of the project or product'
                        },
                        description: {
                            type: 'string',
                            description: 'Detailed description of what you want to build'
                        },
                        targetUsers: {
                            type: 'string',
                            description: 'Description of the target users'
                        },
                        constraints: {
                            type: 'object',
                            properties: {
                                budget: {
                                    type: 'number',
                                    description: 'Budget in USD'
                                },
                                timeline: {
                                    type: 'string',
                                    description: 'Timeline constraint (e.g., "3 months", "6 weeks")'
                                },
                                teamSize: {
                                    type: 'number',
                                    description: 'Number of developers on the team'
                                }
                            }
                        }
                    },
                    required: ['projectName', 'description', 'targetUsers']
                }
            },
            {
                name: 'cc_system_design_analyze',
                description: 'Analyze existing system architecture and provide recommendations',
                inputSchema: {
                    type: 'object',
                    properties: {
                        rootPath: {
                            type: 'string',
                            description: 'Root directory path of the codebase to analyze'
                        },
                        focus: {
                            type: 'string',
                            enum: ['scalability', 'performance', 'maintainability', 'security', 'all'],
                            description: 'Focus area for the analysis',
                            default: 'all'
                        }
                    },
                    required: ['rootPath']
                }
            },
            {
                name: 'cc_tech_stack_recommend',
                description: 'Recommend technology stack for a project',
                inputSchema: {
                    type: 'object',
                    properties: {
                        projectType: {
                            type: 'string',
                            enum: ['web-app', 'mobile-app', 'api', 'desktop-app', 'microservices'],
                            description: 'Type of project'
                        },
                        requirements: {
                            type: 'array',
                            items: {
                                type: 'string'
                            },
                            description: 'List of requirements (e.g., "real-time", "high-throughput", "offline-support")'
                        },
                        teamExperience: {
                            type: 'string',
                            enum: ['beginner', 'intermediate', 'advanced'],
                            description: 'Team experience level'
                        },
                        constraints: {
                            type: 'object',
                            properties: {
                                budget: {
                                    type: 'string',
                                    enum: ['low', 'medium', 'high']
                                },
                                timeline: {
                                    type: 'string',
                                    enum: ['weeks', 'months', 'years']
                                }
                            }
                        }
                    },
                    required: ['projectType', 'requirements', 'teamExperience']
                }
            }
        ];
    }
    async handleToolCall(name, args) {
        switch (name) {
            case 'cc_mvp_plan': {
                const plan = this.mvpPlanner.generateMVPPlan(args);
                return {
                    content: [
                        {
                            type: 'text',
                            text: this.formatMVPPlan(plan)
                        }
                    ]
                };
            }
            case 'cc_system_design_analyze': {
                const analysis = await this.analyzer.analyzeSystemArchitecture(args.rootPath, args.focus);
                return {
                    content: [
                        {
                            type: 'text',
                            text: this.formatSystemAnalysis(analysis)
                        }
                    ]
                };
            }
            case 'cc_tech_stack_recommend': {
                const recommendations = this.analyzer.recommendTechStack(args.projectType, args.requirements, args.teamExperience, args.constraints);
                return {
                    content: [
                        {
                            type: 'text',
                            text: this.formatTechStackRecommendations(recommendations)
                        }
                    ]
                };
            }
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    }
    formatMVPPlan(plan) {
        const projectName = plan.projectName || plan.title || 'UNKNOWN PROJECT';
        let report = `🚀 MVP PLAN: ${projectName.toUpperCase()}\n`;
        report += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
        report += `📝 PROJECT OVERVIEW\n`;
        report += `Target Users: ${plan.targetUsers}\n`;
        report += `Timeline: ${plan.timeline}\n`;
        report += `Budget Range: $${plan.estimatedBudget.toLocaleString()}\n\n`;
        report += `🎯 CORE FEATURES (MVP)\n`;
        report += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
        (plan.features || plan.coreFeatures || []).forEach((feature, index) => {
            const icon = feature.priority === 'high' ? '🔴' : feature.priority === 'medium' ? '🟡' : '🔵';
            report += `${icon} ${feature.name}\n`;
            report += `   ${feature.description}\n`;
            report += `   Effort: ${feature.effort || 'Unknown'}\n`;
            report += `   Dependencies: ${feature.dependencies?.join(', ') || 'None'}\n\n`;
        });
        report += `🛠️ RECOMMENDED TECH STACK\n`;
        report += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
        Object.entries(plan.techStack || plan.technicalStack || {}).forEach(([category, tech]) => {
            report += `• ${category}: ${tech}\n`;
        });
        report += `\n📅 DEVELOPMENT PHASES\n`;
        report += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
        (plan.phases || []).forEach((phase, index) => {
            report += `🔢 Phase ${index + 1}: ${phase.name}\n`;
            report += `   Duration: ${phase.duration}\n`;
            report += `   Deliverables: ${phase.deliverables?.join(', ') || 'TBD'}\n`;
            report += `   Team Size: ${phase.teamSize || 'TBD'} developers\n\n`;
        });
        report += `⚠️ RISKS & MITIGATION\n`;
        report += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
        (plan.risks || []).forEach((risk) => {
            report += `• ${risk.description}\n`;
            report += `   Impact: ${risk.impact}\n`;
            report += `   Mitigation: ${risk.mitigation}\n\n`;
        });
        return report;
    }
    formatSystemAnalysis(analysis) {
        let report = '🏢 SYSTEM ARCHITECTURE ANALYSIS\n';
        report += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
        report += `📊 OVERVIEW\n${analysis.summary}\n\n`;
        if (analysis.strengths.length > 0) {
            report += '✅ STRENGTHS\n';
            analysis.strengths.forEach((strength) => {
                report += `   • ${strength}\n`;
            });
            report += '\n';
        }
        if (analysis.weaknesses.length > 0) {
            report += '❌ WEAKNESSES\n';
            analysis.weaknesses.forEach((weakness) => {
                report += `   • ${weakness}\n`;
            });
            report += '\n';
        }
        if (analysis.recommendations.length > 0) {
            report += '💡 RECOMMENDATIONS\n';
            analysis.recommendations.forEach((rec) => {
                report += `   • ${rec}\n`;
            });
            report += '\n';
        }
        return report;
    }
    formatTechStackRecommendations(recommendations) {
        let report = '🛠️ TECHNOLOGY STACK RECOMMENDATIONS\n';
        report += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
        report += `📝 PROJECT TYPE: ${recommendations.projectType}\n`;
        report += `💪 TEAM EXPERIENCE: ${recommendations.teamExperience}\n\n`;
        report += '🏆 RECOMMENDED STACK\n';
        report += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
        Object.entries(recommendations.recommended).forEach(([category, tech]) => {
            report += `• ${category}: ${tech}\n`;
        });
        report += `\n💼 ALTERNATIVES\n`;
        report += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
        recommendations.alternatives.forEach((alt) => {
            report += `• ${alt.name}: ${alt.description}\n`;
            report += `   Pros: ${alt.pros.join(', ')}\n`;
            report += `   Cons: ${alt.cons.join(', ')}\n\n`;
        });
        if (recommendations.considerations.length > 0) {
            report += '⚠️ CONSIDERATIONS\n';
            report += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
            recommendations.considerations.forEach((consideration) => {
                report += `• ${consideration}\n`;
            });
        }
        return report;
    }
}
export const systemDesignServer = new SystemDesignServer();
//# sourceMappingURL=server.js.map
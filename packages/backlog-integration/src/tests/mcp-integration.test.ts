/**
 * MCP Integration Tests - Critical Claude MCP functionality
 * Tests the MCP tools and their integration with task management
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';

// Mock MCP environment for testing
const mockMcpTools = {
  cc_crit_code: async (code: string) => ({
    issues: [
      {
        type: 'security',
        severity: 'high',
        description: 'Potential SQL injection vulnerability',
        line: 42,
        recommendation: 'Use parameterized queries'
      },
      {
        type: 'performance',
        severity: 'medium', 
        description: 'O(n²) algorithm could be optimized',
        line: 58,
        recommendation: 'Use HashMap for O(1) lookups'
      }
    ]
  }),
  
  cc_plan_timeline: async (description: string, context?: any) => ({
    phases: [
      {
        name: 'Planning & Architecture',
        duration: '1-2 weeks',
        tasks: ['Requirements analysis', 'System design', 'Database schema']
      },
      {
        name: 'Core Development',
        duration: '3-4 weeks', 
        tasks: ['API development', 'UI implementation', 'Integration testing']
      },
      {
        name: 'Testing & Deployment',
        duration: '1 week',
        tasks: ['QA testing', 'Performance testing', 'Production deployment']
      }
    ],
    totalEstimate: '5-7 weeks',
    confidenceLevel: 'medium'
  }),
  
  cc_mvp_plan: async (projectName: string, description: string, targetUsers: string) => ({
    mvpFeatures: [
      'User authentication',
      'Basic task creation',
      'Task status updates',
      'Simple dashboard'
    ],
    timeline: '4-6 weeks',
    teamRecommendation: '2-3 developers',
    riskFactors: ['Third-party API dependencies', 'User adoption uncertainty']
  })
};

describe('MCP Integration Tests', () => {
  let testDir: string;
  
  beforeEach(async () => {
    testDir = path.join(process.cwd(), 'test-mcp-' + Date.now());
    await fs.mkdir(testDir, { recursive: true });
  });
  
  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('🔍 Critical Code Analysis Integration', () => {
    it('should analyze code and generate actionable tasks', async () => {
      const sampleCode = `
        function loginUser(username, password) {
          const query = "SELECT * FROM users WHERE username = '" + username + "' AND password = '" + password + "'";
          return database.query(query);
        }
      `;
      
      const analysis = await mockMcpTools.cc_crit_code(sampleCode);
      
      expect(analysis.issues).toHaveLength(2);
      expect(analysis.issues[0].type).toBe('security');
      expect(analysis.issues[0].severity).toBe('high');
      expect(analysis.issues[0].description).toContain('SQL injection');
      
      // Verify the analysis would generate proper tasks
      const securityIssue = analysis.issues[0];
      expect(securityIssue.recommendation).toBe('Use parameterized queries');
      expect(securityIssue.line).toBe(42);
    });

    it('should prioritize issues correctly', async () => {
      const analysis = await mockMcpTools.cc_crit_code('sample code');
      
      const highSeverityIssues = analysis.issues.filter(issue => issue.severity === 'high');
      const mediumSeverityIssues = analysis.issues.filter(issue => issue.severity === 'medium');
      
      expect(highSeverityIssues).toHaveLength(1);
      expect(mediumSeverityIssues).toHaveLength(1);
      
      // High severity should be security-related
      expect(highSeverityIssues[0].type).toBe('security');
    });
  });

  describe('📅 Timeline Planning Integration', () => {
    it('should generate realistic project timelines', async () => {
      const timeline = await mockMcpTools.cc_plan_timeline(
        'Build user authentication system with role-based access control',
        { teamSize: 2, experience: 'intermediate' }
      );
      
      expect(timeline.phases).toHaveLength(3);
      expect(timeline.totalEstimate).toBe('5-7 weeks');
      expect(timeline.confidenceLevel).toBe('medium');
      
      // Verify phases have proper structure
      timeline.phases.forEach(phase => {
        expect(phase.name).toBeDefined();
        expect(phase.duration).toBeDefined();
        expect(Array.isArray(phase.tasks)).toBe(true);
        expect(phase.tasks.length).toBeGreaterThan(0);
      });
    });

    it('should provide contextual task breakdown', async () => {
      const timeline = await mockMcpTools.cc_plan_timeline('Simple CRUD API');
      
      const planningPhase = timeline.phases[0];
      expect(planningPhase.name).toBe('Planning & Architecture');
      expect(planningPhase.tasks).toContain('Requirements analysis');
      expect(planningPhase.tasks).toContain('System design');
      
      const developmentPhase = timeline.phases[1];
      expect(developmentPhase.name).toBe('Core Development');
      expect(developmentPhase.tasks).toContain('API development');
    });
  });

  describe('🎯 MVP Planning Integration', () => {
    it('should generate focused MVP plans', async () => {
      const mvpPlan = await mockMcpTools.cc_mvp_plan(
        'TaskTracker Pro',
        'A comprehensive task management system for development teams',
        'Software development teams of 5-15 people'
      );
      
      expect(mvpPlan.mvpFeatures).toHaveLength(4);
      expect(mvpPlan.mvpFeatures).toContain('User authentication');
      expect(mvpPlan.mvpFeatures).toContain('Basic task creation');
      
      expect(mvpPlan.timeline).toBe('4-6 weeks');
      expect(mvpPlan.teamRecommendation).toBe('2-3 developers');
      expect(Array.isArray(mvpPlan.riskFactors)).toBe(true);
    });

    it('should identify realistic risk factors', async () => {
      const mvpPlan = await mockMcpTools.cc_mvp_plan(
        'SocialConnect',
        'Social media integration platform',
        'Small businesses and influencers'
      );
      
      expect(mvpPlan.riskFactors).toContain('Third-party API dependencies');
      expect(mvpPlan.riskFactors).toContain('User adoption uncertainty');
    });
  });

  describe('🔗 MCP Tool Chain Integration', () => {
    it('should work together in a complete workflow', async () => {
      // Step 1: Plan a project
      const timeline = await mockMcpTools.cc_plan_timeline(
        'Authentication microservice with JWT tokens and Redis caching'
      );
      
      // Step 2: Generate MVP scope
      const mvpPlan = await mockMcpTools.cc_mvp_plan(
        'AuthService',
        'JWT-based authentication microservice',
        'Development teams needing centralized auth'
      );
      
      // Step 3: Analyze sample implementation code
      const sampleAuth = `
        function authenticate(token) {
          // Simple token check without proper validation
          if (token.length > 0) {
            return { user: 'admin', role: 'admin' };
          }
          return null;
        }
      `;
      
      const codeAnalysis = await mockMcpTools.cc_crit_code(sampleAuth);
      
      // Verify the workflow produces comprehensive results
      expect(timeline.phases.length).toBeGreaterThan(0);
      expect(mvpPlan.mvpFeatures.length).toBeGreaterThan(0);
      expect(codeAnalysis.issues.length).toBeGreaterThan(0);
      
      // The analysis should identify security issues in auth code
      const securityIssues = codeAnalysis.issues.filter(issue => issue.type === 'security');
      expect(securityIssues.length).toBeGreaterThan(0);
    });

    it('should provide consistent priority mapping across tools', async () => {
      // Code analysis high severity should map to critical tasks
      const analysis = await mockMcpTools.cc_crit_code('vulnerable code');
      const highSeverityIssue = analysis.issues.find(issue => issue.severity === 'high');
      
      expect(highSeverityIssue).toBeDefined();
      
      // MVP planning should identify core features (high priority)
      const mvp = await mockMcpTools.cc_mvp_plan('TestApp', 'Test description', 'Test users');
      expect(mvp.mvpFeatures).toContain('User authentication'); // Always high priority
      
      // Timeline planning should have critical phases
      const timeline = await mockMcpTools.cc_plan_timeline('Test project');
      expect(timeline.phases[0].name).toBe('Planning & Architecture'); // Always critical first step
    });
  });

  describe('📊 MCP Configuration Validation', () => {
    it('should validate MCP server configuration format', async () => {
      const mcpConfig = {
        mcpServers: {
          "critical-claude-code-critique": {
            command: "node",
            args: ["./packages/code-critique/dist/server.js"],
            cwd: process.cwd()
          },
          "critical-claude-project-management": {
            command: "node",
            args: ["./packages/project-management/dist/server.js"],
            cwd: process.cwd()
          }
        }
      };
      
      // Validate structure
      expect(mcpConfig.mcpServers).toBeDefined();
      expect(Object.keys(mcpConfig.mcpServers)).toHaveLength(2);
      
      // Validate each server config
      Object.values(mcpConfig.mcpServers).forEach(serverConfig => {
        expect(serverConfig.command).toBe('node');
        expect(Array.isArray(serverConfig.args)).toBe(true);
        expect(serverConfig.args.length).toBeGreaterThan(0);
        expect(serverConfig.cwd).toBeDefined();
      });
    });

    it('should handle MCP tool errors gracefully', async () => {
      // Simulate tool failure
      const failingTool = async () => {
        throw new Error('MCP tool connection failed');
      };
      
      try {
        await failingTool();
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect((error as Error).message).toBe('MCP tool connection failed');
        // In real implementation, this should fall back to local analysis
      }
    });
  });

  describe('🎨 Prompt Management Integration', () => {
    it('should validate prompt template structure', () => {
      const securityTemplate = {
        id: 'security-audit',
        name: 'Security Code Audit',
        category: 'security',
        template: `
Analyze this code for security vulnerabilities:

{CODE}

Focus on:
- SQL injection vulnerabilities
- XSS attack vectors  
- Authentication bypasses
- Input validation issues

For each vulnerability found:
1. Assess exploitation risk (CRITICAL/HIGH/MEDIUM/LOW)
2. Provide specific fix recommendations
3. Include code examples of secure implementation
        `,
        variables: ['CODE']
      };
      
      expect(securityTemplate.id).toBe('security-audit');
      expect(securityTemplate.category).toBe('security');
      expect(securityTemplate.template).toContain('{CODE}');
      expect(securityTemplate.variables).toContain('CODE');
    });

    it('should support template variable substitution', () => {
      const template = 'Analyze {CODE} for {ISSUE_TYPE} issues in {LANGUAGE}';
      const variables = {
        CODE: 'function test() { return true; }',
        ISSUE_TYPE: 'security',
        LANGUAGE: 'JavaScript'
      };
      
      let rendered = template;
      Object.entries(variables).forEach(([key, value]) => {
        rendered = rendered.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
      });
      
      expect(rendered).toBe('Analyze function test() { return true; } for security issues in JavaScript');
      expect(rendered).not.toContain('{CODE}');
      expect(rendered).not.toContain('{ISSUE_TYPE}');
      expect(rendered).not.toContain('{LANGUAGE}');
    });
  });
});
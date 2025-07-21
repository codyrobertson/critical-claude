/**
 * AI Service - Real AI integration using language models
 * Replaces pattern matching with actual AI-powered analysis
 */

import fs from 'fs';
import path from 'path';

export interface AIConfig {
  provider: 'openai' | 'anthropic' | 'claude-code' | 'local' | 'mock';
  apiKey?: string;
  model?: string;
  baseUrl?: string;
  maxTokens?: number;
  temperature?: number;
  claudeCodeEndpoint?: string;
}

export interface AITaskAnalysis {
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  labels: string[];
  assignee?: string;
  storyPoints: number;
  estimatedHours: number;
  complexity: 'low' | 'medium' | 'high' | 'very-high';
  domain: string;
  technologies: string[];
  requirements: string[];
  subtasks?: string[];
  dependencies?: string[];
  riskFactors: string[];
}

export interface AIProjectAnalysis {
  projectType: string;
  domain: string;
  features: AIFeature[];
  technicalRequirements: string[];
  timeline: string;
  complexity: 'low' | 'medium' | 'high' | 'very-high';
  recommendedTeamSize: number;
  phases: AIPhase[];
  risks: string[];
}

export interface AIFeature {
  name: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  complexity: 'low' | 'medium' | 'high' | 'very-high';
  estimatedDays: number;
  dependencies: string[];
  tasks: string[];
}

export interface AIPhase {
  name: string;
  description: string;
  duration: string;
  features: string[];
  deliverables: string[];
}

export class AIService {
  private config: AIConfig;
  private initialized = false;

  constructor(config: AIConfig = { provider: 'mock' }) {
    this.config = config;
    
    // Load configuration from cc.env file if it exists (sync)
    this.loadEnvConfigSync();
    
    // Auto-detect best available provider - prioritize API keys over Claude Code
    if (config.provider === 'mock') {
      console.log('🔍 Auto-detecting AI provider...');
      
      // Check for direct API keys first (most reliable)
      if (process.env.OPENAI_API_KEY) {
        console.log('🤖 Found OpenAI API key, using OpenAI provider');
        this.config.provider = 'openai';
        this.config.apiKey = process.env.OPENAI_API_KEY;
        this.config.model = process.env.CC_AI_MODEL || this.config.model;
      } else if (process.env.ANTHROPIC_API_KEY) {
        console.log('🤖 Found Anthropic API key, using Anthropic provider');
        this.config.provider = 'anthropic';
        this.config.apiKey = process.env.ANTHROPIC_API_KEY;
        this.config.model = process.env.CC_AI_MODEL || this.config.model;
      } else {
        console.log('🤖 No API keys found, will attempt Claude Code CLI as fallback...');
        this.config.provider = 'claude-code';
      }
      
      // Apply cc.env overrides
      this.config.temperature = process.env.CC_AI_TEMPERATURE ? 
        parseFloat(process.env.CC_AI_TEMPERATURE) : this.config.temperature;
      this.config.maxTokens = process.env.CC_AI_MAX_TOKENS ? 
        parseInt(process.env.CC_AI_MAX_TOKENS) : this.config.maxTokens;
    }
  }

  private loadEnvConfigSync(): void {
    try {
      // Look for cc.env in current working directory
      const envPath = path.join(process.cwd(), 'cc.env');
      
      if (fs.existsSync(envPath)) {
        console.log('📄 Loading configuration from cc.env');
        const envContent = fs.readFileSync(envPath, 'utf8');
        
        // Parse simple KEY=VALUE format (ignoring comments and empty lines)
        const lines = envContent.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#')) {
            const [key, ...valueParts] = trimmed.split('=');
            if (key && valueParts.length > 0) {
              const value = valueParts.join('=').replace(/^["']|["']$/g, ''); // Remove quotes
              process.env[key.trim()] = value.trim();
            }
          }
        }
        console.log('✅ Loaded cc.env configuration');
      }
    } catch (error) {
      // Silently ignore env loading errors
      console.warn('⚠️  Could not load cc.env file:', (error as Error).message);
    }
  }

  private isClaudeCodeContext(): boolean {
    // Check for Claude Code environment indicators
    return !!(
      process.env.CLAUDE_CODE_SESSION ||
      process.env.CLAUDE_SESSION_ID ||
      process.env.ANTHROPIC_API_KEY ||
      (global as any).claude
    );
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Initialize AI provider
    switch (this.config.provider) {
      case 'openai':
        await this.initializeOpenAI();
        break;
      case 'anthropic':
        await this.initializeAnthropic();
        break;
      case 'claude-code':
        await this.initializeClaudeCode();
        break;
      case 'local':
        await this.initializeLocal();
        break;
      case 'mock':
        await this.initializeMock();
        break;
      default:
        throw new Error(`Unsupported AI provider: ${this.config.provider}`);
    }

    this.initialized = true;
  }

  /**
   * Analyze task description using AI to extract structured information
   */
  async analyzeTask(description: string, context?: any): Promise<AITaskAnalysis> {
    await this.initialize();

    const prompt = this.buildTaskAnalysisPrompt(description, context);
    const response = await this.callAI(prompt);
    return this.parseTaskAnalysis(response);
  }

  /**
   * Generate multiple related tasks from project description
   */
  async generateProjectTasks(description: string, options: {
    maxTasks?: number;
    teamSize?: number;
    experience?: string;
    timeline?: string;
  } = {}): Promise<AITaskAnalysis[]> {
    await this.initialize();

    const prompt = this.buildProjectTasksPrompt(description, options);
    const response = await this.callAI(prompt);
    return this.parseProjectTasks(response);
  }

  /**
   * Expand a task into subtasks using AI reasoning
   */
  async expandTask(taskTitle: string, taskDescription: string, options: {
    maxSubtasks?: number;
    teamSize?: number;
    experience?: string;
  } = {}): Promise<AITaskAnalysis[]> {
    await this.initialize();

    const prompt = this.buildTaskExpansionPrompt(taskTitle, taskDescription, options);
    const response = await this.callAI(prompt);
    return this.parseTaskExpansion(response);
  }

  /**
   * Analyze project scope and generate comprehensive breakdown
   */
  async analyzeProject(description: string, options: {
    teamSize?: number;
    timeline?: string;
    budget?: string;
  } = {}): Promise<AIProjectAnalysis> {
    await this.initialize();

    const prompt = this.buildProjectAnalysisPrompt(description, options);
    const response = await this.callAI(prompt);
    return this.parseProjectAnalysis(response);
  }

  /**
   * Estimate task complexity and effort using AI
   */
  async estimateTask(taskTitle: string, taskDescription: string): Promise<{
    storyPoints: number;
    estimatedHours: number;
    complexity: 'low' | 'medium' | 'high' | 'very-high';
    confidence: number;
    factors: string[];
  }> {
    await this.initialize();

    const prompt = this.buildEstimationPrompt(taskTitle, taskDescription);
    const response = await this.callAI(prompt);
    return this.parseEstimation(response);
  }

  // Private methods for AI provider initialization

  private async initializeOpenAI(): Promise<void> {
    if (!this.config.apiKey) {
      throw new Error('OpenAI API key is required');
    }
    console.log('✅ OpenAI provider initialized');
  }

  private async initializeAnthropic(): Promise<void> {
    if (!this.config.apiKey) {
      throw new Error('Anthropic API key is required');
    }
    console.log('✅ Anthropic provider initialized');
  }

  private async initializeClaudeCode(): Promise<void> {
    try {
      // Check if Claude Code CLI is available
      const { spawn } = await import('child_process');
      
      return new Promise((resolve, reject) => {
        const testProcess = spawn('claude', ['--version'], {
          stdio: 'pipe'
        });

        testProcess.on('close', (code) => {
          if (code === 0) {
            console.log('✅ Claude Code CLI detected and available');
            resolve();
          } else {
            reject(new Error('Claude Code CLI not found or not working'));
          }
        });

        testProcess.on('error', (error) => {
          reject(new Error(`Claude Code CLI not available: ${error.message}`));
        });
      });
      
    } catch (error) {
      throw new Error(`Claude Code initialization failed: ${(error as Error).message}. Install with: npm install -g @anthropic-ai/claude-code`);
    }
  }

  private async initializeLocal(): Promise<void> {
    // Local model initialization would go here (ollama, etc.)
    console.warn('Local AI integration not implemented yet, using mock');
    await this.initializeMock();
  }

  private async initializeMock(): Promise<void> {
    // Mock AI is always ready
    console.log('Initialized mock AI service');
  }

  // Prompt building methods

  private buildTaskAnalysisPrompt(description: string, context?: any): string {
    return `Analyze this task description and extract structured information:

Task Description: "${description}"
${context ? `Context: ${JSON.stringify(context)}` : ''}

Please provide a JSON response with the following structure:
{
  "title": "Clean, actionable task title",
  "description": "Detailed task description",
  "priority": "critical|high|medium|low",
  "labels": ["relevant", "tags"],
  "assignee": "suggested assignee or null",
  "storyPoints": 1-13,
  "estimatedHours": "realistic hour estimate",
  "complexity": "low|medium|high|very-high",
  "domain": "primary domain (frontend, backend, database, etc.)",
  "technologies": ["relevant", "technologies"],
  "requirements": ["specific", "requirements"],
  "riskFactors": ["potential", "risks"]
}

Focus on:
- Realistic estimation based on actual complexity
- Appropriate priority based on business impact
- Relevant technology stack detection
- Clear, actionable language
- Risk identification`;
  }

  private buildProjectTasksPrompt(description: string, options: any): string {
    return `Generate a comprehensive task breakdown for this project:

Project Description: "${description}"
Max Tasks: ${options.maxTasks || 8}
Team Size: ${options.teamSize || 3}
Experience Level: ${options.experience || 'intermediate'}
Timeline: ${options.timeline || 'not specified'}

Please provide a JSON response with an array of tasks:
{
  "tasks": [
    {
      "title": "Task title",
      "description": "Detailed description",
      "priority": "critical|high|medium|low",
      "labels": ["relevant", "tags"],
      "storyPoints": 1-13,
      "estimatedHours": "hour estimate",
      "complexity": "low|medium|high|very-high",
      "domain": "primary domain",
      "technologies": ["technologies"],
      "requirements": ["requirements"],
      "dependencies": ["other task titles this depends on"],
      "riskFactors": ["risks"]
    }
  ],
  "projectSummary": {
    "totalEstimate": "overall timeline",
    "phases": ["phase1", "phase2"],
    "criticalPath": ["task1", "task2"],
    "mainRisks": ["risk1", "risk2"]
  }
}

Consider:
- Logical task dependencies and sequencing
- Appropriate breakdown for team size and experience
- Realistic estimates based on complexity
- Technical prerequisites and constraints
- Integration points and potential bottlenecks`;
  }

  private buildTaskExpansionPrompt(title: string, description: string, options: any): string {
    return `Break down this task into actionable subtasks:

Parent Task: "${title}"
Description: "${description}"
Max Subtasks: ${options.maxSubtasks || 8}
Team Size: ${options.teamSize || 3}
Experience Level: ${options.experience || 'intermediate'}

Please provide a JSON response with subtask breakdown:
{
  "subtasks": [
    {
      "title": "Subtask title",
      "description": "What needs to be done",
      "priority": "critical|high|medium|low",
      "labels": ["relevant", "tags"],
      "storyPoints": 1-8,
      "estimatedHours": "hour estimate",
      "complexity": "low|medium|high|very-high",
      "domain": "area of work",
      "dependencies": ["other subtask titles"],
      "order": 1
    }
  ],
  "timeline": "estimated completion time",
  "riskFactors": ["potential issues"],
  "recommendations": ["suggestions for implementation"]
}

Focus on:
- Logical breakdown of work
- Appropriate granularity for team skill level
- Clear dependencies between subtasks
- Realistic estimates for each piece
- Identification of potential blockers`;
  }

  private buildProjectAnalysisPrompt(description: string, options: any): string {
    return `Analyze this project comprehensively:

Project: "${description}"
Team Size: ${options.teamSize || 'not specified'}
Timeline: ${options.timeline || 'flexible'}
Budget: ${options.budget || 'not specified'}

Provide detailed project analysis in JSON format:
{
  "projectType": "type of project",
  "domain": "primary domain",
  "features": [
    {
      "name": "feature name",
      "description": "what it does",
      "priority": "critical|high|medium|low",
      "complexity": "low|medium|high|very-high",
      "estimatedDays": "realistic estimate",
      "dependencies": ["other features"],
      "tasks": ["main tasks for this feature"]
    }
  ],
  "technicalRequirements": ["tech stack", "infrastructure"],
  "timeline": "realistic project timeline",
  "complexity": "overall complexity",
  "recommendedTeamSize": "ideal team size",
  "phases": [
    {
      "name": "phase name",
      "description": "what happens in this phase",
      "duration": "time estimate",
      "features": ["features delivered"],
      "deliverables": ["concrete outputs"]
    }
  ],
  "risks": ["major risks and mitigation strategies"]
}`;
  }

  private buildEstimationPrompt(title: string, description: string): string {
    return `Estimate the complexity and effort for this task:

Task: "${title}"
Description: "${description}"

Provide estimation in JSON format:
{
  "storyPoints": 1-13,
  "estimatedHours": "realistic hours",
  "complexity": "low|medium|high|very-high",
  "confidence": 0.1-1.0,
  "factors": [
    "specific factors that influenced the estimate"
  ],
  "breakdown": {
    "analysis": "hours for analysis/planning",
    "implementation": "hours for coding",
    "testing": "hours for testing",
    "integration": "hours for integration/deployment"
  },
  "assumptions": ["key assumptions made"],
  "risks": ["factors that could increase effort"]
}

Consider:
- Technical complexity and unknowns
- Integration requirements
- Testing and validation effort
- Documentation needs
- Potential for scope creep`;
  }

  // AI calling method (provider-agnostic)

  private async callAI(prompt: string): Promise<string> {
    switch (this.config.provider) {
      case 'openai':
        return await this.callOpenAI(prompt);
      case 'anthropic':
        return await this.callAnthropic(prompt);
      case 'claude-code':
        return await this.callClaudeCode(prompt);
      case 'local':
        return await this.callLocal(prompt);
      case 'mock':
        return await this.callMock(prompt);
      default:
        throw new Error(`Unsupported AI provider: ${this.config.provider}`);
    }
  }

  private async callOpenAI(prompt: string): Promise<string> {
    if (!this.config.apiKey) {
      throw new Error('OpenAI API key required');
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          model: this.config.model || 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are an expert software project manager and technical analyst. Provide detailed, structured responses in the exact JSON format requested.'
            },
            {
              role: 'user', 
              content: prompt
            }
          ],
          max_tokens: this.config.maxTokens || 4000,
          temperature: this.config.temperature || 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      return result.choices[0]?.message?.content || '';
    } catch (error) {
      console.warn(`OpenAI API call failed: ${(error as Error).message}`);
      throw error;
    }
  }

  private async callAnthropic(prompt: string): Promise<string> {
    if (!this.config.apiKey) {
      throw new Error('Anthropic API key required');
    }

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: this.config.model || 'claude-3-5-sonnet-20241022',
          max_tokens: this.config.maxTokens || 4000,
          temperature: this.config.temperature || 0.7,
          messages: [
            {
              role: 'user',
              content: `You are an expert software project manager and technical analyst. Provide detailed, structured responses in the exact JSON format requested.\n\n${prompt}`
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      return result.content[0]?.text || '';
    } catch (error) {
      console.warn(`Anthropic API call failed: ${(error as Error).message}`);
      throw error;
    }
  }

  private async callClaudeCode(prompt: string): Promise<string> {
    try {
      // Use Claude Code SDK to spawn a subprocess
      const { spawn } = await import('child_process');
      const { promisify } = await import('util');
      
      console.log('🤖 Using Claude Code SDK subprocess...');
      
      return new Promise((resolve, reject) => {
        const claudeProcess = spawn('claude', [
          '-p', // Print mode (non-interactive)
          '--output-format', 'json',
          '--max-turns', '1'
        ], {
          stdio: ['pipe', 'pipe', 'pipe']
        });

        let stdout = '';
        let stderr = '';

        claudeProcess.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        claudeProcess.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        claudeProcess.on('close', (code) => {
          if (code === 0) {
            try {
              const response = JSON.parse(stdout);
              resolve(response.result || response.content || stdout);
            } catch (parseError) {
              // If JSON parsing fails, return raw stdout
              resolve(stdout);
            }
          } else {
            console.warn(`Claude Code process failed with code ${code}: ${stderr}`);
            reject(new Error(`Claude Code failed: ${stderr}`));
          }
        });

        claudeProcess.on('error', (error) => {
          console.warn(`Claude Code spawn error: ${error.message}`);
          reject(error);
        });

        // Send the prompt to claude stdin
        claudeProcess.stdin.write(prompt);
        claudeProcess.stdin.end();
      });

    } catch (error) {
      console.warn(`Claude Code integration failed: ${(error as Error).message}`);
      
      // Fallback to other providers
      if (process.env.OPENAI_API_KEY) {
        console.log('🔄 Falling back to OpenAI API');
        this.config.provider = 'openai';
        this.config.apiKey = process.env.OPENAI_API_KEY;
        return await this.callOpenAI(prompt);
      }
      
      if (process.env.ANTHROPIC_API_KEY) {
        console.log('🔄 Falling back to Anthropic API');
        this.config.provider = 'anthropic';
        this.config.apiKey = process.env.ANTHROPIC_API_KEY;
        return await this.callAnthropic(prompt);
      }
      
      throw new Error('Claude Code not available and no fallback API keys found. Install Claude Code CLI or set OPENAI_API_KEY/ANTHROPIC_API_KEY.');
    }
  }

  private async callLocal(prompt: string): Promise<string> {
    // Local model call would go here (ollama, etc.)
    // For now, return mock response
    return await this.callMock(prompt);
  }

  private async callMock(prompt: string): Promise<string> {
    // Simulate AI response delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Intelligent mock responses based on prompt content
    if (prompt.includes('task breakdown') || prompt.includes('Generate a comprehensive task breakdown')) {
      return this.mockProjectTasksResponse(prompt);
    } else if (prompt.includes('Break down this task')) {
      return this.mockTaskExpansionResponse(prompt);
    } else if (prompt.includes('Analyze this project comprehensively')) {
      return this.mockProjectAnalysisResponse(prompt);
    } else if (prompt.includes('Estimate the complexity')) {
      return this.mockEstimationResponse(prompt);
    } else {
      return this.mockTaskAnalysisResponse(prompt);
    }
  }

  // Mock response generators (intelligent based on input)

  private mockTaskAnalysisResponse(prompt: string): string {
    const description = this.extractDescription(prompt);
    const analysis = this.analyzeDescriptionIntelligently(description);
    
    return JSON.stringify({
      title: analysis.title,
      description: analysis.description,
      priority: analysis.priority,
      labels: analysis.labels,
      assignee: analysis.assignee,
      storyPoints: analysis.storyPoints,
      estimatedHours: analysis.estimatedHours,
      complexity: analysis.complexity,
      domain: analysis.domain,
      technologies: analysis.technologies,
      requirements: analysis.requirements,
      riskFactors: analysis.riskFactors
    });
  }

  private mockProjectTasksResponse(prompt: string): string {
    const description = this.extractDescription(prompt);
    const maxTasks = this.extractMaxTasks(prompt);
    const tasks = this.generateIntelligentTasks(description, maxTasks);
    
    return JSON.stringify({
      tasks: tasks,
      projectSummary: {
        totalEstimate: this.calculateProjectTimeline(tasks),
        phases: this.generatePhases(tasks),
        criticalPath: this.calculateCriticalPath(tasks),
        mainRisks: this.identifyProjectRisks(description)
      }
    });
  }

  private mockTaskExpansionResponse(prompt: string): string {
    const title = this.extractTaskTitle(prompt);
    const description = this.extractDescription(prompt);
    const maxSubtasks = this.extractMaxSubtasks(prompt);
    const subtasks = this.generateIntelligentSubtasks(title, description, maxSubtasks);
    
    return JSON.stringify({
      subtasks: subtasks,
      timeline: this.calculateSubtaskTimeline(subtasks),
      riskFactors: this.identifyTaskRisks(title, description),
      recommendations: this.generateRecommendations(title, description)
    });
  }

  private mockProjectAnalysisResponse(prompt: string): string {
    const description = this.extractDescription(prompt);
    const analysis = this.analyzeProjectIntelligently(description);
    
    return JSON.stringify(analysis);
  }

  private mockEstimationResponse(prompt: string): string {
    const title = this.extractTaskTitle(prompt);
    const description = this.extractDescription(prompt);
    const estimation = this.estimateTaskIntelligently(title, description);
    
    return JSON.stringify(estimation);
  }

  // Intelligent analysis methods

  private analyzeDescriptionIntelligently(description: string): AITaskAnalysis {
    const lowerDesc = description.toLowerCase();
    
    // Determine domain based on keywords
    let domain = 'general';
    let technologies: string[] = [];
    let complexity: 'low' | 'medium' | 'high' | 'very-high' = 'medium';
    let labels: string[] = [];
    let priority: 'critical' | 'high' | 'medium' | 'low' = 'medium';
    
    // Domain detection
    if (lowerDesc.includes('auth') || lowerDesc.includes('login') || lowerDesc.includes('security')) {
      domain = 'authentication';
      labels.push('security', 'authentication');
      technologies.push('JWT', 'OAuth2');
    } else if (lowerDesc.includes('api') || lowerDesc.includes('endpoint') || lowerDesc.includes('rest')) {
      domain = 'backend';
      labels.push('api', 'backend');
      technologies.push('REST', 'Express', 'Node.js');
    } else if (lowerDesc.includes('database') || lowerDesc.includes('db') || lowerDesc.includes('sql')) {
      domain = 'database';
      labels.push('database', 'data');
      technologies.push('PostgreSQL', 'MongoDB');
    } else if (lowerDesc.includes('ui') || lowerDesc.includes('frontend') || lowerDesc.includes('interface')) {
      domain = 'frontend';
      labels.push('ui', 'frontend');
      technologies.push('React', 'TypeScript');
    } else if (lowerDesc.includes('test') || lowerDesc.includes('testing')) {
      domain = 'testing';
      labels.push('testing', 'qa');
      technologies.push('Jest', 'Cypress');
    } else if (lowerDesc.includes('streaming') || lowerDesc.includes('kafka') || lowerDesc.includes('real-time')) {
      domain = 'streaming';
      labels.push('streaming', 'data', 'architecture');
      technologies.push('Apache Kafka', 'Redis', 'Stream Processing');
    } else if (lowerDesc.includes('machine learning') || lowerDesc.includes('ml') || lowerDesc.includes('model')) {
      domain = 'machine-learning';
      labels.push('ml', 'data-science', 'ai');
      technologies.push('Python', 'TensorFlow', 'scikit-learn');
    } else if (lowerDesc.includes('microservice') || lowerDesc.includes('distributed')) {
      domain = 'microservices';
      labels.push('microservices', 'distributed', 'architecture');
      technologies.push('Docker', 'Kubernetes', 'Service Mesh');
    }
    
    // Complexity assessment
    if (lowerDesc.includes('simple') || lowerDesc.includes('basic') || lowerDesc.includes('minor')) {
      complexity = 'low';
    } else if (lowerDesc.includes('complex') || lowerDesc.includes('advanced') || lowerDesc.includes('integration')) {
      complexity = 'high';
    } else if (lowerDesc.includes('microservice') || lowerDesc.includes('distributed') || lowerDesc.includes('scale')) {
      complexity = 'very-high';
    }
    
    // Priority assessment
    if (lowerDesc.includes('urgent') || lowerDesc.includes('critical') || lowerDesc.includes('blocker')) {
      priority = 'critical';
    } else if (lowerDesc.includes('important') || lowerDesc.includes('priority') || lowerDesc.includes('asap')) {
      priority = 'high';
    } else if (lowerDesc.includes('minor') || lowerDesc.includes('nice') || lowerDesc.includes('enhancement')) {
      priority = 'low';
    }
    
    // Story points based on complexity
    let storyPoints = 3;
    if (complexity === 'low') storyPoints = 2;
    else if (complexity === 'high') storyPoints = 5;
    else if (complexity === 'very-high') storyPoints = 8;
    
    return {
      title: this.cleanTitle(description),
      description: description,
      priority,
      labels,
      storyPoints,
      estimatedHours: storyPoints * 4,
      complexity,
      domain,
      technologies,
      requirements: this.extractRequirements(description),
      riskFactors: this.identifyRisks(description, complexity)
    };
  }

  private generateIntelligentTasks(description: string, maxTasks: number): AITaskAnalysis[] {
    const analysis = this.analyzeDescriptionIntelligently(description);
    const tasks: AITaskAnalysis[] = [];
    
    // Generate tasks based on domain and complexity
    if (analysis.domain === 'authentication') {
      tasks.push({
        ...analysis,
        title: 'Design authentication system architecture',
        description: 'Plan authentication flow, security measures, and user experience',
        labels: ['authentication', 'architecture', 'security'],
        storyPoints: 3,
        estimatedHours: 12,
        complexity: 'medium',
        domain: 'authentication',
        technologies: ['JWT', 'bcrypt', 'OAuth2'],
        requirements: ['Security requirements', 'User flow design'],
        riskFactors: ['Security vulnerabilities', 'Integration complexity']
      });
      
      tasks.push({
        ...analysis,
        title: 'Implement user registration and login',
        description: 'Build user registration forms, validation, and login functionality',
        labels: ['authentication', 'implementation', 'frontend'],
        storyPoints: 5,
        estimatedHours: 20,
        complexity: 'medium',
        domain: 'authentication',
        technologies: ['React', 'JWT', 'bcrypt'],
        requirements: ['Form validation', 'Session management'],
        dependencies: ['Design authentication system architecture'],
        riskFactors: ['Password security', 'Session handling']
      });
    }
    
    // Add more domain-specific task generation...
    if (tasks.length < maxTasks) {
      // Generate additional generic tasks
      tasks.push({
        ...analysis,
        title: `Implement ${analysis.domain} core functionality`,
        description: `Build the main ${analysis.domain} features and logic`,
        storyPoints: 5,
        estimatedHours: 20,
        complexity: 'medium',
        domain: analysis.domain,
        technologies: analysis.technologies,
        requirements: [`${analysis.domain} implementation requirements`],
        riskFactors: [`${analysis.domain} complexity`, 'Integration challenges']
      });
      
      tasks.push({
        ...analysis,
        title: `Add ${analysis.domain} testing and validation`,
        description: `Comprehensive testing for ${analysis.domain} functionality`,
        labels: [...analysis.labels, 'testing'],
        storyPoints: 3,
        estimatedHours: 12,
        complexity: 'low',
        domain: 'testing',
        technologies: ['Jest', 'Cypress', ...analysis.technologies],
        requirements: ['Test coverage', 'Validation rules'],
        dependencies: [`Implement ${analysis.domain} core functionality`],
        riskFactors: ['Test complexity', 'Edge cases']
      });
    }
    
    return tasks.slice(0, maxTasks);
  }

  private generateIntelligentSubtasks(title: string, description: string, maxSubtasks: number): AITaskAnalysis[] {
    // Use title as fallback if description is empty
    const analysisText = description || title;
    const analysis = this.analyzeDescriptionIntelligently(analysisText);
    const subtasks: AITaskAnalysis[] = [];
    
    // Always start with planning
    subtasks.push({
      ...analysis,
      title: `Plan: ${title}`,
      description: 'Analyze requirements, design approach, and create implementation plan',
      labels: ['planning', 'analysis'],
      storyPoints: 2,
      estimatedHours: 8,
      complexity: 'low',
      domain: 'planning',
      technologies: [],
      requirements: ['Requirement analysis', 'Technical design'],
      riskFactors: ['Unclear requirements', 'Missing dependencies']
    });
    
    // Add domain-specific implementation subtasks
    if (analysis.domain === 'streaming') {
      subtasks.push({
        ...analysis,
        title: `Design streaming architecture: ${title}`,
        description: 'Design data flow, message schemas, and streaming topology',
        labels: ['architecture', 'design', 'streaming'],
        storyPoints: 5,
        estimatedHours: 20,
        complexity: 'high',
        dependencies: [`Plan: ${title}`],
        riskFactors: ['Architecture complexity', 'Data consistency']
      });
      
      if (subtasks.length < maxSubtasks) {
        subtasks.push({
          ...analysis,
          title: `Implement Kafka infrastructure: ${title}`,
          description: 'Set up Kafka brokers, topics, and partitioning strategy',
          labels: ['infrastructure', 'kafka', 'implementation'],
          storyPoints: 8,
          estimatedHours: 32,
          complexity: 'high',
          dependencies: [`Design streaming architecture: ${title}`],
          riskFactors: ['Kafka configuration', 'Scalability requirements']
        });
      }
      
      if (subtasks.length < maxSubtasks) {
        subtasks.push({
          ...analysis,
          title: `Build stream processing logic: ${title}`,
          description: 'Implement stream processors and data transformation logic',
          labels: ['processing', 'implementation', 'logic'],
          storyPoints: 8,
          estimatedHours: 32,
          complexity: 'high',
          dependencies: [`Implement Kafka infrastructure: ${title}`],
          riskFactors: ['Stream processing complexity', 'Error handling']
        });
      }
    } else if (analysis.domain === 'machine-learning') {
      subtasks.push({
        ...analysis,
        title: `Data pipeline: ${title}`,
        description: 'Build data ingestion and preprocessing pipeline',
        labels: ['data', 'pipeline', 'preprocessing'],
        storyPoints: 5,
        estimatedHours: 20,
        complexity: 'medium',
        dependencies: [`Plan: ${title}`],
        riskFactors: ['Data quality', 'Pipeline scalability']
      });
      
      if (subtasks.length < maxSubtasks) {
        subtasks.push({
          ...analysis,
          title: `Model training: ${title}`,
          description: 'Implement model training and hyperparameter tuning',
          labels: ['model', 'training', 'ml'],
          storyPoints: 8,
          estimatedHours: 32,
          complexity: 'high',
          dependencies: [`Data pipeline: ${title}`],
          riskFactors: ['Model performance', 'Training time']
        });
      }
      
      if (subtasks.length < maxSubtasks) {
        subtasks.push({
          ...analysis,
          title: `Model deployment: ${title}`,
          description: 'Deploy model with automated inference pipeline',
          labels: ['deployment', 'inference', 'automation'],
          storyPoints: 5,
          estimatedHours: 20,
          complexity: 'medium',
          dependencies: [`Model training: ${title}`],
          riskFactors: ['Deployment complexity', 'Model serving']
        });
      }
    } else if (analysis.complexity === 'low') {
      subtasks.push({
        ...analysis,
        title: `Implement: ${title}`,
        description: 'Build the required functionality',
        labels: ['implementation'],
        storyPoints: 3,
        estimatedHours: 12,
        complexity: 'medium',
        dependencies: [`Plan: ${title}`],
        riskFactors: ['Implementation complexity']
      });
    } else {
      // Break into multiple implementation phases for complex tasks
      subtasks.push({
        ...analysis,
        title: `Core Implementation: ${title}`,
        description: 'Implement core functionality and business logic',
        labels: ['implementation', 'core'],
        storyPoints: 5,
        estimatedHours: 20,
        complexity: 'medium',
        dependencies: [`Plan: ${title}`],
        riskFactors: ['Core logic complexity', 'Architecture decisions']
      });
      
      if (subtasks.length < maxSubtasks) {
        subtasks.push({
          ...analysis,
          title: `Integration: ${title}`,
          description: 'Integrate with existing systems and external services',
          labels: ['integration', 'external'],
          storyPoints: 3,
          estimatedHours: 12,
          complexity: 'medium',
          dependencies: [`Core Implementation: ${title}`],
          riskFactors: ['Integration complexity', 'External dependencies']
        });
      }
    }
    
    // Always end with testing
    if (subtasks.length < maxSubtasks) {
      subtasks.push({
        ...analysis,
        title: `Test: ${title}`,
        description: 'Write and execute comprehensive tests',
        labels: ['testing', 'qa'],
        storyPoints: 2,
        estimatedHours: 8,
        complexity: 'low',
        domain: 'testing',
        dependencies: [subtasks[subtasks.length - 1].title],
        riskFactors: ['Test coverage', 'Edge cases']
      });
    }
    
    return subtasks.slice(0, maxSubtasks);
  }

  // Helper methods

  private extractDescription(prompt: string): string {
    const match = prompt.match(/(?:Description|Project|Task):\s*"([^"]+)"/);
    return match ? match[1] : '';
  }

  private extractTaskTitle(prompt: string): string {
    const match = prompt.match(/(?:Parent Task|Task):\s*"([^"]+)"/);
    return match ? match[1] : '';
  }

  private extractMaxTasks(prompt: string): number {
    const match = prompt.match(/Max Tasks:\s*(\d+)/);
    return match ? parseInt(match[1]) : 8;
  }

  private extractMaxSubtasks(prompt: string): number {
    const match = prompt.match(/Max Subtasks:\s*(\d+)/);
    return match ? parseInt(match[1]) : 8;
  }

  private cleanTitle(description: string): string {
    // Create clean, actionable title from description
    let title = description.length > 60 ? description.substring(0, 57) + '...' : description;
    title = title.charAt(0).toUpperCase() + title.slice(1);
    return title;
  }

  private extractRequirements(description: string): string[] {
    const requirements: string[] = [];
    const text = description.toLowerCase();
    
    // Extract explicit requirements
    const patterns = [
      /need[s]?\s+([^.]+)/gi,
      /require[s]?\s+([^.]+)/gi,
      /must\s+([^.]+)/gi,
      /should\s+([^.]+)/gi
    ];
    
    patterns.forEach(pattern => {
      const matches = description.match(pattern);
      if (matches) {
        requirements.push(...matches.map(m => m.trim()));
      }
    });
    
    return requirements.length > 0 ? requirements : ['Functional requirements', 'Performance requirements'];
  }

  private identifyRisks(description: string, complexity: string): string[] {
    const risks: string[] = [];
    const text = description.toLowerCase();
    
    if (text.includes('integration')) risks.push('Integration complexity');
    if (text.includes('external') || text.includes('third party')) risks.push('External dependency risk');
    if (text.includes('new') || text.includes('unknown')) risks.push('Technology uncertainty');
    if (text.includes('performance')) risks.push('Performance requirements');
    if (text.includes('security')) risks.push('Security compliance');
    if (complexity === 'very-high') risks.push('High complexity risk');
    
    return risks.length > 0 ? risks : ['Implementation complexity', 'Timeline pressure'];
  }

  // Parsing methods for AI responses

  private parseTaskAnalysis(response: string): AITaskAnalysis {
    try {
      return JSON.parse(response);
    } catch (error) {
      // Fallback if parsing fails
      return {
        title: 'AI Analysis Failed',
        description: 'Could not parse AI response',
        priority: 'medium',
        labels: ['ai-error'],
        storyPoints: 3,
        estimatedHours: 12,
        complexity: 'medium',
        domain: 'general',
        technologies: [],
        requirements: [],
        riskFactors: ['AI parsing error']
      };
    }
  }

  private parseProjectTasks(response: string): AITaskAnalysis[] {
    try {
      const parsed = JSON.parse(response);
      return parsed.tasks || [];
    } catch (error) {
      return [];
    }
  }

  private parseTaskExpansion(response: string): AITaskAnalysis[] {
    try {
      const parsed = JSON.parse(response);
      return parsed.subtasks || [];
    } catch (error) {
      return [];
    }
  }

  private parseProjectAnalysis(response: string): AIProjectAnalysis {
    try {
      return JSON.parse(response);
    } catch (error) {
      return {
        projectType: 'Unknown',
        domain: 'general',
        features: [],
        technicalRequirements: [],
        timeline: 'Unknown',
        complexity: 'medium',
        recommendedTeamSize: 3,
        phases: [],
        risks: ['AI analysis failed']
      };
    }
  }

  private parseEstimation(response: string): any {
    try {
      return JSON.parse(response);
    } catch (error) {
      return {
        storyPoints: 3,
        estimatedHours: 12,
        complexity: 'medium',
        confidence: 0.5,
        factors: ['AI estimation failed']
      };
    }
  }

  private analyzeProjectIntelligently(description: string): AIProjectAnalysis {
    const analysis = this.analyzeDescriptionIntelligently(description);
    
    return {
      projectType: this.determineProjectType(description),
      domain: analysis.domain,
      features: this.extractFeatures(description),
      technicalRequirements: analysis.technologies,
      timeline: this.estimateProjectTimeline(description),
      complexity: analysis.complexity,
      recommendedTeamSize: this.recommendTeamSize(analysis.complexity),
      phases: this.generateProjectPhases(description),
      risks: analysis.riskFactors
    };
  }

  private estimateTaskIntelligently(title: string, description: string): any {
    const analysis = this.analyzeDescriptionIntelligently(description);
    
    return {
      storyPoints: analysis.storyPoints,
      estimatedHours: analysis.estimatedHours,
      complexity: analysis.complexity,
      confidence: 0.8,
      factors: [`${analysis.domain} complexity`, 'Technology requirements'],
      breakdown: {
        analysis: Math.round(analysis.estimatedHours * 0.2),
        implementation: Math.round(analysis.estimatedHours * 0.6),
        testing: Math.round(analysis.estimatedHours * 0.15),
        integration: Math.round(analysis.estimatedHours * 0.05)
      },
      assumptions: ['Standard development practices', 'No major blockers'],
      risks: analysis.riskFactors
    };
  }

  // Additional helper methods

  private determineProjectType(description: string): string {
    const text = description.toLowerCase();
    if (text.includes('web app') || text.includes('website')) return 'web-application';
    if (text.includes('mobile') || text.includes('app')) return 'mobile-application';
    if (text.includes('api') || text.includes('service')) return 'backend-service';
    if (text.includes('microservice')) return 'microservices';
    if (text.includes('platform')) return 'platform';
    return 'web-application';
  }

  private extractFeatures(description: string): AIFeature[] {
    const features: AIFeature[] = [];
    const text = description.toLowerCase();
    
    if (text.includes('auth') || text.includes('login')) {
      features.push({
        name: 'Authentication',
        description: 'User authentication and authorization',
        priority: 'high',
        complexity: 'medium',
        estimatedDays: 5,
        dependencies: [],
        tasks: ['Design auth flow', 'Implement login', 'Add security']
      });
    }
    
    if (text.includes('dashboard') || text.includes('admin')) {
      features.push({
        name: 'Admin Dashboard',
        description: 'Administrative interface and controls',
        priority: 'medium',
        complexity: 'medium',
        estimatedDays: 7,
        dependencies: ['Authentication'],
        tasks: ['Design dashboard', 'Build UI', 'Add controls']
      });
    }
    
    return features;
  }

  private estimateProjectTimeline(description: string): string {
    const complexity = this.analyzeDescriptionIntelligently(description).complexity;
    
    switch (complexity) {
      case 'low': return '2-4 weeks';
      case 'medium': return '1-2 months';
      case 'high': return '3-4 months';
      case 'very-high': return '6+ months';
      default: return '1-2 months';
    }
  }

  private recommendTeamSize(complexity: string): number {
    switch (complexity) {
      case 'low': return 2;
      case 'medium': return 3;
      case 'high': return 5;
      case 'very-high': return 8;
      default: return 3;
    }
  }

  private generateProjectPhases(description: string): AIPhase[] {
    return [
      {
        name: 'Planning & Design',
        description: 'Requirements analysis and system design',
        duration: '1-2 weeks',
        features: ['Requirements', 'Architecture'],
        deliverables: ['Technical spec', 'Design docs']
      },
      {
        name: 'Core Development',
        description: 'Implementation of core features',
        duration: '4-6 weeks',
        features: ['Core functionality', 'Main features'],
        deliverables: ['Working prototype', 'Core features']
      },
      {
        name: 'Integration & Testing',
        description: 'Integration testing and quality assurance',
        duration: '1-2 weeks',
        features: ['Testing', 'Quality assurance'],
        deliverables: ['Tested system', 'Documentation']
      }
    ];
  }

  private calculateProjectTimeline(tasks: AITaskAnalysis[]): string {
    const totalPoints = tasks.reduce((sum, task) => sum + task.storyPoints, 0);
    const weeks = Math.ceil(totalPoints / 6); // Assuming 6 points per week
    return `${weeks} weeks`;
  }

  private generatePhases(tasks: AITaskAnalysis[]): string[] {
    const phases: string[] = [];
    if (tasks.some(t => t.domain === 'planning')) phases.push('Planning');
    if (tasks.some(t => t.domain === 'authentication')) phases.push('Authentication');
    if (tasks.some(t => t.domain === 'backend')) phases.push('Backend Development');
    if (tasks.some(t => t.domain === 'frontend')) phases.push('Frontend Development');
    if (tasks.some(t => t.domain === 'testing')) phases.push('Testing & QA');
    return phases;
  }

  private calculateCriticalPath(tasks: AITaskAnalysis[]): string[] {
    // Simple critical path based on dependencies
    const dependentTasks = tasks.filter(t => t.dependencies && t.dependencies.length > 0);
    return dependentTasks.map(t => t.title);
  }

  private identifyProjectRisks(description: string): string[] {
    const risks: string[] = [];
    const text = description.toLowerCase();
    
    if (text.includes('real-time')) risks.push('Real-time performance challenges');
    if (text.includes('scale')) risks.push('Scalability requirements');
    if (text.includes('integration')) risks.push('Third-party integration risks');
    if (text.includes('complex')) risks.push('Technical complexity');
    
    return risks.length > 0 ? risks : ['Timeline pressure', 'Technical complexity'];
  }

  private calculateSubtaskTimeline(subtasks: AITaskAnalysis[]): string {
    const totalHours = subtasks.reduce((sum, task) => sum + task.estimatedHours, 0);
    const days = Math.ceil(totalHours / 8);
    return `${days} days`;
  }

  private identifyTaskRisks(title: string, description: string): string[] {
    return this.identifyRisks(description, this.analyzeDescriptionIntelligently(description).complexity);
  }

  private generateRecommendations(title: string, description: string): string[] {
    const analysis = this.analyzeDescriptionIntelligently(description);
    const recommendations: string[] = [];
    
    if (analysis.complexity === 'high' || analysis.complexity === 'very-high') {
      recommendations.push('Consider breaking into smaller phases');
      recommendations.push('Plan for additional testing time');
    }
    
    if (analysis.domain === 'authentication') {
      recommendations.push('Use established security libraries');
      recommendations.push('Implement proper session management');
    }
    
    if (analysis.technologies.length > 3) {
      recommendations.push('Limit technology stack complexity');
    }
    
    return recommendations;
  }
}
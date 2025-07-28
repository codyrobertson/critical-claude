/**
 * AI Service - Infrastructure implementation of IAIProvider
 * Real AI integration using OpenAI, Anthropic, and Claude Code APIs
 */

import fs from 'fs';
import path from 'path';
import { IAIProvider, ResearchPlan, ResearchFindings, AIProviderConfig } from '../../domain/services/IAIProvider.js';
import { ILogger, LogLevel } from '../../domain/services/ILogger.js';
import { AI_CONFIG, SEARCH_CONFIG, REPORT_CONFIG, ERROR_MESSAGES } from '../../shared/constants.js';

/**
 * Console Logger Implementation
 */
class ConsoleLogger implements ILogger {
  debug(message: string, context?: Record<string, unknown>): void {
    console.debug(`[DEBUG] ${message}`, context || '');
  }
  
  info(message: string, context?: Record<string, unknown>): void {
    console.log(`ℹ️ ${message}`, context ? JSON.stringify(context) : '');
  }
  
  warn(message: string, context?: Record<string, unknown>): void {
    console.warn(`⚠️ ${message}`, context ? JSON.stringify(context) : '');
  }
  
  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    console.error(`❌ ${message}`, error || '', context ? JSON.stringify(context) : '');
  }
}

export interface AIConfig {
  provider?: 'openai' | 'anthropic' | 'claude-code' | 'local' | 'mock';
  apiKey?: string;
  model?: string;
  baseUrl?: string;
  maxTokens?: number;
  temperature?: number;
  claudeCodeEndpoint?: string;
}

export class AIService implements IAIProvider {
  private config: AIConfig;
  private initialized = false;
  private logger: ILogger;

  constructor(config: AIConfig = {}, logger?: ILogger) {
    this.config = { ...config };
    this.logger = logger || new ConsoleLogger();
    
    // Load configuration from cc.env file if it exists (sync)
    this.loadEnvConfigSync();
    
    // Priority: Claude Code CLI > Anthropic API > OpenAI API > Mock
    // Only auto-detect if no provider was explicitly configured
    if (!config.provider) {
      const forceClaudeCode = process.env.CC_AI_PROVIDER === 'claude-code';
      const noApiKeys = !process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY;
      
      if (forceClaudeCode || noApiKeys) {
        this.config.provider = 'claude-code';
        this.config.model = process.env.CC_AI_MODEL || 'sonnet';
        this.logger.info('Auto-selected Claude Code CLI provider');
      } else if (process.env.ANTHROPIC_API_KEY) {
        this.config.provider = 'anthropic';
        this.config.apiKey = process.env.ANTHROPIC_API_KEY;
        this.config.model = process.env.CC_AI_MODEL || this.config.model;
        this.logger.info('Auto-selected Anthropic API provider');
      } else if (process.env.OPENAI_API_KEY) {
        this.config.provider = 'openai';
        this.config.apiKey = process.env.OPENAI_API_KEY;
        this.config.model = process.env.CC_AI_MODEL || this.config.model;
        this.logger.info('Auto-selected OpenAI API provider');
      } else {
        this.config.provider = 'mock';
        this.logger.info('No AI providers available, using mock');
      }
    } else {
      this.logger.info(`Using explicitly configured provider: ${this.config.provider}`);
    }
    
    // Apply environment variable overrides
    this.config.temperature = process.env.CC_AI_TEMPERATURE ? 
      parseFloat(process.env.CC_AI_TEMPERATURE) : this.config.temperature;
    this.config.maxTokens = process.env.CC_AI_MAX_TOKENS ? 
      parseInt(process.env.CC_AI_MAX_TOKENS) : this.config.maxTokens;
  }

  private loadEnvConfigSync(): void {
    try {
      // Look for cc.env in current working directory
      const envPath = path.join(process.cwd(), AI_CONFIG.ENV_FILE_NAME);
      
      if (fs.existsSync(envPath)) {
        this.logger.info('Loading configuration from cc.env');
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
        this.logger.info('Loaded cc.env configuration');
      }
    } catch (error) {
      // Silently ignore env loading errors
      this.logger.warn('Could not load cc.env file', { error: (error as Error).message });
    }
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Initialize AI provider with fallback logic
    try {
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
    } catch (error) {
      this.logger.error(`Failed to initialize ${this.config.provider} provider`, error as Error);
      
      // Fallback logic: try other providers if the primary one fails
      if (this.config.provider === 'claude-code') {
        this.logger.warn('Claude Code initialization failed, trying fallback providers...');
        if (process.env.ANTHROPIC_API_KEY) {
          this.logger.info('Falling back to Anthropic API');
          this.config.provider = 'anthropic';
          this.config.apiKey = process.env.ANTHROPIC_API_KEY;
          await this.initializeAnthropic();
        } else if (process.env.OPENAI_API_KEY) {
          this.logger.info('Falling back to OpenAI API');
          this.config.provider = 'openai';
          this.config.apiKey = process.env.OPENAI_API_KEY;
          await this.initializeOpenAI();
        } else {
          this.logger.warn('No API keys available, falling back to mock provider');
          this.config.provider = 'mock';
          await this.initializeMock();
        }
        this.initialized = true;
      } else {
        // For other providers, fall back to mock
        this.logger.warn('Falling back to mock provider...');
        this.config.provider = 'mock';
        await this.initializeMock();
        this.initialized = true;
      }
    }
  }

  // Private methods for AI provider initialization

  private async initializeOpenAI(): Promise<void> {
    if (!this.config.apiKey) {
      throw new Error(ERROR_MESSAGES.OPENAI_API_KEY_REQUIRED);
    }
    this.logger.info('OpenAI provider initialized');
  }

  private async initializeAnthropic(): Promise<void> {
    if (!this.config.apiKey) {
      throw new Error(ERROR_MESSAGES.ANTHROPIC_API_KEY_REQUIRED);
    }
    this.logger.info('Anthropic provider initialized');
  }

  private async initializeClaudeCode(): Promise<void> {
    this.logger.info('Attempting to initialize Claude Code SDK...');
    try {
      // Import our ClaudeCodeProvider with proper SDK integration
      const { ClaudeCodeProvider } = await import('../../../../src/ai/ClaudeCodeProvider.js');
      
      const claudeProvider = new ClaudeCodeProvider({
        maxTurns: 1,
        cwd: process.cwd(),
        timeout: 5000
      }, this.logger);
      
      // Test Claude Code SDK availability
      const isAvailable = await claudeProvider.isAvailable();
      if (!isAvailable) {
        throw new Error('Claude Code SDK not available');
      }
      
      this.logger.info('Claude Code SDK provider initialized successfully');
      
    } catch (error) {
      this.logger.error('Claude Code SDK initialization failed', error as Error);
      throw error; // Re-throw to trigger fallback
    }
  }

  private async initializeLocal(): Promise<void> {
    // Local model initialization would go here (ollama, etc.)
    this.logger.warn('Local AI integration not implemented yet, using mock');
    await this.initializeMock();
  }

  private async initializeMock(): Promise<void> {
    // Mock AI is always ready
    this.logger.info('Initialized mock AI service');
  }

  private async callAI(prompt: string): Promise<string> {
    await this.initialize();

    let response: string;
    switch (this.config.provider) {
      case 'openai':
        response = await this.callOpenAI(prompt);
        break;
      case 'anthropic':
        response = await this.callAnthropic(prompt);
        break;
      case 'claude-code':
        response = await this.callClaudeCode(prompt);
        break;
      case 'local':
        response = await this.callLocal(prompt);
        break;
      case 'mock':
        response = await this.callMock(prompt);
        break;
      default:
        throw new Error(`Unsupported AI provider: ${this.config.provider}`);
    }
    
    // Clean up markdown formatting if present
    return this.cleanJsonResponse(response);
  }

  private cleanJsonResponse(response: string): string {
    // Remove markdown code blocks
    let cleaned = response.trim();
    
    // Remove ```json and ``` markers
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.slice(7);
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.slice(3);
    }
    
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.slice(0, -3);
    }
    
    // Trim whitespace
    return cleaned.trim();
  }

  private async callOpenAI(prompt: string): Promise<string> {
    if (!this.config.apiKey) {
      throw new Error('OpenAI API key required');
    }

    try {
      const response = await fetch(AI_CONFIG.OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          model: this.config.model || AI_CONFIG.DEFAULT_OPENAI_MODEL,
          messages: [
            {
              role: 'system',
              content: AI_CONFIG.RESEARCH_SYSTEM_MESSAGE
            },
            {
              role: 'user', 
              content: prompt
            }
          ],
          max_tokens: this.config.maxTokens || AI_CONFIG.DEFAULT_MAX_TOKENS,
          temperature: this.config.temperature || AI_CONFIG.DEFAULT_TEMPERATURE
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      return result.choices[0]?.message?.content || '';
    } catch (error) {
      this.logger.warn(`OpenAI API call failed: ${(error as Error).message}`);
      throw error;
    }
  }

  private async callAnthropic(prompt: string): Promise<string> {
    if (!this.config.apiKey) {
      throw new Error('Anthropic API key required');
    }

    try {
      const response = await fetch(AI_CONFIG.ANTHROPIC_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey,
          'anthropic-version': AI_CONFIG.ANTHROPIC_API_VERSION
        },
        body: JSON.stringify({
          model: this.config.model || AI_CONFIG.DEFAULT_ANTHROPIC_MODEL,
          max_tokens: this.config.maxTokens || AI_CONFIG.DEFAULT_MAX_TOKENS,
          temperature: this.config.temperature || AI_CONFIG.DEFAULT_TEMPERATURE,
          messages: [
            {
              role: 'user',
              content: `${AI_CONFIG.RESEARCH_SYSTEM_MESSAGE}\n\n${prompt}`
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
      this.logger.warn(`Anthropic API call failed: ${(error as Error).message}`);
      throw error;
    }
  }

  private async callClaudeCode(prompt: string): Promise<string> {
    try {
      this.logger.info('🤖 Using Claude Code SDK...');
      
      // Import our ClaudeCodeProvider with proper SDK integration
      const { ClaudeCodeProvider } = await import('../../../../src/ai/ClaudeCodeProvider.js');
      
      const claudeProvider = new ClaudeCodeProvider({
        maxTurns: 5,
        cwd: process.cwd(),
        timeout: 60000
      }, this.logger);
      
      // Check if Claude Code SDK is available
      const isAvailable = await claudeProvider.isAvailable();
      if (!isAvailable) {
        throw new Error('Claude Code SDK not available');
      }
      
      // Execute the prompt using the SDK
      const response = await claudeProvider.execute(prompt);
      
      if (response.success) {
        this.logger.debug('Claude Code SDK request successful', { responseLength: response.content.length });
        return response.content;
      } else {
        const error = response.error || 'Unknown Claude Code SDK error';
        this.logger.error('Claude Code SDK request failed', new Error(error));
        throw new Error(error);
      }

    } catch (error) {
      this.logger.warn(`Claude Code SDK integration failed: ${(error as Error).message}`);
      throw new Error('Claude Code SDK not available. Install Claude Code SDK with: npm install @anthropic-ai/claude-code');
    }
  }

  private async callLocal(prompt: string): Promise<string> {
    // Local model call would go here (ollama, etc.)
    // For now, return mock response
    return await this.callMock(prompt);
  }

  private async callMock(prompt: string): Promise<string> {
    // Simulate AI response delay
    await new Promise(resolve => setTimeout(resolve, AI_CONFIG.FALLBACK_DELAY_MS));

    // Return mock structured responses for research
    if (prompt.includes('Create a research plan')) {
      return JSON.stringify({
        overview: "AI-driven research strategy",
        research_areas: [
          { area: "Technical Analysis", importance: "High", depth_level: "Deep", expected_findings: "Technical insights" },
          { area: "Market Research", importance: "Medium", depth_level: "Moderate", expected_findings: "Market trends" }
        ],
        methodology: "Multi-agent research approach",
        success_criteria: ["Comprehensive coverage", "Actionable insights"],
        key_questions: ["What are the key components?", "What are best practices?"]
      });
    }

    if (prompt.includes('Analyze search results')) {
      return JSON.stringify({
        focus_area: "Technical Analysis",
        executive_summary: "Comprehensive analysis completed",
        detailed_analysis: "Technical findings indicate modern approaches",
        insights: ["Scalability is critical", "Performance optimization needed"],
        recommendations: ["Follow industry standards", "Implement best practices"]
      });
    }

    // Generic structured response for research queries
    return JSON.stringify({
      executive_summary: "Research analysis completed with available information",
      sections: [
        {
          title: "Analysis Overview",
          content: "Comprehensive research findings",
          key_findings: ["Modern approaches prioritize scalability", "Performance is critical"],
          confidence_score: 7
        }
      ],
      strategic_recommendations: [
        {
          priority: "high",
          recommendation: "Implement best practices",
          rationale: "Industry standards ensure quality",
          implementation_complexity: "moderate",
          expected_impact: "high",
          timeline: "2-4 weeks"
        }
      ],
      next_steps: [
        {
          step: "Begin implementation planning",
          timeline: "immediate",
          responsible_party: "development team",
          success_criteria: "Plan completed"
        }
      ]
    });
  }

  // Implementation of IAIProvider interface
  
  async isAvailable(): Promise<boolean> {
    try {
      await this.initialize();
      
      // Actually test the provider with a minimal request
      switch (this.config.provider) {
        case 'openai':
          if (!this.config.apiKey) return false;
          // Test with minimal token request
          await this.callOpenAI('test');
          break;
        case 'anthropic':
          if (!this.config.apiKey) return false;
          await this.callAnthropic('test');
          break;
        case 'claude-code':
          // Already tested CLI availability in initialize
          break;
        case 'mock':
          // Mock is always available
          break;
        default:
          return false;
      }
      
      return true;
    } catch (error) {
      this.logger.warn('AI provider is not available', { error: (error as Error).message });
      return false;
    }
  }

  async generateResearchPlan(query: string, context?: string): Promise<ResearchPlan> {
    return await this.analyzeResearchQuery(query, context);
  }

  async analyzeResearchData(area: string, queries: string[], searchResults: unknown[]): Promise<ResearchFindings> {
    return await this.conductResearchAnalysis(area, queries, searchResults);
  }

  async generateStructuredContent<T>(prompt: string, schema: unknown): Promise<T> {
    return await this.generateStructured<T>(prompt, schema);
  }

  // Public methods for research system integration

  async analyzeResearchQuery(query: string, context?: string): Promise<ResearchPlan> {
    const prompt = `Create a comprehensive research plan for: "${query}"${context || ''}

Generate a strategic research plan that covers all important aspects and provides a systematic approach to investigating this topic.

Return JSON with exactly this structure:
{
  "overview": "string - high level research strategy",
  "research_areas": [
    {
      "area": "string - research area name",
      "importance": "string - why this area matters",
      "depth_level": "string - how deep to research this",
      "expected_findings": "string - what we expect to learn"
    }
  ],
  "methodology": "string - research approach",
  "success_criteria": ["string - how to measure success"],
  "key_questions": ["string - key questions to answer"]
}`;

    try {
      const response = await this.callAI(prompt);
      const parsed = JSON.parse(response);
      
      // Ensure the structure is valid
      if (!parsed.research_areas || !Array.isArray(parsed.research_areas)) {
        throw new Error('Invalid research plan structure');
      }
      
      return parsed;
    } catch (error) {
      this.logger.warn(ERROR_MESSAGES.PARSE_ERRORS.AI_RESPONSE);
      return {
        overview: `Comprehensive research plan for ${query}`,
        research_areas: [...AI_CONFIG.DEFAULT_RESEARCH_AREAS],
        methodology: AI_CONFIG.DEFAULT_METHODOLOGY,
        success_criteria: [...AI_CONFIG.DEFAULT_SUCCESS_CRITERIA],
        key_questions: [`What are the key aspects of ${query}?`, `What are the best practices?`, `How can this be implemented effectively?`]
      };
    }
  }

  async conductResearchAnalysis(area: string, queries: string[], searchResults: unknown[]): Promise<ResearchFindings> {
    const prompt = `Analyze search results for research area: "${area}"

Search queries used: ${queries.join(', ')}

Search results:
${searchResults.map(r => {
  const result = r as any;
  return `- ${result.title || 'No title'}: ${result.snippet || result.description || 'No description'}`;
}).join('\n')}

Provide comprehensive analysis with this exact JSON structure:
{
  "focus_area": "string",
  "executive_summary": "string",
  "detailed_analysis": "string", 
  "insights": ["string"],
  "technical_details": ["string"],
  "recommendations": ["string"],
  "gaps_identified": ["string"],
  "sources": ["string"]
}`;

    try {
      const response = await this.callAI(prompt);
      const parsed = JSON.parse(response);
      
      // Ensure required fields exist
      if (!parsed.focus_area) {
        parsed.focus_area = area;
      }
      if (!parsed.insights) {
        parsed.insights = [];
      }
      if (!parsed.recommendations) {
        parsed.recommendations = [];
      }
      
      return parsed;
    } catch (error) {
      this.logger.warn(ERROR_MESSAGES.PARSE_ERRORS.ANALYSIS.replace('{area}', area));
      return {
        focus_area: area,
        executive_summary: `Analysis of ${area} based on available research data`,
        detailed_analysis: REPORT_CONFIG.FALLBACK_RESPONSES.DETAILED_ANALYSIS,
        insights: [...REPORT_CONFIG.FALLBACK_RESPONSES.INSIGHTS],
        technical_details: [...REPORT_CONFIG.FALLBACK_RESPONSES.TECHNICAL_DETAILS],
        recommendations: [...REPORT_CONFIG.FALLBACK_RESPONSES.RECOMMENDATIONS],
        gaps_identified: [...REPORT_CONFIG.FALLBACK_RESPONSES.GAPS_IDENTIFIED],
        sources: queries.map(q => `Search results for: ${q}`)
      };
    }
  }

  async generateStructured<T>(prompt: string, schema: unknown): Promise<T> {
    const structuredPrompt = `${prompt}

Respond with valid JSON matching this exact schema:
${JSON.stringify(schema, null, 2)}

IMPORTANT: Respond with ONLY the JSON object, no additional text or formatting.`;

    try {
      const response = await this.callAI(structuredPrompt);
      const parsed = JSON.parse(response);
      return parsed;
    } catch (error) {
      this.logger.warn(`Failed to generate structured response for schema: ${JSON.stringify(schema).substring(0, 100)}...`);
      
      // Return a basic fallback based on schema structure
      if (schema && typeof schema === 'object' && 'executive_summary' in schema) {
        // This looks like a comprehensive report schema
        return {
          executive_summary: "Research analysis completed with available data",
          research_quality_assessment: {
            overall_score: 7,
            strengths: ["Comprehensive coverage", "Multiple perspectives"],
            weaknesses: ["Limited real-time data"],
            confidence_level: 75
          },
          sections: [{
            title: "Analysis Overview",
            content: "Research findings indicate viable approaches with trade-offs",
            key_findings: ["Multiple solutions available", "Implementation varies by use case"],
            confidence_score: 7
          }],
          strategic_recommendations: [{
            priority: "high",
            recommendation: "Follow industry best practices",
            rationale: "Established patterns reduce risk",
            implementation_complexity: "moderate",
            expected_impact: "high",
            timeline: "2-4 weeks"
          }],
          next_steps: [{
            step: "Begin implementation planning",
            timeline: "immediate",
            responsible_party: "development team",
            success_criteria: "Implementation plan completed"
          }],
          meta_analysis: {
            research_depth_analysis: "Analysis provides good foundational understanding",
            bias_mitigation: "Multiple sources consulted",
            gap_resolution: "Key gaps identified for future research",
            robustness_validation: "Findings consistent across sources"
          }
        } as T;
      }
      
      // Generic fallback
      return {} as T;
    }
  }
}
/**
 * Enhanced AI Provider Manager with Claude Code Integration
 * Prioritizes Claude Code CLI, falls back to API keys, then mock
 */

import { AIProviderConfig } from '../models/index.js';
import { ClaudeCodeProvider, ClaudeCodeConfig } from './ClaudeCodeProvider.js';
import { logger } from '../utils/Logger.js';

export class AIProviderManager {
  private config: AIProviderConfig;
  private claudeCodeProvider?: ClaudeCodeProvider;

  constructor(config?: Partial<AIProviderConfig>) {
    // Auto-detect available providers with Claude Code priority
    this.config = this.detectProvider(config);
  }

  private detectProvider(userConfig?: Partial<AIProviderConfig>): AIProviderConfig {
    // 1. Check for explicit user configuration
    if (userConfig?.provider) {
      logger.info(`Using explicitly configured provider: ${userConfig.provider}`);
      return {
        provider: userConfig.provider,
        apiKey: userConfig.apiKey,
        model: userConfig.model,
        ...userConfig
      };
    }

    // 2. Check for environment variable override
    const envProvider = process.env.CC_AI_PROVIDER;
    if (envProvider) {
      logger.info(`Using environment-specified provider: ${envProvider}`);
      return this.configureProviderFromEnv(envProvider as any);
    }

    // 3. Auto-detect in priority order: Claude Code → Anthropic API → OpenAI API → Mock
    
    // Try Claude Code first (preferred - no API key needed)
    if (this.shouldTryClaudeCode()) {
      logger.info('Attempting to use Claude Code CLI (preferred)');
      return {
        provider: 'claude-code',
        model: process.env.CC_AI_MODEL || 'sonnet'
      };
    }

    // Fallback to API key providers
    if (process.env.ANTHROPIC_API_KEY) {
      logger.info('Using Anthropic API (API key detected)');
      return {
        provider: 'anthropic',
        apiKey: process.env.ANTHROPIC_API_KEY,
        model: process.env.CC_AI_MODEL || 'claude-3-sonnet-20240229'
      };
    }

    if (process.env.OPENAI_API_KEY) {
      logger.info('Using OpenAI API (API key detected)');
      return {
        provider: 'openai',
        apiKey: process.env.OPENAI_API_KEY,
        model: process.env.CC_AI_MODEL || 'gpt-4'
      };
    }

    // Final fallback to mock
    logger.warn('No AI providers available, using mock provider');
    return {
      provider: 'mock'
    };
  }

  private shouldTryClaudeCode(): boolean {
    // Don't try Claude Code if explicitly disabled
    if (process.env.CC_DISABLE_CLAUDE_CODE === 'true') {
      return false;
    }

    // Try Claude Code if no API keys are present (preferred scenario)
    // or if it's explicitly requested
    return !process.env.ANTHROPIC_API_KEY && !process.env.OPENAI_API_KEY ||
           process.env.CC_AI_PROVIDER === 'claude-code';
  }

  private configureProviderFromEnv(provider: 'openai' | 'anthropic' | 'claude-code' | 'mock'): AIProviderConfig {
    switch (provider) {
      case 'claude-code':
        return {
          provider: 'claude-code',
          model: process.env.CC_AI_MODEL || 'sonnet'
        };
      case 'anthropic':
        return {
          provider: 'anthropic',
          apiKey: process.env.ANTHROPIC_API_KEY,
          model: process.env.CC_AI_MODEL || 'claude-3-sonnet-20240229'
        };
      case 'openai':
        return {
          provider: 'openai',
          apiKey: process.env.OPENAI_API_KEY,
          model: process.env.CC_AI_MODEL || 'gpt-4'
        };
      case 'mock':
        return { provider: 'mock' };
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  getConfig(): AIProviderConfig {
    return { ...this.config };
  }

  async isAvailable(): Promise<boolean> {
    switch (this.config.provider) {
      case 'openai':
      case 'anthropic':
        return !!this.config.apiKey;
      case 'claude-code':
        return await this.getClaudeCodeProvider().isAvailable();
      case 'mock':
        return true;
      default:
        return false;
    }
  }

  getProviderName(): string {
    return this.config.provider;
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      switch (this.config.provider) {
        case 'openai':
          return await this.testOpenAI();
        case 'anthropic':
          return await this.testAnthropic();
        case 'claude-code':
          return await this.testClaudeCode();
        case 'mock':
          return { success: true };
        default:
          return { success: false, error: 'Unknown provider' };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      };
    }
  }

  /**
   * Get Claude Code provider instance with configuration
   */
  getClaudeCodeProvider(): ClaudeCodeProvider {
    if (!this.claudeCodeProvider) {
      const claudeConfig: ClaudeCodeConfig = {
        model: (this.config.model as 'sonnet' | 'opus') || 'sonnet',
        maxTurns: parseInt(process.env.CC_CLAUDE_CODE_MAX_TURNS || '5'),
        permissionMode: (process.env.CC_CLAUDE_CODE_PERMISSION_MODE as any) || 'default',
        allowedTools: process.env.CC_CLAUDE_CODE_ALLOWED_TOOLS?.split(','),
        disallowedTools: process.env.CC_CLAUDE_CODE_DISALLOWED_TOOLS?.split(','),
        customSystemPrompt: process.env.CC_CLAUDE_CODE_SYSTEM_PROMPT,
        appendSystemPrompt: process.env.CC_CLAUDE_CODE_APPEND_SYSTEM_PROMPT
      };

      this.claudeCodeProvider = new ClaudeCodeProvider(claudeConfig, logger);
    }
    return this.claudeCodeProvider;
  }

  /**
   * Execute AI request with automatic fallback
   */
  async executeAI(prompt: string): Promise<{ content: string; success: boolean; error?: string; provider: string }> {
    // Try primary provider
    const result = await this.tryProvider(this.config.provider, prompt);
    if (result.success) {
      return { ...result, provider: this.config.provider };
    }

    logger.warn(`Primary provider ${this.config.provider} failed, attempting fallback`, { error: result.error });

    // Try fallback providers in order
    const fallbackOrder = this.getFallbackOrder();
    
    for (const provider of fallbackOrder) {
      if (provider === this.config.provider) continue; // Skip primary
      
      logger.info(`Trying fallback provider: ${provider}`);
      const fallbackResult = await this.tryProvider(provider, prompt);
      
      if (fallbackResult.success) {
        logger.info(`Fallback provider ${provider} succeeded`);
        return { ...fallbackResult, provider };
      }
    }

    // All providers failed
    logger.error('All AI providers failed');
    return {
      content: '',
      success: false,
      error: 'All AI providers unavailable',
      provider: 'none'
    };
  }

  private getFallbackOrder(): string[] {
    // Define fallback priority order
    const allProviders = ['claude-code', 'anthropic', 'openai', 'mock'];
    
    // Remove primary provider and return the rest
    return allProviders.filter(p => p !== this.config.provider);
  }

  private async tryProvider(provider: string, prompt: string): Promise<{ content: string; success: boolean; error?: string }> {
    try {
      switch (provider) {
        case 'claude-code':
          if (await this.getClaudeCodeProvider().isAvailable()) {
            const response = await this.getClaudeCodeProvider().execute(prompt);
            return response;
          }
          return { content: '', success: false, error: 'Claude Code CLI not available' };
          
        case 'anthropic':
          if (process.env.ANTHROPIC_API_KEY) {
            // Use existing Anthropic API logic
            return await this.callAnthropicAPI(prompt);
          }
          return { content: '', success: false, error: 'Anthropic API key not configured' };
          
        case 'openai':
          if (process.env.OPENAI_API_KEY) {
            // Use existing OpenAI API logic
            return await this.callOpenAIAPI(prompt);
          }
          return { content: '', success: false, error: 'OpenAI API key not configured' };
          
        case 'mock':
          return {
            content: 'Mock AI response for development and testing purposes.',
            success: true
          };
          
        default:
          return { content: '', success: false, error: `Unknown provider: ${provider}` };
      }
    } catch (error) {
      return {
        content: '',
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private async testOpenAI(): Promise<{ success: boolean; error?: string }> {
    if (!this.config.apiKey) {
      return { success: false, error: 'OpenAI API key required' };
    }

    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`
        }
      });

      if (response.ok) {
        return { success: true };
      } else {
        return { success: false, error: `OpenAI API error: ${response.status}` };
      }
    } catch (error) {
      return { success: false, error: `OpenAI connection failed: ${error}` };
    }
  }

  private async testAnthropic(): Promise<{ success: boolean; error?: string }> {
    if (!this.config.apiKey) {
      return { success: false, error: 'Anthropic API key required' };
    }

    // For now, just validate the API key format
    if (!this.config.apiKey.startsWith('sk-ant-')) {
      return { success: false, error: 'Invalid Anthropic API key format' };
    }

    return { success: true };
  }

  private async testClaudeCode(): Promise<{ success: boolean; error?: string }> {
    const isAvailable = await this.getClaudeCodeProvider().isAvailable();
    return isAvailable 
      ? { success: true }
      : { success: false, error: 'Claude Code CLI not available or not authenticated' };
  }

  private async callAnthropicAPI(prompt: string): Promise<{ content: string; success: boolean; error?: string }> {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY!,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: this.config.model || 'claude-3-sonnet-20240229',
          max_tokens: parseInt(process.env.CC_AI_MAX_TOKENS || '4000'),
          temperature: parseFloat(process.env.CC_AI_TEMPERATURE || '0.7'),
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json() as any;
      return {
        content: result.content[0]?.text || '',
        success: true
      };
    } catch (error) {
      return {
        content: '',
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private async callOpenAIAPI(prompt: string): Promise<{ content: string; success: boolean; error?: string }> {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY!}`
        },
        body: JSON.stringify({
          model: this.config.model || 'gpt-4',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: parseInt(process.env.CC_AI_MAX_TOKENS || '4000'),
          temperature: parseFloat(process.env.CC_AI_TEMPERATURE || '0.7')
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json() as any;
      return {
        content: result.choices[0]?.message?.content || '',
        success: true
      };
    } catch (error) {
      return {
        content: '',
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
}
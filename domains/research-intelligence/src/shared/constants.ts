/**
 * Research Intelligence Domain Constants
 * Centralized configuration values to avoid magic numbers and strings
 */

export const AI_CONFIG = {
  DEFAULT_MAX_TOKENS: 4000,
  DEFAULT_TEMPERATURE: 0.7,
  FALLBACK_DELAY_MS: 500,
  
  // Default models
  DEFAULT_OPENAI_MODEL: 'gpt-4',
  DEFAULT_ANTHROPIC_MODEL: 'claude-3-5-sonnet-20241022',
  
  // API Configuration
  OPENAI_API_URL: 'https://api.openai.com/v1/chat/completions',
  ANTHROPIC_API_URL: 'https://api.anthropic.com/v1/messages',
  ANTHROPIC_API_VERSION: '2023-06-01',
  
  // System messages
  RESEARCH_SYSTEM_MESSAGE: 'You are an expert research analyst. Provide detailed, structured responses in the exact JSON format requested.',
  
  // Research Configuration
  DEFAULT_TEAM_SIZE: 3,
  MAX_SEARCH_QUERIES_PER_AREA: 5,
  
  // Quality thresholds
  DEFAULT_QUALITY_SCORE: 7,
  DEFAULT_CONFIDENCE_LEVEL: 75,
  
  // File and Path Configuration
  ENV_FILE_NAME: 'cc.env',
  RESEARCH_REPORTS_DIR: 'research-reports',
  
  // Claude Code CLI
  CLAUDE_CLI_COMMAND: 'claude',
  CLAUDE_CLI_ARGS: ['-p', '--output-format', 'json', '--max-turns', '1'],
  
  // Research Areas
  DEFAULT_RESEARCH_AREAS: [
    {
      area: 'Core Concepts and Fundamentals',
      importance: 'Essential foundation understanding',
      depth_level: 'deep' as const,
      expected_findings: 'Fundamental principles and key concepts'
    },
    {
      area: 'Current Best Practices',
      importance: 'Industry standard approaches',
      depth_level: 'moderate' as const,
      expected_findings: 'Proven methodologies and techniques'
    },
    {
      area: 'Implementation Strategies',
      importance: 'Practical application guidance',
      depth_level: 'moderate' as const,
      expected_findings: 'Step-by-step implementation approaches'
    }
  ],
  
  // Success criteria
  DEFAULT_SUCCESS_CRITERIA: [
    'Comprehensive topic coverage',
    'Actionable recommendations', 
    'Clear implementation guidance'
  ],
  
  // Methodology
  DEFAULT_METHODOLOGY: 'Multi-agent AI research with web search and analysis'
} as const;

export const SEARCH_CONFIG = {
  DEFAULT_QUERY_TEMPLATES: [
    '{area} best practices',
    '{area} current trends 2024', 
    '{area} implementation challenges',
    '{area} expert analysis',
    '{area} market research'
  ]
} as const;

export const REPORT_CONFIG = {
  FILE_EXTENSION: '.md',
  TIMESTAMP_FORMAT: 'YYYY-MM-DDTHH-mm-ss-SSSZ',
  PREFIX: 'research-',
  
  QUALITY_ASSESSMENT_DEFAULTS: {
    overall_score: 7,
    confidence_level: 75,
    strengths: ['Comprehensive coverage'],
    weaknesses: ['Limited real-time data']
  },
  
  FALLBACK_RESPONSES: {
    EXECUTIVE_SUMMARY: 'Research analysis completed with available data',
    DETAILED_ANALYSIS: 'Comprehensive analysis indicates multiple viable approaches with various trade-offs and considerations.',
    INSIGHTS: ['Multiple approaches are available', 'Implementation requires careful planning', 'Best practices should be followed'],
    TECHNICAL_DETAILS: ['Technical implementation varies by use case', 'Performance considerations are important'],
    RECOMMENDATIONS: ['Follow industry standards', 'Conduct thorough testing', 'Consider scalability requirements'],
    GAPS_IDENTIFIED: ['More specific use case analysis needed']
  }
} as const;

export const ERROR_MESSAGES = {
  AI_PROVIDER_UNAVAILABLE: 'AI provider is not available',
  OPENAI_API_KEY_REQUIRED: 'OpenAI API key is required',
  ANTHROPIC_API_KEY_REQUIRED: 'Anthropic API key is required',
  CLAUDE_CODE_NOT_FOUND: 'Claude Code CLI not found or not working',
  CLAUDE_CODE_SPAWN_ERROR: 'Claude Code CLI not available',
  INVALID_RESEARCH_PLAN: 'Invalid research plan structure',
  FILE_READ_ERROR: 'Could not read file',
  ENV_FILE_LOAD_ERROR: 'Could not load cc.env file',
  
  PARSE_ERRORS: {
    AI_RESPONSE: 'Failed to parse AI response, using fallback research plan',
    ANALYSIS: 'Failed to parse AI analysis for {area}, using fallback',
    STRUCTURED_RESPONSE: 'Failed to generate structured response for schema'
  }
} as const;
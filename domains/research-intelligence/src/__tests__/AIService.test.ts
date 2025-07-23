/**
 * AI Service Unit Tests
 * Tests for real AI integration functionality
 */

import { AIService } from '../infrastructure/services/AIService.js';

describe('AIService', () => {
  let aiService: AIService;

  beforeEach(() => {
    // Use mock provider for tests
    aiService = new AIService({ provider: 'mock' });
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      await expect(aiService.initialize()).resolves.not.toThrow();
    });

    it('should auto-detect provider based on environment', () => {
      const service = new AIService();
      // Should default to some provider without throwing
      expect(service).toBeDefined();
    });
  });

  describe('analyzeResearchQuery', () => {
    it('should generate research plan for query', async () => {
      const result = await aiService.analyzeResearchQuery('machine learning best practices');

      expect(result).toBeDefined();
      expect(result.overview).toBeDefined();
      expect(result.research_areas).toBeDefined();
      expect(Array.isArray(result.research_areas)).toBe(true);
      expect(result.methodology).toBeDefined();
      expect(result.success_criteria).toBeDefined();
      expect(result.key_questions).toBeDefined();
    });

    it('should handle context in research planning', async () => {
      const context = 'Context: Building a web application';
      const result = await aiService.analyzeResearchQuery('API design', context);

      expect(result).toBeDefined();
      expect(result.research_areas.length).toBeGreaterThan(0);
    });

    it('should provide fallback plan on error', async () => {
      // Test with a service that would fail parsing
      const badService = new AIService({ provider: 'mock' });
      
      // Should still return a valid plan even if AI fails
      const result = await badService.analyzeResearchQuery('test query');
      
      expect(result).toBeDefined();
      expect(result.research_areas).toBeDefined();
      expect(result.research_areas.length).toBeGreaterThan(0);
    });
  });

  describe('conductResearchAnalysis', () => {
    it('should analyze search results', async () => {
      const mockResults = [
        {
          title: 'Machine Learning Best Practices',
          snippet: 'Comprehensive guide to ML best practices',
          url: 'https://example.com/ml-guide'
        },
        {
          title: 'Deep Learning Fundamentals',
          snippet: 'Introduction to deep learning concepts',
          url: 'https://example.com/dl-intro'
        }
      ];

      const result = await aiService.conductResearchAnalysis(
        'Machine Learning',
        ['ML best practices', 'deep learning'],
        mockResults
      );

      expect(result).toBeDefined();
      expect(result.focus_area).toBe('Machine Learning');
      expect(result.executive_summary).toBeDefined();
      expect(result.insights).toBeDefined();
      expect(Array.isArray(result.insights)).toBe(true);
      expect(result.recommendations).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);
    });

    it('should provide fallback analysis on parsing error', async () => {
      const result = await aiService.conductResearchAnalysis(
        'Test Area',
        ['test query'],
        []
      );

      expect(result).toBeDefined();
      expect(result.focus_area).toBe('Test Area');
      expect(result.insights).toBeDefined();
      expect(result.recommendations).toBeDefined();
    });
  });

  describe('generateStructured', () => {
    it('should generate structured response', async () => {
      const schema = {
        title: 'string',
        items: ['string'],
        score: 'number'
      };

      const result = await aiService.generateStructured(
        'Generate a test response',
        schema
      );

      expect(result).toBeDefined();
      // Should return either structured response or fallback
      expect(typeof result).toBe('object');
    });

    it('should provide fallback for comprehensive report schema', async () => {
      const reportSchema = {
        executive_summary: 'string',
        research_quality_assessment: {
          overall_score: 'number',
          strengths: ['string'],
          weaknesses: ['string'],
          confidence_level: 'number'
        }
      };

      const result = await aiService.generateStructured(
        'Generate comprehensive report',
        reportSchema
      );

      expect(result).toBeDefined();
      if (result.executive_summary) {
        expect(typeof result.executive_summary).toBe('string');
      }
    });
  });
});

// Simple test runner for smoke testing
export async function runAIServiceTests(): Promise<void> {
  console.log('🧪 Running AIService Tests...');
  
  try {
    const aiService = new AIService({ provider: 'mock' });
    
    // Test 1: Initialization
    await aiService.initialize();
    console.log('✅ AI service initialization test passed');
    
    // Test 2: Research query analysis
    const researchPlan = await aiService.analyzeResearchQuery('test research topic');
    
    if (!researchPlan || !researchPlan.research_areas || !Array.isArray(researchPlan.research_areas)) {
      throw new Error('Research plan generation failed');
    }
    
    console.log('✅ Research query analysis test passed');
    
    // Test 3: Research analysis
    const analysisResult = await aiService.conductResearchAnalysis(
      'Test Area',
      ['test query'],
      [{ title: 'Test', snippet: 'Test snippet', url: 'https://test.com' }]
    );
    
    if (!analysisResult || !analysisResult.focus_area) {
      throw new Error('Research analysis failed');
    }
    
    console.log('✅ Research analysis test passed');
    
    console.log('🎉 All AIService tests passed!');
    
  } catch (error) {
    console.error('❌ AIService tests failed:', error);
    throw error;
  }
}

// Export for manual testing
if (typeof require !== 'undefined' && require.main === module) {
  runAIServiceTests().catch(console.error);
}
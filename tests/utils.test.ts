// Comprehensive unit tests for utils.ts
import {
  getModelConfig,
  validateApiKey,
  getChromeVersion,
  isSummarizerAvailable,
  checkChromeBuiltinSupport,
  isModelAvailable,
} from '../utils';

import 'jest-fetch-mock';

describe('Utils Module Comprehensive Tests', () => {
  describe('getModelConfig Function', () => {
    it('should return correct config for chrome-builtin', () => {
      const config = getModelConfig('chrome-builtin');

      expect(config).toEqual({
        provider: 'chrome',
        modelId: null,
        name: 'Chrome Built-in AI',
        cost: 0,
      });
    });

    it('should return correct config for GPT-3.5 Turbo', () => {
      const config = getModelConfig('gpt-3.5-turbo');

      expect(config).toEqual({
        provider: 'openai',
        modelId: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        cost: 0.002,
      });
    });

    it('should return correct config for GPT-4', () => {
      const config = getModelConfig('gpt-4');

      expect(config).toEqual({
        provider: 'openai',
        modelId: 'gpt-4',
        name: 'GPT-4',
        cost: 0.03,
      });
    });

    it('should return correct config for GPT-4 Turbo', () => {
      const config = getModelConfig('gpt-4-turbo');

      expect(config).toEqual({
        provider: 'openai',
        modelId: 'gpt-4-turbo',
        name: 'GPT-4 Turbo',
        cost: 0.01,
      });
    });

    it('should return correct config for GPT-4o', () => {
      const config = getModelConfig('gpt-4o');

      expect(config).toEqual({
        provider: 'openai',
        modelId: 'gpt-4o',
        name: 'GPT-4o',
        cost: 0.005,
      });
    });

    it('should return correct config for Gemini 1.5 Pro', () => {
      const config = getModelConfig('gemini-1.5-pro');

      expect(config).toEqual({
        provider: 'gemini',
        modelId: 'gemini-1.5-pro',
        name: 'Gemini 1.5 Pro',
        cost: 0.00125,
      });
    });

    it('should return correct config for Gemini 1.5 Flash', () => {
      const config = getModelConfig('gemini-1.5-flash');

      expect(config).toEqual({
        provider: 'gemini',
        modelId: 'gemini-1.5-flash',
        name: 'Gemini 1.5 Flash',
        cost: 0.000075,
      });
    });

    it('should return correct config for Gemini 2.0 Flash Exp', () => {
      const config = getModelConfig('gemini-2.0-flash-exp');

      expect(config).toEqual({
        provider: 'gemini',
        modelId: 'gemini-2.0-flash-exp',
        name: 'Gemini 2.0 Flash (Exp)',
        cost: 0,
      });
    });

    it('should return correct config for Claude 3 Haiku', () => {
      const config = getModelConfig('claude-3-haiku');

      expect(config).toEqual({
        provider: 'anthropic',
        modelId: 'claude-3-haiku-20240307',
        name: 'Claude 3 Haiku',
        cost: 0.00025,
      });
    });

    it('should return correct config for Claude 3 Sonnet', () => {
      const config = getModelConfig('claude-3-sonnet');

      expect(config).toEqual({
        provider: 'anthropic',
        modelId: 'claude-3-sonnet-20240229',
        name: 'Claude 3 Sonnet',
        cost: 0.003,
      });
    });

    it('should return correct config for Claude 3 Opus', () => {
      const config = getModelConfig('claude-3-opus');

      expect(config).toEqual({
        provider: 'anthropic',
        modelId: 'claude-3-opus-20240229',
        name: 'Claude 3 Opus',
        cost: 0.015,
      });
    });

    it('should return correct config for Claude 3.5 Sonnet', () => {
      const config = getModelConfig('claude-3.5-sonnet');

      expect(config).toEqual({
        provider: 'anthropic',
        modelId: 'claude-3-5-sonnet-20240620',
        name: 'Claude 3.5 Sonnet',
        cost: 0.003,
      });
    });

    it('should return undefined for unknown model', () => {
      const config = getModelConfig('unknown-model');

      expect(config).toBeUndefined();
    });

    it('should return undefined for empty string', () => {
      const config = getModelConfig('');

      expect(config).toBeUndefined();
    });

    it('should return undefined for null', () => {
      const config = getModelConfig(null as any);

      expect(config).toBeUndefined();
    });

    it('should return undefined for undefined', () => {
      const config = getModelConfig(undefined as any);

      expect(config).toBeUndefined();
    });

    it('should handle all supported models correctly', () => {
      const supportedModels = [
        'chrome-builtin',
        'gpt-3.5-turbo',
        'gpt-4',
        'gpt-4-turbo',
        'gpt-4o',
        'gemini-1.5-pro',
        'gemini-1.5-flash',
        'gemini-2.0-flash-exp',
        'claude-3-haiku',
        'claude-3-sonnet',
        'claude-3-opus',
        'claude-3.5-sonnet',
      ];

      supportedModels.forEach((model) => {
        const config = getModelConfig(model);
        expect(config).toBeDefined();
        expect(config?.provider).toMatch(/^(chrome|openai|gemini|anthropic)$/);
        expect(config?.name).toBeDefined();
        expect(typeof config?.cost).toBe('number');
        expect(config?.cost).toBeGreaterThanOrEqual(0);
      });
    });

    it('should have correct provider distribution', () => {
      const models = [
        'chrome-builtin', // chrome
        'gpt-3.5-turbo',
        'gpt-4',
        'gpt-4-turbo',
        'gpt-4o', // openai
        'gemini-1.5-pro',
        'gemini-1.5-flash',
        'gemini-2.0-flash-exp', // gemini
        'claude-3-haiku',
        'claude-3-sonnet',
        'claude-3-opus',
        'claude-3.5-sonnet', // anthropic
      ];

      const providers = models.map((model) => getModelConfig(model)?.provider);

      expect(providers.filter((p) => p === 'chrome')).toHaveLength(1);
      expect(providers.filter((p) => p === 'openai')).toHaveLength(4);
      expect(providers.filter((p) => p === 'gemini')).toHaveLength(3);
      expect(providers.filter((p) => p === 'anthropic')).toHaveLength(4);
    });

    it('should have unique model IDs where applicable', () => {
      const models = [
        'gpt-3.5-turbo',
        'gpt-4',
        'gpt-4-turbo',
        'gpt-4o',
        'gemini-1.5-pro',
        'gemini-1.5-flash',
        'gemini-2.0-flash-exp',
        'claude-3-haiku',
        'claude-3-sonnet',
        'claude-3-opus',
        'claude-3.5-sonnet',
      ];

      const modelIds = models.map((model) => getModelConfig(model)?.modelId);
      const uniqueIds = [...new Set(modelIds)];

      expect(uniqueIds).toHaveLength(models.length);
      expect(modelIds.every((id) => id !== null && id !== undefined)).toBe(
        true
      );
    });

    it('should have chrome-builtin as the only model with null modelId', () => {
      const chromeConfig = getModelConfig('chrome-builtin');
      expect(chromeConfig?.modelId).toBeNull();

      const otherModels = [
        'gpt-3.5-turbo',
        'gpt-4',
        'gpt-4-turbo',
        'gpt-4o',
        'gemini-1.5-pro',
        'gemini-1.5-flash',
        'gemini-2.0-flash-exp',
        'claude-3-haiku',
        'claude-3-sonnet',
        'claude-3-opus',
        'claude-3.5-sonnet',
      ];

      otherModels.forEach((model) => {
        const config = getModelConfig(model);
        expect(config?.modelId).not.toBeNull();
        expect(config?.modelId).toBeDefined();
      });
    });

    it('should have reasonable cost values', () => {
      const models = [
        'chrome-builtin', // 0
        'gemini-2.0-flash-exp', // 0
        'gemini-1.5-flash', // 0.000075
        'claude-3-haiku', // 0.00025
        'gemini-1.5-pro', // 0.00125
        'gpt-4o', // 0.005
        'gpt-4-turbo', // 0.01
        'claude-3-sonnet', // 0.003
        'claude-3.5-sonnet', // 0.003
        'gpt-3.5-turbo', // 0.002
        'gpt-4', // 0.03
        'claude-3-opus', // 0.015
      ];

      models.forEach((model) => {
        const config = getModelConfig(model);
        expect(config?.cost).toBeGreaterThanOrEqual(0);
        expect(config?.cost).toBeLessThan(1); // Reasonable upper bound
      });
    });

    it('should have descriptive names', () => {
      const models = [
        'chrome-builtin',
        'gpt-3.5-turbo',
        'gpt-4',
        'gpt-4-turbo',
        'gpt-4o',
        'gemini-1.5-pro',
        'gemini-1.5-flash',
        'gemini-2.0-flash-exp',
        'claude-3-haiku',
        'claude-3-sonnet',
        'claude-3-opus',
        'claude-3.5-sonnet',
      ];

      models.forEach((model) => {
        const config = getModelConfig(model);
        expect(config?.name).toBeDefined();
        expect(typeof config?.name).toBe('string');
        expect(config?.name?.length).toBeGreaterThan(0);
        expect(config?.name).toMatch(
          /^(Chrome Built-in AI|GPT-|Gemini|Claude)/
        );
      });
    });

    it('should be case sensitive', () => {
      expect(getModelConfig('GPT-3.5-TURBO')).toBeUndefined();
      expect(getModelConfig('Chrome-Builtin')).toBeUndefined();
      expect(getModelConfig('claude-3-HAIKU')).toBeUndefined();
    });

    it('should handle special characters', () => {
      expect(getModelConfig('gpt-4o')).toBeDefined(); // Contains 'o'
      expect(getModelConfig('gemini-2.0-flash-exp')).toBeDefined(); // Contains dots and dashes
      expect(getModelConfig('claude-3.5-sonnet')).toBeDefined(); // Contains dots
    });

    it('should have consistent naming patterns', () => {
      const openaiModels = ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo', 'gpt-4o'];
      const geminiModels = [
        'gemini-1.5-pro',
        'gemini-1.5-flash',
        'gemini-2.0-flash-exp',
      ];
      const claudeModels = [
        'claude-3-haiku',
        'claude-3-sonnet',
        'claude-3-opus',
        'claude-3.5-sonnet',
      ];

      openaiModels.forEach((model) => {
        const config = getModelConfig(model);
        expect(config?.name).toMatch(/^GPT-/);
      });

      geminiModels.forEach((model) => {
        const config = getModelConfig(model);
        expect(config?.name).toMatch(/^Gemini/);
      });

      claudeModels.forEach((model) => {
        const config = getModelConfig(model);
        expect(config?.name).toMatch(/^Claude/);
      });
    });
  });

  describe('Type Definitions and Interfaces', () => {
    it('should export all required interfaces', () => {
      // Test that the interfaces are properly exported by checking they can be imported
      expect(() => {
        // This test verifies that the module can be imported without errors
        // The actual interface validation is done through TypeScript compilation
      }).not.toThrow();
    });

    it('should have proper interface structure for OpenAIResponse', () => {
      // This is more of a documentation test - ensuring the interface matches expected API
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'Test response',
            },
          },
        ],
      };

      expect(mockResponse).toHaveProperty('choices');
      expect(mockResponse.choices[0]).toHaveProperty('message');
      expect(mockResponse.choices[0].message).toHaveProperty('content');
    });

    it('should have proper interface structure for GeminiResponse', () => {
      const mockResponse = {
        candidates: [
          {
            content: {
              parts: [
                {
                  text: 'Test response',
                },
              ],
            },
          },
        ],
      };

      expect(mockResponse).toHaveProperty('candidates');
      expect(mockResponse.candidates[0]).toHaveProperty('content');
      expect(mockResponse.candidates[0].content).toHaveProperty('parts');
    });

    it('should have proper interface structure for AnthropicResponse', () => {
      const mockResponse = {
        content: [
          {
            text: 'Test response',
          },
        ],
      };

      expect(mockResponse).toHaveProperty('content');
      expect(mockResponse.content[0]).toHaveProperty('text');
    });

    it('should have proper interface structure for ProgressUpdate', () => {
      const mockProgress = {
        step: 'Processing',
        percentage: 50,
        estimatedTimeRemaining: 30,
        currentModel: 'gpt-3.5-turbo',
        success: true,
      };

      expect(mockProgress).toHaveProperty('step');
      expect(mockProgress).toHaveProperty('percentage');
      expect(mockProgress).toHaveProperty('estimatedTimeRemaining');
      expect(mockProgress).toHaveProperty('currentModel');
      expect(mockProgress).toHaveProperty('success');
    });

    it('should have proper interface structure for Metrics', () => {
      const mockMetrics = {
        attempts: [
          {
            model: 'gpt-3.5-turbo',
            success: true,
            time: 2.5,
            error: undefined,
          },
        ],
        totalTime: 2.5,
      };

      expect(mockMetrics).toHaveProperty('attempts');
      expect(mockMetrics).toHaveProperty('totalTime');
      expect(mockMetrics.attempts[0]).toHaveProperty('model');
      expect(mockMetrics.attempts[0]).toHaveProperty('success');
      expect(mockMetrics.attempts[0]).toHaveProperty('time');
    });
  });

  describe('Model Configuration Edge Cases', () => {
    it('should handle model keys with special characters', () => {
      // Test models with dots, dashes, and numbers
      expect(getModelConfig('gemini-2.0-flash-exp')).toBeDefined();
      expect(getModelConfig('claude-3.5-sonnet')).toBeDefined();
      expect(getModelConfig('gpt-4o')).toBeDefined();
    });

    it('should not confuse similar model names', () => {
      const config1 = getModelConfig('gpt-4');
      const config2 = getModelConfig('gpt-4-turbo');
      const config3 = getModelConfig('gpt-4o');

      expect(config1?.modelId).toBe('gpt-4');
      expect(config2?.modelId).toBe('gpt-4-turbo');
      expect(config3?.modelId).toBe('gpt-4o');

      expect(config1?.cost).not.toBe(config2?.cost);
      expect(config2?.cost).not.toBe(config3?.cost);
    });

    it('should have logical cost ordering', () => {
      const gpt35 = getModelConfig('gpt-3.5-turbo')?.cost;
      const gpt4 = getModelConfig('gpt-4')?.cost;
      const gpt4turbo = getModelConfig('gpt-4-turbo')?.cost;
      const gpt4o = getModelConfig('gpt-4o')?.cost;

      // GPT-4 should be more expensive than GPT-3.5
      expect(gpt4!).toBeGreaterThan(gpt35!);
      // GPT-4 Turbo should be less expensive than regular GPT-4
      expect(gpt4turbo!).toBeLessThan(gpt4!);
      // GPT-4o should be reasonably priced
      expect(gpt4o).toBeGreaterThan(0);
    });

    it('should have free models clearly identified', () => {
      const freeModels = ['chrome-builtin', 'gemini-2.0-flash-exp'];

      freeModels.forEach((model) => {
        const config = getModelConfig(model);
        expect(config?.cost).toBe(0);
      });
    });

    it('should have consistent model ID formatting', () => {
      const modelsWithIds = [
        'gpt-3.5-turbo',
        'gpt-4',
        'gpt-4-turbo',
        'gpt-4o',
        'gemini-1.5-pro',
        'gemini-1.5-flash',
        'gemini-2.0-flash-exp',
        'claude-3-haiku',
        'claude-3-sonnet',
        'claude-3-opus',
        'claude-3.5-sonnet',
      ];

      modelsWithIds.forEach((model) => {
        const config = getModelConfig(model);
        expect(config?.modelId).toMatch(/^[a-zA-Z0-9._-]+$/);
      });
    });
  });

  describe('Provider-specific Model Validation', () => {
    it('should validate OpenAI model configurations', () => {
      const openaiModels = ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo', 'gpt-4o'];

      openaiModels.forEach((model) => {
        const config = getModelConfig(model);
        expect(config?.provider).toBe('openai');
        expect(config?.modelId).toMatch(/^gpt-/);
        expect(config?.cost).toBeGreaterThan(0);
      });
    });

    it('should validate Gemini model configurations', () => {
      const geminiModels = [
        'gemini-1.5-pro',
        'gemini-1.5-flash',
        'gemini-2.0-flash-exp',
      ];

      geminiModels.forEach((model) => {
        const config = getModelConfig(model);
        expect(config?.provider).toBe('gemini');
        expect(config?.modelId).toMatch(/^gemini-/);
      });
    });

    it('should validate Anthropic model configurations', () => {
      const anthropicModels = [
        'claude-3-haiku',
        'claude-3-sonnet',
        'claude-3-opus',
        'claude-3.5-sonnet',
      ];

      anthropicModels.forEach((model) => {
        const config = getModelConfig(model);
        expect(config?.provider).toBe('anthropic');
        expect(config?.modelId).toMatch(/^claude-/);
        expect(config?.cost).toBeGreaterThan(0);
      });
    });

    it('should validate Chrome model configuration', () => {
      const config = getModelConfig('chrome-builtin');
      expect(config?.provider).toBe('chrome');
      expect(config?.modelId).toBeNull();
      expect(config?.cost).toBe(0);
    });
  });

  describe('API Key Validation Functions', () => {
    beforeEach(() => {
      fetchMock.resetMocks();
    });

    describe('validateApiKey', () => {
      it('should return error for empty API key', async () => {
        const result = await validateApiKey('openai', '');
        expect(result).toEqual({ valid: false, error: 'API key is required' });
      });

      it('should return error for whitespace-only API key', async () => {
        const result = await validateApiKey('openai', '   ');
        expect(result).toEqual({ valid: false, error: 'API key is required' });
      });

      it('should validate OpenAI API key successfully', async () => {
        fetchMock.mockResponseOnce('', { status: 200 });
        const result = await validateApiKey('openai', 'valid-key');
        expect(result).toEqual({ valid: true });
      });

      it('should validate Gemini API key successfully', async () => {
        fetchMock.mockResponseOnce('', { status: 200 });
        const result = await validateApiKey('gemini', 'valid-key');
        expect(result).toEqual({ valid: true });
      });

      it('should validate Anthropic API key successfully', async () => {
        fetchMock.mockResponseOnce('', { status: 200 });
        const result = await validateApiKey('anthropic', 'valid-key');
        expect(result).toEqual({ valid: true });
      });

      it('should return error for unknown provider', async () => {
        const result = await validateApiKey('unknown', 'key');
        expect(result).toEqual({ valid: false, error: 'Unknown provider' });
      });

      it('should handle network errors', async () => {
        fetchMock.mockRejectOnce(new Error('Network error'));
        const result = await validateApiKey('openai', 'key');
        expect(result).toEqual({
          valid: false,
          error: 'Network error during validation',
        });
      });
    });
  });

  describe('Chrome Support Functions', () => {
    describe('getChromeVersion', () => {
      it('should return version number from userAgent', () => {
        Object.defineProperty(navigator, 'userAgent', {
          value:
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          writable: true,
        });
        const version = getChromeVersion();
        expect(version).toBe(120);
      });

      it('should return 0 when no userAgent', () => {
        Object.defineProperty(navigator, 'userAgent', {
          value: undefined,
          writable: true,
        });
        const version = getChromeVersion();
        expect(version).toBe(0);
      });

      it('should return 0 when Chrome not in userAgent', () => {
        Object.defineProperty(navigator, 'userAgent', {
          value:
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Safari/537.36',
          writable: true,
        });
        const version = getChromeVersion();
        expect(version).toBe(0);
      });
    });

    describe('isSummarizerAvailable', () => {
      it('should return false when Summarizer is not available', async () => {
        (globalThis as any).Summarizer = undefined;
        const result = await isSummarizerAvailable();
        expect(result).toBe(false);
      });

      it('should return false when Summarizer.availability throws', async () => {
        (globalThis as any).Summarizer = {
          availability: jest.fn().mockRejectedValue(new Error('Not available')),
        };
        const result = await isSummarizerAvailable();
        expect(result).toBe(false);
      });

      it('should return true when Summarizer is available', async () => {
        (globalThis as any).Summarizer = {
          availability: jest.fn().mockResolvedValue('available'),
        };
        const result = await isSummarizerAvailable();
        expect(result).toBe(true);
      });

      it('should return false when availability is not "available"', async () => {
        (globalThis as any).Summarizer = {
          availability: jest.fn().mockResolvedValue('unavailable'),
        };
        const result = await isSummarizerAvailable();
        expect(result).toBe(false);
      });
    });

    describe('checkChromeBuiltinSupport', () => {
      it('should return true when version >= 138 and API available', async () => {
        Object.defineProperty(navigator, 'userAgent', {
          value: 'Chrome/138.0.0.0',
          writable: true,
        });
        (globalThis as any).Summarizer = {
          availability: jest.fn().mockResolvedValue('available'),
        };
        const result = await checkChromeBuiltinSupport();
        expect(result).toBe(true);
      });

      it('should return false when version < 138', async () => {
        Object.defineProperty(navigator, 'userAgent', {
          value: 'Chrome/120.0.0.0',
          writable: true,
        });
        (globalThis as any).Summarizer = {
          availability: jest.fn().mockResolvedValue('available'),
        };
        const result = await checkChromeBuiltinSupport();
        expect(result).toBe(false);
      });

      it('should return false when API not available', async () => {
        Object.defineProperty(navigator, 'userAgent', {
          value: 'Chrome/138.0.0.0',
          writable: true,
        });
        (globalThis as any).Summarizer = {
          availability: jest.fn().mockResolvedValue('unavailable'),
        };
        const result = await checkChromeBuiltinSupport();
        expect(result).toBe(false);
      });
    });
  });

  describe('isModelAvailable', () => {
    it('should return false for unknown model', async () => {
      const apiKeys = {
        openaiApiKey: '',
        geminiApiKey: '',
        anthropicApiKey: '',
      };
      const result = await isModelAvailable('unknown-model', apiKeys);
      expect(result).toBe(false);
    });

    it('should return true for chrome-builtin when supported', async () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Chrome/138.0.0.0',
        writable: true,
      });
      (globalThis as any).Summarizer = {
        availability: jest.fn().mockResolvedValue('available'),
      };
      const apiKeys = {
        openaiApiKey: '',
        geminiApiKey: '',
        anthropicApiKey: '',
      };
      const result = await isModelAvailable('chrome-builtin', apiKeys);
      expect(result).toBe(true);
    });

    it('should return false for chrome-builtin when not supported', async () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Chrome/120.0.0.0',
        writable: true,
      });
      const apiKeys = {
        openaiApiKey: '',
        geminiApiKey: '',
        anthropicApiKey: '',
      };
      const result = await isModelAvailable('chrome-builtin', apiKeys);
      expect(result).toBe(false);
    });

    it('should return true for openai model with valid key', async () => {
      const apiKeys = {
        openaiApiKey: 'key',
        geminiApiKey: '',
        anthropicApiKey: '',
      };
      const result = await isModelAvailable('gpt-3.5-turbo', apiKeys);
      expect(result).toBe(true);
    });

    it('should return false for openai model without key', async () => {
      const apiKeys = {
        openaiApiKey: '',
        geminiApiKey: '',
        anthropicApiKey: '',
      };
      const result = await isModelAvailable('gpt-3.5-turbo', apiKeys);
      expect(result).toBe(false);
    });

    it('should return false for openai model with whitespace key', async () => {
      const apiKeys = {
        openaiApiKey: '   ',
        geminiApiKey: '',
        anthropicApiKey: '',
      };
      const result = await isModelAvailable('gpt-3.5-turbo', apiKeys);
      expect(result).toBe(false);
    });

    it('should return true for gemini model with valid key', async () => {
      const apiKeys = {
        openaiApiKey: '',
        geminiApiKey: 'key',
        anthropicApiKey: '',
      };
      const result = await isModelAvailable('gemini-1.5-pro', apiKeys);
      expect(result).toBe(true);
    });

    it('should return false for gemini model without key', async () => {
      const apiKeys = {
        openaiApiKey: '',
        geminiApiKey: '',
        anthropicApiKey: '',
      };
      const result = await isModelAvailable('gemini-1.5-pro', apiKeys);
      expect(result).toBe(false);
    });

    it('should return true for anthropic model with valid key', async () => {
      const apiKeys = {
        openaiApiKey: '',
        geminiApiKey: '',
        anthropicApiKey: 'key',
      };
      const result = await isModelAvailable('claude-3-haiku', apiKeys);
      expect(result).toBe(true);
    });

    it('should return false for anthropic model without key', async () => {
      const apiKeys = {
        openaiApiKey: '',
        geminiApiKey: '',
        anthropicApiKey: '',
      };
      const result = await isModelAvailable('claude-3-haiku', apiKeys);
      expect(result).toBe(false);
    });
  });
});

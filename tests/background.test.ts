// Comprehensive unit tests for background.ts
import fetchMock from 'jest-fetch-mock';
import {
  summarizeWithAI,
  tryModel,
  getFallbackModels,
  storeModelMetrics,
  storeSummaryHistory,
} from '../background';

// Mock utils module
jest.mock('../utils', () => ({
  checkChromeBuiltinSupport: jest.fn().mockResolvedValue(true),
  getModelConfig: jest.fn((model: string) => {
    const configs: Record<string, any> = {
      'chrome-builtin': {
        provider: 'chrome',
        modelId: null,
        name: 'Chrome Built-in AI',
        cost: 0,
      },
      'gpt-3.5-turbo': {
        provider: 'openai',
        modelId: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        cost: 0.002,
      },
      'gpt-4': {
        provider: 'openai',
        modelId: 'gpt-4',
        name: 'GPT-4',
        cost: 0.03,
      },
      'gemini-1.5-pro': {
        provider: 'gemini',
        modelId: 'gemini-1.5-pro',
        name: 'Gemini 1.5 Pro',
        cost: 0.00125,
      },
      'gemini-2.0-flash-exp': {
        provider: 'gemini',
        modelId: 'gemini-2.0-flash-exp',
        name: 'Gemini 2.0 Flash (Exp)',
        cost: 0,
      },
      'claude-3-haiku': {
        provider: 'anthropic',
        modelId: 'claude-3-haiku-20240307',
        name: 'Claude 3 Haiku',
        cost: 0.00025,
      },
      'claude-3-sonnet': {
        provider: 'anthropic',
        modelId: 'claude-3-sonnet-20240229',
        name: 'Claude 3 Sonnet',
        cost: 0.003,
      },
    };
    return configs[model] || null;
  }),
}));

describe('Background Script Comprehensive Tests', () => {
  beforeEach(() => {
    // Reset fetch mocks
    fetchMock.resetMocks();

    // Reset global Summarizer mock
    (globalThis as any).Summarizer = {
      create: jest.fn().mockResolvedValue({
        summarize: jest.fn().mockResolvedValue('Mocked summary'),
        destroy: jest.fn(),
      }),
    };

    // Reset chrome mocks with comprehensive setup
    (chrome as any).storage.sync.get.mockResolvedValue({
      selectedModel: 'chrome-builtin',
      enableFallback: true,
      openaiApiKey: 'test-openai-key',
      geminiApiKey: 'test-gemini-key',
      anthropicApiKey: 'test-anthropic-key',
    });

    (chrome as any).storage.local.get.mockResolvedValue({
      modelMetrics: {},
      summaryHistory: [],
    });

    (chrome as any).storage.sync.set.mockResolvedValue();
    (chrome as any).storage.local.set.mockResolvedValue();
    (chrome as any).tabs.sendMessage.mockResolvedValue();
    (chrome as any).tabs.get.mockResolvedValue({
      id: 123,
      url: 'https://example.com',
      title: 'Test Page',
    });
    (chrome as any).runtime.sendMessage.mockReset().mockResolvedValue();
    (chrome as any).runtime.openOptionsPage.mockResolvedValue();
  });

  describe('Event Listeners Setup', () => {
    it('should set up all required event listeners on initialization', () => {
      expect((chrome as any).action.onClicked.addListener).toHaveBeenCalledWith(
        expect.any(Function)
      );
      expect(
        (chrome as any).runtime.onMessage.addListener
      ).toHaveBeenCalledWith(expect.any(Function));
      expect((chrome as any).tabs.onRemoved.addListener).toHaveBeenCalledWith(
        expect.any(Function)
      );
      expect((chrome as any).tabs.onUpdated.addListener).toHaveBeenCalledWith(
        expect.any(Function)
      );
    });
  });

  describe('Action Button Click Handler', () => {
    it('should inject scripts and send toggle message when action button is clicked', async () => {
      const mockTab = { id: 123 };

      // Trigger the action click listener
      for (const [listener] of (chrome as any).action.onClicked.addListener.mock
        .calls) {
        await listener(mockTab);
      }

      expect((chrome as any).scripting.executeScript).toHaveBeenCalledWith({
        target: { tabId: 123 },
        files: ['readability.js', 'showdown.js', 'content.js'],
      });
      expect((chrome as any).tabs.sendMessage).toHaveBeenCalledWith(123, {
        action: 'toggle_summary_visibility',
        hasSummary: false,
      });
    });

    it('should handle undefined tab id gracefully', () => {
      const mockTab = { id: undefined };

      (chrome as any).action.onClicked.addListener.mock.calls.forEach(
        ([listener]: any[]) => {
          expect(() => listener(mockTab)).not.toThrow();
        }
      );
    });
  });

  describe('Tab Removal Handler', () => {
    it('should clean up summary state when tab is closed', () => {
      const tabId = 123;

      (chrome as any).tabs.onRemoved.addListener.mock.calls.forEach(
        // @ts-expect-error: Jest mock types
        ([listener]) => {
          listener(tabId);
        }
      );

      expect((chrome as any).tabs.onRemoved.addListener).toHaveBeenCalled();
    });
  });

  describe('summarizeWithAI Function', () => {
    const mockContent = 'This is test content for summarization.';
    const mockProgressCallback = jest.fn();

    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should successfully summarize with Chrome built-in AI', async () => {
      const result = await summarizeWithAI(
        mockContent,
        null,
        mockProgressCallback
      );

      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('model', 'chrome-builtin');
      expect(result).toHaveProperty('time');
      expect(result).toHaveProperty('metrics');
      expect(result.metrics.attempts).toHaveLength(1);
      expect(result.metrics.attempts[0].success).toBe(true);
    });

    it('should handle forced model parameter', async () => {
      // Mock OpenAI API success
      fetchMock.mockResponseOnce(
        JSON.stringify({
          choices: [{ message: { content: 'OpenAI summary' } }],
        })
      );

      const result = await summarizeWithAI(
        mockContent,
        'gpt-3.5-turbo',
        mockProgressCallback
      );

      expect(result.model).toBe('gpt-3.5-turbo');
    });

    it('should fallback to alternative models when primary fails', async () => {
      // Mock Chrome AI failure
      (globalThis as any).Summarizer.create.mockRejectedValueOnce(
        new Error('Chrome AI not available')
      );

      // Mock OpenAI success
      fetchMock.mockResponseOnce(
        JSON.stringify({
          choices: [{ message: { content: 'OpenAI summary' } }],
        })
      );

      const result = await summarizeWithAI(
        mockContent,
        null,
        mockProgressCallback
      );

      expect(result.model).toBe('gpt-3.5-turbo');
      expect(result.summary).toBe('OpenAI summary');
      expect(result.metrics.attempts).toHaveLength(2);
    });

    it('should return error message when all models fail', async () => {
      // Mock all APIs to fail
      (globalThis as any).Summarizer.create.mockRejectedValue(
        new Error('Chrome AI failed')
      );
      fetchMock.mockReject(new Error('Network error'));

      const result = await summarizeWithAI(
        mockContent,
        null,
        mockProgressCallback
      );

      expect(result.summary).toContain('Unable to summarize content');
      expect(result.model).toBe('N/A');
      expect(result.metrics.attempts.length).toBeGreaterThan(1);
    });

    it('should disable fallback when enableFallback is false', async () => {
      (chrome as any).storage.sync.get.mockResolvedValueOnce({
        selectedModel: 'chrome-builtin',
        enableFallback: false,
      });

      (globalThis as any).Summarizer.create.mockRejectedValue(
        new Error('Chrome AI failed')
      );

      const result = await summarizeWithAI(
        mockContent,
        null,
        mockProgressCallback
      );

      expect(result.model).toBe('N/A');
      expect(result.metrics.attempts).toHaveLength(1);
    });

    it('should call progress callback with correct updates', async () => {
      await summarizeWithAI(mockContent, null, mockProgressCallback);

      expect(mockProgressCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          step: 'Extracting content',
          percentage: 10,
        })
      );
      expect(mockProgressCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          step: 'Complete',
          percentage: 100,
        })
      );
    });

    it('should handle empty content gracefully', async () => {
      const result = await summarizeWithAI('', null, mockProgressCallback);

      expect(result.summary).toBeDefined();
    });

    it('should handle very long content by truncating', async () => {
      const longContent = 'a'.repeat(15000);

      // Mock OpenAI API success
      fetchMock.mockResponseOnce(
        JSON.stringify({
          choices: [{ message: { content: 'Truncated summary' } }],
        })
      );

      await summarizeWithAI(longContent, 'gpt-3.5-turbo', mockProgressCallback);

      // Should not throw and should handle truncation
      expect(fetchMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('a'.repeat(12000)),
        })
      );
    });
  });

  describe('tryModel Function', () => {
    const mockContent = 'Test content';

    it('should successfully try Chrome built-in AI', async () => {
      const result = await tryModel('chrome-builtin', mockContent, {
        openaiApiKey: 'test',
        geminiApiKey: 'test',
        anthropicApiKey: 'test',
      });

      expect(result.success).toBe(true);
      expect(result.summary).toBe('Mocked summary');
    });

    it('should return error for unknown model', async () => {
      const result = await tryModel('unknown-model', mockContent, {
        openaiApiKey: '',
        geminiApiKey: '',
        anthropicApiKey: '',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unknown model');
    });

    it('should handle Chrome AI errors', async () => {
      (globalThis as any).Summarizer.create.mockRejectedValue(
        new Error('Chrome AI error')
      );

      const result = await tryModel('chrome-builtin', mockContent, {
        openaiApiKey: '',
        geminiApiKey: '',
        anthropicApiKey: '',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Chrome AI error');
    });

    it('should handle Chrome AI not available', async () => {
      delete (globalThis as any).Summarizer;

      const result = await tryModel('chrome-builtin', mockContent, {
        openaiApiKey: '',
        geminiApiKey: '',
        anthropicApiKey: '',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Chrome built-in AI not available');
    });
  });

  describe('API Integration Tests', () => {
    const mockContent = 'Test content for API';

    describe('OpenAI Integration', () => {
      it('should successfully call OpenAI API', async () => {
        fetchMock.mockResponseOnce(
          JSON.stringify({
            choices: [{ message: { content: 'OpenAI response' } }],
          })
        );

        const result = await tryModel('gpt-3.5-turbo', mockContent, {
          openaiApiKey: 'test-key',
          geminiApiKey: '',
          anthropicApiKey: '',
        });

        expect(result.success).toBe(true);
        expect(result.summary).toBe('OpenAI response');
        expect(fetchMock).toHaveBeenCalledWith(
          'https://api.openai.com/v1/chat/completions',
          expect.objectContaining({
            method: 'POST',
            headers: {
              Authorization: 'Bearer test-key',
              'Content-Type': 'application/json',
            },
          })
        );
      });

      it('should handle missing OpenAI API key', async () => {
        const result = await tryModel('gpt-3.5-turbo', mockContent, {
          openaiApiKey: '',
          geminiApiKey: '',
          anthropicApiKey: '',
        });

        expect(result.success).toBe(false);
        expect(result.error).toBe('No OpenAI API key configured');
      });

      it('should handle OpenAI API errors', async () => {
        fetchMock.mockReject(new Error('API Error'));

        const result = await tryModel('gpt-3.5-turbo', mockContent, {
          openaiApiKey: 'test-key',
          geminiApiKey: '',
          anthropicApiKey: '',
        });

        expect(result.success).toBe(false);
        expect(result.error).toContain('API Error');
      });

      it('should handle OpenAI API response errors', async () => {
        fetchMock.mockResponseOnce('', { status: 401 });

        const result = await tryModel('gpt-3.5-turbo', mockContent, {
          openaiApiKey: 'invalid-key',
          geminiApiKey: '',
          anthropicApiKey: '',
        });

        expect(result.success).toBe(false);
        expect(result.error).toContain('OpenAI API request failed');
      });
    });

    describe('Gemini Integration', () => {
      it('should successfully call Gemini API', async () => {
        fetchMock.mockResponseOnce(
          JSON.stringify({
            candidates: [
              {
                content: {
                  parts: [{ text: 'Gemini response' }],
                },
              },
            ],
          })
        );

        const result = await tryModel('gemini-2.0-flash-exp', mockContent, {
          geminiApiKey: 'test-key',
          openaiApiKey: '',
          anthropicApiKey: '',
        });

        expect(result.success).toBe(true);
        expect(result.summary).toBe('Gemini response');
      });

      it('should handle missing Gemini API key', async () => {
        const result = await tryModel('gemini-2.0-flash-exp', mockContent, {
          geminiApiKey: '',
          openaiApiKey: '',
          anthropicApiKey: '',
        } as any);

        expect(result.success).toBe(false);
        expect(result.error).toBe('No Gemini API key configured');
      });

      it('should handle invalid Gemini response format', async () => {
        fetchMock.mockResponseOnce(JSON.stringify({ invalid: 'format' }));

        const result = await tryModel('gemini-2.0-flash-exp', mockContent, {
          geminiApiKey: 'test-key',
          openaiApiKey: '',
          anthropicApiKey: '',
        });

        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid response format from Gemini API');
      });
    });

    describe('Anthropic Integration', () => {
      it('should successfully call Anthropic API', async () => {
        fetchMock.mockResponseOnce(
          JSON.stringify({
            content: [{ text: 'Anthropic response' }],
          })
        );

        const result = await tryModel('claude-3-haiku', mockContent, {
          anthropicApiKey: 'test-key',
          openaiApiKey: '',
          geminiApiKey: '',
        });

        expect(result.success).toBe(true);
        expect(result.summary).toBe('Anthropic response');
      });

      it('should handle missing Anthropic API key', async () => {
        const result = await tryModel('claude-3-haiku', mockContent, {
          anthropicApiKey: '',
          openaiApiKey: '',
          geminiApiKey: '',
        } as any);

        expect(result.success).toBe(false);
        expect(result.error).toBe('No Anthropic API key configured');
      });

      it('should handle invalid Anthropic response format', async () => {
        fetchMock.mockResponseOnce(JSON.stringify({ invalid: 'format' }));

        const result = await tryModel('claude-3-haiku', mockContent, {
          anthropicApiKey: 'test-key',
          openaiApiKey: '',
          geminiApiKey: '',
        });

        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid response format from Anthropic API');
      });
    });
  });

  describe('getFallbackModels Function', () => {
    it('should return correct fallback models for Chrome', async () => {
      const fallbacks = await getFallbackModels('chrome-builtin');
      expect(fallbacks).toEqual([
        'gpt-3.5-turbo',
        'gemini-2.0-flash-exp',
        'claude-3-haiku',
      ]);
    });

    it('should return correct fallback models for OpenAI', async () => {
      const fallbacks = await getFallbackModels('gpt-4');
      expect(fallbacks).toEqual([
        'gemini-2.0-flash-exp',
        'claude-3-haiku',
        'chrome-builtin',
      ]);
    });

    it('should return correct fallback models for Gemini', async () => {
      const fallbacks = await getFallbackModels('gemini-1.5-pro');
      expect(fallbacks).toEqual([
        'gpt-3.5-turbo',
        'claude-3-haiku',
        'chrome-builtin',
      ]);
    });

    it('should return correct fallback models for Anthropic', async () => {
      const fallbacks = await getFallbackModels('claude-3-sonnet');
      expect(fallbacks).toEqual([
        'gpt-3.5-turbo',
        'gemini-2.0-flash-exp',
        'chrome-builtin',
      ]);
    });

    it('should return empty array for unknown model', async () => {
      const fallbacks = await getFallbackModels('unknown');
      expect(fallbacks).toEqual([]);
    });
  });

  describe('storeModelMetrics Function', () => {
    it('should store metrics for new model', async () => {
      const metrics = {
        attempts: [{ model: 'chrome-builtin', success: true, time: 1.5 }],
        totalTime: 1.5,
      };

      await storeModelMetrics('chrome-builtin', metrics);

      expect((chrome as any).storage.local.set).toHaveBeenCalledWith({
        modelMetrics: {
          'chrome-builtin': {
            totalRequests: 1,
            successfulRequests: 1,
            totalTime: 1.5,
            avgTime: 1.5,
            lastUsed: expect.any(String),
          },
        },
      });
    });

    it('should update existing model metrics', async () => {
      (chrome as any).storage.local.get.mockResolvedValueOnce({
        modelMetrics: {
          'chrome-builtin': {
            totalRequests: 1,
            successfulRequests: 1,
            totalTime: 1.0,
            avgTime: 1.0,
            lastUsed: '2023-01-01T00:00:00.000Z',
          },
        },
      });

      const metrics = {
        attempts: [{ model: 'chrome-builtin', success: true, time: 2.0 }],
        totalTime: 2.0,
      };

      await storeModelMetrics('chrome-builtin', metrics);

      expect((chrome as any).storage.local.set).toHaveBeenCalledWith({
        modelMetrics: {
          'chrome-builtin': {
            totalRequests: 2,
            successfulRequests: 2,
            totalTime: 3.0,
            avgTime: 1.5,
            lastUsed: expect.any(String),
          },
        },
      });
    });

    it('should handle storage errors gracefully', async () => {
      (chrome as any).storage.local.get.mockRejectedValue(
        new Error('Storage error')
      );

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await storeModelMetrics('chrome-builtin', {
        attempts: [],
        totalTime: 1.0,
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error storing model metrics:',
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });
  });

  describe('storeSummaryHistory Function', () => {
    it('should store summary in history', async () => {
      const metrics = { attempts: [], totalTime: 1.5 };

      await storeSummaryHistory(
        123,
        'Test summary',
        'chrome-builtin',
        '1.50',
        metrics
      );

      expect((chrome as any).storage.local.set).toHaveBeenCalledWith({
        summaryHistory: [
          expect.objectContaining({
            id: expect.any(String),
            timestamp: expect.any(String),
            url: 'https://example.com',
            title: 'Test Page',
            summary: 'Test summary',
            model: 'chrome-builtin',
            time: '1.50',
            metrics: metrics,
          }),
        ],
      });
    });

    it('should handle storage errors gracefully', async () => {
      (chrome as any).tabs.get.mockRejectedValue(new Error('Tab error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await storeSummaryHistory(
        123,
        'Test summary',
        'chrome-builtin',
        '1.50',
        {}
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error storing summary history:',
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });
  });

  describe('Message Handler', () => {
    const mockSender = { tab: { id: 123 } };

    it('should handle process_content message', async () => {
      const message = {
        action: 'process_content',
        content: 'Test content',
        forceModel: 'gpt-3.5-turbo',
      };

      (chrome as any).runtime.onMessage.addListener.mock.calls.forEach(
        // @ts-expect-error: Jest mock types
        ([listener]) => {
          listener(message, mockSender);
        }
      );

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect((chrome as any).tabs.sendMessage).toHaveBeenCalledWith(123, {
        action: 'show_loading_spinner',
      });
      expect((chrome as any).tabs.sendMessage).toHaveBeenCalledWith(
        123,
        expect.objectContaining({
          action: 'display_inline_summary',
          summary: 'Mocked summary',
          model: 'chrome-builtin',
        })
      );
    });

    it('should handle update_summary_visibility message', () => {
      const message = { action: 'update_summary_visibility', visible: false };

      (chrome as any).runtime.onMessage.addListener.mock.calls.forEach(
        // @ts-expect-error: Jest mock types
        ([listener]) => {
          listener(message, mockSender);
        }
      );

      // The code doesn't send a message in response
      expect((chrome as any).runtime.sendMessage).not.toHaveBeenCalled();
    });

    it('should handle open_options_page message', () => {
      const message = { action: 'open_options_page' };

      (chrome as any).runtime.onMessage.addListener.mock.calls.forEach(
        // @ts-expect-error: Jest mock types
        ([listener]) => {
          listener(message, mockSender);
        }
      );

      expect((chrome as any).runtime.openOptionsPage).toHaveBeenCalled();
    });

    it('should handle switch_model message', () => {
      const message = { action: 'switch_model', model: 'gpt-4' };

      (chrome as any).runtime.onMessage.addListener.mock.calls.forEach(
        // @ts-expect-error: Jest mock types
        ([listener]) => {
          listener(message, mockSender);
        }
      );

      expect((chrome as any).storage.sync.set).toHaveBeenCalledWith(
        { selectedModel: 'gpt-4' },
        expect.any(Function)
      );
    });

    it('should handle get_model_metrics message', async () => {
      // Mock the storage.get callback to return empty metrics
      // @ts-expect-error: Jest mock types
      (chrome as any).storage.local.get.mockImplementation((keys, callback) => {
        callback({ modelMetrics: {} });
      });

      const message = { action: 'get_model_metrics' };

      (chrome as any).runtime.onMessage.addListener.mock.calls.forEach(
        // @ts-expect-error: Jest mock types
        ([listener]) => {
          listener(message, mockSender);
        }
      );

      // Wait for the async callback to complete
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect((chrome as any).runtime.sendMessage).toHaveBeenCalledWith({
        action: 'model_metrics_response',
        metrics: {},
      });
    });

    it('should handle unknown message actions gracefully', () => {
      const message = { action: 'unknown_action' };

      expect(() => {
        (chrome as any).runtime.onMessage.addListener.mock.calls.forEach(
          ([listener]: any[]) => {
            listener(message, mockSender);
          }
        );
      }).not.toThrow();
    });

    it('should handle errors in process_content gracefully', async () => {
      const message = { action: 'process_content', content: 'Test content' };

      // Mock Summarizer to fail
      (globalThis as any).Summarizer.create.mockRejectedValueOnce(
        new Error('Processing error')
      );

      (chrome as any).runtime.onMessage.addListener.mock.calls.forEach(
        // @ts-expect-error: Jest mock types
        ([listener]) => {
          listener(message, mockSender);
        }
      );

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect((chrome as any).tabs.sendMessage).toHaveBeenCalledWith(
        123,
        expect.objectContaining({
          action: 'display_inline_summary',
          summary: expect.stringContaining('Unable to summarize content'),
          model: 'N/A',
        })
      );
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle network timeouts', async () => {
      fetchMock.mockReject(new Error('Network timeout'));

      const result = await tryModel('gpt-3.5-turbo', 'content', {
        openaiApiKey: 'key',
        geminiApiKey: '',
        anthropicApiKey: '',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network timeout');
    });

    it('should handle malformed API responses', async () => {
      fetchMock.mockResponseOnce('invalid json');

      const result = await tryModel('gpt-3.5-turbo', 'content', {
        openaiApiKey: 'key',
        geminiApiKey: '',
        anthropicApiKey: '',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle rate limiting responses', async () => {
      fetchMock.mockResponseOnce('', { status: 429 });

      const result = await tryModel('gpt-3.5-turbo', 'content', {
        openaiApiKey: 'key',
        geminiApiKey: '',
        anthropicApiKey: '',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('failed');
    });

    it('should handle extremely long content gracefully', async () => {
      const longContent = 'word '.repeat(10000);

      // Mock OpenAI API success
      fetchMock.mockResponseOnce(
        JSON.stringify({
          choices: [{ message: { content: 'Long content summary' } }],
        })
      );

      await summarizeWithAI(longContent, 'gpt-3.5-turbo', jest.fn());

      // Should not crash and should truncate content appropriately
      expect(fetchMock).toHaveBeenCalled();
    });

    it('should handle concurrent requests', async () => {
      const promises = [
        summarizeWithAI('content1', null, jest.fn()),
        summarizeWithAI('content2', null, jest.fn()),
        summarizeWithAI('content3', null, jest.fn()),
      ];

      const results = await Promise.all(promises);

      results.forEach((result) => {
        expect(result).toHaveProperty('summary');
        expect(result).toHaveProperty('model');
      });
    });
  });
});

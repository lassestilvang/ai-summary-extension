// Comprehensive unit tests for background.ts
import {
  summarizeWithAI,
  tryModel,
  getFallbackModels,
  storeModelMetrics,
  storeSummaryHistory,
} from '../background.ts';

describe('Background Script Comprehensive Tests', () => {
  beforeEach(() => {
    // Reset fetch mocks
    fetchMock.resetMocks();

    // Reset global Summarizer mock
    globalThis.Summarizer = {
      create: jest.fn().mockResolvedValue({
        summarize: jest.fn().mockResolvedValue('Mocked summary'),
        destroy: jest.fn(),
      }),
    };

    // Reset chrome mocks with comprehensive setup
    chrome.storage.sync.get.mockResolvedValue({
      selectedModel: 'chrome-builtin',
      enableFallback: true,
      openaiApiKey: 'test-openai-key',
      geminiApiKey: 'test-gemini-key',
      anthropicApiKey: 'test-anthropic-key',
    });

    chrome.storage.local.get.mockResolvedValue({
      modelMetrics: {},
      summaryHistory: [],
    });

    chrome.storage.sync.set.mockResolvedValue();
    chrome.storage.local.set.mockResolvedValue();
    chrome.tabs.sendMessage.mockResolvedValue();
    chrome.tabs.get.mockResolvedValue({
      id: 123,
      url: 'https://example.com',
      title: 'Test Page',
    });
    chrome.runtime.sendMessage.mockReset().mockResolvedValue();
    chrome.runtime.openOptionsPage.mockResolvedValue();
  });

  describe('Event Listeners Setup', () => {
    it('should set up all required event listeners on initialization', () => {
      expect(chrome.action.onClicked.addListener).toHaveBeenCalledWith(
        expect.any(Function)
      );
      expect(chrome.runtime.onMessage.addListener).toHaveBeenCalledWith(
        expect.any(Function)
      );
      expect(chrome.tabs.onRemoved.addListener).toHaveBeenCalledWith(
        expect.any(Function)
      );
    });
  });

  describe('Action Button Click Handler', () => {
    it('should inject scripts and send toggle message when action button is clicked', async () => {
      const mockTab = { id: 123 };

      // Trigger the action click listener
      for (const [listener] of chrome.action.onClicked.addListener.mock.calls) {
        await listener(mockTab);
      }

      expect(chrome.scripting.executeScript).toHaveBeenCalledWith({
        target: { tabId: 123 },
        files: ['Readability.js', 'showdown.min.js', 'dist/content.js'],
      });
      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(123, {
        action: 'toggle_summary_visibility',
      });
    });

    it('should handle undefined tab id gracefully', () => {
      const mockTab = { id: undefined };

      chrome.action.onClicked.addListener.mock.calls.forEach(([listener]) => {
        expect(() => listener(mockTab)).not.toThrow();
      });
    });
  });

  describe('Tab Removal Handler', () => {
    it('should clean up summary state when tab is closed', () => {
      const tabId = 123;

      chrome.tabs.onRemoved.addListener.mock.calls.forEach(([listener]) => {
        listener(tabId);
      });

      expect(chrome.tabs.onRemoved.addListener).toHaveBeenCalled();
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
      globalThis.Summarizer.create.mockRejectedValueOnce(
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
      globalThis.Summarizer.create.mockRejectedValue(
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
      chrome.storage.sync.get.mockResolvedValueOnce({
        selectedModel: 'chrome-builtin',
        enableFallback: false,
      });

      globalThis.Summarizer.create.mockRejectedValue(
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
      const result = await tryModel('unknown-model', mockContent, {});

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unknown model');
    });

    it('should handle Chrome AI errors', async () => {
      globalThis.Summarizer.create.mockRejectedValue(
        new Error('Chrome AI error')
      );

      const result = await tryModel('chrome-builtin', mockContent, {});

      expect(result.success).toBe(false);
      expect(result.error).toBe('Chrome AI error');
    });

    it('should handle Chrome AI not available', async () => {
      delete globalThis.Summarizer;

      const result = await tryModel('chrome-builtin', mockContent, {});

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
        });

        expect(result.success).toBe(false);
        expect(result.error).toBe('No OpenAI API key configured');
      });

      it('should handle OpenAI API errors', async () => {
        fetchMock.mockReject(new Error('API Error'));

        const result = await tryModel('gpt-3.5-turbo', mockContent, {
          openaiApiKey: 'test-key',
        });

        expect(result.success).toBe(false);
        expect(result.error).toContain('API Error');
      });

      it('should handle OpenAI API response errors', async () => {
        fetchMock.mockResponseOnce('', { status: 401 });

        const result = await tryModel('gpt-3.5-turbo', mockContent, {
          openaiApiKey: 'invalid-key',
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
        });

        expect(result.success).toBe(true);
        expect(result.summary).toBe('Gemini response');
      });

      it('should handle missing Gemini API key', async () => {
        const result = await tryModel('gemini-2.0-flash-exp', mockContent, {
          geminiApiKey: '',
        });

        expect(result.success).toBe(false);
        expect(result.error).toBe('No Gemini API key configured');
      });

      it('should handle invalid Gemini response format', async () => {
        fetchMock.mockResponseOnce(JSON.stringify({ invalid: 'format' }));

        const result = await tryModel('gemini-2.0-flash-exp', mockContent, {
          geminiApiKey: 'test-key',
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
        });

        expect(result.success).toBe(true);
        expect(result.summary).toBe('Anthropic response');
      });

      it('should handle missing Anthropic API key', async () => {
        const result = await tryModel('claude-3-haiku', mockContent, {
          anthropicApiKey: '',
        });

        expect(result.success).toBe(false);
        expect(result.error).toBe('No Anthropic API key configured');
      });

      it('should handle invalid Anthropic response format', async () => {
        fetchMock.mockResponseOnce(JSON.stringify({ invalid: 'format' }));

        const result = await tryModel('claude-3-haiku', mockContent, {
          anthropicApiKey: 'test-key',
        });

        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid response format from Anthropic API');
      });
    });
  });

  describe('getFallbackModels Function', () => {
    it('should return correct fallback models for Chrome', () => {
      const fallbacks = getFallbackModels('chrome-builtin');
      expect(fallbacks).toEqual([
        'gpt-3.5-turbo',
        'gemini-2.0-flash-exp',
        'claude-3-haiku',
      ]);
    });

    it('should return correct fallback models for OpenAI', () => {
      const fallbacks = getFallbackModels('gpt-4');
      expect(fallbacks).toEqual([
        'gemini-2.0-flash-exp',
        'claude-3-haiku',
        'chrome-builtin',
      ]);
    });

    it('should return correct fallback models for Gemini', () => {
      const fallbacks = getFallbackModels('gemini-1.5-pro');
      expect(fallbacks).toEqual([
        'gpt-3.5-turbo',
        'claude-3-haiku',
        'chrome-builtin',
      ]);
    });

    it('should return correct fallback models for Anthropic', () => {
      const fallbacks = getFallbackModels('claude-3-sonnet');
      expect(fallbacks).toEqual([
        'gpt-3.5-turbo',
        'gemini-2.0-flash-exp',
        'chrome-builtin',
      ]);
    });

    it('should return empty array for unknown model', () => {
      const fallbacks = getFallbackModels('unknown');
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

      expect(chrome.storage.local.set).toHaveBeenCalledWith({
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
      chrome.storage.local.get.mockResolvedValueOnce({
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

      expect(chrome.storage.local.set).toHaveBeenCalledWith({
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
      chrome.storage.local.get.mockRejectedValue(new Error('Storage error'));

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

      expect(chrome.storage.local.set).toHaveBeenCalledWith({
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
      chrome.tabs.get.mockRejectedValue(new Error('Tab error'));

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

      chrome.runtime.onMessage.addListener.mock.calls.forEach(([listener]) => {
        listener(message, mockSender);
      });

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(123, {
        action: 'show_loading_spinner',
      });
      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(
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

      chrome.runtime.onMessage.addListener.mock.calls.forEach(([listener]) => {
        listener(message, mockSender);
      });

      // The code doesn't send a message in response
      expect(chrome.runtime.sendMessage).not.toHaveBeenCalled();
    });

    it('should handle open_options_page message', () => {
      const message = { action: 'open_options_page' };

      chrome.runtime.onMessage.addListener.mock.calls.forEach(([listener]) => {
        listener(message, mockSender);
      });

      expect(chrome.runtime.openOptionsPage).toHaveBeenCalled();
    });

    it('should handle switch_model message', () => {
      const message = { action: 'switch_model', model: 'gpt-4' };

      chrome.runtime.onMessage.addListener.mock.calls.forEach(([listener]) => {
        listener(message, mockSender);
      });

      expect(chrome.storage.sync.set).toHaveBeenCalledWith(
        { selectedModel: 'gpt-4' },
        expect.any(Function)
      );
    });

    it('should handle get_model_metrics message', async () => {
      // Mock the storage.get callback to return empty metrics
      chrome.storage.local.get.mockImplementation((keys, callback) => {
        callback({ modelMetrics: {} });
      });

      const message = { action: 'get_model_metrics' };

      chrome.runtime.onMessage.addListener.mock.calls.forEach(([listener]) => {
        listener(message, mockSender);
      });

      // Wait for the async callback to complete
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        action: 'model_metrics_response',
        metrics: {},
      });
    });

    it('should handle unknown message actions gracefully', () => {
      const message = { action: 'unknown_action' };

      expect(() => {
        chrome.runtime.onMessage.addListener.mock.calls.forEach(
          ([listener]) => {
            listener(message, mockSender);
          }
        );
      }).not.toThrow();
    });

    it('should handle errors in process_content gracefully', async () => {
      const message = { action: 'process_content', content: 'Test content' };

      // Mock Summarizer to fail
      globalThis.Summarizer.create.mockRejectedValueOnce(
        new Error('Processing error')
      );

      chrome.runtime.onMessage.addListener.mock.calls.forEach(([listener]) => {
        listener(message, mockSender);
      });

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(
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
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network timeout');
    });

    it('should handle malformed API responses', async () => {
      fetchMock.mockResponseOnce('invalid json');

      const result = await tryModel('gpt-3.5-turbo', 'content', {
        openaiApiKey: 'key',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle rate limiting responses', async () => {
      fetchMock.mockResponseOnce('', { status: 429 });

      const result = await tryModel('gpt-3.5-turbo', 'content', {
        openaiApiKey: 'key',
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

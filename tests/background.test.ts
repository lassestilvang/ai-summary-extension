// Comprehensive unit tests for background.ts
import fetchMock from 'jest-fetch-mock';
import * as utils from '../utils'; // Import the actual module

// Mock the utils module to allow spying on its exports
jest.mock('../utils', () => jest.requireActual('../utils'));

let checkChromeBuiltinSupportSpy: jest.SpyInstance;
let validateLanguageSupportSpy: jest.SpyInstance;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let getModelConfigSpy: jest.SpyInstance;

// Define the chrome mock globally, so background.ts can register its listeners on it
(global as any).chrome = {
  action: {
    onClicked: {
      addListener: jest.fn(),
    },
  },
  commands: {
    onCommand: {
      addListener: jest.fn(),
    },
  },
  runtime: {
    onMessage: {
      addListener: jest.fn(),
    },
    onInstalled: {
      addListener: jest.fn(),
    },
    onStartup: {
      addListener: jest.fn(),
    },
    sendMessage: jest.fn().mockResolvedValue(undefined), // Mock sendMessage to return a resolved promise
    openOptionsPage: jest.fn(),
  },
  tabs: {
    onRemoved: {
      addListener: jest.fn(),
    },
    onUpdated: {
      addListener: jest.fn(),
    },
    sendMessage: jest.fn().mockResolvedValue(undefined), // Mock sendMessage to return a resolved promise
    get: jest.fn(),
    query: jest.fn(),
  },
  storage: {
    sync: {
      get: jest.fn(),
      set: jest.fn(),
    },
    local: {
      get: jest.fn(),
      set: jest.fn(),
    },
  },
  permissions: {
    contains: jest.fn().mockResolvedValue(true), // Mock contains to return a resolved promise
  },
  scripting: {
    executeScript: jest.fn(),
  },
};

// Import background.ts after the global chrome mock is defined
import * as backgroundModule from '../background';
const {
  summarizeWithAI,
  tryModel,
  getFallbackModels,
  storeModelMetrics,
  storeSummaryHistory,
  summaryState,
} = backgroundModule;

// Capture listeners after background.ts has registered them
// These will be the actual functions that background.ts passed to addListener.
// We wrap them in jest.fn() so we can spy on their calls within tests and clear their call history.
const onClickedListener = jest.fn(
  (chrome.action.onClicked.addListener as jest.Mock).mock.calls[0][0]
);
const onCommandListener = jest.fn(
  (chrome.commands.onCommand.addListener as jest.Mock).mock.calls[0][0]
);
const onMessageListener = (chrome.runtime.onMessage.addListener as jest.Mock).mock.calls[0][0];
const onRemovedListener = jest.fn(
  (chrome.tabs.onRemoved.addListener as jest.Mock).mock.calls[0][0]
);
const onUpdatedListener = jest.fn(
  (chrome.tabs.onUpdated.addListener as jest.Mock).mock.calls[0][0]
);
const onInstalledListener = jest.fn(
  (chrome.runtime.onInstalled.addListener as jest.Mock).mock.calls[0][0]
);
const onStartupListener = jest.fn(
  (chrome.runtime.onStartup.addListener as jest.Mock).mock.calls[0][0]
);

describe('Background Script Comprehensive Tests', () => {
  beforeEach(() => {
    // Reset fetch mocks before each test
    fetchMock.resetMocks();
    fetchMock.mockClear();

    // Clear call history for captured listener functions
    onClickedListener.mockClear();
    onCommandListener.mockClear();
    // onMessageListener is not a jest mock, so no mockClear needed
    onRemovedListener.mockClear();
    onUpdatedListener.mockClear();
    onInstalledListener.mockClear();
    onStartupListener.mockClear();

    // Clear call history for other chrome API mocks that are called directly or re-mocked
    (chrome as any).runtime.sendMessage.mockClear();
    (chrome as any).runtime.openOptionsPage.mockClear();
    (chrome as any).tabs.sendMessage.mockClear();
    (chrome as any).tabs.get.mockClear();
    (chrome as any).tabs.query.mockClear();
    (chrome as any).storage.sync.get.mockClear();
    (chrome as any).storage.sync.set.mockClear();
    (chrome as any).storage.local.get.mockClear();
    (chrome as any).storage.local.set.mockClear();
    (chrome as any).permissions.contains.mockClear();
    (chrome as any).scripting.executeScript.mockClear();

    // Set default mock implementations for chrome APIs
    (global as any).chrome.storage.sync.get.mockResolvedValue({
      selectedModel: 'chrome-builtin',
      enableFallback: true,
      openaiApiKey: 'test-openai-key',
      geminiApiKey: 'test-gemini-key',
      anthropicApiKey: 'test-anthropic-key',
      language: 'en', // Default language
    });
    (global as any).chrome.permissions.contains.mockResolvedValue(true);
    (global as any).chrome.storage.local.get.mockResolvedValue({
      modelMetrics: {},
      summaryHistory: [],
    });
    (global as any).chrome.tabs.get.mockResolvedValue({
      id: 123,
      url: 'https://example.com',
      title: 'Test Page',
    });
    (global as any).chrome.tabs.query.mockResolvedValue([
      {
        id: 123,
        url: 'https://example.com',
        title: 'Test Page',
      },
    ]);

    // Ensure global Summarizer is mocked correctly for each test
    (globalThis as any).Summarizer = {
      create: jest.fn().mockResolvedValue({
        summarize: jest.fn().mockResolvedValue('Mocked summary'),
        destroy: jest.fn(),
      }),
    };

    // Ensure global Translator is mocked correctly for each test
    (globalThis as any).Translator = {
      availability: jest.fn().mockResolvedValue('available'),
      create: jest.fn().mockResolvedValue({
        translate: jest.fn().mockResolvedValue('Translated summary'),
        destroy: jest.fn(),
      }),
    };

    // Spy on utility functions and set default mocks
    checkChromeBuiltinSupportSpy = jest
      .spyOn(utils, 'checkChromeBuiltinSupport')
      .mockResolvedValue(true);
    validateLanguageSupportSpy = jest
      .spyOn(utils, 'validateLanguageSupport')
      .mockReturnValue({
        supported: true,
        fallbackLanguage: 'en',
        needsFallback: false,
      });
    getModelConfigSpy = jest
      .spyOn(utils, 'getModelConfig')
      .mockImplementation((model: string) => {
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
      });
  });

  afterEach(() => {
    jest.restoreAllMocks(); // Restore all spies after each test
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

    it('should set up onInstalled and onStartup listeners when chrome.runtime is available', async () => {
      // These listeners are set up at module level, so we need to check if they exist
      expect(
        (chrome as any).runtime.onInstalled.addListener
      ).toHaveBeenCalledWith(expect.any(Function));
      expect(
        (chrome as any).runtime.onStartup.addListener
      ).toHaveBeenCalledWith(expect.any(Function));

      // Manually trigger the listeners to check their effects
      await onInstalledListener();
      await onStartupListener();

      expect(checkChromeBuiltinSupportSpy).toHaveBeenCalledTimes(2); // Called once for onInstalled, once for onStartup
    });
  });

  describe('Action Button Click Handler', () => {
    it('should inject scripts and send toggle message when action button is clicked', async () => {
      const mockTab = { id: 123, url: 'https://example.com' }; // Add a URL to the mock tab

      // Trigger the action click listener
      await onClickedListener(mockTab);

      expect((chrome as any).scripting.executeScript).toHaveBeenCalledWith({
        target: { tabId: 123 },
        files: ['readability.js', 'showdown.js', 'content.js'],
      });
      expect((chrome as any).tabs.sendMessage).toHaveBeenCalledWith(123, {
        action: 'toggle_summary_visibility',
        hasSummary: false,
      });
    });

    it('should handle undefined tab id gracefully', async () => {
      const mockTab = { id: undefined, url: 'https://example.com' }; // Add a URL to the mock tab

      // Trigger the action click listener
      await onClickedListener(mockTab);

      // We expect no errors and no script execution or message sending
      expect((chrome as any).scripting.executeScript).not.toHaveBeenCalled();
      expect((chrome as any).tabs.sendMessage).not.toHaveBeenCalled();
    });

    it('should skip chrome:// URLs and not inject scripts', async () => {
      const mockTab = { id: 123, url: 'chrome://extensions/' };

      // Trigger the action click listener
      await onClickedListener(mockTab);

      expect((chrome as any).scripting.executeScript).not.toHaveBeenCalled();
      expect((chrome as any).tabs.sendMessage).not.toHaveBeenCalled();
    });

    it('should handle chrome:// URLs in shortcut command', async () => {
      const mockTab = { id: 123, url: 'chrome://settings/' };

      // Mock chrome.tabs.query to return the tab
      (chrome as any).tabs.query.mockResolvedValue([mockTab]);

      // Trigger the command listener
      if (chrome.commands && onCommandListener) {
        await onCommandListener('_execute_action');
      }

      expect((chrome as any).scripting.executeScript).not.toHaveBeenCalled();
      expect((chrome as any).tabs.sendMessage).not.toHaveBeenCalled();
    });
  });

  describe('Tab Removal Handler', () => {
    it('should clean up summary state when tab is closed', async () => {
      const tabId = 123;

      // Trigger the onRemoved listener
      await onRemovedListener(tabId);

      // Ensure that the listener was called
      expect((chrome as any).tabs.onRemoved.addListener).toHaveBeenCalledWith(
        expect.any(Function)
      );
      // No explicit assertion on state, as summaryState is not exported
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
      // Ensure Summarizer.create resolves for this test, resetting previous mocks
      (globalThis as any).Summarizer.create.mockReset().mockResolvedValue({
        summarize: jest.fn().mockResolvedValue('Mocked summary'),
        destroy: jest.fn(),
      });

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
          choices: [{ message: { content: 'OpenAI response' } }],
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
      // Mock Chrome AI failure for the primary attempt, resetting previous mocks
      (globalThis as any).Summarizer.create
        .mockReset()
        .mockRejectedValue(new Error('Chrome AI not available'));
      // Mock OpenAI success for the fallback
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
      // Mock all APIs to fail, resetting previous mocks
      (globalThis as any).Summarizer.create
        .mockReset()
        .mockRejectedValue(new Error('Chrome AI failed'));
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

      (globalThis as any).Summarizer.create
        .mockReset()
        .mockRejectedValue(new Error('Chrome AI failed'));

      const result = await summarizeWithAI(
        mockContent,
        null,
        mockProgressCallback
      );

      expect(result.model).toBe('N/A');
      expect(result.metrics.attempts).toHaveLength(1);
    });

    it('should handle language fallback in tryModel', async () => {
      // Mock validateLanguageSupport to return needsFallback: true for this test
      validateLanguageSupportSpy.mockReturnValueOnce({
        supported: false,
        fallbackLanguage: 'en',
        needsFallback: true,
      });

      const result = await tryModel(
        'chrome-builtin',
        mockContent,
        {
          openaiApiKey: '',
          geminiApiKey: '',
          anthropicApiKey: '',
        },
        'unsupported-lang'
      );

      expect(result.success).toBe(true);
      expect(validateLanguageSupportSpy).toHaveBeenCalledWith(
        'chrome',
        'unsupported-lang'
      );
    });

    it('should call progress callback with correct updates', async () => {
      await summarizeWithAI(mockContent, null, mockProgressCallback);
      jest.runAllTimers(); // Ensure all timers are run for progress updates
      await Promise.resolve(); // Flush microtasks

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

      // Should not crash and should truncate content appropriately
      expect(fetchMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining(longContent.substring(0, 12000)),
        })
      );
    });

    it('should handle Chrome AI not supported', async () => {
      // Mock checkChromeBuiltinSupport to return false for this test
      checkChromeBuiltinSupportSpy.mockResolvedValueOnce(false);

      const result = await tryModel('chrome-builtin', mockContent, {
        openaiApiKey: '',
        geminiApiKey: '',
        anthropicApiKey: '',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        'Chrome built-in AI not supported on this browser version'
      );
      expect(checkChromeBuiltinSupportSpy).toHaveBeenCalled();
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
      (globalThis as any).Summarizer.create
        .mockReset()
        .mockRejectedValue(new Error('Chrome AI error'));

      const result = await tryModel('chrome-builtin', mockContent, {
        openaiApiKey: '',
        geminiApiKey: '',
        anthropicApiKey: '',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Chrome AI error');
    });

    it('should handle Chrome AI not available', async () => {
      // Mock Summarizer.create to reject immediately
      (globalThis as any).Summarizer.create
        .mockReset()
        .mockRejectedValue(new Error('Chrome AI not available'));

      const result = await tryModel('chrome-builtin', mockContent, {
        openaiApiKey: '',
        geminiApiKey: '',
        anthropicApiKey: '',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Chrome AI not available');
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
              Authorization: `Bearer ${'test-key'}`,
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

      it('should handle permission denied for OpenAI API', async () => {
        (chrome as any).permissions.contains.mockResolvedValue(false);

        const result = await tryModel('gpt-3.5-turbo', mockContent, {
          openaiApiKey: 'test-key',
          geminiApiKey: '',
          anthropicApiKey: '',
        });

        expect(result.success).toBe(false);
        expect(result.error).toContain(
          'Permission denied for OpenAI API access'
        );
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

      it('should handle permission denied for Gemini API', async () => {
        (chrome as any).permissions.contains.mockResolvedValue(false);

        const result = await tryModel('gemini-2.0-flash-exp', mockContent, {
          geminiApiKey: 'test-key',
          openaiApiKey: '',
          anthropicApiKey: '',
        });

        expect(result.success).toBe(false);
        expect(result.error).toContain(
          'Permission denied for Gemini API access'
        );
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
            content: [{ type: 'text', text: 'Anthropic response' }], // Corrected structure
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

      it('should handle permission denied for Anthropic API', async () => {
        (chrome as any).permissions.contains.mockResolvedValue(false);

        const result = await tryModel('claude-3-haiku', mockContent, {
          anthropicApiKey: 'test-key',
          openaiApiKey: '',
          geminiApiKey: '',
        });

        expect(result.success).toBe(false);
        expect(result.error).toContain(
          'Permission denied for Anthropic API access'
        );
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

    it('should filter out chrome-builtin when not supported', async () => {
      // Mock checkChromeBuiltinSupport to return false for this test
      checkChromeBuiltinSupportSpy.mockResolvedValueOnce(false);

      const fallbacks = await getFallbackModels('gpt-4');
      expect(fallbacks).toEqual([
        'gemini-2.0-flash-exp',
        'claude-3-haiku',
        // chrome-builtin should be filtered out
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

    it('should handle tab get errors gracefully', async () => {
      (chrome as any).tabs.get.mockRejectedValue(new Error('Tab not found'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await storeSummaryHistory(
        999,
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
      await onMessageListener(
        {
          action: 'process_content',
          content: 'Test content',
          forceModel: 'gpt-3.5-turbo',
        },
        mockSender
      );

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

    it('should handle update_summary_visibility message', async () => {
      const result = onMessageListener(
        { action: 'update_summary_visibility', visible: false },
        mockSender
      );
      expect(result).toBe(false); // Expect synchronous return false
      expect((chrome as any).runtime.sendMessage).not.toHaveBeenCalled();
    });

    it('should handle open_options_page message', async () => {
      const result = onMessageListener(
        { action: 'open_options_page' },
        mockSender
      );
      expect(result).toBe(false); // Expect synchronous return false
      expect((chrome as any).runtime.openOptionsPage).toHaveBeenCalled();
    });

    it('should handle switch_model message', async () => {
      const result = onMessageListener(
        { action: 'switch_model', model: 'gpt-4' },
        mockSender
      );
      expect(result).toBe(true); // Expect asynchronous return true
      expect((chrome as any).storage.sync.set).toHaveBeenCalledWith(
        { selectedModel: 'gpt-4' },

        expect.any(Function)
      );
    });

    it('should handle switch_model message with callback', async () => {
      let callbackCalled = false;
      (chrome as any).storage.sync.set.mockImplementation(
        (data: any, callback?: (result?: any) => void) => {
          callbackCalled = true;
          if (callback) callback();
        }
      );
      const result = onMessageListener(
        { action: 'switch_model', model: 'gpt-4' },
        mockSender
      );
      expect(result).toBe(true); // Expect asynchronous return true
      expect(callbackCalled).toBe(true);
      expect((chrome as any).storage.sync.set).toHaveBeenCalledWith(
        { selectedModel: 'gpt-4' },
        expect.any(Function)
      );
    });

    it('should handle get_model_metrics message', async () => {
      (chrome as any).storage.local.get.mockImplementationOnce(
        (
          keys: string | string[] | Record<string, any> | null,
          callback: (items: Record<string, any>) => void
        ) => {
          callback({ modelMetrics: {} });
        }
      );
      const result = onMessageListener(
        { action: 'get_model_metrics' },
        mockSender
      );
      expect(result).toBe(true); // Expect asynchronous return true
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect((chrome as any).runtime.sendMessage).toHaveBeenCalledWith({
        action: 'model_metrics_response',
        metrics: {},
      });
    });

    it('should handle get_model_metrics message with callback', async () => {
      let callbackCalled = false;
      (chrome as any).storage.local.get.mockImplementationOnce(
        (
          keys: string | string[] | Record<string, any> | null,
          callback: (items: Record<string, any>) => void
        ) => {
          callbackCalled = true;
          callback({ modelMetrics: { test: 'data' } });
        }
      );
      const result = onMessageListener(
        { action: 'get_model_metrics' },
        mockSender
      );
      expect(result).toBe(true); // Expect asynchronous return true
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(callbackCalled).toBe(true);
      expect((chrome as any).runtime.sendMessage).toHaveBeenCalledWith({
        action: 'model_metrics_response',
        metrics: { test: 'data' },
      });
    });

    it('should handle unknown message actions gracefully', async () => {
      const result = onMessageListener(
        { action: 'unknown_action' },
        mockSender
      );
      expect(result).toBe(false); // Expect synchronous return false
    });

    it('should handle invalid message format', async () => {
      const result = onMessageListener(null, mockSender);
      expect(result).toBe(false); // Expect synchronous return false
    });

    it('should handle message without action property', async () => {
      const result = onMessageListener(
        { someOtherProperty: 'value' },
        mockSender
      );
      expect(result).toBe(false); // Expect synchronous return false
    });

    it('should prevent concurrent processing for the same tab', () => {
      summaryState[123] = { isProcessing: true, summary: '', visible: false };
      const result = onMessageListener(
        { action: 'process_content', content: 'Test content' },
        mockSender
      );
      expect(result).toBe(false);
      delete summaryState[123];
    });

    it('should handle errors in process_content gracefully', async () => {
      const summarizeSpy = jest
        .spyOn(backgroundModule, 'summarizeWithAI')
        .mockRejectedValue(new Error('Test error'));

      onMessageListener(
        { action: 'process_content', content: 'Test content' },
        mockSender
      );

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect((chrome as any).tabs.sendMessage).toHaveBeenCalledWith(
        123,
        expect.objectContaining({
          action: 'display_inline_summary',
        })
      );

      summarizeSpy.mockRestore();
    });
  });

  describe('Tab Navigation Handler', () => {
    it('should handle tab navigation updates', async () => {
      const tabId = 123;
      const changeInfo = { url: 'https://new-url.com' };

      await onUpdatedListener(tabId, changeInfo);

      // The summary state should be cleared for the tab
      expect((chrome as any).tabs.onUpdated.addListener).toHaveBeenCalledWith(
        expect.any(Function)
      );
    });

    it('should ignore tab updates without URL changes', async () => {
      const tabId = 123;
      const changeInfo = { title: 'New Title' };

      await onUpdatedListener(tabId, changeInfo);

      // Should not clear summary state
      expect((chrome as any).tabs.onUpdated.addListener).toHaveBeenCalledWith(
        expect.any(Function)
      );
    });
  });

  describe('Translation Functionality', () => {
    const mockContent = 'Test content';

    it('should handle translation when language is not English', async () => {
      validateLanguageSupportSpy.mockReturnValueOnce({
        supported: false,
        fallbackLanguage: 'es',
        needsFallback: true,
      });

      // Temporarily mock the global Translator for this test, resetting previous mocks
      (globalThis as any).Translator = {
        availability: jest.fn().mockResolvedValue('available'),
        create: jest.fn().mockResolvedValue({
          translate: jest.fn().mockResolvedValue('Resumen traducido'),
          destroy: jest.fn(),
        }),
      };

      const result = await tryModel(
        'chrome-builtin',
        mockContent,
        {
          openaiApiKey: 'test',
          geminiApiKey: 'test',
          anthropicApiKey: 'test',
        },
        'es'
      );

      expect(result.success).toBe(true);
      expect(result.summary).toBe('Resumen traducido');
    });

    it('should handle translation download required', async () => {
      validateLanguageSupportSpy.mockReturnValueOnce({
        supported: false,
        fallbackLanguage: 'fr',
        needsFallback: true,
      });

      Object.defineProperty(globalThis, 'Translator', {
        writable: true,
        value: {
          availability: jest.fn().mockResolvedValue('downloadable'),
          create: jest.fn().mockResolvedValue({
            translate: jest.fn().mockResolvedValue('Résumé traduit'),
            destroy: jest.fn(),
          }),
        },
      });

      const result = await tryModel(
        'chrome-builtin',
        mockContent,
        {
          openaiApiKey: 'test',
          geminiApiKey: 'test',
          anthropicApiKey: 'test',
        },
        'fr'
      );

      expect(result.success).toBe(true);
      expect(result.summary).toBe('Résumé traduit');
    });

    it('should handle translation not available', async () => {
      validateLanguageSupportSpy.mockReturnValueOnce({
        supported: false,
        fallbackLanguage: 'xx',
        needsFallback: true,
      });

      Object.defineProperty(globalThis, 'Translator', {
        writable: true,
        value: {
          availability: jest.fn().mockResolvedValue('unavailable'),
        },
      });

      const result = await tryModel(
        'chrome-builtin',
        mockContent,
        {
          openaiApiKey: 'test',
          geminiApiKey: 'test',
          anthropicApiKey: 'test',
        },
        'xx'
      );

      expect(result.success).toBe(true);
      expect(result.summary).toBe('Mocked summary'); // Falls back to English
    });

    it('should handle translation errors gracefully', async () => {
      validateLanguageSupportSpy.mockReturnValueOnce({
        supported: false,
        fallbackLanguage: 'de',
        needsFallback: true,
      });

      Object.defineProperty(globalThis, 'Translator', {
        writable: true,
        value: {
          availability: jest
            .fn()
            .mockRejectedValue(new Error('Translation error')),
        },
      });

      const result = await tryModel(
        'chrome-builtin',
        mockContent,
        {
          openaiApiKey: 'test',
          geminiApiKey: 'test',
          anthropicApiKey: 'test',
        },
        'de'
      );

      expect(result.success).toBe(true);
      expect(result.summary).toBe('Mocked summary'); // Falls back to English
    });
  });

  describe('Error Handling and Edge Cases', () => {
    const mockContent = 'Test content'; // Define mockContent here

    it('should handle network timeouts', async () => {
      fetchMock.mockReject(new Error('Network timeout'));

      const result = await tryModel('gpt-3.5-turbo', mockContent, {
        openaiApiKey: 'key',
        geminiApiKey: '',
        anthropicApiKey: '',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network timeout');
    });

    it('should handle malformed API responses', async () => {
      fetchMock.mockResponseOnce('invalid json');

      const result = await tryModel('gpt-3.5-turbo', mockContent, {
        openaiApiKey: 'key',
        geminiApiKey: '',
        anthropicApiKey: '',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle rate limiting responses', async () => {
      fetchMock.mockResponseOnce('', { status: 429 });

      const result = await tryModel('gpt-3.5-turbo', mockContent, {
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
      expect(fetchMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining(longContent.substring(0, 12000)),
        })
      );
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
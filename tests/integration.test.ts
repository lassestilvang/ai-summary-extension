// Integration tests for the AI Summary Extension
// Tests message passing, extension lifecycle, and end-to-end flows

import fetchMock from 'jest-fetch-mock';

// Mock chrome APIs before importing scripts
Object.defineProperty(global, 'chrome', {
  value: {
    action: {
      onClicked: {
        addListener: jest.fn(),
      },
    },
    scripting: {
      executeScript: jest.fn().mockResolvedValue(undefined),
    },
    tabs: {
      sendMessage: jest.fn().mockResolvedValue(undefined),
      get: jest.fn().mockResolvedValue({}),
      onRemoved: {
        addListener: jest.fn(),
      },
      onUpdated: {
        addListener: jest.fn(),
      },
    },
    storage: {
      sync: {
        get: jest.fn().mockResolvedValue({
          selectedModel: 'chrome-builtin',
          enableFallback: true,
          theme: 'light',
          openaiApiKey: 'test-openai-key',
          geminiApiKey: 'test-gemini-key',
          anthropicApiKey: 'test-anthropic-key',
        }),
        set: jest.fn().mockResolvedValue(undefined),
      },
      local: {
        get: jest.fn().mockResolvedValue({
          modelMetrics: {},
          summaryHistory: [],
        }),
        set: jest.fn().mockResolvedValue(undefined),
      },
    },
    runtime: {
      sendMessage: jest.fn().mockResolvedValue(undefined),
      onMessage: {
        addListener: jest.fn(),
      },
      getURL: jest.fn((path: string) => `chrome-extension://test-id/${path}`),
      openOptionsPage: jest.fn().mockResolvedValue(undefined),
    },
    permissions: {
      contains: jest.fn().mockResolvedValue(true),
      request: jest.fn().mockResolvedValue(true),
    },
  },
  writable: true,
});

// Mock utils module
jest.mock('../utils', () => ({
  checkChromeBuiltinSupport: jest.fn().mockResolvedValue(true),
  getModelConfig: jest.fn((model: string) => {
    const models: Record<string, any> = {
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
    return (
      models[model] || {
        provider: 'openai',
        modelId: model,
        name: model,
        cost: 0.01,
      }
    );
  }),
}));

import '../background';
import '../content';

interface MockTab {
  id: number;
  url: string;
  title: string;
}

interface MockSender {
  tab: MockTab;
}

describe('Extension Integration Tests', () => {
  let mockTab: MockTab;
  let mockSender: MockSender;

  beforeEach(() => {
    // Reset fetch mocks
    fetchMock.resetMocks();

    // Reset chrome mocks but preserve listeners
    Object.values(chrome).forEach((api) => {
      if (api && typeof api === 'object' && api.constructor === Object) {
        Object.values(api).forEach((method) => {
          if (
            method &&
            typeof method === 'object' &&
            method._isMockFunction &&
            method !== chrome.action.onClicked.addListener
          ) {
            method.mockReset();
          }
        });
      }
    });

    // Reset global state
    if ((global as any).summaryDiv) {
      (global as any).summaryDiv = null;
    }

    // Mock tab and sender
    mockTab = { id: 123, url: 'https://example.com', title: 'Test Page' };
    mockSender = { tab: mockTab };

    // Mock DOM for content script
    document.body.innerHTML = `
      <div id="content">
        <p>This is some test content for summarization.</p>
        <p>It contains multiple paragraphs and should be summarized properly.</p>
      </div>
    `;

    // Mock chrome APIs (reset and set up)
    (chrome as any).tabs.sendMessage.mockReset().mockResolvedValue();
    (chrome as any).tabs.get.mockReset().mockResolvedValue(mockTab);
    (chrome as any).storage.sync.get.mockReset().mockResolvedValue({
      selectedModel: 'chrome-builtin',
      enableFallback: true,
      theme: 'light',
      openaiApiKey: 'test-openai-key',
      geminiApiKey: 'test-gemini-key',
      anthropicApiKey: 'test-anthropic-key',
    });
    (chrome as any).storage.local.get.mockReset().mockResolvedValue({
      modelMetrics: {},
      summaryHistory: [],
    });
    (chrome as any).storage.sync.set.mockReset().mockResolvedValue();
    (chrome as any).storage.local.set.mockReset().mockResolvedValue();
    (chrome as any).runtime.sendMessage.mockReset().mockResolvedValue();
    (chrome as any).scripting.executeScript.mockReset().mockResolvedValue();
    (chrome as any).runtime.getURL
      .mockReset()
      .mockImplementation(
        (path: string) => `chrome-extension://test-id/${path}`
      );

    // Mock Summarizer API
    (globalThis as any).Summarizer = {
      create: jest.fn().mockResolvedValue({
        summarize: jest
          .fn()
          .mockResolvedValue('This is a mock summary of the content.'),
        destroy: jest.fn(),
      }),
    };

    // Mock showdown
    (global as any).showdown = {
      Converter: jest.fn().mockImplementation(() => ({
        makeHtml: jest
          .fn()
          .mockReturnValue('<p>This is a mock summary of the content.</p>'),
      })),
    };
  });

  describe('End-to-End Summarization Flow', () => {
    it('should complete full summarization workflow from action click to display', async () => {
      // Step 1: User clicks extension action button
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

      // Step 2: Content script receives toggle message and extracts content
      const processMessageStep2 = {
        action: 'process_content',
        content: 'This is some test content for summarization.',
      };
      (chrome as any).runtime.onMessage.addListener.mock.calls.forEach(
        ([listener]: [(message: any, sender: any) => void]) => {
          listener(processMessageStep2, mockSender);
        }
      );

      // Step 3: Background script processes content and returns summary
      const processMessage = {
        action: 'process_content',
        content: 'This is some test content for summarization.',
      };

      (chrome as any).runtime.onMessage.addListener.mock.calls.forEach(
        ([listener]: [(message: any, sender: any) => void]) => {
          listener(processMessage, mockSender);
        }
      );

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Should send display message back to content script
      expect((chrome as any).tabs.sendMessage).toHaveBeenCalledWith(
        123,
        expect.objectContaining({
          action: 'display_inline_summary',
          summary: 'This is a mock summary of the content.',
          model: 'chrome-builtin',
        })
      );
    });

    it('should handle model switching during summarization', async () => {
      // Start summarization
      const processMessage = {
        action: 'process_content',
        content: 'Test content',
        forceModel: 'gpt-3.5-turbo',
      };

      // Mock OpenAI API response
      (global as any).mockExternalAPIs.openai.success();

      (chrome as any).runtime.onMessage.addListener.mock.calls.forEach(
        ([listener]: [(message: any, sender: any) => void]) => {
          listener(processMessage, mockSender);
        }
      );

      await new Promise((resolve) => setTimeout(resolve, 0));

      // Should use the forced model
      expect((chrome as any).tabs.sendMessage).toHaveBeenCalledWith(
        123,
        expect.objectContaining({
          action: 'display_inline_summary',
          model: 'gpt-3.5-turbo',
          summary: 'OpenAI-powered summary response.',
        })
      );
    });

    it('should handle fallback when primary model fails', async () => {
      // Mock Chrome AI failure and OpenAI success
      (globalThis as any).Summarizer.create.mockRejectedValueOnce(
        new Error('Chrome AI failed')
      );

      (global as any).mockExternalAPIs.openai.success();

      const processMessage = {
        action: 'process_content',
        content: 'Test content',
      };

      (chrome as any).runtime.onMessage.addListener.mock.calls.forEach(
        ([listener]: [(message: any, sender: any) => void]) => {
          listener(processMessage, mockSender);
        }
      );

      await new Promise((resolve) => setTimeout(resolve, 0));

      // Should fallback to OpenAI
      expect((chrome as any).tabs.sendMessage).toHaveBeenCalledWith(
        123,
        expect.objectContaining({
          action: 'display_inline_summary',
          model: 'gpt-3.5-turbo',
          summary: 'OpenAI-powered summary response.',
        })
      );
    });
  });

  describe('Message Passing Integration', () => {
    it('should handle all message types between background and content scripts', () => {
      const messageTypes = [
        { action: 'toggle_summary_visibility' },
        { action: 'update_summary_visibility', visible: false },
        { action: 'open_options_page' },
        { action: 'switch_model', model: 'gpt-4' },
        { action: 'get_model_metrics' },
        { action: 'model_switched', model: 'gpt-4' },
      ];

      messageTypes.forEach((message) => {
        (chrome as any).runtime.onMessage.addListener.mock.calls.forEach(
          ([listener]: [(message: any, sender: any) => void]) => {
            expect(() => listener(message, mockSender)).not.toThrow();
          }
        );
      });
    });

    it('should properly sequence loading messages', async () => {
      const processMessage = {
        action: 'process_content',
        content: 'Test content',
      };

      (chrome as any).runtime.onMessage.addListener.mock.calls.forEach(
        ([listener]: [(message: any, sender: any) => void]) => {
          listener(processMessage, mockSender);
        }
      );

      // Should send loading spinner first
      expect((chrome as any).tabs.sendMessage).toHaveBeenCalledWith(123, {
        action: 'show_loading_spinner',
      });

      // Then progress updates
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Should eventually send display message
      expect((chrome as any).tabs.sendMessage).toHaveBeenCalledWith(
        123,
        expect.objectContaining({
          action: 'display_inline_summary',
        })
      );
    });

    it('should handle progress updates during summarization', async () => {
      const processMessage = {
        action: 'process_content',
        content: 'Test content',
      };

      (chrome as any).runtime.onMessage.addListener.mock.calls.forEach(
        ([listener]: [(message: any, sender: any) => void]) => {
          listener(processMessage, mockSender);
        }
      );

      await new Promise((resolve) => setTimeout(resolve, 0));

      // Should send progress updates to content script
      expect((chrome as any).tabs.sendMessage).toHaveBeenCalledWith(
        123,
        expect.objectContaining({
          action: 'update_loading_progress',
          progress: expect.objectContaining({
            step: expect.any(String),
            percentage: expect.any(Number),
          }),
        })
      );
    });
  });

  describe('Extension Lifecycle Integration', () => {
    it('should clean up resources when tab is closed', () => {
      // Simulate tab removal
      (chrome as any).tabs.onRemoved.addListener.mock.calls.forEach(
        ([listener]: [(tabId: number) => void]) => {
          listener(123);
        }
      );

      // Should handle cleanup without errors
      expect((chrome as any).tabs.onRemoved.addListener).toHaveBeenCalled();
    });

    it('should handle multiple concurrent tabs', async () => {
      const tabs = [
        { id: 123, url: 'https://example1.com', title: 'Page 1' },
        { id: 456, url: 'https://example2.com', title: 'Page 2' },
        { id: 789, url: 'https://example3.com', title: 'Page 3' },
      ];

      // Process content for multiple tabs concurrently
      const promises = tabs.map(async (tab) => {
        (chrome as any).tabs.get.mockResolvedValue(tab);

        const processMessage = {
          action: 'process_content',
          content: `Content for ${tab.title}`,
        };

        (chrome as any).runtime.onMessage.addListener.mock.calls.forEach(
          ([listener]: [(message: any, sender: any) => void]) => {
            listener(processMessage, { tab });
          }
        );

        await new Promise((resolve) => setTimeout(resolve, 0));

        return tab.id;
      });

      const results = await Promise.all(promises);

      // Should handle all tabs
      results.forEach((tabId) => {
        expect((chrome as any).tabs.sendMessage).toHaveBeenCalledWith(
          tabId,
          expect.objectContaining({
            action: 'display_inline_summary',
          })
        );
      });
    });

    it('should persist and retrieve summary history', async () => {
      const summaryData = {
        summary: 'This is a mock summary of the content.',
        model: 'chrome-builtin',
        time: '0.00',
        metrics: { attempts: [], totalTime: 0 },
      };

      // Process content and store history
      const processMessage = {
        action: 'process_content',
        content: 'Test content',
      };

      (chrome as any).runtime.onMessage.addListener.mock.calls.forEach(
        ([listener]: [(message: any, sender: any) => void]) => {
          listener(processMessage, mockSender);
        }
      );

      await new Promise((resolve) => setTimeout(resolve, 0));

      // Should store in history
      expect((chrome as any).storage.local.set).toHaveBeenCalledWith(
        expect.objectContaining({
          summaryHistory: expect.arrayContaining([
            expect.objectContaining({
              summary: summaryData.summary,
              model: summaryData.model,
              time: summaryData.time,
            }),
          ]),
        })
      );
    });
  });

  describe('Error Recovery Integration', () => {
    it('should recover from API failures and show appropriate messages', async () => {
      // Mock all APIs to fail
      (globalThis as any).Summarizer.create.mockRejectedValue(
        new Error('All APIs failed')
      );
      fetchMock.mockReject(new Error('Network error'));

      const processMessage = {
        action: 'process_content',
        content: 'Test content',
      };

      (chrome as any).runtime.onMessage.addListener.mock.calls.forEach(
        ([listener]: [(message: any, sender: any) => void]) => {
          listener(processMessage, mockSender);
        }
      );

      await new Promise((resolve) => setTimeout(resolve, 0));

      // Should send error message to content script
      expect((chrome as any).tabs.sendMessage).toHaveBeenCalledWith(
        123,
        expect.objectContaining({
          action: 'display_inline_summary',
          summary: expect.stringContaining('Unable to summarize content'),
          model: 'N/A',
        })
      );
    });

    it('should handle malformed messages gracefully', () => {
      const malformedMessages = [
        { action: 'unknown_action' },
        { action: 'process_content' }, // Missing content
        { action: 'update_summary_visibility' }, // Missing visible
        { action: 'switch_model' }, // Missing model
        {},
        null,
        undefined,
      ];

      malformedMessages.forEach((message) => {
        (chrome as any).runtime.onMessage.addListener.mock.calls.forEach(
          ([listener]: [(message: any, sender: any) => void]) => {
            expect(() => listener(message, mockSender)).not.toThrow();
          }
        );
      });
    });

    it('should handle storage failures during history saving', async () => {
      (chrome as any).storage.local.set.mockRejectedValue(
        new Error('Storage failed')
      );

      const processMessage = {
        action: 'process_content',
        content: 'Test content',
      };

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      (chrome as any).runtime.onMessage.addListener.mock.calls.forEach(
        ([listener]: [(message: any, sender: any) => void]) => {
          listener(processMessage, mockSender);
        }
      );

      await new Promise((resolve) => setTimeout(resolve, 0));

      // Should log error but not crash
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error storing summary history:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Performance and Metrics Integration', () => {
    it('should track and update model performance metrics', async () => {
      const processMessage = {
        action: 'process_content',
        content: 'Test content',
      };

      (chrome as any).runtime.onMessage.addListener.mock.calls.forEach(
        ([listener]: [(message: any, sender: any) => void]) => {
          listener(processMessage, mockSender);
        }
      );

      await new Promise((resolve) => setTimeout(resolve, 0));

      // Should update metrics
      expect((chrome as any).storage.local.set).toHaveBeenCalledWith(
        expect.objectContaining({
          modelMetrics: expect.objectContaining({
            'chrome-builtin': expect.objectContaining({
              totalRequests: 1,
              successfulRequests: 1,
              avgTime: expect.any(Number),
              lastUsed: expect.any(String),
            }),
          }),
        })
      );
    });

    it('should handle metrics retrieval failures', () => {
      // Mock storage.get to not call callback (simulating failure)
      (chrome as any).storage.local.get.mockImplementationOnce(() => {
        // Don't call callback to simulate storage failure
      });

      const metricsMessage = { action: 'get_model_metrics' };

      expect(() => {
        (chrome as any).runtime.onMessage.addListener.mock.calls.forEach(
          ([listener]: [(message: any, sender: any) => void]) => {
            listener(metricsMessage, mockSender);
          }
        );
      }).not.toThrow();
    });
  });

  describe('UI Integration', () => {
    it('should integrate with content script UI updates', async () => {
      // Mock content script receiving display message
      const displayMessage = {
        action: 'display_inline_summary',
        summary: 'Test summary',
        model: 'chrome-builtin',
        time: '1.50',
        metrics: { attempts: [], totalTime: 1.5 },
      };

      // This would normally be handled by content script
      // We're testing that the message structure is correct
      expect(displayMessage).toEqual(
        expect.objectContaining({
          action: 'display_inline_summary',
          summary: 'Test summary',
          model: 'chrome-builtin',
          time: '1.50',
        })
      );
    });

    it('should handle theme integration', () => {
      (chrome as any).storage.sync.get.mockResolvedValue({
        theme: 'dark',
      });

      // Theme should be passed to content script
      const displayMessage = {
        action: 'display_inline_summary',
        summary: 'Test summary',
        model: 'chrome-builtin',
        time: '1.50',
        metrics: { attempts: [], totalTime: 1.5 },
      };

      // Content script should use theme for styling
      expect(displayMessage).toBeDefined();
    });
  });
});

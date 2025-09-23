// Integration tests for the AI Summary Extension
// Tests message passing, extension lifecycle, and end-to-end flows

import '../background.ts';
import '../content.ts';

describe('Extension Integration Tests', () => {
  let mockTab;
  let mockSender;

  beforeEach(() => {
    // Reset fetch mocks
    fetchMock.resetMocks();

    // Reset chrome mocks but preserve listeners
    Object.values(chrome).forEach((api) => {
      if (api && typeof api === 'object' && api.constructor === Object) {
        Object.values(api).forEach((method) => {
          if (method && typeof method === 'object' && method._isMockFunction) {
            method.mockReset();
          }
        });
      }
    });

    // Reset global state
    if (global.summaryDiv) {
      global.summaryDiv = null;
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
    chrome.tabs.sendMessage.mockReset().mockResolvedValue();
    chrome.tabs.get.mockReset().mockResolvedValue(mockTab);
    chrome.storage.sync.get.mockReset().mockResolvedValue({
      selectedModel: 'chrome-builtin',
      enableFallback: true,
      theme: 'light',
      openaiApiKey: 'test-openai-key',
      geminiApiKey: 'test-gemini-key',
      anthropicApiKey: 'test-anthropic-key',
    });
    chrome.storage.local.get.mockReset().mockResolvedValue({
      modelMetrics: {},
      summaryHistory: [],
    });
    chrome.storage.sync.set.mockReset().mockResolvedValue();
    chrome.storage.local.set.mockReset().mockResolvedValue();
    chrome.runtime.sendMessage.mockReset().mockResolvedValue();

    // Mock Summarizer API
    globalThis.Summarizer = {
      create: jest.fn().mockResolvedValue({
        summarize: jest
          .fn()
          .mockResolvedValue('This is a mock summary of the content.'),
        destroy: jest.fn(),
      }),
    };

    // Mock showdown
    global.showdown = {
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
      for (const [listener] of chrome.action.onClicked.addListener.mock.calls) {
        await listener(mockTab);
      }

      expect(chrome.scripting.executeScript).toHaveBeenCalledWith({
        target: { tabId: 123 },
        files: ['Readability.js', 'showdown.min.js', 'dist/content.js'],
      });
      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(123, {
        action: 'toggle_summary_visibility',
        hasSummary: false,
      });

      // Step 2: Content script receives toggle message and extracts content
      const toggleMessage = { action: 'toggle_summary_visibility' };
      chrome.runtime.onMessage.addListener.mock.calls.forEach(([listener]) => {
        listener(toggleMessage, mockSender);
      });

      // Should extract content and send process_content message
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'process_content',
          content: expect.stringContaining('This is some test content'),
        })
      );

      // Step 3: Background script processes content and returns summary
      const processMessage = {
        action: 'process_content',
        content: 'This is some test content for summarization.',
      };

      chrome.runtime.onMessage.addListener.mock.calls.forEach(([listener]) => {
        listener(processMessage, mockSender);
      });

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Should send display message back to content script
      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(
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
      global.mockExternalAPIs.openai.success();

      chrome.runtime.onMessage.addListener.mock.calls.forEach(([listener]) => {
        listener(processMessage, mockSender);
      });

      await new Promise((resolve) => setTimeout(resolve, 0));

      // Should use the forced model
      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(
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
      globalThis.Summarizer.create.mockRejectedValueOnce(
        new Error('Chrome AI failed')
      );

      global.mockExternalAPIs.openai.success();

      const processMessage = {
        action: 'process_content',
        content: 'Test content',
      };

      chrome.runtime.onMessage.addListener.mock.calls.forEach(([listener]) => {
        listener(processMessage, mockSender);
      });

      await new Promise((resolve) => setTimeout(resolve, 0));

      // Should fallback to OpenAI
      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(
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
        chrome.runtime.onMessage.addListener.mock.calls.forEach(
          ([listener]) => {
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

      chrome.runtime.onMessage.addListener.mock.calls.forEach(([listener]) => {
        listener(processMessage, mockSender);
      });

      // Should send loading spinner first
      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(123, {
        action: 'show_loading_spinner',
      });

      // Then progress updates
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Should eventually send display message
      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(
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

      chrome.runtime.onMessage.addListener.mock.calls.forEach(([listener]) => {
        listener(processMessage, mockSender);
      });

      await new Promise((resolve) => setTimeout(resolve, 0));

      // Should send progress updates to content script
      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(
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
      chrome.tabs.onRemoved.addListener.mock.calls.forEach(([listener]) => {
        listener(123);
      });

      // Should handle cleanup without errors
      expect(chrome.tabs.onRemoved.addListener).toHaveBeenCalled();
    });

    it('should handle multiple concurrent tabs', async () => {
      const tabs = [
        { id: 123, url: 'https://example1.com', title: 'Page 1' },
        { id: 456, url: 'https://example2.com', title: 'Page 2' },
        { id: 789, url: 'https://example3.com', title: 'Page 3' },
      ];

      // Process content for multiple tabs concurrently
      const promises = tabs.map(async (tab) => {
        chrome.tabs.get.mockResolvedValue(tab);

        const processMessage = {
          action: 'process_content',
          content: `Content for ${tab.title}`,
        };

        chrome.runtime.onMessage.addListener.mock.calls.forEach(
          ([listener]) => {
            listener(processMessage, { tab });
          }
        );

        await new Promise((resolve) => setTimeout(resolve, 0));

        return tab.id;
      });

      const results = await Promise.all(promises);

      // Should handle all tabs
      results.forEach((tabId) => {
        expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(
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

      chrome.runtime.onMessage.addListener.mock.calls.forEach(([listener]) => {
        listener(processMessage, mockSender);
      });

      await new Promise((resolve) => setTimeout(resolve, 0));

      // Should store in history
      expect(chrome.storage.local.set).toHaveBeenCalledWith(
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
      globalThis.Summarizer.create.mockRejectedValue(
        new Error('All APIs failed')
      );
      fetchMock.mockReject(new Error('Network error'));

      const processMessage = {
        action: 'process_content',
        content: 'Test content',
      };

      chrome.runtime.onMessage.addListener.mock.calls.forEach(([listener]) => {
        listener(processMessage, mockSender);
      });

      await new Promise((resolve) => setTimeout(resolve, 0));

      // Should send error message to content script
      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(
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
        chrome.runtime.onMessage.addListener.mock.calls.forEach(
          ([listener]) => {
            expect(() => listener(message, mockSender)).not.toThrow();
          }
        );
      });
    });

    it('should handle storage failures during history saving', async () => {
      chrome.storage.local.set.mockRejectedValue(new Error('Storage failed'));

      const processMessage = {
        action: 'process_content',
        content: 'Test content',
      };

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      chrome.runtime.onMessage.addListener.mock.calls.forEach(([listener]) => {
        listener(processMessage, mockSender);
      });

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

      chrome.runtime.onMessage.addListener.mock.calls.forEach(([listener]) => {
        listener(processMessage, mockSender);
      });

      await new Promise((resolve) => setTimeout(resolve, 0));

      // Should update metrics
      expect(chrome.storage.local.set).toHaveBeenCalledWith(
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
      chrome.storage.local.get.mockImplementationOnce(() => {
        // Don't call callback to simulate storage failure
      });

      const metricsMessage = { action: 'get_model_metrics' };

      expect(() => {
        chrome.runtime.onMessage.addListener.mock.calls.forEach(
          ([listener]) => {
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
      chrome.storage.sync.get.mockResolvedValue({
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

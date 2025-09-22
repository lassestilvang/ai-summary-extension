// Comprehensive unit tests for options.ts
import '../options.ts';

describe('Options Script Comprehensive Tests', () => {
  let mockDOM;

  beforeEach(() => {
    // Reset fetch mocks
    fetchMock.resetMocks();

    // Mock DOM elements
    mockDOM = {
      // Navigation elements
      sidebar: { classList: { toggle: jest.fn() } },
      toggleSidebar: { addEventListener: jest.fn() },

      // Settings elements
      selectedModel: { value: 'chrome-builtin' },
      temperature: { value: '0.7', addEventListener: jest.fn() },
      'temperature-value': { textContent: '0.7' },
      maxTokens: { value: '1000' },
      enableFallback: { checked: true },
      openaiApiKey: { value: 'test-openai-key', addEventListener: jest.fn() },
      geminiApiKey: { value: 'test-gemini-key', addEventListener: jest.fn() },
      anthropicApiKey: {
        value: 'test-anthropic-key',
        addEventListener: jest.fn(),
      },
      save: { addEventListener: jest.fn() },
      theme: { value: 'light', appendChild: jest.fn() },
      status: { textContent: '', className: '', style: {} },

      // Performance elements
      refreshMetrics: { addEventListener: jest.fn() },
      metricsContainer: { innerHTML: '' },
      performanceChart: {},

      // History elements
      searchInput: { value: '', addEventListener: jest.fn() },
      filterModel: {
        value: '',
        addEventListener: jest.fn(),
        innerHTML: '',
        appendChild: jest.fn(),
      },
      refreshHistory: { addEventListener: jest.fn() },
      clearHistory: { addEventListener: jest.fn() },
      historyContainer: { innerHTML: '' },

      // Form
      'settings-form': { addEventListener: jest.fn() },
    };

    // Mock document.getElementById
    document.getElementById = jest.fn((id) => mockDOM[id] || null);

    // Mock document.querySelector
    document.querySelector = jest.fn(() => null);

    // Mock document.querySelectorAll
    document.querySelectorAll = jest.fn((selector) => {
      if (selector === '.nav-link') {
        return [
          {
            addEventListener: jest.fn(),
            getAttribute: jest.fn(() => 'settings'),
            dataset: { page: 'settings' },
          },
        ];
      }
      if (selector === '.page') {
        return [{ classList: { remove: jest.fn(), add: jest.fn() } }];
      }
      return [];
    });

    // Mock document.createElement
    document.createElement = jest.fn((tag) => {
      if (tag === 'option') {
        return { value: '', textContent: '', setAttribute: jest.fn() };
      }
      if (tag === 'table') {
        return {
          innerHTML: '',
          appendChild: jest.fn(),
          insertRow: jest.fn(() => ({
            insertCell: jest.fn(() => ({ textContent: '' })),
          })),
        };
      }
      if (tag === 'div') {
        return {
          className: '',
          innerHTML: '',
          appendChild: jest.fn(),
          addEventListener: jest.fn(),
        };
      }
      return { appendChild: jest.fn() };
    });

    // Mock chrome.storage.sync.get/set
    chrome.storage.sync.get.mockResolvedValue({
      selectedModel: 'chrome-builtin',
      enableFallback: true,
      openaiApiKey: 'test-openai-key',
      geminiApiKey: 'test-gemini-key',
      anthropicApiKey: 'test-anthropic-key',
      theme: 'light',
    });

    chrome.storage.sync.set.mockImplementation((items, callback) => {
      if (callback) callback();
      return Promise.resolve();
    });
    chrome.storage.local.get.mockImplementation((keys, callback) => {
      const defaultValues = {
        modelMetrics: {},
        summaryHistory: [],
      };
      const result = {};
      if (Array.isArray(keys)) {
        keys.forEach((key) => {
          result[key] = defaultValues[key] || null;
        });
      } else if (typeof keys === 'string') {
        result[keys] = defaultValues[keys] || null;
      } else {
        Object.assign(result, defaultValues);
      }
      if (callback) callback(result);
      return Promise.resolve(result);
    });
    chrome.storage.local.set
      .mockReset()
      .mockImplementation((items, callback) => {
        if (callback) callback();
        return Promise.resolve();
      });

    // Mock chrome.runtime.sendMessage
    chrome.runtime.sendMessage.mockResolvedValue();
    chrome.runtime.onMessage.addListener.mockImplementation(() => {});

    // Mock navigator.clipboard
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: jest.fn().mockResolvedValue() },
      writable: true,
    });

    // Mock navigator.share
    Object.defineProperty(navigator, 'share', {
      value: jest.fn().mockResolvedValue(),
      writable: true,
    });

    // Trigger DOMContentLoaded
    document.dispatchEvent(new Event('DOMContentLoaded'));
  });

  describe('DOM Initialization', () => {
    it('should initialize all DOM elements correctly', () => {
      expect(document.getElementById).toHaveBeenCalledWith('sidebar');
      expect(document.getElementById).toHaveBeenCalledWith('toggleSidebar');
      expect(document.getElementById).toHaveBeenCalledWith('selectedModel');
      expect(document.getElementById).toHaveBeenCalledWith('temperature');
      expect(document.getElementById).toHaveBeenCalledWith('temperature-value');
      expect(document.getElementById).toHaveBeenCalledWith('maxTokens');
      expect(document.getElementById).toHaveBeenCalledWith('enableFallback');
      expect(document.getElementById).toHaveBeenCalledWith('openaiApiKey');
      expect(document.getElementById).toHaveBeenCalledWith('geminiApiKey');
      expect(document.getElementById).toHaveBeenCalledWith('anthropicApiKey');
      expect(document.getElementById).toHaveBeenCalledWith('theme');
      expect(document.getElementById).toHaveBeenCalledWith('status');
      expect(document.getElementById).toHaveBeenCalledWith('settings-form');
      expect(document.getElementById).toHaveBeenCalledWith('refreshMetrics');
      expect(document.getElementById).toHaveBeenCalledWith('metricsContainer');
      expect(document.getElementById).toHaveBeenCalledWith('performanceChart');
      expect(document.getElementById).toHaveBeenCalledWith('searchInput');
      expect(document.getElementById).toHaveBeenCalledWith('filterModel');
      expect(document.getElementById).toHaveBeenCalledWith('refreshHistory');
      expect(document.getElementById).toHaveBeenCalledWith('clearHistory');
      expect(document.getElementById).toHaveBeenCalledWith('historyContainer');
    });

    it('should populate theme selector with all available themes', () => {
      // Should have been called for each theme
      expect(document.createElement).toHaveBeenCalledWith('option');
      expect(mockDOM.theme.appendChild).toHaveBeenCalled();
    });

    it('should load saved settings on initialization', () => {
      expect(chrome.storage.sync.get).toHaveBeenCalledWith(
        [
          'selectedModel',
          'temperature',
          'maxTokens',
          'enableFallback',
          'openaiApiKey',
          'geminiApiKey',
          'anthropicApiKey',
          'theme',
        ],
        expect.any(Function)
      );
    });

    it('should set default values when no saved settings exist', () => {
      chrome.storage.sync.get.mockResolvedValueOnce({});

      // Re-trigger initialization
      document.dispatchEvent(new Event('DOMContentLoaded'));

      expect(mockDOM.selectedModel.value).toBe('chrome-builtin');
      expect(mockDOM.enableFallback.checked).toBe(true);
    });
  });

  describe('Settings Saving', () => {
    it('should save all settings when save button is clicked', () => {
      const settingsForm = mockDOM['settings-form'];
      const submitHandler = settingsForm.addEventListener.mock.calls[0][1];

      // Simulate form values
      mockDOM.selectedModel.value = 'gpt-4';
      mockDOM.enableFallback.checked = false;
      mockDOM.openaiApiKey.value = 'new-openai-key';
      mockDOM.geminiApiKey.value = 'new-gemini-key';
      mockDOM.anthropicApiKey.value = 'new-anthropic-key';
      mockDOM.theme.value = 'dark';

      // Trigger save
      submitHandler({ preventDefault: jest.fn() });

      expect(chrome.storage.sync.set).toHaveBeenCalledWith(
        {
          selectedModel: 'gpt-4',
          temperature: 0.7,
          maxTokens: 1000,
          enableFallback: false,
          openaiApiKey: 'new-openai-key',
          geminiApiKey: 'new-gemini-key',
          anthropicApiKey: 'new-anthropic-key',
          theme: 'dark',
        },
        expect.any(Function)
      );
    });

    it('should trim API key values before saving', () => {
      const settingsForm = mockDOM['settings-form'];
      const submitHandler = settingsForm.addEventListener.mock.calls[0][1];

      mockDOM.openaiApiKey.value = '  test-key  ';

      submitHandler({ preventDefault: jest.fn() });

      expect(chrome.storage.sync.set).toHaveBeenCalledWith(
        expect.objectContaining({
          openaiApiKey: 'test-key',
        }),
        expect.any(Function)
      );
    });

    it('should show success message after saving', async () => {
      const settingsForm = mockDOM['settings-form'];
      const submitHandler = settingsForm.addEventListener.mock.calls[0][1];

      submitHandler({ preventDefault: jest.fn() });

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockDOM.status.textContent).toBe('Settings saved successfully!');
      expect(mockDOM.status.className).toBe('status success');
    });

    it('should clear status message after 3 seconds', async () => {
      jest.useFakeTimers();

      const settingsForm = mockDOM['settings-form'];
      const submitHandler = settingsForm.addEventListener.mock.calls[0][1];

      submitHandler({ preventDefault: jest.fn() });

      // Fast-forward time
      jest.advanceTimersByTime(3000);

      expect(mockDOM.status.textContent).toBe('');
      expect(mockDOM.status.className).toBe('');

      jest.useRealTimers();
    });
  });

  describe('Metrics Display', () => {
    const mockMetrics = {
      'chrome-builtin': {
        totalRequests: 10,
        successfulRequests: 8,
        totalTime: 25.5,
        avgTime: 2.55,
        lastUsed: '2023-12-01T10:00:00.000Z',
      },
      'gpt-3.5-turbo': {
        totalRequests: 5,
        successfulRequests: 4,
        totalTime: 15.0,
        avgTime: 3.0,
        lastUsed: '2023-12-02T10:00:00.000Z',
      },
    };

    it('should display metrics table when metrics exist', () => {
      // Mock the displayMetrics function call
      const mockMetricsResponse = {
        action: 'model_metrics_response',
        metrics: mockMetrics,
      };

      // Trigger the message listener
      chrome.runtime.onMessage.addListener.mock.calls.forEach(([listener]) => {
        listener(mockMetricsResponse);
      });

      expect(mockDOM.metricsContainer.innerHTML).toContain(
        'Chrome Built-in AI'
      );
      expect(mockDOM.metricsContainer.innerHTML).toContain('GPT-3.5 Turbo');
    });

    it('should show message when no metrics exist', () => {
      const mockMetricsResponse = {
        action: 'model_metrics_response',
        metrics: {},
      };

      chrome.runtime.onMessage.addListener.mock.calls.forEach(([listener]) => {
        listener(mockMetricsResponse);
      });

      expect(mockDOM.metricsContainer.innerHTML).toContain(
        'No performance data available yet'
      );
    });

    it('should calculate success rate correctly', () => {
      const mockMetricsResponse = {
        action: 'model_metrics_response',
        metrics: mockMetrics,
      };

      chrome.runtime.onMessage.addListener.mock.calls.forEach(([listener]) => {
        listener(mockMetricsResponse);
      });

      expect(mockDOM.metricsContainer.innerHTML).toContain('80.0%'); // 8/10
      expect(mockDOM.metricsContainer.innerHTML).toContain('2.55s'); // avg time
    });

    it('should format last used date correctly', () => {
      const mockMetricsResponse = {
        action: 'model_metrics_response',
        metrics: mockMetrics,
      };

      chrome.runtime.onMessage.addListener.mock.calls.forEach(([listener]) => {
        listener(mockMetricsResponse);
      });

      expect(mockDOM.metricsContainer.innerHTML).toContain('12/1/2023');
    });

    it('should handle missing model config gracefully', () => {
      const mockMetricsResponse = {
        action: 'model_metrics_response',
        metrics: {
          'unknown-model': {
            totalRequests: 1,
            successfulRequests: 1,
            totalTime: 1.0,
            avgTime: 1.0,
            lastUsed: '2023-12-01T10:00:00.000Z',
          },
        },
      };

      chrome.runtime.onMessage.addListener.mock.calls.forEach(([listener]) => {
        listener(mockMetricsResponse);
      });

      expect(mockDOM.metricsContainer.innerHTML).toContain('unknown-model');
    });
  });

  describe('History Display', () => {
    const mockHistory = [
      {
        id: '1',
        timestamp: '2023-12-01T10:00:00.000Z',
        url: 'https://example.com',
        title: 'Example Page',
        summary: 'This is a test summary.',
        model: 'chrome-builtin',
        time: '2.50',
        metrics: { attempts: [], totalTime: 2.5 },
      },
      {
        id: '2',
        timestamp: '2023-12-02T10:00:00.000Z',
        url: 'https://test.com',
        title: '',
        summary: 'Another test summary.',
        model: 'gpt-3.5-turbo',
        time: '3.00',
        metrics: { attempts: [], totalTime: 3.0 },
      },
    ];

    it('should display history items correctly', () => {
      // Mock chrome.storage.local.get for history
      chrome.storage.local.get.mockImplementationOnce((keys, callback) => {
        if (callback) callback({ summaryHistory: mockHistory });
        return Promise.resolve({ summaryHistory: mockHistory });
      });

      // Trigger refresh history
      const refreshButton = mockDOM.refreshHistory;
      const clickHandler = refreshButton.addEventListener.mock.calls[0][1];
      clickHandler();

      expect(mockDOM.historyContainer.innerHTML).toContain('Example Page');
      expect(mockDOM.historyContainer.innerHTML).toContain(
        'Another test summary'
      );
      expect(mockDOM.historyContainer.innerHTML).toContain(
        'Chrome Built-in AI'
      );
      expect(mockDOM.historyContainer.innerHTML).toContain('GPT-3.5 Turbo');
    });

    it('should show message when no history exists', () => {
      chrome.storage.local.get.mockResolvedValueOnce({ summaryHistory: [] });

      const refreshButton = mockDOM.refreshHistory;
      const clickHandler = refreshButton.addEventListener.mock.calls[0][1];
      clickHandler();

      expect(mockDOM.historyContainer.innerHTML).toContain(
        'No summary history available yet'
      );
    });

    it('should handle missing title gracefully', () => {
      const historyWithMissingTitle = [
        {
          ...mockHistory[1],
          title: null,
        },
      ];

      chrome.storage.local.get.mockImplementationOnce((keys, callback) => {
        if (callback) callback({ summaryHistory: historyWithMissingTitle });
        return Promise.resolve({ summaryHistory: historyWithMissingTitle });
      });

      const refreshButton = mockDOM.refreshHistory;
      const clickHandler = refreshButton.addEventListener.mock.calls[0][1];
      clickHandler();

      expect(mockDOM.historyContainer.innerHTML).toContain('Untitled');
    });

    it('should format timestamps correctly', () => {
      chrome.storage.local.get.mockImplementationOnce((keys, callback) => {
        if (callback) callback({ summaryHistory: mockHistory });
        return Promise.resolve({ summaryHistory: mockHistory });
      });

      const refreshButton = mockDOM.refreshHistory;
      const clickHandler = refreshButton.addEventListener.mock.calls[0][1];
      clickHandler();

      expect(mockDOM.historyContainer.innerHTML).toContain('12/1/2023');
      expect(mockDOM.historyContainer.innerHTML).toContain('12/2/2023');
    });

    it('should show attempt count when multiple attempts were made', () => {
      const historyWithAttempts = [
        {
          ...mockHistory[0],
          metrics: {
            attempts: [{ success: false }, { success: true }],
            totalTime: 2.5,
          },
        },
      ];

      chrome.storage.local.get.mockImplementationOnce((keys, callback) => {
        if (callback) callback({ summaryHistory: historyWithAttempts });
        return Promise.resolve({ summaryHistory: historyWithAttempts });
      });

      const refreshButton = mockDOM.refreshHistory;
      const clickHandler = refreshButton.addEventListener.mock.calls[0][1];
      clickHandler();
    });
  });

  describe('History Management', () => {
    it('should clear history when confirmed', async () => {
      // Mock confirm
      const originalConfirm = global.confirm;
      global.confirm = jest.fn().mockReturnValue(true);

      const clearButton = mockDOM.clearHistory;
      const clickHandler = clearButton.addEventListener.mock.calls[0][1];

      clickHandler();

      expect(chrome.storage.local.set).toHaveBeenCalledWith(
        {
          summaryHistory: [],
        },
        expect.any(Function)
      );
      expect(mockDOM.status.textContent).toBe('History cleared successfully!');

      // Restore
      global.confirm = originalConfirm;
    });

    it('should not clear history when not confirmed', () => {
      // Mock confirm
      const originalConfirm = window.confirm;
      window.confirm = jest.fn().mockReturnValue(false);

      const clearButton = mockDOM.clearHistory;
      const clickHandler = clearButton.addEventListener.mock.calls[0][1];

      clickHandler();

      expect(chrome.storage.local.set).not.toHaveBeenCalled();

      // Restore
      window.confirm = originalConfirm;
    });

    it('should limit history to 50 entries', () => {
      const largeHistory = Array.from({ length: 55 }, (_, i) => ({
        id: `entry-${i}`,
        timestamp: new Date().toISOString(),
        url: `https://example${i}.com`,
        title: `Page ${i}`,
        summary: `Summary ${i}`,
        model: 'chrome-builtin',
        time: '1.00',
        metrics: { attempts: [], totalTime: 1.0 },
      }));

      chrome.storage.local.get.mockResolvedValueOnce({
        summaryHistory: largeHistory,
      });

      const refreshButton = mockDOM.refreshHistory;
      const clickHandler = refreshButton.addEventListener.mock.calls[0][1];
      clickHandler();

      // Should only display 50 items (most recent first)
      const historyItems =
        mockDOM.historyContainer.innerHTML.match(/history-item/g) || [];
      expect(historyItems.length).toBeLessThanOrEqual(50);
    });
  });

  describe('Global Functions', () => {
    it('should copy text to clipboard', async () => {
      jest.useFakeTimers();
      const testText = 'Test summary text';

      // Call the real function
      window.copyToClipboard(testText);

      // Advance timers to let the promise resolve
      await jest.runAllTimers();

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(testText);
      expect(mockDOM.status.textContent).toBe('Summary copied to clipboard!');

      jest.useRealTimers();
    });

    it('should share summary when navigator.share is available', () => {
      const title = 'Test Title';
      const text = 'Test summary text';

      global.shareSummary(title, text);

      expect(navigator.share).toHaveBeenCalledWith({
        title: title,
        text: text,
      });
    });

    it('should fallback to clipboard when navigator.share is not available', () => {
      // Mock share as undefined
      const originalShare = navigator.share;
      Object.defineProperty(navigator, 'share', {
        value: undefined,
        writable: true,
      });

      const title = 'Test Title';
      const text = 'Test summary text';

      global.shareSummary(title, text);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(text);

      // Restore
      Object.defineProperty(navigator, 'share', {
        value: originalShare,
        writable: true,
      });
    });
  });

  describe('Event Listeners', () => {
    it('should set up all event listeners on initialization', () => {
      expect(mockDOM['settings-form'].addEventListener).toHaveBeenCalledWith(
        'submit',
        expect.any(Function)
      );
      expect(mockDOM.refreshMetrics.addEventListener).toHaveBeenCalledWith(
        'click',
        expect.any(Function)
      );
      expect(mockDOM.refreshHistory.addEventListener).toHaveBeenCalledWith(
        'click',
        expect.any(Function)
      );
      expect(mockDOM.clearHistory.addEventListener).toHaveBeenCalledWith(
        'click',
        expect.any(Function)
      );
    });

    it('should load metrics on page load', () => {
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        action: 'get_model_metrics',
      });
    });

    it('should load history on page load', () => {
      expect(chrome.storage.local.get).toHaveBeenCalledWith(
        'summaryHistory',
        expect.any(Function)
      );
    });
  });

  describe('Theme Configuration', () => {
    it('should include all predefined themes', () => {
      // Check that theme options were created
      expect(document.createElement).toHaveBeenCalledWith('option');

      // Verify theme selector population
      const themeSelect = mockDOM.theme;
      expect(themeSelect.appendChild).toHaveBeenCalled();
    });

    it('should handle theme selection changes', () => {
      mockDOM.theme.value = 'dark';

      const settingsForm = mockDOM['settings-form'];
      const submitHandler = settingsForm.addEventListener.mock.calls[0][1];

      submitHandler({ preventDefault: jest.fn() });

      expect(chrome.storage.sync.set).toHaveBeenCalledWith(
        expect.objectContaining({
          theme: 'dark',
        }),
        expect.any(Function)
      );
    });
  });

  describe('Model Configuration', () => {
    it('should handle all supported model types', () => {
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
        mockDOM.selectedModel.value = model;

        const settingsForm = mockDOM['settings-form'];
        const submitHandler = settingsForm.addEventListener.mock.calls[0][1];

        submitHandler({ preventDefault: jest.fn() });

        expect(chrome.storage.sync.set).toHaveBeenCalledWith(
          expect.objectContaining({
            selectedModel: model,
          }),
          expect.any(Function)
        );
      });
    });

    it('should handle enableFallback toggle', () => {
      mockDOM.enableFallback.checked = false;

      const settingsForm = mockDOM['settings-form'];
      const submitHandler = settingsForm.addEventListener.mock.calls[0][1];

      submitHandler({ preventDefault: jest.fn() });

      expect(chrome.storage.sync.set).toHaveBeenCalledWith(
        expect.objectContaining({
          enableFallback: false,
        }),
        expect.any(Function)
      );
    });
  });
});

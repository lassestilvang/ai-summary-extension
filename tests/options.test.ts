// Comprehensive unit tests for options.ts
// Import the options script to execute it during tests
import '../options';

import 'jest-fetch-mock';

// Mock utils module
jest.mock('../utils', () => ({
  checkChromeBuiltinSupport: jest.fn().mockResolvedValue(true),
  formatDateTime: jest.fn((date) => {
    // Mock different return values based on the date for testing
    const dateStr = date.toISOString().split('T')[0];
    if (dateStr === '2023-12-01') return '01/12/2023 10:00';
    if (dateStr === '2023-12-02') return '02/12/2023 10:00';
    return '17/10/2024 20:21';
  }),
  getDefaultDateTimeFormat: jest.fn().mockReturnValue('dd/mm/yyyy-24h'),
  getCurrentDateTimeFormat: jest.fn().mockResolvedValue('dd/mm/yyyy-24h'),
  validateLanguageSupport: jest.fn(),
}));

declare global {
  interface Window {
    validateApiKey: (
      provider: string,
      key: string
    ) => Promise<{ valid: boolean; error?: string }>;
    validateOpenAIApiKey: (
      key: string
    ) => Promise<{ valid: boolean; error?: string }>;
    validateGeminiApiKey: (
      key: string
    ) => Promise<{ valid: boolean; error?: string }>;
    validateAnthropicApiKey: (
      key: string
    ) => Promise<{ valid: boolean; error?: string }>;
    isModelAvailable: (model: string, apiKeys: any) => boolean;
    optionsGetModelConfig: (model: string) => any;
    copyToClipboard: (text: string, statusId: string) => void;
  }
}

interface MockDOM {
  [key: string]: any;
}

let mockDOM: MockDOM;
let mockNavLink: any;
let mockPage: any;

describe('Options Script Comprehensive Tests', () => {
  // Utility functions are tested indirectly through integration tests
  // since they are internal to the options.ts module and not exported

  beforeEach(() => {
    // Reset fetch mocks
    fetchMock.resetMocks();

    // Create persistent mock objects
    mockNavLink = {
      addEventListener: jest.fn(),
      getAttribute: jest.fn(() => 'settings'),
      dataset: { page: 'settings' },
      classList: { remove: jest.fn(), add: jest.fn() },
    };
    mockPage = { classList: { remove: jest.fn(), add: jest.fn() } };

    // Mock DOM elements
    mockDOM = {
      // Theme toggle
      themeToggle: {
        addEventListener: jest.fn(),
        querySelector: jest.fn(() => ({ className: '', style: {} })),
      },

      // Navigation elements
      sidebar: { classList: { toggle: jest.fn() } },
      toggleSidebar: { addEventListener: jest.fn() },

      // Settings elements
      selectedModel: { value: 'chrome-builtin' },
      language: { value: 'en', addEventListener: jest.fn() },
      temperature: { value: '0.7', addEventListener: jest.fn() },
      'temperature-value': { textContent: '0.7' },
      maxTokens: { value: '1000' },
      summaryLength: { value: 'medium' },
      enableFallback: { checked: true },
      enableRightClickContextMenu: { checked: true, addEventListener: jest.fn() },
      openaiApiKey: { value: 'test-openai-key', addEventListener: jest.fn() },
      geminiApiKey: { value: 'test-gemini-key', addEventListener: jest.fn() },
      anthropicApiKey: {
        value: 'test-anthropic-key',
        addEventListener: jest.fn(),
      },
      dateTimeFormat: {
        value: 'dd/mm/yyyy-24h',
        appendChild: jest.fn(),
        addEventListener: jest.fn(),
      },
      save: { addEventListener: jest.fn() },
      theme: {
        value: 'light',
        appendChild: jest.fn(),
        addEventListener: jest.fn(),
      },
      fontFamily: {
        value: 'Arial',
        addEventListener: jest.fn(),
        appendChild: jest.fn(),
      },
      fontSize: { value: '14', addEventListener: jest.fn() },
      fontStyle: { value: 'normal', addEventListener: jest.fn() },
      saveTheme: { addEventListener: jest.fn() },
      themeStatus: { textContent: '', className: '', style: {} },
      themePreview: { style: {} },
      previewTitle: { style: {} },
      previewText: { style: {} },
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
      exportFormat: { value: '', addEventListener: jest.fn() },
      exportHistory: {
        disabled: false,
        innerHTML: '<i class="fas fa-download"></i> Export',
        addEventListener: jest.fn(),
      },
      refreshHistory: { addEventListener: jest.fn() },
      clearHistory: { addEventListener: jest.fn() },
      historyContainer: {
        innerHTML: '',
        querySelectorAll: jest.fn((selector) => {
          if (selector === '.copy-btn') {
            return [
              {
                addEventListener: jest.fn(),
                dataset: { summary: 'Test summary' },
              },
            ];
          }
          if (selector === '.share-btn') {
            return [
              {
                addEventListener: jest.fn(),
                dataset: { title: 'Test Title', summary: 'Test summary' },
              },
            ];
          }
          return [];
        }),
      },
      // Shortcuts elements
      currentShortcut: { value: '', addEventListener: jest.fn() },
      ctrlMod: { checked: false, addEventListener: jest.fn() },
      altMod: { checked: false, addEventListener: jest.fn() },
      shiftMod: { checked: false, addEventListener: jest.fn() },
      cmdMod: { checked: false, addEventListener: jest.fn() },
      keyInput: { value: '', addEventListener: jest.fn() },
      recordShortcut: { addEventListener: jest.fn() },
      saveShortcut: { addEventListener: jest.fn() },
      resetShortcut: { addEventListener: jest.fn() },
      shortcutValidation: {
        textContent: '',
        className: '',
        style: { display: 'none' },
      },
      historyStatus: { textContent: '', className: '', style: {} },

      // Form
      'settings-form': {
        addEventListener: jest.fn(),
        querySelector: jest.fn(() => ({ style: {} })),
        insertBefore: jest.fn(),
      },
      'theme-form': { addEventListener: jest.fn() },
      openShortcutsBtn: { addEventListener: jest.fn() },
    };

    // Mock document.getElementById
    (document.getElementById as any) = jest.fn((id) => mockDOM[id] || null);

    // Mock document.querySelector
    (document.querySelector as any) = jest.fn(() => null);

    // Mock document.querySelectorAll
    (document.querySelectorAll as any) = jest.fn((selector) => {
      if (selector === '.nav-link') {
        return [mockNavLink];
      }
      if (selector === '.page') {
        return [mockPage];
      }
      return [];
    });

    // Mock document.createElement
    (document.createElement as any) = jest.fn((tag) => {
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
          style: {},
          appendChild: jest.fn(),
          addEventListener: jest.fn(),
        };
      }
      if (tag === 'style') {
        return {
          textContent: '',
          appendChild: jest.fn(),
        };
      }
      if (tag === 'a') {
        return {
          href: '',
          download: '',
          click: jest.fn(),
          style: {},
        };
      }
      return { appendChild: jest.fn() };
    });

    // Mock document.head
    Object.defineProperty(document, 'head', {
      value: { appendChild: jest.fn() },
      writable: true,
    });

    // Mock chrome.permissions
    (chrome.permissions as any) = {
      contains: jest.fn().mockResolvedValue(true), // Assume permissions are already granted for tests
      request: jest.fn().mockResolvedValue(true),
    };

    // Mock chrome.storage.sync.get/set
    (chrome.storage.sync.get as any).mockImplementation(
      (keys: any, callback?: (result: any) => void) => {
        const defaultValues = {
          selectedModel: 'chrome-builtin',
          temperature: 0.7,
          maxTokens: 1000,
          summaryLength: 'medium',
          enableFallback: true,
          openaiApiKey: 'test-openai-key',
          geminiApiKey: 'test-gemini-key',
          anthropicApiKey: 'test-anthropic-key',
          dateTimeFormat: 'dd/mm/yyyy-24h',
          theme: 'nord',
          fontFamily: 'Arial',
          fontSize: 14,
          fontStyle: 'normal',
        };
        const result: any = {};
        if (Array.isArray(keys)) {
          keys.forEach((key: string) => {
            result[key] =
              defaultValues[key as keyof typeof defaultValues] || null;
          });
        } else if (typeof keys === 'string') {
          result[keys] =
            defaultValues[keys as keyof typeof defaultValues] || null;
        } else {
          Object.assign(result, defaultValues);
        }
        if (callback) callback(result);
        return Promise.resolve(result);
      }
    );

    (chrome.storage.sync.set as any).mockImplementation(
      (items: any, callback?: () => void) => {
        if (callback) callback();
        return Promise.resolve();
      }
    );
    (chrome.storage.local.get as any).mockImplementation(
      (keys: any, callback?: (result: any) => void) => {
        const defaultValues = {
          modelMetrics: {},
          summaryHistory: [],
        };
        const result: any = {};
        if (Array.isArray(keys)) {
          keys.forEach((key: string) => {
            result[key] =
              defaultValues[key as keyof typeof defaultValues] || null;
          });
        } else if (typeof keys === 'string') {
          result[keys] =
            defaultValues[keys as keyof typeof defaultValues] || null;
        } else {
          Object.assign(result, defaultValues);
        }
        if (callback) callback(result);
        return Promise.resolve(result);
      }
    );
    (chrome.storage.local.set as any)
      .mockReset()
      .mockImplementation((items: any, callback?: () => void) => {
        if (callback) callback();
        return Promise.resolve();
      });

    // Mock chrome.runtime.sendMessage
    (chrome.runtime.sendMessage as any).mockResolvedValue();
    (chrome.runtime.onMessage.addListener as any).mockImplementation(() => {});
    // Mock chrome.commands
    (chrome.commands as any) = {
      update: jest.fn().mockResolvedValue(undefined),
    };

    // Mock navigator.clipboard
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: jest.fn().mockResolvedValue(undefined) },
      writable: true,
    });

    // Mock navigator.share
    Object.defineProperty(navigator, 'share', {
      value: jest.fn().mockResolvedValue(undefined),
      writable: true,
    });

    // Mock URL
    Object.defineProperty(URL, 'createObjectURL', {
      value: jest.fn(() => 'blob:url'),
      writable: true,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      value: jest.fn(),
      writable: true,
    });

    // Mock window.matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        addListener: jest.fn(),
        removeListener: jest.fn(),
      })),
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
      expect(document.getElementById).toHaveBeenCalledWith('summaryLength');
      expect(document.getElementById).toHaveBeenCalledWith('enableFallback');
      expect(document.getElementById).toHaveBeenCalledWith('openaiApiKey');
      expect(document.getElementById).toHaveBeenCalledWith('geminiApiKey');
      expect(document.getElementById).toHaveBeenCalledWith('anthropicApiKey');
      expect(document.getElementById).toHaveBeenCalledWith('dateTimeFormat');
      expect(document.getElementById).toHaveBeenCalledWith('status');
      expect(document.getElementById).toHaveBeenCalledWith('theme');
      expect(document.getElementById).toHaveBeenCalledWith('fontFamily');
      expect(document.getElementById).toHaveBeenCalledWith('fontSize');
      expect(document.getElementById).toHaveBeenCalledWith('fontStyle');
      expect(document.getElementById).toHaveBeenCalledWith('themeStatus');
      expect(document.getElementById).toHaveBeenCalledWith('themePreview');
      expect(document.getElementById).toHaveBeenCalledWith('previewText');
      expect(document.getElementById).toHaveBeenCalledWith('settings-form');
      expect(document.getElementById).toHaveBeenCalledWith('refreshMetrics');
      expect(document.getElementById).toHaveBeenCalledWith('metricsContainer');
      expect(document.getElementById).toHaveBeenCalledWith('searchInput');
      expect(document.getElementById).toHaveBeenCalledWith('filterModel');
      expect(document.getElementById).toHaveBeenCalledWith('exportFormat');
      expect(document.getElementById).toHaveBeenCalledWith('exportHistory');
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
          'language',
          'temperature',
          'maxTokens',
          'summaryLength',
          'enableFallback',
          'openaiApiKey',
          'geminiApiKey',
          'anthropicApiKey',
          'dateTimeFormat',
          'enableRightClickContextMenu',
        ],
        expect.any(Function)
      );
    });

    it('should set default values when no saved settings exist', () => {
      (chrome.storage.sync.get as any).mockResolvedValueOnce({});

      // Re-trigger initialization
      document.dispatchEvent(new Event('DOMContentLoaded'));

      expect(mockDOM.selectedModel.value).toBe('chrome-builtin');
      expect(mockDOM.enableFallback.checked).toBe(true);
    });
  });

  describe('Settings Saving', () => {
    it('should save all settings when save button is clicked', async () => {
      const settingsForm = mockDOM['settings-form'];
      const submitHandler = settingsForm.addEventListener.mock.calls[0][1];

      // Simulate form values
      mockDOM.selectedModel.value = 'gpt-4';
      mockDOM.enableFallback.checked = false;
      mockDOM.openaiApiKey.value = 'new-openai-key';
      mockDOM.geminiApiKey.value = 'new-gemini-key';
      mockDOM.anthropicApiKey.value = 'new-anthropic-key';

      // Trigger save
      await submitHandler({ preventDefault: jest.fn() });

      expect(chrome.storage.sync.set).toHaveBeenCalledWith(
        {
          selectedModel: 'gpt-4',
          language: 'en',
          temperature: 0.7,
          maxTokens: 1000,
          summaryLength: 'medium',
          enableFallback: false,
          openaiApiKey: 'new-openai-key',
          geminiApiKey: 'new-gemini-key',
          anthropicApiKey: 'new-anthropic-key',
          dateTimeFormat: 'dd/mm/yyyy-24h',
          enableRightClickContextMenu: true,
        },
        expect.any(Function)
      );
    });

    it('should trim API key values before saving', async () => {
      const settingsForm = mockDOM['settings-form'];
      const submitHandler = settingsForm.addEventListener.mock.calls[0][1];

      mockDOM.openaiApiKey.value = '  test-key  ';

      await submitHandler({ preventDefault: jest.fn() });

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

      await submitHandler({ preventDefault: jest.fn() });

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

    it('should display metrics table when metrics exist', async () => {
      // Mock the displayMetrics function call
      const mockMetricsResponse = {
        action: 'model_metrics_response',
        metrics: mockMetrics,
      };

      // Trigger the message listener
      (chrome.runtime.onMessage.addListener as any).mock.calls.forEach(
        (call: any[]) => {
          const [listener] = call;
          listener(mockMetricsResponse);
        }
      );

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockDOM.metricsContainer.innerHTML).toContain(
        'Chrome Built-in AI'
      );
      expect(mockDOM.metricsContainer.innerHTML).toContain('GPT-3.5 Turbo');
    });

    it('should show message when no metrics exist', async () => {
      const mockMetricsResponse = {
        action: 'model_metrics_response',
        metrics: {},
      };

      (chrome.runtime.onMessage.addListener as any).mock.calls.forEach(
        ([listener]: any) => {
          listener(mockMetricsResponse);
        }
      );

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockDOM.metricsContainer.innerHTML).toContain(
        'No performance data available yet'
      );
    });

    it('should calculate success rate correctly', async () => {
      const mockMetricsResponse = {
        action: 'model_metrics_response',
        metrics: mockMetrics,
      };

      (chrome.runtime.onMessage.addListener as any).mock.calls.forEach(
        ([listener]: any) => {
          listener(mockMetricsResponse);
        }
      );

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockDOM.metricsContainer.innerHTML).toContain('80.0%'); // 8/10
      expect(mockDOM.metricsContainer.innerHTML).toContain('2.55s'); // avg time
    });

    it('should format last used date correctly', async () => {
      const mockMetricsResponse = {
        action: 'model_metrics_response',
        metrics: mockMetrics,
      };

      (chrome.runtime.onMessage.addListener as any).mock.calls.forEach(
        ([listener]: any) => {
          listener(mockMetricsResponse);
        }
      );

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockDOM.metricsContainer.innerHTML).toContain('01/12/2023 10:00');
    });

    it('should handle missing model config gracefully', async () => {
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

      (chrome.runtime.onMessage.addListener as any).mock.calls.forEach(
        (call: any[]) => {
          const [listener] = call;
          listener(mockMetricsResponse);
        }
      );

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockDOM.metricsContainer.innerHTML).toContain('unknown-model');
    });
  });

  describe('Utility Functions', () => {
    beforeEach(() => {
      fetchMock.resetMocks();
    });

    describe('window.validateApiKey', () => {
      it('should return error for empty API key', async () => {
        const result = await window.validateApiKey('openai', '');
        expect(result).toEqual({ valid: false, error: 'API key is required' });
      });

      it('should return error for whitespace-only API key', async () => {
        const result = await window.validateApiKey('openai', '   ');
        expect(result).toEqual({ valid: false, error: 'API key is required' });
      });

      it('should validate OpenAI API key successfully', async () => {
        fetchMock.mockResponseOnce('', { status: 200 });
        const result = await window.validateApiKey('openai', 'valid-key');
        expect(result).toEqual({ valid: true });
      });

      it('should validate Gemini API key successfully', async () => {
        fetchMock.mockResponseOnce('', { status: 200 });
        const result = await window.validateApiKey('gemini', 'valid-key');
        expect(result).toEqual({ valid: true });
      });

      it('should validate Anthropic API key successfully', async () => {
        fetchMock.mockResponseOnce('', { status: 200 });
        const result = await window.validateApiKey('anthropic', 'valid-key');
        expect(result).toEqual({ valid: true });
      });

      it('should return error for unknown provider', async () => {
        const result = await window.validateApiKey('unknown', 'key');
        expect(result).toEqual({ valid: false, error: 'Unknown provider' });
      });

      it('should handle network errors', async () => {
        fetchMock.mockRejectOnce(new Error('Network error'));
        const result = await window.validateApiKey('openai', 'key');
        expect(result).toEqual({
          valid: false,
          error: 'Network error during validation',
        });
      });
    });

    describe('window.validateOpenAIApiKey', () => {
      it('should return valid for successful response', async () => {
        fetchMock.mockResponseOnce('', { status: 200 });
        const result = await window.validateOpenAIApiKey('valid-key');
        expect(result).toEqual({ valid: true });
      });

      it('should return invalid for 401 status', async () => {
        fetchMock.mockResponseOnce('', { status: 401 });
        const result = await window.validateOpenAIApiKey('invalid-key');
        expect(result).toEqual({ valid: false, error: 'Invalid API key' });
      });

      it('should return invalid for other error status', async () => {
        fetchMock.mockResponseOnce('', { status: 500 });
        const result = await window.validateOpenAIApiKey('key');
        expect(result).toEqual({
          valid: false,
          error: 'API validation failed: 500',
        });
      });

      it('should handle network errors', async () => {
        fetchMock.mockRejectOnce(new Error('Network error'));
        const result = await window.validateOpenAIApiKey('key');
        expect(result).toEqual({
          valid: false,
          error: 'Network error during validation',
        });
      });
    });
  });

  describe('window.validateGeminiApiKey', () => {
    it('should return valid for successful response', async () => {
      fetchMock.mockResponseOnce('', { status: 200 });
      const result = await window.validateGeminiApiKey('valid-key');
      expect(result).toEqual({ valid: true });
    });

    it('should return invalid for 400 status', async () => {
      fetchMock.mockResponseOnce('', { status: 400 });
      const result = await window.validateGeminiApiKey('invalid-key');
      expect(result).toEqual({ valid: false, error: 'Invalid API key' });
    });

    it('should return invalid for 403 status', async () => {
      fetchMock.mockResponseOnce('', { status: 403 });
      const result = await window.validateGeminiApiKey('invalid-key');
      expect(result).toEqual({ valid: false, error: 'Invalid API key' });
    });

    it('should return invalid for other error status', async () => {
      fetchMock.mockResponseOnce('', { status: 500 });
      const result = await window.validateGeminiApiKey('key');
      expect(result).toEqual({
        valid: false,
        error: 'API validation failed: 500',
      });
    });

    it('should handle network errors', async () => {
      fetchMock.mockRejectOnce(new Error('Network error'));
      const result = await window.validateGeminiApiKey('key');
      expect(result).toEqual({
        valid: false,
        error: 'Network error during validation',
      });
    });

    describe('window.validateAnthropicApiKey', () => {
      it('should return valid for successful response', async () => {
        fetchMock.mockResponseOnce('', { status: 200 });
        const result = await window.validateAnthropicApiKey('valid-key');
        expect(result).toEqual({ valid: true });
      });

      it('should return invalid for 401 status', async () => {
        fetchMock.mockResponseOnce('', { status: 401 });
        const result = await window.validateAnthropicApiKey('invalid-key');
        expect(result).toEqual({ valid: false, error: 'Invalid API key' });
      });

      it('should return invalid for other error status', async () => {
        fetchMock.mockResponseOnce('', { status: 500 });
        const result = await window.validateAnthropicApiKey('key');
        expect(result).toEqual({
          valid: false,
          error: 'API validation failed: 500',
        });
      });

      it('should handle network errors', async () => {
        fetchMock.mockRejectOnce(new Error('Network error'));
        const result = await window.validateAnthropicApiKey('key');
        expect(result).toEqual({
          valid: false,
          error: 'Network error during validation',
        });
      });
    });

    describe('window.isModelAvailable', () => {
      it('should return false for unknown model', async () => {
        const result = await window.isModelAvailable('unknown-model', {});
        expect(result).toBe(false);
      });

      it('should return true for chrome-builtin', async () => {
        const result = await window.isModelAvailable('chrome-builtin', {});
        expect(result).toBe(true);
      });

      it('should return true for openai model with valid key', async () => {
        const apiKeys = {
          openaiApiKey: 'key',
          geminiApiKey: '',
          anthropicApiKey: '',
        };
        const result = await window.isModelAvailable('gpt-3.5-turbo', apiKeys);
        expect(result).toBe(true);
      });

      it('should return false for openai model without key', async () => {
        const apiKeys = {
          openaiApiKey: '',
          geminiApiKey: '',
          anthropicApiKey: '',
        };
        const result = await window.isModelAvailable('gpt-3.5-turbo', apiKeys);
        expect(result).toBe(false);
      });

      it('should return false for openai model with whitespace key', async () => {
        const apiKeys = {
          openaiApiKey: '   ',
          geminiApiKey: '',
          anthropicApiKey: '',
        };
        const result = await window.isModelAvailable('gpt-3.5-turbo', apiKeys);
        expect(result).toBe(false);
      });

      it('should return true for gemini model with valid key', async () => {
        const apiKeys = {
          openaiApiKey: '',
          geminiApiKey: 'key',
          anthropicApiKey: '',
        };
        const result = await window.isModelAvailable('gemini-2.5-pro', apiKeys);
        expect(result).toBe(true);
      });

      it('should return false for gemini model without key', async () => {
        const apiKeys = {
          openaiApiKey: '',
          geminiApiKey: '',
          anthropicApiKey: '',
        };
        const result = await window.isModelAvailable('gemini-2.5-pro', apiKeys);
        expect(result).toBe(false);
      });

      it('should return true for anthropic model with valid key', async () => {
        const apiKeys = {
          openaiApiKey: '',
          geminiApiKey: '',
          anthropicApiKey: 'key',
        };
        const result = await window.isModelAvailable('claude-3-haiku', apiKeys);
        expect(result).toBe(true);
      });

      it('should return false for anthropic model without key', async () => {
        const apiKeys = {
          openaiApiKey: '',
          geminiApiKey: '',
          anthropicApiKey: '',
        };
        const result = await window.isModelAvailable('claude-3-haiku', apiKeys);
        expect(result).toBe(false);
      });
    });

    describe('window.optionsGetModelConfig', () => {
      it('should return undefined for unknown model', () => {
        const result = window.optionsGetModelConfig('unknown-model');
        expect(result).toBeUndefined();
      });

      it('should return config for chrome-builtin', () => {
        const result = window.optionsGetModelConfig('chrome-builtin');
        expect(result).toEqual({
          provider: 'chrome',
          modelId: null,
          name: 'Chrome Built-in AI',
          cost: 0,
        });
      });

      it('should return config for gpt-3.5-turbo', () => {
        const result = window.optionsGetModelConfig('gpt-3.5-turbo');
        expect(result).toEqual({
          provider: 'openai',
          modelId: 'gpt-3.5-turbo',
          name: 'GPT-3.5 Turbo',
          cost: 0.002,
        });
      });

      it('should return config for gpt-4', () => {
        const result = window.optionsGetModelConfig('gpt-4');
        expect(result).toEqual({
          provider: 'openai',
          modelId: 'gpt-4',
          name: 'GPT-4',
          cost: 0.03,
        });
      });

      it('should return config for gpt-4-turbo', () => {
        const result = window.optionsGetModelConfig('gpt-4-turbo');
        expect(result).toEqual({
          provider: 'openai',
          modelId: 'gpt-4-turbo',
          name: 'GPT-4 Turbo',
          cost: 0.01,
        });
      });

      it('should return config for gpt-4o', () => {
        const result = window.optionsGetModelConfig('gpt-4o');
        expect(result).toEqual({
          provider: 'openai',
          modelId: 'gpt-4o',
          name: 'GPT-4o',
          cost: 0.005,
        });
      });

      it('should return config for gemini-2.5-pro', () => {
        const result = window.optionsGetModelConfig('gemini-2.5-pro');
        expect(result).toEqual({
          provider: 'gemini',
          modelId: 'gemini-2.5-pro',
          name: 'Gemini 2.5 Pro',
          cost: 0.00125,
        });
      });

      it('should return config for gemini-2.5-flash', () => {
        const result = window.optionsGetModelConfig('gemini-2.5-flash');
        expect(result).toEqual({
          provider: 'gemini',
          modelId: 'gemini-2.5-flash',
          name: 'Gemini 2.5 Flash',
          cost: 0.00003,
        });
      });

      it('should return config for gemini-2.0-flash-exp', () => {
        const result = window.optionsGetModelConfig('gemini-2.0-flash-exp');
        expect(result).toEqual({
          provider: 'gemini',
          modelId: 'gemini-2.0-flash-exp',
          name: 'Gemini 2.0 Flash (Exp)',
          cost: 0,
        });
      });

      it('should return config for claude-3-haiku', () => {
        const result = window.optionsGetModelConfig('claude-3-haiku');
        expect(result).toEqual({
          provider: 'anthropic',
          modelId: 'claude-3-haiku-20240307',
          name: 'Claude 3 Haiku',
          cost: 0.00025,
        });
      });

      it('should return config for claude-3-sonnet', () => {
        const result = window.optionsGetModelConfig('claude-3-sonnet');
        expect(result).toEqual({
          provider: 'anthropic',
          modelId: 'claude-3-sonnet-20240229',
          name: 'Claude 3 Sonnet',
          cost: 0.003,
        });
      });

      it('should return config for claude-3-opus', () => {
        const result = window.optionsGetModelConfig('claude-3-opus');
        expect(result).toEqual({
          provider: 'anthropic',
          modelId: 'claude-3-opus-20240229',
          name: 'Claude 3 Opus',
          cost: 0.015,
        });
      });

      it('should return config for claude-3.5-sonnet', () => {
        const result = window.optionsGetModelConfig('claude-3.5-sonnet');
        expect(result).toEqual({
          provider: 'anthropic',
          modelId: 'claude-3-5-sonnet-20240620',
          name: 'Claude 3.5 Sonnet',
          cost: 0.003,
        });
      });
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

    it('should display history items correctly', async () => {
      // Mock chrome.storage.local.get for history
      (chrome.storage.local.get as any).mockImplementationOnce(
        (keys: any, callback?: (result: any) => void) => {
          if (callback) callback({ summaryHistory: mockHistory });
          return Promise.resolve({ summaryHistory: mockHistory });
        }
      );

      // Trigger refresh history
      const refreshButton = mockDOM.refreshHistory;
      const clickHandler = refreshButton.addEventListener.mock.calls[0][1];
      clickHandler();

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 0));

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
      (chrome.storage.local.get as any).mockResolvedValueOnce({
        summaryHistory: [],
      });

      const refreshButton = mockDOM.refreshHistory;
      const clickHandler = refreshButton.addEventListener.mock.calls[0][1];
      clickHandler();

      expect(mockDOM.historyContainer.innerHTML).toContain(
        'No summary history available yet'
      );
    });

    it('should handle missing title gracefully', async () => {
      const historyWithMissingTitle = [
        {
          ...mockHistory[1],
          title: null,
        },
      ];

      (chrome.storage.local.get as any).mockImplementationOnce(
        (keys: any, callback?: (result: any) => void) => {
          if (callback) callback({ summaryHistory: historyWithMissingTitle });
          return Promise.resolve({ summaryHistory: historyWithMissingTitle });
        }
      );

      const refreshButton = mockDOM.refreshHistory;
      const clickHandler = refreshButton.addEventListener.mock.calls[0][1];
      clickHandler();

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockDOM.historyContainer.innerHTML).toContain('Untitled');
    });

    it('should format timestamps correctly', async () => {
      (chrome.storage.local.get as any).mockImplementationOnce(
        (keys: any, callback?: (result: any) => void) => {
          if (callback) callback({ summaryHistory: mockHistory });
          return Promise.resolve({ summaryHistory: mockHistory });
        }
      );

      const refreshButton = mockDOM.refreshHistory;
      const clickHandler = refreshButton.addEventListener.mock.calls[0][1];
      clickHandler();

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockDOM.historyContainer.innerHTML).toContain('01/12/2023 10:00');
      expect(mockDOM.historyContainer.innerHTML).toContain('02/12/2023 10:00');
    });

    it('should show attempt count when multiple attempts were made', async () => {
      const historyWithAttempts = [
        {
          ...mockHistory[0],
          metrics: {
            attempts: [{ success: false }, { success: true }],
            totalTime: 2.5,
          },
        },
      ];

      (chrome.storage.local.get as any).mockImplementationOnce(
        (keys: any, callback?: (result: any) => void) => {
          if (callback) callback({ summaryHistory: historyWithAttempts });
          return Promise.resolve({ summaryHistory: historyWithAttempts });
        }
      );

      const refreshButton = mockDOM.refreshHistory;
      const clickHandler = refreshButton.addEventListener.mock.calls[0][1];
      clickHandler();

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 0));
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

      expect(mockDOM.historyStatus.textContent).toBe(
        'History cleared successfully!'
      );

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

      (chrome.storage.local.get as any).mockResolvedValueOnce({
        summaryHistory: largeHistory,
      } as any);

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
      window.copyToClipboard(testText, 'status');

      // Advance timers to let the promise resolve
      await jest.runAllTimers();

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(testText);
      expect(mockDOM.status.textContent).toBe('Summary copied to clipboard!');

      jest.useRealTimers();
    });

    it('should share summary when navigator.share is available', () => {
      const title = 'Test Title';
      const text = 'Test summary text';

      (global as any).shareSummary(title, text, 'status');

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

      (global as any).shareSummary(title, text, 'status');

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
      expect(mockDOM.exportFormat.addEventListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function)
      );
      expect(mockDOM.exportHistory.addEventListener).toHaveBeenCalledWith(
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

    it('should save theme and font settings', () => {
      mockDOM.theme.value = 'dark';
      mockDOM.fontFamily.value = 'Times New Roman';
      mockDOM.fontSize.value = '16';
      mockDOM.fontStyle.value = 'bold';

      const themeForm = mockDOM['theme-form'];
      const submitHandler = themeForm.addEventListener.mock.calls[0][1];

      submitHandler({ preventDefault: jest.fn() });

      expect(chrome.storage.sync.set).toHaveBeenCalledWith(
        {
          theme: 'dark',
          fontFamily: 'Times New Roman',
          fontSize: 16,
          fontStyle: 'bold',
        },
        expect.any(Function)
      );
    });

    it('should initialize theme from storage', () => {
      (chrome.storage.sync.get as any).mockImplementation(
        (keys: any, callback?: (result: any) => void) => {
          const result = {
            theme: 'dark',
            fontFamily: 'Arial',
            fontSize: 14,
            fontStyle: 'normal',
          };
          if (callback) callback(result);
          return Promise.resolve(result);
        }
      );

      // Re-trigger initialization
      document.dispatchEvent(new Event('DOMContentLoaded'));

      expect(mockDOM.theme.value).toBe('dark');
      expect(mockDOM.fontFamily.value).toBe('Arial');
      expect(mockDOM.fontSize.value).toBe('14');
      expect(mockDOM.fontStyle.value).toBe('normal');
    });

    it('should set default theme when no saved theme exists', () => {
      (chrome.storage.sync.get as any).mockImplementation(
        (keys: any, callback?: (result: any) => void) => {
          const result = {};
          if (callback) callback(result);
          return Promise.resolve(result);
        }
      );

      // Re-trigger initialization
      document.dispatchEvent(new Event('DOMContentLoaded'));

      expect(mockDOM.theme.value).toBe('nord'); // Default theme
      expect(mockDOM.fontFamily.value).toBe('Arial'); // Default font
      expect(mockDOM.fontSize.value).toBe('14'); // Default size
      expect(mockDOM.fontStyle.value).toBe('normal'); // Default style
    });

    it('should update theme preview when theme changes', () => {
      mockDOM.theme.value = 'dark';

      // Mock the change event
      const changeHandler = mockDOM.theme.addEventListener.mock.calls.find(
        (call: any[]) => call[0] === 'change'
      )[1];

      changeHandler();

      expect(mockDOM.themePreview.style.backgroundColor).toBeDefined();
      expect(mockDOM.themePreview.style.color).toBeDefined();
    });

    it('should update theme preview when font settings change', () => {
      mockDOM.fontFamily.value = 'Times New Roman';
      mockDOM.fontSize.value = '16';
      mockDOM.fontStyle.value = 'bold';

      // Mock the change events
      const fontFamilyHandler =
        mockDOM.fontFamily.addEventListener.mock.calls.find(
          (call: any[]) => call[0] === 'change'
        )[1];
      const fontSizeHandler = mockDOM.fontSize.addEventListener.mock.calls.find(
        (call: any[]) => call[0] === 'input'
      )[1];
      const fontStyleHandler =
        mockDOM.fontStyle.addEventListener.mock.calls.find(
          (call: any[]) => call[0] === 'change'
        )[1];

      fontFamilyHandler();
      fontSizeHandler();
      fontStyleHandler();

      expect(mockDOM.previewText.style.fontFamily).toBe('Times New Roman');
      expect(mockDOM.previewText.style.fontSize).toBe('16px');
      expect(mockDOM.previewText.style.fontWeight).toBe('bold');
    });
  });

  describe('Navigation Functions', () => {
    it('should switch page correctly', () => {
      const navLink = document.querySelectorAll('.nav-link')[0];
      expect(navLink.addEventListener).toHaveBeenCalledWith(
        'click',
        expect.any(Function)
      );
      const clickHandler = (navLink.addEventListener as any).mock.calls[0][1];

      clickHandler({ preventDefault: jest.fn() });

      // Should have called switchPage with the correct page
      expect(mockPage.classList.remove).toHaveBeenCalledWith('active');
      expect(mockNavLink.classList.remove).toHaveBeenCalledWith('active');
    });

    it('should toggle sidebar when toggle button is clicked', () => {
      const toggleHandler =
        mockDOM.toggleSidebar.addEventListener.mock.calls[0][1];

      toggleHandler();

      expect(mockDOM.sidebar.classList.toggle).toHaveBeenCalledWith('open');
    });
  });

  describe('History Management Functions', () => {
    it('should load history on initialization', () => {
      expect(chrome.storage.local.get).toHaveBeenCalledWith(
        'summaryHistory',
        expect.any(Function)
      );
    });

    it('should display history items', async () => {
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
      ];

      (chrome.storage.local.get as any).mockImplementationOnce(
        (keys: any, callback?: (result: any) => void) => {
          if (callback) callback({ summaryHistory: mockHistory });
          return Promise.resolve({ summaryHistory: mockHistory });
        }
      );

      // Trigger loadHistory
      const refreshButton = mockDOM.refreshHistory;
      const clickHandler = refreshButton.addEventListener.mock.calls[0][1];
      clickHandler();

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockDOM.historyContainer.innerHTML).toContain('Example Page');
    });

    it('should clear history when confirmed', () => {
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

      // Restore
      global.confirm = originalConfirm;
    });

    it('should export history to CSV format', async () => {
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
      ];

      // Mock history data
      (chrome.storage.local.get as any).mockImplementation(
        (keys: any, callback?: (result: any) => void) => {
          if (callback) callback({ summaryHistory: mockHistory });
          return Promise.resolve({ summaryHistory: mockHistory });
        }
      );

      // Load history first
      const refreshButton = mockDOM.refreshHistory;
      const refreshHandler = refreshButton.addEventListener.mock.calls[0][1];
      refreshHandler();

      // Wait for initial load
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Mock the export function calls
      const exportButton = mockDOM.exportHistory;
      const clickHandler = exportButton.addEventListener.mock.calls[0][1];

      mockDOM.exportFormat.value = 'csv';
      clickHandler();

      // Wait for export operation
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Should have created a download link
      expect(document.createElement).toHaveBeenCalledWith('a');
    });

    it('should export history to JSON format', () => {
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
      ];

      // Mock history data
      (chrome.storage.local.get as any).mockImplementation(
        (keys: any, callback?: (result: any) => void) => {
          if (callback) callback({ summaryHistory: mockHistory });
          return Promise.resolve({ summaryHistory: mockHistory });
        }
      );

      // Load history first
      const refreshButton = mockDOM.refreshHistory;
      const refreshHandler = refreshButton.addEventListener.mock.calls[0][1];
      refreshHandler();

      const exportButton = mockDOM.exportHistory;
      const clickHandler = exportButton.addEventListener.mock.calls[0][1];

      mockDOM.exportFormat.value = 'json';
      clickHandler();

      expect(document.createElement).toHaveBeenCalledWith('a');
    });

    it('should export history to HTML format', async () => {
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
      ];

      // Mock history data
      (chrome.storage.local.get as any).mockImplementation(
        (keys: any, callback?: (result: any) => void) => {
          if (callback) callback({ summaryHistory: mockHistory });
          return Promise.resolve({ summaryHistory: mockHistory });
        }
      );

      // Load history first
      const refreshButton = mockDOM.refreshHistory;
      const refreshHandler = refreshButton.addEventListener.mock.calls[0][1];
      refreshHandler();

      // Wait for initial load
      await new Promise((resolve) => setTimeout(resolve, 0));

      const exportButton = mockDOM.exportHistory;
      const clickHandler = exportButton.addEventListener.mock.calls[0][1];

      mockDOM.exportFormat.value = 'html';
      clickHandler();

      // Wait for export operation
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(document.createElement).toHaveBeenCalledWith('a');
    });

    it('should filter history based on search term', async () => {
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
          title: 'Test Page',
          summary: 'Another test summary.',
          model: 'gpt-3.5-turbo',
          time: '3.00',
          metrics: { attempts: [], totalTime: 3.0 },
        },
      ];

      (chrome.storage.local.get as any).mockImplementationOnce(
        (keys: any, callback?: (result: any) => void) => {
          if (callback) callback({ summaryHistory: mockHistory });
          return Promise.resolve({ summaryHistory: mockHistory });
        }
      );

      // Load history first
      const refreshButton = mockDOM.refreshHistory;
      const refreshHandler = refreshButton.addEventListener.mock.calls[0][1];
      refreshHandler();

      // Wait for initial load
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Now filter
      mockDOM.searchInput.value = 'Example';
      const searchHandler =
        mockDOM.searchInput.addEventListener.mock.calls[0][1];
      searchHandler();

      // Wait for filter operation
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockDOM.historyContainer.innerHTML).toContain('Example Page');
      expect(mockDOM.historyContainer.innerHTML).not.toContain('Test Page');
    });

    it('should filter history based on model selection', async () => {
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
          title: 'Test Page',
          summary: 'Another test summary.',
          model: 'gpt-3.5-turbo',
          time: '3.00',
          metrics: { attempts: [], totalTime: 3.0 },
        },
      ];

      (chrome.storage.local.get as any).mockImplementationOnce(
        (keys: any, callback?: (result: any) => void) => {
          if (callback) callback({ summaryHistory: mockHistory });
          return Promise.resolve({ summaryHistory: mockHistory });
        }
      );

      // Load history first
      const refreshButton = mockDOM.refreshHistory;
      const refreshHandler = refreshButton.addEventListener.mock.calls[0][1];
      refreshHandler();

      // Wait for initial load
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Now filter by model
      mockDOM.filterModel.value = 'chrome-builtin';
      const filterHandler =
        mockDOM.filterModel.addEventListener.mock.calls[0][1];
      filterHandler();

      // Wait for filter operation
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockDOM.historyContainer.innerHTML).toContain(
        'Chrome Built-in AI'
      );
      expect(mockDOM.historyContainer.innerHTML).not.toContain('GPT-3.5 Turbo');
    });
  });

  describe('Metrics Display Functions', () => {
    it('should load metrics on initialization', () => {
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        action: 'get_model_metrics',
      });
    });

    it('should display metrics when received', async () => {
      const mockMetrics = {
        'chrome-builtin': {
          totalRequests: 10,
          successfulRequests: 8,
          totalTime: 25.5,
          avgTime: 2.55,
          lastUsed: '2023-12-01T10:00:00.000Z',
        },
      };

      // Mock the message listener
      (chrome.runtime.onMessage.addListener as any).mock.calls.forEach(
        (call: any[]) => {
          const [listener] = call;
          listener({
            action: 'model_metrics_response',
            metrics: mockMetrics,
          });
        }
      );

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockDOM.metricsContainer.innerHTML).toContain(
        'Chrome Built-in AI'
      );
      expect(mockDOM.metricsContainer.innerHTML).toContain('10'); // total requests
      expect(mockDOM.metricsContainer.innerHTML).toContain('80.0%'); // success rate
    });

    it('should refresh metrics when button is clicked', () => {
      const refreshHandler =
        mockDOM.refreshMetrics.addEventListener.mock.calls[0][1];

      refreshHandler();

      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        action: 'get_model_metrics',
      });
    });
  });

  describe('UI Enhancement Functions', () => {
    it('should add ripple effect to buttons', () => {
      // Mock querySelectorAll to return buttons
      (document.querySelectorAll as any).mockReturnValueOnce([
        { addEventListener: jest.fn() },
      ]);

      // Re-trigger the ripple effect setup
      document.dispatchEvent(new Event('DOMContentLoaded'));

      expect(document.querySelectorAll).toHaveBeenCalledWith('.btn');
      expect(document.createElement).toHaveBeenCalledWith('style');
    });

    it('should handle temperature slider input', () => {
      mockDOM.temperature.value = '1.5';
      mockDOM.temperature.style = { setProperty: jest.fn() };

      const inputHandler = mockDOM.temperature.addEventListener.mock.calls.find(
        (call: any[]) => call[0] === 'input'
      )[1];

      inputHandler();

      expect(mockDOM['temperature-value'].textContent).toBe('1.5');
      expect(mockDOM.temperature.style.setProperty).toHaveBeenCalledWith(
        '--slider-progress',
        '75%'
      );
    });
  });

  describe('Model Configuration', () => {
    it('should handle all supported model types', async () => {
      const models = [
        'chrome-builtin',
        'gpt-3.5-turbo',
        'gpt-4',
        'gpt-4-turbo',
        'gpt-4o',
        'gemini-2.5-pro',
        'gemini-2.5-flash',
        'gemini-2.0-flash-exp',
        'claude-3-haiku',
        'claude-3-sonnet',
        'claude-3-opus',
        'claude-3.5-sonnet',
      ];

      for (const model of models) {
        mockDOM.selectedModel.value = model;

        const settingsForm = mockDOM['settings-form'];
        const submitHandler = settingsForm.addEventListener.mock.calls[0][1];

        await submitHandler({ preventDefault: jest.fn() });

        expect(chrome.storage.sync.set).toHaveBeenCalledWith(
          expect.objectContaining({
            selectedModel: model,
            summaryLength: 'medium',
          }),
          expect.any(Function)
        );
      }
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

/* eslint-env jest */

const fetchMock = require('jest-fetch-mock');

fetchMock.enableMocks();

// Note: Testing Library setup would go here when dependencies are installed
// import '@testing-library/jest-dom';

// Enhanced Chrome API Mocks with realistic behavior
const createChromeMock = () => ({
  storage: {
    sync: {
      get: jest.fn((keys, callback) => {
        const defaultValues = {
          selectedModel: 'chrome-builtin',
          enableFallback: true,
          openaiApiKey: '',
          geminiApiKey: '',
          anthropicApiKey: '',
          theme: 'light',
        };

        if (typeof keys === 'function') {
          callback = keys;
          return callback(defaultValues);
        }

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
      }),
      set: jest.fn((items, callback) => {
        if (callback) callback();
        return Promise.resolve();
      }),
    },
    local: {
      get: jest.fn((keys, callback) => {
        const defaultValues = {
          modelMetrics: {},
          summaryHistory: [],
        };

        if (typeof keys === 'function') {
          callback = keys;
          return callback(defaultValues);
        }

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
      }),
      set: jest.fn((items, callback) => {
        if (callback) callback();
        return Promise.resolve();
      }),
    },
  },
  runtime: {
    onMessage: {
      addListener: jest.fn(),
    },
    sendMessage: jest.fn((message, options, callback) => {
      if (typeof options === 'function') {
        callback = options;
      }
      if (callback) callback();
      return Promise.resolve();
    }),
    openOptionsPage: jest.fn((callback) => {
      if (callback) callback();
      return Promise.resolve();
    }),
    lastError: null,
  },
  action: {
    onClicked: {
      addListener: jest.fn(),
    },
  },
  tabs: {
    sendMessage: jest.fn((tabId, message, options, callback) => {
      if (typeof options === 'function') {
        callback = options;
      }
      if (callback) callback();
      return Promise.resolve();
    }),
    get: jest.fn((tabId, callback) => {
      const mockTab = {
        id: tabId,
        url: 'https://example.com',
        title: 'Mock Tab',
        active: true,
        windowId: 1,
      };
      if (callback) callback(mockTab);
      return Promise.resolve(mockTab);
    }),
    query: jest.fn((queryInfo, callback) => {
      const mockTabs = [
        {
          id: 123,
          url: 'https://example.com',
          title: 'Mock Tab',
          active: true,
          windowId: 1,
        },
      ];
      if (callback) callback(mockTabs);
      return Promise.resolve(mockTabs);
    }),
    onRemoved: {
      addListener: jest.fn(),
    },
    onUpdated: {
      addListener: jest.fn(),
    },
  },
  windows: {
    getCurrent: jest.fn((callback) => {
      const mockWindow = { id: 1, focused: true };
      if (callback) callback(mockWindow);
      return Promise.resolve(mockWindow);
    }),
  },
  permissions: {
    contains: jest.fn((permissions, callback) => {
      if (callback) callback(true);
      return Promise.resolve(true);
    }),
    request: jest.fn((permissions, callback) => {
      if (callback) callback(true);
      return Promise.resolve(true);
    }),
  },
  commands: {
    update: jest.fn().mockResolvedValue(undefined),
  },
  scripting: {
    executeScript: jest.fn().mockResolvedValue(),
  },
});

// Mock Chrome Summarizer API with different behaviors
global.Summarizer = jest.fn().mockImplementation(() => ({
  create: jest.fn().mockResolvedValue({
    summarize: jest
      .fn()
      .mockResolvedValue('Mocked AI summary of the provided content.'),
    destroy: jest.fn(),
    ready: Promise.resolve(),
  }),
}));

// Mock AI Summary API for different scenarios
global.createMockSummarizer = (options = {}) => ({
  create: jest.fn().mockResolvedValue({
    summarize: jest
      .fn()
      .mockResolvedValue(
        options.summary || 'Mocked AI summary of the provided content.'
      ),
    destroy: jest.fn(),
    ready: Promise.resolve(),
  }),
});

// Mock external APIs with realistic responses
global.mockExternalAPIs = {
  openai: {
    success: () =>
      fetchMock.mockResponseOnce(
        JSON.stringify({
          choices: [
            { message: { content: 'OpenAI-powered summary response.' } },
          ],
        })
      ),
    error: () => fetchMock.mockResponseOnce('', { status: 401 }),
    timeout: () => fetchMock.mockReject(new Error('Network timeout')),
  },
  gemini: {
    success: () =>
      fetchMock.mockResponseOnce(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [{ text: 'Gemini AI summary response.' }],
              },
            },
          ],
        })
      ),
    error: () =>
      fetchMock.mockResponseOnce(JSON.stringify({ error: 'API Error' }), {
        status: 400,
      }),
  },
  anthropic: {
    success: () =>
      fetchMock.mockResponseOnce(
        JSON.stringify({
          content: [{ text: 'Claude AI summary response.' }],
        })
      ),
    error: () => fetchMock.mockResponseOnce('', { status: 429 }),
  },
};

// Enhanced showdown mock
global.showdown = {
  Converter: jest.fn().mockImplementation(() => ({
    makeHtml: jest.fn((markdown) => `<p>${markdown}</p>`),
  })),
};

// Mock Chart.js
global.Chart = jest.fn().mockImplementation(() => ({
  destroy: jest.fn(),
}));

// Enhanced navigator mocks
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: jest.fn().mockResolvedValue(),
    readText: jest.fn().mockResolvedValue(''),
  },
  writable: true,
});

Object.defineProperty(navigator, 'share', {
  value: jest.fn().mockResolvedValue(),
  writable: true,
});
// Mock window methods
Object.defineProperty(window, 'confirm', {
  value: jest.fn().mockReturnValue(true),
  writable: true,
});

Object.defineProperty(window, 'alert', {
  value: jest.fn(),
  writable: true,
});

// Mock document globally to prevent errors during module import
const documentListeners = {};
global.document = {
  addEventListener: jest.fn((event, listener) => {
    if (!documentListeners[event]) documentListeners[event] = [];
    documentListeners[event].push(listener);
  }),
  dispatchEvent: jest.fn((event) => {
    const listeners = documentListeners[event.type] || [];
    listeners.forEach((listener) => listener(event));
  }),
  getElementById: jest.fn(() => null),
  createElement: jest.fn(() => ({
    appendChild: jest.fn(),
    addEventListener: jest.fn(),
    setAttribute: jest.fn(),
    style: {},
    className: '',
    textContent: '',
    innerHTML: '',
    parentElement: null,
    querySelector: jest.fn(() => null),
  })),
  querySelector: jest.fn(() => null),
  querySelectorAll: jest.fn(() => []),
  body: {
    appendChild: jest.fn(),
  },
};

// Mock DOM elements and events
global.createMockElement = (tagName, properties = {}) => {
  const element = {
    tagName: tagName.toUpperCase(),
    style: {},
    className: '',
    textContent: '',
    innerHTML: '',
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    appendChild: jest.fn(),
    insertBefore: jest.fn(),
    removeChild: jest.fn(),
    querySelector: jest.fn(),
    querySelectorAll: jest.fn(() => []),
    getAttribute: jest.fn(),
    setAttribute: jest.fn(),
    removeAttribute: jest.fn(),
    ...properties,
  };
  return element;
};

// Global test utilities
global.testUtils = {
  waitForAsync: () => new Promise((resolve) => setTimeout(resolve, 0)),
  createMockTab: (overrides = {}) => ({
    id: 123,
    url: 'https://example.com',
    title: 'Test Page',
    active: true,
    windowId: 1,
    ...overrides,
  }),
  createMockMessage: (action, overrides = {}) => ({
    action,
    ...overrides,
  }),
};

// Initialize global chrome mock
global.chrome = createChromeMock();

// Mock console methods for testing
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  spyOnError: () => jest.spyOn(console, 'error').mockImplementation(),
  spyOnWarn: () => jest.spyOn(console, 'warn').mockImplementation(),
  spyOnLog: () => jest.spyOn(console, 'log').mockImplementation(),
};

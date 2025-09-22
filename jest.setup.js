/* eslint-env jest */

const fetchMock = require('jest-fetch-mock');

fetchMock.enableMocks();

// Mock Chrome APIs
global.chrome = {
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
  runtime: {
    onMessage: {
      addListener: jest.fn(),
    },
    sendMessage: jest.fn(),
    openOptionsPage: jest.fn(),
  },
  action: {
    onClicked: {
      addListener: jest.fn(),
    },
  },
  tabs: {
    sendMessage: jest.fn(),
    get: jest.fn(),
    onRemoved: {
      addListener: jest.fn(),
    },
  },
};

// Mock Chrome Summarizer API
global.Summarizer = jest.fn().mockImplementation(() => ({
  create: jest.fn().mockResolvedValue({
    summarize: jest.fn().mockResolvedValue('Mocked summary'),
    destroy: jest.fn(),
  }),
}));

// Mock showdown
global.showdown = {
  Converter: jest.fn().mockImplementation(() => ({
    makeHtml: jest.fn().mockReturnValue('<p>Mocked HTML</p>'),
  })),
};

// Mock navigator.clipboard
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: jest.fn().mockResolvedValue(),
  },
  writable: true,
});

// Mock navigator.share
Object.defineProperty(navigator, 'share', {
  value: jest.fn().mockResolvedValue(),
  writable: true,
});

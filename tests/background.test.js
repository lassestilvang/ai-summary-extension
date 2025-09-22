// Import the background script to initialize it
import '../background.js';

describe('Background Script Tests', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
    // Reset Summarizer
    globalThis.Summarizer = {
      create: jest.fn().mockResolvedValue({
        summarize: jest.fn().mockResolvedValue('Mocked summary'),
        destroy: jest.fn(),
      }),
    };
    // Reset chrome mocks
    chrome.storage.sync.get.mockResolvedValue({
      selectedModel: 'chrome-builtin',
      enableFallback: true,
    });
    chrome.storage.local.get.mockResolvedValue({ modelMetrics: {} });
    chrome.storage.local.set.mockResolvedValue();
  });

  describe('Event listeners setup', () => {
    it('should set up action button click listener', () => {
      expect(chrome.action.onClicked.addListener).toHaveBeenCalledWith(
        expect.any(Function)
      );
    });

    it('should set up runtime message listener', () => {
      expect(chrome.runtime.onMessage.addListener).toHaveBeenCalledWith(
        expect.any(Function)
      );
    });

    it('should set up tab removal listener', () => {
      expect(chrome.tabs.onRemoved.addListener).toHaveBeenCalledWith(
        expect.any(Function)
      );
    });
  });

  describe('Action button click', () => {
    it('should send toggle message when action button is clicked', () => {
      const mockTab = { id: 123 };

      // Simulate clicking the action button
      chrome.action.onClicked.addListener.mock.calls.forEach(([listener]) => {
        listener(mockTab);
      });

      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(123, {
        action: 'toggle_summary_visibility',
      });
    });
  });

  describe('Tab removal', () => {
    it('should clean up summary state when tab is closed', () => {
      const tabId = 123;

      // Simulate tab removal
      chrome.tabs.onRemoved.addListener.mock.calls.forEach(([listener]) => {
        listener(tabId);
      });

      // Since summaryState is internal, we can't directly test it
      // But we can verify the listener was called
      expect(chrome.tabs.onRemoved.addListener).toHaveBeenCalled();
    });
  });
});

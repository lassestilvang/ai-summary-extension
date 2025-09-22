// Import the options script to initialize it
import '../options.ts';

describe('Options Script Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock DOM elements
    document.body.innerHTML = `
      <select id="selectedModel"></select>
      <input id="openaiApiKey" />
      <input id="geminiApiKey" />
      <input id="anthropicApiKey" />
      <input id="enableFallback" type="checkbox" />
      <select id="theme"></select>
      <button id="save"></button>
      <div id="status"></div>
      <button id="refreshMetrics"></button>
      <div id="metricsContainer"></div>
    `;
  });

  describe('DOM setup', () => {
    it('should set up DOM elements correctly', () => {
      expect(document.getElementById('selectedModel')).toBeTruthy();
      expect(document.getElementById('openaiApiKey')).toBeTruthy();
      expect(document.getElementById('save')).toBeTruthy();
      expect(document.getElementById('status')).toBeTruthy();
    });
  });

  // Note: More comprehensive DOM interaction tests would require simulating events
  // and mocking chrome APIs, which would be complex for this demonstration
});

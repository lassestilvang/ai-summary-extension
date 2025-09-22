interface ThemeColors {
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  shadowColor: string;
  closeButtonColor: string;
  copyButtonColor: string;
  titleColor: string;
}

interface Theme {
  name: string;
  colors: ThemeColors;
}

interface ModelConfig {
  provider: 'chrome' | 'openai' | 'gemini' | 'anthropic';
  modelId: string | null;
  name: string;
  cost: number;
}

interface Metrics {
  attempts: Array<{
    model: string;
    success: boolean;
    time: number;
    error?: string;
  }>;
  totalTime: number;
}

interface ValidationStatus {
  openai: { valid: boolean; checking: boolean; error?: string };
  gemini: { valid: boolean; checking: boolean; error?: string };
  anthropic: { valid: boolean; checking: boolean; error?: string };
}

// Inline utility functions to avoid ES6 import issues
async function validateApiKey(
  provider: string,
  apiKey: string
): Promise<{ valid: boolean; error?: string }> {
  if (!apiKey || apiKey.trim() === '') {
    return { valid: false, error: 'API key is required' };
  }

  try {
    switch (provider) {
      case 'openai':
        return await validateOpenAIApiKey(apiKey);
      case 'gemini':
        return await validateGeminiApiKey(apiKey);
      case 'anthropic':
        return await validateAnthropicApiKey(apiKey);
      default:
        return { valid: false, error: 'Unknown provider' };
    }
  } catch {
    return { valid: false, error: 'Network error during validation' };
  }
}

async function validateOpenAIApiKey(
  apiKey: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      return { valid: true };
    } else if (response.status === 401) {
      return { valid: false, error: 'Invalid API key' };
    } else {
      return {
        valid: false,
        error: `API validation failed: ${response.status}`,
      };
    }
  } catch {
    return { valid: false, error: 'Network error during validation' };
  }
}

async function validateGeminiApiKey(
  apiKey: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.ok) {
      return { valid: true };
    } else if (response.status === 400 || response.status === 403) {
      return { valid: false, error: 'Invalid API key' };
    } else {
      return {
        valid: false,
        error: `API validation failed: ${response.status}`,
      };
    }
  } catch {
    return { valid: false, error: 'Network error during validation' };
  }
}

async function validateAnthropicApiKey(
  apiKey: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'test' }],
      }),
    });

    if (response.ok) {
      return { valid: true };
    } else if (response.status === 401) {
      return { valid: false, error: 'Invalid API key' };
    } else {
      return {
        valid: false,
        error: `API validation failed: ${response.status}`,
      };
    }
  } catch {
    return { valid: false, error: 'Network error during validation' };
  }
}

function isModelAvailable(
  model: string,
  apiKeys: {
    openaiApiKey: string;
    geminiApiKey: string;
    anthropicApiKey: string;
  }
): boolean {
  const config = optionsGetModelConfig(model);
  if (!config) return false;

  switch (config.provider) {
    case 'chrome':
      return true; // Chrome built-in is always available
    case 'openai':
      return !!(apiKeys.openaiApiKey && apiKeys.openaiApiKey.trim() !== '');
    case 'gemini':
      return !!(apiKeys.geminiApiKey && apiKeys.geminiApiKey.trim() !== '');
    case 'anthropic':
      return !!(
        apiKeys.anthropicApiKey && apiKeys.anthropicApiKey.trim() !== ''
      );
    default:
      return false;
  }
}

const optionsThemes: Record<string, Theme> = {
  light: {
    name: 'Light',
    colors: {
      backgroundColor: '#ffffff',
      textColor: '#333333',
      borderColor: '#cccccc',
      shadowColor: 'rgba(0, 0, 0, 0.2)',
      closeButtonColor: '#666666',
      copyButtonColor: '#666666',
      titleColor: '#333333',
    },
  },
  dark: {
    name: 'Dark',
    colors: {
      backgroundColor: '#2d2d2d',
      textColor: '#f1f1f1',
      borderColor: '#555555',
      shadowColor: 'rgba(255, 255, 255, 0.2)',
      closeButtonColor: '#cccccc',
      copyButtonColor: '#cccccc',
      titleColor: '#f1f1f1',
    },
  },
  solarized: {
    name: 'Solarized',
    colors: {
      backgroundColor: '#fdf6e3',
      textColor: '#657b83',
      borderColor: '#93a1a1',
      shadowColor: 'rgba(0, 0, 0, 0.1)',
      closeButtonColor: '#93a1a1',
      copyButtonColor: '#93a1a1',
      titleColor: '#586e75',
    },
  },
  nord: {
    name: 'Nord',
    colors: {
      backgroundColor: '#2e3440',
      textColor: '#d8dee9',
      borderColor: '#4c566a',
      shadowColor: 'rgba(0, 0, 0, 0.2)',
      closeButtonColor: '#d8dee9',
      copyButtonColor: '#d8dee9',
      titleColor: '#eceff4',
    },
  },
  autumn: {
    name: 'Autumn',
    colors: {
      backgroundColor: '#f3e9d2',
      textColor: '#4a403a',
      borderColor: '#c8a083',
      shadowColor: 'rgba(0, 0, 0, 0.15)',
      closeButtonColor: '#8c6d5e',
      copyButtonColor: '#8c6d5e',
      titleColor: '#4a403a',
    },
  },
  synthwave: {
    name: 'Synthwave',
    colors: {
      backgroundColor: '#261b3e',
      textColor: '#f0d4f7',
      borderColor: '#ff6ac1',
      shadowColor: 'rgba(255, 106, 193, 0.3)',
      closeButtonColor: '#f0d4f7',
      copyButtonColor: '#f0d4f7',
      titleColor: '#f0d4f7',
    },
  },
};

function optionsGetModelConfig(model: string): ModelConfig | undefined {
  const models: Record<string, ModelConfig> = {
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
    'gpt-4-turbo': {
      provider: 'openai',
      modelId: 'gpt-4-turbo',
      name: 'GPT-4 Turbo',
      cost: 0.01,
    },
    'gpt-4o': {
      provider: 'openai',
      modelId: 'gpt-4o',
      name: 'GPT-4o',
      cost: 0.005,
    },
    'gemini-1.5-pro': {
      provider: 'gemini',
      modelId: 'gemini-1.5-pro',
      name: 'Gemini 1.5 Pro',
      cost: 0.00125,
    },
    'gemini-1.5-flash': {
      provider: 'gemini',
      modelId: 'gemini-1.5-flash',
      name: 'Gemini 1.5 Flash',
      cost: 0.000075,
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
    'claude-3-opus': {
      provider: 'anthropic',
      modelId: 'claude-3-opus-20240229',
      name: 'Claude 3 Opus',
      cost: 0.015,
    },
    'claude-3.5-sonnet': {
      provider: 'anthropic',
      modelId: 'claude-3-5-sonnet-20240620',
      name: 'Claude 3.5 Sonnet',
      cost: 0.003,
    },
  };
  return models[model];
}

document.addEventListener('DOMContentLoaded', function () {
  // Navigation elements
  const navLinks = document.querySelectorAll('.nav-link');
  const pages = document.querySelectorAll('.page');
  const sidebar = document.getElementById('sidebar') as HTMLElement;
  const toggleSidebarBtn = document.getElementById(
    'toggleSidebar'
  ) as HTMLButtonElement;

  // Settings elements
  const selectedModelSelect = document.getElementById(
    'selectedModel'
  ) as HTMLSelectElement;
  const temperatureInput = document.getElementById(
    'temperature'
  ) as HTMLInputElement;
  const temperatureValue = document.getElementById(
    'temperature-value'
  ) as HTMLSpanElement;
  const maxTokensInput = document.getElementById(
    'maxTokens'
  ) as HTMLInputElement;
  const enableFallbackCheckbox = document.getElementById(
    'enableFallback'
  ) as HTMLInputElement;
  const openaiApiKeyInput = document.getElementById(
    'openaiApiKey'
  ) as HTMLInputElement;
  const geminiApiKeyInput = document.getElementById(
    'geminiApiKey'
  ) as HTMLInputElement;
  const anthropicApiKeyInput = document.getElementById(
    'anthropicApiKey'
  ) as HTMLInputElement;
  const statusDiv = document.getElementById('status') as HTMLDivElement;

  // Theme elements
  const themeSelect = document.getElementById('theme') as HTMLSelectElement;
  const fontFamilySelect = document.getElementById(
    'fontFamily'
  ) as HTMLSelectElement;
  const fontSizeInput = document.getElementById('fontSize') as HTMLInputElement;
  const fontStyleSelect = document.getElementById(
    'fontStyle'
  ) as HTMLSelectElement;
  const themeStatusDiv = document.getElementById(
    'themeStatus'
  ) as HTMLDivElement;
  const themePreview = document.getElementById('themePreview') as HTMLElement;
  const previewText = document.getElementById('previewText') as HTMLElement;

  // Performance elements
  const refreshMetricsButton = document.getElementById(
    'refreshMetrics'
  ) as HTMLButtonElement;
  const metricsContainer = document.getElementById(
    'metricsContainer'
  ) as HTMLDivElement;

  // History elements
  const searchInput = document.getElementById(
    'searchInput'
  ) as HTMLInputElement;
  const filterModelSelect = document.getElementById(
    'filterModel'
  ) as HTMLSelectElement;
  const refreshHistoryButton = document.getElementById(
    'refreshHistory'
  ) as HTMLButtonElement;
  const clearHistoryButton = document.getElementById(
    'clearHistory'
  ) as HTMLButtonElement;
  const historyContainer = document.getElementById(
    'historyContainer'
  ) as HTMLDivElement;

  // Navigation functionality
  function switchPage(pageId: string) {
    pages.forEach((page) => page.classList.remove('active'));
    navLinks.forEach((link) => link.classList.remove('active'));

    const targetPage = document.getElementById(pageId + '-page');
    const targetLink = document.querySelector(`[data-page="${pageId}"]`);

    if (targetPage) targetPage.classList.add('active');
    if (targetLink) targetLink.classList.add('active');
  }

  navLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const page = link.getAttribute('data-page');
      if (page) switchPage(page);
    });
  });

  // Mobile sidebar toggle
  toggleSidebarBtn.addEventListener('click', () => {
    sidebar.classList.toggle('open');
  });

  // Temperature slider
  temperatureInput.addEventListener('input', () => {
    temperatureValue.textContent = temperatureInput.value;
  });

  // Load saved settings
  chrome.storage.sync.get(
    [
      'selectedModel',
      'temperature',
      'maxTokens',
      'enableFallback',
      'openaiApiKey',
      'geminiApiKey',
      'anthropicApiKey',
    ],
    function (result) {
      if (result.selectedModel) {
        selectedModelSelect.value = result.selectedModel;
      } else {
        // Set default to chrome-builtin if no model selected
        selectedModelSelect.value = 'chrome-builtin';
      }
      if (result.temperature !== undefined) {
        temperatureInput.value = result.temperature.toString();
        temperatureValue.textContent = result.temperature.toString();
      } else {
        temperatureInput.value = '0.7';
        temperatureValue.textContent = '0.7';
      }
      if (result.maxTokens !== undefined) {
        maxTokensInput.value = result.maxTokens.toString();
      } else {
        maxTokensInput.value = '1000';
      }
      if (result.enableFallback !== undefined) {
        enableFallbackCheckbox.checked = result.enableFallback;
      } else {
        enableFallbackCheckbox.checked = true; // Default to enabled
      }
      if (result.openaiApiKey) {
        openaiApiKeyInput.value = result.openaiApiKey;
      }
      if (result.geminiApiKey) {
        geminiApiKeyInput.value = result.geminiApiKey;
      }
      if (result.anthropicApiKey) {
        anthropicApiKeyInput.value = result.anthropicApiKey;
      }
    }
  );

  // Save settings
  const settingsForm = document.getElementById(
    'settings-form'
  ) as HTMLFormElement;
  settingsForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    const selectedModel = selectedModelSelect.value;
    const temperature = parseFloat(temperatureInput.value);
    const maxTokens = parseInt(maxTokensInput.value);
    const enableFallback = enableFallbackCheckbox.checked;
    const openaiApiKey = openaiApiKeyInput.value.trim();
    const geminiApiKey = geminiApiKeyInput.value.trim();
    const anthropicApiKey = anthropicApiKeyInput.value.trim();

    // Check if selected model is available
    const apiKeys = {
      openaiApiKey,
      geminiApiKey,
      anthropicApiKey,
    };

    if (!isModelAvailable(selectedModel, apiKeys)) {
      statusDiv.textContent =
        'Cannot save: Selected model requires a valid API key. Please configure the appropriate API key or choose a different model.';
      statusDiv.className = 'status error';
      return;
    }

    chrome.storage.sync.set(
      {
        selectedModel: selectedModel,
        temperature: temperature,
        maxTokens: maxTokens,
        enableFallback: enableFallback,
        openaiApiKey: openaiApiKey,
        geminiApiKey: geminiApiKey,
        anthropicApiKey: anthropicApiKey,
      },
      function () {
        statusDiv.textContent = 'Settings saved successfully!';
        statusDiv.className = 'status success';

        // Clear status after 3 seconds
        setTimeout(() => {
          statusDiv.textContent = '';
          statusDiv.className = '';
        }, 3000);
      }
    );
  });

  // Load and display metrics
  function loadMetrics() {
    chrome.runtime.sendMessage({ action: 'get_model_metrics' });
  }

  function displayMetrics(
    metrics: Record<
      string,
      {
        totalRequests: number;
        successfulRequests: number;
        totalTime: number;
        avgTime: number;
        lastUsed: string;
      }
    >
  ) {
    if (!metrics || Object.keys(metrics).length === 0) {
      metricsContainer.innerHTML =
        '<p style="color: rgba(255, 255, 255, 0.7)">No performance data available yet. Use the extension to generate summaries and metrics will appear here.</p>';
      return;
    }

    let html = '';

    Object.entries(metrics).forEach(([modelKey, stats]: [string, any]) => {
      const modelConfig = optionsGetModelConfig(modelKey);
      const modelName = modelConfig ? modelConfig.name : modelKey;
      const successRate =
        stats.totalRequests > 0
          ? (stats.successfulRequests / stats.totalRequests) * 100
          : 0;
      const avgTime = stats.avgTime || 0;
      const lastUsed = stats.lastUsed
        ? new Date(stats.lastUsed).toLocaleDateString()
        : 'Never';

      html += `
        <div class="metric-card">
          <h3 class="metric-title">${modelName}</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px;">
            <div>
              <div style="color: #00d4ff; font-weight: 600;">Total Requests</div>
              <div style="font-size: 1.5rem; color: #39ff14;">${stats.totalRequests}</div>
            </div>
            <div>
              <div style="color: #00d4ff; font-weight: 600;">Success Rate</div>
              <div style="font-size: 1.5rem; color: #39ff14;">${successRate.toFixed(1)}%</div>
            </div>
            <div>
              <div style="color: #00d4ff; font-weight: 600;">Avg Response Time</div>
              <div style="font-size: 1.5rem; color: #39ff14;">${avgTime.toFixed(2)}s</div>
            </div>
            <div>
              <div style="color: #00d4ff; font-weight: 600;">Last Used</div>
              <div style="font-size: 1rem; color: rgba(255,255,255,0.8);">${lastUsed}</div>
            </div>
          </div>
        </div>
      `;
    });

    metricsContainer.innerHTML = html;
  }

  // Handle metrics response
  chrome.runtime.onMessage.addListener((request: any) => {
    if (request.action === 'model_metrics_response') {
      displayMetrics(request.metrics);
    }
  });

  // Refresh metrics button
  refreshMetricsButton.addEventListener('click', loadMetrics);

  // Load and display history
  function loadHistory() {
    chrome.storage.local.get('summaryHistory', (result) => {
      displayHistory(result.summaryHistory || []);
    });
  }

  let allHistory: Array<{
    id: string;
    timestamp: string;
    url: string;
    title: string;
    summary: string;
    model: string;
    time: string;
    metrics: Metrics;
  }> = [];

  function displayHistory(
    history: Array<{
      id: string;
      timestamp: string;
      url: string;
      title: string;
      summary: string;
      model: string;
      time: string;
      metrics: Metrics;
    }>
  ) {
    allHistory = history || [];

    // Populate filter dropdown
    const models = new Set(allHistory.map((item) => item.model));
    filterModelSelect.innerHTML = '<option value="">All Models</option>';
    models.forEach((model) => {
      const modelConfig = optionsGetModelConfig(model);
      const modelName = modelConfig ? modelConfig.name : model;
      const option = document.createElement('option');
      option.value = model;
      option.textContent = modelName;
      filterModelSelect.appendChild(option);
    });

    filterAndDisplayHistory();
  }

  function filterAndDisplayHistory() {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedModel = filterModelSelect.value;

    const filteredHistory = allHistory.filter((item) => {
      const matchesSearch =
        (item.title || '').toLowerCase().includes(searchTerm) ||
        (item.summary || '').toLowerCase().includes(searchTerm) ||
        (item.url || '').toLowerCase().includes(searchTerm);

      const matchesModel = !selectedModel || item.model === selectedModel;

      return matchesSearch && matchesModel;
    });

    if (allHistory.length === 0) {
      historyContainer.innerHTML =
        '<p style="color: rgba(255, 255, 255, 0.7)">No summary history available yet.</p>';
      return;
    }

    if (filteredHistory.length === 0) {
      historyContainer.innerHTML =
        '<p style="color: rgba(255, 255, 255, 0.7)">No matching history items found.</p>';
      return;
    }

    let html = '';
    filteredHistory.forEach((item) => {
      const date = new Date(item.timestamp).toLocaleString();
      const modelConfig = optionsGetModelConfig(item.model);
      const modelName = modelConfig ? modelConfig.name : item.model;

      html += `
        <div class="history-item">
          <div class="history-header">
            <div class="history-title">${item.title || 'Untitled'}</div>
            <div class="history-meta">
              ${modelName} • ${item.time}s • ${date}
            </div>
          </div>
          <div class="history-url">
            <a href="${item.url}" target="_blank">${item.url}</a>
          </div>
          <div class="history-summary">${item.summary}</div>
          <div class="history-actions">
            <button class="btn btn-secondary" onclick="copyToClipboard('${item.summary.replace(/'/g, "\\'")}')">Copy</button>
            <button class="btn btn-secondary" onclick="shareSummary('${(item.title || 'Untitled').replace(/'/g, "\\'")}', '${item.summary.replace(/'/g, "\\'")}')">Share</button>
          </div>
        </div>
      `;
    });

    historyContainer.innerHTML = html;
  }

  // Add search and filter event listeners
  searchInput.addEventListener('input', filterAndDisplayHistory);
  filterModelSelect.addEventListener('change', filterAndDisplayHistory);

  function clearHistory() {
    if (
      confirm(
        'Are you sure you want to clear all summary history? This action cannot be undone.'
      )
    ) {
      chrome.storage.local.set({ summaryHistory: [] }, () => {
        displayHistory([]);
        statusDiv.textContent = 'History cleared successfully!';
        statusDiv.className = 'status success';
        setTimeout(() => {
          statusDiv.textContent = '';
          statusDiv.className = '';
        }, 3000);
      });
    }
  }

  // Global functions for button onclick handlers
  (window as any).copyToClipboard = function (text: string) {
    navigator.clipboard.writeText(text).then(() => {
      statusDiv.textContent = 'Summary copied to clipboard!';
      statusDiv.className = 'status success';
      setTimeout(() => {
        statusDiv.textContent = '';
        statusDiv.className = '';
      }, 2000);
    });
  };

  (window as any).shareSummary = function (title: string, text: string) {
    if (navigator.share) {
      navigator
        .share({
          title: title,
          text: text,
        })
        .catch(console.error);
    } else {
      (window as any).copyToClipboard(text);
    }
  };

  // Event listeners for history buttons
  refreshHistoryButton.addEventListener('click', loadHistory);
  clearHistoryButton.addEventListener('click', clearHistory);

  // Load metrics on page load
  loadMetrics();

  // Load history on page load
  loadHistory();

  // Real-time API key validation
  const validationStatus: ValidationStatus = {
    openai: { valid: false, checking: false },
    gemini: { valid: false, checking: false },
    anthropic: { valid: false, checking: false },
  };

  function updateValidationIndicator(
    provider: keyof ValidationStatus,
    input: HTMLInputElement
  ) {
    const status = validationStatus[provider];
    const container = input.parentElement!;

    // Remove existing indicators
    const existingIndicator = container.querySelector('.validation-indicator');
    if (existingIndicator) {
      existingIndicator.remove();
    }

    // Add new indicator
    const indicator = document.createElement('span');
    indicator.className = 'validation-indicator';

    if (status.checking) {
      indicator.textContent = '⏳';
      indicator.title = 'Validating...';
      indicator.style.color = '#ffa500';
    } else if (status.valid) {
      indicator.textContent = '✓';
      indicator.title = 'Valid API key';
      indicator.style.color = '#28a745';
    } else if (input.value.trim() && status.error) {
      indicator.textContent = '✗';
      indicator.title = status.error;
      indicator.style.color = '#dc3545';
    }

    if (indicator.textContent) {
      indicator.style.marginLeft = '8px';
      container.appendChild(indicator);
    }
  }

  async function validateApiKeyInput(
    provider: keyof ValidationStatus,
    input: HTMLInputElement
  ) {
    const apiKey = input.value.trim();

    if (!apiKey) {
      validationStatus[provider] = { valid: false, checking: false };
      updateValidationIndicator(provider, input);
      return;
    }

    validationStatus[provider].checking = true;
    updateValidationIndicator(provider, input);

    try {
      const result = await validateApiKey(provider, apiKey);
      validationStatus[provider] = {
        valid: result.valid,
        checking: false,
        error: result.error,
      };
    } catch {
      validationStatus[provider] = {
        valid: false,
        checking: false,
        error: 'Validation failed',
      };
    }

    updateValidationIndicator(provider, input);
  }

  // Add validation event listeners
  openaiApiKeyInput.addEventListener('blur', () =>
    validateApiKeyInput('openai', openaiApiKeyInput)
  );
  geminiApiKeyInput.addEventListener('blur', () =>
    validateApiKeyInput('gemini', geminiApiKeyInput)
  );
  anthropicApiKeyInput.addEventListener('blur', () =>
    validateApiKeyInput('anthropic', anthropicApiKeyInput)
  );

  // Also validate on input for better UX (debounced)
  const validationTimeouts: { [key: string]: number } = {};

  function debouncedValidate(
    provider: keyof ValidationStatus,
    input: HTMLInputElement
  ) {
    clearTimeout(validationTimeouts[provider]);
    validationTimeouts[provider] = window.setTimeout(() => {
      validateApiKeyInput(provider, input);
    }, 1000); // 1 second delay
  }

  openaiApiKeyInput.addEventListener('input', () =>
    debouncedValidate('openai', openaiApiKeyInput)
  );
  geminiApiKeyInput.addEventListener('input', () =>
    debouncedValidate('gemini', geminiApiKeyInput)
  );
  anthropicApiKeyInput.addEventListener('input', () =>
    debouncedValidate('anthropic', anthropicApiKeyInput)
  );

  // Theme functionality
  function updatePreview() {
    const selectedTheme = themeSelect.value;
    const fontFamily = fontFamilySelect.value;
    const fontSize = parseInt(fontSizeInput.value);
    const fontStyle = fontStyleSelect.value;

    const theme = optionsThemes[selectedTheme];
    if (theme) {
      themePreview.style.backgroundColor = theme.colors.backgroundColor;
      themePreview.style.color = theme.colors.textColor;
      themePreview.style.borderColor = theme.colors.borderColor;
      themePreview.style.boxShadow = `0 0 10px ${theme.colors.shadowColor}`;

      previewText.style.color = theme.colors.textColor;
    }

    previewText.style.fontFamily = fontFamily;
    previewText.style.fontSize = `${fontSize}px`;
    previewText.style.fontWeight = fontStyle === 'bold' ? 'bold' : 'normal';
    previewText.style.fontStyle = fontStyle === 'italic' ? 'italic' : 'normal';
  }

  // Populate theme selector
  for (const themeKey in optionsThemes) {
    const option = document.createElement('option');
    option.value = themeKey;
    option.textContent = optionsThemes[themeKey].name;
    themeSelect.appendChild(option);
  }

  // Load saved theme and font settings
  chrome.storage.sync.get(
    ['theme', 'fontFamily', 'fontSize', 'fontStyle'],
    function (result) {
      if (result.theme) {
        themeSelect.value = result.theme;
      } else {
        themeSelect.value = 'dark'; // Default theme
      }
      if (result.fontFamily) {
        fontFamilySelect.value = result.fontFamily;
      } else {
        fontFamilySelect.value = 'Arial'; // Default font
      }
      if (result.fontSize !== undefined) {
        fontSizeInput.value = result.fontSize.toString();
      } else {
        fontSizeInput.value = '14'; // Default size
      }
      if (result.fontStyle) {
        fontStyleSelect.value = result.fontStyle;
      } else {
        fontStyleSelect.value = 'normal'; // Default style
      }
      updatePreview();
    }
  );

  // Real-time preview updates
  themeSelect.addEventListener('change', updatePreview);
  fontFamilySelect.addEventListener('change', updatePreview);
  fontSizeInput.addEventListener('input', updatePreview);
  fontStyleSelect.addEventListener('change', updatePreview);

  // Save theme settings
  const themeForm = document.getElementById('theme-form') as HTMLFormElement;
  themeForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const theme = themeSelect.value;
    const fontFamily = fontFamilySelect.value;
    const fontSize = parseInt(fontSizeInput.value);
    const fontStyle = fontStyleSelect.value;

    chrome.storage.sync.set(
      {
        theme: theme,
        fontFamily: fontFamily,
        fontSize: fontSize,
        fontStyle: fontStyle,
      },
      function () {
        themeStatusDiv.textContent = 'Theme settings saved successfully!';
        themeStatusDiv.className = 'status success';

        // Clear status after 3 seconds
        setTimeout(() => {
          themeStatusDiv.textContent = '';
          themeStatusDiv.className = '';
        }, 3000);
      }
    );
  });
});

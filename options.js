function getModelConfig(model) {
  const models = {
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
  const selectedModelSelect = document.getElementById('selectedModel');
  const enableFallbackCheckbox = document.getElementById('enableFallback');
  const openaiApiKeyInput = document.getElementById('openaiApiKey');
  const geminiApiKeyInput = document.getElementById('geminiApiKey');
  const anthropicApiKeyInput = document.getElementById('anthropicApiKey');
  const saveButton = document.getElementById('save');
  const themeSelect = document.getElementById('theme');
  const statusDiv = document.getElementById('status');
  const refreshMetricsButton = document.getElementById('refreshMetrics');
  const metricsContainer = document.getElementById('metricsContainer');
  const refreshHistoryButton = document.getElementById('refreshHistory');
  const clearHistoryButton = document.getElementById('clearHistory');
  const historyContainer = document.getElementById('historyContainer');

  // Populate theme selector
  for (const themeKey in themes) {
    const option = document.createElement('option');
    option.value = themeKey;
    option.textContent = themes[themeKey].name;
    themeSelect.appendChild(option);
  }

  // Load saved settings
  chrome.storage.sync.get(
    [
      'selectedModel',
      'enableFallback',
      'openaiApiKey',
      'geminiApiKey',
      'anthropicApiKey',
      'theme',
    ],
    function (result) {
      if (result.selectedModel) {
        selectedModelSelect.value = result.selectedModel;
      } else {
        // Set default to chrome-builtin if no model selected
        selectedModelSelect.value = 'chrome-builtin';
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
      if (result.theme) {
        themeSelect.value = result.theme;
      }
    }
  );

  // Save settings
  saveButton.addEventListener('click', function () {
    const selectedModel = selectedModelSelect.value;
    const enableFallback = enableFallbackCheckbox.checked;
    const openaiApiKey = openaiApiKeyInput.value.trim();
    const geminiApiKey = geminiApiKeyInput.value.trim();
    const anthropicApiKey = anthropicApiKeyInput.value.trim();
    const theme = themeSelect.value;

    chrome.storage.sync.set(
      {
        selectedModel: selectedModel,
        enableFallback: enableFallback,
        openaiApiKey: openaiApiKey,
        geminiApiKey: geminiApiKey,
        anthropicApiKey: anthropicApiKey,
        theme: theme,
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

  function displayMetrics(metrics) {
    if (!metrics || Object.keys(metrics).length === 0) {
      metricsContainer.innerHTML =
        '<p>No performance data available yet. Use the extension to generate summaries and metrics will appear here.</p>';
      return;
    }

    let html =
      '<table class="metrics-table"><thead><tr><th>Model</th><th>Requests</th><th>Success Rate</th><th>Avg Time</th><th>Last Used</th></tr></thead><tbody>';

    Object.entries(metrics).forEach(([modelKey, stats]) => {
      const modelConfig = getModelConfig(modelKey);
      const modelName = modelConfig ? modelConfig.name : modelKey;
      const successRate =
        stats.totalRequests > 0
          ? ((stats.successfulRequests / stats.totalRequests) * 100).toFixed(1)
          : '0.0';
      const avgTime = stats.avgTime ? stats.avgTime.toFixed(2) : 'N/A';
      const lastUsed = stats.lastUsed
        ? new Date(stats.lastUsed).toLocaleDateString()
        : 'Never';

      html += `<tr>
        <td>${modelName}</td>
        <td>${stats.totalRequests}</td>
        <td>${successRate}%</td>
        <td>${avgTime}s</td>
        <td>${lastUsed}</td>
      </tr>`;
    });

    html += '</tbody></table>';
    metricsContainer.innerHTML = html;
  }

  // Handle metrics response
  chrome.runtime.onMessage.addListener((request) => {
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

  function displayHistory(history) {
    if (!history || history.length === 0) {
      historyContainer.innerHTML =
        '<p>No summary history available yet. Use the extension to generate summaries and they will appear here.</p>';
      return;
    }

    let html = '';
    history.forEach((item) => {
      const date = new Date(item.timestamp).toLocaleString();
      const modelConfig = getModelConfig(item.model);
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
            <button onclick="copyToClipboard('${item.summary.replace(/'/g, "\\'")}')">Copy</button>
            <button onclick="shareSummary('${item.title || 'Untitled'}', '${item.summary.replace(/'/g, "\\'")}')">Share</button>
          </div>
        </div>
      `;
    });

    historyContainer.innerHTML = html;
  }

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
  window.copyToClipboard = function (text) {
    navigator.clipboard.writeText(text).then(() => {
      statusDiv.textContent = 'Summary copied to clipboard!';
      statusDiv.className = 'status success';
      setTimeout(() => {
        statusDiv.textContent = '';
        statusDiv.className = '';
      }, 2000);
    });
  };

  window.shareSummary = function (title, text) {
    if (navigator.share) {
      navigator
        .share({
          title: title,
          text: text,
        })
        .catch(console.error);
    } else {
      window.copyToClipboard(text);
    }
  };

  // Event listeners for history buttons
  refreshHistoryButton.addEventListener('click', loadHistory);
  clearHistoryButton.addEventListener('click', clearHistory);

  // Load metrics on page load
  loadMetrics();

  // Load history on page load
  loadHistory();
});

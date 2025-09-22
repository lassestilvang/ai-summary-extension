const summaryState = {}; // Stores { tabId: { summary: "...", visible: true/false } }

chrome.action.onClicked.addListener((tab) => {
  // When the action button is clicked, send a message to the content script to toggle the summary visibility
  chrome.tabs.sendMessage(tab.id, { action: 'toggle_summary_visibility' });
});

async function summarizeWithAI(
  content,
  forceModel = null,
  progressCallback = null,
  selectionMode = false,
  options = {}
) {
  const startTime = Date.now();
  const {
    selectedModel,
    openaiApiKey,
    geminiApiKey,
    anthropicApiKey,
    enableFallback,
  } = await chrome.storage.sync.get([
    'selectedModel',
    'openaiApiKey',
    'geminiApiKey',
    'anthropicApiKey',
    'enableFallback',
  ]);

  const preferredModel = forceModel || selectedModel || 'chrome-builtin';
  const metrics = { attempts: [], totalTime: 0 };

  // Get stored metrics for time estimation
  const { modelMetrics = {} } = await chrome.storage.local.get('modelMetrics');
  const primaryMetrics = modelMetrics[preferredModel];
  const estimatedTotalTime = primaryMetrics ? primaryMetrics.avgTime : 5; // Default 5 seconds

  // Step 1: Content extraction (10%)
  if (progressCallback) {
    progressCallback({
      step: 'Extracting content',
      percentage: 10,
      estimatedTimeRemaining: estimatedTotalTime * 0.9,
      currentModel: preferredModel,
    });
  }

  let result = await tryModel(
    preferredModel,
    content,
    {
      openaiApiKey,
      geminiApiKey,
      anthropicApiKey,
    },
    selectionMode,
    options
  );

  metrics.attempts.push({
    model: preferredModel,
    success: result.success,
    time: Date.now() - startTime,
    error: result.error,
  });

  let usedModel = preferredModel;

  // Step 2: Primary model attempt (20-70%)
  if (progressCallback) {
    progressCallback({
      step: result.success ? 'Processing response' : 'Trying fallback models',
      percentage: result.success ? 70 : 20,
      estimatedTimeRemaining: result.success
        ? estimatedTotalTime * 0.3
        : estimatedTotalTime * 0.8,
      currentModel: preferredModel,
      success: result.success,
    });
  }

  // Fallback to other models if enabled and preferred failed
  if (!result.success && enableFallback !== false) {
    const fallbackModels = getFallbackModels(preferredModel);
    let fallbackProgress = 20;

    for (let i = 0; i < fallbackModels.length; i++) {
      const model = fallbackModels[i];
      const attemptStart = Date.now();

      if (progressCallback) {
        progressCallback({
          step: `Trying ${getModelConfig(model).name}`,
          percentage: fallbackProgress + i * 15,
          estimatedTimeRemaining: estimatedTotalTime * (0.8 - i * 0.1),
          currentModel: model,
        });
      }

      result = await tryModel(
        model,
        content,
        {
          openaiApiKey,
          geminiApiKey,
          anthropicApiKey,
        },
        selectionMode,
        options
      );

      metrics.attempts.push({
        model,
        success: result.success,
        time: Date.now() - attemptStart,
        error: result.error,
      });

      if (result.success) {
        usedModel = model;
        if (progressCallback) {
          progressCallback({
            step: 'Processing response',
            percentage: 90,
            estimatedTimeRemaining: estimatedTotalTime * 0.1,
            currentModel: model,
            success: true,
          });
        }
        break;
      }

      fallbackProgress += 15;
    }
  }

  // Step 3: Final processing (90-100%)
  if (progressCallback) {
    progressCallback({
      step: 'Finalizing summary',
      percentage: 95,
      estimatedTimeRemaining: 0.5,
      currentModel: usedModel,
      success: result.success,
    });
  }

  const endTime = Date.now();
  const timeTaken = ((endTime - startTime) / 1000).toFixed(2);
  metrics.totalTime = parseFloat(timeTaken);

  // Store metrics for comparison
  await storeModelMetrics(usedModel, metrics);

  if (progressCallback) {
    progressCallback({
      step: 'Complete',
      percentage: 100,
      estimatedTimeRemaining: 0,
      currentModel: usedModel,
      success: result.success,
    });
  }

  if (result.success) {
    return {
      summary: result.summary,
      model: usedModel,
      time: timeTaken,
      metrics,
    };
  } else {
    return {
      summary:
        'Unable to summarize content. Please check your settings and try again.',
      model: 'N/A',
      time: timeTaken,
      metrics,
    };
  }
}

function generatePrompt(content, selectionMode = false, options = {}) {
  const {
    length = 'medium',
    focus = 'summary',
    format = 'paragraphs',
  } = options;

  let prompt = '';

  if (selectionMode) {
    prompt = `Please provide a ${length} summary of the following selected text. Focus on ${focus === 'key-points' ? 'key points' : focus === 'summary' ? 'a comprehensive summary' : 'detailed information'}. Format the output as ${format === 'bullets' ? 'bullet points' : format === 'concise' ? 'a concise paragraph' : 'paragraphs'}.\n\n${content.substring(0, 12000)}`;
  } else {
    prompt = `Please provide a ${length} summary of the following text in ${format === 'bullets' ? 'bullet points' : format === 'concise' ? 'a concise paragraph' : '2-3 sentences'}. Focus on ${focus === 'key-points' ? 'key points' : focus === 'summary' ? 'the main content' : 'detailed information'}.\n\n${content.substring(0, 12000)}`;
  }

  return prompt;
}

async function tryModel(
  model,
  content,
  apiKeys,
  selectionMode = false,
  options = {}
) {
  const modelConfig = getModelConfig(model);
  if (!modelConfig) {
    return { success: false, error: 'Unknown model' };
  }

  switch (modelConfig.provider) {
    case 'chrome':
      return await tryChromeBuiltinAI(content, options);
    case 'openai':
      return await tryOpenAI(
        content,
        apiKeys.openaiApiKey,
        modelConfig.modelId,
        selectionMode,
        options
      );
    case 'gemini':
      return await tryGeminiAPI(
        content,
        apiKeys.geminiApiKey,
        modelConfig.modelId,
        selectionMode,
        options
      );
    case 'anthropic':
      return await tryAnthropicAPI(
        content,
        apiKeys.anthropicApiKey,
        modelConfig.modelId,
        selectionMode,
        options
      );
    default:
      return { success: false, error: 'Unknown provider' };
  }
}

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

function getFallbackModels(primaryModel) {
  const modelConfig = getModelConfig(primaryModel);
  if (!modelConfig) return [];

  const fallbacks = {
    chrome: ['gpt-3.5-turbo', 'gemini-2.0-flash-exp', 'claude-3-haiku'],
    openai: ['gemini-2.0-flash-exp', 'claude-3-haiku', 'chrome-builtin'],
    gemini: ['gpt-3.5-turbo', 'claude-3-haiku', 'chrome-builtin'],
    anthropic: ['gpt-3.5-turbo', 'gemini-2.0-flash-exp', 'chrome-builtin'],
  };

  return fallbacks[modelConfig.provider] || [];
}

async function storeModelMetrics(model, metrics) {
  try {
    const { modelMetrics = {} } =
      await chrome.storage.local.get('modelMetrics');
    if (!modelMetrics[model]) {
      modelMetrics[model] = {
        totalRequests: 0,
        successfulRequests: 0,
        totalTime: 0,
        avgTime: 0,
        lastUsed: null,
      };
    }

    const modelStats = modelMetrics[model];
    modelStats.totalRequests++;
    modelStats.totalTime += metrics.totalTime;
    modelStats.avgTime = modelStats.totalTime / modelStats.totalRequests;
    modelStats.lastUsed = new Date().toISOString();

    const lastAttempt = metrics.attempts[metrics.attempts.length - 1];
    if (lastAttempt.success) {
      modelStats.successfulRequests++;
    }

    await chrome.storage.local.set({ modelMetrics });
  } catch (error) {
    console.error('Error storing model metrics:', error);
  }
}

async function storeSummaryHistory(tabId, summary, model, time, metrics) {
  try {
    const { summaryHistory = [] } =
      await chrome.storage.local.get('summaryHistory');

    // Get tab info for URL and title
    const tab = await chrome.tabs.get(tabId);

    const historyEntry = {
      id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      url: tab.url,
      title: tab.title,
      summary: summary,
      model: model,
      time: time,
      metrics: metrics,
    };

    // Add to beginning of array (most recent first)
    summaryHistory.unshift(historyEntry);

    // Keep only the most recent 50 summaries
    if (summaryHistory.length > 50) {
      summaryHistory.splice(50);
    }

    await chrome.storage.local.set({ summaryHistory });
  } catch (error) {
    console.error('Error storing summary history:', error);
  }
}

async function tryChromeBuiltinAI(content, options = {}) {
  try {
    if ('Summarizer' in globalThis) {
      const { length = 'medium' } = options;
      const summarizer = await globalThis.Summarizer.create({
        type: 'key-points',
        format: 'markdown',
        length: length,
      });
      const summary = await summarizer.summarize(content);
      summarizer.destroy();
      return { success: true, summary };
    } else {
      return { success: false, error: 'Chrome built-in AI not available' };
    }
  } catch (error) {
    console.log('Chrome built-in AI error:', error);
    return { success: false, error: error.message };
  }
}

async function tryOpenAI(
  content,
  apiKey,
  model = 'gpt-3.5-turbo',
  selectionMode = false,
  options = {}
) {
  try {
    if (!apiKey) {
      return { success: false, error: 'No OpenAI API key configured' };
    }

    const prompt = generatePrompt(content, selectionMode, options);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 300,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API request failed: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, summary: data.choices[0].message.content.trim() };
  } catch (error) {
    console.error('OpenAI API error:', error);
    return { success: false, error: error.message };
  }
}

async function tryGeminiAPI(
  content,
  apiKey,
  model = 'gemini-2.0-flash-exp',
  selectionMode = false,
  options = {}
) {
  try {
    if (!apiKey) {
      return { success: false, error: 'No Gemini API key configured' };
    }

    const prompt = generatePrompt(content, selectionMode, options);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 300,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API request failed: ${response.status}`);
    }

    const data = await response.json();
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      return {
        success: true,
        summary: data.candidates[0].content.parts[0].text.trim(),
      };
    } else {
      throw new Error('Invalid response format from Gemini API');
    }
  } catch (error) {
    console.error('Gemini API error:', error);
    return { success: false, error: error.message };
  }
}

async function tryAnthropicAPI(
  content,
  apiKey,
  model = 'claude-3-haiku-20240307',
  selectionMode = false,
  options = {}
) {
  try {
    if (!apiKey) {
      return { success: false, error: 'No Anthropic API key configured' };
    }

    const prompt = generatePrompt(content, selectionMode, options);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        max_tokens: 300,
        temperature: 0.3,
        system: 'You are a helpful assistant that provides concise summaries.',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API request failed: ${response.status}`);
    }

    const data = await response.json();
    if (data.content && data.content[0] && data.content[0].text) {
      return { success: true, summary: data.content[0].text.trim() };
    } else {
      throw new Error('Invalid response format from Anthropic API');
    }
  } catch (error) {
    console.error('Anthropic API error:', error);
    return { success: false, error: error.message };
  }
}

chrome.runtime.onMessage.addListener(function (request, sender) {
  if (request.action === 'process_content') {
    const tabId = sender.tab.id;

    // Show loading state
    chrome.tabs.sendMessage(tabId, { action: 'show_loading_spinner' });

    // Progress callback to send updates to content script
    const progressCallback = (progress) => {
      chrome.tabs.sendMessage(tabId, {
        action: 'update_loading_progress',
        progress,
      });
    };

    summarizeWithAI(
      request.content,
      request.forceModel,
      progressCallback,
      request.selectionMode,
      request.options
    )
      .then(async ({ summary, model, time, metrics }) => {
        summaryState[tabId] = { summary, visible: true, model, time, metrics };
        chrome.tabs.sendMessage(tabId, {
          action: 'display_inline_summary',
          summary,
          model,
          time,
          metrics,
        });

        // Store summary in history
        await storeSummaryHistory(tabId, summary, model, time, metrics);
      })
      .catch((error) => {
        console.error('Error summarizing:', error);
        const errorMessage = 'Error summarizing content. Please try again.';
        summaryState[tabId] = {
          summary: errorMessage,
          visible: true,
          model: 'N/A',
          time: 'N/A',
          metrics: null,
        };
        chrome.tabs.sendMessage(tabId, {
          action: 'display_inline_summary',
          summary: errorMessage,
          model: 'N/A',
          time: 'N/A',
          metrics: null,
        });
      });
  } else if (request.action === 'update_summary_visibility') {
    const tabId = sender.tab.id;
    if (summaryState[tabId]) {
      summaryState[tabId].visible = request.visible;
    }
  } else if (request.action === 'open_options_page') {
    chrome.runtime.openOptionsPage();
  } else if (request.action === 'switch_model') {
    chrome.storage.sync.set({ selectedModel: request.model }, () => {
      chrome.runtime.sendMessage({
        action: 'model_switched',
        model: request.model,
      });
    });
  } else if (request.action === 'get_model_metrics') {
    chrome.storage.local.get('modelMetrics', (result) => {
      chrome.runtime.sendMessage({
        action: 'model_metrics_response',
        metrics: result.modelMetrics || {},
      });
    });
  }
});

// Clear summary state when a tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  delete summaryState[tabId];
});

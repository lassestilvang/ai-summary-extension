const summaryState = {}; // Stores { tabId: { summary: "...", visible: true/false } }

chrome.action.onClicked.addListener((tab) => {
  if (summaryState[tab.id] && summaryState[tab.id].summary) {
    // If summary already exists for this tab, just toggle visibility
    summaryState[tab.id].visible = !summaryState[tab.id].visible;
    chrome.tabs.sendMessage(tab.id, { action: 'toggle_summary_visibility', visible: summaryState[tab.id].visible });
  } else {
    // Otherwise, proceed with summarization
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });
  }
});

async function summarizeWithAI(content) {
  // Get user preferences
  const { aiProvider, openaiApiKey, geminiApiKey } = await chrome.storage.sync.get(['aiProvider', 'openaiApiKey', 'geminiApiKey']);

  // Default to Chrome built-in AI if no preference is set
  const preferredProvider = aiProvider || 'chrome';

  // Try preferred provider first
  let result = await tryProvider(preferredProvider, content, openaiApiKey, geminiApiKey);
  if (result.success) return result.summary;

  // Try fallback providers
  const providers = ['chrome', 'openai', 'gemini'];
  for (const provider of providers) {
    if (provider !== preferredProvider) {
      result = await tryProvider(provider, content, openaiApiKey, geminiApiKey);
      if (result.success) return result.summary;
    }
  }

  return 'Unable to summarize content. Please check your settings and try again.';
}

async function tryProvider(provider, content, openaiApiKey, geminiApiKey) {
  switch (provider) {
    case 'chrome':
      return await tryChromeBuiltinAI(content);
    case 'openai':
      return await tryOpenAI(content, openaiApiKey);
    case 'gemini':
      return await tryGeminiAPI(content, geminiApiKey);
    default:
      return { success: false, error: 'Unknown provider' };
  }
}

async function tryChromeBuiltinAI(content) {
  try {
    if ('Summarizer' in globalThis) {
      const summarizer = await globalThis.Summarizer.create({
        type: 'key-points',
        format: 'markdown',
        length: 'medium'
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

async function tryOpenAI(content, apiKey) {
  try {
    if (!apiKey) {
      return { success: false, error: 'No OpenAI API key configured' };
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{
          role: 'user',
          content: `Please provide a concise summary of the following text in 2-3 sentences:\n\n${content.substring(0, 4000)}`
        }],
        max_tokens: 150,
        temperature: 0.3
      })
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

async function tryGeminiAPI(content, apiKey) {
  try {
    if (!apiKey) {
      return { success: false, error: 'No Gemini API key configured' };
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Please provide a concise summary of the following text in 2-3 sentences:\n\n${content.substring(0, 4000)}`
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 150
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API request failed: ${response.status}`);
    }

    const data = await response.json();
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      return { success: true, summary: data.candidates[0].content.parts[0].text.trim() };
    } else {
      throw new Error('Invalid response format from Gemini API');
    }
  } catch (error) {
    console.error('Gemini API error:', error);
    return { success: false, error: error.message };
  }
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === 'process_content') {
    const tabId = sender.tab.id;

    // Show loading state
    chrome.tabs.sendMessage(tabId, { action: 'display_inline_summary', summary: 'Summarizing...' });

    summarizeWithAI(request.content)
      .then(summary => {
        summaryState[tabId] = { summary, visible: true };
        chrome.tabs.sendMessage(tabId, { action: 'display_inline_summary', summary });
      })
      .catch(error => {
        console.error('Error summarizing:', error);
        const errorMessage = 'Error summarizing content. Please try again.';
        summaryState[tabId] = { summary: errorMessage, visible: true };
        chrome.tabs.sendMessage(tabId, { action: 'display_inline_summary', summary: errorMessage });
      });
  } else if (request.action === 'update_summary_visibility') {
    const tabId = sender.tab.id;
    if (summaryState[tabId]) {
      summaryState[tabId].visible = request.visible;
    }
  }
});

// Clear summary state when a tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  delete summaryState[tabId];
});

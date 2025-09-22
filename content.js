let summaryDiv = null;

function getModelDisplayName(model) {
  const modelConfig = getModelConfig(model);
  return modelConfig ? modelConfig.name : model;
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

function createOrUpdateSummaryDiv(
  summaryText,
  theme,
  model = null,
  time = null,
  metrics = null
) {
  const themeColors = themes[theme]?.colors || themes.light.colors;

  if (!summaryDiv) {
    summaryDiv = document.createElement('div');
    summaryDiv.id = 'ai-summary-extension-summary-div';
    summaryDiv.style.cssText = `
      position: fixed !important;
      top: 10px !important;
      right: 10px !important;
      width: 300px !important;
      height: 400px !important;
      background-color: ${themeColors.backgroundColor} !important;
      border: 1px solid ${themeColors.borderColor} !important;
      border-radius: 8px !important;
      box-shadow: 0 4px 8px ${themeColors.shadowColor} !important;
      z-index: 99999 !important;
      overflow: hidden !important;
      display: flex !important;
      flex-direction: column !important;
    `;

    const titleBar = document.createElement('div');
    titleBar.style.cssText = `
      height: 30px !important;
      background-color: ${themeColors.borderColor} !important;
      display: flex !important;
      align-items: center !important;
      padding: 0 8px !important;
      cursor: move !important;
      flex-shrink: 0 !important;
    `;

    const buttons = document.createElement('div');
    buttons.style.cssText = `display: flex !important;`;

    const closeButton = document.createElement('div');
    closeButton.style.cssText = `
      width: 12px !important;
      height: 12px !important;
      border-radius: 50% !important;
      background-color: #ff5f56 !important;
      margin-right: 8px !important;
      cursor: pointer !important;
    `;
    closeButton.addEventListener('click', () => {
      summaryDiv.style.display = 'none';
      chrome.runtime.sendMessage({
        action: 'update_summary_visibility',
        visible: false,
      });
    });
    closeButton.title = 'Close';

    const minimizeButton = document.createElement('div');
    minimizeButton.style.cssText = `
      width: 12px !important;
      height: 12px !important;
      border-radius: 50% !important;
      background-color: #ffbd2e !important;
      margin-right: 8px !important;
      cursor: pointer !important;
    `;
    let isMinimized = false;
    minimizeButton.addEventListener('click', () => {
      if (isMinimized) {
        summaryDiv.style.height = originalSize.height;
        summaryContent.style.display = 'block';
        isMinimized = false;
      } else {
        originalSize.height = summaryDiv.style.height;
        summaryDiv.style.height = '30px';
        summaryContent.style.display = 'none';
        isMinimized = true;
      }
    });
    minimizeButton.title = 'Minimize';

    const maximizeButton = document.createElement('div');
    maximizeButton.style.cssText = `
      width: 12px !important;
      height: 12px !important;
      border-radius: 50% !important;
      background-color: #27c93f !important;
      cursor: pointer !important;
    `;
    let isMaximized = false;
    let originalSize = {};
    maximizeButton.addEventListener('click', () => {
      if (isMaximized) {
        summaryDiv.style.width = originalSize.width;
        summaryDiv.style.height = originalSize.height;
        summaryDiv.style.top = originalSize.top;
        summaryDiv.style.left = originalSize.left;
        isMaximized = false;
      } else {
        originalSize = {
          width: summaryDiv.style.width,
          height: summaryDiv.style.height,
          top: summaryDiv.style.top,
          left: summaryDiv.style.left,
        };
        summaryDiv.style.width = '90vw';
        summaryDiv.style.height = '90vh';
        summaryDiv.style.top = '5vh';
        summaryDiv.style.left = '5vw';
        isMaximized = true;
        summaryContent.style.display = 'block';
        isMinimized = false;
      }
    });
    maximizeButton.title = 'Maximize';

    buttons.appendChild(closeButton);
    buttons.appendChild(minimizeButton);
    buttons.appendChild(maximizeButton);

    const summaryTitleContainer = document.createElement('div');
    summaryTitleContainer.style.cssText = `
      flex-grow: 1 !important;
      text-align: center !important;
    `;

    const summaryTitle = document.createElement('div');
    summaryTitle.textContent = 'Summary';
    summaryTitle.style.cssText = `
      color: ${themeColors.titleColor} !important;
      font-family: Arial, sans-serif !important;
      font-size: 14px !important;
      font-weight: bold !important;
      display: inline-block !important;
    `;

    summaryTitleContainer.appendChild(summaryTitle);

    const actionButtons = document.createElement('div');
    actionButtons.style.cssText = `display: flex !important; align-items: center !important;`;

    const copyButton = document.createElement('span');
    copyButton.textContent = '📋'; // Clipboard emoji
    copyButton.style.cssText = `
      cursor: pointer !important;
      font-size: 16px !important;
      color: ${themeColors.copyButtonColor} !important;
      margin-left: 8px !important;
    `;
    copyButton.addEventListener('click', () => {
      const summaryText = document.getElementById(
        'ai-summary-extension-summary-content'
      ).textContent;
      navigator.clipboard.writeText(summaryText);
    });
    copyButton.title = 'Copy summary to clipboard';

    const shareButton = document.createElement('span');
    shareButton.textContent = '🔗';
    shareButton.style.cssText = `
      cursor: pointer !important;
      font-size: 16px !important;
      margin-left: 8px !important;
      display: inline-block !important;
    `;
    shareButton.addEventListener('click', () => {
      const summaryText = document.getElementById(
        'ai-summary-extension-summary-content'
      ).textContent;
      if (navigator.share) {
        navigator
          .share({
            title: document.title,
            text: summaryText,
          })
          .catch(console.error);
      }
    });
    shareButton.title = 'Share summary';

    const settingsLink = document.createElement('a');
    settingsLink.addEventListener('click', (event) => {
      event.preventDefault();
      chrome.runtime.sendMessage({ action: 'open_options_page' });
    });
    settingsLink.style.cssText = `
      cursor: pointer !important;
      width: 16px !important;
      margin-left: 8px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
    `;

    const settingsIcon = document.createElement('span');
    settingsIcon.textContent = '⚙️';
    settingsIcon.style.cssText = `
      font-size: 16px !important;
      display: inline-block !important;
    `;

    settingsLink.appendChild(settingsIcon);
    settingsLink.title = 'Open settings';

    actionButtons.appendChild(copyButton);
    actionButtons.appendChild(shareButton);
    actionButtons.appendChild(settingsLink);

    titleBar.appendChild(buttons);
    titleBar.appendChild(summaryTitleContainer);
    titleBar.appendChild(actionButtons);

    const summaryContent = document.createElement('div');
    summaryContent.id = 'ai-summary-extension-summary-content';
    summaryContent.style.cssText = `
      padding: 15px !important;
      overflow-y: auto !important;
      flex-grow: 1 !important;
      font-family: Arial, sans-serif !important;
      font-size: 14px !important;
      color: ${themeColors.textColor} !important;
      background-color: ${themeColors.backgroundColor} !important;
    `;

    const style = document.createElement('style');
    style.textContent = `
      .resize-handle-n { top: -5px; left: 50%; transform: translateX(-50%); cursor: n-resize; }
      .resize-handle-ne { top: -5px; right: -5px; cursor: ne-resize; }
      .resize-handle-e { top: 50%; right: -5px; transform: translateY(-50%); cursor: e-resize; }
      .resize-handle-se { bottom: -5px; right: -5px; cursor: se-resize; }
      .resize-handle-s { bottom: -5px; left: 50%; transform: translateX(-50%); cursor: s-resize; }
      .resize-handle-sw { bottom: -5px; left: -5px; cursor: sw-resize; }
      .resize-handle-w { top: 50%; left: -5px; transform: translateY(-50%); cursor: w-resize; }
      .resize-handle-nw { top: -5px; left: -5px; cursor: nw-resize; }

      #ai-summary-extension-summary-content ul, #ai-summary-extension-summary-content ol {
        padding-left: 20px;
        margin-bottom: 10px;
        line-height: 1.5;
      }
      #ai-summary-extension-summary-content li {
        margin-bottom: 5px;
      }
      #ai-summary-extension-summary-content strong {
        font-weight: bold;
      }
      #ai-summary-extension-summary-content em {
        font-style: italic;
      }
      #ai-summary-extension-summary-content p {
        margin-bottom: 10px;
        line-height: 1.5;
      }
      #ai-summary-extension-summary-content h1, #ai-summary-extension-summary-content h2, #ai-summary-extension-summary-content h3, #ai-summary-extension-summary-content h4, #ai-summary-extension-summary-content h5, #ai-summary-extension-summary-content h6 {
        margin-top: 15px;
        margin-bottom: 10px;
        font-weight: bold;
        line-height: 1.3;
      }
      #ai-summary-extension-summary-content h1 { font-size: 18px; }
      #ai-summary-extension-summary-content h2 { font-size: 16px; }
      #ai-summary-extension-summary-content h3 { font-size: 15px; }
      #ai-summary-extension-summary-content h4 { font-size: 14px; }
      #ai-summary-extension-summary-content h5 { font-size: 13px; }
      #ai-summary-extension-summary-content h6 { font-size: 12px; }
      #ai-summary-extension-summary-content a {
        color: #007bff;
        text-decoration: underline;
      }
      #ai-summary-extension-summary-content code {
        background-color: #f8f9fa;
        padding: 2px 4px;
        border-radius: 3px;
        font-family: 'Courier New', monospace;
        font-size: 13px;
      }
      #ai-summary-extension-summary-content blockquote {
        border-left: 4px solid #ddd;
        padding-left: 10px;
        margin-left: 0;
        color: #666;
        font-style: italic;
      }
    `;
    document.head.appendChild(style);

    // const resizeHandles = document.createElement('div');
    const directions = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];
    directions.forEach((dir) => {
      const handle = document.createElement('div');
      handle.className = `resize-handle-${dir}`;
      handle.style.cssText = `
        position: absolute;
        width: 10px;
        height: 10px;
        z-index: 100000;
      `;
      summaryDiv.appendChild(handle);
      makeResizable(summaryDiv, summaryContent, handle, dir);
    });

    summaryDiv.appendChild(titleBar);

    const loadingSpinner = document.createElement('div');
    loadingSpinner.id = 'ai-summary-extension-loading-spinner';
    loadingSpinner.style.cssText = `
      border: 4px solid #f3f3f3;
      border-top: 4px solid #3498db;
      border-radius: 50%;
      width: 30px;
      height: 30px;
      animation: spin 2s linear infinite;
      margin: auto;
      display: none; /* Hidden by default */
    `;
    summaryDiv.appendChild(loadingSpinner);

    summaryDiv.appendChild(summaryContent);

    const footerDiv = document.createElement('div');
    footerDiv.id = 'ai-summary-extension-footer-div';
    footerDiv.style.cssText = `
      height: 32px !important;
      padding: 4px 8px !important;
      font-size: 12px !important;
      color: ${themeColors.titleColor} !important;
      background-color: ${themeColors.borderColor} !important;
      font-family: Arial, sans-serif !important;
      flex-shrink: 0 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
    `;

    // Model selector in footer
    const modelSelect = document.createElement('select');
    modelSelect.id = 'ai-summary-model-selector';
    modelSelect.style.cssText = `
      padding: 2px 4px !important;
      font-size: 11px !important;
      border: 1px solid ${themeColors.borderColor} !important;
      border-radius: 3px !important;
      background-color: ${themeColors.backgroundColor} !important;
      color: ${themeColors.textColor} !important;
      max-width: 140px !important;
      flex-shrink: 0 !important;
    `;

    // Populate model selector
    const modelOptions = [
      { value: 'chrome-builtin', label: 'Chrome AI (Free)' },
      { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
      { value: 'gpt-4', label: 'GPT-4' },
      { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
      { value: 'gpt-4o', label: 'GPT-4o' },
      { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
      { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
      { value: 'gemini-2.0-flash-exp', label: 'Gemini 2.0 Flash' },
      { value: 'claude-3-haiku', label: 'Claude 3 Haiku' },
      { value: 'claude-3-sonnet', label: 'Claude 3 Sonnet' },
      { value: 'claude-3-opus', label: 'Claude 3 Opus' },
      { value: 'claude-3.5-sonnet', label: 'Claude 3.5 Sonnet' },
    ];

    modelOptions.forEach((option) => {
      const opt = document.createElement('option');
      opt.value = option.value;
      opt.textContent = option.label;
      modelSelect.appendChild(opt);
    });

    // Load current selected model
    chrome.storage.sync.get('selectedModel', (result) => {
      if (result.selectedModel) {
        modelSelect.value = result.selectedModel;
      }
    });

    // Handle model change - trigger automatic regeneration
    modelSelect.addEventListener('change', () => {
      const newModel = modelSelect.value;

      // Update stored preference
      chrome.runtime.sendMessage({
        action: 'switch_model',
        model: newModel,
      });

      // Clear existing content and show loading state
      const summaryContent = document.getElementById(
        'ai-summary-extension-summary-content'
      );
      const statusText = document.getElementById('ai-summary-status-text');
      const loadingSpinner = document.getElementById(
        'ai-summary-extension-loading-spinner'
      );

      if (summaryContent) {
        summaryContent.innerHTML = '';
        summaryContent.style.display = 'none';
      }
      if (statusText) {
        statusText.textContent = 'Regenerating...';
      }
      if (loadingSpinner) {
        loadingSpinner.style.display = 'block';
      }

      // Extract page content and regenerate summary
      const paragraphs = Array.from(document.querySelectorAll('p')).map(
        (p) => p.textContent
      );
      const pageContent = paragraphs.join('\n');

      if (pageContent.trim()) {
        chrome.runtime.sendMessage({
          action: 'process_content',
          content: pageContent,
          forceModel: newModel, // Force the specific model for regeneration
        });
      } else {
        // Handle case where no content is available
        if (statusText) {
          statusText.textContent = 'No content available to summarize';
        }
        if (loadingSpinner) {
          loadingSpinner.style.display = 'none';
        }
      }
    });

    // Status text container
    const statusText = document.createElement('div');
    statusText.id = 'ai-summary-status-text';
    statusText.style.cssText = `
      flex-grow: 1 !important;
      text-align: right !important;
      padding-right: 8px !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      white-space: nowrap !important;
    `;

    footerDiv.appendChild(modelSelect);
    footerDiv.appendChild(statusText);
    summaryDiv.appendChild(footerDiv);

    document.body.prepend(summaryDiv);

    const spinnerStyle = document.createElement('style');
    spinnerStyle.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(spinnerStyle);

    makeDraggable(summaryDiv, titleBar);
  }

  const loadingSpinner = document.getElementById(
    'ai-summary-extension-loading-spinner'
  );
  const summaryContent = document.getElementById(
    'ai-summary-extension-summary-content'
  );

  if (summaryText === null) {
    // Show spinner, hide content
    if (loadingSpinner) loadingSpinner.style.display = 'block';
    if (summaryContent) summaryContent.style.display = 'none';
    // Clear status text
    const statusText = document.getElementById('ai-summary-status-text');
    if (statusText) statusText.textContent = '';
    summaryDiv.style.display = 'flex';
  } else {
    // Hide spinner, show content
    if (loadingSpinner) loadingSpinner.style.display = 'none';
    if (summaryContent) {
      const converter = new showdown.Converter();
      const htmlSummary = converter.makeHtml(summaryText);
      summaryContent.innerHTML = htmlSummary;
      summaryContent.style.display = 'block';
    }
    // Update status text with model and time
    const statusText = document.getElementById('ai-summary-status-text');
    if (statusText && model && time) {
      const modelName = getModelDisplayName(model);
      let statusContent = `${modelName} • ${time}s`;
      if (metrics && metrics.attempts && metrics.attempts.length > 1) {
        statusContent += ` • ${metrics.attempts.length} attempts`;
      }
      statusText.textContent = statusContent;
    }
    summaryDiv.style.display = 'flex';
    adjustHeight();
  }
}

function adjustHeight() {
  const summaryContent = document.getElementById(
    'ai-summary-extension-summary-content'
  );
  const summaryDiv = document.getElementById(
    'ai-summary-extension-summary-div'
  );
  const titleBarHeight = 30;
  const footerHeight = 32;
  const padding = 30;
  const maxHeight = window.innerHeight * 0.9;

  const contentHeight = summaryContent.scrollHeight + padding;
  const newHeight = Math.min(
    contentHeight + titleBarHeight + footerHeight,
    maxHeight
  );

  summaryDiv.style.height = newHeight + 'px';
}

function makeDraggable(element, handle) {
  let pos1 = 0,
    pos2 = 0,
    pos3 = 0,
    pos4 = 0;
  handle.onmousedown = dragMouseDown;

  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    element.style.top = element.offsetTop - pos2 + 'px';
    element.style.left = element.offsetLeft - pos1 + 'px';
  }

  function closeDragElement() {
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

function makeResizable(element, content, handle, direction) {
  handle.onmousedown = function (e) {
    e.preventDefault();
    let startX = e.clientX;
    let startY = e.clientY;
    let startWidth = parseInt(
      document.defaultView.getComputedStyle(element).width,
      10
    );
    let startHeight = parseInt(
      document.defaultView.getComputedStyle(element).height,
      10
    );
    let startTop = element.offsetTop;
    let startLeft = element.offsetLeft;

    document.onmousemove = function (e) {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      if (direction.includes('e')) {
        element.style.width = startWidth + dx + 'px';
      }
      if (direction.includes('s')) {
        element.style.height = startHeight + dy + 'px';
      }
      if (direction.includes('w')) {
        element.style.width = startWidth - dx + 'px';
        element.style.left = startLeft + dx + 'px';
      }
      if (direction.includes('n')) {
        element.style.height = startHeight - dy + 'px';
        element.style.top = startTop + dy + 'px';
      }
    };

    document.onmouseup = function () {
      document.onmousemove = null;
      document.onmouseup = null;
    };
  };
}

// Listener for messages from background.js
chrome.runtime.onMessage.addListener(function (request) {
  if (request.action === 'display_inline_summary') {
    chrome.storage.sync.get('theme', function (result) {
      createOrUpdateSummaryDiv(
        request.summary,
        result.theme || 'light',
        request.model,
        request.time,
        request.metrics
      );
    });
  } else if (request.action === 'show_loading_spinner') {
    chrome.storage.sync.get('theme', function (result) {
      createOrUpdateSummaryDiv(null, result.theme || 'light');
    });
  } else if (request.action === 'toggle_summary_visibility') {
    if (summaryDiv) {
      summaryDiv.style.display =
        summaryDiv.style.display === 'none' ? 'flex' : 'none';
      chrome.runtime.sendMessage({
        action: 'update_summary_visibility',
        visible: summaryDiv.style.display !== 'none',
      });
    } else {
      const paragraphs = Array.from(document.querySelectorAll('p')).map(
        (p) => p.textContent
      );
      const pageContent = paragraphs.join('\n');
      chrome.runtime.sendMessage({
        action: 'process_content',
        content: pageContent,
      });
    }
  } else if (request.action === 'model_switched') {
    // Update the model selector if it exists
    const modelSelect = document.getElementById('ai-summary-model-selector');
    if (modelSelect) {
      modelSelect.value = request.model;
    }
  }
});

let summaryDiv = null;
let selectionMode = false; // false = full page, true = selective
let selectedTextRanges = []; // Array to store selected text ranges
let selectionOverlay = null; // Overlay for visual selection feedback

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
      padding-bottom: 32px !important;
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

    // Selection mode toggle
    const selectionToggle = document.createElement('button');
    selectionToggle.id = 'ai-summary-selection-toggle';
    selectionToggle.textContent = 'Select Text';
    selectionToggle.style.cssText = `
      margin-left: 8px !important;
      padding: 2px 6px !important;
      font-size: 11px !important;
      border: 1px solid ${themeColors.borderColor} !important;
      border-radius: 3px !important;
      background-color: ${themeColors.backgroundColor} !important;
      color: ${themeColors.textColor} !important;
      cursor: pointer !important;
      font-family: Arial, sans-serif !important;
    `;
    selectionToggle.addEventListener('click', toggleSelectionMode);

    summaryTitleContainer.appendChild(summaryTitle);
    summaryTitleContainer.appendChild(selectionToggle);

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

    // Enhanced loading container
    const loadingContainer = document.createElement('div');
    loadingContainer.id = 'ai-summary-extension-loading-container';
    loadingContainer.style.cssText = `
      display: none; /* Hidden by default */
      padding: 15px !important;
      text-align: center !important;
      font-family: Arial, sans-serif !important;
      color: ${themeColors.textColor} !important;
    `;

    // Loading spinner
    const loadingSpinner = document.createElement('div');
    loadingSpinner.id = 'ai-summary-extension-loading-spinner';
    loadingSpinner.style.cssText = `
      border: 4px solid #f3f3f3;
      border-top: 4px solid #3498db;
      border-radius: 50%;
      width: 30px;
      height: 30px;
      animation: spin 2s linear infinite;
      margin: 0 auto 10px auto;
    `;
    loadingContainer.appendChild(loadingSpinner);

    // Progress bar container
    const progressContainer = document.createElement('div');
    progressContainer.style.cssText = `
      width: 100% !important;
      height: 8px !important;
      background-color: #e0e0e0 !important;
      border-radius: 4px !important;
      margin-bottom: 10px !important;
      overflow: hidden !important;
    `;

    const progressBar = document.createElement('div');
    progressBar.id = 'ai-summary-extension-progress-bar';
    progressBar.style.cssText = `
      height: 100% !important;
      width: 0% !important;
      background-color: #3498db !important;
      border-radius: 4px !important;
      transition: width 0.3s ease !important;
    `;
    progressContainer.appendChild(progressBar);
    loadingContainer.appendChild(progressContainer);

    // Progress text (percentage and step)
    const progressText = document.createElement('div');
    progressText.id = 'ai-summary-extension-progress-text';
    progressText.style.cssText = `
      font-size: 14px !important;
      font-weight: bold !important;
      margin-bottom: 5px !important;
    `;
    progressText.textContent = 'Initializing...';
    loadingContainer.appendChild(progressText);

    // Model and time info
    const progressDetails = document.createElement('div');
    progressDetails.id = 'ai-summary-extension-progress-details';
    progressDetails.style.cssText = `
      font-size: 12px !important;
      color: ${themeColors.titleColor} !important;
      margin-bottom: 5px !important;
    `;
    progressDetails.textContent = '';
    loadingContainer.appendChild(progressDetails);

    summaryDiv.appendChild(loadingContainer);

    // Manual text input for selection mode
    const manualInputContainer = document.createElement('div');
    manualInputContainer.id = 'ai-summary-manual-input-container';
    manualInputContainer.style.cssText = `
      display: none; /* Hidden by default */
      padding: 10px !important;
      border-top: 1px solid ${themeColors.borderColor} !important;
      background-color: ${themeColors.backgroundColor} !important;
    `;

    const manualInputLabel = document.createElement('div');
    manualInputLabel.textContent = 'Enter text to summarize:';
    manualInputLabel.style.cssText = `
      font-size: 12px !important;
      font-weight: bold !important;
      margin-bottom: 5px !important;
      color: ${themeColors.textColor} !important;
    `;

    const manualInput = document.createElement('textarea');
    manualInput.id = 'ai-summary-manual-input';
    manualInput.placeholder = 'Paste or type the text you want to summarize...';
    manualInput.style.cssText = `
      width: 100% !important;
      height: 80px !important;
      padding: 8px !important;
      border: 1px solid ${themeColors.borderColor} !important;
      border-radius: 4px !important;
      background-color: ${themeColors.backgroundColor} !important;
      color: ${themeColors.textColor} !important;
      font-family: Arial, sans-serif !important;
      font-size: 12px !important;
      resize: vertical !important;
      box-sizing: border-box !important;
    `;

    const manualInputButton = document.createElement('button');
    manualInputButton.textContent = 'Summarize Text';
    manualInputButton.style.cssText = `
      margin-top: 8px !important;
      padding: 6px 12px !important;
      background-color: #4CAF50 !important;
      color: white !important;
      border: none !important;
      border-radius: 4px !important;
      cursor: pointer !important;
      font-size: 12px !important;
      font-family: Arial, sans-serif !important;
    `;
    manualInputButton.addEventListener('click', () => {
      const text = manualInput.value.trim();
      if (text) {
        // Get customization options
        const lengthSelect = document.getElementById(
          'ai-summary-length-selector'
        );
        const focusSelect = document.getElementById(
          'ai-summary-focus-selector'
        );
        const formatSelect = document.getElementById(
          'ai-summary-format-selector'
        );

        const options = {
          length: lengthSelect ? lengthSelect.value : 'medium',
          focus: focusSelect ? focusSelect.value : 'summary',
          format: formatSelect ? formatSelect.value : 'paragraphs',
        };

        chrome.runtime.sendMessage({
          action: 'process_content',
          content: text,
          selectionMode: true,
          options: options,
        });
      }
    });

    manualInputContainer.appendChild(manualInputLabel);
    manualInputContainer.appendChild(manualInput);
    manualInputContainer.appendChild(manualInputButton);

    summaryDiv.appendChild(manualInputContainer);

    summaryDiv.appendChild(summaryContent);

    const footerDiv = document.createElement('div');
    footerDiv.id = 'ai-summary-extension-footer-div';
    footerDiv.style.cssText = `
      position: absolute !important;
      bottom: 0 !important;
      left: 0 !important;
      right: 0 !important;
      height: 32px !important;
      padding: 4px 8px !important;
      font-size: 12px !important;
      color: ${themeColors.titleColor} !important;
      background-color: ${themeColors.borderColor} !important;
      font-family: Arial, sans-serif !important;
      border-top: 1px solid ${themeColors.borderColor} !important;
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      z-index: 100000 !important;
    `;

    // Customization options container
    const customizationContainer = document.createElement('div');
    customizationContainer.id = 'ai-summary-customization-container';
    customizationContainer.style.cssText = `
      display: flex !important;
      align-items: center !important;
      gap: 8px !important;
      margin-right: 8px !important;
      flex-shrink: 0 !important;
    `;

    // Length selector
    const lengthSelect = document.createElement('select');
    lengthSelect.id = 'ai-summary-length-selector';
    lengthSelect.style.cssText = `
      padding: 2px 4px !important;
      font-size: 10px !important;
      border: 1px solid ${themeColors.borderColor} !important;
      border-radius: 3px !important;
      background-color: ${themeColors.backgroundColor} !important;
      color: ${themeColors.textColor} !important;
      width: 80px !important;
    `;
    const lengthOptions = [
      { value: 'short', label: 'Short' },
      { value: 'medium', label: 'Medium' },
      { value: 'long', label: 'Long' },
    ];
    lengthOptions.forEach((option) => {
      const opt = document.createElement('option');
      opt.value = option.value;
      opt.textContent = option.label;
      lengthSelect.appendChild(opt);
    });
    lengthSelect.value = 'medium'; // Default

    // Focus selector
    const focusSelect = document.createElement('select');
    focusSelect.id = 'ai-summary-focus-selector';
    focusSelect.style.cssText = `
      padding: 2px 4px !important;
      font-size: 10px !important;
      border: 1px solid ${themeColors.borderColor} !important;
      border-radius: 3px !important;
      background-color: ${themeColors.backgroundColor} !important;
      color: ${themeColors.textColor} !important;
      width: 100px !important;
    `;
    const focusOptions = [
      { value: 'key-points', label: 'Key Points' },
      { value: 'summary', label: 'Summary' },
      { value: 'details', label: 'Details' },
    ];
    focusOptions.forEach((option) => {
      const opt = document.createElement('option');
      opt.value = option.value;
      opt.textContent = option.label;
      focusSelect.appendChild(opt);
    });
    focusSelect.value = 'summary'; // Default

    // Format selector
    const formatSelect = document.createElement('select');
    formatSelect.id = 'ai-summary-format-selector';
    formatSelect.style.cssText = `
      padding: 2px 4px !important;
      font-size: 10px !important;
      border: 1px solid ${themeColors.borderColor} !important;
      border-radius: 3px !important;
      background-color: ${themeColors.backgroundColor} !important;
      color: ${themeColors.textColor} !important;
      width: 90px !important;
    `;
    const formatOptions = [
      { value: 'paragraphs', label: 'Paragraphs' },
      { value: 'bullets', label: 'Bullets' },
      { value: 'concise', label: 'Concise' },
    ];
    formatOptions.forEach((option) => {
      const opt = document.createElement('option');
      opt.value = option.value;
      opt.textContent = option.label;
      formatSelect.appendChild(opt);
    });
    formatSelect.value = 'paragraphs'; // Default

    customizationContainer.appendChild(lengthSelect);
    customizationContainer.appendChild(focusSelect);
    customizationContainer.appendChild(formatSelect);

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
      const loadingContainer = document.getElementById(
        'ai-summary-extension-loading-container'
      );

      if (summaryContent) {
        summaryContent.innerHTML = '';
        summaryContent.style.display = 'none';
      }
      if (statusText) {
        statusText.textContent = 'Regenerating...';
      }
      if (loadingContainer) {
        loadingContainer.style.display = 'block';
      }

      // Extract page content based on selection mode
      let pageContent = '';
      if (selectionMode && selectedTextRanges.length > 0) {
        // Use selected text
        pageContent = selectedTextRanges.map((sel) => sel.text).join('\n\n');
      } else if (selectionMode) {
        // In selection mode but no selections made
        if (statusText) {
          statusText.textContent =
            'No text selected. Please select text on the page first.';
        }
        if (loadingContainer) {
          loadingContainer.style.display = 'none';
        }
        showSelectionError(
          'No text selected. Please highlight some text on the page to summarize.'
        );
        return;
      } else {
        // Use full page content
        const paragraphs = Array.from(document.querySelectorAll('p')).map(
          (p) => p.textContent
        );
        pageContent = paragraphs.join('\n');
      }

      // Validate content
      if (!pageContent.trim() || pageContent.trim().length < 50) {
        if (statusText) {
          statusText.textContent = selectionMode
            ? 'Selected text too short. Please select more content.'
            : 'Page content too short to summarize.';
        }
        if (loadingContainer) {
          loadingContainer.style.display = 'none';
        }
        showSelectionError(
          selectionMode
            ? 'Selected text too short. Please select more content.'
            : 'Page content too short to summarize.'
        );
        return;
      }

      // Get customization options
      const lengthSelect = document.getElementById(
        'ai-summary-length-selector'
      );
      const focusSelect = document.getElementById('ai-summary-focus-selector');
      const formatSelect = document.getElementById(
        'ai-summary-format-selector'
      );

      const options = {
        length: lengthSelect ? lengthSelect.value : 'medium',
        focus: focusSelect ? focusSelect.value : 'summary',
        format: formatSelect ? formatSelect.value : 'paragraphs',
      };

      chrome.runtime.sendMessage({
        action: 'process_content',
        content: pageContent,
        forceModel: newModel, // Force the specific model for regeneration
        selectionMode: selectionMode, // Pass selection mode info
        options: options, // Pass customization options
      });
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

    footerDiv.appendChild(customizationContainer);
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

  const loadingContainer = document.getElementById(
    'ai-summary-extension-loading-container'
  );
  const summaryContent = document.getElementById(
    'ai-summary-extension-summary-content'
  );

  if (summaryText === null) {
    // Show loading container, hide content
    if (loadingContainer) loadingContainer.style.display = 'block';
    if (summaryContent) summaryContent.style.display = 'none';
    // Clear status text
    const statusText = document.getElementById('ai-summary-status-text');
    if (statusText) statusText.textContent = '';
    summaryDiv.style.display = 'flex';
  } else {
    // Hide loading container, show content
    if (loadingContainer) loadingContainer.style.display = 'none';
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

// Toggle between full page and selective summarization modes
function toggleSelectionMode() {
  selectionMode = !selectionMode;
  const toggleButton = document.getElementById('ai-summary-selection-toggle');
  const manualInputContainer = document.getElementById(
    'ai-summary-manual-input-container'
  );

  if (selectionMode) {
    toggleButton.textContent = 'Full Page';
    toggleButton.style.backgroundColor = '#4CAF50';
    toggleButton.style.color = 'white';
    if (manualInputContainer) manualInputContainer.style.display = 'block';
    enableTextSelection();
    showSelectionInstructions();
  } else {
    toggleButton.textContent = 'Select Text';
    toggleButton.style.backgroundColor = '';
    toggleButton.style.color = '';
    if (manualInputContainer) manualInputContainer.style.display = 'none';
    disableTextSelection();
    hideSelectionInstructions();
    clearSelections();
  }
}

// Enable text selection on the page
function enableTextSelection() {
  document.body.style.userSelect = 'text';
  document.body.style.cursor = 'text';
  document.addEventListener('mouseup', handleTextSelection);
  document.addEventListener('dblclick', handleTextSelection);
}

// Disable text selection on the page
function disableTextSelection() {
  document.body.style.userSelect = '';
  document.body.style.cursor = '';
  document.removeEventListener('mouseup', handleTextSelection);
  document.removeEventListener('dblclick', handleTextSelection);
}

// Handle text selection events
function handleTextSelection() {
  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    const selectedText = selection.toString().trim();

    if (selectedText.length > 0) {
      // Validate selection - ensure it's not just whitespace or too short
      if (selectedText.length < 10) {
        showSelectionError('Selection too short. Please select more text.');
        return;
      }

      // Check if selection contains actual content (not just HTML elements)
      const textNodes = getTextNodesInRange(range);
      if (textNodes.length === 0) {
        showSelectionError('No readable text found in selection.');
        return;
      }

      addTextSelection(range, selectedText);
    } else {
      showSelectionError(
        'No text selected. Please highlight some text on the page.'
      );
    }
  }
}

// Get text nodes within a range
function getTextNodesInRange(range) {
  const textNodes = [];
  const treeWalker = document.createTreeWalker(
    range.commonAncestorContainer,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function (node) {
        const nodeRange = document.createRange();
        nodeRange.selectNodeContents(node);
        if (range.intersectsNode(node) && node.textContent.trim().length > 0) {
          return NodeFilter.FILTER_ACCEPT;
        }
        return NodeFilter.FILTER_REJECT;
      },
    }
  );

  let node;
  while ((node = treeWalker.nextNode())) {
    textNodes.push(node);
  }

  return textNodes;
}

// Show selection error message
function showSelectionError(message) {
  // Remove existing error
  const existingError = document.getElementById('ai-summary-selection-error');
  if (existingError) {
    existingError.remove();
  }

  const errorDiv = document.createElement('div');
  errorDiv.id = 'ai-summary-selection-error';
  errorDiv.style.cssText = `
    position: fixed !important;
    top: 60px !important;
    right: 320px !important;
    background-color: #ff4444 !important;
    color: white !important;
    padding: 8px 12px !important;
    border-radius: 4px !important;
    font-family: Arial, sans-serif !important;
    font-size: 12px !important;
    z-index: 99999 !important;
    max-width: 300px !important;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3) !important;
  `;
  errorDiv.textContent = message;

  document.body.appendChild(errorDiv);

  // Auto-hide after 3 seconds
  setTimeout(() => {
    if (errorDiv.parentNode) {
      errorDiv.remove();
    }
  }, 3000);
}

// Add a text selection to the collection
function addTextSelection(range, text) {
  const selectionRect = range.getBoundingClientRect();
  const selectionData = {
    text: text,
    range: range,
    rect: selectionRect,
    timestamp: Date.now(),
  };

  selectedTextRanges.push(selectionData);
  updateSelectionVisualFeedback();
}

// Clear all selections
function clearSelections() {
  selectedTextRanges = [];
  updateSelectionVisualFeedback();
}

// Update visual feedback for selections
function updateSelectionVisualFeedback() {
  // Remove existing overlay
  if (selectionOverlay) {
    selectionOverlay.remove();
    selectionOverlay = null;
  }

  if (selectedTextRanges.length > 0) {
    createSelectionOverlay();
  }
}

// Create visual overlay for selections
function createSelectionOverlay() {
  selectionOverlay = document.createElement('div');
  selectionOverlay.id = 'ai-summary-selection-overlay';
  selectionOverlay.style.cssText = `
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100% !important;
    height: 100% !important;
    pointer-events: none !important;
    z-index: 99998 !important;
  `;

  selectedTextRanges.forEach((selection, index) => {
    const highlight = document.createElement('div');
    highlight.className = 'selection-highlight';
    highlight.style.cssText = `
      position: absolute !important;
      top: ${selection.rect.top + window.scrollY}px !important;
      left: ${selection.rect.left + window.scrollX}px !important;
      width: ${selection.rect.width}px !important;
      height: ${selection.rect.height}px !important;
      background-color: rgba(255, 255, 0, 0.3) !important;
      border: 2px solid #ff6b35 !important;
      border-radius: 3px !important;
      pointer-events: none !important;
    `;

    // Add remove button
    const removeButton = document.createElement('div');
    removeButton.textContent = '×';
    removeButton.style.cssText = `
      position: absolute !important;
      top: -8px !important;
      right: -8px !important;
      width: 16px !important;
      height: 16px !important;
      background-color: #ff6b35 !important;
      color: white !important;
      border-radius: 50% !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      font-size: 12px !important;
      font-weight: bold !important;
      cursor: pointer !important;
      pointer-events: auto !important;
    `;
    removeButton.addEventListener('click', () => {
      selectedTextRanges.splice(index, 1);
      updateSelectionVisualFeedback();
    });

    highlight.appendChild(removeButton);
    selectionOverlay.appendChild(highlight);
  });

  document.body.appendChild(selectionOverlay);
}

// Show instructions for text selection
function showSelectionInstructions() {
  const instructions = document.createElement('div');
  instructions.id = 'ai-summary-selection-instructions';
  instructions.style.cssText = `
    position: fixed !important;
    top: 50px !important;
    right: 320px !important;
    background-color: #333 !important;
    color: white !important;
    padding: 10px 15px !important;
    border-radius: 5px !important;
    font-family: Arial, sans-serif !important;
    font-size: 12px !important;
    z-index: 99999 !important;
    max-width: 250px !important;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3) !important;
  `;
  instructions.innerHTML = `
    <strong>Selection Mode Active</strong><br>
    • Drag to select text<br>
    • Double-click for word selection<br>
    • Click × to remove selections<br>
    • Switch back to summarize selected text
  `;

  document.body.appendChild(instructions);

  // Auto-hide after 5 seconds
  setTimeout(() => {
    if (instructions.parentNode) {
      instructions.remove();
    }
  }, 5000);
}

// Hide selection instructions
function hideSelectionInstructions() {
  const instructions = document.getElementById(
    'ai-summary-selection-instructions'
  );
  if (instructions) {
    instructions.remove();
  }
}

// Function to update loading progress display
function updateLoadingProgress(progress) {
  const progressBar = document.getElementById(
    'ai-summary-extension-progress-bar'
  );
  const progressText = document.getElementById(
    'ai-summary-extension-progress-text'
  );
  const progressDetails = document.getElementById(
    'ai-summary-extension-progress-details'
  );

  if (progressBar && progressText && progressDetails) {
    // Update progress bar
    progressBar.style.width = `${progress.percentage}%`;

    // Update progress text
    progressText.textContent = `${progress.step} (${progress.percentage}%)`;

    // Update details
    const modelName = getModelDisplayName(progress.currentModel);
    let detailsText = `Using ${modelName}`;
    if (progress.estimatedTimeRemaining > 0) {
      const timeText =
        progress.estimatedTimeRemaining < 1
          ? '< 1s'
          : `${Math.ceil(progress.estimatedTimeRemaining)}s`;
      detailsText += ` • ~${timeText} remaining`;
    }
    if (progress.success === false) {
      detailsText += ' (failed, trying alternatives)';
    } else if (progress.success === true) {
      detailsText += ' (success)';
    }
    progressDetails.textContent = detailsText;
  }
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
  } else if (request.action === 'update_loading_progress') {
    updateLoadingProgress(request.progress);
  } else if (request.action === 'toggle_summary_visibility') {
    if (summaryDiv) {
      summaryDiv.style.display =
        summaryDiv.style.display === 'none' ? 'flex' : 'none';
      chrome.runtime.sendMessage({
        action: 'update_summary_visibility',
        visible: summaryDiv.style.display !== 'none',
      });
    } else {
      // Extract page content based on selection mode
      let pageContent = '';
      if (selectionMode && selectedTextRanges.length > 0) {
        // Use selected text
        pageContent = selectedTextRanges.map((sel) => sel.text).join('\n\n');
      } else if (selectionMode) {
        // In selection mode but no selections made
        const statusText = document.getElementById('ai-summary-status-text');
        if (statusText) {
          statusText.textContent =
            'No text selected. Please select text on the page first.';
        }
        showSelectionError(
          'No text selected. Please highlight some text on the page to summarize.'
        );
        return;
      } else {
        // Use full page content
        const paragraphs = Array.from(document.querySelectorAll('p')).map(
          (p) => p.textContent
        );
        pageContent = paragraphs.join('\n');
      }

      // Validate content
      if (!pageContent.trim() || pageContent.trim().length < 50) {
        const statusText = document.getElementById('ai-summary-status-text');
        if (statusText) {
          statusText.textContent = selectionMode
            ? 'Selected text too short. Please select more content.'
            : 'Page content too short to summarize.';
        }
        showSelectionError(
          selectionMode
            ? 'Selected text too short. Please select more content.'
            : 'Page content too short to summarize.'
        );
        return;
      }

      // Get customization options
      const lengthSelect = document.getElementById(
        'ai-summary-length-selector'
      );
      const focusSelect = document.getElementById('ai-summary-focus-selector');
      const formatSelect = document.getElementById(
        'ai-summary-format-selector'
      );

      const options = {
        length: lengthSelect ? lengthSelect.value : 'medium',
        focus: focusSelect ? focusSelect.value : 'summary',
        format: formatSelect ? formatSelect.value : 'paragraphs',
      };

      chrome.runtime.sendMessage({
        action: 'process_content',
        content: pageContent,
        selectionMode: selectionMode,
        options: options,
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

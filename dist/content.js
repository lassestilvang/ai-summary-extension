"use strict";
// Browser compatibility functions
function getChromeVersion() {
    const userAgent = navigator?.userAgent;
    if (!userAgent)
        return 0;
    const chromeMatch = userAgent.match(/Chrome\/(\d+)/);
    return chromeMatch ? parseInt(chromeMatch[1]) : 0;
}
async function isSummarizerAvailable() {
    if (!globalThis || !('Summarizer' in globalThis)) {
        return false;
    }
    try {
        const availability = await globalThis.Summarizer.availability();
        return availability === 'available';
    }
    catch {
        return false;
    }
}
async function checkChromeBuiltinSupport() {
    const version = getChromeVersion();
    const apiAvailable = await isSummarizerAvailable();
    return version >= 138 && apiAvailable;
}
(function () {
    if (globalThis.aiSummaryExtensionLoaded)
        return;
    globalThis.aiSummaryExtensionLoaded = true;
    // Inject required libraries
    const readabilityScript = document.createElement('script');
    readabilityScript.src = chrome.runtime.getURL('Readability.js');
    document.head.appendChild(readabilityScript);
    const showdownScript = document.createElement('script');
    showdownScript.src = chrome.runtime.getURL('showdown.min.js');
    document.head.appendChild(showdownScript);
    // Function to extract page content using multiple strategies
    function extractPageContent() {
        // Strategy 1: Try Readability.js for article parsing
        try {
            // Create a proper clone of the document to avoid modifying the original page
            const documentClone = document.cloneNode(true);
            const reader = new Readability(documentClone);
            const article = reader.parse();
            if (article &&
                article.textContent &&
                article.textContent.trim().length > 100) {
                return article.textContent.trim();
            }
        }
        catch (error) {
            console.log('Readability extraction failed:', error);
        }
        // Strategy 2: Expanded element selection
        const contentSelectors = 'p, h1, h2, h3, h4, h5, h6, li, blockquote, article, section, main, div[role="main"]';
        const elements = Array.from(document.querySelectorAll(contentSelectors));
        // Filter and extract text, removing duplicates and short fragments
        const extractedTexts = elements
            .map((el) => el.textContent?.trim())
            .filter((text) => text && text.length > 10)
            .filter((text, index, arr) => arr.indexOf(text) === index); // Remove duplicates
        let pageContent = extractedTexts.join('\n');
        // Strategy 3: Fallback to body text with filtering
        if (pageContent.trim().length < 100) {
            const bodyText = document.body.textContent || '';
            const excludedSelectors = 'nav, footer, aside, .ad, .sidebar, .menu, .header, .footer, script, style, #ai-summary-extension-summary-div, #ai-summary-extension-loading-container, #ai-summary-extension-footer-div';
            const excludedElements = Array.from(document.querySelectorAll(excludedSelectors));
            let filteredText = bodyText;
            excludedElements.forEach((el) => {
                const elText = el.textContent || '';
                filteredText = filteredText.replace(elText, '');
            });
            pageContent = filteredText.trim();
        }
        return pageContent;
    }
    // Check if any models are available besides chrome-builtin
    async function hasAlternativeModels(apiKeys) {
        const alternativeModels = [
            'gpt-3.5-turbo',
            'gpt-4',
            'gpt-4-turbo',
            'gpt-4o',
            'gemini-1.5-pro',
            'gemini-1.5-flash',
            'gemini-2.0-flash-exp',
            'claude-3-haiku',
            'claude-3-sonnet',
            'claude-3-opus',
            'claude-3.5-sonnet',
        ];
        for (const model of alternativeModels) {
            if (await contentIsModelAvailable(model, apiKeys)) {
                return true;
            }
        }
        return false;
    }
    // Inline utility function to check if a model is available
    async function contentIsModelAvailable(model, apiKeys) {
        const config = getModelConfig(model);
        if (!config)
            return false;
        switch (config.provider) {
            case 'chrome':
                return await checkChromeBuiltinSupport();
            case 'openai':
                return !!(apiKeys.openaiApiKey && apiKeys.openaiApiKey.trim() !== '');
            case 'gemini':
                return !!(apiKeys.geminiApiKey && apiKeys.geminiApiKey.trim() !== '');
            case 'anthropic':
                return !!(apiKeys.anthropicApiKey && apiKeys.anthropicApiKey.trim() !== '');
            default:
                return false;
        }
    }
    let summaryDiv = null;
    let progressAnimationId = null;
    const contentThemes = {
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
    function getModelDisplayName(model) {
        const modelConfig = getModelConfig(model);
        return modelConfig ? modelConfig.name : model;
    }
    function startProgressAnimation() {
        if (progressAnimationId)
            return;
        const progressBar = document.getElementById('ai-summary-extension-progress-bar');
        if (!progressBar)
            return;
        const startTime = Date.now();
        const duration = 10000; // 10 seconds for smoother, longer animation
        function animate() {
            if (!progressBar)
                return;
            const elapsed = Date.now() - startTime;
            const t = Math.min(elapsed / duration, 1); // 0 to 1
            const easedT = 1 - Math.pow(1 - t, 3); // ease-out cubic for gradual slowdown
            const width = easedT * 100;
            progressBar.style.width = `${width}%`;
            if (t < 1) {
                progressAnimationId = requestAnimationFrame(animate);
            }
            else {
                progressAnimationId = null;
            }
        }
        progressBar.style.width = '0%';
        progressAnimationId = requestAnimationFrame(animate);
    }
    function stopProgressAnimation() {
        if (progressAnimationId) {
            cancelAnimationFrame(progressAnimationId);
            progressAnimationId = null;
        }
    }
    function createOrUpdateSummaryDiv(summaryText, theme, fontFamily, fontSize, fontStyle, model, time, metrics) {
        const themeColors = contentThemes[theme]?.colors || contentThemes.light.colors;
        if (!summaryDiv) {
            summaryDiv = document.createElement('div');
            summaryDiv.id = 'ai-summary-extension-summary-div';
            summaryDiv.style.cssText = `
      position: fixed !important;
      top: 10px !important;
      right: 10px !important;
      width: 400px !important;
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
      font-family: sans-serif;
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
                if (summaryDiv) {
                    summaryDiv.style.display = 'none';
                }
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
            const originalSize = { height: '' };
            minimizeButton.addEventListener('click', () => {
                const footerDiv = document.getElementById('ai-summary-extension-footer-div');
                if (isMinimized) {
                    summaryDiv.style.height = originalSize.height;
                    const summaryContent = document.getElementById('ai-summary-extension-summary-content');
                    if (summaryContent)
                        summaryContent.style.display = 'block';
                    if (footerDiv)
                        footerDiv.style.display = 'flex';
                    isMinimized = false;
                }
                else {
                    originalSize.height = summaryDiv.style.height;
                    summaryDiv.style.height = '30px';
                    const summaryContent = document.getElementById('ai-summary-extension-summary-content');
                    if (summaryContent)
                        summaryContent.style.display = 'none';
                    if (footerDiv)
                        footerDiv.style.display = 'none';
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
            let originalSizeMax = { width: '', height: '', top: '', left: '' };
            maximizeButton.addEventListener('click', () => {
                if (isMaximized) {
                    summaryDiv.style.width = originalSizeMax.width;
                    summaryDiv.style.height = originalSizeMax.height;
                    summaryDiv.style.top = originalSizeMax.top;
                    summaryDiv.style.left = originalSizeMax.left;
                    isMaximized = false;
                }
                else {
                    originalSizeMax = {
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
                    const summaryContent = document.getElementById('ai-summary-extension-summary-content');
                    if (summaryContent)
                        summaryContent.style.display = 'block';
                    isMinimized = false;
                    const footerDiv = document.getElementById('ai-summary-extension-footer-div');
                    if (footerDiv)
                        footerDiv.style.display = 'flex';
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
            summaryTitle.textContent = 'AI Summary';
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
                const summaryContent = document.getElementById('ai-summary-extension-summary-content');
                if (summaryContent) {
                    navigator.clipboard.writeText(summaryContent.textContent || '');
                }
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
                const summaryContent = document.getElementById('ai-summary-extension-summary-content');
                if (summaryContent && navigator.share) {
                    navigator
                        .share({
                        title: document.title,
                        text: summaryContent.textContent || '',
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
      font-family: ${fontFamily}, sans-serif !important;
      font-size: ${fontSize}px !important;
      font-weight: ${fontStyle === 'bold' ? 'bold' : 'normal'} !important;
      font-style: ${fontStyle === 'italic' ? 'italic' : 'normal'} !important;
      color: ${themeColors.textColor} !important;
      background-color: ${themeColors.backgroundColor} !important;
      text-align: left;
    `;
            const style = document.createElement('style');
            style.textContent = `
      .resize-handle-n { top: -10px; left: 50%; transform: translateX(-50%); cursor: n-resize; }
      .resize-handle-ne { top: -10px; right: -10px; cursor: ne-resize; }
      .resize-handle-e { top: 50%; right: -10px; transform: translateY(-50%); cursor: e-resize; }
      .resize-handle-se { bottom: -10px; right: -10px; cursor: se-resize; }
      .resize-handle-s { bottom: -10px; left: 50%; transform: translateX(-50%); cursor: s-resize; }
      .resize-handle-sw { bottom: -10px; left: -10px; cursor: sw-resize; }
      .resize-handle-w { top: 50%; left: -10px; transform: translateY(-50%); cursor: w-resize; }
      .resize-handle-nw { top: -10px; left: -10px; cursor: nw-resize; }

      #ai-summary-extension-summary-content ul, #ai-summary-extension-summary-content ol {
        list-style: initial;
        padding-left: 13px;
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
            // Resize handles
            const directions = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];
            directions.forEach((dir) => {
                const handle = document.createElement('div');
                handle.className = `resize-handle-${dir}`;
                handle.style.cssText = `
        position: absolute;
        width: 20px;
        height: 20px;
        z-index: 100001;
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
      font-family: ${fontFamily}, sans-serif !important;
      font-size: ${fontSize}px !important;
      font-weight: ${fontStyle === 'bold' ? 'bold' : 'normal'} !important;
      font-style: ${fontStyle === 'italic' ? 'italic' : 'normal'} !important;
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
      margin-bottom: 10px !important;
    `;
            progressDetails.textContent = '';
            loadingContainer.appendChild(progressDetails);
            // Progress bar container
            const progressContainer = document.createElement('div');
            progressContainer.style.cssText = `
      width: 100% !important;
      height: 8px !important;
      background-color: #e0e0e0 !important;
      border-radius: 4px !important;
      overflow: hidden !important;
    `;
            const progressBar = document.createElement('div');
            progressBar.id = 'ai-summary-extension-progress-bar';
            progressBar.style.cssText = `
      height: 100% !important;
      width: 0% !important;
      background-color: #3498db !important;
      border-radius: 4px !important;
    `;
            progressContainer.appendChild(progressBar);
            loadingContainer.appendChild(progressContainer);
            summaryDiv.appendChild(loadingContainer);
            summaryDiv.appendChild(summaryContent);
            const footerDiv = document.createElement('div');
            footerDiv.id = 'ai-summary-extension-footer-div';
            footerDiv.style.cssText = `
      position: absolute !important;
      bottom: 0 !important;
      left: 0 !important;
      right: 0 !important;
      height: 32px !important;
      padding: 0px 8px !important;
      font-family: Arial, sans-serif !important;
      font-size: 12px !important;
      color: ${themeColors.titleColor} !important;
      background-color: ${themeColors.borderColor} !important;
      border-top: 1px solid ${themeColors.borderColor} !important;
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      z-index: 100000 !important;
    `;
            // Model selector in footer
            const modelSelect = document.createElement('select');
            modelSelect.id = 'ai-summary-model-selector';
            modelSelect.style.cssText = `
      padding: 2px 4px !important;
      font-family: Arial, sans-serif !important;
      font-size: 11px !important;
      border: 1px solid ${themeColors.borderColor} !important;
      border-radius: 3px !important;
      background-color: ${themeColors.backgroundColor} !important;
      color: ${themeColors.textColor} !important;
      max-width: 140px !important;
      flex-shrink: 0 !important;
    `;
            // Populate model selector with API key availability check
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
            // Get API keys to check availability
            chrome.storage.sync.get(['openaiApiKey', 'geminiApiKey', 'anthropicApiKey'], async (result) => {
                const apiKeys = {
                    openaiApiKey: result.openaiApiKey || '',
                    geminiApiKey: result.geminiApiKey || '',
                    anthropicApiKey: result.anthropicApiKey || '',
                };
                const availableModels = [];
                for (const option of modelOptions) {
                    const opt = document.createElement('option');
                    opt.value = option.value;
                    opt.textContent = option.label;
                    // Check if model is available based on API keys
                    const isAvailable = await contentIsModelAvailable(option.value, apiKeys);
                    if (isAvailable) {
                        availableModels.push(option.value);
                    }
                    else {
                        opt.disabled = true;
                        opt.style.opacity = '0.5';
                        opt.title = 'API key required - configure in settings';
                    }
                    modelSelect.appendChild(opt);
                }
                // Load current selected model
                chrome.storage.sync.get('selectedModel', (result) => {
                    let selectedModel = result.selectedModel;
                    if (!selectedModel || !availableModels.includes(selectedModel)) {
                        selectedModel = availableModels[0] || '';
                    }
                    if (selectedModel) {
                        modelSelect.value = selectedModel;
                    }
                });
            });
            // Handle model change - trigger automatic regeneration
            modelSelect.addEventListener('change', async () => {
                const newModel = modelSelect.value;
                // Get API keys for availability check
                const apiKeysResult = await new Promise((resolve) => {
                    chrome.storage.sync.get(['openaiApiKey', 'geminiApiKey', 'anthropicApiKey'], resolve);
                });
                const apiKeys = {
                    openaiApiKey: apiKeysResult.openaiApiKey || '',
                    geminiApiKey: apiKeysResult.geminiApiKey || '',
                    anthropicApiKey: apiKeysResult.anthropicApiKey || '',
                };
                // Special handling for chrome-builtin selection
                if (newModel === 'chrome-builtin') {
                    const isSupported = await checkChromeBuiltinSupport();
                    if (!isSupported) {
                        const hasAlternatives = await hasAlternativeModels(apiKeys);
                        if (!hasAlternatives) {
                            // No alternatives available
                            const summaryContent = document.getElementById('ai-summary-extension-summary-content');
                            const loadingContainer = document.getElementById('ai-summary-extension-loading-container');
                            if (summaryContent) {
                                summaryContent.innerHTML = `
                  <div style="color: #ff6b6b; text-align: center; padding: 20px;">
                    <h3>AI Summarization Unavailable</h3>
                    <p>Chrome Built-in AI requires Chrome 138+ and API support.</p>
                    <p>No alternative models are configured. Please configure API keys in settings.</p>
                    <button onclick="chrome.runtime.sendMessage({action: 'open_options_page'})" style="padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">Open Settings</button>
                  </div>
                `;
                                summaryContent.style.display = 'block';
                            }
                            if (loadingContainer)
                                loadingContainer.style.display = 'none';
                            return;
                        }
                        else {
                            // Show requirements info
                            alert('Chrome Built-in AI requires:\n• Chrome version 138 or higher\n• Summarizer API support\n\nSince this is not available, consider using alternative models like GPT-3.5 Turbo or Gemini.');
                            // Don't proceed with regeneration, let user choose alternative
                            return;
                        }
                    }
                }
                // Update stored preference
                chrome.runtime.sendMessage({
                    action: 'switch_model',
                    model: newModel,
                });
                // Clear existing content and show loading state
                const summaryContent = document.getElementById('ai-summary-extension-summary-content');
                const statusText = document.getElementById('ai-summary-status-text');
                const loadingContainer = document.getElementById('ai-summary-extension-loading-container');
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
                // Extract page content and regenerate summary
                const pageContent = extractPageContent();
                if (pageContent.trim()) {
                    isGeneratingSummary = true;
                    chrome.runtime.sendMessage({
                        action: 'process_content',
                        content: pageContent,
                        forceModel: newModel, // Force the specific model for regeneration
                    });
                }
                else {
                    // Handle case where no content is available
                    if (statusText) {
                        statusText.textContent = 'No content available to summarize';
                    }
                    if (loadingContainer) {
                        loadingContainer.style.display = 'none';
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
      font-family: Arial, sans-serif !important;
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
        const loadingContainer = document.getElementById('ai-summary-extension-loading-container');
        const summaryContent = document.getElementById('ai-summary-extension-summary-content');
        if (summaryText === null) {
            // Show loading container, hide content
            if (loadingContainer)
                loadingContainer.style.display = 'block';
            if (summaryContent)
                summaryContent.style.display = 'none';
            // Clear status text
            const statusText = document.getElementById('ai-summary-status-text');
            if (statusText)
                statusText.textContent = '';
            if (summaryDiv)
                summaryDiv.style.display = 'flex';
            startProgressAnimation();
        }
        else {
            // Hide loading container, show content
            if (loadingContainer)
                loadingContainer.style.display = 'none';
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
            if (summaryDiv)
                summaryDiv.style.display = 'flex';
            stopProgressAnimation();
            adjustHeight();
        }
    }
    function adjustHeight() {
        const summaryContent = document.getElementById('ai-summary-extension-summary-content');
        const summaryDiv = document.getElementById('ai-summary-extension-summary-div');
        const titleBarHeight = 30;
        const footerHeight = 32;
        const padding = 30;
        const maxHeight = window.innerHeight * 0.9;
        if (summaryContent && summaryDiv) {
            const contentHeight = summaryContent.scrollHeight + padding;
            const newHeight = Math.min(contentHeight + titleBarHeight + footerHeight, maxHeight);
            summaryDiv.style.height = newHeight + 'px';
        }
    }
    function makeDraggable(element, handle) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
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
            const startX = e.clientX;
            const startY = e.clientY;
            const startWidth = parseInt(document.defaultView.getComputedStyle(element).width, 10);
            const startHeight = parseInt(document.defaultView.getComputedStyle(element).height, 10);
            const startTop = element.offsetTop;
            const startLeft = element.offsetLeft;
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
    // Function to update loading progress display
    function updateLoadingProgress(progress) {
        const progressBar = document.getElementById('ai-summary-extension-progress-bar');
        const progressText = document.getElementById('ai-summary-extension-progress-text');
        const progressDetails = document.getElementById('ai-summary-extension-progress-details');
        if (progressBar && progressText && progressDetails) {
            // Update progress bar if new percentage is higher
            const currentWidth = parseFloat(progressBar.style.width || '0');
            if (progress.percentage > currentWidth) {
                progressBar.style.width = `${progress.percentage}%`;
            }
            // Update progress text
            progressText.textContent = `${progress.step} (${progress.percentage}%)`;
            // Update details
            const modelName = getModelDisplayName(progress.currentModel);
            let detailsText = `Using ${modelName}`;
            if (progress.estimatedTimeRemaining > 0) {
                const timeText = progress.estimatedTimeRemaining < 1
                    ? '< 1s'
                    : `${Math.ceil(progress.estimatedTimeRemaining)}s`;
                detailsText += ` • ~${timeText} remaining`;
            }
            if (progress.success === false) {
                detailsText += ' (failed, trying alternatives)';
            }
            else if (progress.success === true) {
                detailsText += ' (success)';
            }
            progressDetails.textContent = detailsText;
        }
    }
    // Handle dynamic content with MutationObserver
    let contentObserver = null;
    let lastContentLength = 0;
    let isGeneratingSummary = false; // Flag to prevent re-summarization during generation
    function setupContentObserver() {
        if (contentObserver)
            return;
        contentObserver = new MutationObserver((mutations) => {
            let hasSignificantChange = false;
            mutations.forEach((mutation) => {
                // Skip mutations that involve our extension elements
                const extensionSelectors = [
                    '#ai-summary-extension-summary-div',
                    '#ai-summary-extension-loading-container',
                    '#ai-summary-extension-footer-div',
                    '#ai-summary-extension-progress-bar',
                    '#ai-summary-extension-progress-text',
                    '#ai-summary-extension-progress-details',
                    '#ai-summary-extension-summary-content',
                    '#ai-summary-model-selector',
                    '#ai-summary-status-text',
                ];
                let skipMutation = false;
                if (mutation.type === 'childList') {
                    // Check added nodes
                    if (mutation.addedNodes.length > 0) {
                        mutation.addedNodes.forEach((node) => {
                            if (node.nodeType === Node.ELEMENT_NODE) {
                                const element = node;
                                if (extensionSelectors.some((selector) => element.matches && element.matches(selector))) {
                                    skipMutation = true;
                                }
                                // Also check all descendants
                                if (element.querySelector &&
                                    element.querySelector(extensionSelectors.join(','))) {
                                    skipMutation = true;
                                }
                            }
                        });
                    }
                    // Check target element
                    if (mutation.target &&
                        extensionSelectors.some((selector) => mutation.target.matches &&
                            mutation.target.matches(selector))) {
                        skipMutation = true;
                    }
                }
                if (!skipMutation) {
                    hasSignificantChange = true;
                }
            });
            if (hasSignificantChange) {
                // Debounce content re-extraction
                setTimeout(() => {
                    const newContent = extractPageContent();
                    const lengthDiff = Math.abs(newContent.length - lastContentLength);
                    if (lengthDiff > 50) {
                        // Significant change
                        lastContentLength = newContent.length;
                        // Optionally, trigger re-summarization if summary is visible AND not currently generating
                        if (summaryDiv &&
                            summaryDiv.style.display !== 'none' &&
                            !isGeneratingSummary) {
                            chrome.runtime.sendMessage({
                                action: 'process_content',
                                content: newContent,
                            });
                        }
                    }
                }, 2000); // Wait 2 seconds after changes
            }
        });
        contentObserver.observe(document.body, {
            childList: true,
            subtree: true,
        });
    }
    // Initialize observer when content script loads
    setupContentObserver();
    // Listener for messages from background.js
    chrome.runtime.onMessage.addListener(function (request) {
        if (!request || !request.action)
            return;
        if (request.action === 'display_inline_summary') {
            isGeneratingSummary = false;
            chrome.storage.sync.get(['theme', 'fontFamily', 'fontSize', 'fontStyle'], function (result) {
                createOrUpdateSummaryDiv(request.summary, result.theme || 'nord', result.fontFamily || 'Arial', result.fontSize || 14, result.fontStyle || 'normal', request.model, request.time, request.metrics);
            });
        }
        else if (request.action === 'show_loading_spinner') {
            chrome.storage.sync.get(['theme', 'fontFamily', 'fontSize', 'fontStyle'], function (result) {
                createOrUpdateSummaryDiv(null, result.theme || 'nord', result.fontFamily || 'Arial', result.fontSize || 14, result.fontStyle || 'normal');
            });
        }
        else if (request.action === 'update_loading_progress') {
            updateLoadingProgress(request.progress);
        }
        else if (request.action === 'toggle_summary_visibility') {
            if (request.hasSummary) {
                // Toggle visibility of existing summary
                if (summaryDiv && summaryDiv.style.display !== 'none') {
                    summaryDiv.style.display = 'none';
                    chrome.runtime.sendMessage({
                        action: 'update_summary_visibility',
                        visible: false,
                    });
                }
                else {
                    // Show existing summary
                    chrome.storage.sync.get(['theme', 'fontFamily', 'fontSize', 'fontStyle'], function (result) {
                        createOrUpdateSummaryDiv(request.summary, result.theme || 'nord', result.fontFamily || 'Arial', result.fontSize || 14, result.fontStyle || 'normal', request.model, request.time, request.metrics);
                    });
                }
            }
            else {
                // Check if any models are available before generating
                chrome.storage.sync.get(['openaiApiKey', 'geminiApiKey', 'anthropicApiKey'], async (result) => {
                    const apiKeys = {
                        openaiApiKey: result.openaiApiKey || '',
                        geminiApiKey: result.geminiApiKey || '',
                        anthropicApiKey: result.anthropicApiKey || '',
                    };
                    const chromeSupported = await checkChromeBuiltinSupport();
                    const hasAlternatives = await hasAlternativeModels(apiKeys);
                    if (!chromeSupported && !hasAlternatives) {
                        // No models available at all
                        chrome.storage.sync.get(['theme', 'fontFamily', 'fontSize', 'fontStyle'], function (result) {
                            createOrUpdateSummaryDiv('<div style="color: #ff6b6b; text-align: center; padding: 20px;"><h3>AI Summarization Unavailable</h3><p>Chrome Built-in AI requires Chrome 138+ and API support.</p><p>No alternative models are configured. Please configure API keys in settings.</p><button onclick="chrome.runtime.sendMessage({action: \'open_options_page\'})" style="padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">Open Settings</button></div>', result.theme || 'nord', result.fontFamily || 'Arial', result.fontSize || 14, result.fontStyle || 'normal');
                        });
                        return;
                    }
                    // Generate new summary
                    isGeneratingSummary = true;
                    const pageContent = extractPageContent();
                    chrome.runtime.sendMessage({
                        action: 'process_content',
                        content: pageContent,
                    });
                });
            }
        }
        else if (request.action === 'model_switched') {
            const modelSelect = document.getElementById('ai-summary-model-selector');
            if (modelSelect) {
                modelSelect.value = request.model;
            }
        }
    });
})();

let summaryDiv = null;

function createOrUpdateSummaryDiv(summaryText, theme) {
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
      chrome.runtime.sendMessage({ action: 'update_summary_visibility', visible: false });
    });

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

    buttons.appendChild(closeButton);
    buttons.appendChild(minimizeButton);
    buttons.appendChild(maximizeButton);

    const summaryTitle = document.createElement('div');
    summaryTitle.textContent = 'Summary';
    summaryTitle.style.cssText = `
      color: ${themeColors.titleColor} !important;
      font-family: Arial, sans-serif !important;
      font-size: 14px !important;
      font-weight: bold !important;
      margin: 0 auto !important;
    `;

    titleBar.appendChild(buttons);
    titleBar.appendChild(summaryTitle);

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
    `;
    document.head.appendChild(style);

    const resizeHandles = document.createElement('div');
    const directions = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];
    directions.forEach(dir => {
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
    summaryDiv.appendChild(summaryContent);
    document.body.prepend(summaryDiv);

    makeDraggable(summaryDiv, titleBar);
  }

  document.getElementById('ai-summary-extension-summary-content').textContent = summaryText;
  summaryDiv.style.display = 'flex';
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
    element.style.top = (element.offsetTop - pos2) + "px";
    element.style.left = (element.offsetLeft - pos1) + "px";
  }

  function closeDragElement() {
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

function makeResizable(element, content, handle, direction) {
  handle.onmousedown = function(e) {
    e.preventDefault();
    let startX = e.clientX;
    let startY = e.clientY;
    let startWidth = parseInt(document.defaultView.getComputedStyle(element).width, 10);
    let startHeight = parseInt(document.defaultView.getComputedStyle(element).height, 10);
    let startTop = element.offsetTop;
    let startLeft = element.offsetLeft;

    document.onmousemove = function(e) {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      if (direction.includes('e')) {
        element.style.width = (startWidth + dx) + 'px';
      }
      if (direction.includes('s')) {
        element.style.height = (startHeight + dy) + 'px';
      }
      if (direction.includes('w')) {
        element.style.width = (startWidth - dx) + 'px';
        element.style.left = (startLeft + dx) + 'px';
      }
      if (direction.includes('n')) {
        element.style.height = (startHeight - dy) + 'px';
        element.style.top = (startTop + dy) + 'px';
      }
    }

    document.onmouseup = function() {
      document.onmousemove = null;
      document.onmouseup = null;
    }
  }
}

// Listener for messages from background.js
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'display_inline_summary') {
    chrome.storage.sync.get('theme', function(result) {
      createOrUpdateSummaryDiv(request.summary, result.theme || 'light');
    });
  } else if (request.action === 'toggle_summary_visibility') {
    if (summaryDiv) {
      summaryDiv.style.display = summaryDiv.style.display === 'none' ? 'flex' : 'none';
      chrome.runtime.sendMessage({ action: 'update_summary_visibility', visible: summaryDiv.style.display !== 'none' });
    } else {
      const paragraphs = Array.from(document.querySelectorAll('p')).map(p => p.textContent);
      const pageContent = paragraphs.join('\n');
      chrome.runtime.sendMessage({ action: 'process_content', content: pageContent });
    }
  }
});
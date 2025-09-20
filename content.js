let summaryDiv = null;

function createOrUpdateSummaryDiv(summaryText) {
  if (!summaryDiv) {
    summaryDiv = document.createElement('div');
    summaryDiv.id = 'ai-summary-extension-summary-div';
    summaryDiv.style.cssText = `
      position: fixed !important;
      top: 10px !important;
      right: 10px !important;
      width: 300px !important;
      max-height: 400px !important;
      background-color: white !important;
      padding: 15px !important;
      border: 1px solid #ccc !important;
      border-radius: 8px !important;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2) !important;
      z-index: 99999 !important;
      overflow-y: auto !important;
      font-family: Arial, sans-serif !important;
      font-size: 14px !important;
      color: #333 !important;
    `;

    const closeButton = document.createElement('span');
    closeButton.textContent = 'X';
    closeButton.style.cssText = `
      position: absolute !important;
      top: 5px !important;
      right: 10px !important;
      cursor: pointer !important;
      font-size: 16px !important;
      font-weight: bold !important;
      color: #666 !important;
    `;
    closeButton.addEventListener('click', () => {
      summaryDiv.style.display = 'none'; // Hide instead of remove
      chrome.runtime.sendMessage({ action: 'update_summary_visibility', visible: false });
    });

    const summaryTitle = document.createElement('h3');
    summaryTitle.textContent = 'Summary';
    summaryTitle.style.cssText = `
      font-family: Arial, sans-serif !important;
      font-size: 16px !important;
      color: #333 !important;
      margin-top: 0 !important;
      margin-bottom: 10px !important;
    `;

    const summaryContent = document.createElement('p');
    summaryContent.id = 'ai-summary-extension-summary-content';
    summaryContent.style.cssText = `
      font-family: Arial, sans-serif !important;
      font-size: 14px !important;
      color: #333 !important;
      margin: 0 !important;
    `;

    summaryDiv.appendChild(closeButton);

    const copyButton = document.createElement('span');
    copyButton.textContent = '📋'; // Clipboard emoji
    copyButton.style.cssText = `
      position: absolute !important;
      top: 5px !important;
      right: 35px !important;
      cursor: pointer !important;
      font-size: 16px !important;
      color: #666 !important;
    `;
    copyButton.addEventListener('click', () => {
      const summaryText = document.getElementById('ai-summary-extension-summary-content').textContent;
      navigator.clipboard.writeText(summaryText);
    });

    summaryDiv.appendChild(copyButton);

    const shareButton = document.createElement('img');
    shareButton.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgZmlsbD0iY3VycmVudENvbG9yIiBjbGFzcz0iYmkgYmktc2hhcmUiIHZpZXdCb3g9IjAgMCAxNiAxNiI+CiAgPHBhdGggZD0iTTEzLjUgMWExLjUgMS41IDAgMSAwIDAgMyAxLjUgMS41IDAgMCAwIDAgLTN6TTExIDIuNWEyLjUgMi41IDAgMSAxIC42MDMgMS42MjhsLTYuNzE4IDMuMTJhMi40OTkgMi40OTkgMCAwIDEgMCAxLjUwNGw2LjcxOCAzLjEyQTIuNSAyLjUgMCAxIDEgMTEgMTQuNWEyLjUgMi41IDAgMCAxLS42MDMtMS42MjhsLTYuNzE4LTMuMTJhMi41IDIuNSAwIDAgMSAwLTEuNTA0bDYuNzE4LTMuMTJBMS41IDEuNSAwIDAgMSAxMSAyLjV6bS04LjUgNGExLjUgMS41IDAgMSAwIDAgMyAxLjUgMS41IDAgMCAwIDAtM3ptMTEgNS41YTEuNSAxLjUgMCAxIDAgMCAzIDEuNSAxLjUgMCAwIDAgMC0zeiIvPgo8L3N2Zz4=';
    shareButton.style.cssText = `
      position: absolute !important;
      top: 7px !important;
      right: 60px !important;
      cursor: pointer !important;
      width: 16px !important;
      height: 16px !important;
    `;
    shareButton.addEventListener('click', () => {
      const summaryText = document.getElementById('ai-summary-extension-summary-content').textContent;
      if (navigator.share) {
        navigator.share({
          title: 'AI Summary',
          text: summaryText,
        })
        .catch(console.error);
      }
    });

    summaryDiv.appendChild(shareButton);

    const settingsLink = document.createElement('a');
    settingsLink.addEventListener('click', (event) => {
      event.preventDefault();
      chrome.runtime.sendMessage({ action: 'open_options_page' });
    });
    settingsLink.style.cssText = `
      position: absolute !important;
      top: 7px !important;
      right: 85px !important;
      cursor: pointer !important;
      width: 16px !important;
      height: 16px !important;
    `;

    const settingsIcon = document.createElement('img');
    settingsIcon.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBjbGFzcz0iZmVhdGhlciBmZWF0aGVyLXNldHRpbmdzIj4KICA8Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIzIj48L2NpcmNsZT4KICA8cGF0aCBkPSJNMTkuNCAxNWExLjY1IDEuNjUgMCAwIDAgLjMgMS40bDEuNSAyLjVjLjEuMiAwIC41LS4yLjZsLTIuMSAxLjFhMS42NSAxLjY1IDAgMCAwLTEuOCAwbDAtLjUuNWEyLjY1IDEuNjUgMCAwIDAtMS40LS4zbC0yLjUgMS41Yy0uMi4xLS41IDAtLjYtLjJsLTEuMS0yLjFhMS42NSAxLjY1IDAgMCAwIDAtMS44bC41LS44YTEuNjUgMS42NSAwIDAgMCAuMy0xLjRsLTEuNS0yLjVjLS4xLS4yIDAtLjUuMi0uNmwzLjEtMS4xYTEuNjUgMS42NSAwIDAgMCAxLjggMGwuOC41YTEuNjUgMS42NSAwIDAgMCAxLjQuM2wyLjUtMS41Yy4yLS4xLjUgMCAuNi4ybDEuMSAyLjFhMS42NSAxLjY1IDAgMCAwIDAgMS44bC0uNS44eiI+PC9wYXRoPgo8L3N2Zz4=';
    settingsIcon.style.cssText = `
      width: 16px !important;
      height: 16px !important;
    `;

    settingsLink.appendChild(settingsIcon);
    summaryDiv.appendChild(settingsLink);


    summaryDiv.appendChild(summaryTitle);
    summaryDiv.appendChild(summaryContent);
    document.body.prepend(summaryDiv);
  }
  document.getElementById('ai-summary-extension-summary-content').textContent = summaryText;
  summaryDiv.style.display = 'block';
}

// Listener for messages from background.js
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'display_inline_summary') {
    createOrUpdateSummaryDiv(request.summary);
  } else if (request.action === 'toggle_summary_visibility') {
    if (summaryDiv) {
      summaryDiv.style.display = request.visible ? 'block' : 'none';
    }
  }
});

// Initial content extraction and sending to background script
// This part only runs when content.js is first injected
if (!window.aiSummarizerInitialized) {
  window.aiSummarizerInitialized = true;
  
  const paragraphs = Array.from(document.querySelectorAll('p')).map(p => p.textContent);
  const pageContent = paragraphs.join('\n');

  // Only send content for summarization if summaryDiv doesn't exist yet
  // This prevents re-summarizing if the user just wants to toggle visibility
  if (!document.getElementById('ai-summary-extension-summary-div')) {
    chrome.runtime.sendMessage({ action: 'process_content', content: pageContent });
  }
}
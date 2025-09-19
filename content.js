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
const paragraphs = Array.from(document.querySelectorAll('p')).map(p => p.textContent);
const pageContent = paragraphs.join('\n');

// Only send content for summarization if summaryDiv doesn't exist yet
// This prevents re-summarizing if the user just wants to toggle visibility
if (!document.getElementById('ai-summary-extension-summary-div')) {
  chrome.runtime.sendMessage({ action: 'process_content', content: pageContent });
}
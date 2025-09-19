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

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'process_content') {
    const tabId = sender.tab.id;
    fetch('http://localhost:3000/summarize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content: request.content })
    })
    .then(response => response.json())
    .then(data => {
      summaryState[tabId] = { summary: data.summary, visible: true };
      chrome.tabs.sendMessage(tabId, { action: 'display_inline_summary', summary: data.summary });
    })
    .catch(error => {
      console.error('Error summarizing:', error);
      summaryState[tabId] = { summary: 'Error summarizing content.', visible: true };
      chrome.tabs.sendMessage(tabId, { action: 'display_inline_summary', summary: 'Error summarizing content.' });
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

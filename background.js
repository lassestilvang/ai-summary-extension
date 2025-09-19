chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'summarize') {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        files: ['content.js']
      });
    });
  }
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'process_content') {
    fetch('http://localhost:3000/summarize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content: request.content })
    })
    .then(response => response.json())
    .then(data => {
      chrome.runtime.sendMessage({ action: 'display_summary', summary: data.summary });
    })
    .catch(error => {
      console.error('Error summarizing:', error);
      chrome.runtime.sendMessage({ action: 'display_summary', summary: 'Error summarizing content.' });
    });
  }
});

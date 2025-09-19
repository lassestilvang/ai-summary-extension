document.addEventListener('DOMContentLoaded', function() {
  chrome.runtime.sendMessage({ action: 'summarize' });

  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'display_summary') {
      document.getElementById('summary').value = request.summary;
    }
  });
});

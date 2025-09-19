document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('summarize').addEventListener('click', function() {
    chrome.runtime.sendMessage({ action: 'summarize' });
  });

  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'display_summary') {
      document.getElementById('summary').value = request.summary;
    }
  });
});

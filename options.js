document.addEventListener('DOMContentLoaded', function() {
  const aiProviderSelect = document.getElementById('aiProvider');
  const openaiApiKeyInput = document.getElementById('openaiApiKey');
  const geminiApiKeyInput = document.getElementById('geminiApiKey');
  const saveButton = document.getElementById('save');
  const statusDiv = document.getElementById('status');

  // Load saved settings
  chrome.storage.sync.get(['aiProvider', 'openaiApiKey', 'geminiApiKey'], function(result) {
    if (result.aiProvider) {
      aiProviderSelect.value = result.aiProvider;
    }
    if (result.openaiApiKey) {
      openaiApiKeyInput.value = result.openaiApiKey;
    }
    if (result.geminiApiKey) {
      geminiApiKeyInput.value = result.geminiApiKey;
    }
  });

  // Save settings
  saveButton.addEventListener('click', function() {
    const aiProvider = aiProviderSelect.value;
    const openaiApiKey = openaiApiKeyInput.value.trim();
    const geminiApiKey = geminiApiKeyInput.value.trim();
    
    chrome.storage.sync.set({
      aiProvider: aiProvider,
      openaiApiKey: openaiApiKey,
      geminiApiKey: geminiApiKey
    }, function() {
      statusDiv.textContent = 'Settings saved successfully!';
      statusDiv.className = 'status success';
      
      // Clear status after 3 seconds
      setTimeout(() => {
        statusDiv.textContent = '';
        statusDiv.className = '';
      }, 3000);
    });
  });
});
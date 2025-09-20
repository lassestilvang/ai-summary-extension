document.addEventListener('DOMContentLoaded', function() {
  const aiProviderSelect = document.getElementById('aiProvider');
  const openaiApiKeyInput = document.getElementById('openaiApiKey');
  const geminiApiKeyInput = document.getElementById('geminiApiKey');
  const saveButton = document.getElementById('save');
  const themeSelect = document.getElementById('theme');
  const statusDiv = document.getElementById('status');

  // Populate theme selector
  for (const themeKey in themes) {
    const option = document.createElement('option');
    option.value = themeKey;
    option.textContent = themes[themeKey].name;
    themeSelect.appendChild(option);
  }

  // Load saved settings
  chrome.storage.sync.get(['aiProvider', 'openaiApiKey', 'geminiApiKey', 'theme'], function(result) {
    if (result.aiProvider) {
      aiProviderSelect.value = result.aiProvider;
    }
    if (result.openaiApiKey) {
      openaiApiKeyInput.value = result.openaiApiKey;
    }
    if (result.geminiApiKey) {
      geminiApiKeyInput.value = result.geminiApiKey;
    }
    if (result.theme) {
      themeSelect.value = result.theme;
    }
  });

  // Show/hide API key fields based on selected provider
  function updateFieldVisibility() {
    const selectedProvider = aiProviderSelect.value;
    const openaiGroup = openaiApiKeyInput.closest('.form-group');
    const geminiGroup = geminiApiKeyInput.closest('.form-group');
    
    if (selectedProvider === 'chrome') {
      openaiGroup.style.opacity = '0.5';
      geminiGroup.style.opacity = '0.5';
    } else {
      openaiGroup.style.opacity = '1';
      geminiGroup.style.opacity = '1';
    }
  }
  
  // Update visibility on provider change
  aiProviderSelect.addEventListener('change', updateFieldVisibility);
  updateFieldVisibility(); // Initial call

  // Save settings
  saveButton.addEventListener('click', function() {
    const aiProvider = aiProviderSelect.value;
    const openaiApiKey = openaiApiKeyInput.value.trim();
    const geminiApiKey = geminiApiKeyInput.value.trim();
    const theme = themeSelect.value;
    
    chrome.storage.sync.set({
      aiProvider: aiProvider,
      openaiApiKey: openaiApiKey,
      geminiApiKey: geminiApiKey,
      theme: theme
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
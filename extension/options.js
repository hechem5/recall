document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('options-form');
  const apiUrlInput = document.getElementById('apiUrl');
  const appPasswordInput = document.getElementById('appPassword');
  const statusMessage = document.getElementById('statusMessage');

  // Load existing settings
  chrome.storage.local.get(['apiUrl', 'appPassword'], (result) => {
    if (result.apiUrl) {
      apiUrlInput.value = result.apiUrl;
    } else {
      apiUrlInput.value = 'http://localhost:3001';
    }
    if (result.appPassword) {
      appPasswordInput.value = result.appPassword;
    }
  });

  // Save settings
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Ensure URL has no trailing slash
    let url = apiUrlInput.value.trim();
    if (url.endsWith('/')) {
      url = url.slice(0, -1);
    }

    const password = appPasswordInput.value.trim();

    chrome.storage.local.set({
      apiUrl: url,
      appPassword: password
    }, () => {
      statusMessage.classList.remove('hidden');
      setTimeout(() => {
        statusMessage.classList.add('hidden');
      }, 2000);
    });
  });
});

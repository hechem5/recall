document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('options-form');
  const appPasswordInput = document.getElementById('appPassword');
  const recoveryCodeGroup = document.getElementById('recoveryCodeGroup');
  const recoveryCodeInput = document.getElementById('recoveryCode');
  const statusMessage = document.getElementById('statusMessage');

  const API_URL = "https://recall-fnvw.onrender.com";
  let currentDeviceToken = null;

  // Load existing settings
  chrome.storage.local.get(['appPassword', 'deviceToken'], (result) => {
    if (result.appPassword) {
      appPasswordInput.value = result.appPassword;
    }
    if (result.deviceToken) {
      currentDeviceToken = result.deviceToken;
    }
  });

  // Save settings
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const password = appPasswordInput.value.trim();
    const recoveryCode = recoveryCodeInput ? recoveryCodeInput.value.trim() : "";
    const originalBtnText = e.submitter ? e.submitter.innerText : '[ Save Settings ]';
    
    if (e.submitter) e.submitter.innerText = '[ Authenticating... ]';

    try {
      // Authenticate with backend
      const res = await fetch(`${API_URL}/auth/unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          password, 
          deviceToken: currentDeviceToken,
          recoveryCode: recoveryCode || undefined
        })
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error && data.error.toLowerCase().includes('unrecognized device')) {
          if (recoveryCodeGroup) recoveryCodeGroup.classList.remove('hidden');
        }
        throw new Error(data.error || 'Authentication failed');
      }

      // Save token to extension storage
      chrome.storage.local.set({
        appToken: data.token,
        appPassword: password,
        deviceToken: data.deviceToken
      }, () => {
        currentDeviceToken = data.deviceToken;
        if (recoveryCodeGroup) recoveryCodeGroup.classList.add('hidden');
        if (recoveryCodeInput) recoveryCodeInput.value = "";
        
        statusMessage.innerText = 'Vault Unlocked & Device Trusted!';
        statusMessage.classList.remove('hidden');
        setTimeout(() => {
          statusMessage.classList.add('hidden');
        }, 3000);
      });
    } catch (err) {
      statusMessage.innerText = `Error: ${err.message}`;
      statusMessage.classList.remove('hidden');
      setTimeout(() => {
        statusMessage.classList.add('hidden');
      }, 5000);
    } finally {
      if (e.submitter) e.submitter.innerText = originalBtnText;
    }
  });
});

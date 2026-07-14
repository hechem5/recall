document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('options-form');
  const appPasswordInput = document.getElementById('appPassword');
  const statusMessage = document.getElementById('statusMessage');

  const API_URL = "https://recall-fnvw.onrender.com";

  // Load existing settings
  chrome.storage.local.get(['appPassword'], (result) => {
    if (result.appPassword) {
      appPasswordInput.value = result.appPassword;
    }
  });

  // Save settings
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const password = appPasswordInput.value.trim();
    const originalBtnText = e.submitter ? e.submitter.innerText : '[ Save Settings ]';
    
    if (e.submitter) e.submitter.innerText = '[ Authenticating... ]';

    try {
      // Get Fingerprint
      const fpPromise = window.FingerprintJS.load();
      const fp = await fpPromise;
      const result = await fp.get();
      const deviceId = result.visitorId;

      // Authenticate with backend
      const res = await fetch(`${API_URL}/auth/unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, deviceId })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      // Save token to extension storage
      chrome.storage.local.set({
        appToken: data.token,
        appPassword: password // We can keep password if we want it to repopulate the field later
      }, () => {
        statusMessage.innerText = 'Vault Unlocked!';
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

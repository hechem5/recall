document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('options-form');
  const appPasswordInput = document.getElementById('appPassword');
  const recoveryCodeGroup = document.getElementById('recoveryCodeGroup');
  const recoveryCodeInput = document.getElementById('recoveryCode');
  const statusMessage = document.getElementById('statusMessage');
  const createNewBtn = document.getElementById('create-new-btn');
  
  const recoveryCodesModal = document.getElementById('recoveryCodesModal');
  const recoveryCodesList = document.getElementById('recoveryCodesList');
  const savedConfirmed = document.getElementById('savedConfirmed');
  const proceedModalBtn = document.getElementById('proceedModalBtn');

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

  const showStatus = (msg, isError = false) => {
    statusMessage.innerText = msg;
    statusMessage.classList.remove('hidden');
    if (!isError) {
      setTimeout(() => {
        statusMessage.classList.add('hidden');
      }, 3000);
    }
  };

  // Create New Handler
  createNewBtn.addEventListener('click', async () => {
    const password = appPasswordInput.value.trim();
    if (!password) {
      showStatus('ERROR: PLEASE ENTER A PASSWORD', true);
      return;
    }

    const originalBtnText = createNewBtn.innerText;
    createNewBtn.innerText = '[ Creating... ]';

    try {
      const res = await fetch(`${API_URL}/auth/create-safe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create safe');
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
        
        // Populate and show modal
        recoveryCodesList.innerHTML = '';
        data.recoveryCodes.forEach(code => {
          const div = document.createElement('div');
          div.className = 'bg-black border border-[#262626] p-4 text-center font-bold tracking-widest text-lg text-[#E5E5E5]';
          div.innerText = code;
          recoveryCodesList.appendChild(div);
        });
        
        recoveryCodesModal.classList.remove('hidden');
        recoveryCodesModal.classList.add('flex');
      });
    } catch (err) {
      showStatus(`ERROR: ${err.message}`, true);
    } finally {
      createNewBtn.innerText = originalBtnText;
    }
  });

  // Modal logic
  savedConfirmed.addEventListener('change', (e) => {
    proceedModalBtn.disabled = !e.target.checked;
  });

  proceedModalBtn.addEventListener('click', () => {
    recoveryCodesModal.classList.add('hidden');
    recoveryCodesModal.classList.remove('flex');
    showStatus('Vault Created & Device Trusted!');
  });

  // Save settings (Unlock)
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const password = appPasswordInput.value.trim();
    const recoveryCode = recoveryCodeInput ? recoveryCodeInput.value.trim() : "";
    const originalBtnText = e.submitter ? e.submitter.innerText : '[ Save Settings ]';
    
    if (e.submitter) e.submitter.innerText = '[ Authenticating... ]';

    try {
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

      chrome.storage.local.set({
        appToken: data.token,
        appPassword: password,
        deviceToken: data.deviceToken
      }, () => {
        currentDeviceToken = data.deviceToken;
        if (recoveryCodeGroup) recoveryCodeGroup.classList.add('hidden');
        if (recoveryCodeInput) recoveryCodeInput.value = "";
        showStatus('Vault Unlocked & Device Trusted!');
      });
    } catch (err) {
      showStatus(`ERROR: ${err.message}`, true);
    } finally {
      if (e.submitter) e.submitter.innerText = originalBtnText;
    }
  });
});

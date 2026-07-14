(async () => {
  // Simple heuristic for an article
  const isArticle = !!document.querySelector('article') || document.body.innerText.split(/\s+/).length > 500;
  if (!isArticle) return;

  const getConsent = () => new Promise((resolve) => {
    chrome.runtime.sendMessage({ action: "getConsent" }, resolve);
  });

  const setConsent = (enabled) => new Promise((resolve) => {
    chrome.runtime.sendMessage({ action: "setConsent", enabled }, resolve);
  });

  const { enabled, declined } = await getConsent();

  if (declined) return; // User explicitly declined, do nothing

  if (!enabled) {
    // Show one-time consent banner
    showConsentBanner();
    return;
  }

  // If enabled, track dwell time
  startDwellTracking();

  function showConsentBanner() {
    if (document.getElementById('recall-consent-banner')) return;

    const banner = document.createElement('div');
    banner.id = 'recall-consent-banner';
    banner.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #171717;
      color: #fafafa;
      padding: 16px;
      border-radius: 8px;
      border: 1px solid #262626;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      z-index: 999999;
      font-family: sans-serif;
      max-width: 300px;
    `;
    
    banner.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 8px;">Recall: Enable Smart Saves?</div>
      <div style="font-size: 13px; margin-bottom: 12px; color: #a3a3a3;">
        Allow Recall to track your time-on-page to suggest saving long articles you're reading.
      </div>
      <div style="display: flex; gap: 8px;">
        <button id="recall-consent-yes" style="background: #fafafa; color: #171717; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-weight: bold;">Enable</button>
        <button id="recall-consent-no" style="background: transparent; color: #a3a3a3; border: 1px solid #404040; padding: 6px 12px; border-radius: 4px; cursor: pointer;">Decline</button>
      </div>
    `;

    document.body.appendChild(banner);

    document.getElementById('recall-consent-yes').addEventListener('click', async () => {
      await setConsent(true);
      banner.remove();
      startDwellTracking();
    });

    document.getElementById('recall-consent-no').addEventListener('click', async () => {
      await setConsent(false);
      banner.remove();
    });
  }

  function startDwellTracking() {
    let dwellTime = 0;
    let lastScrollTime = Date.now();
    let isTracking = true;
    let nudgeShown = false;

    const checkInterval = setInterval(() => {
      if (!isTracking || nudgeShown) return;
      
      dwellTime += 1;
      const timeSinceScroll = (Date.now() - lastScrollTime) / 1000;

      // If they've been on the page for 60s, and haven't scrolled in 5s (scroll-stop)
      if (dwellTime >= 60 && timeSinceScroll >= 5) {
        showNudge();
        nudgeShown = true;
        clearInterval(checkInterval);
      }
    }, 1000);

    const onScroll = () => { lastScrollTime = Date.now(); };
    window.addEventListener('scroll', onScroll, { passive: true });

    function showNudge() {
      if (document.getElementById('recall-save-nudge')) return;

      const nudge = document.createElement('div');
      nudge.id = 'recall-save-nudge';
      nudge.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #171717;
        color: #fafafa;
        padding: 16px;
        border-radius: 8px;
        border: 1px solid #262626;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 999999;
        font-family: sans-serif;
        display: flex;
        align-items: center;
        gap: 12px;
      `;
      
      nudge.innerHTML = `
        <div style="font-size: 14px;">Save this article to Recall?</div>
        <div style="display: flex; gap: 8px;">
          <button id="recall-nudge-yes" style="background: #fafafa; color: #171717; border: none; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 13px;">Save</button>
          <button id="recall-nudge-no" style="background: transparent; color: #a3a3a3; border: 1px solid #404040; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-size: 13px;">Dismiss</button>
        </div>
      `;

      document.body.appendChild(nudge);

      document.getElementById('recall-nudge-yes').addEventListener('click', async () => {
        nudge.innerHTML = '<div style="font-size: 14px; padding: 4px;">Saving...</div>';
        
        // We reuse the context menu functionality by simulating a page save via background
        chrome.runtime.sendMessage({ action: "saveUrl", url: window.location.href }, (res) => {
          nudge.remove();
        });
        
        // Wait, background script doesn't have a saveUrl message listener yet! Let's just do fetch here? 
        // No, fetch from content script might hit CORS if they are strict. Better to send a message to background to save it.
      });

      document.getElementById('recall-nudge-no').addEventListener('click', () => {
        nudge.remove();
        // Here we could set "don't ask again on this site", but a simple dismiss is fine for now
        chrome.storage.local.get(['dismissedSites'], (res) => {
          const sites = res.dismissedSites || [];
          sites.push(window.location.hostname);
          chrome.storage.local.set({ dismissedSites: sites });
        });
      });
      
      // Before showing, check if dismissed
      chrome.storage.local.get(['dismissedSites'], (res) => {
        if (res.dismissedSites && res.dismissedSites.includes(window.location.hostname)) {
          nudge.remove();
        }
      });
    }
  }
})();

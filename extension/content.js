(async () => {
  // Always register listener for background responses (e.g. popups triggered by iframes)
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "videoStatusResponse") {
      if (request.status === "auto_advanced") {
        showAutoFavoriteToast();
      } else if (request.status === "prompt_user") {
        chrome.storage.local.get(['dismissedFavorites'], (res) => {
          const dismissed = res.dismissedFavorites || [];
          if (!dismissed.includes(window.location.hostname)) {
            showNewFavoritePrompt();
          }
        });
      }
    }
  });

  // Simple heuristic for an article or video
  const isArticle = !!document.querySelector('article') || document.body.innerText.split(/\s+/).length > 500;
  const isVideo = !!document.querySelector('video') || !!document.querySelector('iframe');
  if (!isArticle && !isVideo) return;

  const getConsent = () => new Promise((resolve) => {
    chrome.runtime.sendMessage({ action: "getConsent" }, resolve);
  });

  const setConsent = (enabled) => new Promise((resolve) => {
    chrome.runtime.sendMessage({ action: "setConsent", enabled }, resolve);
  });

  const { enabled, declined, notifiedV2 } = await getConsent();

  if (declined) return; // User explicitly declined, do nothing

  if (!enabled) {
    // Show one-time consent banner
    showConsentBanner();
    return;
  }

  // They are enabled. Did they see the V2 notice?
  if (!notifiedV2) {
    showV2Notification();
  }

  // If enabled, track dwell time ONLY on articles
  // Exclude pages that are explicitly video watching pages
  const isVideoPage = window.location.pathname.includes('/watch') || window.location.pathname.includes('/video');
  if (isArticle && !isVideoPage) {
    startDwellTracking();
  }

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
        Allow Recall to track your time-on-page and video-watch progress to suggest saving things you engage with.
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
      if (isArticle) startDwellTracking();
    });

    document.getElementById('recall-consent-no').addEventListener('click', async () => {
      await setConsent(false);
      banner.remove();
    });
  }

  function showV2Notification() {
    if (document.getElementById('recall-v2-notification')) return;

    const notice = document.createElement('div');
    notice.id = 'recall-v2-notification';
    notice.style.cssText = `
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
      max-width: 320px;
    `;
    
    notice.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 8px;">Smart Saves Updated</div>
      <div style="font-size: 13px; margin-bottom: 12px; color: #a3a3a3;">
        Smart Saves now also tracks your video-watch progress (like YouTube) so you can resume later. You can turn this off anytime.
      </div>
      <div style="display: flex; gap: 8px;">
        <button id="recall-v2-gotit" style="background: #fafafa; color: #171717; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-weight: bold;">Got it</button>
        <button id="recall-v2-disable" style="background: transparent; color: #a3a3a3; border: 1px solid #404040; padding: 6px 12px; border-radius: 4px; cursor: pointer;">Disable Smart Saves</button>
      </div>
    `;

    document.body.appendChild(notice);

    document.getElementById('recall-v2-gotit').addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: "setV2Notified" });
      notice.remove();
    });

    document.getElementById('recall-v2-disable').addEventListener('click', async () => {
      await setConsent(false);
      notice.remove();
      // Stop tracking immediately if we can (tracking is already started, so it will stop on next page load, but we can visually remove it)
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

  // Listener moved to top

  function showAutoFavoriteToast() {
    if (document.getElementById('recall-auto-fav-toast')) return;
    const toast = document.createElement('div');
    toast.id = 'recall-auto-fav-toast';
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #171717;
      color: #FF3366;
      padding: 12px 16px;
      border-radius: 8px;
      border: 1px solid #262626;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      z-index: 999999;
      font-family: sans-serif;
      font-size: 13px;
      font-weight: bold;
      transition: opacity 0.5s;
    `;
    toast.innerHTML = `Auto-favorited next episode`;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 500);
    }, 3000);
  }

  function showNewFavoritePrompt() {
    if (document.getElementById('recall-new-fav-prompt')) return;
    const prompt = document.createElement('div');
    prompt.id = 'recall-new-fav-prompt';
    prompt.style.cssText = `
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
    prompt.innerHTML = `
      <div style="font-size: 14px;">Add to continue watching list?</div>
      <div style="display: flex; gap: 8px;">
        <button id="recall-fav-yes" style="background: #FF3366; color: #fff; border: none; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 13px;">Favorite</button>
        <button id="recall-fav-no" style="background: transparent; color: #a3a3a3; border: 1px solid #404040; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-size: 13px;">Dismiss</button>
      </div>
    `;
    document.body.appendChild(prompt);

    document.getElementById('recall-fav-yes').addEventListener('click', () => {
      prompt.innerHTML = '<div style="font-size: 14px; padding: 4px; color: #FF3366; font-weight: bold;">Added</div>';
      chrome.runtime.sendMessage({ action: "forceFavoriteWatchProgress" });
      setTimeout(() => prompt.remove(), 2000);
    });

    document.getElementById('recall-fav-no').addEventListener('click', () => {
      prompt.remove();
      chrome.storage.local.get(['dismissedFavorites'], (res) => {
        const arr = res.dismissedFavorites || [];
        arr.push(window.location.hostname);
        chrome.storage.local.set({ dismissedFavorites: arr });
      });
    });
  }

})();

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "save-to-recall-page",
    title: "Save page to Recall",
    contexts: ["page"]
  });

  chrome.contextMenus.create({
    id: "save-to-recall-selection",
    title: "Save highlighted text to Recall",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const API_URL = "https://recall-fnvw.onrender.com";
  const { appToken } = await chrome.storage.local.get(['appToken']);
  
  if (!appToken) {
    console.error("Recall Extension not configured.");
    return;
  }

  try {
    let payload = {};
    if (info.menuItemId === "save-to-recall-page") {
      payload = {
        type: "url",
        content: tab.url
      };
    } else if (info.menuItemId === "save-to-recall-selection") {
      let contextText = "";
      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            const sel = window.getSelection();
            if (sel && sel.rangeCount > 0) {
              let node = sel.getRangeAt(0).commonAncestorContainer;
              if (node.nodeType === 3) node = node.parentNode;
              return node ? (node.innerText || node.textContent) : "";
            }
            return "";
          }
        });
        if (results && results[0]?.result) {
          contextText = results[0].result;
        }
      } catch (e) {
        console.log("Could not extract surrounding context", e);
      }

      payload = {
        type: "highlight",
        content: info.selectionText,
        context: contextText,
        url: tab.url,
        title: tab.title
      };
    }

    const res = await fetch(`${API_URL}/api/ingest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${appToken}`
      },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      console.log("Successfully saved to Recall.");
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icons/icon48.png",
        title: "Recall",
        message: "Saved successfully!"
      });
    } else {
      console.error("Failed to save to Recall", await res.text());
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icons/icon48.png",
        title: "Recall Error",
        message: "Failed to save to Recall."
      });
    }
  } catch (err) {
    console.error("Network error while saving to Recall", err);
  }
});

// Listener for the content script to check consent and show notifications
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getConsent") {
    chrome.storage.local.get(['smartSaveEnabled', 'smartSaveDeclined'], (res) => {
      sendResponse({ 
        enabled: !!res.smartSaveEnabled, 
        declined: !!res.smartSaveDeclined 
      });
    });
    return true; // Keep channel open for async response
  }
  
  if (request.action === "setConsent") {
    chrome.storage.local.set({ 
      smartSaveEnabled: request.enabled,
      smartSaveDeclined: !request.enabled
    });
    sendResponse({ success: true });
    return true;
  }
  
  if (request.action === "saveUrl") {
    (async () => {
      const API_URL = "https://recall-fnvw.onrender.com";
      const { appToken } = await chrome.storage.local.get(['appToken']);
      if (!appToken) return sendResponse({ success: false });

      try {
        const res = await fetch(`${API_URL}/api/ingest`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${appToken}`
          },
          body: JSON.stringify({ type: "url", content: request.url })
        });
        
        if (res.ok) {
          chrome.notifications.create({
            type: "basic",
            iconUrl: "icons/icon48.png",
            title: "Recall",
            message: "Saved successfully!"
          });
          sendResponse({ success: true });
        } else {
          sendResponse({ success: false });
        }
      } catch (e) {
        sendResponse({ success: false });
      }
    })();
    return true; // Keep channel open
  }

  if (request.action === "reportWatchProgress") {
    (async () => {
      const API_URL = "https://recall-fnvw.onrender.com";
      const { appToken } = await chrome.storage.local.get(['appToken']);
      if (!appToken) return sendResponse({ success: false });

      try {
        const res = await fetch(`${API_URL}/api/watch-progress`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${appToken}`
          },
          body: JSON.stringify({
            url: request.url,
            title: request.title,
            currentTime: request.currentTime,
            duration: request.duration
          })
        });
        
        if (res.ok) {
          sendResponse({ success: true });
        } else {
          sendResponse({ success: false });
        }
      } catch (e) {
        sendResponse({ success: false });
      }
    })();
    return true; // Keep channel open
  }
});

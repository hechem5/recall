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
  const { apiUrl, appPassword } = await chrome.storage.local.get(['apiUrl', 'appPassword']);
  
  if (!apiUrl || !appPassword) {
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
      payload = {
        type: "text",
        content: info.selectionText,
        // Optional: Send URL for context if needed by backend, though backend currently just takes content.
        url: tab.url 
      };
    }

    const res = await fetch(`${apiUrl}/api/ingest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${appPassword}`
      },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      console.log("Successfully saved to Recall.");
      // Could show a notification here
    } else {
      console.error("Failed to save to Recall", await res.text());
    }
  } catch (err) {
    console.error("Network error while saving to Recall", err);
  }
});

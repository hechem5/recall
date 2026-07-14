let trackingEnabled = false;
let lastReportedTime = -1;
let lastReportedUrl = "";
let hasCheckedStatus = false;
let currentTrackedUrl = "";

// Initialize consent
chrome.runtime.sendMessage({ action: "getConsent" }, (response) => {
  if (response && response.enabled) {
    trackingEnabled = true;
    startWatchTracker();
  }
});

function getBestVideo() {
  const videos = Array.from(document.querySelectorAll('video'));
  if (videos.length === 0) return null;
  
  // Find the largest playing video, or just the largest if paused
  return videos.sort((a, b) => {
    const aArea = a.clientWidth * a.clientHeight;
    const bArea = b.clientWidth * b.clientHeight;
    return bArea - aArea;
  })[0];
}

function reportProgress(video, force = false) {
  if (!trackingEnabled) return;
  if (!video || isNaN(video.duration) || isNaN(video.currentTime)) return;
  
  // Filter out short clips (e.g. under 5 minutes)
  if (video.duration < 300) return;

  const currentUrl = window.location.href;
  
  // Only report if we changed URLs or moved by > 10 seconds since last report, or forced
  const timeDelta = Math.abs(video.currentTime - lastReportedTime);
  const urlChanged = currentUrl !== lastReportedUrl;
  
  if (!force && !urlChanged && timeDelta < 10) {
    return; // Throttle
  }

  lastReportedTime = video.currentTime;
  lastReportedUrl = currentUrl;

  chrome.runtime.sendMessage({
    action: "reportWatchProgress",
    url: currentUrl,
    title: document.title,
    currentTime: video.currentTime,
    duration: video.duration
  });
}

function startWatchTracker() {
  setInterval(() => {
    const video = getBestVideo();
    if (video && !video.paused && video.duration >= 300) {
      if (window.location.href !== currentTrackedUrl) {
        currentTrackedUrl = window.location.href;
        hasCheckedStatus = false;
      }

      if (!hasCheckedStatus) {
        hasCheckedStatus = true;
        chrome.runtime.sendMessage({
          action: "checkVideoStatus",
          url: window.location.href,
          title: document.title
        });
      }

      reportProgress(video, false);
    }
  }, 2000);

  // Ensure we capture final state before user leaves
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      const video = getBestVideo();
      if (video) reportProgress(video, true);
    }
  });

  window.addEventListener("beforeunload", () => {
    const video = getBestVideo();
    if (video) reportProgress(video, true);
  });
}

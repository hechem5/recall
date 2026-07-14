document.addEventListener('DOMContentLoaded', () => {
  const setupView = document.getElementById('setupView');
  const mainView = document.getElementById('mainView');
  const setupBtn = document.getElementById('setupBtn');
  
  const saveTabBtn = document.getElementById('saveTabBtn');
  const saveStatus = document.getElementById('saveStatus');
  
  const searchForm = document.getElementById('searchForm');
  const searchInput = document.getElementById('searchInput');
  const loadingIndicator = document.getElementById('loadingIndicator');
  const resultsContainer = document.getElementById('resultsContainer');
  const answerContent = document.getElementById('answerContent');
  const sourcesList = document.getElementById('sourcesList');

  let config = null;

  const API_URL = "https://recall-fnvw.onrender.com";

  // Check auth
  chrome.storage.local.get(['appToken'], (result) => {
    if (!result.appToken) {
      setupView.classList.remove('hidden');
    } else {
      config = { appToken: result.appToken };
      mainView.classList.remove('hidden');
      searchInput.focus();
    }
  });

  setupBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  // Save Tab
  saveTabBtn.addEventListener('click', async () => {
    saveTabBtn.disabled = true;
    saveStatus.textContent = 'SAVING...';
    saveStatus.classList.remove('hidden');

    try {
      let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.url) throw new Error("Cannot access tab URL");

      const res = await fetch(`${API_URL}/api/ingest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.appToken}`
        },
        body: JSON.stringify({
          type: 'url',
          content: tab.url
        })
      });

      if (!res.ok) throw new Error("Failed to save");
      
      saveStatus.textContent = 'SAVED SUCCESSFULLY';
      setTimeout(() => { saveStatus.classList.add('hidden'); saveTabBtn.disabled = false; }, 2000);
    } catch (e) {
      saveStatus.textContent = 'ERROR SAVING';
      setTimeout(() => { saveStatus.classList.add('hidden'); saveTabBtn.disabled = false; }, 2000);
    }
  });

  // Search
  searchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const query = searchInput.value.trim();
    if (!query) return;

    resultsContainer.classList.add('hidden');
    loadingIndicator.classList.remove('hidden');

    try {
      const res = await fetch(`${API_URL}/api/search?q=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.appToken}`
        }
      });

      if (!res.ok) {
        if (res.status === 401) throw new Error("Unauthorized. Check your password in settings.");
        throw new Error("Search failed.");
      }

      const data = await res.json();
      
      // Strip brackets like [1], [1, 2], [Source 1]
      let cleanAnswer = data.answer.replace(/[ \t]*\[(?:Sources?\s*)?[\d,\s]+\]/g, "");
      
      // Render markdown
      answerContent.innerHTML = marked.parse(cleanAnswer);
      
      // Render sources
      sourcesList.innerHTML = '';
      if (data.sources && data.sources.length > 0) {
        data.sources.forEach(source => {
          const div = document.createElement('div');
          div.className = 'border border-[#262626] p-2 bg-[#0A0A0A] hover:border-[#FF3366] transition-colors truncate';
          
          if (source.url) {
            div.innerHTML = `<a href="${source.url}" target="_blank" class="text-xs text-[#E5E5E5] hover:text-[#FF3366] underline decoration-[#262626] hover:decoration-[#FF3366] transition-colors">${source.title || source.url}</a>`;
          } else {
            div.innerHTML = `<span class="text-xs text-[#E5E5E5]">${source.title || 'Note/Document'}</span>`;
          }
          sourcesList.appendChild(div);
        });
      } else {
        sourcesList.innerHTML = `<span class="text-xs text-[#737373] italic">No sources</span>`;
      }

      loadingIndicator.classList.add('hidden');
      resultsContainer.classList.remove('hidden');

    } catch (err) {
      loadingIndicator.classList.add('hidden');
      answerContent.innerHTML = `<span class="text-[#FF3366]">${err.message}</span>`;
      sourcesList.innerHTML = '';
      resultsContainer.classList.remove('hidden');
    }
  });
});

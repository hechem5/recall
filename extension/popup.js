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
  const favoritesContainer = document.getElementById('favoritesContainer');

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
      loadFavorites();
    }
  });

  setupBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  // Open Options Page
  const optionsBtn = document.getElementById('optionsBtn');
  if (optionsBtn) {
    optionsBtn.addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });
  }

  // Load Favorites
  async function loadFavorites() {
    try {
      const res = await fetch(`${API_URL}/api/watch-progress?favorites=true`, {
        headers: { 'Authorization': `Bearer ${config.appToken}` }
      });
      if (!res.ok) throw new Error("Failed to load favorites");
      
      const records = await res.json();
      
      if (!records || records.length === 0) {
        favoritesContainer.innerHTML = `
          <div class="text-[10px] text-center text-[#737373] uppercase tracking-widest mt-2 p-2">
            Star an item on your dashboard's Continue Watching list to see it here.
          </div>
        `;
        return;
      }

      let html = '';
      records.forEach(record => {
        const percent = Math.min(100, Math.max(0, record.percentComplete * 100));
        html += `
          <a href="${record.url}" target="_blank" rel="noopener noreferrer" class="group flex flex-col p-2 border border-[#262626] bg-[#0A0A0A] hover:border-[#404040] transition-colors decoration-transparent text-left relative">
            <span class="text-xs font-bold text-[#E5E5E5] group-hover:text-[#FF3366] truncate transition-colors">${record.title || record.url}</span>
            <div class="w-full bg-[#262626] h-1 mt-2">
              <div class="bg-[#FF3366] h-full" style="width: ${percent}%"></div>
            </div>
          </a>
        `;
      });
      
      html += `
        <div class="text-[9px] text-[#737373] mt-1 text-center italic" title="Most streaming sites do not support seeking via URL">
          *Opening these links will not automatically resume the player.
        </div>
      `;
      
      favoritesContainer.innerHTML = html;
    } catch (err) {
      console.error("Favorites error:", err);
      favoritesContainer.innerHTML = '';
    }
  }

  // Export Vault
  const exportBtn = document.getElementById('exportBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', async () => {
      exportBtn.disabled = true;
      try {
        const res = await fetch(`${API_URL}/api/memories/export`, {
          headers: { 'Authorization': `Bearer ${config.appToken}` }
        });
        if (!res.ok) throw new Error("Failed to export vault");
        const data = await res.json();
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const reader = new FileReader();
        reader.onload = function() {
          chrome.downloads.download({
            url: reader.result,
            filename: `recall-vault-export-${new Date().toISOString().split('T')[0]}.json`,
            saveAs: true
          });
        };
        reader.readAsDataURL(blob);
      } catch (err) {
        console.error(err);
        alert("Failed to export vault.");
      } finally {
        exportBtn.disabled = false;
      }
    });
  }

  // Save Current Tab
  document.getElementById('saveTabBtn').addEventListener('click', async () => {
    saveTabBtn.disabled = true;
    saveStatus.textContent = 'SAVING...';
    saveStatus.classList.remove('hidden');

    try {
      let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.url) throw new Error("Cannot access tab URL");

      // Extract the fully rendered text directly from the browser tab
      // to bypass Javascript/SPA loading issues and Captchas
      let pageText = "";
      try {
        const injection = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => document.body.innerText
        });
        if (injection && injection[0] && injection[0].result) {
          pageText = injection[0].result;
        }
      } catch (err) {
        console.warn("Could not inject script to extract text", err);
      }

      const res = await fetch(`${API_URL}/api/ingest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.appToken}`
        },
        body: JSON.stringify({
          type: 'url',
          content: tab.url,
          title: tab.title,
          preExtractedText: pageText
        })
      });

      if (!res.ok) throw new Error("Failed to save");
      const data = await res.json();
      
      if (data.alreadySaved) {
        saveStatus.textContent = 'ALREADY SAVED';
      } else {
        saveStatus.textContent = 'SAVED SUCCESSFULLY';
      }
      setTimeout(() => { saveStatus.classList.add('hidden'); saveTabBtn.disabled = false; }, 2000);
    } catch (e) {
      saveStatus.textContent = 'ERROR SAVING';
      setTimeout(() => { saveStatus.classList.add('hidden'); saveTabBtn.disabled = false; }, 2000);
    }
  });

  const timeRangeSelect = document.getElementById('timeRangeSelect');

  // Search
  searchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const query = searchInput.value.trim();
    if (!query) return;
    const timeRange = timeRangeSelect ? timeRangeSelect.value : 'all';

    resultsContainer.classList.add('hidden');
    loadingIndicator.classList.remove('hidden');

    try {
      const res = await fetch(`${API_URL}/api/search?q=${encodeURIComponent(query)}&timeRange=${timeRange}`, {
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
      // Clean up orphaned commas left behind
      cleanAnswer = cleanAnswer.replace(/(,\s*)+,/g, ",");
      cleanAnswer = cleanAnswer.replace(/(,\s*)+\./g, ".");
      cleanAnswer = cleanAnswer.replace(/,\s*$/g, "");
      
      // Render markdown
      answerContent.innerHTML = marked.parse(cleanAnswer);
      
      // Render sources
      sourcesList.innerHTML = '';
      if (data.sources && data.sources.length > 0) {
        data.sources.forEach(source => {
          const div = document.createElement('div');
          div.className = 'border border-[#262626] p-2 bg-[#0A0A0A] hover:border-[#FF3366] transition-colors truncate';
          
          if (source.url) {
            const a = document.createElement('a');
            a.href = source.url;
            a.textContent = source.title || source.url;
            a.className = "text-xs text-[#E5E5E5] hover:text-[#FF3366] underline decoration-[#262626] hover:decoration-[#FF3366] transition-colors cursor-pointer";
            a.addEventListener('click', (ev) => {
              ev.preventDefault();
              chrome.tabs.create({ url: source.url });
            });
            div.appendChild(a);
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

  // Tab Switcher
  const tabSearchBtn = document.getElementById('tabSearchBtn');
  const tabTextBtn = document.getElementById('tabTextBtn');
  const tabFileBtn = document.getElementById('tabFileBtn');
  
  const searchContainer = document.getElementById('searchContainer');
  const textContainer = document.getElementById('textContainer');
  const fileContainer = document.getElementById('fileContainer');

  function switchTab(activeBtn, activeContainer) {
    [tabSearchBtn, tabTextBtn, tabFileBtn].forEach(btn => {
      btn.classList.remove('text-[#FF3366]');
      btn.classList.add('text-[#737373]');
    });
    activeBtn.classList.remove('text-[#737373]');
    activeBtn.classList.add('text-[#FF3366]');

    [searchContainer, textContainer, fileContainer, resultsContainer].forEach(c => c.classList.add('hidden'));
    activeContainer.classList.remove('hidden');
    if (activeBtn === tabSearchBtn) searchInput.focus();
  }

  tabSearchBtn.addEventListener('click', () => switchTab(tabSearchBtn, searchContainer));
  tabTextBtn.addEventListener('click', () => switchTab(tabTextBtn, textContainer));
  tabFileBtn.addEventListener('click', () => switchTab(tabFileBtn, fileContainer));

  // Save Text
  const textInput = document.getElementById('textInput');
  const saveTextBtn = document.getElementById('saveTextBtn');

  saveTextBtn.addEventListener('click', async () => {
    const text = textInput.value.trim();
    if (!text) return;

    saveTextBtn.disabled = true;
    saveTextBtn.textContent = '[ SAVING... ]';

    try {
      const res = await fetch(`${API_URL}/api/ingest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.appToken}`
        },
        body: JSON.stringify({
          type: 'text',
          content: text,
          title: 'Note from Extension'
        })
      });

      if (!res.ok) throw new Error("Failed to save text");
      textInput.value = '';
      saveTextBtn.textContent = '[ ARCHIVED ]';
    } catch (e) {
      saveTextBtn.textContent = '[ ERROR ]';
    }
    setTimeout(() => { saveTextBtn.textContent = '[ Archive Text ]'; saveTextBtn.disabled = false; }, 2000);
  });

  // Save File
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');
  const fileUploadStatus = document.getElementById('fileUploadStatus');

  dropZone.addEventListener('click', () => fileInput.click());

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('border-[#FF3366]');
  });
  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('border-[#FF3366]');
  });
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('border-[#FF3366]');
    if (e.dataTransfer.files.length) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  });
  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length) {
      handleFileUpload(e.target.files[0]);
    }
  });

  async function handleFileUpload(file) {
    fileUploadStatus.textContent = 'UPLOADING...';
    fileUploadStatus.classList.remove('hidden');

    const formData = new FormData();
    formData.append('type', 'file');
    formData.append('file', file);

    try {
      const res = await fetch(`${API_URL}/api/ingest`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.appToken}`
        },
        body: formData
      });

      if (!res.ok) throw new Error("Failed to upload file");
      fileUploadStatus.textContent = 'UPLOADED SUCCESSFULLY';
    } catch (e) {
      fileUploadStatus.textContent = 'ERROR UPLOADING';
    }
    setTimeout(() => { fileUploadStatus.classList.add('hidden'); }, 3000);
  }

});

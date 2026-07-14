# Recall_

**Total Information Retrieval.**

**Live Demo:** [https://recall-phi-gold.vercel.app/](https://recall-phi-gold.vercel.app/)

Recall is a locally bound, cryptographically secured memory extension. Save articles, PDFs, and text snippets instantly via the browser extension, and retrieve them via semantic vector search and AI synthesis. 

---

## 💡 Why Recall?

We consume massive amounts of information daily—articles, research papers, tweets, and documentation. Bookmarks are useless because we forget *why* we saved them, and traditional search requires knowing exact keywords. Recall solves this by acting as a true extension of your memory. You save things instantly, and when you need them months later, you simply ask a question in natural language. The AI understands the semantic meaning of your query, finds the relevant saved data, and synthesizes an exact answer with citations.

---

## 🌐 The Web Dashboard

The central hub for managing your memories and interacting with your data.

### 1. Hardware-Bound Safe
* **What it is:** A secure login system that ties your account to your specific physical device.
* **Why it's there:** To ensure absolute privacy. Even if someone obtains your password, they cannot access your vault from an unauthorized computer. 

### 2. AI Synthesis & Semantic Search
* **What it is:** A Google-like search bar that accepts natural language questions. It returns an AI-generated answer complete with source citations linking back to your original files.
* **Why it's there:** Because finding information shouldn't require exact keyword matches. The AI reads through your saved chunks, understands the context, and gives you a direct answer so you don't have to re-read the entire document.

### 3. Time-Based Filtering
* **What it is:** A dropdown to filter searches by `Past Week`, `Past Month`, `Past Year`, or `All Time`.
* **Why it's there:** As your vault grows to thousands of memories, the AI might find semantically similar but outdated information. Filtering ensures you only retrieve the most relevant, recent data.

### 4. Memory Management
* **What it is:** A dedicated UI to view a chronological list of everything you've saved, with the ability to permanently delete items.
* **Why it's there:** To keep your vault clean. Removing outdated or incorrect information ensures your AI doesn't synthesize answers based on bad data.

### 5. Continue Watching Tracker
* **What it is:** A dedicated dashboard section that lists your recently watched videos (YouTube, Anime, etc.) chronologically, intelligently grouping older episodes together so only the latest episode of any given series is shown.
* **Why it's there:** To act as your personal, unified Netflix-style history for all web video content, keeping your dashboard completely clutter-free.

### 6. Settings & Emergency Recovery System
* **What it is:** A 12-word cryptographic seed phrase system, with a dedicated dashboard Settings page to view and regenerate new device recovery codes.
* **Why it's there:** Because your vault is hardware-bound. If you lose your computer, wipe your browser, or install the extension fresh, the recovery phrase is the *only* way to bypass the hardware lock. The Settings UI ensures you can always generate a fresh batch of codes.

### 7. Bulk Vault Export
* **What it is:** A one-click button to download your entire vault history as a structured `.json` file.
* **Why it's there:** Data portability. Your memories belong to you, and you should never be locked into a closed ecosystem.

---

## 🔌 The Browser Extension

The fastest way to get information into your vault without disrupting your workflow.

### 1. One-Click Tab Saving
* **What it is:** A button that instantly extracts the text of the webpage you are currently reading and saves it to your vault.
* **Why it's there:** Speed. It bypasses JavaScript loading screens and popups by grabbing the fully rendered text directly from your active tab.

### 2. Quick Text Archiver
* **What it is:** A dedicated text box inside the extension popup.
* **Why it's there:** For transient thoughts, quick notes, or copying/pasting specific paragraphs without needing to save the entire webpage.

### 3. File Dropzone
* **What it is:** A drag-and-drop area for local files (PDFs, TXT, DOCX).
* **Why it's there:** Because your memory isn't just websites. You need a way to archive local research papers, documents, and reports so the AI can read them later.

### 4. In-Extension Search
* **What it is:** A miniature version of the dashboard search bar right inside the popup.
* **Why it's there:** To allow you to query your vault and get AI answers without having to open a new tab and navigate to the dashboard.

### 5. Highlight & Right-Click to Save
* **What it is:** Highlight any text on any webpage, right-click, and select "Save Selection to Recall".
* **Why it's there:** When you don't need the entire article, you can selectively save exact quotes. It captures the text and binds it to the exact source URL for perfect citations.

### 6. Smart Saves & Auto-Advance Handoff
* **What it is:** An intelligent opt-in tracker that runs quietly in the background. It dynamically polls for video players to track your exact watch progress, and uses smart heuristics to auto-advance your pinned shows. If you finish an episode and click "Next Episode", the tracker automatically detects the transition, unfavorites the old episode, and pins the new one without a single click.
* **Why it's there:** To completely automate remembering your place across the internet. It prevents tab hoarding and acts as a completely seamless, hands-free video tracker.

---

## 💻 Local Setup

1. Clone the repository: `git clone https://github.com/hechem5/recall.git`
2. Run `npm install` in both the `backend` and `frontend` directories.
3. Configure your `.env` files with your database and AI API keys.
4. Run `npm run dev` in both directories to start the development servers.
5. Load the `/extension` folder into Chrome via `chrome://extensions/` -> **Load Unpacked**.

---

**Made by Hechem Klai // [LinkedIn](https://www.linkedin.com/in/hechem-klai/) // [GitHub](https://github.com/hechem5)**

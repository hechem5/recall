# Recall_

**Total Information Retrieval.**

Recall is a locally bound, cryptographically secured memory extension. Save articles, PDFs, and text snippets instantly via the browser extension, and retrieve them via semantic vector search and AI synthesis.

## 🚀 Features

### Core Capabilities
* **Hardware Bound Security:** Your vault generates a unique cryptographic signature based on your physical device. Even with the correct password, access is denied from unrecognized hardware.
* **Semantic Vector Search:** Data is automatically chunked and embedded using advanced embedding models. Search not just for keywords, but for meaning, concepts, and ideas. Recall instantly understands the context of your query.
* **AI Synthesis:** Queries don't just return links. An integrated Large Language Model synthesizes the exact answer directly from your saved sources, complete with citations.

### Dashboard Management
* **Time-Based Searching:** Filter your natural language queries by time (`Past Week`, `Past Month`, `Past Year`, `All Time`) to prevent pulling up ancient, irrelevant memories.
* **Memory Management:** A full UI to view, manage, and permanently delete saved websites, text notes, and documents. Deletions cleanly cascade to remove all associated vector chunks from the database.
* **Bulk Export:** Instantly download a complete backup of everything you've ever saved to your vault as a structured JSON file.

### Chrome Extension Integration
* **One-Click Tab Saving:** Instantly archive the current webpage you are viewing. The extension bypasses JavaScript/SPA loading issues by directly extracting the fully rendered DOM text.
* **Text & File Uploads:** Drop PDF, TXT, or DOCX files directly into the extension, or paste raw text snippets to archive them on the fly.
* **Search Anywhere:** Access your entire vault and chat with your AI directly from the extension popup without needing to open the dashboard.

## 🛠 Tech Stack

* **Frontend:** Next.js 14, React, Tailwind CSS, Lucide Icons
* **Backend:** Node.js, Express.js, Prisma ORM
* **Database:** PostgreSQL with `pgvector` extension (hosted on Supabase)
* **AI & Embeddings:** Google Gemini APIs
* **Extension:** Chrome Manifest V3

## 💻 Local Development Setup

### Prerequisites
* Node.js (v18+)
* PostgreSQL database with `pgvector` enabled (e.g., Supabase)
* Google Gemini API Key

### 1. Clone the Repository
```bash
git clone https://github.com/hechem5/recall.git
cd recall
```

### 2. Backend Setup
```bash
cd backend
npm install
```
Create a `.env` file in the `backend` directory:
```env
PORT=3001
DATABASE_URL="postgresql://user:password@host:port/db"
GEMINI_API_KEY="your_gemini_api_key"
NODE_ENV="development"
FRONTEND_URL="http://localhost:3000"
```
Run Prisma migrations and start the server:
```bash
npx prisma generate
npx prisma db push
npm run dev
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
```
Create a `.env.local` file in the `frontend` directory:
```env
NEXT_PUBLIC_API_URL="http://127.0.0.1:3001"
```
Start the development server:
```bash
npm run dev
```

### 4. Extension Setup
1. Open Google Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** in the top right corner.
3. Click **Load unpacked** and select the `extension` folder from the cloned repository.
4. Pin the extension to your toolbar.
5. Click the extension icon, click the Settings gear ⚙️, and follow the setup instructions to bind your device.

---

**Made by Hechem Klai // [LinkedIn](https://www.linkedin.com/in/hechem-klai/) // [GitHub](https://github.com/hechem5)**

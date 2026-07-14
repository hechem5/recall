# Deployment Guide for Recall

This guide explains how to deploy the Recall application using the specified production stack.

## 1. Database (Neon Postgres)

1. Create a free account at [Neon.tech](https://neon.tech/).
2. Create a new Postgres project.
3. Copy the Connection String (Database URL).
4. Run the initial migration locally against the Neon database:
   ```bash
   cd backend
   DATABASE_URL="your-neon-url" npx prisma migrate deploy
   ```
   *(This applies the `CREATE EXTENSION vector` and HNSW index SQL we prepared)*.

## 2. Backend (Render)

1. Push your repository to GitHub.
2. Go to [Render](https://render.com/) and create a new **Web Service**.
3. Connect your GitHub repository.
4. Set the following configuration:
   - **Root Directory:** `backend`
   - **Environment:** `Node`
   - **Build Command:** `npm install && npx prisma generate && npx tsc`
   - **Start Command:** `node dist/index.js`
5. Add the following Environment Variables in the Render dashboard:
   - `DATABASE_URL`
   - `ANTHROPIC_API_KEY`
   - `EMBEDDING_API_KEY` (OpenAI)
   - `APP_PASSWORD`
   - `CRON_SECRET` (Choose a secure random string)
6. Deploy. Keep the deployed Render URL handy.

## 3. Frontend (Vercel)

1. Go to [Vercel](https://vercel.com/) and add a new project.
2. Connect your GitHub repository.
3. Set the **Framework Preset** to Next.js.
4. Set the **Root Directory** to `frontend`.
5. Add Environment Variables:
   - `NEXT_PUBLIC_API_URL` = `https://your-backend-app.onrender.com`
6. Deploy.

## 4. Cron Jobs (cron-job.org)

Because Render's free tier spins down inactive web services, we need a keep-alive ping, and we need our weekly digest to trigger.

1. Go to [cron-job.org](https://cron-job.org/) and create a free account.
2. **Keep-Alive Job:**
   - **URL:** `https://your-backend-app.onrender.com/api/health`
   - **Execution Schedule:** Every 10 minutes.
3. **Weekly Digest Job:**
   - **URL:** `https://your-backend-app.onrender.com/api/jobs/weekly-digest`
   - **HTTP Method:** `POST`
   - **Headers:** Add `Authorization: Bearer YOUR_CRON_SECRET_HERE` (matching the `CRON_SECRET` set in Render).
   - **Execution Schedule:** Weekly (e.g., every Sunday at 08:00 AM).

## 5. Security Note
Currently, the `/api/ingest` and `/api/search` endpoints do not have authentication implemented. You should protect them by comparing the `Authorization` header to your `APP_PASSWORD` environment variable before deploying to production.

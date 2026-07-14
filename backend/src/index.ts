import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import ingestRouter from './routes/ingest';
import searchRouter from './routes/search';
import jobsRouter from './routes/jobs';
import authRouter from './routes/auth';
import watchProgressRouter from './routes/watchProgress';
import path from 'path';

dotenv.config({ path: '../.env' }); // Assuming root .env

import { checkEnv } from './lib/env-check';
checkEnv();

const app = express();
// Trust the first proxy (Render's load balancer) so express-rate-limit correctly resolves X-Forwarded-For
app.set('trust proxy', 1);

const port = process.env.PORT || 3001;

// Ensure uploads directory exists
const fs = require('fs');
const uploadsDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow any chrome extension
    if (origin.startsWith('chrome-extension://')) {
      return callback(null, true);
    }
    
    // Restrict to explicitly allowed origins from environment
    const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    if (allowedOrigins.length > 0 && allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('CORS not allowed for this origin'), false);
  }
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check (Unprotected)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

import { verifyToken } from './lib/jwt';

app.use('/auth', authRouter);

// Protect all other routes with JWT
app.use('/api', (req, res, next) => {
  const authHeader = req.headers.authorization;
  // Let jobs route handle its own auth
  if (req.path.startsWith('/jobs/weekly-digest')) return next();
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.split(' ')[1] as string;

  try {
    const decoded = verifyToken(token) as unknown as { safeId: string, deviceId: string };
    // @ts-ignore - inject user info into request
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
});

import memoriesRouter from './routes/memories';

app.use('/api/ingest', ingestRouter);
app.use('/api/search', searchRouter);
app.use('/api/jobs', jobsRouter);
app.use('/api/memories', memoriesRouter);
app.use('/api/watch-progress', watchProgressRouter);
app.use('/api/uploads', express.static(uploadsDir));

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Global Express Error:", err);
  res.status(500).json({ error: err.message || "Internal Server Error" });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

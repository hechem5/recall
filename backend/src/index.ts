import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import ingestRouter from './routes/ingest';
import searchRouter from './routes/search';
import jobsRouter from './routes/jobs';
import path from 'path';

dotenv.config({ path: '../.env' }); // Assuming root .env

const app = express();
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
    
    // Allow localhost or any other origin (for now, keeping it permissive but explicit)
    return callback(null, true);
  }
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check (Unprotected)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Protect all other routes
app.use('/api', (req, res, next) => {
  const authHeader = req.headers.authorization;
  // Let jobs route handle its own auth (since it uses CRON_SECRET)
  if (req.path.startsWith('/jobs/weekly-digest')) return next();
  
  if (authHeader !== `Bearer ${process.env.APP_PASSWORD}`) {
    return res.status(401).json({ error: 'Unauthorized backend access' });
  }
  next();
});

app.use('/api/ingest', ingestRouter);
app.use('/api/search', searchRouter);
app.use('/api/jobs', jobsRouter);
app.use('/api/uploads', express.static(uploadsDir));

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Global Express Error:", err);
  res.status(500).json({ error: err.message || "Internal Server Error" });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

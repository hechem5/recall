"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const ingest_1 = __importDefault(require("./routes/ingest"));
const search_1 = __importDefault(require("./routes/search"));
const jobs_1 = __importDefault(require("./routes/jobs"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: '../.env' }); // Assuming root .env
const app = (0, express_1.default)();
const port = process.env.PORT || 3001;
// Ensure uploads directory exists
const fs = require('fs');
const uploadsDir = path_1.default.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use((0, cors_1.default)({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin)
            return callback(null, true);
        // Allow any chrome extension
        if (origin.startsWith('chrome-extension://')) {
            return callback(null, true);
        }
        // Allow localhost or any other origin (for now, keeping it permissive but explicit)
        return callback(null, true);
    }
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Health check (Unprotected)
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});
// Protect all other routes
app.use('/api', (req, res, next) => {
    const authHeader = req.headers.authorization;
    // Let jobs route handle its own auth (since it uses CRON_SECRET)
    if (req.path.startsWith('/jobs/weekly-digest'))
        return next();
    if (authHeader !== `Bearer ${process.env.APP_PASSWORD}`) {
        return res.status(401).json({ error: 'Unauthorized backend access' });
    }
    next();
});
app.use('/api/ingest', ingest_1.default);
app.use('/api/search', search_1.default);
app.use('/api/jobs', jobs_1.default);
app.use('/api/uploads', express_1.default.static(uploadsDir));
// Global Error Handler
app.use((err, req, res, next) => {
    console.error("Global Express Error:", err);
    res.status(500).json({ error: err.message || "Internal Server Error" });
});
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
//# sourceMappingURL=index.js.map
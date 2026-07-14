"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../prisma"));
const router = (0, express_1.Router)();
router.post('/weekly-digest', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
        // Get all chunks from the last 7 days
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);
        const recentChunks = await prisma_1.default.chunk.findMany({
            where: {
                createdAt: { gte: lastWeek }
            },
            include: { source: true },
            orderBy: { createdAt: 'desc' }
        });
        if (recentChunks.length === 0) {
            return res.json({ message: "No new memories this week to summarize." });
        }
        const context = recentChunks.map(c => `Title: ${c.source.title || 'Untitled'}\nText: ${c.content}`).join('\n\n---\n\n');
        const prompt = `You are a memory assistant. Generate a beautifully formatted, concise weekly digest of the following memories saved by the user over the last 7 days. Group them by themes if possible. Use markdown formatting.

Memories:
${context}
`;
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "Recall Semantic Search",
            },
            body: JSON.stringify({
                model: "openrouter/auto",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.3,
                max_tokens: 1500,
            })
        });
        if (!response.ok) {
            throw new Error(`OpenRouter API failed with status: ${response.status}`);
        }
        const data = await response.json();
        if (data.choices && data.choices[0] && data.choices[0].message) {
            const digest = await prisma_1.default.digest.create({
                data: {
                    content: data.choices[0].message.content
                }
            });
            return res.json({ success: true, digestId: digest.id });
        }
        return res.status(500).json({ error: 'Failed to generate digest text' });
    }
    catch (error) {
        console.error('Digest job error:', error);
        return res.status(500).json({ error: 'Job failed' });
    }
});
// Also provide an endpoint to fetch digests
router.get('/digests', async (req, res) => {
    try {
        const digests = await prisma_1.default.digest.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return res.json({ digests });
    }
    catch (error) {
        return res.status(500).json({ error: 'Failed to fetch digests' });
    }
});
exports.default = router;
//# sourceMappingURL=jobs.js.map
import { Router } from 'express';
import prisma from '../prisma';

const router = Router();

router.post('/weekly-digest', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    const safes = await prisma.safe.findMany();
    let createdCount = 0;

    for (const safe of safes) {
      const recentChunks = await prisma.chunk.findMany({
        where: {
          createdAt: { gte: lastWeek },
          source: { safeId: safe.id }
        },
        include: { source: true },
        orderBy: { createdAt: 'desc' }
      });

      if (recentChunks.length === 0) continue;

      const context = recentChunks.map(c => `Title: ${c.source.title || 'Untitled'}\nText: ${c.content}`).join('\n\n---\n\n');
      const prompt = `You are a memory assistant. Generate a beautifully formatted, concise weekly digest of the following memories saved by the user over the last 7 days. Group them by themes if possible. Use markdown formatting.\n\nMemories:\n${context}\n`;

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

      if (response.ok) {
        const data = await response.json();
        if (data.choices && data.choices[0] && data.choices[0].message) {
          await prisma.digest.create({
            data: {
              content: data.choices[0].message.content,
              safeId: safe.id
            }
          });
          createdCount++;
        }
      }
    }

    return res.json({ success: true, digestsCreated: createdCount });
  } catch (error) {
    console.error('Digest job error:', error);
    return res.status(500).json({ error: 'Job failed' });
  }
});

router.get('/digests', async (req, res) => {
  try {
    const safeId = (req as any).user?.safeId;
    if (!safeId) return res.status(401).json({ error: 'Unauthorized: Safe ID is required' });

    const digests = await prisma.digest.findMany({
      where: { safeId },
      orderBy: { createdAt: 'desc' }
    });
    return res.json({ digests });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch digests' });
  }
});

export default router;

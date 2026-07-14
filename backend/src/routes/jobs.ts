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

      const ORPHAN_DAYS = parseInt(process.env.ORPHAN_DAYS_THRESHOLD || '90', 10);
      const MIN_SOURCES = parseInt(process.env.ORPHAN_MIN_SOURCE_COUNT || '20', 10);
      
      const totalSources = await prisma.source.count({ where: { safeId: safe.id } });
      let orphanedSourceIds: string[] = [];

      if (totalSources >= MIN_SOURCES) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - ORPHAN_DAYS);
        const orphans = await prisma.source.findMany({
          where: { safeId: safe.id, lastAccessedAt: { lt: cutoff } },
          select: { id: true },
          take: 10
        });
        orphanedSourceIds = orphans.map(o => o.id);
      }

      if (recentChunks.length === 0 && orphanedSourceIds.length === 0) continue;

      let digestContent = "No new saves this week.";

      if (recentChunks.length > 0) {
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
            digestContent = data.choices[0].message.content;
          }
        }
      }

      await prisma.digest.create({
        data: {
          content: digestContent,
          safeId: safe.id,
          orphanedSourceIds: JSON.stringify(orphanedSourceIds)
        }
      });
      createdCount++;
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

    const enrichedDigests = await Promise.all(digests.map(async (digest) => {
      let orphanedSources: {
        id: string;
        title: string | null;
        type: string;
        createdAt: Date;
        originalUrl: string | null;
      }[] = [];
      if (digest.orphanedSourceIds) {
        try {
          const ids = JSON.parse(digest.orphanedSourceIds);
          if (Array.isArray(ids) && ids.length > 0) {
            orphanedSources = await prisma.source.findMany({
              where: { id: { in: ids }, safeId },
              select: { id: true, title: true, type: true, createdAt: true, originalUrl: true }
            });
          }
        } catch (e) {
          console.error("Failed to parse orphanedSourceIds", e);
        }
      }
      return { ...digest, orphanedSources };
    }));

    return res.json({ digests: enrichedDigests });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch digests' });
  }
});

export default router;

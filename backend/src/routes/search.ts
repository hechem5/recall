import { Router } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../prisma';
import { embedText } from '../services/embedding';
import { synthesizeAnswer } from '../services/synthesis';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const q = req.query.q as string;
    const timeRange = req.query.timeRange as string || 'all';
    const safeId = (req as any).user?.safeId;

    if (!q) return res.status(400).json({ error: 'Missing query parameter q' });
    if (!safeId) return res.status(401).json({ error: 'Unauthorized: Safe ID is required' });

    // Embed the search query
    const queryEmbedding = await embedText(q);
    const embeddingStr = `[${queryEmbedding.join(',')}]`;

    let dateCondition = Prisma.empty;
    let recentWhere: any = { safeId };

    if (timeRange === 'week') {
      dateCondition = Prisma.sql`AND "Source"."createdAt" >= NOW() - INTERVAL '7 days'`;
      recentWhere.createdAt = { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
    } else if (timeRange === 'month') {
      dateCondition = Prisma.sql`AND "Source"."createdAt" >= NOW() - INTERVAL '30 days'`;
      recentWhere.createdAt = { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
    } else if (timeRange === 'year') {
      dateCondition = Prisma.sql`AND "Source"."createdAt" >= NOW() - INTERVAL '365 days'`;
      recentWhere.createdAt = { gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) };
    }

    // Perform vector similarity search — retrieve top 15 so we have more coverage
    // Filter by the user's Safe ID to prevent cross-tenant data leakage
    const results = await prisma.$queryRaw<any[]>`
      SELECT "Chunk".content, "Chunk"."sourceId", "Source".title, "Source"."originalUrl", "Source".type, "Source"."createdAt",
             1 - ("Chunk".embedding <=> ${embeddingStr}::vector) as similarity
      FROM "Chunk"
      JOIN "Source" ON "Chunk"."sourceId" = "Source".id
      WHERE "Source"."safeId" = ${safeId} ${dateCondition}
      ORDER BY "Chunk".embedding <=> ${embeddingStr}::vector
      LIMIT 15;
    `;

    // Also grab the 5 most recently saved sources so we can answer "last X I saved" queries
    const recentSources = await prisma.source.findMany({
      where: recentWhere,
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, title: true, originalUrl: true, type: true, createdAt: true, rawText: true }
    });

    // Grab the 5 most recently updated watch progress records
    const recentWatchProgress = await prisma.watchProgress.findMany({
      where: recentWhere, // Reusing recentWhere since safeId and dateCondition map over
      orderBy: { updatedAt: 'desc' },
      take: 5
    });

    if (results.length === 0 && recentSources.length === 0 && recentWatchProgress.length === 0) {
      return res.json({ answer: "I couldn't find anything related to that in your memory.", sources: [] });
    }

    const sourceMap = new Map();

    // Add recent watch progress first
    recentWatchProgress.forEach(w => {
      sourceMap.set(`watch-${w.id}`, {
        sourceId: `watch-${w.id}`,
        content: `Watched video: ${w.title || w.url} - Progress: ${Math.round(w.percentComplete * 100)}% complete (${Math.round(w.currentTime)}s of ${Math.round(w.duration)}s)`,
        title: w.title,
        url: w.url,
        type: 'watch-progress',
        savedAt: new Date(w.updatedAt).toLocaleString(),
        isRecent: true
      });
    });

    // Add recent sources first so they are at the top and clearly marked
    recentSources.forEach(r => {
      sourceMap.set(r.id, {
        sourceId: r.id,
        content: r.rawText ? r.rawText.substring(0, 800) : '',
        title: r.title,
        url: r.originalUrl,
        type: r.type,
        savedAt: r.createdAt ? new Date(r.createdAt).toLocaleString() : undefined,
        isRecent: true
      });
    });

    // Add context chunks, grouping by source
    results.forEach(r => {
      if (!sourceMap.has(r.sourceId)) {
        sourceMap.set(r.sourceId, {
          sourceId: r.sourceId,
          content: '',
          title: r.title,
          url: r.originalUrl,
          type: r.type,
          savedAt: r.createdAt ? new Date(r.createdAt).toLocaleString() : undefined,
          isRecent: false
        });
      }
      const source = sourceMap.get(r.sourceId);
      // Append chunk content, up to a reasonable limit per source
      if (source.content.length < 2500) {
        source.content += (source.content ? '\n...' : '') + r.content;
      }
    });

    const combinedSources = Array.from(sourceMap.values());

    // Synthesize the answer
    const answer = await synthesizeAnswer(q, combinedSources);

    // Extract cited memories from the answer like [1], [2], [1, 2]
    const citedIndices = new Set<number>();
    const citationRegex = /\[(?:Sources? )?([\d, ]+)\]/g;
    let match;
    while ((match = citationRegex.exec(answer)) !== null) {
      const numbers = (match[1] || "").split(',').map(n => parseInt(n.trim(), 10));
      for (const num of numbers) {
        if (!isNaN(num) && num >= 1 && num <= combinedSources.length) {
          citedIndices.add(num - 1);
        }
      }
    }

    // Gather only the cited sources
    const finalSourcesMap = new Map();

    citedIndices.forEach(idx => {
      const r = combinedSources[idx];
      if (r) {
        finalSourcesMap.set(r.sourceId, {
          id: r.sourceId,
          title: r.title,
          url: r.url,
          type: r.type,
          savedAt: r.savedAt,
        });
      }
    });

    const sources = Array.from(finalSourcesMap.values());

    return res.json({ answer, sources });

  } catch (error) {
    console.error('Search error:', error);
    return res.status(500).json({ error: 'Search failed' });
  }
});

export default router;

import { Router } from 'express';
import prisma from '../prisma';
import { embedText } from '../services/embedding';
import { synthesizeAnswer } from '../services/synthesis';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const q = req.query.q as string;
    if (!q) {
      return res.status(400).json({ error: 'Missing query parameter q' });
    }

    // Embed the search query
    const queryEmbedding = await embedText(q);
    const embeddingStr = `[${queryEmbedding.join(',')}]`;

    // Perform vector similarity search — retrieve top 15 so we have more coverage
    const results = await prisma.$queryRaw<any[]>`
      SELECT "Chunk".content, "Chunk"."sourceId", "Source".title, "Source"."originalUrl", "Source".type, "Source"."createdAt",
             1 - ("Chunk".embedding <=> ${embeddingStr}::vector) as similarity
      FROM "Chunk"
      JOIN "Source" ON "Chunk"."sourceId" = "Source".id
      ORDER BY "Chunk".embedding <=> ${embeddingStr}::vector
      LIMIT 15;
    `;

    // Also grab the 5 most recently saved sources so we can answer "last X I saved" queries
    const recentSources = await prisma.source.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, title: true, originalUrl: true, type: true, createdAt: true, rawText: true }
    });

    if (results.length === 0 && recentSources.length === 0) {
      return res.json({ answer: "I couldn't find anything related to that in your memory.", sources: [] });
    }

    // Map vector results for synthesis
    const contextChunks = results.map(r => ({
      sourceId: r.sourceId,
      content: r.content,
      title: r.title,
      url: r.originalUrl,
      type: r.type,
      savedAt: r.createdAt ? new Date(r.createdAt).toLocaleString() : undefined,
    }));

    const recentContext = recentSources.map(r => ({
      sourceId: r.id,
      content: r.rawText ? r.rawText.substring(0, 500) : '',
      title: r.title,
      url: r.originalUrl,
      type: r.type,
      savedAt: r.createdAt ? new Date(r.createdAt).toLocaleString() : undefined,
      isRecent: true
    }));

    // Combine them into a single list with a single numbering system to prevent LLM citation confusion
    const combinedSources = [...contextChunks, ...recentContext];

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

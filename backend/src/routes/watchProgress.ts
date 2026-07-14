import { Router } from 'express';
import prisma from '../prisma';

const router = Router();

function isSameShow(title1?: string | null, title2?: string | null): boolean {
  if (!title1 || !title2) return false;
  // Convert to lowercase, remove punctuation, split into words
  const words1 = title1.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 2 && isNaN(Number(w)));
  const words2 = title2.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 2 && isNaN(Number(w)));
  
  // Filter common generic words
  const stopWords = new Set(['watch', 'episode', 'season', 'online', 'free', 'dub', 'sub', 'full', 'hd']);
  const clean1 = words1.filter(w => !stopWords.has(w));
  const clean2 = words2.filter(w => !stopWords.has(w));

  if (clean1.length === 0 || clean2.length === 0) return false;

  const set1 = new Set(clean1);
  const set2 = new Set(clean2);
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  // Jaccard similarity
  const similarity = intersection.size / union.size;
  return similarity >= 0.4;
}

// POST /api/watch-progress/check-status
// Checks if the video should be auto-advanced or prompted
router.post('/check-status', async (req, res) => {
  try {
    const { url, title } = req.body;
    const safeId = (req as any).user?.safeId;
    if (!safeId || !url) return res.status(400).json({ error: 'Missing safeId or url' });

    // Is it already favorited?
    const existing = await prisma.watchProgress.findUnique({
      where: { safeId_url: { safeId, url } }
    });
    if (existing?.isFavorite) {
      return res.json({ status: 'already_favorited' });
    }

    // Is it the next episode of a current favorite?
    const favorites = await prisma.watchProgress.findMany({
      where: { safeId, isFavorite: true },
      orderBy: { updatedAt: 'desc' }
    });

    try {
      const newUrlObj = new URL(url);
      for (const fav of favorites) {
        if (!fav.url) continue;
        const favUrlObj = new URL(fav.url);
        // Domain match + title heuristic match
        if (favUrlObj.hostname === newUrlObj.hostname && isSameShow(title, fav.title)) {
          // Auto-advance!
          await prisma.$transaction([
            prisma.watchProgress.update({ where: { id: fav.id }, data: { isFavorite: false } }),
            prisma.watchProgress.upsert({
              where: { safeId_url: { safeId, url } },
              update: { title: title || undefined, isFavorite: true },
              create: { safeId, url, title, currentTime: 0, duration: 1, percentComplete: 0, isFavorite: true }
            })
          ]);
          return res.json({ status: 'auto_advanced' });
        }
      }
    } catch (e) {
      // Ignore URL parsing errors
    }

    return res.json({ status: 'prompt_user' });
  } catch (err) {
    console.error('check-status error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/watch-progress
// Upserts a watch progress record
router.post('/', async (req, res) => {
  try {
    const { url, title, currentTime, duration, forceFavorite } = req.body;
    const safeId = (req as any).user?.safeId;

    if (!safeId) return res.status(401).json({ error: 'Unauthorized' });
    if (!url || typeof currentTime !== 'number' || typeof duration !== 'number') {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (duration <= 0) return res.status(400).json({ error: 'Invalid duration' });

    const percentComplete = currentTime / duration;

    let isFavoriteVal = false;
    if (forceFavorite) {
      const favorites = await prisma.watchProgress.findMany({
        where: { safeId, isFavorite: true },
        orderBy: { updatedAt: 'asc' } // Oldest first
      });
      if (favorites.length >= 2) {
        // Smart Replace: unfavorite the oldest
        const oldest = favorites[0];
        if (oldest) {
          await prisma.watchProgress.update({ where: { id: oldest.id }, data: { isFavorite: false } });
        }
      }
      isFavoriteVal = true;
    }

    // Upsert semantics: key on safeId and url
    const record = await prisma.watchProgress.upsert({
      where: {
        safeId_url: {
          safeId,
          url
        }
      },
      update: {
        title: title || undefined,
        currentTime,
        duration,
        percentComplete,
        ...(forceFavorite ? { isFavorite: true } : {})
      },
      create: {
        safeId,
        url,
        title,
        currentTime,
        duration,
        percentComplete,
        isFavorite: isFavoriteVal
      }
    });

    return res.json(record);
  } catch (error) {
    console.error('Error saving watch progress:', error);
    return res.status(500).json({ error: 'Failed to save watch progress' });
  }
});

// GET /api/watch-progress
// Fetches recent watch progress for the dashboard
router.get('/', async (req, res) => {
  try {
    const safeId = (req as any).user?.safeId;
    if (!safeId) return res.status(401).json({ error: 'Unauthorized' });
    const isFavoritesOnly = req.query.favorites === 'true';

    const records = await prisma.watchProgress.findMany({
      where: { 
        safeId,
        ...(isFavoritesOnly ? { isFavorite: true } : {})
      },
      orderBy: { updatedAt: 'desc' },
      take: 100
    });

    const grouped: typeof records = [];
    for (const record of records) {
      const alreadyExists = grouped.find(g => {
        try {
          if (!g.url || !record.url) return false;
          const u1 = new URL(g.url);
          const u2 = new URL(record.url);
          return u1.hostname === u2.hostname && isSameShow(g.title, record.title);
        } catch {
          return false;
        }
      });
      if (!alreadyExists) {
        grouped.push(record);
        if (grouped.length >= 20) break;
      }
    }

    return res.json(grouped);
  } catch (error) {
    console.error('Error fetching watch progress:', error);
    return res.status(500).json({ error: 'Failed to fetch watch progress' });
  }
});

// DELETE /api/watch-progress/:id
// Archives/Deletes a watch progress record
router.delete('/:id', async (req, res) => {
  try {
    const safeId = (req as any).user?.safeId;
    if (!safeId) return res.status(401).json({ error: 'Unauthorized' });

    const id = req.params.id;

    // Verify ownership
    const record = await prisma.watchProgress.findUnique({ where: { id } });
    if (!record || record.safeId !== safeId) {
      return res.status(404).json({ error: 'Record not found' });
    }

    await prisma.watchProgress.delete({ where: { id } });
    
    return res.json({ success: true });
  } catch (error) {
    console.error('Error deleting watch progress:', error);
    return res.status(500).json({ error: 'Failed to delete watch progress' });
  }
});

// PATCH /api/watch-progress/:id/favorite
// Toggles the isFavorite status
router.patch('/:id/favorite', async (req, res) => {
  try {
    const safeId = (req as any).user?.safeId;
    if (!safeId) return res.status(401).json({ error: 'Unauthorized' });

    const id = req.params.id;
    const { isFavorite } = req.body;

    if (typeof isFavorite !== 'boolean') {
      return res.status(400).json({ error: 'isFavorite must be a boolean' });
    }

    // Verify ownership
    const record = await prisma.watchProgress.findUnique({ where: { id } });
    if (!record || record.safeId !== safeId) {
      return res.status(404).json({ error: 'Record not found' });
    }

    if (isFavorite) {
      const favoriteCount = await prisma.watchProgress.count({
        where: { safeId, isFavorite: true }
      });
      
      if (favoriteCount >= 2 && !record.isFavorite) {
        return res.status(409).json({ error: 'Maximum 2 favorites. Unfavorite one first.' });
      }
    }

    const updated = await prisma.watchProgress.update({
      where: { id },
      data: { isFavorite }
    });
    
    return res.json(updated);
  } catch (error) {
    console.error('Error toggling favorite status:', error);
    return res.status(500).json({ error: 'Failed to toggle favorite status' });
  }
});

export default router;

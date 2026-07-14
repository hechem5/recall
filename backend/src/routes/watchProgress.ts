import { Router } from 'express';
import prisma from '../prisma';

const router = Router();

// POST /api/watch-progress
// Upserts a watch progress record
router.post('/', async (req, res) => {
  try {
    const { url, title, currentTime, duration } = req.body;
    const safeId = (req as any).user?.safeId;

    if (!safeId) return res.status(401).json({ error: 'Unauthorized' });
    if (!url || typeof currentTime !== 'number' || typeof duration !== 'number') {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (duration <= 0) return res.status(400).json({ error: 'Invalid duration' });

    const percentComplete = currentTime / duration;

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
        percentComplete
      },
      create: {
        safeId,
        url,
        title,
        currentTime,
        duration,
        percentComplete
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
      take: 20
    });

    return res.json(records);
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

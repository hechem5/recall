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

    const records = await prisma.watchProgress.findMany({
      where: { safeId },
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

export default router;

import { Router } from 'express';
import prisma from '../prisma';

const router = Router();

// Get all memories
router.get('/', async (req, res) => {
  try {
    const safeId = (req as any).user?.safeId;
    if (!safeId) return res.status(401).json({ error: 'Unauthorized' });

    const sources = await prisma.source.findMany({
      where: { safeId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        type: true,
        title: true,
        originalUrl: true,
        createdAt: true,
      }
    });

    res.json(sources);
  } catch (error) {
    console.error('Fetch memories error:', error);
    res.status(500).json({ error: 'Failed to fetch memories' });
  }
});

// Export memories
router.get('/export', async (req, res) => {
  try {
    const safeId = (req as any).user?.safeId;
    if (!safeId) return res.status(401).json({ error: 'Unauthorized' });

    const sources = await prisma.source.findMany({
      where: { safeId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        type: true,
        title: true,
        originalUrl: true,
        rawText: true,
        createdAt: true,
      }
    });

    res.json(sources);
  } catch (error) {
    console.error('Export memories error:', error);
    res.status(500).json({ error: 'Failed to export memories' });
  }
});

// Delete a memory
router.delete('/:id', async (req, res) => {
  try {
    const safeId = (req as any).user?.safeId;
    if (!safeId) return res.status(401).json({ error: 'Unauthorized' });

    const id = req.params.id;

    // Ensure the memory belongs to the user
    const source = await prisma.source.findFirst({
      where: { id, safeId }
    });

    if (!source) {
      return res.status(404).json({ error: 'Memory not found or unauthorized' });
    }

    await prisma.source.delete({
      where: { id }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Delete memory error:', error);
    res.status(500).json({ error: 'Failed to delete memory' });
  }
});

export default router;

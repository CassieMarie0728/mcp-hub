import { Router, Request, Response } from 'express';
import { getDb } from '../db';

// Types for marketplace
type Macro = { id: string; name: string; description: string; category: string; downloads: number };
type MacroReview = { id: string; macroId: string; rating: number; comment: string };
type MacroDownload = { id: string; macroId: string; userId: string; downloadedAt: Date };

const router = Router();

/**
 * Get all macros (with pagination and filtering)
 */
router.get('/macros', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = (req.query.search as string) || '';
    const category = (req.query.category as string) || '';
    const sortBy = (req.query.sortBy as string) || 'downloads';

    const offset = (page - 1) * limit;

    // Mock data for marketplace (database integration coming soon)
    const mockMacros: Macro[] = [
      {
        id: '1',
        name: 'Read File',
        description: 'Read file contents',
        category: 'filesystem',
        downloads: 150,
      },
      {
        id: '2',
        name: 'List Directory',
        description: 'List directory contents',
        category: 'filesystem',
        downloads: 120,
      },
      {
        id: '3',
        name: 'Search Web',
        description: 'Search the web',
        category: 'web',
        downloads: 200,
      },
      {
        id: '4',
        name: 'Git Status',
        description: 'Check git status',
        category: 'git',
        downloads: 90,
      },
      {
        id: '5',
        name: 'Create File',
        description: 'Create a new file',
        category: 'filesystem',
        downloads: 110,
      },
    ];

    let filtered = mockMacros;
    if (search) {
      filtered = filtered.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()));
    }
    if (category) {
      filtered = filtered.filter((m) => m.category === category);
    }

    // Sort
    if (sortBy === 'downloads') {
      filtered.sort((a, b) => b.downloads - a.downloads);
    }

    const allMacros = filtered.slice(offset, offset + limit);

    res.json({
      success: true,
      data: allMacros,
      pagination: {
        page,
        limit,
        total: filtered.length,
        pages: Math.ceil(filtered.length / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch macros' });
  }
});

/**
 * Get macro details
 */
router.get('/macros/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Mock data
    const mockMacro: Macro & { reviews: MacroReview[] } = {
      id,
      name: 'Read File',
      description: 'Read file contents',
      category: 'filesystem',
      downloads: 150,
      reviews: [{ id: '1', macroId: id, rating: 5, comment: 'Great macro!' }],
    };

    res.json({ success: true, data: mockMacro });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch macro' });
  }
});

/**
 * Download macro
 */
router.post('/macros/:id/download', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.body.userId || 'anonymous';

    res.json({
      success: true,
      message: 'Macro downloaded successfully',
      macroId: id,
      userId,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to download macro' });
  }
});

/**
 * Add review
 */
router.post('/macros/:id/reviews', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;

    res.json({
      success: true,
      message: 'Review added successfully',
      review: {
        id: 'new-review',
        macroId: id,
        rating,
        comment,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to add review' });
  }
});

export default router;

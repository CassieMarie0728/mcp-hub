import { Router, Request, Response } from 'express';
import { getDb } from '../db';
import { sdk } from '../_core/sdk';

// Types for marketplace
type Macro = { id: string; name: string; description: string; category: string; downloads: number };
type MacroReview = { id: string; macroId: string; rating: number; comment: string };
type MacroDownload = { id: string; macroId: string; userId: string; downloadedAt: Date };

const router = Router();

/**
 * Secure HTML/JS escaping function to prevent Cross-Site Scripting (XSS) attacks.
 * Always sanitize user-provided text content before rendering or returning it.
 */
function sanitizeInput(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Get all macros (with pagination and filtering)
 */
router.get('/macros', async (req: Request, res: Response) => {
  try {
    let page = parseInt(req.query.page as string) || 1;
    let limit = parseInt(req.query.limit as string) || 20;
    const search = (req.query.search as string) || '';
    const category = (req.query.category as string) || '';
    const sortBy = (req.query.sortBy as string) || 'downloads';

    // Defense-in-depth: Validate page and limit boundaries to prevent DoS (Denial of Service) via massive allocations
    if (page < 1 || isNaN(page)) page = 1;
    if (limit < 1 || limit > 100 || isNaN(limit)) limit = 20;

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

    // Defense-in-depth: Validate ID parameters
    if (typeof id !== 'string' || id.length > 50) {
      res.status(400).json({ success: false, error: 'Invalid macro ID' });
      return;
    }

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
 * Requires user authentication via sdk.authenticateRequest
 */
router.post('/macros/:id/download', async (req: Request, res: Response) => {
  try {
    // Authenticate request to prevent unauthorized downloads or API enumeration
    const user = await sdk.authenticateRequest(req);
    const { id } = req.params;

    if (typeof id !== 'string' || id.length > 50) {
      res.status(400).json({ success: false, error: 'Invalid macro ID' });
      return;
    }

    res.json({
      success: true,
      message: 'Macro downloaded successfully',
      macroId: id,
      userId: user.openId,
    });
  } catch (error) {
    const statusCode =
      error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 500;
    res.status(statusCode).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to download macro',
    });
  }
});

/**
 * Add review
 * Requires user authentication, input validation, and sanitization
 */
router.post('/macros/:id/reviews', async (req: Request, res: Response) => {
  try {
    // Authenticate request to prevent spam reviews and identity spoofing
    await sdk.authenticateRequest(req);
    const { id } = req.params;
    const { rating, comment } = req.body;

    if (typeof id !== 'string' || id.length > 50) {
      res.status(400).json({ success: false, error: 'Invalid macro ID' });
      return;
    }

    // Validate rating parameter boundaries
    const ratingNum = Number(rating);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5 || !Number.isInteger(ratingNum)) {
      res
        .status(400)
        .json({ success: false, error: 'Invalid rating. Must be an integer between 1 and 5.' });
      return;
    }

    // Validate comment parameter to prevent DoS or null values
    if (typeof comment !== 'string' || comment.trim().length === 0) {
      res.status(400).json({ success: false, error: 'Comment must be a non-empty string.' });
      return;
    }

    if (comment.length > 500) {
      res
        .status(400)
        .json({ success: false, error: 'Comment is too long (maximum 500 characters).' });
      return;
    }

    // Sanitize user inputs to mitigate XSS (Cross-Site Scripting) vulnerabilities
    const sanitizedComment = sanitizeInput(comment);

    res.json({
      success: true,
      message: 'Review added successfully',
      review: {
        id: 'new-review',
        macroId: id,
        rating: ratingNum,
        comment: sanitizedComment,
      },
    });
  } catch (error) {
    const statusCode =
      error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 500;
    res.status(statusCode).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add review',
    });
  }
});

export default router;

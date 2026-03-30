import { Router, Request, Response } from 'express';
import { db } from '../db';
import { macros, macroReviews, macroDownloads } from '../db/schema';
import { eq, desc, and, like } from 'drizzle-orm';

const router = Router();

/**
 * Get all macros (with pagination and filtering)
 */
router.get('/macros', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string || '';
    const category = req.query.category as string || '';
    const sortBy = req.query.sortBy as string || 'downloads';

    const offset = (page - 1) * limit;

    let query = db.select().from(macros);

    if (search) {
      query = query.where(
        like(macros.name, `%${search}%`)
      );
    }

    if (category) {
      query = query.where(eq(macros.category, category));
    }

    // Sort by downloads, rating, or created date
    if (sortBy === 'downloads') {
      query = query.orderBy(desc(macros.downloadCount));
    } else if (sortBy === 'rating') {
      query = query.orderBy(desc(macros.averageRating));
    } else {
      query = query.orderBy(desc(macros.createdAt));
    }

    const allMacros = await query.limit(limit).offset(offset);

    res.json({
      success: true,
      data: allMacros,
      pagination: {
        page,
        limit,
        total: allMacros.length,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

/**
 * Get macro details
 */
router.get('/macros/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const macro = await db.select().from(macros).where(eq(macros.id, id)).limit(1);

    if (macro.length === 0) {
      return res.status(404).json({ success: false, error: 'Macro not found' });
    }

    // Get reviews
    const reviews = await db.select().from(macroReviews).where(eq(macroReviews.macroId, id));

    res.json({
      success: true,
      data: {
        ...macro[0],
        reviews,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

/**
 * Publish macro to marketplace
 */
router.post('/macros/publish', async (req: Request, res: Response) => {
  try {
    const { name, description, category, actions, tags, isPublic } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    if (!name || !description || !category) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const macroId = `macro_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const newMacro = await db.insert(macros).values({
      id: macroId,
      name,
      description,
      category,
      actions: JSON.stringify(actions),
      tags: tags || [],
      authorId: userId,
      isPublic: isPublic || true,
      downloadCount: 0,
      averageRating: 0,
      reviewCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    res.json({
      success: true,
      data: { id: macroId, name, description },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

/**
 * Download macro
 */
router.post('/macros/:id/download', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    // Get macro
    const macro = await db.select().from(macros).where(eq(macros.id, id)).limit(1);

    if (macro.length === 0) {
      return res.status(404).json({ success: false, error: 'Macro not found' });
    }

    // Record download
    await db.insert(macroDownloads).values({
      id: `download_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      macroId: id,
      userId,
      downloadedAt: new Date(),
    });

    // Update download count
    await db.update(macros).set({
      downloadCount: macro[0].downloadCount + 1,
    }).where(eq(macros.id, id));

    res.json({
      success: true,
      data: macro[0],
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

/**
 * Review macro
 */
router.post('/macros/:id/review', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, error: 'Invalid rating (1-5)' });
    }

    // Create review
    const reviewId = `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await db.insert(macroReviews).values({
      id: reviewId,
      macroId: id,
      userId,
      rating,
      comment: comment || '',
      createdAt: new Date(),
    });

    // Update macro rating
    const reviews = await db.select().from(macroReviews).where(eq(macroReviews.macroId, id));
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    await db.update(macros).set({
      averageRating: avgRating,
      reviewCount: reviews.length,
    }).where(eq(macros.id, id));

    res.json({
      success: true,
      data: { id: reviewId, rating, comment },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

/**
 * Get user's macros
 */
router.get('/user/macros', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const userMacros = await db.select().from(macros).where(eq(macros.authorId, userId));

    res.json({
      success: true,
      data: userMacros,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

/**
 * Get trending macros
 */
router.get('/macros/trending', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;

    const trendingMacros = await db
      .select()
      .from(macros)
      .where(eq(macros.isPublic, true))
      .orderBy(desc(macros.downloadCount))
      .limit(limit);

    res.json({
      success: true,
      data: trendingMacros,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

/**
 * Get featured macros
 */
router.get('/macros/featured', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 5;

    const featuredMacros = await db
      .select()
      .from(macros)
      .where(and(eq(macros.isPublic, true), eq(macros.isFeatured, true)))
      .limit(limit);

    res.json({
      success: true,
      data: featuredMacros,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

/**
 * Get macro categories
 */
router.get('/macros/categories', async (req: Request, res: Response) => {
  try {
    const categories = [
      'productivity',
      'communication',
      'social_media',
      'entertainment',
      'utilities',
      'automation',
      'other',
    ];

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export default router;

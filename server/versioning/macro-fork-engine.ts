/**
 * Macro Fork Engine
 * Manages macro forking with automatic attribution and lineage tracking
 */
export class MacroForkEngine {
  private forks: Map<string, MacroFork[]> = new Map();
  private lineages: Map<string, MacroLineage> = new Map();

  /**
   * Fork a macro
   */
  forkMacro(
    originalMacroId: string,
    userId: string,
    newName: string,
    description?: string,
    modifications?: Record<string, any>
  ): MacroFork {
    const forkId = `fork_${originalMacroId}_${userId}_${Date.now()}`;

    const fork: MacroFork = {
      id: forkId,
      originalMacroId,
      forkedBy: userId,
      forkedAt: new Date(),
      name: newName,
      description,
      modifications,
      attribution: {
        originalAuthor: 'original_author', // Would be fetched from macro metadata
        originalMacroName: 'original_name',
        forkAuthor: userId,
        forkDate: new Date(),
      },
      stats: {
        downloads: 0,
        rating: 0,
        reviews: 0,
        usageCount: 0,
      },
      isPublic: false,
      tags: [],
      version: 1,
    };

    // Track fork
    if (!this.forks.has(originalMacroId)) {
      this.forks.set(originalMacroId, []);
    }
    this.forks.get(originalMacroId)!.push(fork);

    // Create lineage
    this.createLineage(forkId, originalMacroId, userId);

    return fork;
  }

  /**
   * Create lineage
   */
  private createLineage(forkId: string, parentId: string, userId: string) {
    const parentLineage = this.lineages.get(parentId);

    const lineage: MacroLineage = {
      macroId: forkId,
      parentId,
      ancestors: parentLineage ? [...parentLineage.ancestors, parentId] : [parentId],
      depth: parentLineage ? parentLineage.depth + 1 : 1,
      children: [],
      createdBy: userId,
      createdAt: new Date(),
    };

    this.lineages.set(forkId, lineage);

    // Update parent's children
    if (parentLineage) {
      parentLineage.children.push(forkId);
    }
  }

  /**
   * Get forks of a macro
   */
  getForks(macroId: string): MacroFork[] {
    return this.forks.get(macroId) || [];
  }

  /**
   * Get fork lineage
   */
  getLineage(macroId: string): MacroLineage | null {
    return this.lineages.get(macroId) || null;
  }

  /**
   * Get fork tree
   */
  getForkTree(macroId: string): ForkTree {
    const lineage = this.lineages.get(macroId);
    if (!lineage) {
      return {
        macroId,
        name: 'Unknown',
        children: [],
        depth: 0,
      };
    }

    return {
      macroId,
      name: 'Macro',
      children: this.buildForkTree(macroId),
      depth: lineage.depth,
    };
  }

  /**
   * Build fork tree recursively
   */
  private buildForkTree(macroId: string): ForkTree[] {
    const lineage = this.lineages.get(macroId);
    if (!lineage) return [];

    const children: ForkTree[] = [];

    for (const childId of lineage.children) {
      const childLineage = this.lineages.get(childId);
      if (childLineage) {
        children.push({
          macroId: childId,
          name: 'Forked Macro',
          children: this.buildForkTree(childId),
          depth: childLineage.depth,
        });
      }
    }

    return children;
  }

  /**
   * Get fork ancestors
   */
  getAncestors(macroId: string): string[] {
    const lineage = this.lineages.get(macroId);
    return lineage ? lineage.ancestors : [];
  }

  /**
   * Get fork descendants
   */
  getDescendants(macroId: string): string[] {
    const descendants: string[] = [];
    const lineage = this.lineages.get(macroId);

    if (lineage) {
      const queue = [...lineage.children];
      while (queue.length > 0) {
        const current = queue.shift()!;
        descendants.push(current);

        const currentLineage = this.lineages.get(current);
        if (currentLineage) {
          queue.push(...currentLineage.children);
        }
      }
    }

    return descendants;
  }

  /**
   * Get attribution chain
   */
  getAttributionChain(macroId: string): Attribution[] {
    const chain: Attribution[] = [];
    const lineage = this.lineages.get(macroId);

    if (!lineage) return chain;

    // Add current macro
    chain.push({
      macroId,
      author: lineage.createdBy,
      date: lineage.createdAt,
      type: 'fork',
    });

    // Add ancestors
    for (const ancestorId of [...lineage.ancestors].reverse()) {
      const ancestorLineage = this.lineages.get(ancestorId);

      if (ancestorLineage) {
        chain.unshift({
          macroId: ancestorId,
          author: ancestorLineage.createdBy,
          date: ancestorLineage.createdAt,
          type: ancestorLineage.ancestors.length === 0 ? 'original' : 'fork',
        });
        continue;
      }

      chain.unshift({
        macroId: ancestorId,
        author: 'unknown',
        date: new Date(0),
        type: 'original',
      });
    }

    return chain;
  }

  /**
   * Publish fork
   */
  publishFork(forkId: string, tags: string[] = []): MacroFork | null {
    const forks = Array.from(this.forks.values()).flat();
    const fork = forks.find((f) => f.id === forkId);

    if (!fork) return null;

    fork.isPublic = true;
    fork.tags = tags;

    return fork;
  }

  /**
   * Rate fork
   */
  rateFork(forkId: string, rating: number, review?: string): boolean {
    const forks = Array.from(this.forks.values()).flat();
    const fork = forks.find((f) => f.id === forkId);

    if (!fork || rating < 1 || rating > 5) return false;

    fork.stats.rating = (fork.stats.rating * fork.stats.reviews + rating) / (fork.stats.reviews + 1);
    fork.stats.reviews++;

    return true;
  }

  /**
   * Download fork
   */
  downloadFork(forkId: string): boolean {
    const forks = Array.from(this.forks.values()).flat();
    const fork = forks.find((f) => f.id === forkId);

    if (!fork) return false;

    fork.stats.downloads++;

    return true;
  }

  /**
   * Track fork usage
   */
  trackForkUsage(forkId: string): boolean {
    const forks = Array.from(this.forks.values()).flat();
    const fork = forks.find((f) => f.id === forkId);

    if (!fork) return false;

    fork.stats.usageCount++;

    return true;
  }

  /**
   * Get fork statistics
   */
  getForkStats(macroId: string): ForkStats {
    const forks = this.getForks(macroId);
    const descendants = this.getDescendants(macroId);

    return {
      macroId,
      totalForks: forks.length,
      publicForks: forks.filter((f) => f.isPublic).length,
      totalDescendants: descendants.length,
      avgRating: forks.length > 0 ? forks.reduce((sum, f) => sum + f.stats.rating, 0) / forks.length : 0,
      totalDownloads: forks.reduce((sum, f) => sum + f.stats.downloads, 0),
      totalUsage: forks.reduce((sum, f) => sum + f.stats.usageCount, 0),
    };
  }

  /**
   * Get popular forks
   */
  getPopularForks(limit: number = 10): MacroFork[] {
    const allForks = Array.from(this.forks.values()).flat();

    return allForks
      .filter((f) => f.isPublic)
      .sort((a, b) => {
        const scoreA = a.stats.downloads + a.stats.usageCount * 2 + a.stats.rating * 10;
        const scoreB = b.stats.downloads + b.stats.usageCount * 2 + b.stats.rating * 10;
        return scoreB - scoreA;
      })
      .slice(0, limit);
  }

  /**
   * Get trending forks
   */
  getTrendingForks(timeWindowMs: number = 86400000, limit: number = 10): MacroFork[] {
    const now = Date.now();
    const allForks = Array.from(this.forks.values()).flat();

    return allForks
      .filter((f) => f.isPublic && f.forkedAt.getTime() > now - timeWindowMs)
      .sort((a, b) => b.stats.downloads - a.stats.downloads)
      .slice(0, limit);
  }

  /**
   * Search forks
   */
  searchForks(query: string): MacroFork[] {
    const allForks = Array.from(this.forks.values()).flat();
    const lowerQuery = query.toLowerCase();

    return allForks.filter(
      (f) =>
        f.isPublic &&
        (f.name.toLowerCase().includes(lowerQuery) ||
          f.description?.toLowerCase().includes(lowerQuery) ||
          f.tags.some((t) => t.toLowerCase().includes(lowerQuery)))
    );
  }

  /**
   * Get fork recommendations
   */
  getForkRecommendations(macroId: string, limit: number = 5): MacroFork[] {
    const forks = this.getForks(macroId);
    const publicForks = forks.filter((f) => f.isPublic);

    return publicForks
      .sort((a, b) => {
        const scoreA = a.stats.rating + a.stats.downloads * 0.1;
        const scoreB = b.stats.rating + b.stats.downloads * 0.1;
        return scoreB - scoreA;
      })
      .slice(0, limit);
  }

  /**
   * Merge fork back to original
   */
  mergeForkToOriginal(forkId: string, userId: string): boolean {
    const forks = Array.from(this.forks.values()).flat();
    const fork = forks.find((f) => f.id === forkId);

    if (!fork) return false;

    // This would trigger a merge request workflow
    // For now, just mark as merge-requested
    fork.modifications = { ...fork.modifications, mergeRequested: true, mergeRequestedBy: userId };

    return true;
  }

  /**
   * Clone fork
   */
  cloneFork(forkId: string, userId: string, newName: string): MacroFork | null {
    const forks = Array.from(this.forks.values()).flat();
    const fork = forks.find((f) => f.id === forkId);

    if (!fork) return null;

    // Create a new fork from the fork
    const newFork: MacroFork = {
      id: `fork_${forkId}_${userId}_${Date.now()}`,
      originalMacroId: fork.originalMacroId,
      forkedBy: userId,
      forkedAt: new Date(),
      name: newName,
      description: `Clone of ${fork.name}`,
      modifications: { ...fork.modifications },
      attribution: {
        ...fork.attribution,
        forkAuthor: userId,
        forkDate: new Date(),
      },
      stats: { downloads: 0, rating: 0, reviews: 0, usageCount: 0 },
      isPublic: false,
      tags: [...fork.tags],
      version: fork.version + 1,
    };

    // Track new fork
    if (!this.forks.has(fork.originalMacroId)) {
      this.forks.set(fork.originalMacroId, []);
    }
    this.forks.get(fork.originalMacroId)!.push(newFork);

    // Create lineage
    this.createLineage(newFork.id, forkId, userId);

    return newFork;
  }

  /**
   * Export fork with attribution
   */
  exportForkWithAttribution(forkId: string): string | null {
    const forks = Array.from(this.forks.values()).flat();
    const fork = forks.find((f) => f.id === forkId);

    if (!fork) return null;

    const attribution = this.getAttributionChain(forkId);

    const exportData = {
      fork,
      attribution,
      lineage: this.lineages.get(forkId),
    };

    return JSON.stringify(exportData, null, 2);
  }
}

/**
 * Macro fork
 */
export interface MacroFork {
  id: string;
  originalMacroId: string;
  forkedBy: string;
  forkedAt: Date;
  name: string;
  description?: string;
  modifications?: Record<string, any>;
  attribution: {
    originalAuthor: string;
    originalMacroName: string;
    forkAuthor: string;
    forkDate: Date;
  };
  stats: {
    downloads: number;
    rating: number;
    reviews: number;
    usageCount: number;
  };
  isPublic: boolean;
  tags: string[];
  version: number;
}

/**
 * Macro lineage
 */
export interface MacroLineage {
  macroId: string;
  parentId?: string;
  ancestors: string[];
  depth: number;
  children: string[];
  createdBy: string;
  createdAt: Date;
}

/**
 * Fork tree
 */
export interface ForkTree {
  macroId: string;
  name: string;
  children: ForkTree[];
  depth: number;
}

/**
 * Attribution
 */
export interface Attribution {
  macroId: string;
  author: string;
  date: Date;
  type: 'original' | 'fork';
}

/**
 * Fork statistics
 */
export interface ForkStats {
  macroId: string;
  totalForks: number;
  publicForks: number;
  totalDescendants: number;
  avgRating: number;
  totalDownloads: number;
  totalUsage: number;
}

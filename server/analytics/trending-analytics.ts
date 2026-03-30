/**
 * Macro Trending Analytics Engine
 * Tracks trending macros, forks, versions, and community insights
 */
export class TrendingAnalyticsEngine {
  private macroMetrics: Map<string, MacroMetrics> = new Map();
  private forkMetrics: Map<string, ForkMetrics> = new Map();
  private versionMetrics: Map<string, VersionMetrics> = new Map();
  private trendingCache: TrendingData | null = null;
  private cacheExpiry: number = 0;

  /**
   * Record macro execution
   */
  recordMacroExecution(macroId: string, duration: number, success: boolean): void {
    let metrics = this.macroMetrics.get(macroId);

    if (!metrics) {
      metrics = {
        macroId,
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        totalDuration: 0,
        avgDuration: 0,
        downloads: 0,
        ratings: [],
        views: 0,
        lastExecutedAt: new Date(),
        createdAt: new Date(),
      };
    }

    metrics.totalExecutions++;
    if (success) {
      metrics.successfulExecutions++;
    } else {
      metrics.failedExecutions++;
    }

    metrics.totalDuration += duration;
    metrics.avgDuration = metrics.totalDuration / metrics.totalExecutions;
    metrics.lastExecutedAt = new Date();

    this.macroMetrics.set(macroId, metrics);
    this.invalidateCache();
  }

  /**
   * Record macro download
   */
  recordMacroDownload(macroId: string): void {
    let metrics = this.macroMetrics.get(macroId);

    if (!metrics) {
      metrics = {
        macroId,
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        totalDuration: 0,
        avgDuration: 0,
        downloads: 0,
        ratings: [],
        views: 0,
        lastExecutedAt: new Date(),
        createdAt: new Date(),
      };
    }

    metrics.downloads++;
    this.macroMetrics.set(macroId, metrics);
    this.invalidateCache();
  }

  /**
   * Record macro view
   */
  recordMacroView(macroId: string): void {
    let metrics = this.macroMetrics.get(macroId);

    if (!metrics) {
      metrics = {
        macroId,
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        totalDuration: 0,
        avgDuration: 0,
        downloads: 0,
        ratings: [],
        views: 0,
        lastExecutedAt: new Date(),
        createdAt: new Date(),
      };
    }

    metrics.views++;
    this.macroMetrics.set(macroId, metrics);
    this.invalidateCache();
  }

  /**
   * Record macro rating
   */
  recordMacroRating(macroId: string, rating: number, comment?: string): void {
    let metrics = this.macroMetrics.get(macroId);

    if (!metrics) {
      metrics = {
        macroId,
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        totalDuration: 0,
        avgDuration: 0,
        downloads: 0,
        ratings: [],
        views: 0,
        lastExecutedAt: new Date(),
        createdAt: new Date(),
      };
    }

    metrics.ratings.push({ rating, comment, createdAt: new Date() });
    this.macroMetrics.set(macroId, metrics);
    this.invalidateCache();
  }

  /**
   * Record fork creation
   */
  recordForkCreation(forkId: string, originalMacroId: string, forkedBy: string): void {
    const metrics: ForkMetrics = {
      forkId,
      originalMacroId,
      forkedBy,
      downloads: 0,
      views: 0,
      ratings: [],
      createdAt: new Date(),
    };

    this.forkMetrics.set(forkId, metrics);
    this.invalidateCache();
  }

  /**
   * Record version release
   */
  recordVersionRelease(versionId: string, macroId: string, versionNumber: number): void {
    const metrics: VersionMetrics = {
      versionId,
      macroId,
      versionNumber,
      downloads: 0,
      adoptionRate: 0,
      createdAt: new Date(),
    };

    this.versionMetrics.set(versionId, metrics);
    this.invalidateCache();
  }

  /**
   * Get trending macros
   */
  getTrendingMacros(limit: number = 10): MacroMetrics[] {
    const metrics = Array.from(this.macroMetrics.values());

    return metrics
      .sort((a, b) => {
        // Score based on recent activity and popularity
        const scoreA = this.calculateTrendScore(a);
        const scoreB = this.calculateTrendScore(b);
        return scoreB - scoreA;
      })
      .slice(0, limit);
  }

  /**
   * Get popular macros
   */
  getPopularMacros(limit: number = 10): MacroMetrics[] {
    const metrics = Array.from(this.macroMetrics.values());

    return metrics
      .sort((a, b) => {
        const avgRatingA = this.getAverageRating(a);
        const avgRatingB = this.getAverageRating(b);
        return avgRatingB - avgRatingA;
      })
      .slice(0, limit);
  }

  /**
   * Get most downloaded macros
   */
  getMostDownloadedMacros(limit: number = 10): MacroMetrics[] {
    const metrics = Array.from(this.macroMetrics.values());

    return metrics.sort((a, b) => b.downloads - a.downloads).slice(0, limit);
  }

  /**
   * Get trending forks
   */
  getTrendingForks(limit: number = 10): ForkMetrics[] {
    const metrics = Array.from(this.forkMetrics.values());

    return metrics
      .sort((a, b) => {
        const scoreA = a.downloads + a.views * 0.5;
        const scoreB = b.downloads + b.views * 0.5;
        return scoreB - scoreA;
      })
      .slice(0, limit);
  }

  /**
   * Get trending versions
   */
  getTrendingVersions(limit: number = 10): VersionMetrics[] {
    const metrics = Array.from(this.versionMetrics.values());

    return metrics.sort((a, b) => b.downloads - a.downloads).slice(0, limit);
  }

  /**
   * Get macro statistics
   */
  getMacroStatistics(macroId: string): MacroStatistics | null {
    const metrics = this.macroMetrics.get(macroId);

    if (!metrics) {
      return null;
    }

    const successRate = metrics.totalExecutions > 0 ? (metrics.successfulExecutions / metrics.totalExecutions) * 100 : 0;
    const avgRating = this.getAverageRating(metrics);

    return {
      macroId,
      totalExecutions: metrics.totalExecutions,
      successRate,
      avgDuration: metrics.avgDuration,
      downloads: metrics.downloads,
      views: metrics.views,
      avgRating,
      totalRatings: metrics.ratings.length,
      trendScore: this.calculateTrendScore(metrics),
    };
  }

  /**
   * Get community insights
   */
  getCommunityInsights(): CommunityInsights {
    const allMetrics = Array.from(this.macroMetrics.values());

    const totalExecutions = allMetrics.reduce((sum, m) => sum + m.totalExecutions, 0);
    const totalDownloads = allMetrics.reduce((sum, m) => sum + m.downloads, 0);
    const totalViews = allMetrics.reduce((sum, m) => sum + m.views, 0);

    const avgExecutionDuration =
      allMetrics.length > 0
        ? allMetrics.reduce((sum, m) => sum + m.avgDuration, 0) / allMetrics.length
        : 0;

    const allRatings = allMetrics.flatMap((m) => m.ratings.map((r) => r.rating));
    const avgCommunityRating = allRatings.length > 0 ? allRatings.reduce((a, b) => a + b, 0) / allRatings.length : 0;

    const successfulExecutions = allMetrics.reduce((sum, m) => sum + m.successfulExecutions, 0);
    const failedExecutions = allMetrics.reduce((sum, m) => sum + m.failedExecutions, 0);
    const overallSuccessRate = totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0;

    return {
      totalMacros: allMetrics.length,
      totalExecutions,
      totalDownloads,
      totalViews,
      avgExecutionDuration,
      avgCommunityRating,
      overallSuccessRate,
      totalRatings: allRatings.length,
    };
  }

  /**
   * Get trending data (cached)
   */
  getTrendingData(): TrendingData {
    const now = Date.now();

    if (this.trendingCache && now < this.cacheExpiry) {
      return this.trendingCache;
    }

    const data: TrendingData = {
      trending: this.getTrendingMacros(10),
      popular: this.getPopularMacros(10),
      mostDownloaded: this.getMostDownloadedMacros(10),
      trendingForks: this.getTrendingForks(5),
      communityInsights: this.getCommunityInsights(),
      generatedAt: new Date(),
    };

    this.trendingCache = data;
    this.cacheExpiry = now + 5 * 60 * 1000; // Cache for 5 minutes

    return data;
  }

  /**
   * Calculate trend score
   */
  private calculateTrendScore(metrics: MacroMetrics): number {
    const now = Date.now();
    const ageInDays = (now - metrics.lastExecutedAt.getTime()) / (1000 * 60 * 60 * 24);

    // Decay factor: older executions count less
    const decayFactor = Math.exp(-ageInDays / 7);

    // Score components
    const executionScore = metrics.totalExecutions * 0.4;
    const downloadScore = metrics.downloads * 0.3;
    const ratingScore = this.getAverageRating(metrics) * 10 * 0.2;
    const viewScore = metrics.views * 0.1;

    const baseScore = executionScore + downloadScore + ratingScore + viewScore;

    return baseScore * decayFactor;
  }

  /**
   * Get average rating
   */
  private getAverageRating(metrics: MacroMetrics): number {
    if (metrics.ratings.length === 0) {
      return 0;
    }

    const sum = metrics.ratings.reduce((acc, r) => acc + r.rating, 0);
    return sum / metrics.ratings.length;
  }

  /**
   * Invalidate cache
   */
  private invalidateCache(): void {
    this.trendingCache = null;
    this.cacheExpiry = 0;
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): {
    macros: MacroMetrics[];
    forks: ForkMetrics[];
    versions: VersionMetrics[];
  } {
    return {
      macros: Array.from(this.macroMetrics.values()),
      forks: Array.from(this.forkMetrics.values()),
      versions: Array.from(this.versionMetrics.values()),
    };
  }

  /**
   * Export analytics as JSON
   */
  exportAnalytics(): string {
    return JSON.stringify(
      {
        macros: Array.from(this.macroMetrics.values()),
        forks: Array.from(this.forkMetrics.values()),
        versions: Array.from(this.versionMetrics.values()),
        trending: this.getTrendingData(),
        insights: this.getCommunityInsights(),
      },
      null,
      2
    );
  }
}

/**
 * Macro metrics
 */
export interface MacroMetrics {
  macroId: string;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  totalDuration: number;
  avgDuration: number;
  downloads: number;
  ratings: Rating[];
  views: number;
  lastExecutedAt: Date;
  createdAt: Date;
}

/**
 * Fork metrics
 */
export interface ForkMetrics {
  forkId: string;
  originalMacroId: string;
  forkedBy: string;
  downloads: number;
  views: number;
  ratings: Rating[];
  createdAt: Date;
}

/**
 * Version metrics
 */
export interface VersionMetrics {
  versionId: string;
  macroId: string;
  versionNumber: number;
  downloads: number;
  adoptionRate: number;
  createdAt: Date;
}

/**
 * Rating
 */
export interface Rating {
  rating: number;
  comment?: string;
  createdAt: Date;
}

/**
 * Macro statistics
 */
export interface MacroStatistics {
  macroId: string;
  totalExecutions: number;
  successRate: number;
  avgDuration: number;
  downloads: number;
  views: number;
  avgRating: number;
  totalRatings: number;
  trendScore: number;
}

/**
 * Community insights
 */
export interface CommunityInsights {
  totalMacros: number;
  totalExecutions: number;
  totalDownloads: number;
  totalViews: number;
  avgExecutionDuration: number;
  avgCommunityRating: number;
  overallSuccessRate: number;
  totalRatings: number;
}

/**
 * Trending data
 */
export interface TrendingData {
  trending: MacroMetrics[];
  popular: MacroMetrics[];
  mostDownloaded: MacroMetrics[];
  trendingForks: ForkMetrics[];
  communityInsights: CommunityInsights;
  generatedAt: Date;
}

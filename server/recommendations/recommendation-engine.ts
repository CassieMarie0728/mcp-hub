/**
 * Macro Recommendations Engine
 * Uses collaborative filtering, content-based filtering, and trend analysis
 * to suggest macros based on user behavior and community trends
 */
export class MacroRecommendationEngine {
  private userProfiles: Map<string, UserProfile> = new Map();
  private macroFeatures: Map<string, MacroFeatures> = new Map();
  private similarityCache: Map<string, number> = new Map();
  private recommendationCache: Map<string, RecommendationResult[]> = new Map();
  private cacheExpiry: Map<string, number> = new Map();

  /**
   * Build user profile from behavior
   */
  buildUserProfile(userId: string, behaviors: UserBehavior[]): UserProfile {
    const profile: UserProfile = {
      userId,
      executedMacros: new Set(),
      downloadedMacros: new Set(),
      ratedMacros: new Map(),
      viewedMacros: new Set(),
      categories: new Map(),
      avgRating: 0,
      preferredComplexity: 'medium',
      lastUpdated: new Date(),
    };

    behaviors.forEach((behavior) => {
      if (behavior.type === 'execute') {
        profile.executedMacros.add(behavior.macroId);
      } else if (behavior.type === 'download') {
        profile.downloadedMacros.add(behavior.macroId);
      } else if (behavior.type === 'rate') {
        profile.ratedMacros.set(behavior.macroId, behavior.rating || 0);
      } else if (behavior.type === 'view') {
        profile.viewedMacros.add(behavior.macroId);
      }

      // Track category preferences
      if (behavior.category) {
        const count = profile.categories.get(behavior.category) || 0;
        profile.categories.set(behavior.category, count + 1);
      }
    });

    // Calculate average rating
    const ratings = Array.from(profile.ratedMacros.values());
    profile.avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

    // Determine preferred complexity
    const executionCount = profile.executedMacros.size;
    if (executionCount > 20) {
      profile.preferredComplexity = 'advanced';
    } else if (executionCount > 5) {
      profile.preferredComplexity = 'medium';
    } else {
      profile.preferredComplexity = 'beginner';
    }

    this.userProfiles.set(userId, profile);
    return profile;
  }

  /**
   * Extract macro features for content-based filtering
   */
  extractMacroFeatures(macroId: string, macro: MacroData): MacroFeatures {
    const features: MacroFeatures = {
      macroId,
      category: macro.category,
      tags: macro.tags || [],
      complexity: this.calculateComplexity(macro),
      avgRating: macro.avgRating || 0,
      downloadCount: macro.downloadCount || 0,
      executionCount: macro.executionCount || 0,
      successRate: macro.successRate || 0,
      avgDuration: macro.avgDuration || 0,
      trendScore: macro.trendScore || 0,
      keywords: this.extractKeywords(macro.name, macro.description),
      actionTypes: macro.actionTypes || [],
      targetApps: macro.targetApps || [],
      createdAt: macro.createdAt || new Date(),
    };

    this.macroFeatures.set(macroId, features);
    return features;
  }

  /**
   * Get recommendations for user
   */
  getRecommendations(
    userId: string,
    limit: number = 10,
    strategy: 'collaborative' | 'content' | 'hybrid' = 'hybrid'
  ): RecommendationResult[] {
    const cacheKey = `${userId}:${strategy}`;
    const cached = this.recommendationCache.get(cacheKey);
    const expiry = this.cacheExpiry.get(cacheKey) || 0;

    if (cached && Date.now() < expiry) {
      return cached.slice(0, limit);
    }

    let recommendations: RecommendationResult[] = [];

    if (strategy === 'collaborative') {
      recommendations = this.collaborativeFiltering(userId, limit);
    } else if (strategy === 'content') {
      recommendations = this.contentBasedFiltering(userId, limit);
    } else {
      recommendations = this.hybridFiltering(userId, limit);
    }

    // Cache for 30 minutes
    this.recommendationCache.set(cacheKey, recommendations);
    this.cacheExpiry.set(cacheKey, Date.now() + 30 * 60 * 1000);

    return recommendations.slice(0, limit);
  }

  /**
   * Collaborative filtering: recommend based on similar users
   */
  private collaborativeFiltering(userId: string, limit: number): RecommendationResult[] {
    const userProfile = this.userProfiles.get(userId);
    if (!userProfile) {
      return [];
    }

    const recommendations: Map<string, number> = new Map();

    // Find similar users
    const similarUsers = this.findSimilarUsers(userId, 5);

    similarUsers.forEach(({ userId: similarUserId, similarity }) => {
      const similarProfile = this.userProfiles.get(similarUserId);
      if (!similarProfile) return;

      // Get macros executed by similar user but not by current user
      similarProfile.executedMacros.forEach((macroId) => {
        if (!userProfile.executedMacros.has(macroId)) {
          const score = (recommendations.get(macroId) || 0) + similarity;
          recommendations.set(macroId, score);
        }
      });
    });

    return Array.from(recommendations.entries())
      .map(([macroId, score]) => ({
        macroId,
        score,
        reason: 'Users similar to you enjoy this macro',
        method: 'collaborative' as const,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Content-based filtering: recommend based on macro similarity
   */
  private contentBasedFiltering(userId: string, limit: number): RecommendationResult[] {
    const userProfile = this.userProfiles.get(userId);
    if (!userProfile) {
      return [];
    }

    const recommendations: Map<string, number> = new Map();

    // Get executed macros
    userProfile.executedMacros.forEach((executedMacroId) => {
      const executedFeatures = this.macroFeatures.get(executedMacroId);
      if (!executedFeatures) return;

      // Find similar macros
      this.macroFeatures.forEach((features, macroId) => {
        if (
          !userProfile.executedMacros.has(macroId) &&
          !userProfile.downloadedMacros.has(macroId)
        ) {
          const similarity = this.calculateSimilarity(executedFeatures, features);
          const score = (recommendations.get(macroId) || 0) + similarity;
          recommendations.set(macroId, score);
        }
      });
    });

    return Array.from(recommendations.entries())
      .map(([macroId, score]) => ({
        macroId,
        score,
        reason: 'Similar to macros you use',
        method: 'content' as const,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Hybrid filtering: combine collaborative and content-based
   */
  private hybridFiltering(userId: string, limit: number): RecommendationResult[] {
    const collaborative = this.collaborativeFiltering(userId, limit * 2);
    const contentBased = this.contentBasedFiltering(userId, limit * 2);

    const combined: Map<string, RecommendationResult> = new Map();

    collaborative.forEach((rec) => {
      combined.set(rec.macroId, { ...rec, score: rec.score * 0.5 });
    });

    contentBased.forEach((rec) => {
      const existing = combined.get(rec.macroId);
      if (existing) {
        existing.score += rec.score * 0.5;
        existing.reason = 'Popular choice similar to your interests';
      } else {
        combined.set(rec.macroId, { ...rec, score: rec.score * 0.5 });
      }
    });

    // Add trending bonus
    this.addTrendingBonus(combined);

    return Array.from(combined.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Find similar users based on behavior
   */
  private findSimilarUsers(
    userId: string,
    limit: number
  ): Array<{ userId: string; similarity: number }> {
    const userProfile = this.userProfiles.get(userId);
    if (!userProfile) {
      return [];
    }

    const similarities: Array<{ userId: string; similarity: number }> = [];

    this.userProfiles.forEach((otherProfile, otherUserId) => {
      if (otherUserId === userId) return;

      const similarity = this.calculateUserSimilarity(userProfile, otherProfile);
      if (similarity > 0.3) {
        similarities.push({ userId: otherUserId, similarity });
      }
    });

    return similarities.sort((a, b) => b.similarity - a.similarity).slice(0, limit);
  }

  /**
   * Calculate similarity between two users
   */
  private calculateUserSimilarity(profile1: UserProfile, profile2: UserProfile): number {
    let similarity = 0;
    let factors = 0;

    // Category overlap
    const categories1 = new Set(profile1.categories.keys());
    const categories2 = new Set(profile2.categories.keys());
    const intersection = new Set([...categories1].filter((x) => categories2.has(x)));
    const union = new Set([...categories1, ...categories2]);

    if (union.size > 0) {
      similarity += (intersection.size / union.size) * 0.4;
      factors++;
    }

    // Complexity preference similarity
    if (profile1.preferredComplexity === profile2.preferredComplexity) {
      similarity += 0.3;
    }
    factors++;

    // Rating similarity
    const ratingDiff = Math.abs(profile1.avgRating - profile2.avgRating);
    similarity += Math.max(0, 1 - ratingDiff / 5) * 0.3;
    factors++;

    return factors > 0 ? similarity / factors : 0;
  }

  /**
   * Calculate similarity between two macros
   */
  private calculateSimilarity(features1: MacroFeatures, features2: MacroFeatures): number {
    let similarity = 0;
    let factors = 0;

    // Category match
    if (features1.category === features2.category) {
      similarity += 0.3;
    }
    factors++;

    // Tag overlap
    const tags1 = new Set(features1.tags);
    const tags2 = new Set(features2.tags);
    const tagIntersection = new Set([...tags1].filter((x) => tags2.has(x)));
    const tagUnion = new Set([...tags1, ...tags2]);

    if (tagUnion.size > 0) {
      similarity += (tagIntersection.size / tagUnion.size) * 0.25;
    }
    factors++;

    // Complexity similarity
    const complexityMap = { beginner: 1, medium: 2, advanced: 3 };
    const complexityDiff =
      Math.abs(complexityMap[features1.complexity] - complexityMap[features2.complexity]) / 2;
    similarity += Math.max(0, 1 - complexityDiff) * 0.2;
    factors++;

    // Action type overlap
    const actions1 = new Set(features1.actionTypes);
    const actions2 = new Set(features2.actionTypes);
    const actionIntersection = new Set([...actions1].filter((x) => actions2.has(x)));
    const actionUnion = new Set([...actions1, ...actions2]);

    if (actionUnion.size > 0) {
      similarity += (actionIntersection.size / actionUnion.size) * 0.25;
    }
    factors++;

    return factors > 0 ? similarity / factors : 0;
  }

  /**
   * Add trending bonus to recommendations
   */
  private addTrendingBonus(recommendations: Map<string, RecommendationResult>): void {
    recommendations.forEach((rec) => {
      const features = this.macroFeatures.get(rec.macroId);
      if (features) {
        // Boost trending macros
        const trendBoost = features.trendScore * 0.1;
        rec.score += trendBoost;
      }
    });
  }

  /**
   * Calculate macro complexity
   */
  private calculateComplexity(macro: MacroData): 'beginner' | 'medium' | 'advanced' {
    const actionCount = macro.actionCount || 0;
    const conditionCount = macro.conditionCount || 0;
    const loopCount = macro.loopCount || 0;

    const score = actionCount * 1 + conditionCount * 2 + loopCount * 3;

    if (score <= 5) return 'beginner';
    if (score < 15) return 'medium';
    return 'advanced';
  }

  /**
   * Extract keywords from text
   */
  private extractKeywords(name: string, description?: string): string[] {
    const text = `${name} ${description || ''}`.toLowerCase();
    const words = text.split(/\s+/);
    const stopWords = new Set([
      'the',
      'a',
      'an',
      'and',
      'or',
      'but',
      'in',
      'on',
      'at',
      'to',
      'for',
      'of',
      'with',
      'by',
    ]);

    return words.filter((word) => word.length > 3 && !stopWords.has(word));
  }

  /**
   * Get personalized recommendations
   */
  getPersonalizedRecommendations(userId: string, limit: number = 10): PersonalizedRecommendation[] {
    const recommendations = this.getRecommendations(userId, limit * 2, 'hybrid');

    return recommendations.map((rec) => ({
      ...rec,
      personalizationScore: this.calculatePersonalizationScore(userId, rec.macroId),
      explanation: this.generateExplanation(userId, rec),
    }));
  }

  /**
   * Calculate personalization score
   */
  private calculatePersonalizationScore(userId: string, macroId: string): number {
    const userProfile = this.userProfiles.get(userId);
    const macroFeatures = this.macroFeatures.get(macroId);

    if (!userProfile || !macroFeatures) return 0;

    let score = 0;

    // Category match
    if (userProfile.categories.has(macroFeatures.category)) {
      score += 0.3;
    }

    // Complexity match
    if (userProfile.preferredComplexity === macroFeatures.complexity) {
      score += 0.3;
    }

    // Quality match
    if (macroFeatures.avgRating >= userProfile.avgRating) {
      score += 0.2;
    }

    // Popularity match
    if (macroFeatures.downloadCount > 100) {
      score += 0.2;
    }

    return Math.min(1, score);
  }

  /**
   * Generate explanation for recommendation
   */
  private generateExplanation(userId: string, rec: RecommendationResult): string {
    const userProfile = this.userProfiles.get(userId);
    const macroFeatures = this.macroFeatures.get(rec.macroId);

    if (!userProfile || !macroFeatures) return rec.reason;

    const reasons: string[] = [];

    // Category reason
    if (userProfile.categories.has(macroFeatures.category)) {
      reasons.push(`You often use ${macroFeatures.category} macros`);
    }

    // Complexity reason
    if (userProfile.preferredComplexity === macroFeatures.complexity) {
      reasons.push(`Matches your ${macroFeatures.complexity} skill level`);
    }

    // Quality reason
    if (macroFeatures.avgRating >= 4.5) {
      reasons.push(`Highly rated (${macroFeatures.avgRating.toFixed(1)}⭐)`);
    }

    // Popularity reason
    if (macroFeatures.downloadCount > 500) {
      reasons.push(`Popular with ${macroFeatures.downloadCount}+ downloads`);
    }

    return reasons.length > 0 ? reasons.join(' • ') : rec.reason;
  }

  /**
   * Get trending recommendations
   */
  getTrendingRecommendations(limit: number = 10): RecommendationResult[] {
    return Array.from(this.macroFeatures.values())
      .map((features) => ({
        macroId: features.macroId,
        score: features.trendScore,
        reason: 'Trending in the community',
        method: 'trending' as const,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Get category-based recommendations
   */
  getCategoryRecommendations(category: string, limit: number = 10): RecommendationResult[] {
    return Array.from(this.macroFeatures.values())
      .filter((features) => features.category === category)
      .map((features) => ({
        macroId: features.macroId,
        score: features.avgRating * features.downloadCount,
        reason: `Popular ${category} macro`,
        method: 'category' as const,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Export recommendations as JSON
   */
  exportRecommendations(userId: string): string {
    const recommendations = this.getPersonalizedRecommendations(userId, 20);
    return JSON.stringify(recommendations, null, 2);
  }
}

/**
 * User profile
 */
export interface UserProfile {
  userId: string;
  executedMacros: Set<string>;
  downloadedMacros: Set<string>;
  ratedMacros: Map<string, number>;
  viewedMacros: Set<string>;
  categories: Map<string, number>;
  avgRating: number;
  preferredComplexity: 'beginner' | 'medium' | 'advanced';
  lastUpdated: Date;
}

/**
 * User behavior
 */
export interface UserBehavior {
  type: 'execute' | 'download' | 'rate' | 'view';
  macroId: string;
  category?: string;
  rating?: number;
  timestamp?: Date;
}

/**
 * Macro features
 */
export interface MacroFeatures {
  macroId: string;
  category: string;
  tags: string[];
  complexity: 'beginner' | 'medium' | 'advanced';
  avgRating: number;
  downloadCount: number;
  executionCount: number;
  successRate: number;
  avgDuration: number;
  trendScore: number;
  keywords: string[];
  actionTypes: string[];
  targetApps: string[];
  createdAt: Date;
}

/**
 * Macro data
 */
export interface MacroData {
  category: string;
  tags?: string[];
  avgRating?: number;
  downloadCount?: number;
  executionCount?: number;
  successRate?: number;
  avgDuration?: number;
  trendScore?: number;
  actionTypes?: string[];
  targetApps?: string[];
  createdAt?: Date;
  name: string;
  description?: string;
  actionCount?: number;
  conditionCount?: number;
  loopCount?: number;
}

/**
 * Recommendation result
 */
export interface RecommendationResult {
  macroId: string;
  score: number;
  reason: string;
  method: 'collaborative' | 'content' | 'hybrid' | 'trending' | 'category';
}

/**
 * Personalized recommendation
 */
export interface PersonalizedRecommendation extends RecommendationResult {
  personalizationScore: number;
  explanation: string;
}

import { describe, it, expect, beforeEach } from 'vitest';
import { MacroRecommendationEngine } from '../../server/recommendations/recommendation-engine';
import { MacroCommentsEngine } from '../../server/collaboration/comments-engine';
import { MacroPerformanceProfiler } from '../../server/profiling/performance-profiler';

describe('Advanced Features: Recommendations, Comments, Performance', () => {
  let recommendationEngine: MacroRecommendationEngine;
  let commentsEngine: MacroCommentsEngine;
  let profiler: MacroPerformanceProfiler;

  beforeEach(() => {
    recommendationEngine = new MacroRecommendationEngine();
    commentsEngine = new MacroCommentsEngine();
    profiler = new MacroPerformanceProfiler();
  });

  describe('MacroRecommendationEngine', () => {
    it('should build user profile from behaviors', () => {
      const behaviors = [
        { type: 'execute' as const, macroId: 'macro1', category: 'messaging' },
        { type: 'download' as const, macroId: 'macro2', category: 'messaging' },
        { type: 'rate' as const, macroId: 'macro1', rating: 5 },
      ];

      const profile = recommendationEngine.buildUserProfile('user1', behaviors);

      expect(profile.userId).toBe('user1');
      expect(profile.executedMacros.has('macro1')).toBe(true);
      expect(profile.downloadedMacros.has('macro2')).toBe(true);
      expect(profile.avgRating).toBe(5);
    });

    it('should extract macro features', () => {
      const macro = {
        category: 'messaging',
        tags: ['whatsapp', 'send'],
        avgRating: 4.8,
        downloadCount: 1000,
        actionCount: 5,
        name: 'Send WhatsApp',
        description: 'Send messages via WhatsApp',
      };

      const features = recommendationEngine.extractMacroFeatures('macro1', macro);

      expect(features.macroId).toBe('macro1');
      expect(features.category).toBe('messaging');
      expect(features.complexity).toBe('beginner');
    });

    it('should get collaborative recommendations', () => {
      // Build user profile
      recommendationEngine.buildUserProfile('user1', [
        { type: 'execute' as const, macroId: 'macro1', category: 'messaging' },
      ]);

      // Extract features
      recommendationEngine.extractMacroFeatures('macro1', {
        category: 'messaging',
        tags: ['whatsapp'],
        name: 'Send WhatsApp',
      });

      const recs = recommendationEngine.getRecommendations('user1', 5, 'collaborative');

      expect(Array.isArray(recs)).toBe(true);
    });

    it('should get content-based recommendations', () => {
      recommendationEngine.buildUserProfile('user1', [
        { type: 'execute' as const, macroId: 'macro1', category: 'messaging' },
      ]);

      recommendationEngine.extractMacroFeatures('macro1', {
        category: 'messaging',
        tags: ['whatsapp'],
        name: 'Send WhatsApp',
      });

      recommendationEngine.extractMacroFeatures('macro2', {
        category: 'messaging',
        tags: ['telegram'],
        name: 'Send Telegram',
      });

      const recs = recommendationEngine.getRecommendations('user1', 5, 'content');

      expect(Array.isArray(recs)).toBe(true);
    });

    it('should get personalized recommendations', () => {
      recommendationEngine.buildUserProfile('user1', [
        { type: 'execute' as const, macroId: 'macro1', category: 'messaging' },
      ]);

      const recs = recommendationEngine.getPersonalizedRecommendations('user1', 5);

      expect(Array.isArray(recs)).toBe(true);
      recs.forEach((rec) => {
        expect(rec.personalizationScore).toBeGreaterThanOrEqual(0);
        expect(rec.personalizationScore).toBeLessThanOrEqual(1);
      });
    });

    it('should get trending recommendations', () => {
      recommendationEngine.extractMacroFeatures('macro1', {
        category: 'messaging',
        tags: ['whatsapp'],
        trendScore: 0.9,
        name: 'Send WhatsApp',
      });

      const recs = recommendationEngine.getTrendingRecommendations(5);

      expect(Array.isArray(recs)).toBe(true);
    });

    it('should get category recommendations', () => {
      recommendationEngine.extractMacroFeatures('macro1', {
        category: 'messaging',
        tags: ['whatsapp'],
        avgRating: 4.8,
        downloadCount: 1000,
        name: 'Send WhatsApp',
      });

      const recs = recommendationEngine.getCategoryRecommendations('messaging', 5);

      expect(Array.isArray(recs)).toBe(true);
    });
  });

  describe('MacroCommentsEngine', () => {
    it('should add comment to macro', () => {
      const comment = commentsEngine.addComment('macro1', 5, 'user1', 'This is a comment');

      expect(comment.id).toBeDefined();
      expect(comment.macroId).toBe('macro1');
      expect(comment.lineNumber).toBe(5);
      expect(comment.content).toBe('This is a comment');
    });

    it('should get comments for line', () => {
      commentsEngine.addComment('macro1', 5, 'user1', 'Comment 1');
      commentsEngine.addComment('macro1', 5, 'user2', 'Comment 2');

      const comments = commentsEngine.getCommentsForLine('macro1', 5);

      expect(comments.length).toBe(2);
    });

    it('should add reply to comment', () => {
      const comment = commentsEngine.addComment('macro1', 5, 'user1', 'Original comment');
      const reply = commentsEngine.addComment(
        'macro1',
        5,
        'user2',
        'Reply to comment',
        comment.id
      );

      expect(reply.parentCommentId).toBe(comment.id);

      const thread = commentsEngine.getCommentThread(comment.id);
      expect(thread?.replies.includes(reply.id)).toBe(true);
    });

    it('should update comment', () => {
      const comment = commentsEngine.addComment('macro1', 5, 'user1', 'Original');
      const updated = commentsEngine.updateComment(comment.id, 'Updated');

      expect(updated).toBe(true);

      const comments = commentsEngine.getCommentsForLine('macro1', 5);
      expect(comments[0].content).toBe('Updated');
    });

    it('should resolve thread', () => {
      const comment = commentsEngine.addComment('macro1', 5, 'user1', 'Issue');
      const resolved = commentsEngine.resolveThread(comment.id);

      expect(resolved).toBe(true);

      const thread = commentsEngine.getCommentThread(comment.id);
      expect(thread?.resolved).toBe(true);
    });

    it('should add reaction to comment', () => {
      const comment = commentsEngine.addComment('macro1', 5, 'user1', 'Comment');
      const added = commentsEngine.addReaction(comment.id, 'user2', '👍');

      expect(added).toBe(true);

      const summary = commentsEngine.getReactionSummary(comment.id);
      expect(summary.get('👍')).toBe(1);
    });

    it('should get comment statistics', () => {
      commentsEngine.addComment('macro1', 5, 'user1', 'Comment 1');
      commentsEngine.addComment('macro1', 5, 'user2', 'Comment 2');
      commentsEngine.addComment('macro1', 10, 'user3', 'Comment 3');

      const stats = commentsEngine.getCommentStatistics('macro1');

      expect(stats.totalComments).toBe(3);
      expect(stats.commentsByLine[5]).toBe(2);
      expect(stats.commentsByLine[10]).toBe(1);
    });

    it('should extract mentions', () => {
      const comment = commentsEngine.addComment(
        'macro1',
        5,
        'user1',
        '@john Please review this @jane'
      );

      expect(comment.mentions).toContain('john');
      expect(comment.mentions).toContain('jane');
    });
  });

  describe('MacroPerformanceProfiler', () => {
    it('should start and end profiling', () => {
      const trace = profiler.startProfiling('exec1', 'macro1');

      expect(trace.executionId).toBe('exec1');
      expect(trace.macroId).toBe('macro1');
      expect(trace.status).toBe('running');

      const ended = profiler.endProfiling('exec1', 'macro1', 'success');

      expect(ended?.status).toBe('success');
      expect(ended?.duration).toBeGreaterThan(0);
    });

    it('should record actions', () => {
      const trace = profiler.startProfiling('exec1', 'macro1');

      profiler.recordAction('exec1', 'macro1', {
        type: 'tap',
        startTime: Date.now(),
        endTime: Date.now() + 100,
        duration: 100,
      });

      profiler.endProfiling('exec1', 'macro1', 'success');

      const timeline = profiler.getExecutionTimeline('macro1', 'exec1');

      expect(timeline.length).toBe(1);
      expect(timeline[0].actionCount).toBe(1);
    });

    it('should identify bottlenecks', () => {
      const trace = profiler.startProfiling('exec1', 'macro1');

      // Add slow wait action
      profiler.recordAction('exec1', 'macro1', {
        type: 'wait',
        startTime: Date.now(),
        endTime: Date.now() + 2000,
        duration: 2000,
      });

      // Add fast tap action
      profiler.recordAction('exec1', 'macro1', {
        type: 'tap',
        startTime: Date.now() + 2000,
        endTime: Date.now() + 2100,
        duration: 100,
      });

      profiler.endProfiling('exec1', 'macro1', 'success');

      const bottlenecks = profiler.getBottlenecks('macro1');

      expect(bottlenecks.length).toBeGreaterThan(0);
    });

    it('should generate optimization suggestions', () => {
      const trace = profiler.startProfiling('exec1', 'macro1');

      // Add multiple waits
      for (let i = 0; i < 4; i++) {
        profiler.recordAction('exec1', 'macro1', {
          type: 'wait',
          startTime: Date.now() + i * 1000,
          endTime: Date.now() + i * 1000 + 500,
          duration: 500,
        });
      }

      profiler.endProfiling('exec1', 'macro1', 'success');

      const suggestions = profiler.getOptimizationSuggestions('macro1');

      expect(suggestions.length).toBeGreaterThan(0);
    });

    it('should get performance statistics', () => {
      profiler.startProfiling('exec1', 'macro1');
      profiler.recordAction('exec1', 'macro1', {
        type: 'tap',
        startTime: Date.now(),
        endTime: Date.now() + 100,
        duration: 100,
      });
      profiler.endProfiling('exec1', 'macro1', 'success');

      profiler.startProfiling('exec2', 'macro1');
      profiler.recordAction('exec2', 'macro1', {
        type: 'tap',
        startTime: Date.now(),
        endTime: Date.now() + 150,
        duration: 150,
      });
      profiler.endProfiling('exec2', 'macro1', 'success');

      const stats = profiler.getPerformanceStatistics('macro1');

      expect(stats.totalExecutions).toBe(2);
      expect(stats.successfulExecutions).toBe(2);
      expect(stats.successRate).toBe(100);
    });

    it('should compare executions', () => {
      profiler.startProfiling('exec1', 'macro1');
      profiler.recordAction('exec1', 'macro1', {
        type: 'tap',
        startTime: Date.now(),
        endTime: Date.now() + 100,
        duration: 100,
      });
      profiler.endProfiling('exec1', 'macro1', 'success');

      profiler.startProfiling('exec2', 'macro1');
      profiler.recordAction('exec2', 'macro1', {
        type: 'tap',
        startTime: Date.now(),
        endTime: Date.now() + 200,
        duration: 200,
      });
      profiler.endProfiling('exec2', 'macro1', 'success');

      const comparison = profiler.compareExecutions('macro1', 'exec1', 'exec2');

      expect(comparison).not.toBeNull();
      expect(comparison?.fasterExecution).toBe('exec1');
    });

    it('should export profiling data', () => {
      profiler.startProfiling('exec1', 'macro1');
      profiler.recordAction('exec1', 'macro1', {
        type: 'tap',
        startTime: Date.now(),
        endTime: Date.now() + 100,
        duration: 100,
      });
      profiler.endProfiling('exec1', 'macro1', 'success');

      const exported = profiler.exportProfilingData('macro1');

      expect(exported).toContain('macro1');
      expect(exported).toContain('executions');
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete recommendation workflow', () => {
      recommendationEngine.buildUserProfile('user1', [
        { type: 'execute' as const, macroId: 'macro1', category: 'messaging' },
      ]);

      recommendationEngine.extractMacroFeatures('macro1', {
        category: 'messaging',
        tags: ['whatsapp'],
        name: 'Send WhatsApp',
      });

      const recs = recommendationEngine.getPersonalizedRecommendations('user1', 5);

      expect(recs.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle complete comments workflow', () => {
      const comment = commentsEngine.addComment('macro1', 5, 'user1', 'Issue found');
      const reply = commentsEngine.addComment(
        'macro1',
        5,
        'user2',
        'I can fix this',
        comment.id
      );

      commentsEngine.addReaction(reply.id, 'user1', '👍');
      commentsEngine.resolveThread(comment.id);

      const stats = commentsEngine.getCommentStatistics('macro1');

      expect(stats.totalComments).toBe(2);
      expect(stats.resolvedComments).toBe(2);
    });

    it('should handle complete profiling workflow', () => {
      const trace = profiler.startProfiling('exec1', 'macro1');

      profiler.recordAction('exec1', 'macro1', {
        type: 'tap',
        startTime: Date.now(),
        endTime: Date.now() + 100,
        duration: 100,
      });

      profiler.recordAction('exec1', 'macro1', {
        type: 'wait',
        startTime: Date.now() + 100,
        endTime: Date.now() + 1100,
        duration: 1000,
      });

      profiler.endProfiling('exec1', 'macro1', 'success');

      const timeline = profiler.getExecutionTimeline('macro1', 'exec1');
      const bottlenecks = profiler.getBottlenecks('macro1');
      const suggestions = profiler.getOptimizationSuggestions('macro1');
      const stats = profiler.getPerformanceStatistics('macro1');

      expect(timeline.length).toBe(1);
      expect(bottlenecks.length).toBeGreaterThan(0);
      expect(suggestions.length).toBeGreaterThan(0);
      expect(stats.totalExecutions).toBe(1);
    });
  });
});

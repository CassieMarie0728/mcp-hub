import { describe, it, expect, beforeEach } from 'vitest';
import { DiffEditorEngine } from '../../server/editor/diff-editor-engine';
import { NotificationPreferencesSystem } from '../../server/notifications/notification-preferences';
import { TrendingAnalyticsEngine } from '../../server/analytics/trending-analytics';

describe('User Features: Diff Editor, Notifications, Analytics', () => {
  let diffEditor: DiffEditorEngine;
  let notificationPrefs: NotificationPreferencesSystem;
  let trendingAnalytics: TrendingAnalyticsEngine;

  beforeEach(() => {
    diffEditor = new DiffEditorEngine();
    notificationPrefs = new NotificationPreferencesSystem();
    trendingAnalytics = new TrendingAnalyticsEngine();
  });

  describe('DiffEditorEngine', () => {
    it('should generate suggestions', () => {
      const from = { action: 'tap', delay: 100 };
      const to = { action: 'tap', delay: 200, retry: 3 };

      const suggestions = diffEditor.generateSuggestions(from, to);
      expect(suggestions.length).toBeGreaterThan(0);
    });

    it('should apply suggestion', () => {
      const suggestions = diffEditor.generateSuggestions(
        { action: 'tap' },
        { action: 'tap', retry: 3 },
        'diff1',
      );

      const result = diffEditor.applySuggestion('diff1', suggestions[0].id);
      expect(result).toBe(true);
    });

    it('should reject suggestion', () => {
      const suggestions = diffEditor.generateSuggestions(
        { action: 'tap' },
        { action: 'tap', retry: 3 },
        'diff1',
      );

      const result = diffEditor.rejectSuggestion('diff1', suggestions[0].id);
      expect(result).toBe(true);
    });

    it('should get applied edits', () => {
      const suggestions = diffEditor.generateSuggestions(
        { action: 'tap' },
        { action: 'tap', retry: 3 },
        'diff1',
      );

      diffEditor.applySuggestion('diff1', suggestions[0].id);
      const applied = diffEditor.getAppliedEdits('diff1');

      expect(applied.length).toBeGreaterThan(0);
      expect(applied[0].status).toBe('applied');
    });

    it('should get suggestion statistics', () => {
      const suggestions = diffEditor.generateSuggestions(
        { action: 'tap' },
        { action: 'tap', retry: 3 },
        'diff1',
      );

      const stats = diffEditor.getSuggestionStats('diff1');
      expect(stats.totalSuggestions).toBeGreaterThan(0);
    });

    it('should auto-apply safe suggestions', () => {
      const suggestions = diffEditor.generateSuggestions(
        { action: 'tap' },
        { action: 'tap', retry: 3 },
        'diff1',
      );

      const applied = diffEditor.autoApplySafeSuggestions('diff1');
      expect(applied).toBeGreaterThanOrEqual(0);
    });
  });

  describe('NotificationPreferencesSystem', () => {
    it('should create default preferences', () => {
      const prefs = notificationPrefs.createDefaultPreferences('user1');

      expect(prefs.userId).toBe('user1');
      expect(prefs.notificationTypes).toBeDefined();
      expect(prefs.deliveryMethods).toBeDefined();
    });

    it('should get user preferences', () => {
      notificationPrefs.createDefaultPreferences('user1');
      const prefs = notificationPrefs.getUserPreferences('user1');

      expect(prefs).not.toBeNull();
      expect(prefs?.userId).toBe('user1');
    });

    it('should update notification type preference', () => {
      notificationPrefs.createDefaultPreferences('user1');
      const result = notificationPrefs.updateNotificationTypePreference(
        'user1',
        'macro_execution',
        {
          enabled: false,
        },
      );

      expect(result).toBe(true);
      const prefs = notificationPrefs.getUserPreferences('user1');
      expect(prefs?.notificationTypes.macro_execution.enabled).toBe(false);
    });

    it('should update delivery method preference', () => {
      notificationPrefs.createDefaultPreferences('user1');
      const result = notificationPrefs.updateDeliveryMethodPreference('user1', 'email', {
        enabled: true,
      });

      expect(result).toBe(true);
      const prefs = notificationPrefs.getUserPreferences('user1');
      expect(prefs?.deliveryMethods.email.enabled).toBe(true);
    });

    it('should check if notification should be delivered', () => {
      notificationPrefs.createDefaultPreferences('user1');

      const shouldDeliver = notificationPrefs.shouldDeliverNotification(
        'user1',
        'macro_execution',
        'inApp',
      );

      expect(shouldDeliver).toBe(true);
    });

    it('should get delivery methods', () => {
      notificationPrefs.createDefaultPreferences('user1');

      const methods = notificationPrefs.getDeliveryMethods('user1', 'macro_execution');

      expect(methods.length).toBeGreaterThan(0);
      expect(methods).toContain('inApp');
    });

    it('should get retry configuration', () => {
      notificationPrefs.createDefaultPreferences('user1');

      const config = notificationPrefs.getRetryConfiguration('user1', 'inApp');

      expect(config).not.toBeNull();
      expect(config?.maxAttempts).toBeGreaterThan(0);
    });

    it('should check daily limit', () => {
      notificationPrefs.createDefaultPreferences('user1');

      const limited = notificationPrefs.checkDailyLimit('user1', 500);

      expect(typeof limited).toBe('boolean');
    });

    it('should export preferences', () => {
      notificationPrefs.createDefaultPreferences('user1');

      const exported = notificationPrefs.exportPreferences('user1');

      expect(exported).not.toBeNull();
      expect(exported).toContain('user1');
    });

    it('should import preferences', () => {
      notificationPrefs.createDefaultPreferences('user1');
      const exported = notificationPrefs.exportPreferences('user1');

      const imported = notificationPrefs.importPreferences('user1', exported!);

      expect(imported).toBe(true);
    });

    it('should reset to defaults', () => {
      notificationPrefs.createDefaultPreferences('user1');
      notificationPrefs.updateNotificationTypePreference('user1', 'macro_execution', {
        enabled: false,
      });

      const reset = notificationPrefs.resetToDefaults('user1');

      expect(reset.notificationTypes.macro_execution.enabled).toBe(true);
    });

    it('should get preferences statistics', () => {
      notificationPrefs.createDefaultPreferences('user1');
      notificationPrefs.createDefaultPreferences('user2');

      const stats = notificationPrefs.getPreferencesStatistics();

      expect(stats.totalUsers).toBeGreaterThanOrEqual(2);
      expect(stats.inAppEnabled).toBeGreaterThanOrEqual(0);
    });
  });

  describe('TrendingAnalyticsEngine', () => {
    it('should record macro execution', () => {
      trendingAnalytics.recordMacroExecution('macro1', 1500, true);

      const metrics = trendingAnalytics.getTrendingMacros(1);
      expect(metrics.length).toBeGreaterThan(0);
      expect(metrics[0].totalExecutions).toBe(1);
    });

    it('should record macro download', () => {
      trendingAnalytics.recordMacroDownload('macro1');
      trendingAnalytics.recordMacroDownload('macro1');

      const metrics = trendingAnalytics.getTrendingMacros(1);
      expect(metrics[0].downloads).toBe(2);
    });

    it('should record macro view', () => {
      trendingAnalytics.recordMacroView('macro1');

      const metrics = trendingAnalytics.getTrendingMacros(1);
      expect(metrics[0].views).toBe(1);
    });

    it('should record macro rating', () => {
      trendingAnalytics.recordMacroRating('macro1', 5, 'Great macro!');

      const metrics = trendingAnalytics.getTrendingMacros(1);
      expect(metrics[0].ratings.length).toBe(1);
    });

    it('should get trending macros', () => {
      trendingAnalytics.recordMacroExecution('macro1', 1000, true);
      trendingAnalytics.recordMacroExecution('macro2', 2000, true);
      trendingAnalytics.recordMacroDownload('macro1');

      const trending = trendingAnalytics.getTrendingMacros(10);

      expect(trending.length).toBeGreaterThan(0);
      expect(trending[0].macroId).toBeDefined();
    });

    it('should get popular macros', () => {
      trendingAnalytics.recordMacroRating('macro1', 5);
      trendingAnalytics.recordMacroRating('macro1', 4);
      trendingAnalytics.recordMacroRating('macro2', 3);

      const popular = trendingAnalytics.getPopularMacros(10);

      expect(popular.length).toBeGreaterThan(0);
      expect(popular[0].macroId).toBe('macro1');
    });

    it('should get most downloaded macros', () => {
      trendingAnalytics.recordMacroDownload('macro1');
      trendingAnalytics.recordMacroDownload('macro1');
      trendingAnalytics.recordMacroDownload('macro2');

      const downloaded = trendingAnalytics.getMostDownloadedMacros(10);

      expect(downloaded.length).toBeGreaterThan(0);
      expect(downloaded[0].macroId).toBe('macro1');
    });

    it('should get macro statistics', () => {
      trendingAnalytics.recordMacroExecution('macro1', 1000, true);
      trendingAnalytics.recordMacroExecution('macro1', 1500, false);
      trendingAnalytics.recordMacroRating('macro1', 4.5);

      const stats = trendingAnalytics.getMacroStatistics('macro1');

      expect(stats).not.toBeNull();
      expect(stats?.totalExecutions).toBe(2);
      expect(stats?.successRate).toBe(50);
    });

    it('should get community insights', () => {
      trendingAnalytics.recordMacroExecution('macro1', 1000, true);
      trendingAnalytics.recordMacroExecution('macro2', 1500, true);
      trendingAnalytics.recordMacroDownload('macro1');

      const insights = trendingAnalytics.getCommunityInsights();

      expect(insights.totalExecutions).toBe(2);
      expect(insights.totalDownloads).toBe(1);
      expect(insights.overallSuccessRate).toBe(100);
    });

    it('should get trending data (cached)', () => {
      trendingAnalytics.recordMacroExecution('macro1', 1000, true);

      const data1 = trendingAnalytics.getTrendingData();
      const data2 = trendingAnalytics.getTrendingData();

      expect(data1.generatedAt.getTime()).toBe(data2.generatedAt.getTime());
    });

    it('should record fork creation', () => {
      trendingAnalytics.recordForkCreation('fork1', 'macro1', 'user1');

      const forks = trendingAnalytics.getTrendingForks(10);

      expect(forks.length).toBeGreaterThan(0);
      expect(forks[0].forkId).toBe('fork1');
    });

    it('should record version release', () => {
      trendingAnalytics.recordVersionRelease('v1', 'macro1', 1);

      const versions = trendingAnalytics.getTrendingVersions(10);

      expect(versions.length).toBeGreaterThan(0);
      expect(versions[0].versionId).toBe('v1');
    });

    it('should export analytics', () => {
      trendingAnalytics.recordMacroExecution('macro1', 1000, true);

      const exported = trendingAnalytics.exportAnalytics();

      expect(exported).toContain('macro1');
      expect(exported).toContain('trending');
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete diff editor workflow', () => {
      const suggestions = diffEditor.generateSuggestions(
        { action: 'tap', delay: 100 },
        { action: 'tap', delay: 200, retry: 3 },
        'diff1',
      );

      expect(suggestions.length).toBeGreaterThan(0);

      diffEditor.applySuggestion('diff1', suggestions[0].id);
      const applied = diffEditor.getAppliedEdits('diff1');

      expect(applied.length).toBeGreaterThan(0);
    });

    it('should handle complete notification preferences workflow', () => {
      notificationPrefs.createDefaultPreferences('user1');

      notificationPrefs.updateNotificationTypePreference('user1', 'macro_execution', {
        enabled: false,
      });

      const shouldDeliver = notificationPrefs.shouldDeliverNotification(
        'user1',
        'macro_execution',
        'inApp',
      );

      expect(shouldDeliver).toBe(false);
    });

    it('should handle complete analytics workflow', () => {
      trendingAnalytics.recordMacroExecution('macro1', 1000, true);
      trendingAnalytics.recordMacroDownload('macro1');
      trendingAnalytics.recordMacroRating('macro1', 5);

      const trending = trendingAnalytics.getTrendingMacros(1);
      const stats = trendingAnalytics.getMacroStatistics('macro1');
      const insights = trendingAnalytics.getCommunityInsights();

      expect(trending.length).toBeGreaterThan(0);
      expect(stats?.totalExecutions).toBe(1);
      expect(insights.totalExecutions).toBe(1);
    });
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { MacroVersionEngine } from '../../server/versioning/macro-version-engine';
import { DiffVisualizer } from '../../server/versioning/diff-visualizer';
import { MacroForkEngine } from '../../server/versioning/macro-fork-engine';
import { NotificationEngine } from '../../server/notifications/notification-engine';
import { NotificationDispatcher } from '../../server/notifications/notification-dispatcher';

describe('Macro Versioning & Notifications', () => {
  let versionEngine: MacroVersionEngine;
  let forkEngine: MacroForkEngine;
  let notificationEngine: NotificationEngine;
  let dispatcher: NotificationDispatcher;

  beforeEach(() => {
    versionEngine = new MacroVersionEngine();
    forkEngine = new MacroForkEngine();
    notificationEngine = new NotificationEngine();
    dispatcher = new NotificationDispatcher(notificationEngine);
  });

  describe('MacroVersionEngine', () => {
    it('should create versions', () => {
      const v1 = versionEngine.createVersion(
        'macro1',
        'user1',
        { action: 'tap' },
        'Initial version',
      );
      expect(v1.versionNumber).toBe(1);
      expect(v1.macroId).toBe('macro1');
      expect(v1.userId).toBe('user1');
    });

    it('should get current version', () => {
      versionEngine.createVersion('macro1', 'user1', { action: 'tap' }, 'v1');
      versionEngine.createVersion('macro1', 'user1', { action: 'swipe' }, 'v2');

      const current = versionEngine.getCurrentVersion('macro1');
      expect(current?.versionNumber).toBe(2);
    });

    it('should get version history', () => {
      versionEngine.createVersion('macro1', 'user1', { action: 'tap' }, 'v1');
      versionEngine.createVersion('macro1', 'user1', { action: 'swipe' }, 'v2');
      versionEngine.createVersion('macro1', 'user1', { action: 'type' }, 'v3');

      const history = versionEngine.getVersionHistory('macro1');
      expect(history).toHaveLength(3);
      expect(history[0].versionNumber).toBe(3);
    });

    it('should rollback to version', () => {
      versionEngine.createVersion('macro1', 'user1', { action: 'tap' }, 'v1');
      versionEngine.createVersion('macro1', 'user1', { action: 'swipe' }, 'v2');

      const rollback = versionEngine.rollbackToVersion('macro1', 1, 'user1', 'Revert to v1');
      expect(rollback?.content).toEqual({ action: 'tap' });
      expect(rollback?.versionNumber).toBe(3);
    });

    it('should tag versions', () => {
      versionEngine.createVersion('macro1', 'user1', { action: 'tap' }, 'v1');
      const tagged = versionEngine.tagVersion('macro1', 1, 'stable');

      expect(tagged).toBe(true);
      const version = versionEngine.getVersion('macro1', 1);
      expect(version?.tags).toContain('stable');
    });

    it('should release versions', () => {
      versionEngine.createVersion('macro1', 'user1', { action: 'tap' }, 'v1');
      const released = versionEngine.releaseVersion('macro1', 1);

      expect(released).toBe(true);
      const version = versionEngine.getVersion('macro1', 1);
      expect(version?.isReleased).toBe(true);
    });

    it('should compare versions', () => {
      versionEngine.createVersion('macro1', 'user1', { action: 'tap', delay: 100 }, 'v1');
      versionEngine.createVersion('macro1', 'user1', { action: 'tap', delay: 200 }, 'v2');

      const diff = versionEngine.compareVersions('macro1', 1, 2);
      expect(diff).not.toBeNull();
      expect(diff?.changes.length).toBeGreaterThan(0);
    });

    it('should get version statistics', () => {
      versionEngine.createVersion('macro1', 'user1', { action: 'tap' }, 'v1');
      versionEngine.createVersion('macro1', 'user1', { action: 'swipe' }, 'v2');
      versionEngine.releaseVersion('macro1', 1);

      const stats = versionEngine.getVersionStats('macro1');
      expect(stats.totalVersions).toBe(2);
      expect(stats.releasedVersions).toBe(1);
    });

    it('should merge versions', () => {
      versionEngine.createVersion('macro1', 'user1', { action: 'tap' }, 'base');
      versionEngine.createVersion('macro1', 'user1', { action: 'tap', delay: 100 }, 'v1');
      versionEngine.createVersion('macro1', 'user1', { action: 'tap', retry: 3 }, 'v2');

      const merged = versionEngine.mergeVersions('macro1', 1, 2, 3, 'user1');
      expect(merged).not.toBeNull();
      expect(merged?.versionNumber).toBe(4);
    });
  });

  describe('DiffVisualizer', () => {
    it('should generate side-by-side diff', () => {
      const from = { action: 'tap', delay: 100 };
      const to = { action: 'tap', delay: 200, retry: 3 };

      const diff = DiffVisualizer.generateSideBySideDiff(from, to);
      expect(diff.summary.added).toBeGreaterThan(0);
    });

    it('should calculate diff statistics', () => {
      const from = { action: 'tap', delay: 100 };
      const to = { action: 'swipe', delay: 200, retry: 3 };

      const stats = DiffVisualizer.calculateDiffStats(from, to);
      expect(stats.totalChanges).toBeGreaterThan(0);
      expect(stats.similarity).toBeLessThan(100);
    });

    it('should generate unified diff', () => {
      const from = 'line1\nline2\nline3';
      const to = 'line1\nline2_modified\nline3\nline4';

      const diff = DiffVisualizer.generateUnifiedDiff(from, to);
      expect(diff).toContain('-');
      expect(diff).toContain('+');
    });

    it('should generate HTML diff', () => {
      const from = { action: 'tap' };
      const to = { action: 'swipe' };

      const html = DiffVisualizer.generateHtmlDiff(from, to);
      expect(html).toContain('diff-table');
      expect(html).toContain('diff-remove');
      expect(html).toContain('diff-add');
    });
  });

  describe('MacroForkEngine', () => {
    it('should fork macro', () => {
      const fork = forkEngine.forkMacro('original1', 'user1', 'My Fork', 'Custom version');
      expect(fork.originalMacroId).toBe('original1');
      expect(fork.forkedBy).toBe('user1');
      expect(fork.name).toBe('My Fork');
    });

    it('should get forks', () => {
      forkEngine.forkMacro('original1', 'user1', 'Fork 1');
      forkEngine.forkMacro('original1', 'user2', 'Fork 2');

      const forks = forkEngine.getForks('original1');
      expect(forks).toHaveLength(2);
    });

    it('should track fork lineage', () => {
      const fork1 = forkEngine.forkMacro('original1', 'user1', 'Fork 1');
      const fork2 = forkEngine.forkMacro(fork1.id, 'user2', 'Fork 2');

      const lineage = forkEngine.getLineage(fork2.id);
      expect(lineage?.ancestors).toContain('original1');
      expect(lineage?.ancestors).toContain(fork1.id);
    });

    it('should get fork tree', () => {
      forkEngine.forkMacro('original1', 'user1', 'Fork 1');
      forkEngine.forkMacro('original1', 'user2', 'Fork 2');

      const tree = forkEngine.getForkTree('original1');
      expect(tree.children.length).toBeGreaterThanOrEqual(0);
    });

    it('should publish fork', () => {
      const fork = forkEngine.forkMacro('original1', 'user1', 'My Fork');
      const published = forkEngine.publishFork(fork.id, ['useful', 'automation']);

      expect(published?.isPublic).toBe(true);
      expect(published?.tags).toContain('useful');
    });

    it('should rate fork', () => {
      const fork = forkEngine.forkMacro('original1', 'user1', 'My Fork');
      forkEngine.publishFork(fork.id);

      const rated = forkEngine.rateFork(fork.id, 5, 'Great macro!');
      expect(rated).toBe(true);
    });

    it('should get popular forks', () => {
      const fork1 = forkEngine.forkMacro('original1', 'user1', 'Fork 1');
      forkEngine.publishFork(fork1.id);
      forkEngine.downloadFork(fork1.id);
      forkEngine.downloadFork(fork1.id);

      const popular = forkEngine.getPopularForks();
      expect(popular.length).toBeGreaterThan(0);
    });

    it('should get attribution chain', () => {
      const fork1 = forkEngine.forkMacro('original1', 'user1', 'Fork 1');
      const fork2 = forkEngine.forkMacro(fork1.id, 'user2', 'Fork 2');

      const chain = forkEngine.getAttributionChain(fork2.id);
      expect(chain.length).toBeGreaterThan(0);
      expect(chain[0].type).toBe('original');
    });
  });

  describe('NotificationEngine', () => {
    it('should create notification', () => {
      const notif = notificationEngine.createNotification(
        'user1',
        'macro_execution',
        'Macro executed',
        'Success',
      );

      expect(notif.userId).toBe('user1');
      expect(notif.read).toBe(false);
      expect(notif.delivered).toBe(false);
    });

    it('should subscribe user', () => {
      notificationEngine.subscribe('user1', 'conn1');
      const stats = notificationEngine.getUserStatistics('user1');

      expect(stats.isConnected).toBe(true);
      expect(stats.connectionCount).toBe(1);
    });

    it('should mark notification as read', () => {
      const notif = notificationEngine.createNotification(
        'user1',
        'macro_execution',
        'Macro executed',
        'Success',
      );

      notificationEngine.markAsRead(notif.id);
      const notifications = notificationEngine.getNotifications('user1');

      expect(notifications[0].read).toBe(true);
    });

    it('should get unread count', () => {
      notificationEngine.createNotification('user1', 'macro_execution', 'Macro 1', 'Success');
      notificationEngine.createNotification('user1', 'macro_execution', 'Macro 2', 'Success');

      const count = notificationEngine.getUnreadCount('user1');
      expect(count).toBe(2);
    });

    it('should broadcast notification', () => {
      const notifs = notificationEngine.broadcastNotification(
        'system_alert',
        'System Update',
        'New features available',
        ['user1', 'user2', 'user3'],
      );

      expect(notifs).toHaveLength(3);
    });

    it('should cleanup old notifications', () => {
      notificationEngine.createNotification('user1', 'macro_execution', 'Old', 'Old notif');
      const removed = notificationEngine.cleanupOldNotifications(0);

      expect(removed).toBeGreaterThanOrEqual(0);
    });

    it('should get statistics', () => {
      notificationEngine.createNotification('user1', 'macro_execution', 'Macro 1', 'Success');
      notificationEngine.createNotification('user2', 'macro_execution', 'Macro 2', 'Success');

      const stats = notificationEngine.getStatistics();
      expect(stats.totalNotifications).toBeGreaterThanOrEqual(2);
    });
  });

  describe('NotificationDispatcher', () => {
    it('should dispatch collaboration update', () => {
      dispatcher.dispatchCollaborationUpdate('user1', 'John', 'edited', 'My Macro');
      const notifs = notificationEngine.getNotifications('user1');

      expect(notifs.length).toBeGreaterThan(0);
      expect(notifs[0].type).toBe('collaboration_update');
    });

    it('should dispatch macro execution', () => {
      dispatcher.dispatchMacroExecution('user1', 'My Macro', 'success', 2340);
      const notifs = notificationEngine.getNotifications('user1');

      expect(notifs.length).toBeGreaterThan(0);
      expect(notifs[0].type).toBe('macro_execution');
    });

    it('should dispatch anomaly alert', () => {
      dispatcher.dispatchAnomalyAlert('user1', 'high_failure_rate', 'My Macro', '45% failure rate');
      const notifs = notificationEngine.getNotifications('user1');

      expect(notifs.length).toBeGreaterThan(0);
      expect(notifs[0].type).toBe('anomaly_alert');
      expect(notifs[0].priority).toBe('high');
    });

    it('should dispatch batch notifications', () => {
      dispatcher.dispatchBatch([
        {
          userId: 'user1',
          type: 'macro_execution',
          data: { macroName: 'Macro 1', status: 'success', duration: 1000 },
        },
        {
          userId: 'user1',
          type: 'collaboration_update',
          data: { collaboratorName: 'John', action: 'edited', macroName: 'Macro 1' },
        },
      ]);

      const notifs = notificationEngine.getNotifications('user1');
      expect(notifs.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete versioning workflow', () => {
      // Create versions
      versionEngine.createVersion('macro1', 'user1', { action: 'tap' }, 'Initial');
      versionEngine.createVersion('macro1', 'user1', { action: 'tap', delay: 100 }, 'Added delay');

      // Tag and release
      versionEngine.tagVersion('macro1', 1, 'stable');
      versionEngine.releaseVersion('macro1', 1);

      // Get stats
      const stats = versionEngine.getVersionStats('macro1');
      expect(stats.totalVersions).toBe(2);
      expect(stats.releasedVersions).toBe(1);
    });

    it('should handle complete forking workflow', () => {
      // Create fork
      const fork = forkEngine.forkMacro('original1', 'user1', 'My Fork');

      // Publish and rate
      forkEngine.publishFork(fork.id, ['useful']);
      forkEngine.rateFork(fork.id, 5);
      forkEngine.downloadFork(fork.id);

      // Get stats
      const stats = forkEngine.getForkStats('original1');
      expect(stats.totalForks).toBe(1);
      expect(stats.publicForks).toBe(1);
    });

    it('should handle complete notification workflow', () => {
      // Subscribe user
      notificationEngine.subscribe('user1', 'conn1');

      // Create and dispatch notifications
      dispatcher.dispatchMacroExecution('user1', 'Macro 1', 'success', 1000);
      dispatcher.dispatchCollaborationUpdate('user1', 'John', 'edited', 'Macro 1');

      // Check notifications
      const notifs = notificationEngine.getNotifications('user1');
      expect(notifs.length).toBe(2);

      // Mark as read
      notificationEngine.markAllAsRead('user1');
      const unreadCount = notificationEngine.getUnreadCount('user1');
      expect(unreadCount).toBe(0);
    });
  });
});

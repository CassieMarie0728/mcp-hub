import { EventEmitter } from 'events';

/**
 * Notification Engine
 * Manages real-time notifications with WebSocket delivery
 */
export class NotificationEngine extends EventEmitter {
  private notifications: Map<string, Notification[]> = new Map();
  private subscribers: Map<string, Set<string>> = new Map();
  private notificationQueues: Map<string, Notification[]> = new Map();
  private deliveryLog: DeliveryLog[] = [];

  /**
   * Create notification
   */
  createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    data?: Record<string, any>,
    priority: 'low' | 'normal' | 'high' = 'normal',
  ): Notification {
    const notification: Notification = {
      id: `notif_${userId}_${Date.now()}`,
      userId,
      type,
      title,
      message,
      data,
      priority,
      timestamp: new Date(),
      read: false,
      delivered: false,
      deliveryAttempts: 0,
      maxRetries: 3,
    };

    // Store notification
    if (!this.notifications.has(userId)) {
      this.notifications.set(userId, []);
    }
    this.notifications.get(userId)!.push(notification);

    // Queue for delivery
    if (!this.notificationQueues.has(userId)) {
      this.notificationQueues.set(userId, []);
    }
    this.notificationQueues.get(userId)!.push(notification);

    // Emit event
    this.emit('notification_created', notification);

    return notification;
  }

  /**
   * Subscribe user to notifications
   */
  subscribe(userId: string, connectionId: string): void {
    if (!this.subscribers.has(userId)) {
      this.subscribers.set(userId, new Set());
    }
    this.subscribers.get(userId)!.add(connectionId);

    if (process.env.NODE_ENV === 'development')
      console.log(`User ${userId} subscribed with connection ${connectionId}`);
    this.emit('user_subscribed', { userId, connectionId });
  }

  /**
   * Unsubscribe user
   */
  unsubscribe(userId: string, connectionId: string): void {
    const connections = this.subscribers.get(userId);
    if (connections) {
      connections.delete(connectionId);

      if (connections.size === 0) {
        this.subscribers.delete(userId);
      }
      if (process.env.NODE_ENV === 'development')
        console.log(`User ${userId} unsubscribed from connection ${connectionId}`);
      this.emit('user_unsubscribed', { userId, connectionId });
    }
  }

  /**
   * Deliver notification
   */
  async deliverNotification(notification: Notification): Promise<boolean> {
    const connections = this.subscribers.get(notification.userId);

    if (!connections || connections.size === 0) {
      // User not connected, will be delivered when they reconnect
      return false;
    }

    try {
      // Simulate WebSocket delivery to all connections
      for (const connectionId of connections) {
        this.emit('deliver', {
          connectionId,
          notification,
        });
      }

      // Mark as delivered
      notification.delivered = true;
      notification.deliveryAttempts++;

      // Log delivery
      this.logDelivery(notification.id, 'success', notification.userId);

      return true;
    } catch (error) {
      notification.deliveryAttempts++;

      // Retry if attempts remaining
      if (notification.deliveryAttempts < notification.maxRetries) {
        this.logDelivery(notification.id, 'retry', notification.userId);
        return false;
      }

      this.logDelivery(notification.id, 'failed', notification.userId);
      return false;
    }
  }

  /**
   * Deliver pending notifications
   */
  async deliverPendingNotifications(): Promise<number> {
    let delivered = 0;

    for (const [userId, queue] of this.notificationQueues) {
      while (queue.length > 0) {
        const notification = queue[0];

        const success = await this.deliverNotification(notification);

        if (success) {
          queue.shift();
          delivered++;
        } else if (notification.deliveryAttempts >= notification.maxRetries) {
          queue.shift();
        } else {
          // Stop trying for now, will retry later
          break;
        }
      }
    }

    return delivered;
  }

  /**
   * Mark notification as read
   */
  markAsRead(notificationId: string): boolean {
    for (const notifications of this.notifications.values()) {
      const notif = notifications.find((n) => n.id === notificationId);
      if (notif) {
        notif.read = true;
        this.emit('notification_read', notif);
        return true;
      }
    }

    return false;
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(userId: string): number {
    const notifications = this.notifications.get(userId) || [];
    let count = 0;

    for (const notif of notifications) {
      if (!notif.read) {
        notif.read = true;
        count++;
      }
    }

    this.emit('notifications_read', { userId, count });

    return count;
  }

  /**
   * Get notifications
   */
  getNotifications(
    userId: string,
    limit: number = 50,
    unreadOnly: boolean = false,
  ): Notification[] {
    let notifications = this.notifications.get(userId) || [];

    if (unreadOnly) {
      notifications = notifications.filter((n) => !n.read);
    }

    return notifications.slice(-limit).reverse();
  }

  /**
   * Get unread count
   */
  getUnreadCount(userId: string): number {
    const notifications = this.notifications.get(userId) || [];
    return notifications.filter((n) => !n.read).length;
  }

  /**
   * Delete notification
   */
  deleteNotification(notificationId: string): boolean {
    for (const [userId, notifications] of this.notifications) {
      const index = notifications.findIndex((n) => n.id === notificationId);
      if (index !== -1) {
        notifications.splice(index, 1);
        this.emit('notification_deleted', { userId, notificationId });
        return true;
      }
    }

    return false;
  }

  /**
   * Delete all notifications
   */
  deleteAllNotifications(userId: string): number {
    const notifications = this.notifications.get(userId) || [];
    const count = notifications.length;

    this.notifications.set(userId, []);
    this.emit('notifications_deleted', { userId, count });

    return count;
  }

  /**
   * Broadcast notification
   */
  broadcastNotification(
    type: NotificationType,
    title: string,
    message: string,
    userIds: string[],
    data?: Record<string, any>,
  ): Notification[] {
    const notifications: Notification[] = [];

    for (const userId of userIds) {
      const notif = this.createNotification(userId, type, title, message, data);
      notifications.push(notif);
    }

    return notifications;
  }

  /**
   * Log delivery
   */
  private logDelivery(
    notificationId: string,
    status: 'success' | 'retry' | 'failed',
    userId: string,
  ) {
    this.deliveryLog.push({
      notificationId,
      status,
      userId,
      timestamp: new Date(),
    });

    // Keep log size manageable
    if (this.deliveryLog.length > 10000) {
      this.deliveryLog = this.deliveryLog.slice(-10000);
    }
  }

  /**
   * Get delivery log
   */
  getDeliveryLog(limit: number = 100): DeliveryLog[] {
    return this.deliveryLog.slice(-limit);
  }

  /**
   * Get notification statistics
   */
  getStatistics(): NotificationStats {
    let totalNotifications = 0;
    let totalRead = 0;
    let totalUnread = 0;
    let totalDelivered = 0;

    for (const notifications of this.notifications.values()) {
      totalNotifications += notifications.length;
      totalRead += notifications.filter((n) => n.read).length;
      totalUnread += notifications.filter((n) => !n.read).length;
      totalDelivered += notifications.filter((n) => n.delivered).length;
    }

    const successfulDeliveries = this.deliveryLog.filter((l) => l.status === 'success').length;
    const failedDeliveries = this.deliveryLog.filter((l) => l.status === 'failed').length;

    return {
      totalNotifications,
      totalRead,
      totalUnread,
      totalDelivered,
      totalSubscribers: this.subscribers.size,
      successfulDeliveries,
      failedDeliveries,
      deliverySuccessRate:
        successfulDeliveries + failedDeliveries > 0
          ? (successfulDeliveries / (successfulDeliveries + failedDeliveries)) * 100
          : 0,
    };
  }

  /**
   * Get user statistics
   */
  getUserStatistics(userId: string): UserNotificationStats {
    const notifications = this.notifications.get(userId) || [];
    const isConnected = this.subscribers.has(userId);

    return {
      userId,
      totalNotifications: notifications.length,
      unreadCount: notifications.filter((n) => !n.read).length,
      readCount: notifications.filter((n) => n.read).length,
      deliveredCount: notifications.filter((n) => n.delivered).length,
      isConnected,
      connectionCount: this.subscribers.get(userId)?.size || 0,
    };
  }

  /**
   * Cleanup old notifications
   */
  cleanupOldNotifications(daysOld: number = 30): number {
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
    let removed = 0;

    for (const [userId, notifications] of this.notifications) {
      const filtered = notifications.filter((n) => n.timestamp > cutoffDate);
      removed += notifications.length - filtered.length;
      this.notifications.set(userId, filtered);
    }

    return removed;
  }
}

/**
 * Notification
 */
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  priority: 'low' | 'normal' | 'high';
  timestamp: Date;
  read: boolean;
  delivered: boolean;
  deliveryAttempts: number;
  maxRetries: number;
}

/**
 * Notification type
 */
export type NotificationType =
  | 'collaboration_update'
  | 'schedule_trigger'
  | 'macro_execution'
  | 'fork_notification'
  | 'version_update'
  | 'anomaly_alert'
  | 'system_alert'
  | 'user_mention'
  | 'macro_comment'
  | 'download_complete';

/**
 * Delivery log
 */
export interface DeliveryLog {
  notificationId: string;
  status: 'success' | 'retry' | 'failed';
  userId: string;
  timestamp: Date;
}

/**
 * Notification statistics
 */
export interface NotificationStats {
  totalNotifications: number;
  totalRead: number;
  totalUnread: number;
  totalDelivered: number;
  totalSubscribers: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  deliverySuccessRate: number;
}

/**
 * User notification statistics
 */
export interface UserNotificationStats {
  userId: string;
  totalNotifications: number;
  unreadCount: number;
  readCount: number;
  deliveredCount: number;
  isConnected: boolean;
  connectionCount: number;
}

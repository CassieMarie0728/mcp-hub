/**
 * Notification Preferences System
 * Manages user notification preferences and delivery methods
 */
export class NotificationPreferencesSystem {
  private userPreferences: Map<string, UserNotificationPreferences> = new Map();
  private deliveryMethods: Map<string, DeliveryMethod[]> = new Map();

  /**
   * Create default preferences for user
   */
  createDefaultPreferences(userId: string): UserNotificationPreferences {
    const preferences: UserNotificationPreferences = {
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      notificationTypes: {
        macro_execution: {
          enabled: true,
          inApp: true,
          push: true,
          email: false,
        },
        collaboration_update: {
          enabled: true,
          inApp: true,
          push: true,
          email: false,
        },
        anomaly_alert: {
          enabled: true,
          inApp: true,
          push: true,
          email: true,
        },
        schedule_trigger: {
          enabled: true,
          inApp: true,
          push: false,
          email: false,
        },
        fork_notification: {
          enabled: true,
          inApp: true,
          push: false,
          email: false,
        },
        version_update: {
          enabled: true,
          inApp: true,
          push: false,
          email: false,
        },
        system_alert: {
          enabled: true,
          inApp: true,
          push: true,
          email: true,
        },
        user_mention: {
          enabled: true,
          inApp: true,
          push: true,
          email: false,
        },
        macro_comment: {
          enabled: true,
          inApp: true,
          push: false,
          email: false,
        },
        download_complete: {
          enabled: true,
          inApp: true,
          push: false,
          email: false,
        },
      },
      deliveryMethods: {
        inApp: {
          enabled: true,
          retryAttempts: 3,
          retryDelayMs: 5000,
        },
        push: {
          enabled: true,
          retryAttempts: 5,
          retryDelayMs: 10000,
        },
        email: {
          enabled: false,
          retryAttempts: 3,
          retryDelayMs: 60000,
        },
      },
      quietHours: {
        enabled: false,
        startTime: '22:00',
        endTime: '08:00',
        timezone: 'UTC',
      },
      frequency: {
        batchNotifications: false,
        batchIntervalMinutes: 60,
        maxNotificationsPerDay: 999,
      },
      privacy: {
        trackingEnabled: true,
        analyticsEnabled: true,
        dataRetentionDays: 90,
      },
    };

    this.userPreferences.set(userId, preferences);
    return preferences;
  }

  /**
   * Get user preferences
   */
  getUserPreferences(userId: string): UserNotificationPreferences | null {
    return this.userPreferences.get(userId) || null;
  }

  /**
   * Update notification type preferences
   */
  updateNotificationTypePreference(
    userId: string,
    notificationType: string,
    preference: Partial<NotificationTypePreference>
  ): boolean {
    let prefs = this.userPreferences.get(userId);

    if (!prefs) {
      prefs = this.createDefaultPreferences(userId);
    }

    if (notificationType in prefs.notificationTypes) {
      prefs.notificationTypes[notificationType as keyof typeof prefs.notificationTypes] = {
        ...prefs.notificationTypes[notificationType as keyof typeof prefs.notificationTypes],
        ...preference,
      };

      prefs.updatedAt = new Date();
      return true;
    }

    return false;
  }

  /**
   * Update delivery method preferences
   */
  updateDeliveryMethodPreference(
    userId: string,
    method: 'inApp' | 'push' | 'email',
    preference: Partial<DeliveryMethodPreference>
  ): boolean {
    let prefs = this.userPreferences.get(userId);

    if (!prefs) {
      prefs = this.createDefaultPreferences(userId);
    }

    prefs.deliveryMethods[method] = {
      ...prefs.deliveryMethods[method],
      ...preference,
    };

    prefs.updatedAt = new Date();
    return true;
  }

  /**
   * Update quiet hours
   */
  updateQuietHours(userId: string, quietHours: Partial<QuietHours>): boolean {
    let prefs = this.userPreferences.get(userId);

    if (!prefs) {
      prefs = this.createDefaultPreferences(userId);
    }

    prefs.quietHours = {
      ...prefs.quietHours,
      ...quietHours,
    };

    prefs.updatedAt = new Date();
    return true;
  }

  /**
   * Update frequency preferences
   */
  updateFrequencyPreferences(userId: string, frequency: Partial<FrequencyPreference>): boolean {
    let prefs = this.userPreferences.get(userId);

    if (!prefs) {
      prefs = this.createDefaultPreferences(userId);
    }

    prefs.frequency = {
      ...prefs.frequency,
      ...frequency,
    };

    prefs.updatedAt = new Date();
    return true;
  }

  /**
   * Update privacy preferences
   */
  updatePrivacyPreferences(userId: string, privacy: Partial<PrivacyPreference>): boolean {
    let prefs = this.userPreferences.get(userId);

    if (!prefs) {
      prefs = this.createDefaultPreferences(userId);
    }

    prefs.privacy = {
      ...prefs.privacy,
      ...privacy,
    };

    prefs.updatedAt = new Date();
    return true;
  }

  /**
   * Check if notification should be delivered
   */
  shouldDeliverNotification(userId: string, notificationType: string, deliveryMethod: string): boolean {
    const prefs = this.userPreferences.get(userId);

    if (!prefs) {
      return true; // Default to delivering if no preferences
    }

    // Check if notification type is enabled
    const typePrefs = prefs.notificationTypes[notificationType as keyof typeof prefs.notificationTypes];
    if (!typePrefs || !typePrefs.enabled) {
      return false;
    }

    // Check if delivery method is enabled for this type
    const methodKey = deliveryMethod as keyof typeof typePrefs;
    if (methodKey in typePrefs && !typePrefs[methodKey]) {
      return false;
    }

    // Check if delivery method is enabled globally
    const methodPrefs = prefs.deliveryMethods[deliveryMethod as keyof typeof prefs.deliveryMethods];
    if (!methodPrefs || !methodPrefs.enabled) {
      return false;
    }

    // Check quiet hours
    if (prefs.quietHours.enabled && this.isInQuietHours(prefs.quietHours)) {
      return false;
    }

    return true;
  }

  /**
   * Check if current time is in quiet hours
   */
  private isInQuietHours(quietHours: QuietHours): boolean {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Simple comparison (doesn't handle timezone properly, but good enough for demo)
    return currentTime >= quietHours.startTime && currentTime <= quietHours.endTime;
  }

  /**
   * Get delivery methods for notification
   */
  getDeliveryMethods(userId: string, notificationType: string): string[] {
    const prefs = this.userPreferences.get(userId);

    if (!prefs) {
      return ['inApp', 'push'];
    }

    const typePrefs = prefs.notificationTypes[notificationType as keyof typeof prefs.notificationTypes];
    if (!typePrefs || !typePrefs.enabled) {
      return [];
    }

    const methods: string[] = [];

    if (typePrefs.inApp && prefs.deliveryMethods.inApp.enabled) {
      methods.push('inApp');
    }

    if (typePrefs.push && prefs.deliveryMethods.push.enabled) {
      methods.push('push');
    }

    if (typePrefs.email && prefs.deliveryMethods.email.enabled) {
      methods.push('email');
    }

    return methods;
  }

  /**
   * Get retry configuration for delivery method
   */
  getRetryConfiguration(userId: string, deliveryMethod: string): RetryConfiguration | null {
    const prefs = this.userPreferences.get(userId);

    if (!prefs) {
      return null;
    }

    const methodPrefs = prefs.deliveryMethods[deliveryMethod as keyof typeof prefs.deliveryMethods];

    if (!methodPrefs) {
      return null;
    }

    return {
      maxAttempts: methodPrefs.retryAttempts,
      delayMs: methodPrefs.retryDelayMs,
    };
  }

  /**
   * Batch notifications if enabled
   */
  shouldBatchNotifications(userId: string): boolean {
    const prefs = this.userPreferences.get(userId);
    return prefs?.frequency.batchNotifications || false;
  }

  /**
   * Get batch interval
   */
  getBatchIntervalMs(userId: string): number {
    const prefs = this.userPreferences.get(userId);
    return (prefs?.frequency.batchIntervalMinutes || 60) * 60 * 1000;
  }

  /**
   * Check if daily limit reached
   */
  checkDailyLimit(userId: string, notificationsSentToday: number): boolean {
    const prefs = this.userPreferences.get(userId);

    if (!prefs) {
      return false;
    }

    return notificationsSentToday >= prefs.frequency.maxNotificationsPerDay;
  }

  /**
   * Export preferences as JSON
   */
  exportPreferences(userId: string): string | null {
    const prefs = this.userPreferences.get(userId);

    if (!prefs) {
      return null;
    }

    return JSON.stringify(prefs, null, 2);
  }

  /**
   * Import preferences from JSON
   */
  importPreferences(userId: string, jsonData: string): boolean {
    try {
      const prefs = JSON.parse(jsonData) as UserNotificationPreferences;

      if (prefs.userId !== userId) {
        return false;
      }

      this.userPreferences.set(userId, prefs);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Reset preferences to defaults
   */
  resetToDefaults(userId: string): UserNotificationPreferences {
    this.userPreferences.delete(userId);
    return this.createDefaultPreferences(userId);
  }

  /**
   * Get all users with preferences
   */
  getAllUsersWithPreferences(): string[] {
    return Array.from(this.userPreferences.keys());
  }

  /**
   * Get preferences statistics
   */
  getPreferencesStatistics(): PreferencesStatistics {
    const allPrefs = Array.from(this.userPreferences.values());

    const inAppEnabled = allPrefs.filter((p) => p.deliveryMethods.inApp.enabled).length;
    const pushEnabled = allPrefs.filter((p) => p.deliveryMethods.push.enabled).length;
    const emailEnabled = allPrefs.filter((p) => p.deliveryMethods.email.enabled).length;
    const quietHoursEnabled = allPrefs.filter((p) => p.quietHours.enabled).length;
    const batchingEnabled = allPrefs.filter((p) => p.frequency.batchNotifications).length;

    return {
      totalUsers: allPrefs.length,
      inAppEnabled,
      pushEnabled,
      emailEnabled,
      quietHoursEnabled,
      batchingEnabled,
      avgNotificationTypesEnabled: allPrefs.length > 0
        ? allPrefs.reduce(
            (sum, p) =>
              sum +
              Object.values(p.notificationTypes).filter((t) => t.enabled).length,
            0
          ) / allPrefs.length
        : 0,
    };
  }
}

/**
 * User notification preferences
 */
export interface UserNotificationPreferences {
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  notificationTypes: Record<string, NotificationTypePreference>;
  deliveryMethods: Record<string, DeliveryMethodPreference>;
  quietHours: QuietHours;
  frequency: FrequencyPreference;
  privacy: PrivacyPreference;
}

/**
 * Notification type preference
 */
export interface NotificationTypePreference {
  enabled: boolean;
  inApp: boolean;
  push: boolean;
  email: boolean;
}

/**
 * Delivery method preference
 */
export interface DeliveryMethodPreference {
  enabled: boolean;
  retryAttempts: number;
  retryDelayMs: number;
}

/**
 * Quiet hours
 */
export interface QuietHours {
  enabled: boolean;
  startTime: string;
  endTime: string;
  timezone: string;
}

/**
 * Frequency preference
 */
export interface FrequencyPreference {
  batchNotifications: boolean;
  batchIntervalMinutes: number;
  maxNotificationsPerDay: number;
}

/**
 * Privacy preference
 */
export interface PrivacyPreference {
  trackingEnabled: boolean;
  analyticsEnabled: boolean;
  dataRetentionDays: number;
}

/**
 * Delivery method
 */
export interface DeliveryMethod {
  name: string;
  enabled: boolean;
  config: Record<string, any>;
}

/**
 * Retry configuration
 */
export interface RetryConfiguration {
  maxAttempts: number;
  delayMs: number;
}

/**
 * Preferences statistics
 */
export interface PreferencesStatistics {
  totalUsers: number;
  inAppEnabled: number;
  pushEnabled: number;
  emailEnabled: number;
  quietHoursEnabled: number;
  batchingEnabled: number;
  avgNotificationTypesEnabled: number;
}

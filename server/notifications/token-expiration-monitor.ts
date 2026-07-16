/**
 * Token Expiration Monitor
 * Monitors token expiration and sends alerts/notifications
 */

import * as Notifications from 'expo-notifications';

export interface TokenExpirationAlert {
  tokenId: string;
  serverId: string;
  serverType: string;
  tokenName: string;
  expiresAt: Date;
  daysUntilExpiration: number;
  alertLevel: 'critical' | 'warning' | 'info';
}

export interface ExpirationCheckResult {
  alerts: TokenExpirationAlert[];
  expiredTokens: string[];
  tokensNeedingRefresh: string[];
}

export class TokenExpirationMonitor {
  private static checkIntervalMs = 3600000; // 1 hour
  private static criticalThresholdDays = 1;
  private static warningThresholdDays = 7;
  private static refreshThresholdMs = 300000; // 5 minutes

  /**
   * Check all tokens for expiration
   */
  static async checkTokenExpiration(
    tokens: Array<{
      id: string;
      serverId: string;
      serverType: string;
      name: string;
      expiresAt?: Date;
    }>,
  ): Promise<ExpirationCheckResult> {
    const now = new Date();
    const alerts: TokenExpirationAlert[] = [];
    const expiredTokens: string[] = [];
    const tokensNeedingRefresh: string[] = [];

    for (const token of tokens) {
      if (!token.expiresAt) {
        continue;
      }

      const daysUntilExpiration = Math.ceil(
        (token.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );

      // Check if expired
      if (now > token.expiresAt) {
        expiredTokens.push(token.id);
        alerts.push({
          tokenId: token.id,
          serverId: token.serverId,
          serverType: token.serverType,
          tokenName: token.name,
          expiresAt: token.expiresAt,
          daysUntilExpiration,
          alertLevel: 'critical',
        });
        continue;
      }

      // Check if needs refresh (within 5 minutes)
      const minutesUntilExpiration = (token.expiresAt.getTime() - now.getTime()) / (1000 * 60);
      if (minutesUntilExpiration <= 5) {
        tokensNeedingRefresh.push(token.id);
      }

      // Check alert thresholds
      if (daysUntilExpiration <= this.criticalThresholdDays) {
        alerts.push({
          tokenId: token.id,
          serverId: token.serverId,
          serverType: token.serverType,
          tokenName: token.name,
          expiresAt: token.expiresAt,
          daysUntilExpiration,
          alertLevel: 'critical',
        });
      } else if (daysUntilExpiration <= this.warningThresholdDays) {
        alerts.push({
          tokenId: token.id,
          serverId: token.serverId,
          serverType: token.serverType,
          tokenName: token.name,
          expiresAt: token.expiresAt,
          daysUntilExpiration,
          alertLevel: 'warning',
        });
      }
    }

    return {
      alerts,
      expiredTokens,
      tokensNeedingRefresh,
    };
  }

  /**
   * Send push notification for token expiration
   */
  static async sendExpirationNotification(alert: TokenExpirationAlert): Promise<void> {
    const title = this.getNotificationTitle(alert.alertLevel);
    const body = this.getNotificationBody(alert);

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: {
            tokenId: alert.tokenId,
            serverId: alert.serverId,
            serverType: alert.serverType,
            action: 'token_expiration',
          },
          sound: alert.alertLevel === 'critical' ? 'default' : undefined,
          badge: 1,
          color: this.getNotificationColor(alert.alertLevel),
        },
        trigger: null, // Send immediately
      });
    } catch (error: any) {
      console.error(`Failed to send notification for token ${alert.tokenId}: ${error.message}`);
    }
  }

  /**
   * Send batch notifications for multiple alerts
   */
  static async sendBatchNotifications(alerts: TokenExpirationAlert[]): Promise<void> {
    // Group by alert level
    const criticalAlerts = alerts.filter((a) => a.alertLevel === 'critical');
    const warningAlerts = alerts.filter((a) => a.alertLevel === 'warning');

    // Send critical alerts immediately
    for (const alert of criticalAlerts) {
      await this.sendExpirationNotification(alert);
    }

    // Send warning alerts with slight delay
    for (const alert of warningAlerts) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      await this.sendExpirationNotification(alert);
    }
  }

  /**
   * Schedule periodic expiration checks
   */
  static schedulePeriodicChecks(
    checkFn: () => Promise<ExpirationCheckResult>,
  ): ReturnType<typeof setInterval> {
    // Run check immediately
    checkFn().catch((error) => {
      console.error('Token expiration check failed:', error);
    });

    // Schedule periodic checks
    return setInterval(() => {
      checkFn().catch((error) => {
        console.error('Token expiration check failed:', error);
      });
    }, this.checkIntervalMs);
  }

  /**
   * Get notification title based on alert level
   */
  private static getNotificationTitle(alertLevel: string): string {
    switch (alertLevel) {
      case 'critical':
        return '🚨 Token Expiring Soon';
      case 'warning':
        return '⚠️ Token Expiration Warning';
      case 'info':
        return 'ℹ️ Token Expiration Notice';
      default:
        return 'Token Expiration Alert';
    }
  }

  /**
   * Get notification body based on alert
   */
  private static getNotificationBody(alert: TokenExpirationAlert): string {
    const serverName = alert.serverType.charAt(0).toUpperCase() + alert.serverType.slice(1);

    if (alert.daysUntilExpiration < 0) {
      return `Your ${serverName} token "${alert.tokenName}" has expired. Please reconnect.`;
    }

    if (alert.daysUntilExpiration === 0) {
      return `Your ${serverName} token "${alert.tokenName}" expires today. Refresh now.`;
    }

    return `Your ${serverName} token "${alert.tokenName}" expires in ${alert.daysUntilExpiration} day${alert.daysUntilExpiration !== 1 ? 's' : ''}. Tap to refresh.`;
  }

  /**
   * Get notification color based on alert level
   */
  private static getNotificationColor(alertLevel: string): string {
    switch (alertLevel) {
      case 'critical':
        return '#EF4444'; // Red
      case 'warning':
        return '#F59E0B'; // Amber
      case 'info':
        return '#3B82F6'; // Blue
      default:
        return '#6B7280'; // Gray
    }
  }

  /**
   * Calculate days until token expiration
   */
  static daysUntilExpiration(expiresAt: Date): number {
    const now = new Date();
    return Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if token needs immediate refresh
   */
  static needsImmediateRefresh(expiresAt: Date): boolean {
    const now = new Date();
    const minutesUntilExpiration = (expiresAt.getTime() - now.getTime()) / (1000 * 60);
    return minutesUntilExpiration <= 5;
  }

  /**
   * Get time until next expiration check
   */
  static getTimeUntilNextCheck(): number {
    return this.checkIntervalMs;
  }
}

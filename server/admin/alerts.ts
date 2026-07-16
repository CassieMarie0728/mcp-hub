import { alertManager, logger } from '../_core/monitoring';

/**
 * Alert Rules Engine
 * Monitors metrics and triggers alerts based on thresholds
 */

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  condition: (metrics: any) => boolean;
  severity: 'critical' | 'warning' | 'info';
  cooldown: number; // milliseconds
}

export interface AlertState {
  ruleId: string;
  active: boolean;
  lastTriggered: Date | null;
  lastResolved: Date | null;
}

export class AlertRulesEngine {
  private rules: Map<string, AlertRule> = new Map();
  private alertStates: Map<string, AlertState> = new Map();

  /**
   * Register an alert rule
   */
  registerRule(rule: AlertRule): void {
    this.rules.set(rule.id, rule);
    this.alertStates.set(rule.id, {
      ruleId: rule.id,
      active: false,
      lastTriggered: null,
      lastResolved: null,
    });
  }

  /**
   * Evaluate all rules against metrics
   */
  async evaluateRules(metrics: any): Promise<void> {
    for (const [ruleId, rule] of this.rules) {
      const state = this.alertStates.get(ruleId);
      if (!state) continue;

      try {
        const conditionMet = rule.condition(metrics);

        if (conditionMet && !state.active) {
          // Alert should be triggered
          const now = Date.now();
          if (!state.lastTriggered || now - state.lastTriggered.getTime() > rule.cooldown) {
            await alertManager.createAlert(rule.name, rule.severity, rule.description);
            state.active = true;
            state.lastTriggered = new Date();
            logger.warn(`Alert triggered: ${rule.name}`);
          }
        } else if (!conditionMet && state.active) {
          // Alert should be resolved
          await alertManager.resolveAlert(`${rule.name}-${state.lastTriggered?.getTime()}`);
          state.active = false;
          state.lastResolved = new Date();
          logger.info(`Alert resolved: ${rule.name}`);
        }
      } catch (error) {
        logger.error(`Error evaluating rule ${rule.id}:`, error);
      }
    }
  }

  /**
   * Get all active alerts
   */
  getActiveAlerts(): AlertState[] {
    return Array.from(this.alertStates.values()).filter((state) => state.active);
  }

  /**
   * Get alert state for a specific rule
   */
  getAlertState(ruleId: string): AlertState | undefined {
    return this.alertStates.get(ruleId);
  }
}

// ============================================================================
// Default Alert Rules
// ============================================================================

export const defaultAlertRules: AlertRule[] = [
  {
    id: 'high-error-rate',
    name: 'High Error Rate',
    description: 'Error rate exceeds 10% of total executions',
    condition: (metrics) => {
      const errorRate =
        (metrics.workflowMetrics.failedExecutions / metrics.workflowMetrics.totalExecutions) * 100;
      return errorRate > 10;
    },
    severity: 'critical',
    cooldown: 5 * 60 * 1000, // 5 minutes
  },
  {
    id: 'low-success-rate',
    name: 'Low Success Rate',
    description: 'Workflow success rate drops below 90%',
    condition: (metrics) => metrics.workflowMetrics.successRate < 90,
    severity: 'warning',
    cooldown: 10 * 60 * 1000, // 10 minutes
  },
  {
    id: 'high-memory-usage',
    name: 'High Memory Usage',
    description: 'Memory usage exceeds 80%',
    condition: (metrics) => metrics.systemHealth.memoryUsage > 80,
    severity: 'warning',
    cooldown: 5 * 60 * 1000, // 5 minutes
  },
  {
    id: 'database-disconnected',
    name: 'Database Connection Lost',
    description: 'Database is not responding',
    condition: (metrics) => !metrics.systemHealth.databaseConnected,
    severity: 'critical',
    cooldown: 1 * 60 * 1000, // 1 minute
  },
  {
    id: 'tokens-expiring',
    name: 'Tokens Expiring Soon',
    description: 'One or more tokens expiring within 7 days',
    condition: (metrics) => metrics.tokenMetrics.expiringTokens > 0,
    severity: 'warning',
    cooldown: 24 * 60 * 60 * 1000, // 24 hours
  },
  {
    id: 'slow-api-response',
    name: 'Slow API Response',
    description: 'API response time exceeds 1000ms',
    condition: (metrics) => metrics.systemHealth.apiResponseTime > 1000,
    severity: 'info',
    cooldown: 5 * 60 * 1000, // 5 minutes
  },
  {
    id: 'high-execution-duration',
    name: 'High Execution Duration',
    description: 'Average workflow execution time exceeds 5 seconds',
    condition: (metrics) => metrics.workflowMetrics.averageDuration > 5000,
    severity: 'warning',
    cooldown: 10 * 60 * 1000, // 10 minutes
  },
  {
    id: 'no-active-workflows',
    name: 'No Active Workflows',
    description: 'No workflows executed in the last hour',
    condition: (metrics) => metrics.workflowMetrics.executionsPerMinute === 0,
    severity: 'info',
    cooldown: 30 * 60 * 1000, // 30 minutes
  },
  {
    id: 'workspace-errors',
    name: 'Workspace Errors Detected',
    description: 'One or more workspaces experiencing errors',
    condition: (metrics) => metrics.workspaceMetrics.workspacesWithErrors > 0,
    severity: 'warning',
    cooldown: 10 * 60 * 1000, // 10 minutes
  },
  {
    id: 'cache-disconnected',
    name: 'Cache Connection Lost',
    description: 'Cache/Redis is not responding',
    condition: (metrics) => !metrics.systemHealth.cacheConnected,
    severity: 'warning',
    cooldown: 5 * 60 * 1000, // 5 minutes
  },
];

// ============================================================================
// Alert Notification Channels
// ============================================================================

export interface NotificationChannel {
  send(alert: any): Promise<void>;
}

export class SlackNotificationChannel implements NotificationChannel {
  constructor(private webhookUrl: string) {}

  async send(alert: any): Promise<void> {
    try {
      const color =
        alert.severity === 'critical'
          ? '#FF0000'
          : alert.severity === 'warning'
            ? '#FFA500'
            : '#0099FF';

      await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attachments: [
            {
              color,
              title: `${alert.severity.toUpperCase()}: ${alert.name}`,
              text: alert.message,
              footer: 'MCP Hub Admin',
              ts: Math.floor(Date.now() / 1000),
            },
          ],
        }),
      });
    } catch (error) {
      logger.error('Failed to send Slack notification:', error);
    }
  }
}

export class EmailNotificationChannel implements NotificationChannel {
  constructor(private recipients: string[]) {}

  async send(alert: any): Promise<void> {
    try {
      // TODO: Implement email sending via nodemailer or similar
      logger.info(
        `Email notification would be sent to ${this.recipients.join(', ')}: ${alert.message}`,
      );
    } catch (error) {
      logger.error('Failed to send email notification:', error);
    }
  }
}

export class WebhookNotificationChannel implements NotificationChannel {
  constructor(private webhookUrl: string) {}

  async send(alert: any): Promise<void> {
    try {
      await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'alert',
          severity: alert.severity,
          name: alert.name,
          message: alert.message,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (error) {
      logger.error('Failed to send webhook notification:', error);
    }
  }
}

// ============================================================================
// Alert Manager
// ============================================================================

export class AlertNotificationManager {
  private channels: NotificationChannel[] = [];

  registerChannel(channel: NotificationChannel): void {
    this.channels.push(channel);
  }

  async notifyAll(alert: any): Promise<void> {
    for (const channel of this.channels) {
      try {
        await channel.send(alert);
      } catch (error) {
        logger.error('Error sending notification:', error);
      }
    }
  }
}

// ============================================================================
// Singleton Instances
// ============================================================================

export const alertRulesEngine = new AlertRulesEngine();
export const alertNotificationManager = new AlertNotificationManager();

// Register default rules
defaultAlertRules.forEach((rule) => alertRulesEngine.registerRule(rule));

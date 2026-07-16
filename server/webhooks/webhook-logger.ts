/**
 * Webhook Execution Logger
 * Tracks webhook execution history, errors, and performance metrics
 */

export interface WebhookLog {
  id: string;
  webhookId: string;
  timestamp: Date;
  event: string;
  requestPayload: Record<string, unknown>;
  responseStatus: number;
  responseBody: string;
  executionTime: number;
  success: boolean;
  error?: string;
  retryCount: number;
}

class WebhookLogger {
  private logs: Map<string, WebhookLog[]> = new Map();

  /**
   * Log webhook execution
   */
  static logExecution(
    webhookId: string,
    event: string,
    requestPayload: Record<string, unknown>,
    responseStatus: number,
    responseBody: string,
    executionTime: number,
    success: boolean,
    error?: string,
    retryCount: number = 0,
  ): WebhookLog {
    const log: WebhookLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      webhookId,
      timestamp: new Date(),
      event,
      requestPayload,
      responseStatus,
      responseBody,
      executionTime,
      success,
      error,
      retryCount,
    };

    const instance = new WebhookLogger();
    if (!instance.logs.has(webhookId)) {
      instance.logs.set(webhookId, []);
    }

    instance.logs.get(webhookId)!.push(log);
    return log;
  }

  /**
   * Get webhook execution logs
   */
  static getExecutionLogs(
    webhookId: string,
    limit: number = 100,
    offset: number = 0,
  ): WebhookLog[] {
    const instance = new WebhookLogger();
    const logs = instance.logs.get(webhookId) || [];
    return logs
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(offset, offset + limit);
  }

  /**
   * Get webhook execution statistics
   */
  static getExecutionStats(webhookId: string): {
    totalExecutions: number;
    successCount: number;
    failureCount: number;
    successRate: number;
    averageExecutionTime: number;
    lastExecution?: Date;
    lastError?: string;
  } {
    const instance = new WebhookLogger();
    const logs = instance.logs.get(webhookId) || [];

    if (logs.length === 0) {
      return {
        totalExecutions: 0,
        successCount: 0,
        failureCount: 0,
        successRate: 0,
        averageExecutionTime: 0,
      };
    }

    const successCount = logs.filter((l) => l.success).length;
    const failureCount = logs.length - successCount;
    const totalExecutionTime = logs.reduce((sum, l) => sum + l.executionTime, 0);
    const averageExecutionTime = totalExecutionTime / logs.length;
    const lastExecution = logs[0]?.timestamp;
    const lastError = logs.find((l) => l.error)?.error;

    return {
      totalExecutions: logs.length,
      successCount,
      failureCount,
      successRate: Math.round((successCount / logs.length) * 10000) / 100,
      averageExecutionTime: Math.round(averageExecutionTime * 100) / 100,
      lastExecution,
      lastError,
    };
  }

  /**
   * Get error trends
   */
  static getErrorTrends(
    webhookId: string,
    hours: number = 24,
  ): {
    timestamp: Date;
    errorCount: number;
    totalCount: number;
  }[] {
    const instance = new WebhookLogger();
    const logs = instance.logs.get(webhookId) || [];
    const cutoffTime = new Date(Date.now() - hours * 3600000);

    const recentLogs = logs.filter((l) => l.timestamp >= cutoffTime);

    // Group by hour
    const hourlyStats: Map<string, { errors: number; total: number }> = new Map();

    recentLogs.forEach((log) => {
      const hour = new Date(log.timestamp);
      hour.setMinutes(0, 0, 0);
      const key = hour.toISOString();

      if (!hourlyStats.has(key)) {
        hourlyStats.set(key, { errors: 0, total: 0 });
      }

      const stat = hourlyStats.get(key)!;
      stat.total++;
      if (!log.success) {
        stat.errors++;
      }
    });

    return Array.from(hourlyStats.entries())
      .map(([timestamp, stat]) => ({
        timestamp: new Date(timestamp),
        errorCount: stat.errors,
        totalCount: stat.total,
      }))
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * Clear old logs
   */
  static clearOldLogs(webhookId: string, olderThanDays: number = 30): number {
    const instance = new WebhookLogger();
    const logs = instance.logs.get(webhookId) || [];
    const cutoffTime = new Date(Date.now() - olderThanDays * 24 * 3600000);

    const initialLength = logs.length;
    const filtered = logs.filter((l) => l.timestamp >= cutoffTime);

    instance.logs.set(webhookId, filtered);
    return initialLength - filtered.length;
  }

  /**
   * Search logs by event
   */
  static searchLogs(webhookId: string, event: string, limit: number = 50): WebhookLog[] {
    const instance = new WebhookLogger();
    const logs = instance.logs.get(webhookId) || [];
    return logs
      .filter((l) => l.event === event)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get failed executions
   */
  static getFailedExecutions(webhookId: string, limit: number = 50): WebhookLog[] {
    const instance = new WebhookLogger();
    const logs = instance.logs.get(webhookId) || [];
    return logs
      .filter((l) => !l.success)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }
}

export { WebhookLogger };

/**
 * Execution Analytics & Tracking
 * Tracks tool usage, performance, errors, and provides insights
 */

export interface ExecutionMetrics {
  toolName: string;
  serverId: string;
  executionTime: number;
  status: 'success' | 'failed' | 'skipped';
  timestamp: Date;
  errorMessage?: string;
  parameters?: Record<string, any>;
  result?: any;
}

export interface ToolStats {
  toolName: string;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  skippedExecutions: number;
  averageExecutionTime: number;
  minExecutionTime: number;
  maxExecutionTime: number;
  successRate: number;
  errorRate: number;
  lastExecutedAt?: Date;
}

export interface ServerStats {
  serverId: string;
  serverType: string;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  successRate: number;
  toolsUsed: number;
  lastActivityAt?: Date;
}

export interface AnalyticsReport {
  period: {
    startDate: Date;
    endDate: Date;
  };
  summary: {
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    averageExecutionTime: number;
  };
  topTools: ToolStats[];
  serverStats: ServerStats[];
  errorTrends: ErrorTrend[];
  performanceTrends: PerformanceTrend[];
}

export interface ErrorTrend {
  date: Date;
  errorCount: number;
  errorRate: number;
  topErrors: Array<{ message: string; count: number }>;
}

export interface PerformanceTrend {
  date: Date;
  averageExecutionTime: number;
  p50ExecutionTime: number;
  p95ExecutionTime: number;
  p99ExecutionTime: number;
}

// In-memory analytics store (would be replaced with database)
const executionMetrics: ExecutionMetrics[] = [];
const toolStats = new Map<string, ToolStats>();
const serverStats = new Map<string, ServerStats>();

export class ExecutionAnalytics {
  /**
   * Record an execution
   */
  static recordExecution(metrics: ExecutionMetrics): void {
    executionMetrics.push(metrics);
    this.updateToolStats(metrics);
    this.updateServerStats(metrics);
  }

  /**
   * Update tool statistics
   */
  private static updateToolStats(metrics: ExecutionMetrics): void {
    const key = metrics.toolName;
    let stats = toolStats.get(key);

    if (!stats) {
      stats = {
        toolName: metrics.toolName,
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        skippedExecutions: 0,
        averageExecutionTime: 0,
        minExecutionTime: Infinity,
        maxExecutionTime: 0,
        successRate: 0,
        errorRate: 0,
      };
    }

    stats.totalExecutions++;

    if (metrics.status === 'success') {
      stats.successfulExecutions++;
    } else if (metrics.status === 'failed') {
      stats.failedExecutions++;
    } else if (metrics.status === 'skipped') {
      stats.skippedExecutions++;
    }

    stats.minExecutionTime = Math.min(stats.minExecutionTime, metrics.executionTime);
    stats.maxExecutionTime = Math.max(stats.maxExecutionTime, metrics.executionTime);

    stats.averageExecutionTime =
      (stats.averageExecutionTime * (stats.totalExecutions - 1) + metrics.executionTime) /
      stats.totalExecutions;

    stats.successRate = (stats.successfulExecutions / stats.totalExecutions) * 100;
    stats.errorRate = (stats.failedExecutions / stats.totalExecutions) * 100;
    stats.lastExecutedAt = metrics.timestamp;

    toolStats.set(key, stats);
  }

  /**
   * Update server statistics
   */
  private static updateServerStats(metrics: ExecutionMetrics): void {
    const key = metrics.serverId;
    let stats = serverStats.get(key);

    if (!stats) {
      stats = {
        serverId: metrics.serverId,
        serverType: '', // Would be populated from server registry
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        averageExecutionTime: 0,
        successRate: 0,
        toolsUsed: 0,
      };
    }

    stats.totalExecutions++;

    if (metrics.status === 'success') {
      stats.successfulExecutions++;
    } else if (metrics.status === 'failed') {
      stats.failedExecutions++;
    }

    stats.averageExecutionTime =
      (stats.averageExecutionTime * (stats.totalExecutions - 1) + metrics.executionTime) /
      stats.totalExecutions;

    stats.successRate = (stats.successfulExecutions / stats.totalExecutions) * 100;
    stats.lastActivityAt = metrics.timestamp;

    serverStats.set(key, stats);
  }

  /**
   * Get tool statistics
   */
  static getToolStats(toolName?: string): ToolStats[] {
    if (toolName) {
      const stats = toolStats.get(toolName);
      return stats ? [stats] : [];
    }

    return Array.from(toolStats.values()).sort(
      (a, b) => b.totalExecutions - a.totalExecutions
    );
  }

  /**
   * Get server statistics
   */
  static getServerStats(serverId?: string): ServerStats[] {
    if (serverId) {
      const stats = serverStats.get(serverId);
      return stats ? [stats] : [];
    }

    return Array.from(serverStats.values()).sort(
      (a, b) => b.totalExecutions - a.totalExecutions
    );
  }

  /**
   * Get execution history
   */
  static getExecutionHistory(
    filters?: {
      toolName?: string;
      serverId?: string;
      status?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    }
  ): ExecutionMetrics[] {
    let results = [...executionMetrics];

    if (filters?.toolName) {
      results = results.filter((m) => m.toolName === filters.toolName);
    }

    if (filters?.serverId) {
      results = results.filter((m) => m.serverId === filters.serverId);
    }

    if (filters?.status) {
      results = results.filter((m) => m.status === filters.status);
    }

    if (filters?.startDate) {
      results = results.filter((m) => m.timestamp >= filters.startDate!);
    }

    if (filters?.endDate) {
      results = results.filter((m) => m.timestamp <= filters.endDate!);
    }

    results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    if (filters?.limit) {
      results = results.slice(0, filters.limit);
    }

    return results;
  }

  /**
   * Get error trends
   */
  static getErrorTrends(startDate: Date, endDate: Date): ErrorTrend[] {
    const trends = new Map<string, ErrorTrend>();

    const metrics = this.getExecutionHistory({ startDate, endDate, status: 'failed' });

    for (const metric of metrics) {
      const dateKey = metric.timestamp.toISOString().split('T')[0];

      if (!trends.has(dateKey)) {
        trends.set(dateKey, {
          date: new Date(dateKey),
          errorCount: 0,
          errorRate: 0,
          topErrors: [],
        });
      }

      const trend = trends.get(dateKey)!;
      trend.errorCount++;

      if (metric.errorMessage) {
        const existing = trend.topErrors.find((e) => e.message === metric.errorMessage);
        if (existing) {
          existing.count++;
        } else {
          trend.topErrors.push({ message: metric.errorMessage, count: 1 });
        }
      }
    }

    // Calculate error rates
    const allMetrics = this.getExecutionHistory({ startDate, endDate });
    const totalByDate = new Map<string, number>();

    for (const metric of allMetrics) {
      const dateKey = metric.timestamp.toISOString().split('T')[0];
      totalByDate.set(dateKey, (totalByDate.get(dateKey) || 0) + 1);
    }

    for (const trend of trends.values()) {
      const dateKey = trend.date.toISOString().split('T')[0];
      const total = totalByDate.get(dateKey) || 1;
      trend.errorRate = (trend.errorCount / total) * 100;
      trend.topErrors.sort((a, b) => b.count - a.count).slice(0, 5);
    }

    return Array.from(trends.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  /**
   * Get performance trends
   */
  static getPerformanceTrends(startDate: Date, endDate: Date): PerformanceTrend[] {
    const trends = new Map<string, ExecutionMetrics[]>();

    const metrics = this.getExecutionHistory({ startDate, endDate });

    for (const metric of metrics) {
      const dateKey = metric.timestamp.toISOString().split('T')[0];

      if (!trends.has(dateKey)) {
        trends.set(dateKey, []);
      }

      trends.get(dateKey)!.push(metric);
    }

    const results: PerformanceTrend[] = [];

    for (const [dateKey, dayMetrics] of trends) {
      const times = dayMetrics.map((m) => m.executionTime).sort((a, b) => a - b);

      results.push({
        date: new Date(dateKey),
        averageExecutionTime: times.reduce((a, b) => a + b, 0) / times.length,
        p50ExecutionTime: times[Math.floor(times.length * 0.5)],
        p95ExecutionTime: times[Math.floor(times.length * 0.95)],
        p99ExecutionTime: times[Math.floor(times.length * 0.99)],
      });
    }

    return results.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  /**
   * Generate analytics report
   */
  static generateReport(startDate: Date, endDate: Date): AnalyticsReport {
    const metrics = this.getExecutionHistory({ startDate, endDate });

    const summary = {
      totalExecutions: metrics.length,
      successfulExecutions: metrics.filter((m) => m.status === 'success').length,
      failedExecutions: metrics.filter((m) => m.status === 'failed').length,
      averageExecutionTime:
        metrics.length > 0
          ? metrics.reduce((sum, m) => sum + m.executionTime, 0) / metrics.length
          : 0,
    };

    const topTools = this.getToolStats()
      .sort((a, b) => b.totalExecutions - a.totalExecutions)
      .slice(0, 10);

    const serverStatsArray = this.getServerStats();

    const errorTrends = this.getErrorTrends(startDate, endDate);
    const performanceTrends = this.getPerformanceTrends(startDate, endDate);

    return {
      period: { startDate, endDate },
      summary,
      topTools,
      serverStats: serverStatsArray,
      errorTrends,
      performanceTrends,
    };
  }

  /**
   * Clear analytics (for testing)
   */
  static clearAnalytics(): void {
    executionMetrics.length = 0;
    toolStats.clear();
    serverStats.clear();
  }
}

export default ExecutionAnalytics;

import { EventEmitter } from 'events';

/**
 * Macro Analytics Engine
 * Tracks usage statistics, success rates, and performance metrics
 */
export class MacroAnalytics extends EventEmitter {
  private metrics: Map<string, MacroMetrics> = new Map();
  private userMetrics: Map<string, UserMetrics> = new Map();
  private globalMetrics: GlobalMetrics = {
    totalExecutions: 0,
    totalSuccessful: 0,
    totalFailed: 0,
    totalDuration: 0,
    averageDuration: 0,
    peakHour: 0,
    topMacros: [],
    topUsers: [],
  };

  /**
   * Record macro execution
   */
  recordExecution(
    macroId: string,
    userId: string,
    status: 'success' | 'failure',
    duration: number,
    metadata?: Record<string, any>,
  ) {
    // Update macro metrics
    this.updateMacroMetrics(macroId, status, duration, metadata);

    // Update user metrics
    this.updateUserMetrics(userId, status, duration);

    // Update global metrics
    this.updateGlobalMetrics(status, duration);

    // Emit event
    this.emit('execution_recorded', {
      macroId,
      userId,
      status,
      duration,
      timestamp: new Date(),
    });
  }

  /**
   * Update macro metrics
   */
  private updateMacroMetrics(
    macroId: string,
    status: 'success' | 'failure',
    duration: number,
    metadata?: Record<string, any>,
  ) {
    let metrics = this.metrics.get(macroId);

    if (!metrics) {
      metrics = {
        macroId,
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        totalDuration: 0,
        averageDuration: 0,
        minDuration: Infinity,
        maxDuration: 0,
        successRate: 0,
        lastExecuted: null,
        firstExecuted: new Date(),
        executionsByHour: {},
        executionsByDay: {},
        errorCounts: {},
        metadata: {},
      };
      this.metrics.set(macroId, metrics);
    }

    metrics.totalExecutions++;

    if (status === 'success') {
      metrics.successfulExecutions++;
    } else {
      metrics.failedExecutions++;
      if (metadata?.error) {
        metrics.errorCounts[metadata.error] = (metrics.errorCounts[metadata.error] || 0) + 1;
      }
    }

    metrics.totalDuration += duration;
    metrics.averageDuration = metrics.totalDuration / metrics.totalExecutions;
    metrics.minDuration = Math.min(metrics.minDuration, duration);
    metrics.maxDuration = Math.max(metrics.maxDuration, duration);
    metrics.successRate = (metrics.successfulExecutions / metrics.totalExecutions) * 100;
    metrics.lastExecuted = new Date();

    // Track by hour
    const hour = new Date().getHours();
    metrics.executionsByHour[hour] = (metrics.executionsByHour[hour] || 0) + 1;

    // Track by day
    const day = new Date().toISOString().split('T')[0];
    metrics.executionsByDay[day] = (metrics.executionsByDay[day] || 0) + 1;

    // Store metadata
    if (metadata) {
      metrics.metadata = { ...metrics.metadata, ...metadata };
    }
  }

  /**
   * Update user metrics
   */
  private updateUserMetrics(userId: string, status: 'success' | 'failure', duration: number) {
    let metrics = this.userMetrics.get(userId);

    if (!metrics) {
      metrics = {
        userId,
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        totalDuration: 0,
        averageDuration: 0,
        macrosUsed: new Set(),
        favoritesMacros: [],
        executionsByDay: {},
        lastActive: new Date(),
      };
      this.userMetrics.set(userId, metrics);
    }

    metrics.totalExecutions++;

    if (status === 'success') {
      metrics.successfulExecutions++;
    } else {
      metrics.failedExecutions++;
    }

    metrics.totalDuration += duration;
    metrics.averageDuration = metrics.totalDuration / metrics.totalExecutions;
    metrics.lastActive = new Date();

    // Track by day
    const day = new Date().toISOString().split('T')[0];
    metrics.executionsByDay[day] = (metrics.executionsByDay[day] || 0) + 1;
  }

  /**
   * Update global metrics
   */
  private updateGlobalMetrics(status: 'success' | 'failure', duration: number) {
    this.globalMetrics.totalExecutions++;

    if (status === 'success') {
      this.globalMetrics.totalSuccessful++;
    } else {
      this.globalMetrics.totalFailed++;
    }

    this.globalMetrics.totalDuration += duration;
    this.globalMetrics.averageDuration =
      this.globalMetrics.totalDuration / this.globalMetrics.totalExecutions;

    // Update peak hour
    const hour = new Date().getHours();
    this.globalMetrics.peakHour = hour;

    // Update top macros and users
    this.updateTopMetrics();
  }

  /**
   * Update top macros and users
   */
  private updateTopMetrics() {
    // Get top macros
    const topMacros = Array.from(this.metrics.values())
      .sort((a, b) => b.totalExecutions - a.totalExecutions)
      .slice(0, 10)
      .map((m) => ({
        macroId: m.macroId,
        executions: m.totalExecutions,
        successRate: m.successRate,
      }));

    this.globalMetrics.topMacros = topMacros;

    // Get top users
    const topUsers = Array.from(this.userMetrics.values())
      .sort((a, b) => b.totalExecutions - a.totalExecutions)
      .slice(0, 10)
      .map((u) => ({
        userId: u.userId,
        executions: u.totalExecutions,
        averageDuration: u.averageDuration,
      }));

    this.globalMetrics.topUsers = topUsers;
  }

  /**
   * Get macro metrics
   */
  getMacroMetrics(macroId: string): MacroMetrics | null {
    return this.metrics.get(macroId) || null;
  }

  /**
   * Get user metrics
   */
  getUserMetrics(userId: string): UserMetrics | null {
    return this.userMetrics.get(userId) || null;
  }

  /**
   * Get global metrics
   */
  getGlobalMetrics(): GlobalMetrics {
    return this.globalMetrics;
  }

  /**
   * Get macro performance report
   */
  getMacroPerformanceReport(macroId: string): MacroPerformanceReport {
    const metrics = this.metrics.get(macroId);

    if (!metrics) {
      throw new Error(`No metrics found for macro ${macroId}`);
    }

    return {
      macroId,
      summary: {
        totalExecutions: metrics.totalExecutions,
        successfulExecutions: metrics.successfulExecutions,
        failedExecutions: metrics.failedExecutions,
        successRate: metrics.successRate,
      },
      performance: {
        averageDuration: metrics.averageDuration,
        minDuration: metrics.minDuration,
        maxDuration: metrics.maxDuration,
        totalDuration: metrics.totalDuration,
      },
      timeline: {
        firstExecuted: metrics.firstExecuted,
        lastExecuted: metrics.lastExecuted,
        executionsByHour: metrics.executionsByHour,
        executionsByDay: metrics.executionsByDay,
      },
      errors: metrics.errorCounts,
    };
  }

  /**
   * Get user activity report
   */
  getUserActivityReport(userId: string): UserActivityReport {
    const metrics = this.userMetrics.get(userId);

    if (!metrics) {
      throw new Error(`No metrics found for user ${userId}`);
    }

    return {
      userId,
      summary: {
        totalExecutions: metrics.totalExecutions,
        successfulExecutions: metrics.successfulExecutions,
        failedExecutions: metrics.failedExecutions,
      },
      performance: {
        averageDuration: metrics.averageDuration,
        totalDuration: metrics.totalDuration,
      },
      activity: {
        lastActive: metrics.lastActive,
        executionsByDay: metrics.executionsByDay,
        macrosUsed: Array.from(metrics.macrosUsed),
      },
    };
  }

  /**
   * Get comparison metrics
   */
  getComparisonMetrics(macroIds: string[]): ComparisonMetrics {
    const metrics = macroIds
      .map((id) => this.metrics.get(id))
      .filter((m) => m !== undefined) as MacroMetrics[];

    if (metrics.length === 0) {
      throw new Error('No metrics found for comparison');
    }

    const avgSuccessRate = metrics.reduce((sum, m) => sum + m.successRate, 0) / metrics.length;
    const avgDuration = metrics.reduce((sum, m) => sum + m.averageDuration, 0) / metrics.length;
    const totalExecutions = metrics.reduce((sum, m) => sum + m.totalExecutions, 0);

    return {
      macros: metrics.map((m) => ({
        macroId: m.macroId,
        successRate: m.successRate,
        averageDuration: m.averageDuration,
        totalExecutions: m.totalExecutions,
      })),
      averages: {
        successRate: avgSuccessRate,
        duration: avgDuration,
      },
      total: totalExecutions,
    };
  }

  /**
   * Get anomalies
   */
  getAnomalies(): Anomaly[] {
    const anomalies: Anomaly[] = [];

    for (const [macroId, metrics] of this.metrics) {
      // Check for high failure rate
      if (metrics.successRate < 50 && metrics.totalExecutions > 10) {
        anomalies.push({
          type: 'high_failure_rate',
          macroId,
          value: metrics.successRate,
          severity: 'high',
        });
      }

      // Check for high duration
      if (metrics.averageDuration > 5000 && metrics.totalExecutions > 5) {
        anomalies.push({
          type: 'high_duration',
          macroId,
          value: metrics.averageDuration,
          severity: 'medium',
        });
      }

      // Check for increasing errors
      const recentErrors = Object.values(metrics.errorCounts).reduce((a, b) => a + b, 0);
      if (recentErrors > metrics.totalExecutions * 0.3) {
        anomalies.push({
          type: 'increasing_errors',
          macroId,
          value: recentErrors,
          severity: 'high',
        });
      }
    }

    return anomalies;
  }

  /**
   * Export metrics
   */
  exportMetrics(format: 'json' | 'csv' = 'json'): string {
    if (format === 'json') {
      return JSON.stringify(
        {
          global: this.globalMetrics,
          macros: Array.from(this.metrics.values()),
          users: Array.from(this.userMetrics.values()),
          timestamp: new Date(),
        },
        null,
        2,
      );
    }

    // CSV format
    let csv =
      'MacroID,TotalExecutions,SuccessfulExecutions,FailedExecutions,SuccessRate,AverageDuration\n';

    for (const metrics of this.metrics.values()) {
      csv += `${metrics.macroId},${metrics.totalExecutions},${metrics.successfulExecutions},${metrics.failedExecutions},${metrics.successRate.toFixed(2)}%,${metrics.averageDuration.toFixed(2)}ms\n`;
    }

    return csv;
  }

  /**
   * Clear metrics
   */
  clearMetrics() {
    this.metrics.clear();
    this.userMetrics.clear();
    this.globalMetrics = {
      totalExecutions: 0,
      totalSuccessful: 0,
      totalFailed: 0,
      totalDuration: 0,
      averageDuration: 0,
      peakHour: 0,
      topMacros: [],
      topUsers: [],
    };
  }
}

/**
 * Macro metrics
 */
export interface MacroMetrics {
  macroId: string;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  totalDuration: number;
  averageDuration: number;
  minDuration: number;
  maxDuration: number;
  successRate: number;
  lastExecuted: Date | null;
  firstExecuted: Date;
  executionsByHour: Record<number, number>;
  executionsByDay: Record<string, number>;
  errorCounts: Record<string, number>;
  metadata: Record<string, any>;
}

/**
 * User metrics
 */
export interface UserMetrics {
  userId: string;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  totalDuration: number;
  averageDuration: number;
  macrosUsed: Set<string>;
  favoritesMacros: string[];
  executionsByDay: Record<string, number>;
  lastActive: Date;
}

/**
 * Global metrics
 */
export interface GlobalMetrics {
  totalExecutions: number;
  totalSuccessful: number;
  totalFailed: number;
  totalDuration: number;
  averageDuration: number;
  peakHour: number;
  topMacros: Array<{ macroId: string; executions: number; successRate: number }>;
  topUsers: Array<{ userId: string; executions: number; averageDuration: number }>;
}

/**
 * Macro performance report
 */
export interface MacroPerformanceReport {
  macroId: string;
  summary: {
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    successRate: number;
  };
  performance: {
    averageDuration: number;
    minDuration: number;
    maxDuration: number;
    totalDuration: number;
  };
  timeline: {
    firstExecuted: Date;
    lastExecuted: Date | null;
    executionsByHour: Record<number, number>;
    executionsByDay: Record<string, number>;
  };
  errors: Record<string, number>;
}

/**
 * User activity report
 */
export interface UserActivityReport {
  userId: string;
  summary: {
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
  };
  performance: {
    averageDuration: number;
    totalDuration: number;
  };
  activity: {
    lastActive: Date;
    executionsByDay: Record<string, number>;
    macrosUsed: string[];
  };
}

/**
 * Comparison metrics
 */
export interface ComparisonMetrics {
  macros: Array<{
    macroId: string;
    successRate: number;
    averageDuration: number;
    totalExecutions: number;
  }>;
  averages: {
    successRate: number;
    duration: number;
  };
  total: number;
}

/**
 * Anomaly
 */
export interface Anomaly {
  type: string;
  macroId: string;
  value: number;
  severity: 'low' | 'medium' | 'high';
}

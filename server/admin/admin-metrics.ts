import { logger } from '../_core/monitoring';

/**
 * Admin Metrics Manager
 * Collects and aggregates system metrics for admin dashboard
 */

export interface SystemMetrics {
  timestamp: string;
  workflowMetrics: {
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    successRate: number;
    averageDuration: number;
    executionsPerMinute: number;
  };
  errorMetrics: {
    totalErrors: number;
    errorRate: number;
    topErrors: Array<{ type: string; count: number }>;
    errorTrend: Array<{ timestamp: string; count: number }>;
  };
  tokenMetrics: {
    totalTokens: number;
    activeTokens: number;
    expiredTokens: number;
    expiringTokens: number;
    tokensByServer: Record<string, number>;
  };
  systemHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    databaseConnected: boolean;
    cacheConnected: boolean;
    apiResponseTime: number;
    memoryUsage: number;
    cpuUsage: number;
  };
  userMetrics: {
    totalUsers: number;
    activeUsers: number;
    newUsersToday: number;
  };
  workspaceMetrics: {
    totalWorkspaces: number;
    activeWorkspaces: number;
    workspacesWithErrors: number;
  };
}

export interface ExecutionStats {
  tool: string;
  server: string;
  executions: number;
  successes: number;
  failures: number;
  successRate: number;
  averageDuration: number;
  lastExecution: string;
}

export interface ErrorTrend {
  timestamp: string;
  count: number;
  errorType: string;
}

export class AdminMetricsManager {
  private metricsCache: Map<string, any> = new Map();
  private lastUpdate: Date = new Date();

  /**
   * Get comprehensive system metrics
   */
  async getSystemMetrics(
    timeRange: 'hour' | 'day' | 'week' | 'month' = 'day',
  ): Promise<SystemMetrics> {
    const now = new Date();

    const [
      workflowMetrics,
      errorMetrics,
      tokenMetrics,
      systemHealth,
      userMetrics,
      workspaceMetrics,
    ] = await Promise.all([
      this.getWorkflowMetrics(timeRange),
      this.getErrorMetrics(timeRange),
      this.getTokenMetrics(),
      this.getSystemHealth(),
      this.getUserMetrics(timeRange),
      this.getWorkspaceMetrics(timeRange),
    ]);

    return {
      timestamp: new Date().toISOString(),
      workflowMetrics,
      errorMetrics,
      tokenMetrics,
      systemHealth,
      userMetrics,
      workspaceMetrics,
    };
  }

  /**
   * Get workflow execution metrics
   */
  private async getWorkflowMetrics(timeRange: string): Promise<SystemMetrics['workflowMetrics']> {
    try {
      // TODO: Query from database when available
      // For now, return mock data
      return {
        totalExecutions: 1250,
        successfulExecutions: 1187,
        failedExecutions: 63,
        successRate: 94.96,
        averageDuration: 2847,
        executionsPerMinute: 0.87,
      };
    } catch (error) {
      logger.error('Error getting workflow metrics:', error);
      return {
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        successRate: 0,
        averageDuration: 0,
        executionsPerMinute: 0,
      };
    }
  }

  /**
   * Get error metrics and trends
   */
  private async getErrorMetrics(timeRange: string): Promise<SystemMetrics['errorMetrics']> {
    try {
      // TODO: Query from database when available
      // For now, return mock data
      return {
        totalErrors: 63,
        errorRate: 5.04,
        topErrors: [
          { type: 'timeout', count: 28 },
          { type: 'authentication_failed', count: 18 },
          { type: 'rate_limit', count: 12 },
          { type: 'invalid_parameter', count: 4 },
          { type: 'server_error', count: 1 },
        ],
        errorTrend: [
          { timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), count: 8 },
          { timestamp: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(), count: 5 },
          { timestamp: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(), count: 3 },
          { timestamp: new Date(Date.now() - 21 * 60 * 60 * 1000).toISOString(), count: 7 },
          { timestamp: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(), count: 4 },
        ],
      };
    } catch (error) {
      logger.error('Error getting error metrics:', error);
      return {
        totalErrors: 0,
        errorRate: 0,
        topErrors: [],
        errorTrend: [],
      };
    }
  }

  /**
   * Get token metrics
   */
  private async getTokenMetrics(): Promise<SystemMetrics['tokenMetrics']> {
    try {
      // TODO: Query from database when available
      // For now, return mock data
      return {
        totalTokens: 42,
        activeTokens: 38,
        expiredTokens: 3,
        expiringTokens: 1,
        tokensByServer: {
          github: 15,
          slack: 14,
          notion: 9,
          custom: 4,
        },
      };
    } catch (error) {
      logger.error('Error getting token metrics:', error);
      return {
        totalTokens: 0,
        activeTokens: 0,
        expiredTokens: 0,
        expiringTokens: 0,
        tokensByServer: {},
      };
    }
  }

  /**
   * Get system health status
   */
  private async getSystemHealth(): Promise<SystemMetrics['systemHealth']> {
    try {
      const startTime = Date.now();

      // Get memory usage
      const memUsage = process.memoryUsage();
      const memoryUsage = Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100);

      const apiResponseTime = Date.now() - startTime;

      // Determine overall status
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      if (memoryUsage > 80 || apiResponseTime > 1000) {
        status = 'degraded';
      }

      return {
        status,
        databaseConnected: true,
        cacheConnected: true,
        apiResponseTime,
        memoryUsage,
        cpuUsage: 0, // TODO: Get CPU usage
      };
    } catch (error) {
      logger.error('Error getting system health:', error);
      return {
        status: 'unhealthy',
        databaseConnected: false,
        cacheConnected: false,
        apiResponseTime: 0,
        memoryUsage: 0,
        cpuUsage: 0,
      };
    }
  }

  /**
   * Get user metrics
   */
  private async getUserMetrics(timeRange: string): Promise<SystemMetrics['userMetrics']> {
    try {
      // TODO: Query from database when available
      // For now, return mock data
      return {
        totalUsers: 156,
        activeUsers: 47,
        newUsersToday: 3,
      };
    } catch (error) {
      logger.error('Error getting user metrics:', error);
      return {
        totalUsers: 0,
        activeUsers: 0,
        newUsersToday: 0,
      };
    }
  }

  /**
   * Get workspace metrics
   */
  private async getWorkspaceMetrics(timeRange: string): Promise<SystemMetrics['workspaceMetrics']> {
    try {
      // TODO: Query from database when available
      // For now, return mock data
      return {
        totalWorkspaces: 28,
        activeWorkspaces: 14,
        workspacesWithErrors: 2,
      };
    } catch (error) {
      logger.error('Error getting workspace metrics:', error);
      return {
        totalWorkspaces: 0,
        activeWorkspaces: 0,
        workspacesWithErrors: 0,
      };
    }
  }

  /**
   * Get execution statistics by tool
   */
  async getExecutionStats(
    workspaceId?: string,
    timeRange: 'hour' | 'day' | 'week' | 'month' = 'day',
  ): Promise<ExecutionStats[]> {
    try {
      // TODO: Query from database when available
      // For now, return mock data
      return [
        {
          tool: 'create_issue',
          server: 'github',
          executions: 342,
          successes: 325,
          failures: 17,
          successRate: 95.03,
          averageDuration: 1250,
          lastExecution: new Date().toISOString(),
        },
        {
          tool: 'send_message',
          server: 'slack',
          executions: 287,
          successes: 275,
          failures: 12,
          successRate: 95.81,
          averageDuration: 890,
          lastExecution: new Date().toISOString(),
        },
        {
          tool: 'create_page',
          server: 'notion',
          executions: 156,
          successes: 148,
          failures: 8,
          successRate: 94.87,
          averageDuration: 3200,
          lastExecution: new Date().toISOString(),
        },
        {
          tool: 'search_repositories',
          server: 'github',
          executions: 98,
          successes: 94,
          failures: 4,
          successRate: 95.92,
          averageDuration: 2100,
          lastExecution: new Date().toISOString(),
        },
        {
          tool: 'list_channels',
          server: 'slack',
          executions: 87,
          successes: 85,
          failures: 2,
          successRate: 97.7,
          averageDuration: 650,
          lastExecution: new Date().toISOString(),
        },
      ];
    } catch (error) {
      logger.error('Error getting execution stats:', error);
      return [];
    }
  }

  /**
   * Get error trends
   */
  async getErrorTrends(
    workspaceId?: string,
    timeRange: 'hour' | 'day' | 'week' | 'month' = 'day',
  ): Promise<ErrorTrend[]> {
    try {
      // TODO: Query from database when available
      // For now, return mock data
      const trends: ErrorTrend[] = [];
      for (let i = 24; i > 0; i--) {
        const hour = new Date();
        hour.setHours(hour.getHours() - i);
        hour.setMinutes(0, 0, 0);

        trends.push({
          timestamp: hour.toISOString(),
          count: Math.floor(Math.random() * 10),
          errorType: 'timeout',
        });
      }
      return trends;
    } catch (error) {
      logger.error('Error getting error trends:', error);
      return [];
    }
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(
    workspaceId?: string,
    timeRange: 'hour' | 'day' | 'week' | 'month' = 'day',
  ): Promise<{
    p50: number;
    p95: number;
    p99: number;
    min: number;
    max: number;
    avg: number;
  }> {
    try {
      // TODO: Query from database when available
      // For now, return mock data
      return {
        p50: 1200,
        p95: 3500,
        p99: 5200,
        min: 150,
        max: 8900,
        avg: 2847,
      };
    } catch (error) {
      logger.error('Error getting performance metrics:', error);
      return { p50: 0, p95: 0, p99: 0, min: 0, max: 0, avg: 0 };
    }
  }
}

export const adminMetricsManager = new AdminMetricsManager();

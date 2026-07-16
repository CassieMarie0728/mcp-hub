/**
 * Client-side admin metrics mock.
 *
 * This mirrors the shape consumed by the admin dashboard. In production, this
 * module should fetch the same contract from the backend API instead of
 * generating local placeholder values.
 */

export type MetricsTimeRange = 'hour' | 'day' | 'week' | 'month';

export interface SystemHealthMetrics {
  status: 'healthy' | 'degraded' | 'unhealthy';
  databaseConnected: boolean;
  cacheConnected: boolean;
  memoryUsage: number;
  apiResponseTime: number;
}

export interface WorkflowMetrics {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  successRate: number;
  averageDuration: number;
  executionsPerMinute: number;
}

export interface TokenMetrics {
  activeTokens: number;
  totalTokens: number;
  expiringTokens: number;
  tokensByServer: Record<string, number>;
}

export interface UserMetrics {
  activeUsers: number;
  totalUsers: number;
  newUsersToday: number;
}

export interface WorkspaceMetrics {
  totalWorkspaces: number;
  activeWorkspaces: number;
  workspacesWithErrors: number;
}

export interface ErrorMetrics {
  totalErrors: number;
  errorRate: number;
  topErrors: Array<{
    type: string;
    count: number;
  }>;
  errorTrend: Array<{
    timestamp: number;
    count: number;
  }>;
}

export interface SystemMetrics {
  timestamp: number;
  uptime: number;
  systemHealth: SystemHealthMetrics;
  workflowMetrics: WorkflowMetrics;
  tokenMetrics: TokenMetrics;
  userMetrics: UserMetrics;
  workspaceMetrics: WorkspaceMetrics;
  errorMetrics: ErrorMetrics;
}

const randomInt = (max: number, min = 0) => {
  const lower = Math.min(min, max);
  const upper = Math.max(min, max);

  return Math.floor(Math.random() * (upper - lower + 1)) + lower;
};

const calculateRate = (part: number, total: number) => (total === 0 ? 0 : (part / total) * 100);

export const adminMetricsManager = {
  async getSystemMetrics(timeRange: MetricsTimeRange): Promise<SystemMetrics> {
    const rangeMultiplier: Record<MetricsTimeRange, number> = {
      hour: 1,
      day: 6,
      week: 24,
      month: 72,
    };

    const multiplier = rangeMultiplier[timeRange];
    const totalExecutions = randomInt(180 * multiplier, 25 * multiplier);
    const failedExecutions = randomInt(Math.max(1, Math.floor(totalExecutions * 0.12)));
    const successfulExecutions = totalExecutions - failedExecutions;
    const totalTokens = randomInt(300, 120);
    const totalErrors = randomInt(failedExecutions, Math.min(80, failedExecutions));

    return {
      timestamp: Date.now(),
      uptime: randomInt(86_400_000, 3_600_000),
      systemHealth: {
        status: failedExecutions > totalExecutions * 0.2 ? 'degraded' : 'healthy',
        databaseConnected: true,
        cacheConnected: true,
        memoryUsage: randomInt(74, 28),
        apiResponseTime: randomInt(380, 45),
      },
      workflowMetrics: {
        totalExecutions,
        successfulExecutions,
        failedExecutions,
        successRate: calculateRate(successfulExecutions, totalExecutions),
        averageDuration: randomInt(18_000, 800),
        executionsPerMinute: Number((totalExecutions / Math.max(1, multiplier * 60)).toFixed(2)),
      },
      tokenMetrics: {
        activeTokens: randomInt(totalTokens, 40),
        totalTokens,
        expiringTokens: randomInt(18, 0),
        tokensByServer: {
          github: randomInt(80, 10),
          slack: randomInt(45, 5),
          notion: randomInt(35, 3),
          custom: randomInt(25, 1),
        },
      },
      userMetrics: {
        activeUsers: randomInt(42, 5),
        totalUsers: randomInt(120, 45),
        newUsersToday: randomInt(12),
      },
      workspaceMetrics: {
        totalWorkspaces: randomInt(60, 12),
        activeWorkspaces: randomInt(30, 4),
        workspacesWithErrors: randomInt(8),
      },
      errorMetrics: {
        totalErrors,
        errorRate: calculateRate(totalErrors, totalExecutions),
        topErrors: [
          { type: 'connection timeout', count: randomInt(12, 1) },
          { type: 'invalid token', count: randomInt(8, 1) },
          { type: 'rate limit', count: randomInt(6, 1) },
        ],
        errorTrend: Array.from({ length: 8 }, (_, index) => ({
          timestamp: Date.now() - (7 - index) * 3_600_000,
          count: randomInt(10),
        })),
      },
    };
  },
};

/**
 * Client-side admin metrics mock
 * This is a placeholder for the server-side adminMetricsManager
 * In a real app, this would fetch metrics from the backend API
 */

export interface SystemMetrics {
  timestamp: number;
  uptime: number;
  health: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: Record<string, boolean>;
  };
  workflows: {
    total: number;
    running: number;
    completed: number;
    failed: number;
  };
  tokens: {
    active: number;
    expired: number;
    total: number;
  };
  errors: {
    total: number;
    recent: Array<{
      timestamp: number;
      message: string;
      count: number;
    }>;
  };
}

export const adminMetricsManager = {
  async getSystemMetrics(timeRange: 'hour' | 'day' | 'week' | 'month'): Promise<SystemMetrics> {
    // Mock data - in production, this would call the backend API
    return {
      timestamp: Date.now(),
      uptime: Math.random() * 86400000, // Random uptime in ms
      health: {
        status: 'healthy',
        checks: {
          database: true,
          cache: true,
          api: true,
        },
      },
      workflows: {
        total: Math.floor(Math.random() * 1000),
        running: Math.floor(Math.random() * 50),
        completed: Math.floor(Math.random() * 500),
        failed: Math.floor(Math.random() * 100),
      },
      tokens: {
        active: Math.floor(Math.random() * 200),
        expired: Math.floor(Math.random() * 50),
        total: Math.floor(Math.random() * 300),
      },
      errors: {
        total: Math.floor(Math.random() * 100),
        recent: [
          {
            timestamp: Date.now() - 3600000,
            message: 'Connection timeout',
            count: Math.floor(Math.random() * 10),
          },
          {
            timestamp: Date.now() - 7200000,
            message: 'Invalid token',
            count: Math.floor(Math.random() * 5),
          },
        ],
      },
    };
  },
};

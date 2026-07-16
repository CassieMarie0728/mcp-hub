import { createServer } from 'http';
import prometheus from 'prom-client';
import winston from 'winston';

/**
 * Prometheus Metrics Registry
 * Collects and exposes application metrics
 */

// Default metrics (CPU, memory, etc.)
prometheus.collectDefaultMetrics({ prefix: 'mcp_hub_' });

// ============================================================================
// Custom Metrics
// ============================================================================

// Workflow Execution Metrics
export const workflowExecutionCounter = new prometheus.Counter({
  name: 'workflow_executions_total',
  help: 'Total workflow executions',
  labelNames: ['status', 'workspace_id'],
});

export const workflowExecutionDuration = new prometheus.Histogram({
  name: 'workflow_execution_duration_seconds',
  help: 'Workflow execution duration in seconds',
  labelNames: ['workspace_id'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60, 300],
});

export const workflowQueueSize = new prometheus.Gauge({
  name: 'workflow_queue_size',
  help: 'Number of workflows waiting to be executed',
  labelNames: ['workspace_id'],
});

// Tool Execution Metrics
export const toolExecutionCounter = new prometheus.Counter({
  name: 'tool_executions_total',
  help: 'Total tool executions',
  labelNames: ['tool_name', 'server_type', 'status'],
});

export const toolExecutionDuration = new prometheus.Histogram({
  name: 'tool_execution_duration_seconds',
  help: 'Tool execution duration in seconds',
  labelNames: ['tool_name', 'server_type'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
});

// Error Metrics
export const errorCounter = new prometheus.Counter({
  name: 'errors_total',
  help: 'Total errors',
  labelNames: ['error_type', 'workspace_id'],
});

export const errorRate = new prometheus.Gauge({
  name: 'error_rate',
  help: 'Error rate (errors per minute)',
  labelNames: ['workspace_id'],
});

// Token Metrics
export const tokenCounter = new prometheus.Gauge({
  name: 'tokens_total',
  help: 'Total active tokens',
  labelNames: ['server_type', 'workspace_id'],
});

export const tokenExpiringCounter = new prometheus.Gauge({
  name: 'tokens_expiring_soon',
  help: 'Tokens expiring in next 7 days',
  labelNames: ['server_type', 'workspace_id'],
});

// Database Metrics
export const databaseConnectionPoolSize = new prometheus.Gauge({
  name: 'database_connection_pool_size',
  help: 'Current database connection pool size',
});

export const databaseConnectionPoolUsage = new prometheus.Gauge({
  name: 'database_connection_pool_usage',
  help: 'Database connection pool usage percentage',
});

export const databaseQueryDuration = new prometheus.Histogram({
  name: 'database_query_duration_seconds',
  help: 'Database query duration in seconds',
  labelNames: ['query_type'],
  buckets: [0.001, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
});

// WebSocket Metrics
export const websocketConnectionCounter = new prometheus.Gauge({
  name: 'websocket_connections_active',
  help: 'Number of active WebSocket connections',
});

export const websocketMessageCounter = new prometheus.Counter({
  name: 'websocket_messages_total',
  help: 'Total WebSocket messages',
  labelNames: ['direction', 'message_type'],
});

// API Metrics
export const apiRequestCounter = new prometheus.Counter({
  name: 'api_requests_total',
  help: 'Total API requests',
  labelNames: ['method', 'path', 'status'],
});

export const apiRequestDuration = new prometheus.Histogram({
  name: 'api_request_duration_seconds',
  help: 'API request duration in seconds',
  labelNames: ['method', 'path'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
});

// Webhook Metrics
export const webhookEventCounter = new prometheus.Counter({
  name: 'webhook_events_total',
  help: 'Total webhook events',
  labelNames: ['webhook_id', 'status'],
});

export const webhookDeliveryDuration = new prometheus.Histogram({
  name: 'webhook_delivery_duration_seconds',
  help: 'Webhook delivery duration in seconds',
  labelNames: ['webhook_id'],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
});

// ============================================================================
// Logger Configuration
// ============================================================================

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json(),
);

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'mcp-hub' },
  transports: [
    // Console output
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ level, message, timestamp, ...meta }: any) => {
          const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
          return `${timestamp} [${level}]: ${message} ${metaStr}`;
        }),
      ),
    }),
    // Error log file (requires winston-daily-rotate-file)
    // new DailyRotateFile({
    //   filename: '/var/log/mcp-hub/error-%DATE%.log',
    //   datePattern: 'YYYY-MM-DD',
    //   maxSize: '20m',
    //   maxDays: '30',
    //   level: 'error',
    // }),
    // Combined log file
    // new DailyRotateFile({
    //   filename: '/var/log/mcp-hub/combined-%DATE%.log',
    //   datePattern: 'YYYY-MM-DD',
    //   maxSize: '20m',
    //   maxDays: '30',
    // }),
  ],
});

// ============================================================================
// Health Check System
// ============================================================================

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    [key: string]: {
      status: 'ok' | 'warning' | 'error';
      message: string;
      timestamp: string;
    };
  };
  timestamp: string;
}

export class HealthChecker {
  private checks: Map<string, () => Promise<{ status: string; message: string }>> = new Map();

  registerCheck(name: string, check: () => Promise<{ status: string; message: string }>) {
    this.checks.set(name, check);
  }

  async check(): Promise<HealthCheckResult> {
    const checks: HealthCheckResult['checks'] = {};
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    for (const [name, check] of this.checks) {
      try {
        const result = (await Promise.race([
          check(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Check timeout')), 5000)),
        ])) as { status: string; message: string };

        const status = result.status === 'ok' ? 'ok' : 'warning';
        if (status === 'warning') overallStatus = 'degraded';

        checks[name] = {
          status: status as 'ok' | 'warning' | 'error',
          message: result.message,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        overallStatus = 'unhealthy';
        checks[name] = {
          status: 'error',
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        };
      }
    }

    return {
      status: overallStatus,
      checks,
      timestamp: new Date().toISOString(),
    };
  }
}

export const healthChecker = new HealthChecker();

// ============================================================================
// Metrics Server
// ============================================================================

export function startMetricsServer(port: number = 9090) {
  const server = createServer(async (req, res) => {
    if (req.url === '/metrics') {
      res.setHeader('Content-Type', prometheus.register.contentType);
      res.end(await prometheus.register.metrics());
    } else if (req.url === '/health') {
      const health = await healthChecker.check();
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = health.status === 'healthy' ? 200 : 503;
      res.end(JSON.stringify(health));
    } else {
      res.statusCode = 404;
      res.end('Not Found');
    }
  });

  server.listen(port, () => {
    logger.info(`Metrics server listening on port ${port}`);
  });

  return server;
}

// ============================================================================
// Middleware for Express
// ============================================================================

export function metricsMiddleware() {
  return (req: any, res: any, next: any): void => {
    const start = Date.now();

    res.on('finish', () => {
      const duration = (Date.now() - start) / 1000;
      const path = req.route?.path || req.path || 'unknown';
      const method = req.method || 'unknown';
      const status = res.statusCode || 500;

      apiRequestCounter.labels(method, path, status.toString()).inc();
      apiRequestDuration.labels(method, path).observe(duration);

      logger.info(`${method} ${path} - ${status} (${duration.toFixed(3)}s)`);
    });

    next();
  };
}

// ============================================================================
// Alert System
// ============================================================================

export interface Alert {
  id: string;
  name: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  timestamp: string;
  resolved: boolean;
  resolvedAt?: string;
}

export class AlertManager {
  private alerts: Map<string, Alert> = new Map();
  private alertHandlers: Array<(alert: Alert) => Promise<void>> = [];

  registerHandler(handler: (alert: Alert) => Promise<void>) {
    this.alertHandlers.push(handler);
  }

  async createAlert(
    name: string,
    severity: 'critical' | 'warning' | 'info',
    message: string,
  ): Promise<Alert> {
    const alert: Alert = {
      id: `${name}-${Date.now()}`,
      name,
      severity,
      message,
      timestamp: new Date().toISOString(),
      resolved: false,
    };

    this.alerts.set(alert.id, alert);

    // Notify handlers
    for (const handler of this.alertHandlers) {
      try {
        await handler(alert);
      } catch (error) {
        logger.error('Alert handler error:', error);
      }
    }

    return alert;
  }

  async resolveAlert(alertId: string): Promise<void> {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = new Date().toISOString();

      // Notify handlers
      for (const handler of this.alertHandlers) {
        try {
          await handler(alert);
        } catch (error) {
          logger.error('Alert handler error:', error);
        }
      }
    }
  }

  getActiveAlerts(): Alert[] {
    return Array.from(this.alerts.values()).filter((a) => !a.resolved);
  }

  getAllAlerts(): Alert[] {
    return Array.from(this.alerts.values());
  }
}

export const alertManager = new AlertManager();

// ============================================================================
// Slack Alert Handler
// ============================================================================

export async function setupSlackAlerts(webhookUrl: string) {
  alertManager.registerHandler(async (alert) => {
    try {
      const color =
        alert.severity === 'critical'
          ? 'danger'
          : alert.severity === 'warning'
            ? 'warning'
            : 'good';

      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attachments: [
            {
              color,
              title: `${alert.severity.toUpperCase()}: ${alert.name}`,
              text: alert.message,
              ts: Math.floor(new Date(alert.timestamp).getTime() / 1000),
              footer: alert.resolved ? 'RESOLVED' : 'ACTIVE',
            },
          ],
        }),
      });
    } catch (error) {
      logger.error('Failed to send Slack alert:', error);
    }
  });
}

// ============================================================================
// Email Alert Handler
// ============================================================================

export async function setupEmailAlerts(
  smtpConfig: {
    host: string;
    port: number;
    user: string;
    password: string;
    from: string;
  },
  recipients: string[],
) {
  alertManager.registerHandler(async (alert) => {
    try {
      // TODO: Implement email sending via nodemailer
      logger.info(`Email alert would be sent to ${recipients.join(', ')}: ${alert.message}`);
    } catch (error) {
      logger.error('Failed to send email alert:', error);
    }
  });
}

// ============================================================================
// Metrics Export
// ============================================================================

export async function exportMetrics(format: 'prometheus' | 'json' = 'prometheus'): Promise<string> {
  if (format === 'prometheus') {
    return await prometheus.register.metrics();
  } else {
    // JSON format for custom dashboards
    const metrics = await prometheus.register.getMetricsAsJSON();
    return JSON.stringify(metrics, null, 2);
  }
}

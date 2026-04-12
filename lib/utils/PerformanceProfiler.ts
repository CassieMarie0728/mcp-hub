/**
 * Performance Profiler
 * Utilities for measuring and optimizing app performance
 */

export interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

export interface PerformanceStats {
  metric: string;
  count: number;
  totalTime: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
  lastMeasurement: number;
}

class PerformanceProfiler {
  private static metrics: Map<string, PerformanceMetric[]> = new Map();
  private static activeTimers: Map<string, number> = new Map();

  /**
   * Start measuring a performance metric
   */
  static startMeasure(name: string, metadata?: Record<string, any>): void {
    const metric: PerformanceMetric = {
      name,
      startTime: performance.now(),
      metadata,
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    this.metrics.get(name)!.push(metric);
    this.activeTimers.set(name, this.metrics.get(name)!.length - 1);
  }

  /**
   * End measuring a performance metric
   */
  static endMeasure(name: string): number | null {
    const index = this.activeTimers.get(name);
    if (index === undefined) {
      if (__DEV__) console.warn(`No active timer for metric: ${name}`);
      return null;
    }

    const metrics = this.metrics.get(name);
    if (!metrics || !metrics[index]) {
      if (__DEV__) console.warn(`Metric not found: ${name}`);
      return null;
    }

    const metric = metrics[index];
    metric.endTime = performance.now();
    metric.duration = metric.endTime - metric.startTime;

    this.activeTimers.delete(name);

    if (__DEV__) {
      if (__DEV__) console.log(`[PERF] ${name}: ${metric.duration.toFixed(2)}ms`);
    }

    return metric.duration;
  }

  /**
   * Get statistics for a metric
   */
  static getStats(name: string): PerformanceStats | null {
    const metrics = this.metrics.get(name);
    if (!metrics || metrics.length === 0) {
      return null;
    }

    const completedMetrics = metrics.filter((m) => m.duration !== undefined) as Array<
      PerformanceMetric & { duration: number }
    >;

    if (completedMetrics.length === 0) {
      return null;
    }

    const durations = completedMetrics.map((m) => m.duration);
    const totalTime = durations.reduce((a, b) => a + b, 0);
    const averageTime = totalTime / durations.length;
    const minTime = Math.min(...durations);
    const maxTime = Math.max(...durations);
    const lastMeasurement = completedMetrics[completedMetrics.length - 1].duration;

    return {
      metric: name,
      count: completedMetrics.length,
      totalTime,
      averageTime,
      minTime,
      maxTime,
      lastMeasurement,
    };
  }

  /**
   * Get all statistics
   */
  static getAllStats(): PerformanceStats[] {
    const stats: PerformanceStats[] = [];

    for (const [name] of this.metrics) {
      const stat = this.getStats(name);
      if (stat) {
        stats.push(stat);
      }
    }

    return stats;
  }

  /**
   * Clear metrics for a specific name
   */
  static clearMetrics(name: string): void {
    this.metrics.delete(name);
    this.activeTimers.delete(name);
  }

  /**
   * Clear all metrics
   */
  static clearAll(): void {
    this.metrics.clear();
    this.activeTimers.clear();
  }

  /**
   * Export metrics as JSON
   */
  static exportMetrics(): string {
    const stats = this.getAllStats();
    return JSON.stringify(stats, null, 2);
  }

  /**
   * Log performance summary
   */
  static logSummary(): void {
    const stats = this.getAllStats();

    if (__DEV__) console.log('\n=== Performance Summary ===');
    stats.forEach((stat) => {
      if (__DEV__) console.log(`${stat.metric}:`);
      if (__DEV__) console.log(`  Count: ${stat.count}`);
      if (__DEV__) console.log(`  Average: ${stat.averageTime.toFixed(2)}ms`);
      if (__DEV__) console.log(`  Min: ${stat.minTime.toFixed(2)}ms`);
      if (__DEV__) console.log(`  Max: ${stat.maxTime.toFixed(2)}ms`);
      if (__DEV__) console.log(`  Last: ${stat.lastMeasurement.toFixed(2)}ms`);
    });
    if (__DEV__) console.log('===========================\n');
  }
}

/**
 * React Hook for performance monitoring
 */
export function usePerformanceMonitor(name: string) {
  const start = () => PerformanceProfiler.startMeasure(name);
  const end = () => PerformanceProfiler.endMeasure(name);
  const getStats = () => PerformanceProfiler.getStats(name);

  return { start, end, getStats };
}

/**
 * Decorator for measuring function performance
 */
export function measurePerformance(name?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const metricName = name || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = function (...args: any[]) {
      PerformanceProfiler.startMeasure(metricName);
      try {
        const result = originalMethod.apply(this, args);
        PerformanceProfiler.endMeasure(metricName);
        return result;
      } catch (error) {
        PerformanceProfiler.endMeasure(metricName);
        throw error;
      }
    };

    return descriptor;
  };
}

export default PerformanceProfiler;

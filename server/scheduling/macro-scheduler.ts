import * as cron from 'node-cron';
import { EventEmitter } from 'events';

/**
 * Macro Scheduler
 * Handles scheduling and execution of macros at specific times or intervals
 */
export class MacroScheduler extends EventEmitter {
  private schedules: Map<string, ScheduledMacro> = new Map();
  private executionHistory: ExecutionRecord[] = [];
  private maxHistorySize: number = 10000;

  /**
   * Schedule a macro with cron expression
   */
  scheduleMacro(
    macroId: string,
    userId: string,
    cronExpression: string,
    options: ScheduleOptions = {}
  ): ScheduledMacro {
    // Validate cron expression
    if (!this.isValidCronExpression(cronExpression)) {
      throw new Error(`Invalid cron expression: ${cronExpression}`);
    }

    // Stop existing schedule if any
    this.stopSchedule(macroId);

    // Create scheduled macro
    const scheduled: ScheduledMacro = {
      id: `schedule_${macroId}_${Date.now()}`,
      macroId,
      userId,
      cronExpression,
      enabled: true,
      createdAt: new Date(),
      lastRun: null,
      nextRun: this.calculateNextRun(cronExpression),
      executionCount: 0,
      successCount: 0,
      failureCount: 0,
      totalDuration: 0,
      options,
      task: null,
    };

    // Create cron task
    scheduled.task = cron.schedule(cronExpression, () => {
      this.executeScheduledMacro(scheduled);
    });

    // Store schedule
    this.schedules.set(macroId, scheduled);

    console.log(`Scheduled macro ${macroId} with cron: ${cronExpression}`);
    this.emit('scheduled', scheduled);

    return scheduled;
  }

  /**
   * Schedule macro with interval (in milliseconds)
   */
  scheduleInterval(
    macroId: string,
    userId: string,
    intervalMs: number,
    options: ScheduleOptions = {}
  ): ScheduledMacro {
    if (intervalMs < 1000) {
      throw new Error('Minimum interval is 1000ms (1 second)');
    }

    // Stop existing schedule if any
    this.stopSchedule(macroId);

    // Create scheduled macro
    const scheduled: ScheduledMacro = {
      id: `schedule_${macroId}_${Date.now()}`,
      macroId,
      userId,
      cronExpression: '',
      interval: intervalMs,
      enabled: true,
      createdAt: new Date(),
      lastRun: null,
      nextRun: new Date(Date.now() + intervalMs),
      executionCount: 0,
      successCount: 0,
      failureCount: 0,
      totalDuration: 0,
      options,
      task: null,
    };

    // Create interval task
    scheduled.task = setInterval(() => {
      this.executeScheduledMacro(scheduled);
    }, intervalMs) as any;

    // Store schedule
    this.schedules.set(macroId, scheduled);

    console.log(`Scheduled macro ${macroId} with interval: ${intervalMs}ms`);
    this.emit('scheduled', scheduled);

    return scheduled;
  }

  /**
   * Schedule macro for one-time execution
   */
  scheduleOnce(
    macroId: string,
    userId: string,
    executeAt: Date,
    options: ScheduleOptions = {}
  ): ScheduledMacro {
    // Stop existing schedule if any
    this.stopSchedule(macroId);

    const delay = executeAt.getTime() - Date.now();
    if (delay < 0) {
      throw new Error('Execution time is in the past');
    }

    // Create scheduled macro
    const scheduled: ScheduledMacro = {
      id: `schedule_${macroId}_${Date.now()}`,
      macroId,
      userId,
      cronExpression: '',
      enabled: true,
      createdAt: new Date(),
      lastRun: null,
      nextRun: executeAt,
      executionCount: 0,
      successCount: 0,
      failureCount: 0,
      totalDuration: 0,
      options,
      task: null,
      oneTime: true,
    };

    // Create timeout task
    scheduled.task = setTimeout(() => {
      this.executeScheduledMacro(scheduled);
      this.stopSchedule(macroId);
    }, delay) as any;

    // Store schedule
    this.schedules.set(macroId, scheduled);

    console.log(`Scheduled macro ${macroId} for one-time execution at ${executeAt}`);
    this.emit('scheduled', scheduled);

    return scheduled;
  }

  /**
   * Execute scheduled macro
   */
  private async executeScheduledMacro(scheduled: ScheduledMacro) {
    const startTime = Date.now();

    try {
      console.log(`Executing scheduled macro: ${scheduled.macroId}`);

      // Emit execution event
      this.emit('execute', {
        macroId: scheduled.macroId,
        userId: scheduled.userId,
        scheduledId: scheduled.id,
      });

      // Simulate macro execution (replace with actual execution)
      await this.executeMacro(scheduled.macroId, scheduled.userId, scheduled.options);

      // Record success
      const duration = Date.now() - startTime;
      scheduled.successCount++;
      scheduled.totalDuration += duration;
      scheduled.lastRun = new Date();
      scheduled.nextRun = this.calculateNextRun(scheduled.cronExpression, scheduled.interval);

      this.recordExecution({
        macroId: scheduled.macroId,
        userId: scheduled.userId,
        status: 'success',
        duration,
        timestamp: new Date(),
      });

      this.emit('success', {
        macroId: scheduled.macroId,
        duration,
        executionCount: scheduled.executionCount,
      });
    } catch (error) {
      // Record failure
      const duration = Date.now() - startTime;
      scheduled.failureCount++;
      scheduled.lastRun = new Date();
      scheduled.nextRun = this.calculateNextRun(scheduled.cronExpression, scheduled.interval);

      this.recordExecution({
        macroId: scheduled.macroId,
        userId: scheduled.userId,
        status: 'failure',
        duration,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      });

      this.emit('failure', {
        macroId: scheduled.macroId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      scheduled.executionCount++;
    }
  }

  /**
   * Execute macro (placeholder)
   */
  private async executeMacro(macroId: string, userId: string, options: ScheduleOptions) {
    // This would be replaced with actual macro execution logic
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(true);
      }, 100);
    });
  }

  /**
   * Stop schedule
   */
  stopSchedule(macroId: string) {
    const scheduled = this.schedules.get(macroId);
    if (scheduled && scheduled.task) {
      if (typeof scheduled.task === 'object' && 'stop' in scheduled.task) {
        (scheduled.task as any).stop();
      } else if (typeof scheduled.task === 'number') {
        clearInterval(scheduled.task);
      } else {
        clearTimeout(scheduled.task);
      }
      this.schedules.delete(macroId);
      console.log(`Stopped schedule for macro ${macroId}`);
      this.emit('stopped', { macroId });
    }
  }

  /**
   * Pause schedule
   */
  pauseSchedule(macroId: string) {
    const scheduled = this.schedules.get(macroId);
    if (scheduled) {
      scheduled.enabled = false;
      console.log(`Paused schedule for macro ${macroId}`);
      this.emit('paused', { macroId });
    }
  }

  /**
   * Resume schedule
   */
  resumeSchedule(macroId: string) {
    const scheduled = this.schedules.get(macroId);
    if (scheduled) {
      scheduled.enabled = true;
      console.log(`Resumed schedule for macro ${macroId}`);
      this.emit('resumed', { macroId });
    }
  }

  /**
   * Get schedule
   */
  getSchedule(macroId: string): ScheduledMacro | null {
    return this.schedules.get(macroId) || null;
  }

  /**
   * Get all schedules for user
   */
  getUserSchedules(userId: string): ScheduledMacro[] {
    return Array.from(this.schedules.values()).filter((s) => s.userId === userId);
  }

  /**
   * Get all schedules
   */
  getAllSchedules(): ScheduledMacro[] {
    return Array.from(this.schedules.values());
  }

  /**
   * Record execution
   */
  private recordExecution(record: ExecutionRecord) {
    this.executionHistory.push(record);

    // Keep history size manageable
    if (this.executionHistory.length > this.maxHistorySize) {
      this.executionHistory = this.executionHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Get execution history
   */
  getExecutionHistory(macroId?: string, limit: number = 100): ExecutionRecord[] {
    let history = this.executionHistory;

    if (macroId) {
      history = history.filter((r) => r.macroId === macroId);
    }

    return history.slice(-limit);
  }

  /**
   * Get execution statistics
   */
  getExecutionStats(macroId: string): ExecutionStats {
    const scheduled = this.schedules.get(macroId);
    if (!scheduled) {
      throw new Error(`Schedule not found for macro ${macroId}`);
    }

    const history = this.executionHistory.filter((r) => r.macroId === macroId);
    const successfulRuns = history.filter((r) => r.status === 'success');
    const failedRuns = history.filter((r) => r.status === 'failure');

    const avgDuration = successfulRuns.length > 0
      ? successfulRuns.reduce((sum, r) => sum + r.duration, 0) / successfulRuns.length
      : 0;

    return {
      macroId,
      totalExecutions: scheduled.executionCount,
      successfulExecutions: scheduled.successCount,
      failedExecutions: scheduled.failureCount,
      successRate: scheduled.executionCount > 0
        ? (scheduled.successCount / scheduled.executionCount) * 100
        : 0,
      averageDuration: avgDuration,
      totalDuration: scheduled.totalDuration,
      lastRun: scheduled.lastRun,
      nextRun: scheduled.nextRun,
    };
  }

  /**
   * Validate cron expression
   */
  private isValidCronExpression(expression: string): boolean {
    try {
      cron.validate(expression);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Calculate next run time
   */
  private calculateNextRun(cronExpression?: string, intervalMs?: number): Date {
    if (intervalMs) {
      return new Date(Date.now() + intervalMs);
    }

    if (cronExpression) {
      try {
        // Parse cron and calculate next execution date
        // For now, return a date 1 hour from now as a placeholder
        return new Date(Date.now() + 60 * 60 * 1000);
      } catch {
        return new Date();
      }
    }

    return new Date();
  }

  /**
   * Cleanup
   */
  cleanup() {
    for (const scheduled of this.schedules.values()) {
      this.stopSchedule(scheduled.macroId);
    }
    this.schedules.clear();
    this.executionHistory = [];
  }
}

/**
 * Scheduled macro
 */
export interface ScheduledMacro {
  id: string;
  macroId: string;
  userId: string;
  cronExpression: string;
  interval?: number;
  enabled: boolean;
  createdAt: Date;
  lastRun: Date | null;
  nextRun: Date;
  executionCount: number;
  successCount: number;
  failureCount: number;
  totalDuration: number;
  options: ScheduleOptions;
  task: any;
  oneTime?: boolean;
}

/**
 * Schedule options
 */
export interface ScheduleOptions {
  retryOnFailure?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
  notifyOnSuccess?: boolean;
  notifyOnFailure?: boolean;
}

/**
 * Execution record
 */
export interface ExecutionRecord {
  macroId: string;
  userId: string;
  status: 'success' | 'failure';
  duration: number;
  error?: string;
  timestamp: Date;
}

/**
 * Execution statistics
 */
export interface ExecutionStats {
  macroId: string;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  successRate: number;
  averageDuration: number;
  totalDuration: number;
  lastRun: Date | null;
  nextRun: Date;
}

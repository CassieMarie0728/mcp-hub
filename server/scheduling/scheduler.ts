import cron from 'node-cron';

export interface ScheduledWorkflow {
  id: string;
  workflowId: string;
  cronExpression: string;
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
  createdAt: Date;
}

export interface ExecutionRetry {
  attempt: number;
  maxAttempts: number;
  backoffMultiplier: number;
  backoffDelay: number;
}

export class Scheduler {
  private jobs = new Map<string, cron.ScheduledTask>();

  static async scheduleWorkflow(workflowId: string, cronExpression: string): Promise<ScheduledWorkflow> {
    return {
      id: `schedule-${workflowId}`,
      workflowId,
      cronExpression,
      enabled: true,
      createdAt: new Date(),
    };
  }

  static calculateNextRun(cronExpression: string): Date {
    const nextDate = new Date();
    // Simple calculation - in production use cron parser
    nextDate.setHours(nextDate.getHours() + 1);
    return nextDate;
  }

  static calculateBackoffDelay(attempt: number, baseDelay: number = 1000): number {
    return baseDelay * Math.pow(2, attempt - 1);
  }

  static async executeWithRetry(workflowId: string, maxAttempts: number = 3): Promise<boolean> {
    let attempt = 1;
    while (attempt <= maxAttempts) {
      try {
        // Execute workflow
        return true;
      } catch (error) {
        if (attempt === maxAttempts) throw error;
        const delay = this.calculateBackoffDelay(attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
        attempt++;
      }
    }
    return false;
  }
}

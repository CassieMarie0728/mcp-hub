import AsyncStorage from '@react-native-async-storage/async-storage';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { Macro } from '@/lib/models/Macro';

export enum ScheduleFrequency {
  ONCE = 'once',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  CUSTOM = 'custom',
}

export interface MacroSchedule {
  id: string;
  macroId: string;
  frequency: ScheduleFrequency;
  scheduledTime: string; // HH:mm format
  daysOfWeek?: number[]; // 0-6, Sunday-Saturday
  dayOfMonth?: number; // 1-31
  isEnabled: boolean;
  lastExecutedAt?: number;
  nextExecutionAt?: number;
  createdAt: number;
  updatedAt: number;
  retryCount: number;
  maxRetries: number;
  notifyOnSuccess: boolean;
  notifyOnFailure: boolean;
}

export interface ScheduleExecution {
  id: string;
  scheduleId: string;
  macroId: string;
  executedAt: number;
  status: 'success' | 'failed' | 'pending';
  result?: any;
  error?: string;
  duration: number;
}

const TASK_NAME = 'MACRO_SCHEDULER_TASK';
const STORAGE_KEY_SCHEDULES = 'macro_schedules';
const STORAGE_KEY_EXECUTIONS = 'macro_executions';

/**
 * MacroSchedulingEngine
 * Handles scheduling macros for time-based execution
 */
export class MacroSchedulingEngine {
  private static isInitialized = false;

  /**
   * Initialize the scheduling engine
   */
  static async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Register background task
      TaskManager.defineTask(TASK_NAME, async () => {
        try {
          await this.executeScheduledMacros();
          return BackgroundFetch.BackgroundFetchResult.NewData;
        } catch (error) {
          console.error('Macro scheduler task failed:', error);
          return BackgroundFetch.BackgroundFetchResult.Failed;
        }
      });

      // Register background fetch
      await BackgroundFetch.registerTaskAsync(TASK_NAME, {
        minimumInterval: 15 * 60, // 15 minutes
        stopOnTerminate: false,
        startOnBoot: true,
      });

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize macro scheduler:', error);
    }
  }

  /**
   * Create a new schedule
   */
  static async createSchedule(
    macroId: string,
    frequency: ScheduleFrequency,
    scheduledTime: string,
    options?: Partial<MacroSchedule>
  ): Promise<MacroSchedule> {
    const schedule: MacroSchedule = {
      id: `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      macroId,
      frequency,
      scheduledTime,
      isEnabled: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      retryCount: 0,
      maxRetries: 3,
      notifyOnSuccess: true,
      notifyOnFailure: true,
      ...options,
    };

    const schedules = await this.getSchedules();
    schedules.push(schedule);
    await AsyncStorage.setItem(STORAGE_KEY_SCHEDULES, JSON.stringify(schedules));

    return schedule;
  }

  /**
   * Get all schedules
   */
  static async getSchedules(): Promise<MacroSchedule[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY_SCHEDULES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get schedules:', error);
      return [];
    }
  }

  /**
   * Get schedules for a specific macro
   */
  static async getSchedulesForMacro(macroId: string): Promise<MacroSchedule[]> {
    const schedules = await this.getSchedules();
    return schedules.filter((s) => s.macroId === macroId);
  }

  /**
   * Update a schedule
   */
  static async updateSchedule(scheduleId: string, updates: Partial<MacroSchedule>): Promise<MacroSchedule> {
    const schedules = await this.getSchedules();
    const index = schedules.findIndex((s) => s.id === scheduleId);

    if (index === -1) {
      throw new Error(`Schedule not found: ${scheduleId}`);
    }

    const updated = {
      ...schedules[index],
      ...updates,
      updatedAt: Date.now(),
    };

    schedules[index] = updated;
    await AsyncStorage.setItem(STORAGE_KEY_SCHEDULES, JSON.stringify(schedules));

    return updated;
  }

  /**
   * Delete a schedule
   */
  static async deleteSchedule(scheduleId: string): Promise<void> {
    const schedules = await this.getSchedules();
    const filtered = schedules.filter((s) => s.id !== scheduleId);
    await AsyncStorage.setItem(STORAGE_KEY_SCHEDULES, JSON.stringify(filtered));
  }

  /**
   * Check if a macro should be executed now
   */
  private static shouldExecuteNow(schedule: MacroSchedule): boolean {
    if (!schedule.isEnabled) return false;

    const now = new Date();
    const [hours, minutes] = schedule.scheduledTime.split(':').map(Number);

    // Check if current time matches scheduled time (within 1 minute window)
    if (now.getHours() !== hours || now.getMinutes() !== minutes) {
      return false;
    }

    // Check frequency
    switch (schedule.frequency) {
      case ScheduleFrequency.ONCE:
        return !schedule.lastExecutedAt;

      case ScheduleFrequency.DAILY:
        return !schedule.lastExecutedAt || this.isNewDay(schedule.lastExecutedAt);

      case ScheduleFrequency.WEEKLY:
        if (!schedule.daysOfWeek || schedule.daysOfWeek.length === 0) return false;
        const dayOfWeek = now.getDay();
        return (
          schedule.daysOfWeek.includes(dayOfWeek) &&
          (!schedule.lastExecutedAt || this.isNewWeek(schedule.lastExecutedAt))
        );

      case ScheduleFrequency.MONTHLY:
        if (!schedule.dayOfMonth) return false;
        return (
          now.getDate() === schedule.dayOfMonth &&
          (!schedule.lastExecutedAt || this.isNewMonth(schedule.lastExecutedAt))
        );

      default:
        return false;
    }
  }

  /**
   * Execute scheduled macros
   */
  static async executeScheduledMacros(): Promise<void> {
    try {
      const schedules = await this.getSchedules();

      for (const schedule of schedules) {
        if (!this.shouldExecuteNow(schedule)) continue;

        try {
          // Execute macro (this would call the actual macro execution engine)
          const execution: ScheduleExecution = {
            id: `exec_${Date.now()}`,
            scheduleId: schedule.id,
            macroId: schedule.macroId,
            executedAt: Date.now(),
            status: 'success',
            duration: 0,
          };

          // Update schedule
          await this.updateSchedule(schedule.id, {
            lastExecutedAt: Date.now(),
            nextExecutionAt: this.calculateNextExecution(schedule),
            retryCount: 0,
          });

          // Store execution
          await this.storeExecution(execution);
        } catch (error) {
          // Handle retry logic
          const retryCount = (schedule.retryCount || 0) + 1;
          if (retryCount <= schedule.maxRetries) {
            await this.updateSchedule(schedule.id, {
              retryCount,
            });
          }
        }
      }
    } catch (error) {
      console.error('Failed to execute scheduled macros:', error);
    }
  }

  /**
   * Calculate next execution time
   */
  private static calculateNextExecution(schedule: MacroSchedule): number {
    const now = new Date();
    const [hours, minutes] = schedule.scheduledTime.split(':').map(Number);

    let next = new Date(now);
    next.setHours(hours, minutes, 0, 0);

    if (next <= now) {
      next.setDate(next.getDate() + 1);
    }

    switch (schedule.frequency) {
      case ScheduleFrequency.WEEKLY:
        if (schedule.daysOfWeek && schedule.daysOfWeek.length > 0) {
          const daysUntilNext = Math.min(
            ...schedule.daysOfWeek.map((day) => {
              const diff = (day - next.getDay() + 7) % 7;
              return diff === 0 && next > now ? 0 : diff || 7;
            })
          );
          next.setDate(next.getDate() + daysUntilNext);
        }
        break;

      case ScheduleFrequency.MONTHLY:
        if (schedule.dayOfMonth) {
          next.setMonth(next.getMonth() + 1);
          next.setDate(schedule.dayOfMonth);
        }
        break;
    }

    return next.getTime();
  }

  /**
   * Store execution record
   */
  private static async storeExecution(execution: ScheduleExecution): Promise<void> {
    try {
      const executions = await this.getExecutions();
      executions.push(execution);

      // Keep only last 1000 executions
      if (executions.length > 1000) {
        executions.splice(0, executions.length - 1000);
      }

      await AsyncStorage.setItem(STORAGE_KEY_EXECUTIONS, JSON.stringify(executions));
    } catch (error) {
      console.error('Failed to store execution:', error);
    }
  }

  /**
   * Get execution history
   */
  static async getExecutions(limit?: number): Promise<ScheduleExecution[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY_EXECUTIONS);
      let executions = data ? JSON.parse(data) : [];

      if (limit) {
        executions = executions.slice(-limit);
      }

      return executions;
    } catch (error) {
      console.error('Failed to get executions:', error);
      return [];
    }
  }

  /**
   * Helper: Check if new day
   */
  private static isNewDay(timestamp: number): boolean {
    const lastDate = new Date(timestamp).toDateString();
    const todayDate = new Date().toDateString();
    return lastDate !== todayDate;
  }

  /**
   * Helper: Check if new week
   */
  private static isNewWeek(timestamp: number): boolean {
    const lastDate = new Date(timestamp);
    const today = new Date();
    const lastWeek = Math.floor(lastDate.getTime() / (7 * 24 * 60 * 60 * 1000));
    const thisWeek = Math.floor(today.getTime() / (7 * 24 * 60 * 60 * 1000));
    return lastWeek !== thisWeek;
  }

  /**
   * Helper: Check if new month
   */
  private static isNewMonth(timestamp: number): boolean {
    const lastDate = new Date(timestamp);
    const today = new Date();
    return lastDate.getMonth() !== today.getMonth() || lastDate.getFullYear() !== today.getFullYear();
  }
}

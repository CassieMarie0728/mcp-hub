/**
 * Analytics tRPC Router
 */

import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import ExecutionAnalytics from './execution-analytics';

export const analyticsRouter = router({
  /**
   * Record an execution
   */
  recordExecution: protectedProcedure
    .input(
      z.object({
        toolName: z.string(),
        serverId: z.string(),
        executionTime: z.number(),
        status: z.enum(['success', 'failed', 'skipped']),
        errorMessage: z.string().optional(),
        parameters: z.record(z.string(), z.any()).optional(),
        result: z.any().optional(),
      }),
    )
    .mutation(({ input }) => {
      const metrics = {
        toolName: input.toolName,
        serverId: input.serverId,
        executionTime: input.executionTime,
        status: input.status as 'success' | 'failed' | 'skipped',
        timestamp: new Date(),
        errorMessage: input.errorMessage,
        parameters: input.parameters,
        result: input.result,
      };
      ExecutionAnalytics.recordExecution(metrics);
      return { success: true };
    }),

  /**
   * Get tool statistics
   */
  getToolStats: protectedProcedure
    .input(z.object({ toolName: z.string().optional() }))
    .query(({ input }) => {
      return ExecutionAnalytics.getToolStats(input.toolName);
    }),

  /**
   * Get server statistics
   */
  getServerStats: protectedProcedure
    .input(z.object({ serverId: z.string().optional() }))
    .query(({ input }) => {
      return ExecutionAnalytics.getServerStats(input.serverId);
    }),

  /**
   * Get execution history
   */
  getExecutionHistory: protectedProcedure
    .input(
      z.object({
        toolName: z.string().optional(),
        serverId: z.string().optional(),
        status: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        limit: z.number().optional(),
      }),
    )
    .query(({ input }) => {
      return ExecutionAnalytics.getExecutionHistory(input);
    }),

  /**
   * Get error trends
   */
  getErrorTrends: protectedProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
      }),
    )
    .query(({ input }) => {
      return ExecutionAnalytics.getErrorTrends(input.startDate, input.endDate);
    }),

  /**
   * Get performance trends
   */
  getPerformanceTrends: protectedProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
      }),
    )
    .query(({ input }) => {
      return ExecutionAnalytics.getPerformanceTrends(input.startDate, input.endDate);
    }),

  /**
   * Generate analytics report
   */
  generateReport: protectedProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
      }),
    )
    .query(({ input }) => {
      return ExecutionAnalytics.generateReport(input.startDate, input.endDate);
    }),
});

export default analyticsRouter;

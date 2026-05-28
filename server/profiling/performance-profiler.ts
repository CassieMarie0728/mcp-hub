/**
 * Macro Performance Profiler
 * Tracks execution timeline, identifies bottlenecks, and suggests optimizations
 */
export class MacroPerformanceProfiler {
  private executionTraces: Map<string, ExecutionTrace[]> = new Map();
  private bottlenecks: Map<string, Bottleneck[]> = new Map();
  private optimizationSuggestions: Map<string, OptimizationSuggestion[]> = new Map();

  /**
   * Start profiling macro execution
   */
  startProfiling(executionId: string, macroId: string): ExecutionTrace {
    const trace: ExecutionTrace = {
      executionId,
      macroId,
      startTime: Date.now(),
      endTime: 0,
      duration: 0,
      actions: [],
      status: 'running',
      errorMessage: null,
    };

    const traces = this.executionTraces.get(macroId) || [];
    traces.push(trace);
    this.executionTraces.set(macroId, traces);

    return trace;
  }

  /**
   * Record action execution
   */
  recordAction(executionId: string, macroId: string, action: ActionRecord): void {
    const traces = this.executionTraces.get(macroId) || [];
    const trace = traces.find((t) => t.executionId === executionId);

    if (trace) {
      trace.actions.push(action);
    }
  }

  /**
   * End profiling
   */
  endProfiling(
    executionId: string,
    macroId: string,
    status: 'success' | 'failed',
    errorMessage?: string,
  ): ExecutionTrace | null {
    const traces = this.executionTraces.get(macroId) || [];
    const trace = traces.find((t) => t.executionId === executionId);

    if (trace) {
      trace.endTime = Date.now();
      const actionDuration = trace.actions.reduce((sum, action) => sum + action.duration, 0);
      trace.duration = Math.max(trace.endTime - trace.startTime, actionDuration, 1);
      trace.status = status;
      trace.errorMessage = errorMessage || null;

      // Analyze bottlenecks
      this.analyzeBottlenecks(macroId, trace);

      // Generate suggestions
      this.generateOptimizationSuggestions(macroId, trace);

      return trace;
    }

    return null;
  }

  /**
   * Analyze bottlenecks in execution
   */
  private analyzeBottlenecks(macroId: string, trace: ExecutionTrace): void {
    const bottlenecks: Bottleneck[] = [];

    // Find slowest actions
    const sortedActions = [...trace.actions].sort((a, b) => b.duration - a.duration);

    sortedActions.slice(0, 5).forEach((action, index) => {
      const percentOfTotal = (action.duration / trace.duration) * 100;

      if (percentOfTotal > 10) {
        bottlenecks.push({
          actionIndex: trace.actions.indexOf(action),
          actionType: action.type,
          duration: action.duration,
          percentOfTotal,
          severity: percentOfTotal > 30 ? 'critical' : percentOfTotal > 20 ? 'high' : 'medium',
          reason: this.identifyBottleneckReason(action),
        });
      }
    });

    // Find actions with retries
    trace.actions.forEach((action, index) => {
      if (action.retries && action.retries > 0) {
        bottlenecks.push({
          actionIndex: index,
          actionType: action.type,
          duration: action.duration,
          percentOfTotal: (action.duration / trace.duration) * 100,
          severity: 'high',
          reason: `Action retried ${action.retries} times`,
        });
      }
    });

    // Find actions with errors
    trace.actions.forEach((action, index) => {
      if (action.error) {
        bottlenecks.push({
          actionIndex: index,
          actionType: action.type,
          duration: action.duration,
          percentOfTotal: (action.duration / trace.duration) * 100,
          severity: 'critical',
          reason: `Error: ${action.error}`,
        });
      }
    });

    const existing = this.bottlenecks.get(macroId) || [];
    this.bottlenecks.set(macroId, [...existing, ...bottlenecks]);
  }

  /**
   * Identify bottleneck reason
   */
  private identifyBottleneckReason(action: ActionRecord): string {
    if (action.type === 'wait') {
      return 'Explicit wait time';
    } else if (action.type === 'scroll') {
      return 'Scrolling operation (consider using coordinates)';
    } else if (action.type === 'type') {
      return 'Text input (consider batch operations)';
    } else if (action.type === 'tap' && action.retries && action.retries > 0) {
      return 'Element not found (multiple retries)';
    }

    return 'Slow operation';
  }

  /**
   * Generate optimization suggestions
   */
  private generateOptimizationSuggestions(macroId: string, trace: ExecutionTrace): void {
    const suggestions: OptimizationSuggestion[] = [];

    // Analyze action patterns
    const actionTypes = trace.actions.map((a) => a.type);
    const waitCount = actionTypes.filter((t) => t === 'wait').length;
    const tapCount = actionTypes.filter((t) => t === 'tap').length;
    const scrollCount = actionTypes.filter((t) => t === 'scroll').length;

    // Suggestion: Reduce waits
    if (waitCount > 0) {
      suggestions.push({
        id: `suggestion_wait_hint_${macroId}`,
        type: 'performance',
        priority: waitCount > 3 ? 'high' : 'low',
        title: 'Review wait usage',
        description:
          waitCount > 3
            ? `Found ${waitCount} explicit waits. Consider using element detection instead.`
            : 'Found explicit wait actions. Consider replacing static waits with readiness checks.',
        estimatedImprovement:
          waitCount > 3
            ? `${Math.round(((waitCount * 500) / trace.duration) * 100)}% faster`
            : 'Potentially faster',
        implementation: 'Replace wait actions with element detection where possible',
      });
    }

    // Suggestion: Batch operations
    if (tapCount > 10) {
      suggestions.push({
        id: `suggestion_batch_${macroId}`,
        type: 'performance',
        priority: 'medium',
        title: 'Consider batching operations',
        description: `Found ${tapCount} tap operations. Group related actions together.`,
        estimatedImprovement: '10-20% faster',
        implementation: 'Combine multiple taps into a single batch operation',
      });
    }

    // Suggestion: Optimize scrolling
    if (scrollCount > 5) {
      suggestions.push({
        id: `suggestion_scroll_${macroId}`,
        type: 'performance',
        priority: 'medium',
        title: 'Optimize scrolling',
        description: `Found ${scrollCount} scroll operations. Use direct coordinates when possible.`,
        estimatedImprovement: '15-25% faster',
        implementation: 'Replace scroll with direct tap on target coordinates',
      });
    }

    // Suggestion: Retry strategy
    const failedActions = trace.actions.filter((a) => a.error);
    if (failedActions.length > 0) {
      suggestions.push({
        id: `suggestion_retry_${macroId}`,
        type: 'reliability',
        priority: 'high',
        title: 'Improve error handling',
        description: `${failedActions.length} actions failed. Implement better error recovery.`,
        estimatedImprovement: 'Increase success rate',
        implementation: 'Add try-catch blocks and fallback strategies',
      });
    }

    // Suggestion: Parallel execution
    const independentActions = this.findIndependentActions(trace.actions);
    if (independentActions.length > 2) {
      suggestions.push({
        id: `suggestion_parallel_${macroId}`,
        type: 'performance',
        priority: 'low',
        title: 'Parallel execution opportunity',
        description: `Found ${independentActions.length} independent actions that could run in parallel.`,
        estimatedImprovement: '20-30% faster',
        implementation: 'Refactor macro to execute independent actions in parallel',
      });
    }

    const existing = this.optimizationSuggestions.get(macroId) || [];
    this.optimizationSuggestions.set(macroId, [...existing, ...suggestions]);
  }

  /**
   * Find independent actions
   */
  private findIndependentActions(actions: ActionRecord[]): ActionRecord[] {
    // Simplified: actions that don't depend on previous results
    return actions.filter((action, index) => {
      if (index === 0) return false;
      // Check if action depends on previous action's result
      return !action.dependsOn || action.dependsOn.length === 0;
    });
  }

  /**
   * Get execution timeline
   */
  getExecutionTimeline(macroId: string, executionId?: string): ExecutionTimeline[] {
    const traces = this.executionTraces.get(macroId) || [];
    const filtered = executionId ? traces.filter((t) => t.executionId === executionId) : traces;

    return filtered.map((trace) => ({
      executionId: trace.executionId,
      totalDuration: trace.duration,
      actionCount: trace.actions.length,
      actions: trace.actions.map((action, index) => ({
        index,
        type: action.type,
        duration: action.duration,
        startTime: action.startTime,
        endTime: action.endTime,
        percentOfTotal: (action.duration / trace.duration) * 100,
      })),
      status: trace.status,
    }));
  }

  /**
   * Get bottlenecks
   */
  getBottlenecks(macroId: string, limit: number = 10): Bottleneck[] {
    const bottlenecks = this.bottlenecks.get(macroId) || [];
    return bottlenecks
      .sort((a, b) => {
        const severityScore = { critical: 3, high: 2, medium: 1 };
        return (
          (severityScore[b.severity as keyof typeof severityScore] || 0) -
          (severityScore[a.severity as keyof typeof severityScore] || 0)
        );
      })
      .slice(0, limit);
  }

  /**
   * Get optimization suggestions
   */
  getOptimizationSuggestions(macroId: string): OptimizationSuggestion[] {
    return this.optimizationSuggestions.get(macroId) || [];
  }

  /**
   * Get performance statistics
   */
  getPerformanceStatistics(macroId: string): PerformanceStatistics {
    const traces = this.executionTraces.get(macroId) || [];

    if (traces.length === 0) {
      return {
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        avgDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        successRate: 0,
        avgActionsPerExecution: 0,
      };
    }

    const durations = traces.map((t) => t.duration);
    const successful = traces.filter((t) => t.status === 'success').length;
    const failed = traces.filter((t) => t.status === 'failed').length;

    return {
      totalExecutions: traces.length,
      successfulExecutions: successful,
      failedExecutions: failed,
      avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      successRate: (successful / traces.length) * 100,
      avgActionsPerExecution: traces.reduce((sum, t) => sum + t.actions.length, 0) / traces.length,
    };
  }

  /**
   * Compare executions
   */
  compareExecutions(
    macroId: string,
    executionId1: string,
    executionId2: string,
  ): ExecutionComparison | null {
    const traces = this.executionTraces.get(macroId) || [];
    const trace1 = traces.find((t) => t.executionId === executionId1);
    const trace2 = traces.find((t) => t.executionId === executionId2);

    if (!trace1 || !trace2) return null;

    return {
      execution1: executionId1,
      execution2: executionId2,
      durationDifference: trace2.duration - trace1.duration,
      percentDifference: ((trace2.duration - trace1.duration) / trace1.duration) * 100,
      actionCountDifference: trace2.actions.length - trace1.actions.length,
      fasterExecution: trace1.duration <= trace2.duration ? executionId1 : executionId2,
    };
  }

  /**
   * Export profiling data
   */
  exportProfilingData(macroId: string): string {
    return JSON.stringify(
      {
        macroId,
        executions: this.executionTraces.get(macroId) || [],
        bottlenecks: this.bottlenecks.get(macroId) || [],
        suggestions: this.optimizationSuggestions.get(macroId) || [],
        statistics: this.getPerformanceStatistics(macroId),
      },
      null,
      2,
    );
  }
}

/**
 * Execution trace
 */
export interface ExecutionTrace {
  executionId: string;
  macroId: string;
  startTime: number;
  endTime: number;
  duration: number;
  actions: ActionRecord[];
  status: 'running' | 'success' | 'failed';
  errorMessage: string | null;
}

/**
 * Action record
 */
export interface ActionRecord {
  type: string;
  startTime: number;
  endTime: number;
  duration: number;
  retries?: number;
  error?: string;
  dependsOn?: string[];
}

/**
 * Bottleneck
 */
export interface Bottleneck {
  actionIndex: number;
  actionType: string;
  duration: number;
  percentOfTotal: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  reason: string;
}

/**
 * Optimization suggestion
 */
export interface OptimizationSuggestion {
  id: string;
  type: 'performance' | 'reliability' | 'maintainability';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  estimatedImprovement: string;
  implementation: string;
}

/**
 * Execution timeline
 */
export interface ExecutionTimeline {
  executionId: string;
  totalDuration: number;
  actionCount: number;
  actions: Array<{
    index: number;
    type: string;
    duration: number;
    startTime: number;
    endTime: number;
    percentOfTotal: number;
  }>;
  status: 'running' | 'success' | 'failed';
}

/**
 * Performance statistics
 */
export interface PerformanceStatistics {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  avgDuration: number;
  minDuration: number;
  maxDuration: number;
  successRate: number;
  avgActionsPerExecution: number;
}

/**
 * Execution comparison
 */
export interface ExecutionComparison {
  execution1: string;
  execution2: string;
  durationDifference: number;
  percentDifference: number;
  actionCountDifference: number;
  fasterExecution: string;
}

/**
 * Macro Execution Engine
 * Handles playback of macro sequences with parameter substitution and error recovery
 */

import { Macro, MacroExecution, MacroStatus, MacroStep } from '../models/Macro';

export interface MacroExecutionOptions {
  variables?: Record<string, any>;
  stopOnError?: boolean;
  retryFailedSteps?: boolean;
  timeout?: number;
  onStepComplete?: (stepIndex: number, result: any, duration: number) => void;
  onStepError?: (stepIndex: number, error: string) => void;
  onProgress?: (progress: number) => void;
}

export class MacroExecutionEngine {
  private currentExecution: MacroExecution | null = null;
  private isPaused = false;
  private isCancelled = false;

  /**
   * Execute a macro
   */
  async executeMacro(
    macro: Macro,
    options: MacroExecutionOptions = {}
  ): Promise<MacroExecution> {
    const execution: MacroExecution = {
      id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      macroId: macro.id,
      macroName: macro.name,
      startTime: Date.now(),
      status: MacroStatus.PLAYING,
      currentStepIndex: 0,
      totalSteps: macro.steps.length,
      results: [],
      variables: options.variables || {},
    };

    this.currentExecution = execution;
    this.isPaused = false;
    this.isCancelled = false;

    try {
      for (let i = 0; i < macro.steps.length; i++) {
        if (this.isCancelled) {
          execution.status = MacroStatus.FAILED;
          execution.error = 'Execution cancelled by user';
          break;
        }

        // Wait if paused
        while (this.isPaused && !this.isCancelled) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        const step = macro.steps[i];
        execution.currentStepIndex = i;

        try {
          const stepResult = await this.executeStep(step, execution.variables || {}, options.timeout);
          const duration = stepResult.duration;

          execution.results.push({
            stepId: step.id,
            stepIndex: i,
            toolName: step.toolName,
            result: stepResult.result,
            duration,
            status: 'SUCCESS',
          });

          options.onStepComplete?.(i, stepResult.result, duration);
          options.onProgress?.(((i + 1) / macro.steps.length) * 100);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);

          execution.results.push({
            stepId: step.id,
            stepIndex: i,
            toolName: step.toolName,
            result: null,
            duration: 0,
            status: 'FAILED',
            error: errorMessage,
          });

          options.onStepError?.(i, errorMessage);

          if (options.stopOnError) {
            execution.status = MacroStatus.FAILED;
            execution.error = `Step ${i} failed: ${errorMessage}`;
            break;
          }

          // Retry if configured
          if (step.retryOnFailure && step.maxRetries && step.maxRetries > 0) {
            let retried = false;
            for (let retry = 0; retry < step.maxRetries; retry++) {
              try {
                const retryResult = await this.executeStep(step, execution.variables || {}, options.timeout);
                execution.results[execution.results.length - 1] = {
                  ...execution.results[execution.results.length - 1],
                  result: retryResult.result,
                  duration: retryResult.duration,
                  status: 'SUCCESS',
                  error: undefined,
                };
                retried = true;
                break;
              } catch {
                // Continue to next retry
              }
            }

            if (!retried && options.stopOnError) {
              execution.status = MacroStatus.FAILED;
              execution.error = `Step ${i} failed after ${step.maxRetries} retries`;
              break;
            }
          }
        }
      }

      execution.endTime = Date.now();
      execution.duration = execution.endTime - execution.startTime;

      if (execution.status !== MacroStatus.FAILED) {
        execution.status = MacroStatus.COMPLETED;
      }
    } catch (error) {
      execution.status = MacroStatus.FAILED;
      execution.error = error instanceof Error ? error.message : String(error);
      execution.endTime = Date.now();
      execution.duration = execution.endTime - execution.startTime;
    }

    this.currentExecution = null;
    return execution;
  }

  /**
   * Execute a single step
   */
  private async executeStep(
    step: MacroStep,
    variables: Record<string, any>,
    timeout?: number
  ): Promise<{ result: any; duration: number }> {
    const startTime = performance.now();

    try {
      // Substitute variables in parameters
      const substitutedParams = this.substituteVariables(step.parameters, variables);

      // TODO: Call actual tool execution via bridge
      // For now, simulate execution
      const result = await this.simulateToolExecution(step.toolName, substitutedParams, timeout);

      const duration = performance.now() - startTime;
      return { result, duration };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Substitute variables in parameters
   */
  private substituteVariables(params: Record<string, any>, variables: Record<string, any>): Record<string, any> {
    const substituted: Record<string, any> = {};

    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'string') {
        // Replace ${variable} with actual value
        substituted[key] = value.replace(/\$\{([^}]+)\}/g, (match, varName) => {
          return variables[varName] !== undefined ? String(variables[varName]) : match;
        });
      } else if (typeof value === 'object' && value !== null) {
        substituted[key] = this.substituteVariables(value, variables);
      } else {
        substituted[key] = value;
      }
    }

    return substituted;
  }

  /**
   * Simulate tool execution (placeholder)
   */
  private async simulateToolExecution(
    toolName: string,
    parameters: Record<string, any>,
    timeout?: number
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const timeoutHandle = timeout
        ? setTimeout(() => reject(new Error(`Tool execution timeout: ${toolName}`)), timeout)
        : null;

      // Simulate async operation
      setTimeout(() => {
        if (timeoutHandle) clearTimeout(timeoutHandle);
        resolve({
          tool: toolName,
          parameters,
          timestamp: Date.now(),
          success: true,
        });
      }, 100);
    });
  }

  /**
   * Pause execution
   */
  pause(): void {
    this.isPaused = true;
    if (this.currentExecution) {
      this.currentExecution.status = MacroStatus.PAUSED;
    }
  }

  /**
   * Resume execution
   */
  resume(): void {
    this.isPaused = false;
    if (this.currentExecution) {
      this.currentExecution.status = MacroStatus.PLAYING;
    }
  }

  /**
   * Cancel execution
   */
  cancel(): void {
    this.isCancelled = true;
    if (this.currentExecution) {
      this.currentExecution.status = MacroStatus.FAILED;
      this.currentExecution.error = 'Execution cancelled by user';
    }
  }

  /**
   * Get current execution status
   */
  getCurrentExecution(): MacroExecution | null {
    return this.currentExecution;
  }

  /**
   * Check if execution is running
   */
  isRunning(): boolean {
    return this.currentExecution !== null && this.currentExecution.status === MacroStatus.PLAYING;
  }

  /**
   * Check if execution is paused
   */
  isPausedStatus(): boolean {
    return this.isPaused;
  }
}

export default MacroExecutionEngine;

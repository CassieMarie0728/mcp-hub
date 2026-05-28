import { Macro, MacroStep, MacroExecution } from '@/lib/models/Macro';
import { MacroExecutionEngine } from '@/lib/engines/MacroExecutionEngine';

export interface MacroChain {
  id: string;
  name: string;
  description?: string;
  macroIds: string[];
  macroSequence: MacroChainStep[];
  variables: Record<string, any>;
  isEnabled: boolean;
  createdAt: number;
  updatedAt: number;
  usageCount: number;
  lastExecutedAt?: number;
}

export interface MacroChainStep {
  order: number;
  macroId: string;
  macroName: string;
  parameterMappings?: Record<string, string>; // Maps macro param to chain variable
  continueOnError: boolean;
  timeout?: number; // milliseconds
}

export interface ChainExecution {
  id: string;
  chainId: string;
  startedAt: number;
  completedAt?: number;
  status: 'running' | 'success' | 'failed' | 'paused';
  currentStepIndex: number;
  stepResults: MacroExecution[];
  errors: string[];
  isPaused: boolean;
}

/**
 * MacroChainingEngine
 * Handles executing chains of macros (macro composition)
 */
export class MacroChainingEngine {
  private static activeExecutions = new Map<string, ChainExecution>();

  /**
   * Create a new macro chain
   */
  static createChain(
    name: string,
    macroSequence: MacroChainStep[],
    options?: Partial<MacroChain>
  ): MacroChain {
    const macroIds = macroSequence.map((step) => step.macroId);

    return {
      id: `chain_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      macroSequence,
      macroIds,
      variables: {},
      isEnabled: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      usageCount: 0,
      ...options,
    };
  }

  /**
   * Execute a macro chain
   */
  static async executeChain(
    chain: MacroChain,
    macros: Map<string, Macro>,
    variables?: Record<string, any>
  ): Promise<ChainExecution> {
    const execution: ChainExecution = {
      id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      chainId: chain.id,
      startedAt: Date.now(),
      status: 'running',
      currentStepIndex: 0,
      stepResults: [],
      errors: [],
      isPaused: false,
    };

    this.activeExecutions.set(execution.id, execution);

    try {
      // Merge chain variables with provided variables
      const context = { ...chain.variables, ...variables };

      // Execute each step in sequence
      for (let i = 0; i < chain.macroSequence.length; i++) {
        if (execution.isPaused) {
          execution.status = 'paused';
          break;
        }

        const step = chain.macroSequence[i];
        execution.currentStepIndex = i;

        try {
          const macro = macros.get(step.macroId);
          if (!macro) {
            throw new Error(`Macro not found: ${step.macroId}`);
          }

          // Map parameters using variable substitution
          const parameters = this.mapParameters(step, macro, context);

          // Execute macro step
          const engine = new MacroExecutionEngine();
          const execution = await engine.executeMacro(macro, {
            variables: parameters,
            timeout: step.timeout,
          });
          const result = execution;

          // Store step result
          // Store the macro execution result
          (execution as unknown as ChainExecution).stepResults.push(result);

          // Update context with result for next step
          context[`step_${i}_result`] = result;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          execution.errors.push(`Step ${i + 1} (${step.macroName}): ${errorMessage}`);

          if (!step.continueOnError) {
            execution.status = 'failed';
            break;
          }
        }
      }

      // Mark as complete
      if (execution.status === 'running') {
        execution.status = execution.errors.length > 0 ? 'failed' : 'success';
      }

      execution.completedAt = Date.now();
    } catch (error) {
      execution.status = 'failed';
      execution.errors.push(error instanceof Error ? error.message : 'Unknown error');
      execution.completedAt = Date.now();
    } finally {
      this.activeExecutions.delete(execution.id);
    }

    return execution;
  }

  /**
   * Pause a running chain execution
   */
  static pauseExecution(executionId: string): void {
    const execution = this.activeExecutions.get(executionId);
    if (execution) {
      execution.isPaused = true;
      execution.status = 'paused';
    }
  }

  /**
   * Resume a paused chain execution
   */
  static async resumeExecution(
    executionId: string,
    chain: MacroChain,
    macros: Map<string, Macro>
  ): Promise<ChainExecution> {
    const execution = this.activeExecutions.get(executionId);
    if (!execution) {
      throw new Error(`Execution not found: ${executionId}`);
    }

    execution.isPaused = false;
    execution.status = 'running';

    try {
      // Continue from current step
      const context = this.buildContextFromResults(execution);

      for (let i = execution.currentStepIndex; i < chain.macroSequence.length; i++) {
        if (execution.isPaused) {
          execution.status = 'paused';
          break;
        }

        const step = chain.macroSequence[i];
        execution.currentStepIndex = i;

        try {
          const macro = macros.get(step.macroId);
          if (!macro) {
            throw new Error(`Macro not found: ${step.macroId}`);
          }

          const parameters = this.mapParameters(step, macro, context);
          const engine = new MacroExecutionEngine();
          const result = await engine.executeMacro(macro, {
            variables: parameters,
            timeout: step.timeout,
          });

          // Store the macro execution result
          execution.stepResults.push(result);
          context[`step_${i}_result`] = result;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          execution.errors.push(`Step ${i + 1} (${step.macroName}): ${errorMessage}`);

          if (!step.continueOnError) {
            execution.status = 'failed';
            break;
          }
        }
      }

      if (execution.status === 'running') {
        execution.status = execution.errors.length > 0 ? 'failed' : 'success';
      }

      execution.completedAt = Date.now();
    } catch (error) {
      execution.status = 'failed';
      execution.errors.push(error instanceof Error ? error.message : 'Unknown error');
      execution.completedAt = Date.now();
    } finally {
      this.activeExecutions.delete(executionId);
    }

    return execution;
  }

  /**
   * Cancel a chain execution
   */
  static cancelExecution(executionId: string): void {
    this.activeExecutions.delete(executionId);
  }

  /**
   * Get execution status
   */
  static getExecutionStatus(executionId: string): ChainExecution | undefined {
    return this.activeExecutions.get(executionId);
  }

  /**
   * Map macro parameters using variable substitution
   */
  private static mapParameters(
    step: MacroChainStep,
    macro: Macro,
    context: Record<string, any>
  ): Record<string, any> {
    const parameters: Record<string, any> = {};

    if (!step.parameterMappings) {
      return parameters;
    }

    for (const [paramName, varName] of Object.entries(step.parameterMappings)) {
      // Support dot notation for nested access
      parameters[paramName] = this.resolveVariable(varName, context);
    }

    return parameters;
  }

  /**
   * Resolve variable from context (supports dot notation)
   */
  private static resolveVariable(varName: string, context: Record<string, any>): any {
    const parts = varName.split('.');
    let value = context;

    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return undefined;
      }
    }

    return value;
  }

  /**
   * Build context from execution results
   */
  private static buildContextFromResults(execution: ChainExecution): Record<string, any> {
    const context: Record<string, any> = {};

    execution.stepResults.forEach((result, index) => {
      context[`step_${index}_result`] = result;
    });

    return context;
  }

  /**
   * Validate chain (check for circular dependencies, missing macros)
   */
  static validateChain(chain: MacroChain, macros: Map<string, Macro>): string[] {
    const errors: string[] = [];

    // Check for missing macros
    for (const macroId of chain.macroIds) {
      if (!macros.has(macroId)) {
        errors.push(`Macro not found: ${macroId}`);
      }
    }

    // Check for circular dependencies (simplified check)
    const visited = new Set<string>();
    for (const macroId of chain.macroIds) {
      if (visited.has(macroId)) {
        errors.push(`Circular dependency detected: ${macroId}`);
      }
      visited.add(macroId);
    }

    // Check for empty chain
    if (chain.macroSequence.length === 0) {
      errors.push('Chain must have at least one step');
    }

    return errors;
  }

  /**
   * Estimate chain execution time
   */
  static estimateExecutionTime(chain: MacroChain, macros: Map<string, Macro>): number {
    let totalTime = 0;

    for (const step of chain.macroSequence) {
      const macro = macros.get(step.macroId);
      if (macro) {
        // Estimate based on number of steps (rough estimate: 1 second per step)
        totalTime += macro.steps.length * 1000;
      }

      // Add step timeout if specified
      if (step.timeout) {
        totalTime += step.timeout;
      }
    }

    return totalTime;
  }
}

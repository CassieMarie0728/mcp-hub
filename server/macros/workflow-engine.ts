/**
 * Advanced Macro Workflow Engine
 * Supports conditional execution, loops, and complex automation flows
 */

export interface WorkflowStep {
  id: string;
  type: 'tool' | 'condition' | 'loop' | 'parallel' | 'delay';
  name: string;
  config: Record<string, any>;
  nextStepId?: string;
  onErrorStepId?: string;
}

export interface WorkflowCondition {
  variable: string;
  operator: 'equals' | 'notEquals' | 'greaterThan' | 'lessThan' | 'contains' | 'exists';
  value: any;
  trueBranchId: string;
  falseBranchId?: string;
}

export interface WorkflowLoop {
  variableName: string;
  iterableVariable: string;
  bodyStepId: string;
  nextStepId?: string;
}

export interface WorkflowContext {
  variables: Record<string, any>;
  executionHistory: ExecutionRecord[];
  currentStepId: string;
  isRunning: boolean;
  isPaused: boolean;
  errors: WorkflowError[];
}

export interface ExecutionRecord {
  stepId: string;
  stepName: string;
  type: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped';
  result?: any;
  error?: string;
}

export interface WorkflowError {
  stepId: string;
  message: string;
  timestamp: Date;
  recoverable: boolean;
}

export class WorkflowEngine {
  private context: WorkflowContext;
  private steps: Map<string, WorkflowStep>;
  private conditions: Map<string, WorkflowCondition>;
  private loops: Map<string, WorkflowLoop>;

  constructor() {
    this.context = {
      variables: {},
      executionHistory: [],
      currentStepId: '',
      isRunning: false,
      isPaused: false,
      errors: [],
    };
    this.steps = new Map();
    this.conditions = new Map();
    this.loops = new Map();
  }

  /**
   * Register a workflow step
   */
  registerStep(step: WorkflowStep): void {
    this.steps.set(step.id, step);
  }

  /**
   * Register a conditional branch
   */
  registerCondition(conditionId: string, condition: WorkflowCondition): void {
    this.conditions.set(conditionId, condition);
  }

  /**
   * Register a loop
   */
  registerLoop(loopId: string, loop: WorkflowLoop): void {
    this.loops.set(loopId, loop);
  }

  /**
   * Set workflow variable
   */
  setVariable(name: string, value: any): void {
    this.context.variables[name] = value;
  }

  /**
   * Get workflow variable
   */
  getVariable(name: string): any {
    return this.context.variables[name];
  }

  /**
   * Evaluate a condition
   */
  private evaluateCondition(condition: WorkflowCondition): boolean {
    const value = this.context.variables[condition.variable];

    switch (condition.operator) {
      case 'equals':
        return value === condition.value;
      case 'notEquals':
        return value !== condition.value;
      case 'greaterThan':
        return value > condition.value;
      case 'lessThan':
        return value < condition.value;
      case 'contains':
        return String(value).includes(String(condition.value));
      case 'exists':
        return value !== undefined && value !== null;
      default:
        return false;
    }
  }

  /**
   * Execute a single step
   */
  async executeStep(stepId: string): Promise<any> {
    const step = this.steps.get(stepId);
    if (!step) throw new Error(`Step ${stepId} not found`);

    const record: ExecutionRecord = {
      stepId,
      stepName: step.name,
      type: step.type,
      startTime: new Date(),
      status: 'running',
    };

    this.context.executionHistory.push(record);

    try {
      let result: any;

      switch (step.type) {
        case 'tool':
          result = await this.executeTool(step);
          break;
        case 'condition':
          result = await this.executeCondition(step);
          break;
        case 'loop':
          result = await this.executeLoop(step);
          break;
        case 'parallel':
          result = await this.executeParallel(step);
          break;
        case 'delay':
          result = await this.executeDelay(step);
          break;
        default:
          throw new Error(`Unknown step type: ${step.type}`);
      }

      record.endTime = new Date();
      record.duration = record.endTime.getTime() - record.startTime.getTime();
      record.status = 'success';
      record.result = result;

      return result;
    } catch (error: any) {
      record.endTime = new Date();
      record.duration = record.endTime.getTime() - record.startTime.getTime();
      record.status = 'failed';
      record.error = error.message;

      this.context.errors.push({
        stepId,
        message: error.message,
        timestamp: new Date(),
        recoverable: error.recoverable !== false,
      });

      throw error;
    }
  }

  /**
   * Execute a tool step
   */
  private async executeTool(step: WorkflowStep): Promise<any> {
    // Substitute variables in config
    const substitutedConfig = this.substituteVariables(step.config);

    // TODO: Call actual tool execution
    console.log(`Executing tool: ${step.name}`, substitutedConfig);

    return { success: true, toolName: step.name };
  }

  /**
   * Execute a conditional step
   */
  private async executeCondition(step: WorkflowStep): Promise<any> {
    const conditionId = step.config.conditionId;
    const condition = this.conditions.get(conditionId);

    if (!condition) throw new Error(`Condition ${conditionId} not found`);

    const result = this.evaluateCondition(condition);

    if (result) {
      this.context.currentStepId = condition.trueBranchId;
    } else if (condition.falseBranchId) {
      this.context.currentStepId = condition.falseBranchId;
    }

    return { conditionMet: result, nextStepId: this.context.currentStepId };
  }

  /**
   * Execute a loop step
   */
  private async executeLoop(step: WorkflowStep): Promise<any> {
    const loopId = step.config.loopId;
    const loop = this.loops.get(loopId);

    if (!loop) throw new Error(`Loop ${loopId} not found`);

    const iterable = this.context.variables[loop.iterableVariable];
    if (!Array.isArray(iterable)) throw new Error(`${loop.iterableVariable} is not iterable`);

    const results: any[] = [];

    for (const item of iterable) {
      this.context.variables[loop.variableName] = item;

      try {
        const result = await this.executeStep(loop.bodyStepId);
        results.push(result);
      } catch (error: any) {
        if (!error.recoverable) throw error;
        results.push({ error: error.message });
      }
    }

    if (loop.nextStepId) {
      this.context.currentStepId = loop.nextStepId;
    }

    return { iterations: results.length, results };
  }

  /**
   * Execute parallel steps
   */
  private async executeParallel(step: WorkflowStep): Promise<any> {
    const stepIds: string[] = step.config.stepIds || [];
    const promises = stepIds.map((id: string) => this.executeStep(id));

    const results = await Promise.allSettled(promises);

    return {
      total: results.length,
      successful: results.filter((r) => r.status === 'fulfilled').length,
      failed: results.filter((r) => r.status === 'rejected').length,
      results: results.map((r) => (r.status === 'fulfilled' ? r.value : r.reason)),
    };
  }

  /**
   * Execute a delay step
   */
  private async executeDelay(step: WorkflowStep): Promise<any> {
    const delayMs = step.config.delayMs || 1000;
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    return { delayMs };
  }

  /**
   * Substitute variables in config
   */
  private substituteVariables(config: Record<string, any>): Record<string, any> {
    const result = { ...config };

    for (const key in result) {
      const value = result[key];
      if (typeof value === 'string' && value.startsWith('${') && value.endsWith('}')) {
        const varName = value.slice(2, -1);
        result[key] = this.context.variables[varName];
      }
    }

    return result;
  }

  /**
   * Execute entire workflow
   */
  async executeWorkflow(startStepId: string): Promise<WorkflowContext> {
    this.context.isRunning = true;
    this.context.currentStepId = startStepId;

    try {
      while (this.context.currentStepId && this.context.isRunning) {
        const step = this.steps.get(this.context.currentStepId);
        if (!step) break;

        await this.executeStep(this.context.currentStepId);

        this.context.currentStepId = step.nextStepId || '';
      }
    } finally {
      this.context.isRunning = false;
    }

    return this.context;
  }

  /**
   * Pause workflow execution
   */
  pauseWorkflow(): void {
    this.context.isPaused = true;
  }

  /**
   * Resume workflow execution
   */
  resumeWorkflow(): void {
    this.context.isPaused = false;
  }

  /**
   * Stop workflow execution
   */
  stopWorkflow(): void {
    this.context.isRunning = false;
  }

  /**
   * Get execution context
   */
  getContext(): WorkflowContext {
    return this.context;
  }

  /**
   * Get execution history
   */
  getExecutionHistory(): ExecutionRecord[] {
    return this.context.executionHistory;
  }

  /**
   * Get workflow errors
   */
  getErrors(): WorkflowError[] {
    return this.context.errors;
  }

  /**
   * Reset workflow
   */
  reset(): void {
    this.context = {
      variables: {},
      executionHistory: [],
      currentStepId: '',
      isRunning: false,
      isPaused: false,
      errors: [],
    };
  }
}

export default WorkflowEngine;

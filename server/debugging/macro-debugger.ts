/**
 * Macro Debugging Engine
 * Enables step-through execution with breakpoints, state inspection, and variable tracking
 */
export class MacroDebugger {
  private debugSessions: Map<string, DebugSession> = new Map();
  private breakpoints: Map<string, Set<number>> = new Map();
  private watchExpressions: Map<string, WatchExpression[]> = new Map();
  private callStack: Map<string, CallStackFrame[]> = new Map();

  /**
   * Start debug session
   */
  startDebugSession(
    sessionId: string,
    macroId: string,
    actions: any[]
  ): DebugSession {
    const session: DebugSession = {
      sessionId,
      macroId,
      status: 'paused',
      currentActionIndex: 0,
      totalActions: actions.length,
      variables: new Map(),
      breakpoints: this.breakpoints.get(macroId) || new Set(),
      watchExpressions: this.watchExpressions.get(macroId) || [],
      executionHistory: [],
      startTime: Date.now(),
      endTime: 0,
      error: null,
    };

    this.debugSessions.set(sessionId, session);
    this.callStack.set(sessionId, []);

    return session;
  }

  /**
   * Set breakpoint at line
   */
  setBreakpoint(macroId: string, lineNumber: number): void {
    const breakpoints = this.breakpoints.get(macroId) || new Set();
    breakpoints.add(lineNumber);
    this.breakpoints.set(macroId, breakpoints);
  }

  /**
   * Remove breakpoint
   */
  removeBreakpoint(macroId: string, lineNumber: number): void {
    const breakpoints = this.breakpoints.get(macroId);
    if (breakpoints) {
      breakpoints.delete(lineNumber);
    }
  }

  /**
   * Get breakpoints for macro
   */
  getBreakpoints(macroId: string): number[] {
    const breakpoints = this.breakpoints.get(macroId) || new Set();
    return Array.from(breakpoints).sort((a, b) => a - b);
  }

  /**
   * Add watch expression
   */
  addWatchExpression(macroId: string, expression: string): WatchExpression {
    const watch: WatchExpression = {
      id: `watch_${Date.now()}`,
      expression,
      value: undefined,
      type: 'unknown',
      error: null,
    };

    const watches = this.watchExpressions.get(macroId) || [];
    watches.push(watch);
    this.watchExpressions.set(macroId, watches);

    return watch;
  }

  /**
   * Remove watch expression
   */
  removeWatchExpression(macroId: string, watchId: string): boolean {
    const watches = this.watchExpressions.get(macroId);
    if (!watches) return false;

    const index = watches.findIndex((w) => w.id === watchId);
    if (index !== -1) {
      watches.splice(index, 1);
      return true;
    }

    return false;
  }

  /**
   * Step over action
   */
  stepOver(sessionId: string): DebugSession | null {
    const session = this.debugSessions.get(sessionId);
    if (!session) return null;

    session.currentActionIndex++;
    session.status = 'running';

    if (session.currentActionIndex >= session.totalActions) {
      session.status = 'finished';
      session.endTime = Date.now();
    }

    return session;
  }

  /**
   * Step into action
   */
  stepInto(sessionId: string): DebugSession | null {
    const session = this.debugSessions.get(sessionId);
    if (!session) return null;

    const callStack = this.callStack.get(sessionId) || [];

    // Push current frame to call stack
    callStack.push({
      actionIndex: session.currentActionIndex,
      functionName: `action_${session.currentActionIndex}`,
      variables: new Map(session.variables),
      timestamp: Date.now(),
    });

    this.callStack.set(sessionId, callStack);

    session.currentActionIndex++;
    session.status = 'running';

    return session;
  }

  /**
   * Step out of action
   */
  stepOut(sessionId: string): DebugSession | null {
    const session = this.debugSessions.get(sessionId);
    if (!session) return null;

    const callStack = this.callStack.get(sessionId) || [];

    if (callStack.length > 0) {
      const frame = callStack.pop();
      if (frame) {
        session.variables = frame.variables;
      }
    }

    session.status = 'paused';

    return session;
  }

  /**
   * Continue execution
   */
  continueExecution(sessionId: string): DebugSession | null {
    const session = this.debugSessions.get(sessionId);
    if (!session) return null;

    session.status = 'running';

    // Find next breakpoint
    const breakpoints = this.breakpoints.get(session.macroId) || new Set();
    let nextBreakpoint = -1;

    for (let i = session.currentActionIndex + 1; i < session.totalActions; i++) {
      if (breakpoints.has(i)) {
        nextBreakpoint = i;
        break;
      }
    }

    if (nextBreakpoint !== -1) {
      session.currentActionIndex = nextBreakpoint;
      session.status = 'paused';
    } else {
      session.currentActionIndex = session.totalActions;
      session.status = 'finished';
      session.endTime = Date.now();
    }

    return session;
  }

  /**
   * Pause execution
   */
  pauseExecution(sessionId: string): DebugSession | null {
    const session = this.debugSessions.get(sessionId);
    if (!session) return null;

    session.status = 'paused';
    return session;
  }

  /**
   * Set variable value
   */
  setVariable(sessionId: string, name: string, value: any): boolean {
    const session = this.debugSessions.get(sessionId);
    if (!session) return false;

    session.variables.set(name, {
      name,
      value,
      type: typeof value,
      mutable: true,
    });

    return true;
  }

  /**
   * Get variable value
   */
  getVariable(sessionId: string, name: string): DebugVariable | null {
    const session = this.debugSessions.get(sessionId);
    if (!session) return null;

    return session.variables.get(name) || null;
  }

  /**
   * Get all variables
   */
  getAllVariables(sessionId: string): DebugVariable[] {
    const session = this.debugSessions.get(sessionId);
    if (!session) return [];

    return Array.from(session.variables.values());
  }

  /**
   * Evaluate expression
   */
  evaluateExpression(sessionId: string, expression: string): EvaluationResult {
    const session = this.debugSessions.get(sessionId);
    if (!session) {
      return {
        expression,
        value: undefined,
        type: 'unknown',
        error: 'Session not found',
      };
    }

    try {
      // Build variable context
      const context: Record<string, any> = {};
      session.variables.forEach((variable) => {
        context[variable.name] = variable.value;
      });

      // Simple expression evaluation (in production, use a proper expression parser)
      let result = expression;

      // Replace variables
      Object.entries(context).forEach(([key, value]) => {
        result = result.replace(new RegExp(`\\$${key}`, 'g'), JSON.stringify(value));
      });

      // Evaluate
      const value = Function(`"use strict"; return (${result})`)();

      return {
        expression,
        value,
        type: typeof value,
        error: null,
      };
    } catch (error) {
      return {
        expression,
        value: undefined,
        type: 'error',
        error: (error as Error).message,
      };
    }
  }

  /**
   * Record action execution
   */
  recordActionExecution(
    sessionId: string,
    actionIndex: number,
    action: any,
    result: any
  ): void {
    const session = this.debugSessions.get(sessionId);
    if (!session) return;

    session.executionHistory.push({
      actionIndex,
      action,
      result,
      timestamp: Date.now(),
      variables: new Map(session.variables),
    });
  }

  /**
   * Get execution history
   */
  getExecutionHistory(sessionId: string): ExecutionHistoryEntry[] {
    const session = this.debugSessions.get(sessionId);
    if (!session) return [];

    return session.executionHistory;
  }

  /**
   * Get call stack
   */
  getCallStack(sessionId: string): CallStackFrame[] {
    return this.callStack.get(sessionId) || [];
  }

  /**
   * Get debug session
   */
  getDebugSession(sessionId: string): DebugSession | null {
    return this.debugSessions.get(sessionId) || null;
  }

  /**
   * End debug session
   */
  endDebugSession(sessionId: string, error?: string): DebugSession | null {
    const session = this.debugSessions.get(sessionId);
    if (!session) return null;

    session.status = 'finished';
    session.endTime = Date.now();
    session.error = error || null;

    return session;
  }

  /**
   * Get debug info
   */
  getDebugInfo(sessionId: string): DebugInfo | null {
    const session = this.debugSessions.get(sessionId);
    if (!session) return null;

    return {
      sessionId,
      macroId: session.macroId,
      status: session.status,
      currentActionIndex: session.currentActionIndex,
      totalActions: session.totalActions,
      progress: (session.currentActionIndex / session.totalActions) * 100,
      variables: this.getAllVariables(sessionId),
      breakpoints: this.getBreakpoints(session.macroId),
      callStack: this.getCallStack(sessionId),
      executionTime: session.endTime - session.startTime,
      error: session.error,
    };
  }

  /**
   * Export debug session
   */
  exportDebugSession(sessionId: string): string {
    const session = this.debugSessions.get(sessionId);
    if (!session) return '';

    return JSON.stringify(
      {
        sessionId,
        macroId: session.macroId,
        status: session.status,
        currentActionIndex: session.currentActionIndex,
        totalActions: session.totalActions,
        variables: Array.from(session.variables.entries()),
        executionHistory: session.executionHistory,
        callStack: this.getCallStack(sessionId),
        duration: session.endTime - session.startTime,
      },
      null,
      2
    );
  }
}

/**
 * Debug session
 */
export interface DebugSession {
  sessionId: string;
  macroId: string;
  status: 'running' | 'paused' | 'finished' | 'error';
  currentActionIndex: number;
  totalActions: number;
  variables: Map<string, DebugVariable>;
  breakpoints: Set<number>;
  watchExpressions: WatchExpression[];
  executionHistory: ExecutionHistoryEntry[];
  startTime: number;
  endTime: number;
  error: string | null;
}

/**
 * Debug variable
 */
export interface DebugVariable {
  name: string;
  value: any;
  type: string;
  mutable: boolean;
}

/**
 * Watch expression
 */
export interface WatchExpression {
  id: string;
  expression: string;
  value: any;
  type: string;
  error: string | null;
}

/**
 * Execution history entry
 */
export interface ExecutionHistoryEntry {
  actionIndex: number;
  action: any;
  result: any;
  timestamp: number;
  variables: Map<string, DebugVariable>;
}

/**
 * Call stack frame
 */
export interface CallStackFrame {
  actionIndex: number;
  functionName: string;
  variables: Map<string, DebugVariable>;
  timestamp: number;
}

/**
 * Evaluation result
 */
export interface EvaluationResult {
  expression: string;
  value: any;
  type: string;
  error: string | null;
}

/**
 * Debug info
 */
export interface DebugInfo {
  sessionId: string;
  macroId: string;
  status: 'running' | 'paused' | 'finished' | 'error';
  currentActionIndex: number;
  totalActions: number;
  progress: number;
  variables: DebugVariable[];
  breakpoints: number[];
  callStack: CallStackFrame[];
  executionTime: number;
  error: string | null;
}

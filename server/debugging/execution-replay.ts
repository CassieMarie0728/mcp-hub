export interface ExecutionSnapshot {
  stepId: string;
  stepName: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  variables: Record<string, unknown>;
  duration: number;
  timestamp: Date;
  error?: string;
}

export interface ExecutionReplay {
  executionId: string;
  workflowId: string;
  snapshots: ExecutionSnapshot[];
  currentStepIndex: number;
  startedAt: Date;
  completedAt?: Date;
}

export interface Breakpoint {
  stepId: string;
  condition?: string;
  enabled: boolean;
}

export class ExecutionReplayEngine {
  static captureSnapshot(
    stepId: string,
    stepName: string,
    input: Record<string, unknown>,
    output: Record<string, unknown>,
    variables: Record<string, unknown>,
    duration: number,
  ): ExecutionSnapshot {
    return {
      stepId,
      stepName,
      input,
      output,
      variables,
      duration,
      timestamp: new Date(),
    };
  }

  static createReplay(executionId: string, workflowId: string): ExecutionReplay {
    return {
      executionId,
      workflowId,
      snapshots: [],
      currentStepIndex: 0,
      startedAt: new Date(),
    };
  }

  static addSnapshot(replay: ExecutionReplay, snapshot: ExecutionSnapshot): ExecutionReplay {
    return {
      ...replay,
      snapshots: [...replay.snapshots, snapshot],
    };
  }

  static getSnapshot(replay: ExecutionReplay, index: number): ExecutionSnapshot | null {
    return replay.snapshots[index] || null;
  }

  static compareSnapshots(
    snapshot1: ExecutionSnapshot,
    snapshot2: ExecutionSnapshot,
  ): Record<string, unknown> {
    return {
      inputDiff: this.getDiff(snapshot1.input, snapshot2.input),
      outputDiff: this.getDiff(snapshot1.output, snapshot2.output),
      variablesDiff: this.getDiff(snapshot1.variables, snapshot2.variables),
      durationDiff: snapshot2.duration - snapshot1.duration,
    };
  }

  private static getDiff(
    obj1: Record<string, unknown>,
    obj2: Record<string, unknown>,
  ): Record<string, unknown> {
    const diff: Record<string, unknown> = {};
    for (const key in obj1) {
      if (obj1[key] !== obj2[key]) {
        diff[key] = { before: obj1[key], after: obj2[key] };
      }
    }
    return diff;
  }

  static shouldBreak(breakpoint: Breakpoint, variables: Record<string, unknown>): boolean {
    if (!breakpoint.enabled) return false;
    if (!breakpoint.condition) return true;
    // Evaluate condition against variables
    try {
      const func = new Function(...Object.keys(variables), `return ${breakpoint.condition}`);
      return func(...Object.values(variables)) as boolean;
    } catch {
      return false;
    }
  }
}

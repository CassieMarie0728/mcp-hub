/**
 * Conflict Resolver
 * Handles operational transformation and conflict resolution for simultaneous editing
 */
export class ConflictResolver {
  /**
   * Resolve conflicts using Operational Transformation (OT)
   * Ensures consistency when multiple users edit simultaneously
   */
  static resolveConflicts(
    localOps: Operation[],
    remoteOps: Operation[],
    baseVersion: number,
  ): ResolvedConflicts {
    const resolved: ResolvedConflicts = {
      transformedLocal: [],
      transformedRemote: [],
      conflicts: [],
    };

    for (const localOp of localOps) {
      let transformedOp = localOp;

      for (const remoteOp of remoteOps) {
        const conflict = this.detectConflict(transformedOp, remoteOp);

        if (conflict) {
          resolved.conflicts.push(conflict);
          transformedOp = this.transformOperation(transformedOp, remoteOp, 'local');
        }
      }

      resolved.transformedLocal.push(transformedOp);
    }

    for (const remoteOp of remoteOps) {
      let transformedOp = remoteOp;

      for (const localOp of localOps) {
        const conflict = this.detectConflict(transformedOp, localOp);

        if (conflict) {
          transformedOp = this.transformOperation(transformedOp, localOp, 'remote');
        }
      }

      resolved.transformedRemote.push(transformedOp);
    }

    return resolved;
  }

  /**
   * Detect if two operations conflict
   */
  static detectConflict(op1: Operation, op2: Operation): Conflict | null {
    // Same index operations conflict
    if (op1.index === op2.index && op1.type !== op2.type) {
      return {
        op1,
        op2,
        type: 'index_conflict',
        severity: 'high',
      };
    }

    // Overlapping ranges conflict
    if (this.rangesOverlap(op1, op2)) {
      return {
        op1,
        op2,
        type: 'range_conflict',
        severity: 'medium',
      };
    }

    // Delete and modify on same element
    if (op1.type === 'delete' && op2.type === 'modify' && op1.index === op2.index) {
      return {
        op1,
        op2,
        type: 'delete_modify_conflict',
        severity: 'high',
      };
    }

    return null;
  }

  /**
   * Check if operation ranges overlap
   */
  static rangesOverlap(op1: Operation, op2: Operation): boolean {
    const range1 = { start: op1.index, end: op1.index + (op1.length || 1) };
    const range2 = { start: op2.index, end: op2.index + (op2.length || 1) };

    return !(range1.end < range2.start || range2.end < range1.start);
  }

  /**
   * Transform operation against another operation
   */
  static transformOperation(
    op: Operation,
    against: Operation,
    side: 'local' | 'remote',
  ): Operation {
    const transformed = { ...op };

    // Adjust index based on insertions/deletions before this operation
    if (against.type === 'insert' && against.index <= op.index) {
      transformed.index += against.length || 1;
    } else if (against.type === 'delete' && against.index < op.index) {
      transformed.index -= Math.min(against.length || 1, op.index - against.index);
    }

    // Handle specific conflict types
    if (op.type === 'insert' && against.type === 'insert' && op.index === against.index) {
      // Both inserting at same position: use deterministic ordering (by user ID or timestamp)
      if (side === 'local' && (op.userId || '') > (against.userId || '')) {
        transformed.index += against.length || 1;
      }
    }

    if (op.type === 'modify' && against.type === 'delete' && op.index === against.index) {
      // Modify on deleted element: convert to insert
      transformed.type = 'insert';
    }

    return transformed;
  }

  /**
   * Merge conflicting changes using Last-Write-Wins (LWW)
   */
  static mergeWithLWW(op1: Operation, op2: Operation): Operation {
    if (op1.timestamp >= op2.timestamp) {
      return op1;
    }
    return op2;
  }

  /**
   * Merge conflicting changes using Custom Merge Strategy
   */
  static mergeCustom(op1: Operation, op2: Operation, strategy: MergeStrategy): Operation {
    switch (strategy) {
      case 'local_priority':
        return op1;
      case 'remote_priority':
        return op2;
      case 'combine':
        return this.combineOperations(op1, op2);
      case 'lww':
        return this.mergeWithLWW(op1, op2);
      default:
        return op1;
    }
  }

  /**
   * Combine two operations into one
   */
  static combineOperations(op1: Operation, op2: Operation): Operation {
    // If both are modifications, merge the changes
    if (op1.type === 'modify' && op2.type === 'modify' && op1.index === op2.index) {
      return {
        ...op1,
        data: {
          ...op1.data,
          ...op2.data,
        },
      };
    }

    // Default to LWW
    return this.mergeWithLWW(op1, op2);
  }

  /**
   * Validate operation consistency
   */
  static validateConsistency(operations: Operation[], version: number): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      errors: [],
    };

    let currentVersion = version;

    for (const op of operations) {
      // Check version continuity
      if (op.version !== currentVersion + 1) {
        result.valid = false;
        result.errors.push(`Version mismatch: expected ${currentVersion + 1}, got ${op.version}`);
      }

      // Check operation validity
      if (!this.isValidOperation(op)) {
        result.valid = false;
        result.errors.push(`Invalid operation: ${JSON.stringify(op)}`);
      }

      currentVersion = op.version;
    }

    return result;
  }

  /**
   * Check if operation is valid
   */
  static isValidOperation(op: Operation): boolean {
    if (!op.type || !['insert', 'delete', 'modify'].includes(op.type)) {
      return false;
    }

    if (op.index < 0) {
      return false;
    }

    if (op.type === 'insert' && (!op.data || op.length === undefined)) {
      return false;
    }

    if (op.type === 'delete' && (!op.length || op.length <= 0)) {
      return false;
    }

    if (op.type === 'modify' && !op.data) {
      return false;
    }

    return true;
  }

  /**
   * Rebase operations
   */
  static rebaseOperations(ops: Operation[], base: Operation[]): Operation[] {
    let rebased = [...ops];

    for (const baseOp of base) {
      rebased = rebased.map((op) => this.transformOperation(op, baseOp, 'local'));
    }

    return rebased;
  }

  /**
   * Get operation history
   */
  static getOperationHistory(operations: Operation[]): OperationHistory {
    const history: OperationHistory = {
      total: operations.length,
      byType: { insert: 0, delete: 0, modify: 0 },
      byUser: {},
      timeline: [],
    };

    for (const op of operations) {
      history.byType[op.type]++;

      if (!history.byUser[op.userId]) {
        history.byUser[op.userId] = 0;
      }
      history.byUser[op.userId]++;

      history.timeline.push({
        timestamp: op.timestamp,
        type: op.type,
        userId: op.userId,
      });
    }

    return history;
  }
}

/**
 * Operation interface
 */
export interface Operation {
  type: 'insert' | 'delete' | 'modify';
  index: number;
  data?: any;
  length?: number;
  version: number;
  timestamp: number;
  userId: string;
}

/**
 * Conflict interface
 */
export interface Conflict {
  op1: Operation;
  op2: Operation;
  type: string;
  severity: 'low' | 'medium' | 'high';
}

/**
 * Resolved conflicts
 */
export interface ResolvedConflicts {
  transformedLocal: Operation[];
  transformedRemote: Operation[];
  conflicts: Conflict[];
}

/**
 * Merge strategy
 */
export type MergeStrategy = 'local_priority' | 'remote_priority' | 'combine' | 'lww';

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Operation history
 */
export interface OperationHistory {
  total: number;
  byType: Record<string, number>;
  byUser: Record<string, number>;
  timeline: Array<{
    timestamp: number;
    type: string;
    userId: string;
  }>;
}

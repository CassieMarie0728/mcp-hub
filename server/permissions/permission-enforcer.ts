/**
 * Permission Enforcer
 * Validates and enforces permissions on macro operations
 */

import { MacroPermissionsEngine, PermissionLevel, PermissionContext } from './macro-permissions';

export class PermissionEnforcer {
  constructor(private permissionsEngine: MacroPermissionsEngine) {}

  /**
   * Enforce view permission
   */
  enforceViewPermission(macroId: string, userId: string, context?: PermissionContext): void {
    if (!this.permissionsEngine.hasPermission(macroId, userId, 'view', context)) {
      throw new PermissionDeniedError(
        `User ${userId} does not have view permission for macro ${macroId}`,
      );
    }
  }

  /**
   * Enforce execute permission
   */
  enforceExecutePermission(macroId: string, userId: string, context?: PermissionContext): void {
    if (!this.permissionsEngine.hasPermission(macroId, userId, 'execute', context)) {
      throw new PermissionDeniedError(
        `User ${userId} does not have execute permission for macro ${macroId}`,
      );
    }
  }

  /**
   * Enforce edit permission
   */
  enforceEditPermission(macroId: string, userId: string, context?: PermissionContext): void {
    if (!this.permissionsEngine.hasPermission(macroId, userId, 'edit', context)) {
      throw new PermissionDeniedError(
        `User ${userId} does not have edit permission for macro ${macroId}`,
      );
    }
  }

  /**
   * Enforce admin permission
   */
  enforceAdminPermission(macroId: string, userId: string, context?: PermissionContext): void {
    if (!this.permissionsEngine.hasPermission(macroId, userId, 'admin', context)) {
      throw new PermissionDeniedError(
        `User ${userId} does not have admin permission for macro ${macroId}`,
      );
    }
  }

  /**
   * Enforce custom permission
   */
  enforcePermission(
    macroId: string,
    userId: string,
    requiredLevel: PermissionLevel,
    context?: PermissionContext,
  ): void {
    if (!this.permissionsEngine.hasPermission(macroId, userId, requiredLevel, context)) {
      throw new PermissionDeniedError(
        `User ${userId} does not have ${requiredLevel} permission for macro ${macroId}`,
      );
    }
  }

  /**
   * Middleware for Express routes
   */
  middleware(requiredLevel: PermissionLevel = 'view') {
    return (req: Express.Request, res: Express.Response, next: Function) => {
      try {
        const reqWithUser = req as any;
        const userId = reqWithUser.user?.id;
        const macroId = reqWithUser.params.macroId;
        const context: PermissionContext = {
          ip: reqWithUser.ip,
          deviceId: reqWithUser.headers['x-device-id'],
          userAgent: reqWithUser.headers['user-agent'],
          timestamp: new Date(),
        };

        this.enforcePermission(macroId, userId, requiredLevel, context);
        next();
      } catch (error) {
        const resWithStatus = res as any;
        if (error instanceof PermissionDeniedError) {
          resWithStatus.status(403).json({ error: error.message });
        } else {
          next(error);
        }
      }
    };
  }

  /**
   * Filter macros by permission
   */
  filterMacrosByPermission(
    macros: Array<Record<string, unknown>>,
    userId: string,
    requiredLevel: PermissionLevel = 'view',
    context?: PermissionContext,
  ): Array<Record<string, unknown>> {
    return macros.filter((macro) => {
      try {
        this.enforcePermission(macro.id as string, userId, requiredLevel, context);
        return true;
      } catch {
        return false;
      }
    });
  }

  /**
   * Check if user can share macro
   */
  canShareMacro(macroId: string, userId: string, targetUserId: string): boolean {
    try {
      // Only admin can share
      this.enforceAdminPermission(macroId, userId);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if user can revoke permission
   */
  canRevokePermission(macroId: string, userId: string): boolean {
    try {
      // Only admin can revoke
      this.enforceAdminPermission(macroId, userId);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if user can modify permissions
   */
  canModifyPermissions(macroId: string, userId: string): boolean {
    try {
      this.enforceAdminPermission(macroId, userId);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate operation
   */
  validateOperation(
    macroId: string,
    userId: string,
    operation: MacroOperation,
    context?: PermissionContext,
  ): ValidationResult {
    try {
      const requiredLevel = this.getRequiredLevel(operation);
      this.enforcePermission(macroId, userId, requiredLevel, context);

      return {
        allowed: true,
        reason: null,
      };
    } catch (error) {
      return {
        allowed: false,
        reason: (error as Error).message,
      };
    }
  }

  /**
   * Get required permission level for operation
   */
  private getRequiredLevel(operation: MacroOperation): PermissionLevel {
    const levels: Record<MacroOperation, PermissionLevel> = {
      view: 'view',
      execute: 'execute',
      edit: 'edit',
      delete: 'admin',
      share: 'admin',
      managePermissions: 'admin',
    };

    return levels[operation] || 'view';
  }
}

/**
 * Permission denied error
 */
export class PermissionDeniedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PermissionDeniedError';
  }
}

/**
 * Macro operation types
 */
export type MacroOperation = 'view' | 'execute' | 'edit' | 'delete' | 'share' | 'managePermissions';

/**
 * Validation result
 */
export interface ValidationResult {
  allowed: boolean;
  reason: string | null;
}

/**
 * Permission check result
 */
export interface PermissionCheckResult {
  hasPermission: boolean;
  level: PermissionLevel | null;
  expiresAt: Date | null;
  reason: string | null;
}

/**
 * Bulk permission check
 */
export class BulkPermissionChecker {
  constructor(private permissionsEngine: MacroPermissionsEngine) {}

  /**
   * Check permissions for multiple macros
   */
  checkMultiple(
    macroIds: string[],
    userId: string,
    requiredLevel: PermissionLevel,
  ): Map<string, PermissionCheckResult> {
    const results = new Map<string, PermissionCheckResult>();

    macroIds.forEach((macroId) => {
      const hasPermission = this.permissionsEngine.hasPermission(macroId, userId, requiredLevel);

      results.set(macroId, {
        hasPermission,
        level: hasPermission ? requiredLevel : null,
        expiresAt: null,
        reason: hasPermission ? null : 'Permission denied',
      });
    });

    return results;
  }

  /**
   * Check permissions for multiple users
   */
  checkMultipleUsers(
    macroId: string,
    userIds: string[],
    requiredLevel: PermissionLevel,
  ): Map<string, PermissionCheckResult> {
    const results = new Map<string, PermissionCheckResult>();

    userIds.forEach((userId) => {
      const hasPermission = this.permissionsEngine.hasPermission(macroId, userId, requiredLevel);

      results.set(userId, {
        hasPermission,
        level: hasPermission ? requiredLevel : null,
        expiresAt: null,
        reason: hasPermission ? null : 'Permission denied',
      });
    });

    return results;
  }
}

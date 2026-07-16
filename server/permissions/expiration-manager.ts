/**
 * Expiration & Revocation Manager
 * Handles permission expiration, renewal, and revocation
 */

import { MacroPermission, PermissionLevel } from './macro-permissions';

export class ExpirationManager {
  private expirationTasks: Map<string, ExpirationTask> = new Map();
  private revocationLog: RevocationEntry[] = [];

  /**
   * Schedule permission expiration
   */
  scheduleExpiration(permission: MacroPermission, callback: () => void): string {
    if (!permission.expiresAt) {
      throw new Error('Permission does not have an expiration date');
    }

    const taskId = `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    const timeUntilExpiry = permission.expiresAt.getTime() - now.getTime();

    const task: ExpirationTask = {
      id: taskId,
      permissionId: permission.id,
      expiresAt: permission.expiresAt,
      callback,
      scheduled: true,
      executed: false,
      timeout: setTimeout(
        () => {
          this.executeExpiration(taskId);
        },
        Math.max(0, timeUntilExpiry),
      ) as unknown as NodeJS.Timeout,
    };

    this.expirationTasks.set(taskId, task);
    return taskId;
  }

  /**
   * Execute expiration
   */
  private executeExpiration(taskId: string): void {
    const task = this.expirationTasks.get(taskId);
    if (task) {
      task.executed = true;
      task.callback();
    }
  }

  /**
   * Cancel expiration
   */
  cancelExpiration(taskId: string): boolean {
    const task = this.expirationTasks.get(taskId);
    if (task) {
      clearTimeout(task.timeout);
      this.expirationTasks.delete(taskId);
      return true;
    }

    return false;
  }

  /**
   * Get expiring permissions
   */
  getExpiringPermissions(
    permissions: MacroPermission[],
    withinHours: number = 24,
  ): MacroPermission[] {
    const now = new Date();
    const threshold = new Date(now.getTime() + withinHours * 60 * 60 * 1000);

    return permissions.filter((perm) => {
      if (!perm.expiresAt || perm.revokedAt) return false;
      return perm.expiresAt > now && perm.expiresAt <= threshold;
    });
  }

  /**
   * Renew permission
   */
  renewPermission(
    permission: MacroPermission,
    newExpiryDate: Date,
    renewedBy: string,
  ): RenewalResult {
    if (!permission.expiresAt) {
      return {
        success: false,
        reason: 'Permission does not have an expiration date',
      };
    }

    if (permission.revokedAt) {
      return {
        success: false,
        reason: 'Cannot renew revoked permission',
      };
    }

    const oldExpiryDate = permission.expiresAt;
    permission.expiresAt = newExpiryDate;

    this.logRenewal({
      permissionId: permission.id,
      macroId: permission.macroId,
      renewedBy,
      oldExpiryDate,
      newExpiryDate,
      timestamp: new Date(),
    });

    return {
      success: true,
      reason: null,
      newExpiryDate,
    };
  }

  /**
   * Revoke permission
   */
  revokePermission(
    permission: MacroPermission,
    revokedBy: string,
    reason?: string,
  ): RevocationResult {
    if (permission.revokedAt) {
      return {
        success: false,
        reason: 'Permission already revoked',
      };
    }

    permission.revokedAt = new Date();

    this.logRevocation({
      permissionId: permission.id,
      macroId: permission.macroId,
      grantedTo: permission.grantedTo,
      revokedBy,
      reason,
      timestamp: new Date(),
    });

    return {
      success: true,
      reason: null,
      revokedAt: permission.revokedAt,
    };
  }

  /**
   * Revoke all permissions for user
   */
  revokeUserPermissions(
    permissions: MacroPermission[],
    userId: string,
    revokedBy: string,
    reason?: string,
  ): number {
    let count = 0;

    permissions.forEach((perm) => {
      if (perm.grantedTo === userId && !perm.revokedAt) {
        this.revokePermission(perm, revokedBy, reason);
        count++;
      }
    });

    return count;
  }

  /**
   * Revoke all permissions for macro
   */
  revokeMacroPermissions(
    permissions: MacroPermission[],
    macroId: string,
    revokedBy: string,
    reason?: string,
  ): number {
    let count = 0;

    permissions.forEach((perm) => {
      if (perm.macroId === macroId && !perm.revokedAt) {
        this.revokePermission(perm, revokedBy, reason);
        count++;
      }
    });

    return count;
  }

  /**
   * Get revocation log
   */
  getRevocationLog(limit: number = 100): RevocationEntry[] {
    return this.revocationLog.slice(-limit).reverse();
  }

  /**
   * Get revocation log for permission
   */
  getPermissionRevocationLog(permissionId: string): RevocationEntry[] {
    return this.revocationLog.filter((entry) => entry.permissionId === permissionId);
  }

  /**
   * Get revocation log for user
   */
  getUserRevocationLog(userId: string): RevocationEntry[] {
    return this.revocationLog.filter((entry) => entry.grantedTo === userId);
  }

  /**
   * Log revocation
   */
  private logRevocation(entry: Omit<RevocationEntry, 'id'>): void {
    this.revocationLog.push({
      id: `rev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...entry,
    });
  }

  /**
   * Log renewal
   */
  private logRenewal(entry: RenewalEntry): void {
    // Store renewal in audit log
  }

  /**
   * Get expiration statistics
   */
  getExpirationStats(permissions: MacroPermission[]): ExpirationStats {
    const now = new Date();
    const expired = permissions.filter((p) => p.expiresAt && p.expiresAt < now && !p.revokedAt);
    const expiring24h = this.getExpiringPermissions(permissions, 24);
    const expiring7d = this.getExpiringPermissions(permissions, 24 * 7);

    return {
      total: permissions.length,
      expired: expired.length,
      expiring24h: expiring24h.length,
      expiring7d: expiring7d.length,
      revoked: permissions.filter((p) => p.revokedAt).length,
      active: permissions.filter((p) => !p.revokedAt && (!p.expiresAt || p.expiresAt > now)).length,
    };
  }

  /**
   * Auto-renew permissions
   */
  autoRenewPermissions(
    permissions: MacroPermission[],
    renewalPeriodDays: number = 30,
  ): AutoRenewalResult {
    const renewalDate = new Date();
    renewalDate.setDate(renewalDate.getDate() + renewalPeriodDays);

    let renewed = 0;
    let failed = 0;

    permissions.forEach((perm) => {
      if (perm.expiresAt && !perm.revokedAt && perm.metadata.maxUses === undefined) {
        const result = this.renewPermission(perm, renewalDate, 'system');
        if (result.success) {
          renewed++;
        } else {
          failed++;
        }
      }
    });

    return { renewed, failed, renewalDate };
  }

  /**
   * Cleanup expired permissions
   */
  cleanupExpiredPermissions(permissions: MacroPermission[]): number {
    const now = new Date();
    let count = 0;

    permissions.forEach((perm) => {
      if (perm.expiresAt && perm.expiresAt < now && !perm.revokedAt) {
        perm.revokedAt = now;
        count++;
      }
    });

    return count;
  }
}

/**
 * Expiration task
 */
interface ExpirationTask {
  id: string;
  permissionId: string;
  expiresAt: Date;
  callback: () => void;
  scheduled: boolean;
  executed: boolean;
  timeout: NodeJS.Timeout;
}

/**
 * Revocation entry
 */
export interface RevocationEntry {
  id: string;
  permissionId: string;
  macroId: string;
  grantedTo: string;
  revokedBy: string;
  reason?: string;
  timestamp: Date;
}

/**
 * Renewal entry
 */
interface RenewalEntry {
  permissionId: string;
  macroId: string;
  renewedBy: string;
  oldExpiryDate: Date;
  newExpiryDate: Date;
  timestamp: Date;
}

/**
 * Renewal result
 */
export interface RenewalResult {
  success: boolean;
  reason: string | null;
  newExpiryDate?: Date;
}

/**
 * Revocation result
 */
export interface RevocationResult {
  success: boolean;
  reason: string | null;
  revokedAt?: Date;
}

/**
 * Expiration statistics
 */
export interface ExpirationStats {
  total: number;
  expired: number;
  expiring24h: number;
  expiring7d: number;
  revoked: number;
  active: number;
}

/**
 * Auto renewal result
 */
export interface AutoRenewalResult {
  renewed: number;
  failed: number;
  renewalDate: Date;
}

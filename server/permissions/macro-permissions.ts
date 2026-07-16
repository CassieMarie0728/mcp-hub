/**
 * Macro Permissions System
 * Granular access control with expiration and audit trails
 */

export type PermissionLevel = 'view' | 'edit' | 'execute' | 'admin';
export type ShareType = 'user' | 'group' | 'public' | 'link';

/**
 * Permission definition
 */
export interface MacroPermission {
  id: string;
  macroId: string;
  grantedBy: string;
  grantedTo: string;
  shareType: ShareType;
  level: PermissionLevel;
  createdAt: Date;
  expiresAt: Date | null;
  revokedAt: Date | null;
  metadata: {
    reason?: string;
    maxUses?: number;
    usedCount?: number;
    ipRestriction?: string[];
    deviceRestriction?: string[];
  };
}

/**
 * Macro Permissions Engine
 */
export class MacroPermissionsEngine {
  private permissions: Map<string, MacroPermission[]> = new Map();
  private auditLog: AuditEntry[] = [];

  /**
   * Grant permission
   */
  grantPermission(
    macroId: string,
    grantedBy: string,
    grantedTo: string,
    level: PermissionLevel,
    options: PermissionOptions = {},
  ): MacroPermission {
    const permission: MacroPermission = {
      id: `perm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      macroId,
      grantedBy,
      grantedTo,
      shareType: options.shareType || 'user',
      level,
      createdAt: new Date(),
      expiresAt: options.expiresAt || null,
      revokedAt: null,
      metadata: {
        reason: options.reason,
        maxUses: options.maxUses,
        usedCount: 0,
        ipRestriction: options.ipRestriction,
        deviceRestriction: options.deviceRestriction,
      },
    };

    if (!this.permissions.has(macroId)) {
      this.permissions.set(macroId, []);
    }

    this.permissions.get(macroId)!.push(permission);

    // Log audit entry
    this.logAudit({
      action: 'PERMISSION_GRANTED',
      macroId,
      actor: grantedBy,
      target: grantedTo,
      details: { level, shareType: permission.shareType },
    });

    return permission;
  }

  /**
   * Check if user has permission
   */
  hasPermission(
    macroId: string,
    userId: string,
    requiredLevel: PermissionLevel,
    context?: PermissionContext,
  ): boolean {
    const permissions = this.permissions.get(macroId) || [];

    for (const perm of permissions) {
      // Skip revoked permissions
      if (perm.revokedAt) continue;

      // Check expiration
      if (perm.expiresAt && new Date() > perm.expiresAt) {
        continue;
      }

      // Check usage limit
      if (perm.metadata.maxUses && perm.metadata.usedCount! >= perm.metadata.maxUses) {
        continue;
      }

      // Check if user matches
      if (perm.grantedTo !== userId && perm.shareType !== 'public') {
        continue;
      }

      // Check IP restriction
      if (perm.metadata.ipRestriction && context?.ip) {
        if (!perm.metadata.ipRestriction.includes(context.ip)) {
          continue;
        }
      }

      // Check device restriction
      if (perm.metadata.deviceRestriction && context?.deviceId) {
        if (!perm.metadata.deviceRestriction.includes(context.deviceId)) {
          continue;
        }
      }

      // Check permission level
      if (this.isLevelSufficient(perm.level, requiredLevel)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get user permissions for macro
   */
  getUserPermissions(macroId: string, userId: string): MacroPermission[] {
    const permissions = this.permissions.get(macroId) || [];

    return permissions.filter((perm) => {
      if (perm.revokedAt) return false;
      if (perm.expiresAt && new Date() > perm.expiresAt) return false;
      return perm.grantedTo === userId || perm.shareType === 'public';
    });
  }

  /**
   * Get all permissions for macro
   */
  getMacroPermissions(macroId: string): MacroPermission[] {
    return this.permissions.get(macroId) || [];
  }

  /**
   * Revoke permission
   */
  revokePermission(permissionId: string, revokedBy: string): boolean {
    for (const [macroId, perms] of this.permissions.entries()) {
      const perm = perms.find((p) => p.id === permissionId);
      if (perm) {
        perm.revokedAt = new Date();

        this.logAudit({
          action: 'PERMISSION_REVOKED',
          macroId,
          actor: revokedBy,
          target: perm.grantedTo,
          details: { permissionId },
        });

        return true;
      }
    }

    return false;
  }

  /**
   * Revoke all permissions for user
   */
  revokeUserPermissions(macroId: string, userId: string, revokedBy: string): number {
    const permissions = this.permissions.get(macroId) || [];
    let count = 0;

    permissions.forEach((perm) => {
      if (perm.grantedTo === userId && !perm.revokedAt) {
        perm.revokedAt = new Date();
        count++;
      }
    });

    if (count > 0) {
      this.logAudit({
        action: 'USER_PERMISSIONS_REVOKED',
        macroId,
        actor: revokedBy,
        target: userId,
        details: { count },
      });
    }

    return count;
  }

  /**
   * Update permission level
   */
  updatePermissionLevel(
    permissionId: string,
    newLevel: PermissionLevel,
    updatedBy: string,
  ): MacroPermission | null {
    for (const [macroId, perms] of this.permissions.entries()) {
      const perm = perms.find((p) => p.id === permissionId);
      if (perm) {
        const oldLevel = perm.level;
        perm.level = newLevel;

        this.logAudit({
          action: 'PERMISSION_UPDATED',
          macroId,
          actor: updatedBy,
          target: perm.grantedTo,
          details: { oldLevel, newLevel },
        });

        return perm;
      }
    }

    return null;
  }

  /**
   * Record permission usage
   */
  recordUsage(permissionId: string, context?: PermissionContext): boolean {
    for (const perms of this.permissions.values()) {
      const perm = perms.find((p) => p.id === permissionId);
      if (perm) {
        perm.metadata.usedCount = (perm.metadata.usedCount || 0) + 1;

        this.logAudit({
          action: 'PERMISSION_USED',
          macroId: perm.macroId,
          actor: perm.grantedTo,
          target: perm.grantedBy,
          details: { permissionId, context },
        });

        return true;
      }
    }

    return false;
  }

  /**
   * Check if permission is expired
   */
  isExpired(permission: MacroPermission): boolean {
    if (!permission.expiresAt) return false;
    return new Date() > permission.expiresAt;
  }

  /**
   * Get expiring permissions (within days)
   */
  getExpiringPermissions(macroId: string, withinDays: number = 7): MacroPermission[] {
    const permissions = this.permissions.get(macroId) || [];
    const now = new Date();
    const threshold = new Date(now.getTime() + withinDays * 24 * 60 * 60 * 1000);

    return permissions.filter((perm) => {
      if (!perm.expiresAt || perm.revokedAt) return false;
      return perm.expiresAt > now && perm.expiresAt <= threshold;
    });
  }

  /**
   * Extend permission expiration
   */
  extendPermission(permissionId: string, newExpiryDate: Date, extendedBy: string): boolean {
    for (const [macroId, perms] of this.permissions.entries()) {
      const perm = perms.find((p) => p.id === permissionId);
      if (perm) {
        const oldExpiry = perm.expiresAt;
        perm.expiresAt = newExpiryDate;

        this.logAudit({
          action: 'PERMISSION_EXTENDED',
          macroId,
          actor: extendedBy,
          target: perm.grantedTo,
          details: { oldExpiry, newExpiry: newExpiryDate },
        });

        return true;
      }
    }

    return false;
  }

  /**
   * Get audit log for macro
   */
  getAuditLog(macroId: string, limit: number = 100): AuditEntry[] {
    return this.auditLog
      .filter((entry) => entry.macroId === macroId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get audit log for user
   */
  getUserAuditLog(userId: string, limit: number = 100): AuditEntry[] {
    return this.auditLog
      .filter((entry) => entry.actor === userId || entry.target === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Log audit entry
   */
  private logAudit(entry: Omit<AuditEntry, 'id' | 'timestamp'>): void {
    this.auditLog.push({
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      ...entry,
    });
  }

  /**
   * Check if permission level is sufficient
   */
  private isLevelSufficient(
    grantedLevel: PermissionLevel,
    requiredLevel: PermissionLevel,
  ): boolean {
    const hierarchy: Record<PermissionLevel, number> = {
      view: 1,
      execute: 2,
      edit: 3,
      admin: 4,
    };

    return hierarchy[grantedLevel] >= hierarchy[requiredLevel];
  }

  /**
   * Generate share link
   */
  generateShareLink(
    macroId: string,
    level: PermissionLevel,
    options: PermissionOptions = {},
  ): ShareLink {
    const token = this.generateToken();

    const link: ShareLink = {
      token,
      macroId,
      level,
      createdAt: new Date(),
      expiresAt: options.expiresAt || null,
      maxUses: options.maxUses || null,
      usedCount: 0,
      active: true,
    };

    return link;
  }

  /**
   * Validate share link
   */
  validateShareLink(token: string): ShareLink | null {
    // In real implementation, lookup from database
    return null;
  }

  /**
   * Generate secure token
   */
  private generateToken(): string {
    return `link_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
  }

  /**
   * Get permission statistics
   */
  getPermissionStats(macroId: string): PermissionStats {
    const permissions = this.permissions.get(macroId) || [];
    const active = permissions.filter(
      (p) => !p.revokedAt && (!p.expiresAt || new Date() < p.expiresAt),
    );
    const expired = permissions.filter((p) => p.expiresAt && new Date() > p.expiresAt);
    const revoked = permissions.filter((p) => p.revokedAt);

    const levels: Record<PermissionLevel, number> = { view: 0, execute: 0, edit: 0, admin: 0 };
    active.forEach((p) => {
      levels[p.level]++;
    });

    return {
      total: permissions.length,
      active: active.length,
      expired: expired.length,
      revoked: revoked.length,
      byLevel: levels,
      shareTypes: this.countShareTypes(permissions),
    };
  }

  /**
   * Count share types
   */
  private countShareTypes(permissions: MacroPermission[]): Record<ShareType, number> {
    const counts: Record<ShareType, number> = { user: 0, group: 0, public: 0, link: 0 };

    permissions.forEach((p) => {
      counts[p.shareType]++;
    });

    return counts;
  }
}

/**
 * Permission options
 */
export interface PermissionOptions {
  shareType?: ShareType;
  expiresAt?: Date;
  reason?: string;
  maxUses?: number;
  ipRestriction?: string[];
  deviceRestriction?: string[];
}

/**
 * Permission context
 */
export interface PermissionContext {
  ip?: string;
  deviceId?: string;
  userAgent?: string;
  timestamp?: Date;
}

/**
 * Audit entry
 */
export interface AuditEntry {
  id: string;
  timestamp: Date;
  action: string;
  macroId: string;
  actor: string;
  target: string;
  details: Record<string, any>;
}

/**
 * Share link
 */
export interface ShareLink {
  token: string;
  macroId: string;
  level: PermissionLevel;
  createdAt: Date;
  expiresAt: Date | null;
  maxUses: number | null;
  usedCount: number;
  active: boolean;
}

/**
 * Permission statistics
 */
export interface PermissionStats {
  total: number;
  active: number;
  expired: number;
  revoked: number;
  byLevel: Record<PermissionLevel, number>;
  shareTypes: Record<ShareType, number>;
}

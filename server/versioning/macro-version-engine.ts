/**
 * Macro Version Engine
 * Manages macro versions, history, and rollback functionality
 */
export class MacroVersionEngine {
  private versions: Map<string, MacroVersion[]> = new Map();
  private currentVersions: Map<string, number> = new Map();

  /**
   * Create a new version
   */
  createVersion(
    macroId: string,
    userId: string,
    content: Record<string, unknown>,
    changeDescription: string,
    metadata?: Record<string, unknown>,
  ): MacroVersion {
    const currentVersion = this.currentVersions.get(macroId) || 0;
    const nextVersion = currentVersion + 1;

    const version: MacroVersion = {
      id: `${macroId}_v${nextVersion}`,
      macroId,
      versionNumber: nextVersion,
      content,
      userId,
      timestamp: new Date(),
      changeDescription,
      metadata,
      tags: [],
      isReleased: false,
    };

    if (!this.versions.has(macroId)) {
      this.versions.set(macroId, []);
    }

    this.versions.get(macroId)!.push(version);
    this.currentVersions.set(macroId, nextVersion);

    return version;
  }

  /**
   * Get version
   */
  getVersion(macroId: string, versionNumber: number): MacroVersion | null {
    const versions = this.versions.get(macroId);
    if (!versions) return null;

    return versions.find((v) => v.versionNumber === versionNumber) || null;
  }

  /**
   * Get current version
   */
  getCurrentVersion(macroId: string): MacroVersion | null {
    const versionNumber = this.currentVersions.get(macroId);
    if (versionNumber === undefined) return null;

    return this.getVersion(macroId, versionNumber);
  }

  /**
   * Get version history
   */
  getVersionHistory(macroId: string, limit: number = 50): MacroVersion[] {
    const versions = this.versions.get(macroId) || [];
    return versions.slice(-limit).reverse();
  }

  /**
   * Rollback to version
   */
  rollbackToVersion(
    macroId: string,
    versionNumber: number,
    userId: string,
    reason: string,
  ): MacroVersion | null {
    const targetVersion = this.getVersion(macroId, versionNumber);
    if (!targetVersion) return null;

    // Create new version with rollback content
    const rollbackVersion = this.createVersion(
      macroId,
      userId,
      targetVersion.content,
      `Rollback to v${versionNumber}: ${reason}`,
      { rolledBackFrom: versionNumber },
    );

    return rollbackVersion;
  }

  /**
   * Tag version
   */
  tagVersion(macroId: string, versionNumber: number, tag: string): boolean {
    const version = this.getVersion(macroId, versionNumber);
    if (!version) return false;

    if (!version.tags.includes(tag)) {
      version.tags.push(tag);
    }

    return true;
  }

  /**
   * Release version
   */
  releaseVersion(macroId: string, versionNumber: number): boolean {
    const version = this.getVersion(macroId, versionNumber);
    if (!version) return false;

    version.isReleased = true;
    version.releasedAt = new Date();

    return true;
  }

  /**
   * Get released versions
   */
  getReleasedVersions(macroId: string): MacroVersion[] {
    const versions = this.versions.get(macroId) || [];
    return versions.filter((v) => v.isReleased);
  }

  /**
   * Compare versions
   */
  compareVersions(macroId: string, version1: number, version2: number): VersionDiff | null {
    const v1 = this.getVersion(macroId, version1);
    const v2 = this.getVersion(macroId, version2);

    if (!v1 || !v2) return null;

    return {
      macroId,
      fromVersion: version1,
      toVersion: version2,
      fromContent: v1.content,
      toContent: v2.content,
      changes: this.calculateDiff(v1.content, v2.content),
      fromTimestamp: v1.timestamp,
      toTimestamp: v2.timestamp,
    };
  }

  /**
   * Calculate diff between two versions
   */
  private calculateDiff(
    from: Record<string, unknown>,
    to: Record<string, unknown>,
  ): VersionChange[] {
    const changes: VersionChange[] = [];

    // Deep diff logic
    const fromStr = JSON.stringify(from);
    const toStr = JSON.stringify(to);

    if (fromStr === toStr) {
      return changes;
    }

    // Simple diff: detect additions, deletions, modifications
    if (Array.isArray(from) && Array.isArray(to)) {
      // Array diff
      const maxLen = Math.max(from.length, to.length);

      for (let i = 0; i < maxLen; i++) {
        if (i >= from.length) {
          changes.push({
            type: 'add',
            path: `[${i}]`,
            value: to[i],
          });
        } else if (i >= to.length) {
          changes.push({
            type: 'remove',
            path: `[${i}]`,
            value: from[i],
          });
        } else if (JSON.stringify(from[i]) !== JSON.stringify(to[i])) {
          changes.push({
            type: 'modify',
            path: `[${i}]`,
            oldValue: from[i],
            newValue: to[i],
          });
        }
      }
    } else if (typeof from === 'object' && typeof to === 'object') {
      // Object diff
      const allKeys = new Set([...Object.keys(from || {}), ...Object.keys(to || {})]);

      for (const key of allKeys) {
        if (!(key in (from || {}))) {
          changes.push({
            type: 'add',
            path: key,
            value: to[key],
          });
        } else if (!(key in (to || {}))) {
          changes.push({
            type: 'remove',
            path: key,
            value: from[key],
          });
        } else if (JSON.stringify(from[key]) !== JSON.stringify(to[key])) {
          changes.push({
            type: 'modify',
            path: key,
            oldValue: from[key],
            newValue: to[key],
          });
        }
      }
    } else {
      // Primitive diff
      changes.push({
        type: 'modify',
        path: 'root',
        oldValue: from,
        newValue: to,
      });
    }

    return changes;
  }

  /**
   * Get version statistics
   */
  getVersionStats(macroId: string): VersionStats {
    const versions = this.versions.get(macroId) || [];

    if (versions.length === 0) {
      return {
        macroId,
        totalVersions: 0,
        releasedVersions: 0,
        totalContributors: 0,
        oldestVersion: null,
        newestVersion: null,
      };
    }

    const contributors = new Set(versions.map((v) => v.userId));
    const releasedVersions = versions.filter((v) => v.isReleased);

    return {
      macroId,
      totalVersions: versions.length,
      releasedVersions: releasedVersions.length,
      totalContributors: contributors.size,
      oldestVersion: versions[0],
      newestVersion: versions[versions.length - 1],
    };
  }

  /**
   * Merge versions
   */
  mergeVersions(
    macroId: string,
    baseVersion: number,
    version1: number,
    version2: number,
    userId: string,
  ): MacroVersion | null {
    const base = this.getVersion(macroId, baseVersion);
    const v1 = this.getVersion(macroId, version1);
    const v2 = this.getVersion(macroId, version2);

    if (!base || !v1 || !v2) return null;

    // Simple merge: combine changes from both versions
    const mergedContent = this.performMerge(base.content, v1.content, v2.content);

    return this.createVersion(
      macroId,
      userId,
      mergedContent,
      `Merge v${version1} and v${version2}`,
      { mergedFrom: [version1, version2] },
    );
  }

  /**
   * Perform three-way merge
   */
  private performMerge(
    base: Record<string, unknown>,
    v1: Record<string, unknown>,
    v2: Record<string, unknown>,
  ): Record<string, unknown> {
    // Simple merge strategy: if both versions modified the same field, use v2
    const merged = JSON.parse(JSON.stringify(base));

    const applyChanges = (
      target: Record<string, unknown>,
      source: Record<string, unknown>,
    ): Record<string, unknown> => {
      if (typeof source === 'object' && source !== null) {
        for (const key in source) {
          if (typeof source[key] === 'object' && source[key] !== null) {
            target[key] = applyChanges((target[key] as Record<string, unknown>) || {}, source[key] as Record<string, unknown>);
          } else {
            target[key] = source[key];
          }
        }
      }
      return target;
    };

    applyChanges(merged, v1);
    applyChanges(merged, v2);

    return merged;
  }

  /**
   * Export version as JSON
   */
  exportVersion(macroId: string, versionNumber: number): string | null {
    const version = this.getVersion(macroId, versionNumber);
    if (!version) return null;

    return JSON.stringify(version, null, 2);
  }

  /**
   * Import version from JSON
   */
  importVersion(macroId: string, userId: string, jsonData: string): MacroVersion | null {
    try {
      const data = JSON.parse(jsonData);

      return this.createVersion(
        macroId,
        userId,
        data.content || data,
        `Imported version: ${data.changeDescription || 'Imported'}`,
        { imported: true },
      );
    } catch (error) {
      return null;
    }
  }

  /**
   * Cleanup old versions
   */
  cleanupOldVersions(macroId: string, keepCount: number = 50): number {
    const versions = this.versions.get(macroId);
    if (!versions || versions.length <= keepCount) return 0;

    const toRemove = versions.length - keepCount;
    const removed = versions.splice(0, toRemove);

    return removed.length;
  }

  /**
   * Get all macros with versions
   */
  getAllMacrosWithVersions(): MacroVersionInfo[] {
    const result: MacroVersionInfo[] = [];

    for (const [macroId, versions] of this.versions) {
      result.push({
        macroId,
        totalVersions: versions.length,
        currentVersion: this.currentVersions.get(macroId) || 0,
        lastModified: versions[versions.length - 1]?.timestamp || new Date(),
      });
    }

    return result;
  }
}

/**
 * Macro version
 */
export interface MacroVersion {
  id: string;
  macroId: string;
  versionNumber: number;
  content: any;
  userId: string;
  timestamp: Date;
  changeDescription: string;
  metadata?: Record<string, any>;
  tags: string[];
  isReleased: boolean;
  releasedAt?: Date;
}

/**
 * Version diff
 */
export interface VersionDiff {
  macroId: string;
  fromVersion: number;
  toVersion: number;
  fromContent: any;
  toContent: any;
  changes: VersionChange[];
  fromTimestamp: Date;
  toTimestamp: Date;
}

/**
 * Version change
 */
export interface VersionChange {
  type: 'add' | 'remove' | 'modify';
  path: string;
  value?: any;
  oldValue?: any;
  newValue?: any;
}

/**
 * Version statistics
 */
export interface VersionStats {
  macroId: string;
  totalVersions: number;
  releasedVersions: number;
  totalContributors: number;
  oldestVersion: MacroVersion | null;
  newestVersion: MacroVersion | null;
}

/**
 * Macro version info
 */
export interface MacroVersionInfo {
  macroId: string;
  totalVersions: number;
  currentVersion: number;
  lastModified: Date;
}

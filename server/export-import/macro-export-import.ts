/**
 * Macro Export/Import Engine
 * Handles macro serialization, dependency resolution, and portable sharing
 */
export class MacroExportImportEngine {
  /**
   * Export macro as JSON
   */
  exportMacro(macro: any, includeDependencies: boolean = true): ExportedMacro {
    const exported: ExportedMacro = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      macro: {
        id: macro.id,
        name: macro.name,
        description: macro.description,
        actions: macro.actions,
        variables: macro.variables,
        tags: macro.tags || [],
        metadata: {
          createdAt: macro.createdAt,
          updatedAt: macro.updatedAt,
          author: macro.author || 'Unknown',
          version: macro.version || '1.0',
        },
      },
      dependencies: includeDependencies ? this.resolveDependencies(macro) : [],
      checksums: {
        macro: this.calculateChecksum(macro),
        dependencies: {},
      },
    };

    // Calculate checksums for dependencies
    exported.dependencies.forEach((dep) => {
      exported.checksums.dependencies[dep.id] = this.calculateChecksum(dep);
    });

    return exported;
  }

  /**
   * Import macro from JSON
   */
  importMacro(exportedData: string): ImportResult {
    try {
      const exported = JSON.parse(exportedData) as ExportedMacro;

      // Validate format
      if (!exported.version || !exported.macro) {
        return {
          success: false,
          error: 'Invalid export format: missing version or macro',
          macro: null,
          missingDependencies: [],
        };
      }

      // Verify checksums
      const macroChecksum = this.calculateChecksum(exported.macro);
      if (exported.checksums.macro !== macroChecksum) {
        return {
          success: false,
          error: 'Macro checksum mismatch: file may be corrupted',
          macro: null,
          missingDependencies: [],
        };
      }

      // Check dependencies
      const missingDependencies: string[] = [];
      exported.dependencies.forEach((dep) => {
        const depChecksum = this.calculateChecksum(dep);
        if (exported.checksums.dependencies[dep.id] !== depChecksum) {
          missingDependencies.push(dep.id);
        }
      });

      // Create macro object
      const macro = {
        ...exported.macro,
        id: `macro_${Date.now()}`,
        imported: true,
        importedAt: new Date(),
        originalId: exported.macro.id,
      };

      return {
        success: missingDependencies.length === 0,
        error: missingDependencies.length > 0 ? 'Some dependencies are missing or corrupted' : null,
        macro,
        missingDependencies,
      };
    } catch (error) {
      return {
        success: false,
        error: `Import failed: ${(error as Error).message}`,
        macro: null,
        missingDependencies: [],
      };
    }
  }

  /**
   * Resolve macro dependencies
   */
  private resolveDependencies(macro: any): MacroDependency[] {
    const dependencies: MacroDependency[] = [];
    const seen = new Set<string>();

    // Extract app dependencies from actions
    const appDeps = this.extractAppDependencies(macro.actions);
    appDeps.forEach((app) => {
      if (!seen.has(app)) {
        dependencies.push({
          id: app,
          type: 'app',
          name: app,
          version: '1.0',
          required: true,
        });
        seen.add(app);
      }
    });

    // Extract variable dependencies
    const varDeps = this.extractVariableDependencies(macro.variables);
    varDeps.forEach((varName) => {
      if (!seen.has(varName)) {
        dependencies.push({
          id: varName,
          type: 'variable',
          name: varName,
          version: '1.0',
          required: true,
        });
        seen.add(varName);
      }
    });

    return dependencies;
  }

  /**
   * Extract app dependencies from actions
   */
  private extractAppDependencies(actions: any[]): string[] {
    const apps = new Set<string>();

    actions.forEach((action) => {
      if (action.target) {
        // Extract app name from target (e.g., "Gmail App" -> "Gmail")
        const appName = action.target.replace(/\s+App$/i, '');
        apps.add(appName);
      }
    });

    return Array.from(apps);
  }

  /**
   * Extract variable dependencies
   */
  private extractVariableDependencies(variables: any[]): string[] {
    return variables.map((v) => v.name || v);
  }

  /**
   * Calculate checksum
   */
  private calculateChecksum(obj: any): string {
    const str = JSON.stringify(obj);
    let hash = 0;

    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return Math.abs(hash).toString(16);
  }

  /**
   * Export multiple macros as bundle
   */
  exportMacroBundle(macros: any[]): string {
    const bundle: MacroBundle = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      macros: macros.map((m) => this.exportMacro(m, false)),
      metadata: {
        count: macros.length,
        totalSize: 0,
      },
    };

    const json = JSON.stringify(bundle, null, 2);
    bundle.metadata.totalSize = json.length;

    return JSON.stringify(bundle, null, 2);
  }

  /**
   * Import macro bundle
   */
  importMacroBundle(bundleData: string): BundleImportResult {
    try {
      const bundle = JSON.parse(bundleData) as MacroBundle;

      if (!bundle.version || !bundle.macros) {
        return {
          success: false,
          error: 'Invalid bundle format',
          macros: [],
          failedCount: 0,
        };
      }

      const results: ImportResult[] = [];
      let failedCount = 0;

      bundle.macros.forEach((exported) => {
        const result = this.importMacro(JSON.stringify(exported));
        results.push(result);
        if (!result.success) failedCount++;
      });

      return {
        success: failedCount === 0,
        error: failedCount > 0 ? `${failedCount} macros failed to import` : null,
        macros: results.filter((r) => r.macro).map((r) => r.macro!),
        failedCount,
      };
    } catch (error) {
      return {
        success: false,
        error: `Bundle import failed: ${(error as Error).message}`,
        macros: [],
        failedCount: 0,
      };
    }
  }

  /**
   * Validate macro compatibility
   */
  validateCompatibility(
    macro: Record<string, unknown>,
    targetVersion: string,
  ): CompatibilityResult {
    const issues: CompatibilityIssue[] = [];

    // Check for deprecated actions
    const deprecatedActions = ['old_tap', 'legacy_scroll'];
    const actions = Array.isArray(macro.actions) ? macro.actions : [];
    actions.forEach((action: any, index: number) => {
      if (deprecatedActions.includes(action.type)) {
        issues.push({
          severity: 'warning',
          message: `Action "${action.type}" is deprecated at line ${index + 1}`,
          line: index + 1,
          suggestion: `Consider using "${this.getSuggestedAction(action.type)}" instead`,
        });
      }
    });

    // Check for missing variables
    const usedVars = this.extractUsedVariables(actions);
    const variables = Array.isArray(macro.variables) ? macro.variables : [];
    const definedVars = new Set(variables.map((v: any) => v.name));

    usedVars.forEach((varName) => {
      if (!definedVars.has(varName)) {
        issues.push({
          severity: 'error',
          message: `Variable "${varName}" is used but not defined`,
          line: -1,
          suggestion: `Add variable "${varName}" to the variables list`,
        });
      }
    });

    return {
      compatible: issues.filter((i) => i.severity === 'error').length === 0,
      issues,
      targetVersion,
    };
  }

  /**
   * Extract used variables from actions
   */
  private extractUsedVariables(actions: any[]): Set<string> {
    const vars = new Set<string>();
    const varRegex = /\$\{([^}]+)\}/g;

    actions.forEach((action) => {
      Object.values(action).forEach((value) => {
        if (typeof value === 'string') {
          let match;
          while ((match = varRegex.exec(value)) !== null) {
            vars.add(match[1]);
          }
        }
      });
    });

    return vars;
  }

  /**
   * Get suggested action
   */
  private getSuggestedAction(oldAction: string): string {
    const suggestions: Record<string, string> = {
      old_tap: 'tap',
      legacy_scroll: 'scroll',
    };

    return suggestions[oldAction] || oldAction;
  }

  /**
   * Merge macros
   */
  mergeMacros(
    macro1: Record<string, unknown>,
    macro2: Record<string, unknown>,
    strategy: 'concat' | 'override' = 'concat',
  ): Record<string, unknown> {
    if (strategy === 'concat') {
      const actions1 = Array.isArray(macro1.actions) ? macro1.actions : [];
      const actions2 = Array.isArray(macro2.actions) ? macro2.actions : [];
      const vars1 = Array.isArray(macro1.variables) ? macro1.variables : [];
      const vars2 = Array.isArray(macro2.variables) ? macro2.variables : [];
      const tags1 = Array.isArray(macro1.tags) ? macro1.tags : [];
      const tags2 = Array.isArray(macro2.tags) ? macro2.tags : [];

      return {
        id: `macro_${Date.now()}`,
        name: `${macro1.name} + ${macro2.name}`,
        description: `Merged macro combining ${macro1.name} and ${macro2.name}`,
        actions: [...actions1, ...actions2],
        variables: this.mergeVariables(vars1, vars2),
        tags: [...new Set([...tags1, ...tags2])],
      };
    } else {
      // Override strategy
      const actions2 = Array.isArray(macro2.actions) ? macro2.actions : [];
      return {
        ...macro1,
        actions: actions2,
        variables: macro2.variables,
      };
    }
  }

  /**
   * Merge variables
   */
  private mergeVariables(
    vars1: Array<Record<string, unknown>>,
    vars2: Array<Record<string, unknown>>,
  ): Array<Record<string, unknown>> {
    const merged = new Map();

    vars1.forEach((v) => merged.set(v.name, v));
    vars2.forEach((v) => merged.set(v.name, v));

    return Array.from(merged.values());
  }

  /**
   * Estimate macro size
   */
  estimateMacroSize(macro: any): MacroSize {
    const json = JSON.stringify(macro);
    const compressed = this.estimateCompression(json);

    return {
      uncompressed: json.length,
      estimated_compressed: compressed,
      actions: macro.actions.length,
      variables: macro.variables.length,
    };
  }

  /**
   * Estimate compression ratio (rough estimate)
   */
  private estimateCompression(str: string): number {
    // Rough estimate: JSON typically compresses to 30-40% of original size
    return Math.ceil(str.length * 0.35);
  }
}

/**
 * Exported macro format
 */
export interface ExportedMacro {
  version: string;
  exportedAt: string;
  macro: {
    id: string;
    name: string;
    description: string;
    actions: any[];
    variables: any[];
    tags: string[];
    metadata: {
      createdAt: any;
      updatedAt: any;
      author: string;
      version: string;
    };
  };
  dependencies: MacroDependency[];
  checksums: {
    macro: string;
    dependencies: Record<string, string>;
  };
}

/**
 * Macro dependency
 */
export interface MacroDependency {
  id: string;
  type: 'app' | 'variable' | 'macro';
  name: string;
  version: string;
  required: boolean;
}

/**
 * Import result
 */
export interface ImportResult {
  success: boolean;
  error: string | null;
  macro: any | null;
  missingDependencies: string[];
}

/**
 * Macro bundle
 */
export interface MacroBundle {
  version: string;
  exportedAt: string;
  macros: ExportedMacro[];
  metadata: {
    count: number;
    totalSize: number;
  };
}

/**
 * Bundle import result
 */
export interface BundleImportResult {
  success: boolean;
  error: string | null;
  macros: any[];
  failedCount: number;
}

/**
 * Compatibility result
 */
export interface CompatibilityResult {
  compatible: boolean;
  issues: CompatibilityIssue[];
  targetVersion: string;
}

/**
 * Compatibility issue
 */
export interface CompatibilityIssue {
  severity: 'error' | 'warning';
  message: string;
  line: number;
  suggestion: string;
}

/**
 * Macro size
 */
export interface MacroSize {
  uncompressed: number;
  estimated_compressed: number;
  actions: number;
  variables: number;
}

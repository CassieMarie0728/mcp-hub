import { Macro, MacroStep } from '@/lib/models/Macro';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

export interface MacroSharePackage {
  version: string;
  exportedAt: number;
  macros: Macro[];
  metadata: {
    count: number;
    totalSteps: number;
    exportedBy?: string;
  };
}

export interface MacroImportResult {
  imported: number;
  skipped: number;
  errors: string[];
  macros: Macro[];
}

/**
 * MacroSharingEngine
 * Handles exporting and importing macros as JSON files
 */
export class MacroSharingEngine {
  private static readonly SHARE_VERSION = '1.0.0';
  private static readonly SHARE_MIME_TYPE = 'application/json';

  /**
   * Export macros as JSON file
   */
  static async exportMacros(macros: Macro[], filename?: string): Promise<string> {
    try {
      const sharePackage: MacroSharePackage = {
        version: this.SHARE_VERSION,
        exportedAt: Date.now(),
        macros,
        metadata: {
          count: macros.length,
          totalSteps: macros.reduce((sum, m) => sum + m.steps.length, 0),
        },
      };

      const json = JSON.stringify(sharePackage, null, 2);
      const fileName = filename || `macros_${Date.now()}.json`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(filePath, json, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      return filePath;
    } catch (error) {
      throw new Error(`Failed to export macros: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Share macros via system share sheet
   */
  static async shareMacros(macros: Macro[], filename?: string): Promise<void> {
    try {
      const filePath = await this.exportMacros(macros, filename);

      if (!(await Sharing.isAvailableAsync())) {
        throw new Error('Sharing is not available on this device');
      }

      await Sharing.shareAsync(filePath, {
        mimeType: this.SHARE_MIME_TYPE,
        dialogTitle: 'Share Macros',
      });
    } catch (error) {
      throw new Error(`Failed to share macros: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Import macros from JSON file
   */
  static async importMacros(filePath: string): Promise<MacroImportResult> {
    const result: MacroImportResult = {
      imported: 0,
      skipped: 0,
      errors: [],
      macros: [],
    };

    try {
      const json = await FileSystem.readAsStringAsync(filePath, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const sharePackage: MacroSharePackage = JSON.parse(json);

      // Validate package structure
      if (!sharePackage.version || !sharePackage.macros || !Array.isArray(sharePackage.macros)) {
        throw new Error('Invalid macro share package format');
      }

      // Validate version compatibility
      const [majorVersion] = sharePackage.version.split('.');
      const [currentMajor] = this.SHARE_VERSION.split('.');
      if (majorVersion !== currentMajor) {
        result.errors.push(
          `Version mismatch: package is v${sharePackage.version}, app is v${this.SHARE_VERSION}`
        );
      }

      // Process macros
      for (const macro of sharePackage.macros) {
        try {
          // Validate macro structure
          if (!macro.name || !macro.steps || !Array.isArray(macro.steps)) {
            result.skipped++;
            result.errors.push(`Invalid macro structure: ${macro.name || 'unknown'}`);
            continue;
          }

          // Validate steps
          for (const step of macro.steps) {
            if (!step.toolName || !step.serverId) {
              throw new Error(`Invalid step in macro "${macro.name}"`);
            }
          }

          // Generate new ID for imported macro
          const importedMacro: Macro = {
            ...macro,
            id: `macro_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            usageCount: 0,
            isFavorite: false,
            version: 1,
          };

          result.macros.push(importedMacro);
          result.imported++;
        } catch (error) {
          result.skipped++;
          result.errors.push(
            `Failed to import macro: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }

      return result;
    } catch (error) {
      throw new Error(`Failed to import macros: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate shareable macro link (for future cloud sharing)
   */
  static generateShareLink(macros: Macro[]): string {
    try {
      const data = {
        macros: macros.map((m) => ({
          name: m.name,
          description: m.description,
          steps: m.steps.length,
        })),
      };

      const encoded = btoa(JSON.stringify(data));
      return `mcphub://share/${encoded}`;
    } catch (error) {
      throw new Error(`Failed to generate share link: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse shareable macro link
   */
  static parseShareLink(link: string): Macro[] | null {
    try {
      if (!link.startsWith('mcphub://share/')) {
        return null;
      }

      const encoded = link.replace('mcphub://share/', '');
      const decoded = atob(encoded);
      const data = JSON.parse(decoded);

      return data.macros || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Export single macro as JSON
   */
  static async exportSingleMacro(macro: Macro, filename?: string): Promise<string> {
    return this.exportMacros([macro], filename || `${macro.name.replace(/\s+/g, '_')}.json`);
  }

  /**
   * Create macro backup
   */
  static async createBackup(macros: Macro[]): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return this.exportMacros(macros, `macros_backup_${timestamp}.json`);
  }

  /**
   * Restore macros from backup
   */
  static async restoreFromBackup(filePath: string): Promise<MacroImportResult> {
    return this.importMacros(filePath);
  }
}

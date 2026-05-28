/**
 * Macro Model
 * Represents a sequence of tool executions that can be recorded, saved, and replayed
 */

export enum MacroStatus {
  IDLE = 'IDLE',
  RECORDING = 'RECORDING',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export interface MacroStep {
  id: string;
  serverId: string;
  serverName: string;
  toolName: string;
  parameters: Record<string, any>;
  resultFormat?: string;
  expectedResult?: any;
  timeout?: number;
  retryOnFailure?: boolean;
  maxRetries?: number;
  order: number;
}

export interface MacroVariable {
  name: string;
  description?: string;
  defaultValue?: any;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
}

export interface Macro {
  id: string;
  name: string;
  description?: string;
  steps: MacroStep[];
  variables?: MacroVariable[];
  tags?: string[];
  isFavorite: boolean;
  usageCount: number;
  lastExecutedAt?: number;
  createdAt: number;
  updatedAt: number;
  createdBy?: string;
  version: number;
}

export interface MacroExecution {
  id: string;
  macroId: string;
  macroName: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  status: MacroStatus;
  currentStepIndex: number;
  totalSteps: number;
  results: Array<{
    stepId: string;
    stepIndex: number;
    toolName: string;
    result: any;
    duration: number;
    status: 'SUCCESS' | 'FAILED' | 'TIMEOUT';
    error?: string;
  }>;
  variables?: Record<string, any>;
  error?: string;
}

export interface MacroTemplate {
  name: string;
  description: string;
  steps: Omit<MacroStep, 'id' | 'order'>[];
  variables?: MacroVariable[];
  tags?: string[];
  category?: string;
}

/**
 * Built-in macro templates
 */
export const MACRO_TEMPLATES: Record<string, MacroTemplate> = {
  read_and_analyze: {
    name: 'Read and Analyze File',
    description: 'Read a file and analyze its contents',
    category: 'filesystem',
    steps: [
      {
        serverId: '',
        serverName: 'Filesystem',
        toolName: 'read_file',
        parameters: { path: '${filePath}' },
        resultFormat: 'RAW_TEXT',
      },
    ],
    variables: [
      {
        name: 'filePath',
        description: 'Path to the file to read',
        type: 'string',
      },
    ],
    tags: ['file', 'read', 'analyze'],
  },
  list_and_filter: {
    name: 'List and Filter Directory',
    description: 'List directory contents and filter results',
    category: 'filesystem',
    steps: [
      {
        serverId: '',
        serverName: 'Filesystem',
        toolName: 'list_directory',
        parameters: { path: '${dirPath}' },
        resultFormat: 'TABLE',
      },
    ],
    variables: [
      {
        name: 'dirPath',
        description: 'Path to the directory to list',
        type: 'string',
      },
    ],
    tags: ['directory', 'list', 'filter'],
  },
  web_fetch_and_parse: {
    name: 'Fetch and Parse Web Content',
    description: 'Fetch a web page and parse its content',
    category: 'web',
    steps: [
      {
        serverId: '',
        serverName: 'Web',
        toolName: 'fetch',
        parameters: { url: '${webUrl}' },
        resultFormat: 'MARKDOWN',
      },
    ],
    variables: [
      {
        name: 'webUrl',
        description: 'URL to fetch',
        type: 'string',
      },
    ],
    tags: ['web', 'fetch', 'parse'],
  },
};

/**
 * Macro Manager
 * Handles storage, retrieval, and management of macros
 */
export class MacroManager {
  private static readonly STORAGE_KEY = 'mcp_macros';
  private static readonly EXECUTION_LOG_KEY = 'mcp_macro_executions';
  private static readonly MAX_MACROS = 100;
  private static readonly MAX_EXECUTIONS = 500;

  /**
   * Create a new macro
   */
  static async createMacro(macro: Omit<Macro, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<Macro> {
    try {
      const now = Date.now();
      const newMacro: Macro = {
        ...macro,
        id: `macro_${now}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: now,
        updatedAt: now,
        version: 1,
      };

      const macros = await this.getAll();
      macros.push(newMacro);

      if (macros.length > this.MAX_MACROS) {
        macros.splice(0, macros.length - this.MAX_MACROS);
      }

      await this.saveMacros(macros);
      return newMacro;
    } catch (error) {
      console.error('Failed to create macro:', error);
      throw error;
    }
  }

  /**
   * Create macro from template
   */
  static async createFromTemplate(templateKey: string, overrides?: Partial<Macro>): Promise<Macro> {
    try {
      const template = MACRO_TEMPLATES[templateKey];
      if (!template) {
        throw new Error(`Template not found: ${templateKey}`);
      }

      const now = Date.now();
      const steps: MacroStep[] = template.steps.map((step, index) => ({
        ...step,
        id: `step_${now}_${index}`,
        order: index,
      }));

      const newMacro: Macro = {
        id: `macro_${now}_${Math.random().toString(36).substr(2, 9)}`,
        name: template.name,
        description: template.description,
        steps,
        variables: template.variables,
        tags: template.tags,
        isFavorite: false,
        usageCount: 0,
        createdAt: now,
        updatedAt: now,
        version: 1,
        ...overrides,
      };

      const macros = await this.getAll();
      macros.push(newMacro);
      await this.saveMacros(macros);
      return newMacro;
    } catch (error) {
      console.error('Failed to create macro from template:', error);
      throw error;
    }
  }

  /**
   * Create macro from execution history
   */
  static async createFromExecutionHistory(
    executionIds: string[],
    name: string,
    description?: string
  ): Promise<Macro> {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const historyData = await AsyncStorage.getItem('mcp_execution_history');
      const history = historyData ? JSON.parse(historyData) : [];

      const steps: MacroStep[] = [];
      let order = 0;

      for (const execId of executionIds) {
        const exec = history.find((e: any) => e.id === execId);
        if (exec) {
          steps.push({
            id: `step_${Date.now()}_${order}`,
            serverId: exec.serverId,
            serverName: exec.serverName,
            toolName: exec.toolName,
            parameters: exec.parameters,
            resultFormat: exec.resultType,
            order,
          });
          order++;
        }
      }

      return this.createMacro({
        name,
        description,
        steps,
        isFavorite: false,
        usageCount: 0,
        tags: ['from-history'],
      });
    } catch (error) {
      console.error('Failed to create macro from execution history:', error);
      throw error;
    }
  }

  /**
   * Get all macros
   */
  static async getAll(): Promise<Macro[]> {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const data = await AsyncStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to retrieve macros:', error);
      return [];
    }
  }

  /**
   * Get macro by ID
   */
  static async getById(id: string): Promise<Macro | null> {
    try {
      const macros = await this.getAll();
      return macros.find((m) => m.id === id) || null;
    } catch (error) {
      console.error('Failed to get macro:', error);
      return null;
    }
  }

  /**
   * Update macro
   */
  static async updateMacro(id: string, updates: Partial<Macro>): Promise<Macro> {
    try {
      const macros = await this.getAll();
      const index = macros.findIndex((m) => m.id === id);

      if (index === -1) {
        throw new Error(`Macro not found: ${id}`);
      }

      const updated = {
        ...macros[index],
        ...updates,
        id: macros[index].id,
        createdAt: macros[index].createdAt,
        updatedAt: Date.now(),
        version: macros[index].version + 1,
      };

      macros[index] = updated;
      await this.saveMacros(macros);
      return updated;
    } catch (error) {
      console.error('Failed to update macro:', error);
      throw error;
    }
  }

  /**
   * Delete macro
   */
  static async deleteMacro(id: string): Promise<void> {
    try {
      let macros = await this.getAll();
      macros = macros.filter((m) => m.id !== id);
      await this.saveMacros(macros);
    } catch (error) {
      console.error('Failed to delete macro:', error);
      throw error;
    }
  }

  /**
   * Get favorite macros
   */
  static async getFavorites(): Promise<Macro[]> {
    try {
      const macros = await this.getAll();
      return macros.filter((m) => m.isFavorite).sort((a, b) => b.usageCount - a.usageCount);
    } catch (error) {
      console.error('Failed to get favorites:', error);
      return [];
    }
  }

  /**
   * Toggle favorite status
   */
  static async toggleFavorite(id: string): Promise<void> {
    try {
      const macro = await this.getById(id);
      if (macro) {
        await this.updateMacro(id, { isFavorite: !macro.isFavorite });
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      throw error;
    }
  }

  /**
   * Record execution
   */
  static async recordExecution(execution: MacroExecution): Promise<void> {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const data = await AsyncStorage.getItem(this.EXECUTION_LOG_KEY);
      const executions: MacroExecution[] = data ? JSON.parse(data) : [];

      executions.unshift(execution);

      if (executions.length > this.MAX_EXECUTIONS) {
        executions.splice(this.MAX_EXECUTIONS);
      }

      await AsyncStorage.setItem(this.EXECUTION_LOG_KEY, JSON.stringify(executions));

      // Update macro usage count
      const macro = await this.getById(execution.macroId);
      if (macro) {
        await this.updateMacro(execution.macroId, {
          usageCount: macro.usageCount + 1,
          lastExecutedAt: Date.now(),
        });
      }
    } catch (error) {
      console.error('Failed to record execution:', error);
      throw error;
    }
  }

  /**
   * Get execution history for a macro
   */
  static async getExecutionHistory(macroId: string, limit: number = 10): Promise<MacroExecution[]> {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const data = await AsyncStorage.getItem(this.EXECUTION_LOG_KEY);
      const executions: MacroExecution[] = data ? JSON.parse(data) : [];

      return executions.filter((e) => e.macroId === macroId).slice(0, limit);
    } catch (error) {
      console.error('Failed to get execution history:', error);
      return [];
    }
  }

  /**
   * Export macro as JSON
   */
  static async exportMacro(id: string): Promise<string> {
    try {
      const macro = await this.getById(id);
      if (!macro) {
        throw new Error(`Macro not found: ${id}`);
      }
      return JSON.stringify(macro, null, 2);
    } catch (error) {
      console.error('Failed to export macro:', error);
      throw error;
    }
  }

  /**
   * Import macro from JSON
   */
  static async importMacro(jsonData: string): Promise<Macro> {
    try {
      const macro = JSON.parse(jsonData) as Macro;
      // Generate new ID to avoid conflicts
      macro.id = `macro_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      macro.createdAt = Date.now();
      macro.updatedAt = Date.now();

      const macros = await this.getAll();
      macros.push(macro);
      await this.saveMacros(macros);
      return macro;
    } catch (error) {
      console.error('Failed to import macro:', error);
      throw error;
    }
  }

  /**
   * Save macros to storage
   */
  private static async saveMacros(macros: Macro[]): Promise<void> {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(macros));
    } catch (error) {
      console.error('Failed to save macros:', error);
      throw error;
    }
  }
}

/**
 * Execution History Model
 * Stores records of tool executions for history/audit purposes
 */

export enum ExecutionStatus {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  TIMEOUT = 'TIMEOUT',
  CANCELLED = 'CANCELLED',
  PARTIAL = 'PARTIAL',
}

export interface ExecutionError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export interface ExecutionHistoryEntry {
  id: string;
  serverId: string;
  serverName: string;
  toolName: string;
  toolDescription?: string;
  parameters: Record<string, any>;
  result: any;
  resultType: string;
  resultSize: number;
  timestamp: number;
  executionTimeMs: number;
  status: ExecutionStatus;
  error?: ExecutionError;
  tags?: string[];
  notes?: string;
}

export interface ExecutionHistoryFilter {
  serverId?: string;
  toolName?: string;
  status?: ExecutionStatus;
  dateFrom?: number;
  dateTo?: number;
  searchText?: string;
  limit?: number;
  offset?: number;
}

export interface ExecutionHistoryStats {
  totalExecutions: number;
  successCount: number;
  failureCount: number;
  timeoutCount: number;
  averageExecutionTimeMs: number;
  mostUsedTools: Array<{ toolName: string; count: number }>;
  mostUsedServers: Array<{ serverId: string; serverName: string; count: number }>;
}

/**
 * Execution History Manager
 * Handles storage, retrieval, and statistics for execution history
 */
export class ExecutionHistoryManager {
  private static readonly STORAGE_KEY = 'mcp_execution_history';
  private static readonly MAX_HISTORY_SIZE = 1000; // Keep last 1000 executions

  /**
   * Add a new execution to history
   */
  static async addExecution(entry: ExecutionHistoryEntry): Promise<void> {
    try {
      const history = await this.getAll();

      // Add new entry
      history.unshift(entry);

      // Trim to max size (keep newest)
      if (history.length > this.MAX_HISTORY_SIZE) {
        history.splice(this.MAX_HISTORY_SIZE);
      }

      // Save to storage
      await this.saveHistory(history);
    } catch (error) {
      console.error('Failed to add execution to history:', error);
      throw error;
    }
  }

  /**
   * Get all execution history
   */
  static async getAll(): Promise<ExecutionHistoryEntry[]> {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const data = await AsyncStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to retrieve execution history:', error);
      return [];
    }
  }

  /**
   * Get execution history with filtering
   */
  static async getFiltered(filter: ExecutionHistoryFilter): Promise<ExecutionHistoryEntry[]> {
    try {
      let history = await this.getAll();

      // Apply filters
      if (filter.serverId) {
        history = history.filter((e) => e.serverId === filter.serverId);
      }

      if (filter.toolName) {
        history = history.filter((e) => e.toolName.toLowerCase().includes(filter.toolName!.toLowerCase()));
      }

      if (filter.status) {
        history = history.filter((e) => e.status === filter.status);
      }

      if (filter.dateFrom) {
        history = history.filter((e) => e.timestamp >= filter.dateFrom!);
      }

      if (filter.dateTo) {
        history = history.filter((e) => e.timestamp <= filter.dateTo!);
      }

      if (filter.searchText) {
        const search = filter.searchText.toLowerCase();
        history = history.filter(
          (e) =>
            e.toolName.toLowerCase().includes(search) ||
            e.serverName.toLowerCase().includes(search) ||
            (e.notes && e.notes.toLowerCase().includes(search))
        );
      }

      // Apply pagination
      const offset = filter.offset || 0;
      const limit = filter.limit || 50;
      return history.slice(offset, offset + limit);
    } catch (error) {
      console.error('Failed to filter execution history:', error);
      return [];
    }
  }

  /**
   * Get a single execution by ID
   */
  static async getById(id: string): Promise<ExecutionHistoryEntry | null> {
    try {
      const history = await this.getAll();
      return history.find((e) => e.id === id) || null;
    } catch (error) {
      console.error('Failed to retrieve execution:', error);
      return null;
    }
  }

  /**
   * Delete a single execution
   */
  static async deleteExecution(id: string): Promise<void> {
    try {
      let history = await this.getAll();
      history = history.filter((e) => e.id !== id);
      await this.saveHistory(history);
    } catch (error) {
      console.error('Failed to delete execution:', error);
      throw error;
    }
  }

  /**
   * Delete all executions for a server
   */
  static async deleteByServer(serverId: string): Promise<void> {
    try {
      let history = await this.getAll();
      history = history.filter((e) => e.serverId !== serverId);
      await this.saveHistory(history);
    } catch (error) {
      console.error('Failed to delete server executions:', error);
      throw error;
    }
  }

  /**
   * Clear all execution history
   */
  static async clearAll(): Promise<void> {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear execution history:', error);
      throw error;
    }
  }

  /**
   * Get execution statistics
   */
  static async getStats(): Promise<ExecutionHistoryStats> {
    try {
      const history = await this.getAll();

      const successCount = history.filter((e) => e.status === ExecutionStatus.SUCCESS).length;
      const failureCount = history.filter((e) => e.status === ExecutionStatus.FAILED).length;
      const timeoutCount = history.filter((e) => e.status === ExecutionStatus.TIMEOUT).length;

      const totalExecutionTime = history.reduce((sum, e) => sum + e.executionTimeMs, 0);
      const averageExecutionTimeMs = history.length > 0 ? totalExecutionTime / history.length : 0;

      // Most used tools
      const toolCounts = new Map<string, number>();
      history.forEach((e) => {
        toolCounts.set(e.toolName, (toolCounts.get(e.toolName) || 0) + 1);
      });
      const mostUsedTools = Array.from(toolCounts.entries())
        .map(([toolName, count]) => ({ toolName, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Most used servers
      const serverCounts = new Map<string, { name: string; count: number }>();
      history.forEach((e) => {
        const key = e.serverId;
        const existing = serverCounts.get(key) || { name: e.serverName, count: 0 };
        serverCounts.set(key, { name: existing.name, count: existing.count + 1 });
      });
      const mostUsedServers = Array.from(serverCounts.entries())
        .map(([serverId, { name, count }]) => ({ serverId, serverName: name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return {
        totalExecutions: history.length,
        successCount,
        failureCount,
        timeoutCount,
        averageExecutionTimeMs,
        mostUsedTools,
        mostUsedServers,
      };
    } catch (error) {
      console.error('Failed to calculate execution statistics:', error);
      return {
        totalExecutions: 0,
        successCount: 0,
        failureCount: 0,
        timeoutCount: 0,
        averageExecutionTimeMs: 0,
        mostUsedTools: [],
        mostUsedServers: [],
      };
    }
  }

  /**
   * Export history as JSON
   */
  static async exportAsJson(): Promise<string> {
    try {
      const history = await this.getAll();
      return JSON.stringify(history, null, 2);
    } catch (error) {
      console.error('Failed to export execution history:', error);
      throw error;
    }
  }

  /**
   * Import history from JSON
   */
  static async importFromJson(jsonData: string): Promise<number> {
    try {
      const imported = JSON.parse(jsonData) as ExecutionHistoryEntry[];
      const existing = await this.getAll();

      // Merge, avoiding duplicates by ID
      const existingIds = new Set(existing.map((e) => e.id));
      const newEntries = imported.filter((e) => !existingIds.has(e.id));

      const merged = [...existing, ...newEntries];

      // Trim to max size
      if (merged.length > this.MAX_HISTORY_SIZE) {
        merged.splice(this.MAX_HISTORY_SIZE);
      }

      await this.saveHistory(merged);
      return newEntries.length;
    } catch (error) {
      console.error('Failed to import execution history:', error);
      throw error;
    }
  }

  /**
   * Save history to storage
   */
  private static async saveHistory(history: ExecutionHistoryEntry[]): Promise<void> {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Failed to save execution history:', error);
      throw error;
    }
  }
}

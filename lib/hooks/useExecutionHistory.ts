import { useState, useCallback, useEffect } from 'react';
import {
  ExecutionHistoryEntry,
  ExecutionHistoryFilter,
  ExecutionHistoryStats,
  ExecutionHistoryManager,
  ExecutionStatus,
} from '@/lib/models/ExecutionHistory';

export interface UseExecutionHistoryReturn {
  // State
  history: ExecutionHistoryEntry[];
  isLoading: boolean;
  error: string | null;
  stats: ExecutionHistoryStats | null;
  totalCount: number;

  // Methods
  loadHistory: (filter?: ExecutionHistoryFilter) => Promise<void>;
  addExecution: (entry: ExecutionHistoryEntry) => Promise<void>;
  deleteExecution: (id: string) => Promise<void>;
  deleteByServer: (serverId: string) => Promise<void>;
  clearAll: () => Promise<void>;
  getStats: () => Promise<void>;
  exportAsJson: () => Promise<string>;
  importFromJson: (jsonData: string) => Promise<number>;
  retry: (entry: ExecutionHistoryEntry) => void;
}

/**
 * Hook for managing execution history
 */
export function useExecutionHistory(): UseExecutionHistoryReturn {
  const [history, setHistory] = useState<ExecutionHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<ExecutionHistoryStats | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  // Load history with optional filtering
  const loadHistory = useCallback(async (filter?: ExecutionHistoryFilter) => {
    try {
      setIsLoading(true);
      setError(null);

      let entries: ExecutionHistoryEntry[];
      if (filter) {
        entries = await ExecutionHistoryManager.getFiltered(filter);
      } else {
        entries = await ExecutionHistoryManager.getAll();
      }

      setHistory(entries);
      setTotalCount(entries.length);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load execution history';
      setError(message);
      console.error('Error loading execution history:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Add execution to history
  const addExecution = useCallback(
    async (entry: ExecutionHistoryEntry) => {
      try {
        setError(null);
        await ExecutionHistoryManager.addExecution(entry);
        // Reload history
        await loadHistory();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to add execution';
        setError(message);
        console.error('Error adding execution:', err);
      }
    },
    [loadHistory],
  );

  // Delete single execution
  const deleteExecution = useCallback(
    async (id: string) => {
      try {
        setError(null);
        await ExecutionHistoryManager.deleteExecution(id);
        // Reload history
        await loadHistory();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete execution';
        setError(message);
        console.error('Error deleting execution:', err);
      }
    },
    [loadHistory],
  );

  // Delete all executions for a server
  const deleteByServer = useCallback(
    async (serverId: string) => {
      try {
        setError(null);
        await ExecutionHistoryManager.deleteByServer(serverId);
        // Reload history
        await loadHistory();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete server executions';
        setError(message);
        console.error('Error deleting server executions:', err);
      }
    },
    [loadHistory],
  );

  // Clear all history
  const clearAll = useCallback(async () => {
    try {
      setError(null);
      await ExecutionHistoryManager.clearAll();
      setHistory([]);
      setTotalCount(0);
      setStats(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to clear history';
      setError(message);
      console.error('Error clearing history:', err);
    }
  }, []);

  // Get statistics
  const getStats = useCallback(async () => {
    try {
      setError(null);
      const newStats = await ExecutionHistoryManager.getStats();
      setStats(newStats);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load statistics';
      setError(message);
      console.error('Error loading statistics:', err);
    }
  }, []);

  // Export as JSON
  const exportAsJson = useCallback(async (): Promise<string> => {
    try {
      setError(null);
      return await ExecutionHistoryManager.exportAsJson();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to export history';
      setError(message);
      console.error('Error exporting history:', err);
      throw err;
    }
  }, []);

  // Import from JSON
  const importFromJson = useCallback(
    async (jsonData: string): Promise<number> => {
      try {
        setError(null);
        const count = await ExecutionHistoryManager.importFromJson(jsonData);
        // Reload history
        await loadHistory();
        return count;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to import history';
        setError(message);
        console.error('Error importing history:', err);
        throw err;
      }
    },
    [loadHistory],
  );

  // Retry execution (callback for parent to handle)
  const retry = useCallback((entry: ExecutionHistoryEntry) => {
    // This will be handled by the parent component
    // It needs to trigger tool execution with the same parameters
    if (__DEV__) console.log('Retry execution:', entry);
  }, []);

  // Load history on mount
  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  return {
    history,
    isLoading,
    error,
    stats,
    totalCount,
    loadHistory,
    addExecution,
    deleteExecution,
    deleteByServer,
    clearAll,
    getStats,
    exportAsJson,
    importFromJson,
    retry,
  };
}

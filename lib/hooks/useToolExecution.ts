import { useCallback, useState } from 'react';
import { NativeModules } from 'react-native';
import { ResultType } from '../types/result-type';

const { MCPServerBridgeExtended } = NativeModules;

export { ResultType };

/**
 * Execution error
 */
export interface ExecutionError {
  code: string;
  message: string;
  details?: string;
  recoveryAction?: string;
}

/**
 * Tool execution result
 */
export interface ToolExecutionResult {
  id: string;
  success: boolean;
  result?: any;
  resultType: ResultType;
  executionTimeMs: number;
  error?: ExecutionError;
  timestamp: number;
}

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Execution state
 */
export interface ExecutionState {
  isExecuting: boolean;
  result?: ToolExecutionResult;
  error?: string;
  lastExecutedAt?: number;
}

/**
 * Hook for executing tools
 */
export function useToolExecution() {
  const [executionStates, setExecutionStates] = useState<
    Map<string, Map<string, ExecutionState>>
  >(new Map());
  const [globalError, setGlobalError] = useState<string | null>(null);

  /**
   * Execute a tool
   */
  const executeTool = useCallback(
    async (
      serverId: string,
      toolName: string,
      parameters: Record<string, any>,
      timeoutMs: number = 60000
    ): Promise<ToolExecutionResult> => {
      try {
        // Update execution state
        setExecutionStates((prev) => {
          const updated = new Map(prev);
          const serverMap = updated.get(serverId) ?? new Map();
          serverMap.set(toolName, {
            isExecuting: true,
          });
          updated.set(serverId, serverMap);
          return updated;
        });

        // Execute via native layer
        const result = await MCPServerBridgeExtended.executeTool(
          serverId,
          toolName,
          parameters,
          timeoutMs
        );

        const executionResult: ToolExecutionResult = {
          id: `${serverId}-${toolName}-${Date.now()}`,
          success: result.success,
          result: result.result,
          resultType: result.resultType as ResultType,
          executionTimeMs: result.executionTimeMs,
          error: result.error,
          timestamp: Date.now(),
        };

        // Update execution state with result
        setExecutionStates((prev) => {
          const updated = new Map(prev);
          const serverMap = updated.get(serverId) ?? new Map();
          serverMap.set(toolName, {
            isExecuting: false,
            result: executionResult,
            lastExecutedAt: Date.now(),
          });
          updated.set(serverId, serverMap);
          return updated;
        });

        setGlobalError(null);
        return executionResult;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Tool execution failed';
        setGlobalError(errorMessage);

        // Update execution state with error
        setExecutionStates((prev) => {
          const updated = new Map(prev);
          const serverMap = updated.get(serverId) ?? new Map();
          serverMap.set(toolName, {
            isExecuting: false,
            error: errorMessage,
          });
          updated.set(serverId, serverMap);
          return updated;
        });

        throw err;
      }
    },
    []
  );

  /**
   * Validate tool parameters
   */
  const validateParameters = useCallback(
    async (
      serverId: string,
      toolName: string,
      parameters: Record<string, any>
    ): Promise<ValidationResult> => {
      try {
        const result = await MCPServerBridgeExtended.validateToolParameters(
          serverId,
          toolName,
          parameters
        );

        return {
          isValid: result.isValid,
          errors: result.errors || [],
        };
      } catch (err) {
        console.error('Parameter validation error:', err);
        return {
          isValid: false,
          errors: [err instanceof Error ? err.message : 'Validation failed'],
        };
      }
    },
    []
  );

  /**
   * Get execution state for a tool
   */
  const getExecutionState = useCallback(
    (serverId: string, toolName: string): ExecutionState | undefined => {
      return executionStates.get(serverId)?.get(toolName);
    },
    [executionStates]
  );

  /**
   * Get last execution result
   */
  const getLastResult = useCallback(
    (serverId: string, toolName: string): ToolExecutionResult | undefined => {
      return getExecutionState(serverId, toolName)?.result;
    },
    [getExecutionState]
  );

  /**
   * Clear execution history for a tool
   */
  const clearExecutionHistory = useCallback(async (serverId: string): Promise<void> => {
    try {
      await MCPServerBridgeExtended.clearExecutionHistory(serverId);
      setExecutionStates((prev) => {
        const updated = new Map(prev);
        updated.delete(serverId);
        return updated;
      });
    } catch (err) {
      console.error('Failed to clear execution history:', err);
    }
  }, []);

  /**
   * Get execution history
   */
  const getExecutionHistory = useCallback(async (serverId: string): Promise<any[]> => {
    try {
      return await MCPServerBridgeExtended.getExecutionHistory(serverId);
    } catch (err) {
      console.error('Failed to get execution history:', err);
      return [];
    }
  }, []);

  /**
   * Get all execution states for a server
   */
  const getServerExecutionStates = useCallback(
    (serverId: string): ExecutionState[] => {
      const serverMap = executionStates.get(serverId);
      return serverMap ? Array.from(serverMap.values()) : [];
    },
    [executionStates]
  );

  /**
   * Check if any tool is executing on a server
   */
  const isAnyExecuting = useCallback(
    (serverId: string): boolean => {
      const serverMap = executionStates.get(serverId);
      if (!serverMap) return false;
      return Array.from(serverMap.values()).some((state) => state.isExecuting);
    },
    [executionStates]
  );

  return {
    // State
    globalError,

    // Methods
    executeTool,
    validateParameters,
    getExecutionState,
    getLastResult,
    clearExecutionHistory,
    getExecutionHistory,
    getServerExecutionStates,
    isAnyExecuting,
  };
}

import { useEffect, useState, useCallback } from 'react';
import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

const { MCPBridge } = NativeModules;

interface ConnectionConfig {
  serverId: string;
  host: string;
  port: number;
  transport: 'http' | 'websocket' | 'sse' | 'stdio';
  authToken?: string;
  timeout?: number;
}

interface Tool {
  name: string;
  description: string;
  schema: string;
}

interface ExecutionResult {
  success: boolean;
  result?: string;
  resultType?: string;
  executionTime?: number;
  error?: string;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * useMCPBridge - React hook for MCP server operations
 * Provides access to all Kotlin bridge functionality
 */
export function useMCPBridge() {
  const [isReady, setIsReady] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<Record<string, string>>({});
  const [discoveredTools, setDiscoveredTools] = useState<Record<string, Tool[]>>({});
  const [executionHistory, setExecutionHistory] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Initialize event listeners
  useEffect(() => {
    if (Platform.OS === 'android' && MCPBridge) {
      const eventEmitter = new NativeEventEmitter(MCPBridge);

      // Listen for connection events
      const connectionSuccessListener = eventEmitter.addListener(
        'onConnectionSuccess',
        (data) => {
          setConnectionStatus((prev) => ({
            ...prev,
            [data.serverId]: 'connected',
          }));
        }
      );

      const connectionErrorListener = eventEmitter.addListener(
        'onConnectionError',
        (data) => {
          setConnectionStatus((prev) => ({
            ...prev,
            [data.serverId]: 'error',
          }));
          setError(data.error);
        }
      );

      const disconnectedListener = eventEmitter.addListener(
        'onDisconnected',
        (data) => {
          setConnectionStatus((prev) => ({
            ...prev,
            [data.serverId]: 'disconnected',
          }));
        }
      );

      // Listen for tool discovery events
      const toolsDiscoveredListener = eventEmitter.addListener(
        'onToolsDiscovered',
        (data) => {
          console.log(`Tools discovered for ${data.serverId}: ${data.count}`);
        }
      );

      const discoveryErrorListener = eventEmitter.addListener(
        'onDiscoveryError',
        (data) => {
          setError(data.error);
        }
      );

      // Listen for execution events
      const executionCompleteListener = eventEmitter.addListener(
        'onExecutionComplete',
        (data) => {
          console.log(`Execution complete for ${data.toolName}`);
        }
      );

      const executionErrorListener = eventEmitter.addListener(
        'onExecutionError',
        (data) => {
          setError(data.error);
        }
      );

      setIsReady(true);

      return () => {
        connectionSuccessListener.remove();
        connectionErrorListener.remove();
        disconnectedListener.remove();
        toolsDiscoveredListener.remove();
        discoveryErrorListener.remove();
        executionCompleteListener.remove();
        executionErrorListener.remove();
      };
    }
  }, []);

  /**
   * Connect to an MCP server
   */
  const connectToServer = useCallback(
    async (config: ConnectionConfig): Promise<boolean> => {
      if (!MCPBridge) {
        setError('MCPBridge not available');
        return false;
      }

      try {
        setConnectionStatus((prev) => ({
          ...prev,
          [config.serverId]: 'connecting',
        }));

        const result = await MCPBridge.connectToServer(
          config.serverId,
          config.host,
          config.port,
          config.transport,
          config.authToken || null,
          config.timeout || 30000
        );

        return result.success;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(errorMessage);
        setConnectionStatus((prev) => ({
          ...prev,
          [config.serverId]: 'error',
        }));
        return false;
      }
    },
    []
  );

  /**
   * Disconnect from a server
   */
  const disconnectServer = useCallback(async (serverId: string): Promise<boolean> => {
    if (!MCPBridge) {
      setError('MCPBridge not available');
      return false;
    }

    try {
      const result = await MCPBridge.disconnectServer(serverId);
      return result.success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      return false;
    }
  }, []);

  /**
   * Get connection status
   */
  const getConnectionStatus = useCallback(async (serverId: string): Promise<string | null> => {
    if (!MCPBridge) {
      setError('MCPBridge not available');
      return null;
    }

    try {
      const result = await MCPBridge.getConnectionStatus(serverId);
      return result.status;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      return null;
    }
  }, []);

  /**
   * Discover tools from a server
   */
  const discoverTools = useCallback(async (serverId: string): Promise<Tool[] | null> => {
    if (!MCPBridge) {
      setError('MCPBridge not available');
      return null;
    }

    try {
      const result = await MCPBridge.discoverTools(serverId);
      if (result.success) {
        const tools = result.tools || [];
        setDiscoveredTools((prev) => ({
          ...prev,
          [serverId]: tools,
        }));
        return tools;
      }
      return null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      return null;
    }
  }, []);

  /**
   * Execute a tool
   */
  const executeTool = useCallback(
    async (
      serverId: string,
      toolName: string,
      parameters: Record<string, any>,
      timeout?: number
    ): Promise<ExecutionResult | null> => {
      if (!MCPBridge) {
        setError('MCPBridge not available');
        return null;
      }

      try {
        const result = await MCPBridge.executeTool(
          serverId,
          toolName,
          parameters,
          timeout || 30000
        );

        if (result.success) {
          return {
            success: true,
            result: result.result,
            resultType: result.resultType,
            executionTime: result.executionTime,
          };
        } else {
          return {
            success: false,
            error: result.error,
          };
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(errorMessage);
        return {
          success: false,
          error: errorMessage,
        };
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
    ): Promise<ValidationResult | null> => {
      if (!MCPBridge) {
        setError('MCPBridge not available');
        return null;
      }

      try {
        const result = await MCPBridge.validateParameters(serverId, toolName, parameters);
        return {
          valid: result.valid,
          errors: result.errors || [],
        };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(errorMessage);
        return null;
      }
    },
    []
  );

  /**
   * Get tool schema
   */
  const getToolSchema = useCallback(
    async (serverId: string, toolName: string): Promise<any | null> => {
      if (!MCPBridge) {
        setError('MCPBridge not available');
        return null;
      }

      try {
        const result = await MCPBridge.getToolSchema(serverId, toolName);
        if (result.success) {
          return JSON.parse(result.schema);
        }
        return null;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(errorMessage);
        return null;
      }
    },
    []
  );

  /**
   * Retry failed execution
   */
  const retryExecution = useCallback(async (executionId: string): Promise<ExecutionResult | null> => {
    if (!MCPBridge) {
      setError('MCPBridge not available');
      return null;
    }

    try {
      const result = await MCPBridge.retryExecution(executionId);
      if (result.success) {
        return {
          success: true,
          result: result.result,
        };
      }
      return null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      return null;
    }
  }, []);

  /**
   * Get execution history
   */
  const getExecutionHistory = useCallback(
    async (serverId: string, limit: number = 50): Promise<any[] | null> => {
      if (!MCPBridge) {
        setError('MCPBridge not available');
        return null;
      }

      try {
        const result = await MCPBridge.getExecutionHistory(serverId, limit);
        if (result.success) {
          setExecutionHistory(result.history || []);
          return result.history || [];
        }
        return null;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(errorMessage);
        return null;
      }
    },
    []
  );

  /**
   * Clear execution history
   */
  const clearExecutionHistory = useCallback(async (serverId: string): Promise<boolean> => {
    if (!MCPBridge) {
      setError('MCPBridge not available');
      return false;
    }

    try {
      const result = await MCPBridge.clearExecutionHistory(serverId);
      return result.success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      return false;
    }
  }, []);

  return {
    isReady,
    error,
    setError,
    connectionStatus,
    discoveredTools,
    executionHistory,
    connectToServer,
    disconnectServer,
    getConnectionStatus,
    discoverTools,
    executeTool,
    validateParameters,
    getToolSchema,
    retryExecution,
    getExecutionHistory,
    clearExecutionHistory,
  };
}

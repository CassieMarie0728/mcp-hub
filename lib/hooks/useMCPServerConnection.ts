import { useCallback, useEffect, useRef, useState } from 'react';
import { NativeModules, NativeEventEmitter } from 'react-native';

const { MCPServerBridgeExtended } = NativeModules;

/**
 * Connection status enum
 */
export enum ConnectionStatus {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  ERROR = 'ERROR',
  TIMEOUT = 'TIMEOUT',
}

/**
 * Transport type enum
 */
export enum TransportType {
  HTTP = 'HTTP',
  WEBSOCKET = 'WEBSOCKET',
  STDIO = 'STDIO',
}

/**
 * Server connection configuration
 */
export interface ServerConnectionConfig {
  id: string;
  name: string;
  host: string;
  port: number;
  transport: TransportType;
  isSecure?: boolean;
  authToken?: string;
  connectionTimeoutMs?: number;
  readTimeoutMs?: number;
}

/**
 * Connection state
 */
export interface ConnectionState {
  id: string;
  name: string;
  status: ConnectionStatus;
  isConnected: boolean;
  error?: string;
  lastConnectedAt?: number;
  connectionAttempts: number;
}

/**
 * Hook for managing MCP server connections
 */
export function useMCPServerConnection() {
  const [connections, setConnections] = useState<Map<string, ConnectionState>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventEmitterRef = useRef<NativeEventEmitter | null>(null);

  // Initialize event emitter
  useEffect(() => {
    if (!eventEmitterRef.current) {
      eventEmitterRef.current = new NativeEventEmitter(MCPServerBridgeExtended);

      // Listen for connection status changes
      const subscription = eventEmitterRef.current.addListener(
        'MCPConnectionStatusChanged',
        (event) => {
          handleConnectionStatusChanged(event.serverId, event.status);
        }
      );

      return () => {
        subscription.remove();
      };
    }
  }, []);

  /**
   * Handle connection status change from native layer
   */
  const handleConnectionStatusChanged = useCallback(
    (serverId: string, status: string) => {
      setConnections((prev) => {
        const updated = new Map(prev);
        const existing = updated.get(serverId);
        if (existing) {
          updated.set(serverId, {
            ...existing,
            status: status as ConnectionStatus,
            isConnected: status === ConnectionStatus.CONNECTED,
            lastConnectedAt:
              status === ConnectionStatus.CONNECTED ? Date.now() : existing.lastConnectedAt,
          });
        }
        return updated;
      });
    },
    []
  );

  /**
   * Connect to a server
   */
  const connectToServer = useCallback(
    async (config: ServerConnectionConfig): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await MCPServerBridgeExtended.connectToServer({
          id: config.id,
          name: config.name,
          host: config.host,
          port: config.port,
          transport: config.transport,
          isSecure: config.isSecure ?? false,
          authToken: config.authToken,
          connectionTimeoutMs: config.connectionTimeoutMs ?? 30000,
          readTimeoutMs: config.readTimeoutMs ?? 60000,
        });

        // Update connection state
        setConnections((prev) => {
          const updated = new Map(prev);
          updated.set(config.id, {
            id: config.id,
            name: config.name,
            status: ConnectionStatus.CONNECTED,
            isConnected: true,
            lastConnectedAt: Date.now(),
            connectionAttempts: (updated.get(config.id)?.connectionAttempts ?? 0) + 1,
          });
          return updated;
        });

        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Connection failed';
        setError(errorMessage);

        // Update connection state with error
        setConnections((prev) => {
          const updated = new Map(prev);
          updated.set(config.id, {
            id: config.id,
            name: config.name,
            status: ConnectionStatus.ERROR,
            isConnected: false,
            error: errorMessage,
            connectionAttempts: (updated.get(config.id)?.connectionAttempts ?? 0) + 1,
          });
          return updated;
        });

        return false;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Disconnect from a server
   */
  const disconnectServer = useCallback(async (serverId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      await MCPServerBridgeExtended.disconnectServer(serverId);

      setConnections((prev) => {
        const updated = new Map(prev);
        const existing = updated.get(serverId);
        if (existing) {
          updated.set(serverId, {
            ...existing,
            status: ConnectionStatus.DISCONNECTED,
            isConnected: false,
          });
        }
        return updated;
      });

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Disconnection failed';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Reconnect to a server
   */
  const reconnectServer = useCallback(
    async (serverId: string, config: ServerConnectionConfig): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      try {
        // Update status to CONNECTING
        setConnections((prev) => {
          const updated = new Map(prev);
          const existing = updated.get(serverId);
          if (existing) {
            updated.set(serverId, {
              ...existing,
              status: ConnectionStatus.CONNECTING,
            });
          }
          return updated;
        });

        const result = await MCPServerBridgeExtended.reconnectServer(serverId, {
          id: config.id,
          name: config.name,
          host: config.host,
          port: config.port,
          transport: config.transport,
          isSecure: config.isSecure ?? false,
          authToken: config.authToken,
          connectionTimeoutMs: config.connectionTimeoutMs ?? 30000,
          readTimeoutMs: config.readTimeoutMs ?? 60000,
        });

        setConnections((prev) => {
          const updated = new Map(prev);
          updated.set(serverId, {
            id: config.id,
            name: config.name,
            status: ConnectionStatus.CONNECTED,
            isConnected: true,
            lastConnectedAt: Date.now(),
            connectionAttempts: (updated.get(serverId)?.connectionAttempts ?? 0) + 1,
          });
          return updated;
        });

        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Reconnection failed';
        setError(errorMessage);

        setConnections((prev) => {
          const updated = new Map(prev);
          const existing = updated.get(serverId);
          if (existing) {
            updated.set(serverId, {
              ...existing,
              status: ConnectionStatus.ERROR,
              isConnected: false,
              error: errorMessage,
            });
          }
          return updated;
        });

        return false;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Get connection status
   */
  const getConnectionStatus = useCallback(async (serverId: string): Promise<ConnectionStatus> => {
    try {
      const result = await MCPServerBridgeExtended.getConnectionStatus(serverId);
      return result.status as ConnectionStatus;
    } catch (err) {
      console.error('Failed to get connection status:', err);
      return ConnectionStatus.ERROR;
    }
  }, []);

  /**
   * Get all active connections
   */
  const getActiveConnections = useCallback((): ConnectionState[] => {
    return Array.from(connections.values());
  }, [connections]);

  /**
   * Check if a server is connected
   */
  const isConnected = useCallback(
    (serverId: string): boolean => {
      return connections.get(serverId)?.isConnected ?? false;
    },
    [connections]
  );

  return {
    // State
    connections: Array.from(connections.values()),
    servers: Array.from(connections.values()), // Alias for connections
    isLoading,
    error,

    // Methods
    connectToServer,
    disconnectServer,
    reconnectServer,
    getConnectionStatus,
    getActiveConnections,
    isConnected,
  };
}

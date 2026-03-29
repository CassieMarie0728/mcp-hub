import { useEffect, useState, useCallback } from 'react';
import { NativeModules, NativeEventEmitter } from 'react-native';

const { MCPServerBridge } = NativeModules;

interface ServerConfig {
  httpPort: number;
  enableSSE: boolean;
  enableWebSocket: boolean;
  enableStdio: boolean;
}

interface ServerStatus {
  isRunning: boolean;
  serverInfo?: {
    uptime: number;
    transports: string[];
  };
}

/**
 * Hook for communicating with MCP Server Bridge
 */
export function useMCPBridge() {
  const [serverStatus, setServerStatus] = useState<ServerStatus>({ isRunning: false });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set up event listeners
  useEffect(() => {
    if (!MCPServerBridge) {
      setError('MCPServerBridge module not available');
      return;
    }

    const eventEmitter = new NativeEventEmitter(MCPServerBridge);

    const serverStartedListener = eventEmitter.addListener('serverStarted', (data) => {
      console.log('Server started:', data);
      setServerStatus({ isRunning: true });
    });

    const serverStoppedListener = eventEmitter.addListener('serverStopped', () => {
      console.log('Server stopped');
      setServerStatus({ isRunning: false });
    });

    return () => {
      serverStartedListener.remove();
      serverStoppedListener.remove();
    };
  }, []);

  /**
   * Start MCP Server
   */
  const startServer = useCallback(async (config: ServerConfig) => {
    if (!MCPServerBridge) {
      setError('MCPServerBridge module not available');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await MCPServerBridge.startServer(
        config.httpPort,
        config.enableSSE,
        config.enableWebSocket,
        config.enableStdio
      );

      console.log('Server started:', result);
      setServerStatus({ isRunning: true });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      console.error('Error starting server:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Stop MCP Server
   */
  const stopServer = useCallback(async () => {
    if (!MCPServerBridge) {
      setError('MCPServerBridge module not available');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await MCPServerBridge.stopServer();
      setServerStatus({ isRunning: false });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      console.error('Error stopping server:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Get server status
   */
  const getServerStatus = useCallback(async () => {
    if (!MCPServerBridge) {
      setError('MCPServerBridge module not available');
      return;
    }

    try {
      const status = await MCPServerBridge.getServerStatus();
      setServerStatus(status);
      return status;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      console.error('Error getting server status:', err);
    }
  }, []);

  /**
   * Execute Files tool
   */
  const executeFilesTool = useCallback(async (method: string, params: Record<string, any>) => {
    if (!MCPServerBridge) {
      setError('MCPServerBridge module not available');
      return;
    }

    try {
      const result = await MCPServerBridge.executeFilesTool(method, params);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      console.error('Error executing files tool:', err);
    }
  }, []);

  /**
   * Execute Calendar tool
   */
  const executeCalendarTool = useCallback(async (method: string, params: Record<string, any>) => {
    if (!MCPServerBridge) {
      setError('MCPServerBridge module not available');
      return;
    }

    try {
      const result = await MCPServerBridge.executeCalendarTool(method, params);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      console.error('Error executing calendar tool:', err);
    }
  }, []);

  /**
   * Execute Storage tool
   */
  const executeStorageTool = useCallback(async (method: string, params: Record<string, any>) => {
    if (!MCPServerBridge) {
      setError('MCPServerBridge module not available');
      return;
    }

    try {
      const result = await MCPServerBridge.executeStorageTool(method, params);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      console.error('Error executing storage tool:', err);
    }
  }, []);

  /**
   * Execute Communication tool
   */
  const executeCommunicationTool = useCallback(
    async (method: string, params: Record<string, any>) => {
      if (!MCPServerBridge) {
        setError('MCPServerBridge module not available');
        return;
      }

      try {
        const result = await MCPServerBridge.executeCommunicationTool(method, params);
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(errorMessage);
        console.error('Error executing communication tool:', err);
      }
    },
    []
  );

  /**
   * Configure OAuth 2.0
   */
  const configureOAuth2 = useCallback(
    async (
      clientId: string,
      clientSecret: string,
      redirectUri: string,
      authorizationEndpoint: string,
      tokenEndpoint: string,
      scope: string
    ) => {
      if (!MCPServerBridge) {
        setError('MCPServerBridge module not available');
        return;
      }

      try {
        await MCPServerBridge.configureOAuth2(
          clientId,
          clientSecret,
          redirectUri,
          authorizationEndpoint,
          tokenEndpoint,
          scope
        );
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(errorMessage);
        console.error('Error configuring OAuth2:', err);
      }
    },
    []
  );

  /**
   * Get OAuth 2.0 authorization URL
   */
  const getAuthorizationUrl = useCallback(async () => {
    if (!MCPServerBridge) {
      setError('MCPServerBridge module not available');
      return;
    }

    try {
      const result = await MCPServerBridge.getAuthorizationUrl();
      return result.authorizationUrl;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      console.error('Error getting authorization URL:', err);
    }
  }, []);

  /**
   * Exchange authorization code for token
   */
  const exchangeCodeForToken = useCallback(async (code: string) => {
    if (!MCPServerBridge) {
      setError('MCPServerBridge module not available');
      return;
    }

    try {
      const result = await MCPServerBridge.exchangeCodeForToken(code);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      console.error('Error exchanging code for token:', err);
    }
  }, []);

  /**
   * Check if user is authenticated
   */
  const isAuthenticated = useCallback(async () => {
    if (!MCPServerBridge) {
      setError('MCPServerBridge module not available');
      return false;
    }

    try {
      const result = await MCPServerBridge.isAuthenticated();
      return result.isAuthenticated;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      console.error('Error checking authentication:', err);
      return false;
    }
  }, []);

  return {
    serverStatus,
    isLoading,
    error,
    startServer,
    stopServer,
    getServerStatus,
    executeFilesTool,
    executeCalendarTool,
    executeStorageTool,
    executeCommunicationTool,
    configureOAuth2,
    getAuthorizationUrl,
    exchangeCodeForToken,
    isAuthenticated,
  };
}

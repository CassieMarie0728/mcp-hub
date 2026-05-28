/**
 * WebSocket Real-Time Sync Hook
 * Client-side hook for subscribing to real-time updates
 */

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export interface WebSocketUpdate {
  type: 'token' | 'workflow' | 'analytics' | 'execution';
  event: 'created' | 'updated' | 'deleted' | 'executed' | 'progress';
  data: any;
  timestamp: Date;
}

export interface UseWebSocketOptions {
  url?: string;
  autoConnect?: boolean;
  reconnection?: boolean;
  reconnectionDelay?: number;
  reconnectionDelayMax?: number;
  reconnectionAttempts?: number;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    url = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000',
    autoConnect = true,
    reconnection = true,
    reconnectionDelay = 1000,
    reconnectionDelayMax = 5000,
    reconnectionAttempts = 5,
  } = options;

  const socketRef = useRef<Socket | null>(null);
  const listenersRef = useRef<Map<string, Set<(data: WebSocketUpdate) => void>>>(
    new Map()
  );

  /**
   * Initialize WebSocket connection
   */
  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      return;
    }

    socketRef.current = io(url, {
      autoConnect,
      reconnection,
      reconnectionDelay,
      reconnectionDelayMax,
      reconnectionAttempts,
      transports: ['websocket', 'polling'],
    });

    // Handle incoming updates
    socketRef.current.on('update', (message: WebSocketUpdate) => {
      const room = `${message.type}:${message.event}`;
      const listeners = listenersRef.current.get(room);
      if (listeners) {
        listeners.forEach((listener) => listener(message));
      }

      // Also trigger generic listeners
      const genericListeners = listenersRef.current.get('*');
      if (genericListeners) {
        genericListeners.forEach((listener) => listener(message));
      }
    });

    // Handle connection events
    socketRef.current.on('connect', () => {
      console.log('[WebSocket] Connected');
    });

    socketRef.current.on('disconnect', () => {
      console.log('[WebSocket] Disconnected');
    });

    socketRef.current.on('error', (error: any) => {
      console.error('[WebSocket] Error:', error);
    });
  }, [url, autoConnect, reconnection, reconnectionDelay, reconnectionDelayMax, reconnectionAttempts]);

  /**
   * Subscribe to updates for a specific room
   */
  const subscribe = useCallback(
    (room: string, callback: (data: WebSocketUpdate) => void) => {
      if (!socketRef.current?.connected) {
        connect();
      }

      // Add listener
      if (!listenersRef.current.has(room)) {
        listenersRef.current.set(room, new Set());
      }
      listenersRef.current.get(room)!.add(callback);

      // Tell server to subscribe
      socketRef.current?.emit('subscribe', room);

      // Return unsubscribe function
      return () => {
        listenersRef.current.get(room)?.delete(callback);
        if (listenersRef.current.get(room)?.size === 0) {
          socketRef.current?.emit('unsubscribe', room);
        }
      };
    },
    [connect]
  );

  /**
   * Subscribe to token updates
   */
  const subscribeToTokens = useCallback(
    (callback: (data: WebSocketUpdate) => void) => {
      return subscribe('tokens', callback);
    },
    [subscribe]
  );

  /**
   * Subscribe to workflow updates
   */
  const subscribeToWorkflows = useCallback(
    (callback: (data: WebSocketUpdate) => void) => {
      return subscribe('workflows', callback);
    },
    [subscribe]
  );

  /**
   * Subscribe to specific workflow execution
   */
  const subscribeToWorkflowExecution = useCallback(
    (workflowId: string, callback: (data: WebSocketUpdate) => void) => {
      return subscribe(`workflow:${workflowId}`, callback);
    },
    [subscribe]
  );

  /**
   * Subscribe to analytics updates
   */
  const subscribeToAnalytics = useCallback(
    (callback: (data: WebSocketUpdate) => void) => {
      return subscribe('analytics', callback);
    },
    [subscribe]
  );

  /**
   * Disconnect WebSocket
   */
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      listenersRef.current.clear();
    }
  }, []);

  /**
   * Check if connected
   */
  const isConnected = useCallback(() => {
    return socketRef.current?.connected || false;
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    connect,
    disconnect,
    isConnected,
    subscribe,
    subscribeToTokens,
    subscribeToWorkflows,
    subscribeToWorkflowExecution,
    subscribeToAnalytics,
  };
}

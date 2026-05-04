/**
 * WebSocket Real-Time Sync Infrastructure
 * Handles real-time updates for tokens, workflows, and analytics
 */

import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';

export interface WebSocketMessage {
  type: 'token' | 'workflow' | 'analytics' | 'execution';
  event: 'created' | 'updated' | 'deleted' | 'executed' | 'progress';
  data: any;
  timestamp: Date;
}

export class WebSocketManager {
  private io: SocketIOServer;
  private connectedClients: Map<string, Socket> = new Map();
  private subscriptions: Map<string, Set<string>> = new Map();

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });

    this.setupConnectionHandlers();
  }

  /**
   * Set up connection and disconnection handlers
   */
  private setupConnectionHandlers() {
    this.io.on('connection', (socket: Socket) => {
      const clientId = socket.id;
      this.connectedClients.set(clientId, socket);

      console.log(`[WebSocket] Client connected: ${clientId}`);

      // Handle subscription to updates
      socket.on('subscribe', (room: string) => {
        socket.join(room);
        if (!this.subscriptions.has(room)) {
          this.subscriptions.set(room, new Set());
        }
        this.subscriptions.get(room)!.add(clientId);
        console.log(`[WebSocket] Client ${clientId} subscribed to ${room}`);
      });

      // Handle unsubscription
      socket.on('unsubscribe', (room: string) => {
        socket.leave(room);
        this.subscriptions.get(room)?.delete(clientId);
        console.log(`[WebSocket] Client ${clientId} unsubscribed from ${room}`);
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        this.connectedClients.delete(clientId);
        // Clean up subscriptions
        for (const subscribers of this.subscriptions.values()) {
          subscribers.delete(clientId);
        }
        console.log(`[WebSocket] Client disconnected: ${clientId}`);
      });

      // Handle errors
      socket.on('error', (error: any) => {
        console.error(`[WebSocket] Error from client ${clientId}:`, error);
      });
    });
  }

  /**
   * Broadcast a message to all connected clients in a room
   */
  public broadcast(room: string, message: WebSocketMessage) {
    this.io.to(room).emit('update', {
      ...message,
      timestamp: new Date(),
    });

    console.log(`[WebSocket] Broadcast to ${room}:`, message.type, message.event);
  }

  /**
   * Send a message to a specific client
   */
  public sendToClient(clientId: string, message: WebSocketMessage) {
    const socket = this.connectedClients.get(clientId);
    if (socket) {
      socket.emit('update', {
        ...message,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Broadcast token creation event
   */
  public broadcastTokenCreated(token: any) {
    this.broadcast('tokens', {
      type: 'token',
      event: 'created',
      data: token,
      timestamp: new Date(),
    });
  }

  /**
   * Broadcast token update event
   */
  public broadcastTokenUpdated(token: any) {
    this.broadcast('tokens', {
      type: 'token',
      event: 'updated',
      data: token,
      timestamp: new Date(),
    });
  }

  /**
   * Broadcast token deletion event
   */
  public broadcastTokenDeleted(tokenId: string) {
    this.broadcast('tokens', {
      type: 'token',
      event: 'deleted',
      data: { tokenId },
      timestamp: new Date(),
    });
  }

  /**
   * Broadcast workflow creation event
   */
  public broadcastWorkflowCreated(workflow: any) {
    this.broadcast('workflows', {
      type: 'workflow',
      event: 'created',
      data: workflow,
      timestamp: new Date(),
    });
  }

  /**
   * Broadcast workflow update event
   */
  public broadcastWorkflowUpdated(workflow: any) {
    this.broadcast('workflows', {
      type: 'workflow',
      event: 'updated',
      data: workflow,
      timestamp: new Date(),
    });
  }

  /**
   * Broadcast workflow execution started
   */
  public broadcastWorkflowExecutionStarted(workflowId: string) {
    this.broadcast(`workflow:${workflowId}`, {
      type: 'execution',
      event: 'progress',
      data: { workflowId, status: 'started' },
      timestamp: new Date(),
    });
  }

  /**
   * Broadcast workflow step progress
   */
  public broadcastStepProgress(workflowId: string, stepId: string, progress: any) {
    this.broadcast(`workflow:${workflowId}`, {
      type: 'execution',
      event: 'progress',
      data: { workflowId, stepId, ...progress },
      timestamp: new Date(),
    });
  }

  /**
   * Broadcast workflow execution completed
   */
  public broadcastWorkflowExecutionCompleted(workflowId: string, result: any) {
    this.broadcast(`workflow:${workflowId}`, {
      type: 'execution',
      event: 'executed',
      data: { workflowId, ...result },
      timestamp: new Date(),
    });
  }

  /**
   * Broadcast analytics update
   */
  public broadcastAnalyticsUpdate(metrics: any) {
    this.broadcast('analytics', {
      type: 'analytics',
      event: 'updated',
      data: metrics,
      timestamp: new Date(),
    });
  }

  /**
   * Get number of connected clients
   */
  public getConnectedClientCount(): number {
    return this.connectedClients.size;
  }

  /**
   * Get number of subscribers to a room
   */
  public getSubscriberCount(room: string): number {
    return this.subscriptions.get(room)?.size || 0;
  }

  /**
   * Close the WebSocket server
   */
  public close() {
    this.io.close();
    this.connectedClients.clear();
    this.subscriptions.clear();
  }
}

// Global WebSocket manager instance
let wsManager: WebSocketManager | null = null;

export function initializeWebSocket(httpServer: HTTPServer): WebSocketManager {
  if (!wsManager) {
    wsManager = new WebSocketManager(httpServer);
  }
  return wsManager;
}

export function getWebSocketManager(): WebSocketManager | null {
  return wsManager;
}

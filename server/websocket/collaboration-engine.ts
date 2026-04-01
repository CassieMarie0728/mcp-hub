import { WebSocket, WebSocketServer } from 'ws';
import { EventEmitter } from 'events';
import * as http from 'http';

/**
 * WebSocket Collaboration Engine
 * Handles real-time macro sharing and simultaneous editing
 */
export class CollaborationEngine extends EventEmitter {
  private wss: WebSocketServer;
  private sessions: Map<string, CollaborationSession> = new Map();
  private userConnections: Map<string, Set<WebSocket>> = new Map();

  constructor(server: http.Server) {
    super();
    this.wss = new WebSocketServer({ server, path: '/ws/collaborate' });
    this.setupWebSocketServer();
  }

  /**
   * Setup WebSocket server
   */
  private setupWebSocketServer() {
    this.wss.on('connection', (ws: WebSocket, req: any) => {
      const userId = this.extractUserId(req);
      const sessionId = this.extractSessionId(req);

      if (!userId || !sessionId) {
        ws.close(1008, 'Missing userId or sessionId');
        return;
      }

      this.handleNewConnection(ws, userId, sessionId);
    });

    this.wss.on('error', (error: any) => {
      console.error('WebSocket server error:', error);
      this.emit('error', error);
    });
  }

  /**
   * Handle new WebSocket connection
   */
  private handleNewConnection(ws: WebSocket, userId: string, sessionId: string) {
    // Get or create session
    let session = this.sessions.get(sessionId);
    if (!session) {
      session = new CollaborationSession(sessionId);
      this.sessions.set(sessionId, session);
    }

    // Add user to session
    session.addUser(userId, ws);

    // Track user connections
    if (!this.userConnections.has(userId)) {
      this.userConnections.set(userId, new Set());
    }
    this.userConnections.get(userId)!.add(ws);

    console.log(`User ${userId} joined session ${sessionId}`);

    // Send initial state to new user
    ws.send(
      JSON.stringify({
        type: 'session_state',
        data: session.getState(),
      })
    );

    // Notify other users
    this.broadcastToSession(sessionId, userId, {
      type: 'user_joined',
      userId,
      users: session.getUsers(),
    });

    // Handle incoming messages
    ws.on('message', (data: any) => {
      this.handleMessage(ws, userId, sessionId, data);
    });

    // Handle disconnect
    ws.on('close', () => {
      this.handleDisconnect(ws, userId, sessionId);
    });

    // Handle errors
    ws.on('error', (error: any) => {
      console.error(`WebSocket error for user ${userId}:`, error);
    });
  }

  /**
   * Handle incoming message
   */
  private handleMessage(ws: WebSocket, userId: string, sessionId: string, data: any) {
    try {
      const message = JSON.parse(data.toString());
      const session = this.sessions.get(sessionId);

      if (!session) return;

      switch (message.type) {
        case 'macro_update':
          this.handleMacroUpdate(session, userId, message.data);
          break;
        case 'action_insert':
          this.handleActionInsert(session, userId, message.data);
          break;
        case 'action_delete':
          this.handleActionDelete(session, userId, message.data);
          break;
        case 'action_modify':
          this.handleActionModify(session, userId, message.data);
          break;
        case 'cursor_position':
          this.handleCursorPosition(session, userId, message.data);
          break;
        case 'comment':
          this.handleComment(session, userId, message.data);
          break;
        case 'lock_request':
          this.handleLockRequest(session, userId, message.data);
          break;
        case 'unlock_request':
          this.handleUnlockRequest(session, userId, message.data);
          break;
        default:
          console.warn(`Unknown message type: ${message.type}`);
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  }

  /**
   * Handle macro update
   */
  private handleMacroUpdate(session: CollaborationSession, userId: string, data: any) {
    const update = {
      userId,
      timestamp: Date.now(),
      changes: data.changes,
      version: session.incrementVersion(),
    };

    session.recordUpdate(update);
    this.broadcastToSession(session.id, userId, {
      type: 'macro_updated',
      update,
    });
  }

  /**
   * Handle action insert
   */
  private handleActionInsert(session: CollaborationSession, userId: string, data: any) {
    const { index, action } = data;
    const update = {
      userId,
      timestamp: Date.now(),
      operation: 'insert',
      index,
      action,
      version: session.incrementVersion(),
    };

    session.recordUpdate(update);
    this.broadcastToSession(session.id, userId, {
      type: 'action_inserted',
      update,
    });
  }

  /**
   * Handle action delete
   */
  private handleActionDelete(session: CollaborationSession, userId: string, data: any) {
    const { index } = data;
    const update = {
      userId,
      timestamp: Date.now(),
      operation: 'delete',
      index,
      version: session.incrementVersion(),
    };

    session.recordUpdate(update);
    this.broadcastToSession(session.id, userId, {
      type: 'action_deleted',
      update,
    });
  }

  /**
   * Handle action modify
   */
  private handleActionModify(session: CollaborationSession, userId: string, data: any) {
    const { index, changes } = data;
    const update = {
      userId,
      timestamp: Date.now(),
      operation: 'modify',
      index,
      changes,
      version: session.incrementVersion(),
    };

    session.recordUpdate(update);
    this.broadcastToSession(session.id, userId, {
      type: 'action_modified',
      update,
    });
  }

  /**
   * Handle cursor position
   */
  private handleCursorPosition(session: CollaborationSession, userId: string, data: any) {
    session.updateUserCursor(userId, data);
    this.broadcastToSession(session.id, userId, {
      type: 'cursor_moved',
      userId,
      position: data,
    });
  }

  /**
   * Handle comment
   */
  private handleComment(session: CollaborationSession, userId: string, data: any) {
    const comment = {
      id: `comment_${Date.now()}`,
      userId,
      timestamp: Date.now(),
      text: data.text,
      actionIndex: data.actionIndex,
      resolved: false,
    };

    session.addComment(comment);
    this.broadcastToSession(session.id, userId, {
      type: 'comment_added',
      comment,
    });
  }

  /**
   * Handle lock request (for exclusive editing)
   */
  private handleLockRequest(session: CollaborationSession, userId: string, data: any) {
    const { actionIndex } = data;
    const locked = session.lockAction(actionIndex, userId);

    if (locked) {
      this.broadcastToSession(session.id, userId, {
        type: 'action_locked',
        actionIndex,
        userId,
      });
    } else {
      const ws = session.getUserConnection(userId);
      if (ws) {
        ws.send(
          JSON.stringify({
            type: 'lock_failed',
            actionIndex,
            lockedBy: session.getActionLock(actionIndex),
          })
        );
      }
    }
  }

  /**
   * Handle unlock request
   */
  private handleUnlockRequest(session: CollaborationSession, userId: string, data: any) {
    const { actionIndex } = data;
    session.unlockAction(actionIndex, userId);

    this.broadcastToSession(session.id, userId, {
      type: 'action_unlocked',
      actionIndex,
    });
  }

  /**
   * Broadcast message to session (excluding sender)
   */
  private broadcastToSession(sessionId: string, excludeUserId: string, message: any) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const payload = JSON.stringify(message);
    session.broadcast(payload, excludeUserId);
  }

  /**
   * Handle disconnect
   */
  private handleDisconnect(ws: WebSocket, userId: string, sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.removeUser(userId);

    // Remove from user connections
    const connections = this.userConnections.get(userId);
    if (connections) {
      connections.delete(ws);
      if (connections.size === 0) {
        this.userConnections.delete(userId);
      }
    }

    // Notify others
    if (session.getUserCount() === 0) {
      this.sessions.delete(sessionId);
      console.log(`Session ${sessionId} closed (no users)`);
    } else {
      this.broadcastToSession(sessionId, userId, {
        type: 'user_left',
        userId,
        users: session.getUsers(),
      });
    }

    console.log(`User ${userId} left session ${sessionId}`);
  }

  /**
   * Extract user ID from request
   */
  private extractUserId(req: any): string | null {
    const url = new URL(req.url, `http://${req.headers.host}`);
    return url.searchParams.get('userId');
  }

  /**
   * Extract session ID from request
   */
  private extractSessionId(req: any): string | null {
    const url = new URL(req.url, `http://${req.headers.host}`);
    return url.searchParams.get('sessionId');
  }

  /**
   * Get session state
   */
  public getSessionState(sessionId: string) {
    return this.sessions.get(sessionId)?.getState();
  }

  /**
   * Close session
   */
  public closeSession(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.closeAll();
      this.sessions.delete(sessionId);
    }
  }
}

/**
 * Collaboration Session
 * Manages a single collaborative editing session
 */
class CollaborationSession {
  id: string;
  users: Map<string, CollaborationUser> = new Map();
  updates: any[] = [];
  comments: any[] = [];
  actionLocks: Map<number, string> = new Map();
  version: number = 0;

  constructor(id: string) {
    this.id = id;
  }

  /**
   * Add user to session
   */
  addUser(userId: string, ws: WebSocket) {
    this.users.set(userId, {
      id: userId,
      connection: ws,
      cursor: null,
      joinedAt: Date.now(),
    });
  }

  /**
   * Remove user from session
   */
  removeUser(userId: string) {
    this.users.delete(userId);
  }

  /**
   * Get user connection
   */
  getUserConnection(userId: string): WebSocket | null {
    return this.users.get(userId)?.connection || null;
  }

  /**
   * Get user count
   */
  getUserCount(): number {
    return this.users.size;
  }

  /**
   * Get users
   */
  getUsers(): string[] {
    return Array.from(this.users.keys());
  }

  /**
   * Update user cursor
   */
  updateUserCursor(userId: string, cursor: any) {
    const user = this.users.get(userId);
    if (user) {
      user.cursor = cursor;
    }
  }

  /**
   * Record update
   */
  recordUpdate(update: any) {
    this.updates.push(update);
  }

  /**
   * Add comment
   */
  addComment(comment: any) {
    this.comments.push(comment);
  }

  /**
   * Lock action for exclusive editing
   */
  lockAction(actionIndex: number, userId: string): boolean {
    if (this.actionLocks.has(actionIndex)) {
      return false;
    }
    this.actionLocks.set(actionIndex, userId);
    return true;
  }

  /**
   * Unlock action
   */
  unlockAction(actionIndex: number, userId: string) {
    if (this.actionLocks.get(actionIndex) === userId) {
      this.actionLocks.delete(actionIndex);
    }
  }

  /**
   * Get action lock
   */
  getActionLock(actionIndex: number): string | null {
    return this.actionLocks.get(actionIndex) || null;
  }

  /**
   * Increment version
   */
  incrementVersion(): number {
    return ++this.version;
  }

  /**
   * Get session state
   */
  getState() {
    return {
      sessionId: this.id,
      users: this.getUsers(),
      version: this.version,
      updates: this.updates,
      comments: this.comments,
    };
  }

  /**
   * Broadcast message to all users except sender
   */
  broadcast(message: string, excludeUserId: string) {
    for (const [userId, user] of this.users) {
      if (userId !== excludeUserId && user.connection.readyState === WebSocket.OPEN) {
        user.connection.send(message);
      }
    }
  }

  /**
   * Close all connections
   */
  closeAll() {
    for (const user of this.users.values()) {
      if (user.connection.readyState === WebSocket.OPEN) {
        user.connection.close(1000, 'Session closed');
      }
    }
  }
}

/**
 * Collaboration user
 */
interface CollaborationUser {
  id: string;
  connection: WebSocket;
  cursor: any;
  joinedAt: number;
}

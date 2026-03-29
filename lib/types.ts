/**
 * Core type definitions for MCP Hub
 */

/**
 * Represents a connected MCP Server
 */
export interface MCPServer {
  id: string;
  name: string;
  description?: string;
  connectionType: 'stdio' | 'sse' | 'websocket';
  connectionDetails: {
    command?: string; // For stdio
    url?: string; // For HTTP/SSE
    headers?: Record<string, string>;
    env?: Record<string, string>;
  };
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  lastConnected?: number; // timestamp
  toolCount: number;
  createdAt: number;
  error?: string;
}

/**
 * Represents an MCP Tool exposed by a server
 */
export interface MCPTool {
  serverId: string;
  name: string;
  title?: string;
  description: string;
  inputSchema: JSONSchema;
  outputSchema?: JSONSchema;
  annotations?: Record<string, any>;
}

/**
 * JSON Schema definition (simplified)
 */
export interface JSONSchema {
  type?: string;
  properties?: Record<string, JSONSchema>;
  required?: string[];
  description?: string;
  items?: JSONSchema;
  enum?: any[];
  default?: any;
  [key: string]: any;
}

/**
 * Tool execution request
 */
export interface ToolExecutionRequest {
  serverId: string;
  toolName: string;
  arguments: Record<string, any>;
}

/**
 * Tool execution result
 */
export interface ToolExecutionResult {
  serverId: string;
  toolName: string;
  content: ContentBlock[];
  isError: boolean;
  executedAt: number;
  duration: number; // milliseconds
  error?: string;
}

/**
 * Content block returned from tool execution
 */
export type ContentBlock =
  | TextContent
  | ImageContent
  | AudioContent
  | ResourceLinkContent
  | ResourceContent;

export interface TextContent {
  type: 'text';
  text: string;
}

export interface ImageContent {
  type: 'image';
  data: string; // base64
  mimeType: string;
  annotations?: Record<string, any>;
}

export interface AudioContent {
  type: 'audio';
  data: string; // base64
  mimeType: string;
}

export interface ResourceLinkContent {
  type: 'resource_link';
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
  annotations?: Record<string, any>;
}

export interface ResourceContent {
  type: 'resource';
  resource: {
    uri: string;
    mimeType?: string;
    text?: string;
    blob?: string; // base64
    annotations?: Record<string, any>;
  };
}

/**
 * MCP Protocol message (JSON-RPC 2.0)
 */
export interface JSONRPCRequest {
  jsonrpc: '2.0';
  id?: string | number;
  method: string;
  params?: Record<string, any>;
}

export interface JSONRPCResponse {
  jsonrpc: '2.0';
  id?: string | number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

export interface JSONRPCNotification {
  jsonrpc: '2.0';
  method: string;
  params?: Record<string, any>;
}

/**
 * Server capabilities
 */
export interface ServerCapabilities {
  tools?: {
    listChanged?: boolean;
  };
  resources?: {
    subscribe?: boolean;
    listChanged?: boolean;
  };
  prompts?: {
    listChanged?: boolean;
  };
  sampling?: Record<string, any>;
}

/**
 * App state for persistence
 */
export interface AppState {
  servers: MCPServer[];
  tools: Record<string, MCPTool[]>; // serverId -> tools
  executionHistory: ToolExecutionResult[];
  settings: AppSettings;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'auto';
  executionTimeout: number; // milliseconds
  executionTimeoutEnabled: boolean; // toggle for timeout
  logRetentionDays: number;
  autoRefreshInterval: number; // milliseconds, 0 = disabled
}

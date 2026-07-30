import { z } from 'zod';

/**
 * Server Connection Service
 * Handles MCP server connection, validation, and management
 */

// ============================================================================
// Types & Schemas
// ============================================================================

export type AuthType = 'none' | 'basic' | 'bearer' | 'api_key' | 'oauth';

export interface ServerCredentials {
  type: AuthType;
  username?: string;
  password?: string;
  token?: string;
  apiKey?: string;
  apiKeyHeader?: string;
  oauthToken?: string;
}

export interface ServerConfig {
  id: string;
  name: string;
  url: string;
  credentials: ServerCredentials;
  description?: string;
  tags?: string[];
  createdAt: number;
  lastConnected?: number;
  isActive: boolean;
}

export interface ServerCapabilities {
  tools: boolean;
  resources: boolean;
  prompts: boolean;
  sampling: boolean;
}

export interface ServerInfo {
  name: string;
  version: string;
  capabilities: ServerCapabilities;
  protocolVersion: string;
}

export interface ConnectionResult {
  success: boolean;
  error?: string;
  info?: ServerInfo;
  statusCode?: number;
}

export interface ConnectionTestResult {
  connected: boolean;
  latency: number;
  error?: string;
  capabilities?: ServerCapabilities;
}

// ============================================================================
// Validation Schemas
// ============================================================================

const CredentialsSchema = z.object({
  type: z.enum(['none', 'basic', 'bearer', 'api_key', 'oauth']),
  username: z.string().optional(),
  password: z.string().optional(),
  token: z.string().optional(),
  apiKey: z.string().optional(),
  apiKeyHeader: z.string().optional(),
  oauthToken: z.string().optional(),
});

const ServerConfigSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  url: z.string().url(),
  credentials: CredentialsSchema,
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  createdAt: z.number(),
  lastConnected: z.number().optional(),
  isActive: z.boolean(),
});

// ============================================================================
// Server Connection Service
// ============================================================================

export class ServerConnectionService {
  private static readonly DEFAULT_TIMEOUT = 10000; // 10 seconds
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY = 1000; // 1 second

  /**
   * Validate server URL format
   */
  static validateUrl(url: string): { valid: boolean; error?: string } {
    try {
      new URL(url);
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: 'Invalid URL format',
      };
    }
  }

  /**
   * Validate server credentials
   */
  static validateCredentials(credentials: ServerCredentials): { valid: boolean; error?: string } {
    try {
      CredentialsSchema.parse(credentials);

      // Additional validation based on auth type
      switch (credentials.type) {
        case 'basic':
          if (!credentials.username || !credentials.password) {
            return { valid: false, error: 'Username and password required for basic auth' };
          }
          break;
        case 'bearer':
        case 'oauth':
          if (!credentials.token && !credentials.oauthToken) {
            return { valid: false, error: 'Token required for bearer/OAuth auth' };
          }
          break;
        case 'api_key':
          if (!credentials.apiKey || !credentials.apiKeyHeader) {
            return { valid: false, error: 'API key and header name required' };
          }
          break;
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Invalid credentials',
      };
    }
  }

  /**
   * Validate server configuration
   */
  static validateConfig(config: Partial<ServerConfig>): { valid: boolean; error?: string } {
    try {
      ServerConfigSchema.partial().parse(config);
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Invalid configuration',
      };
    }
  }

  /**
   * Build authorization headers based on credentials
   */
  private static buildAuthHeaders(credentials: ServerCredentials): Record<string, string> {
    const headers: Record<string, string> = {};

    switch (credentials.type) {
      case 'basic':
        if (credentials.username && credentials.password) {
          const encoded = Buffer.from(`${credentials.username}:${credentials.password}`).toString(
            'base64'
          );
          headers['Authorization'] = `Basic ${encoded}`;
        }
        break;

      case 'bearer':
        if (credentials.token) {
          headers['Authorization'] = `Bearer ${credentials.token}`;
        }
        break;

      case 'oauth':
        if (credentials.oauthToken) {
          headers['Authorization'] = `Bearer ${credentials.oauthToken}`;
        }
        break;

      case 'api_key':
        if (credentials.apiKey && credentials.apiKeyHeader) {
          headers[credentials.apiKeyHeader] = credentials.apiKey;
        }
        break;
    }

    return headers;
  }

  /**
   * Test connection to MCP server
   */
  static async testConnection(
    url: string,
    credentials: ServerCredentials,
    timeout: number = this.DEFAULT_TIMEOUT
  ): Promise<ConnectionTestResult> {
    const startTime = Date.now();

    try {
      // Validate URL
      const urlValidation = this.validateUrl(url);
      if (!urlValidation.valid) {
        return {
          connected: false,
          latency: 0,
          error: urlValidation.error,
        };
      }

      // Validate credentials
      const credValidation = this.validateCredentials(credentials);
      if (!credValidation.valid) {
        return {
          connected: false,
          latency: 0,
          error: credValidation.error,
        };
      }

      // Make test request
      const headers = this.buildAuthHeaders(credentials);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const response = await fetch(`${url}/mcp/info`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        const latency = Date.now() - startTime;

        if (!response.ok) {
          return {
            connected: false,
            latency,
            error: `Server returned status ${response.status}`,
          };
        }

        const data = await response.json();
        return {
          connected: true,
          latency,
          capabilities: data.capabilities,
        };
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      const latency = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown connection error';

      return {
        connected: false,
        latency,
        error: errorMessage,
      };
    }
  }

  /**
   * Connect to MCP server with retry logic
   */
  static async connect(
    url: string,
    credentials: ServerCredentials,
    retries: number = this.MAX_RETRIES
  ): Promise<ConnectionResult> {
    let lastError: string | undefined;

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const result = await this.testConnection(url, credentials);

        if (result.connected) {
          return {
            success: true,
            info: {
              name: 'MCP Server',
              version: '1.0.0',
              capabilities: result.capabilities || {
                tools: true,
                resources: false,
                prompts: false,
                sampling: false,
              },
              protocolVersion: '1.0',
            },
          };
        }

        lastError = result.error;

        // Retry with exponential backoff
        if (attempt < retries - 1) {
          await new Promise((resolve) =>
            setTimeout(resolve, this.RETRY_DELAY * Math.pow(2, attempt))
          );
        }
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Unknown error';
      }
    }

    return {
      success: false,
      error: lastError || 'Failed to connect after retries',
    };
  }

  /**
   * Disconnect from server
   */
  static async disconnect(config: ServerConfig): Promise<{ success: boolean; error?: string }> {
    try {
      // Perform any cleanup if needed
      // For now, just mark as disconnected
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Disconnect failed',
      };
    }
  }

  /**
   * Get server info
   */
  static async getServerInfo(
    url: string,
    credentials: ServerCredentials
  ): Promise<{ success: boolean; info?: ServerInfo; error?: string }> {
    try {
      const headers = this.buildAuthHeaders(credentials);
      const response = await fetch(`${url}/mcp/info`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
      });

      if (!response.ok) {
        return {
          success: false,
          error: `Failed to get server info: ${response.status}`,
        };
      }

      const info = await response.json();
      return { success: true, info };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get server info',
      };
    }
  }

  /**
   * Format credentials for display (hide sensitive data)
   */
  static formatCredentialsForDisplay(credentials: ServerCredentials): string {
    switch (credentials.type) {
      case 'none':
        return 'No authentication';
      case 'basic':
        return `Basic auth (${credentials.username || 'unknown'})`;
      case 'bearer':
        return `Bearer token (${credentials.token ? '***' : 'missing'})`;
      case 'api_key':
        return `API Key (${credentials.apiKeyHeader || 'unknown'})`;
      case 'oauth':
        return `OAuth (${credentials.oauthToken ? '***' : 'missing'})`;
      default:
        return 'Unknown auth type';
    }
  }
}

export default ServerConnectionService;

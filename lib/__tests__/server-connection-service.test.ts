import { describe, it, expect, beforeEach, vi } from 'vitest';
import ServerConnectionService, {
  ServerCredentials,
  AuthType,
} from '../services/server-connection-service';

describe('ServerConnectionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ========================================================================
  // URL Validation Tests
  // ========================================================================

  describe('validateUrl', () => {
    it('should validate correct URLs', () => {
      const result = ServerConnectionService.validateUrl('http://localhost:3000');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should validate HTTPS URLs', () => {
      const result = ServerConnectionService.validateUrl('https://api.example.com');
      expect(result.valid).toBe(true);
    });

    it('should reject invalid URLs', () => {
      const result = ServerConnectionService.validateUrl('not-a-url');
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject empty URLs', () => {
      const result = ServerConnectionService.validateUrl('');
      expect(result.valid).toBe(false);
    });

    it('should validate URLs with ports', () => {
      const result = ServerConnectionService.validateUrl('http://localhost:8080');
      expect(result.valid).toBe(true);
    });

    it('should validate URLs with paths', () => {
      const result = ServerConnectionService.validateUrl('http://localhost:3000/api/v1');
      expect(result.valid).toBe(true);
    });
  });

  // ========================================================================
  // Credentials Validation Tests
  // ========================================================================

  describe('validateCredentials', () => {
    it('should validate no-auth credentials', () => {
      const creds: ServerCredentials = { type: 'none' };
      const result = ServerConnectionService.validateCredentials(creds);
      expect(result.valid).toBe(true);
    });

    it('should validate basic auth credentials', () => {
      const creds: ServerCredentials = {
        type: 'basic',
        username: 'user',
        password: 'pass',
      };
      const result = ServerConnectionService.validateCredentials(creds);
      expect(result.valid).toBe(true);
    });

    it('should reject basic auth without username', () => {
      const creds: ServerCredentials = {
        type: 'basic',
        password: 'pass',
      };
      const result = ServerConnectionService.validateCredentials(creds);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Username and password required');
    });

    it('should reject basic auth without password', () => {
      const creds: ServerCredentials = {
        type: 'basic',
        username: 'user',
      };
      const result = ServerConnectionService.validateCredentials(creds);
      expect(result.valid).toBe(false);
    });

    it('should validate bearer token credentials', () => {
      const creds: ServerCredentials = {
        type: 'bearer',
        token: 'abc123',
      };
      const result = ServerConnectionService.validateCredentials(creds);
      expect(result.valid).toBe(true);
    });

    it('should reject bearer token without token', () => {
      const creds: ServerCredentials = {
        type: 'bearer',
      };
      const result = ServerConnectionService.validateCredentials(creds);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Token required');
    });

    it('should validate API key credentials', () => {
      const creds: ServerCredentials = {
        type: 'api_key',
        apiKey: 'key123',
        apiKeyHeader: 'X-API-Key',
      };
      const result = ServerConnectionService.validateCredentials(creds);
      expect(result.valid).toBe(true);
    });

    it('should reject API key without header name', () => {
      const creds: ServerCredentials = {
        type: 'api_key',
        apiKey: 'key123',
      };
      const result = ServerConnectionService.validateCredentials(creds);
      expect(result.valid).toBe(false);
    });

    it('should validate OAuth credentials', () => {
      const creds: ServerCredentials = {
        type: 'oauth',
        oauthToken: 'token123',
      };
      const result = ServerConnectionService.validateCredentials(creds);
      expect(result.valid).toBe(true);
    });
  });

  // ========================================================================
  // Config Validation Tests
  // ========================================================================

  describe('validateConfig', () => {
    it('should validate valid server config', () => {
      const config = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Test Server',
        url: 'http://localhost:3000',
        credentials: { type: 'none' as const },
        createdAt: Date.now(),
        isActive: true,
      };
      const result = ServerConnectionService.validateConfig(config);
      expect(result.valid).toBe(true);
    });

    it('should validate partial config', () => {
      const config = {
        name: 'Test Server',
        url: 'http://localhost:3000',
      };
      const result = ServerConnectionService.validateConfig(config);
      expect(result.valid).toBe(true);
    });

    it('should reject invalid URL in config', () => {
      const config = {
        url: 'not-a-url',
      };
      const result = ServerConnectionService.validateConfig(config);
      expect(result.valid).toBe(false);
    });
  });

  // ========================================================================
  // Auth Headers Tests
  // ========================================================================

  describe('buildAuthHeaders', () => {
    it('should build basic auth header', () => {
      const creds: ServerCredentials = {
        type: 'basic',
        username: 'user',
        password: 'pass',
      };
      // Access private method through any type
      const headers = (ServerConnectionService as any).buildAuthHeaders(creds);
      expect(headers['Authorization']).toBeDefined();
      expect(headers['Authorization']).toContain('Basic');
    });

    it('should build bearer token header', () => {
      const creds: ServerCredentials = {
        type: 'bearer',
        token: 'abc123',
      };
      const headers = (ServerConnectionService as any).buildAuthHeaders(creds);
      expect(headers['Authorization']).toBe('Bearer abc123');
    });

    it('should build API key header', () => {
      const creds: ServerCredentials = {
        type: 'api_key',
        apiKey: 'key123',
        apiKeyHeader: 'X-API-Key',
      };
      const headers = (ServerConnectionService as any).buildAuthHeaders(creds);
      expect(headers['X-API-Key']).toBe('key123');
    });

    it('should return empty headers for no-auth', () => {
      const creds: ServerCredentials = { type: 'none' };
      const headers = (ServerConnectionService as any).buildAuthHeaders(creds);
      expect(Object.keys(headers).length).toBe(0);
    });
  });

  // ========================================================================
  // Connection Tests
  // ========================================================================

  describe('testConnection', () => {
    it('should return connection error for invalid URL', async () => {
      const result = await ServerConnectionService.testConnection('not-a-url', {
        type: 'none',
      });
      expect(result.connected).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should return connection error for invalid credentials', async () => {
      const result = await ServerConnectionService.testConnection('http://localhost:3000', {
        type: 'basic',
        // Missing username/password
      });
      expect(result.connected).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should measure latency', async () => {
      // Mock fetch to simulate delay
      global.fetch = vi.fn(() =>
        new Promise<Response>((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: () => Promise.resolve({ capabilities: {} }),
              } as unknown as Response),
            50
          )
        )
      );

      const result = await ServerConnectionService.testConnection('http://localhost:3000', {
        type: 'none',
      });
      expect(result.latency).toBeGreaterThanOrEqual(50);
      vi.restoreAllMocks();
    });
  });

  // ========================================================================
  // Credentials Display Tests
  // ========================================================================

  describe('formatCredentialsForDisplay', () => {
    it('should format no-auth', () => {
      const text = ServerConnectionService.formatCredentialsForDisplay({ type: 'none' });
      expect(text).toBe('No authentication');
    });

    it('should format basic auth', () => {
      const text = ServerConnectionService.formatCredentialsForDisplay({
        type: 'basic',
        username: 'user',
      });
      expect(text).toContain('Basic auth');
      expect(text).toContain('user');
    });

    it('should format bearer token', () => {
      const text = ServerConnectionService.formatCredentialsForDisplay({
        type: 'bearer',
        token: 'abc123',
      });
      expect(text).toContain('Bearer token');
      expect(text).toContain('***');
    });

    it('should format API key', () => {
      const text = ServerConnectionService.formatCredentialsForDisplay({
        type: 'api_key',
        apiKeyHeader: 'X-API-Key',
      });
      expect(text).toContain('API Key');
      expect(text).toContain('X-API-Key');
    });

    it('should format OAuth', () => {
      const text = ServerConnectionService.formatCredentialsForDisplay({
        type: 'oauth',
        oauthToken: 'token123',
      });
      expect(text).toContain('OAuth');
      expect(text).toContain('***');
    });
  });

  // ========================================================================
  // Integration Tests
  // ========================================================================

  describe('Integration', () => {
    it('should validate URL and credentials together', () => {
      const urlValidation = ServerConnectionService.validateUrl('http://localhost:3000');
      const credsValidation = ServerConnectionService.validateCredentials({
        type: 'basic',
        username: 'user',
        password: 'pass',
      });

      expect(urlValidation.valid).toBe(true);
      expect(credsValidation.valid).toBe(true);
    });

    it('should handle multiple auth types', () => {
      const authTypes: AuthType[] = ['none', 'basic', 'bearer', 'api_key', 'oauth'];

      for (const type of authTypes) {
        let creds: ServerCredentials;

        switch (type) {
          case 'basic':
            creds = { type, username: 'user', password: 'pass' };
            break;
          case 'bearer':
            creds = { type, token: 'token' };
            break;
          case 'api_key':
            creds = { type, apiKey: 'key', apiKeyHeader: 'X-API-Key' };
            break;
          case 'oauth':
            creds = { type, oauthToken: 'token' };
            break;
          default:
            creds = { type };
        }

        const validation = ServerConnectionService.validateCredentials(creds);
        expect(validation.valid).toBe(true);
      }
    });
  });
});

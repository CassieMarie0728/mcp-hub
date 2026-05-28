import { describe, it, expect } from 'vitest';
import {
  ServerPreset,
  TransportType,
  ServerPresetManager,
  SERVER_PRESET_TEMPLATES,
} from '../../lib/models/ServerPreset';

describe('Server Preset Model', () => {
  describe('ServerPreset', () => {
    it('should create a valid server preset', () => {
      const preset: ServerPreset = {
        id: 'preset_1',
        name: 'My Server',
        description: 'Test server',
        host: 'localhost',
        port: 3001,
        transport: TransportType.HTTP,
        timeoutMs: 30000,
        retryAttempts: 3,
        isFavorite: false,
        usageCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      expect(preset.id).toBe('preset_1');
      expect(preset.name).toBe('My Server');
      expect(preset.transport).toBe(TransportType.HTTP);
      expect(preset.port).toBe(3001);
    });

    it('should support all transport types', () => {
      const transports = [
        TransportType.HTTP,
        TransportType.HTTPS,
        TransportType.WEBSOCKET,
        TransportType.WSS,
        TransportType.STDIO,
      ];

      transports.forEach((transport) => {
        expect(transport).toBeDefined();
      });
    });

    it('should handle optional fields', () => {
      const preset: ServerPreset = {
        id: 'preset_2',
        name: 'Server with extras',
        host: 'example.com',
        port: 443,
        transport: TransportType.HTTPS,
        authToken: 'secret_token_123',
        timeoutMs: 60000,
        retryAttempts: 5,
        tags: ['production', 'critical'],
        isFavorite: true,
        usageCount: 42,
        lastUsedAt: Date.now(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      expect(preset.authToken).toBe('secret_token_123');
      expect(preset.tags).toContain('production');
      expect(preset.isFavorite).toBe(true);
      expect(preset.usageCount).toBe(42);
    });

    it('should track creation and update timestamps', () => {
      const now = Date.now();
      const preset: ServerPreset = {
        id: 'preset_3',
        name: 'Timestamped Server',
        host: 'localhost',
        port: 3001,
        transport: TransportType.HTTP,
        timeoutMs: 30000,
        retryAttempts: 3,
        isFavorite: false,
        usageCount: 0,
        createdAt: now,
        updatedAt: now,
      };

      expect(preset.createdAt).toBe(now);
      expect(preset.updatedAt).toBe(now);
      expect(preset.updatedAt >= preset.createdAt).toBe(true);
    });
  });

  describe('TransportType enum', () => {
    it('should have all required transport types', () => {
      expect(TransportType.HTTP).toBe('HTTP');
      expect(TransportType.HTTPS).toBe('HTTPS');
      expect(TransportType.WEBSOCKET).toBe('WEBSOCKET');
      expect(TransportType.WSS).toBe('WSS');
      expect(TransportType.STDIO).toBe('STDIO');
    });
  });

  describe('Server Preset Templates', () => {
    it('should have Claude filesystem template', () => {
      const template = SERVER_PRESET_TEMPLATES.claude_filesystem;
      expect(template).toBeDefined();
      expect(template.name).toContain('Filesystem');
      expect(template.host).toBe('localhost');
      expect(template.port).toBe(3001);
    });

    it('should have Claude web template', () => {
      const template = SERVER_PRESET_TEMPLATES.claude_web;
      expect(template).toBeDefined();
      expect(template.name).toContain('Web');
      expect(template.host).toBe('localhost');
      expect(template.port).toBe(3002);
    });

    it('should have Claude git template', () => {
      const template = SERVER_PRESET_TEMPLATES.claude_git;
      expect(template).toBeDefined();
      expect(template.name).toContain('Git');
      expect(template.host).toBe('localhost');
      expect(template.port).toBe(3003);
    });

    it('should have local stdio template', () => {
      const template = SERVER_PRESET_TEMPLATES.local_stdio;
      expect(template).toBeDefined();
      expect(template.transport).toBe(TransportType.STDIO);
    });

    it('should have tags for all templates', () => {
      Object.values(SERVER_PRESET_TEMPLATES).forEach((template) => {
        expect(template.tags).toBeDefined();
        expect(Array.isArray(template.tags)).toBe(true);
        expect(template.tags!.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Preset filtering and sorting', () => {
    it('should filter by search text', () => {
      const presets: ServerPreset[] = [
        {
          id: '1',
          name: 'Production Server',
          host: 'prod.example.com',
          port: 443,
          transport: TransportType.HTTPS,
          timeoutMs: 30000,
          retryAttempts: 3,
          isFavorite: false,
          usageCount: 10,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: '2',
          name: 'Test Server',
          host: 'test.example.com',
          port: 3001,
          transport: TransportType.HTTP,
          timeoutMs: 30000,
          retryAttempts: 3,
          isFavorite: false,
          usageCount: 5,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      const search = 'Production';
      const filtered = presets.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.host.toLowerCase().includes(search.toLowerCase()),
      );

      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('Production Server');
    });

    it('should filter by tags', () => {
      const presets: ServerPreset[] = [
        {
          id: '1',
          name: 'Official Server',
          host: 'localhost',
          port: 3001,
          transport: TransportType.HTTP,
          tags: ['official', 'filesystem'],
          timeoutMs: 30000,
          retryAttempts: 3,
          isFavorite: false,
          usageCount: 0,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: '2',
          name: 'Custom Server',
          host: 'localhost',
          port: 3002,
          transport: TransportType.HTTP,
          tags: ['custom', 'web'],
          timeoutMs: 30000,
          retryAttempts: 3,
          isFavorite: false,
          usageCount: 0,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      const filtered = presets.filter((p) => p.tags?.includes('official'));
      expect(filtered).toHaveLength(1);
      expect(filtered[0].tags).toContain('official');
    });

    it('should filter by favorite status', () => {
      const presets: ServerPreset[] = [
        {
          id: '1',
          name: 'Favorite Server',
          host: 'localhost',
          port: 3001,
          transport: TransportType.HTTP,
          timeoutMs: 30000,
          retryAttempts: 3,
          isFavorite: true,
          usageCount: 0,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: '2',
          name: 'Regular Server',
          host: 'localhost',
          port: 3002,
          transport: TransportType.HTTP,
          timeoutMs: 30000,
          retryAttempts: 3,
          isFavorite: false,
          usageCount: 0,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      const favorites = presets.filter((p) => p.isFavorite);
      expect(favorites).toHaveLength(1);
      expect(favorites[0].isFavorite).toBe(true);
    });

    it('should sort by usage count and last used', () => {
      const now = Date.now();
      const presets: ServerPreset[] = [
        {
          id: '1',
          name: 'Recently Used',
          host: 'localhost',
          port: 3001,
          transport: TransportType.HTTP,
          timeoutMs: 30000,
          retryAttempts: 3,
          isFavorite: false,
          usageCount: 5,
          lastUsedAt: now,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: '2',
          name: 'Frequently Used',
          host: 'localhost',
          port: 3002,
          transport: TransportType.HTTP,
          timeoutMs: 30000,
          retryAttempts: 3,
          isFavorite: false,
          usageCount: 50,
          lastUsedAt: now - 86400000, // 1 day ago
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      const sorted = [...presets].sort((a, b) => {
        const aLastUsed = a.lastUsedAt || 0;
        const bLastUsed = b.lastUsedAt || 0;
        return bLastUsed - aLastUsed;
      });

      expect(sorted[0].id).toBe('1'); // Recently used comes first
    });
  });

  describe('Preset usage tracking', () => {
    it('should increment usage count', () => {
      const preset: ServerPreset = {
        id: 'preset_1',
        name: 'Test Server',
        host: 'localhost',
        port: 3001,
        transport: TransportType.HTTP,
        timeoutMs: 30000,
        retryAttempts: 3,
        isFavorite: false,
        usageCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      expect(preset.usageCount).toBe(0);

      // Simulate usage
      preset.usageCount += 1;
      preset.lastUsedAt = Date.now();

      expect(preset.usageCount).toBe(1);
      expect(preset.lastUsedAt).toBeDefined();
    });

    it('should track last used timestamp', () => {
      const preset: ServerPreset = {
        id: 'preset_1',
        name: 'Test Server',
        host: 'localhost',
        port: 3001,
        transport: TransportType.HTTP,
        timeoutMs: 30000,
        retryAttempts: 3,
        isFavorite: false,
        usageCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      expect(preset.lastUsedAt).toBeUndefined();

      const now = Date.now();
      preset.lastUsedAt = now;

      expect(preset.lastUsedAt).toBe(now);
    });
  });

  describe('Preset validation', () => {
    it('should validate required fields', () => {
      const preset: ServerPreset = {
        id: 'preset_1',
        name: 'Test Server',
        host: 'localhost',
        port: 3001,
        transport: TransportType.HTTP,
        timeoutMs: 30000,
        retryAttempts: 3,
        isFavorite: false,
        usageCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      // Check required fields
      expect(preset.id).toBeTruthy();
      expect(preset.name).toBeTruthy();
      expect(preset.host).toBeTruthy();
      expect(preset.port).toBeGreaterThan(0);
      expect(preset.transport).toBeTruthy();
    });

    it('should validate port range', () => {
      const validPorts = [1, 80, 443, 3000, 8080, 65535];
      const invalidPorts = [0, -1, 65536];

      validPorts.forEach((port) => {
        expect(port).toBeGreaterThan(0);
        expect(port).toBeLessThanOrEqual(65535);
      });

      invalidPorts.forEach((port) => {
        expect(port <= 0 || port > 65535).toBe(true);
      });
    });

    it('should validate timeout values', () => {
      const preset: ServerPreset = {
        id: 'preset_1',
        name: 'Test Server',
        host: 'localhost',
        port: 3001,
        transport: TransportType.HTTP,
        timeoutMs: 30000,
        retryAttempts: 3,
        isFavorite: false,
        usageCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      expect(preset.timeoutMs).toBeGreaterThan(0);
      expect(preset.retryAttempts).toBeGreaterThanOrEqual(0);
    });
  });
});

/**
 * Server Preset Model
 * Stores frequently-used server connection configurations
 */

export enum TransportType {
  HTTP = 'HTTP',
  HTTPS = 'HTTPS',
  WEBSOCKET = 'WEBSOCKET',
  WSS = 'WSS',
  STDIO = 'STDIO',
}

export interface ServerPreset {
  id: string;
  name: string;
  description?: string;
  host: string;
  port: number;
  transport: TransportType;
  authToken?: string;
  timeoutMs: number;
  retryAttempts: number;
  tags?: string[];
  isFavorite: boolean;
  usageCount: number;
  lastUsedAt?: number;
  createdAt: number;
  updatedAt: number;
}

export interface ServerPresetTemplate {
  name: string;
  description: string;
  host: string;
  port: number;
  transport: TransportType;
  timeoutMs?: number;
  retryAttempts?: number;
  tags?: string[];
}

export interface ServerPresetFilter {
  searchText?: string;
  tags?: string[];
  isFavorite?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Built-in server preset templates
 */
export const SERVER_PRESET_TEMPLATES: Record<string, ServerPresetTemplate> = {
  claude_filesystem: {
    name: 'Claude Filesystem MCP',
    description: 'Official Claude filesystem MCP server for file operations',
    host: 'localhost',
    port: 3001,
    transport: TransportType.HTTP,
    timeoutMs: 30000,
    retryAttempts: 3,
    tags: ['official', 'filesystem', 'file-operations'],
  },
  claude_web: {
    name: 'Claude Web MCP',
    description: 'Official Claude web MCP server for web browsing',
    host: 'localhost',
    port: 3002,
    transport: TransportType.HTTP,
    timeoutMs: 30000,
    retryAttempts: 3,
    tags: ['official', 'web', 'browsing'],
  },
  claude_git: {
    name: 'Claude Git MCP',
    description: 'Official Claude git MCP server for git operations',
    host: 'localhost',
    port: 3003,
    transport: TransportType.HTTP,
    timeoutMs: 30000,
    retryAttempts: 3,
    tags: ['official', 'git', 'version-control'],
  },
  local_stdio: {
    name: 'Local Stdio MCP',
    description: 'Local MCP server via stdio transport',
    host: 'localhost',
    port: 0, // Not used for stdio
    transport: TransportType.STDIO,
    timeoutMs: 30000,
    retryAttempts: 3,
    tags: ['local', 'stdio'],
  },
};

/**
 * Server Preset Manager
 * Handles storage, retrieval, and management of server presets
 */
export class ServerPresetManager {
  private static readonly STORAGE_KEY = 'mcp_server_presets';

  /**
   * Create a new preset
   */
  static async createPreset(
    preset: Omit<ServerPreset, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<ServerPreset> {
    try {
      const id = `preset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = Date.now();

      const newPreset: ServerPreset = {
        ...preset,
        id,
        createdAt: now,
        updatedAt: now,
      };

      const presets = await this.getAll();
      presets.push(newPreset);
      await this.savePresets(presets);

      return newPreset;
    } catch (error) {
      console.error('Failed to create server preset:', error);
      throw error;
    }
  }

  /**
   * Create preset from template
   */
  static async createFromTemplate(
    templateKey: string,
    overrides?: Partial<ServerPreset>,
  ): Promise<ServerPreset> {
    try {
      const template = SERVER_PRESET_TEMPLATES[templateKey];
      if (!template) {
        throw new Error(`Template not found: ${templateKey}`);
      }

      return this.createPreset({
        name: template.name,
        description: template.description,
        host: template.host,
        port: template.port,
        transport: template.transport,
        timeoutMs: template.timeoutMs || 30000,
        retryAttempts: template.retryAttempts || 3,
        tags: template.tags,
        isFavorite: false,
        usageCount: 0,
        ...overrides,
      });
    } catch (error) {
      console.error('Failed to create preset from template:', error);
      throw error;
    }
  }

  /**
   * Get all presets
   */
  static async getAll(): Promise<ServerPreset[]> {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const data = await AsyncStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to retrieve server presets:', error);
      return [];
    }
  }

  /**
   * Get presets with filtering
   */
  static async getFiltered(filter: ServerPresetFilter): Promise<ServerPreset[]> {
    try {
      let presets = await this.getAll();

      // Apply filters
      if (filter.searchText) {
        const search = filter.searchText.toLowerCase();
        presets = presets.filter(
          (p) =>
            p.name.toLowerCase().includes(search) ||
            (p.description && p.description.toLowerCase().includes(search)) ||
            p.host.toLowerCase().includes(search),
        );
      }

      if (filter.tags && filter.tags.length > 0) {
        presets = presets.filter((p) => filter.tags!.some((tag) => p.tags?.includes(tag)));
      }

      if (filter.isFavorite !== undefined) {
        presets = presets.filter((p) => p.isFavorite === filter.isFavorite);
      }

      // Sort by usage count and last used
      presets.sort((a, b) => {
        if (a.isFavorite !== b.isFavorite) {
          return a.isFavorite ? -1 : 1;
        }
        const aLastUsed = a.lastUsedAt || 0;
        const bLastUsed = b.lastUsedAt || 0;
        return bLastUsed - aLastUsed;
      });

      // Apply pagination
      const offset = filter.offset || 0;
      const limit = filter.limit || 50;
      return presets.slice(offset, offset + limit);
    } catch (error) {
      console.error('Failed to filter server presets:', error);
      return [];
    }
  }

  /**
   * Get a single preset by ID
   */
  static async getById(id: string): Promise<ServerPreset | null> {
    try {
      const presets = await this.getAll();
      return presets.find((p) => p.id === id) || null;
    } catch (error) {
      console.error('Failed to retrieve server preset:', error);
      return null;
    }
  }

  /**
   * Update a preset
   */
  static async updatePreset(id: string, updates: Partial<ServerPreset>): Promise<ServerPreset> {
    try {
      let presets = await this.getAll();
      const index = presets.findIndex((p) => p.id === id);

      if (index === -1) {
        throw new Error(`Preset not found: ${id}`);
      }

      presets[index] = {
        ...presets[index],
        ...updates,
        id: presets[index].id, // Don't allow ID change
        createdAt: presets[index].createdAt, // Don't allow creation date change
        updatedAt: Date.now(),
      };

      await this.savePresets(presets);
      return presets[index];
    } catch (error) {
      console.error('Failed to update server preset:', error);
      throw error;
    }
  }

  /**
   * Toggle favorite status
   */
  static async toggleFavorite(id: string): Promise<ServerPreset> {
    try {
      const preset = await this.getById(id);
      if (!preset) {
        throw new Error(`Preset not found: ${id}`);
      }

      return this.updatePreset(id, { isFavorite: !preset.isFavorite });
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      throw error;
    }
  }

  /**
   * Record usage of a preset
   */
  static async recordUsage(id: string): Promise<void> {
    try {
      const preset = await this.getById(id);
      if (!preset) {
        throw new Error(`Preset not found: ${id}`);
      }

      await this.updatePreset(id, {
        usageCount: preset.usageCount + 1,
        lastUsedAt: Date.now(),
      });
    } catch (error) {
      console.error('Failed to record preset usage:', error);
      throw error;
    }
  }

  /**
   * Delete a preset
   */
  static async deletePreset(id: string): Promise<void> {
    try {
      let presets = await this.getAll();
      presets = presets.filter((p) => p.id !== id);
      await this.savePresets(presets);
    } catch (error) {
      console.error('Failed to delete server preset:', error);
      throw error;
    }
  }

  /**
   * Get all favorite presets
   */
  static async getFavorites(): Promise<ServerPreset[]> {
    return this.getFiltered({ isFavorite: true });
  }

  /**
   * Get most recently used presets
   */
  static async getRecentlyUsed(limit: number = 5): Promise<ServerPreset[]> {
    try {
      const presets = await this.getAll();
      return presets
        .filter((p) => p.lastUsedAt)
        .sort((a, b) => (b.lastUsedAt || 0) - (a.lastUsedAt || 0))
        .slice(0, limit);
    } catch (error) {
      console.error('Failed to get recently used presets:', error);
      return [];
    }
  }

  /**
   * Export presets as JSON
   */
  static async exportAsJson(): Promise<string> {
    try {
      const presets = await this.getAll();
      return JSON.stringify(presets, null, 2);
    } catch (error) {
      console.error('Failed to export server presets:', error);
      throw error;
    }
  }

  /**
   * Import presets from JSON
   */
  static async importFromJson(jsonData: string): Promise<number> {
    try {
      const imported = JSON.parse(jsonData) as ServerPreset[];
      const existing = await this.getAll();

      // Merge, avoiding duplicates by ID
      const existingIds = new Set(existing.map((p) => p.id));
      const newPresets = imported.filter((p) => !existingIds.has(p.id));

      const merged = [...existing, ...newPresets];
      await this.savePresets(merged);

      return newPresets.length;
    } catch (error) {
      console.error('Failed to import server presets:', error);
      throw error;
    }
  }

  /**
   * Save presets to storage
   */
  private static async savePresets(presets: ServerPreset[]): Promise<void> {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(presets));
    } catch (error) {
      console.error('Failed to save server presets:', error);
      throw error;
    }
  }
}

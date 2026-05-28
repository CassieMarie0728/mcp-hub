import { useState, useCallback, useEffect } from 'react';
import {
  ServerPreset,
  ServerPresetFilter,
  ServerPresetManager,
  SERVER_PRESET_TEMPLATES,
} from '@/lib/models/ServerPreset';

export interface UseServerPresetsReturn {
  // State
  presets: ServerPreset[];
  favorites: ServerPreset[];
  recentlyUsed: ServerPreset[];
  isLoading: boolean;
  error: string | null;

  // Methods
  loadPresets: (filter?: ServerPresetFilter) => Promise<void>;
  loadFavorites: () => Promise<void>;
  loadRecentlyUsed: (limit?: number) => Promise<void>;
  createPreset: (preset: Omit<ServerPreset, 'id' | 'createdAt' | 'updatedAt'>) => Promise<ServerPreset>;
  createFromTemplate: (templateKey: string, overrides?: Partial<ServerPreset>) => Promise<ServerPreset>;
  getPreset: (id: string) => Promise<ServerPreset | null>;
  updatePreset: (id: string, updates: Partial<ServerPreset>) => Promise<ServerPreset>;
  deletePreset: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  recordUsage: (id: string) => Promise<void>;
  exportAsJson: () => Promise<string>;
  importFromJson: (jsonData: string) => Promise<number>;
  getTemplates: () => Record<string, any>;
}

/**
 * Hook for managing server presets
 */
export function useServerPresets(): UseServerPresetsReturn {
  const [presets, setPresets] = useState<ServerPreset[]>([]);
  const [favorites, setFavorites] = useState<ServerPreset[]>([]);
  const [recentlyUsed, setRecentlyUsed] = useState<ServerPreset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load presets with optional filtering
  const loadPresets = useCallback(async (filter?: ServerPresetFilter) => {
    try {
      setIsLoading(true);
      setError(null);

      let items: ServerPreset[];
      if (filter) {
        items = await ServerPresetManager.getFiltered(filter);
      } else {
        items = await ServerPresetManager.getAll();
      }

      setPresets(items);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load presets';
      setError(message);
      console.error('Error loading presets:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load favorites
  const loadFavorites = useCallback(async () => {
    try {
      setError(null);
      const items = await ServerPresetManager.getFavorites();
      setFavorites(items);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load favorites';
      setError(message);
      console.error('Error loading favorites:', err);
    }
  }, []);

  // Load recently used
  const loadRecentlyUsed = useCallback(async (limit: number = 5) => {
    try {
      setError(null);
      const items = await ServerPresetManager.getRecentlyUsed(limit);
      setRecentlyUsed(items);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load recently used';
      setError(message);
      console.error('Error loading recently used:', err);
    }
  }, []);

  // Create preset
  const createPreset = useCallback(
    async (preset: Omit<ServerPreset, 'id' | 'createdAt' | 'updatedAt'>): Promise<ServerPreset> => {
      try {
        setError(null);
        const newPreset = await ServerPresetManager.createPreset(preset);
        // Reload presets
        await loadPresets();
        return newPreset;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create preset';
        setError(message);
        console.error('Error creating preset:', err);
        throw err;
      }
    },
    [loadPresets]
  );

  // Create from template
  const createFromTemplate = useCallback(
    async (templateKey: string, overrides?: Partial<ServerPreset>): Promise<ServerPreset> => {
      try {
        setError(null);
        const newPreset = await ServerPresetManager.createFromTemplate(templateKey, overrides);
        // Reload presets
        await loadPresets();
        return newPreset;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create from template';
        setError(message);
        console.error('Error creating from template:', err);
        throw err;
      }
    },
    [loadPresets]
  );

  // Get single preset
  const getPreset = useCallback(async (id: string): Promise<ServerPreset | null> => {
    try {
      setError(null);
      return await ServerPresetManager.getById(id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get preset';
      setError(message);
      console.error('Error getting preset:', err);
      return null;
    }
  }, []);

  // Update preset
  const updatePreset = useCallback(
    async (id: string, updates: Partial<ServerPreset>): Promise<ServerPreset> => {
      try {
        setError(null);
        const updated = await ServerPresetManager.updatePreset(id, updates);
        // Reload presets
        await loadPresets();
        return updated;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update preset';
        setError(message);
        console.error('Error updating preset:', err);
        throw err;
      }
    },
    [loadPresets]
  );

  // Delete preset
  const deletePreset = useCallback(
    async (id: string) => {
      try {
        setError(null);
        await ServerPresetManager.deletePreset(id);
        // Reload presets
        await loadPresets();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete preset';
        setError(message);
        console.error('Error deleting preset:', err);
      }
    },
    [loadPresets]
  );

  // Toggle favorite
  const toggleFavorite = useCallback(
    async (id: string) => {
      try {
        setError(null);
        await ServerPresetManager.toggleFavorite(id);
        // Reload both presets and favorites
        await loadPresets();
        await loadFavorites();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to toggle favorite';
        setError(message);
        console.error('Error toggling favorite:', err);
      }
    },
    [loadPresets, loadFavorites]
  );

  // Record usage
  const recordUsage = useCallback(async (id: string) => {
    try {
      setError(null);
      await ServerPresetManager.recordUsage(id);
      // Reload recently used
      await loadRecentlyUsed();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to record usage';
      setError(message);
      console.error('Error recording usage:', err);
    }
  }, [loadRecentlyUsed]);

  // Export as JSON
  const exportAsJson = useCallback(async (): Promise<string> => {
    try {
      setError(null);
      return await ServerPresetManager.exportAsJson();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to export presets';
      setError(message);
      console.error('Error exporting presets:', err);
      throw err;
    }
  }, []);

  // Import from JSON
  const importFromJson = useCallback(
    async (jsonData: string): Promise<number> => {
      try {
        setError(null);
        const count = await ServerPresetManager.importFromJson(jsonData);
        // Reload presets
        await loadPresets();
        return count;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to import presets';
        setError(message);
        console.error('Error importing presets:', err);
        throw err;
      }
    },
    [loadPresets]
  );

  // Get templates
  const getTemplates = useCallback(() => {
    return SERVER_PRESET_TEMPLATES;
  }, []);

  // Load presets on mount
  useEffect(() => {
    loadPresets();
    loadFavorites();
    loadRecentlyUsed();
  }, [loadPresets, loadFavorites, loadRecentlyUsed]);

  return {
    presets,
    favorites,
    recentlyUsed,
    isLoading,
    error,
    loadPresets,
    loadFavorites,
    loadRecentlyUsed,
    createPreset,
    createFromTemplate,
    getPreset,
    updatePreset,
    deletePreset,
    toggleFavorite,
    recordUsage,
    exportAsJson,
    importFromJson,
    getTemplates,
  };
}

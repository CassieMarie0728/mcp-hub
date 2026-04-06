import { useCallback, useEffect, useRef, useState } from 'react';
import { NativeModules } from 'react-native';

const { MCPServerBridgeExtended } = NativeModules;

/**
 * JSON Schema type
 */
export interface JsonSchema {
  type: string;
  description?: string;
  properties?: Record<string, JsonSchema>;
  required?: string[];
  items?: JsonSchema;
  enum?: string[];
  default?: any;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  format?: string;
}

/**
 * Tool schema type
 */
export interface ToolSchema {
  name: string;
  description: string;
  inputSchema: JsonSchema;
  category?: string;
  tags?: string[];
}

/**
 * Tool discovery state
 */
export interface ToolDiscoveryState {
  serverId: string;
  tools: ToolSchema[];
  isLoading: boolean;
  error?: string;
  lastDiscoveredAt?: number;
  toolCount: number;
}

/**
 * Hook for discovering and managing tools
 */
export function useToolDiscovery() {
  const [discoveryStates, setDiscoveryStates] = useState<Map<string, ToolDiscoveryState>>(
    new Map()
  );
  const [globalError, setGlobalError] = useState<string | null>(null);
  const cacheRef = useRef<Map<string, { tools: ToolSchema[]; timestamp: number }>>(new Map());

  /**
   * Discover tools from a server
   */
  const discoverTools = useCallback(
    async (serverId: string, forceRefresh: boolean = false): Promise<ToolSchema[]> => {
      try {
        // Update loading state
        setDiscoveryStates((prev) => {
          const updated = new Map(prev);
          updated.set(serverId, {
            serverId,
            tools: updated.get(serverId)?.tools ?? [],
            isLoading: true,
            toolCount: 0,
          });
          return updated;
        });

        // Check cache first (if not forcing refresh)
        if (!forceRefresh) {
          const cached = cacheRef.current.get(serverId);
          if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
            // Cache valid for 5 minutes
            setDiscoveryStates((prev) => {
              const updated = new Map(prev);
              updated.set(serverId, {
                serverId,
                tools: cached.tools,
                isLoading: false,
                lastDiscoveredAt: cached.timestamp,
                toolCount: cached.tools.length,
              });
              return updated;
            });
            return cached.tools;
          }
        }

        // Fetch from native layer
        const result = await MCPServerBridgeExtended.discoverTools(serverId, forceRefresh);

        const tools: ToolSchema[] = result.tools || [];

        // Update cache
        cacheRef.current.set(serverId, {
          tools,
          timestamp: Date.now(),
        });

        // Update state
        setDiscoveryStates((prev) => {
          const updated = new Map(prev);
          updated.set(serverId, {
            serverId,
            tools,
            isLoading: false,
            lastDiscoveredAt: Date.now(),
            toolCount: tools.length,
          });
          return updated;
        });

        setGlobalError(null);
        return tools;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Tool discovery failed';
        setGlobalError(errorMessage);

        setDiscoveryStates((prev) => {
          const updated = new Map(prev);
          updated.set(serverId, {
            serverId,
            tools: updated.get(serverId)?.tools ?? [],
            isLoading: false,
            error: errorMessage,
            toolCount: 0,
          });
          return updated;
        });

        throw err;
      }
    },
    []
  );

  /**
   * Get tools for a server
   */
  const getTools = useCallback(
    (serverId: string): ToolSchema[] => {
      return discoveryStates.get(serverId)?.tools ?? [];
    },
    [discoveryStates]
  );

  /**
   * Search tools by name or description
   */
  const searchTools = useCallback(
    (serverId: string, query: string): ToolSchema[] => {
      const tools = getTools(serverId);
      const lowerQuery = query.toLowerCase();

      return tools.filter(
        (tool) =>
          tool.name.toLowerCase().includes(lowerQuery) ||
          tool.description.toLowerCase().includes(lowerQuery) ||
          tool.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery))
      );
    },
    [getTools]
  );

  /**
   * Filter tools by category
   */
  const filterByCategory = useCallback(
    (serverId: string, category: string): ToolSchema[] => {
      const tools = getTools(serverId);
      return tools.filter((tool) => tool.category === category);
    },
    [getTools]
  );

  /**
   * Get tool by name
   */
  const getTool = useCallback(
    (serverId: string, toolName: string): ToolSchema | undefined => {
      const tools = getTools(serverId);
      return tools.find((tool) => tool.name === toolName);
    },
    [getTools]
  );

  /**
   * Get all categories
   */
  const getCategories = useCallback(
    (serverId: string): string[] => {
      const tools = getTools(serverId);
      const categories = new Set<string>();

      tools.forEach((tool) => {
        if (tool.category) {
          categories.add(tool.category);
        }
      });

      return Array.from(categories).sort();
    },
    [getTools]
  );

  /**
   * Clear cache for a server
   */
  const clearCache = useCallback((serverId?: string) => {
    if (serverId) {
      cacheRef.current.delete(serverId);
    } else {
      cacheRef.current.clear();
    }
  }, []);

  /**
   * Get discovery state for a server
   */
  const getDiscoveryState = useCallback(
    (serverId: string): ToolDiscoveryState | undefined => {
      return discoveryStates.get(serverId);
    },
    [discoveryStates]
  );

  /**
   * Get all discovery states
   */
  const getAllDiscoveryStates = useCallback((): ToolDiscoveryState[] => {
    return Array.from(discoveryStates.values());
  }, [discoveryStates]);

  return {
    // State
    discoveryStates: Array.from(discoveryStates.values()),
    tools: Array.from(discoveryStates.values()).flatMap(state => state.tools || []), // Alias for all tools
    globalError,

    // Methods
    discoverTools,
    getTools,
    searchTools,
    filterByCategory,
    getTool,
    getCategories,
    clearCache,
    getDiscoveryState,
    getAllDiscoveryStates,
  };
}

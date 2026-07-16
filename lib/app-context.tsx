/**
 * Global app context for managing servers, tools, and settings
 */

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { MCPServer, MCPTool, ToolExecutionResult, AppSettings } from './types';
import {
  loadServers,
  saveServers,
  loadSettings,
  saveSettings,
  loadExecutionHistory,
  saveExecutionHistory,
  getDefaultSettings,
} from './storage';

interface AppContextType {
  // State
  servers: MCPServer[];
  tools: Record<string, MCPTool[]>;
  executionHistory: ToolExecutionResult[];
  settings: AppSettings;
  isLoading: boolean;

  // Server management
  addServer: (server: MCPServer) => Promise<void>;
  updateServer: (server: MCPServer) => Promise<void>;
  deleteServer: (serverId: string) => Promise<void>;
  setServerStatus: (serverId: string, status: MCPServer['status'], error?: string) => Promise<void>;

  // Tool management
  setTools: (serverId: string, tools: MCPTool[]) => Promise<void>;
  getServerTools: (serverId: string) => MCPTool[];

  // Execution history
  addExecutionResult: (result: ToolExecutionResult) => Promise<void>;
  clearExecutionHistory: () => Promise<void>;

  // Settings
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;

  // Initialization
  initialize: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

type AppAction =
  | { type: 'SET_SERVERS'; payload: MCPServer[] }
  | { type: 'ADD_SERVER'; payload: MCPServer }
  | { type: 'UPDATE_SERVER'; payload: MCPServer }
  | { type: 'DELETE_SERVER'; payload: string }
  | { type: 'SET_TOOLS'; payload: { serverId: string; tools: MCPTool[] } }
  | { type: 'SET_EXECUTION_HISTORY'; payload: ToolExecutionResult[] }
  | { type: 'ADD_EXECUTION_RESULT'; payload: ToolExecutionResult }
  | { type: 'SET_SETTINGS'; payload: AppSettings }
  | { type: 'SET_LOADING'; payload: boolean };

interface AppState {
  servers: MCPServer[];
  tools: Record<string, MCPTool[]>;
  executionHistory: ToolExecutionResult[];
  settings: AppSettings;
  isLoading: boolean;
}

const initialState: AppState = {
  servers: [],
  tools: {},
  executionHistory: [],
  settings: getDefaultSettings(),
  isLoading: true,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_SERVERS':
      return { ...state, servers: action.payload };
    case 'ADD_SERVER':
      return { ...state, servers: [...state.servers, action.payload] };
    case 'UPDATE_SERVER':
      return {
        ...state,
        servers: state.servers.map((s) => (s.id === action.payload.id ? action.payload : s)),
      };
    case 'DELETE_SERVER': {
      const { [action.payload]: _, ...remainingTools } = state.tools;
      return {
        ...state,
        servers: state.servers.filter((s) => s.id !== action.payload),
        tools: remainingTools,
      };
    }
    case 'SET_TOOLS':
      return {
        ...state,
        tools: {
          ...state.tools,
          [action.payload.serverId]: action.payload.tools,
        },
      };
    case 'SET_EXECUTION_HISTORY':
      return { ...state, executionHistory: action.payload };
    case 'ADD_EXECUTION_RESULT':
      return {
        ...state,
        executionHistory: [action.payload, ...state.executionHistory].slice(0, 100), // Keep last 100
      };
    case 'SET_SETTINGS':
      return { ...state, settings: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Initialize app state from storage
  const initialize = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const [servers, settings, history] = await Promise.all([
        loadServers(),
        loadSettings(),
        loadExecutionHistory(),
      ]);
      dispatch({ type: 'SET_SERVERS', payload: servers });
      dispatch({ type: 'SET_SETTINGS', payload: settings });
      dispatch({ type: 'SET_EXECUTION_HISTORY', payload: history });
    } catch (error) {
      console.error('Failed to initialize app:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  const addServer = useCallback(
    async (server: MCPServer) => {
      dispatch({ type: 'ADD_SERVER', payload: server });
      await saveServers([...state.servers, server]);
    },
    [state.servers],
  );

  const updateServer = useCallback(
    async (server: MCPServer) => {
      dispatch({ type: 'UPDATE_SERVER', payload: server });
      const updated = state.servers.map((s) => (s.id === server.id ? server : s));
      await saveServers(updated);
    },
    [state.servers],
  );

  const deleteServer = useCallback(
    async (serverId: string) => {
      dispatch({ type: 'DELETE_SERVER', payload: serverId });
      const updated = state.servers.filter((s) => s.id !== serverId);
      await saveServers(updated);
    },
    [state.servers],
  );

  const setServerStatus = useCallback(
    async (serverId: string, status: MCPServer['status'], error?: string) => {
      const server = state.servers.find((s) => s.id === serverId);
      if (server) {
        const updated = {
          ...server,
          status,
          error,
          lastConnected: status === 'connected' ? Date.now() : server.lastConnected,
        };
        await updateServer(updated);
      }
    },
    [state.servers, updateServer],
  );

  const setTools = useCallback(
    async (serverId: string, tools: MCPTool[]) => {
      dispatch({
        type: 'SET_TOOLS',
        payload: { serverId, tools },
      });
      // Update server tool count
      const server = state.servers.find((s) => s.id === serverId);
      if (server) {
        await updateServer({ ...server, toolCount: tools.length });
      }
    },
    [state.servers, updateServer],
  );

  const getServerTools = useCallback(
    (serverId: string) => {
      return state.tools[serverId] || [];
    },
    [state.tools],
  );

  const addExecutionResult = useCallback(
    async (result: ToolExecutionResult) => {
      dispatch({ type: 'ADD_EXECUTION_RESULT', payload: result });
      const updated = [result, ...state.executionHistory].slice(0, 100);
      await saveExecutionHistory(updated);
    },
    [state.executionHistory],
  );

  const clearExecutionHistoryFn = useCallback(async () => {
    dispatch({ type: 'SET_EXECUTION_HISTORY', payload: [] });
    await saveExecutionHistory([]);
  }, []);

  const updateSettings = useCallback(
    async (newSettings: Partial<AppSettings>) => {
      const updated = { ...state.settings, ...newSettings };
      dispatch({ type: 'SET_SETTINGS', payload: updated });
      await saveSettings(updated);
    },
    [state.settings],
  );

  const value: AppContextType = {
    servers: state.servers,
    tools: state.tools,
    executionHistory: state.executionHistory,
    settings: state.settings,
    isLoading: state.isLoading,
    addServer,
    updateServer,
    deleteServer,
    setServerStatus,
    setTools,
    getServerTools,
    addExecutionResult,
    clearExecutionHistory: clearExecutionHistoryFn,
    updateSettings,
    initialize,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}

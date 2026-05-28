/**
 * Storage utilities for persisting app data
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { MCPServer, AppSettings } from './types';

const SERVERS_KEY = 'mcp_servers';
const SETTINGS_KEY = 'mcp_settings';
const EXECUTION_HISTORY_KEY = 'mcp_execution_history';

/**
 * Load all servers from storage
 */
export async function loadServers(): Promise<MCPServer[]> {
  try {
    const data = await AsyncStorage.getItem(SERVERS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to load servers:', error);
    return [];
  }
}

/**
 * Save servers to storage
 */
export async function saveServers(servers: MCPServer[]): Promise<void> {
  try {
    await AsyncStorage.setItem(SERVERS_KEY, JSON.stringify(servers));
  } catch (error) {
    console.error('Failed to save servers:', error);
    throw error;
  }
}

/**
 * Save server credentials securely
 */
export async function saveServerCredentials(
  serverId: string,
  credentials: Record<string, string>,
): Promise<void> {
  try {
    const key = `mcp_creds_${serverId}`;
    await SecureStore.setItemAsync(key, JSON.stringify(credentials));
  } catch (error) {
    console.error('Failed to save credentials:', error);
    throw error;
  }
}

/**
 * Load server credentials securely
 */
export async function loadServerCredentials(
  serverId: string,
): Promise<Record<string, string> | null> {
  try {
    const key = `mcp_creds_${serverId}`;
    const data = await SecureStore.getItemAsync(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to load credentials:', error);
    return null;
  }
}

/**
 * Delete server credentials
 */
export async function deleteServerCredentials(serverId: string): Promise<void> {
  try {
    const key = `mcp_creds_${serverId}`;
    await SecureStore.deleteItemAsync(key);
  } catch (error) {
    console.error('Failed to delete credentials:', error);
  }
}

/**
 * Load app settings
 */
export async function loadSettings(): Promise<AppSettings> {
  try {
    const data = await AsyncStorage.getItem(SETTINGS_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return getDefaultSettings();
  } catch (error) {
    console.error('Failed to load settings:', error);
    return getDefaultSettings();
  }
}

/**
 * Save app settings
 */
export async function saveSettings(settings: AppSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save settings:', error);
    throw error;
  }
}

/**
 * Get default app settings
 */
export function getDefaultSettings(): AppSettings {
  return {
    theme: 'auto',
    executionTimeout: 30000, // 30 seconds
    executionTimeoutEnabled: true,
    logRetentionDays: 7,
    autoRefreshInterval: 0, // disabled
  };
}

/**
 * Load execution history
 */
export async function loadExecutionHistory(): Promise<any[]> {
  try {
    const data = await AsyncStorage.getItem(EXECUTION_HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to load execution history:', error);
    return [];
  }
}

/**
 * Save execution history
 */
export async function saveExecutionHistory(history: any[]): Promise<void> {
  try {
    await AsyncStorage.setItem(EXECUTION_HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Failed to save execution history:', error);
    throw error;
  }
}

/**
 * Clear all app data
 */
export async function clearAllData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([SERVERS_KEY, SETTINGS_KEY, EXECUTION_HISTORY_KEY]);
  } catch (error) {
    console.error('Failed to clear data:', error);
    throw error;
  }
}

/**
 * Clear execution history
 */
export async function clearExecutionHistory(): Promise<void> {
  try {
    await AsyncStorage.removeItem(EXECUTION_HISTORY_KEY);
  } catch (error) {
    console.error('Failed to clear execution history:', error);
    throw error;
  }
}

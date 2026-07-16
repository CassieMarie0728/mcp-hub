import { useCallback, useState } from 'react';
import { NativeModules, Platform } from 'react-native';

const { PermissionBridge } = NativeModules;

interface PermissionInfo {
  permission: string;
  description: string;
}

interface ToolPermissions {
  toolName: string;
  permissions: PermissionInfo[];
  count: number;
}

/**
 * Hook for managing Android runtime permissions
 */
export function usePermissions() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Check if specific permissions are granted
   */
  const checkPermissions = useCallback(async (permissions: string[]) => {
    if (Platform.OS !== 'android') {
      return { allGranted: true, permissions };
    }

    if (!PermissionBridge) {
      setError('PermissionBridge module not available');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await PermissionBridge.checkPermissions(permissions);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      console.error('Error checking permissions:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Request specific permissions
   */
  const requestPermissions = useCallback(async (permissions: string[]) => {
    if (Platform.OS !== 'android') {
      return { success: true };
    }

    if (!PermissionBridge) {
      setError('PermissionBridge module not available');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await PermissionBridge.requestPermissions(permissions);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      console.error('Error requesting permissions:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Check Calendar permissions
   */
  const checkCalendarPermissions = useCallback(async () => {
    if (Platform.OS !== 'android') {
      return { granted: true };
    }

    if (!PermissionBridge) {
      setError('PermissionBridge module not available');
      return null;
    }

    try {
      const result = await PermissionBridge.checkCalendarPermissions();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      console.error('Error checking calendar permissions:', err);
      return null;
    }
  }, []);

  /**
   * Check Contacts permissions
   */
  const checkContactsPermissions = useCallback(async () => {
    if (Platform.OS !== 'android') {
      return { granted: true };
    }

    if (!PermissionBridge) {
      setError('PermissionBridge module not available');
      return null;
    }

    try {
      const result = await PermissionBridge.checkContactsPermissions();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      console.error('Error checking contacts permissions:', err);
      return null;
    }
  }, []);

  /**
   * Check SMS permissions
   */
  const checkSMSPermissions = useCallback(async () => {
    if (Platform.OS !== 'android') {
      return { granted: true };
    }

    if (!PermissionBridge) {
      setError('PermissionBridge module not available');
      return null;
    }

    try {
      const result = await PermissionBridge.checkSMSPermissions();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      console.error('Error checking SMS permissions:', err);
      return null;
    }
  }, []);

  /**
   * Check Storage permissions
   */
  const checkStoragePermissions = useCallback(async () => {
    if (Platform.OS !== 'android') {
      return { granted: true };
    }

    if (!PermissionBridge) {
      setError('PermissionBridge module not available');
      return null;
    }

    try {
      const result = await PermissionBridge.checkStoragePermissions();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      console.error('Error checking storage permissions:', err);
      return null;
    }
  }, []);

  /**
   * Check Files permissions
   */
  const checkFilesPermissions = useCallback(async () => {
    if (Platform.OS !== 'android') {
      return { granted: true };
    }

    if (!PermissionBridge) {
      setError('PermissionBridge module not available');
      return null;
    }

    try {
      const result = await PermissionBridge.checkFilesPermissions();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      console.error('Error checking files permissions:', err);
      return null;
    }
  }, []);

  /**
   * Check if tool can be executed
   */
  const canExecuteTool = useCallback(async (toolName: string) => {
    if (Platform.OS !== 'android') {
      return { canExecute: true, toolName };
    }

    if (!PermissionBridge) {
      setError('PermissionBridge module not available');
      return null;
    }

    try {
      const result = await PermissionBridge.canExecuteTool(toolName);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      console.error('Error checking tool execution:', err);
      return null;
    }
  }, []);

  /**
   * Request permissions for a tool
   */
  const requestToolPermissions = useCallback(async (toolName: string) => {
    if (Platform.OS !== 'android') {
      return { success: true, toolName };
    }

    if (!PermissionBridge) {
      setError('PermissionBridge module not available');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await PermissionBridge.requestToolPermissions(toolName);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      console.error('Error requesting tool permissions:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Get required permissions for a tool
   */
  const getToolPermissions = useCallback(
    async (toolName: string): Promise<ToolPermissions | null> => {
      if (Platform.OS !== 'android') {
        return { toolName, permissions: [], count: 0 };
      }

      if (!PermissionBridge) {
        setError('PermissionBridge module not available');
        return null;
      }

      try {
        const result = await PermissionBridge.getToolPermissions(toolName);
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(errorMessage);
        console.error('Error getting tool permissions:', err);
        return null;
      }
    },
    [],
  );

  /**
   * Check and request permissions if needed
   */
  const ensureToolPermissions = useCallback(
    async (toolName: string): Promise<boolean> => {
      const canExecute = await canExecuteTool(toolName);
      if (canExecute?.canExecute) {
        return true;
      }

      await requestToolPermissions(toolName);
      return false;
    },
    [canExecuteTool, requestToolPermissions],
  );

  return {
    isLoading,
    error,
    checkPermissions,
    requestPermissions,
    checkCalendarPermissions,
    checkContactsPermissions,
    checkSMSPermissions,
    checkStoragePermissions,
    checkFilesPermissions,
    canExecuteTool,
    requestToolPermissions,
    getToolPermissions,
    ensureToolPermissions,
  };
}

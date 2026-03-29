import { useCallback, useState, useEffect } from 'react';
import { NativeModules, Platform } from 'react-native';

const { ServiceBridge } = NativeModules;

interface ServiceStatus {
  isRunning: boolean;
  serviceName?: string;
  timestamp?: number;
}

/**
 * Hook for managing MCP Server foreground service
 */
export function useForegroundService() {
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus>({ isRunning: false });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notificationVisible, setNotificationVisible] = useState(true);

  /**
   * Start foreground service
   */
  const startService = useCallback(async (showNotification: boolean = true) => {
    if (Platform.OS !== 'android') {
      setServiceStatus({ isRunning: true });
      return { success: true };
    }

    if (!ServiceBridge) {
      setError('ServiceBridge module not available');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await ServiceBridge.startService(showNotification);
      setServiceStatus({ isRunning: true });
      setNotificationVisible(showNotification);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      console.error('Error starting service:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Stop foreground service
   */
  const stopService = useCallback(async () => {
    if (Platform.OS !== 'android') {
      setServiceStatus({ isRunning: false });
      return { success: true };
    }

    if (!ServiceBridge) {
      setError('ServiceBridge module not available');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await ServiceBridge.stopService();
      setServiceStatus({ isRunning: false });
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      console.error('Error stopping service:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Toggle notification visibility
   */
  const toggleNotification = useCallback(async () => {
    if (Platform.OS !== 'android') {
      setNotificationVisible(!notificationVisible);
      return { success: true };
    }

    if (!ServiceBridge) {
      setError('ServiceBridge module not available');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await ServiceBridge.toggleNotification();
      setNotificationVisible(!notificationVisible);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      console.error('Error toggling notification:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [notificationVisible]);

  /**
   * Set notification visibility
   */
  const setNotificationVisibility = useCallback(async (visible: boolean) => {
    if (Platform.OS !== 'android') {
      setNotificationVisible(visible);
      return { success: true };
    }

    if (!ServiceBridge) {
      setError('ServiceBridge module not available');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await ServiceBridge.setNotificationVisible(visible);
      setNotificationVisible(visible);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      console.error('Error setting notification visibility:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Check if service is running
   */
  const checkServiceStatus = useCallback(async () => {
    if (Platform.OS !== 'android') {
      return { isRunning: true };
    }

    if (!ServiceBridge) {
      setError('ServiceBridge module not available');
      return null;
    }

    try {
      const status = await ServiceBridge.getServiceStatus();
      setServiceStatus(status);
      return status;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      console.error('Error checking service status:', err);
      return null;
    }
  }, []);

  /**
   * Check service status on mount
   */
  useEffect(() => {
    checkServiceStatus();
  }, [checkServiceStatus]);

  return {
    serviceStatus,
    isLoading,
    error,
    notificationVisible,
    startService,
    stopService,
    toggleNotification,
    setNotificationVisibility,
    checkServiceStatus,
  };
}

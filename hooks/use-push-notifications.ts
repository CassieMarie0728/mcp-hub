import { useEffect, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { useMCPBridgeExtended, useMCPBridgeEvents } from './use-mcp-bridge-extended';

export interface NotificationPreferences {
  toolExecutionAlerts: boolean;
  toolSuccessNotifications: boolean;
  toolErrorNotifications: boolean;
  serviceStatusAlerts: boolean;
  auditLogNotifications: boolean;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  toolExecutionAlerts: true,
  toolSuccessNotifications: true,
  toolErrorNotifications: true,
  serviceStatusAlerts: true,
  auditLogNotifications: false,
};

/**
 * Hook for managing push notifications for tool execution and service events
 */
export function usePushNotifications() {
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [isInitialized, setIsInitialized] = useState(false);
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);

  // Listen to native events for tool execution
  useMCPBridgeEvents('toolExecutionStart', (data) => {
    if (preferences.toolExecutionAlerts) {
      sendNotification({
        title: 'Tool Execution Started',
        body: `${data.toolName} on ${data.serverName}`,
        data: { type: 'tool_start', ...data },
      });
    }
  });

  useMCPBridgeEvents('toolExecutionSuccess', (data) => {
    if (preferences.toolSuccessNotifications) {
      sendNotification({
        title: '✓ Tool Execution Succeeded',
        body: `${data.toolName} completed in ${data.duration}ms`,
        data: { type: 'tool_success', ...data },
      });
    }
  });

  useMCPBridgeEvents('toolExecutionError', (data) => {
    if (preferences.toolErrorNotifications) {
      sendNotification({
        title: '✗ Tool Execution Failed',
        body: `${data.toolName}: ${data.error}`,
        data: { type: 'tool_error', ...data },
      });
    }
  });

  useMCPBridgeEvents('serviceStatusChanged', (data) => {
    if (preferences.serviceStatusAlerts) {
      sendNotification({
        title: 'Service Status Changed',
        body: `MCP Server is now ${data.isRunning ? 'online' : 'offline'}`,
        data: { type: 'service_status', ...data },
      });
    }
  });

  useEffect(() => {
    initializeNotifications();

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  const initializeNotifications = async () => {
    try {
      // Set notification handler
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });

      // Request permissions
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Notification permissions not granted');
        return;
      }

      // Listen for notifications when app is in foreground
      notificationListener.current = Notifications.addNotificationReceivedListener(
        (notification) => {
          console.log('Notification received:', notification);
        }
      );

      // Listen for notification responses (user tapped notification)
      responseListener.current = Notifications.addNotificationResponseReceivedListener(
        (response) => {
          handleNotificationResponse(response);
        }
      );

      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
    }
  };

  const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
    const { notification } = response;
    const data = notification.request.content.data;

    // Handle different notification types
    switch (data.type) {
      case 'tool_success':
      case 'tool_error':
        // Navigate to audit log
        console.log('Navigate to audit log:', data);
        break;
      case 'service_status':
        // Navigate to service control
        console.log('Navigate to service control:', data);
        break;
      default:
        break;
    }
  };

  const sendNotification = async (options: {
    title: string;
    body: string;
    data?: Record<string, any>;
  }) => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: options.title,
          body: options.body,
          sound: 'default',
          badge: 1,
          data: options.data || {},
        },
        trigger: null, // Send immediately
      });
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  };

  const updatePreferences = (newPreferences: Partial<NotificationPreferences>) => {
    setPreferences((prev) => ({
      ...prev,
      ...newPreferences,
    }));
  };

  const sendTestNotification = async () => {
    await sendNotification({
      title: 'Test Notification',
      body: 'This is a test notification from MCP Hub',
      data: { type: 'test' },
    });
  };

  return {
    isInitialized,
    preferences,
    updatePreferences,
    sendNotification,
    sendTestNotification,
  };
}

/**
 * Hook for tool execution notifications (called from bridge)
 */
export function useToolExecutionNotifications() {
  const { sendNotification } = usePushNotifications();

  const notifyToolStart = (toolName: string, serverName: string) => {
    sendNotification({
      title: '⚙️ Running Tool',
      body: `${toolName} on ${serverName}`,
      data: { type: 'tool_start', toolName, serverName },
    });
  };

  const notifyToolSuccess = (toolName: string, duration: number) => {
    sendNotification({
      title: '✅ Tool Succeeded',
      body: `${toolName} completed in ${duration}ms`,
      data: { type: 'tool_success', toolName, duration },
    });
  };

  const notifyToolError = (toolName: string, error: string) => {
    sendNotification({
      title: '❌ Tool Failed',
      body: `${toolName}: ${error}`,
      data: { type: 'tool_error', toolName, error },
    });
  };

  return {
    notifyToolStart,
    notifyToolSuccess,
    notifyToolError,
  };
}

/**
 * Hook for service status notifications
 */
export function useServiceStatusNotifications() {
  const { sendNotification } = usePushNotifications();

  const notifyServiceStarted = () => {
    sendNotification({
      title: '🟢 Service Online',
      body: 'MCP Server is now running',
      data: { type: 'service_started' },
    });
  };

  const notifyServiceStopped = () => {
    sendNotification({
      title: '🔴 Service Offline',
      body: 'MCP Server has stopped',
      data: { type: 'service_stopped' },
    });
  };

  const notifyServiceError = (error: string) => {
    sendNotification({
      title: '⚠️ Service Error',
      body: error,
      data: { type: 'service_error', error },
    });
  };

  return {
    notifyServiceStarted,
    notifyServiceStopped,
    notifyServiceError,
  };
}

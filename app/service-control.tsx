import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useRouter } from 'expo-router';
import { useState, useLayoutEffect, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useColors } from '@/hooks/use-colors';
import { useForegroundService } from '@/hooks/use-foreground-service';

interface ServiceStatus {
  isRunning: boolean;
  notificationEnabled: boolean;
  uptime: number;
  connectionsActive: number;
  toolsExposed: number;
}

export default function ServiceControlScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const colors = useColors();
  const { startService, stopService, toggleNotification, getServiceStatus } =
    useForegroundService();
  const [status, setStatus] = useState<ServiceStatus>({
    isRunning: false,
    notificationEnabled: true,
    uptime: 0,
    connectionsActive: 0,
    toolsExposed: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: 'Service Control',
      headerTitleStyle: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.foreground,
      },
      headerStyle: {
        backgroundColor: colors.background,
        borderBottomColor: colors.border,
        borderBottomWidth: 1,
      },
      headerLeft: () => (
        <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 16 }}>
          <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <View style={{ marginRight: 16 }}>
          <MaterialIcons
            name={status.isRunning ? 'cloud-done' : 'cloud-off'}
            size={24}
            color={status.isRunning ? colors.success : colors.error}
          />
        </View>
      ),
    });
  }, [navigation, colors, status.isRunning]);

  useEffect(() => {
    loadServiceStatus();
    const interval = setInterval(loadServiceStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadServiceStatus = async () => {
    try {
      const currentStatus = await getServiceStatus();
      setStatus(currentStatus);
    } catch (error) {
      console.error('Failed to load service status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartService = async () => {
    setIsLoading(true);
    try {
      await startService();
      await loadServiceStatus();
      Alert.alert('Success', 'MCP Server service started');
    } catch (error: any) {
      Alert.alert('Error', `Failed to start service: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopService = async () => {
    Alert.alert('Stop Service?', 'This will stop the MCP server and disconnect all clients.', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Stop',
        onPress: async () => {
          setIsLoading(true);
          try {
            await stopService();
            await loadServiceStatus();
            Alert.alert('Success', 'MCP Server service stopped');
          } catch (error: any) {
            Alert.alert('Error', `Failed to stop service: ${error.message}`);
          } finally {
            setIsLoading(false);
          }
        },
      },
    ]);
  };

  const handleToggleNotification = async () => {
    try {
      await toggleNotification(!status.notificationEnabled);
      setStatus({ ...status, notificationEnabled: !status.notificationEnabled });
    } catch (error: any) {
      Alert.alert('Error', `Failed to toggle notification: ${error.message}`);
    }
  };

  const formatUptime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  return (
    <ScreenContainer className="p-0">
      <ScrollView className="flex-1 px-6 pt-6">
        {/* Service Status Card */}
        <View
          className={`rounded-lg p-6 mb-6 border ${
            status.isRunning
              ? 'bg-success/10 border-success'
              : 'bg-error/10 border-error'
          }`}
        >
          <View className="flex-row items-center gap-3 mb-4">
            <View
              className={`w-12 h-12 rounded-full items-center justify-center ${
                status.isRunning ? 'bg-success/20' : 'bg-error/20'
              }`}
            >
              <MaterialIcons
                name={status.isRunning ? 'cloud-done' : 'cloud-off'}
                size={24}
                color={status.isRunning ? colors.success : colors.error}
              />
            </View>
            <View>
              <Text className="text-lg font-bold text-foreground">
                {status.isRunning ? 'Service Running' : 'Service Stopped'}
              </Text>
              <Text className="text-sm text-muted">
                {status.isRunning ? 'MCP server is active' : 'MCP server is offline'}
              </Text>
            </View>
          </View>
        </View>

        {/* Status Details */}
        <View className="bg-surface border border-border rounded-lg p-4 mb-6">
          <View className="flex-row items-center justify-between mb-4 pb-4 border-b border-border">
            <Text className="text-sm text-muted">Uptime</Text>
            <Text className="text-sm font-semibold text-foreground">
              {formatUptime(status.uptime)}
            </Text>
          </View>
          <View className="flex-row items-center justify-between mb-4 pb-4 border-b border-border">
            <Text className="text-sm text-muted">Active Connections</Text>
            <Text className="text-sm font-semibold text-foreground">{status.connectionsActive}</Text>
          </View>
          <View className="flex-row items-center justify-between">
            <Text className="text-sm text-muted">Tools Exposed</Text>
            <Text className="text-sm font-semibold text-foreground">{status.toolsExposed}</Text>
          </View>
        </View>

        {/* Notification Toggle */}
        <View className="bg-surface border border-border rounded-lg p-4 mb-6 flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-foreground font-semibold">Persistent Notification</Text>
            <Text className="text-xs text-muted mt-1">
              {status.notificationEnabled
                ? 'Notification is visible in status bar'
                : 'Notification is hidden'}
            </Text>
          </View>
          <Switch
            value={status.notificationEnabled}
            onValueChange={handleToggleNotification}
            disabled={isLoading}
            trackColor={{ false: colors.border, true: colors.primary + '40' }}
            thumbColor={status.notificationEnabled ? colors.primary : colors.muted}
          />
        </View>

        {/* Control Buttons */}
        <View className="gap-3 mb-12">
          {status.isRunning ? (
            <TouchableOpacity
              onPress={handleStopService}
              disabled={isLoading}
              className="bg-error rounded-lg py-4 items-center justify-center flex-row gap-2"
            >
              {isLoading ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <>
                  <MaterialIcons name="stop-circle" size={20} color={colors.background} />
                  <Text className="text-background font-semibold">Stop Service</Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleStartService}
              disabled={isLoading}
              className="bg-success rounded-lg py-4 items-center justify-center flex-row gap-2"
            >
              {isLoading ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <>
                  <MaterialIcons name="play-circle" size={20} color={colors.background} />
                  <Text className="text-background font-semibold">Start Service</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Info Box */}
        <View className="bg-primary/10 rounded-lg p-4 border border-primary/20 mb-6">
          <View className="flex-row gap-2">
            <MaterialIcons name="info" size={16} color={colors.primary} />
            <Text className="text-xs text-muted flex-1">
              The MCP server runs as a foreground service to maintain connectivity with external
              AI clients. You can toggle the notification visibility without affecting service
              operation.
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  Alert,
  Switch,
  RefreshControl,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useRouter } from 'expo-router';
import { useState, useLayoutEffect, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/use-colors';
import { useMCPBridgeExtended, type ServiceStatus } from '@/hooks/use-mcp-bridge-extended';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function ServiceControlScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const colors = useColors();
  const {
    getServiceStatus,
    startMCPService,
    stopMCPService,
    toggleServiceNotification,
  } = useMCPBridgeExtended();
  const [status, setStatus] = useState<ServiceStatus>({
    isRunning: false,
    notificationEnabled: true,
    uptime: 0,
    connectionsActive: 0,
    toolsExposed: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isActionInProgress, setIsActionInProgress] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  useEffect(() => {
    loadServiceStatus();
    const interval = setInterval(loadServiceStatus, 5000);
    return () => clearInterval(interval);
  }, [getServiceStatus]);

  const loadServiceStatus = async () => {
    try {
      const currentStatus = await getServiceStatus();
      setStatus(currentStatus);
    } catch (error) {
      console.error('Failed to load service status:', error);
      Alert.alert('Error', 'Failed to load service status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadServiceStatus();
    setRefreshing(false);
  };

  const handleStartService = async () => {
    setIsActionInProgress(true);
    try {
      await startMCPService();
      setStatus((prev) => ({ ...prev, isRunning: true }));
      Alert.alert('Success', 'MCP Service started');
    } catch (error) {
      console.error('Failed to start service:', error);
      Alert.alert('Error', 'Failed to start service');
    } finally {
      setIsActionInProgress(false);
    }
  };

  const handleStopService = async () => {
    Alert.alert('Stop Service', 'Are you sure you want to stop the MCP Service?', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Stop',
        onPress: async () => {
          setIsActionInProgress(true);
          try {
            await stopMCPService();
            setStatus((prev) => ({ ...prev, isRunning: false }));
            Alert.alert('Success', 'MCP Service stopped');
          } catch (error) {
            console.error('Failed to stop service:', error);
            Alert.alert('Error', 'Failed to stop service');
          } finally {
            setIsActionInProgress(false);
          }
        },
      },
    ]);
  };

  const handleToggleNotification = async () => {
    try {
      await toggleServiceNotification(!status.notificationEnabled);
      setStatus((prev) => ({
        ...prev,
        notificationEnabled: !prev.notificationEnabled,
      }));
    } catch (error) {
      console.error('Failed to toggle notification:', error);
      Alert.alert('Error', 'Failed to toggle notification');
    }
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <ScreenContainer className="p-0">
      {/* Header */}
      <View className={`${status.isRunning ? 'bg-gradient-to-b from-success to-success/80' : 'bg-gradient-to-b from-error to-error/80'} px-6 pt-6 pb-8`}>
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-1">
            <Text className="text-4xl font-bold text-background">Service Control</Text>
            <Text className="text-sm text-background/80 mt-2">
              {status.isRunning ? 'Service is running' : 'Service is offline'}
            </Text>
          </View>
          <TouchableOpacity onPress={() => router.back()} className="p-2">
            <Ionicons name="close" size={28} color={colors.background} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-6 pt-6"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Status Card */}
        <Card variant="elevated" className="mb-6">
          <View className="items-center gap-4">
            <View
              className={`w-16 h-16 rounded-full items-center justify-center ${
                status.isRunning ? 'bg-success/20' : 'bg-error/20'
              }`}
            >
              <Ionicons
                name={status.isRunning ? 'checkmark-circle' : 'close-circle'}
                size={40}
                color={status.isRunning ? colors.success : colors.error}
              />
            </View>
            <View className="items-center gap-1">
              <Text className="text-2xl font-bold text-foreground">
                {status.isRunning ? 'Running' : 'Stopped'}
              </Text>
              <Text className="text-sm text-muted">
                {status.isRunning ? `Uptime: ${formatUptime(status.uptime)}` : 'Not available'}
              </Text>
            </View>
          </View>
        </Card>

        {/* Stats Grid */}
        <View className="flex-row gap-3 mb-6">
          <Card variant="outlined" className="flex-1">
            <View className="items-center gap-2">
              <Ionicons name="git-network" size={24} color={colors.primary} />
              <Text className="text-2xl font-bold text-foreground">{status.connectionsActive}</Text>
              <Text className="text-xs text-muted text-center">Active Connections</Text>
            </View>
          </Card>

          <Card variant="outlined" className="flex-1">
            <View className="items-center gap-2">
              <Ionicons name="hammer" size={24} color={colors.primary} />
              <Text className="text-2xl font-bold text-foreground">{status.toolsExposed}</Text>
              <Text className="text-xs text-muted text-center">Tools Exposed</Text>
            </View>
          </Card>
        </View>

        {/* Controls */}
        <Card variant="elevated" className="mb-6">
          <CardHeader title="Service Controls" />
          <CardContent className="gap-4">
            {status.isRunning ? (
              <Button
                variant="destructive"
                size="large"
                onPress={handleStopService}
                disabled={isActionInProgress}
                loading={isActionInProgress}
              >
                Stop Service
              </Button>
            ) : (
              <Button
                variant="primary"
                size="large"
                onPress={handleStartService}
                disabled={isActionInProgress}
                loading={isActionInProgress}
              >
                Start Service
              </Button>
            )}
          </CardContent>
        </Card>        {/* Service Status */}
        <Card variant="outlined" className="mb-6">
          <CardHeader title="Service Status" />
          <CardContent>
            <View className="flex-row items-center justify-between">
              <View className="flex-1 gap-1">
                <Text className="text-base font-semibold text-foreground">Service Alerts</Text>
                <Text className="text-sm text-muted">Receive notifications for service events</Text>
              </View>
              <Switch
                value={status.notificationEnabled}
                onValueChange={handleToggleNotification}
                trackColor={{ false: colors.border, true: colors.success }}
                thumbColor={status.notificationEnabled ? colors.background : colors.muted}
              />
            </View>
          </CardContent>
        </Card>
      </ScrollView>
    </ScreenContainer>
  );
}

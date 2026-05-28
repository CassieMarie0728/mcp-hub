import React, { useState, useCallback, useEffect } from 'react';
import {
  ScrollView,
  Text,
  View,
  TextInput,
  Pressable,
  ActivityIndicator,
  FlatList,
  Alert,
  Platform,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';
import { useMCPBridge } from '@/lib/hooks/useMCPBridge';

/**
 * Updated Server Connection Screen
 * Connects to MCP servers using the Kotlin bridge
 */
export default function ServerConnectionUpdatedScreen() {
  const colors = useColors();
  const {
    isReady,
    error,
    setError,
    connectionStatus,
    connectToServer,
    disconnectServer,
    getConnectionStatus,
  } = useMCPBridge();

  // Form state
  const [formData, setFormData] = useState({
    serverId: '',
    host: 'localhost',
    port: 3001,
    transport: 'http' as 'http' | 'websocket' | 'sse' | 'stdio',
    authToken: '',
    timeout: 30000,
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectedServers, setConnectedServers] = useState<string[]>([]);

  // Validate form
  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.serverId.trim()) {
      errors.serverId = 'Server ID is required';
    }

    if (!formData.host.trim()) {
      errors.host = 'Host is required';
    }

    if (formData.port < 1 || formData.port > 65535) {
      errors.port = 'Port must be between 1 and 65535';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  // Handle connect
  const handleConnect = useCallback(async () => {
    if (!validateForm() || !isReady) {
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const success = await connectToServer({
        serverId: formData.serverId,
        host: formData.host,
        port: formData.port,
        transport: formData.transport,
        authToken: formData.authToken || undefined,
        timeout: formData.timeout,
      });

      if (success) {
        Alert.alert('Success', `Connected to ${formData.serverId}`);
        setConnectedServers((prev) => [...new Set([...prev, formData.serverId])]);
        setFormData({
          serverId: '',
          host: 'localhost',
          port: 3001,
          transport: 'http',
          authToken: '',
          timeout: 30000,
        });
      } else {
        Alert.alert('Connection Failed', error || 'Failed to connect to server');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      Alert.alert('Connection Error', errorMsg);
    } finally {
      setIsConnecting(false);
    }
  }, [formData, validateForm, isReady, connectToServer, error, setError]);

  // Handle disconnect
  const handleDisconnect = useCallback(
    async (serverId: string) => {
      try {
        const success = await disconnectServer(serverId);
        if (success) {
          setConnectedServers((prev) => prev.filter((id) => id !== serverId));
          Alert.alert('Success', `Disconnected from ${serverId}`);
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        Alert.alert('Disconnect Error', errorMsg);
      }
    },
    [disconnectServer]
  );

  // Check if bridge is ready
  useEffect(() => {
    if (!isReady && Platform.OS === 'android') {
      Alert.alert('Warning', 'MCP Bridge not ready. Ensure you are on Android.');
    }
  }, [isReady]);

  return (
    <ScreenContainer className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="p-4">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-foreground mb-2">Connect to MCP Server</Text>
          <Text className="text-sm text-muted">
            {isReady ? 'Bridge Ready' : 'Bridge Loading...'}
          </Text>
        </View>

        {/* Error Display */}
        {error && (
          <View className="mb-4 p-3 bg-error rounded-lg">
            <Text className="text-sm text-background font-semibold">{error}</Text>
            <Pressable
              onPress={() => setError(null)}
              className="mt-2"
            >
              <Text className="text-xs text-background underline">Dismiss</Text>
            </Pressable>
          </View>
        )}

        {/* Connection Form */}
        <View className="mb-6 bg-surface rounded-lg p-4">
          <Text className="text-lg font-semibold text-foreground mb-4">New Connection</Text>

          {/* Server ID */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-foreground mb-2">Server ID</Text>
            <TextInput
              placeholder="e.g., filesystem-server"
              placeholderTextColor={colors.muted}
              value={formData.serverId}
              onChangeText={(text) => setFormData((prev) => ({ ...prev, serverId: text }))}
              className="bg-background text-foreground p-3 rounded-lg border border-border"
              editable={!isConnecting}
            />
            {validationErrors.serverId && (
              <Text className="text-xs text-error mt-1">{validationErrors.serverId}</Text>
            )}
          </View>

          {/* Host */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-foreground mb-2">Host</Text>
            <TextInput
              placeholder="localhost or IP address"
              placeholderTextColor={colors.muted}
              value={formData.host}
              onChangeText={(text) => setFormData((prev) => ({ ...prev, host: text }))}
              className="bg-background text-foreground p-3 rounded-lg border border-border"
              editable={!isConnecting}
            />
            {validationErrors.host && (
              <Text className="text-xs text-error mt-1">{validationErrors.host}</Text>
            )}
          </View>

          {/* Port */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-foreground mb-2">Port</Text>
            <TextInput
              placeholder="3001"
              placeholderTextColor={colors.muted}
              value={String(formData.port)}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, port: parseInt(text) || 3001 }))
              }
              className="bg-background text-foreground p-3 rounded-lg border border-border"
              keyboardType="number-pad"
              editable={!isConnecting}
            />
            {validationErrors.port && (
              <Text className="text-xs text-error mt-1">{validationErrors.port}</Text>
            )}
          </View>

          {/* Transport */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-foreground mb-2">Transport</Text>
            <View className="flex-row gap-2">
              {(['http', 'websocket', 'sse', 'stdio'] as const).map((t) => (
                <Pressable
                  key={t}
                  onPress={() => setFormData((prev) => ({ ...prev, transport: t }))}
                  className={cn(
                    'px-3 py-2 rounded-lg border',
                    formData.transport === t
                      ? 'bg-primary border-primary'
                      : 'bg-background border-border'
                  )}
                >
                  <Text
                    className={cn(
                      'text-xs font-medium',
                      formData.transport === t ? 'text-background' : 'text-foreground'
                    )}
                  >
                    {t.toUpperCase()}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Advanced Options */}
          <Pressable
            onPress={() => setShowAdvanced(!showAdvanced)}
            className="mb-4"
          >
            <Text className="text-sm font-medium text-primary">
              {showAdvanced ? '▼ Hide Advanced' : '▶ Show Advanced'}
            </Text>
          </Pressable>

          {showAdvanced && (
            <>
              {/* Auth Token */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-foreground mb-2">Auth Token (Optional)</Text>
                <TextInput
                  placeholder="Bearer token"
                  placeholderTextColor={colors.muted}
                  value={formData.authToken}
                  onChangeText={(text) => setFormData((prev) => ({ ...prev, authToken: text }))}
                  className="bg-background text-foreground p-3 rounded-lg border border-border"
                  secureTextEntry
                  editable={!isConnecting}
                />
              </View>

              {/* Timeout */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-foreground mb-2">Timeout (ms)</Text>
                <TextInput
                  placeholder="30000"
                  placeholderTextColor={colors.muted}
                  value={String(formData.timeout)}
                  onChangeText={(text) =>
                    setFormData((prev) => ({ ...prev, timeout: parseInt(text) || 30000 }))
                  }
                  className="bg-background text-foreground p-3 rounded-lg border border-border"
                  keyboardType="number-pad"
                  editable={!isConnecting}
                />
              </View>
            </>
          )}

          {/* Connect Button */}
          <Pressable
            onPress={handleConnect}
            disabled={isConnecting || !isReady}
            className={cn(
              'p-4 rounded-lg items-center justify-center',
              isConnecting || !isReady ? 'bg-muted' : 'bg-primary'
            )}
          >
            {isConnecting ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text className="text-base font-semibold text-background">Connect</Text>
            )}
          </Pressable>
        </View>

        {/* Connected Servers */}
        {connectedServers.length > 0 && (
          <View className="bg-surface rounded-lg p-4">
            <Text className="text-lg font-semibold text-foreground mb-4">Connected Servers</Text>
            <FlatList
              scrollEnabled={false}
              data={connectedServers}
              keyExtractor={(item) => item}
              renderItem={({ item: serverId }) => (
                <View className="mb-3 p-3 bg-background rounded-lg flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-foreground">{serverId}</Text>
                    <Text className="text-xs text-muted">
                      Status: {connectionStatus[serverId] || 'unknown'}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => handleDisconnect(serverId)}
                    className="px-3 py-2 bg-error rounded"
                  >
                    <Text className="text-xs font-medium text-background">Disconnect</Text>
                  </Pressable>
                </View>
              )}
            />
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

import {
  ScrollView,
  Text,
  View,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useState, useCallback, useEffect } from 'react';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';
import {
  useMCPServerConnection,
  ServerConnectionConfig,
  TransportType,
  ConnectionStatus,
} from '@/lib/hooks/useMCPServerConnection';

/**
 * Server Connection Screen
 * Allows users to connect to MCP servers via HTTP, WebSocket, or Stdio
 */
export default function ServerConnectionScreen() {
  const colors = useColors();
  const { connectToServer, connections, isLoading, error } = useMCPServerConnection();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    host: 'localhost',
    port: 3000,
    transport: TransportType.HTTP,
    isSecure: false,
    authToken: '',
    connectionTimeoutMs: 30000,
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  /**
   * Validate form data
   */
  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Server name is required';
    }

    if (!formData.host.trim()) {
      errors.host = 'Host is required';
    } else if (
      !/^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$|^localhost$|^127\.0\.0\.1$/.test(
        formData.host,
      )
    ) {
      errors.host = 'Invalid host format';
    }

    if (formData.port < 1 || formData.port > 65535) {
      errors.port = 'Port must be between 1 and 65535';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  /**
   * Handle connect button press
   */
  const handleConnect = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    const config: ServerConnectionConfig = {
      id: `${formData.host}:${formData.port}`,
      name: formData.name,
      host: formData.host,
      port: formData.port,
      transport: formData.transport,
      isSecure: formData.isSecure,
      authToken: formData.authToken || undefined,
      connectionTimeoutMs: formData.connectionTimeoutMs,
    };

    const success = await connectToServer(config);

    if (success) {
      Alert.alert('Success', `Connected to ${formData.name}`);
      setFormData({
        name: '',
        host: 'localhost',
        port: 3000,
        transport: TransportType.HTTP,
        isSecure: false,
        authToken: '',
        connectionTimeoutMs: 30000,
      });
    } else {
      Alert.alert('Connection Failed', error || 'Failed to connect to server');
    }
  }, [formData, validateForm, connectToServer, error]);

  /**
   * Render form field
   */
  const renderField = (
    label: string,
    value: string | number,
    onChangeText: (text: string) => void,
    placeholder: string = '',
    keyboardType: 'default' | 'numeric' | 'email-address' = 'default',
    error?: string,
  ) => (
    <View className="mb-4">
      <Text className="text-sm font-semibold text-foreground mb-2">{label}</Text>
      <TextInput
        className={cn(
          'px-4 py-3 rounded-lg border text-foreground',
          error ? 'border-error bg-error/10' : 'border-border bg-surface',
        )}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        value={String(value)}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        editable={!isLoading}
      />
      {error && <Text className="text-xs text-error mt-1">{error}</Text>}
    </View>
  );

  /**
   * Render transport selector
   */
  const renderTransportSelector = () => (
    <View className="mb-4">
      <Text className="text-sm font-semibold text-foreground mb-2">Transport Type</Text>
      <View className="flex-row gap-2">
        {Object.values(TransportType).map((transport) => (
          <Pressable
            key={transport}
            onPress={() => setFormData((prev) => ({ ...prev, transport }))}
            className={cn(
              'flex-1 py-3 px-4 rounded-lg border-2',
              formData.transport === transport
                ? 'border-primary bg-primary/10'
                : 'border-border bg-surface',
            )}
          >
            <Text
              className={cn(
                'text-center font-semibold text-sm',
                formData.transport === transport ? 'text-primary' : 'text-foreground',
              )}
            >
              {transport}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );

  /**
   * Render connection list
   */
  const renderConnectionsList = () => (
    <View className="mt-8 pt-8 border-t border-border">
      <Text className="text-lg font-bold text-foreground mb-4">Active Connections</Text>

      {connections.length === 0 ? (
        <Text className="text-muted text-center py-8">No active connections</Text>
      ) : (
        <View className="gap-3">
          {connections.map((conn) => (
            <View
              key={conn.id}
              className={cn(
                'p-4 rounded-lg border',
                conn.isConnected ? 'border-success bg-success/5' : 'border-error bg-error/5',
              )}
            >
              <View className="flex-row items-center justify-between mb-2">
                <Text className="font-semibold text-foreground">{conn.name}</Text>
                <View
                  className={cn(
                    'px-2 py-1 rounded-full',
                    conn.isConnected ? 'bg-success/20' : 'bg-error/20',
                  )}
                >
                  <Text
                    className={cn(
                      'text-xs font-semibold',
                      conn.isConnected ? 'text-success' : 'text-error',
                    )}
                  >
                    {conn.status}
                  </Text>
                </View>
              </View>
              <Text className="text-xs text-muted">{conn.id}</Text>
              {conn.error && <Text className="text-xs text-error mt-2">{conn.error}</Text>}
            </View>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {/* Header */}
        <View className="mb-8">
          <Text className="text-3xl font-bold text-foreground mb-2">Connect to Server</Text>
          <Text className="text-muted">Add a new MCP server connection</Text>
        </View>

        {/* Error Alert */}
        {error && (
          <View className="mb-4 p-4 bg-error/10 border border-error rounded-lg">
            <Text className="text-error text-sm">{error}</Text>
          </View>
        )}

        {/* Form */}
        <View className="bg-surface rounded-lg p-6 mb-6 border border-border">
          {renderField('Server Name', formData.name, (text) =>
            setFormData((prev) => ({ ...prev, name: text })),
          )}

          {renderTransportSelector()}

          {renderField(
            'Host',
            formData.host,
            (text) => setFormData((prev) => ({ ...prev, host: text })),
            'localhost or IP address',
          )}

          {renderField(
            'Port',
            formData.port,
            (text) => setFormData((prev) => ({ ...prev, port: parseInt(text) || 0 })),
            '3000',
            'numeric',
          )}

          {/* Advanced Options */}
          <Pressable
            onPress={() => setShowAdvanced(!showAdvanced)}
            className="py-3 mb-4 flex-row items-center justify-between"
          >
            <Text className="font-semibold text-foreground">Advanced Options</Text>
            <Text className="text-primary">{showAdvanced ? '−' : '+'}</Text>
          </Pressable>

          {showAdvanced && (
            <View className="border-t border-border pt-4">
              {renderField(
                'Auth Token (Optional)',
                formData.authToken,
                (text) => setFormData((prev) => ({ ...prev, authToken: text })),
                'Bearer token or API key',
              )}

              {renderField(
                'Connection Timeout (ms)',
                formData.connectionTimeoutMs,
                (text) =>
                  setFormData((prev) => ({
                    ...prev,
                    connectionTimeoutMs: parseInt(text) || 30000,
                  })),
                '30000',
                'numeric',
              )}

              <View className="flex-row items-center justify-between py-3">
                <Text className="font-semibold text-foreground">
                  Use Secure Connection (HTTPS/WSS)
                </Text>
                <Pressable
                  onPress={() => setFormData((prev) => ({ ...prev, isSecure: !prev.isSecure }))}
                  className={cn(
                    'w-12 h-7 rounded-full flex items-center justify-start p-1',
                    formData.isSecure ? 'bg-primary' : 'bg-border',
                  )}
                >
                  <View
                    className={cn(
                      'w-5 h-5 rounded-full bg-background transition-all',
                      formData.isSecure ? 'translate-x-5' : 'translate-x-0',
                    )}
                  />
                </Pressable>
              </View>
            </View>
          )}

          {/* Connect Button */}
          <Pressable
            onPress={handleConnect}
            disabled={isLoading}
            className={cn(
              'py-4 px-6 rounded-lg flex-row items-center justify-center mt-6',
              isLoading ? 'bg-primary/50' : 'bg-primary',
            )}
          >
            {isLoading ? (
              <>
                <ActivityIndicator color={colors.background} size="small" />
                <Text className="text-background font-semibold ml-2">Connecting...</Text>
              </>
            ) : (
              <Text className="text-background font-semibold">Connect to Server</Text>
            )}
          </Pressable>
        </View>

        {/* Active Connections */}
        {renderConnectionsList()}
      </ScrollView>
    </ScreenContainer>
  );
}

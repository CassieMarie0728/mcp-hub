import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useApp } from '@/lib/app-context';
import { useRouter } from 'expo-router';
import { useState, useLayoutEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useColors } from '@/hooks/use-colors';
import { MCPServer } from '@/lib/types';
import { useMCPService } from '@/hooks/use-mcp-service';

type ConnectionType = 'stdio' | 'sse' | 'websocket';

export default function AddServerScreen() {
  const navigation = useNavigation();
  const { addServer } = useApp();
  const { connectServer } = useMCPService();
  const router = useRouter();
  const colors = useColors();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: 'Add Server',
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
          <MaterialIcons name="add-circle" size={24} color={colors.primary} />
        </View>
      ),
    });
  }, [navigation, colors]);

  const [serverName, setServerName] = useState('');
  const [description, setDescription] = useState('');
  const [connectionType, setConnectionType] = useState<ConnectionType>('stdio');
  const [command, setCommand] = useState('');
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAddServer = async () => {
    if (!serverName.trim()) {
      Alert.alert('Error', 'Please enter a server name');
      return;
    }

    if (connectionType === 'stdio' && !command.trim()) {
      Alert.alert('Error', 'Please enter a command for stdio connection');
      return;
    }

    if ((connectionType === 'sse' || connectionType === 'websocket') && !url.trim()) {
      Alert.alert('Error', 'Please enter a URL for HTTP connection');
      return;
    }

    setIsLoading(true);

    try {
      const newServer: MCPServer = {
        id: Date.now().toString(),
        name: serverName.trim(),
        description: description.trim() || undefined,
        connectionType,
        connectionDetails: {
          command: connectionType === 'stdio' ? command.trim() : undefined,
          url: connectionType !== 'stdio' ? url.trim() : undefined,
        },
        status: 'connecting',
        toolCount: 0,
        createdAt: Date.now(),
      };

      await addServer(newServer);

      try {
        await connectServer(newServer);
        Alert.alert('Success', 'Server connected and tools discovered!', [
          {
            text: 'OK',
            onPress: () => router.push('/(tabs)/servers' as any),
          },
        ]);
      } catch (connectError) {
        Alert.alert(
          'Partial Success',
          'Server was added but connection failed. You can try connecting again later.',
          [
            {
              text: 'OK',
              onPress: () => router.push('/(tabs)/servers' as any),
            },
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to add server. Please try again.');
      console.error('Failed to add server:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenContainer className="p-0">
      {/* Header */}
      <View className="bg-primary px-6 pt-6 pb-6 flex-row items-center justify-between">
        <View>
          <Text className="text-3xl font-bold text-background">Add Server</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/(tabs)/servers' as any)}>
          <MaterialIcons name="close" size={24} color={colors.background} />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-6 pt-6">
        {/* Server Name */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-foreground mb-2">Server Name *</Text>
          <TextInput
            className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
            placeholder="e.g., My Weather API"
            placeholderTextColor={colors.muted}
            value={serverName}
            onChangeText={setServerName}
            editable={!isLoading}
          />
        </View>

        {/* Description */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-foreground mb-2">Description</Text>
          <TextInput
            className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
            placeholder="Optional description"
            placeholderTextColor={colors.muted}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            editable={!isLoading}
          />
        </View>

        {/* Connection Type */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-foreground mb-3">Connection Type *</Text>
          <View className="gap-2">
            {(['stdio', 'sse', 'websocket'] as const).map((type) => (
              <TouchableOpacity
                key={type}
                onPress={() => setConnectionType(type)}
                className={`border rounded-lg px-4 py-3 flex-row items-center gap-3 ${
                  connectionType === type
                    ? 'bg-primary/10 border-primary'
                    : 'bg-surface border-border'
                }`}
                disabled={isLoading}
              >
                <View
                  className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
                    connectionType === type
                      ? 'bg-primary border-primary'
                      : 'border-border'
                  }`}
                >
                  {connectionType === type && (
                    <View className="w-2 h-2 bg-background rounded-full" />
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-foreground font-medium capitalize">{type}</Text>
                  <Text className="text-xs text-muted mt-1">
                    {type === 'stdio'
                      ? 'Local process via stdin/stdout'
                      : type === 'sse'
                        ? 'HTTP with Server-Sent Events'
                        : 'WebSocket connection'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Connection Details */}
        {connectionType === 'stdio' ? (
          <View className="mb-6">
            <Text className="text-sm font-semibold text-foreground mb-2">Command *</Text>
            <TextInput
              className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
              placeholder="e.g., node /path/to/server.js"
              placeholderTextColor={colors.muted}
              value={command}
              onChangeText={setCommand}
              editable={!isLoading}
            />
            <Text className="text-xs text-muted mt-2">
              The command to start your MCP server process
            </Text>
          </View>
        ) : (
          <View className="mb-6">
            <Text className="text-sm font-semibold text-foreground mb-2">Server URL *</Text>
            <TextInput
              className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
              placeholder="e.g., https://api.example.com/mcp"
              placeholderTextColor={colors.muted}
              value={url}
              onChangeText={setUrl}
              autoCapitalize="none"
              editable={!isLoading}
            />
            <Text className="text-xs text-muted mt-2">
              The URL of your remote MCP server
            </Text>
          </View>
        )}

        {/* Info Box */}
        <View className="bg-primary/10 rounded-lg p-4 border border-primary/20 mb-6">
          <View className="flex-row gap-2">
            <MaterialIcons name="info" size={16} color={colors.primary} />
            <Text className="text-xs text-muted flex-1">
              MCP servers expose tools that can be discovered and executed. Ensure your server is
              properly configured and accessible before adding.
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="flex-row gap-3 mb-12">
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/servers' as any)}
            className="flex-1 bg-surface border border-border rounded-lg py-3 items-center justify-center"
            disabled={isLoading}
          >
            <Text className="text-foreground font-semibold">Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleAddServer}
            className="flex-1 bg-primary rounded-lg py-3 items-center justify-center flex-row gap-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <>
                <MaterialIcons name="add" size={20} color={colors.background} />
                <Text className="text-background font-semibold">Add Server</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

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
import * as DocumentPicker from 'expo-document-picker';

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
  const [headers, setHeaders] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [jsonPaste, setJsonPaste] = useState('');
  const [showJsonPaste, setShowJsonPaste] = useState(false);

  const handleJsonPaste = () => {
    try {
      const config = JSON.parse(jsonPaste);
      if (!config.name || !config.connectionType) {
        Alert.alert('Invalid Config', 'Config must have name and connectionType');
        return;
      }
      setServerName(config.name || '');
      setDescription(config.description || '');
      setConnectionType(config.connectionType || 'stdio');
      setCommand(config.command || '');
      setUrl(config.url || '');
      setHeaders(config.headers || {});
      setJsonPaste('');
      setShowJsonPaste(false);
      Alert.alert('Success', 'Config loaded from JSON');
    } catch (error: any) {
      Alert.alert('Invalid JSON', error.message);
    }
  };

  const handleImportJSON = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.type === 'success') {
        const fileUri = result.uri;
        const fileContent = await fetch(fileUri).then(r => r.text());
        const config = JSON.parse(fileContent);

        if (!config.name || !config.connectionType) {
          Alert.alert('Invalid Config', 'Config must have name and connectionType');
          return;
        }

        setServerName(config.name || '');
        setDescription(config.description || '');
        setConnectionType(config.connectionType || 'stdio');
        setCommand(config.command || '');
        setUrl(config.url || '');
        setHeaders(config.headers || {});

        Alert.alert('Success', 'Server config imported successfully');
      }
    } catch (error: any) {
      Alert.alert('Error', `Failed to import config: ${error.message}`);
    }
  };

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
        headers,
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

        {/* JSON Paste Section */}
        <TouchableOpacity
          onPress={() => setShowJsonPaste(!showJsonPaste)}
          className="bg-surface border border-border rounded-lg p-4 mb-6 flex-row items-center justify-between"
        >
          <View className="flex-row items-center gap-2 flex-1">
            <MaterialIcons name="code" size={20} color={colors.primary} />
            <Text className="text-foreground font-semibold">Paste JSON Config</Text>
          </View>
          <MaterialIcons
            name={showJsonPaste ? 'expand-less' : 'expand-more'}
            size={20}
            color={colors.muted}
          />
        </TouchableOpacity>

        {showJsonPaste && (
          <View className="mb-6">
            <Text className="text-xs text-muted mb-2">Paste your server config as JSON:</Text>
            <TextInput
              className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
              placeholder='{"name": "My Server", "connectionType": "sse", "url": "..."}'
              placeholderTextColor={colors.muted}
              value={jsonPaste}
              onChangeText={setJsonPaste}
              multiline
              numberOfLines={6}
              editable={!isLoading}
            />
            <TouchableOpacity
              onPress={handleJsonPaste}
              className="bg-primary rounded-lg py-2 items-center justify-center mt-2"
              disabled={isLoading || !jsonPaste.trim()}
            >
              <Text className="text-background font-semibold text-sm">Load from JSON</Text>
            </TouchableOpacity>
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
        <View className="gap-3 mb-12">
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/servers' as any)}
              className="flex-1 bg-surface border border-border rounded-lg py-3 items-center justify-center"
              disabled={isLoading}
            >
              <Text className="text-foreground font-semibold text-sm">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleImportJSON}
              className="flex-1 bg-surface border border-border rounded-lg py-3 items-center justify-center flex-row gap-2"
              disabled={isLoading}
            >
              <MaterialIcons name="upload" size={18} color={colors.primary} />
              <Text className="text-foreground font-semibold text-sm">Import</Text>
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
                  <MaterialIcons name="add" size={18} color={colors.background} />
                  <Text className="text-background font-semibold text-sm">Add</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

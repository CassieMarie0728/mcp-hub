import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useApp } from '@/lib/app-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useLayoutEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useColors } from '@/hooks/use-colors';
import { MCPServer } from '@/lib/types';
import { useMCPService } from '@/hooks/use-mcp-service';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
const documentDirectory = FileSystem.documentDirectory || FileSystem.cacheDirectory;

type ConnectionType = 'stdio' | 'sse' | 'websocket';

interface HeaderPair {
  key: string;
  value: string;
  id: string;
}

export default function EditServerScreen() {
  const navigation = useNavigation();
  const { id } = useLocalSearchParams();
  const { servers, updateServer } = useApp();
  const { connectServer } = useMCPService();
  const router = useRouter();
  const colors = useColors();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: 'Edit Server',
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
          <MaterialIcons name="edit" size={24} color={colors.primary} />
        </View>
      ),
    });
  }, [navigation, colors]);

  const server = servers.find((s) => s.id === id);

  const [serverName, setServerName] = useState('');
  const [description, setDescription] = useState('');
  const [connectionType, setConnectionType] = useState<ConnectionType>('stdio');
  const [command, setCommand] = useState('');
  const [url, setUrl] = useState('');
  const [headers, setHeaders] = useState<HeaderPair[]>([]);
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
      const headerPairs = Object.entries(config.headers || {}).map(([key, value]: any, idx) => ({
        id: `${Date.now()}-${idx}`,
        key,
        value,
      }));
      setHeaders(headerPairs);
      setJsonPaste('');
      setShowJsonPaste(false);
      Alert.alert('Success', 'Config loaded from JSON');
    } catch (error: any) {
      Alert.alert('Invalid JSON', error.message);
    }
  };

  const handleExportJSON = async () => {
    if (!server) return;
    try {
      const config = {
        name: serverName,
        description,
        connectionType,
        command: connectionType === 'stdio' ? command : undefined,
        url: connectionType !== 'stdio' ? url : undefined,
        headers: headers.reduce((acc, h) => ({ ...acc, [h.key]: h.value }), {}),
      };
      const json = JSON.stringify(config, null, 2);
      const fileUri = `${documentDirectory}${serverName}-config.json`;
      await FileSystem.writeAsStringAsync(fileUri, json);
      await Sharing.shareAsync(fileUri);
    } catch (error: any) {
      Alert.alert('Error', `Failed to export config: ${error.message}`);
    }
  };

  const handleImportJSON = async () => {
    try {
      const result = (await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      })) as any;

      if (result.type === 'success') {
        const fileUri = result.uri;
        const fileContent = await fetch(fileUri).then((r) => r.text());
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

        const headerPairs = Object.entries(config.headers || {}).map(([key, value]: any, idx) => ({
          id: `${Date.now()}-${idx}`,
          key,
          value,
        }));
        setHeaders(headerPairs);

        Alert.alert('Success', 'Server config imported successfully');
      }
    } catch (error: any) {
      Alert.alert('Error', `Failed to import config: ${error.message}`);
    }
  };

  useEffect(() => {
    if (server) {
      setServerName(server.name);
      setDescription(server.description || '');
      setConnectionType(server.connectionType);
      setCommand(server.connectionDetails.command || '');
      setUrl(server.connectionDetails.url || '');

      // Convert headers object to array
      if (server.connectionDetails.headers) {
        const headerArray = Object.entries(server.connectionDetails.headers).map(
          ([key, value], index) => ({
            id: `${index}`,
            key,
            value,
          }),
        );
        setHeaders(headerArray);
      }
    }
  }, [server]);

  if (!server) {
    return (
      <ScreenContainer className="p-0 items-center justify-center">
        <MaterialIcons name="error-outline" size={48} color={colors.error} />
        <Text className="text-foreground font-semibold mt-4">Server Not Found</Text>
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/servers' as any)}
          className="mt-6 bg-primary px-6 py-3 rounded-lg"
        >
          <Text className="text-background font-semibold">Back to Servers</Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  const handleAddHeader = () => {
    setHeaders([...headers, { id: Date.now().toString(), key: '', value: '' }]);
  };

  const handleRemoveHeader = (id: string) => {
    setHeaders(headers.filter((h) => h.id !== id));
  };

  const handleUpdateHeader = (id: string, field: 'key' | 'value', value: string) => {
    setHeaders(headers.map((h) => (h.id === id ? { ...h, [field]: value } : h)));
  };

  const handleSaveServer = async () => {
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
      // Convert headers array back to object
      const headersObj: Record<string, string> = {};
      headers.forEach((h) => {
        if (h.key.trim()) {
          headersObj[h.key.trim()] = h.value;
        }
      });

      const updatedServer: MCPServer = {
        ...server,
        name: serverName.trim(),
        description: description.trim() || undefined,
        connectionType,
        connectionDetails: {
          command: connectionType === 'stdio' ? command.trim() : undefined,
          url: connectionType !== 'stdio' ? url.trim() : undefined,
          headers: Object.keys(headersObj).length > 0 ? headersObj : undefined,
        },
      };

      await updateServer(updatedServer);

      // Try to reconnect with new settings
      try {
        await connectServer(updatedServer);
        Alert.alert('Success', 'Server updated and reconnected!', [
          {
            text: 'OK',
            onPress: () => router.push('/(tabs)/servers' as any),
          },
        ]);
      } catch (connectError) {
        Alert.alert(
          'Partial Success',
          'Server was updated but connection failed. You can try connecting again later.',
          [
            {
              text: 'OK',
              onPress: () => router.push('/(tabs)/servers' as any),
            },
          ],
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update server. Please try again.');
      console.error('Failed to update server:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderHeaderInput = ({ item }: { item: HeaderPair }) => (
    <View className="bg-surface rounded-lg p-3 border border-border mb-2">
      <View className="flex-row gap-2 mb-2">
        <TextInput
          className="flex-1 bg-background border border-border rounded px-2 py-2 text-foreground text-sm"
          placeholder="Header name"
          placeholderTextColor={colors.muted}
          value={item.key}
          onChangeText={(value) => handleUpdateHeader(item.id, 'key', value)}
          editable={!isLoading}
        />
        <TouchableOpacity
          onPress={() => handleRemoveHeader(item.id)}
          className="px-3 py-2 bg-error/10 rounded"
          disabled={isLoading}
        >
          <MaterialIcons name="delete" size={18} color={colors.error} />
        </TouchableOpacity>
      </View>
      <TextInput
        className="w-full bg-background border border-border rounded px-2 py-2 text-foreground text-sm"
        placeholder="Header value"
        placeholderTextColor={colors.muted}
        value={item.value}
        onChangeText={(value) => handleUpdateHeader(item.id, 'value', value)}
        editable={!isLoading}
      />
    </View>
  );

  return (
    <ScreenContainer className="p-0">
      {/* Header */}
      <View className="bg-primary px-6 pt-6 pb-6 flex-row items-center justify-between">
        <View>
          <Text className="text-3xl font-bold text-background">Edit Server</Text>
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
                    connectionType === type ? 'bg-primary border-primary' : 'border-border'
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
            <Text className="text-xs text-muted mt-2">The URL of your remote MCP server</Text>
          </View>
        )}

        {/* Headers */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-sm font-semibold text-foreground">Authentication Headers</Text>
            <TouchableOpacity
              onPress={handleAddHeader}
              disabled={isLoading}
              className="flex-row items-center gap-1 bg-primary/10 px-3 py-1 rounded"
            >
              <MaterialIcons name="add" size={16} color={colors.primary} />
              <Text className="text-xs text-primary font-semibold">Add</Text>
            </TouchableOpacity>
          </View>

          {headers.length > 0 ? (
            <FlatList
              data={headers}
              renderItem={renderHeaderInput}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          ) : (
            <Text className="text-xs text-muted italic">No headers added</Text>
          )}

          <Text className="text-xs text-muted mt-2">
            Add custom headers for authentication (e.g., Authorization, X-API-Key)
          </Text>
        </View>

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
              Changes will be saved and the server will attempt to reconnect with the new settings.
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
              onPress={handleExportJSON}
              className="flex-1 bg-surface border border-border rounded-lg py-3 items-center justify-center flex-row gap-2"
              disabled={isLoading}
            >
              <MaterialIcons name="download" size={18} color={colors.primary} />
              <Text className="text-foreground font-semibold text-sm">Export</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSaveServer}
              className="flex-1 bg-primary rounded-lg py-3 items-center justify-center flex-row gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <>
                  <MaterialIcons name="save" size={18} color={colors.background} />
                  <Text className="text-background font-semibold text-sm">Save</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

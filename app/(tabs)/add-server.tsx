import { ScrollView, Text, View, TouchableOpacity, Alert } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useApp } from '@/lib/app-context';
import { useRouter } from 'expo-router';
import { useState, useLayoutEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/use-colors';
import { MCPServer } from '@/lib/types';
import { useMCPService } from '@/hooks/use-mcp-service';
import * as DocumentPicker from 'expo-document-picker';
import { Button, ButtonGroup } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input, Select, Toggle } from '@/components/ui/input';
import { ListItem } from '@/components/ui/list';

type ConnectionType = 'stdio' | 'sse' | 'websocket';

export default function AddServerScreen() {
  const navigation = useNavigation();
  const { addServer } = useApp();
  const { connectServer } = useMCPService();
  const router = useRouter();
  const colors = useColors();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const [serverName, setServerName] = useState('');
  const [description, setDescription] = useState('');
  const [connectionType, setConnectionType] = useState<ConnectionType>('stdio');
  const [command, setCommand] = useState('');
  const [url, setUrl] = useState('');
  const [headers, setHeaders] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [jsonPaste, setJsonPaste] = useState('');
  const [showJsonPaste, setShowJsonPaste] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleJsonPaste = () => {
    try {
      const config = JSON.parse(jsonPaste);
      if (!config.name || !config.connectionType) {
        setErrors({ json: 'Config must have name and connectionType' });
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
      setErrors({});
      Alert.alert('Success', 'Config loaded from JSON');
    } catch (error: any) {
      setErrors({ json: error.message });
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
        setHeaders(config.headers || {});
        setErrors({});

        Alert.alert('Success', 'Server config imported successfully');
      }
    } catch (error: any) {
      Alert.alert('Error', `Failed to import config: ${error.message}`);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!serverName.trim()) {
      newErrors.serverName = 'Server name is required';
    }

    if (connectionType === 'stdio' && !command.trim()) {
      newErrors.command = 'Command is required for stdio connection';
    }

    if ((connectionType === 'sse' || connectionType === 'websocket') && !url.trim()) {
      newErrors.url = 'URL is required for HTTP connection';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddServer = async () => {
    if (!validateForm()) return;

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
          ],
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
      <View className="bg-gradient-to-b from-primary to-primary/80 px-6 pt-6 pb-8 flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-4xl font-bold text-background">Add Server</Text>
          <Text className="text-sm text-background/80 mt-2">
            Configure a new MCP server connection
          </Text>
        </View>
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <Ionicons name="close" size={28} color={colors.background} />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-6 pt-6 pb-8">
        {/* Step Indicator */}
        <View className="flex-row items-center gap-2 mb-8">
          <View className="flex-1 h-1 bg-primary rounded-full" />
          <Text className="text-xs font-semibold text-primary">Step 1 of 3</Text>
          <View className="flex-1 h-1 bg-border rounded-full" />
        </View>

        {/* Server Details Card */}
        <Card variant="elevated" className="mb-6">
          <CardHeader title="Server Details" subtitle="Basic information about your server" />
          <CardContent className="gap-4">
            <Input
              label="Server Name"
              placeholder="e.g., My Weather API"
              value={serverName}
              onChangeText={setServerName}
              error={errors.serverName}
              disabled={isLoading}
            />

            <Input
              label="Description (Optional)"
              placeholder="What does this server do?"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              disabled={isLoading}
            />
          </CardContent>
        </Card>

        {/* Connection Type Card */}
        <Card variant="elevated" className="mb-6">
          <CardHeader title="Connection Type" subtitle="How to connect to your server" />
          <CardContent className="gap-3">
            {(['stdio', 'sse', 'websocket'] as const).map((type) => (
              <TouchableOpacity
                key={type}
                onPress={() => {
                  setConnectionType(type);
                  setErrors({ ...errors, command: '', url: '' });
                }}
                disabled={isLoading}
                className={`border rounded-lg p-4 flex-row items-center gap-3 ${
                  connectionType === type
                    ? 'bg-primary/10 border-primary border-2'
                    : 'bg-surface border-border'
                }`}
              >
                <View
                  className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                    connectionType === type ? 'bg-primary border-primary' : 'border-border'
                  }`}
                >
                  {connectionType === type && (
                    <View className="w-3 h-3 bg-background rounded-full" />
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-foreground font-semibold capitalize">{type}</Text>
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
          </CardContent>
        </Card>

        {/* Connection Details Card */}
        <Card variant="elevated" className="mb-6">
          <CardHeader
            title={connectionType === 'stdio' ? 'Command' : 'Server URL'}
            subtitle={
              connectionType === 'stdio'
                ? 'The command to start your server'
                : 'The URL of your remote server'
            }
          />
          <CardContent>
            {connectionType === 'stdio' ? (
              <Input
                variant="text"
                placeholder="e.g., node /path/to/server.js"
                value={command}
                onChangeText={setCommand}
                error={errors.command}
                disabled={isLoading}
              />
            ) : (
              <Input
                variant="text"
                placeholder="e.g., https://api.example.com/mcp"
                value={url}
                onChangeText={setUrl}
                error={errors.url}
                disabled={isLoading}
              />
            )}
          </CardContent>
        </Card>

        {/* JSON Import Card */}
        <Card
          variant="outlined"
          interactive
          onPress={() => setShowJsonPaste(!showJsonPaste)}
          className="mb-6"
        >
          <View className="flex-row items-center justify-between gap-3">
            <View className="flex-row items-center gap-3 flex-1">
              <View className="w-10 h-10 rounded-lg bg-primary/10 items-center justify-center">
                <Ionicons name="code" size={20} color={colors.primary} />
              </View>
              <View className="flex-1">
                <Text className="text-foreground font-semibold">Import from JSON</Text>
                <Text className="text-xs text-muted mt-1">Paste or upload a config file</Text>
              </View>
            </View>
            <Ionicons
              name={showJsonPaste ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={colors.muted}
            />
          </View>

          {showJsonPaste && (
            <View className="mt-4 pt-4 border-t border-border gap-3">
              <Input
                variant="text"
                placeholder="Paste JSON config here..."
                value={jsonPaste}
                onChangeText={setJsonPaste}
                multiline
                numberOfLines={4}
                error={errors.json}
              />
              <ButtonGroup direction="row" gap={2}>
                <Button
                  variant="secondary"
                  className="flex-1"
                  onPress={handleImportJSON}
                  disabled={isLoading}
                >
                  Upload File
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  onPress={handleJsonPaste}
                  disabled={!jsonPaste.trim() || isLoading}
                >
                  Load Config
                </Button>
              </ButtonGroup>
            </View>
          )}
        </Card>

        {/* Action Buttons */}
        <ButtonGroup direction="column" gap={3}>
          <Button
            variant="primary"
            size="large"
            onPress={handleAddServer}
            loading={isLoading}
            disabled={isLoading}
          >
            Add Server
          </Button>
          <Button
            variant="secondary"
            size="large"
            onPress={() => router.back()}
            disabled={isLoading}
          >
            Cancel
          </Button>
        </ButtonGroup>
      </ScrollView>
    </ScreenContainer>
  );
}

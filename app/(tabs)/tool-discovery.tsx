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
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';
import { useMCPBridge } from '@/lib/hooks/useMCPBridge';

interface Tool {
  name: string;
  description: string;
  inputSchema?: {
    type: string;
    properties?: Record<string, any>;
    required?: string[];
  };
}

/**
 * Updated Tool Discovery Screen
 * Discovers tools from connected MCP servers using the Kotlin bridge
 */
export default function ToolDiscoveryUpdatedScreen() {
  const colors = useColors();
  const { isReady, error, setError, discoveredTools, discoverTools } = useMCPBridge();

  // UI State
  const [selectedServerId, setSelectedServerId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [tools, setTools] = useState<Tool[]>([]);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);

  // Handle discover tools
  const handleDiscoverTools = useCallback(async () => {
    if (!selectedServerId || !isReady) {
      Alert.alert('Error', 'Please select a server and ensure bridge is ready');
      return;
    }

    setIsDiscovering(true);
    setError(null);

    try {
      const result = await discoverTools(selectedServerId);
      if (result && Array.isArray(result)) {
        setTools(result);
        Alert.alert('Success', `Discovered ${result.length} tools`);
      } else {
        Alert.alert('Error', 'Failed to discover tools');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      Alert.alert('Discovery Error', errorMsg);
    } finally {
      setIsDiscovering(false);
    }
  }, [selectedServerId, isReady, discoverTools, setError]);

  // Filter tools by search query
  const filteredTools = tools.filter((tool) =>
    tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tool.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Render tool card
  const renderToolCard = ({ item: tool }: { item: Tool }) => (
    <Pressable
      onPress={() => setSelectedTool(tool)}
      className="mb-3 p-4 bg-surface rounded-lg border border-border"
    >
      <Text className="text-base font-semibold text-foreground mb-1">{tool.name}</Text>
      <Text className="text-sm text-muted mb-2">{tool.description || 'No description'}</Text>
      {tool.inputSchema?.properties && (
        <Text className="text-xs text-muted">
          Parameters: {Object.keys(tool.inputSchema.properties).join(', ')}
        </Text>
      )}
    </Pressable>
  );

  return (
    <ScreenContainer className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="p-4">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-foreground mb-2">Discover Tools</Text>
          <Text className="text-sm text-muted">
            {isReady ? 'Bridge Ready' : 'Bridge Loading...'}
          </Text>
        </View>

        {/* Error Display */}
        {error && (
          <View className="mb-4 p-3 bg-error rounded-lg">
            <Text className="text-sm text-background font-semibold">{error}</Text>
            <Pressable onPress={() => setError(null)} className="mt-2">
              <Text className="text-xs text-background underline">Dismiss</Text>
            </Pressable>
          </View>
        )}

        {/* Server Selection */}
        <View className="mb-6 bg-surface rounded-lg p-4">
          <Text className="text-lg font-semibold text-foreground mb-4">Select Server</Text>

          <TextInput
            placeholder="Enter server ID (e.g., filesystem-server)"
            placeholderTextColor={colors.muted}
            value={selectedServerId}
            onChangeText={setSelectedServerId}
            className="bg-background text-foreground p-3 rounded-lg border border-border mb-4"
            editable={!isDiscovering}
          />

          <Pressable
            onPress={handleDiscoverTools}
            disabled={isDiscovering || !isReady || !selectedServerId}
            className={cn(
              'p-4 rounded-lg items-center justify-center',
              isDiscovering || !isReady || !selectedServerId ? 'bg-muted' : 'bg-primary'
            )}
          >
            {isDiscovering ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text className="text-base font-semibold text-background">Discover Tools</Text>
            )}
          </Pressable>
        </View>

        {/* Search */}
        {tools.length > 0 && (
          <View className="mb-4">
            <TextInput
              placeholder="Search tools..."
              placeholderTextColor={colors.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="bg-surface text-foreground p-3 rounded-lg border border-border"
            />
          </View>
        )}

        {/* Tools List */}
        {tools.length > 0 ? (
          <View className="mb-4">
            <Text className="text-lg font-semibold text-foreground mb-4">
              Tools ({filteredTools.length})
            </Text>
            <FlatList
              scrollEnabled={false}
              data={filteredTools}
              keyExtractor={(item) => item.name}
              renderItem={renderToolCard}
            />
          </View>
        ) : isDiscovering ? (
          <View className="items-center justify-center py-8">
            <ActivityIndicator size="large" color={colors.primary} />
            <Text className="text-sm text-muted mt-4">Discovering tools...</Text>
          </View>
        ) : (
          <View className="items-center justify-center py-8">
            <Text className="text-sm text-muted">No tools discovered yet</Text>
            <Text className="text-xs text-muted mt-2">Select a server and tap Discover Tools</Text>
          </View>
        )}

        {/* Tool Details */}
        {selectedTool && (
          <View className="mt-6 p-4 bg-surface rounded-lg border border-primary">
            <Pressable onPress={() => setSelectedTool(null)} className="mb-4">
              <Text className="text-sm font-medium text-primary">✕ Close</Text>
            </Pressable>
            <Text className="text-lg font-semibold text-foreground mb-2">{selectedTool.name}</Text>
            <Text className="text-sm text-muted mb-4">{selectedTool.description}</Text>
            {selectedTool.inputSchema && (
              <>
                <Text className="text-sm font-medium text-foreground mb-2">Parameters:</Text>
                <Text className="text-xs text-muted font-mono">
                  {JSON.stringify(selectedTool.inputSchema, null, 2)}
                </Text>
              </>
            )}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

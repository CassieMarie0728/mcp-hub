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
import { useState, useCallback, useEffect } from 'react';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';
import { useToolDiscovery, ToolSchema } from '@/lib/hooks/useToolDiscovery';
import { useMCPServerConnection } from '@/lib/hooks/useMCPServerConnection';

/**
 * Tool Discovery Screen
 * Browse, search, and filter available tools from connected MCP servers
 */
export default function ToolDiscoveryScreen() {
  const colors = useColors();
  const { discoveryStates, globalError, discoverTools, searchTools, getCategories } =
    useToolDiscovery();
  const { connections } = useMCPServerConnection();

  // UI State
  const [selectedServerId, setSelectedServerId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState<ToolSchema | null>(null);
  const [isDiscovering, setIsDiscovering] = useState(false);

  // Auto-select first connected server
  useEffect(() => {
    if (!selectedServerId && connections.length > 0) {
      const connectedServer = connections.find((c) => c.isConnected);
      if (connectedServer) {
        setSelectedServerId(connectedServer.id);
      }
    }
  }, [connections, selectedServerId]);

  // Auto-discover tools when server is selected
  useEffect(() => {
    if (selectedServerId) {
      handleDiscoverTools();
    }
  }, [selectedServerId]);

  /**
   * Handle discover tools button press
   */
  const handleDiscoverTools = useCallback(async () => {
    if (!selectedServerId) {
      Alert.alert('Error', 'Please select a server first');
      return;
    }

    setIsDiscovering(true);
    try {
      await discoverTools(selectedServerId, false);
    } catch (err) {
      Alert.alert('Discovery Failed', err instanceof Error ? err.message : 'Failed to discover tools');
    } finally {
      setIsDiscovering(false);
    }
  }, [selectedServerId, discoverTools]);

  /**
   * Get current discovery state
   */
  const currentDiscoveryState = selectedServerId
    ? discoveryStates.find((state) => state.serverId === selectedServerId)
    : null;

  /**
   * Get filtered tools
   */
  const getFilteredTools = useCallback((): ToolSchema[] => {
    if (!currentDiscoveryState) return [];

    let tools = currentDiscoveryState.tools;

    // Filter by search query
    if (searchQuery.trim()) {
      tools = tools.filter(
        (tool) =>
          tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tool.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory) {
      tools = tools.filter((tool) => tool.category === selectedCategory);
    }

    return tools;
  }, [currentDiscoveryState, searchQuery, selectedCategory]);

  const filteredTools = getFilteredTools();
  const categories = selectedServerId
    ? currentDiscoveryState?.tools.reduce((acc, tool) => {
        if (tool.category && !acc.includes(tool.category)) {
          acc.push(tool.category);
        }
        return acc;
      }, [] as string[])
    : [];

  /**
   * Render server selector
   */
  const renderServerSelector = () => (
    <View className="mb-6">
      <Text className="text-sm font-semibold text-foreground mb-2">Select Server</Text>
      <FlatList
        horizontal
        data={connections.filter((c) => c.isConnected)}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => {
              setSelectedServerId(item.id);
              setSelectedCategory(null);
              setSearchQuery('');
            }}
            className={cn(
              'py-2 px-4 rounded-full border-2 mr-2',
              selectedServerId === item.id
                ? 'border-primary bg-primary/10'
                : 'border-border bg-surface'
            )}
          >
            <Text
              className={cn(
                'text-sm font-semibold',
                selectedServerId === item.id ? 'text-primary' : 'text-foreground'
              )}
            >
              {item.name}
            </Text>
          </Pressable>
        )}
        scrollEnabled={true}
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );

  /**
   * Render search bar
   */
  const renderSearchBar = () => (
    <View className="mb-4">
      <TextInput
        className="px-4 py-3 rounded-lg border border-border bg-surface text-foreground"
        placeholder="Search tools..."
        placeholderTextColor={colors.muted}
        value={searchQuery}
        onChangeText={setSearchQuery}
        editable={!isDiscovering}
      />
    </View>
  );

  /**
   * Render category filter
   */
  const renderCategoryFilter = () => {
    if (categories.length === 0) return null;

    return (
      <View className="mb-4">
        <Text className="text-xs font-semibold text-muted uppercase mb-2">Categories</Text>
        <FlatList
          horizontal
          data={categories}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => setSelectedCategory(selectedCategory === item ? null : item)}
              className={cn(
                'py-1 px-3 rounded-full border mr-2',
                selectedCategory === item
                  ? 'border-primary bg-primary/20'
                  : 'border-border bg-surface'
              )}
            >
              <Text
                className={cn(
                  'text-xs font-semibold',
                  selectedCategory === item ? 'text-primary' : 'text-foreground'
                )}
              >
                {item}
              </Text>
            </Pressable>
          )}
          scrollEnabled={true}
          showsHorizontalScrollIndicator={false}
        />
      </View>
    );
  };

  /**
   * Render tool item
   */
  const renderToolItem = (tool: ToolSchema) => (
    <Pressable
      key={tool.name}
      onPress={() => setSelectedTool(tool)}
      className={cn(
        'p-4 rounded-lg border mb-3',
        selectedTool?.name === tool.name ? 'border-primary bg-primary/5' : 'border-border bg-surface'
      )}
    >
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-1">
          <Text className="font-semibold text-foreground text-base">{tool.name}</Text>
          {tool.category && (
            <Text className="text-xs text-muted mt-1">{tool.category}</Text>
          )}
        </View>
      </View>
      <Text className="text-sm text-foreground/80 leading-relaxed">{tool.description}</Text>
      {tool.tags && tool.tags.length > 0 && (
        <View className="flex-row flex-wrap gap-1 mt-3">
          {tool.tags.slice(0, 3).map((tag) => (
            <View key={tag} className="bg-primary/10 px-2 py-1 rounded">
              <Text className="text-xs text-primary">{tag}</Text>
            </View>
          ))}
          {tool.tags.length > 3 && (
            <Text className="text-xs text-muted self-center">+{tool.tags.length - 3}</Text>
          )}
        </View>
      )}
    </Pressable>
  );

  /**
   * Render tool details panel
   */
  const renderToolDetails = () => {
    if (!selectedTool) return null;

    return (
      <View className="mt-6 p-4 bg-surface rounded-lg border border-primary">
        <Text className="text-lg font-bold text-foreground mb-2">{selectedTool.name}</Text>
        <Text className="text-sm text-foreground/80 mb-4">{selectedTool.description}</Text>

        {selectedTool.inputSchema && (
          <View className="mb-4">
            <Text className="text-sm font-semibold text-foreground mb-2">Parameters</Text>
            <View className="bg-background/50 p-3 rounded">
              <Text className="text-xs font-mono text-muted">
                {JSON.stringify(selectedTool.inputSchema, null, 2).substring(0, 200)}...
              </Text>
            </View>
          </View>
        )}

        <Pressable className="py-3 px-4 bg-primary rounded-lg">
          <Text className="text-background font-semibold text-center">Execute Tool</Text>
        </Pressable>
      </View>
    );
  };

  /**
   * Render loading state
   */
  if (currentDiscoveryState?.isLoading) {
    return (
      <ScreenContainer className="p-6 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="text-foreground mt-4">Discovering tools...</Text>
      </ScreenContainer>
    );
  }

  /**
   * Render empty state
   */
  if (!selectedServerId) {
    return (
      <ScreenContainer className="p-6 items-center justify-center">
        <Text className="text-foreground text-center text-lg font-semibold mb-2">
          No Connected Servers
        </Text>
        <Text className="text-muted text-center">
          Please connect to an MCP server first to discover tools
        </Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-foreground mb-2">Discover Tools</Text>
          <Text className="text-muted">Browse available tools from your MCP servers</Text>
        </View>

        {/* Error Alert */}
        {globalError && (
          <View className="mb-4 p-4 bg-error/10 border border-error rounded-lg">
            <Text className="text-error text-sm">{globalError}</Text>
          </View>
        )}

        {/* Server Selector */}
        {renderServerSelector()}

        {/* Refresh Button */}
        <Pressable
          onPress={handleDiscoverTools}
          disabled={isDiscovering}
          className={cn(
            'py-3 px-4 rounded-lg mb-4',
            isDiscovering ? 'bg-primary/50' : 'bg-primary'
          )}
        >
          <Text className="text-background font-semibold text-center">
            {isDiscovering ? 'Discovering...' : 'Refresh Tools'}
          </Text>
        </Pressable>

        {/* Search Bar */}
        {renderSearchBar()}

        {/* Category Filter */}
        {renderCategoryFilter()}

        {/* Tools List */}
        <View className="flex-1">
          {filteredTools.length === 0 ? (
            <View className="py-8 items-center">
              <Text className="text-muted text-center">
                {searchQuery || selectedCategory
                  ? 'No tools match your search'
                  : 'No tools available'}
              </Text>
            </View>
          ) : (
            <View>
              <Text className="text-sm font-semibold text-muted mb-3">
                {filteredTools.length} tool{filteredTools.length !== 1 ? 's' : ''}
              </Text>
              {filteredTools.map(renderToolItem)}
            </View>
          )}
        </View>

        {/* Tool Details */}
        {renderToolDetails()}
      </ScrollView>
    </ScreenContainer>
  );
}

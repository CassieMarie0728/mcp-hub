import { ScrollView, View, Text, Pressable, ActivityIndicator, TextInput } from 'react-native';
import { useState, useMemo } from 'react';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';
import { trpc } from '@/lib/trpc';
import { MaterialIcons } from '@expo/vector-icons';

interface ToolWithServer {
  serverId: string;
  serverName: string;
  tool: any;
}

export default function ToolBrowserScreen() {
  const colors = useColors();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTool, setSelectedTool] = useState<ToolWithServer | null>(null);
  const [parameters, setParameters] = useState<Record<string, string>>({});
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);

  // Fetch registered servers
  const registeredServersQuery = trpc.mcpServers.getRegisteredServers.useQuery();

  // Mutations
  const executeToolMutation = trpc.mcpServers.executeServerTool.useMutation();

  // Collect all tools from all servers
  const allTools = useMemo(() => {
    if (!registeredServersQuery.data) return [];

    const tools: ToolWithServer[] = [];
    registeredServersQuery.data.forEach((server) => {
      // Get tools for this server type
      const serverDef = trpc.mcpServers.getServerDefinition.useQuery({ type: server.type });
      if (serverDef.data) {
        // This is a simplified version - in production, you'd fetch actual tools
        const serverTools = [
          {
            name: `${server.type}_tool_1`,
            description: `Tool from ${server.name}`,
            inputSchema: { type: 'object', properties: {} },
          },
        ];

        serverTools.forEach((tool) => {
          tools.push({
            serverId: server.id,
            serverName: server.name,
            tool,
          });
        });
      }
    });

    return tools;
  }, [registeredServersQuery.data]);

  // Filter tools by search query
  const filteredTools = useMemo(() => {
    if (!searchQuery) return allTools;

    const query = searchQuery.toLowerCase();
    return allTools.filter(
      (t) =>
        t.tool.name.toLowerCase().includes(query) ||
        t.tool.description?.toLowerCase().includes(query) ||
        t.serverName.toLowerCase().includes(query)
    );
  }, [allTools, searchQuery]);

  const handleExecuteTool = async () => {
    if (!selectedTool) return;

    setIsExecuting(true);
    try {
      const result = await executeToolMutation.mutateAsync({
        serverId: selectedTool.serverId,
        toolName: selectedTool.tool.name,
        parameters,
      });

      setExecutionResult(result);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <ScreenContainer className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 gap-4 p-4">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">Tool Browser</Text>
            <Text className="text-sm text-muted">
              Discover and execute tools from connected MCP servers
            </Text>
          </View>

          {/* Search Bar */}
          <View className="bg-surface rounded-lg px-3 py-2 border border-border flex-row items-center gap-2">
            <MaterialIcons name="search" size={20} color={colors.muted} />
            <TextInput
              placeholder="Search tools..."
              placeholderTextColor={colors.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 text-foreground"
            />
          </View>

          {/* Tools List */}
          {registeredServersQuery.isLoading ? (
            <ActivityIndicator color={colors.primary} size="large" />
          ) : filteredTools.length === 0 ? (
            <View className="bg-surface rounded-lg p-6 items-center justify-center">
              <MaterialIcons name="build" size={48} color={colors.muted} />
              <Text className="text-foreground font-semibold mt-2">No Tools Found</Text>
              <Text className="text-muted text-sm text-center mt-1">
                {searchQuery
                  ? 'Try a different search query'
                  : 'Connect a server to see available tools'}
              </Text>
            </View>
          ) : (
            <View className="gap-3">
              {filteredTools.map((item, index) => (
                <Pressable
                  key={`${item.serverId}-${index}`}
                  onPress={() => {
                    setSelectedTool(selectedTool?.tool.name === item.tool.name ? null : item);
                    setParameters({});
                    setExecutionResult(null);
                  }}
                  className={cn(
                    'bg-surface rounded-lg p-4 border border-border',
                    selectedTool?.tool.name === item.tool.name && 'border-primary bg-primary/5'
                  )}
                >
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1">
                      <View className="flex-row items-center gap-2 mb-1">
                        <View className="bg-primary/20 rounded-full px-2 py-1">
                          <Text className="text-xs font-semibold text-primary">
                            {item.serverName}
                          </Text>
                        </View>
                      </View>
                      <Text className="font-semibold text-foreground">{item.tool.name}</Text>
                      <Text className="text-xs text-muted mt-1">{item.tool.description}</Text>
                    </View>
                    <MaterialIcons
                      name={selectedTool?.tool.name === item.tool.name ? 'expand-less' : 'expand-more'}
                      size={20}
                      color={colors.muted}
                    />
                  </View>

                  {/* Tool Details & Execution */}
                  {selectedTool?.tool.name === item.tool.name && (
                    <View className="gap-3 mt-4 pt-4 border-t border-border">
                      {/* Parameters */}
                      {item.tool.inputSchema?.properties &&
                        Object.entries(item.tool.inputSchema.properties).map(([key, prop]: [string, any]) => (
                          <View key={key}>
                            <Text className="text-xs font-semibold text-muted mb-1">
                              {key}
                              {item.tool.inputSchema?.required?.includes(key) && (
                                <Text className="text-error">*</Text>
                              )}
                            </Text>
                            <View className="bg-background rounded-lg px-3 py-2 border border-border">
                              <TextInput
                                placeholder={prop.description || key}
                                placeholderTextColor={colors.muted}
                                value={parameters[key] || ''}
                                onChangeText={(value) =>
                                  setParameters({ ...parameters, [key]: value })
                                }
                                className="text-foreground"
                              />
                            </View>
                          </View>
                        ))}

                      {/* Execute Button */}
                      <Pressable
                        onPress={handleExecuteTool}
                        disabled={isExecuting}
                        className={cn(
                          'py-3 px-4 rounded-lg items-center justify-center',
                          isExecuting ? 'bg-primary/50' : 'bg-primary'
                        )}
                      >
                        {isExecuting ? (
                          <ActivityIndicator color={colors.background} size="small" />
                        ) : (
                          <Text className="font-semibold text-background">Execute Tool</Text>
                        )}
                      </Pressable>

                      {/* Execution Result */}
                      {executionResult && (
                        <View className="bg-background rounded-lg p-3 border border-border">
                          <Text className="text-xs font-semibold text-muted mb-2">
                            {executionResult.success ? 'Result' : 'Error'}
                          </Text>
                          <Text
                            className={cn(
                              'text-xs font-mono',
                              executionResult.success ? 'text-success' : 'text-error'
                            )}
                          >
                            {executionResult.success
                              ? JSON.stringify(executionResult.data, null, 2)
                              : executionResult.error}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

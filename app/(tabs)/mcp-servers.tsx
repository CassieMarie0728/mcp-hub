import { ScrollView, View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';
import { trpc } from '@/lib/trpc';
import { MaterialIcons } from '@expo/vector-icons';

export default function MCPServersScreen() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<'available' | 'registered'>('available');
  const [selectedServer, setSelectedServer] = useState<string | null>(null);
  const [token, setToken] = useState('');
  const [customName, setCustomName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  // Fetch available servers
  const availableServersQuery = trpc.mcpServers.getAvailableServers.useQuery();
  const registeredServersQuery = trpc.mcpServers.getRegisteredServers.useQuery();

  // Mutations
  const validateTokenMutation = trpc.mcpServers.validateToken.useMutation();
  const registerServerMutation = trpc.mcpServers.registerRealServer.useMutation();
  const discoverToolsMutation = trpc.mcpServers.discoverServerTools.useMutation();
  const testConnectionMutation = trpc.mcpServers.testServerConnection.useMutation();
  const unregisterServerMutation = trpc.mcpServers.unregisterServer.useMutation();

  const handleValidateToken = async () => {
    if (!selectedServer || !token) return;

    const result = await validateTokenMutation.mutateAsync({
      type: selectedServer,
      token,
    });

    if (result.valid) {
      handleRegisterServer();
    }
  };

  const handleRegisterServer = async () => {
    if (!selectedServer || !token) return;

    setIsRegistering(true);
    try {
      const result = await registerServerMutation.mutateAsync({
        type: selectedServer,
        token,
        customName: customName || undefined,
      });

      if (result.success) {
        setToken('');
        setCustomName('');
        setSelectedServer(null);
        registeredServersQuery.refetch();
      }
    } finally {
      setIsRegistering(false);
    }
  };

  const handleDiscoverTools = async (serverId: string) => {
    const result = await discoverToolsMutation.mutateAsync({ serverId });
    if (result.success) {
      registeredServersQuery.refetch();
    }
  };

  const handleTestConnection = async (serverId: string) => {
    await testConnectionMutation.mutateAsync({ serverId });
    registeredServersQuery.refetch();
  };

  const handleUnregisterServer = async (serverId: string) => {
    await unregisterServerMutation.mutateAsync({ serverId });
    registeredServersQuery.refetch();
  };

  return (
    <ScreenContainer className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 gap-6 p-4">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">MCP Servers</Text>
            <Text className="text-sm text-muted">Connect to GitHub, Slack, Notion, and more</Text>
          </View>

          {/* Tab Navigation */}
          <View className="flex-row gap-2 bg-surface rounded-lg p-1">
            <Pressable
              onPress={() => setActiveTab('available')}
              className={cn(
                'flex-1 py-2 px-3 rounded-md items-center justify-center',
                activeTab === 'available' ? 'bg-primary' : 'bg-transparent',
              )}
            >
              <Text
                className={cn(
                  'font-semibold text-sm',
                  activeTab === 'available' ? 'text-background' : 'text-foreground',
                )}
              >
                Available
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setActiveTab('registered')}
              className={cn(
                'flex-1 py-2 px-3 rounded-md items-center justify-center',
                activeTab === 'registered' ? 'bg-primary' : 'bg-transparent',
              )}
            >
              <Text
                className={cn(
                  'font-semibold text-sm',
                  activeTab === 'registered' ? 'text-background' : 'text-foreground',
                )}
              >
                Registered ({registeredServersQuery.data?.length || 0})
              </Text>
            </Pressable>
          </View>

          {/* Available Servers Tab */}
          {activeTab === 'available' && (
            <View className="gap-4">
              {availableServersQuery.isLoading ? (
                <ActivityIndicator color={colors.primary} size="large" />
              ) : (
                availableServersQuery.data?.map((server) => (
                  <Pressable
                    key={server.id}
                    onPress={() =>
                      setSelectedServer(selectedServer === server.id ? null : server.id)
                    }
                    className={cn(
                      'bg-surface rounded-lg p-4 border border-border',
                      selectedServer === server.id && 'border-primary bg-primary/5',
                    )}
                  >
                    <View className="flex-row items-center justify-between mb-2">
                      <View className="flex-row items-center gap-3 flex-1">
                        <View className="w-10 h-10 bg-primary/20 rounded-lg items-center justify-center">
                          <MaterialIcons
                            name={server.icon as any}
                            size={24}
                            color={colors.primary}
                          />
                        </View>
                        <View className="flex-1">
                          <Text className="font-semibold text-foreground">{server.name}</Text>
                          <Text className="text-xs text-muted">{server.description}</Text>
                        </View>
                      </View>
                      <MaterialIcons
                        name={selectedServer === server.id ? 'expand-less' : 'expand-more'}
                        size={24}
                        color={colors.muted}
                      />
                    </View>

                    {/* Registration Form */}
                    {selectedServer === server.id && (
                      <View className="gap-3 mt-4 pt-4 border-t border-border">
                        <View>
                          <Text className="text-xs font-semibold text-muted mb-1">
                            Authentication Token
                          </Text>
                          <View className="bg-background rounded-lg px-3 py-2 border border-border">
                            <Text className="text-xs text-muted">
                              Paste your {server.name} API token here
                            </Text>
                            <Text
                              className="text-xs text-foreground mt-1 font-mono"
                              numberOfLines={1}
                            >
                              {token ? '••••••••' : 'Token will appear here'}
                            </Text>
                          </View>
                        </View>

                        <View>
                          <Text className="text-xs font-semibold text-muted mb-1">
                            Custom Name (Optional)
                          </Text>
                          <View className="bg-background rounded-lg px-3 py-2 border border-border">
                            <Text className="text-xs text-foreground">
                              {customName || 'My ' + server.name}
                            </Text>
                          </View>
                        </View>

                        <View className="flex-row gap-2">
                          <Pressable
                            onPress={handleValidateToken}
                            disabled={!token || isRegistering}
                            className={cn(
                              'flex-1 py-3 px-4 rounded-lg items-center justify-center',
                              token && !isRegistering ? 'bg-primary' : 'bg-primary/50',
                            )}
                          >
                            {isRegistering ? (
                              <ActivityIndicator color={colors.background} size="small" />
                            ) : (
                              <Text className="font-semibold text-background">Connect</Text>
                            )}
                          </Pressable>
                          <Pressable
                            onPress={() => {
                              setSelectedServer(null);
                              setToken('');
                              setCustomName('');
                            }}
                            className="flex-1 py-3 px-4 rounded-lg items-center justify-center bg-surface border border-border"
                          >
                            <Text className="font-semibold text-foreground">Cancel</Text>
                          </Pressable>
                        </View>
                      </View>
                    )}
                  </Pressable>
                ))
              )}
            </View>
          )}

          {/* Registered Servers Tab */}
          {activeTab === 'registered' && (
            <View className="gap-4">
              {registeredServersQuery.isLoading ? (
                <ActivityIndicator color={colors.primary} size="large" />
              ) : registeredServersQuery.data?.length === 0 ? (
                <View className="bg-surface rounded-lg p-6 items-center justify-center">
                  <MaterialIcons name="cloud-off" size={48} color={colors.muted} />
                  <Text className="text-foreground font-semibold mt-2">No Servers Connected</Text>
                  <Text className="text-muted text-sm text-center mt-1">
                    Register a server from the Available tab to get started
                  </Text>
                </View>
              ) : (
                registeredServersQuery.data?.map((server) => (
                  <View key={server.id} className="bg-surface rounded-lg p-4 border border-border">
                    <View className="flex-row items-center justify-between mb-3">
                      <View className="flex-row items-center gap-3 flex-1">
                        <View
                          className={cn(
                            'w-3 h-3 rounded-full',
                            server.status === 'connected' ? 'bg-success' : 'bg-warning',
                          )}
                        />
                        <View className="flex-1">
                          <Text className="font-semibold text-foreground">{server.name}</Text>
                          <Text className="text-xs text-muted capitalize">{server.status}</Text>
                        </View>
                      </View>
                      <View className="flex-row gap-2">
                        <Pressable onPress={() => handleTestConnection(server.id)} className="p-2">
                          <MaterialIcons name="refresh" size={20} color={colors.primary} />
                        </Pressable>
                        <Pressable
                          onPress={() => handleUnregisterServer(server.id)}
                          className="p-2"
                        >
                          <MaterialIcons name="close" size={20} color={colors.error} />
                        </Pressable>
                      </View>
                    </View>

                    {/* Server Stats */}
                    <View className="flex-row gap-4 mb-3">
                      <View className="flex-1 bg-background rounded-lg p-2">
                        <Text className="text-xs text-muted">Tools</Text>
                        <Text className="text-lg font-bold text-foreground">
                          {server.toolCount}
                        </Text>
                      </View>
                      <View className="flex-1 bg-background rounded-lg p-2">
                        <Text className="text-xs text-muted">Status</Text>
                        <Text className="text-lg font-bold text-foreground capitalize">
                          {server.status}
                        </Text>
                      </View>
                    </View>

                    {/* Actions */}
                    <Pressable
                      onPress={() => handleDiscoverTools(server.id)}
                      className="bg-primary/10 rounded-lg py-2 px-3 items-center justify-center"
                    >
                      <Text className="text-sm font-semibold text-primary">Discover Tools</Text>
                    </Pressable>
                  </View>
                ))
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

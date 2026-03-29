import { ScrollView, Text, View, TouchableOpacity, RefreshControl } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useApp } from '@/lib/app-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useColors } from '@/hooks/use-colors';

export default function HomeScreen() {
  const { servers, executionHistory, isLoading } = useApp();
  const router = useRouter();
  const colors = useColors();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    // TODO: Implement refresh logic to check server status
    setTimeout(() => setRefreshing(false), 1000);
  };

  const connectedCount = servers.filter((s) => s.status === 'connected').length;
  const totalTools = servers.reduce((sum, s) => sum + s.toolCount, 0);

  return (
    <ScreenContainer className="p-0">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View className="bg-primary px-6 pt-6 pb-8">
          <Text className="text-4xl font-bold text-background mb-2">MCP Hub</Text>
          <Text className="text-sm text-background opacity-90">
            Unified MCP Server Manager
          </Text>
        </View>

        {/* Quick Stats */}
        <View className="px-6 pt-6 pb-4">
          <View className="flex-row gap-3">
            <View className="flex-1 bg-surface rounded-xl p-4 border border-border">
              <Text className="text-xs text-muted mb-1">Connected</Text>
              <Text className="text-2xl font-bold text-foreground">{connectedCount}</Text>
              <Text className="text-xs text-muted mt-1">of {servers.length}</Text>
            </View>
            <View className="flex-1 bg-surface rounded-xl p-4 border border-border">
              <Text className="text-xs text-muted mb-1">Tools</Text>
              <Text className="text-2xl font-bold text-foreground">{totalTools}</Text>
              <Text className="text-xs text-muted mt-1">Available</Text>
            </View>
          </View>
        </View>

        {/* Servers Section */}
        <View className="px-6 pt-6 pb-4">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-semibold text-foreground">Connected Servers</Text>
            {servers.length > 0 && (
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/servers' as any)}
                className="flex-row items-center gap-1"
              >
                <Text className="text-sm text-primary font-medium">View All</Text>
                <MaterialIcons name="chevron-right" size={16} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>

          {servers.length === 0 ? (
            <View className="bg-surface rounded-xl p-6 border border-border items-center">
              <MaterialIcons name="cloud-off" size={40} color={colors.muted} />
              <Text className="text-foreground font-semibold mt-3 mb-1">No Servers Connected</Text>
              <Text className="text-sm text-muted text-center mb-4">
                Add your first MCP server to get started
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/add-server' as any)}
                className="bg-primary px-4 py-2 rounded-lg"
              >
                <Text className="text-background font-semibold text-sm">Add Server</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="gap-3">
              {servers.slice(0, 3).map((server) => (
                  <TouchableOpacity
                    key={server.id}
                    onPress={() => router.push(`/(tabs)/server-detail?id=${server.id}` as any)}
                    className="bg-surface rounded-xl p-4 border border-border active:opacity-70"
                  >
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1">
                      <Text className="text-foreground font-semibold mb-1">{server.name}</Text>
                      <Text className="text-xs text-muted mb-2">
                        {server.toolCount} tools • {server.connectionType}
                      </Text>
                      <View className="flex-row items-center gap-2">
                        <View
                          className={`w-2 h-2 rounded-full ${
                            server.status === 'connected' ? 'bg-success' : 'bg-error'
                          }`}
                        />
                        <Text className="text-xs text-muted capitalize">{server.status}</Text>
                      </View>
                    </View>
                    <MaterialIcons name="chevron-right" size={20} color={colors.muted} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Recent Activity */}
        {executionHistory.length > 0 && (
          <View className="px-6 pb-6">
            <Text className="text-lg font-semibold text-foreground mb-4">Recent Activity</Text>
            <View className="gap-2">
              {executionHistory.slice(0, 3).map((result, idx) => (
                <View key={idx} className="bg-surface rounded-lg p-3 border border-border">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <Text className="text-sm font-medium text-foreground">{result.toolName}</Text>
                      <Text className="text-xs text-muted mt-1">
                        {new Date(result.executedAt).toLocaleTimeString()}
                      </Text>
                    </View>
                    <View
                      className={`px-2 py-1 rounded ${
                        result.isError ? 'bg-error/20' : 'bg-success/20'
                      }`}
                    >
                      <Text className={`text-xs font-medium ${result.isError ? 'text-error' : 'text-success'}`}>
                        {result.isError ? 'Error' : 'Success'}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Empty State Message */}
        {servers.length === 0 && executionHistory.length === 0 && (
          <View className="flex-1 items-center justify-center px-6 pb-12">
            <MaterialIcons name="info" size={48} color={colors.muted} />
            <Text className="text-foreground font-semibold mt-4 mb-2">Welcome to MCP Hub</Text>
            <Text className="text-sm text-muted text-center">
              Connect your MCP servers to explore and execute tools directly from your mobile device.
            </Text>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

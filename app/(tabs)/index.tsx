import { ScrollView, View, RefreshControl } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useApp } from '@/lib/app-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/use-colors';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ListItem } from '@/components/ui/list';
import { Badge } from '@/components/ui/list';
import { Text } from 'react-native';

export default function HomeScreen() {
  const { servers, executionHistory, isLoading } = useApp();
  const router = useRouter();
  const colors = useColors();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
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
        {/* Hero Header */}
        <View className="bg-gradient-to-b from-primary to-primary/80 px-6 pt-8 pb-12">
          <Text className="text-5xl font-bold text-background mb-2">MCP Hub</Text>
          <Text className="text-base text-background/90 font-medium">
            Unified MCP Server Manager
          </Text>
          <Text className="text-sm text-background/70 mt-2">
            Connect, manage, and execute tools across all your MCP servers
          </Text>
        </View>

        {/* Quick Stats Cards */}
        <View className="px-6 -mt-6 mb-8 gap-3">
          <View className="flex-row gap-3">
            <Card variant="elevated" className="flex-1">
              <View className="items-center gap-2">
                <View className="w-12 h-12 rounded-lg bg-primary/10 items-center justify-center">
                  <Ionicons name="server" size={24} color={colors.primary} />
                </View>
                <Text className="text-xs text-muted font-semibold">Connected</Text>
                <Text className="text-3xl font-bold text-foreground">{connectedCount}</Text>
                <Text className="text-xs text-muted">of {servers.length}</Text>
              </View>
            </Card>

            <Card variant="elevated" className="flex-1">
              <View className="items-center gap-2">
                <View className="w-12 h-12 rounded-lg bg-success/10 items-center justify-center">
                  <Ionicons name="hammer" size={24} color={colors.success} />
                </View>
                <Text className="text-xs text-muted font-semibold">Tools</Text>
                <Text className="text-3xl font-bold text-foreground">{totalTools}</Text>
                <Text className="text-xs text-muted">Available</Text>
              </View>
            </Card>
          </View>
        </View>

        {/* Connected Servers Section */}
        <View className="px-6 mb-8">
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-2xl font-bold text-foreground">Connected Servers</Text>
              <Text className="text-sm text-muted mt-1">Manage your MCP connections</Text>
            </View>
            {servers.length > 0 && (
              <Button
                variant="ghost"
                size="small"
                onPress={() => router.push('/(tabs)/servers' as any)}
              >
                View All
              </Button>
            )}
          </View>

          {servers.length === 0 ? (
            <Card variant="outlined" className="items-center py-8">
              <Ionicons name="cloud-offline" size={48} color={colors.muted} />
              <Text className="text-lg font-bold text-foreground mt-4 mb-2">No Servers Yet</Text>
              <Text className="text-sm text-muted text-center mb-6 px-4">
                Add your first MCP server to unlock the power of unified tool management
              </Text>
              <Button variant="primary" onPress={() => router.push('/(tabs)/add-server' as any)}>
                Add Your First Server
              </Button>
            </Card>
          ) : (
            <View className="gap-3">
              {servers.slice(0, 3).map((server) => (
                <Card
                  key={server.id}
                  variant="elevated"
                  interactive
                  onPress={() => router.push(`/(tabs)/server-detail?id=${server.id}` as any)}
                >
                  <View className="flex-row items-start justify-between gap-3">
                    <View className="flex-1 gap-2">
                      <View className="flex-row items-center gap-2">
                        <Text className="text-lg font-bold text-foreground flex-1">
                          {server.name}
                        </Text>
                        <Badge
                          variant="status"
                          color={server.status === 'connected' ? 'success' : 'error'}
                        >
                          {server.status === 'connected' ? 'Connected' : 'Disconnected'}
                        </Badge>
                      </View>

                      <View className="flex-row items-center gap-4">
                        <View className="flex-row items-center gap-1">
                          <Ionicons name="hammer" size={14} color={colors.muted} />
                          <Text className="text-xs text-muted">{server.toolCount} tools</Text>
                        </View>
                        <View className="flex-row items-center gap-1">
                          <Ionicons name="link" size={14} color={colors.muted} />
                          <Text className="text-xs text-muted capitalize">
                            {server.connectionType}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <Ionicons name="chevron-forward" size={20} color={colors.muted} />
                  </View>
                </Card>
              ))}

              {servers.length > 3 && (
                <Button variant="secondary" onPress={() => router.push('/(tabs)/servers' as any)}>
                  View All {servers.length} Servers
                </Button>
              )}
            </View>
          )}
        </View>

        {/* Recent Activity Section */}
        {executionHistory.length > 0 && (
          <View className="px-6 mb-8">
            <View className="mb-4">
              <Text className="text-2xl font-bold text-foreground">Recent Activity</Text>
              <Text className="text-sm text-muted mt-1">Latest tool executions</Text>
            </View>

            <View className="gap-2 bg-surface rounded-lg border border-border overflow-hidden">
              {executionHistory.slice(0, 5).map((result, idx) => (
                <View
                  key={idx}
                  className={`flex-row items-center justify-between px-4 py-3 ${
                    idx < executionHistory.length - 1 ? 'border-b border-border' : ''
                  }`}
                >
                  <View className="flex-1 gap-1">
                    <Text className="text-sm font-semibold text-foreground">{result.toolName}</Text>
                    <Text className="text-xs text-muted">
                      {new Date(result.executedAt).toLocaleTimeString()}
                    </Text>
                  </View>

                  <Badge variant="status" color={result.isError ? 'error' : 'success'}>
                    {result.isError ? 'Error' : 'Success'}
                  </Badge>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Empty State */}
        {servers.length === 0 && executionHistory.length === 0 && (
          <View className="flex-1 items-center justify-center px-6 py-12">
            <View className="w-20 h-20 rounded-full bg-primary/10 items-center justify-center mb-6">
              <Ionicons name="rocket" size={40} color={colors.primary} />
            </View>
            <Text className="text-2xl font-bold text-foreground mb-2 text-center">
              Ready to Get Started?
            </Text>
            <Text className="text-base text-muted text-center mb-8">
              Connect your MCP servers to explore and execute tools directly from your mobile
              device.
            </Text>
            <Button
              variant="primary"
              size="large"
              onPress={() => router.push('/(tabs)/add-server' as any)}
            >
              Add Your First Server
            </Button>
          </View>
        )}

        {/* Quick Actions Footer */}
        <View className="px-6 py-8 gap-3 flex-row">
          <Button
            variant="secondary"
            className="flex-1"
            onPress={() => router.push('/(tabs)/settings' as any)}
          >
            Settings
          </Button>
          <Button
            variant="secondary"
            className="flex-1"
            onPress={() => router.push('/(tabs)/chat' as any)}
          >
            Chat
          </Button>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

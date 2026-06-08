import { ScrollView, View, RefreshControl, Pressable } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useApp } from '@/lib/app-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useColors } from '@/hooks/use-colors';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ListItem } from '@/components/ui/list';
import { Badge } from '@/components/ui/list';
import { Text } from 'react-native';
import { AIChatModal } from '@/components/ai-chat-modal';
import { AIAssistantButton } from '@/components/ai-assistant-button';
import { useAIAssistant } from '@/hooks/use-ai-assistant';

interface FeatureProps {
  icon: string;
  title: string;
  description: string;
  color: string;
}

const FeatureCard = ({ icon, title, description, color }: FeatureProps) => {
  const colors = useColors();
  return (
    <Card variant="elevated" className="mb-3">
      <View className="flex-row gap-4 items-start">
        <View className="w-14 h-14 rounded-xl items-center justify-center" style={{ backgroundColor: `${color}20` }}>
          <MaterialIcons name={icon as any} size={28} color={color} />
        </View>
        <View className="flex-1">
          <Text className="text-base font-bold text-foreground mb-1">{title}</Text>
          <Text className="text-sm text-muted leading-relaxed">{description}</Text>
        </View>
      </View>
    </Card>
  );
};

export default function HomeScreen() {
  const { servers, executionHistory, isLoading } = useApp();
  const router = useRouter();
  const colors = useColors();
  const [refreshing, setRefreshing] = useState(false);
  const { isOpen, closeAssistant } = useAIAssistant();

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const connectedCount = servers.filter((s) => s.status === 'connected').length;
  const totalTools = servers.reduce((sum, s) => sum + s.toolCount, 0);

  return (
    <>
      <ScreenContainer className="p-0">
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* Hero Header */}
          <View className="bg-gradient-to-b from-primary to-primary/80 px-6 pt-8 pb-12 flex-row items-start justify-between">
            <View className="flex-1">
              <Text className="text-5xl font-bold text-background mb-2">MCP Hub</Text>
              <Text className="text-base text-background/90 font-medium">
                Unified MCP Server Manager
              </Text>
              <Text className="text-sm text-background/70 mt-2">
                Connect, manage, and execute tools across all your MCP servers
              </Text>
            </View>
            <AIAssistantButton variant="header" />
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

          {/* Why MCP Hub? Section */}
          <View className="px-6 mb-8">
            <Text className="text-2xl font-bold text-foreground mb-4">Why MCP Hub?</Text>
            <FeatureCard
              icon="cloud-sync"
              title="Unified Control"
              description="Manage all your MCP servers from one beautiful, intuitive interface. No more juggling multiple tools."
              color={colors.primary}
            />
            <FeatureCard
              icon="flash-on"
              title="Execute Instantly"
              description="Run tools and commands with a single tap. Get results in real-time with full execution history."
              color={colors.success}
            />
            <FeatureCard
              icon="smart-toy"
              title="AI-Powered Assistant"
              description="Get intelligent suggestions and help navigating your MCP ecosystem with our built-in AI assistant."
              color="#FF9500"
            />
            <FeatureCard
              icon="security"
              title="Secure & Reliable"
              description="Enterprise-grade security with encrypted connections and secure token management."
              color="#FF3B30"
            />
            <FeatureCard
              icon="mobile-screen-share"
              title="Mobile-First Design"
              description="Manage your servers on the go. Full functionality optimized for mobile and tablet devices."
              color="#5AC8FA"
            />
            <FeatureCard
              icon="analytics"
              title="Deep Analytics"
              description="Track execution history, monitor performance, and get insights into your MCP server usage."
              color="#34C759"
            />
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
                <Button
                  variant="primary"
                  onPress={() => router.push('/(tabs)/add-server' as any)}
                >
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
                  <Button
                    variant="secondary"
                    onPress={() => router.push('/(tabs)/servers' as any)}
                  >
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
                      <Text className="text-sm font-semibold text-foreground">
                        {result.toolName}
                      </Text>
                      <Text className="text-xs text-muted">
                        {new Date(result.executedAt).toLocaleTimeString()}
                      </Text>
                    </View>

                    <Badge
                      variant="status"
                      color={result.isError ? 'error' : 'success'}
                    >
                      {result.isError ? 'Error' : 'Success'}
                    </Badge>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Getting Started Guide */}
          {servers.length === 0 && (
            <View className="px-6 mb-8">
              <Text className="text-2xl font-bold text-foreground mb-4">Getting Started</Text>
              <Card variant="elevated" className="mb-3">
                <View className="flex-row gap-4 items-start">
                  <View className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center">
                    <Text className="text-base font-bold text-primary">1</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-bold text-foreground mb-1">Add a Server</Text>
                    <Text className="text-sm text-muted">
                      Connect your first MCP server using its connection details or API key.
                    </Text>
                  </View>
                </View>
              </Card>
              <Card variant="elevated" className="mb-3">
                <View className="flex-row gap-4 items-start">
                  <View className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center">
                    <Text className="text-base font-bold text-primary">2</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-bold text-foreground mb-1">Discover Tools</Text>
                    <Text className="text-sm text-muted">
                      Browse available tools and commands from your connected servers.
                    </Text>
                  </View>
                </View>
              </Card>
              <Card variant="elevated">
                <View className="flex-row gap-4 items-start">
                  <View className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center">
                    <Text className="text-base font-bold text-primary">3</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-bold text-foreground mb-1">Execute & Monitor</Text>
                    <Text className="text-sm text-muted">
                      Run tools with a tap and track execution history in real-time.
                    </Text>
                  </View>
                </View>
              </Card>
            </View>
          )}

          {/* Empty State with CTA */}
          {servers.length === 0 && executionHistory.length === 0 && (
            <View className="flex-1 items-center justify-center px-6 py-12">
              <View className="w-20 h-20 rounded-full bg-primary/10 items-center justify-center mb-6">
                <Ionicons name="rocket" size={40} color={colors.primary} />
              </View>
              <Text className="text-2xl font-bold text-foreground mb-2 text-center">
                Ready to Get Started?
              </Text>
              <Text className="text-base text-muted text-center mb-8">
                Connect your MCP servers to explore and execute tools directly from your mobile device.
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

          {/* Features Highlight Section */}
          <View className="px-6 mb-8 bg-surface rounded-lg border border-border p-6">
            <Text className="text-xl font-bold text-foreground mb-4">✨ Key Capabilities</Text>
            <View className="gap-3">
              <View className="flex-row items-center gap-3">
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                <Text className="text-sm text-foreground flex-1">Real-time server monitoring</Text>
              </View>
              <View className="flex-row items-center gap-3">
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                <Text className="text-sm text-foreground flex-1">One-tap tool execution</Text>
              </View>
              <View className="flex-row items-center gap-3">
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                <Text className="text-sm text-foreground flex-1">Detailed execution history</Text>
              </View>
              <View className="flex-row items-center gap-3">
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                <Text className="text-sm text-foreground flex-1">AI-powered assistance</Text>
              </View>
              <View className="flex-row items-center gap-3">
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                <Text className="text-sm text-foreground flex-1">Secure token management</Text>
              </View>
            </View>
          </View>

          {/* Call-to-Action Section */}
          <View className="px-6 py-8 gap-4">
            <Button
              variant="primary"
              size="large"
              onPress={() => router.push('/(tabs)/add-server' as any)}
            >
              🚀 Add Server Now
            </Button>
            <Button
              variant="secondary"
              onPress={() => router.push('/(tabs)/chat' as any)}
            >
              💬 Chat with AI Assistant
            </Button>
            <View className="flex-row gap-3">
              <Button
                variant="ghost"
                className="flex-1"
                onPress={() => router.push('/(tabs)/settings' as any)}
              >
                ⚙️ Settings
              </Button>
              <Button
                variant="ghost"
                className="flex-1"
                onPress={() => router.push('/(tabs)/servers' as any)}
              >
                📊 Servers
              </Button>
            </View>
          </View>

          {/* Footer Info */}
          <View className="px-6 py-6 border-t border-border">
            <Text className="text-xs text-muted text-center mb-2">
              🔒 Your data is encrypted and secure
            </Text>
            <Text className="text-xs text-muted text-center">
              Made for developers who demand control
            </Text>
          </View>
        </ScrollView>
        <AIChatModal visible={isOpen} onClose={closeAssistant} />
      </ScreenContainer>
    </>
  );
}

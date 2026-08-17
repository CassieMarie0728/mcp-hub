import { ScrollView, View, RefreshControl , Text } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useApp } from '@/lib/app-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useColors } from '@/hooks/use-colors';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/list';
import { AIChatModal } from '@/components/ai-chat-modal';
import { AIAssistantButton } from '@/components/ai-assistant-button';
import { useAIAssistant } from '@/hooks/use-ai-assistant';

interface FeatureProps {
  icon: string;
  title: string;
  description: string;
  color: string;
}

const FeatureCard = ({ icon, title, description, color }: FeatureProps) => (
  <Card variant="elevated" className="mb-3 border border-border">
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

export default function HomeScreen() {
  const { servers, executionHistory } = useApp();
  const router = useRouter();
  const colors = useColors();
  const [refreshing, setRefreshing] = useState(false);
  const { isOpen, openAssistant, closeAssistant } = useAIAssistant();

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
          <View className="bg-primary px-6 pt-8 pb-12 flex-row items-start justify-between">
            <View className="flex-1 pr-4">
              <Text className="text-xs text-background/80 font-bold tracking-widest mb-2">
                CONTROL ROOM, NOT CLOWN CAR
              </Text>
              <Text className="text-5xl font-bold text-background mb-2">MCP Hub</Text>
              <Text className="text-base text-background/95 font-semibold leading-relaxed">
                One command bunker for your MCP servers, tools, automations, and the weird little gremlins that keep them alive.
              </Text>
              <Text className="text-sm text-background/75 mt-3 leading-relaxed">
                Connect the servers. Run the tools. Watch the fallout. Fix the mess before it grows teeth.
              </Text>
            </View>
            <AIAssistantButton variant="header" />
          </View>

          <View className="px-6 -mt-6 mb-8 gap-3">
            <View className="flex-row gap-3">
              <Card variant="elevated" className="flex-1 border border-border">
                <View className="items-center gap-2">
                  <View className="w-12 h-12 rounded-lg bg-primary/10 items-center justify-center">
                    <Ionicons name="server" size={24} color={colors.primary} />
                  </View>
                  <Text className="text-xs text-muted font-semibold">Live Wires</Text>
                  <Text className="text-3xl font-bold text-foreground">{connectedCount}</Text>
                  <Text className="text-xs text-muted">of {servers.length} connected</Text>
                </View>
              </Card>

              <Card variant="elevated" className="flex-1 border border-border">
                <View className="items-center gap-2">
                  <View className="w-12 h-12 rounded-lg bg-success/10 items-center justify-center">
                    <Ionicons name="hammer" size={24} color={colors.success} />
                  </View>
                  <Text className="text-xs text-muted font-semibold">Tools Loaded</Text>
                  <Text className="text-3xl font-bold text-foreground">{totalTools}</Text>
                  <Text className="text-xs text-muted">ready to swing</Text>
                </View>
              </Card>
            </View>
          </View>

          <View className="px-6 mb-8">
            <Text className="text-2xl font-bold text-foreground mb-2">What this beast is for</Text>
            <Text className="text-sm text-muted mb-4 leading-relaxed">
              MCP Hub is the place you go when your tools are scattered across ten tabs, three dashboards, and one panic spiral. It pulls the mess into one mobile-first command center.
            </Text>
            <FeatureCard
              icon="cloud-sync"
              title="One place for the chaos"
              description="Track your MCP servers without playing dashboard whack-a-mole. If it is connected, it belongs on the board."
              color={colors.primary}
            />
            <FeatureCard
              icon="flash-on"
              title="Run the damn tool"
              description="Trigger tools fast, then keep the receipts with execution history so nobody has to guess what exploded."
              color={colors.success}
            />
            <FeatureCard
              icon="smart-toy"
              title="AI co-pilot, not corporate glitter"
              description="Ask for help, surface the right action, and cut through setup sludge without pretending the app is magic."
              color="#F59E0B"
            />
            <FeatureCard
              icon="security"
              title="Secrets stay locked down"
              description="Tokens and credentials are treated like live ammo: protected, respected, and never casually waved around."
              color="#EF4444"
            />
          </View>

          <View className="px-6 mb-8">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-1 pr-3">
                <Text className="text-2xl font-bold text-foreground">Server Rack</Text>
                <Text className="text-sm text-muted mt-1">Your connected MCP machinery</Text>
              </View>
              {servers.length > 0 && (
                <Button variant="ghost" size="small" onPress={() => router.push('/(tabs)/mcp-servers' as any)}>
                  See All
                </Button>
              )}
            </View>

            {servers.length === 0 ? (
              <Card variant="outlined" className="items-center py-8 border border-border">
                <Ionicons name="cloud-offline" size={48} color={colors.muted} />
                <Text className="text-lg font-bold text-foreground mt-4 mb-2">No servers on the board</Text>
                <Text className="text-sm text-muted text-center mb-6 px-4 leading-relaxed">
                  Hook up your first MCP server and give this thing something useful to bite.
                </Text>
                <Button variant="primary" onPress={() => router.push('/(tabs)/mcp-servers' as any)}>
                  Connect First Server
                </Button>
              </Card>
            ) : (
              <View className="gap-3">
                {servers.slice(0, 3).map((server) => (
                  <Card key={server.id} variant="elevated" interactive className="border border-border">
                    <View className="flex-row items-start justify-between gap-3">
                      <View className="flex-1 gap-2">
                        <View className="flex-row items-center gap-2">
                          <Text className="text-lg font-bold text-foreground flex-1">{server.name}</Text>
                          <Badge variant="status" color={server.status === 'connected' ? 'success' : 'error'}>
                            {server.status === 'connected' ? 'Live' : 'Dead wire'}
                          </Badge>
                        </View>
                        <View className="flex-row items-center gap-4">
                          <View className="flex-row items-center gap-1">
                            <Ionicons name="hammer" size={14} color={colors.muted} />
                            <Text className="text-xs text-muted">{server.toolCount} tools</Text>
                          </View>
                          <View className="flex-row items-center gap-1">
                            <Ionicons name="link" size={14} color={colors.muted} />
                            <Text className="text-xs text-muted capitalize">{server.connectionType}</Text>
                          </View>
                        </View>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color={colors.muted} />
                    </View>
                  </Card>
                ))}
                {servers.length > 3 && (
                  <Button variant="secondary" onPress={() => router.push('/(tabs)/mcp-servers' as any)}>
                    Show All {servers.length} Servers
                  </Button>
                )}
              </View>
            )}
          </View>

          {executionHistory.length > 0 && (
            <View className="px-6 mb-8">
              <View className="mb-4">
                <Text className="text-2xl font-bold text-foreground">Recent Fallout</Text>
                <Text className="text-sm text-muted mt-1">Latest tool runs and their receipts</Text>
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
                      <Text className="text-xs text-muted">{new Date(result.executedAt).toLocaleTimeString()}</Text>
                    </View>
                    <Badge variant="status" color={result.isError ? 'error' : 'success'}>
                      {result.isError ? 'Blew up' : 'Clean hit'}
                    </Badge>
                  </View>
                ))}
              </View>
            </View>
          )}

          {servers.length === 0 && (
            <View className="px-6 mb-8">
              <Text className="text-2xl font-bold text-foreground mb-4">First mission</Text>
              {[
                ['1', 'Connect a server', 'Add GitHub, Slack, Notion, or whatever MCP endpoint you are wrangling.'],
                ['2', 'Discover the weapons', 'Pull in the tools and commands that server can actually run.'],
                ['3', 'Execute and audit', 'Run the action, check the result, and keep the receipts.'],
              ].map(([num, title, description]) => (
                <Card key={num} variant="elevated" className="mb-3 border border-border">
                  <View className="flex-row gap-4 items-start">
                    <View className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center">
                      <Text className="text-base font-bold text-primary">{num}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-bold text-foreground mb-1">{title}</Text>
                      <Text className="text-sm text-muted leading-relaxed">{description}</Text>
                    </View>
                  </View>
                </Card>
              ))}
            </View>
          )}

          <View className="px-6 mb-8 bg-surface rounded-lg border border-border p-6">
            <Text className="text-xl font-bold text-foreground mb-4">Core kit</Text>
            {[
              'Live server status without the tab-juggling circus',
              'Tool execution from a mobile-first control room',
              'History that tells you what happened, not fairy tales',
              'AI help for setup, routing, and troubleshooting',
              'Token handling that treats secrets like secrets',
            ].map((item) => (
              <View key={item} className="flex-row items-center gap-3 mb-3">
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                <Text className="text-sm text-foreground flex-1">{item}</Text>
              </View>
            ))}
          </View>

          <View className="px-6 py-8 gap-4">
            <Button variant="primary" size="large" onPress={() => router.push('/(tabs)/mcp-servers' as any)}>
              Connect a Server
            </Button>
            <Button variant="secondary" onPress={openAssistant}>
              Ask the AI Co-Pilot
            </Button>
          </View>

          <View className="px-6 py-6 border-t border-border">
            <Text className="text-xs text-muted text-center mb-2">Built for developers who want control, not confetti.</Text>
            <Text className="text-xs text-muted text-center">MCP Hub keeps the tools close and the bullshit on a leash.</Text>
          </View>
        </ScrollView>
        <AIChatModal visible={isOpen} onClose={closeAssistant} />
      </ScreenContainer>
    </>
  );
}

import { ScrollView, View , Text } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useColors } from '@/hooks/use-colors';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Integration {
  id: string;
  name: string;
  category: string;
  icon: string;
  description: string;
  status: 'ready' | 'next' | 'planned';
}

const INTEGRATIONS: Integration[] = [
  { id: 'github', name: 'GitHub', category: 'Code', icon: 'code', description: 'Repositories, issues, pull requests, and workflow runs.', status: 'ready' },
  { id: 'slack', name: 'Slack', category: 'Messaging', icon: 'chat', description: 'Team updates, alerts, and workflow notifications.', status: 'next' },
  { id: 'notion', name: 'Notion', category: 'Workspace', icon: 'description', description: 'Pages, databases, notes, and project knowledge.', status: 'next' },
  { id: 'aws', name: 'AWS', category: 'Cloud', icon: 'cloud', description: 'Cloud actions and infrastructure checks once configured.', status: 'planned' },
  { id: 'docker', name: 'Docker', category: 'Containers', icon: 'inventory-2', description: 'Container workflows and deployment chores.', status: 'planned' },
  { id: 'database', name: 'Databases', category: 'Data', icon: 'storage', description: 'Query and inspect connected data sources through MCP.', status: 'planned' },
  { id: 'openai', name: 'AI Providers', category: 'AI', icon: 'auto-awesome', description: 'Model-backed tools, assistant actions, and generated workflow help.', status: 'planned' },
];

const IntegrationCard = ({ integration }: { integration: Integration }) => {
  const colors = useColors();
  const statusConfig = {
    ready: { color: colors.success, label: 'Ready' },
    next: { color: '#F59E0B', label: 'Next' },
    planned: { color: colors.muted, label: 'Planned' },
  };
  const status = statusConfig[integration.status];

  return (
    <Card variant="elevated" className="mb-3 border border-border">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-row items-start gap-3 flex-1">
          <View className="w-12 h-12 rounded-lg bg-primary/10 items-center justify-center">
            <MaterialIcons name={integration.icon as any} size={24} color={colors.primary} />
          </View>
          <View className="flex-1">
            <Text className="text-base font-bold text-foreground">{integration.name}</Text>
            <Text className="text-xs text-muted mb-1">{integration.category}</Text>
            <Text className="text-sm text-muted leading-relaxed">{integration.description}</Text>
          </View>
        </View>
        <View className="px-2 py-1 rounded-full" style={{ backgroundColor: `${status.color}20` }}>
          <Text className="text-xs font-semibold" style={{ color: status.color }}>{status.label}</Text>
        </View>
      </View>
    </Card>
  );
};

export default function IntegrationsScreen() {
  const colors = useColors();
  const readyCount = INTEGRATIONS.filter((i) => i.status === 'ready').length;
  const nextCount = INTEGRATIONS.filter((i) => i.status === 'next').length;
  const plannedCount = INTEGRATIONS.filter((i) => i.status === 'planned').length;

  return (
    <ScreenContainer className="p-0">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="bg-primary px-6 py-8">
          <Text className="text-xs text-background/70 font-bold tracking-widest mb-2">WIRES</Text>
          <Text className="text-4xl font-bold text-background mb-2">Connection Map</Text>
          <Text className="text-base text-background/90 leading-relaxed">
            A cleaner view of what can connect now, what should come next, and what belongs on the roadmap.
          </Text>
        </View>

        <View className="px-6 py-8 gap-3">
          <View className="flex-row gap-3">
            <Card variant="elevated" className="flex-1 border border-border"><View className="items-center gap-1"><Text className="text-2xl font-bold text-foreground">{readyCount}</Text><Text className="text-xs text-muted text-center">Ready</Text></View></Card>
            <Card variant="elevated" className="flex-1 border border-border"><View className="items-center gap-1"><Text className="text-2xl font-bold text-foreground">{nextCount}</Text><Text className="text-xs text-muted text-center">Next</Text></View></Card>
            <Card variant="elevated" className="flex-1 border border-border"><View className="items-center gap-1"><Text className="text-2xl font-bold text-foreground">{plannedCount}</Text><Text className="text-xs text-muted text-center">Planned</Text></View></Card>
          </View>
        </View>

        <View className="px-6 pb-8">
          <Text className="text-lg font-bold text-foreground mb-4">Connections</Text>
          {INTEGRATIONS.map((integration) => (
            <IntegrationCard key={integration.id} integration={integration} />
          ))}
        </View>

        <View className="mx-6 mb-8 p-6 bg-surface rounded-lg border border-border">
          <View className="flex-row items-start gap-3">
            <Ionicons name="git-network" size={24} color={colors.primary} />
            <View className="flex-1">
              <Text className="text-base font-bold text-foreground">Custom MCP servers</Text>
              <Text className="text-sm text-muted mt-1 leading-relaxed">
                The long-term win is simple: any well-behaved MCP server should be able to join the board without making setup miserable.
              </Text>
            </View>
          </View>
        </View>

        <View className="mx-6 mb-8 p-6 bg-primary rounded-lg">
          <Text className="text-lg font-bold text-background mb-2 text-center">Do not see your tool?</Text>
          <Text className="text-sm text-background/90 text-center mb-4">
            Add it to the roadmap or wire it in as a custom MCP server when support is ready.
          </Text>
          <Button variant="secondary" size="large" className="w-full">Add to Roadmap</Button>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

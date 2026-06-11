import { ScrollView, View, Pressable } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useColors } from '@/hooks/use-colors';
import { Text } from 'react-native';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Integration {
  id: string;
  name: string;
  category: string;
  icon: string;
  description: string;
  status: 'verified' | 'beta' | 'coming-soon';
}

const INTEGRATIONS: Integration[] = [
  {
    id: 'github',
    name: 'GitHub',
    category: 'Version Control',
    icon: 'logo-github',
    description: 'Manage repositories, workflows, and deployments',
    status: 'verified',
  },
  {
    id: 'slack',
    name: 'Slack',
    category: 'Communication',
    icon: 'logo-slack',
    description: 'Send notifications and receive alerts',
    status: 'verified',
  },
  {
    id: 'aws',
    name: 'AWS',
    category: 'Cloud',
    icon: 'cloud',
    description: 'Manage EC2, Lambda, S3, and more',
    status: 'verified',
  },
  {
    id: 'docker',
    name: 'Docker',
    category: 'Containers',
    icon: 'cube',
    description: 'Deploy and manage containerized applications',
    status: 'verified',
  },
  {
    id: 'kubernetes',
    name: 'Kubernetes',
    category: 'Orchestration',
    icon: 'layers',
    description: 'Orchestrate and manage container clusters',
    status: 'verified',
  },
  {
    id: 'datadog',
    name: 'Datadog',
    category: 'Monitoring',
    icon: 'analytics',
    description: 'Monitor infrastructure and application performance',
    status: 'verified',
  },
  {
    id: 'notion',
    name: 'Notion',
    category: 'Productivity',
    icon: 'document',
    description: 'Create and manage Notion databases',
    status: 'beta',
  },
  {
    id: 'stripe',
    name: 'Stripe',
    category: 'Payments',
    icon: 'card',
    description: 'Manage payments and billing',
    status: 'beta',
  },
  {
    id: 'postgresql',
    name: 'PostgreSQL',
    category: 'Database',
    icon: 'server',
    description: 'Query and manage PostgreSQL databases',
    status: 'coming-soon',
  },
  {
    id: 'mongodb',
    name: 'MongoDB',
    category: 'Database',
    icon: 'server',
    description: 'Query and manage MongoDB collections',
    status: 'coming-soon',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    category: 'AI/ML',
    icon: 'sparkles',
    description: 'Integrate GPT models and embeddings',
    status: 'coming-soon',
  },
  {
    id: 'twilio',
    name: 'Twilio',
    category: 'Communication',
    icon: 'call',
    description: 'Send SMS and make voice calls',
    status: 'coming-soon',
  },
];

const CATEGORIES = ['All', 'Version Control', 'Communication', 'Cloud', 'Containers', 'Database', 'AI/ML'];

const IntegrationCard = ({ integration }: { integration: Integration }) => {
  const colors = useColors();

  const statusConfig = {
    verified: { color: colors.success, label: 'Verified' },
    beta: { color: '#FF9500', label: 'Beta' },
    'coming-soon': { color: colors.muted, label: 'Coming Soon' },
  };

  const status = statusConfig[integration.status];

  return (
    <Card variant="elevated" className="mb-3">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-row items-start gap-3 flex-1">
          <View className="w-12 h-12 rounded-lg bg-primary/10 items-center justify-center">
            <MaterialIcons name={integration.icon as any} size={24} color={colors.primary} />
          </View>
          <View className="flex-1">
            <Text className="text-base font-bold text-foreground">{integration.name}</Text>
            <Text className="text-xs text-muted mb-1">{integration.category}</Text>
            <Text className="text-sm text-muted">{integration.description}</Text>
          </View>
        </View>
        <View
          className="px-2 py-1 rounded-full"
          style={{ backgroundColor: `${status.color}20` }}
        >
          <Text className="text-xs font-semibold" style={{ color: status.color }}>
            {status.label}
          </Text>
        </View>
      </View>
    </Card>
  );
};

export default function IntegrationsScreen() {
  const colors = useColors();

  const verifiedCount = INTEGRATIONS.filter((i) => i.status === 'verified').length;
  const betaCount = INTEGRATIONS.filter((i) => i.status === 'beta').length;
  const comingSoonCount = INTEGRATIONS.filter((i) => i.status === 'coming-soon').length;

  return (
    <ScreenContainer className="p-0">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {/* Header */}
        <View className="bg-gradient-to-b from-primary to-primary/80 px-6 py-8">
          <Text className="text-4xl font-bold text-background mb-2">Integrations</Text>
          <Text className="text-base text-background/90">
            Connect with your favorite tools and services
          </Text>
        </View>

        {/* Stats */}
        <View className="px-6 py-8 gap-3">
          <View className="flex-row gap-3">
            <Card variant="elevated" className="flex-1">
              <View className="items-center gap-1">
                <Text className="text-2xl font-bold text-foreground">{verifiedCount}</Text>
                <Text className="text-xs text-muted text-center">Verified</Text>
              </View>
            </Card>
            <Card variant="elevated" className="flex-1">
              <View className="items-center gap-1">
                <Text className="text-2xl font-bold text-foreground">{betaCount}</Text>
                <Text className="text-xs text-muted text-center">Beta</Text>
              </View>
            </Card>
            <Card variant="elevated" className="flex-1">
              <View className="items-center gap-1">
                <Text className="text-2xl font-bold text-foreground">{comingSoonCount}</Text>
                <Text className="text-xs text-muted text-center">Coming Soon</Text>
              </View>
            </Card>
          </View>
        </View>

        {/* Integrations List */}
        <View className="px-6 pb-8">
          <Text className="text-lg font-bold text-foreground mb-4">
            {INTEGRATIONS.length} Integrations Available
          </Text>
          {INTEGRATIONS.map((integration) => (
            <IntegrationCard key={integration.id} integration={integration} />
          ))}
        </View>

        {/* API Documentation */}
        <View className="mx-6 mb-8 p-6 bg-surface rounded-lg border border-border">
          <Text className="text-lg font-bold text-foreground mb-3">Build Custom Integrations</Text>
          <Text className="text-sm text-muted mb-4">
            Our REST API and webhooks let you build custom integrations with any service.
          </Text>
          <View className="gap-2">
            <Pressable className="flex-row items-center gap-2 py-2">
              <Ionicons name="code-slash" size={18} color={colors.primary} />
              <Text className="text-sm font-semibold text-primary">View API Documentation</Text>
            </Pressable>
            <Pressable className="flex-row items-center gap-2 py-2">
              <Ionicons name="book" size={18} color={colors.primary} />
              <Text className="text-sm font-semibold text-primary">Integration Guides</Text>
            </Pressable>
            <Pressable className="flex-row items-center gap-2 py-2">
              <Ionicons name="help-circle" size={18} color={colors.primary} />
              <Text className="text-sm font-semibold text-primary">Developer Support</Text>
            </Pressable>
          </View>
        </View>

        {/* Webhook Section */}
        <View className="mx-6 mb-8 p-6 bg-primary/10 rounded-lg border border-primary/30">
          <View className="flex-row items-start gap-3 mb-3">
            <Ionicons name="flash" size={24} color={colors.primary} />
            <View className="flex-1">
              <Text className="text-base font-bold text-foreground">Webhooks</Text>
              <Text className="text-sm text-muted mt-1">
                Receive real-time notifications when events occur in MCP Hub. Perfect for automating workflows and integrating with external systems.
              </Text>
            </View>
          </View>
          <Button variant="secondary" size="small" className="mt-3">
            Learn About Webhooks
          </Button>
        </View>

        {/* Request Integration */}
        <View className="mx-6 mb-8 p-6 bg-primary rounded-lg">
          <Text className="text-lg font-bold text-background mb-2 text-center">
            Don&apos;t See Your Tool?
          </Text>
          <Text className="text-sm text-background/90 text-center mb-4">
            Request a new integration or build your own using our API.
          </Text>
          <Button variant="secondary" size="large" className="w-full">
            Request Integration
          </Button>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

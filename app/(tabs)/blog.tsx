import { ScrollView, View, Pressable } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/use-colors';
import { Text } from 'react-native';
import { Card } from '@/components/ui/card';

interface LogItem {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  status: string;
}

const LOG_ITEMS: LogItem[] = [
  {
    id: '1',
    title: 'Connection setup notes',
    excerpt: 'Document how each server gets added, what credentials it needs, and what errors users may hit first.',
    category: 'Setup',
    status: 'Draft slot',
  },
  {
    id: '2',
    title: 'Workflow build notes',
    excerpt: 'Keep examples of useful workflows, the steps they need, and where the builder still needs guardrails.',
    category: 'Workflows',
    status: 'Draft slot',
  },
  {
    id: '3',
    title: 'Debugging field notes',
    excerpt: 'Collect common failure patterns, what they mean, and how to trace a workflow without losing the plot.',
    category: 'Debugging',
    status: 'Draft slot',
  },
  {
    id: '4',
    title: 'Roadmap receipts',
    excerpt: 'Track what is real, what is next, and what should not be promised before the product earns it.',
    category: 'Roadmap',
    status: 'Draft slot',
  },
];

const LogCard = ({ item }: { item: LogItem }) => {
  return (
    <Pressable>
      <Card variant="elevated" className="mb-4 border border-border">
        <View className="p-4">
          <View className="flex-row items-center gap-2 mb-3">
            <View className="px-2 py-1 bg-primary/10 rounded-full">
              <Text className="text-xs font-semibold text-primary">{item.category}</Text>
            </View>
            <View className="px-2 py-1 bg-surface rounded-full border border-border">
              <Text className="text-xs font-semibold text-muted">{item.status}</Text>
            </View>
          </View>
          <Text className="text-lg font-bold text-foreground mb-2">{item.title}</Text>
          <Text className="text-sm text-muted leading-relaxed">{item.excerpt}</Text>
        </View>
      </Card>
    </Pressable>
  );
};

export default function BlogScreen() {
  const colors = useColors();

  return (
    <ScreenContainer className="p-0">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="bg-primary px-6 py-8">
          <Text className="text-xs text-background/70 font-bold tracking-widest mb-2">BUILD LOGS</Text>
          <Text className="text-4xl font-bold text-background mb-2">Notes From the Control Room</Text>
          <Text className="text-base text-background/90 leading-relaxed">
            This is the future home for docs, release notes, setup guides, and practical field notes.
          </Text>
        </View>

        <View className="px-6 py-8">
          <Text className="text-lg font-bold text-foreground mb-4">Log slots</Text>
          {LOG_ITEMS.map((item) => (
            <LogCard key={item.id} item={item} />
          ))}
        </View>

        <View className="mx-6 mb-8 p-6 bg-surface rounded-lg border border-border">
          <Text className="text-lg font-bold text-foreground mb-4">Resource stack</Text>
          <View className="gap-3">
            <Pressable className="flex-row items-center gap-3 py-3 border-b border-border">
              <Ionicons name="book" size={20} color={colors.primary} />
              <View className="flex-1">
                <Text className="text-sm font-semibold text-foreground">Documentation</Text>
                <Text className="text-xs text-muted">Setup, usage, and server notes.</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.muted} />
            </Pressable>

            <Pressable className="flex-row items-center gap-3 py-3 border-b border-border">
              <Ionicons name="code-slash" size={20} color={colors.primary} />
              <View className="flex-1">
                <Text className="text-sm font-semibold text-foreground">Examples</Text>
                <Text className="text-xs text-muted">Reusable workflow patterns and sample configs.</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.muted} />
            </Pressable>

            <Pressable className="flex-row items-center gap-3 py-3">
              <Ionicons name="help-circle" size={20} color={colors.primary} />
              <View className="flex-1">
                <Text className="text-sm font-semibold text-foreground">Troubleshooting</Text>
                <Text className="text-xs text-muted">Common errors, fixes, and debug trails.</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.muted} />
            </Pressable>
          </View>
        </View>

        <View className="mx-6 mb-8 p-6 bg-primary rounded-lg">
          <Text className="text-lg font-bold text-background mb-2">No fake newsletter box.</Text>
          <Text className="text-sm text-background/90">
            Add subscriptions only when there is a real list, a real send plan, and something worth mailing.
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

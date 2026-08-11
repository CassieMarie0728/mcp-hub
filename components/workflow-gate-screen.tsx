import { Pressable, ScrollView, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';

import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';

const WORKFLOW_FOUNDATION = [
  'A durable workspace-scoped workflow model and ownership repository',
  'Authorized MCP tool resolution at every workflow step',
  'Auditable execution, scheduling, sharing, and cancellation behavior',
  'Credential-safe history, retention, and deletion controls',
];

export function WorkflowGateScreen({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  const colors = useColors();
  const router = useRouter();

  return (
    <ScreenContainer className="p-0">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="bg-primary px-6 py-8">
          <Text className="text-xs text-background/70 font-bold tracking-widest mb-2">{eyebrow}</Text>
          <Text className="text-4xl font-bold text-background mb-2">{title}</Text>
          <Text className="text-base text-background/90 leading-relaxed">{description}</Text>
        </View>

        <View className="flex-1 px-6 py-8 gap-6">
          <View className="bg-surface rounded-2xl border border-border p-6 items-center">
            <View className="w-14 h-14 rounded-full bg-warning/15 items-center justify-center mb-4">
              <MaterialIcons name="lock-clock" size={30} color={colors.warning} />
            </View>
            <Text className="text-xl font-bold text-foreground text-center mb-2">Workflow automation is deliberately paused</Text>
            <Text className="text-sm text-muted text-center leading-relaxed">
              This area no longer creates local-only workflow data, schedules background work, shares unsafely, or pretends to chain executions. The backend keeps workflow lifecycle calls fail-closed until it can enforce a durable tenant boundary.
            </Text>
          </View>

          <View className="bg-surface rounded-2xl border border-border p-5">
            <Text className="text-base font-bold text-foreground mb-4">The foundation still required</Text>
            <View className="gap-4">
              {WORKFLOW_FOUNDATION.map((requirement) => (
                <View key={requirement} className="flex-row items-start gap-3">
                  <MaterialIcons name="check-circle-outline" size={20} color={colors.primary} />
                  <Text className="flex-1 text-sm text-muted leading-relaxed">{requirement}</Text>
                </View>
              ))}
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open secure MCP server management"
            onPress={() => router.replace('/(tabs)/mcp-servers')}
            className="bg-primary rounded-xl px-5 py-4 flex-row items-center justify-center gap-2"
            style={({ pressed }) => [pressed && { opacity: 0.85 }]}
          >
            <MaterialIcons name="dns" size={20} color={colors.background} />
            <Text className="text-background font-semibold">Open MCP servers</Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

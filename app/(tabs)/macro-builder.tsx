import { ScrollView, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';

const BUILDER_REQUIREMENTS = [
  'A durable workspace-scoped workflow schema and ownership repository',
  'Validated step definitions that resolve only authorized MCP servers and tools',
  'Execution state, idempotency, retry policy, and cancellation semantics',
  'Tenant-scoped execution logs that explain every result without exposing credentials',
];

export default function MacroBuilderScreen() {
  const colors = useColors();

  return (
    <ScreenContainer className="p-0">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="bg-primary px-6 py-8">
          <Text className="text-xs text-background/70 font-bold tracking-widest mb-2">WORKFLOW BUILDER GATE</Text>
          <Text className="text-4xl font-bold text-background mb-2">The Forge Is Cooling On Purpose</Text>
          <Text className="text-base text-background/90 leading-relaxed">
            A workflow builder that creates local shapes, saves nothing durable, and pretends it can execute work is a confidence trick with nice icons. This primary screen now tells the truth.
          </Text>
        </View>

        <View className="flex-1 px-6 py-8 gap-6">
          <View className="bg-surface rounded-2xl border border-border p-6 items-center">
            <View className="w-14 h-14 rounded-full bg-warning/15 items-center justify-center mb-4">
              <MaterialIcons name="construction" size={30} color={colors.warning} />
            </View>
            <Text className="text-xl font-bold text-foreground text-center mb-2">Workflow building is safely unavailable</Text>
            <Text className="text-sm text-muted text-center leading-relaxed">
              There are no imaginary workflow records, local-only step edits, pretend saves, or fake execution outcomes here. The backend is intentionally fail-closed until it can operate workflows inside a real tenant boundary.
            </Text>
          </View>

          <View className="bg-surface rounded-2xl border border-border p-5">
            <Text className="text-base font-bold text-foreground mb-4">The non-negotiable foundation</Text>
            <View className="gap-4">
              {BUILDER_REQUIREMENTS.map((requirement) => (
                <View key={requirement} className="flex-row items-start gap-3">
                  <MaterialIcons name="check-circle-outline" size={20} color={colors.primary} />
                  <Text className="flex-1 text-sm text-muted leading-relaxed">{requirement}</Text>
                </View>
              ))}
            </View>
          </View>

          <View className="rounded-xl border border-warning/30 bg-warning/10 p-4">
            <Text className="text-sm font-semibold text-foreground mb-1">Useful work that is live now</Text>
            <Text className="text-sm text-muted leading-relaxed">
              The secure MCP path remains the server connection, tool discovery, and authorized one-off execution flow. Automation returns when it earns the same security standard.
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

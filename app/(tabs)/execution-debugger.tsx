import { ScrollView, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';

const DEBUG_REQUIREMENTS = [
  'Durable workflow execution records scoped to the active workspace',
  'Redacted step inputs and outputs with no credential material in the log',
  'Authorized replay and inspection rules for individual executions',
  'Clear retention and deletion behavior for execution history',
];

export default function ExecutionDebuggerScreen() {
  const colors = useColors();

  return (
    <ScreenContainer className="p-0">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="bg-primary px-6 py-8">
          <Text className="text-xs text-background/70 font-bold tracking-widest mb-2">EXECUTION DEBUG GATE</Text>
          <Text className="text-4xl font-bold text-background mb-2">There Is No Sample Run To Inspect</Text>
          <Text className="text-base text-background/90 leading-relaxed">
            A friendly-looking pretend execution trace is still pretend. Debugging returns only when workflow execution has real, tenant-scoped records behind it.
          </Text>
        </View>

        <View className="flex-1 px-6 py-8 gap-6">
          <View className="bg-surface rounded-2xl border border-border p-6 items-center">
            <View className="w-14 h-14 rounded-full bg-warning/15 items-center justify-center mb-4">
              <MaterialIcons name="bug-report" size={30} color={colors.warning} />
            </View>
            <Text className="text-xl font-bold text-foreground text-center mb-2">No fabricated logs</Text>
            <Text className="text-sm text-muted text-center leading-relaxed">
              This screen no longer manufactures completed steps, durations, inputs, outputs, or variables. The secure one-off MCP execution path remains available; durable workflow traces do not yet.
            </Text>
          </View>

          <View className="bg-surface rounded-2xl border border-border p-5">
            <Text className="text-base font-bold text-foreground mb-4">What the debugger requires</Text>
            <View className="gap-4">
              {DEBUG_REQUIREMENTS.map((requirement) => (
                <View key={requirement} className="flex-row items-start gap-3">
                  <MaterialIcons name="check-circle-outline" size={20} color={colors.primary} />
                  <Text className="flex-1 text-sm text-muted leading-relaxed">{requirement}</Text>
                </View>
              ))}
            </View>
          </View>

          <View className="rounded-xl border border-warning/30 bg-warning/10 p-4">
            <Text className="text-sm font-semibold text-foreground mb-1">The honest boundary</Text>
            <Text className="text-sm text-muted leading-relaxed">
              MCP Hub will not turn sample data into a confidence trick. When workflow execution is implemented, the debugger will report the real run or nothing at all.
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

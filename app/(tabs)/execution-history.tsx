import { ScrollView, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';

const HISTORY_REQUIREMENTS = [
  'Workspace-scoped queries over the secure MCP execution log',
  'Redacted request and result summaries with credential-safe retention',
  'Authorized filtering, inspection, and deletion behavior',
  'A consistent audit policy for historical execution metadata',
];

export default function ExecutionHistoryScreen() {
  const colors = useColors();

  return (
    <ScreenContainer className="p-0">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="bg-primary px-6 py-8">
          <Text className="text-xs text-background/70 font-bold tracking-widest mb-2">HISTORY GATE</Text>
          <Text className="text-4xl font-bold text-background mb-2">History Needs Real Records</Text>
          <Text className="text-base text-background/90 leading-relaxed">
            Local history is not a tenant audit trail. This route stays honest until it reads the durable secure execution log rather than a device-local shadow of old behavior.
          </Text>
        </View>

        <View className="flex-1 px-6 py-8 gap-6">
          <View className="bg-surface rounded-2xl border border-border p-6 items-center">
            <View className="w-14 h-14 rounded-full bg-warning/15 items-center justify-center mb-4">
              <MaterialIcons name="history-toggle-off" size={30} color={colors.warning} />
            </View>
            <Text className="text-xl font-bold text-foreground text-center mb-2">No local-only audit trail</Text>
            <Text className="text-sm text-muted text-center leading-relaxed">
              This page no longer offers filtering, deletion, or statistics for records that are not guaranteed to belong to the current workspace. Secure one-off execution is available; its durable history UI is still being built.
            </Text>
          </View>

          <View className="bg-surface rounded-2xl border border-border p-5">
            <Text className="text-base font-bold text-foreground mb-4">What must exist before history unlocks</Text>
            <View className="gap-4">
              {HISTORY_REQUIREMENTS.map((requirement) => (
                <View key={requirement} className="flex-row items-start gap-3">
                  <MaterialIcons name="check-circle-outline" size={20} color={colors.primary} />
                  <Text className="flex-1 text-sm text-muted leading-relaxed">{requirement}</Text>
                </View>
              ))}
            </View>
          </View>

          <View className="rounded-xl border border-warning/30 bg-warning/10 p-4">
            <Text className="text-sm font-semibold text-foreground mb-1">Trust the boundary</Text>
            <Text className="text-sm text-muted leading-relaxed">
              MCP Hub will show execution history only when it can explain whose activity it is, what was retained, and who is allowed to see or remove it.
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

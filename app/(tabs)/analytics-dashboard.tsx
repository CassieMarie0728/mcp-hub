import { ScrollView, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';

const ANALYTICS_REQUIREMENTS = [
  'Workspace-scoped aggregation of secure MCP execution logs',
  'Authorized filters that cannot cross workspace boundaries',
  'Clear time-range, retention, and deletion semantics',
  'Empty states that report no data instead of manufactured activity',
];

export default function AnalyticsDashboardScreen() {
  const colors = useColors();

  return (
    <ScreenContainer className="p-0">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="bg-primary px-6 py-8">
          <Text className="text-xs text-background/70 font-bold tracking-widest mb-2">ANALYTICS GATE</Text>
          <Text className="text-4xl font-bold text-background mb-2">Analytics Needs Real Activity</Text>
          <Text className="text-base text-background/90 leading-relaxed">
            A dashboard full of invented executions, success rates, and provider names is not observability. It is set dressing. This screen waits for tenant-scoped execution data.
          </Text>
        </View>

        <View className="flex-1 px-6 py-8 gap-6">
          <View className="bg-surface rounded-2xl border border-border p-6 items-center">
            <View className="w-14 h-14 rounded-full bg-warning/15 items-center justify-center mb-4">
              <MaterialIcons name="query-stats" size={30} color={colors.warning} />
            </View>
            <Text className="text-xl font-bold text-foreground text-center mb-2">No manufactured metrics</Text>
            <Text className="text-sm text-muted text-center leading-relaxed">
              This page no longer claims a total execution count, success rate, average duration, or top tool ranking. Those numbers return only when their source records are real and owned by the active workspace.
            </Text>
          </View>

          <View className="bg-surface rounded-2xl border border-border p-5">
            <Text className="text-base font-bold text-foreground mb-4">What analytics requires</Text>
            <View className="gap-4">
              {ANALYTICS_REQUIREMENTS.map((requirement) => (
                <View key={requirement} className="flex-row items-start gap-3">
                  <MaterialIcons name="check-circle-outline" size={20} color={colors.primary} />
                  <Text className="flex-1 text-sm text-muted leading-relaxed">{requirement}</Text>
                </View>
              ))}
            </View>
          </View>

          <View className="rounded-xl border border-warning/30 bg-warning/10 p-4">
            <Text className="text-sm font-semibold text-foreground mb-1">The honest empty state</Text>
            <Text className="text-sm text-muted leading-relaxed">
              Until the secure execution log has a read path for this screen, MCP Hub will show no metrics rather than fake confidence dressed up as a chart.
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

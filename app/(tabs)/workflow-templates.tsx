import { ScrollView, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';

const WORKFLOW_REQUIREMENTS = [
  'Workspace-scoped workflow definitions and ownership checks',
  'Durable steps, schedules, execution states, and retry semantics',
  'Tenant-safe tool resolution at execution time',
  'Audit records that make failed or destructive runs explainable',
];

export default function WorkflowTemplatesScreen() {
  const colors = useColors();

  return (
    <ScreenContainer className="p-0">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="bg-primary px-6 py-8">
          <Text className="text-xs text-background/70 font-bold tracking-widest mb-2">WORKFLOW GATE</Text>
          <Text className="text-4xl font-bold text-background mb-2">Templates Are Parked On Purpose</Text>
          <Text className="text-base text-background/90 leading-relaxed">
            A workflow template is a promise to run real work. Until that promise has durable tenant boundaries and execution records behind it, this page does not get to cosplay as a marketplace.
          </Text>
        </View>

        <View className="flex-1 px-6 py-8 gap-6">
          <View className="bg-surface rounded-2xl border border-border p-6 items-center">
            <View className="w-14 h-14 rounded-full bg-warning/15 items-center justify-center mb-4">
              <MaterialIcons name="playlist-add-check" size={30} color={colors.warning} />
            </View>
            <Text className="text-xl font-bold text-foreground text-center mb-2">No fake templates. No pretend clones.</Text>
            <Text className="text-sm text-muted text-center leading-relaxed">
              Workflow storage and orchestration are deliberately fail-closed. When this launches, templates will come with their real ownership, execution, and audit behavior—not placeholder ratings and a button that lies for sport.
            </Text>
          </View>

          <View className="bg-surface rounded-2xl border border-border p-5">
            <Text className="text-base font-bold text-foreground mb-4">The foundation still required</Text>
            <View className="gap-4">
              {WORKFLOW_REQUIREMENTS.map((requirement) => (
                <View key={requirement} className="flex-row items-start gap-3">
                  <MaterialIcons name="check-circle-outline" size={20} color={colors.primary} />
                  <Text className="flex-1 text-sm text-muted leading-relaxed">{requirement}</Text>
                </View>
              ))}
            </View>
          </View>

          <View className="rounded-xl border border-warning/30 bg-warning/10 p-4">
            <Text className="text-sm font-semibold text-foreground mb-1">What you can trust right now</Text>
            <Text className="text-sm text-muted leading-relaxed">
              You can connect approved MCP servers, test them, inspect their tools, and execute through the tenant-scoped runtime. Workflow automation stays locked until it can meet the same bar.
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

import { ScrollView, Text, View, Pressable, TextInput } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useState } from "react";

export default function ScheduleWorkflowScreen() {
  const colors = useColors();
  const [schedules] = useState([
    {
      id: "1",
      workflow: "Morning repo check",
      cron: "0 9 * * 1-5",
      nextRun: "Weekdays at 9:00 AM",
      status: "example",
    },
    {
      id: "2",
      workflow: "End-of-day summary",
      cron: "0 17 * * *",
      nextRun: "Daily at 5:00 PM",
      status: "example",
    },
  ]);
  const [cronExpression, setCronExpression] = useState("");

  const cronExamples = [
    { label: "Every hour", value: "0 * * * *" },
    { label: "Daily at 9 AM", value: "0 9 * * *" },
    { label: "Weekdays at 9 AM", value: "0 9 * * 1-5" },
    { label: "Every Monday", value: "0 0 * * 1" },
  ];

  return (
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 gap-6">
          <View className="gap-2 bg-primary rounded-2xl p-5">
            <Text className="text-xs font-bold tracking-widest text-background/70">SCHEDULES</Text>
            <Text className="text-3xl font-bold text-background">Put repeat work on rails</Text>
            <Text className="text-sm text-background/80 leading-relaxed">
              Build recurring workflow runs with clear timing, readable examples, and no mystery automation.
            </Text>
          </View>

          <View className="gap-3 bg-surface rounded-2xl p-4 border border-border">
            <Text className="text-sm font-semibold text-foreground">Cron expression</Text>
            <TextInput
              placeholder="0 9 * * 1-5"
              value={cronExpression}
              onChangeText={setCronExpression}
              className="bg-background text-foreground p-3 rounded-lg font-mono border border-border"
              placeholderTextColor={colors.muted}
            />
            <Text className="text-xs text-muted">Format: minute hour day month day-of-week</Text>
          </View>

          <View className="gap-3">
            <Text className="text-sm font-semibold text-foreground">Quick timing examples</Text>
            {cronExamples.map((example) => (
              <Pressable
                key={example.value}
                onPress={() => setCronExpression(example.value)}
                className="bg-surface rounded-xl p-3 flex-row items-center justify-between border border-border"
              >
                <Text className="text-sm text-foreground">{example.label}</Text>
                <Text className="text-xs text-muted font-mono">{example.value}</Text>
              </Pressable>
            ))}
          </View>

          <View className="gap-3">
            <Text className="text-sm font-semibold text-foreground">Example schedules</Text>
            {schedules.map((schedule) => (
              <View key={schedule.id} className="bg-surface rounded-xl p-4 gap-2 border border-border">
                <View className="flex-row items-center justify-between">
                  <Text className="font-semibold text-foreground">{schedule.workflow}</Text>
                  <View className="bg-primary/10 px-2 py-1 rounded">
                    <Text className="text-xs font-semibold text-primary">Example</Text>
                  </View>
                </View>
                <Text className="text-xs text-muted font-mono">{schedule.cron}</Text>
                <Text className="text-xs text-muted">Runs: {schedule.nextRun}</Text>
              </View>
            ))}
          </View>

          <Pressable style={{ backgroundColor: colors.primary }} className="py-4 rounded-full items-center mt-4">
            <Text className="text-background font-semibold text-lg">Create Schedule</Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

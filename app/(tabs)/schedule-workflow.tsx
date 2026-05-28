import { ScrollView, Text, View, Pressable, TextInput } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useState } from "react";

export default function ScheduleWorkflowScreen() {
  const colors = useColors();
  const [schedules, setSchedules] = useState([
    {
      id: "1",
      workflow: "GitHub → Slack",
      cron: "0 9 * * 1-5",
      nextRun: "Monday 9:00 AM",
      status: "active",
    },
    {
      id: "2",
      workflow: "Slack → Notion",
      cron: "0 17 * * *",
      nextRun: "Daily 5:00 PM",
      status: "active",
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
          {/* Header */}
          <View className="gap-2">
            <Text className="text-2xl font-bold text-foreground">
              Schedule Workflows
            </Text>
            <Text className="text-sm text-muted">
              Set up recurring automation
            </Text>
          </View>

          {/* Cron Expression Input */}
          <View className="gap-3 bg-surface rounded-2xl p-4">
            <Text className="text-sm font-semibold text-foreground">
              Cron Expression
            </Text>
            <TextInput
              placeholder="0 9 * * 1-5"
              value={cronExpression}
              onChangeText={setCronExpression}
              className="bg-background text-foreground p-3 rounded-lg font-mono"
              placeholderTextColor={colors.muted}
            />
            <Text className="text-xs text-muted">
              Format: minute hour day month day-of-week
            </Text>
          </View>

          {/* Quick Examples */}
          <View className="gap-3">
            <Text className="text-sm font-semibold text-foreground">
              Quick Examples
            </Text>
            {cronExamples.map((example) => (
              <Pressable
                key={example.value}
                onPress={() => setCronExpression(example.value)}
                className="bg-surface rounded-xl p-3 flex-row items-center justify-between"
              >
                <Text className="text-sm text-foreground">{example.label}</Text>
                <Text className="text-xs text-muted font-mono">
                  {example.value}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Active Schedules */}
          <View className="gap-3">
            <Text className="text-sm font-semibold text-foreground">
              Active Schedules
            </Text>
            {schedules.map((schedule) => (
              <View
                key={schedule.id}
                className="bg-surface rounded-xl p-4 gap-2"
              >
                <View className="flex-row items-center justify-between">
                  <Text className="font-semibold text-foreground">
                    {schedule.workflow}
                  </Text>
                  <View className="bg-success/20 px-2 py-1 rounded">
                    <Text className="text-xs font-semibold text-success">
                      Active
                    </Text>
                  </View>
                </View>
                <Text className="text-xs text-muted font-mono">
                  {schedule.cron}
                </Text>
                <Text className="text-xs text-muted">
                  Next run: {schedule.nextRun}
                </Text>
              </View>
            ))}
          </View>

          {/* Create Schedule Button */}
          <Pressable
            style={{ backgroundColor: colors.primary }}
            className="py-4 rounded-full items-center mt-4"
          >
            <Text className="text-background font-semibold text-lg">
              Create Schedule
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

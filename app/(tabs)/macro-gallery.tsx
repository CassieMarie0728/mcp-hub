import { ScrollView, Text, View, Pressable } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useState } from "react";

export default function MacroGalleryScreen() {
  const colors = useColors();
  const [macros] = useState([
    {
      id: "1",
      name: "GitHub Issue to Slack",
      description: "Auto-notify Slack when GitHub issue is created",
      category: "Integration",
      uses: 342,
    },
    {
      id: "2",
      name: "Daily Standup Report",
      description: "Collect team updates and send summary",
      category: "Team",
      uses: 156,
    },
    {
      id: "3",
      name: "Notion Database Sync",
      description: "Keep Notion database in sync with GitHub",
      category: "Sync",
      uses: 89,
    },
  ]);

  return (
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 gap-6">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-2xl font-bold text-foreground">
              Macro Gallery
            </Text>
            <Text className="text-sm text-muted">
              Popular automation templates
            </Text>
          </View>

          {/* Macros List */}
          {macros.map((macro) => (
            <Pressable
              key={macro.id}
              className="bg-surface rounded-xl p-4 gap-3"
            >
              <View className="flex-row items-start justify-between">
                <View className="flex-1">
                  <Text className="font-semibold text-foreground text-lg">
                    {macro.name}
                  </Text>
                  <Text className="text-sm text-muted mt-1">
                    {macro.description}
                  </Text>
                </View>
              </View>
              <View className="flex-row items-center justify-between">
                <View className="flex-row gap-2">
                  <View className="bg-primary/10 px-2 py-1 rounded">
                    <Text className="text-xs font-semibold text-primary">
                      {macro.category}
                    </Text>
                  </View>
                </View>
                <Text className="text-xs text-muted">{macro.uses} uses</Text>
              </View>
            </Pressable>
          ))}

          {/* View All Button */}
          <Pressable
            style={{ backgroundColor: colors.primary }}
            className="py-4 rounded-full items-center mt-4"
          >
            <Text className="text-background font-semibold text-lg">
              Browse All Templates
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

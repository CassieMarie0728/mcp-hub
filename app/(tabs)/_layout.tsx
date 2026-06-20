import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Platform } from "react-native";
import { useColors } from "@/hooks/use-colors";

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);
  const tabBarHeight = 56 + bottomPadding;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          paddingTop: 8,
          paddingBottom: bottomPadding,
          height: tabBarHeight,
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Hub", tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} /> }} />
      <Tabs.Screen name="mcp-servers" options={{ title: "Servers", tabBarIcon: ({ color }) => <IconSymbol size={28} name="paperplane.fill" color={color} /> }} />
      <Tabs.Screen name="macro-builder" options={{ title: "Builder", tabBarIcon: ({ color }) => <IconSymbol size={28} name="chevron.left.forwardslash.chevron.right" color={color} /> }} />
      <Tabs.Screen name="execution-debugger" options={{ title: "Debug", tabBarIcon: ({ color }) => <IconSymbol size={28} name="paperplane.fill" color={color} /> }} />
      <Tabs.Screen name="blog" options={{ title: "Logs", tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} /> }} />
      <Tabs.Screen name="more" options={{ title: "More", tabBarIcon: ({ color }) => <IconSymbol size={28} name="chevron.right" color={color} /> }} />
      <Tabs.Screen name="onboarding" options={{ href: null }} />
      <Tabs.Screen name="team-workspace" options={{ href: null }} />
      <Tabs.Screen name="schedule-workflow" options={{ href: null }} />
      <Tabs.Screen name="faq" options={{ href: null }} />
      <Tabs.Screen name="testimonials" options={{ href: null }} />
      <Tabs.Screen name="use-cases" options={{ href: null }} />
      <Tabs.Screen name="pricing" options={{ href: null }} />
      <Tabs.Screen name="integrations" options={{ href: null }} />
    </Tabs>
  );
}

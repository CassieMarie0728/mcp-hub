import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

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
        tabBarActiveTintColor: colors.tint,
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
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="webhooks"
        options={{
          title: "Webhooks",
          tabBarIcon: ({ color }) => <MaterialIcons size={28} name="webhook" color={color as any} />,
        }}
      />
      <Tabs.Screen
        name="token-management"
        options={{
          title: "Tokens",
          tabBarIcon: ({ color }) => <MaterialIcons size={28} name="security" color={color as any} />,
        }}
      />
      <Tabs.Screen
        name="macro-builder"
        options={{
          title: "Builder",
          tabBarIcon: ({ color }) => <MaterialIcons size={28} name="build" color={color as any} />,
        }}
      />
      <Tabs.Screen
        name="analytics-dashboard"
        options={{
          title: "Analytics",
          tabBarIcon: ({ color }) => <MaterialIcons size={28} name="bar-chart" color={color as any} />,
        }}
      />
      <Tabs.Screen
        name="workflow-templates"
        options={{
          title: "Templates",
          tabBarIcon: ({ color }) => <MaterialIcons size={28} name="dashboard" color={color as any} />,
        }}
      />
      <Tabs.Screen
        name="oauth-connect"
        options={{
          title: "OAuth",
          tabBarIcon: ({ color }) => <MaterialIcons size={28} name="login" color={color as any} />,
        }}
      />
      <Tabs.Screen
        name="tool-browser"
        options={{
          title: "Tools",
          tabBarIcon: ({ color }) => <MaterialIcons size={28} name="apps" color={color as any} />,
        }}
      />
      <Tabs.Screen
        name="mcp-servers"
        options={{
          title: "Servers",
          tabBarIcon: ({ color }) => <MaterialIcons size={28} name="dns" color={color as any} />,
        }}
      />
    </Tabs>
  );
}

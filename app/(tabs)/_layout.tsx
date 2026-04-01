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
        name="chat"
        options={{
          title: "Chat",
          tabBarIcon: ({ color }) => <MaterialIcons name="chat-bubble" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="servers"
        options={{
          title: "Servers",
          tabBarIcon: ({ color }) => <MaterialIcons name="dns" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => <MaterialIcons name="tune" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="mcp-control"
        options={{
          title: "MCP Control",
          tabBarIcon: ({ color }) => <MaterialIcons name="power-settings-new" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="server-connection"
        options={{
          title: "Connect",
          tabBarIcon: ({ color }) => <MaterialIcons name="cloud-queue" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="tool-discovery"
        options={{
          title: "Tools",
          tabBarIcon: ({ color }) => <MaterialIcons name="extension" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="tool-execution"
        options={{
          title: "Execute",
          tabBarIcon: ({ color }) => <MaterialIcons name="play-circle" size={28} color={color} />,
        }}
      />
    </Tabs>
  );
}

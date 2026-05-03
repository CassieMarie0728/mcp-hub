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
        name="token-management"
        options={{
          title: "Tokens",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="lock.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="macro-builder"
        options={{
          title: "Macros",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="gear" color={color} />,
        }}
      />
      <Tabs.Screen
        name="analytics-dashboard"
        options={{
          title: "Analytics",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="chart.bar.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="mcp-servers"
        options={{
          title: "MCP Servers",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="paperplane.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="tool-browser"
        options={{
          title: "Tools",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="chevron.right" color={color} />,
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
      <Tabs.Screen
        name="results"
        options={{
          title: "Results",
          tabBarIcon: ({ color }) => <MaterialIcons name="assessment" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="execution-history"
        options={{
          title: "History",
          tabBarIcon: ({ color }) => <MaterialIcons name="history" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="server-presets"
        options={{
          title: "Presets",
          tabBarIcon: ({ color }) => <MaterialIcons name="bookmark" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="macro-gallery"
        options={{
          title: "Macros",
          tabBarIcon: ({ color }) => <MaterialIcons name="library-books" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="macro-sharing"
        options={{
          title: "Share",
          tabBarIcon: ({ color }) => <MaterialIcons name="share" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="macro-scheduling"
        options={{
          title: "Schedule",
          tabBarIcon: ({ color }) => <MaterialIcons name="schedule" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="macro-chaining"
        options={{
          title: "Chains",
          tabBarIcon: ({ color }) => <MaterialIcons name="link" size={28} color={color} />,
        }}
      />
    </Tabs>
  );
}

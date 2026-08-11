import { Pressable, ScrollView, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';

import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';

export default function ToolDiscoveryScreen() {
  const colors = useColors();
  const router = useRouter();

  return (
    <ScreenContainer className="p-0">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="bg-primary px-6 py-8">
          <Text className="text-xs text-background/70 font-bold tracking-widest mb-2">DISCOVERY SAFETY GATE</Text>
          <Text className="text-4xl font-bold text-background mb-2">Use Server-Side Discovery</Text>
          <Text className="text-base text-background/90 leading-relaxed">
            This legacy route used a native bridge to discover tools without the workspace-scoped authorized runtime. Tool discovery now belongs to the secure server-management flow.
          </Text>
        </View>

        <View className="flex-1 px-6 py-8 gap-6">
          <View className="bg-surface rounded-2xl border border-border p-6 items-center">
            <View className="w-14 h-14 rounded-full bg-warning/15 items-center justify-center mb-4">
              <MaterialIcons name="manage-search" size={30} color={colors.warning} />
            </View>
            <Text className="text-xl font-bold text-foreground text-center mb-2">No bridge-side discovery</Text>
            <Text className="text-sm text-muted text-center leading-relaxed">
              Server testing and tool discovery run through the tenant-backed MCP server list, where ownership, encrypted credentials, and outbound policy controls are enforced.
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open secure MCP server management"
            onPress={() => router.replace('/(tabs)/mcp-servers')}
            className="bg-primary rounded-xl px-5 py-4 flex-row items-center justify-center gap-2"
            style={({ pressed }) => [pressed && { opacity: 0.85 }]}
          >
            <MaterialIcons name="dns" size={20} color={colors.background} />
            <Text className="text-background font-semibold">Open MCP servers</Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

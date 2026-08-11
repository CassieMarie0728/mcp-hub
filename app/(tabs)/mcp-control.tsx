import { Pressable, ScrollView, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';

import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';

export default function MCPControlScreen() {
  const colors = useColors();
  const router = useRouter();

  return (
    <ScreenContainer className="p-0">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="bg-primary px-6 py-8">
          <Text className="text-xs text-background/70 font-bold tracking-widest mb-2">RUNTIME SAFETY GATE</Text>
          <Text className="text-4xl font-bold text-background mb-2">Local MCP Control Is Retired</Text>
          <Text className="text-base text-background/90 leading-relaxed">
            This route used to start local servers, toggle transports, and inspect device files through a native bridge. None of that belongs in a tenant-scoped remote MCP control room.
          </Text>
        </View>

        <View className="flex-1 px-6 py-8 gap-6">
          <View className="bg-surface rounded-2xl border border-border p-6 items-center">
            <View className="w-14 h-14 rounded-full bg-warning/15 items-center justify-center mb-4">
              <MaterialIcons name="phonelink-erase" size={30} color={colors.warning} />
            </View>
            <Text className="text-xl font-bold text-foreground text-center mb-2">No device-side server controls</Text>
            <Text className="text-sm text-muted text-center leading-relaxed">
              There are no raw transport switches, local server lifecycle controls, or filesystem tool probes here. MCP Hub now routes approved server work through the authorized backend runtime.
            </Text>
          </View>

          <View className="bg-surface rounded-2xl border border-border p-5 gap-4">
            <View className="flex-row items-start gap-3">
              <MaterialIcons name="lock" size={22} color={colors.primary} />
              <Text className="flex-1 text-sm text-muted leading-relaxed">Secure server registration validates HTTPS destinations, ownership, and credentials before a connection is stored.</Text>
            </View>
            <View className="flex-row items-start gap-3">
              <MaterialIcons name="build-circle" size={22} color={colors.primary} />
              <Text className="flex-1 text-sm text-muted leading-relaxed">Tool discovery and execution are available only through the authorized MCP runtime for the current workspace.</Text>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open secure server connection workflow"
            onPress={() => router.replace('/(tabs)/server-connection')}
            className="bg-primary rounded-xl px-5 py-4 flex-row items-center justify-center gap-2"
            style={({ pressed }) => [pressed && { opacity: 0.85 }]}
          >
            <MaterialIcons name="security" size={20} color={colors.background} />
            <Text className="text-background font-semibold">Open secure connection</Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

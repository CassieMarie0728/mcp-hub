import { Pressable, ScrollView, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';

import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';

export default function EditServerScreen() {
  const colors = useColors();
  const router = useRouter();

  return (
    <ScreenContainer className="p-0">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="bg-primary px-6 py-8">
          <Text className="text-xs text-background/70 font-bold tracking-widest mb-2">CONNECTION EDITING GATE</Text>
          <Text className="text-4xl font-bold text-background mb-2">Legacy Server Editing Is Retired</Text>
          <Text className="text-base text-background/90 leading-relaxed">
            This route used device-local server state and could switch to local commands or arbitrary transports. Connection updates now need the same ownership, credential, and outbound-policy controls as registration.
          </Text>
        </View>

        <View className="flex-1 px-6 py-8 gap-6">
          <View className="bg-surface rounded-2xl border border-border p-6 items-center">
            <View className="w-14 h-14 rounded-full bg-warning/15 items-center justify-center mb-4">
              <MaterialIcons name="edit-off" size={30} color={colors.warning} />
            </View>
            <Text className="text-xl font-bold text-foreground text-center mb-2">No local configuration mutation</Text>
            <Text className="text-sm text-muted text-center leading-relaxed">
              The old screen no longer imports or exports connection files, exposes raw headers, stores local commands, or reconnects through the client bridge. A tenant-scoped edit flow will return only when it updates the secure server repository directly.
            </Text>
          </View>

          <View className="rounded-xl border border-warning/30 bg-warning/10 p-4">
            <Text className="text-sm font-semibold text-foreground mb-1">Current safe path</Text>
            <Text className="text-sm text-muted leading-relaxed">
              Use secure server management to review registered servers, test an authorized connection, and remove a server when it is no longer needed. HTTPS-only registration remains available through the secure connection workflow.
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

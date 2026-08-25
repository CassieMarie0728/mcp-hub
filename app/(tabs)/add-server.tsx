import { Pressable, ScrollView, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';

import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';

export default function AddServerScreen() {
  const colors = useColors();
  const router = useRouter();

  return (
    <ScreenContainer className="p-0">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="bg-primary px-6 py-8">
          <Text className="text-xs text-background/70 font-bold tracking-widest mb-2">CONNECTION SAFETY GATE</Text>
          <Text className="text-4xl font-bold text-background mb-2">Use the Secure Connection Flow</Text>
          <Text className="text-base text-background/90 leading-relaxed">
            This legacy route used to accept local commands and arbitrary transports outside the tenant-scoped outbound policy. That is not how MCP Hub connects servers anymore.
          </Text>
        </View>

        <View className="flex-1 px-6 py-8 gap-6">
          <View className="bg-surface rounded-2xl border border-border p-6 items-center">
            <View className="w-14 h-14 rounded-full bg-warning/15 items-center justify-center mb-4">
              <MaterialIcons name="shield" size={30} color={colors.warning} />
            </View>
            <Text className="text-xl font-bold text-foreground text-center mb-2">The old route is retired</Text>
            <Text className="text-sm text-muted text-center leading-relaxed">
              Server registration now uses a backend-backed HTTPS connection form with tenant ownership checks, encrypted credentials, endpoint validation, and SSRF-safe transport.
            </Text>
          </View>

          <View className="bg-surface rounded-2xl border border-border p-5 gap-4">
            <View className="flex-row items-start gap-3">
              <MaterialIcons name="https" size={22} color={colors.primary} />
              <Text className="flex-1 text-sm text-muted leading-relaxed">HTTPS endpoints only—no local process commands, raw WebSocket URLs, or arbitrary SSE destinations.</Text>
            </View>
            <View className="flex-row items-start gap-3">
              <MaterialIcons name="admin-panel-settings" size={22} color={colors.primary} />
              <Text className="flex-1 text-sm text-muted leading-relaxed">Every server is stored inside the current workspace and handled through the authorized MCP runtime.</Text>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open secure server connection workflow"
            onPress={() => router.replace('/(tabs)/server-connection')}
            className="bg-primary rounded-xl px-5 py-4 flex-row items-center justify-center gap-2"
            style={({ pressed }) => [pressed && { opacity: 0.85 }]}
          >
            <MaterialIcons name="add-link" size={20} color={colors.background} />
            <Text className="text-background font-semibold">Open secure connection</Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

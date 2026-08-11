import { ScrollView, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';

export default function ServerPresetsScreen() {
  const colors = useColors();

  return (
    <ScreenContainer className="p-0">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="bg-primary px-6 py-8">
          <Text className="text-xs text-background/70 font-bold tracking-widest mb-2">SERVER PRESET GATE</Text>
          <Text className="text-4xl font-bold text-background mb-2">Local Connection Presets Are Retired</Text>
          <Text className="text-base text-background/90 leading-relaxed">
            This route stored transport details on the device and offered HTTP, WebSocket, and stdio configurations. That does not meet the Hub’s HTTPS-only, tenant-authorized server registration contract.
          </Text>
        </View>

        <View className="flex-1 px-6 py-8 gap-6">
          <View className="bg-surface rounded-2xl border border-border p-6 items-center">
            <View className="w-14 h-14 rounded-full bg-warning/15 items-center justify-center mb-4">
              <MaterialIcons name="security" size={30} color={colors.warning} />
            </View>
            <Text className="text-xl font-bold text-foreground text-center mb-2">Use secure server registration</Text>
            <Text className="text-sm text-muted text-center leading-relaxed">
              Register a server through the secure connection workflow. It validates HTTPS endpoints through the backend, checks outbound policy, and stores server ownership with the active workspace.
            </Text>
          </View>

          <View className="bg-surface rounded-2xl border border-border p-5 gap-4">
            <View className="flex-row items-start gap-3">
              <MaterialIcons name="https" size={22} color={colors.primary} />
              <Text className="flex-1 text-sm text-muted leading-relaxed">Only HTTPS endpoints are eligible for connection testing and authorized MCP operations.</Text>
            </View>
            <View className="flex-row items-start gap-3">
              <MaterialIcons name="account-tree" size={22} color={colors.primary} />
              <Text className="flex-1 text-sm text-muted leading-relaxed">Reusable presets can return only after they are workspace-scoped, server-owned records that inherit the same outbound and credential protections.</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

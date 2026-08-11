import { ScrollView, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';

export default function ChatScreen() {
  const colors = useColors();

  return (
    <ScreenContainer className="p-0">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="bg-primary px-6 py-8">
          <Text className="text-xs text-background/70 font-bold tracking-widest mb-2">CHAT EXECUTION GATE</Text>
          <Text className="text-4xl font-bold text-background mb-2">Command-Parsing Chat Is Retired</Text>
          <Text className="text-base text-background/90 leading-relaxed">
            This route used chat text to select a device-local server and invoke tools through a client hook. That turns a conversational convenience into an authorization bypass.
          </Text>
        </View>

        <View className="flex-1 px-6 py-8 gap-6">
          <View className="bg-surface rounded-2xl border border-border p-6 items-center">
            <View className="w-14 h-14 rounded-full bg-warning/15 items-center justify-center mb-4">
              <MaterialIcons name="lock" size={30} color={colors.warning} />
            </View>
            <Text className="text-xl font-bold text-foreground text-center mb-2">No chat-triggered client execution</Text>
            <Text className="text-sm text-muted text-center leading-relaxed">
              The assistant remains available from the main Hub experience for guidance and planning. It will not use this legacy screen to parse commands or run tools until a tenant-authorized conversational execution design exists.
            </Text>
          </View>

          <View className="bg-surface rounded-2xl border border-border p-5 gap-4">
            <View className="flex-row items-start gap-3">
              <MaterialIcons name="verified-user" size={22} color={colors.primary} />
              <Text className="flex-1 text-sm text-muted leading-relaxed">Future chat execution must resolve an owned server, validate tool schema and parameters, and execute through the authorized MCP runtime.</Text>
            </View>
            <View className="flex-row items-start gap-3">
              <MaterialIcons name="receipt-long" size={22} color={colors.primary} />
              <Text className="flex-1 text-sm text-muted leading-relaxed">Every conversational tool run must create a workspace-scoped, credential-safe execution record before its result is shown.</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

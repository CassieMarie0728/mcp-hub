import { Pressable, ScrollView, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';

import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';

const EXECUTION_REQUIREMENTS = [
  'A tenant-scoped tool selection and parameter form',
  'Server ownership checks before every execution',
  'Schema validation and redacted result rendering',
  'Secure execution log creation and workspace-scoped history retrieval',
];

export default function ToolExecutionScreen() {
  const colors = useColors();
  const router = useRouter();

  return (
    <ScreenContainer className="p-0">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="bg-primary px-6 py-8">
          <Text className="text-xs text-background/70 font-bold tracking-widest mb-2">EXECUTION SAFETY GATE</Text>
          <Text className="text-4xl font-bold text-background mb-2">Bridge-Side Execution Is Retired</Text>
          <Text className="text-base text-background/90 leading-relaxed">
            This route previously ran tools through a native bridge with user-entered IDs and parameters. Real execution will return only through the authorized tenant runtime.
          </Text>
        </View>

        <View className="flex-1 px-6 py-8 gap-6">
          <View className="bg-surface rounded-2xl border border-border p-6 items-center">
            <View className="w-14 h-14 rounded-full bg-warning/15 items-center justify-center mb-4">
              <MaterialIcons name="play-disabled" size={30} color={colors.warning} />
            </View>
            <Text className="text-xl font-bold text-foreground text-center mb-2">No bypass execution path</Text>
            <Text className="text-sm text-muted text-center leading-relaxed">
              The backend already has an authorized MCP runtime. The remaining work is a dedicated mobile execution interface that uses it end to end instead of recreating a local bridge shortcut.
            </Text>
          </View>

          <View className="bg-surface rounded-2xl border border-border p-5">
            <Text className="text-base font-bold text-foreground mb-4">What the execution screen must enforce</Text>
            <View className="gap-4">
              {EXECUTION_REQUIREMENTS.map((requirement) => (
                <View key={requirement} className="flex-row items-start gap-3">
                  <MaterialIcons name="check-circle-outline" size={20} color={colors.primary} />
                  <Text className="flex-1 text-sm text-muted leading-relaxed">{requirement}</Text>
                </View>
              ))}
            </View>
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

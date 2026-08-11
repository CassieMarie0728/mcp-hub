import { ScrollView, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';

const TOKEN_REQUIREMENTS = [
  'Tenant-scoped provider connection ownership and authorization checks',
  'Encrypted secret envelopes with rotation, revocation, and deletion paths',
  'Provider-specific validation without sending secrets to untrusted destinations',
  'Audit history that records credential lifecycle events without storing token material',
];

export default function TokenManagementScreen() {
  const colors = useColors();

  return (
    <ScreenContainer className="p-0">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="bg-primary px-6 py-8">
          <Text className="text-xs text-background/70 font-bold tracking-widest mb-2">CREDENTIAL LIFECYCLE GATE</Text>
          <Text className="text-4xl font-bold text-background mb-2">Standalone Tokens Are Locked</Text>
          <Text className="text-base text-background/90 leading-relaxed">
            A list of fake masked tokens and a pretend Rotate button do not make credential management safe. This area stays unavailable until its tenant lifecycle has a real security model.
          </Text>
        </View>

        <View className="flex-1 px-6 py-8 gap-6">
          <View className="bg-surface rounded-2xl border border-border p-6 items-center">
            <View className="w-14 h-14 rounded-full bg-warning/15 items-center justify-center mb-4">
              <MaterialIcons name="key-off" size={30} color={colors.warning} />
            </View>
            <Text className="text-xl font-bold text-foreground text-center mb-2">No manufactured credentials</Text>
            <Text className="text-sm text-muted text-center leading-relaxed">
              There are no sample provider tokens, local registration actions, simulated rotation, or fake last-used timestamps here. The protected backend blocks this lifecycle until durable persistence is implemented.
            </Text>
          </View>

          <View className="bg-surface rounded-2xl border border-border p-5">
            <Text className="text-base font-bold text-foreground mb-4">What must exist before this unlocks</Text>
            <View className="gap-4">
              {TOKEN_REQUIREMENTS.map((requirement) => (
                <View key={requirement} className="flex-row items-start gap-3">
                  <MaterialIcons name="check-circle-outline" size={20} color={colors.primary} />
                  <Text className="flex-1 text-sm text-muted leading-relaxed">{requirement}</Text>
                </View>
              ))}
            </View>
          </View>

          <View className="rounded-xl border border-warning/30 bg-warning/10 p-4">
            <Text className="text-sm font-semibold text-foreground mb-1">What is safe today</Text>
            <Text className="text-sm text-muted leading-relaxed">
              Connect an HTTPS MCP server through the server connection flow. Connection credentials are handled by the scoped MCP connection foundation rather than a separate, unfinished provider-token surface.
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

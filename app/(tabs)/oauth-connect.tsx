import { ScrollView, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';

const OAUTH_REQUIREMENTS = [
  'Tenant-scoped provider connections and user-approved access boundaries',
  'Encrypted refresh-token storage, rotation, revocation, and deletion',
  'Verified callback handling with provider state and PKCE protections',
  'Connection audit records that explain who authorized what and when',
];

export default function OAuthConnectScreen() {
  const colors = useColors();

  return (
    <ScreenContainer className="p-0">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="bg-primary px-6 py-8">
          <Text className="text-xs text-background/70 font-bold tracking-widest mb-2">OAUTH GATE</Text>
          <Text className="text-4xl font-bold text-background mb-2">Service Connections Are Paused</Text>
          <Text className="text-base text-background/90 leading-relaxed">
            OAuth is not a decorative browser window. Until the token lifecycle is durable, scoped, encrypted, revocable, and auditable, there is no honest Connect button to press.
          </Text>
        </View>

        <View className="flex-1 px-6 py-8 gap-6">
          <View className="bg-surface rounded-2xl border border-border p-6 items-center">
            <View className="w-14 h-14 rounded-full bg-warning/15 items-center justify-center mb-4">
              <MaterialIcons name="vpn-key" size={30} color={colors.warning} />
            </View>
            <Text className="text-xl font-bold text-foreground text-center mb-2">No simulated authorizations</Text>
            <Text className="text-sm text-muted text-center leading-relaxed">
              This screen does not open placeholder provider URLs, claim a connection succeeded, or manufacture expiration dates. The backend rejects OAuth lifecycle operations until their storage model exists.
            </Text>
          </View>

          <View className="bg-surface rounded-2xl border border-border p-5">
            <Text className="text-base font-bold text-foreground mb-4">What must be built first</Text>
            <View className="gap-4">
              {OAUTH_REQUIREMENTS.map((requirement) => (
                <View key={requirement} className="flex-row items-start gap-3">
                  <MaterialIcons name="check-circle-outline" size={20} color={colors.primary} />
                  <Text className="flex-1 text-sm text-muted leading-relaxed">{requirement}</Text>
                </View>
              ))}
            </View>
          </View>

          <View className="rounded-xl border border-warning/30 bg-warning/10 p-4">
            <Text className="text-sm font-semibold text-foreground mb-1">Current safe path</Text>
            <Text className="text-sm text-muted leading-relaxed">
              Connect an approved HTTPS MCP server through the server connection workflow. Provider-account integrations will return only when they can meet the same tenant and credential security standard.
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

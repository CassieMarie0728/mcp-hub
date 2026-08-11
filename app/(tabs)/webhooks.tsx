import { ScrollView, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';

const READINESS_REQUIREMENTS = [
  'Workspace-scoped endpoint ownership and authorization',
  'Encrypted signing secrets with rotation and deletion paths',
  'Durable delivery records, retries, and audit visibility',
  'Endpoint validation that cannot be abused as an outbound request primitive',
];

export default function WebhooksScreen() {
  const colors = useColors();

  return (
    <ScreenContainer className="p-0">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="bg-primary px-6 py-8">
          <Text className="text-xs text-background/70 font-bold tracking-widest mb-2">LIFECYCLE GATE</Text>
          <Text className="text-4xl font-bold text-background mb-2">Webhooks Are Not Live Yet</Text>
          <Text className="text-base text-background/90 leading-relaxed">
            This control stays closed until MCP Hub can store, authorize, sign, deliver, retry, and audit webhook work without pretending memory is a database.
          </Text>
        </View>

        <View className="flex-1 px-6 py-8 gap-6">
          <View className="bg-surface rounded-2xl border border-border p-6 items-center">
            <View className="w-14 h-14 rounded-full bg-warning/15 items-center justify-center mb-4">
              <MaterialIcons name="lock-outline" size={30} color={colors.warning} />
            </View>
            <Text className="text-xl font-bold text-foreground text-center mb-2">Safely unavailable</Text>
            <Text className="text-sm text-muted text-center leading-relaxed">
              There are no sample endpoints, fake delivery statistics, or pretend create buttons here. The backend rejects lifecycle operations until their tenant-scoped persistence exists.
            </Text>
          </View>

          <View className="bg-surface rounded-2xl border border-border p-5">
            <Text className="text-base font-bold text-foreground mb-4">What must exist before this unlocks</Text>
            <View className="gap-4">
              {READINESS_REQUIREMENTS.map((requirement) => (
                <View key={requirement} className="flex-row items-start gap-3">
                  <MaterialIcons name="check-circle-outline" size={20} color={colors.primary} />
                  <Text className="flex-1 text-sm text-muted leading-relaxed">{requirement}</Text>
                </View>
              ))}
            </View>
          </View>

          <View className="rounded-xl border border-warning/30 bg-warning/10 p-4">
            <Text className="text-sm font-semibold text-foreground mb-1">Why the hard stop?</Text>
            <Text className="text-sm text-muted leading-relaxed">
              A webhook feature that leaks a secret, crosses a workspace boundary, or quietly loses deliveries is not a feature. It is a future incident wearing a nice button.
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

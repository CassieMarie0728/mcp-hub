import { ScrollView, View, Text } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/use-colors';
import { Card } from '@/components/ui/card';

const PLAN_AREAS = [
  {
    name: 'Personal Lab',
    description: 'For one operator connecting MCP servers, testing tools, and building practical workflows.',
    features: ['Server connection basics', 'Tool discovery', 'Execution history', 'Mobile control room'],
  },
  {
    name: 'Operator Mode',
    description: 'For heavier workflow work, stronger debugging, scheduling, and more connected systems.',
    features: ['Workflow builder upgrades', 'Scheduling', 'Debug views', 'Expanded server management'],
  },
  {
    name: 'Team Stack',
    description: 'For shared workspaces, permissions, audit views, and team-level control.',
    features: ['Team roles', 'Shared workflows', 'Audit visibility', 'Admin controls'],
  },
];

const RULES = [
  'Pricing details should stay clear and current.',
  'Plan names should describe real product value.',
  'Support, retention, and billing details belong here only when final.',
  'The product should earn the page before the page sells the product.',
];

export default function PricingScreen() {
  const colors = useColors();

  return (
    <ScreenContainer className="p-0">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="bg-primary px-6 py-8">
          <Text className="text-xs text-background/70 font-bold tracking-widest mb-2">PRICING ROADMAP</Text>
          <Text className="text-4xl font-bold text-background mb-2">Plans Need Receipts</Text>
          <Text className="text-base text-background/90 leading-relaxed">
            This page is now a clean roadmap for future plan structure. Actual pricing can be added when the product model is final.
          </Text>
        </View>

        <View className="px-6 py-8">
          <Text className="text-2xl font-bold text-foreground mb-4">Possible plan paths</Text>
          {PLAN_AREAS.map((plan) => (
            <Card key={plan.name} variant="elevated" className="mb-4 border border-border">
              <Text className="text-2xl font-bold text-foreground mb-2">{plan.name}</Text>
              <Text className="text-sm text-muted mb-5 leading-relaxed">{plan.description}</Text>
              <View className="gap-3">
                {plan.features.map((feature) => (
                  <View key={feature} className="flex-row items-center gap-3">
                    <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                    <Text className="text-sm text-foreground flex-1">{feature}</Text>
                  </View>
                ))}
              </View>
            </Card>
          ))}
        </View>

        <View className="px-6 mb-8">
          <Text className="text-2xl font-bold text-foreground mb-4">Rules for this page</Text>
          <Card variant="elevated" className="border border-border">
            <View className="gap-3">
              {RULES.map((rule) => (
                <View key={rule} className="flex-row items-start gap-3">
                  <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                  <Text className="text-sm text-muted flex-1 leading-relaxed">{rule}</Text>
                </View>
              ))}
            </View>
          </Card>
        </View>

        <View className="mx-6 mb-8 p-6 bg-primary rounded-lg">
          <Text className="text-lg font-bold text-background mb-2 text-center">Build value first.</Text>
          <Text className="text-sm text-background/90 text-center">
            When the offer is ready, this page can become the checkout doorway.
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

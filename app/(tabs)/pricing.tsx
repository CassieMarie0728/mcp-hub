import { ScrollView, View, Pressable } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/use-colors';
import { Text } from 'react-native';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface PricingTier {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  features: Array<{ name: string; included: boolean }>;
  cta: string;
  highlighted?: boolean;
}

const PRICING_TIERS: PricingTier[] = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: '/month',
    description: 'Perfect for individuals getting started',
    features: [
      { name: 'Up to 3 MCP servers', included: true },
      { name: 'Unlimited tool executions', included: true },
      { name: 'Execution history (30 days)', included: true },
      { name: 'Mobile app access', included: true },
      { name: 'Community support', included: true },
      { name: 'AI Assistant (limited)', included: true },
      { name: 'Team collaboration', included: false },
      { name: 'API access', included: false },
      { name: 'Advanced analytics', included: false },
      { name: 'Priority support', included: false },
    ],
    cta: 'Get Started Free',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$29',
    period: '/month',
    description: 'For teams and power users',
    features: [
      { name: 'Unlimited MCP servers', included: true },
      { name: 'Unlimited tool executions', included: true },
      { name: 'Execution history (90 days)', included: true },
      { name: 'Mobile app access', included: true },
      { name: 'Email support (24h)', included: true },
      { name: 'AI Assistant (unlimited)', included: true },
      { name: 'Team collaboration (up to 5)', included: true },
      { name: 'REST API access', included: true },
      { name: 'Advanced analytics', included: true },
      { name: 'Priority support', included: false },
    ],
    cta: 'Start Free Trial',
    highlighted: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    period: 'pricing',
    description: 'For large organizations',
    features: [
      { name: 'Unlimited everything', included: true },
      { name: 'Execution history (1 year+)', included: true },
      { name: 'Mobile app access', included: true },
      { name: 'Dedicated support (1h)', included: true },
      { name: 'AI Assistant (unlimited)', included: true },
      { name: 'Unlimited team members', included: true },
      { name: 'REST & GraphQL APIs', included: true },
      { name: 'Advanced analytics & reporting', included: true },
      { name: 'Webhooks & integrations', included: true },
      { name: 'Custom SLAs & compliance', included: true },
    ],
    cta: 'Contact Sales',
  },
];

interface ComparisonFeature {
  name: string;
  free: string | boolean;
  pro: string | boolean;
  enterprise: string | boolean;
}

const COMPARISON_FEATURES: ComparisonFeature[] = [
  { name: 'MCP Servers', free: '3', pro: 'Unlimited', enterprise: 'Unlimited' },
  { name: 'Tool Executions', free: 'Unlimited', pro: 'Unlimited', enterprise: 'Unlimited' },
  { name: 'Execution History', free: '30 days', pro: '90 days', enterprise: '1 year+' },
  { name: 'Team Members', free: false, pro: 'Up to 5', enterprise: 'Unlimited' },
  { name: 'API Access', free: false, pro: true, enterprise: true },
  { name: 'Webhooks', free: false, pro: false, enterprise: true },
  { name: 'Support', free: 'Community', pro: 'Email (24h)', enterprise: 'Dedicated (1h)' },
  { name: 'SLA', free: 'None', pro: '99.5%', enterprise: '99.9%' },
  { name: 'Audit Logging', free: false, pro: true, enterprise: true },
  { name: 'Custom Integrations', free: false, pro: false, enterprise: true },
];

const PricingCard = ({ tier }: { tier: PricingTier }) => {
  const colors = useColors();

  return (
    <Card
      variant={tier.highlighted ? 'elevated' : 'outlined'}
      className={`mb-4 overflow-hidden ${tier.highlighted ? 'border-primary' : ''}`}
    >
      {tier.highlighted && (
        <View className="bg-primary px-4 py-2">
          <Text className="text-xs font-bold text-background text-center">MOST POPULAR</Text>
        </View>
      )}

      <View className="p-6">
        {/* Price */}
        <Text className="text-2xl font-bold text-foreground mb-1">{tier.name}</Text>
        <View className="flex-row items-baseline gap-1 mb-2">
          <Text className="text-4xl font-bold text-foreground">{tier.price}</Text>
          <Text className="text-sm text-muted">{tier.period}</Text>
        </View>
        <Text className="text-sm text-muted mb-6">{tier.description}</Text>

        {/* CTA */}
        <Button
          variant={tier.highlighted ? 'primary' : 'secondary'}
          size="large"
          className="mb-6 w-full"
        >
          {tier.cta}
        </Button>

        {/* Features */}
        <View className="gap-3">
          {tier.features.map((feature, idx) => (
            <View key={idx} className="flex-row items-center gap-3">
              <Ionicons
                name={feature.included ? 'checkmark-circle' : 'close-circle'}
                size={18}
                color={feature.included ? colors.success : colors.muted}
              />
              <Text
                className={`text-sm ${
                  feature.included ? 'text-foreground' : 'text-muted line-through'
                }`}
              >
                {feature.name}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </Card>
  );
};

export default function PricingScreen() {
  const colors = useColors();
  const [showComparison, setShowComparison] = useState(false);

  return (
    <ScreenContainer className="p-0">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {/* Header */}
        <View className="bg-gradient-to-b from-primary to-primary/80 px-6 py-8">
          <Text className="text-4xl font-bold text-background mb-2">Simple, Transparent Pricing</Text>
          <Text className="text-base text-background/90">
            Choose the plan that fits your needs. Always flexible, never locked in.
          </Text>
        </View>

        {/* Pricing Cards */}
        <View className="px-6 py-8">
          {PRICING_TIERS.map((tier) => (
            <PricingCard key={tier.id} tier={tier} />
          ))}
        </View>

        {/* FAQ Section */}
        <View className="px-6 mb-8">
          <Text className="text-2xl font-bold text-foreground mb-4">Pricing FAQ</Text>

          <Card variant="elevated" className="mb-3">
            <View className="gap-2">
              <Text className="text-base font-bold text-foreground">Can I change plans anytime?</Text>
              <Text className="text-sm text-muted">
                Yes! Upgrade or downgrade your plan anytime. Changes take effect at the next billing cycle.
              </Text>
            </View>
          </Card>

          <Card variant="elevated" className="mb-3">
            <View className="gap-2">
              <Text className="text-base font-bold text-foreground">Is there a free trial for Pro?</Text>
              <Text className="text-sm text-muted">
                Absolutely! Get 14 days free access to all Pro features. No credit card required.
              </Text>
            </View>
          </Card>

          <Card variant="elevated" className="mb-3">
            <View className="gap-2">
              <Text className="text-base font-bold text-foreground">What happens if I exceed limits?</Text>
              <Text className="text-sm text-muted">
                We'll notify you before any overage charges. You can upgrade anytime or we'll gracefully degrade service.
              </Text>
            </View>
          </Card>

          <Card variant="elevated">
            <View className="gap-2">
              <Text className="text-base font-bold text-foreground">Do you offer annual discounts?</Text>
              <Text className="text-sm text-muted">
                Yes! Pay annually and save 20%. Contact our sales team for custom Enterprise pricing.
              </Text>
            </View>
          </Card>
        </View>

        {/* Comparison Table */}
        <View className="px-6 mb-8">
          <Pressable
            onPress={() => setShowComparison(!showComparison)}
            className="flex-row items-center justify-between mb-4 p-4 bg-surface rounded-lg border border-border"
          >
            <Text className="text-base font-bold text-foreground">Detailed Comparison</Text>
            <Ionicons
              name={showComparison ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={colors.primary}
            />
          </Pressable>

          {showComparison && (
            <View className="bg-surface rounded-lg border border-border overflow-hidden">
              {COMPARISON_FEATURES.map((feature, idx) => (
                <View
                  key={idx}
                  className={`flex-row items-center p-4 ${
                    idx < COMPARISON_FEATURES.length - 1 ? 'border-b border-border' : ''
                  }`}
                >
                  <Text className="text-sm font-semibold text-foreground w-32">{feature.name}</Text>
                  <View className="flex-1 flex-row">
                    <View className="flex-1 items-center">
                      <Text className="text-xs text-muted">
                        {typeof feature.free === 'boolean'
                          ? feature.free
                            ? '✓'
                            : '✗'
                          : feature.free}
                      </Text>
                    </View>
                    <View className="flex-1 items-center">
                      <Text className="text-xs text-muted">
                        {typeof feature.pro === 'boolean'
                          ? feature.pro
                            ? '✓'
                            : '✗'
                          : feature.pro}
                      </Text>
                    </View>
                    <View className="flex-1 items-center">
                      <Text className="text-xs text-muted">
                        {typeof feature.enterprise === 'boolean'
                          ? feature.enterprise
                            ? '✓'
                            : '✗'
                          : feature.enterprise}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Money-Back Guarantee */}
        <View className="mx-6 mb-8 p-6 bg-success/10 rounded-lg border border-success/30">
          <View className="flex-row items-start gap-3">
            <Ionicons name="shield-checkmark" size={24} color={colors.success} />
            <View className="flex-1">
              <Text className="text-base font-bold text-foreground mb-1">30-Day Money-Back Guarantee</Text>
              <Text className="text-sm text-muted">
                Not satisfied? Get a full refund within 30 days. No questions asked. We're confident you'll love MCP Hub.
              </Text>
            </View>
          </View>
        </View>

        {/* Final CTA */}
        <View className="mx-6 mb-8 p-6 bg-primary rounded-lg">
          <Text className="text-lg font-bold text-background mb-2 text-center">
            Ready to Get Started?
          </Text>
          <Text className="text-sm text-background/90 text-center mb-4">
            Join thousands of developers managing their MCP servers smarter.
          </Text>
          <Button variant="secondary" size="large" className="w-full">
            Start Free Today
          </Button>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
